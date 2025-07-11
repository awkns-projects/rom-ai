#!/usr/bin/env npx tsx

// Load environment variables from .env.local
import { config } from 'dotenv';
import path from 'path';

// Load .env.local first
config({ path: path.resolve(process.cwd(), '.env.local') });

import { 
  executeStep4VercelDeployment,
  generateNextJsProject
} from '../src/lib/ai/tools/agent-builder/steps/step4-vercel-deployment';
import type { Step1Output } from '../src/lib/ai/tools/agent-builder/steps/step1-database-generation';
import type { Step2Output } from '../src/lib/ai/tools/agent-builder/steps/step2-action-generation';
import type { Step3Output } from '../src/lib/ai/tools/agent-builder/steps/step3-schedule-generation';
import type { AgentAction, AgentSchedule, AgentModel, AgentField, AgentEnum } from '../src/lib/ai/tools/agent-builder/types';

/**
 * Test script for Step 4: Vercel + Neon Deployment
 * 
 * This script tests the complete deployment process using example data
 * from all previous steps, allowing you to verify the deployment functionality
 * with Vercel and Neon PostgreSQL.
 */

// Helper function to create proper AgentField objects
function createField(name: string, type: string, options: Partial<AgentField> = {}): AgentField {
  return {
    id: `field_${name}_${Date.now()}`,
    name,
    type,
    isId: options.isId || false,
    unique: options.unique || false,
    list: options.list || false,
    required: options.required !== undefined ? options.required : true,
    kind: options.kind || 'scalar',
    relationField: options.relationField || false,
    title: options.title || name,
    sort: options.sort || false,
    order: options.order || 0,
    defaultValue: options.defaultValue
  };
}

// Example Step 1 Output - Database Schema and Models
const exampleStep1Output: Step1Output = {
  prismaSchema: `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("member")
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  tasks     Task[]
  comments  Comment[]
  
  @@map("users")
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("pending")
  priority    String   @default("medium")
  dueDate     DateTime?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments  Comment[]
  
  @@map("tasks")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskId String
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  @@map("comments")
}`,
  
  enums: [] as AgentEnum[],
  
  models: [
    {
      id: 'user_model',
      name: 'User',
      emoji: '👤',
      description: 'User accounts with authentication and role management',
      idField: 'id',
      displayFields: ['email', 'name', 'role'],
      fields: [
        createField('id', 'String', { isId: true, unique: true }),
        createField('email', 'String', { unique: true }),
        createField('name', 'String', { required: false }),
        createField('role', 'String', { defaultValue: 'member' }),
        createField('active', 'Boolean', { defaultValue: 'true' }),
        createField('createdAt', 'DateTime'),
        createField('updatedAt', 'DateTime')
      ],
      enums: []
    },
    {
      id: 'task_model',
      name: 'Task',
      emoji: '📋',
      description: 'Task management with status tracking and assignments',
      idField: 'id',
      displayFields: ['title', 'status', 'priority'],
      fields: [
        createField('id', 'String', { isId: true, unique: true }),
        createField('title', 'String'),
        createField('description', 'String', { required: false }),
        createField('status', 'String', { defaultValue: 'pending' }),
        createField('priority', 'String', { defaultValue: 'medium' }),
        createField('dueDate', 'DateTime', { required: false }),
        createField('completed', 'Boolean', { defaultValue: 'false' }),
        createField('userId', 'String'),
        createField('createdAt', 'DateTime'),
        createField('updatedAt', 'DateTime')
      ],
      enums: []
    },
    {
      id: 'comment_model',
      name: 'Comment',
      emoji: '💬',
      description: 'Comments and notes on tasks',
      idField: 'id',
      displayFields: ['content'],
      fields: [
        createField('id', 'String', { isId: true, unique: true }),
        createField('content', 'String'),
        createField('userId', 'String'),
        createField('taskId', 'String'),
        createField('createdAt', 'DateTime'),
        createField('updatedAt', 'DateTime')
      ],
      enums: []
    }
  ] as AgentModel[],
  
  implementationNotes: [
    'Created task management schema with 3 core models',
    'Implemented role-based access control',
    'Added proper indexing and constraints'
  ]
};

// Example Step 2 Output - API Actions
const exampleStep2Output: Step2Output = {
  actions: [
    {
      id: 'create-task',
      name: 'Create Task',
      description: 'Create a new task with title, description, and priority',
      type: 'mutation',
      role: 'member',
      emoji: '➕',
      dataSource: {
        type: 'custom',
        customFunction: {
          code: 'return { success: true, data: [] };',
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            async function createTask(database, input, member) {
              const { title, description, priority = 'medium' } = input;
              
              const task = await database.task.create({
                data: {
                  title,
                  description,
                  priority,
                  userId: member.id,
                  status: 'pending'
                }
              });
              
              return { success: true, data: task };
            }
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'mutation',
        model: 'Task',
        fields: {
          title: 'input.title',
          description: 'input.description',
          priority: 'input.priority',
          userId: 'member.id',
          status: 'pending'
        }
      }
    },
    {
      id: 'get-user-tasks',
      name: 'Get User Tasks',
      description: 'Retrieve all tasks for the current user with optional filtering',
      type: 'query',
      role: 'member',
      emoji: '📋',
      dataSource: {
        type: 'custom',
        customFunction: {
          code: 'return { success: true, data: [] };',
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            async function getUserTasks(database, input, member) {
              const { status, priority, limit = 50 } = input;
              
              const where = {
                userId: member.id,
                ...(status && { status }),
                ...(priority && { priority })
              };
              
              const tasks = await database.task.findMany({
                where,
                include: {
                  comments: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' }
                  }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
              });
              
              return { success: true, data: tasks };
            }
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'query',
        model: 'Task',
        fields: {}
      }
    },
    {
      id: 'update-task-status',
      name: 'Update Task Status',
      description: 'Update the status and completion state of a task',
      type: 'mutation',
      role: 'member',
      emoji: '✅',
      dataSource: {
        type: 'custom',
        customFunction: {
          code: 'return { success: true, data: [] };',
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            async function updateTaskStatus(database, input, member) {
              const { taskId, status, completed } = input;
              
              // Verify task belongs to user
              const existingTask = await database.task.findFirst({
                where: { id: taskId, userId: member.id }
              });
              
              if (!existingTask) {
                throw new Error('Task not found or access denied');
              }
              
              const updatedTask = await database.task.update({
                where: { id: taskId },
                data: {
                  status,
                  completed: completed !== undefined ? completed : status === 'completed',
                  updatedAt: new Date()
                },
                include: {
                  comments: {
                    include: { user: true }
                  }
                }
              });
              
              return { success: true, data: updatedTask };
            }
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'mutation',
        model: 'Task',
        identifierIds: ['id'],
        fields: {},
        fieldsToUpdate: {
          status: 'input.status',
          completed: 'input.completed || (input.status === "completed")',
          updatedAt: 'new Date()'
        }
      }
    }
  ],
  implementationNotes: 'Generated 3 core task management actions with proper authentication, error handling, and Prisma integration. Includes task creation, retrieval with filtering, and status updates with ownership validation.'
};

// Example Step 3 Output - Scheduled Tasks
const exampleStep3Output: Step3Output = {
  schedules: [
    {
      id: 'daily-task-reminder',
      name: 'Daily Task Reminder',
      description: 'Send daily reminders for overdue tasks',
      type: 'query',
      role: 'admin',
      emoji: '⏰',
      interval: {
        pattern: '0 9 * * *', // Daily at 9 AM
        timezone: 'UTC',
        active: true
      },
      dataSource: {
        type: 'database',
        database: {
          models: [{
            id: 'task_model',
            name: 'Task',
            fields: [
              { id: 'id', name: 'id' },
              { id: 'title', name: 'title' },
              { id: 'dueDate', name: 'dueDate' },
              { id: 'status', name: 'status' }
            ]
          }]
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            async function dailyTaskReminder(database, input, member) {
              const now = new Date();
              const overdueTasks = await database.task.findMany({
                where: {
                  dueDate: { lt: now },
                  status: { not: 'completed' }
                },
                include: { user: true }
              });
              
              console.log(\`Found \${overdueTasks.length} overdue tasks\`);
              
              // Here you would typically send notifications
              // For now, just log the overdue tasks
              overdueTasks.forEach(task => {
                console.log(\`Overdue: \${task.title} (due: \${task.dueDate})\`);
              });
              
              return { 
                success: true, 
                data: { 
                  overdueCount: overdueTasks.length,
                  tasks: overdueTasks
                }
              };
            }
            
            return dailyTaskReminder(database, input, member);
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'query',
        model: 'Task',
        fields: {}
      }
    },
    {
      id: 'weekly-cleanup',
      name: 'Weekly Cleanup',
      description: 'Clean up old completed tasks and comments',
      type: 'mutation',
      role: 'admin',
      emoji: '🧹',
      interval: {
        pattern: '0 2 * * 0', // Weekly on Sunday at 2 AM
        timezone: 'UTC',
        active: true
      },
      dataSource: {
        type: 'database',
        database: {
          models: [{
            id: 'task_model',
            name: 'Task',
            fields: [
              { id: 'id', name: 'id' },
              { id: 'status', name: 'status' },
              { id: 'createdAt', name: 'createdAt' }
            ]
          }]
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            async function weeklyCleanup(database, input, member) {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              
              // Delete old completed tasks
              const deletedTasks = await database.task.deleteMany({
                where: {
                  status: 'completed',
                  createdAt: { lt: thirtyDaysAgo }
                }
              });
              
              console.log(\`Cleaned up \${deletedTasks.count} old completed tasks\`);
              
              return { 
                success: true, 
                data: { 
                  deletedTasksCount: deletedTasks.count 
                }
              };
            }
            
            return weeklyCleanup(database, input, member);
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'mutation',
        model: 'Task',
        fields: {}
      }
    }
  ] as AgentSchedule[]
};

// Test configuration interface
interface TestConfig {
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  region?: 'aws-us-east-1' | 'aws-us-west-2' | 'aws-eu-west-1' | 'aws-ap-southeast-1' | 'aws-us-east-2' | 'aws-eu-central-1'; // Updated to use Neon's AWS-prefixed format
  vercelTeam?: string;
  testConnectionOnly?: boolean;
  dryRun?: boolean;
  generateFiles?: boolean;
  safeMode?: boolean;
}

// Default test configuration
const defaultConfig: TestConfig = {
  projectName: 'test-agent-vercel',
  description: 'Test deployment with Vercel and Neon',
  environmentVariables: {
    'CUSTOM_VAR': 'test-value'
  },
  region: 'aws-us-east-1', // Updated default region
  generateFiles: false,
  dryRun: false,
  safeMode: false
};

/**
 * Test file generation only (no deployment)
 */
async function generateFiles(config: TestConfig): Promise<void> {
  console.log('📁 Testing Next.js project file generation...');
  
  try {
    const files = await generateNextJsProject(
      exampleStep1Output,
      exampleStep2Output,
      exampleStep3Output,
      config.projectName
    );
    
    console.log('\n✅ File Generation Results:');
    console.log(`📄 Total files generated: ${Object.keys(files).length}`);
    console.log('\n📋 Generated files:');
    Object.keys(files).forEach(filename => {
      const size = files[filename].length;
      console.log(`  - ${filename} (${size} bytes)`);
    });
    
    // Show sample content for key files
    console.log('\n📄 Sample file contents:');
    
    if (files['package.json']) {
      console.log('\n🔧 package.json preview:');
      console.log(files['package.json'].substring(0, 500) + '...');
    }
    
    if (files['vercel.json']) {
      console.log('\n⚡ vercel.json:');
      console.log(files['vercel.json']);
    }
    
    // Count different types of files
    const apiFiles = Object.keys(files).filter(f => f.startsWith('src/pages/api/'));
    const cronFiles = Object.keys(files).filter(f => f.startsWith('src/pages/api/cron/'));
    const configFiles = Object.keys(files).filter(f => f.includes('.json') || f.includes('.js') || f.includes('.ts') && !f.includes('src/'));
    
    console.log('\n📊 File breakdown:');
    console.log(`  - Configuration files: ${configFiles.length}`);
    console.log(`  - API endpoints: ${apiFiles.length - cronFiles.length}`);
    console.log(`  - Cron jobs: ${cronFiles.length}`);
    console.log(`  - Other files: ${Object.keys(files).length - configFiles.length - apiFiles.length}`);
    
    console.log('\n✅ File generation test completed successfully!');
    
  } catch (error) {
    console.error('❌ File generation failed:', error);
    throw error;
  }
}

/**
 * Test full deployment process
 */
async function testDeployment(config: TestConfig): Promise<void> {
  console.log('🚀 Testing Vercel + Neon deployment...');
  
  // Check for required environment variables
  const requiredEnvVars = ['NEON_API_KEY', 'VERCEL_TOKEN'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
      console.error(`  - ${envVar}`);
    });
    console.error('\nPlease set these environment variables in your .env.local file:');
    console.error('NEON_API_KEY=your_neon_api_key_here');
    console.error('VERCEL_TOKEN=your_vercel_token_here');
    throw new Error('Missing required environment variables');
  }
  
  if (config.dryRun) {
    console.log('🧪 DRY RUN MODE - No actual deployment will be performed');
    return;
  }
  
  try {
    const result = await executeStep4VercelDeployment({
      step1Output: exampleStep1Output,
      step2Output: exampleStep2Output,
      step3Output: exampleStep3Output,
      projectName: config.projectName,
      description: config.description,
      environmentVariables: config.environmentVariables,
      region: config.region,
      vercelTeam: config.vercelTeam
    });
    
    console.log('\n🎉 Deployment Results:');
    console.log(`📋 Deployment ID: ${result.deploymentId}`);
    console.log(`🏗️ Project ID: ${result.projectId}`); // Changed from serviceId to projectId
    console.log(`🌐 Deployment URL: ${result.deploymentUrl}`);
    console.log(`📊 Status: ${result.status}`);
    console.log(`🗄️ Database URL: ${result.databaseUrl ? '[CONFIGURED]' : '[NOT SET]'}`);
    console.log(`📊 Neon Project ID: ${result.neonProjectId}`);
    console.log(`⚡ Vercel Project ID: ${result.vercelProjectId}`);
    
    console.log('\n📝 Deployment Notes:');
    result.deploymentNotes.forEach((note, index) => {
      console.log(`  ${index + 1}. ${note}`);
    });
    
    console.log('\n🔧 API Endpoints:');
    result.apiEndpoints.forEach(endpoint => {
      console.log(`  - ${endpoint}`);
    });
    
    console.log('\n⏰ Cron Jobs:');
    result.cronJobs.forEach(job => {
      console.log(`  - ${job}`);
    });
    
    console.log('\n🔑 Environment Variables:');
    Object.keys(result.environmentVariables).forEach(key => {
      const value = result.environmentVariables[key];
      const displayValue = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('URL') 
        ? '[HIDDEN]' 
        : value;
      console.log(`  - ${key}: ${displayValue}`);
    });
    
    console.log('\n✅ Deployment test completed successfully!');
    console.log(`🌐 Visit your app at: ${result.deploymentUrl}`);
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error);
    throw error;
  }
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
🚀 Vercel + Neon Deployment Test Script

USAGE:
  npm run test-vercel-deployment [options]

OPTIONS:
  --help              Show this help message
  --project-name      Project name for deployment (default: test-agent-vercel)
  --description       Project description
  --region            Deployment region (aws-us-east-1, aws-us-west-2, aws-eu-west-1, aws-ap-southeast-1, aws-us-east-2, aws-eu-central-1)
  --vercel-team       Vercel team ID (optional)
  --generate-files    Only test file generation (no deployment)
  --dry-run           Show what would happen without deploying
  --safe-mode         Use conservative settings for testing

EXAMPLES:
  # Test file generation only
  npm run test-vercel-deployment -- --generate-files

  # Test deployment with custom project name
  npm run test-vercel-deployment -- --project-name my-test-app

  # Dry run to see what would happen
  npm run test-vercel-deployment -- --dry-run

  # Safe mode for testing
  npm run test-vercel-deployment -- --safe-mode

REQUIRED ENVIRONMENT VARIABLES:
  NEON_API_KEY        Your Neon API key
  VERCEL_TOKEN        Your Vercel API token

SETUP:
  1. Create a .env.local file in the project root
  2. Add your API keys:
     NEON_API_KEY=your_neon_api_key_here
     VERCEL_TOKEN=your_vercel_token_here
  3. Run the test script

For more information, visit:
  - Neon: https://neon.tech/docs/api/api-overview
  - Vercel: https://vercel.com/docs/rest-api
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestConfig & { help?: boolean; testConnectionOnly?: boolean } {
  const args = process.argv.slice(2);
  const config = { ...defaultConfig };
  let help = false;
  let testConnectionOnly = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;
      case '--project-name':
        if (nextArg) {
          config.projectName = nextArg;
          i++;
        }
        break;
      case '--description':
        if (nextArg) {
          config.description = nextArg;
          i++;
        }
        break;
      case '--region':
        if (nextArg && ['aws-us-east-1', 'aws-us-west-2', 'aws-eu-west-1', 'aws-ap-southeast-1', 'aws-us-east-2', 'aws-eu-central-1'].includes(nextArg)) { // Updated region validation
          config.region = nextArg as any;
          i++;
        }
        break;
      case '--vercel-team':
        if (nextArg) {
          config.vercelTeam = nextArg;
          i++;
        }
        break;
      case '--generate-files':
        config.generateFiles = true;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--safe-mode':
        config.safeMode = true;
        break;
      case '--test-connection':
        testConnectionOnly = true;
        break;
    }
  }
  
  return { ...config, help, testConnectionOnly };
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const config = parseArgs();
  
  if (config.help) {
    displayHelp();
    return;
  }
  
  console.log('🧪 Vercel + Neon Deployment Test');
  console.log('================================\n');
  
  // Apply safe mode adjustments
  if (config.safeMode) {
    console.log('🛡️ Safe mode enabled - using conservative settings');
    config.projectName = `test-${Date.now()}`;
    config.dryRun = true;
  }
  
  console.log('📋 Test Configuration:');
  console.log(`  Project: ${config.projectName}`);
  console.log(`  Region: ${config.region}`);
  console.log(`  Vercel Team: ${config.vercelTeam || 'Personal'}`);
  console.log(`  Generate Files Only: ${config.generateFiles}`);
  console.log(`  Dry Run: ${config.dryRun}`);
  console.log('');
  
  try {
    if (config.generateFiles) {
      await generateFiles(config);
    } else {
      await testDeployment(config);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
} 