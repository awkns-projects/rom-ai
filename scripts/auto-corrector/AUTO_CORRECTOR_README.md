# Auto-Corrector Script

A standalone script that automatically monitors Vercel projects for errors, analyzes them using AI, and pushes corrected code back to the GitHub repository.

## Features

- 🔍 **Error Detection**: Automatically fetches function errors and performance data from Vercel
- 🤖 **AI Analysis**: Uses OpenAI GPT-4 to analyze errors and generate fixes
- 🔧 **Code Correction**: Applies AI-generated fixes to the codebase
- 📤 **Auto-Deployment**: Commits and pushes fixes back to GitHub for automatic redeployment
- ⏰ **Cron Support**: Can run as a background cron job for continuous monitoring
- 🎯 **Multi-Project**: Supports monitoring multiple Vercel projects simultaneously

## Log Access Methods

This script uses multiple approaches to access Vercel logs, in order of preference:

### 1. Vercel CLI (Recommended) ✅
- **What it provides**: Complete runtime logs including console.log outputs, errors, and stack traces
- **How it works**: Executes `vercel logs` command programmatically
- **Requirements**: 
  - Vercel CLI installed: `npm install -g vercel`
  - CLI authenticated: `vercel login` 
- **Advantages**: Real runtime data, same as dashboard logs

### 2. Monitoring API (Fallback) ⚠️
- **What it provides**: Aggregated function error metrics and HTTP status codes
- **How it works**: Uses Vercel's Monitoring API for error statistics
- **Limitations**: No detailed error messages or stack traces

### 3. Deployment Events (Final Fallback) ⚠️
- **What it provides**: Build-time errors and deployment issues
- **How it works**: Fetches deployment event logs via REST API
- **Limitations**: Only build errors, not runtime errors

### Setup for Best Results

For optimal error detection, ensure Vercel CLI is properly configured:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Authenticate (follow prompts)
vercel login

# Verify installation
vercel --version
```

### Alternative Approaches

If you can't use CLI integration:

1. **Vercel Log Drains** (Pro/Enterprise plans)
   - Export logs to external services (Datadog, New Relic, etc.)
   - Real-time log streaming
   - Complete access to all runtime data

2. **Vercel Dashboard**
   - Manual log inspection in project's Logs tab
   - Filter and search capabilities

## Prerequisites

### 1. Install Dependencies

First, install the required dependencies:

```bash
pnpm add simple-git axios openai node-cron @types/node-cron
```

### 2. Set Up API Tokens

You'll need the following API tokens:

#### GitHub Personal Access Token
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. Copy the generated token

#### Vercel API Token
1. Go to [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a descriptive name and copy the token

#### Vercel Team ID
1. Go to your Vercel dashboard
2. Navigate to Settings > General
3. Copy your Team ID

#### OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the generated key

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp scripts/auto-corrector.env.example .env.local
```

Then edit `.env.local` with your actual values:

```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_REPO_URL=https://github.com/your-org/rom-ai-monorepo.git

# Vercel Configuration
VERCEL_API_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=team_your_team_id_here

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_key_here

# Local Configuration (Optional)
LOCAL_REPO_PATH=./temp-repo
MONOREPO_PATH=agents
```

## Usage

### Command Line Options

#### Process a Specific Project
```bash
npx tsx scripts/auto-corrector.ts --project PROJECT_NAME
```

#### Process All Active Projects
```bash
npx tsx scripts/auto-corrector.ts --all
```

#### Start Cron Job (runs every 15 minutes)
```bash
npx tsx scripts/auto-corrector.ts --cron
```

#### Test Mode (dry run without making changes)
```bash
npx tsx scripts/auto-corrector.ts --test
```

#### Dry Run (analyze but don't push changes)
```bash
npx tsx scripts/auto-corrector.ts --project PROJECT_NAME --dry-run
```

#### Interactive Mode
```bash
npx tsx scripts/auto-corrector.ts
```

### Examples

#### Monitor a Single Project
```bash
npx tsx scripts/auto-corrector.ts --project rom-ai-agent001-instance001
```

#### Start Continuous Monitoring
```bash
npx tsx scripts/auto-corrector.ts --cron
```

#### Test Configuration
```bash
npx tsx scripts/auto-corrector.ts --test --dry-run
```

## How It Works

### 1. Error Detection
- Connects to Vercel API using your token
- Fetches recent deployment logs for specified projects
- Filters for error-level logs (stderr, error types)
- Extracts error details including stack traces and routes

### 2. Code Analysis
- Clones/pulls the latest code from your GitHub repository
- Identifies files related to the error (API routes, models, schemas)
- Analyzes error context and prepares comprehensive prompts for AI

### 3. AI Correction
- Sends error details and related code to OpenAI GPT-4
- Receives analyzed corrections and improved code
- Validates the AI response format

### 4. Code Application
- Applies the corrected code to local repository files
- Validates file structure and content

### 5. Auto-Deployment
- Commits changes with descriptive messages
- Pushes to GitHub repository
- Triggers automatic Vercel redeployment

## Project Structure

The script expects your GitHub repository to follow this structure:

```
rom-ai-monorepo/
├── agent-001/            # Agent 001 code
│   ├── src/              # Source code
│   ├── package.json      # Dependencies
│   └── vercel.json       # Vercel config
├── agent-002/            # Agent 002 code
└── ...
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub personal access token |
| `GITHUB_REPO_URL` | Yes | URL of your monorepo |
| `VERCEL_API_TOKEN` | Yes | Vercel API token |
| `VERCEL_TEAM_ID` | Yes | Vercel team ID |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `LOCAL_REPO_PATH` | No | Local clone directory (default: ./temp-repo) |
| `MONOREPO_PATH` | No | Agent projects path (default: agents) |

### Cron Schedule

The default cron schedule runs every 15 minutes. You can modify this in the script:

```typescript
// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  // ... correction logic
});
```

## Error Handling

The script includes comprehensive error handling:

- **API Failures**: Retries with exponential backoff
- **Git Operations**: Handles merge conflicts and authentication issues
- **AI Errors**: Fallback mechanisms for API failures
- **File Operations**: Validates file paths and permissions

## Logging

The script provides detailed logging with emojis for easy reading:

- 🚀 Starting operations
- 📥 Pulling repository
- 📊 Fetching runtime logs and error data
- 📱 Vercel CLI log retrieval attempts
- 📈 Monitoring API results
- 🎯 Error detection and sources
- 🔍 Analyzing errors
- 🤖 AI processing
- ✅ Successful operations
- ❌ Error conditions
- ⚠️ Warnings and CLI setup issues

## Troubleshooting

### Common Issues

#### "Repository not found" Error
- Check your `GITHUB_TOKEN` has the correct permissions
- Verify `GITHUB_REPO_URL` is correct

#### "Project not found" in Vercel
- Check your `VERCEL_TEAM_ID` is correct
- Ensure the project name matches exactly

#### OpenAI API Errors
- Verify your `OPENAI_API_KEY` is valid and has sufficient credits
- Check if you're hitting rate limits

#### Git Push Failures
- Ensure your GitHub token has write access
- Check for merge conflicts in the repository

#### Vercel CLI Issues
- **"Command not found"**: Install CLI with `npm install -g vercel`
- **"Not authenticated"**: Run `vercel login` and follow prompts
- **"No logs found"**: Ensure your project has recent deployments with function activity
- **Permission denied**: Make sure your Vercel account has access to the project

### Debug Mode

For debugging, you can add more verbose logging by modifying the script or running with:

```bash
DEBUG=1 npx tsx scripts/auto-corrector.ts --test
```

## Security Considerations

- Store API tokens securely in `.env.local` (never commit to git)
- Use minimal required permissions for GitHub tokens
- Regularly rotate API keys
- Monitor OpenAI usage to prevent unexpected charges
- Review AI-generated changes before they go to production

## Contributing

To contribute to the auto-corrector:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This script is part of the ROM-AI project and follows the same license terms. 



```
npx tsx scripts/auto-corrector/auto-corrector.ts --env scripts/auto-corrector/auto-corrector.env --test
```