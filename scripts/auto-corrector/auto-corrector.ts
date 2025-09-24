#!/usr/bin/env tsx

/**
 * Auto-Corrector Script
 * 
 * This script automatically monitors Vercel projects for errors, analyzes them using AI,
 * and pushes corrected code back to the GitHub repository.
 * 
 * Prerequisites:
 * - Install dependencies: pnpm add simple-git axios openai node-cron
 * - Set up environment variables (see Environment Variables section below)
 * 
 * Usage:
 * - Run once (same name): npx tsx scripts/auto-corrector.ts --project PROJECT_NAME [--env PATH_TO_ENV_FILE]
 * - Run once (different names): npx tsx scripts/auto-corrector.ts --github-project GITHUB_PATH --vercel-project VERCEL_NAME [--env PATH_TO_ENV_FILE]
 * - Run for all projects: npx tsx scripts/auto-corrector.ts --all [--env PATH_TO_ENV_FILE]
 * - Start cron job: npx tsx scripts/auto-corrector.ts --cron [--env PATH_TO_ENV_FILE]
 * - Test mode: npx tsx scripts/auto-corrector.ts --test [--env PATH_TO_ENV_FILE]
 * - Dry run: Add --dry-run to any command to see what would be changed without applying fixes
 * - Custom env: npx tsx scripts/auto-corrector.ts --env ./custom.env --project PROJECT_NAME
 * 
 * Project Name Flexibility:
 * - Use --project when GitHub and Vercel names match
 * - Use --github-project and --vercel-project when they differ
 * - Configure PROJECT_MAPPINGS in env file for automatic resolution
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Define interfaces
interface VercelErrorLog {
  id: string;
  message: string;
  timestamp: string;
  function?: string;
  route?: string;
  stack?: string;
  source?: string;
}

interface CodeContext {
  route: string;
  actionFiles: { path: string; content: string }[];
  modelFiles: { path: string; content: string }[];
  errorDetails: VercelErrorLog;
}

interface AutoCorrectorConfig {
  githubToken: string;
  vercelApiToken: string;
  vercelTeamId: string;
  openaiApiKey: string;
  githubRepoUrl: string;
  localRepoPath: string;
  monorepoPath: string;
  projectMappings?: { [githubProjectPath: string]: string }; // GitHub path to Vercel project name mapping
}

interface ProjectInfo {
  name: string;
  path: string;
  isActive: boolean;
  vercelProjectName?: string; // Optional override for Vercel project name
  githubProjectPath?: string; // Optional override for GitHub project path
}

/**
 * GitHub Repository Manager
 * Handles cloning, pulling, and managing local repository state
 */
class GitHubPuller {
  private repoPath: string;
  private repoUrl: string;
  private githubToken: string;

  constructor(repoUrl: string, localPath: string, githubToken: string) {
    this.repoPath = localPath;
    this.repoUrl = repoUrl;
    this.githubToken = githubToken;
  }

  async pullRepository(): Promise<void> {
    try {
      console.log(`📥 Syncing repository to ${this.repoPath}...`);
      
      if (!fs.existsSync(this.repoPath)) {
        console.log('🔄 Cloning repository...');
        const authenticatedUrl = this.repoUrl.replace('https://', `https://${this.githubToken}@`);
        execSync(`git clone ${authenticatedUrl} ${this.repoPath}`, { stdio: 'inherit' });
      } else {
        console.log('🔄 Pulling latest changes...');
        execSync('git pull origin main', { cwd: this.repoPath, stdio: 'inherit' });
      }
      
      console.log('✅ Repository synced successfully');
    } catch (error) {
      console.error('❌ Failed to pull repository:', error);
      throw error;
    }
  }

  async getProjectCode(projectName: string): Promise<{ [filePath: string]: string }> {
    let projectPath: string;
    
    // Check if it's a monorepo structure or single project
    const potentialProjectPath = path.join(this.repoPath, projectName);
    
    if (fs.existsSync(potentialProjectPath) && fs.statSync(potentialProjectPath).isDirectory()) {
      // Monorepo structure - project has its own subdirectory
      projectPath = potentialProjectPath;
    } else {
      // Single project structure - the entire repo is the project
      console.log(`📁 Project '${projectName}' not found as subdirectory, treating repo as single project`);
      projectPath = this.repoPath;
      
      // Verify it's a valid project directory (has package.json or similar)
      const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
      const hasNextConfig = fs.existsSync(path.join(projectPath, 'next.config.js'));
      const hasSrcDir = fs.existsSync(path.join(projectPath, 'src'));
      
      if (!hasPackageJson && !hasNextConfig && !hasSrcDir) {
        throw new Error(`Project directory not found and repo doesn't appear to be a valid project: ${projectPath}`);
      }
    }

    return await this.readDirectoryRecursively(projectPath);
  }

  private async readDirectoryRecursively(dirPath: string): Promise<{ [filePath: string]: string }> {
    const files: { [filePath: string]: string } = {};
    
    const readDir = (currentPath: string, relativePath: string = '') => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Skip common directories that shouldn't be analyzed
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            readDir(itemPath, relativeItemPath);
          }
        } else if (stat.isFile()) {
          // Only read source code files
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md'].includes(ext)) {
            try {
              files[relativeItemPath] = fs.readFileSync(itemPath, 'utf8');
            } catch (error) {
              console.warn(`⚠️ Could not read file ${itemPath}:`, error);
            }
          }
        }
      }
    };

    readDir(dirPath);
    return files;
  }
}

/**
 * Vercel API Client
 * Fetches runtime logs and error data from Vercel using multiple approaches
 * 
 * This implementation tries multiple approaches in order of preference:
 * 1. Vercel CLI (`vercel logs`) - provides actual runtime logs including console.log outputs
 * 2. Monitoring API - provides aggregated function error metrics  
 * 3. Deployment events - provides build-time error logs as final fallback
 * 
 * Prerequisites for CLI access:
 * - Vercel CLI installed: `npm install -g vercel`
 * - CLI authenticated: `vercel login`
 */
class VercelLogRetriever {
  private apiToken: string;
  private teamId: string;
  private lastCheckTime: number;

  constructor(apiToken: string, teamId: string) {
    this.apiToken = apiToken;
    this.teamId = teamId;
    this.lastCheckTime = Date.now() - (24 * 60 * 60 * 1000); // Default to last 24 hours
  }

  async getErrorLogs(projectName: string): Promise<VercelErrorLog[]> {
    try {
      console.log(`📊 Fetching runtime logs and error data for project: ${projectName}`);
      
      // First, get the project info - handle both project names and project IDs
      let projectId = projectName;
      let projectResponse: Response;
      
      // If it looks like a project ID (starts with prj_), use it directly
      if (projectName.startsWith('prj_')) {
        projectResponse = await this.makeRequest(
          `https://api.vercel.com/v9/projects/${projectName}?teamId=${this.teamId}`
        );
      } else {
        // If it's a project name, search for it first
        const projectsResponse = await this.makeRequest(
          `https://api.vercel.com/v9/projects?teamId=${this.teamId}&search=${encodeURIComponent(projectName)}`
        );
        
        if (!projectsResponse.ok) {
          throw new Error(`Failed to search for project: ${projectName}`);
        }
        
        const projectsData = await projectsResponse.json();
        const project = projectsData.projects?.find((p: any) => p.name === projectName);
        
        if (!project) {
          throw new Error(`Project not found: ${projectName}`);
        }
        
        projectId = project.id;
        projectResponse = await this.makeRequest(
          `https://api.vercel.com/v9/projects/${projectId}?teamId=${this.teamId}`
        );
      }

      if (!projectResponse.ok) {
        const errorText = await projectResponse.text();
        console.error('Project response error:', {
          status: projectResponse.status,
          statusText: projectResponse.statusText,
          body: errorText
        });
        throw new Error(`Project not found or access denied: ${projectName} (${projectResponse.status})`);
      }

      // Try multiple approaches to get error data
      const errors: VercelErrorLog[] = [];
      
      try {
        await this.getFunctionErrors(projectId, errors);
      } catch (error) {
        console.warn(`⚠️ Could not fetch runtime logs:`, error);
      }

      // Fall back to deployment event logs if no errors found via CLI or Monitoring API
      if (errors.length === 0) {
        console.log(`📋 No runtime errors found, checking deployment event logs...`);
        await this.getDeploymentEventLogs(projectId, errors);
      }

      console.log(`📋 Found ${errors.length} potential error logs`);
      if (errors.length > 0) {
        console.log(`🎯 Error sources: ${[...new Set(errors.map(e => (e.source || 'unknown').split('-')[0]))].join(', ')}`);
      }
      return errors;
    } catch (error) {
      console.error('❌ Failed to retrieve Vercel logs:', error);
      throw error;
    }
  }

  /**
   * Use Vercel CLI to retrieve runtime logs
   * This provides access to actual runtime logs including console.log outputs
   */
  private async getRuntimeLogsViaCLI(projectId: string, errors: VercelErrorLog[]): Promise<void> {
    try {
      console.log(`📱 Attempting to fetch runtime logs via Vercel CLI...`);
      
      // First, get recent deployments to get deployment URLs
      const deploymentsResponse = await this.makeRequest(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${this.teamId}&limit=3`
      );

      if (!deploymentsResponse.ok) {
        throw new Error(`Failed to get deployments: ${deploymentsResponse.status}`);
      }

      const deployments = await deploymentsResponse.json();
      
      if (!deployments.deployments || deployments.deployments.length === 0) {
        console.log(`📋 No recent deployments found for logs`);
        return;
      }

      // Try to get logs from the most recent deployment
      const latestDeployment = deployments.deployments[0];
      const deploymentUrl = latestDeployment.url;
      
      console.log(`🔍 Fetching runtime logs for deployment: ${deploymentUrl}`);
      
      // Execute vercel logs command
      const { execSync } = require('child_process');
      
      try {
        // Run vercel logs with JSON output (if supported) or parse text output
        const logOutput = execSync(`vercel logs ${deploymentUrl} --json --since=24h`, {
          encoding: 'utf8',
          timeout: 30000, // 30 second timeout
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        
        // Parse JSON logs if available
        const logLines = logOutput.trim().split('\n');
        let foundErrors = 0;
        
        for (const line of logLines) {
          try {
            const logEntry = JSON.parse(line);
            
            // Look for error-like log entries
            if (this.isErrorLog(logEntry)) {
              errors.push({
                id: `cli-${logEntry.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                message: logEntry.message || logEntry.text || 'Runtime error detected',
                timestamp: logEntry.timestamp || new Date().toISOString(),
                function: logEntry.source || logEntry.requestId || 'runtime',
                route: this.extractRoute(logEntry.message || ''),
                stack: logEntry.stack || '',
                source: `vercel-cli-${deploymentUrl}`
              });
              foundErrors++;
            }
          } catch (parseError) {
            // If JSON parsing fails, try to parse as text
            if (this.isErrorLogText(line)) {
              errors.push({
                id: `cli-text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                message: line.trim(),
                timestamp: new Date().toISOString(),
                function: 'runtime',
                route: this.extractRoute(line),
                stack: '',
                source: `vercel-cli-${deploymentUrl}`
              });
              foundErrors++;
            }
          }
        }
        
        if (foundErrors > 0) {
          console.log(`🎯 Found ${foundErrors} runtime errors via Vercel CLI`);
        } else {
          console.log(`✅ No runtime errors found in recent logs`);
        }
        
      } catch (cliError: any) {
        // Try without --json flag as fallback
        console.log(`⚠️ JSON logs not supported, trying text format...`);
        
        try {
          const textOutput = execSync(`vercel logs ${deploymentUrl}`, {
            encoding: 'utf8',
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024
          });
          
          const logLines = textOutput.trim().split('\n');
          let foundErrors = 0;
          
          for (const line of logLines) {
            if (this.isErrorLogText(line)) {
              errors.push({
                id: `cli-text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                message: line.trim(),
                timestamp: new Date().toISOString(),
                function: 'runtime',
                route: this.extractRoute(line),
                stack: '',
                source: `vercel-cli-${deploymentUrl}`
              });
              foundErrors++;
            }
          }
          
          if (foundErrors > 0) {
            console.log(`🎯 Found ${foundErrors} runtime errors via Vercel CLI (text mode)`);
          } else {
            console.log(`✅ No runtime errors found in recent logs (text mode)`);
          }
          
        } catch (textError: any) {
          throw new Error(`Both JSON and text CLI approaches failed: ${textError.message}`);
        }
      }
      
    } catch (error: any) {
      if (error.message?.includes('command not found') || error.message?.includes('vercel')) {
        console.warn(`⚠️ Vercel CLI not found. Please install with: npm i -g vercel`);
      } else if (error.message?.includes('not authenticated')) {
        console.warn(`⚠️ Vercel CLI not authenticated. Please run: vercel login`);
      } else {
        console.warn(`⚠️ Could not fetch logs via Vercel CLI:`, error.message);
      }
      throw error; // Re-throw to allow fallback
    }
  }

  /**
   * Check if a log entry (JSON format) indicates an error
   */
  private isErrorLog(logEntry: any): boolean {
    if (!logEntry) return false;
    
    // Check log level
    if (logEntry.level === 'error' || logEntry.level === 'ERROR') return true;
    
    // Check message content
    const message = (logEntry.message || logEntry.text || '').toLowerCase();
    if (message.includes('error') || message.includes('failed') || message.includes('exception')) {
      return true;
    }
    
    // Check status codes
    if (logEntry.status && logEntry.status >= 400) return true;
    
    // Check for stack traces
    if (logEntry.stack && logEntry.stack.length > 0) return true;
    
    return false;
  }

  /**
   * Check if a log line (text format) indicates an error
   */
  private isErrorLogText(line: string): boolean {
    if (!line || line.trim().length === 0) return false;
    
    const lowerLine = line.toLowerCase();
    
    // Check for error keywords
    const errorKeywords = [
      'error:', 'error -', '[error]',
      'exception:', 'exception -', '[exception]',
      'failed:', 'failed -', '[failed]',
      'uncaught', 'unhandled',
      'stack trace', 'traceback',
      'http 4', 'http 5', // HTTP 4xx, 5xx errors
      'internal server error',
      'bad request', 'not found', 'forbidden',
      'service unavailable', 'gateway timeout'
    ];
    
    return errorKeywords.some(keyword => lowerLine.includes(keyword));
  }

  /**
   * Attempt to get function errors from Vercel's Monitoring API
   * This provides aggregated metrics but not individual runtime logs
   */
  private async getFunctionErrors(projectId: string, errors: VercelErrorLog[]): Promise<void> {
    try {
      // First try to get runtime logs via Vercel CLI
      await this.getRuntimeLogsViaCLI(projectId, errors);
      
      // If we found errors via CLI, return early
      if (errors.length > 0) {
        console.log(`🎯 Successfully retrieved runtime logs via Vercel CLI`);
        return;
      }
      
      // Fall back to Monitoring API for aggregated metrics
      console.log(`📊 No CLI errors found, trying Monitoring API...`);
      
      // Try the legacy Monitoring API for function error rates
      const endTime = Date.now();
      const startTime = endTime - (24 * 60 * 60 * 1000); // Last 24 hours
      
      // Attempt to query function error rates via Monitoring API
      const monitoringResponse = await this.makeRequest(
        `https://api.vercel.com/v2/monitoring?teamId=${this.teamId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: projectId,
            visualize: 'Function Invocations',
            where: `status >= 400`,
            groupBy: ['source_path', 'status'],
            from: startTime,
            to: endTime,
            limit: 50
          })
        }
      );

      if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json();
        
        if (monitoringData.data && monitoringData.data.length > 0) {
          console.log(`📈 Found ${monitoringData.data.length} function error metrics via Monitoring API`);
          
          for (const dataPoint of monitoringData.data) {
            const { source_path, status, count } = dataPoint;
            
            errors.push({
              id: `mon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              message: `Function returned HTTP ${status} (${count} occurrences)`,
              timestamp: new Date().toISOString(),
              function: source_path || 'unknown',
              route: this.extractRoute(source_path || ''),
              stack: '',
              source: 'monitoring-api'
            });
          }
          return;
        }
      } else {
        console.log(`📊 Monitoring API not accessible (${monitoringResponse.status})`);
      }
      
      console.log(`📊 No function error metrics found via Monitoring API`);
    } catch (error) {
      console.warn(`⚠️ Could not access runtime logs or Monitoring API:`, error);
      // Don't throw - fall back to deployment events
    }
  }

  /**
   * Fallback method to get error-like events from deployment logs
   * This gets build-time errors, not runtime errors
   */
  private async getDeploymentEventLogs(projectId: string, errors: VercelErrorLog[]): Promise<void> {
    try {
      // Get recent deployments as fallback
      const deploymentsResponse = await this.makeRequest(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${this.teamId}&limit=5`
      );

      if (!deploymentsResponse.ok) {
        const errorText = await deploymentsResponse.text();
        console.error('Deployments response error:', {
          status: deploymentsResponse.status,
          statusText: deploymentsResponse.statusText,
          body: errorText
        });
        throw new Error(`Failed to get deployments for project ${projectId}: ${deploymentsResponse.status}`);
      }

      const deployments = await deploymentsResponse.json();

      // Get logs for each recent deployment (these are build logs, not runtime logs)
      for (const deployment of deployments.deployments || []) {
        try {
          const logsResponse = await this.makeRequest(
            `https://api.vercel.com/v2/deployments/${deployment.uid}/events?teamId=${this.teamId}`
          );

          if (!logsResponse.ok) {
            console.warn(`⚠️ Could not fetch logs for deployment ${deployment.uid}: ${logsResponse.status}`);
            continue;
          }

          const logs = await logsResponse.json();
          
          // Filter for error logs (these are build-time errors)
          const errorLogs = logs.events?.filter((log: any) => 
            log.type === 'stderr' || 
            log.type === 'error' || 
            log.payload?.text.toLowerCase().includes('failed') ||
            (log.payload?.text && log.payload.text.toLowerCase().includes('error'))
          ) || [];

          for (const log of errorLogs) {
            errors.push({
              id: `${deployment.uid}-${log.id || Date.now()}`,
              message: log.payload?.text || log.text || 'Unknown build error',
              timestamp: log.created || deployment.createdAt,
              function: log.payload?.source || 'build-process',
              route: this.extractRoute(log.payload?.text || log.text || ''),
              stack: this.extractStack(log.payload?.text || log.text || ''),
              source: deployment.uid
            });
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch logs for deployment ${deployment.uid}:`, error);
        }
      }

      if (errors.length > 0) {
        console.log(`📋 Found ${errors.length} build-time error logs as fallback`);
        console.log(`⚠️ Note: These are build errors, not runtime errors. For runtime errors, use Vercel Log Drains`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch deployment event logs:`, error);
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  private extractRoute(logText: string): string {
    // Try to extract route from error message
    const routePatterns = [
      /(?:GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\[\]]+)/,
      /route:\s*([\/\w\-\[\]]+)/i,
      /path:\s*([\/\w\-\[\]]+)/i
    ];

    for (const pattern of routePatterns) {
      const match = logText.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'unknown';
  }

  private extractStack(logText: string): string {
    // Extract stack trace if present
    const lines = logText.split('\n');
    const stackLines = lines.filter(line => 
      line.trim().startsWith('at ') || 
      line.includes('.ts:') || 
      line.includes('.js:')
    );
    
    return stackLines.join('\n');
  }

  setLastCheckTime(timestamp: number): void {
    this.lastCheckTime = timestamp;
  }

  async testConnection(): Promise<void> {
    try {
      console.log('🔧 Testing Vercel API connection...');
      
      // Test basic API access
      const userResponse = await this.makeRequest(
        `https://api.vercel.com/v2/user?teamId=${this.teamId}`
      );
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User API response error:', {
          status: userResponse.status,
          statusText: userResponse.statusText,
          body: errorText
        });
        throw new Error(`Failed to authenticate with Vercel API: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log(`✅ Successfully connected to Vercel API as: ${userData.user?.name || userData.user?.username || 'Unknown'}`);
      
      // Test team access
      const teamResponse = await this.makeRequest(
        `https://api.vercel.com/v2/teams/${this.teamId}`
      );
      
      if (!teamResponse.ok) {
        const errorText = await teamResponse.text();
        console.error('Team API response error:', {
          status: teamResponse.status,
          statusText: teamResponse.statusText,
          body: errorText
        });
        throw new Error(`Failed to access team: ${teamResponse.status}`);
      }
      
      const teamData = await teamResponse.json();
      console.log(`✅ Successfully accessed team: ${teamData.name || teamData.slug || this.teamId}`);
      
      // List projects to verify access
      const projectsResponse = await this.makeRequest(
        `https://api.vercel.com/v9/projects?teamId=${this.teamId}&limit=5`
      );
      
      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text();
        console.error('Projects API response error:', {
          status: projectsResponse.status,
          statusText: projectsResponse.statusText,
          body: errorText
        });
        throw new Error(`Failed to list projects: ${projectsResponse.status}`);
      }
      
      const projectsData = await projectsResponse.json();
      const projectCount = projectsData.projects?.length || 0;
      console.log(`✅ Found ${projectCount} accessible projects`);
      
      if (projectCount > 0) {
        console.log('📋 Sample projects:');
        projectsData.projects.slice(0, 3).forEach((project: any) => {
          console.log(`  - ${project.name} (${project.id})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Vercel API connection test failed:', error);
      throw error;
    }
  }
}

/**
 * Code Analysis Engine
 * Analyzes errors and prepares context for AI correction
 */
class CodeAnalyzer {
  async identifyRelatedCode(
    errorLog: VercelErrorLog, 
    projectCode: { [filePath: string]: string }
  ): Promise<CodeContext> {
    console.log(`🔍 Analyzing error: ${errorLog.message.substring(0, 100)}...`);
    
    const route = errorLog.route || 'unknown';
    const actionFiles = this.findActionFiles(route, projectCode);
    const modelFiles = this.findModelFiles(route, errorLog.message, projectCode);

    return {
      route,
      actionFiles,
      modelFiles,
      errorDetails: errorLog
    };
  }

  async prepareAIContext(context: CodeContext): Promise<string> {
    const prompt = `# Error Analysis Request

## Error Details
- **Error ID**: ${context.errorDetails.id}
- **Message**: ${context.errorDetails.message}
- **Route**: ${context.route}
- **Timestamp**: ${context.errorDetails.timestamp}
- **Function**: ${context.errorDetails.function || 'N/A'}

## Stack Trace
\`\`\`
${context.errorDetails.stack || 'No stack trace available'}
\`\`\`

## Related Action Files
${context.actionFiles.map(file => `
### ${file.path}
\`\`\`typescript
${file.content}
\`\`\`
`).join('\n')}

## Related Model/Schema Files
${context.modelFiles.map(file => `
### ${file.path}
\`\`\`typescript
${file.content}
\`\`\`
`).join('\n')}

## Instructions
Please analyze the error and provide corrected code. Focus on:
1. Identifying the root cause of the error
2. Providing corrected code for the problematic files
3. Ensuring the fix addresses the specific error message
4. Maintaining code style and existing patterns

Return the corrected code in the following format:
\`\`\`json
{
  "analysis": "Brief explanation of the issue",
  "fixes": [
    {
      "file": "path/to/file.ts",
      "content": "corrected file content"
    }
  ]
}
\`\`\``;

    return prompt;
  }

  private findActionFiles(route: string, projectCode: { [filePath: string]: string }): { path: string; content: string }[] {
    const actionFiles: { path: string; content: string }[] = [];
    
    // Look for API routes and action files
    for (const [filePath, content] of Object.entries(projectCode)) {
      const isRelevant = (
        filePath.includes('api/') ||
        filePath.includes('actions/') ||
        filePath.includes('route.ts') ||
        filePath.includes('page.tsx') ||
        (route !== 'unknown' && filePath.includes(route.replace(/\[|\]/g, '')))
      );

      if (isRelevant) {
        actionFiles.push({ path: filePath, content });
      }
    }

    return actionFiles;
  }

  private findModelFiles(route: string, errorMessage: string, projectCode: { [filePath: string]: string }): { path: string; content: string }[] {
    const modelFiles: { path: string; content: string }[] = [];
    
    // Extract potential model names from error message
    const modelNames = this.extractModelNames(errorMessage);
    
    for (const [filePath, content] of Object.entries(projectCode)) {
      const isRelevant = (
        filePath.includes('schema') ||
        filePath.includes('model') ||
        filePath.includes('types') ||
        filePath.includes('db/') ||
        modelNames.some(name => filePath.includes(name) || content.includes(name))
      );

      if (isRelevant) {
        modelFiles.push({ path: filePath, content });
      }
    }

    return modelFiles;
  }

  private extractModelNames(errorMessage: string): string[] {
    const names: string[] = [];
    
    // Common patterns for model names in error messages
    const patterns = [
      /table\s+"(\w+)"/gi,
      /model\s+"(\w+)"/gi,
      /entity\s+"(\w+)"/gi,
      /"(\w+)"\s+does not exist/gi,
      /cannot find\s+"(\w+)"/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(errorMessage)) !== null) {
        names.push(match[1]);
      }
    }

    return names;
  }
}

/**
 * AI-Powered Code Corrector
 * Uses OpenAI to generate corrected code
 */
class CodeCorrector {
  private openaiApiKey: string;

  constructor(apiKey: string) {
    this.openaiApiKey = apiKey;
  }

  async correctCode(prompt: string): Promise<{ analysis: string; fixes: { file: string; content: string }[] }> {
    try {
      console.log('🤖 Generating code corrections with AI...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert TypeScript/Next.js developer. Analyze error logs and provide corrected code. Return your response as a JSON object with 'analysis' and 'fixes' fields."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        // Fallback parsing
        try {
          return JSON.parse(content);
        } catch {
          throw new Error('Could not parse AI response as JSON');
        }
      }
    } catch (error) {
      console.error('❌ Failed to generate code correction:', error);
      throw error;
    }
  }

  async applyCorrections(
    fixes: { file: string; content: string }[], 
    repoPath: string
  ): Promise<string[]> {
    const correctedFiles: string[] = [];
    
    for (const fix of fixes) {
      try {
        const fullPath = path.join(repoPath, fix.file);
        const dir = path.dirname(fullPath);
        
        // Ensure directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write the corrected code
        fs.writeFileSync(fullPath, fix.content, 'utf8');
        correctedFiles.push(fix.file);
        
        console.log(`✅ Applied correction to: ${fix.file}`);
      } catch (error) {
        console.error(`❌ Failed to apply correction to ${fix.file}:`, error);
      }
    }
    
    return correctedFiles;
  }
}

/**
 * GitHub Push Manager
 * Handles committing and pushing corrected code
 */
class GitHubPusher {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async pushCorrections(
    correctedFiles: string[], 
    errorId: string,
    analysis: string
  ): Promise<void> {
    try {
      console.log('📤 Pushing corrections to GitHub...');
      
      // Stage the corrected files
      for (const file of correctedFiles) {
        execSync(`git add "${file}"`, { cwd: this.repoPath });
      }
      
      // Create descriptive commit message
      const timestamp = new Date().toISOString();
      const commitMessage = `Auto-correct: Fix error ${errorId}

Analysis: ${analysis}

Files modified:
${correctedFiles.map(file => `- ${file}`).join('\n')}

Timestamp: ${timestamp}`;
      
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: this.repoPath });
      
      // Push to main branch
      execSync('git push origin main', { cwd: this.repoPath });
      
      console.log(`✅ Successfully pushed corrections for error ${errorId}`);
    } catch (error) {
      console.error('❌ Failed to push corrections:', error);
      throw error;
    }
  }

  async createBranch(branchName: string): Promise<void> {
    try {
      execSync(`git checkout -b "${branchName}"`, { cwd: this.repoPath });
      console.log(`✅ Created branch: ${branchName}`);
    } catch (error) {
      console.error(`❌ Failed to create branch ${branchName}:`, error);
      throw error;
    }
  }
}

/**
 * Main Auto-Corrector Orchestrator
 * Coordinates all components to perform the complete auto-correction workflow
 */
class AutoCorrectorCronJob {
  private githubPuller: GitHubPuller;
  private vercelLogRetriever: VercelLogRetriever;
  private codeAnalyzer: CodeAnalyzer;
  private codeCorrector: CodeCorrector;
  private githubPusher: GitHubPusher;
  private config: AutoCorrectorConfig;

  constructor(config: AutoCorrectorConfig) {
    this.config = config;
    this.githubPuller = new GitHubPuller(
      config.githubRepoUrl, 
      config.localRepoPath, 
      config.githubToken
    );
    this.vercelLogRetriever = new VercelLogRetriever(
      config.vercelApiToken, 
      config.vercelTeamId
    );
    this.codeAnalyzer = new CodeAnalyzer();
    this.codeCorrector = new CodeCorrector(config.openaiApiKey);
    this.githubPusher = new GitHubPusher(config.localRepoPath);
  }

  async execute(
    githubProjectPath: string, 
    vercelProjectName?: string, 
    dryRun: boolean = false
  ): Promise<void> {
    // Resolve actual project names
    const actualVercelProject = vercelProjectName || 
      this.config.projectMappings?.[githubProjectPath] || 
      githubProjectPath;
    
    try {
      console.log(`\n🚀 Starting auto-correction:`);
      console.log(`  GitHub Project Path: ${githubProjectPath}`);
      console.log(`  Vercel Project Name: ${actualVercelProject}`);
      console.log('='.repeat(60));
      
      // Step 1: Pull latest code
      await this.githubPuller.pullRepository();
      const projectCode = await this.githubPuller.getProjectCode(githubProjectPath);
      
      // Step 2: Get error logs
      const errorLogs = await this.vercelLogRetriever.getErrorLogs(actualVercelProject);
      
      if (errorLogs.length === 0) {
        console.log('✅ No errors found, skipping correction');
        return;
      }
      
      // console.log(`📋 Processing ${errorLogs.length} error(s)...`);
      
      // // Step 3-5: Process each error
      // let correctionCount = 0;
      // for (const errorLog of errorLogs) {
      //   try {
      //     const corrected = await this.processError(errorLog, projectCode, dryRun);
      //     if (corrected) correctionCount++;
      //   } catch (error) {
      //     console.error(`❌ Failed to process error ${errorLog.id}:`, error);
      //   }
      // }
      
      // console.log(`\n✅ Completed auto-correction for GitHub: ${githubProjectPath}, Vercel: ${actualVercelProject}`);
      // console.log(`📊 Corrections applied: ${correctionCount}/${errorLogs.length}`);
    } catch (error) {
      console.error(`❌ Auto-correction failed for GitHub: ${githubProjectPath}, Vercel: ${actualVercelProject}:`, error);
      throw error;
    }
  }

  private async processError(
    errorLog: VercelErrorLog, 
    projectCode: { [filePath: string]: string },
    dryRun: boolean = false
  ): Promise<boolean> {
    try {
      console.log(`\n🔧 Processing error: ${errorLog.id}`);
      
      // Step 3: Analyze and prepare context
      const context = await this.codeAnalyzer.identifyRelatedCode(errorLog, projectCode);
      const aiPrompt = await this.codeAnalyzer.prepareAIContext(context);
      
      // Step 4: Generate corrections
      const correction = await this.codeCorrector.correctCode(aiPrompt);
      
      console.log(`📝 Analysis: ${correction.analysis}`);
      
      if (dryRun) {
        console.log('🔍 DRY RUN - Would apply the following fixes:');
        correction.fixes.forEach(fix => {
          console.log(`  - ${fix.file}`);
        });
        return true;
      }
      
      // Step 5: Apply and push corrections
      const correctedFiles = await this.codeCorrector.applyCorrections(
        correction.fixes, 
        this.config.localRepoPath
      );
      
      if (correctedFiles.length > 0) {
        await this.githubPusher.pushCorrections(
          correctedFiles, 
          errorLog.id,
          correction.analysis
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Failed to process error ${errorLog.id}:`, error);
      return false;
    }
  }

  async getAllProjects(): Promise<ProjectInfo[]> {
    // This would integrate with your project management system
    // For now, return mock data or read from a configuration file
    return [
      { 
        name: 'rom-ai-agent001-instance001', 
        path: 'agent-001', 
        isActive: true,
        vercelProjectName: 'my-production-app', // Different Vercel name
        githubProjectPath: 'agent-001' // Explicit GitHub path
      },
      { 
        name: 'rom-ai-agent002-instance001', 
        path: 'agent-002', 
        isActive: true,
        vercelProjectName: 'staging-app-v2', // Different Vercel name
        githubProjectPath: 'agent-002' // Explicit GitHub path
      },
      {
        name: 'shared-components',
        path: 'shared',
        isActive: true
        // No explicit overrides - will use 'shared' for both GitHub and Vercel
      }
    ];
  }
}

/**
 * Configuration Management
 */
function loadConfig(envFilePath?: string): AutoCorrectorConfig {
  // Try to load from specified env file or default to .env.local
  const defaultEnvPath = path.join(process.cwd(), '.env.local');
  const envPath = envFilePath || defaultEnvPath;
  
  try {
    if (fs.existsSync(envPath)) {
      console.log(`📄 Loading environment from: ${envPath}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars: { [key: string]: string } = {};
      
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=', 2);
        if (key && value) {
          envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      });
      
      // Set environment variables
      Object.assign(process.env, envVars);
    } else {
      if (envFilePath) {
        console.error(`❌ Specified env file not found: ${envPath}`);
        process.exit(1);
      } else {
        console.warn('⚠️ No .env.local file found, using system environment variables');
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not load env file: ${envPath}`, error);
  }

  // Parse project mappings if provided
  let projectMappings: { [githubProjectPath: string]: string } | undefined;
  if (process.env.PROJECT_MAPPINGS) {
    try {
      projectMappings = JSON.parse(process.env.PROJECT_MAPPINGS);
    } catch (error) {
      console.warn('⚠️ Invalid PROJECT_MAPPINGS JSON format, ignoring:', error);
    }
  }

  const config: AutoCorrectorConfig = {
    githubToken: process.env.GITHUB_TOKEN || '',
    vercelApiToken: process.env.VERCEL_API_TOKEN || '',
    vercelTeamId: process.env.VERCEL_TEAM_ID || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    githubRepoUrl: process.env.GITHUB_REPO_URL || 'https://github.com/your-org/rom-ai-monorepo.git',
    localRepoPath: process.env.LOCAL_REPO_PATH || path.join(process.cwd(), 'temp-repo'),
    monorepoPath: process.env.MONOREPO_PATH || 'agents',
    projectMappings
  };

  // Validate required configuration
  const required = ['githubToken', 'vercelApiToken', 'vercelTeamId', 'openaiApiKey'];
  const missing = required.filter(key => !config[key as keyof AutoCorrectorConfig]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key.toUpperCase()}`));
    console.error('\nPlease set these in your .env.local file, custom env file (--env), or environment.');
    console.error('Example: npx tsx scripts/auto-corrector.ts --env ./my-config.env --project my-project');
    process.exit(1);
  }

  return config;
}

/**
 * Command Line Interface
 */
async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runCronJob(config: AutoCorrectorConfig): Promise<void> {
  // Install node-cron dynamically if not available
  try {
    const cron = require('node-cron');
    
    console.log('🕐 Starting auto-corrector cron job (every 15 minutes)...');
    
    cron.schedule('*/15 * * * *', async () => {
      console.log(`\n⏰ Cron job triggered at ${new Date().toISOString()}`);
      
      const autoCorrector = new AutoCorrectorCronJob(config);
      const projects = await autoCorrector.getAllProjects();
      
      for (const project of projects.filter(p => p.isActive)) {
        try {
          await autoCorrector.execute(
            project.githubProjectPath || project.path, 
            project.vercelProjectName || project.name
          );
        } catch (error) {
          console.error(`❌ Error processing project ${project.name}:`, error);
        }
      }
    });
    
    console.log('✅ Cron job started. Press Ctrl+C to stop.');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping auto-corrector cron job...');
      process.exit(0);
    });
    
    // Prevent process from exiting
    setInterval(() => {}, 1000);
    
  } catch (error) {
    console.error('❌ node-cron not found. Please install it:');
    console.error('pnpm add node-cron @types/node-cron');
    process.exit(1);
  }
}

/**
 * Main Function
 */
async function main(): Promise<void> {
  console.log('🤖 Auto-Corrector Script v1.0');
  console.log('================================\n');

  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const projectFlag = args.findIndex(arg => arg === '--project');
  const githubProjectFlag = args.findIndex(arg => arg === '--github-project');
  const vercelProjectFlag = args.findIndex(arg => arg === '--vercel-project');
  const envFlag = args.findIndex(arg => arg === '--env');
  const allFlag = args.includes('--all');
  const cronFlag = args.includes('--cron');
  const testFlag = args.includes('--test');
  const dryRunFlag = args.includes('--dry-run');
  const helpFlag = args.includes('--help') || args.includes('-h');
  const testVercelFlag = args.includes('--test-vercel');
  
  // Get custom env file path if specified
  let envFilePath: string | undefined;
  if (envFlag >= 0 && envFlag + 1 < args.length) {
    envFilePath = args[envFlag + 1];
    // Convert relative paths to absolute paths
    if (!path.isAbsolute(envFilePath)) {
      envFilePath = path.resolve(process.cwd(), envFilePath);
    }
  }
  
  // Show help if requested
  if (helpFlag) {
    console.log('📖 Auto-Corrector Help');
    console.log('=======================\n');
    console.log('Usage: npx tsx scripts/auto-corrector.ts [OPTIONS]\n');
    console.log('Options:');
    console.log('  --project NAME            Process specific project (legacy, assumes same name for GitHub and Vercel)');
    console.log('  --github-project PATH     Specify GitHub project path');
    console.log('  --vercel-project NAME     Specify Vercel project name (use with --github-project)');
    console.log('  --all                     Process all active projects');
    console.log('  --cron                    Start cron job (runs every 15 minutes)');
    console.log('  --test                    Run in test mode');
    console.log('  --test-vercel             Test Vercel API connectivity and configuration');
    console.log('  --dry-run                 Show what would be changed without applying fixes');
    console.log('  --env PATH                Specify custom environment file (default: .env.local)');
    console.log('  --help, -h                Show this help message\n');
    console.log('Examples:');
    console.log('  npx tsx scripts/auto-corrector.ts --project my-project');
    console.log('  npx tsx scripts/auto-corrector.ts --github-project agent-001 --vercel-project my-vercel-app');
    console.log('  npx tsx scripts/auto-corrector.ts --env ./prod.env --all --dry-run');
    console.log('  npx tsx scripts/auto-corrector.ts --env ~/.config/auto-corrector.env --cron');
    return;
  }

  const config = loadConfig(envFilePath);
  
  const autoCorrector = new AutoCorrectorCronJob(config);

  if (cronFlag) {
    await runCronJob(config);
    return;
  }

  if (testFlag) {
    console.log('🧪 Running in test mode...');
    
    const testProject = 'test-for-ai-corrector';
    try {
      await autoCorrector.execute(testProject, undefined, true);
      console.log('✅ Test completed successfully');
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
    return;
  }

  if (testVercelFlag) {
    console.log('�� Testing Vercel API connectivity and configuration...');
    try {
      const vercelLogRetriever = new VercelLogRetriever(
        config.vercelApiToken,
        config.vercelTeamId
      );
      await vercelLogRetriever.testConnection();
      console.log('✅ Vercel API connection test successful!');
    } catch (error) {
      console.error('❌ Vercel API connection test failed:', error);
      process.exit(1);
    }
    return;
  }

  // Handle different project specification methods
  if (githubProjectFlag >= 0 && githubProjectFlag + 1 < args.length) {
    const githubProject = args[githubProjectFlag + 1];
    let vercelProject: string | undefined;
    
    if (vercelProjectFlag >= 0 && vercelProjectFlag + 1 < args.length) {
      vercelProject = args[vercelProjectFlag + 1];
    }
    
    console.log(`🎯 Processing project:`);
    console.log(`  GitHub: ${githubProject}`);
    console.log(`  Vercel: ${vercelProject || 'auto-resolved'}`);
    
    try {
      await autoCorrector.execute(githubProject, vercelProject, dryRunFlag);
      console.log('✅ Project processing completed');
    } catch (error) {
      console.error('❌ Project processing failed:', error);
      process.exit(1);
    }
    return;
  }

  if (projectFlag >= 0 && projectFlag + 1 < args.length) {
    const projectName = args[projectFlag + 1];
    console.log(`🎯 Processing single project (legacy mode): ${projectName}`);
    
    try {
      await autoCorrector.execute(projectName, undefined, dryRunFlag);
      console.log('✅ Single project processing completed');
    } catch (error) {
      console.error('❌ Single project processing failed:', error);
      process.exit(1);
    }
    return;
  }

  if (allFlag) {
    console.log('🌍 Processing all active projects...');
    
    try {
      const projects = await autoCorrector.getAllProjects();
      const activeProjects = projects.filter(p => p.isActive);
      
      console.log(`📋 Found ${activeProjects.length} active projects`);
      
      for (const project of activeProjects) {
        try {
          await autoCorrector.execute(
            project.githubProjectPath || project.path, 
            project.vercelProjectName || project.name, 
            dryRunFlag
          );
        } catch (error) {
          console.error(`❌ Error processing project ${project.name}:`, error);
        }
      }
      
      console.log('✅ All projects processing completed');
    } catch (error) {
      console.error('❌ All projects processing failed:', error);
      process.exit(1);
    }
    return;
  }

  // Interactive mode
  console.log('🎮 Interactive Mode');
  console.log('Choose an option:');
  console.log('1. Process specific project');
  console.log('2. Process all projects');
  console.log('3. Start cron job');
  console.log('4. Test mode');
  
  const choice = await promptUser('Enter your choice (1-4): ');
  
  switch (choice) {
    case '1':
      const githubProject = await promptUser('Enter GitHub project path: ');
      const vercelProject = await promptUser('Enter Vercel project name (optional, press enter to use same as GitHub): ');
      await autoCorrector.execute(githubProject, vercelProject || undefined, dryRunFlag);
      break;
      
    case '2':
      const projects = await autoCorrector.getAllProjects();
      for (const project of projects.filter(p => p.isActive)) {
        await autoCorrector.execute(
          project.githubProjectPath || project.path, 
          project.vercelProjectName || project.name, 
          dryRunFlag
        );
      }
      break;
      
    case '3':
      await runCronJob(config);
      break;
      
    case '4':
      await autoCorrector.execute('test-project', undefined, true);
      break;
      
    default:
      console.log('❌ Invalid choice');
      process.exit(1);
  }
}

// Export classes for testing
export {
  GitHubPuller,
  VercelLogRetriever,
  CodeAnalyzer,
  CodeCorrector,
  GitHubPusher,
  AutoCorrectorCronJob
};

// Run main function if script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
} 