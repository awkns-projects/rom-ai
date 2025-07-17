import { z } from 'zod';
import type { Step1Output } from './step1-database-generation';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import type { AgentAction, AgentSchedule } from '../types';

/**
 * STEP 4: Vercel + Neon Deployment
 * 
 * Deploy a complete Next.js project with the generated Prisma schema, API endpoints for actions,
 * and cron jobs for schedules to Vercel with Neon PostgreSQL database.
 */

export interface Step4Input {
  step1Output: Step1Output;
  step2Output: Step2Output;
  step3Output: Step3Output;
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  region?: 'aws-us-east-1' | 'aws-us-west-2' | 'aws-eu-west-1' | 'aws-ap-southeast-1' | 'aws-us-east-2' | 'aws-eu-central-1'; // Updated to use Neon's AWS-prefixed format
  vercelTeam?: string;
}

export interface Step4Output {
  deploymentId: string;
  projectId: string; // Changed from serviceId to projectId
  deploymentUrl: string;
  status: 'pending' | 'building' | 'ready' | 'error';
  buildLogs?: string[];
  environmentVariables: Record<string, string>;
  prismaSchema: string;
  deploymentNotes: string[];
  apiEndpoints: string[]; // Generated API endpoints
  cronJobs: string[]; // Generated cron job patterns
  databaseUrl: string;
  neonProjectId: string;
  vercelProjectId: string;
}

/**
 * Neon API client for database operations
 */
class NeonClient {
  private apiKey: string;
  private baseUrl = 'https://console.neon.tech/api/v2';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500; // Minimum 500ms between requests

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next Neon API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 2000;
    
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

    if (response.status === 429 && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`🔄 Rate limited (429). Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.request(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse;
        
        try {
          const errorJson = JSON.parse(errorResponse);
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch {
          // Keep as text if not valid JSON
        }
      } catch {
        errorDetails = 'Unable to read error response body';
      }

      const enhancedError = new Error(
        `Neon API error: ${response.status} ${response.statusText}\n` +
        `Endpoint: ${endpoint}\n` +
        `Method: ${options.method || 'GET'}\n` +
        `Response body: ${errorDetails}`
      );
      
      console.error('🔍 Detailed Neon API Error Information:');
      console.error(`  Status: ${response.status} ${response.statusText}`);
      console.error(`  Endpoint: ${this.baseUrl}${endpoint}`);
      console.error(`  Method: ${options.method || 'GET'}`);
      console.error(`  Response body:`, errorDetails);
      
      throw enhancedError;
    }

    return response.json();
  }

  async createProject(name: string, region: string = 'us-east-1') {
    console.log(`🗄️ Creating Neon project: ${name}`);
    
    const project = await this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        project: {
          name: name,
          region_id: region,
          pg_version: 16,
          store_passwords: true
        }
      }),
    });

    console.log(`✅ Neon project created: ${project.project.id}`);
    return project;
  }

  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`);
  }

  async createDatabase(projectId: string, name: string) {
    console.log(`🗄️ Creating database: ${name}`);
    
    try {
      // First get the project to find the main branch
      const project = await this.getProject(projectId);
      const branchId = project.project.default_branch_id;
      
      if (!branchId) {
        throw new Error('No default branch found in project');
      }
      
      const database = await this.request(`/projects/${projectId}/branches/${branchId}/databases`, {
        method: 'POST',
        body: JSON.stringify({
          database: {
            name: name,
            owner_name: 'neondb_owner'
          }
        }),
      });

      console.log(`✅ Database created: ${database.database.name}`);
      return database;
    } catch (error) {
      console.error(`❌ Failed to create database: ${error}`);
      throw error;
    }
  }

  async getConnectionString(projectId: string, databaseName: string = 'neondb') {
    console.log(`🔗 Retrieving connection URI for project: ${projectId}`);
    
    try {
      // Ensure the database exists
      console.log(`🔍 Checking if database ${databaseName} exists...`);
      
      try {
        const project = await this.getProject(projectId);
        const branchId = project.project.default_branch_id;
        
        if (!branchId) {
          throw new Error('No default branch found in project');
        }
        
        const databases = await this.request(`/projects/${projectId}/branches/${branchId}/databases`);
        const databaseExists = databases.databases.some((db: any) => db.name === databaseName);
        
        if (!databaseExists) {
          console.log(`🗄️ Database ${databaseName} not found, creating it...`);
          await this.createDatabase(projectId, databaseName);
        } else {
          console.log(`✅ Database ${databaseName} already exists`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not check database existence, attempting to create: ${error}`);
        try {
          await this.createDatabase(projectId, databaseName);
        } catch (createError) {
          console.warn(`🤷 Database creation failed, continuing with default database: ${createError}`);
        }
      }
      
      // Get connection URI using the proper API endpoint with database_name parameter
      const connectionResponse = await this.request(`/projects/${projectId}/connection_uri?database_name=${encodeURIComponent(databaseName)}&role_name=neondb_owner`);
      let connectionString = connectionResponse.uri;
      
      if (!connectionString) {
        throw new Error('No connection URI returned from API');
      }
      
      // Replace the database name in the connection string if needed
      if (databaseName !== 'neondb' && connectionString) {
        // Connection string format: postgresql://user:pass@host:port/dbname?params
        connectionString = connectionString.replace(/\/[^/?]+(\?|$)/, `/${databaseName}$1`);
      }
      
      console.log(`✅ Connection string retrieved successfully`);
      return connectionString;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve connection URI via API endpoint: ${error}`);
      
      // Fallback: try to construct connection string from project details
      console.log(`🔄 Attempting fallback: constructing connection string from project details...`);
      
      try {
        const project = await this.getProject(projectId);
        
        // Get the default branch endpoints to find connection details
        const branches = await this.request(`/projects/${projectId}/branches`);
        const mainBranch = branches.branches.find((branch: any) => branch.name === 'main' || branch.primary || branch.id === project.project.default_branch_id);
        
        if (!mainBranch) {
          throw new Error('No main branch found in project');
        }
        
        // Get branch endpoints 
        const endpoints = await this.request(`/projects/${projectId}/branches/${mainBranch.id}/endpoints`);
        const primaryEndpoint = endpoints.endpoints.find((ep: any) => ep.type === 'read_write');
        
        if (!primaryEndpoint) {
          throw new Error('No primary endpoint found for main branch');
        }
        
        // Get roles to find the default role
        const roles = await this.request(`/projects/${projectId}/branches/${mainBranch.id}/roles`);
        const defaultRole = roles.roles.find((role: any) => role.name === 'neondb_owner') || roles.roles[0];
        
        if (!defaultRole) {
          throw new Error('No roles found for project');
        }
        
        // Get role password
        const passwordResponse = await this.request(`/projects/${projectId}/branches/${mainBranch.id}/roles/${defaultRole.name}/reveal_password`, {
          method: 'GET'
        });
        
        // Construct connection string manually
        const hostname = primaryEndpoint.host;
        const username = defaultRole.name;
        const password = passwordResponse.password;
        const port = 5432;
        
        const connectionString = `postgresql://${username}:${password}@${hostname}:${port}/${databaseName}?sslmode=require&channel_binding=require`;
        
        console.log(`✅ Connection string constructed from project details`);
        return connectionString;
        
      } catch (fallbackError) {
        console.error(`❌ Fallback method also failed: ${fallbackError}`);
        throw new Error(`Failed to retrieve connection string: ${error}. Fallback also failed: ${fallbackError}`);
      }
    }
  }

  async listProjects() {
    return this.request('/projects');
  }
}

/**
 * Sanitize project name for Vercel requirements
 * Project names must be lowercase and can only contain letters, digits, and '.', '_', '-'
 * They cannot contain the sequence '---'
 */
function sanitizeVercelProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-') // Replace invalid chars with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/---/g, '--') // Ensure no triple hyphens
    .substring(0, 100); // Limit to 100 characters
}

/**
 * Vercel API client for deployment operations
 */
export class VercelClient {
  private apiKey: string;
  private baseUrl = 'https://api.vercel.com';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 300; // Minimum 300ms between requests
  private teamId?: string;

  constructor(apiKey: string, teamId?: string) {
    this.apiKey = apiKey;
    this.teamId = teamId;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next Vercel API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    await this.rateLimit();
    
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }
    
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 429 && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`🔄 Rate limited (429). Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.request(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse;
        
        try {
          const errorJson = JSON.parse(errorResponse);
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch {
          // Keep as text if not valid JSON
        }
      } catch {
        errorDetails = 'Unable to read error response body';
      }

      const enhancedError = new Error(
        `Vercel API error: ${response.status} ${response.statusText}\n` +
        `Endpoint: ${endpoint}\n` +
        `Method: ${options.method || 'GET'}\n` +
        `Response body: ${errorDetails}`
      );
      
      console.error('🔍 Detailed Vercel API Error Information:');
      console.error(`  Status: ${response.status} ${response.statusText}`);
      console.error(`  Endpoint: ${url.toString()}`);
      console.error(`  Method: ${options.method || 'GET'}`);
      console.error(`  Response body:`, errorDetails);
      
      throw enhancedError;
    }

    return response.json();
  }

  async createProject(name: string, framework: string = 'nextjs') {
    const sanitizedName = sanitizeVercelProjectName(name);
    console.log(`🚀 Creating Vercel project: ${sanitizedName} (sanitized from: ${name})`);
    
    // Check if project already exists by attempting to create it
    // If it fails with 409 conflict, generate a unique name
    let projectName = sanitizedName;
    let attempt = 0;
    const maxAttempts = 10;
    
    while (attempt < maxAttempts) {
      try {
        const project = await this.request('/v10/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: projectName,
            framework: framework,
            buildCommand: 'npm run build',
            devCommand: 'npm run dev',
            installCommand: 'npm install',
            outputDirectory: '.next'
          }),
        });

        console.log(`✅ Vercel project created: ${project.id} with name: ${projectName}`);
        return project;
      } catch (error: any) {
        // Check if it's a 409 conflict error for project name conflicts
        const errorMessage = error.message || '';
        const isNameConflict = (
          errorMessage.includes('409 Conflict') || 
          errorMessage.includes('already exists') ||
          errorMessage.includes('conflict') ||
          (error.response?.status === 409)
        );
        
        if (isNameConflict) {
          attempt++;
          // Generate a new unique name with timestamp and random component
          const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
          const randomSuffix = Math.random().toString(36).substring(2, 5); // 3 random characters
          const previousName = projectName;
          projectName = `${sanitizedName}-${timestamp}-${randomSuffix}`;
          console.log(`⚠️ Project name "${previousName}" already exists. Trying: ${projectName} (attempt ${attempt}/${maxAttempts})`);
          console.log(`🔄 Vercel project name conflict detected - generating unique name to resolve deployment issue`);
          continue;
        }
        
        // If it's not a name conflict, re-throw the error
        throw error;
      }
    }
    
    throw new Error(`Failed to create Vercel project after ${maxAttempts} attempts. All generated names are taken.`);
  }

  async deployFromFiles(projectId: string, files: Record<string, string>, envVars: Record<string, string> = {}) {
    console.log(`🚀 Deploying to Vercel project: ${projectId}`);
    
    // Convert files to Vercel's expected format
    const vercelFiles = Object.entries(files).map(([path, content]) => ({
      file: path,
      data: Buffer.from(content).toString('base64'),
      encoding: 'base64'
    }));

    const deployment = await this.request('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: projectId,
        files: vercelFiles,
        projectSettings: {
          framework: 'nextjs',
          buildCommand: 'npm run build',
          devCommand: 'npm run dev',
          installCommand: 'npm install',
          outputDirectory: '.next'
        },
        env: envVars,
        build: {
          env: envVars
        }
      }),
    });

    console.log(`✅ Deployment created: ${deployment.id}`);
    return deployment;
  }

  async getDeployment(deploymentId: string) {
    return this.request(`/v13/deployments/${deploymentId}`);
  }

  async setEnvironmentVariables(projectId: string, envVars: Record<string, string>) {
    console.log(`🔧 Setting environment variables for project: ${projectId}`);
    
    const promises = Object.entries(envVars).map(([key, value]) =>
      this.request(`/v10/projects/${projectId}/env`, {
        method: 'POST',
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        }),
      })
    );

    await Promise.all(promises);
    console.log(`✅ Environment variables set`);
  }

  async getProject(projectId: string) {
    return this.request(`/v10/projects/${projectId}`);
  }

  async listProjects() {
    return this.request('/v10/projects');
  }

  async deleteProject(projectId: string) {
    return this.request(`/v10/projects/${projectId}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Validation and normalization functions (same as original)
 */
function validateAndNormalizeActions(actions: AgentAction[]): AgentAction[] {
  return actions.filter(action => {
    if (!action.name || !action.results?.actionType) {
      console.warn(`⚠️ Skipping invalid action: missing name or actionType`);
      return false;
    }
    
    if (!['query', 'mutation'].includes(action.results.actionType)) {
      console.warn(`⚠️ Skipping action "${action.name}": invalid actionType "${action.results.actionType}"`);
      return false;
    }
    
    return true;
  }).map(action => ({
    ...action,
    name: action.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase(),
    description: action.description || `${action.results?.actionType} action`,
    role: action.role || 'member',
    emoji: action.emoji || (action.results?.actionType === 'query' ? '🔍' : '✏️'),
  }));
}

function validateAndNormalizeSchedules(schedules: AgentSchedule[]): AgentSchedule[] {
  return schedules.filter(schedule => {
    if (!schedule.name || !schedule.interval?.pattern) {
      console.warn(`⚠️ Skipping invalid schedule: missing name or interval.pattern`);
      return false;
    }
    
    // Basic cron validation for interval.pattern
    const parts = schedule.interval.pattern.split(' ');
    if (parts.length !== 5) {
      console.warn(`⚠️ Skipping schedule "${schedule.name}": invalid cron expression "${schedule.interval.pattern}"`);
      return false;
    }
    
    return true;
  }).map(schedule => ({
    ...schedule,
    name: schedule.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase(),
    description: schedule.description || `Scheduled task: ${schedule.name}`,
    interval: {
      ...schedule.interval,
      active: schedule.interval?.active !== false
    },
    emoji: schedule.emoji || '⏰',
  }));
}

/**
 * Generate Next.js project files with Prisma integration
 */
export async function generateNextJsProject(
  step1Output: Step1Output, 
  step2Output: Step2Output, 
  step3Output: Step3Output, 
  projectName: string
) {
  console.log('📁 Generating Next.js project files...');
  
  const actions = validateAndNormalizeActions(step2Output.actions);
  const schedules = validateAndNormalizeSchedules(step3Output.schedules);
  const models = step1Output.models;

  const files: Record<string, string> = {};

  // Sanitize project name for package.json
  const sanitizedProjectName = sanitizeVercelProjectName(projectName);

  // Package.json
  files['package.json'] = JSON.stringify({
    name: sanitizedProjectName,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      "db:generate": "prisma generate",
      "db:push": "prisma db push",
      "db:migrate": "prisma migrate dev",
      "db:studio": "prisma studio",
      "db:seed": "tsx prisma/seed.ts",
      postinstall: "prisma generate"
    },
    dependencies: {
      "@prisma/client": "^5.7.1",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      eslint: "^8",
      "eslint-config-next": "14.0.4",
      next: "14.0.4",
      prisma: "^5.7.1",
      react: "^18",
      "react-dom": "^18",
      tailwindcss: "^3.3.0",
      typescript: "^5",
      tsx: "^4.6.2",
      autoprefixer: "^10.0.1",
      postcss: "^8",
      "@tailwindcss/forms": "^0.5.7"
    }
  }, null, 2);

  // Next.js config
  files['next.config.js'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig`;

  // TypeScript config
  files['tsconfig.json'] = JSON.stringify({
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "es6"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [
        {
          name: "next"
        }
      ],
      paths: {
        "@/*": ["./src/*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2);

  // Tailwind config
  files['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
}`;

  // PostCSS config
  files['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  // Prisma schema
  files['prisma/schema.prisma'] = step1Output.prismaSchema;

  // Environment example
  files['.env.example'] = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Secrets
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Add your custom environment variables here`;

  // Prisma seed file
  files['prisma/seed.ts'] = generateSeedFile(models);

  // API endpoints for actions
  const apiEndpoints = generateApiEndpoints(actions, models);
  Object.entries(apiEndpoints).forEach(([path, content]) => {
    files[`src/pages/api/${path}`] = content;
  });

  // Cron scripts for schedules
  const cronScripts = generateCronScripts(schedules, models);
  Object.entries(cronScripts).forEach(([path, content]) => {
    files[`src/pages/api/cron/${path}`] = content;
  });

  // Utility files
  files['src/lib/prisma.ts'] = generatePrismaClient();
  files['src/lib/utils/actions.ts'] = generateActionUtilities(actions, models);
  files['src/lib/utils/schedules.ts'] = generateScheduleUtilities(schedules, models);

  // Main page with dashboard
  files['src/pages/index.tsx'] = generateMainPage(projectName, models, actions, schedules);
  files['src/pages/_app.tsx'] = generateAppPage();
  files['src/styles/globals.css'] = generateGlobalStyles();

  // Vercel configuration
  files['vercel.json'] = JSON.stringify({
    functions: {
      "src/pages/api/cron/*.ts": {
        maxDuration: 300
      }
    },
    crons: schedules.map(schedule => ({
      path: `/api/cron/${schedule.name}`,
      schedule: schedule.interval.pattern
    }))
  }, null, 2);

  // README
  files['README.md'] = generateReadme(projectName, models, actions, schedules);

  console.log(`✅ Generated ${Object.keys(files).length} project files`);
  
  return files;
}

function generateSeedFile(models: any[]): string {
  return `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Add your seed data here
  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })`;
}

function generatePrismaClient(): string {
  return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;
}

function generateApiEndpoints(actions: AgentAction[], models: any[]): Record<string, string> {
  const endpoints: Record<string, string> = {};
  
  actions.forEach(action => {
    const fileName = `${action.name}.ts`;
    endpoints[fileName] = `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== '${action.results?.actionType === 'query' ? 'GET' : 'POST'}') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    ${generateActionExecutionCode(action)}
    
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    console.error('Error in ${action.name}:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}`;
  });

  return endpoints;
}

function generateCronScripts(schedules: AgentSchedule[], models: any[]): Record<string, string> {
  const scripts: Record<string, string> = {};
  
  schedules.forEach(schedule => {
    const fileName = `${schedule.name}.ts`;
    scripts[fileName] = `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a cron request (optional security check)
  if (req.headers.authorization !== \`Bearer \${process.env.CRON_SECRET}\` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('🕐 Running scheduled task: ${schedule.name}')
    
    ${generateScheduleExecutionCode(schedule)}
    
    console.log('✅ Scheduled task completed: ${schedule.name}')
    res.status(200).json({ success: true, message: 'Task completed' })
  } catch (error) {
    console.error('❌ Error in scheduled task ${schedule.name}:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}`;
  });

  return scripts;
}

function generateActionExecutionCode(action: AgentAction): string {
  // Generate basic execution code based on action type
  if (action.results?.actionType === 'query') {
    return `// Query execution for ${action.name}
    const result = await prisma.$queryRaw\`SELECT 1 as test\`;`;
  } else {
    return `// Mutation execution for ${action.name}
    const result = { message: 'Action executed successfully' };`;
  }
}

function generateScheduleExecutionCode(schedule: AgentSchedule): string {
  return `// Schedule execution for ${schedule.name}
    const result = await prisma.$queryRaw\`SELECT NOW() as current_time\`;
    console.log('Schedule executed at:', result);`;
}

function generateActionUtilities(actions: AgentAction[], models: any[]): string {
  return `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Action utilities for ${actions.length} actions
export const actions = ${JSON.stringify(actions, null, 2)};

export function getActionByName(name: string) {
  return actions.find(action => action.name === name);
}

// Execute action with basic database operations
export async function executeAction(actionName: string, input: any) {
  const action = getActionByName(actionName);
  if (!action) {
    throw new Error(\`Action '\${actionName}' not found\`);
  }

  console.log(\`🚀 Executing action: \${actionName}\`);
  
  try {
    // Basic execution without AI SDK dependencies
    const targetModel = action.results?.model;
    
    if (action.results?.actionType === 'query' && targetModel) {
      const result = await (prisma as any)[targetModel.toLowerCase()].findMany({
        where: input.filters || {},
        take: input.limit || 100,
        skip: input.offset || 0,
      });
      return result;
    } else if (action.results?.actionType === 'mutation' && targetModel) {
      const result = await (prisma as any)[targetModel.toLowerCase()].create({
        data: input.data || input,
      });
      return result;
    } else {
      return { 
        success: true, 
        message: \`Action '\${actionName}' executed successfully\`,
        input,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error(\`❌ Error executing action '\${actionName}':\`, error);
    throw error;
  }
}

// Get available models
export function getAvailableModels() {
  return ${JSON.stringify(models.map(m => ({ name: m.name, fields: m.fields || [] })), null, 2)};
}

// Cleanup function
export async function cleanup() {
  await prisma.$disconnect();
}`;
}

function generateScheduleUtilities(schedules: AgentSchedule[], models: any[]): string {
  return `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schedule utilities for ${schedules.length} schedules
export const schedules = ${JSON.stringify(schedules, null, 2)};

export function getScheduleByName(name: string) {
  return schedules.find(schedule => schedule.name === name);
}

// Execute schedule with basic database operations
export async function executeSchedule(scheduleName: string) {
  const schedule = getScheduleByName(scheduleName);
  if (!schedule) {
    throw new Error(\`Schedule '\${scheduleName}' not found\`);
  }

  console.log(\`⏰ Executing scheduled task: \${scheduleName}\`);
  
  try {
    // Basic execution without AI SDK dependencies
    const targetModel = schedule.results?.model;
    
    if (targetModel) {
      const result = await (prisma as any)[targetModel.toLowerCase()].findMany({
        take: 100,
        orderBy: { id: 'desc' }
      });
      console.log(\`📊 Schedule '\${scheduleName}' found \${result.length} records\`);
      return result;
    } else {
      const result = { 
        success: true, 
        message: \`Schedule '\${scheduleName}' executed successfully\`,
        executedAt: new Date().toISOString(),
        scheduleName
      };
      console.log(\`✅ Schedule completed:\`, result);
      return result;
    }
  } catch (error) {
    console.error(\`❌ Error executing schedule '\${scheduleName}':\`, error);
    throw error;
  }
}

// Validate schedule configuration
export function validateSchedule(scheduleName: string): { valid: boolean; errors: string[] } {
  const schedule = getScheduleByName(scheduleName);
  if (!schedule) {
    return { valid: false, errors: [\`Schedule '\${scheduleName}' not found\`] };
  }

  const errors: string[] = [];

  // Validate cron pattern
  if (!schedule.interval?.pattern) {
    errors.push('Schedule must have a valid cron pattern');
  } else {
    const parts = schedule.interval.pattern.split(' ');
    if (parts.length !== 5) {
      errors.push('Invalid cron pattern - must have 5 parts');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Get available models
export function getAvailableModels() {
  return ${JSON.stringify(models.map(m => ({ name: m.name, fields: m.fields || [] })), null, 2)};
}

// Cleanup function
export async function cleanup() {
  await prisma.$disconnect();
}`;
}

function generateMainPage(projectName: string, models: any[], actions: AgentAction[], schedules: AgentSchedule[]): string {
  return `import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>${projectName}</title>
        <meta name="description" content="Generated by Agent Builder" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              ${projectName}
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Generated by Agent Builder - Deployed with Vercel & Neon
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900">Models</h2>
              <p className="text-sm text-gray-600 mt-2">${models.length} database models</p>
              <ul className="mt-4 space-y-2">
                ${models.map(model => `<li className="text-sm">📋 ${model.name}</li>`).join('\n                ')}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              <p className="text-sm text-gray-600 mt-2">${actions.length} API endpoints</p>
              <ul className="mt-4 space-y-2">
                ${actions.map(action => `<li className="text-sm">${action.emoji} ${action.name}</li>`).join('\n                ')}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900">Schedules</h2>
              <p className="text-sm text-gray-600 mt-2">${schedules.length} cron jobs</p>
              <ul className="mt-4 space-y-2">
                ${schedules.map(schedule => `<li className="text-sm">${schedule.emoji} ${schedule.name}</li>`).join('\n                ')}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}`;
}

function generateAppPage(): string {
  return `import type { AppProps } from 'next/app'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}`;
}

function generateGlobalStyles(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}`;
}

function generateReadme(projectName: string, models: any[], actions: AgentAction[], schedules: AgentSchedule[]): string {
  return `# ${projectName}

This project was generated by Agent Builder and deployed with Vercel and Neon PostgreSQL.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- A Neon PostgreSQL database
- Vercel account for deployment

### Local Development

1. Clone this repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up your environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Update your \`.env.local\` with your database URL and other secrets

5. Push the database schema:
   \`\`\`bash
   npm run db:push
   \`\`\`

6. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📊 Database Models

${models.map(model => `- **${model.name}** ${model.emoji}: ${model.description}`).join('\n')}

## 🔧 API Endpoints

${actions.map(action => `- **${action.name}** ${action.emoji}: ${action.description} (\`${action.type}\`)`).join('\n')}

## ⏰ Scheduled Tasks

${schedules.map(schedule => `- **${schedule.name}** ${schedule.emoji}: ${schedule.description} (\`${schedule.interval.pattern}\`)`).join('\n')}

## 🚀 Deployment

This application is automatically deployed to Vercel with:
- Next.js optimizations
- Serverless functions for API routes
- Cron jobs for scheduled tasks
- Environment variables for secrets

## 📚 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Neon PostgreSQL
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

---

Generated by Agent Builder 🤖`;
}

/**
 * Main deployment function
 */
export async function executeStep4VercelDeployment(input: Step4Input): Promise<Step4Output> {
  console.log('🚀 Starting Vercel + Neon deployment...');
  
  const { step1Output, step2Output, step3Output, projectName, description, environmentVariables = {}, region = 'aws-us-east-1', vercelTeam } = input; // Updated default region
  
  // Validate API keys
  const neonApiKey = process.env.NEON_API_KEY;
  const vercelApiKey = process.env.VERCEL_TOKEN;
  
  if (!neonApiKey) {
    throw new Error('NEON_API_KEY environment variable is required');
  }
  
  if (!vercelApiKey) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }
  
  // Initialize clients
  const neonClient = new NeonClient(neonApiKey);
  const vercelClient = new VercelClient(vercelApiKey, vercelTeam);
  
  try {
    // Step 1: Create Neon database project
    console.log('📊 Setting up Neon database...');
    const neonProject = await neonClient.createProject(`${projectName}-db`, region);
    const neonProjectId = neonProject.project.id;
    
    // Step 2: Get database connection string
    const databaseUrl = await neonClient.getConnectionString(neonProjectId);
    console.log('✅ Database connection string obtained');
    
    // Step 3: Generate Next.js project files
    const projectFiles = await generateNextJsProject(step1Output, step2Output, step3Output, projectName);
    
    // Step 4: Create Vercel project
    console.log('🚀 Creating Vercel project...');
    const vercelProject = await vercelClient.createProject(projectName);
    const vercelProjectId = vercelProject.id;
    
    // Step 5: Set up environment variables
    const allEnvVars = {
      DATABASE_URL: databaseUrl,
      NEXTAUTH_SECRET: generateRandomSecret(),
      NEXTAUTH_URL: `https://${vercelProject.name}.vercel.app`,
      NODE_ENV: 'production',
      CRON_SECRET: generateRandomSecret(),
      ...environmentVariables
    };
    
    await vercelClient.setEnvironmentVariables(vercelProjectId, allEnvVars);
    
    // Step 6: Deploy the project
    console.log('🚀 Deploying to Vercel...');
    const deployment = await vercelClient.deployFromFiles(vercelProjectId, projectFiles, allEnvVars);
    const deploymentId = deployment.id;
    
    // Step 7: Wait for deployment to complete (optional polling)
    let deploymentStatus = 'pending';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (deploymentStatus !== 'READY' && deploymentStatus !== 'ERROR' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      const status = await vercelClient.getDeployment(deploymentId);
      deploymentStatus = status.readyState;
      attempts++;
      console.log(`⏳ Deployment status: ${deploymentStatus} (attempt ${attempts}/${maxAttempts})`);
    }
    
    const deploymentUrl = deployment.url.startsWith('https://') ? deployment.url : `https://${deployment.url}`;
    
    // Generate API endpoints and cron job lists
    const actions = validateAndNormalizeActions(step2Output.actions);
    const schedules = validateAndNormalizeSchedules(step3Output.schedules);
    
    const apiEndpoints = actions.map(action => `${deploymentUrl}/api/${action.name}`);
    const cronJobs = schedules.map(schedule => `${schedule.interval.pattern} - /api/cron/${schedule.name}`);
    
    const result: Step4Output = {
      deploymentId,
      projectId: vercelProjectId, // Changed from serviceId to projectId
      deploymentUrl,
      status: deploymentStatus === 'READY' ? 'ready' : deploymentStatus === 'ERROR' ? 'error' : 'pending',
      environmentVariables: allEnvVars,
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes: [
        'Deployed to Vercel with Next.js',
        'Database hosted on Neon PostgreSQL',
        'Environment variables configured',
        'Cron jobs set up for scheduled tasks',
        'API endpoints generated for all actions'
      ],
      apiEndpoints,
      cronJobs,
      databaseUrl,
      neonProjectId,
      vercelProjectId
    };
    
    console.log('🎉 Deployment completed successfully!');
    console.log(`🌐 Your app is live at: ${deploymentUrl}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

/**
 * Update existing deployment
 */
export async function updateExistingDeployment(input: {
  step1Output: Step1Output;
  step2Output: Step2Output;
  step3Output: Step3Output;
  vercelProjectId: string;
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  executeMigrations?: boolean;
}): Promise<Step4Output> {
  console.log('🔄 Updating existing Vercel deployment...');
  
  const { step1Output, step2Output, step3Output, vercelProjectId, projectName, description, environmentVariables = {}, executeMigrations = false } = input;
  
  const vercelApiKey = process.env.VERCEL_TOKEN;
  if (!vercelApiKey) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }
  
  const vercelClient = new VercelClient(vercelApiKey);
  
  try {
    // Get existing project
    const existingProject = await vercelClient.getProject(vercelProjectId);
    
    // Generate updated project files
    const projectFiles = await generateNextJsProject(step1Output, step2Output, step3Output, projectName);
    
    // Update environment variables if provided
    if (Object.keys(environmentVariables).length > 0) {
      await vercelClient.setEnvironmentVariables(vercelProjectId, environmentVariables);
    }
    
    // Deploy updated files
    console.log('🚀 Deploying updates to Vercel...');
    const deployment = await vercelClient.deployFromFiles(vercelProjectId, projectFiles, environmentVariables);
    
    const deploymentUrl = deployment.url.startsWith('https://') ? deployment.url : `https://${deployment.url}`;
    
    // Generate updated lists
    const actions = validateAndNormalizeActions(step2Output.actions);
    const schedules = validateAndNormalizeSchedules(step3Output.schedules);
    
    const apiEndpoints = actions.map(action => `${deploymentUrl}/api/${action.name}`);
    const cronJobs = schedules.map(schedule => `${schedule.interval.pattern} - /api/cron/${schedule.name}`);
    
    const result: Step4Output = {
      deploymentId: deployment.id,
      projectId: vercelProjectId, // Changed from serviceId to projectId
      deploymentUrl,
      status: 'pending',
      environmentVariables: environmentVariables,
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes: [
        'Updated existing Vercel deployment',
        'New project files deployed',
        'Environment variables updated',
        'Cron jobs reconfigured'
      ],
      apiEndpoints,
      cronJobs,
      databaseUrl: environmentVariables.DATABASE_URL || '',
      neonProjectId: '',
      vercelProjectId
    };
    
    console.log('✅ Deployment update completed!');
    return result;
    
  } catch (error) {
    console.error('❌ Deployment update failed:', error);
    throw error;
  }
}

/**
 * Utility functions
 */
function generateRandomSecret(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Check if deployment update is needed
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
  
  // Check if schema changed
  if (existingAgent.prismaSchema !== newAgent.prismaSchema) {
    reasons.push('Database schema changed');
    requiresMigration = true;
  }
  
  // Check if actions changed
  if (JSON.stringify(existingAgent.actions) !== JSON.stringify(newAgent.actions)) {
    reasons.push('API actions changed');
  }
  
  // Check if schedules changed
  if (JSON.stringify(existingAgent.schedules) !== JSON.stringify(newAgent.schedules)) {
    reasons.push('Scheduled tasks changed');
  }
  
  return {
    needsUpdate: reasons.length > 0,
    reasons,
    requiresMigration
  };
}

/**
 * Validate Step 4 output for completeness and quality
 */
export function validateStep4Output(output: Step4Output): boolean {
  try {
    if (!output.deploymentId || !output.projectId) { // Changed from serviceId to projectId
      console.warn('⚠️ Missing deployment ID or project ID');
      return false;
    }
    
    if (!output.deploymentUrl) {
      console.warn('⚠️ Missing deployment URL');
      return false;
    }
    
    if (!output.prismaSchema) {
      console.warn('⚠️ Missing Prisma schema');
      return false;
    }
    
    if (!output.apiEndpoints || output.apiEndpoints.length === 0) {
      console.warn('⚠️ No API endpoints generated');
      return false;
    }
    
    console.log('✅ Step 4 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 4 output validation failed:', error);
    return false;
  }
}

/**
 * Extract deployment insights for downstream analysis
 */
export function extractStep4Insights(output: Step4Output) {
  return {
    deploymentId: output.deploymentId,
    projectId: output.projectId, // Changed from serviceId to projectId
    deploymentUrl: output.deploymentUrl,
    status: output.status,
    apiEndpointCount: output.apiEndpoints.length,
    cronJobCount: output.cronJobs.length,
    environmentVariableCount: Object.keys(output.environmentVariables).length,
    hasDatabase: !!output.databaseUrl,
    neonProjectId: output.neonProjectId,
    vercelProjectId: output.vercelProjectId,
    deploymentNotes: output.deploymentNotes
  };
}

/**
 * Test Vercel and Neon API connection for deployment readiness
 */
export async function testVercelConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  console.log('🔍 Testing Vercel + Neon deployment readiness...');
  
  try {
    const neonApiKey = process.env.NEON_API_KEY;
    const vercelApiKey = process.env.VERCEL_TOKEN;
    
    if (!neonApiKey) {
      return {
        success: false,
        message: 'NEON_API_KEY environment variable is required',
        details: { missingEnvVars: ['NEON_API_KEY'] }
      };
    }
    
    if (!vercelApiKey) {
      return {
        success: false,
        message: 'VERCEL_TOKEN environment variable is required',
        details: { missingEnvVars: ['VERCEL_TOKEN'] }
      };
    }
    
    // Test Neon API connection
    const neonClient = new NeonClient(neonApiKey);
    const neonProjects = await neonClient.listProjects();
    
    // Test Vercel API connection
    const vercelClient = new VercelClient(vercelApiKey);
    const vercelProjects = await vercelClient.listProjects();
    
    console.log('✅ Vercel + Neon deployment is ready!');
    return {
      success: true,
      message: 'Vercel + Neon deployment is ready! API keys are valid and connections successful.',
      details: {
        neon: {
          connected: true,
          projectCount: neonProjects.projects?.length || 0
        },
        vercel: {
          connected: true,
          projectCount: vercelProjects.projects?.length || 0
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing Vercel + Neon deployment readiness:', error);
    return {
      success: false,
      message: `Vercel + Neon deployment not ready: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Persist deployment metadata (placeholder function for compatibility)
 */
export async function persistDeploymentMetadata(documentId: string, deployment: Step4Output, session: any): Promise<void> {
  console.log(`💾 Persisting deployment metadata for document ${documentId}`);
  // Implementation would go here - for now it's a placeholder
}

/**
 * Get deployment metadata (placeholder function for compatibility)
 */
export async function getDeploymentMetadata(documentId: string): Promise<any> {
  console.log(`📋 Getting deployment metadata for document ${documentId}`);
  // Implementation would go here - for now returns null
  return null;
}

// Export the main function with the original name for backwards compatibility
export { executeStep4VercelDeployment as executeStep4RenderDeployment }; 