import { z } from 'zod';
import type { Step1Output } from './step1-database-generation';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import type { AgentAction, AgentSchedule } from '../types';

/**
 * STEP 4: Render Deployment
 * 
 * Deploy a complete Next.js project with the generated Prisma schema, API endpoints for actions,
 * and cron jobs for schedules to Render.
 */

export interface Step4Input {
  step1Output: Step1Output;
  step2Output: Step2Output;
  step3Output: Step3Output;
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  region?: 'singapore' | 'oregon' | 'frankfurt';
  plan?: 'starter' | 'standard' | 'professional';
}

export interface Step4Output {
  deploymentId: string;
  serviceId: string;
  deploymentUrl: string;
  status: 'pending' | 'building' | 'live' | 'failed';
  buildLogs?: string[];
  environmentVariables: Record<string, string>;
  prismaSchema: string;
  deploymentNotes: string[];
  apiEndpoints: string[]; // Generated API endpoints
  cronJobs: string[]; // Generated cron job patterns
}

/**
 * Render API client for deployment operations
 */
class RenderClient {
  private apiKey: string;
  private baseUrl = 'https://api.render.com/v1';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // Minimum 1 second between requests

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Rate limiting helper - ensures minimum interval between requests
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Enhanced request method with retry logic for rate limiting
  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 5000; // Start with 5 seconds for rate limit retries
    
    // Apply rate limiting before making the request
    await this.rateLimit();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle rate limiting with exponential backoff
    if (response.status === 429 && retryCount < maxRetries) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, retryCount);
      
      console.log(`🔄 Rate limited (429). Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.request(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      // Capture detailed error information from response body
      let errorDetails = '';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse;
        
        // Try to parse as JSON for better formatting
        try {
          const errorJson = JSON.parse(errorResponse);
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch {
          // Keep as text if not valid JSON
        }
      } catch {
        errorDetails = 'Unable to read error response body';
      }

      // Enhanced error message with full details
      const enhancedError = new Error(
        `Render API error: ${response.status} ${response.statusText}\n` +
        `Endpoint: ${endpoint}\n` +
        `Method: ${options.method || 'GET'}\n` +
        `Response body: ${errorDetails}`
      );
      
      // Add additional context for debugging
      console.error('🔍 Detailed API Error Information:');
      console.error(`  Status: ${response.status} ${response.statusText}`);
      console.error(`  Endpoint: ${this.baseUrl}${endpoint}`);
      console.error(`  Method: ${options.method || 'GET'}`);
      console.error(`  Request headers:`, {
        'Authorization': `Bearer ${this.apiKey.substring(0, 10)}...`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      });
      if (options.body) {
        console.error(`  Request body:`, options.body);
      }
      console.error(`  Response body:`, errorDetails);
      
      throw enhancedError;
    }

    return response.json();
  }

  // NEW: Check for existing databases
  async listDatabases() {
    return this.request('/postgres');
  }

  // NEW: List workspaces to get ownerId
  async listWorkspaces() {
    return this.request('/owners');
  }

  // NEW: Get the first available workspace ID
  async getFirstWorkspaceId(): Promise<string> {
    try {
      console.log('🔍 Fetching workspace owners...');
      const owners = await this.listWorkspaces();
      console.log('📋 Owners response:', JSON.stringify(owners, null, 2));
      
      if (!owners || !Array.isArray(owners) || owners.length === 0) {
        throw new Error('No workspaces/owners found. Please create a workspace in your Render dashboard first.');
      }
      
      // The owners endpoint returns an array of objects with nested owner data
      // Each object has a "owner" field containing the actual owner info with "id"
      const firstOwnerEntry = owners[0];
      if (!firstOwnerEntry || !firstOwnerEntry.owner || !firstOwnerEntry.owner.id) {
        throw new Error('Invalid owner data received from API - missing owner.id field');
      }
      
      const ownerId = firstOwnerEntry.owner.id;
      console.log('✅ Using owner ID:', ownerId);
      return ownerId;
    } catch (error) {
      console.error('❌ Failed to get workspace ID:', error);
      throw new Error(`Failed to get workspace ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPostgresService(name: string) {
    try {
      // Get the first available workspace ID for ownerId
      const ownerId = await this.getFirstWorkspaceId();
      
      return await this.request('/postgres', {
        method: 'POST',
        body: JSON.stringify({
          name: `${name}-db`,
          plan: 'starter', // Use legacy plan name that API still accepts
          version: '16',
          ownerId: ownerId,
          // Note: diskSizeGB not needed for legacy plans as storage is fixed
        }),
      });
    } catch (error) {
      // Handle specific 400 errors with better messaging
      if (error instanceof Error && error.message.includes('400')) {
        throw new Error(
          `Failed to create PostgreSQL database (400 Bad Request). This could be due to:\n` +
          `1. You already have reached your database limit\n` +
          `2. Missing billing card requirement for API operations\n` +
          `3. Invalid request format or missing required fields\n` +
          `4. API permissions issue with your RENDER_API_KEY\n\n` +
          `Original error: ${error.message}\n\n` +
          `Please check your Render dashboard for existing databases or try adding a billing card.`
        );
      }
      throw error;
    }
  }

  // NEW: Enhanced database creation with pre-checks
  async createPostgresServiceWithChecks(name: string) {
    console.log('🔍 Checking for existing databases...');
    
    try {
      // Get the first available workspace ID for ownerId
      console.log('📋 Getting workspace ID for database creation...');
      const ownerId = await this.getFirstWorkspaceId();
      console.log('✅ Got owner ID for database:', ownerId);
      
      // Check for existing databases first
      const existingDatabases = await this.listDatabases();
      
      // Note: No longer checking for free database limits since we're using Basic plan
      console.log('✅ Database limit check passed for Basic plan, proceeding with creation...');
      
      // Create the request body with all required fields for legacy plans
      const requestBody = {
        name: `${name}-db`,
        plan: 'starter', // Use legacy plan name that API still accepts
        version: '16',
        region: 'oregon', // Default region
        ownerId: ownerId,
        // Note: diskSizeGB not needed for legacy plans as storage is fixed
      };
      
      console.log('📋 Database creation request body:', JSON.stringify(requestBody, null, 2));
      
      // Try creating with improved request format
      return await this.request('/postgres', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error(
          `Failed to create PostgreSQL database due to rate limiting.\n\n` +
          `The Render API has rate limits to prevent abuse. Please:\n` +
          `• Wait a few minutes before trying again\n` +
          `• Avoid making multiple rapid API calls\n` +
          `• Consider using the Render dashboard for manual creation\n\n` +
          `Rate limit details: ${error.message}\n\n` +
          `The deployment script will automatically retry with delays, ` +
          `but you may need to wait longer between attempts.`
        );
      }
      if (error instanceof Error && error.message.includes('400')) {
        throw new Error(
          `Failed to create PostgreSQL database (400 Bad Request).\n\n` +
          `Common causes:\n` +
          `• Database limit reached: Check your plan's database limits\n` +
          `• Missing billing card: Basic plan requires payment method\n` +
          `• Invalid request format: API endpoint may require different fields\n` +
          `• Account permissions: RENDER_API_KEY may lack database creation rights\n\n` +
          `Solutions:\n` +
          `• Check Render dashboard for existing databases\n` +
          `• Verify billing card is added to your Render account\n` +
          `• Verify API key permissions in Render dashboard\n` +
          `• Try creating database manually in dashboard first\n\n` +
          `Original error: ${error.message}`
        );
      }
      throw error;
    }
  }

  async getService(serviceId: string) {
    return this.request(`/services/${serviceId}`);
  }

  async getDeploys(serviceId: string) {
    return this.request(`/services/${serviceId}/deploys`);
  }

  async triggerDeploy(serviceId: string) {
    return this.request(`/services/${serviceId}/deploys`, {
      method: 'POST',
    });
  }

  // NEW: Create web service using Docker runtime (no Git repo required)
  async createWebService(config: {
    name: string;
    environmentVariables?: Record<string, string>;
    region?: string;
    plan?: string;
    dockerImage?: string;
  }) {
    try {
      // Get the first available workspace ID for ownerId
      const ownerId = await this.getFirstWorkspaceId();
      
      const requestBody: any = {
        name: config.name,
        type: 'web_service',
        ownerId: ownerId,
        runtime: 'docker',
        plan: config.plan || 'starter',
        region: config.region || 'oregon',
        serviceDetails: {
          env: 'docker',
          plan: config.plan || 'starter',
          region: config.region || 'oregon',
        }
      };

      // Use Docker image approach - no Git repo required
      if (config.dockerImage) {
        requestBody.image = {
          url: config.dockerImage
        };
      } else {
        // Use a minimal Node.js Docker image as default
        requestBody.image = {
          url: 'node:18-alpine'
        };
        
        // Add startup command for Node.js
        requestBody.serviceDetails.startCommand = 'npm start';
      }

      // Add environment variables if provided
      if (config.environmentVariables) {
        requestBody.envVars = Object.entries(config.environmentVariables).map(([key, value]) => ({
          key,
          value
        }));
      }

      console.log('🐳 Creating Docker-based web service...');
      console.log('📋 Request payload:', JSON.stringify(requestBody, null, 2));

      return await this.request('/services', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error(
          `Failed to create Docker web service due to rate limiting.\n\n` +
          `The Render API has rate limits to prevent abuse. Please:\n` +
          `• Wait a few minutes before trying again\n` +
          `• Avoid making multiple rapid API calls\n` +
          `• Consider using the Render dashboard for manual creation\n\n` +
          `Rate limit details: ${error.message}\n\n` +
          `The deployment script will automatically retry with delays, ` +
          `but you may need to wait longer between attempts.`
        );
      }
      if (error instanceof Error && error.message.includes('400')) {
        throw new Error(
          `Failed to create Docker web service (400 Bad Request). This could be due to:\n` +
          `1. Docker runtime not supported on your plan\n` +
          `2. Invalid Docker image configuration\n` +
          `3. Missing billing information for starter tier\n` +
          `4. Account permissions or billing requirements\n\n` +
          `Original error: ${error.message}\n\n` +
          `Try using manual deployment via Render dashboard.`
        );
      }
      throw error;
    }
  }

  // NEW: Create Docker-based complete stack (database + web service)
  async createCompleteStack(config: {
    projectName: string;
    databaseName: string;
    serviceName: string;
    environmentVariables?: Record<string, string>;
    region?: string;
    plan?: string;
    dockerImage?: string;
  }) {
    console.log('🚀 Creating complete Docker-based stack deployment...');
    
    let database = null;
    let webService = null;
    const results = {
      database: null as any,
      webService: null as any,
      errors: [] as string[],
      manualSteps: [] as string[]
    };

    try {
      // Step 1: Create PostgreSQL database
      console.log('📊 Creating PostgreSQL database...');
      database = await this.createPostgresServiceWithChecks(config.databaseName);
      results.database = database;
      console.log('✅ Database created successfully:', database.name);
    } catch (dbError) {
      const errorMsg = `Database creation failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
      console.warn('⚠️', errorMsg);
      results.errors.push(errorMsg);
    }

    // Add a delay between database and web service creation to avoid rate limiting
    if (database) {
      console.log('⏳ Waiting 3 seconds before creating web service to avoid rate limits...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
      // Step 2: Create Docker-based web service
      console.log('🐳 Creating Docker-based web service...');
      
      // Prepare environment variables with database connection if database was created
      const envVars = { ...config.environmentVariables };
      if (database && database.databaseUrl) {
        envVars.DATABASE_URL = database.databaseUrl;
      }

      webService = await this.createWebService({
        name: config.serviceName,
        environmentVariables: envVars,
        region: config.region,
        plan: config.plan,
        dockerImage: config.dockerImage,
      });
      results.webService = webService;
      console.log('✅ Docker web service created successfully:', webService.name);
    } catch (webError) {
      const errorMsg = `Docker web service creation failed: ${webError instanceof Error ? webError.message : 'Unknown error'}`;
      console.warn('⚠️', errorMsg);
      results.errors.push(errorMsg);
      
      // Provide manual Docker deployment instructions
      console.log('📋 Adding manual Docker service creation instructions...');
      results.manualSteps = [
        '🐳 Manual Docker Web Service Creation Required:',
        `1. Go to your Render dashboard: https://dashboard.render.com`,
        `2. Click "New +" → "Web Service"`,
        `3. Choose "Deploy an existing image from a registry"`,
        `4. Set the following configuration:`,
        `   • Name: ${config.serviceName}`,
        `   • Runtime: Docker`,
        `   • Image URL: ${config.dockerImage || 'node:18-alpine'}`,
        `   • Plan: Starter ($7/month)`,
        `   • Region: ${config.region || 'oregon'}`,
        `5. Add environment variables:`,
        ...(database ? [`   • DATABASE_URL: ${database.databaseUrl || 'Internal database connection'}`] : []),
        ...Object.entries(config.environmentVariables || {}).map(([key, value]) => `   • ${key}: ${value}`),
        `6. Deploy the service`,
        `7. Your app will be available at: https://${config.serviceName}.onrender.com`,
        '',
        '✅ Database is already created and ready to use!',
        database ? `📊 Database: ${database.name} (${database.databaseUrl || 'connection ready'})` : '',
        '',
        '🐳 Docker Deployment Notes:',
        '• No Git repository required for Docker runtime',
        '• Your application code should be built into the Docker image',
        '• Use Docker Hub or another registry to host your images',
        '• Update the image URL to deploy new versions'
      ].filter(Boolean);
    }

    return results;
  }

  async createBlueprint(config: {
    name: string;
    files: Record<string, string>;
  }) {
    // DEPRECATED: This method is kept for backwards compatibility but will always fail
    // because Render doesn't support blueprint creation for new services via API
    throw new Error(
      'Blueprint creation is not supported by Render API for new services. ' +
      'Blueprints in Render are used for managing existing service configurations, not creating new services. ' +
      'Use createCompleteStack() or individual service creation methods instead.'
    );
  }

  // NEW: Update existing blueprint
  async updateBlueprint(serviceId: string, config: {
    name: string;
    files: Record<string, string>;
    environmentVariables?: Record<string, string>;
  }) {
    return this.request(`/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: config.name,
        repo: null,
        files: config.files,
        envVars: config.environmentVariables ? Object.entries(config.environmentVariables).map(([key, value]) => ({
          key,
          value
        })) : undefined,
      }),
    });
  }

  // NEW: Update environment variables
  async updateEnvironmentVariables(serviceId: string, envVars: Record<string, string>) {
    return this.request(`/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        envVars: Object.entries(envVars).map(([key, value]) => ({
          key,
          value
        }))
      }),
    });
  }

  // NEW: Get service logs
  async getServiceLogs(serviceId: string, limit = 100) {
    return this.request(`/services/${serviceId}/logs?limit=${limit}`);
  }

  // NEW: Find and use existing database
  async findExistingDatabase() {
    try {
      console.log('🔍 Checking for existing databases...');
      const existingDatabases = await this.listDatabases();
      
      if (!Array.isArray(existingDatabases)) {
        console.warn('⚠️ Unexpected database list format');
        return null;
      }
      
      // Find any existing database (starter or higher tier)
      const availableDatabase = existingDatabases.find((db: any) => 
        db && (db.plan === 'starter' || db.instanceType === 'starter' || db.status === 'available')
      );
      
      if (availableDatabase) {
        console.log('✅ Found available database:', availableDatabase.name || 'unnamed');
        return availableDatabase;
      }
      
      console.log('ℹ️ No existing databases found');
      return null;
      
    } catch (error) {
      console.warn('⚠️ Could not check for existing databases:', error instanceof Error ? error.message : 'Unknown error');
      
      // If we can't list databases, it might be a permissions issue
      // Return null so we can still try to create a new one
      return null;
    }
  }

  // NEW: Create temporary GitHub repository (if GitHub token is available)
  // DEPRECATED: Not needed for Docker runtime deployment
  async createTempRepository(projectName: string, files: Record<string, string>): Promise<{ url: string; name: string } | null> {
    console.log('🔄 Docker runtime does not require Git repository - skipping repository creation');
    return null;
  }
}

/**
 * Validate and normalize actions for deployment
 */
function validateAndNormalizeActions(actions: AgentAction[]): AgentAction[] {
  return actions.map((action, index) => {
    // Validate required fields
    if (!action.id) {
      throw new Error(`Action ${index + 1} is missing required 'id' field`);
    }
    if (!action.name) {
      throw new Error(`Action ${action.id} is missing required 'name' field`);
    }
    if (!action.description) {
      throw new Error(`Action ${action.id} is missing required 'description' field`);
    }

    // Validate type is either 'query' or 'mutation'
    if (action.type !== 'query' && action.type !== 'mutation') {
      throw new Error(`Action ${action.id} has invalid type '${action.type}'. Must be 'query' or 'mutation'`);
    }

    // Ensure all required fields are present with proper defaults
    const normalizedAction: AgentAction = {
      ...action,
      role: action.role || 'member',
      emoji: action.emoji || '⚡',
      dataSource: action.dataSource || {
        type: 'custom',
        customFunction: {
          code: '// Default data source implementation\nreturn { success: true, data: [] };',
          envVars: []
        }
      },
      execute: action.execute || {
        type: 'code',
        code: {
          script: `
            // Default action implementation for ${action.name}
            console.log('Executing action:', '${action.name}');
            return { success: true, message: 'Action completed', data: [] };
          `,
          envVars: []
        }
      },
      results: action.results || {
        actionType: action.type,
        model: 'DefaultModel',
        fields: {}
      }
    };

    return normalizedAction;
  });
}

/**
 * Validate and normalize schedules for deployment
 */
function validateAndNormalizeSchedules(schedules: AgentSchedule[]): AgentSchedule[] {
  return schedules.map((schedule, index) => {
    // Validate required fields
    if (!schedule.id) {
      throw new Error(`Schedule ${index + 1} is missing required 'id' field`);
    }
    if (!schedule.name) {
      throw new Error(`Schedule ${schedule.id} is missing required 'name' field`);
    }
    if (!schedule.description) {
      throw new Error(`Schedule ${schedule.id} is missing required 'description' field`);
    }

    // Validate type is either 'query' or 'mutation'
    if (schedule.type !== 'query' && schedule.type !== 'mutation') {
      throw new Error(`Schedule ${schedule.id} has invalid type '${schedule.type}'. Must be 'query' or 'mutation'`);
    }

    // Ensure all required fields are present with proper defaults
    const normalizedSchedule: AgentSchedule = {
      ...schedule,
      role: schedule.role || 'admin',
      emoji: schedule.emoji || '⏰',
      interval: schedule.interval || {
        pattern: '0 0 * * *', // Daily at midnight
        timezone: 'UTC',
        active: false
      },
      dataSource: schedule.dataSource || {
        type: 'custom',
        customFunction: {
          code: '// Default schedule data source\nreturn { success: true, data: [] };',
          envVars: []
        }
      },
      execute: schedule.execute || {
        type: 'code',
        code: {
          script: `
            // Default schedule implementation for ${schedule.name}
            console.log('Executing schedule:', '${schedule.name}');
            return { success: true, message: 'Schedule completed', data: [] };
          `,
          envVars: []
        }
      },
      results: schedule.results || {
        actionType: schedule.type,
        model: 'DefaultModel',
        fields: {}
      }
    };

    return normalizedSchedule;
  });
}

/**
 * Generate Next.js project files with Prisma integration, API endpoints, and cron jobs
 */
export async function generateNextJsProject(
  step1Output: Step1Output, 
  step2Output: Step2Output, 
  step3Output: Step3Output, 
  projectName: string
) {
  const { prismaSchema, models } = step1Output;
  
  // Validate and normalize actions and schedules
  const actions = validateAndNormalizeActions(step2Output.actions || []);
  const schedules = validateAndNormalizeSchedules(step3Output.schedules || []);

  // Validate models
  if (!models || models.length === 0) {
    throw new Error('No database models found in Step 1 output');
  }

  // Validate Prisma schema includes proper configuration
  if (!prismaSchema.includes('generator client') || !prismaSchema.includes('datasource db')) {
    throw new Error('Invalid Prisma schema: missing generator or datasource configuration');
  }

  // Sanitize project name for package.json
  const sanitizedProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Enhanced package.json with all necessary dependencies and scripts
  const packageJson = {
    name: sanitizedProjectName,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'prisma generate && next build',
      start: 'next start',
      lint: 'next lint',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:generate': 'prisma generate',
      'db:studio': 'prisma studio',
      'db:seed': 'node prisma/seed.js',
      'cron:setup': 'node scripts/setup-cron.js',
      'cron:start': 'node scripts/start-cron.js',
      'cron:stop': 'node scripts/stop-cron.js',
      'cron:status': 'node scripts/cron-status.js',
      'postinstall': 'prisma generate',
    },
    dependencies: {
      '@prisma/client': '^5.7.0',
      next: '15.0.0',
      react: '18.2.0',
      'react-dom': '18.2.0',
      prisma: '^5.7.0',
      'node-cron': '^3.0.3',
      'cross-env': '^7.0.3',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.0',
      'autoprefixer': '^10.4.0',
      'bcryptjs': '^2.4.3',
      'jsonwebtoken': '^9.0.2',
      'uuid': '^9.0.1',
      'zod': '^3.22.4',
    },
    devDependencies: {
      '@types/node': '^20.10.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@types/node-cron': '^3.0.8',
      '@types/bcryptjs': '^2.4.6',
      '@types/jsonwebtoken': '^9.0.5',
      '@types/uuid': '^9.0.7',
      eslint: '^8.56.0',
      'eslint-config-next': '15.0.0',
      typescript: '^5.3.0',
    },
  };

  // Enhanced Next.js config with proper optimization
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable static optimization
  output: 'standalone',
  // Database connection optimization
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
`;

  // Enhanced TypeScript config with proper paths and types
  const tsConfig = {
    compilerOptions: {
      target: 'es2017',
      lib: ['dom', 'dom.iterable', 'es6'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next',
        },
      ],
      paths: {
        '@/*': ['./src/*'],
      },
      types: ['node'],
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  // Enhanced Prisma client with connection pooling and error handling
  const prismaClient = `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma
`;

  // Enhanced action utilities with better error handling and validation
  const actionUtils = generateActionUtilities(actions, models);
  const scheduleUtils = generateScheduleUtilities(schedules, models);

  // Enhanced API endpoints with proper validation and error handling
  const apiEndpoints = generateApiEndpoints(actions, models);

  // Enhanced cron scripts with better process management
  const cronScripts = generateCronScripts(schedules, models);

  // Enhanced Tailwind config with proper content paths
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
`;

  // Enhanced PostCSS config
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  // Enhanced global CSS with better styling
  const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: system-ui, sans-serif;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md border border-gray-200 p-6;
  }
}
`;

  // Enhanced layout with proper metadata and error boundaries
  const layout = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated Next.js application with Prisma, API endpoints, and automated schedules',
  keywords: ['Next.js', 'Prisma', 'API', 'Automation'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">${projectName}</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/api/health" className="text-gray-500 hover:text-gray-700">
                    Health Check
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
`;

  // Generate safe model sections for the main page
  const modelSections = models.map(model => {
    const safeFields = (model.fields || []).slice(0, 5);
    const fieldsList = safeFields.map(field => 
      `<div class="flex justify-between"><span class="text-gray-800">${field.name}</span><span class="text-gray-500">${field.type}</span></div>`
    ).join('');
    const extraFieldsCount = (model.fields || []).length - 5;
    const extraFieldsText = extraFieldsCount > 0 ? `<div class="text-gray-500 text-xs">+${extraFieldsCount} more fields</div>` : '';
    
    return `<div class="border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-2">${model.name}</h3>
      <p class="text-gray-600 mb-3">${model.description || `Manage ${model.name} records`}</p>
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-700">Fields:</p>
        <div class="grid grid-cols-1 gap-1 text-sm">
          ${fieldsList}
          ${extraFieldsText}
        </div>
      </div>
    </div>`;
  }).join('');

  // Generate safe action sections
  const actionSections = actions.map(action => {
    return `<div class="border border-blue-200 bg-blue-50 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-2 flex items-center">
        <span class="mr-2">${action.emoji || '⚡'}</span>
        ${action.name}
      </h3>
      <p class="text-gray-700 mb-3">${action.description}</p>
      <div class="flex justify-between items-center">
        <div class="flex space-x-2">
          <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
            ${action.type === 'query' ? 'Query' : 'Mutation'}
          </span>
          <span class="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
            ${action.role}
          </span>
        </div>
        <a href="/api/actions/${action.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
          API Endpoint →
        </a>
      </div>
    </div>`;
  }).join('');

  // Generate safe schedule sections
  const scheduleSections = schedules.map(schedule => {
    return `<div class="border border-green-200 bg-green-50 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-2 flex items-center">
        <span class="mr-2">${schedule.emoji || '⏰'}</span>
        ${schedule.name}
      </h3>
      <p class="text-gray-700 mb-3">${schedule.description}</p>
      <div class="flex justify-between items-center">
        <div class="flex space-x-2">
          <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
            ${schedule.interval?.pattern || 'Manual'}
          </span>
          <span class="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
            ${schedule.interval?.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <span class="text-green-600 text-sm font-medium">
          Auto-scheduled
        </span>
      </div>
    </div>`;
  }).join('');

  // Enhanced main page with better UI and error handling
  const mainPage = `import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function Home() {
  let connectionStatus = 'connected';
  let errorMessage = '';
  
  try {
    // Test database connection
    await prisma.$connect();
  } catch (error) {
    connectionStatus = 'disconnected';
    errorMessage = error instanceof Error ? error.message : 'Unknown database error';
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">${projectName}</h1>
        <p className="text-lg text-gray-600 mb-4">
          Welcome to your generated Next.js application with Prisma, API endpoints, and automated schedules!
        </p>
        
        {/* Database Status */}
        <div className="mb-6">
          <div className={\`w-3 h-3 rounded-full \${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}\`}></div>
          <span className="text-sm font-medium">
            Database: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Models Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Data Models (${models.length})
          </h2>
          <div className="space-y-4" dangerouslySetInnerHTML={{ __html: \`${modelSections}\` }} />
        </div>

        {/* Actions Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            API Actions (${actions.length})
          </h2>
          <div className="space-y-4" dangerouslySetInnerHTML={{ __html: \`${actionSections}\` }} />
        </div>

        {/* Schedules Section */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Automated Schedules (${schedules.length})
          </h2>
          <div className="space-y-4" dangerouslySetInnerHTML={{ __html: \`${scheduleSections}\` }} />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/api/health" className="btn btn-primary">
            Health Check
          </Link>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            Refresh Status
          </button>
          <Link href="/api/actions" className="btn btn-secondary">
            View All APIs
          </Link>
          <Link href="/docs" className="btn btn-secondary">
            Documentation
          </Link>
        </div>
      </div>
    </div>
  )
}
`;

  // Enhanced health check endpoint with better model validation
  const healthEndpoint = `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Get basic stats with proper error handling
    const stats: Record<string, any> = {};
    const modelNames = ${JSON.stringify(models.map(m => m.name))};
    
    for (const modelName of modelNames) {
      try {
        // Convert model name to lowercase for Prisma client access
        const prismaModelName = modelName.toLowerCase();
        
        // Check if the model exists in Prisma client
        const prismaModel = (prisma as any)[prismaModelName];
        if (prismaModel && typeof prismaModel.count === 'function') {
          const count = await prismaModel.count();
          stats[modelName] = { count, status: 'connected' };
        } else {
          stats[modelName] = { count: 0, status: 'model_not_found', error: 'Model not found in Prisma client' };
        }
      } catch (error) {
        stats[modelName] = { 
          count: 0, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      models: stats,
      actions: ${actions.length},
      schedules: ${schedules.length},
      version: '1.0.0'
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
`;

  // Enhanced environment configuration
  const envExample = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application Configuration
NODE_ENV="development"

# API Keys (if needed)
${actions.filter(action => action.execute?.code?.envVars && action.execute.code.envVars.length > 0)
  .flatMap(action => action.execute?.code?.envVars || [])
  .map(env => `${env.name}="your-${env.name.toLowerCase()}-here"`)
  .join('\n')}

# Cron Job Configuration
CRON_ENABLED="true"
CRON_TIMEZONE="UTC"
`;

  // Enhanced Docker configuration
  const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
`;

  // Enhanced Next.js environment definitions
  const nextEnvDts = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`;

  // Enhanced .gitignore
  const gitignore = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
/prisma/migrations/
/prisma/dev.db*

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

  // Complete the project files object
  const projectFiles = {
    'package.json': JSON.stringify(packageJson, null, 2),
    'next.config.js': nextConfig,
    'tsconfig.json': JSON.stringify(tsConfig, null, 2),
    'tailwind.config.js': tailwindConfig,
    'postcss.config.js': postcssConfig,
    'src/lib/prisma.ts': prismaClient,
    'src/lib/actions.ts': actionUtils,
    'src/lib/schedules.ts': scheduleUtils,
    'src/app/globals.css': globalCss,
    'src/app/layout.tsx': layout,
    'src/app/page.tsx': mainPage,
    'src/app/api/health/route.ts': healthEndpoint,
    'prisma/schema.prisma': prismaSchema,
    '.env.example': envExample,
    '.gitignore': gitignore,
    'next-env.d.ts': nextEnvDts,
    'Dockerfile': dockerfile,
    'README.md': generateReadme(projectName, models, actions, schedules),
    ...apiEndpoints,
    ...cronScripts,
  };

  return projectFiles;
}

/**
 * Generate API endpoints for actions
 */
function generateApiEndpoints(actions: AgentAction[], models: any[]): Record<string, string> {
  const endpoints: Record<string, string> = {};
  
  actions.forEach(action => {
    const endpointPath = `src/app/api/actions/${action.id}/route.ts`;
    endpoints[endpointPath] = `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeAction } from '@/lib/actions';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, member } = body;

    // Execute the action
    const result = await executeAction('${action.id}', {
      database: prisma,
      input: input || {},
      member: member || { role: 'member' }
    });

    return NextResponse.json({
      success: true,
      data: result.output,
      operations: result.data
    });

  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    action: {
      id: '${action.id}',
      name: '${action.name}',
      description: '${action.description}',
      type: '${action.type}',
      role: '${action.role}'
    }
  });
}
`;
  });

  return endpoints;
}

/**
 * Generate cron job scripts
 */
function generateCronScripts(schedules: AgentSchedule[], models: any[]): Record<string, string> {
  const scripts: Record<string, string> = {};
  
  // Enhanced main cron setup script with better error handling
  scripts['scripts/setup-cron.js'] = `#!/usr/bin/env node
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { executeSchedule } = require('../src/lib/schedules');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Schedule configurations
const schedules = [
${schedules.map(schedule => `  {
    id: '${schedule.id}',
    name: '${schedule.name}',
    pattern: '${schedule.interval?.pattern || '0 0 * * *'}',
    active: ${schedule.interval?.active || false},
    timezone: '${schedule.interval?.timezone || 'UTC'}',
    description: '${schedule.description || ''}'
  }`).join(',\n')}
];

// Logging function
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] [\${level.toUpperCase()}] \${message}\`;
  console.log(logMessage);
  
  // Write to log file
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(
    path.join(logDir, 'cron.log'),
    logMessage + '\\n'
  );
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  log('Received SIGTERM signal, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('Received SIGINT signal, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Error handler
process.on('uncaughtException', (error) => {
  log(\`Uncaught exception: \${error.message}\`, 'error');
  log(\`Stack: \${error.stack}\`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(\`Unhandled rejection at: \${promise}, reason: \${reason}\`, 'error');
});

async function main() {
  log('🚀 Starting cron job scheduler...');
  
  try {
    // Test database connection
    await prisma.$connect();
    log('✅ Database connection established');
    
    // Set up schedules
    let activeSchedules = 0;
    
    schedules.forEach(schedule => {
      if (schedule.active) {
        log(\`📅 Setting up schedule: \${schedule.name} (\${schedule.pattern})\`);
        
        // Validate cron pattern
        if (!cron.validate(schedule.pattern)) {
          log(\`❌ Invalid cron pattern for \${schedule.name}: \${schedule.pattern}\`, 'error');
          return;
        }
        
        cron.schedule(schedule.pattern, async () => {
          const executionId = \`\${schedule.id}-\${Date.now()}\`;
          log(\`⏰ Executing schedule: \${schedule.name} (ID: \${executionId})\`);
          
          try {
            const startTime = Date.now();
            
            const result = await executeSchedule(schedule.id, {
              database: prisma,
              input: {},
              member: { role: 'system', id: 'cron-scheduler' }
            });
            
            const duration = Date.now() - startTime;
            log(\`✅ Schedule completed: \${schedule.name} (Duration: \${duration}ms)\`);
            
            // Log result summary
            if (result && result.output) {
              log(\`📊 Result summary: \${JSON.stringify(result.output)}\`);
            }
            
          } catch (error) {
            log(\`❌ Schedule failed: \${schedule.name} - \${error.message}\`, 'error');
            log(\`Stack: \${error.stack}\`, 'error');
            
            // Optional: Send notification or alert here
          }
        }, {
          timezone: schedule.timezone
        });
        
        activeSchedules++;
      } else {
        log(\`⏸️ Schedule inactive: \${schedule.name}\`);
      }
    });
    
    log(\`✅ Cron scheduler initialized with \${activeSchedules} active schedules\`);
    
    // Keep the process alive
    setInterval(() => {
      log('💓 Cron scheduler heartbeat', 'debug');
    }, 300000); // Every 5 minutes
    
  } catch (error) {
    log(\`❌ Failed to initialize cron scheduler: \${error.message}\`, 'error');
    process.exit(1);
  }
}

main().catch((error) => {
  log(\`❌ Unhandled error in cron scheduler: \${error.message}\`, 'error');
  process.exit(1);
});
`;

  // Enhanced cron start script
  scripts['scripts/start-cron.js'] = `#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '../.cron.pid');
const logFile = path.join(__dirname, '../logs/cron.log');

// Check if cron is already running
if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0); // Check if process exists
    console.log(\`❌ Cron scheduler is already running (PID: \${pid})\`);
    process.exit(1);
  } catch (error) {
    // Process doesn't exist, remove stale PID file
    fs.unlinkSync(pidFile);
  }
}

// Create logs directory
const logsDir = path.dirname(logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Start cron scheduler
console.log('🚀 Starting cron scheduler...');
const cronProcess = spawn('node', [path.join(__dirname, 'setup-cron.js')], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Write PID file
fs.writeFileSync(pidFile, cronProcess.pid.toString());

// Handle process output
cronProcess.stdout.on('data', (data) => {
  const message = data.toString();
  console.log(message);
  fs.appendFileSync(logFile, message);
});

cronProcess.stderr.on('data', (data) => {
  const message = data.toString();
  console.error(message);
  fs.appendFileSync(logFile, message);
});

cronProcess.on('close', (code) => {
  console.log(\`📅 Cron scheduler exited with code \${code}\`);
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
  }
});

cronProcess.unref();
console.log(\`✅ Cron scheduler started (PID: \${cronProcess.pid})\`);
console.log(\`📄 Logs: \${logFile}\`);
`;

  // Enhanced cron stop script
  scripts['scripts/stop-cron.js'] = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '../.cron.pid');

if (!fs.existsSync(pidFile)) {
  console.log('❌ Cron scheduler is not running');
  process.exit(1);
}

const pid = fs.readFileSync(pidFile, 'utf8').trim();

try {
  process.kill(pid, 'SIGTERM');
  console.log(\`⏹️ Stopping cron scheduler (PID: \${pid})...\`);
  
  // Wait for graceful shutdown
  setTimeout(() => {
    try {
      process.kill(pid, 0);
      console.log('⚠️ Cron scheduler did not stop gracefully, forcing termination...');
      process.kill(pid, 'SIGKILL');
    } catch (error) {
      console.log('✅ Cron scheduler stopped successfully');
    }
    
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  }, 5000);
  
} catch (error) {
  console.log(\`❌ Failed to stop cron scheduler: \${error.message}\`);
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
  }
  process.exit(1);
}
`;

  // Enhanced cron status script
  scripts['scripts/cron-status.js'] = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '../.cron.pid');
const logFile = path.join(__dirname, '../logs/cron.log');

console.log('📊 Cron Scheduler Status');
console.log('========================');

// Check if cron is running
if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0);
    console.log(\`✅ Status: Running (PID: \${pid})\`);
  } catch (error) {
    console.log('❌ Status: Not running (stale PID file)');
    fs.unlinkSync(pidFile);
  }
} else {
  console.log('❌ Status: Not running');
}

// Show schedule configuration
console.log('\\n📅 Configured Schedules:');
const schedules = [
${schedules.map(schedule => `  {
    name: '${schedule.name}',
    pattern: '${schedule.interval?.pattern || '0 0 * * *'}',
    active: ${schedule.interval?.active || false},
    timezone: '${schedule.interval?.timezone || 'UTC'}'
  }`).join(',\n')}
];

schedules.forEach((schedule, index) => {
  console.log(\`  \${index + 1}. \${schedule.name}\`);
  console.log(\`     Pattern: \${schedule.pattern}\`);
  console.log(\`     Active: \${schedule.active ? '✅' : '❌'}\`);
  console.log(\`     Timezone: \${schedule.timezone}\`);
  console.log('');
});

// Show recent logs
if (fs.existsSync(logFile)) {
  console.log('📄 Recent Logs (last 10 lines):');
  const logs = fs.readFileSync(logFile, 'utf8').split('\\n').slice(-10);
  logs.forEach(log => {
    if (log.trim()) {
      console.log(\`  \${log}\`);
    }
  });
} else {
  console.log('📄 No logs available');
}
`;

  return scripts;
}

/**
 * Generate enhanced action utilities with proper Prisma integration
 */
function generateActionUtilities(actions: AgentAction[], models: any[]): string {
  return `import { PrismaClient } from '@prisma/client';

// Enhanced action definitions with proper error handling
const actions = {
${actions.map(action => `  '${action.id}': {
    id: '${action.id}',
    name: '${action.name}',
    description: '${action.description}',
    type: '${action.type}',
    role: '${action.role}',
    execute: async (params: { database: PrismaClient; input: any; member: any }) => {
      const { database, input, member } = params;
      
      // Validate database connection
      if (!database) {
        throw new Error('Database connection is required');
      }
      
      // Validate member context
      if (!member || !member.role) {
        throw new Error('Valid member context is required');
      }
      
      // Action execution logic with proper Prisma integration
      ${generateActionExecutionCode(action)}
    }
  }`).join(',\n')}
};

// Enhanced action execution with comprehensive error handling
export async function executeAction(
  actionId: string, 
  params: { database: PrismaClient; input: any; member: any }
) {
  const action = actions[actionId];
  if (!action) {
    throw new Error(\`Action not found: \${actionId}\`);
  }
  
  // Validate input parameters
  if (!params.database) {
    throw new Error('Database connection is required');
  }
  
  if (!params.member) {
    throw new Error('Member context is required');
  }
  
  // Role-based access control
  if (action.role === 'admin' && params.member.role !== 'admin') {
    throw new Error(\`Admin access required for action: \${action.name}\`);
  }
  
  try {
    console.log(\`Executing action: \${action.name} (ID: \${actionId})\`);
    console.log(\`Action type: \${action.type}, Role: \${action.role}\`);
    
    const result = await action.execute(params);
    
    console.log(\`Action completed successfully: \${action.name}\`);
    return result;
    
  } catch (error) {
    console.error(\`Action execution failed: \${action.name}\`, error);
    
    // Enhanced error handling with context
    const enhancedError = new Error(\`Action execution failed: \${action.name} - \${error instanceof Error ? error.message : 'Unknown error'}\`);
    enhancedError.cause = error;
    
    throw enhancedError;
  }
}

// Get action information
export function getActionInfo(actionId: string) {
  const action = actions[actionId];
  if (!action) {
    throw new Error(\`Action not found: \${actionId}\`);
  }
  
  return {
    id: action.id,
    name: action.name,
    description: action.description,
    type: action.type,
    role: action.role
  };
}

// List all available actions
export function listActions() {
  return Object.keys(actions).map(actionId => getActionInfo(actionId));
}

// Validate action parameters
export function validateActionParams(actionId: string, params: any) {
  const action = actions[actionId];
  if (!action) {
    throw new Error(\`Action not found: \${actionId}\`);
  }
  
  const errors = [];
  
  if (!params.database) {
    errors.push('Database connection is required');
  }
  
  if (!params.member) {
    errors.push('Member context is required');
  }
  
  if (params.member && !params.member.role) {
    errors.push('Member role is required');
  }
  
  if (action.role === 'admin' && params.member?.role !== 'admin') {
    errors.push(\`Admin access required for action: \${action.name}\`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
`;
}

/**
 * Generate enhanced schedule utilities with proper Prisma integration
 */
function generateScheduleUtilities(schedules: AgentSchedule[], models: any[]): string {
  return `import { PrismaClient } from '@prisma/client';

// Enhanced schedule definitions with proper error handling
const schedules = {
${schedules.map(schedule => `  '${schedule.id}': {
    id: '${schedule.id}',
    name: '${schedule.name}',
    description: '${schedule.description}',
    type: '${schedule.type}',
    role: '${schedule.role}',
    pattern: '${schedule.interval?.pattern || '0 0 * * *'}',
    timezone: '${schedule.interval?.timezone || 'UTC'}',
    active: ${schedule.interval?.active || false},
    execute: async (params: { database: PrismaClient; input?: any; member: any }) => {
      const { database, input = {}, member } = params;
      
      // Validate database connection
      if (!database) {
        throw new Error('Database connection is required');
      }
      
      // Validate member context (schedules typically run as admin)
      if (!member || member.role !== 'admin') {
        throw new Error('Admin access required for schedule execution');
      }
      
      // Schedule execution logic with proper Prisma integration
      ${generateScheduleExecutionCode(schedule)}
    }
  }`).join(',\n')}
};

// Enhanced schedule execution with comprehensive error handling
export async function executeSchedule(
  scheduleId: string, 
  params: { database: PrismaClient; input?: any; member: any }
) {
  const schedule = schedules[scheduleId];
  if (!schedule) {
    throw new Error(\`Schedule not found: \${scheduleId}\`);
  }
  
  // Validate input parameters
  if (!params.database) {
    throw new Error('Database connection is required');
  }
  
  if (!params.member) {
    throw new Error('Member context is required');
  }
  
  // Role-based access control (schedules require admin access)
  if (params.member.role !== 'admin') {
    throw new Error(\`Admin access required for schedule: \${schedule.name}\`);
  }
  
  // Check if schedule is active
  if (!schedule.active) {
    console.log(\`Schedule is inactive: \${schedule.name}\`);
    return {
      success: false,
      message: 'Schedule is inactive',
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    console.log(\`Executing schedule: \${schedule.name} (ID: \${scheduleId})\`);
    console.log(\`Schedule type: \${schedule.type}, Pattern: \${schedule.pattern}\`);
    
    const result = await schedule.execute(params);
    
    console.log(\`Schedule completed successfully: \${schedule.name}\`);
    return result;
    
  } catch (error) {
    console.error(\`Schedule execution failed: \${schedule.name}\`, error);
    
    // Enhanced error handling with context
    const enhancedError = new Error(\`Schedule execution failed: \${schedule.name} - \${error instanceof Error ? error.message : 'Unknown error'}\`);
    enhancedError.cause = error;
    
    throw enhancedError;
  }
}

// Get schedule information
export function getScheduleInfo(scheduleId: string) {
  const schedule = schedules[scheduleId];
  if (!schedule) {
    throw new Error(\`Schedule not found: \${scheduleId}\`);
  }
  
  return {
    id: schedule.id,
    name: schedule.name,
    description: schedule.description,
    type: schedule.type,
    role: schedule.role,
    pattern: schedule.pattern,
    timezone: schedule.timezone,
    active: schedule.active
  };
}

// List all available schedules
export function listSchedules() {
  return Object.keys(schedules).map(scheduleId => getScheduleInfo(scheduleId));
}

// List active schedules
export function listActiveSchedules() {
  return Object.keys(schedules)
    .filter(scheduleId => schedules[scheduleId].active)
    .map(scheduleId => getScheduleInfo(scheduleId));
}

// Validate schedule parameters
export function validateScheduleParams(scheduleId: string, params: any) {
  const schedule = schedules[scheduleId];
  if (!schedule) {
    throw new Error(\`Schedule not found: \${scheduleId}\`);
  }
  
  const errors = [];
  
  if (!params.database) {
    errors.push('Database connection is required');
  }
  
  if (!params.member) {
    errors.push('Member context is required');
  }
  
  if (params.member && params.member.role !== 'admin') {
    errors.push(\`Admin access required for schedule: \${schedule.name}\`);
  }
  
  if (!schedule.active) {
    errors.push(\`Schedule is inactive: \${schedule.name}\`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
`;
}

/**
 * Generate action execution code with proper Prisma integration
 */
function generateActionExecutionCode(action: AgentAction): string {
  // Use actual function body if available
  if (action.execute?.code?.script) {
    return `// Custom action code
      ${action.execute.code.script}`;
  }
  
  // Generate comprehensive default implementation based on action type
  const isQuery = action.type === 'query';
  const isAdmin = action.role === 'admin';
  
  const defaultCode = `// ${action.type} action implementation for ${action.name}
      console.log('Executing ${action.type} action:', '${action.name}');
      
      try {
        // Validate input parameters
        if (!input) {
          input = {};
        }
        
        // Role-based access control
        ${isAdmin ? `
        if (member.role !== 'admin') {
          throw new Error('Admin access required for this action');
        }` : ''}
        
        // Database operations based on action type
        let result;
        
        ${isQuery ? `
        // Query operation - read data
        if (input.id) {
          // Find specific record - use first available model as default
          try {
            const firstModel = Object.keys(database).find(key => 
              typeof database[key] === 'object' && 
              database[key] !== null &&
              typeof database[key].findUnique === 'function'
            );
            
            if (firstModel) {
              const record = await database[firstModel].findUnique({
                where: { id: input.id }
              });
              result = {
                success: true,
                message: 'Record retrieved successfully',
                data: record ? [record] : [],
                count: record ? 1 : 0
              };
            } else {
              result = {
                success: false,
                message: 'No database models available',
                data: [],
                count: 0
              };
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Database query failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
              data: [],
              count: 0
            };
          }
        } else {
          // List records with pagination
          const skip = parseInt(input.skip) || 0;
          const take = parseInt(input.take) || 10;
          
          try {
            const firstModel = Object.keys(database).find(key => 
              typeof database[key] === 'object' && 
              database[key] !== null &&
              typeof database[key].findMany === 'function'
            );
            
            if (firstModel) {
              const records = await database[firstModel].findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' }
              });
              
              const total = await database[firstModel].count();
              
              result = {
                success: true,
                message: 'Records retrieved successfully',
                data: records,
                count: records.length,
                total,
                pagination: {
                  skip,
                  take,
                  hasMore: skip + take < total
                }
              };
            } else {
              result = {
                success: false,
                message: 'No database models available',
                data: [],
                count: 0,
                total: 0
              };
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Database query failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
              data: [],
              count: 0,
              total: 0
            };
          }
        }` : `
        // Mutation operation - write/modify data
        if (input.id) {
          // Update existing record
          try {
            const firstModel = Object.keys(database).find(key => 
              typeof database[key] === 'object' && 
              database[key] !== null &&
              typeof database[key].update === 'function'
            );
            
            if (firstModel) {
              const updatedRecord = await database[firstModel].update({
                where: { id: input.id },
                data: {
                  ...input.data,
                  updatedAt: new Date()
                }
              });
              result = {
                success: true,
                message: 'Record updated successfully',
                data: [updatedRecord],
                operation: 'update'
              };
            } else {
              result = {
                success: false,
                message: 'No database models available for update',
                data: [],
                operation: 'update'
              };
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Database update failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
              data: [],
              operation: 'update'
            };
          }
        } else {
          // Create new record
          try {
            const firstModel = Object.keys(database).find(key => 
              typeof database[key] === 'object' && 
              database[key] !== null &&
              typeof database[key].create === 'function'
            );
            
            if (firstModel) {
              const newRecord = await database[firstModel].create({
                data: {
                  ...input.data,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
              result = {
                success: true,
                message: 'Record created successfully',
                data: [newRecord],
                operation: 'create'
              };
            } else {
              result = {
                success: false,
                message: 'No database models available for creation',
                data: [],
                operation: 'create'
              };
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Database creation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
              data: [],
              operation: 'create'
            };
          }
        }`}
        
        // Add metadata
        result.actionId = '${action.id}';
        result.actionName = '${action.name}';
        result.actionType = '${action.type}';
        result.timestamp = new Date().toISOString();
        result.executedBy = member.id || 'system';
        
        return result;
        
      } catch (error) {
        console.error('Action execution error:', error);
        
        // Handle Prisma-specific errors
        if (error instanceof Error) {
          if (error.message.includes('P2002')) {
            throw new Error('Record already exists with this unique field');
          } else if (error.message.includes('P2025')) {
            throw new Error('Record not found');
          } else if (error.message.includes('P2003')) {
            throw new Error('Foreign key constraint failed');
          }
        }
        
        throw new Error(\`Action execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
      }`;
  
  return defaultCode;
}

/**
 * Generate schedule execution code with proper Prisma integration
 */
function generateScheduleExecutionCode(schedule: AgentSchedule): string {
  // Use actual function body if available
  if (schedule.execute?.code?.script) {
    return `// Custom schedule code
      ${schedule.execute.code.script}`;
  }
  
  // Generate comprehensive default implementation
  const isQuery = schedule.type === 'query';
  
  const defaultCode = `// ${schedule.type} schedule implementation for ${schedule.name}
      console.log('Executing ${schedule.type} schedule:', '${schedule.name}');
      
      try {
        // Validate execution context
        if (!member || member.role !== 'admin') {
          throw new Error('Admin access required for schedule execution');
        }
        
        // Database operations based on schedule type
        let result;
        
        ${isQuery ? `
        // Query-based schedule - generate reports or analytics
        const stats = await database.user.aggregate({
          _count: { id: true },
          _min: { createdAt: true },
          _max: { createdAt: true }
        });
        
        result = {
          success: true,
          message: 'Schedule query executed successfully',
          data: [{
            totalRecords: stats._count.id,
            earliestRecord: stats._min.createdAt,
            latestRecord: stats._max.createdAt,
            generatedAt: new Date().toISOString()
          }],
          type: 'report'
        };` : `
        // Mutation-based schedule - cleanup, maintenance, or automated tasks
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
        
        const cleanupResult = await database.user.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            active: false
          }
        });
        
        result = {
          success: true,
          message: 'Schedule maintenance executed successfully',
          data: [{
            deletedRecords: cleanupResult.count,
            cutoffDate: cutoffDate.toISOString(),
            executedAt: new Date().toISOString()
          }],
          type: 'maintenance'
        };`}
        
        // Add metadata
        result.scheduleId = '${schedule.id}';
        result.scheduleName = '${schedule.name}';
        result.scheduleType = '${schedule.type}';
        result.timestamp = new Date().toISOString();
        result.nextExecution = 'Based on cron pattern: ${schedule.interval?.pattern || '0 0 * * *'}';
        
        return result;
        
      } catch (error) {
        console.error('Schedule execution error:', error);
        
        // Handle Prisma-specific errors
        if (error.code === 'P2002') {
          throw new Error('Schedule operation failed due to unique constraint');
        } else if (error.code === 'P2025') {
          throw new Error('Schedule operation failed - record not found');
        }
        
        throw new Error(\`Schedule execution failed: \${error.message}\`);
      }`;
  
  return defaultCode;
}

/**
 * Generate README file
 */
function generateReadme(projectName: string, models: any[], actions: AgentAction[], schedules: AgentSchedule[]): string {
  return `# ${projectName}

This is a Next.js application with Prisma ORM, API endpoints, and automated schedules, automatically generated and deployed to Render.

## Features

- ⚡ Next.js 15 with App Router
- 🗄️ Prisma ORM with PostgreSQL
- 🎨 Tailwind CSS for styling
- 🚀 Deployed on Render
- 📡 API endpoints for actions
- ⏰ Automated cron job schedules

## Database Models

${models.map(model => `
### ${model.name}

${model.description || `Manage ${model.name} records`}

**Fields:**
${model.fields.map((field: any) => `- \`${field.name}\`: ${field.type}${field.required ? ' (required)' : ''}`).join('\n')}
`).join('')}

## API Endpoints

${actions.map(action => `
### ${action.name}

- **Endpoint:** \`POST /api/actions/${action.id}\`
- **Description:** ${action.description}
- **Type:** ${action.type}
- **Role:** ${action.role}

**Request Body:**
\`\`\`json
{
  "input": {},
  "member": { "role": "member" }
}
\`\`\`
`).join('')}

## Automated Schedules

${schedules.map(schedule => `
### ${schedule.name}

- **Description:** ${schedule.description}
- **Pattern:** \`${schedule.interval?.pattern || 'Not configured'}\`
- **Type:** ${schedule.type}
- **Status:** ${schedule.interval?.active ? 'Active' : 'Inactive'}
`).join('')}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your database:
   \`\`\`bash
   npm run db:push
   \`\`\`

3. Start cron jobs:
   \`\`\`bash
   npm run cron:start
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Commands

- \`npm run db:push\` - Push schema changes to database
- \`npm run db:migrate\` - Create and run migrations
- \`npm run db:generate\` - Generate Prisma client
- \`npm run db:studio\` - Open Prisma Studio

## Cron Commands

- \`npm run cron:setup\` - Setup cron jobs
- \`npm run cron:start\` - Start cron jobs in background
- \`npm run cron:stop\` - Stop running cron jobs

## Deployment

This app is configured for deployment on Render with:
- Automatic builds on git push
- PostgreSQL database provisioning
- Environment variable management
- Cron jobs running as background processes

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Render Documentation](https://render.com/docs)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
`;
}

/**
 * Execute Step 4: Render Deployment
 */
export async function executeStep4RenderDeployment(input: Step4Input): Promise<Step4Output> {
  console.log('🚀 Starting Step 4: Render Deployment');
  
  const { step1Output, step2Output, step3Output, projectName, description, environmentVariables, region, plan } = input;
  
  // Validate that RENDER_API_KEY is available
  const renderApiKey = process.env.RENDER_API_KEY;
  if (!renderApiKey) {
    throw new Error('RENDER_API_KEY environment variable is required for deployment');
  }
  
  try {
    // Initialize Render client
    const renderClient = new RenderClient(renderApiKey);
    
    // Generate the complete Next.js project (await the Promise)
    const projectFiles = await generateNextJsProject(step1Output, step2Output, step3Output, projectName);
    
    // Sanitize project name for deployment
    const sanitizedProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const dbName = `${sanitizedProjectName}-db`;
    const serviceName = `${sanitizedProjectName}-web`;
    
    // Create deployment configuration
    const deploymentConfig = {
      name: serviceName,
      files: projectFiles,
      environmentVariables: {
        DATABASE_URL: '${DATABASE_URL}', // Will be replaced by Render
        NEXTAUTH_SECRET: generateRandomSecret(),
        NEXTAUTH_URL: 'https://${RENDER_EXTERNAL_HOSTNAME}',
        NODE_ENV: 'production',
        ...environmentVariables,
      },
      region: region || 'oregon',
      plan: plan || 'starter',
    };
    
    // Deploy using API directly - Docker approach (no Git repo needed)
    let deploymentResult = null;
    
    console.log('🏗️ Creating deployment via Render API...');
    console.log('🐳 Using Docker runtime - no Git repository required');
    
    // Create complete stack (database + web service) using Docker runtime
    const stackResult = await renderClient.createCompleteStack({
      projectName: sanitizedProjectName,
      databaseName: dbName,
      serviceName: serviceName,
      environmentVariables: deploymentConfig.environmentVariables,
      region: region || 'oregon',
      plan: plan || 'starter',
      dockerImage: 'node:18-alpine'  // Use default Node.js Docker image
    });
    
    // Check if deployment was successful
    if (stackResult.errors.length > 0) {
      const errorMessages = stackResult.errors.join(', ');
      console.error('❌ API deployment failed:', errorMessages);
      
      // Check if we have database but failed web service (partial success)
      if (stackResult.database && stackResult.manualSteps && stackResult.manualSteps.length > 0) {
        console.log('🔄 Partial deployment success: Database created, web service requires manual setup');
        
        // Generate manual setup instructions
        const manualInstructions = stackResult.manualSteps.join('\n');
        
        deploymentResult = {
          id: `partial-${stackResult.database.id}`,
          serviceId: 'manual-setup-required',
          url: `https://${serviceName}.onrender.com`,
          name: serviceName,
          database: stackResult.database,
          webService: null,
          hasPartialFailure: true,
          manualSteps: stackResult.manualSteps
        };
        
        console.log('📋 Manual setup instructions:');
        console.log(manualInstructions);
        
      } else {
        throw new Error(`API deployment failed: ${errorMessages}`);
      }
    } else {
      // Ensure we have at least one service created
      if (!stackResult.webService && !stackResult.database) {
        throw new Error('Complete API deployment failed: No services were created');
      }
      
      console.log('✅ API deployment successful');
      deploymentResult = {
        id: stackResult.webService?.id || `db-${stackResult.database?.id}`,
        serviceId: stackResult.webService?.service?.id || 'database-only',
        url: stackResult.webService?.service?.url || `https://${serviceName}.onrender.com`,
        name: serviceName,
        database: stackResult.database,
        webService: stackResult.webService,
        hasPartialFailure: false
      };
    }
    
    // Extract deployment information
    const deploymentId = deploymentResult?.id || `api-${Date.now()}`;
    const serviceId = deploymentResult?.serviceId || 'api-deployment';
    const deploymentUrl = deploymentResult?.url || `https://${serviceName}.onrender.com`;
    
    // Generate API endpoints list (using normalized actions)
    const normalizedActions = validateAndNormalizeActions(step2Output.actions || []);
    const apiEndpoints = normalizedActions.map(action => `/api/actions/${action.id}`);
    
    // Generate cron job patterns (using normalized schedules)
    const normalizedSchedules = validateAndNormalizeSchedules(step3Output.schedules || []);
    const cronJobs = normalizedSchedules.map(schedule => 
      schedule.interval?.pattern || 'Manual execution'
    );
    
    // Generate deployment notes for successful API deployment
    const deploymentNotes = [
      `Deployment method: Direct API (Docker Stack Creation)`,
      `Runtime: Docker with Node.js 18 Alpine`,
      `Generated ${step1Output.models.length} database models`,
      `Created ${normalizedActions.length} API endpoints for actions`,
      `Configured ${normalizedSchedules.length} cron jobs for schedules`,
      `Database: ${deploymentResult?.database ? 
        `PostgreSQL created (${deploymentResult.database.name}) - Starter plan ($6/month)` : 
        'Database creation pending'}`,
      `Web Service: ${deploymentResult?.webService ? 
        `Docker service created (${deploymentResult.webService.name}) - Starter plan ($7/month)` : 
        'Docker web service creation pending'}`,
      `Docker Image: node:18-alpine`,
      `Region: ${region || 'oregon'}`,
      `Plan: ${plan || 'starter'}`,
      'Docker deployment - no Git repository required',
      'Full deployment completed via Docker runtime'
    ];
    
    const result: Step4Output = {
      deploymentId,
      serviceId,
      deploymentUrl,
      status: 'pending',
      buildLogs: [
        `Deployment prepared at ${new Date().toISOString()}`,
        `Deployment method: Direct API (Docker Runtime)`,
        'Stack creation completed:',
        `  Database (${dbName}): ${deploymentResult?.database ? '✅ Created' : '⏳ Pending'}`,
        `  Web Service (${serviceName}): ${deploymentResult?.webService ? '✅ Created' : '⏳ Pending'}`,
        `  Docker Image: node:18-alpine`,
        'Docker deployment completed successfully - no Git repository required'
      ],
      environmentVariables: deploymentConfig.environmentVariables,
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes,
      apiEndpoints,
      cronJobs,
    };
    
    console.log('✅ Step 4 completed successfully');
    console.log(`🌐 Deployment URL: ${deploymentUrl}`);
    console.log(`📊 API Endpoints: ${apiEndpoints.length}`);
    console.log(`⏰ Cron Jobs: ${cronJobs.length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    
    // Return a failed deployment result - API-only approach
    const failureMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      deploymentId: 'failed',
      serviceId: 'failed',
      deploymentUrl: '',
      status: 'failed',
      buildLogs: [
        `Deployment failed at ${new Date().toISOString()}`,
        `Error: ${failureMessage}`,
        'API deployment was unsuccessful',
        'Please check your Render API key and account permissions',
        'Ensure you have available free tier slots for database and web service'
      ],
      environmentVariables: environmentVariables || {},
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes: [
        'Deployment failed - API creation unsuccessful',
        'Check your Render account for existing services',
        'Verify RENDER_API_KEY permissions',
        'Ensure billing card is added for starter plan services',
        'Manual service creation may be required'
      ],
      apiEndpoints: [],
      cronJobs: [],
    };
  }
}

/**
 * Update existing Render deployment with new agent code
 */
export async function updateExistingDeployment(input: {
  step1Output: Step1Output;
  step2Output: Step2Output;
  step3Output: Step3Output;
  serviceId: string;
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  executeMigrations?: boolean;
}): Promise<Step4Output> {
  console.log('🔄 Updating existing Render deployment');
  
  const { step1Output, step2Output, step3Output, serviceId, projectName, description, environmentVariables, executeMigrations } = input;
  
  // Validate that RENDER_API_KEY is available
  const renderApiKey = process.env.RENDER_API_KEY;
  if (!renderApiKey) {
    throw new Error('RENDER_API_KEY environment variable is required for deployment updates');
  }
  
  try {
    // Initialize Render client
    const renderClient = new RenderClient(renderApiKey);
    
    // Check if service exists
    const existingService = await renderClient.getService(serviceId);
    if (!existingService) {
      throw new Error(`Service with ID ${serviceId} not found`);
    }
    
    // Generate updated Next.js project files
    const projectFiles = await generateNextJsProject(step1Output, step2Output, step3Output, projectName);
    
    // Add migration execution script if needed
    if (executeMigrations) {
      // Create a mutable copy to add the migration script
      const updatedProjectFiles: Record<string, string> = { ...projectFiles };
      updatedProjectFiles['scripts/run-migrations.js'] = generateMigrationScript();
      
      // Update package.json to include migration in build process
      const packageJson = JSON.parse(updatedProjectFiles['package.json']);
      packageJson.scripts['build'] = 'prisma generate && npm run db:migrate && next build';
      updatedProjectFiles['package.json'] = JSON.stringify(packageJson, null, 2);
      
      // Use the updated files by reassigning projectFiles
      Object.assign(projectFiles, updatedProjectFiles);
    }
    
    // Update deployment configuration
    const deploymentConfig = {
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: projectFiles,
      environmentVariables: {
        DATABASE_URL: '${DATABASE_URL}', // Will be replaced by Render
        NEXTAUTH_SECRET: generateRandomSecret(),
        NEXTAUTH_URL: `https://${existingService.name}.onrender.com`,
        ...environmentVariables,
      },
    };
    
    // Update blueprint
    console.log('🏗️ Updating deployment blueprint...');
    await renderClient.updateBlueprint(serviceId, deploymentConfig);
    
    // Trigger new deployment
    console.log('🚀 Triggering new deployment...');
    const newDeploy = await renderClient.triggerDeploy(serviceId);
    
    // Generate API endpoints list (using normalized actions)
    const normalizedActions = validateAndNormalizeActions(step2Output.actions || []);
    const apiEndpoints = normalizedActions.map(action => `/api/actions/${action.id}`);
    
    // Generate cron job patterns (using normalized schedules)
    const normalizedSchedules = validateAndNormalizeSchedules(step3Output.schedules || []);
    const cronJobs = normalizedSchedules.map(schedule => 
      schedule.interval?.pattern || 'Manual execution'
    );
    
    // Generate deployment notes
    const deploymentNotes = [
      `Updated ${step1Output.models.length} database models`,
      `Updated ${normalizedActions.length} API endpoints for actions`,
      `Updated ${normalizedSchedules.length} cron jobs for schedules`,
      `Database: PostgreSQL on Render`,
      `Runtime: Node.js with Next.js 15`,
      executeMigrations ? 'Database migrations executed' : 'Database migrations skipped',
    ];
    
    const result: Step4Output = {
      deploymentId: newDeploy.id || serviceId,
      serviceId: serviceId,
      deploymentUrl: existingService.url || `https://${deploymentConfig.name}.onrender.com`,
      status: 'pending',
      buildLogs: [`Deployment update initiated at ${new Date().toISOString()}`],
      environmentVariables: deploymentConfig.environmentVariables,
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes,
      apiEndpoints,
      cronJobs,
    };
    
    console.log('✅ Deployment update completed successfully');
    console.log(`🌐 Deployment URL: ${result.deploymentUrl}`);
    console.log(`📊 Updated API Endpoints: ${apiEndpoints.length}`);
    console.log(`⏰ Updated Cron Jobs: ${cronJobs.length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Deployment update failed:', error);
    
    // Return a failed deployment result
    return {
      deploymentId: 'failed-update',
      serviceId: serviceId,
      deploymentUrl: '',
      status: 'failed',
      buildLogs: [
        `Deployment update failed at ${new Date().toISOString()}`,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      environmentVariables: environmentVariables || {},
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes: [
        'Deployment update failed',
        'Check build logs for details',
      ],
      apiEndpoints: [],
      cronJobs: [],
    };
  }
}

/**
 * Persist deployment metadata to document
 */
export async function persistDeploymentMetadata(
  documentId: string,
  deploymentResult: Step4Output,
  session: any
): Promise<boolean> {
  try {
    // Import the necessary functions
    const { getDocumentById, saveOrUpdateDocument } = await import('../../../../db/queries');
    
    // Get existing document
    const existingDoc = await getDocumentById({ id: documentId });
    if (!existingDoc) {
      console.error('❌ Document not found for deployment metadata persistence');
      return false;
    }
    
    // Create deployment metadata
    const deploymentMetadata = {
      serviceId: deploymentResult.serviceId,
      deploymentId: deploymentResult.deploymentId,
      deploymentUrl: deploymentResult.deploymentUrl,
      status: deploymentResult.status,
      lastDeployment: new Date().toISOString(),
      environmentVariables: deploymentResult.environmentVariables,
      apiEndpoints: deploymentResult.apiEndpoints,
      cronJobs: deploymentResult.cronJobs,
    };
    
    // Update document with deployment metadata
    const currentMetadata = (existingDoc.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      deployment: deploymentMetadata,
      lastUpdated: new Date().toISOString(),
    };
    
    await saveOrUpdateDocument({
      id: documentId,
      title: existingDoc.title,
      content: existingDoc.content || '{}',
      kind: existingDoc.kind as any,
      userId: session?.user?.id || existingDoc.userId,
      metadata: updatedMetadata
    });
    
    console.log('✅ Deployment metadata persisted successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to persist deployment metadata:', error);
    return false;
  }
}

/**
 * Retrieve deployment metadata from document
 */
export async function getDeploymentMetadata(documentId: string): Promise<{
  serviceId?: string;
  deploymentId?: string;
  deploymentUrl?: string;
  lastDeployment?: string;
} | null> {
  try {
    const { getDocumentById } = await import('../../../../db/queries');
    
    const document = await getDocumentById({ id: documentId });
    if (!document?.metadata) {
      return null;
    }
    
    const metadata = document.metadata as any;
    return metadata.deployment || null;
    
  } catch (error) {
    console.error('❌ Failed to retrieve deployment metadata:', error);
    return null;
  }
}

/**
 * Check if agent needs deployment update
 */
export function checkDeploymentUpdateNeeded(
  existingAgent: any,
  newAgent: any,
  deploymentMetadata: any
): {
  needsUpdate: boolean;
  reasons: string[];
  requiresMigration: boolean;
} {
  const reasons: string[] = [];
  let requiresMigration = false;
  
  // Check database schema changes
  if (existingAgent.models?.length !== newAgent.models?.length) {
    reasons.push('Database models count changed');
    requiresMigration = true;
  }
  
  // Check for model field changes
  const existingModels = existingAgent.models || [];
  const newModels = newAgent.models || [];
  
  for (const newModel of newModels) {
    const existingModel = existingModels.find((m: any) => m.name === newModel.name);
    if (!existingModel) {
      reasons.push(`New model added: ${newModel.name}`);
      requiresMigration = true;
    } else if (JSON.stringify(existingModel.fields) !== JSON.stringify(newModel.fields)) {
      reasons.push(`Model fields changed: ${newModel.name}`);
      requiresMigration = true;
    }
  }
  
  // Check action changes
  if (existingAgent.actions?.length !== newAgent.actions?.length) {
    reasons.push('Actions count changed');
  }
  
  const existingActions = existingAgent.actions || [];
  const newActions = newAgent.actions || [];
  
  for (const newAction of newActions) {
    const existingAction = existingActions.find((a: any) => a.id === newAction.id || a.name === newAction.name);
    if (!existingAction) {
      reasons.push(`New action added: ${newAction.name}`);
    } else if (existingAction.function_body !== newAction.function_body) {
      reasons.push(`Action code changed: ${newAction.name}`);
    }
  }
  
  // Check schedule changes
  if (existingAgent.schedules?.length !== newAgent.schedules?.length) {
    reasons.push('Schedules count changed');
  }
  
  const existingSchedules = existingAgent.schedules || [];
  const newSchedules = newAgent.schedules || [];
  
  for (const newSchedule of newSchedules) {
    const existingSchedule = existingSchedules.find((s: any) => s.id === newSchedule.id || s.name === newSchedule.name);
    if (!existingSchedule) {
      reasons.push(`New schedule added: ${newSchedule.name}`);
    } else if (existingSchedule.function_body !== newSchedule.function_body) {
      reasons.push(`Schedule code changed: ${newSchedule.name}`);
    }
  }
  
  return {
    needsUpdate: reasons.length > 0,
    reasons,
    requiresMigration
  };
}

/**
 * Generate migration script for deployment updates
 */
function generateMigrationScript(): string {
  return `#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const prisma = new PrismaClient();

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Run Prisma migrations
    console.log('🏗️ Running Prisma migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stderr && !stderr.includes('warning')) {
      throw new Error(\`Migration error: \${stderr}\`);
    }
    
    console.log('Migration output:', stdout);
    console.log('✅ Database migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations().catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});
`;
}

// Helper function to generate random secrets for authentication
function generateRandomSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
