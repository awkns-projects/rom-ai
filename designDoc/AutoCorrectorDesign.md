# Requirements
- **Main Application Function**: Continuously generate new license agents
- **Multi-Instance Support**: Each license agent can run multiple instances
- **Instance Isolation**: Each running instance is independently deployed to different Vercel projects
- **Automatic Deployment**: When license agent code is modified, automatically deploy to all corresponding running instances

# Infrastructure Resource Plan

### GitHub Monorepo for license agents
```
rom-ai-monorepo/
├── agent-001/            # Agent 001 code
│   ├── src/              # Source code
│   ├── package.json      # Dependencies configuration
│   ├── vercel.json       # Vercel configuration
│   └── README.md         # Documentation
├── agent-002/            # Agent 002 code
└── ...
```

### GitHub Terraform Repository
```
rom-ai-terraform/
├── environments/              # Environment configurations
│   ├── dev/                  # Development environment
│   ├── staging/              # Staging environment
│   └── prod/                 # Production environment
├── modules/                  # Terraform modules
│   ├── vercel-project/       # Vercel project module
│   ├── github-webhook/       # GitHub Webhook module
│   └── monitoring/           # Monitoring module
├── main.tf                   # Main configuration file
├── variables.tf              # Variable definitions
├── outputs.tf                # Output definitions
└── terraform.tfvars          # Variable values
```

### Vercel Project Naming Convention
- **Format**: `rom-ai-{agent-id}-{instance-id}`
- **Example**: `rom-ai-agent001-instance001`


# Usage Flow

### Create New License Agent Flow
1. gen license agent code
2. use terraform to create a new vercel project and link to specified directory in monorepo
3. create a new directory in monorepo and place new code in it
4. push to github and deploy to vercel project automatically

### Run New Agent Instance Flow
1. use terraform to create a new vercel project and link to specified directory in monorepo
2. push to github and deploy to vercel project automatically

# Cron Job Design

## Overview
The cron job system automatically monitors, analyzes, and corrects code issues in deployed Vercel projects by pulling error logs, analyzing them with AI, and pushing fixes back to the GitHub repository.

## Implementation Steps

### 1. Pull GitHub Repository
**Objective**: Clone and sync the latest code from the target GitHub repository

**TypeScript Implementation**:
```typescript
import { simpleGit, SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

class GitHubPuller {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoUrl: string, localPath: string) {
    this.repoPath = localPath;
    this.git = simpleGit();
  }

  async pullRepository(): Promise<void> {
    try {
      // Clone or pull latest changes
      if (!fs.existsSync(this.repoPath)) {
        await this.git.clone(repoUrl, this.repoPath);
      } else {
        await this.git.cwd(this.repoPath).pull();
      }
    } catch (error) {
      console.error('Failed to pull repository:', error);
      throw error;
    }
  }

  async getProjectCode(projectName: string): Promise<string> {
    const projectPath = path.join(this.repoPath, projectName);
    return await this.readDirectoryRecursively(projectPath);
  }

  private async readDirectoryRecursively(dirPath: string): Promise<string> {
    // Implementation to read all source files recursively
    // Return concatenated code content
  }
}
```

### 2. Get Error Logs from Vercel Project
**Objective**: Retrieve error logs and deployment information from Vercel API

**TypeScript Implementation**:
```typescript
import axios from 'axios';

interface VercelErrorLog {
  id: string;
  message: string;
  timestamp: string;
  function: string;
  route: string;
  stack?: string;
}

class VercelLogRetriever {
  private apiToken: string;
  private teamId: string;

  constructor(apiToken: string, teamId: string) {
    this.apiToken = apiToken;
    this.teamId = teamId;
  }

  async getErrorLogs(projectName: string): Promise<VercelErrorLog[]> {
    try {
      const response = await axios.get(
        `https://api.vercel.com/v1/teams/${this.teamId}/projects/${projectName}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            since: this.getLastCheckTime(),
            level: 'error'
          }
        }
      );
      return response.data.logs;
    } catch (error) {
      console.error('Failed to retrieve Vercel logs:', error);
      throw error;
    }
  }

  async getDeploymentLogs(deploymentId: string): Promise<VercelErrorLog[]> {
    // Implementation to get specific deployment logs
  }

  private getLastCheckTime(): number {
    // Return timestamp for last cron job execution
  }
}
```

### 3. Inject Code and Error Logs into AI Context
**Objective**: Analyze error logs, identify related code sections, and prepare context for LLM

**TypeScript Implementation**:
```typescript
import OpenAI from 'openai';

interface CodeContext {
  route: string;
  actionFiles: string[];
  modelFiles: string[];
  errorDetails: VercelErrorLog;
}

class CodeAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async identifyRelatedCode(
    errorLog: VercelErrorLog, 
    projectCode: string
  ): Promise<CodeContext> {
    // Use route information to find related files
    const route = this.extractRouteFromError(errorLog);
    const actionFiles = this.findActionFiles(route, projectCode);
    const modelFiles = this.findModelFiles(route, projectCode);

    return {
      route,
      actionFiles,
      modelFiles,
      errorDetails: errorLog
    };
  }

  async prepareAIContext(context: CodeContext): Promise<string> {
    const prompt = `
Error Analysis Request:

Error Details:
- Message: ${context.errorDetails.message}
- Route: ${context.route}
- Stack Trace: ${context.errorDetails.stack || 'N/A'}
- Timestamp: ${context.errorDetails.timestamp}

Related Code Files:
${context.actionFiles.map(file => `\n--- ${file} ---\n${file.content}`).join('\n')}

${context.modelFiles.map(file => `\n--- ${file} ---\n${file.content}`).join('\n')}

Please analyze the error and provide corrected code for the identified issues.
    `;

    return prompt;
  }

  private extractRouteFromError(errorLog: VercelErrorLog): string {
    // Extract route from error message or function name
    return errorLog.route || errorLog.function;
  }

  private findActionFiles(route: string, projectCode: string): any[] {
    // Find API route files, action files, etc.
    // Return file paths and content
  }

  private findModelFiles(route: string, projectCode: string): any[] {
    // Find database models, types, schemas
    // Return file paths and content
  }
}
```

### 4. Correct Code According to Error Logs
**Objective**: Use LLM to generate corrected code and replace the problematic sections

**TypeScript Implementation**:
```typescript
class CodeCorrector {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async correctCode(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert TypeScript/Next.js developer. Analyze the error logs and provide corrected code. Only return the corrected code without explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('Failed to generate code correction:', error);
      throw error;
    }
  }

  async applyCorrections(
    originalCode: string, 
    correctedCode: string, 
    filePath: string
  ): Promise<void> {
    // Parse the corrected code and replace specific sections
    // Write the updated code back to the file
    const fs = require('fs');
    fs.writeFileSync(filePath, correctedCode, 'utf8');
  }
}
```

### 5. Push Back to GitHub Repository
**Objective**: Commit and push the corrected code back to the GitHub repository

**TypeScript Implementation**:
```typescript
class GitHubPusher {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async pushCorrections(
    correctedFiles: string[], 
    errorId: string
  ): Promise<void> {
    try {
      // Stage the corrected files
      await this.git.add(correctedFiles);
      
      // Commit with descriptive message
      const commitMessage = `Auto-correct: Fix error ${errorId} - ${new Date().toISOString()}`;
      await this.git.commit(commitMessage);
      
      // Push to main branch
      await this.git.push('origin', 'main');
      
      console.log(`Successfully pushed corrections for error ${errorId}`);
    } catch (error) {
      console.error('Failed to push corrections:', error);
      throw error;
    }
  }

  async createPullRequest(
    branchName: string, 
    title: string, 
    description: string
  ): Promise<string> {
    // Alternative: Create a pull request instead of direct push
    // Implementation using GitHub API
  }
}
```

## Main Cron Job Orchestrator

```typescript
class AutoCorrectorCronJob {
  private githubPuller: GitHubPuller;
  private vercelLogRetriever: VercelLogRetriever;
  private codeAnalyzer: CodeAnalyzer;
  private codeCorrector: CodeCorrector;
  private githubPusher: GitHubPusher;

  constructor(config: AutoCorrectorConfig) {
    // Initialize all components
  }

  async execute(projectName: string): Promise<void> {
    try {
      console.log(`Starting auto-correction for project: ${projectName}`);
      
      // Step 1: Pull latest code
      await this.githubPuller.pullRepository();
      const projectCode = await this.githubPuller.getProjectCode(projectName);
      
      // Step 2: Get error logs
      const errorLogs = await this.vercelLogRetriever.getErrorLogs(projectName);
      
      if (errorLogs.length === 0) {
        console.log('No errors found, skipping correction');
        return;
      }
      
      // Step 3-5: Process each error
      for (const errorLog of errorLogs) {
        await this.processError(errorLog, projectCode);
      }
      
      console.log(`Completed auto-correction for project: ${projectName}`);
    } catch (error) {
      console.error(`Auto-correction failed for project ${projectName}:`, error);
    }
  }

  private async processError(errorLog: VercelErrorLog, projectCode: string): Promise<void> {
    // Step 3: Analyze and prepare context
    const context = await this.codeAnalyzer.identifyRelatedCode(errorLog, projectCode);
    const aiPrompt = await this.codeAnalyzer.prepareAIContext(context);
    
    // Step 4: Generate corrections
    const correctedCode = await this.codeCorrector.correctCode(aiPrompt);
    
    // Step 5: Apply and push corrections
    const correctedFiles = await this.codeCorrector.applyCorrections(
      projectCode, 
      correctedCode, 
      context.actionFiles[0]?.path || ''
    );
    
    await this.githubPusher.pushCorrections([correctedFiles], errorLog.id);
  }
}
```

## Configuration and Scheduling

```typescript
// Cron job configuration
const cron = require('node-cron');

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const autoCorrector = new AutoCorrectorCronJob(config);
  
  // Process all active projects
  const projects = await getActiveProjects();
  for (const project of projects) {
    await autoCorrector.execute(project.name);
  }
});
```

## Dependencies

```json
{
  "dependencies": {
    "simple-git": "^3.19.0",
    "axios": "^1.6.0",
    "openai": "^4.20.0",
    "node-cron": "^3.0.3"
  }
}
```

## Environment Variables

```bash
GITHUB_TOKEN=your_github_token
VERCEL_API_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id
OPENAI_API_KEY=your_openai_key
GITHUB_REPO_URL=https://github.com/your-org/rom-ai-monorepo.git
```
