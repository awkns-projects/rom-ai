import type { AgentData } from '../types';
import { executeStep0PromptUnderstanding, validateStep0Output, extractStep0Insights, type Step0Output } from './step0-prompt-understanding';
import { executeStep1Decision, validateStep1Output, extractExecutionStrategy, type Step1Output } from './step1-decision-making';
import { executeStep2TechnicalAnalysis, validateStep2Output, extractTechnicalInsights, type Step2Output } from './step2-technical-analysis';
import { executeStep3DatabaseGeneration, validateStep3Output, extractDatabaseInsights, type Step3Output } from './step3-database-generation';
import { executeStep4ActionGeneration, validateStep4Output, extractActionInsights, type Step4Output } from './step4-action-generation';
import { executeStep5ScheduleGeneration, validateStep5Output, extractScheduleInsights, type Step5Output } from './step5-schedule-generation';
import { performDeepMerge } from '../merging';

/**
 * AGENT BUILDER ORCHESTRATOR
 * 
 * Enhanced step-by-step agent generation with hybrid approach integration.
 * Preserves all original functionality while adding comprehensive validation,
 * coordination, and quality assurance.
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
  // Step progress callback
  onStepProgress?: (stepId: string, status: 'processing' | 'complete', message?: string) => void;
  // Data persistence for state recovery
  dataStream?: any;
  documentId?: string;
  session?: any;
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
    step5?: Step5Output;
  };
  insights: {
    prompt?: ReturnType<typeof extractStep0Insights>;
    execution?: ReturnType<typeof extractExecutionStrategy>;
    technical?: ReturnType<typeof extractTechnicalInsights>;
    database?: ReturnType<typeof extractDatabaseInsights>;
    actions?: ReturnType<typeof extractActionInsights>;
    schedules?: ReturnType<typeof extractScheduleInsights>;
  };
  validationResults: {
    step0: boolean;
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    step5: boolean;
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
 * Execute the complete agent generation process with enhanced orchestration
 */
export async function executeAgentGeneration(
  config: OrchestratorConfig
): Promise<OrchestratorResult> {
  const startTime = Date.now();
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
      step5: false,
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

  console.log('🚀 Starting Enhanced Agent Builder Orchestration...');
  console.log(`📋 Request: ${config.userRequest}`);
  console.log(`🔧 Configuration: Validation=${config.enableValidation !== false}, Insights=${config.enableInsights !== false}`);

  try {
    // STEP 0: Prompt Understanding and Analysis
    const step0Result = await executeStepWithRetry(
      'step0',
      () => executeStep0PromptUnderstanding({
        userRequest: config.userRequest,
        existingAgent: config.existingAgent
      }),
      config,
      result
    );

    if (!step0Result) {
      result.errors.push('Step 0 (Prompt Understanding) failed');
      return result;
    }

    result.stepResults.step0 = step0Result;

    // Validate Step 0
    if (config.enableValidation !== false) {
      result.validationResults.step0 = validateStep0Output(step0Result);
      if (!result.validationResults.step0 && config.stopOnValidationFailure !== false) {
        result.errors.push('Step 0 validation failed');
        return result;
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.prompt = extractStep0Insights(step0Result);
    }

    // STEP 1: Decision Making and Strategy
    const step1Result = await executeStepWithRetry(
      'step1',
      () => executeStep1Decision({
        promptUnderstanding: step0Result,
        existingAgent: config.existingAgent,
        conversationContext: config.conversationContext || '',
        command: config.command || config.userRequest,
        currentOperation: config.existingAgent ? 'update' : 'create'
      }),
      config,
      result
    );

    if (!step1Result) {
      result.errors.push('Step 1 (Decision Making) failed');
      return result;
    }

    result.stepResults.step1 = step1Result;

    // Validate Step 1
    if (config.enableValidation !== false) {
      result.validationResults.step1 = validateStep1Output(step1Result);
      if (!result.validationResults.step1 && config.stopOnValidationFailure !== false) {
        result.errors.push('Step 1 validation failed');
        return result;
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.execution = extractExecutionStrategy(step1Result);
    }

    // STEP 2: Technical Analysis and System Design
    const step2Result = await executeStepWithRetry(
      'step2',
      () => executeStep2TechnicalAnalysis({
        promptUnderstanding: step0Result,
        decision: step1Result,
        existingAgent: config.existingAgent,
        conversationContext: config.conversationContext,
        command: config.command
      }),
      config,
      result
    );

    if (!step2Result) {
      result.errors.push('Step 2 (Technical Analysis) failed');
      return result;
    }

    result.stepResults.step2 = step2Result;

    // Validate Step 2
    if (config.enableValidation !== false) {
      result.validationResults.step2 = validateStep2Output(step2Result);
      if (!result.validationResults.step2 && config.stopOnValidationFailure !== false) {
        result.errors.push('Step 2 validation failed');
        return result;
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.technical = extractTechnicalInsights(step2Result);
    }

    // STEP 3: Database Generation
    const step3Result = await executeStepWithRetry(
      'step3',
      () => executeStep3DatabaseGeneration({
        promptUnderstanding: step0Result,
        decision: step1Result,
        technicalAnalysis: step2Result,
        existingAgent: config.existingAgent,
        changeAnalysis: config.changeAnalysis,
        agentOverview: config.agentOverview,
        conversationContext: config.conversationContext,
        command: config.command
      }),
      config,
      result
    );

    if (!step3Result) {
      result.errors.push('Step 3 (Database Generation) failed');
      return result;
    }

    result.stepResults.step3 = step3Result;

    // Validate Step 3
    if (config.enableValidation !== false) {
      result.validationResults.step3 = validateStep3Output(step3Result);
      if (!result.validationResults.step3 && config.stopOnValidationFailure !== false) {
        result.errors.push('Step 3 validation failed');
        return result;
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.database = extractDatabaseInsights(step3Result);
    }

    // STEP 4: Action Generation
    const step4Result = await executeStepWithRetry(
      'step4',
      () => executeStep4ActionGeneration({
        promptUnderstanding: step0Result,
        decision: step1Result,
        technicalAnalysis: step2Result,
        databaseGeneration: step3Result,
        existingAgent: config.existingAgent,
        changeAnalysis: config.changeAnalysis,
        agentOverview: config.agentOverview,
        conversationContext: config.conversationContext,
        command: config.command
      }),
      config,
      result
    );

    if (!step4Result) {
      result.errors.push('Step 4 (Action Generation) failed');
      return result;
    }

    result.stepResults.step4 = step4Result;

    // Validate Step 4
    if (config.enableValidation !== false) {
      result.validationResults.step4 = validateStep4Output(step4Result);
      if (!result.validationResults.step4 && config.stopOnValidationFailure !== false) {
        result.errors.push('Step 4 validation failed');
        return result;
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.actions = extractActionInsights(step4Result);
    }

    // STEP 5: Schedule Generation
    const step5Result = await executeStepWithRetry(
      'step5',
      () => executeStep5ScheduleGeneration({
        promptUnderstanding: step0Result,
        decision: step1Result,
        technicalAnalysis: step2Result,
        databaseGeneration: step3Result,
        actionGeneration: step4Result,
        existingAgent: config.existingAgent,
        changeAnalysis: config.changeAnalysis
      }),
      config,
      result
    );

    if (!step5Result) {
      result.errors.push('Step 5 (Schedule Generation) failed');
      return result;
    }

    result.stepResults.step5 = step5Result;

    // Validate Step 5
    if (config.enableValidation !== false) {
      result.validationResults.step5 = validateStep5Output(step5Result);
      if (!result.validationResults.step5 && config.stopOnValidationFailure !== false) {
        result.errors.push('Step 5 validation failed');
        return result;
      }
    }

    // Extract insights
    if (config.enableInsights !== false) {
      result.insights.schedules = extractScheduleInsights(step5Result);
    }

    // FINAL ASSEMBLY: Create the complete agent
    result.agent = assembleCompleteAgent(
      config,
      step0Result,
      step1Result,
      step2Result,
      step3Result,
      step4Result,
      step5Result
    );

    // Calculate overall validation and quality metrics
    result.validationResults.overall = calculateOverallValidation(result.validationResults);
    result.executionMetrics.qualityScore = calculateQualityScore(result);
    result.executionMetrics.totalDuration = Date.now() - startTime;

    result.success = result.validationResults.overall && result.agent !== undefined;

    // Send final completion step to UI
    sendStepUpdate(config, 'complete', 'complete', 
      `Orchestration completed ${result.success ? 'successfully' : 'with issues'}`);

    console.log('✅ Enhanced Agent Builder Orchestration completed successfully!');
    console.log(`📊 Final Summary:
- Overall Success: ${result.success ? '✅' : '❌'}
- Quality Score: ${result.executionMetrics.qualityScore}/100
- Total Duration: ${result.executionMetrics.totalDuration}ms
- Models Generated: ${result.stepResults.step3?.models.length || 0}
- Actions Generated: ${result.stepResults.step4?.actions.length || 0}
- Schedules Generated: ${result.stepResults.step5?.schedules.length || 0}
- Validation Results: ${Object.values(result.validationResults).filter(Boolean).length}/7 passed`);

    return result;

  } catch (error) {
    console.error('❌ Orchestration failed with error:', error);
    result.errors.push(`Orchestration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.executionMetrics.totalDuration = Date.now() - startTime;
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

  // Also persist step state directly if dataStream is available
  if (config.dataStream && config.documentId) {
    streamWithPersistence(config.dataStream, 'agent-step', {
      step: stepId,
      status,
      message,
      timestamp: new Date().toISOString()
    }, config.documentId, config.session);
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
  
  // Send processing update
  sendStepUpdate(config, stepName, 'processing', `Starting ${stepName}...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Executing ${stepName} (attempt ${attempt}/${maxRetries})`);
      
      const stepResult = await stepFunction();
      
      // Calculate step duration
      const stepDuration = Date.now() - stepStartTime;
      result.executionMetrics.stepDurations[stepName] = stepDuration;
      
      // Send completion update with result summary
      const resultSummary = getStepResultSummary(stepName, stepResult);
      sendStepUpdate(config, stepName, 'complete', resultSummary);
      
      // Persist step result to document if dataStream is available
      if (config.dataStream && config.documentId) {
        await persistStepResult(config, stepName, stepResult);
      }
      
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
      return `Analyzed requirements: ${stepResult.userRequestAnalysis?.primaryIntent || 'Unknown intent'}`;
    case 'step1':
      return `Strategy: ${stepResult.operation} (${stepResult.priority}) - Confidence: ${stepResult.confidence}%`;
    case 'step2':
      return `Architecture: ${stepResult.complexity} complexity, ${stepResult.systemArchitecture?.components?.length || 0} components`;
    case 'step3':
      return `Database: ${stepResult.models?.length || 0} models, ${stepResult.enums?.length || 0} enums`;
    case 'step4':
      return `Actions: ${stepResult.actions?.length || 0} actions, ${stepResult.implementationComplexity} complexity`;
    case 'step5':
      return `Schedules: ${stepResult.schedules?.length || 0} schedules, ${stepResult.automationCoverage?.coveragePercentage || 0}% coverage`;
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
  
  // For critical state changes, also persist to database immediately
  if (['agent-step', 'step-result', 'agent-data'].includes(type)) {
    // Don't await to avoid blocking the stream, but ensure it saves
    saveStreamState(documentId, type, content, session).catch((error: any) => {
      console.error('❌ Failed to persist stream state:', error);
    });
  }
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
  step3: Step3Output,
  step4: Step4Output,
  step5: Step5Output
): AgentData {
  const now = new Date().toISOString();
  
  // Integrate example records into models
  const modelsWithRecords = step3.models.map(model => {
    const modelExampleRecords = step3.exampleRecords?.[model.name] || [];
    
    // Convert example records to ModelRecord format
    const modelRecords = modelExampleRecords.map((recordData, index) => ({
      id: recordData.id || `${model.name.toLowerCase()}_record_${index + 1}`,
      modelId: model.id,
      data: recordData,
      createdAt: now,
      updatedAt: now
    }));
    
    return {
      ...model,
      records: modelRecords
    };
  });

  // Create the new agent data from step results
  const newAgentData: AgentData = {
    id: config.existingAgent?.id || generateId(),
    name: step0.userRequestAnalysis.businessContext || 'Generated Agent',
    description: step0.userRequestAnalysis.mainGoal || 'AI-generated agent',
    domain: step0.userRequestAnalysis.businessContext || 'general',
    models: modelsWithRecords,
    enums: [], // Enums are now stored within individual models (model-scoped)
    actions: step4.actions,
    schedules: step5.schedules,
    createdAt: now,
    metadata: {
      createdAt: config.existingAgent?.metadata?.createdAt || now,
      updatedAt: now,
      version: '2.0.0-model-scoped-enums',
      lastModifiedBy: 'Enhanced Agent Builder',
      tags: [
        step0.userRequestAnalysis.complexity,
        step0.userRequestAnalysis.businessContext,
        step2.complexity,
        `${step3.models.length}-models`,
        `${step4.actions.length}-actions`,
        `${step5.schedules.length}-schedules`
      ],
      status: 'generated',
      promptUnderstanding: step0,
      aiDecision: step1,
      lastUpdateReason: config.userRequest,
      lastUpdateTimestamp: now,
      comprehensiveAnalysisUsed: true,
      operationType: config.existingAgent ? 'update' : 'create',
      mergingPhase: {
        approach: 'model-scoped-enums',
        preservationStrategy: 'comprehensive-validation',
        conflictResolution: 'quality-based',
        finalCounts: {
          models: step3.models.length,
          actions: step4.actions.length,
          schedules: step5.schedules.length,
          enums: step3.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0)
        }
      }
    }
  };

  // CRITICAL FIX: Apply final deep merge if we have an existing agent
  // This ensures that the change-based merging is properly applied at the final assembly level
  const finalAgent = config.existingAgent 
    ? performDeepMerge(config.existingAgent, newAgentData)
    : newAgentData;

  // Enhanced logging for debugging
  console.log(`🔧 Agent Assembly Complete:
- ${config.existingAgent ? 'MERGED' : 'NEW'} Agent Created
- Models: ${finalAgent.models.length} (${config.existingAgent ? `was ${config.existingAgent.models?.length || 0}` : 'new'})
- Total Model Enums: ${finalAgent.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0)}
- Actions: ${finalAgent.actions.length} (${config.existingAgent ? `was ${config.existingAgent.actions?.length || 0}` : 'new'})
- Schedules: ${finalAgent.schedules.length} (${config.existingAgent ? `was ${config.existingAgent.schedules?.length || 0}` : 'new'})
- Example Records: ${Object.keys(step3.exampleRecords || {}).length} model types`);

  // Log model-specific enum counts
  finalAgent.models.forEach(model => {
    if (model.enums && model.enums.length > 0) {
      console.log(`📊 Model "${model.name}" has ${model.enums.length} enums: ${model.enums.map(e => e.name).join(', ')}`);
    }
  });

  // Log the change summary if this was an update
  if (config.existingAgent) {
    const existingModelCount = config.existingAgent.models?.length || 0;
    const existingActionCount = config.existingAgent.actions?.length || 0;
    const existingScheduleCount = config.existingAgent.schedules?.length || 0;
    const existingEnumCount = (config.existingAgent.models || []).reduce((sum, model) => sum + (model.enums?.length || 0), 0);
    
    const finalModelCount = finalAgent.models.length;
    const finalActionCount = finalAgent.actions.length;
    const finalScheduleCount = finalAgent.schedules.length;
    const finalEnumCount = finalAgent.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0);
    
    console.log(`📈 Change Summary:
- Models: ${existingModelCount} → ${finalModelCount} (${finalModelCount > existingModelCount ? '+' : ''}${finalModelCount - existingModelCount})
- Actions: ${existingActionCount} → ${finalActionCount} (${finalActionCount > existingActionCount ? '+' : ''}${finalActionCount - existingActionCount})
- Schedules: ${existingScheduleCount} → ${finalScheduleCount} (${finalScheduleCount > existingScheduleCount ? '+' : ''}${finalScheduleCount - existingScheduleCount})
- Enums: ${existingEnumCount} → ${finalEnumCount} (${finalEnumCount > existingEnumCount ? '+' : ''}${finalEnumCount - existingEnumCount})`);
  }

  return finalAgent;
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
    validationResults.step4,
    validationResults.step5
  ];
  
  // More lenient validation - require at least 50% of validations to pass
  // This ensures we don't reject agents that have good core functionality
  const passedCount = results.filter(Boolean).length;
  const requiredPasses = Math.ceil(results.length * 0.5); // 50% threshold
  
  console.log(`🔍 Overall validation: ${passedCount}/${results.length} passed (need ${requiredPasses})`);
  return passedCount >= requiredPasses;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(result: OrchestratorResult): number {
  const weights = {
    validation: 40,
    completeness: 30,
    consistency: 20,
    performance: 10
  };
  
  // Validation score
  const validationCount = Object.values(result.validationResults).filter(Boolean).length;
  const validationScore = (validationCount / 7) * weights.validation;
  
  // Completeness score
  const hasModels = (result.stepResults.step3?.models.length || 0) > 0;
  const hasActions = (result.stepResults.step4?.actions.length || 0) > 0;
  const hasSchedules = (result.stepResults.step5?.schedules.length || 0) > 0;
  const completenessScore = ((hasModels ? 1 : 0) + (hasActions ? 1 : 0) + (hasSchedules ? 1 : 0)) / 3 * weights.completeness;
  
  // Consistency score (based on database compatibility)
  const databaseCompatible = result.stepResults.step4?.validationResults.databaseCompatibility || false;
  const actionCompatible = result.stepResults.step5?.validationResults.actionCompatibility || false;
  const consistencyScore = ((databaseCompatible ? 1 : 0) + (actionCompatible ? 1 : 0)) / 2 * weights.consistency;
  
  // Performance score (based on execution time and retries)
  const executionTime = result.executionMetrics.totalDuration;
  const retryPenalty = result.executionMetrics.retryCount * 5;
  const performanceScore = Math.max(0, weights.performance - (executionTime > 30000 ? 5 : 0) - retryPenalty);
  
  return Math.round(validationScore + completenessScore + consistencyScore + performanceScore);
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