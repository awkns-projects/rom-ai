#!/usr/bin/env tsx

import { runTestingAgent, type TestingAgentConfig } from '../src/lib/ai/tools/agent-builder/testing-agent';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * TESTING AGENT SCRIPT
 * 
 * Usage:
 * npm run test-agent "Create a task management system"
 * npm run test-agent "Build a fitness tracking app with workouts and nutrition"
 * npm run test-agent "Make a content creation platform for bloggers"
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧪 Testing Agent - Complete Agent Build, Deploy & Test System

Usage:
  npm run test-agent "Your agent request here"
  
Examples:
  npm run test-agent "Create a task management system with projects and deadlines"
  npm run test-agent "Build a fitness tracking app with workouts and nutrition logging"
  npm run test-agent "Make a content creation platform for bloggers with AI assistance"
  npm run test-agent "Create an inventory management system for small businesses"
  npm run test-agent "Build a customer support ticket system with priority handling"

Features:
  ✅ Complete agent orchestration (database, actions, schedules)
  ✅ Automatic Vercel + Neon deployment
  ✅ Comprehensive API testing
  ✅ AI-powered error detection and fixing
  ✅ Continuous improvement until working
  ✅ Detailed progress reporting

Environment Variables Required:
  - VERCEL_TOKEN (for deployment)
  - NEON_API_KEY (for database)
  - OPENAI_API_KEY (for AI operations)
    `);
    process.exit(1);
  }

  const userRequest = args.join(' ');
  
  console.log('🚀 Starting Testing Agent...');
  console.log(`📝 Request: ${userRequest}`);
  console.log('⏳ This may take several minutes for complete build, deploy, and test cycle...\n');

  // Validate required environment variables
  const requiredEnvVars = ['VERCEL_TOKEN', 'NEON_API_KEY', 'OPENAI_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\nPlease set these environment variables and try again.');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    const config: TestingAgentConfig = {
      userRequest,
      projectName: `test-agent-${Date.now()}`,
      maxRetries: 5,
      testTimeout: 30000,
      enableDeployment: true,
      enableAIFixes: true,
      onProgress: (message: string) => {
        console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
      },
      onError: (error: string, context?: any) => {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ ERROR: ${error}`);
        if (context && process.env.DEBUG) {
          console.error('Context:', JSON.stringify(context, null, 2));
        }
      },
      onSuccess: (result) => {
        console.log(`\n🎉 SUCCESS! Agent is live and working!`);
        console.log(`🌐 Deployment URL: ${result.deploymentUrl}`);
        console.log(`⚡ API Endpoints: ${result.testResults.apiTests.length}`);
        console.log(`⏰ Schedules: ${result.testResults.scheduleTests.length}`);
        console.log(`🔧 Fix Attempts: ${result.fixAttempts.length}`);
      }
    };

    const result = await runTestingAgent(config);
    
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('📊 TESTING AGENT RESULTS');
    console.log('='.repeat(80));
    
    console.log(`⏱️  Total Execution Time: ${minutes}m ${seconds}s`);
    console.log(`🎯 Overall Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`🏥 System Health: ${result.testResults.overallHealth.toUpperCase()}`);
    
    if (result.deploymentUrl) {
      console.log(`🌐 Deployment URL: ${result.deploymentUrl}`);
    }
    
    if (result.finalAgent) {
      console.log(`📋 Agent Name: ${result.finalAgent.name}`);
      console.log(`🏷️  Domain: ${result.finalAgent.domain}`);
      console.log(`📊 Database Models: ${result.finalAgent.models?.length || 0}`);
      console.log(`⚡ Actions: ${result.finalAgent.actions?.length || 0}`);
      console.log(`⏰ Schedules: ${result.finalAgent.schedules?.length || 0}`);
    }

    // Test Results
    console.log('\n📋 TEST RESULTS:');
    console.log(`   API Tests: ${result.testResults.apiTests.length}`);
    const successfulApiTests = result.testResults.apiTests.filter(t => t.status === 'success').length;
    console.log(`   ✅ Successful: ${successfulApiTests}/${result.testResults.apiTests.length}`);
    
    console.log(`   Schedule Tests: ${result.testResults.scheduleTests.length}`);
    const successfulScheduleTests = result.testResults.scheduleTests.filter(t => t.status === 'success').length;
    console.log(`   ✅ Successful: ${successfulScheduleTests}/${result.testResults.scheduleTests.length}`);

    // Fix Attempts
    if (result.fixAttempts.length > 0) {
      console.log('\n🔧 AI FIX ATTEMPTS:');
      result.fixAttempts.forEach((attempt, index) => {
        console.log(`   ${index + 1}. ${attempt.errorType.toUpperCase()}: ${attempt.success ? '✅' : '❌'}`);
        console.log(`      ${attempt.fixApplied}`);
      });
    }

    // API Endpoints
    if (result.testResults.apiTests.length > 0) {
      console.log('\n⚡ API ENDPOINTS:');
      result.testResults.apiTests.forEach((test, index) => {
        const status = test.status === 'success' ? '✅' : '❌';
        const timing = test.responseTime ? ` (${test.responseTime}ms)` : '';
        console.log(`   ${index + 1}. ${status} ${test.action.name}${timing}`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    }

    // Schedule Endpoints
    if (result.testResults.scheduleTests.length > 0) {
      console.log('\n⏰ SCHEDULE ENDPOINTS:');
      result.testResults.scheduleTests.forEach((test, index) => {
        const status = test.status === 'success' ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${test.schedule.name}`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    }

    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    
    if (result.success) {
      console.log('🎉 Testing Agent completed successfully!');
      console.log('🚀 Your agent is deployed and all APIs are working!');
      if (result.deploymentUrl) {
        console.log(`🌐 Visit: ${result.deploymentUrl}`);
      }
      process.exit(0);
    } else {
      console.log('❌ Testing Agent completed with issues');
      console.log('🔍 Check the errors above for details');
      process.exit(1);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.error(`\n❌ Testing Agent failed after ${minutes}m ${seconds}s:`);
    console.error(error instanceof Error ? error.message : 'Unknown error');
    
    if (process.env.DEBUG) {
      console.error('\nFull error details:');
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Testing Agent interrupted by user');
  console.log('🧹 Cleaning up...');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Testing Agent terminated');
  console.log('🧹 Cleaning up...');
  process.exit(143);
});

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error in testing agent:');
  console.error(error);
  process.exit(1);
}); 