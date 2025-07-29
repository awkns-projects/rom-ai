import { tool, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import type { Message } from 'ai';
import type { Session } from 'next-auth';
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
  DatabaseModel,
  DatabaseField,
  EnvVar
} from './types';

// Import orchestrator types
import type { OrchestratorConfig } from './steps/orchestrator';

import {
  enhancedActionAnalysisSchema,
  enhancedActionCodeSchema,
  enhancedActionSchema
} from './schemas';

import {
  analyzeConversationContext,
  deepEqual,
  generateNewId
} from './utils';

import {
  performDeepMerge,
  logContentChanges
} from './merging';

import {
  createAgentData,
  generateErrorMessage,
} from './document';

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

// Debounced step progress saving to reduce database load
const stepProgressTimers = new Map<string, NodeJS.Timeout>();
const pendingStepUpdates = new Map<string, any>();

function debouncedStepProgressSave(
  documentId: string, 
  stepData: any, 
  session: Session | null | undefined,
  delay: number = 2000 // 2 second delay
) {
  if (!session?.user?.id) return;
  
  // Clear existing timer for this document
  const existingTimer = stepProgressTimers.get(documentId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  
  // Store the latest step data
  pendingStepUpdates.set(documentId, stepData);
  
  // Set new timer to save after delay
  const timer = setTimeout(async () => {
    const latestStepData = pendingStepUpdates.get(documentId);
    if (latestStepData) {
      try {
        await saveStepProgressOnly(documentId, latestStepData, session);
        console.log(`💾 Debounced step progress saved for ${documentId}`);
      } catch (error) {
        console.error('❌ Failed to save debounced step progress:', error);
      }
      pendingStepUpdates.delete(documentId);
    }
    stepProgressTimers.delete(documentId);
  }, delay);
  
  stepProgressTimers.set(documentId, timer);
}

// Lightweight function to save only step progress metadata
async function saveStepProgressOnly(documentId: string, stepData: any, session: Session | null | undefined) {
  if (!session?.user?.id) return;
  
  try {
    const existingDoc = await getDocumentById({ id: documentId }).catch(() => null);
    if (existingDoc) {
      const currentMetadata = (existingDoc.metadata as any) || {};
      
      await saveOrUpdateDocument({
        id: documentId,
        title: existingDoc.title,
        content: existingDoc.content || '{}',
        kind: existingDoc.kind,
        userId: session.user.id,
        metadata: {
          ...currentMetadata,
          currentStep: stepData.step,
          stepProgress: {
            ...currentMetadata.stepProgress,
            [stepData.step]: stepData.status
          },
          lastStepUpdate: new Date().toISOString()
          // No streamHistory to keep metadata smaller
        }
      });
    }
  } catch (error) {
    console.error('❌ Error saving step progress:', error);
  }
}

// Enhanced streaming with state persistence
function streamWithPersistence(dataStream: any, type: string, content: any, documentId: string, session: Session | null | undefined) {
  // Always stream to UI
  dataStream.writeData({ type, content });
  
  // ONLY persist final agent data - not step progress to avoid database overload
  if (type === 'agent-data') {
    // Don't await to avoid blocking the stream, but ensure it saves
    saveStreamState(documentId, type, content, session).catch(error => {
      console.error('❌ Failed to persist stream state:', error);
    });
  }
  // Note: Removed 'agent-step' from persistence to prevent excessive database writes
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
    
    // CRITICAL FIX: Always fetch the most up-to-date document content when updating existing documents
    let existingAgent: AgentData | null = null;
    const contextToUse = context || existingContext;
    
    // For existing documents, ALWAYS fetch fresh data from database first
    if (isUpdatingExisting && session?.user?.id) {
      console.log('🔄 Fetching fresh document content from database...');
      try {
        const freshDocument = await getDocumentById({ id: documentId });
        if (freshDocument?.content) {
          console.log('✅ Found fresh document content in database');
          try {
            const freshParsedContent = JSON.parse(freshDocument.content);
            if (freshParsedContent && (freshParsedContent.name || freshParsedContent.models || freshParsedContent.actions)) {
              existingAgent = freshParsedContent as AgentData;
              console.log('✅ Using FRESH database content as existing agent:', {
                name: existingAgent.name,
                models: existingAgent.models?.length || 0,
                actions: existingAgent.actions?.length || 0,
                schedules: existingAgent.schedules?.length || 0,
                // ADDED: Track user-configured data
                hasAvatar: !!(existingAgent as any).avatar,
                avatarType: (existingAgent as any).avatar?.type,
                hasTheme: !!(existingAgent as any).theme,
                theme: (existingAgent as any).theme,
                hasOAuthTokens: !!(existingAgent as any).oauthTokens
              });
            }
          } catch (parseError) {
            console.log('⚠️ Failed to parse fresh document content, falling back to context');
          }
        } else {
          console.log('⚠️ No fresh document content found in database, using context');
        }
      } catch (dbError) {
        console.log('⚠️ Failed to fetch fresh document from database:', dbError);
      }
    }
    
    // Fallback to context if we didn't get fresh data from database
    if (!existingAgent && contextToUse) {
      console.log('🔄 Using context as fallback for existing agent data...');
      try {
        const parsedContext = JSON.parse(contextToUse);
        if (parsedContext && typeof parsedContext === 'object' && (parsedContext.name || parsedContext.models || parsedContext.actions)) {
          existingAgent = parsedContext as AgentData;
          console.log('✅ Valid existing agent data found from context:', {
            name: existingAgent.name,
            models: existingAgent.models?.length || 0,
            actions: existingAgent.actions?.length || 0,
            schedules: existingAgent.schedules?.length || 0,
            // ADDED: Track user-configured data from context
            hasAvatar: !!(existingAgent as any).avatar,
            avatarType: (existingAgent as any).avatar?.type,
            hasTheme: !!(existingAgent as any).theme,
            theme: (existingAgent as any).theme,
            hasOAuthTokens: !!(existingAgent as any).oauthTokens
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
        enableDeployment: true,
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
          
          // Send agent-step stream update (UI only - no immediate DB save)
          const stepData = {
            step: stepId,
            status: status,
            message: message || `Step ${stepId} ${status}`
          };
          
          console.log(`🔄 Sending agent-step update:`, stepData);
          // Stream to UI but use debounced DB saves to reduce load
          dataStream.writeData({ type: 'agent-step', content: stepData });
          
          // Use debounced saving for step progress (batches updates)
          debouncedStepProgressSave(documentId, stepData, session);
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
            stepMetadata.stepProgress.error = 'error';
            stepMetadata.status = 'error';
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const errorDetails = {
              error: errorMessage,
              timestamp: new Date().toISOString(),
              retryCount,
              step: stepMetadata.currentStep
            };
            
            const errorStepData = {
              step: 'error',
              status: 'error',
              message: `Agent generation failed after ${maxRetries} attempts: ${errorMessage}`
            };
            dataStream.writeData({ type: 'agent-step', content: errorStepData });
            
            throw error;
          } else {
            // Wait before retry with exponential backoff
            const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            console.log(`⏳ Waiting ${waitTime}ms before retry ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Update step metadata for retry
            const retryStepData = {
              step: stepMetadata.currentStep,
              status: 'processing',
              message: `Retrying agent generation (attempt ${retryCount + 1}/${maxRetries + 1})...`
            };
            dataStream.writeData({ type: 'agent-step', content: retryStepData });
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
        stepMetadata.stepProgress.complete = 'complete';
        stepMetadata.status = 'complete';
        
        console.log('🔄 Sending final completion step...');
        // Final step - force immediate save instead of waiting for debounce
        const message = result.success 
          ? 'Agent system generated successfully!'
          : `Agent system generated with ${result.agent.models?.length || 0} models, ${result.agent.actions?.length || 0} actions, ${result.agent.schedules?.length || 0} schedules`;
        
        const finalStepData = {
          step: 'complete',
          status: 'complete',
          message
        };
        dataStream.writeData({ type: 'agent-step', content: finalStepData });
        
        // Force immediate save of final step progress (bypass debounce)
        await saveStepProgressOnly(documentId, finalStepData, session);

        // CRITICAL FIX: Preserve user data before final save
        let finalAgentData = result.agent;
        
        // If we have existing agent data, merge to preserve user-configured data
        if (existingAgent) {
          const existingAgentAny = existingAgent as any;
          const preservedUserData: any = {};
          
          // CRITICAL FIX: Get the latest agent data from database to ensure we have latest theme/avatar
          try {
            console.log('🔄 Fetching latest agent data for final merge...');
            const latestDocument = await getDocumentById({ id: documentId });
            if (latestDocument?.content) {
              const latestAgentData = JSON.parse(latestDocument.content);
              
              console.log('🔍 LATEST DATA COMPARISON:', {
                existingTheme: existingAgentAny.theme,
                latestTheme: latestAgentData.theme,
                existingAvatar: !!existingAgentAny.avatar,
                latestAvatar: !!latestAgentData.avatar,
                useLatest: !!latestAgentData.theme || !!latestAgentData.avatar
              });
              
              // Use latest data if it has user selections
              if (latestAgentData.theme || latestAgentData.avatar) {
                console.log('🔄 Using latest agent data for theme/avatar preservation');
                existingAgentAny.theme = latestAgentData.theme || existingAgentAny.theme;
                existingAgentAny.avatar = latestAgentData.avatar || existingAgentAny.avatar;
                existingAgentAny.oauthTokens = latestAgentData.oauthTokens || existingAgentAny.oauthTokens;
                existingAgentAny.apiKeys = latestAgentData.apiKeys || existingAgentAny.apiKeys;
              }
            }
          } catch (error) {
            console.log('⚠️ Could not fetch latest data, using existing agent as-is:', error);
          }
          
          // Preserve avatar and theme (user takes priority)
          if (existingAgentAny.avatar) {
            preservedUserData.avatar = existingAgentAny.avatar;
            console.log('🎨 FINAL SAVE: Preserving user avatar data');
          }
          
          if (existingAgentAny.theme) {
            preservedUserData.theme = existingAgentAny.theme;
            console.log('🎨 FINAL SAVE: Preserving user theme data');
          }
          
          // Preserve other user data
          if (existingAgentAny.oauthTokens) {
            preservedUserData.oauthTokens = existingAgentAny.oauthTokens;
          }
          
          if (existingAgentAny.apiKeys) {
            preservedUserData.apiKeys = existingAgentAny.apiKeys;
          }
          
          if (existingAgentAny.credentials) {
            preservedUserData.credentials = existingAgentAny.credentials;
          }
          
          // Merge preserved data into final agent
          finalAgentData = { ...result.agent, ...preservedUserData };
          
          console.log('🔍 FINAL MERGE COMPLETE:', {
            originalHasAvatar: !!result.agent.avatar,
            originalHasTheme: !!(result.agent as any).theme,
            preservedAvatar: !!preservedUserData.avatar,
            preservedTheme: !!preservedUserData.theme,
            finalHasAvatar: !!(finalAgentData as any).avatar,
            finalHasTheme: !!(finalAgentData as any).theme
          });
        }

        // Save final agent data with updated timestamp
        const finalContent = JSON.stringify(finalAgentData, null, 2);
        console.log('💾 Saving final agent data to document...');
        await saveDocumentWithContent(documentId, result.agent.name || 'AI Agent System', finalContent, session, undefined, {
          ...stepMetadata,
          qualityScore: result.executionMetrics.qualityScore,
          executionTime: result.executionMetrics.totalDuration,
          validationResults: result.validationResults,
          lastUpdateTimestamp: new Date().toISOString(), // Ensure fresh timestamp
          completedAt: new Date().toISOString()
        });

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

        console.log('📡 Streaming final agent data...');
        // Stream the final agent data
        streamWithPersistence(dataStream, 'agent-data', finalContent, documentId, session);
        
        console.log('📝 Streaming final user-friendly content...');
        // Stream the final user-friendly content
        streamWithPersistence(dataStream, 'text-delta', userFriendlyMessage, documentId, session);
        
        // Send finish signal to notify UI that process is complete
        dataStream.writeData({ type: 'finish', content: '' });
        
        console.log('✅ Agent generation completed successfully');
        console.log(`📊 Quality Score: ${result.executionMetrics.qualityScore}/100`);
        console.log(`⏱️ Total Duration: ${result.executionMetrics.totalDuration}ms`);
        
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
        const hasSchedules = result.agent.schedules && result.agent.schedules.length > 0;
        
        console.log('⚠️ Agent generation partial success - checking if acceptable');
        console.log('🔍 Partial success details:', {
          resultSuccess: result.success,
          hasAgent: !!result.agent,
          hasModels,
          hasActions,
          hasSchedules,
          modelsCount: result.agent.models?.length || 0,
          actionsCount: result.agent.actions?.length || 0,
          schedulesCount: result.agent.schedules?.length || 0,
          qualityScore,
          errors: result.errors,
          validationResults: result.validationResults
        });
        
        // Accept agent if it has ANY meaningful structure (very lenient)
        if (hasModels || hasActions || hasSchedules) {
          console.log(`${result.success ? '✅' : '⚠️'} Agent generation completed ${result.success ? 'successfully' : 'with partial success'}`);
          console.log(`📊 Quality Score: ${qualityScore}/100`);
          console.log(`📋 Components: ${result.agent.models?.length || 0} models, ${result.agent.actions?.length || 0} actions, ${result.agent.schedules?.length || 0} schedules`);
          if (!result.success) {
            console.log(`⚠️ Issues: ${result.errors?.join(', ') || 'Validation warnings'}`);
          }
          
          console.log('✅ Accepting partial success - sending final completion step');
          
          // Final completion step
          stepMetadata.currentStep = 'complete';
          stepMetadata.stepProgress.complete = 'complete';
          stepMetadata.status = 'complete';
          
          const message = result.success 
            ? 'Agent system generated successfully!'
            : `Agent system generated with ${result.agent.models?.length || 0} models, ${result.agent.actions?.length || 0} actions, ${result.agent.schedules?.length || 0} schedules`;
          
          const finalStepData = {
            step: 'complete',
            status: 'complete',
            message
          };
          dataStream.writeData({ type: 'agent-step', content: finalStepData });
          
          // Force immediate save of final step progress (bypass debounce)
          await saveStepProgressOnly(documentId, finalStepData, session);

          // CRITICAL FIX: Preserve user data before partial success save (same as full success)
          let partialAgentData = result.agent;
          
          // If we have existing agent data, merge to preserve user-configured data
          if (existingAgent) {
            const existingAgentAny = existingAgent as any;
            const preservedUserData: any = {};
            
            // Preserve avatar and theme (user takes priority)
            if (existingAgentAny.avatar) {
              preservedUserData.avatar = existingAgentAny.avatar;
              console.log('🎨 PARTIAL SUCCESS: Preserving user avatar data');
            }
            
            if (existingAgentAny.theme) {
              preservedUserData.theme = existingAgentAny.theme;
              console.log('🎨 PARTIAL SUCCESS: Preserving user theme data');
            }
            
            // Preserve other user data
            if (existingAgentAny.oauthTokens) {
              preservedUserData.oauthTokens = existingAgentAny.oauthTokens;
            }
            
            if (existingAgentAny.apiKeys) {
              preservedUserData.apiKeys = existingAgentAny.apiKeys;
            }
            
            if (existingAgentAny.credentials) {
              preservedUserData.credentials = existingAgentAny.credentials;
            }
            
            // Merge preserved data into partial agent
            partialAgentData = { ...result.agent, ...preservedUserData };
            
            console.log('🔍 PARTIAL MERGE COMPLETE:', {
              preservedAvatar: !!preservedUserData.avatar,
              preservedTheme: !!preservedUserData.theme,
              finalHasAvatar: !!(partialAgentData as any).avatar,
              finalHasTheme: !!(partialAgentData as any).theme
            });
          }

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

          // Stream the final agent data
          // streamWithPersistence(dataStream, 'agent-data', finalContent, documentId, session);
          streamWithPersistence(dataStream, 'text-delta', userFriendlyMessage, documentId, session);
          
          // Send finish signal to notify UI that process is complete
          dataStream.writeData({ type: 'finish', content: '' });
          
          return {
            id: documentId,
            title: result.agent.name || 'AI Agent System',
            kind: 'agent' as const,
            content: userFriendlyMessage
          };
        } else {
          console.log('❌ Agent has no models, actions, or schedules - but will still try to save what we have');
          
          // Even if we have minimal data, still complete the process to avoid hanging
          stepMetadata.currentStep = 'complete';
          stepMetadata.stepProgress.complete = 'complete';
          stepMetadata.status = 'complete';
          
          const minimalStepData = {
            step: 'complete',
            status: 'complete',
            message: 'Agent generation completed with minimal data'
          };
          dataStream.writeData({ type: 'agent-step', content: minimalStepData });

          // streamWithPersistence(dataStream, 'agent-data', finalContent, documentId, session);
          dataStream.writeData({ 
            type: 'text-delta', 
            content: `⚠️ **Agent System Created with Minimal Data**

The agent "${result.agent.name || 'AI Agent System'}" was created but may need additional configuration.

💡 **Next Steps:** Please refine your request or try again with more specific requirements.`
          });
          
          // Send finish signal to notify UI that process is complete
          dataStream.writeData({ type: 'finish', content: '' });
          
          return {
            id: documentId,
            title: result.agent.name || 'AI Agent System',
            kind: 'agent' as const,
            content: `⚠️ **Agent System Created with Minimal Data**

The agent "${result.agent.name || 'AI Agent System'}" was created but may need additional configuration.

💡 **Next Steps:** Please refine your request or try again with more specific requirements.`
          };
        }
      } else {
        console.log('❌ No agent generated at all - but will still complete to avoid hanging');
        console.log('🔍 Failure details:', {
          resultSuccess: result.success,
          hasAgent: !!result.agent,
          errors: result.errors,
          validationResults: result.validationResults
        });
        
        // Even with complete failure, still mark as complete to avoid hanging UI
        stepMetadata.currentStep = 'complete';
        stepMetadata.stepProgress.complete = 'complete';
        stepMetadata.status = 'complete';
        
        const failureStepData = {
          step: 'complete',
          status: 'complete',
          message: 'Agent generation process completed'
        };
        dataStream.writeData({ type: 'agent-step', content: failureStepData });

        // streamWithPersistence(dataStream, 'agent-data', '{}', documentId, session);
        dataStream.writeData({ 
          type: 'text-delta', 
          content: `❌ **Agent Generation Failed**

The agent generation process encountered issues and could not create a usable agent.

**Errors:** ${result.errors?.join(', ') || 'Unknown error'}

💡 **Next Steps:** Please try again with a more specific request or check the system logs.`
        });
        
        // Send finish signal to notify UI that process is complete
        dataStream.writeData({ type: 'finish', content: '' });
        
        return {
          id: documentId,
          title: 'Agent Generation Failed',
          kind: 'agent' as const,
          content: `❌ **Agent Generation Failed**

The agent generation process encountered issues and could not create a usable agent.

**Errors:** ${result.errors?.join(', ') || 'Unknown error'}

💡 **Next Steps:** Please try again with a more specific request or check the system logs.`
        };
      }
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
      
      const catchErrorStepData = { 
        step: errorStep, 
        status: 'failed', 
        message: canResume ? 'Generation incomplete - can be resumed' : 'System error occurred',
        canResume,
        documentId: documentId
      };
      dataStream.writeData({ type: 'agent-step', content: catchErrorStepData });
      
      const errorMessage = generateErrorMessage(error, 'Enhanced Agent Building');
      
      // Send finish signal to notify UI that process is complete (even with error)
      dataStream.writeData({ type: 'finish', content: '' });
      
      // await saveDocumentWithContent(documentId, canResume ? 'Incomplete Agent System' : 'Error Agent System', JSON.stringify({
      //   error: error instanceof Error ? error.message : 'Unknown error',
      //   timestamp: new Date().toISOString(),
      //   canResume,
      //   partialData
      // }, null, 2), session, undefined, {
      //   ...stepMetadata,
      //   canResume,
      //   partialData
      // });
      
      return {
        id: documentId,
        title: canResume ? 'Incomplete Agent System' : 'Error Agent System',
        kind: 'agent' as const,
        content: errorMessage
      };
    }
  },
});