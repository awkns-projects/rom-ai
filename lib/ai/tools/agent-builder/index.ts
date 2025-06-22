import { openai } from '@ai-sdk/openai';
import { generateObject, tool, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import type { Message } from 'ai';
import type { Session } from 'next-auth';
import { myProvider } from '../../providers';
import { getBestModelFor, supportsStructuredOutput } from '../../models';
import { getDocumentById, saveOrUpdateDocument } from '../../../db/queries';
import { generateUUID } from '../../../utils';

// Import all the refactored modules
import type { 
  AgentData, 
  AgentModel, 
  AgentField, 
  AgentEnum, 
  AgentEnumField, 
  AgentAction, 
  AgentSchedule,
  PromptUnderstanding,
  ChangeAnalysis,
  DatabaseModel,
  DatabaseField,
  EnvVar
} from './types';

// Import orchestrator types
import type { OrchestratorConfig } from './steps/orchestrator';

import {
  promptUnderstandingSchema,
  changeAnalysisSchema,
  databaseGenerationSchema,
  actionGenerationSchema,
  scheduleGenerationSchema,
  enhancedActionAnalysisSchema,
  enhancedActionCodeSchema,
  enhancedActionSchema
} from './schemas';

import {
  analyzeConversationContext,
  cleanNullValues,
  deepEqual,
  mergeArraysByKey,
  ensureActionsHaveIds,
  ensureSchedulesHaveIds,
  ensureRequiredScheduleFields,
  ensureRequiredActionFields,
  generateNewId
} from './utils';

import {
  performDeepMerge,
  mergeModelsIntelligently,
  mergeActionsIntelligently,
  mergeSchedulesIntelligently,
  logContentChanges
} from './merging';

import {
  generatePromptUnderstanding,
  generateChangeAnalysis,
  generateDatabase,
  generateActions,
  generateSchedules,
  generateDecision,
  generateGranularChangeAnalysis,
  generateDeletionOperations,
  generateExampleRecords,
  generateEnhancedActionAnalysis,
  generateEnhancedActionCode,
  generateCompleteEnhancedAction,
  generateBatchEnhancedActions,
  generateActionsWithEnhancedAnalysis,
  executeGeneratedAction,
  validateGeneratedFunctionBody,
  createFunctionExecutionExample,
  createEnhancedActionExample
} from './generation';

import {
  createAgentData,
  validateAgentData,
  logAgentData,
  generateSuccessMessage,
  generateErrorMessage,
  createAgentResult
} from './document';

// Import the hybrid agent builder
import { HybridAgentBuilder } from './hybrid-implementation';

// Re-export types for backward compatibility
export type {
  AgentData,
  AgentModel,
  AgentField,
  AgentEnum,
  AgentEnumField,
  AgentAction,
  AgentSchedule,
  DatabaseModel,
  DatabaseField,
  EnvVar
};

// Re-export utility functions for backward compatibility
export {
  generateNewId,
  analyzeConversationContext,
  createAgentData,
  // Enhanced action generation functions
  generateEnhancedActionAnalysis,
  generateEnhancedActionCode,
  generateCompleteEnhancedAction,
  generateBatchEnhancedActions,
  generateActionsWithEnhancedAnalysis,
  executeGeneratedAction,
  validateGeneratedFunctionBody,
  createFunctionExecutionExample,
  createEnhancedActionExample,
  // Export the hybrid agent builder class
  HybridAgentBuilder
};

// Re-export enhanced schemas for external usage
export {
  enhancedActionAnalysisSchema,
  enhancedActionCodeSchema,
  enhancedActionSchema
};

// Helper functions that were in the original file
function escapeForTemplate(str: string): string {
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function intelligentDocumentUpdate(
  documentId: string,
  newTitle: string,
  newContent: string,
  session?: Session | null,
  deletionOperations?: any,
  metadata?: any
): Promise<boolean> {
  if (!session?.user?.id) {
    console.log('❌ No session or user ID available, skipping document save');
    return false;
  }

  try {
    // Get current document - handle case where document doesn't exist
    let existingDoc;
    try {
      existingDoc = await getDocumentById({ id: documentId });
    } catch (error) {
      console.log('📝 Document not found (expected for new documents):', error);
      existingDoc = null;
    }
    
    if (!existingDoc || !existingDoc.content) {
      console.log('📝 No existing document found, creating new one');
      await saveOrUpdateDocument({
        id: documentId,
        title: newTitle,
        kind: 'agent',
        content: newContent,
        userId: session.user.id,
        metadata
      });
      return true;
    }

    // Parse both existing and new content
    let existingData: AgentData;
    let newData: AgentData;
    
    try {
      existingData = JSON.parse(existingDoc.content);
      newData = JSON.parse(newContent);
    } catch (parseError) {
      console.log('⚠️ Failed to parse content, performing simple update');
      await saveOrUpdateDocument({
        id: documentId,
        title: newTitle,
        kind: 'agent',
        content: newContent,
        userId: session.user.id,
        metadata
      });
      return true;
    }

    // Perform deep comparison and intelligent merge
    const mergedData = performDeepMerge(existingData, newData, deletionOperations);
    const hasChanges = !deepEqual(existingData, mergedData);
    
    // Merge metadata - preserve existing metadata and merge with new
    const mergedMetadata = {
      ...(existingDoc.metadata || {}),
      ...(metadata || {})
    };
    
    if (hasChanges || metadata) {
      console.log('🔄 Content or metadata changes detected, updating document');
      console.log('📊 Changes summary:');
      logContentChanges(existingData, mergedData);
      
      await saveOrUpdateDocument({
        id: documentId,
        title: newTitle,
        kind: 'agent',
        content: JSON.stringify(mergedData, null, 2),
        userId: (session.user?.id || 'unknown') as string,
        metadata: mergedMetadata
      });
      return true;
    } else {
      console.log('✅ No content or metadata changes detected, skipping update');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error in intelligent document update:', error);
    // Fallback to simple update - but only if we have a valid user ID
    if (session?.user?.id) {
      try {
        await saveOrUpdateDocument({
          id: documentId,
          title: newTitle,
          kind: 'agent',
          content: newContent,
          userId: (session.user?.id || 'unknown') as string,
          metadata
        });
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback update also failed:', fallbackError);
        return false;
      }
    } else {
      console.log('❌ Cannot perform fallback update - no user ID available');
      return false;
    }
  }
}

// Enhanced document saving with state persistence
async function saveDocumentWithContent(
  documentId: string,
  title: string,
  content: string,
  session?: Session | null,
  deletionOperations?: any,
  metadata?: any
) {
  // Enhanced metadata structure for better state tracking
  const enhancedMetadata = {
    ...(metadata || {}),
    lastSaveTimestamp: new Date().toISOString(),
    documentVersion: generateUUID(),
    dataIntegrity: {
      contentHash: generateContentHash(content),
      contentLength: content.length,
      hasValidJson: isValidJSON(content)
    }
  };

  // Use intelligent document update for merging
  return await intelligentDocumentUpdate(documentId, title, content, session, deletionOperations, enhancedMetadata);
}

// Helper function to generate content hash for integrity checking
function generateContentHash(content: string): string {
  // Simple hash function for content integrity
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Helper function to validate JSON
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Enhanced streaming with state persistence
function streamWithPersistence(dataStream: any, type: string, content: any, documentId: string, session: Session | null | undefined) {
  // Always stream to UI
  dataStream.writeData({ type, content });
  
  // For critical state changes, also persist to database immediately
  if (['agent-step', 'agent-data'].includes(type)) {
    // Don't await to avoid blocking the stream, but ensure it saves
    saveStreamState(documentId, type, content, session).catch(error => {
      console.error('❌ Failed to persist stream state:', error);
    });
  }
}

// Function to save streaming state for recovery
async function saveStreamState(documentId: string, type: string, content: any, session: Session | null | undefined) {
  if (!session?.user?.id) return;
  
  try {
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
          lastStreamUpdate: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('❌ Error saving stream state:', error);
  }
}

// Enhanced resume detection and handling
async function detectAndHandleResume(
  documentId: string,
  session: Session | null,
  dataStream: any
): Promise<{
  shouldResume: boolean;
  resumeData: {
    existingContent?: string;
    stepMetadata?: any;
    lastStep?: string;
  };
}> {
  if (!session?.user?.id) {
    return { shouldResume: false, resumeData: {} };
  }

  try {
    const existingDoc = await getDocumentById({ id: documentId });
    
    if (!existingDoc || !existingDoc.content) {
      console.log('📝 No existing document found for resume detection');
      return { shouldResume: false, resumeData: {} };
    }

    // Check if document has meaningful agent data (not just step progress)
    let hasAgentData = false;
    try {
      const parsedContent = JSON.parse(existingDoc.content);
      hasAgentData = parsedContent && (
        (parsedContent.models && parsedContent.models.length > 0) ||
        (parsedContent.actions && parsedContent.actions.length > 0) ||
        (parsedContent.schedules && parsedContent.schedules.length > 0)
      );
    } catch (e) {
      hasAgentData = false;
    }

    // If document only has step progress but no actual agent data, clear it for fresh start
    if (!hasAgentData && existingDoc.metadata) {
      console.log('🔄 Document has step progress but no agent data - clearing for fresh start');
      
      // Clear the document metadata to prevent old step progress from showing
      await saveOrUpdateDocument({
        id: documentId,
        title: 'AI Agent System',
        kind: 'agent',
        content: JSON.stringify({ status: 'initializing' }, null, 2),
        userId: session.user.id,
        metadata: {
          // Keep essential metadata but clear step progress
          createdAt: (existingDoc.metadata as any)?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          lastModifiedBy: 'ai-agent-builder',
          tags: [],
          status: 'initializing',
          // Clear all step-related metadata
          stepProgress: {},
          stepMessages: {},
          currentStep: undefined,
          streamHistory: []
        }
      });
      
      return { shouldResume: false, resumeData: {} };
    }

    // Check document metadata for incomplete work
    const metadata = existingDoc.metadata as any;
    if (!metadata || !metadata.stepProgress) {
      console.log('📝 No step progress metadata found');
      return { shouldResume: false, resumeData: {} };
    }

    // Check if work was incomplete (not all steps are complete)
    const stepOrder = ['step0', 'step1', 'step2', 'step3', 'step4', 'step5'];
    const allStepsComplete = stepOrder.every(step => metadata.stepProgress[step] === 'complete');
    
    if (allStepsComplete) {
      console.log('✅ All steps already complete - no resume needed');
      return { shouldResume: false, resumeData: {} };
    }

    // Find the last incomplete step
    let lastCompleteStep = '';
    for (let i = stepOrder.length - 1; i >= 0; i--) {
      if (metadata.stepProgress[stepOrder[i]] === 'complete') {
        lastCompleteStep = stepOrder[i];
        break;
      }
    }

    console.log(`🔄 Found incomplete work - last complete step: ${lastCompleteStep}`);
    
    return {
      shouldResume: true,
      resumeData: {
        existingContent: existingDoc.content,
        stepMetadata: metadata,
        lastStep: lastCompleteStep
      }
    };

  } catch (error) {
    console.error('❌ Error detecting resume state:', error);
    return { shouldResume: false, resumeData: {} };
  }
}

// Main agent builder function - maintains the exact same interface as the original
export const agentBuilder = ({ 
  messages, 
  dataStream, 
  existingContext,
  existingDocumentId,
  session,
  chatId
}: { 
  messages: Message[]; 
  dataStream: DataStreamWriter;
  existingContext?: string | null;
  existingDocumentId?: string | null;
  session?: Session | null;
  chatId?: string;
}) => tool({
  description: `
Enhanced AI Agent Builder with comprehensive data persistence and resume capabilities.

This tool creates complete AI agent systems with:
- Database models and relationships
- Automated business logic actions  
- Scheduled workflows and processes
- Full data persistence across page refreshes
- Automatic resume from interruption points

The tool maintains state throughout the generation process and can resume from any interruption.
    `,
  parameters: z.object({
    command: z.string().describe('The user command or request for building/modifying the agent system'),
    operation: z.enum(['create', 'update', 'extend', 'resume']).default('create').describe('The type of operation to perform'),
    context: z.string().optional().describe('Additional context or existing agent data to work with')
  }),
  execute: async ({ command, operation = 'create', context }) => {
    console.log(`🤖 Enhanced Agent Builder: Processing "${command}" - Operation: ${operation}`);
    console.log('🔍 Agent Builder Input Context:');
    console.log('  - existingContext:', existingContext ? 'PROVIDED' : 'NULL');
    console.log('  - existingDocumentId:', existingDocumentId || 'NULL');
    console.log('  - context parameter:', context ? 'PROVIDED' : 'NULL');
    
    // Use existing document ID if available, otherwise generate new one
    const documentId = existingDocumentId || generateUUID();
    const isUpdatingExisting = !!existingDocumentId;
    
    console.log(`📄 ${isUpdatingExisting ? 'UPDATING EXISTING' : 'CREATING NEW'} document with ID: ${documentId}`);
    
    // Parse existing context
    let existingAgent: AgentData | null = null;
    const contextToUse = context || existingContext;
    
    if (contextToUse) {
      try {
        const parsedContext = JSON.parse(contextToUse);
        if (parsedContext && typeof parsedContext === 'object' && (parsedContext.name || parsedContext.models || parsedContext.actions)) {
          existingAgent = parsedContext as AgentData;
          console.log('✅ Valid existing agent data found:', {
            name: existingAgent.name,
            models: existingAgent.models?.length || 0,
            actions: existingAgent.actions?.length || 0,
            schedules: existingAgent.schedules?.length || 0
          });
        }
      } catch (parseError) {
        console.log('⚠️ Failed to parse context as JSON, treating as text input');
      }
    }

    // Initialize document
    streamWithPersistence(dataStream, 'kind', 'agent', documentId, session);
    streamWithPersistence(dataStream, 'id', documentId, documentId, session);
    streamWithPersistence(dataStream, 'title', isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', documentId, session);
    streamWithPersistence(dataStream, 'clear', '', documentId, session);

    // Initialize step metadata for progress tracking
    let stepMetadata: {
      currentStep: string;
      stepProgress: Record<string, string>;
      stepMessages: Record<string, string>;
      lastUpdateTimestamp: string;
      processId: string;
      status: string;
    } = {
      currentStep: 'prompt-understanding',
      stepProgress: {},
      stepMessages: {},
      lastUpdateTimestamp: new Date().toISOString(),
      processId: generateUUID(),
      status: 'active'
    };

    try {
      // Check for existing work and resume capability
      const resumeInfo = await detectAndHandleResume(documentId, session || null, dataStream);
      
      if (resumeInfo.shouldResume && resumeInfo.resumeData) {
        console.log('🔄 Detected existing work, attempting to resume...');
        
        // Try to parse existing content as agent data
        let existingPartialAgent: AgentData | null = null;
        if (resumeInfo.resumeData.existingContent) {
          try {
            const parsedContent = JSON.parse(resumeInfo.resumeData.existingContent);
            if (parsedContent && (parsedContent.models || parsedContent.actions)) {
              existingPartialAgent = parsedContent;
              console.log('✅ Found existing partial agent data to build upon');
              console.log(`📋 Existing: ${existingPartialAgent?.models?.length || 0} models, ${existingPartialAgent?.actions?.length || 0} actions`);
              
              // Update existing agent context for continuation
              if (!existingAgent && existingPartialAgent) {
                existingAgent = existingPartialAgent;
                console.log('🔗 Using existing partial agent as base for continuation');
              }
            }
          } catch (parseError) {
            console.log('⚠️ Could not parse existing content, starting fresh');
          }
        }
        
        // Restore step progress from metadata
        if (resumeInfo.resumeData.stepMetadata) {
          stepMetadata = {
            ...stepMetadata,
            ...resumeInfo.resumeData.stepMetadata
          };
          console.log(`📊 Restored step progress: current step = ${stepMetadata.currentStep}`);
        }
      }

      // Import the orchestrator
      const { executeAgentGeneration } = await import('./steps/orchestrator');
      
      // Configure orchestrator with enhanced options
      const orchestratorConfig: OrchestratorConfig = {
        userRequest: resumeInfo.shouldResume ? `Continue building: ${command}` : command,
        existingAgent: existingAgent || undefined,
        changeAnalysis: null,
        agentOverview: null,
        conversationContext: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        command: resumeInfo.shouldResume ? `Continue building: ${command}` : command,
        enableValidation: true,
        enableInsights: true,
        stopOnValidationFailure: false,
        maxRetries: 3,
        // Add persistence parameters
        dataStream,
        documentId,
        session,
        onStepProgress: (stepId: string, status: 'processing' | 'complete', message?: string) => {
          console.log(`📊 Step Progress: ${stepId} - ${status} - ${message || ''}`);
          
          // Update step metadata
          stepMetadata.currentStep = stepId;
          stepMetadata.stepProgress[stepId] = status;
          stepMetadata.stepMessages[stepId] = message || `Step ${stepId} ${status}`;
          stepMetadata.lastUpdateTimestamp = new Date().toISOString();
          
          // Send agent-step stream update
          const stepData = {
            step: stepId,
            status: status,
            message: message || `Step ${stepId} ${status}`
          };
          
          console.log(`🔄 Sending agent-step update:`, stepData);
          streamWithPersistence(dataStream, 'agent-step', stepData, documentId, session);
        }
      };

      // Execute orchestrated agent generation
      console.log('🚀 Starting agent generation orchestrator...');
      
      // Execute orchestrator with retry logic
      let result: any;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          result = await executeAgentGeneration(orchestratorConfig);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.log(`❌ Orchestrator attempt ${retryCount} failed:`, error);
          
          if (retryCount > maxRetries) {
            // Update step metadata for final failure
            stepMetadata.currentStep = 'error';
            stepMetadata.stepProgress['error'] = 'error';
            stepMetadata.status = 'error';
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const errorDetails = {
              error: errorMessage,
              timestamp: new Date().toISOString(),
              retryCount,
              step: stepMetadata.currentStep
            };
            
            streamWithPersistence(dataStream, 'agent-step', JSON.stringify({
              step: 'error',
              status: 'error',
              message: `Agent generation failed after ${maxRetries} attempts: ${errorMessage}`
            }), documentId, session);
            
            // Save error details
            await saveDocumentWithContent(documentId, 'Agent Generation Error', JSON.stringify(errorDetails, null, 2), session, undefined, {
              ...stepMetadata,
              error: errorDetails
            });
            
            throw error;
          } else {
            // Wait before retry with exponential backoff
            const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            console.log(`⏳ Waiting ${waitTime}ms before retry ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Update step metadata for retry
            streamWithPersistence(dataStream, 'agent-step', {
              step: stepMetadata.currentStep,
              status: 'processing',
              message: `Retrying agent generation (attempt ${retryCount + 1}/${maxRetries + 1})...`
            }, documentId, session);
          }
        }
      }

      if (result.success && result.agent) {
        console.log('✅ Agent generation successful - sending final completion step');
        console.log('🔍 Success details:', {
          hasAgent: !!result.agent,
          agentName: result.agent?.name,
          modelsCount: result.agent?.models?.length || 0,
          actionsCount: result.agent?.actions?.length || 0,
          qualityScore: result.executionMetrics?.qualityScore
        });
        
        // Final completion step
        stepMetadata.currentStep = 'complete';
        stepMetadata.stepProgress['complete'] = 'complete';
        stepMetadata.status = 'complete';
        
        streamWithPersistence(dataStream, 'agent-step', {
          step: 'complete',
          status: 'complete',
          message: 'Agent system generated successfully!'
        }, documentId, session);

        // Save final agent data
        const finalContent = JSON.stringify(result.agent, null, 2);
        await saveDocumentWithContent(documentId, result.agent.name || 'AI Agent System', finalContent, session, undefined, {
          ...stepMetadata,
          qualityScore: result.executionMetrics.qualityScore,
          executionTime: result.executionMetrics.totalDuration,
          validationResults: result.validationResults
        });

        // Stream the final agent data
        streamWithPersistence(dataStream, 'agent-data', finalContent, documentId, session);
        streamWithPersistence(dataStream, 'text-delta', finalContent, documentId, session);
        
        console.log('✅ Agent generation completed successfully');
        console.log(`📊 Quality Score: ${result.executionMetrics.qualityScore}/100`);
        console.log(`⏱️ Total Duration: ${result.executionMetrics.totalDuration}ms`);
        
        // Create user-friendly completion message
        const userFriendlyMessage = `🎉 **Agent System Generated Successfully!**

Your AI agent "${result.agent.name || 'AI Agent System'}" has been created with the following components:

📊 **Summary:**
- **${result.agent.models?.length || 0} Database Models** - Data structures for your application
- **${result.agent.actions?.length || 0} Actions** - Interactive features and workflows  
- **${result.agent.schedules?.length || 0} Schedules** - Automated tasks and triggers
- **Quality Score:** ${result.executionMetrics.qualityScore}/100
- **Generation Time:** ${Math.round((result.executionMetrics.totalDuration || 0) / 1000)}s

✅ **Ready to Use:** Your agent system is now available and ready for deployment!`;
        
        return {
          id: documentId,
          title: result.agent.name || 'AI Agent System',
          kind: 'agent' as const,
          content: userFriendlyMessage
        };
      } else if (result.agent) {
        // Agent exists - check if it has basic structure (models or actions)
        const qualityScore = result.executionMetrics?.qualityScore || 0;
        const hasModels = result.agent.models && result.agent.models.length > 0;
        const hasActions = result.agent.actions && result.agent.actions.length > 0;
        
        console.log('⚠️ Agent generation partial success - checking if acceptable');
        console.log('🔍 Partial success details:', {
          resultSuccess: result.success,
          hasAgent: !!result.agent,
          hasModels,
          hasActions,
          modelsCount: result.agent.models?.length || 0,
          actionsCount: result.agent.actions?.length || 0,
          qualityScore,
          errors: result.errors,
          validationResults: result.validationResults
        });
        
        // Accept agent if it has basic structure, regardless of validation results
        if (hasModels || hasActions) {
          console.log(`${result.success ? '✅' : '⚠️'} Agent generation completed ${result.success ? 'successfully' : 'with partial success'}`);
          console.log(`📊 Quality Score: ${qualityScore}/100`);
          console.log(`📋 Components: ${result.agent.models?.length || 0} models, ${result.agent.actions?.length || 0} actions`);
          if (!result.success) {
            console.log(`⚠️ Issues: ${result.errors?.join(', ') || 'Validation warnings'}`);
          }
          
          console.log('✅ Accepting partial success - sending final completion step');
          
          // Final completion step
          stepMetadata.currentStep = 'complete';
          stepMetadata.stepProgress['complete'] = 'complete';
          stepMetadata.status = 'complete';
          
          const message = result.success 
            ? 'Agent system generated successfully!'
            : `Agent system generated with ${result.agent.models?.length || 0} models, ${result.agent.actions?.length || 0} actions`;
          
          streamWithPersistence(dataStream, 'agent-step', {
            step: 'complete',
            status: 'complete',
            message
          }, documentId, session);

          // Save final agent data
          const finalContent = JSON.stringify(result.agent, null, 2);
          await saveDocumentWithContent(documentId, result.agent.name || 'AI Agent System', finalContent, session, undefined, {
            ...stepMetadata,
            qualityScore,
            executionTime: result.executionMetrics?.totalDuration || 0,
            validationResults: result.validationResults,
            warnings: result.warnings || [],
            errors: result.errors || [],
            partialSuccess: !result.success
          });

          // Stream the final agent data
          streamWithPersistence(dataStream, 'agent-data', finalContent, documentId, session);
          streamWithPersistence(dataStream, 'text-delta', finalContent, documentId, session);
          
          // Create user-friendly completion message for partial success
          const userFriendlyMessage = result.success 
            ? `🎉 **Agent System Generated Successfully!**

Your AI agent "${result.agent.name || 'AI Agent System'}" has been created with the following components:

📊 **Summary:**
- **${result.agent.models?.length || 0} Database Models** - Data structures for your application
- **${result.agent.actions?.length || 0} Actions** - Interactive features and workflows
- **${result.agent.schedules?.length || 0} Schedules** - Automated tasks and triggers
- **Quality Score:** ${qualityScore}/100

✅ **Ready to Use:** Your agent system is now available and ready for deployment!`
            : `⚠️ **Agent System Generated with Partial Success**

Your AI agent "${result.agent.name || 'AI Agent System'}" has been created, though some components may need refinement:

📊 **What was created:**
- **${result.agent.models?.length || 0} Database Models** - Data structures for your application
- **${result.agent.actions?.length || 0} Actions** - Interactive features and workflows
- **${result.agent.schedules?.length || 0} Schedules** - Automated tasks and triggers
- **Quality Score:** ${qualityScore}/100

💡 **Status:** The core functionality is ready to use. You can refine or extend the system as needed.`;
          
          return {
            id: documentId,
            title: result.agent.name || 'AI Agent System',
            kind: 'agent' as const,
            content: userFriendlyMessage
          };
        } else {
          console.log('❌ Agent has no models or actions - rejecting as failure');
        }
      } else {
        console.log('❌ No agent generated at all');
        console.log('🔍 Failure details:', {
          resultSuccess: result.success,
          hasAgent: !!result.agent,
          errors: result.errors,
          validationResults: result.validationResults
        });
      }
      
      // Only throw error if we have no usable agent data at all
      const errorMessage = result.errors?.length > 0 ? result.errors.join(', ') : 'Unknown error occurred during agent generation';
      console.log('❌ No usable agent data generated, treating as failure');
      console.log('🔍 Final failure reason:', errorMessage);
      throw new Error('Agent generation failed: ' + errorMessage);

    } catch (error) {
      console.error('❌ Enhanced Agent Builder Error:', error);
      
      // Check if we have any partial results to save
      let partialData: any = null;
      let canResume = false;
      
      // Try to extract any partial agent data from the error context
      if (error instanceof Error && error.message.includes('Agent generation failed:')) {
        // This means the orchestrator ran but didn't meet success criteria
        // Check if we can find any partial results in step metadata
        canResume = true;
        
        // Save current progress for potential resume
        partialData = {
          stepMetadata,
          lastAttempt: new Date().toISOString(),
          errorMessage: error.message,
          canContinue: true
        };
        
        console.log('💾 Saving partial progress for potential resume');
      }
      
      // Enhanced error handling with step progress
      const errorStep = 'error';
      stepMetadata.currentStep = errorStep;
      stepMetadata.stepProgress[errorStep] = 'failed';
      stepMetadata.stepMessages[errorStep] = error instanceof Error ? error.message : 'Unknown error occurred';
      stepMetadata.status = canResume ? 'timeout' : 'error';
      
      streamWithPersistence(dataStream, 'agent-step', JSON.stringify({ 
        step: errorStep, 
        status: 'failed', 
        message: canResume ? 'Generation incomplete - can be resumed' : 'System error occurred',
        canResume,
        documentId: documentId
      }), documentId, session);
      
      const errorMessage = generateErrorMessage(error, 'Enhanced Agent Building');
      
      await saveDocumentWithContent(documentId, canResume ? 'Incomplete Agent System' : 'Error Agent System', JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        canResume,
        partialData
      }, null, 2), session, undefined, {
        ...stepMetadata,
        canResume,
        partialData
      });
      
      return {
        id: documentId,
        title: canResume ? 'Incomplete Agent System' : 'Error Agent System',
        kind: 'agent' as const,
        content: errorMessage
      };
    }
  },
});

// Enhanced Agent Builder with Hybrid Approach
// Preserves all original functionality while adding step-by-step orchestration

// New enhanced orchestrator exports
export {
  executeAgentGeneration,
  executeAgentGenerationFast,
  executeAgentGenerationRobust,
  executeAgentGenerationBalanced,
  type OrchestratorConfig,
  type OrchestratorResult
} from './steps/orchestrator';

// Individual step exports (for advanced usage)
export {
  executeStep0PromptUnderstanding,
  validateStep0Output,
  extractStep0Insights,
  type Step0Input,
  type Step0Output
} from './steps/step0-prompt-understanding';

export {
  executeStep1Decision,
  validateStep1Output,
  extractExecutionStrategy,
  type Step1Input,
  type Step1Output
} from './steps/step1-decision-making';

export {
  executeStep2TechnicalAnalysis,
  validateStep2Output,
  extractTechnicalInsights,
  generateImplementationGuidance,
  type Step2Input,
  type Step2Output
} from './steps/step2-technical-analysis';

export {
  executeStep3DatabaseGeneration,
  validateStep3Output,
  extractDatabaseInsights,
  type Step3Input,
  type Step3Output
} from './steps/step3-database-generation';

export {
  executeStep4ActionGeneration,
  validateStep4Output,
  extractActionInsights,
  type Step4Input,
  type Step4Output
} from './steps/step4-action-generation';

export {
  executeStep5ScheduleGeneration,
  validateStep5Output,
  extractScheduleInsights,
  type Step5Input,
  type Step5Output
} from './steps/step5-schedule-generation';

/**
 * ENHANCED AGENT BUILDER FUNCTION
 * 
 * New enhanced version that uses the orchestrator
 */
export async function buildAgentEnhanced(
  userRequest: string,
  existingAgent?: AgentData,
  options?: {
    mode?: 'fast' | 'balanced' | 'robust';
    enableValidation?: boolean;
    enableInsights?: boolean;
  }
): Promise<AgentData> {
  const { executeAgentGenerationFast, executeAgentGenerationRobust, executeAgentGenerationBalanced } = await import('./steps/orchestrator');
  
  let result;
  
  switch (options?.mode || 'balanced') {
    case 'fast':
      result = await executeAgentGenerationFast(userRequest, existingAgent);
      break;
    case 'robust':
      result = await executeAgentGenerationRobust(userRequest, existingAgent);
      break;
    default:
      result = await executeAgentGenerationBalanced(userRequest, existingAgent);
      break;
  }
  
  if (!result.success || !result.agent) {
    throw new Error(`Agent generation failed: ${result.errors.join(', ')}`);
  }
  
  return result.agent;
}

/**
 * UTILITY FUNCTIONS
 */
export function getAgentBuilderVersion(): string {
  return '2.0.0-hybrid';
}

export function getAgentBuilderFeatures(): string[] {
  return [
    'step-by-step-orchestration',
    'comprehensive-validation',
    'hybrid-approach-integration',
    'quality-metrics',
    'retry-logic',
    'insight-extraction',
    'backward-compatibility'
  ];
} 