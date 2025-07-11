# Render Deployment Guide

This guide explains how to use the Step 4 Render deployment functionality in the AI Agent Builder.

## Prerequisites

### 1. Render API Key
- Sign up for a [Render account](https://render.com)
- Go to your [User Settings](https://dashboard.render.com/user/settings)
- Create a new API key
- Add it to your `.env.local` file:
  ```bash
  RENDER_API_KEY=rnd_your_api_key_here
  ```

### 2. Environment Setup
Make sure your `.env.local` file contains all required variables:
```bash
# Required for agent builder
AUTH_SECRET=your-auth-secret
XAI_API_KEY=your-xai-key
OPENAI_API_KEY=your-openai-key
POSTGRES_URL=your-postgres-url

# Required for Render deployment
RENDER_API_KEY=rnd_your_api_key_here
```

## How to Use

### 1. Enable Deployment in Orchestrator
When calling the agent generation orchestrator, enable deployment:

```typescript
import { executeAgentGeneration } from '@/lib/ai/tools/agent-builder/steps/orchestrator';

const result = await executeAgentGeneration({
  userRequest: 'Create a task management system',
  enableDeployment: true,
  deploymentConfig: {
    projectName: 'my-task-manager',
    description: 'A task management system with user authentication',
    environmentVariables: {
      // Add any custom environment variables here
      CUSTOM_API_KEY: 'your-custom-key'
    },
    region: 'oregon', // 'singapore' | 'oregon' | 'frankfurt'
    plan: 'free' // 'free' | 'starter' | 'professional'
  }
});
```

### 2. Test Render Connection
Before deploying, test your Render API connection:

```typescript
import { testRenderDeploymentReadiness } from '@/lib/ai/tools/agent-builder/steps/orchestrator';

const readinessTest = await testRenderDeploymentReadiness();
if (readinessTest.success) {
  console.log('✅ Ready to deploy!');
} else {
  console.log('❌ Not ready:', readinessTest.message);
}
```

### 3. Access Deployment Results
After successful deployment, you'll receive:

```typescript
const deploymentResult = result.stepResults.step4;
if (deploymentResult) {
  console.log('🌐 Deployment URL:', deploymentResult.deploymentUrl);
  console.log('📊 API Endpoints:', deploymentResult.apiEndpoints);
  console.log('⏰ Cron Jobs:', deploymentResult.cronJobs);
  console.log('📝 Notes:', deploymentResult.deploymentNotes);
}
```

## What Gets Deployed

The Step 4 deployment creates a complete Next.js application with:

### 🗄️ Database
- PostgreSQL database on Render
- Prisma ORM with generated schema
- Database models from Step 1

### 🚀 Next.js Application
- Next.js 15 with App Router
- Tailwind CSS for styling
- TypeScript configuration
- Production-ready build setup

### 📡 API Endpoints
- RESTful API endpoints for each action from Step 2
- Located at `/api/actions/{actionId}`
- Support for both GET and POST methods
- Role-based access control

### ⏰ Automated Schedules
- Cron jobs for schedules from Step 3
- Background process management
- Configurable timezones and patterns
- Logging and error handling

### 🔧 Additional Features
- Health check endpoint at `/api/health`
- Environment variable management
- Docker configuration
- Comprehensive documentation

## Deployment Configuration

### Project Settings
- **Project Name**: Used for service naming and URL generation
- **Description**: Metadata for the deployment
- **Region**: Choose from Singapore, Oregon, or Frankfurt
- **Plan**: Free, Starter, or Professional

### Environment Variables
The deployment automatically configures:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Application URL

You can add custom environment variables via the `environmentVariables` config.

### Generated Files
The deployment creates a complete project structure:
```
project/
├── package.json          # Dependencies and scripts
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── app/              # Next.js app router
│   ├── lib/              # Utilities and database client
│   └── components/       # UI components
├── scripts/              # Cron job management
└── README.md            # Project documentation
```

## Monitoring and Management

### Health Checks
- Access `/api/health` for system status
- Database connection monitoring
- Model count statistics

### Cron Job Management
- `npm run cron:start` - Start background schedules
- `npm run cron:stop` - Stop running schedules
- `npm run cron:status` - Check schedule status

### Database Management
- `npm run db:push` - Push schema changes
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   Error: RENDER_API_KEY environment variable is required
   ```
   Solution: Add your Render API key to `.env.local`

2. **Invalid API Key**
   ```
   Error: Render API error: 401 Unauthorized
   ```
   Solution: Check your API key is correct and has proper permissions

3. **Deployment Failed**
   ```
   Status: failed
   ```
   Solution: Check the build logs in the deployment result

### Testing Connection
Use the test function to verify your setup:
```typescript
import { testRenderConnection } from '@/lib/ai/tools/agent-builder/steps/step4-render-deployment';

const test = await testRenderConnection();
console.log(test.success ? '✅ Connected' : '❌ Failed:', test.message);
```

## Best Practices

1. **Environment Variables**: Keep sensitive data in environment variables, not in code
2. **Project Naming**: Use descriptive, URL-friendly project names
3. **Resource Planning**: Start with free tier, upgrade as needed
4. **Monitoring**: Regularly check health endpoints and logs
5. **Updates**: Use proper CI/CD for production deployments

## Support

For issues with:
- **Render Platform**: Check [Render Documentation](https://render.com/docs)
- **Deployment Code**: Review the Step 4 implementation
- **API Integration**: Test connection with `testRenderConnection()`

## Example Usage

Complete example of deploying a task management system:

```typescript
import { executeAgentGeneration, testRenderDeploymentReadiness } from '@/lib/ai/tools/agent-builder/steps/orchestrator';

async function deployTaskManager() {
  // Test readiness first
  const readiness = await testRenderDeploymentReadiness();
  if (!readiness.success) {
    console.error('❌ Not ready to deploy:', readiness.message);
    return;
  }

  // Deploy the agent
  const result = await executeAgentGeneration({
    userRequest: 'Create a task management system with user authentication, task creation, assignment, and due date tracking',
    enableDeployment: true,
    deploymentConfig: {
      projectName: 'task-manager-pro',
      description: 'Professional task management system with team collaboration',
      environmentVariables: {
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
        EMAIL_SERVICE_KEY: process.env.EMAIL_SERVICE_KEY
      },
      region: 'oregon',
      plan: 'starter'
    },
    enableValidation: true,
    enableInsights: true
  });

  if (result.success && result.stepResults.step4) {
    const deployment = result.stepResults.step4;
    console.log('🎉 Deployment successful!');
    console.log('🌐 URL:', deployment.deploymentUrl);
    console.log('📊 API Endpoints:', deployment.apiEndpoints.length);
    console.log('⏰ Cron Jobs:', deployment.cronJobs.length);
  } else {
    console.error('❌ Deployment failed:', result.errors);
  }
}

deployTaskManager();
```

This will create a fully functional task management system deployed to Render with database, API endpoints, and automated schedules. 