import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { executeAgentGeneration, type OrchestratorConfig, type OrchestratorResult } from './steps/orchestrator';
import { executeStep4VercelDeployment, type Step4Input, type Step4Output } from './steps/step4-vercel-deployment';
import { analyzeAndFixErrors, AIErrorFixer } from './ai-fixer';
import type { AgentData, AgentAction, AgentSchedule } from './types';

/**
 * TESTING AGENT
 * 
 * Comprehensive testing system that:
 * 1. Orchestrates complete agent building process
 * 2. Deploys the agent to Vercel + Neon
 * 3. Tests all API endpoints and schedules
 * 4. Detects errors and uses AI to fix them
 * 5. Iterates until everything works properly
 */

export interface TestingAgentConfig {
  userRequest: string;
  projectName?: string;
  maxRetries?: number;
  testTimeout?: number;
  enableDeployment?: boolean;
  enableAIFixes?: boolean;
  onProgress?: (message: string) => void;
  onError?: (error: string, context: any) => void;
  onSuccess?: (result: TestingResult) => void;
}

export interface TestingResult {
  success: boolean;
  orchestratorResult?: OrchestratorResult;
  deploymentResult?: Step4Output;
  testResults: {
    apiTests: APITestResult[];
    scheduleTests: ScheduleTestResult[];
    overallHealth: 'healthy' | 'degraded' | 'failed';
  };
  fixAttempts: FixAttempt[];
  finalAgent?: AgentData;
  deploymentUrl?: string;
  executionTime: number;
  errors: string[];
  warnings: string[];
}

export interface APITestResult {
  endpoint: string;
  action: AgentAction;
  status: 'success' | 'error' | 'timeout';
  responseTime?: number;
  response?: any;
  error?: string;
  httpStatus?: number;
}

export interface ScheduleTestResult {
  schedule: AgentSchedule;
  cronEndpoint: string;
  status: 'success' | 'error' | 'not_tested';
  error?: string;
  testMethod: 'direct_call' | 'cron_validation';
}

export interface FixAttempt {
  iteration: number;
  errorType: 'build' | 'deployment' | 'api' | 'database';
  errorMessage: string;
  aiAnalysis: string;
  fixApplied: string;
  success: boolean;
  filesModified: string[];
}

/**
 * Main Testing Agent Class
 */
export class TestingAgent {
  private config: TestingAgentConfig;
  private fixAttempts: FixAttempt[] = [];
  private currentIteration = 0;

  constructor(config: TestingAgentConfig) {
    this.config = {
      maxRetries: 5,
      testTimeout: 30000,
      enableDeployment: true,
      enableAIFixes: true,
      ...config
    };
  }

  private log(message: string) {
    console.log(`[TestingAgent] ${message}`);
    if (this.config.onProgress) {
      this.config.onProgress(message);
    }
  }

  private logError(error: string, context?: any) {
    console.error(`[TestingAgent] ERROR: ${error}`);
    if (this.config.onError) {
      this.config.onError(error, context);
    }
  }

  /**
   * Main execution method - runs the complete testing cycle
   */
  async execute(): Promise<TestingResult> {
    const startTime = Date.now();
    
    const result: TestingResult = {
      success: false,
      testResults: {
        apiTests: [],
        scheduleTests: [],
        overallHealth: 'failed'
      },
      fixAttempts: [],
      executionTime: 0,
      errors: [],
      warnings: []
    };

    try {
      this.log('🚀 Starting comprehensive testing agent...');
      this.log(`📝 Request: ${this.config.userRequest}`);

      // Phase 1: Build the agent
      this.log('🔧 Phase 1: Building agent with orchestrator...');
      result.orchestratorResult = await this.buildAgent();
      
      if (!result.orchestratorResult.success) {
        throw new Error('Agent building failed');
      }

      result.finalAgent = result.orchestratorResult.agent;

      // Phase 2: Deploy the agent (if enabled)
      if (this.config.enableDeployment) {
        this.log('🚀 Phase 2: Deploying agent to Vercel + Neon...');
        result.deploymentResult = await this.deployAgent(result.orchestratorResult);
        result.deploymentUrl = result.deploymentResult.deploymentUrl;
      }

      // Phase 3: Test the deployed agent
      if (result.deploymentResult) {
        this.log('🧪 Phase 3: Testing deployed agent APIs...');
        result.testResults = await this.testDeployedAgent(result.deploymentResult, result.finalAgent!);
      }

      // Phase 4: Fix errors if any found
      if (this.config.enableAIFixes && result.testResults.overallHealth !== 'healthy') {
        this.log('🔧 Phase 4: Attempting AI-powered error fixes...');
        await this.fixErrorsWithAI(result);
      }

      // Calculate final success
      result.success = result.testResults.overallHealth === 'healthy';
      result.fixAttempts = this.fixAttempts;
      result.executionTime = Date.now() - startTime;

      if (result.success) {
        this.log('🎉 Testing agent completed successfully!');
        if (this.config.onSuccess) {
          this.config.onSuccess(result);
        }
      } else {
        this.log('❌ Testing agent completed with issues');
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logError(errorMessage, error);
      result.errors.push(errorMessage);
      result.executionTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Build the agent using the orchestrator
   */
  private async buildAgent(): Promise<OrchestratorResult> {
    const config: OrchestratorConfig = {
      userRequest: this.config.userRequest,
      enableValidation: true,
      enableInsights: true,
      stopOnValidationFailure: false,
      maxRetries: 3,
      enableDeployment: false, // We handle deployment separately
      onStepProgress: (stepId, status, message) => {
        this.log(`Step ${stepId}: ${status} - ${message || ''}`);
      }
    };

    return await executeAgentGeneration(config);
  }

  /**
   * Deploy the agent using Step 4 deployment
   */
  private async deployAgent(orchestratorResult: OrchestratorResult): Promise<Step4Output> {
    const projectName = this.config.projectName || 
      `test-agent-${Date.now()}`;

    const deploymentInput: Step4Input = {
      step1Output: orchestratorResult.stepResults.step1!,
      step2Output: orchestratorResult.stepResults.step2!,
      step3Output: orchestratorResult.stepResults.step3!,
      projectName,
      description: 'Testing agent deployment',
      agentConfig: {
        name: orchestratorResult.agent?.name,
        description: orchestratorResult.agent?.description,
        domain: orchestratorResult.agent?.domain
      }
    };

    return await executeStep4VercelDeployment(deploymentInput, (message) => {
      this.log(`Deployment: ${message}`);
    });
  }

  /**
   * Test all APIs and schedules of the deployed agent
   */
  private async testDeployedAgent(deployment: Step4Output, agent: AgentData): Promise<TestingResult['testResults']> {
    const apiTests: APITestResult[] = [];
    const scheduleTests: ScheduleTestResult[] = [];

    // Test API endpoints
    this.log(`🧪 Testing ${agent.actions.length} API endpoints...`);
    for (const action of agent.actions) {
      const testResult = await this.testAPIEndpoint(deployment.deploymentUrl, action);
      apiTests.push(testResult);
      
      if (testResult.status === 'success') {
        this.log(`✅ API ${action.name}: ${testResult.responseTime}ms`);
      } else {
        this.log(`❌ API ${action.name}: ${testResult.error}`);
      }
    }

    // Test schedule endpoints
    this.log(`⏰ Testing ${agent.schedules.length} schedule endpoints...`);
    for (const schedule of agent.schedules) {
      const testResult = await this.testScheduleEndpoint(deployment.deploymentUrl, schedule);
      scheduleTests.push(testResult);
      
      if (testResult.status === 'success') {
        this.log(`✅ Schedule ${schedule.name}: OK`);
      } else {
        this.log(`❌ Schedule ${schedule.name}: ${testResult.error}`);
      }
    }

    // Calculate overall health
    const totalTests = apiTests.length + scheduleTests.length;
    const successfulTests = apiTests.filter(t => t.status === 'success').length + 
                           scheduleTests.filter(t => t.status === 'success').length;
    
    let overallHealth: 'healthy' | 'degraded' | 'failed';
    if (successfulTests === totalTests) {
      overallHealth = 'healthy';
    } else if (successfulTests > totalTests * 0.5) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'failed';
    }

    this.log(`📊 Test Summary: ${successfulTests}/${totalTests} passed (${overallHealth})`);

    return {
      apiTests,
      scheduleTests,
      overallHealth
    };
  }

  /**
   * Test a single API endpoint
   */
  private async testAPIEndpoint(baseUrl: string, action: AgentAction): Promise<APITestResult> {
    const endpoint = `${baseUrl}/api/${action.name}`;
    const startTime = Date.now();

    try {
      // Generate test parameters based on action schema
      const testParams = this.generateTestParameters(action);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testParams),
        signal: AbortSignal.timeout(this.config.testTimeout!)
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.text();

      if (response.ok) {
        return {
          endpoint,
          action,
          status: 'success',
          responseTime,
          response: responseData,
          httpStatus: response.status
        };
      } else {
        return {
          endpoint,
          action,
          status: 'error',
          responseTime,
          error: `HTTP ${response.status}: ${responseData}`,
          httpStatus: response.status
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        endpoint,
        action,
        status: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'error',
        responseTime,
        error: errorMessage
      };
    }
  }

  /**
   * Test a schedule endpoint
   */
  private async testScheduleEndpoint(baseUrl: string, schedule: AgentSchedule): Promise<ScheduleTestResult> {
    const cronEndpoint = `${baseUrl}/api/cron/${schedule.name}`;

    try {
      // Test by calling the cron endpoint directly
      const response = await fetch(cronEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
        },
        signal: AbortSignal.timeout(this.config.testTimeout!)
      });

      if (response.ok) {
        return {
          schedule,
          cronEndpoint,
          status: 'success',
          testMethod: 'direct_call'
        };
      } else {
        const errorText = await response.text();
        return {
          schedule,
          cronEndpoint,
          status: 'error',
          error: `HTTP ${response.status}: ${errorText}`,
          testMethod: 'direct_call'
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        schedule,
        cronEndpoint,
        status: 'error',
        error: errorMessage,
        testMethod: 'direct_call'
      };
    }
  }

  /**
   * Generate test parameters for an action based on its schema
   */
  private generateTestParameters(action: AgentAction): any {
    // Simple parameter generation based on action name and description
    // In practice, this could be enhanced to parse actual parameter schemas
    const params: any = {};
    
    // Generate basic test parameters based on common patterns
    const actionName = action.name.toLowerCase();
    
    // Common parameter patterns
    if (actionName.includes('user') || actionName.includes('member')) {
      params.userId = 'test-user-123';
    }
    
    if (actionName.includes('create') || actionName.includes('add')) {
      params.name = `test_${actionName}`;
      params.description = `Test description for ${actionName}`;
    }
    
    if (actionName.includes('update') || actionName.includes('edit')) {
      params.id = 'test-id-123';
      params.updates = { name: 'Updated Name' };
    }
    
    if (actionName.includes('delete') || actionName.includes('remove')) {
      params.id = 'test-id-123';
    }
    
    if (actionName.includes('search') || actionName.includes('find')) {
      params.query = 'test query';
      params.limit = 10;
    }
    
    if (actionName.includes('report') || actionName.includes('analytics')) {
      params.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      params.endDate = new Date().toISOString();
    }
    
    // Default parameters if none of the patterns match
    if (Object.keys(params).length === 0) {
      params.input = `test input for ${action.name}`;
      params.data = { test: true };
    }

    return params;
  }

  /**
   * Use AI to analyze errors and attempt fixes
   */
  private async fixErrorsWithAI(result: TestingResult): Promise<void> {
    const maxFixAttempts = this.config.maxRetries || 5;

    for (let attempt = 1; attempt <= maxFixAttempts; attempt++) {
      this.currentIteration = attempt;
      this.log(`🔧 AI Fix Attempt ${attempt}/${maxFixAttempts}`);

      // Collect all errors
      const errors = this.collectAllErrors(result);
      if (errors.length === 0) {
        this.log('✅ No errors found, stopping fix attempts');
        break;
      }

      // Use the enhanced AI fixer
      try {
        const { analyses, fixAttempts } = await analyzeAndFixErrors(
          errors,
          result.testResults,
          result.finalAgent!,
          result.deploymentUrl
        );

        // Add fix attempts to our results
        this.fixAttempts.push(...fixAttempts);

        // Log AI analysis summary
        if (analyses.length > 0) {
          const fixer = new AIErrorFixer();
          const summary = fixer.generateFixSummary(analyses);
          this.log(summary);
        }

        // Check if any fixes were successful
        const successfulFixes = fixAttempts.filter(f => f.success);
        if (successfulFixes.length > 0) {
          this.log(`✅ Applied ${successfulFixes.length}/${fixAttempts.length} fixes successfully`);
          
          // Re-deploy and re-test
          if (result.deploymentResult) {
            try {
              this.log('🚀 Re-deploying with fixes...');
              // Update deployment with fixes
              result.deploymentResult = await this.deployAgent(result.orchestratorResult!);
              result.deploymentUrl = result.deploymentResult.deploymentUrl;
              
              // Re-test
              this.log('🧪 Re-testing after fixes...');
              result.testResults = await this.testDeployedAgent(result.deploymentResult, result.finalAgent!);
              
              if (result.testResults.overallHealth === 'healthy') {
                this.log('🎉 All issues resolved!');
                break;
              } else {
                this.log(`⚠️ Health improved to: ${result.testResults.overallHealth}`);
              }
            } catch (error) {
              this.logError(`Re-deployment failed: ${error}`);
            }
          }
        } else {
          this.log(`❌ Fix attempt ${attempt} failed - no successful fixes applied`);
        }

      } catch (error) {
        this.logError(`AI error analysis failed: ${error}`);
        
        // Fallback to simple fix attempt
        const fallbackFixAttempt: FixAttempt = {
          iteration: attempt,
          errorType: 'api',
          errorMessage: errors.join('; '),
          aiAnalysis: 'AI analysis failed, using fallback approach',
          fixApplied: 'Applied generic error handling improvements',
          success: false,
          filesModified: []
        };
        
        this.fixAttempts.push(fallbackFixAttempt);
      }
    }
  }

  /**
   * Collect all errors from test results
   */
  private collectAllErrors(result: TestingResult): string[] {
    const errors: string[] = [];

    // API errors
    for (const apiTest of result.testResults.apiTests) {
      if (apiTest.status === 'error' && apiTest.error) {
        errors.push(`API ${apiTest.action.name}: ${apiTest.error}`);
      }
    }

    // Schedule errors
    for (const scheduleTest of result.testResults.scheduleTests) {
      if (scheduleTest.status === 'error' && scheduleTest.error) {
        errors.push(`Schedule ${scheduleTest.schedule.name}: ${scheduleTest.error}`);
      }
    }

    // General errors
    errors.push(...result.errors);

    return errors;
  }


}

/**
 * Convenience function to run the testing agent
 */
export async function runTestingAgent(config: TestingAgentConfig): Promise<TestingResult> {
  const agent = new TestingAgent(config);
  return await agent.execute();
}

/**
 * Quick test function for development
 */
export async function quickTest(userRequest: string): Promise<TestingResult> {
  return await runTestingAgent({
    userRequest,
    maxRetries: 3,
    enableDeployment: true,
    enableAIFixes: true,
    onProgress: (message) => console.log(`[Progress] ${message}`),
    onError: (error) => console.error(`[Error] ${error}`),
    onSuccess: (result) => console.log(`[Success] Deployment: ${result.deploymentUrl}`)
  });
} 