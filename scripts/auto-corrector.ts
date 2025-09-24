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
 * - Run once: npx tsx scripts/auto-corrector.ts --project PROJECT_NAME
 * - Run for all projects: npx tsx scripts/auto-corrector.ts --all
 * - Start cron job: npx tsx scripts/auto-corrector.ts --cron
 * - Test mode: npx tsx scripts/auto-corrector.ts --test
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
}

interface ProjectInfo {
  name: string;
  path: string;
  isActive: boolean;
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
    const projectPath = path.join(this.repoPath, projectName);
    
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory not found: ${projectPath}`);
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
 * Fetches error logs and deployment information from Vercel
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
      console.log(`📊 Fetching error logs for project: ${projectName}`);
      
      // First, get the project info
      const projectResponse = await this.makeRequest(
        `https://api.vercel.com/v1/projects/${projectName}`
      );

      if (!projectResponse.ok) {
        throw new Error(`Project not found: ${projectName}`);
      }

      // Get recent deployments
      const deploymentsResponse = await this.makeRequest(
        `https://api.vercel.com/v6/deployments?projectId=${projectName}&limit=5`
      );

      const deployments = await deploymentsResponse.json();
      const errors: VercelErrorLog[] = [];

      // Get logs for each recent deployment
      for (const deployment of deployments.deployments) {
        try {
          const logsResponse = await this.makeRequest(
            `https://api.vercel.com/v2/deployments/${deployment.uid}/events`
          );

          const logs = await logsResponse.json();
          
          // Filter for error logs
          const errorLogs = logs.events?.filter((log: any) => 
            log.type === 'stderr' || 
            log.type === 'error' || 
            (log.payload?.text && log.payload.text.toLowerCase().includes('error'))
          ) || [];

          for (const log of errorLogs) {
            errors.push({
              id: `${deployment.uid}-${log.id || Date.now()}`,
              message: log.payload?.text || log.text || 'Unknown error',
              timestamp: log.created || deployment.createdAt,
              function: log.payload?.source || 'unknown',
              route: this.extractRoute(log.payload?.text || log.text || ''),
              stack: this.extractStack(log.payload?.text || log.text || ''),
              source: deployment.uid
            });
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch logs for deployment ${deployment.uid}:`, error);
        }
      }

      console.log(`📋 Found ${errors.length} error logs`);
      return errors;
    } catch (error) {
      console.error('❌ Failed to retrieve Vercel logs:', error);
      throw error;
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

  async execute(projectName: string, dryRun: boolean = false): Promise<void> {
    try {
      console.log(`\n🚀 Starting auto-correction for project: ${projectName}`);
      console.log('='.repeat(60));
      
      // Step 1: Pull latest code
      await this.githubPuller.pullRepository();
      const projectCode = await this.githubPuller.getProjectCode(projectName);
      
      // Step 2: Get error logs
      const errorLogs = await this.vercelLogRetriever.getErrorLogs(projectName);
      
      if (errorLogs.length === 0) {
        console.log('✅ No errors found, skipping correction');
        return;
      }
      
      console.log(`📋 Processing ${errorLogs.length} error(s)...`);
      
      // Step 3-5: Process each error
      let correctionCount = 0;
      for (const errorLog of errorLogs) {
        try {
          const corrected = await this.processError(errorLog, projectCode, dryRun);
          if (corrected) correctionCount++;
        } catch (error) {
          console.error(`❌ Failed to process error ${errorLog.id}:`, error);
        }
      }
      
      console.log(`\n✅ Completed auto-correction for project: ${projectName}`);
      console.log(`📊 Corrections applied: ${correctionCount}/${errorLogs.length}`);
    } catch (error) {
      console.error(`❌ Auto-correction failed for project ${projectName}:`, error);
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
      { name: 'rom-ai-agent001-instance001', path: 'agent-001', isActive: true },
      { name: 'rom-ai-agent002-instance001', path: 'agent-002', isActive: true }
    ];
  }
}

/**
 * Configuration Management
 */
function loadConfig(): AutoCorrectorConfig {
  // Try to load from .env file
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
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
    }
  } catch (error) {
    console.warn('⚠️ Could not load .env.local file');
  }

  const config: AutoCorrectorConfig = {
    githubToken: process.env.GITHUB_TOKEN || '',
    vercelApiToken: process.env.VERCEL_API_TOKEN || '',
    vercelTeamId: process.env.VERCEL_TEAM_ID || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    githubRepoUrl: process.env.GITHUB_REPO_URL || 'https://github.com/your-org/rom-ai-monorepo.git',
    localRepoPath: process.env.LOCAL_REPO_PATH || path.join(process.cwd(), 'temp-repo'),
    monorepoPath: process.env.MONOREPO_PATH || 'agents'
  };

  // Validate required configuration
  const required = ['githubToken', 'vercelApiToken', 'vercelTeamId', 'openaiApiKey'];
  const missing = required.filter(key => !config[key as keyof AutoCorrectorConfig]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key.toUpperCase()}`));
    console.error('\nPlease set these in your .env.local file or environment.');
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
          await autoCorrector.execute(project.name);
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
  const config = loadConfig();
  
  // Parse command line arguments
  const projectFlag = args.findIndex(arg => arg === '--project');
  const allFlag = args.includes('--all');
  const cronFlag = args.includes('--cron');
  const testFlag = args.includes('--test');
  const dryRunFlag = args.includes('--dry-run');
  
  const autoCorrector = new AutoCorrectorCronJob(config);

  if (cronFlag) {
    await runCronJob(config);
    return;
  }

  if (testFlag) {
    console.log('🧪 Running in test mode...');
    
    const testProject = 'test-for-ai-corrector';
    try {
      await autoCorrector.execute(testProject, true);
      console.log('✅ Test completed successfully');
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
    return;
  }

  if (projectFlag >= 0 && projectFlag + 1 < args.length) {
    const projectName = args[projectFlag + 1];
    console.log(`🎯 Processing single project: ${projectName}`);
    
    try {
      await autoCorrector.execute(projectName, dryRunFlag);
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
          await autoCorrector.execute(project.name, dryRunFlag);
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
      const projectName = await promptUser('Enter project name: ');
      await autoCorrector.execute(projectName, dryRunFlag);
      break;
      
    case '2':
      const projects = await autoCorrector.getAllProjects();
      for (const project of projects.filter(p => p.isActive)) {
        await autoCorrector.execute(project.name, dryRunFlag);
      }
      break;
      
    case '3':
      await runCronJob(config);
      break;
      
    case '4':
      await autoCorrector.execute('test-project', true);
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