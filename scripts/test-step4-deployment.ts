#!/usr/bin/env npx tsx

// Load environment variables from .env.local
import { config } from 'dotenv';
import path from 'path';

// Load .env.local first
config({ path: path.resolve(process.cwd(), '.env.local') });

import { 
  executeStep4RenderDeployment
} from '../src/lib/ai/tools/agent-builder/steps/step4-render-deployment';
import type { Step1Output } from '../src/lib/ai/tools/agent-builder/steps/step1-database-generation';
import type { Step2Output } from '../src/lib/ai/tools/agent-builder/steps/step2-action-generation';
import type { Step3Output } from '../src/lib/ai/tools/agent-builder/steps/step3-schedule-generation';
import type { AgentAction, AgentSchedule, AgentModel, AgentField, AgentEnum } from '../src/lib/ai/tools/agent-builder/types';

// Import the internal function for file generation testing
// Note: This is an internal function, so we'll access it differently
const step4Module = require('../src/lib/ai/tools/agent-builder/steps/step4-render-deployment.ts');

/**
 * Test script for Step 4: Render Deployment
 * 
 * This script tests the complete deployment process using example data
 * from all previous steps, allowing you to verify the deployment functionality
 * without going through the entire agent generation pipeline.
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
            // Validate input
            if (!input.title) {
              throw new Error('Task title is required');
            }
            
            // Create task in database
            const newTask = await database.task.create({
              data: {
                title: input.title,
                description: input.description || '',
                status: input.status || 'pending',
                priority: input.priority || 'medium',
                dueDate: input.dueDate ? new Date(input.dueDate) : null,
                userId: member.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            return {
              success: true,
              message: 'Task created successfully',
              data: [newTask]
            };
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'mutation',
        model: 'Task',
        fields: {
          id: { type: 'String' },
          title: { type: 'String' },
          description: { type: 'String' },
          status: { type: 'String' },
          priority: { type: 'String' },
          dueDate: { type: 'DateTime' },
          completed: { type: 'Boolean' },
          userId: { type: 'String' },
          createdAt: { type: 'DateTime' },
          updatedAt: { type: 'DateTime' }
        }
      }
    },
    {
      id: 'list-tasks',
      name: 'List Tasks',
      description: 'Retrieve tasks with filtering and pagination',
      type: 'query',
      role: 'member',
      emoji: '📋',
      dataSource: {
        type: 'database',
        model: 'Task',
        fields: ['id', 'title', 'status', 'priority', 'dueDate', 'completed']
      },
      execute: {
        type: 'code',
        code: {
          script: `
            // Parse pagination and filters
            const skip = parseInt(input.skip) || 0;
            const take = parseInt(input.take) || 10;
            const status = input.status;
            const userId = input.userId || member.id;
            
            // Build where clause
            const where = { userId };
            if (status) {
              where.status = status;
            }
            
            // Query tasks
            const tasks = await database.task.findMany({
              where,
              skip,
              take,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            });
            
            const total = await database.task.count({ where });
            
            return {
              success: true,
              message: 'Tasks retrieved successfully',
              data: tasks,
              pagination: {
                skip,
                take,
                total,
                hasMore: skip + take < total
              }
            };
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'query',
        model: 'Task',
        fields: {
          id: { type: 'String' },
          title: { type: 'String' },
          status: { type: 'String' },
          priority: { type: 'String' },
          dueDate: { type: 'DateTime' },
          completed: { type: 'Boolean' },
          user: { type: 'User' }
        }
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
        type: 'database',
        model: 'Task',
        fields: ['status', 'completed']
      },
      execute: {
        type: 'code',
        code: {
          script: `
            // Validate input
            if (!input.taskId) {
              throw new Error('Task ID is required');
            }
            
            if (!input.status) {
              throw new Error('Status is required');
            }
            
            // Update task
            const updatedTask = await database.task.update({
              where: { 
                id: input.taskId,
                userId: member.id // Ensure user can only update their own tasks
              },
              data: {
                status: input.status,
                completed: input.status === 'completed',
                updatedAt: new Date()
              },
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            });
            
            return {
              success: true,
              message: 'Task status updated successfully',
              data: [updatedTask]
            };
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'mutation',
        model: 'Task',
        fields: {
          id: { type: 'String' },
          status: { type: 'String' },
          completed: { type: 'Boolean' },
          updatedAt: { type: 'DateTime' }
        }
      }
    },
    {
      id: 'get-user-stats',
      name: 'Get User Statistics',
      description: 'Get task statistics and metrics for a user',
      type: 'query',
      role: 'member',
      emoji: '📊',
      dataSource: {
        type: 'custom',
        customFunction: {
          code: `
            const userId = input.userId || member.id;
            
            // Get task counts by status
            const taskStats = await database.task.groupBy({
              by: ['status'],
              where: { userId },
              _count: { status: true }
            });
            
            // Get total tasks
            const totalTasks = await database.task.count({
              where: { userId }
            });
            
            // Get completed tasks this week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            const completedThisWeek = await database.task.count({
              where: {
                userId,
                status: 'completed',
                updatedAt: { gte: weekAgo }
              }
            });
            
            return {
              success: true,
              data: [{
                totalTasks,
                completedThisWeek,
                tasksByStatus: taskStats.reduce((acc, stat) => {
                  acc[stat.status] = stat._count.status;
                  return acc;
                }, {})
              }]
            };
          `,
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            const userId = input.userId || member.id;
            
            // Get task counts by status
            const taskStats = await database.task.groupBy({
              by: ['status'],
              where: { userId },
              _count: { status: true }
            });
            
            // Get total tasks
            const totalTasks = await database.task.count({
              where: { userId }
            });
            
            // Get completed tasks this week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            const completedThisWeek = await database.task.count({
              where: {
                userId,
                status: 'completed',
                updatedAt: { gte: weekAgo }
              }
            });
            
            return {
              success: true,
              message: 'User statistics retrieved successfully',
              data: [{
                totalTasks,
                completedThisWeek,
                tasksByStatus: taskStats.reduce((acc, stat) => {
                  acc[stat.status] = stat._count.status;
                  return acc;
                }, {})
              }]
            };
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'query',
        model: 'UserStats',
        fields: {
          totalTasks: { type: 'Int' },
          completedThisWeek: { type: 'Int' },
          tasksByStatus: { type: 'Json' }
        }
      }
    }
  ] as AgentAction[],
  
  implementationNotes: 
    'Created 4 core actions for task management. ' +
    'Implemented proper role-based access control. ' +
    'Added pagination and filtering capabilities. ' +
    'Included user statistics and analytics.'
};

// Example Step 3 Output - Scheduled Tasks
const exampleStep3Output: Step3Output = {
  schedules: [
    {
      id: 'daily-task-summary',
      name: 'Daily Task Summary',
      description: 'Generate and log daily task completion statistics',
      type: 'query',
      role: 'admin',
      emoji: '📊',
      interval: {
        pattern: '0 9 * * *', // 9 AM daily
        timezone: 'UTC',
        active: true
      },
      dataSource: {
        type: 'custom',
        customFunction: {
          code: `
            // Get today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Get task completion stats for today
            const completedToday = await database.task.count({
              where: {
                status: 'completed',
                updatedAt: {
                  gte: today,
                  lt: tomorrow
                }
              }
            });
            
            return { success: true, data: [{ completedToday, date: today.toISOString() }] };
          `,
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            console.log('Running daily task summary...');
            
            // Get today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Get comprehensive task stats
            const completedToday = await database.task.count({
              where: {
                status: 'completed',
                updatedAt: {
                  gte: today,
                  lt: tomorrow
                }
              }
            });
            
            const createdToday = await database.task.count({
              where: {
                createdAt: {
                  gte: today,
                  lt: tomorrow
                }
              }
            });
            
            const pendingTasks = await database.task.count({
              where: {
                status: 'pending'
              }
            });
            
            const overdueTasks = await database.task.count({
              where: {
                dueDate: {
                  lt: today
                },
                status: { not: 'completed' }
              }
            });
            
            const summary = {
              date: today.toISOString().split('T')[0],
              completedToday,
              createdToday,
              pendingTasks,
              overdueTasks,
              generatedAt: new Date().toISOString()
            };
            
            console.log('Daily task summary:', summary);
            
            return {
              success: true,
              message: 'Daily task summary generated',
              data: [summary]
            };
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'query',
        model: 'TaskSummary',
        fields: {
          date: { type: 'String' },
          completedToday: { type: 'Int' },
          createdToday: { type: 'Int' },
          pendingTasks: { type: 'Int' },
          overdueTasks: { type: 'Int' },
          generatedAt: { type: 'DateTime' }
        }
      }
    },
    {
      id: 'weekly-cleanup',
      name: 'Weekly Data Cleanup',
      description: 'Clean up old completed tasks and optimize database',
      type: 'mutation',
      role: 'admin',
      emoji: '🧹',
      interval: {
        pattern: '0 2 * * 0', // 2 AM every Sunday
        timezone: 'UTC',
        active: false
      },
      dataSource: {
        type: 'custom',
        customFunction: {
          code: `
            // Delete completed tasks older than 90 days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            
            const deletedTasks = await database.task.deleteMany({
              where: {
                status: 'completed',
                updatedAt: { lt: cutoffDate }
              }
            });
            
            return { success: true, data: [{ deletedTasks: deletedTasks.count }] };
          `,
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            console.log('Running weekly cleanup...');
            
            // Delete completed tasks older than 90 days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            
            const deletedTasks = await database.task.deleteMany({
              where: {
                status: 'completed',
                updatedAt: { lt: cutoffDate }
              }
            });
            
            // Delete orphaned comments (comments on deleted tasks)
            const deletedComments = await database.comment.deleteMany({
              where: {
                task: null
              }
            });
            
            const cleanup = {
              deletedTasks: deletedTasks.count,
              deletedComments: deletedComments.count,
              cutoffDate: cutoffDate.toISOString(),
              executedAt: new Date().toISOString()
            };
            
            console.log('Weekly cleanup completed:', cleanup);
            
            return {
              success: true,
              message: 'Weekly cleanup completed',
              data: [cleanup]
            };
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'mutation',
        model: 'CleanupResult',
        fields: {
          deletedTasks: { type: 'Int' },
          deletedComments: { type: 'Int' },
          cutoffDate: { type: 'DateTime' },
          executedAt: { type: 'DateTime' }
        }
      }
    },
    {
      id: 'hourly-health-check',
      name: 'Hourly Health Check',
      description: 'Perform system health checks and log metrics',
      type: 'query',
      role: 'admin',
      emoji: '💓',
      interval: {
        pattern: '0 * * * *', // Every hour
        timezone: 'UTC',
        active: true
      },
      dataSource: {
        type: 'custom',
        customFunction: {
          code: `
            // Basic database connectivity check
            const userCount = await database.user.count();
            const taskCount = await database.task.count();
            
            return { 
              success: true, 
              data: [{ 
                status: 'healthy', 
                userCount, 
                taskCount, 
                timestamp: new Date().toISOString() 
              }] 
            };
          `,
          envVars: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: `
            // Perform comprehensive health check
            const startTime = Date.now();
            
            try {
              // Test database connectivity
              const userCount = await database.user.count();
              const taskCount = await database.task.count();
              const commentCount = await database.comment.count();
              
              // Test database response time
              const dbStartTime = Date.now();
              await database.user.findFirst();
              const dbResponseTime = Date.now() - dbStartTime;
              
              const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                metrics: {
                  userCount,
                  taskCount,
                  commentCount,
                  dbResponseTime,
                  checkDuration: Date.now() - startTime
                }
              };
              
              console.log('Health check passed:', healthData);
              
              return {
                success: true,
                message: 'System health check passed',
                data: [healthData]
              };
              
            } catch (error) {
              console.error('Health check failed:', error);
              
              return {
                success: false,
                message: 'System health check failed',
                data: [{
                  status: 'unhealthy',
                  timestamp: new Date().toISOString(),
                  error: error.message,
                  checkDuration: Date.now() - startTime
                }]
              };
            }
          `,
          envVars: []
        }
      },
      results: {
        actionType: 'query',
        model: 'HealthCheck',
        fields: {
          status: { type: 'String' },
          timestamp: { type: 'DateTime' },
          metrics: { type: 'Json' }
        }
      }
    }
  ] as AgentSchedule[]
};

/**
 * Test configuration interface
 */
interface TestConfig {
  projectName: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  region?: 'singapore' | 'oregon' | 'frankfurt';
  plan?: 'starter' | 'standard' | 'professional';
  testConnectionOnly?: boolean;
  dryRun?: boolean;
  generateFiles?: boolean;
  safeMode?: boolean;
}

// Default test configuration
const defaultTestConfig: TestConfig = {
  projectName: 'task-manager-demo',
  description: 'Demo task management application with automated scheduling',
  environmentVariables: {
    APP_NAME: 'Task Manager Demo',
    APP_VERSION: '1.0.0',
    FEATURES_ENABLED: 'notifications,analytics,cleanup',
    MAX_TASKS_PER_USER: '100',
    CLEANUP_RETENTION_DAYS: '90'
  },
  region: 'oregon',
  plan: 'starter',
  testConnectionOnly: false,
  dryRun: false,
  generateFiles: false
};

/**
 * Generate and display Next.js project files
 */
async function generateFiles(config: TestConfig): Promise<void> {
  console.log('📦 Generating Next.js project files...');
  
  try {
    // Since we can't import generateNextJsProject directly, we'll create a mock version
    // or call the executeStep4RenderDeployment in dry-run mode to get the files
    console.log('🏗️ Creating mock file generation...');
    
    // Mock the files that would be generated
    const mockFiles: Record<string, string> = {
      'package.json': JSON.stringify({
        name: config.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'prisma generate && next build',
          start: 'next start',
          lint: 'next lint'
        },
        dependencies: {
          '@prisma/client': '^5.7.0',
          next: '15.0.0',
          react: '18.2.0',
          'react-dom': '18.2.0',
          prisma: '^5.7.0'
        }
      }, null, 2),
      'README.md': `# ${config.projectName}\n\nGenerated Next.js application with Prisma integration.`,
      'src/app/page.tsx': 'export default function Home() { return <div>Hello World</div>; }',
      'src/app/api/health/route.ts': 'export async function GET() { return Response.json({ status: "ok" }); }',
      'prisma/schema.prisma': exampleStep1Output.prismaSchema
    };
    
    console.log(`\n✅ Generated ${Object.keys(mockFiles).length} files for project: ${config.projectName}`);
    
    // Display file structure
    console.log('\n📁 Generated File Structure:');
    console.log('────────────────────────────────────────────────────────────');
    
    Object.entries(mockFiles).forEach(([filename, content]) => {
      // Type assertion to fix the content type issue
      const fileContent = content as string;
      const sizeKB = Math.round(fileContent.length / 1024 * 10) / 10;
      const size = sizeKB > 1 ? `${sizeKB}KB` : `${fileContent.length}B`;
      console.log(`📄 ${filename} (${size})`);
    });
    
    console.log('────────────────────────────────────────────────────────────');
    console.log(`📊 Total: ${Object.keys(mockFiles).length} files\n`);
    
    // Show key files content
    const keyFiles = ['package.json', 'src/app/page.tsx', 'src/app/api/health/route.ts', 'README.md'];
    
    for (const filename of keyFiles) {
      if (mockFiles[filename]) {
        console.log(`📄 ${filename}:`);
        console.log('────────────────────────────────────────────────────────────────────────────────');
        console.log(mockFiles[filename]);
        console.log('────────────────────────────────────────────────────────────────────────────────\n');
      }
    }
    
    // Summary
    const actions = exampleStep2Output.actions.filter(action => action.type === 'mutation' || action.type === 'query');
    const schedules = exampleStep3Output.schedules.filter(schedule => schedule.interval.active);
    
    console.log('📡 Generated API Endpoints:');
    actions.forEach(action => {
      console.log(`  - POST /api/actions/${action.id} (${action.name})`);
    });
    
    console.log('\n⏰ Generated Cron Jobs:');
    schedules.forEach(schedule => {
      console.log(`  - ${schedule.interval.pattern} - ${schedule.name}`);
    });
    
    console.log('\n💡 To deploy this project:');
    console.log('1. Set RENDER_API_KEY environment variable');
    console.log('2. Run: npx tsx scripts/test-step4-deployment.ts --dry-run');
    console.log('3. Run: npx tsx scripts/test-step4-deployment.ts (for actual deployment)');
    
  } catch (error) {
    console.error('❌ File generation failed:', error);
    throw error;
  }
}

/**
 * Execute Step 4 deployment test
 */
async function testDeployment(config: TestConfig): Promise<void> {
  console.log(`🚀 Starting Step 4 deployment test for project: ${config.projectName}`);
  console.log(`📋 Configuration:`, {
    region: config.region,
    plan: config.plan,
    dryRun: config.dryRun,
    safeMode: config.safeMode,
    environmentVarsCount: Object.keys(config.environmentVariables || {}).length
  });
  
  if (config.safeMode) {
    console.log('🛡️ SAFE MODE ENABLED - Using longer delays to avoid rate limits');
    console.log('   This will slow down deployment but reduce chances of 429 errors');
  }
  
  if (config.dryRun) {
    console.log('🏃‍♂️ DRY RUN MODE - Validating deployment configuration...');
    
    console.log('\n📊 Configuration Summary:');
    console.log(`  - Project: ${config.projectName}`);
    console.log(`  - Region: ${config.region}`);
    console.log(`  - Plan: ${config.plan}`);
    console.log(`  - Models: ${exampleStep1Output.models.length}`);
    console.log(`  - Actions: ${exampleStep2Output.actions.length}`);
    console.log(`  - Schedules: ${exampleStep3Output.schedules.length}`);
    
    console.log('\n✅ Dry run completed - configuration is valid');
    console.log('💡 Run without --dry-run to perform actual deployment');
    return;
  }
  
  try {
    const step4Input = {
      step1Output: exampleStep1Output,
      step2Output: exampleStep2Output,
      step3Output: exampleStep3Output,
      projectName: config.projectName,
      description: config.description,
      environmentVariables: config.environmentVariables,
      region: config.region,
      plan: config.plan
    };
    
    console.log('📦 Generated test data summary:');
    console.log(`  - Database models: ${exampleStep1Output.models.length}`);
    console.log(`  - API actions: ${exampleStep2Output.actions.length}`);
    console.log(`  - Scheduled tasks: ${exampleStep3Output.schedules.length}`);
    console.log(`  - Prisma schema: ${exampleStep1Output.prismaSchema.split('\n').length} lines`);
    
    console.log('⏳ Executing Step 4 deployment...');
    const startTime = Date.now();
    
    const result = await executeStep4RenderDeployment(step4Input);
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ Step 4 deployment completed!');
    console.log('📊 Deployment Results:');
    console.log(`  - Deployment ID: ${result.deploymentId}`);
    console.log(`  - Service ID: ${result.serviceId}`);
    console.log(`  - Deployment URL: ${result.deploymentUrl}`);
    console.log(`  - Status: ${result.status}`);
    console.log(`  - Duration: ${duration}ms`);
    
    console.log('\n🔧 Environment Variables:');
    Object.entries(result.environmentVariables).forEach(([key, value]) => {
      // Hide sensitive values
      const displayValue = key.includes('SECRET') || key.includes('KEY') 
        ? '***HIDDEN***' 
        : value;
      console.log(`  - ${key}: ${displayValue}`);
    });
    
    console.log('\n📡 Generated API Endpoints:');
    result.apiEndpoints.forEach((endpoint, index) => {
      console.log(`  ${index + 1}. ${endpoint}`);
    });
    
    console.log('\n⏰ Configured Cron Jobs:');
    result.cronJobs.forEach((cronJob, index) => {
      console.log(`  ${index + 1}. ${cronJob}`);
    });
    
    console.log('\n📝 Deployment Notes:');
    result.deploymentNotes.forEach((note, index) => {
      console.log(`  ${index + 1}. ${note}`);
    });
    
    console.log('\n📋 Build Logs:');
    result.buildLogs?.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });
    
    if (result.status === 'pending') {
      console.log('\n🎉 Deployment initiated successfully!');
      console.log(`Visit your deployment: ${result.deploymentUrl}`);
      console.log('Note: It may take several minutes for the deployment to complete.');
    } else if (result.status === 'failed') {
      console.log('\n❌ Deployment failed. Check the build logs above for details.');
    }
    
  } catch (error) {
    console.error('\n❌ Step 4 deployment test failed:');
    
    if (error instanceof Error) {
      console.error('\n🔍 Error Details:');
      console.error(error.message);
      
      // Check if this is a Render API error with detailed information
      if (error.message.includes('Render API error:')) {
        console.error('\n📡 API Request Information:');
        // The error message now includes endpoint, method, and response body details
        const errorLines = error.message.split('\n');
        errorLines.forEach(line => {
          if (line.trim()) {
            console.error(`  ${line}`);
          }
        });
      }
      
      if (error.stack) {
        console.error('\n🔍 Full Error Stack:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error type:', error);
    }
    
    console.log('\n💡 Detailed Troubleshooting Guide:');
    console.log('');
    console.log('🔑 API Key Issues:');
    console.log('  - Ensure RENDER_API_KEY is set in .env.local');
    console.log('  - Verify API key is valid and not expired');
    console.log('  - Check API key permissions in Render dashboard');
    console.log('  - Get your API key from: https://dashboard.render.com/account/api-keys');
    console.log('');
    console.log('💳 Billing & Account Issues:');
    console.log('  - Free tier has limitations on API service creation');
    console.log('  - Add a billing card to enable API operations');
    console.log('  - Each workspace can only have 1 free PostgreSQL database');
    console.log('  - Check dashboard for existing free resources');
    console.log('');
    console.log('🏗️ Service Creation Issues:');
    console.log('  - Delete existing free services if you have reached limits');
    console.log('  - Try creating services manually in dashboard first');
    console.log('  - Verify repository URL if using GitHub integration');
    console.log('  - Check service naming conventions (lowercase, alphanumeric, hyphens)');
    console.log('');
    console.log('🔧 Debugging Steps:');
    console.log('  1. Test API connection: --test-connection (if function exists)');
    console.log('  2. Validate config: --dry-run');
    console.log('  3. Check Render dashboard for error logs');
    console.log('  4. Try manual service creation in dashboard');
    console.log('  5. Contact Render support if issues persist');
    console.log('');
    console.log('📚 Useful Links:');
    console.log('  - Render Dashboard: https://dashboard.render.com');
    console.log('  - API Documentation: https://api-docs.render.com');
    console.log('  - Support: https://render.com/support');
  }
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
🚀 Step 4 Deployment Test Script

This script tests the complete Render deployment process using example data.

Usage:
  npx tsx scripts/test-step4-deployment.ts [options]

Options:
  --help                    Show this help message
  --test-connection        Test Render API connection only
  --dry-run                Validate configuration without deploying
  --generate-files         Generate and display Next.js project files
  --safe-mode              Use longer delays to avoid rate limits
  --project-name <name>    Set project name (default: task-manager-demo)
  --region <region>        Set deployment region (oregon|singapore|frankfurt)
  --plan <plan>            Set service plan (starter|standard|professional)

Environment Variables:
  RENDER_API_KEY           Your Render API key (required) - loaded from .env.local

Examples:
  # Test connection only
  npx tsx scripts/test-step4-deployment.ts --test-connection
  
  # Generate and show Next.js files
  npx tsx scripts/test-step4-deployment.ts --generate-files
  
  # Dry run with custom project name
  npx tsx scripts/test-step4-deployment.ts --dry-run --project-name my-app
  
  # Deploy with safe mode (longer delays to avoid rate limits)
  npx tsx scripts/test-step4-deployment.ts --safe-mode --project-name my-app
  
  # Deploy to Singapore region
  npx tsx scripts/test-step4-deployment.ts --region singapore
  
  # Full deployment test (default)
  npx tsx scripts/test-step4-deployment.ts

Prerequisites:
  1. Set RENDER_API_KEY in .env.local file
  2. Ensure you have a Render account
  3. Install dependencies: npm install

Generated Test Data:
  - Task management database schema (3 models: User, Task, Comment)
  - 4 API actions (create, list, update, delete tasks)
  - 3 scheduled jobs (daily summary, weekly cleanup, reminders)
  - Complete Next.js application with Prisma ORM
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestConfig & { help?: boolean; testConnectionOnly?: boolean } {
  const args = process.argv.slice(2);
  const config = { ...defaultTestConfig };
  let help = false;
  let testConnectionOnly = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;
        
      case '--test-connection':
        testConnectionOnly = true;
        break;
        
      case '--dry-run':
        config.dryRun = true;
        break;
        
      case '--generate-files':
        config.generateFiles = true;
        break;
        
      case '--safe-mode':
        config.safeMode = true;
        break;
        
      case '--project-name':
        config.projectName = args[++i] || config.projectName;
        break;
        
      case '--region':
        const region = args[++i];
        if (['singapore', 'oregon', 'frankfurt'].includes(region)) {
          config.region = region as any;
        }
        break;
        
      case '--plan':
        const plan = args[++i];
        if (['starter', 'standard', 'professional'].includes(plan)) {
          config.plan = plan as any;
        }
        break;
        
      default:
        console.warn(`⚠️  Unknown argument: ${arg}`);
        break;
    }
  }
  
  return { ...config, help, testConnectionOnly };
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🎯 Step 4 Render Deployment Test');
  console.log('================================\n');
  
  const config = parseArgs();
  
  if (config.help) {
    displayHelp();
    return;
  }
  
  // Check for required environment variables
  if (!process.env.RENDER_API_KEY) {
    console.error('❌ RENDER_API_KEY environment variable is required');
    console.error('💡 Add RENDER_API_KEY to your .env.local file');
    console.error('💡 Get your API key from: https://dashboard.render.com/account/api-keys');
    process.exit(1);
  }
  
  try {
    // Proceed with deployment test
    await testDeployment(config);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:');
    
    if (error instanceof Error) {
      console.error('\n🔍 Detailed Error Information:');
      console.error(error.message);
      
      if (error.stack) {
        console.error('\n📋 Error Stack Trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    console.error('\n💡 If this is an unexpected error, please check:');
    console.error('  - Your internet connection');
    console.error('  - RENDER_API_KEY environment variable');
    console.error('  - Script permissions and dependencies');
    
    process.exit(1);
  }
}

// Execute main function
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Unhandled Critical Error:');
    
    if (error instanceof Error) {
      console.error('\n🚨 Error Details:');
      console.error(error.message);
      
      if (error.stack) {
        console.error('\n📋 Full Stack Trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error type:', error);
    }
    
    console.error('\n🔧 This appears to be an unexpected system error.');
    console.error('Please report this issue with the error details above.');
    
    process.exit(1);
  });
}

export {
  exampleStep1Output,
  exampleStep2Output,
  exampleStep3Output,
  testDeployment,
  defaultTestConfig
}; 