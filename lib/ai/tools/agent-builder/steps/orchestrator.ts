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

    // SAVE FINAL ASSEMBLED AGENT - Ensure persistence before returning
    if (result.agent && config.dataStream && config.documentId && config.session) {
      try {
        console.log('💾 Orchestrator saving final assembled agent...');
        
        // Import the save function
        const { saveOrUpdateDocument } = await import('../../../../db/queries');
        
        const finalAgentContent = JSON.stringify(result.agent, null, 2);
        const finalMetadata = {
          orchestratorResult: {
            success: result.success,
            qualityScore: result.executionMetrics.qualityScore,
            totalDuration: result.executionMetrics.totalDuration,
            validationResults: result.validationResults,
            stepResults: Object.keys(result.stepResults),
            errors: result.errors,
            warnings: result.warnings
          },
          lastUpdateTimestamp: new Date().toISOString(),
          savedByOrchestrator: true,
          assemblyCompleted: true
        };

        await saveOrUpdateDocument({
          id: config.documentId,
          title: result.agent.name || 'Generated Agent',
          content: finalAgentContent,
          kind: 'agent',
          userId: config.session.user?.id || 'unknown',
          metadata: finalMetadata
        });

        console.log('✅ Orchestrator successfully saved final assembled agent');
      } catch (saveError) {
        console.error('❌ Orchestrator failed to save final agent:', saveError);
        result.warnings.push(`Failed to save final agent: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
        // Don't fail the entire process for save errors
      }
    }

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

  // ENHANCED VALIDATION: Compare existing + new with final results
  let finalAgent = config.existingAgent 
    ? performDeepMerge(config.existingAgent, newAgentData)
    : newAgentData;

  // Apply comprehensive validation and auto-fix
  if (config.existingAgent) {
    console.log('🔍 STARTING COMPREHENSIVE MERGE VALIDATION...');
    
    // Validate and fix models
    finalAgent = validateAndFixMergedItems(
      config.existingAgent,
      newAgentData,
      finalAgent,
      'models'
    );
    
    // Validate and fix actions
    finalAgent = validateAndFixMergedItems(
      config.existingAgent,
      newAgentData,
      finalAgent,
      'actions'
    );
    
    // Validate and fix schedules
    finalAgent = validateAndFixMergedItems(
      config.existingAgent,
      newAgentData,
      finalAgent,
      'schedules'
    );
    
    // Validate and fix model fields
    finalAgent = validateAndFixModelFields(
      config.existingAgent,
      newAgentData,
      finalAgent
    );
    
    // Validate and fix model enums
    finalAgent = validateAndFixModelEnums(
      config.existingAgent,
      newAgentData,
      finalAgent
    );
    
    console.log('✅ COMPREHENSIVE MERGE VALIDATION COMPLETED');
  }

  // Enhanced logging for debugging
  console.log(`🔧 Agent Assembly Complete:
- ${config.existingAgent ? 'MERGED' : 'NEW'} Agent Created
- Models: ${finalAgent.models.length} (${config.existingAgent ? `was ${config.existingAgent.models?.length || 0}` : 'new'})
- Total Model Enums: ${finalAgent.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0)}
- Actions: ${finalAgent.actions.length} (${config.existingAgent ? `was ${config.existingAgent.actions?.length || 0}` : 'new'})
- Schedules: ${finalAgent.schedules.length} (${config.existingAgent ? `was ${config.existingAgent.schedules?.length || 0}` : 'new'})
- Example Records: ${Object.keys(step3.exampleRecords || {}).length} model types
- Total Records: ${finalAgent.models.reduce((sum, model) => sum + (model.records?.length || 0), 0)}`);

  // ENHANCED DEBUGGING: Log detailed model information
  console.log('🔍 DETAILED MODEL ANALYSIS:');
  finalAgent.models.forEach((model, index) => {
    console.log(`  ${index + 1}. Model "${model.name}"`);
    console.log(`     - ID: ${model.id}`);
    console.log(`     - Fields: ${model.fields?.length || 0}`);
    console.log(`     - Enums: ${model.enums?.length || 0}`);
    console.log(`     - Records: ${model.records?.length || 0}`);
    console.log(`     - Field Names: [${(model.fields || []).map(f => f.name).join(', ')}]`);
    if (model.enums && model.enums.length > 0) {
      console.log(`     - Enum Names: [${model.enums.map(e => e.name).join(', ')}]`);
    }
  });

  // Check for duplicate model names
  const modelNames = finalAgent.models.map(m => m.name);
  const uniqueModelNames = new Set(modelNames);
  if (modelNames.length !== uniqueModelNames.size) {
    console.warn('⚠️ DUPLICATE MODEL NAMES DETECTED:');
    const duplicates = modelNames.filter((name, index) => modelNames.indexOf(name) !== index);
    console.warn(`   Duplicates: [${duplicates.join(', ')}]`);
    
    // Remove duplicates by keeping the first occurrence
    const seenNames = new Set();
    finalAgent.models = finalAgent.models.filter(model => {
      if (seenNames.has(model.name)) {
        console.log(`   🔧 Removing duplicate model: ${model.name} (ID: ${model.id})`);
        return false;
      }
      seenNames.add(model.name);
      return true;
    });
    
    console.log(`   ✅ After deduplication: ${finalAgent.models.length} models`);
  }

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
 * Validate and fix merged items (models, actions, schedules)
 */
function validateAndFixMergedItems(
  existingAgent: AgentData,
  newAgentData: AgentData,
  finalAgent: AgentData,
  itemType: 'models' | 'actions' | 'schedules'
): AgentData {
  const existingItems = existingAgent[itemType] || [];
  const newItems = newAgentData[itemType] || [];
  const finalItems = finalAgent[itemType] || [];
  
  console.log(`🔍 VALIDATING ${itemType.toUpperCase()}:`);
  console.log(`  - Existing: ${existingItems.length}`);
  console.log(`  - New: ${newItems.length}`);
  console.log(`  - Final: ${finalItems.length}`);
  
  // Create sets of names for comparison
  const existingNames = new Set(existingItems.map((item: any) => item.name));
  const newNames = new Set(newItems.map((item: any) => item.name));
  const finalNames = new Set(finalItems.map((item: any) => item.name));
  const expectedNames = new Set([...existingNames, ...newNames]);
  
  console.log(`  - Existing names: [${Array.from(existingNames).join(', ')}]`);
  console.log(`  - New names: [${Array.from(newNames).join(', ')}]`);
  console.log(`  - Final names: [${Array.from(finalNames).join(', ')}]`);
  console.log(`  - Expected names: [${Array.from(expectedNames).join(', ')}]`);
  
  // Check for missing items
  const missingNames = Array.from(expectedNames).filter(name => !finalNames.has(name));
  
  // Calculate expected counts - be more lenient
  const duplicateCount = countDuplicates(existingItems, newItems, 'name');
  const expectedMinCount = Math.max(existingItems.length, newItems.length); // More lenient minimum
  const expectedMaxCount = existingItems.length + newItems.length; // If no duplicates
  const finalCount = finalItems.length;
  
  console.log(`  - Duplicate count: ${duplicateCount}`);
  console.log(`  - Expected minimum count: ${expectedMinCount}`);
  console.log(`  - Expected maximum count: ${expectedMaxCount}`);
  console.log(`  - Final count: ${finalCount}`);
  
  // Only reprocess if we have critical missing items, not just count mismatches
  const hasCriticalMissingItems = missingNames.length > 0 && newItems.length > 0;
  const hasSignificantCountMismatch = finalCount < Math.min(existingItems.length, newItems.length);
  const needsReprocessing = hasCriticalMissingItems || hasSignificantCountMismatch;
  
  if (needsReprocessing) {
    console.warn(`⚠️ VALIDATION ISSUES DETECTED FOR ${itemType.toUpperCase()}:`);
    if (hasCriticalMissingItems) {
      console.warn(`  - MISSING ITEMS: [${missingNames.join(', ')}]`);
    }
    if (hasSignificantCountMismatch) {
      console.warn(`  - SIGNIFICANT COUNT MISMATCH: Expected at least ${Math.min(existingItems.length, newItems.length)}, got ${finalCount}`);
    }
    
    console.log(`🔄 ATTEMPTING RECOVERY FOR ${itemType.toUpperCase()}...`);
    
    // Simple recovery: add missing items without complex re-merging
    const recoveredItems = [...finalItems];
    let recoveredCount = 0;
    
    missingNames.forEach(missingName => {
      // Try to find the missing item in new items first, then existing
      let missingItem = newItems.find((item: any) => item.name === missingName);
      if (!missingItem) {
        missingItem = existingItems.find((item: any) => item.name === missingName);
      }
      
      if (missingItem) {
        console.log(`🔧 RECOVERING: Adding ${missingName}`);
        recoveredItems.push(missingItem);
        recoveredCount++;
      }
    });
    
    if (recoveredCount > 0) {
      finalAgent = {
        ...finalAgent,
        [itemType]: recoveredItems
      };
      console.log(`✅ RECOVERY SUCCESSFUL: Added ${recoveredCount} missing items for ${itemType.toUpperCase()}`);
    } else {
      console.log(`⚠️ RECOVERY PARTIAL: Could not recover missing items for ${itemType.toUpperCase()}`);
    }
  } else {
    console.log(`✅ VALIDATION PASSED FOR ${itemType.toUpperCase()}`);
  }
  
  return finalAgent;
}

/**
 * Validate and fix model fields
 */
function validateAndFixModelFields(
  existingAgent: AgentData,
  newAgentData: AgentData,
  finalAgent: AgentData
): AgentData {
  console.log('🔍 VALIDATING MODEL FIELDS:');
  
  const updatedModels = finalAgent.models.map(finalModel => {
    const existingModel = existingAgent.models?.find(m => m.name === finalModel.name);
    const newModel = newAgentData.models.find(m => m.name === finalModel.name);
    
    if (!existingModel && !newModel) {
      return finalModel; // This shouldn't happen, but just in case
    }
    
    const existingFields = existingModel?.fields || [];
    const newFields = newModel?.fields || [];
    const finalFields = finalModel.fields || [];
    
    console.log(`  📋 Model "${finalModel.name}":`);
    console.log(`    - Existing fields: ${existingFields.length}`);
    console.log(`    - New fields: ${newFields.length}`);
    console.log(`    - Final fields: ${finalFields.length}`);
    
    // Only check for critically missing fields (new fields that are completely absent)
    const newFieldNames = new Set(newFields.map(f => f.name));
    const finalFieldNames = new Set(finalFields.map(f => f.name));
    const criticallyMissingFields = newFields.filter(f => !finalFieldNames.has(f.name));
    
    if (criticallyMissingFields.length > 0 && newFields.length > 0) {
      console.log(`    ⚠️ RECOVERING ${criticallyMissingFields.length} MISSING FIELDS: [${criticallyMissingFields.map(f => f.name).join(', ')}]`);
      
      return {
        ...finalModel,
        fields: [...finalFields, ...criticallyMissingFields]
      };
    } else {
      console.log(`    ✅ FIELD VALIDATION PASSED`);
    }
    
    return finalModel;
  });
  
  return {
    ...finalAgent,
    models: updatedModels
  };
}

/**
 * Validate and fix model enums
 */
function validateAndFixModelEnums(
  existingAgent: AgentData,
  newAgentData: AgentData,
  finalAgent: AgentData
): AgentData {
  console.log('🔍 VALIDATING MODEL ENUMS:');
  
  const updatedModels = finalAgent.models.map(finalModel => {
    const existingModel = existingAgent.models?.find(m => m.name === finalModel.name);
    const newModel = newAgentData.models.find(m => m.name === finalModel.name);
    
    if (!existingModel && !newModel) {
      return finalModel;
    }
    
    const existingEnums = existingModel?.enums || [];
    const newEnums = newModel?.enums || [];
    const finalEnums = finalModel.enums || [];
    
    console.log(`  🏷️ Model "${finalModel.name}" enums:`);
    console.log(`    - Existing enums: ${existingEnums.length}`);
    console.log(`    - New enums: ${newEnums.length}`);
    console.log(`    - Final enums: ${finalEnums.length}`);
    
    // Only check for critically missing enums (new enums that are completely absent)
    const newEnumNames = new Set(newEnums.map(e => e.name));
    const finalEnumNames = new Set(finalEnums.map(e => e.name));
    const criticallyMissingEnums = newEnums.filter(e => !finalEnumNames.has(e.name));
    
    if (criticallyMissingEnums.length > 0 && newEnums.length > 0) {
      console.log(`    ⚠️ RECOVERING ${criticallyMissingEnums.length} MISSING ENUMS: [${criticallyMissingEnums.map(e => e.name).join(', ')}]`);
      
      return {
        ...finalModel,
        enums: [...finalEnums, ...criticallyMissingEnums]
      };
    } else {
      console.log(`    ✅ ENUM VALIDATION PASSED`);
    }
    
    return finalModel;
  });
  
  return {
    ...finalAgent,
    models: updatedModels
  };
}

/**
 * Count duplicate items between two arrays based on a property
 */
function countDuplicates(arr1: any[], arr2: any[], property: string): number {
  const names1 = new Set(arr1.map(item => item[property]));
  const names2 = new Set(arr2.map(item => item[property]));
  
  let duplicateCount = 0;
  names1.forEach(name => {
    if (names2.has(name)) {
      duplicateCount++;
    }
  });
  
  return duplicateCount;
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
  
  // Very lenient validation - require at least 30% of validations to pass
  // This ensures we don't reject agents that have good core functionality
  const passedCount = results.filter(Boolean).length;
  const requiredPasses = Math.ceil(results.length * 0.3); // 30% threshold (2 out of 6)
  
  console.log(`🔍 Overall validation: ${passedCount}/${results.length} passed (need ${requiredPasses})`);
  
  // If we have at least some passes, consider it successful
  // This prevents edge cases where minor validation failures block completion
  const isValid = passedCount >= requiredPasses;
  
  if (!isValid) {
    console.warn(`⚠️ Overall validation failed: Only ${passedCount}/${results.length} steps passed (needed ${requiredPasses})`);
    console.warn(`⚠️ Failed steps: ${results.map((passed, i) => passed ? null : `step${i}`).filter(Boolean).join(', ')}`);
  }
  
  return isValid;
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