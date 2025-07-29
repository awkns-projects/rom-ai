import type { AgentData } from '../types';
import { 
  executeStep0ComprehensiveAnalysis, 
  validateStep0Output, 
  extractStep0Insights, 
  type Step0Output 
} from './step0-comprehensive-analysis';
import { executeStep1DatabaseGeneration, validateStep1Output, extractModelInsights, type Step1Output } from './step1-database-generation';
import { executeStep2ActionGeneration, validateStep2Output, extractActionInsights, type Step2Output } from './step2-action-generation';
import { executeStep3ScheduleGeneration, validateStep3Output, extractScheduleInsights, type Step3Output } from './step3-schedule-generation';
import { executeStep4VercelDeployment, validateStep4Output, extractStep4Insights, testVercelConnection, updateExistingDeployment, checkDeploymentUpdateNeeded, type Step4Output, type Step4Input } from './step4-vercel-deployment';
import { performDeepMerge } from '../merging';

/**
 * AGENT BUILDER ORCHESTRATOR
 * 
 * Enhanced step-by-step agent generation with unified comprehensive analysis and deployment.
 * Steps: Analysis, Database, Actions, Schedules, Deployment
 */

export interface OrchestratorConfig {
  userRequest: string;
  existingAgent?: AgentData;
  changeAnalysis?: any;
  agentOverview?: any;
  conversationContext?: string;
  command?: string;
  // Enhanced options
  enableValidation?: boolean;
  enableInsights?: boolean;
  stopOnValidationFailure?: boolean;
  maxRetries?: number;
  // Deployment options
  enableDeployment?: boolean;
  deploymentConfig?: {
    projectName?: string;
    description?: string;
    environmentVariables?: Record<string, string>;
    region?: 'aws-us-east-1' | 'aws-us-west-2' | 'aws-eu-west-1' | 'aws-ap-southeast-1' | 'aws-us-east-2' | 'aws-eu-central-1'; // Updated to use Neon's AWS-prefixed format
    vercelTeam?: string;
  };
  // Step progress callback
  onStepProgress?: (stepId: string, status: 'processing' | 'complete', message?: string) => void;
  // Data persistence for state recovery
  dataStream?: any;
  documentId?: string;
  session?: any;
  // External APIs metadata (supports multiple APIs)
  externalApisMetadata?: Array<{
    provider: string;
    requiresConnection: boolean;
    connectionType: 'oauth' | 'api_key' | 'none';
    primaryUseCase: string;
    requiredScopes: string[];
    priority: 'primary' | 'secondary';
  }>;
}

export interface OrchestratorResult {
  success: boolean;
  agent?: AgentData;
  stepResults: {
    step0?: Step0Output;
    step1?: Step1Output;
    step2?: Step2Output;
    step3?: Step3Output;
    step4?: Step4Output;
  };
  insights: {
    comprehensive?: ReturnType<typeof extractStep0Insights>;
    database?: ReturnType<typeof extractModelInsights>;
    actions?: ReturnType<typeof extractActionInsights>;
    schedules?: ReturnType<typeof extractScheduleInsights>;
    deployment?: ReturnType<typeof extractStep4Insights>;
  };
  validationResults: {
    step0: boolean;
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    overall: boolean;
  };
  executionMetrics: {
    totalDuration: number;
    stepDurations: Record<string, number>;
    retryCount: number;
    qualityScore: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Main orchestrator for the complete agent building process
 */
export async function executeAgentGeneration(
  config: OrchestratorConfig
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  
  console.log('🚀 Starting complete agent building process...');
  console.log(`📝 User Request: ${config.userRequest}`);
  
  const result: OrchestratorResult = {
    success: false,
    stepResults: {},
    insights: {},
    validationResults: {
      step0: false,
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      overall: false
    },
    executionMetrics: {
      totalDuration: 0,
      stepDurations: {},
      retryCount: 0,
      qualityScore: 0
    },
    errors: [],
    warnings: []
  };

  try {
    // STEP 0: Comprehensive Analysis (Combined Phase A + Phase B)
    sendStepUpdate(config, 'step0', 'processing', 'Executing comprehensive analysis...');
    const step0StartTime = Date.now();
    
    const step0Result = await executeStepWithRetry(
      'step0',
      () => executeStep0ComprehensiveAnalysis({
        userRequest: config.userRequest,
        existingAgent: config.existingAgent,
        conversationContext: config.conversationContext,
        command: config.command,
        currentOperation: undefined
      }),
      config,
      result
    );

    if (!step0Result) {
      throw new Error('Step 0 (Comprehensive Analysis) failed');
    }

    result.stepResults.step0 = step0Result;
    result.executionMetrics.stepDurations.step0 = Date.now() - step0StartTime;
    
    // Validate Step 0
    if (config.enableValidation !== false) {
      result.validationResults.step0 = validateStep0Output(step0Result);
      if (!result.validationResults.step0 && config.stopOnValidationFailure) {
        throw new Error('Step 0 validation failed');
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.comprehensive = extractStep0Insights(step0Result);
    }

    // Extract external APIs metadata for avatar creator
    if (step0Result.externalApis && step0Result.externalApis.length > 0) {
      console.log('🔍 Step 0 detected external APIs:', {
        count: step0Result.externalApis.length,
        apis: step0Result.externalApis.map(api => ({
          provider: api.provider,
          priority: api.priority,
          requiresConnection: api.requiresConnection,
          connectionType: api.connectionType
        }))
      });

      config.externalApisMetadata = step0Result.externalApis;

      // IMMEDIATE FIX: Stream partial agent data with external API metadata
      // This allows AvatarCreator to show correct connection UI right away
      try {
        // Use type assertion to access avatar/theme properties that exist but aren't in our type definition
        const existingAgent = config.existingAgent as any;
        
        // DEBUG: Track what user data is available during partial streaming
        console.log('🔍 PARTIAL STREAMING DEBUG - existingAgent data:', {
          hasExistingAgent: !!existingAgent,
          existingAgentKeys: existingAgent ? Object.keys(existingAgent) : [],
          hasAvatar: !!existingAgent?.avatar,
          avatarType: existingAgent?.avatar?.type,
          hasTheme: !!existingAgent?.theme,
          theme: existingAgent?.theme,
          name: existingAgent?.name,
          description: existingAgent?.description,
          step0Name: step0Result.agentName,
          step0Description: step0Result.agentDescription
        });
        
        const partialAgentData = {
          id: config.existingAgent?.id || crypto.randomUUID(),
          name: step0Result.agentName || 'Generated Agent',
          description: step0Result.agentDescription || 'AI-generated agent description',
          domain: step0Result.domain || 'general',
          models: [], // Empty arrays for now - will be filled in later steps
          actions: [],
          schedules: [],
          externalApis: step0Result.externalApis || [],
          // PRESERVE USER-CONFIGURED DATA: Don't override avatar and theme from existing agent
          ...(existingAgent?.avatar && { avatar: existingAgent.avatar }),
          ...(existingAgent?.theme && { theme: existingAgent.theme }),
          // Preserve other user-configured data as well
          ...(existingAgent?.oauthTokens && { oauthTokens: existingAgent.oauthTokens }),
          ...(existingAgent?.apiKeys && { apiKeys: existingAgent.apiKeys }),
          ...(existingAgent?.credentials && { credentials: existingAgent.credentials })
        };

        // DEBUG: Track what gets included in partial stream
        console.log('🔍 PARTIAL STREAMING DEBUG - Final partialAgentData:', {
          hasAvatar: !!partialAgentData.avatar,
          avatarIncluded: !!partialAgentData.avatar,
          hasTheme: !!partialAgentData.theme,
          themeIncluded: !!partialAgentData.theme,
          theme: partialAgentData.theme,
          preservedKeys: Object.keys(partialAgentData).filter(key => 
            ['avatar', 'theme', 'oauthTokens', 'apiKeys', 'credentials'].includes(key)
          )
        });

        // Only stream if we have a valid dataStream and the agent data is meaningful
        if (config.dataStream && partialAgentData.name && partialAgentData.name !== 'Generated Agent') {
          // Use a slight delay to ensure the UI is ready to receive the data
          setTimeout(() => {
            if (config.dataStream) {
              // CRITICAL FIX: Don't stream if it would override user data with empty values
              // This prevents the partial stream from overriding user theme/avatar selections
              const hasUserData = partialAgentData.theme || partialAgentData.avatar;
              const wouldOverrideUserData = !hasUserData && (existingAgent?.theme || existingAgent?.avatar);
              
              if (wouldOverrideUserData) {
                console.log('🚫 SKIPPING partial stream to prevent overriding user selections:', {
                  hasThemeInPartial: !!partialAgentData.theme,
                  hasAvatarInPartial: !!partialAgentData.avatar,
                  hasThemeInExisting: !!existingAgent?.theme,
                  hasAvatarInExisting: !!existingAgent?.avatar
                });
                return;
              }
              
              console.log('✅ STREAMING partial data (safe - no user data to override):', {
                hasTheme: !!partialAgentData.theme,
                hasAvatar: !!partialAgentData.avatar
              });
              
              config.dataStream.writeData({ 
                type: 'agent-data', 
                content: JSON.stringify(partialAgentData, null, 2)
              });
            }
          }, 100);
        } else {
          console.log('⚠️ Skipping immediate agent data streaming - insufficient data or no stream available');
        }
      } catch (error) {
        console.error('❌ Error streaming partial agent data:', error);
        // Don't let this error break the entire orchestration
      }
    }

    sendStepUpdate(config, 'step0', 'complete', `Analysis completed: ${step0Result.models.length} models, ${step0Result.actions.length} actions, ${step0Result.schedules.length} schedules`);

    // STEP 1: Database Generation
    sendStepUpdate(config, 'step1', 'processing', 'Generating database schema...');
    const step1StartTime = Date.now();

    const step1Result = await executeStepWithRetry(
      'step1',
      () => executeStep1DatabaseGeneration({
        step0Analysis: step0Result,
        existingAgent: config.existingAgent,
        conversationContext: config.conversationContext,
        command: config.command
      }),
      config,
      result
    );

    if (!step1Result) {
      throw new Error('Step 1 (Database Generation) failed');
    }

    result.stepResults.step1 = step1Result;
    result.executionMetrics.stepDurations.step1 = Date.now() - step1StartTime;

    // Validate Step 1
    if (config.enableValidation !== false) {
      result.validationResults.step1 = validateStep1Output(step1Result);
      if (!result.validationResults.step1 && config.stopOnValidationFailure) {
        throw new Error('Step 1 validation failed');
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.database = extractModelInsights(step1Result);
    }

    sendStepUpdate(config, 'step1', 'complete', `Database generated: ${step1Result.models.length} models`);

    // STEP 2: Action Generation
    sendStepUpdate(config, 'step2', 'processing', 'Generating actions...');
    const step2StartTime = Date.now();

    const step2Result = await executeStepWithRetry(
      'step2',
      () => executeStep2ActionGeneration({
        step0Analysis: step0Result,
        databaseGeneration: step1Result,
        existingAgent: config.existingAgent,
        conversationContext: config.conversationContext,
        command: config.command
      }),
      config,
      result
    );

    if (!step2Result) {
      throw new Error('Step 2 (Action Generation) failed');
    }

    result.stepResults.step2 = step2Result;
    result.executionMetrics.stepDurations.step2 = Date.now() - step2StartTime;

    // Validate Step 2
    if (config.enableValidation !== false) {
      result.validationResults.step2 = validateStep2Output(step2Result);
      if (!result.validationResults.step2 && config.stopOnValidationFailure) {
        throw new Error('Step 2 validation failed');
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.actions = extractActionInsights(step2Result);
    }

    sendStepUpdate(config, 'step2', 'complete', `Actions generated: ${step2Result.actions.length} actions`);

    // STEP 3: Schedule Generation
    sendStepUpdate(config, 'step3', 'processing', 'Generating schedules...');
    const step3StartTime = Date.now();

    const step3Result = await executeStepWithRetry(
      'step3',
      () => executeStep3ScheduleGeneration({
        step0Analysis: step0Result,
        databaseGeneration: step1Result,
        actionGeneration: step2Result,
        existingAgent: config.existingAgent,
        conversationContext: config.conversationContext,
        command: config.command
      }),
      config,
      result
    );

    if (!step3Result) {
      throw new Error('Step 3 (Schedule Generation) failed');
    }

    result.stepResults.step3 = step3Result;
    result.executionMetrics.stepDurations.step3 = Date.now() - step3StartTime;

    // Validate Step 3
    if (config.enableValidation !== false) {
      result.validationResults.step3 = validateStep3Output(step3Result);
      if (!result.validationResults.step3 && config.stopOnValidationFailure) {
        throw new Error('Step 3 validation failed');
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.schedules = extractScheduleInsights(step3Result);
    }

    sendStepUpdate(config, 'step3', 'complete', `Schedules generated: ${step3Result.schedules.length} schedules`);

    // STEP 4: Deployment - DISABLED
    // Deployment is now handled separately through the UI modal
    console.log('⏭️ Skipping Step 4 (Deployment) - will be handled via UI modal');
    sendStepUpdate(config, 'step4', 'complete', 'Deployment deferred to UI modal');

    // FINAL ASSEMBLY
    console.log('🔧 FINAL ASSEMBLY: Combining all components...');
    result.agent = assembleCompleteAgent(config, step0Result, step1Result, step2Result, step3Result);

    // Calculate overall validation and quality
    result.validationResults.overall = calculateOverallValidation(result.validationResults);
    result.executionMetrics.qualityScore = calculateQualityScore(result);
    result.executionMetrics.totalDuration = Date.now() - startTime;

    result.success = true;

    console.log('🎉 AGENT BUILD COMPLETED SUCCESSFULLY!');
    console.log(`⏱️ Total Duration: ${result.executionMetrics.totalDuration}ms`);

    // Save final state
    if (config.dataStream && config.documentId && config.session) {
      await persistStepResult(config, 'final', result.agent);
    }

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ AGENT BUILD FAILED after ${duration}ms:`, error);
    
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    result.executionMetrics.totalDuration = duration;

    return result;
  }
}

/**
 * Send step progress update to UI
 */
function sendStepUpdate(
  config: OrchestratorConfig,
  stepId: string,
  status: 'processing' | 'complete',
  message?: string
) {
  // Send progress update via callback
  if (config.onStepProgress) {
    config.onStepProgress(stepId, status, message);
  }

  // Also send directly to UI via dataStream (no database persistence for steps)
  if (config.dataStream) {
    config.dataStream.writeData({ 
      type: 'agent-step', 
      content: {
        step: stepId,
        status,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Execute a step with retry logic and timing
 */
async function executeStepWithRetry<T>(
  stepName: string,
  stepFunction: () => Promise<T>,
  config: OrchestratorConfig,
  result: OrchestratorResult
): Promise<T | null> {
  const stepStartTime = Date.now();
  const maxRetries = config.maxRetries || 3;
  
  // Send processing update only if not step4 (step4 handles its own progress)
  if (stepName !== 'step4') {
    sendStepUpdate(config, stepName, 'processing', `Starting ${stepName}...`);
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Executing ${stepName} (attempt ${attempt}/${maxRetries})`);
      
      const stepResult = await stepFunction();
      
      // Calculate step duration
      const stepDuration = Date.now() - stepStartTime;
      result.executionMetrics.stepDurations[stepName] = stepDuration;
      
      // Send completion update with result summary only if not step4 (step4 handles its own completion)
      if (stepName !== 'step4') {
        const resultSummary = getStepResultSummary(stepName, stepResult);
        sendStepUpdate(config, stepName, 'complete', resultSummary);
      }
      
      // Persist step result to document if dataStream is available
      // NOTE: Removed step result persistence to reduce database load
      // if (config.dataStream && config.documentId) {
      //   await persistStepResult(config, stepName, stepResult);
      // }
      
      console.log(`✅ ${stepName} completed successfully in ${stepDuration}ms`);
      return stepResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ ${stepName} attempt ${attempt} failed:`, errorMessage);
      
      result.executionMetrics.retryCount++;
      
      if (attempt === maxRetries) {
        // Send failure update
        sendStepUpdate(config, stepName, 'processing', `${stepName} failed: ${errorMessage}`);
        
        console.error(`💥 ${stepName} failed after ${maxRetries} attempts`);
        return null;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying ${stepName} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

// Helper function to get step result summary for UI updates
function getStepResultSummary(stepName: string, stepResult: any): string {
  switch (stepName) {
    case 'step0':
      return `Analyzed requirements: ${stepResult.agentName || 'Unknown agent'} for ${stepResult.domain || 'unknown domain'}`;
    case 'step1':
      return `Database: ${stepResult.models?.length || 0} models, ${stepResult.enums?.length || 0} enums`;
    case 'step2':
      return `Actions: ${stepResult.actions?.length || 0} actions, ${stepResult.implementationComplexity} complexity`;
    case 'step3':
      return `Schedules: ${stepResult.schedules?.length || 0} schedules, ${stepResult.implementationComplexity} complexity`;
    case 'step4':
      return `Deployment: ${stepResult.deploymentUrl || 'No URL available'}`;
    default:
      return `${stepName} completed`;
  }
}

// Helper function to persist step results to document
async function persistStepResult(config: OrchestratorConfig, stepName: string, stepResult: any) {
  if (!config.dataStream || !config.documentId) return;
  
  try {
    // Create a serializable version of the step result
    const serializableResult = JSON.parse(JSON.stringify(stepResult));
    
    // Stream the step result data
    streamWithPersistence(config.dataStream, 'step-result', {
      step: stepName,
      result: serializableResult,
      timestamp: new Date().toISOString()
    }, config.documentId, config.session);
    
    console.log(`💾 Persisted ${stepName} result to document ${config.documentId}`);
  } catch (error) {
    console.error(`❌ Failed to persist ${stepName} result:`, error);
  }
}

// Helper function to stream with persistence (moved from index.ts)
function streamWithPersistence(dataStream: any, type: string, content: any, documentId: string, session: any) {
  // Always stream to UI
  dataStream.writeData({ type, content });
  
  // ONLY persist final agent data - not step progress to avoid database overload
  if (type === 'agent-data') {
    // Don't await to avoid blocking the stream, but ensure it saves
    saveStreamState(documentId, type, content, session).catch((error: any) => {
      console.error('❌ Failed to persist stream state:', error);
    });
  }
  // Note: Removed 'step-result' and 'agent-step' from persistence to prevent excessive database writes
}

// Helper function to save streaming state for recovery (simplified version from index.ts)
async function saveStreamState(documentId: string, type: string, content: any, session: any) {
  if (!session?.user?.id) return;
  
  try {
    // Import the necessary functions using relative path to avoid circular dependencies
    const { getDocumentById, saveOrUpdateDocument } = await import('../../../../db/queries');
    
    const streamState = {
      type,
      content,
      timestamp: new Date().toISOString(),
      documentId
    };
    
    // Save to document metadata for recovery
    const existingDoc = await getDocumentById({ id: documentId }).catch(() => null);
    if (existingDoc) {
      const currentMetadata = (existingDoc.metadata as any) || {};
      const streamHistory = currentMetadata.streamHistory || [];
      
      // Keep last 50 stream states for recovery
      const updatedStreamHistory = [...streamHistory, streamState].slice(-50);
      
      await saveOrUpdateDocument({
        id: documentId,
        title: existingDoc.title,
        content: existingDoc.content || '{}',
        kind: existingDoc.kind,
        userId: (session?.user?.id || 'unknown') as string,
        metadata: {
          ...currentMetadata,
          streamHistory: updatedStreamHistory,
          lastStreamUpdate: new Date().toISOString(),
          stepProgress: {
            ...currentMetadata.stepProgress,
            [type === 'agent-step' ? content.step : 'general']: content.status || 'processing'
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Error saving stream state:', error);
  }
}

/**
 * Assemble the complete agent from all step results
 */
function assembleCompleteAgent(
  config: OrchestratorConfig,
  step0: Step0Output,
  step1: Step1Output,
  step2: Step2Output,
  step3: Step3Output
): AgentData {
  const now = new Date().toISOString();
  
  // Cast existing agent to access avatar/theme properties
  const existingAgent = config.existingAgent as any;

  const newAgentData: AgentData = {
    id: config.existingAgent?.id || crypto.randomUUID(),
    name: step0.agentName || 'Generated Agent',
    description: step0.agentDescription || 'AI-generated agent description',
    domain: step0.domain || 'general',
    models: step1.models,
    enums: step1.enums, // No longer part of Step1Output
    actions: step2.actions,
    schedules: step3.schedules,
    prismaSchema: step1.prismaSchema, // Not needed for UI
    createdAt: config.existingAgent?.createdAt || now,
    externalApis: step0.externalApis || [],
    // Preserve existing deployment data if available
    deployment: config.existingAgent?.deployment,
    metadata: {
      createdAt: config.existingAgent?.metadata?.createdAt || now,
      updatedAt: now,
      version: crypto.randomUUID(),
      lastModifiedBy: 'ai-agent-builder',
      tags: [
        step0.operation || 'create',
        step0.domain || 'general',
        step0.agentName || 'agent'
      ],
      status: config.existingAgent?.deployment ? 'deployed' : 'generated'
    }
  };

  // CRITICAL FIX: Preserve user-configured avatar and theme data
  const preservedData: any = {};
  
  if (existingAgent?.avatar) {
    preservedData.avatar = existingAgent.avatar;
    console.log('🎨 ASSEMBLY: Preserving user avatar data:', existingAgent.avatar);
  }
  
  if (existingAgent?.theme) {
    preservedData.theme = existingAgent.theme;
    console.log('🎨 ASSEMBLY: Preserving user theme data:', existingAgent.theme);
  }
  
  // Preserve other user-configured data
  if (existingAgent?.oauthTokens) {
    preservedData.oauthTokens = existingAgent.oauthTokens;
  }
  
  if (existingAgent?.apiKeys) {
    preservedData.apiKeys = existingAgent.apiKeys;
  }
  
  if (existingAgent?.credentials) {
    preservedData.credentials = existingAgent.credentials;
  }
  
  // Merge preserved data into the new agent data
  const finalAgentData = { ...newAgentData, ...preservedData };
  
  console.log('🔍 ASSEMBLY COMPLETE:', {
    preservedAvatar: !!preservedData.avatar,
    preservedTheme: !!preservedData.theme,
    preservedOAuth: !!preservedData.oauthTokens,
    preservedApiKeys: !!preservedData.apiKeys,
    finalHasAvatar: !!finalAgentData.avatar,
    finalHasTheme: !!finalAgentData.theme
  });

  return finalAgentData;
}

/**
 * Calculate overall validation result
 */
function calculateOverallValidation(validationResults: OrchestratorResult['validationResults']): boolean {
  const results = [
    validationResults.step0,
    validationResults.step1,
    validationResults.step2,
    validationResults.step3,
    validationResults.step4
  ];
  
  // Simple validation - require at least 50% of steps to pass
  const passedCount = results.filter(Boolean).length;
  const requiredPasses = Math.ceil(results.length * 0.5);
  
  console.log(`📊 Overall validation: ${passedCount}/${results.length} passed (need ${requiredPasses})`);
  
  return passedCount >= requiredPasses;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(result: OrchestratorResult): number {
  // Simple quality score based on completeness
  const hasModels = (result.stepResults.step1?.models.length || 0) > 0;
  const hasActions = (result.stepResults.step2?.actions.length || 0) > 0;
  const hasSchedules = (result.stepResults.step3?.schedules.length || 0) > 0;
  
  let score = 0;
  if (hasModels) score += 40;
  if (hasActions) score += 30;
  if (hasSchedules) score += 30;
  
  return score;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced execution with specific configuration presets
 */
export async function executeAgentGenerationFast(
  userRequest: string,
  existingAgent?: AgentData
): Promise<OrchestratorResult> {
  return executeAgentGeneration({
    userRequest,
    existingAgent,
    enableValidation: false,
    enableInsights: false,
    stopOnValidationFailure: false,
    maxRetries: 1
  });
}

export async function executeAgentGenerationRobust(
  userRequest: string,
  existingAgent?: AgentData,
  changeAnalysis?: any
): Promise<OrchestratorResult> {
  return executeAgentGeneration({
    userRequest,
    existingAgent,
    changeAnalysis,
    enableValidation: true,
    enableInsights: true,
    stopOnValidationFailure: true,
    maxRetries: 3
  });
}

export async function executeAgentGenerationBalanced(
  userRequest: string,
  existingAgent?: AgentData
): Promise<OrchestratorResult> {
  return executeAgentGeneration({
    userRequest,
    existingAgent,
    enableValidation: true,
    enableInsights: true,
    stopOnValidationFailure: false,
    maxRetries: 2
  });
}

/**
 * Test Vercel API connection for deployment readiness
 */
export async function testVercelDeploymentReadiness(): Promise<{ success: boolean; message: string; details?: any }> {
  console.log('🔍 Testing Vercel deployment readiness...');
  
  try {
    const connectionTest = await testVercelConnection();
    
    if (connectionTest.success) {
      console.log('✅ Vercel deployment is ready!');
      return {
        success: true,
        message: 'Vercel deployment is ready! API key is valid and connection successful.',
        details: connectionTest.details
      };
    } else {
      console.log('❌ Vercel deployment is not ready:', connectionTest.message);
      return {
        success: false,
        message: `Vercel deployment not ready: ${connectionTest.message}`,
        details: connectionTest.details
      };
    }
    
  } catch (error) {
    console.error('❌ Error testing Vercel deployment readiness:', error);
    return {
      success: false,
      message: `Error testing Vercel deployment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}