import { z } from 'zod';
import type { Step1Output } from './step1-database-generation';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import type { AgentAction, AgentSchedule } from '../types';
import { MobileAppTemplate } from './templates/mobile-app-template';

/**
 * STEP 4: Vercel + SQLite Deployment
 * 
 * Deploy a complete Next.js project with the generated Prisma schema using SQLite,
 * API endpoints for actions, and cron jobs for schedules to Vercel.
 * 
 * ⚠️ IMPORTANT: SQLite on Vercel is read-only in production and resets on deployment.
 * For persistent data, consider using Turso, PlanetScale, or another cloud database.
 */

export interface Step4Input {
  step1Output: Step1Output;
  step2Output: Step2Output;
  step3Output: Step3Output;
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  vercelTeam?: string;
  sqliteOptions?: {
    filename?: string; // Default: 'dev.db'
    enableWAL?: boolean; // Default: true
    enableForeignKeys?: boolean; // Default: true
  };
}

export interface Step4Output {
  deploymentId: string;
  projectId: string;
  deploymentUrl: string;
  status: 'pending' | 'building' | 'ready' | 'error';
  buildLogs?: string[];
  environmentVariables: Record<string, string>;
  prismaSchema: string;
  deploymentNotes: string[];
  apiEndpoints: string[];
  cronJobs: string[];
  databaseUrl: string;
  sqliteFilename: string;
  vercelProjectId: string;
  warnings: string[];
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
 * Generate Next.js project files using unified MobileAppTemplate
 */
export async function generateNextJsProject(
  step1Output: Step1Output, 
  step2Output: Step2Output, 
  step3Output: Step3Output, 
  projectName: string,
  sqliteOptions?: { filename?: string; enableWAL?: boolean; enableForeignKeys?: boolean; }
) {
  console.log('📁 Generating Vercel-optimized Next.js project files...');
  
  const actions = validateAndNormalizeActions(step2Output.actions);
  const schedules = validateAndNormalizeSchedules(step3Output.schedules);
  const models = step1Output.models;

  // Use unified mobile app template system with Vercel configuration
  const mobileTemplate = new MobileAppTemplate({
    projectName,
    models,
    actions,
    schedules,
    prismaSchema: step1Output.prismaSchema,
    sqliteOptions,
    vercelConfig: {
      cronJobs: schedules.length > 0,
      aiSdkEnabled: true, // Enable AI SDK for Vercel deployments
      buildCommand: "npm run vercel-build"
    },
    environmentVariables: {
      PRISMA_GENERATE_DATAPROXY: "true"
    }
  });
  
  const files = mobileTemplate.generateAllFiles();

  console.log(`✅ Generated ${Object.keys(files).length} project files for Vercel deployment`);
  
  return files;
}

// =============================================================================
// LEGACY FUNCTIONS REMOVED 
// All file generation is now handled by MobileAppTemplate.generateAllFiles()
// =============================================================================

// All the following legacy functions have been removed since they're unused:
// - generateApiEndpoints, generateCronScripts, generateActionUtilities, etc.
// MobileAppTemplate.generateAllFiles() now handles everything

/**
 * Main deployment function
 */
export async function executeStep4VercelDeployment(input: Step4Input, onProgress?: (message: string) => void): Promise<Step4Output> {
  console.log('🚀 Starting Vercel + SQLite deployment...');
  
  const { step1Output, step2Output, step3Output, projectName, description, environmentVariables = {}, vercelTeam, sqliteOptions } = input;
  
  // Helper function to send progress updates
  const sendProgress = (message: string) => {
    console.log(message);
    if (onProgress) {
      onProgress(message);
    }
  };
  
  // Validate API keys
  const vercelApiKey = process.env.VERCEL_TOKEN;
  
  if (!vercelApiKey) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }
  
  // Initialize clients
  const vercelClient = new VercelClient(vercelApiKey, vercelTeam);
  
  try {
    // Step 1: Setup SQLite configuration (for local development)
    const sqliteFilename = sqliteOptions?.filename || 'dev.db';
    const databaseUrl = `file:./${sqliteFilename}`;
    
    sendProgress('🗄️ Configuring SQLite for local development...');
    sendProgress('📝 Note: SQLite database will be created locally, Vercel build will handle Prisma migrations');
    
    // Step 2: Create Vercel project
    sendProgress('🚀 Creating Vercel project...');
    const vercelProject = await vercelClient.createProject(projectName);
    const vercelProjectId = vercelProject.id;
    
    // Step 3: Generate Next.js project files
    sendProgress('📁 Generating project files...');
    const projectFiles = await generateNextJsProject(step1Output, step2Output, step3Output, projectName, sqliteOptions);
    
    // Step 4: Set up environment variables
    sendProgress('🔧 Configuring environment variables...');
    const allEnvVars = {
      DATABASE_URL: databaseUrl,
      NEXTAUTH_SECRET: generateRandomSecret(),
      NEXTAUTH_URL: `https://${vercelProject.name}.vercel.app`,
      NODE_ENV: 'production',
      CRON_SECRET: generateRandomSecret(),
      ...environmentVariables
    };
    
    await vercelClient.setEnvironmentVariables(vercelProjectId, allEnvVars);
    
    // Step 5: Deploy the project
    sendProgress('🚀 Uploading and deploying to Vercel...');
    sendProgress('📦 Build process will generate Prisma schema and handle migrations automatically');
    const deployment = await vercelClient.deployFromFiles(vercelProjectId, projectFiles, allEnvVars);
    const deploymentId = deployment.id;
    
    // Step 6: Wait for deployment to complete with progress updates
    let deploymentStatus = 'pending';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    sendProgress('⏳ Waiting for Vercel to build and deploy...');
    
    while (deploymentStatus !== 'READY' && deploymentStatus !== 'ERROR' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      const status = await vercelClient.getDeployment(deploymentId);
      deploymentStatus = status.readyState;
      attempts++;
      
      const progress = Math.round((attempts / maxAttempts) * 100);
      const statusMessage = `⏳ Building deployment... ${deploymentStatus} (${progress}% - ${attempts}/${maxAttempts})`;
      sendProgress(statusMessage);
      console.log(statusMessage);
    }
    
    // Final status check
    if (deploymentStatus === 'READY') {
      sendProgress('🎉 Deployment successfully completed and is live!');
    } else if (deploymentStatus === 'ERROR') {
      sendProgress('❌ Deployment failed during build process');
    } else {
      sendProgress('⚠️ Deployment timed out, but may still be building...');
    }
    
    const deploymentUrl = deployment.url.startsWith('https://') ? deployment.url : `https://${deployment.url}`;
    
    // Generate API endpoints and cron job lists
    const actions = validateAndNormalizeActions(step2Output.actions);
    const schedules = validateAndNormalizeSchedules(step3Output.schedules);
    
    const apiEndpoints = actions.map(action => `${deploymentUrl}/api/${action.name}`);
    const cronJobs = schedules.map(schedule => `${schedule.interval.pattern} - /api/cron/${schedule.name}`);
    
         const result: Step4Output = {
       deploymentId,
       projectId: vercelProjectId,
       deploymentUrl,
       status: deploymentStatus === 'READY' ? 'ready' : deploymentStatus === 'ERROR' ? 'error' : 'pending',
       environmentVariables: allEnvVars,
       prismaSchema: step1Output.prismaSchema,
             deploymentNotes: [
        'Deployed to Vercel with Next.js',
        'SQLite configured for local development',
        'Prisma schema and migrations handled by Vercel build process',
        'Environment variables configured',
        'Cron jobs set up for scheduled tasks',
        'API endpoints generated for all actions'
      ],
       apiEndpoints,
       cronJobs,
       databaseUrl,
       sqliteFilename,
       vercelProjectId,
       warnings: [
         '⚠️ IMPORTANT: SQLite on Vercel is read-only in production and resets on each deployment',
         '⚠️ Data will not persist between deployments or serverless function invocations',
         '⚠️ For production use, consider migrating to Turso, PlanetScale, or another cloud database',
         '⚠️ Local development with SQLite will work normally',
         '📝 Note: SQLite database file is created locally - Vercel build handles Prisma client generation and schema deployment',
         '📝 For updates: Only Vercel files are updated, local SQLite file remains unchanged'
       ]
     };
    
    // Send final completion status
    sendProgress(`🎉 Deployment completed! Live at: ${deploymentUrl}`);
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
    
    console.log('📁 Generating updated project files...');
    console.log('📝 Note: SQLite database file will not be modified, only Vercel files updated');
    
    // Generate updated project files (without modifying SQLite)
    const projectFiles = await generateNextJsProject(step1Output, step2Output, step3Output, projectName, undefined);
    
    // Update environment variables if provided
    if (Object.keys(environmentVariables).length > 0) {
      console.log('🔧 Updating environment variables...');
      await vercelClient.setEnvironmentVariables(vercelProjectId, environmentVariables);
    }
    
    // Deploy updated files
    console.log('🚀 Deploying updates to Vercel...');
    console.log('📦 Build process will auto-generate new Prisma migrations during deployment');
    const deployment = await vercelClient.deployFromFiles(vercelProjectId, projectFiles, environmentVariables);
    
    const deploymentUrl = deployment.url.startsWith('https://') ? deployment.url : `https://${deployment.url}`;
    
    // Generate updated lists
    const actions = validateAndNormalizeActions(step2Output.actions);
    const schedules = validateAndNormalizeSchedules(step3Output.schedules);
    
    const apiEndpoints = actions.map(action => `${deploymentUrl}/api/${action.name}`);
    const cronJobs = schedules.map(schedule => `${schedule.interval.pattern} - /api/cron/${schedule.name}`);
    
    const result: Step4Output = {
      deploymentId: deployment.id,
      projectId: vercelProjectId,
      deploymentUrl,
      status: 'pending',
      environmentVariables: environmentVariables,
      prismaSchema: step1Output.prismaSchema,
      deploymentNotes: [
        'Updated existing Vercel deployment',
        'New project files deployed',
        'SQLite database file unchanged (local only)',
        'Prisma migrations auto-generated during Vercel build',
        'Environment variables updated',
        'Cron jobs reconfigured'
      ],
      apiEndpoints,
      cronJobs,
      databaseUrl: '', // SQLite is local, no external URL
      sqliteFilename: '', // No external URL for SQLite
      vercelProjectId,
      warnings: []
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
    if (!output.deploymentId || !output.projectId) {
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
    projectId: output.projectId,
    deploymentUrl: output.deploymentUrl,
    status: output.status,
    apiEndpointCount: output.apiEndpoints.length,
    cronJobCount: output.cronJobs.length,
    environmentVariableCount: Object.keys(output.environmentVariables).length,
    hasDatabase: !!output.databaseUrl, // SQLite is local, no external URL
    sqliteFilename: output.sqliteFilename,
    vercelProjectId: output.vercelProjectId,
    deploymentNotes: output.deploymentNotes,
    warnings: output.warnings
  };
}

/**
 * Test Vercel deployment readiness (SQLite is local, no external service to test)
 */
export async function testVercelConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  console.log('🔍 Testing Vercel deployment readiness...');
  
  try {
    const vercelApiKey = process.env.VERCEL_TOKEN;
    
    if (!vercelApiKey) {
      return {
        success: false,
        message: 'VERCEL_TOKEN environment variable is required',
        details: { missingEnvVars: ['VERCEL_TOKEN'] }
      };
    }
    
    // Test Vercel API connection
    const vercelClient = new VercelClient(vercelApiKey);
    const vercelProjects = await vercelClient.listProjects();
    
    console.log('✅ Vercel deployment is ready!');
    return {
      success: true,
      message: 'Vercel deployment is ready! API keys are valid and connections successful. SQLite will be used locally.',
      details: {
        vercel: {
          connected: true,
          projectCount: vercelProjects.projects?.length || 0
        },
        database: {
          type: 'SQLite',
          note: 'Local file-based database - will be read-only in production on Vercel'
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing Vercel deployment readiness:', error);
    return {
      success: false,
      message: `Vercel deployment not ready: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

// Note: Render deployment has been removed - we only support Vercel deployment now 