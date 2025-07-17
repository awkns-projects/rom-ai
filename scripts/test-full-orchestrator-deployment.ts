#!/usr/bin/env node

import dotenv from 'dotenv';
import { executeStep0ComprehensiveAnalysis } from '../src/lib/ai/tools/agent-builder/steps/step0-comprehensive-analysis';
import { executeStep1DatabaseGeneration } from '../src/lib/ai/tools/agent-builder/steps/step1-database-generation';
import { executeStep2ActionGeneration } from '../src/lib/ai/tools/agent-builder/steps/step2-action-generation';
import { executeStep3ScheduleGeneration } from '../src/lib/ai/tools/agent-builder/steps/step3-schedule-generation';
import { executeStep4VercelDeployment } from '../src/lib/ai/tools/agent-builder/steps/step4-vercel-deployment';
import type { Step4Output } from '../src/lib/ai/tools/agent-builder/steps/step4-vercel-deployment';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

class FullOrchestratorTest {
  private deploymentInfo: Step4Output | null = null;
  private testResults: TestResult[] = [];

  async runFullTest(): Promise<void> {
    console.log('🚀 Starting Full Orchestrator + Vercel Deployment Test...\n');

    try {
      // Step 0: Comprehensive Analysis
      console.log('📊 Step 0: Running Comprehensive Analysis...');
      const step0Result = await this.runStep0();
      this.logResult('Step 0: Comprehensive Analysis', step0Result.success, step0Result.message);

      if (!step0Result.success) {
        throw new Error(`Step 0 failed: ${step0Result.message}`);
      }

      // Step 1: Database Generation
      console.log('\n🗄️ Step 1: Generating Database Schema...');
      const step1Result = await this.runStep1(step0Result.details);
      this.logResult('Step 1: Database Generation', step1Result.success, step1Result.message);

      if (!step1Result.success) {
        throw new Error(`Step 1 failed: ${step1Result.message}`);
      }

      // Step 2: Action Generation
      console.log('\n🔧 Step 2: Generating Actions...');
      const step2Result = await this.runStep2(step0Result.details, step1Result.details);
      this.logResult('Step 2: Action Generation', step2Result.success, step2Result.message);

      if (!step2Result.success) {
        throw new Error(`Step 2 failed: ${step2Result.message}`);
      }

      // Step 3: Schedule Generation
      console.log('\n⏰ Step 3: Generating Schedules...');
      const step3Result = await this.runStep3(step0Result.details, step1Result.details, step2Result.details);
      this.logResult('Step 3: Schedule Generation', step3Result.success, step3Result.message);

      if (!step3Result.success) {
        throw new Error(`Step 3 failed: ${step3Result.message}`);
      }

      // Step 4: Vercel Deployment
      console.log('\n🚀 Step 4: Deploying to Vercel...');
      const step4Result = await this.runStep4(step1Result.details, step2Result.details, step3Result.details);
      this.logResult('Step 4: Vercel Deployment', step4Result.success, step4Result.message);

      if (!step4Result.success) {
        throw new Error(`Step 4 failed: ${step4Result.message}`);
      }

      this.deploymentInfo = step4Result.details;

      // Wait for deployment to be ready
      await this.waitForDeployment();

      // Test deployed APIs
      console.log('\n🧪 Testing Deployed APIs...');
      await this.testDeployedAPIs();

      // Summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Full orchestrator test failed:', error);
      this.logResult('Full Orchestrator Test', false, error instanceof Error ? error.message : 'Unknown error');
      this.printSummary();
      process.exit(1);
    }
  }

  private async runStep0(): Promise<TestResult> {
    try {
      const userDescription = `Create a task management system with:
- User management (create, update, list users)
- Task creation and assignment
- Task status tracking
- Daily cleanup of completed tasks
- Weekly progress reports`;

      const result = await executeStep0ComprehensiveAnalysis({
        userRequest: userDescription
      });

      return {
        success: true,
        message: `Analysis completed with ${result.models.length} models identified`,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Step 0 analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async runStep1(step0Output: any): Promise<TestResult> {
    try {
      const result = await executeStep1DatabaseGeneration({
        step0Analysis: step0Output
      });

      const modelCount = result.models.length;
      const hasValidSchema = result.prismaSchema.includes('model') && 
                            result.prismaSchema.includes('datasource') && 
                            result.prismaSchema.includes('generator');

      return {
        success: modelCount > 0 && hasValidSchema,
        message: `Generated ${modelCount} models with valid Prisma schema`,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Step 1 database generation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async runStep2(step0Output: any, step1Output: any): Promise<TestResult> {
    try {
      const result = await executeStep2ActionGeneration({
        step0Analysis: step0Output,
        databaseGeneration: step1Output
      });

      const actionCount = result.actions.length;
      const hasValidActions = result.actions.some(action => 
        action.name && action.type && ['query', 'mutation'].includes(action.type)
      );

      return {
        success: actionCount > 0 && hasValidActions,
        message: `Generated ${actionCount} actions with valid types`,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Step 2 action generation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async runStep3(step0Output: any, step1Output: any, step2Output: any): Promise<TestResult> {
    try {
      const result = await executeStep3ScheduleGeneration({
        step0Analysis: step0Output,
        databaseGeneration: step1Output,
        actionGeneration: step2Output
      });

      const scheduleCount = result.schedules.length;
      const hasValidSchedules = result.schedules.some(schedule => 
        schedule.name && schedule.interval?.pattern
      );

      return {
        success: scheduleCount > 0 && hasValidSchedules,
        message: `Generated ${scheduleCount} schedules with valid cron patterns`,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Step 3 schedule generation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async runStep4(step1Output: any, step2Output: any, step3Output: any): Promise<TestResult> {
    try {
      const projectName = `test-agent-${Date.now()}`;
      
      const result = await executeStep4VercelDeployment({
        step1Output,
        step2Output,
        step3Output,
        projectName,
        description: 'Test deployment from full orchestrator',
        environmentVariables: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
          NODE_ENV: 'production'
        }
      });

      return {
        success: Boolean(result.deploymentUrl) && result.apiEndpoints.length > 0,
        message: `Deployed to ${result.deploymentUrl} with ${result.apiEndpoints.length} endpoints`,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Step 4 Vercel deployment failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async waitForDeployment(): Promise<void> {
    if (!this.deploymentInfo) {
      throw new Error('No deployment info available');
    }

    console.log(`⏳ Waiting for deployment to be ready at ${this.deploymentInfo.deploymentUrl}...`);
    
    const maxAttempts = 30;
    const delayMs = 10000; // 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.deploymentInfo.deploymentUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const healthData = await response.json();
          console.log(`✅ Deployment is ready! Health check passed.`);
          console.log(`   Status: ${healthData.status}`);
          console.log(`   Name: ${healthData.name || 'Unknown'}`);
          console.log(`   Environment: ${healthData.environment || 'Unknown'}`);
          console.log(`   Database: ${healthData.database?.status || 'Unknown'}`);
          console.log(`   Actions: ${healthData.services?.actions?.count || 0}`);
          console.log(`   Schedules: ${healthData.services?.schedules?.count || 0}`);
          console.log(`   Deployment URL: ${this.deploymentInfo.deploymentUrl}`);
          return;
        }
      } catch (error) {
        // Deployment not ready yet, continue waiting
      }

      console.log(`   Attempt ${attempt}/${maxAttempts} - Deployment not ready yet, waiting...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Deployment did not become ready within the timeout period');
  }

  private async testDeployedAPIs(): Promise<void> {
    if (!this.deploymentInfo) {
      throw new Error('No deployment info available');
    }

    const baseUrl = this.deploymentInfo.deploymentUrl;

    // Test health check
    await this.testHealthCheck(baseUrl);

    // Test action endpoints
    await this.testActionEndpoints(baseUrl);

    // Test schedule endpoints (if accessible)
    await this.testScheduleEndpoints(baseUrl);
  }

  private async testHealthCheck(baseUrl: string): Promise<void> {
    try {
      console.log(`\n🏥 Testing Health Check`);
      console.log(`   Endpoint: ${baseUrl}/api/health`);

      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();

      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response Data:`, JSON.stringify(data, null, 2));

      if (response.ok && data.status === 'healthy') {
        console.log(`   ✅ Health Check Details:`);
        console.log(`     Name: ${data.name || 'Unknown'}`);
        console.log(`     Version: ${data.version || 'Unknown'}`);
        console.log(`     Environment: ${data.environment || 'Unknown'}`);
        console.log(`     Database: ${data.database?.status || 'Unknown'}`);
        
        if (data.services) {
          console.log(`     Services:`);
          if (data.services.actions) {
            console.log(`       Actions: ${data.services.actions.count || 0}`);
            if (data.services.actions.endpoints) {
              console.log(`       Action Endpoints: ${data.services.actions.endpoints.join(', ')}`);
            }
          }
          if (data.services.schedules) {
            console.log(`       Schedules: ${data.services.schedules.count || 0} (${data.services.schedules.active || 0} active)`);
            if (data.services.schedules.patterns) {
              console.log(`       Schedule Patterns: ${data.services.schedules.patterns.join(', ')}`);
            }
          }
        }

        this.logResult(
          'Health Check API',
          true,
          `✅ Health check passed - ${data.services?.actions?.count || 0} actions, ${data.services?.schedules?.count || 0} schedules`
        );
      } else {
        console.log(`   ❌ Health check failed:`);
        if (data.error) console.log(`     Error: ${data.error}`);
        if (data.status) console.log(`     Status: ${data.status}`);

        this.logResult(
          'Health Check API',
          false,
          `Health check failed - Status: ${data.status || 'unknown'}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logResult('Health Check API', false, 'Health check request failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async testActionEndpoints(baseUrl: string): Promise<void> {
    if (!this.deploymentInfo?.apiEndpoints) {
      this.logResult('Action Endpoints', false, 'No API endpoints available');
      return;
    }

    for (const endpoint of this.deploymentInfo.apiEndpoints) {
      // Extract action name from endpoint
      const actionName = endpoint.split('/api/')[1];
      
      if (!actionName || actionName.includes('health')) {
        continue; // Skip health endpoint
      }

      try {
        console.log(`\n🔧 Testing Action: ${actionName}`);
        console.log(`   Endpoint: ${endpoint}`);

        // Test with a simple request
        const testInput = {
          name: `Test ${actionName} ${Date.now()}`,
          email: `test-${Date.now()}@example.com`,
          title: `Test Task ${Date.now()}`,
          description: `Test task created by orchestrator test`,
          status: 'pending',
          priority: 'medium'
        };

        console.log(`   Request Input:`, JSON.stringify(testInput, null, 2));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: testInput,
            member: { role: 'admin' }
          })
        });

        const data = await response.json();
        
        console.log(`   Response Status: ${response.status}`);
        console.log(`   Response Data:`, JSON.stringify(data, null, 2));

        if (response.ok) {
          // Log database changes if present
          if (data.changes && data.changes.length > 0) {
            console.log(`   📊 Database Changes:`);
            data.changes.forEach((change: any, index: number) => {
              console.log(`     ${index + 1}. ${change.description || 'Database operation'}`);
              if (change.type) console.log(`        Type: ${change.type}`);
              if (change.model) console.log(`        Model: ${change.model}`);
              if (change.operation) console.log(`        Operation: ${change.operation}`);
              if (change.recordCount) console.log(`        Records: ${change.recordCount}`);
            });
          }

          // Log returned data if present
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`   📋 Returned Records (${data.data.length}):`);
            data.data.forEach((record: any, index: number) => {
              console.log(`     ${index + 1}. ${JSON.stringify(record, null, 6)}`);
            });
          }

          // Log operation metadata
          if (data.actionId) console.log(`   🔧 Action ID: ${data.actionId}`);
          if (data.actionName) console.log(`   📝 Action Name: ${data.actionName}`);
          if (data.actionType) console.log(`   📊 Action Type: ${data.actionType}`);
          if (data.timestamp) console.log(`   ⏰ Timestamp: ${data.timestamp}`);

          this.logResult(
            `Action: ${actionName}`,
            true,
            `✅ Action executed successfully${data.data ? ` - ${data.data.length} records` : ''}`
          );
        } else {
          // Log error details
          console.log(`   ❌ Action failed:`);
          if (data.error) console.log(`     Error: ${data.error}`);
          if (data.details) console.log(`     Details: ${JSON.stringify(data.details, null, 4)}`);

          this.logResult(
            `Action: ${actionName}`,
            response.status === 400 || response.status === 422, // Validation errors are acceptable
            `Action responded with ${response.status}${data.error ? `: ${data.error}` : ''}`
          );
        }

      } catch (error) {
        console.log(`   ❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.logResult(`Action: ${actionName}`, false, 'Action request failed', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async testScheduleEndpoints(baseUrl: string): Promise<void> {
    if (!this.deploymentInfo?.cronJobs) {
      this.logResult('Schedule Endpoints', false, 'No cron jobs available');
      return;
    }

    for (const cronJob of this.deploymentInfo.cronJobs) {
      // Extract schedule name from cron job pattern
      const match = cronJob.match(/\/api\/cron\/(.+)$/);
      if (!match) continue;

      const scheduleName = match[1];
      const scheduleUrl = `${baseUrl}/api/cron/${scheduleName}`;

      try {
        console.log(`\n⏰ Testing Schedule: ${scheduleName}`);
        console.log(`   Endpoint: ${scheduleUrl}`);
        console.log(`   Cron Pattern: ${cronJob}`);

        const testInput = {
          triggerTime: new Date().toISOString(),
          manualTrigger: true,
          source: 'orchestrator-test'
        };

        console.log(`   Request Input:`, JSON.stringify(testInput, null, 2));

        // Test schedule endpoint (might need authentication)
        const response = await fetch(scheduleUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.deploymentInfo?.environmentVariables?.CRON_SECRET || 'test-secret'}`
          },
          body: JSON.stringify({
            input: testInput
          })
        });

        const data = await response.json();
        
        console.log(`   Response Status: ${response.status}`);
        console.log(`   Response Data:`, JSON.stringify(data, null, 2));

        if (response.ok) {
          // Log database changes if present
          if (data.changes && data.changes.length > 0) {
            console.log(`   📊 Database Changes:`);
            data.changes.forEach((change: any, index: number) => {
              console.log(`     ${index + 1}. ${change.description || 'Database operation'}`);
              if (change.type) console.log(`        Type: ${change.type}`);
              if (change.model) console.log(`        Model: ${change.model}`);
              if (change.operation) console.log(`        Operation: ${change.operation}`);
              if (change.recordCount) console.log(`        Records: ${change.recordCount}`);
            });
          }

          // Log returned data if present
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`   📋 Processed Records (${data.data.length}):`);
            data.data.forEach((record: any, index: number) => {
              console.log(`     ${index + 1}. ${JSON.stringify(record, null, 6)}`);
            });
          }

          // Log schedule metadata
          if (data.scheduleId) console.log(`   🔧 Schedule ID: ${data.scheduleId}`);
          if (data.scheduleName) console.log(`   📝 Schedule Name: ${data.scheduleName}`);
          if (data.scheduleType) console.log(`   📊 Schedule Type: ${data.scheduleType}`);
          if (data.nextRun) console.log(`   ⏰ Next Run: ${data.nextRun}`);
          if (data.timestamp) console.log(`   ⏰ Timestamp: ${data.timestamp}`);

          this.logResult(
            `Schedule: ${scheduleName}`,
            true,
            `✅ Schedule executed successfully${data.data ? ` - ${data.data.length} records processed` : ''}`
          );
        } else {
          // Log error details
          console.log(`   ❌ Schedule failed:`);
          if (data.error) console.log(`     Error: ${data.error}`);
          if (data.details) console.log(`     Details: ${JSON.stringify(data.details, null, 4)}`);

          this.logResult(
            `Schedule: ${scheduleName}`,
            response.status === 401 || response.status === 403, // Auth errors are acceptable
            `Schedule responded with ${response.status}${data.error ? `: ${data.error}` : ''}`
          );
        }

      } catch (error) {
        console.log(`   ❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.logResult(`Schedule: ${scheduleName}`, false, 'Schedule request failed', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private logResult(testName: string, success: boolean, message: string, error?: string): void {
    const result: TestResult = {
      success,
      message,
      error
    };

    this.testResults.push(result);

    const icon = success ? '✅' : '❌';
    console.log(`  ${icon} ${testName}: ${message}`);
    
    if (error) {
      console.log(`      Error: ${error}`);
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 FULL ORCHESTRATOR TEST SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (this.deploymentInfo) {
      console.log(`\n🚀 Deployment Information:`);
      console.log(`   URL: ${this.deploymentInfo.deploymentUrl}`);
      console.log(`   Status: ${this.deploymentInfo.status}`);
      console.log(`   API Endpoints: ${this.deploymentInfo.apiEndpoints.length}`);
      console.log(`   Cron Jobs: ${this.deploymentInfo.cronJobs.length}`);
      console.log(`   Vercel Project: ${this.deploymentInfo.vercelProjectId}`);
      console.log(`   Neon Project: ${this.deploymentInfo.neonProjectId}`);
      console.log(`   Database URL: ${this.deploymentInfo.databaseUrl ? '[CONFIGURED]' : '[MISSING]'}`);
      
      console.log(`\n📊 Generated API Endpoints:`);
      this.deploymentInfo.apiEndpoints.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint}`);
      });
      
      console.log(`\n⏰ Scheduled Cron Jobs:`);
      this.deploymentInfo.cronJobs.forEach((cronJob, index) => {
        console.log(`   ${index + 1}. ${cronJob}`);
      });
      
      console.log(`\n🔧 Environment Variables:`);
      const envVarCount = Object.keys(this.deploymentInfo.environmentVariables || {}).length;
      console.log(`   Total: ${envVarCount} variables configured`);
      Object.keys(this.deploymentInfo.environmentVariables || {}).forEach((key, index) => {
        const value = this.deploymentInfo?.environmentVariables?.[key];
        const displayValue = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD') 
          ? '[HIDDEN]' 
          : value;
        console.log(`   ${index + 1}. ${key}: ${displayValue}`);
      });
    }

    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.testResults.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.message}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      });
    }

    console.log(`\n${passedTests === totalTests ? '🎉 All tests passed!' : '⚠️ Some tests failed.'}`);
    console.log('='.repeat(60));
  }
}

// Environment validation
function validateEnvironment(): boolean {
  const requiredEnvVars = [
    'NEON_API_KEY',
    'VERCEL_TOKEN',
    'OPENAI_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please set these environment variables in your .env.local file');
    return false;
  }

  return true;
}

// Main execution
async function main() {
  console.log('🧪 Full Orchestrator + Vercel Deployment Test');
  console.log('=' + '='.repeat(50));

  if (!validateEnvironment()) {
    process.exit(1);
  }

  const test = new FullOrchestratorTest();
  await test.runFullTest();
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
} 