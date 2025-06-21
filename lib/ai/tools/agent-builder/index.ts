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

import {
  promptUnderstandingSchema,
  changeAnalysisSchema,
  databaseGenerationSchema,
  actionGenerationSchema,
  scheduleGenerationSchema
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
  generateDeletionOperations
} from './generation';

import {
  createAgentData,
  validateAgentData,
  logAgentData,
  generateSuccessMessage,
  generateErrorMessage
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
  createAgentData
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
  deletionOperations?: any
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
        userId: session.user.id
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
        userId: session.user.id
      });
      return true;
    }

    // Perform deep comparison and intelligent merge
    const mergedData = performDeepMerge(existingData, newData, deletionOperations);
    const hasChanges = !deepEqual(existingData, mergedData);
    
    if (hasChanges) {
      console.log('🔄 Content changes detected, updating document');
      console.log('📊 Changes summary:');
      logContentChanges(existingData, mergedData);
      
      await saveOrUpdateDocument({
        id: documentId,
        title: newTitle,
        kind: 'agent',
        content: JSON.stringify(mergedData, null, 2),
        userId: session.user.id
      });
      return true;
    } else {
      console.log('✅ No content changes detected, skipping update');
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
          userId: session.user.id
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

async function saveDocumentWithContent(
  documentId: string,
  title: string,
  content: string,
  session?: Session | null,
  deletionOperations?: any
) {
  // Use intelligent document update for merging
  return await intelligentDocumentUpdate(documentId, title, content, session, deletionOperations);
}

function migrateActionsWithIds(existingAgent: AgentData): AgentData {
  if (!existingAgent.actions || !Array.isArray(existingAgent.actions)) {
    return existingAgent;
  }

  const migratedActions = existingAgent.actions.map(action => {
    if (!action.id) {
      return {
        ...action,
        id: generateNewId('action', existingAgent.actions || [])
      };
    }
    return action;
  });

  return {
    ...existingAgent,
    actions: migratedActions
  };
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
  description: `A unified AI agent builder that intelligently determines what needs to be built based on your request.
  
  This smart tool analyzes your request and existing system to decide whether to:
  - Build a complete agent system with database and workflows
  - Focus on database modeling and schema design
  - Create business workflows and automation
  - Update or extend existing components
  
  The AI automatically determines the best approach and execution order based on your specific needs.
  
  Examples:
  - "I need a blog system" → Builds complete system
  - "Add user authentication to my existing app" → Focuses on relevant components
  - "Create order processing workflow" → Focuses on actions with supporting database
  - "Design database for inventory management" → Focuses on database with suggested actions
  `,
  parameters: z.object({
    command: z.string().describe('Natural language description of what you want to build or modify'),
    operation: z.enum(['create', 'update', 'extend']).optional().default('create').describe('Whether to create new, update existing, or extend current agent system'),
    context: z.string().optional().describe('Existing system context for updates or extensions')
  }),
  execute: async ({ command, operation = 'create', context }) => {
    console.log(`🤖 Agent Builder: Processing "${command}" - Operation: ${operation}`);
    console.log('🔍 Agent Builder Input Context:');
    console.log('  - existingContext:', existingContext ? 'PROVIDED' : 'NULL');
    console.log('  - existingDocumentId:', existingDocumentId || 'NULL');
    console.log('  - context parameter:', context ? 'PROVIDED' : 'NULL');
    
    if (existingContext) {
      console.log('📄 Existing context preview (first 200 chars):', existingContext.substring(0, 200));
    }
    
    if (existingDocumentId) {
      console.log('📄 Existing document ID detected - will update existing agent');
    } else {
      console.log('📄 No existing document ID - will create new agent document');
    }
    
    // Check model compatibility first
    const bestModel = getBestModelFor('generateObject');
    if (bestModel && !supportsStructuredOutput(bestModel)) {
      const warningMessage = `⚠️ Warning: Model ${bestModel} has limited structured output support. Agent builder may not work optimally.`;
      console.warn(warningMessage);
      dataStream.writeData({ type: 'warning', content: warningMessage });
    }
    
    // Make operation mutable for auto-adjustment
    let currentOperation = operation;
    
    // Use existing document ID if available, otherwise generate new one
    const documentId = existingDocumentId || generateUUID();
    const isUpdatingExisting = !!existingDocumentId;
    
    console.log(`📄 ${isUpdatingExisting ? 'UPDATING EXISTING' : 'CREATING NEW'} document with ID: ${documentId}`);
    console.log(`📄 Document ID source: ${existingDocumentId ? 'FROM CONVERSATION HISTORY' : 'NEWLY GENERATED'}`);
    
    // Always create document at the beginning with agent kind
    dataStream.writeData({ type: 'kind', content: 'agent' });
    dataStream.writeData({ type: 'id', content: documentId });
    dataStream.writeData({ type: 'title', content: isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System' });
    dataStream.writeData({ type: 'clear', content: '' });
    
    // Save initial document
    await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', '{"status": "analyzing"}', session);
    
    console.log(`📄 Created document with ID: ${documentId}`);

    try {
      // Analyze conversation context
      const conversationContext = analyzeConversationContext(messages);
      console.log('📋 Conversation context analyzed:', conversationContext.length, 'characters');

      // Parse existing context
      let existingAgent: AgentData | null = null;
      const contextToUse = context || existingContext;
      
      console.log('🔍 Context Analysis:');
      console.log('  - contextToUse source:', context ? 'parameter' : existingContext ? 'existingContext' : 'none');
      console.log('  - contextToUse length:', contextToUse ? contextToUse.length : 0);
      
      if (contextToUse) {
        console.log('📋 Attempting to parse context...');
        try {
          const parsed = JSON.parse(contextToUse);
          console.log('✅ Context parsed as valid JSON');
          console.log('📊 Parsed object keys:', Object.keys(parsed));
          
          // Validate that the parsed content looks like agent data
          if (typeof parsed === 'object' && parsed !== null) {
            console.log('📝 Object validation:');
            console.log('  - has models array:', Array.isArray(parsed.models));
            console.log('  - has actions array:', Array.isArray(parsed.actions));
            console.log('  - has name string:', typeof parsed.name === 'string');
            
            // Check if it has agent-like properties
            if (parsed.models && Array.isArray(parsed.models) && 
                parsed.actions && Array.isArray(parsed.actions)) {
              existingAgent = parsed as AgentData;
              
              // Migrate actions to have IDs if they don't have them
              existingAgent = migrateActionsWithIds(existingAgent);
              
              console.log('✅ Successfully parsed existing agent context');
              console.log(`📊 Existing agent data: ${existingAgent.models.length} models, ${existingAgent.actions.length} actions`);
              console.log('📝 Agent details:');
              console.log('  - name:', existingAgent.name);
              console.log('  - description:', existingAgent.description);
              console.log('  - domain:', existingAgent.domain);
              console.log('  - models:', (existingAgent.models || []).map(m => m.name));
              console.log('  - actions:', (existingAgent.actions || []).map(a => `${a.id}:${a.name}`));
            } else {
              console.log('⚠️ Context is valid JSON but not valid agent data structure, starting fresh');
              console.log('📋 Missing required properties or wrong types');
              existingAgent = null;
            }
          } else {
            console.log('⚠️ Context is not a valid object, starting fresh');
            existingAgent = null;
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse context, starting fresh. Error:', (e as Error).message);
          console.warn('📄 Problematic context content (first 200 chars):', contextToUse.substring(0, 200));
          existingAgent = null;
        }
      } else {
        console.log('📋 No context provided, starting fresh');
      }

      // Auto-adjust operation if we have existing data but operation is 'create'
      if (existingAgent && currentOperation === 'create') {
        currentOperation = 'extend';
        console.log('🔄 Auto-adjusted operation from "create" to "extend" since existing agent data was found');
      }

      // Step 0: Comprehensive prompt understanding and feature imagination
      console.log('🎯 Step 0: Comprehensive Prompt Understanding and Feature Imagination');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'prompt-understanding', 
          status: 'processing',
          message: 'Analyzing your request and imagining comprehensive features...'
        })
      });

      await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
        status: 'analyzing',
        step: 'prompt-understanding',
        message: 'Analyzing your request and imagining comprehensive features...'
      }, null, 2), session);

      const promptUnderstanding = await generatePromptUnderstanding(command, existingAgent || undefined);
      
      console.log('🎯 Prompt Understanding Complete:', JSON.stringify(promptUnderstanding, null, 2));
      
      dataStream.writeData({
        type: 'agent-step', 
        content: JSON.stringify({ 
          step: 'prompt-understanding', 
          status: 'complete', 
          data: promptUnderstanding,
          message: `Analysis complete: ${promptUnderstanding.userRequestAnalysis.complexity} ${promptUnderstanding.userRequestAnalysis.businessContext} system with ${promptUnderstanding.dataModelingNeeds.requiredModels.length} models and ${promptUnderstanding.workflowAutomationNeeds.requiredActions.length} actions planned`
        })
      });

      await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
        status: 'planning',
        step: 'prompt-understanding',
        promptUnderstanding: promptUnderstanding
      }, null, 2), session);

      // Step 0.5: Granular Change Analysis (if needed)
      let granularChanges: any = null;
      if (promptUnderstanding.changeAnalysisPlan.length > 0) {
        console.log('🔍 Step 0.5: Granular Change Analysis');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'granular-analysis', 
            status: 'processing',
            message: `Breaking down ${promptUnderstanding.changeAnalysisPlan.length} changes into detailed execution plan...`
          })
        });

        granularChanges = await generateGranularChangeAnalysis(command, promptUnderstanding as PromptUnderstanding, existingAgent || undefined);

        console.log('🎯 Granular Change Analysis Complete:', JSON.stringify(granularChanges.object, null, 2));
        
        dataStream.writeData({
          type: 'agent-step', 
          content: JSON.stringify({ 
            step: 'granular-analysis', 
            status: 'complete', 
            data: granularChanges.object,
            message: `Execution plan ready: ${granularChanges.object.executionPlan.phases.length} phases with ${granularChanges.object.specificChanges.length} specific operations`
          })
        });

        await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
          status: 'planning',
          step: 'granular-analysis',
          promptUnderstanding: promptUnderstanding,
          granularChanges: granularChanges.object
        }, null, 2), session);
      }

      // Step 1: AI Decision Making (now enhanced with prompt understanding)
      console.log('🧠 Step 1: AI Analysis and Decision Making');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'analysis', 
          status: 'processing',
          message: 'AI determining the best technical approach based on feature analysis...'
        })
      });

      await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
        status: 'analyzing',
        step: 'analysis',
        message: 'AI determining the best technical approach based on feature analysis...',
        promptUnderstanding: promptUnderstanding,
        granularChanges: granularChanges?.object
      }, null, 2), session);

      const decision = await generateDecision(command, conversationContext, promptUnderstanding as PromptUnderstanding, existingAgent || undefined, granularChanges, currentOperation);
      
      console.log('🎯 AI Decision made:', JSON.stringify(decision.object, null, 2));
      
      dataStream.writeData({
        type: 'agent-step', 
        content: JSON.stringify({ 
          step: 'analysis', 
          status: 'complete', 
          data: decision.object,
          message: `Analysis complete: ${decision.object.needsFullAgent ? 'Building complete system' : 
            decision.object.needsDatabase && decision.object.needsActions ? 'Building database and actions' :
            decision.object.needsDatabase ? 'Focusing on database' : 
            decision.object.needsActions ? 'Focusing on actions' : 'Analyzing existing system'}`
        })
      });

      // Initialize results
      let finalAgent: AgentData;
      let agentOverview: any = null;
      let databaseResults: any = null;
      let actionsResults: any = null;
      let schedulesResults: any = null;
      let deletionOperations: any = null;

      // Step 1.5: Change Analysis (for existing systems)
      let changeAnalysis: any = null;
      if (existingAgent && (currentOperation === 'extend' || currentOperation === 'update')) {
        // Use granular changes if available, otherwise fall back to simpler analysis
        if (granularChanges) {
          console.log('🔍 Step 1.5: Using Granular Change Analysis');
          changeAnalysis = {
            userIntent: granularChanges.object.changeDetails.operationType,
            targetType: granularChanges.object.changeDetails.targetScope,
            preserveExisting: granularChanges.object.changeDetails.preservationStrategy !== 'replace-targeted',
            specificTargets: (granularChanges.object.specificChanges || []).map((c: any) => c.target),
            expectedResult: granularChanges.object.expectedOutcome
          };
          
          // Use existing deletion operations logic if there are delete operations
          const deleteOperations = (granularChanges.object.specificChanges || []).filter((c: any) => 
            c.type.startsWith('delete-')
          );
          
          if (deleteOperations.length > 0) {
            console.log('🗑️ Generating deletion operations from granular analysis...');
            
            const deletionOperationsResult = await generateDeletionOperations(
              command,
              changeAnalysis,
              existingAgent,
              granularChanges.object
            );

            deletionOperations = deletionOperationsResult.object;
            console.log('🗑️ Deletion operations:', JSON.stringify(deletionOperations, null, 2));
          }
          
          dataStream.writeData({
            type: 'agent-step', 
            content: JSON.stringify({ 
              step: 'change-analysis', 
              status: 'complete', 
              data: changeAnalysis,
              message: `Using granular change analysis: ${granularChanges.object.specificChanges.length} operations across ${granularChanges.object.executionPlan.phases.length} phases`
            })
          });
        } else {
          // Fallback to original change analysis
          console.log('🔍 Step 1.5: Detailed Change Analysis');
          dataStream.writeData({
            type: 'agent-step',
            content: JSON.stringify({ 
              step: 'change-analysis', 
              status: 'processing',
              message: 'Analyzing what should be preserved, added, or modified...'
            })
          });

          const changeAnalysisResult = await generateChangeAnalysis(
            command,
            existingAgent
          );
          changeAnalysis = changeAnalysisResult;

          console.log('🎯 Change Analysis:', JSON.stringify(changeAnalysis, null, 2));
          
          dataStream.writeData({
            type: 'agent-step', 
            content: JSON.stringify({ 
              step: 'change-analysis', 
              status: 'complete', 
              data: changeAnalysis,
              message: `Change analysis complete: ${changeAnalysis.userIntent} ${changeAnalysis.specificTargets.join(', ')} - preserving ${changeAnalysis.preserveExisting ? 'all' : 'some'} existing data`
            })
          });

          // Generate deletion operations if needed
          if (changeAnalysis.userIntent === 'delete' || changeAnalysis.expectedResult?.deletedItems?.length > 0) {
            console.log('🗑️ Generating deletion operations...');
            
            const deletionOperationsResult = await generateDeletionOperations(
              command,
              changeAnalysis,
              existingAgent
            );

            deletionOperations = deletionOperationsResult.object;
            console.log('🗑️ Deletion operations:', JSON.stringify(deletionOperations, null, 2));
          }
        }
      }

      // Step 2: System Overview Generation (matching old version)
      if (decision.object.needsFullAgent || decision.object.priority === 'agent-first') {
        console.log('📋 Step 2: System Overview Generation');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'overview', 
            status: 'processing',
            message: 'Creating comprehensive system overview...'
          })
        });

        // Generate system overview based on prompt understanding and decision
        agentOverview = {
          object: {
            name: promptUnderstanding.userRequestAnalysis.mainGoal || existingAgent?.name || 'AI Agent System',
            description: `${promptUnderstanding.userRequestAnalysis.mainGoal} - ${promptUnderstanding.userRequestAnalysis.businessContext}` || existingAgent?.description || 'An intelligent agent system',
            domain: promptUnderstanding.userRequestAnalysis.businessContext || existingAgent?.domain || 'general',
            requirements: promptUnderstanding.featureImagination.coreFeatures.concat(promptUnderstanding.featureImagination.additionalFeatures),
            features: promptUnderstanding.featureImagination.coreFeatures,
            scope: decision.object.scope
          }
        };

        console.log('🎯 System Overview Complete:', JSON.stringify(agentOverview.object, null, 2));
        
        dataStream.writeData({
          type: 'agent-step', 
          content: JSON.stringify({ 
            step: 'overview', 
            status: 'complete', 
            data: agentOverview.object,
            message: `System overview complete: ${agentOverview.object.name}`
          })
        });

        // Stream partial agent data after overview completion
        const partialAgent = createAgentData(
          agentOverview.object.name,
          agentOverview.object.description,
          agentOverview.object.domain,
          existingAgent?.models || [],
          existingAgent?.enums || [],
          existingAgent?.actions || [],
          existingAgent?.schedules || [],
          { step: 'overview', completed: true }
        );
        
        dataStream.writeData({
          type: 'agent-data',
          content: JSON.stringify(partialAgent)
        });

        await saveDocumentWithContent(documentId, agentOverview.object.name, JSON.stringify({
          status: 'processing',
          step: 'overview',
          overview: agentOverview.object,
          decision: decision.object
        }, null, 2), session);
      }

      // Step 3: Generate Database Models and Enums (was Step 2, now matching old version)
      if (decision.object.needsDatabase) {
        console.log('🗄️ Step 3: Database Schema Generation');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'models', 
            status: 'processing',
            message: decision.object.scope?.databaseWork || 'Generating database schema and models...'
          })
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'database',
          overview: agentOverview?.object,
          message: 'Generating database schema and models...'
        }, null, 2), session);

        const databaseResult = await generateDatabase(promptUnderstanding as PromptUnderstanding, existingAgent || undefined, changeAnalysis, agentOverview, conversationContext, command);
        
        console.log(`🔧 Database generation complete: ${databaseResult.models.length} models`);
        console.log('🔍 Raw AI database results:', JSON.stringify({
          modelsCount: databaseResult.models.length,
          modelNames: (databaseResult.models || []).map((m: any) => m.name)
        }, null, 2));
        
        if (existingAgent) {
          console.log(`📊 Comparison: Existing had ${existingAgent.models.length} models`);
          console.log(`📋 Note: Intelligent merging will happen during final document save`);
        }
        
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'models', 
            status: 'complete',
            data: { object: databaseResult },
            message: `Database schema complete: ${databaseResult.models.length} models`
          })
        });

        // Stream partial agent data after models completion
        const partialAgent = createAgentData(
          agentOverview?.object?.name || existingAgent?.name || 'AI Agent System',
          agentOverview?.object?.description || existingAgent?.description || 'AI-generated agent system',
          agentOverview?.object?.domain || existingAgent?.domain || '',
          databaseResult.models || [],
          databaseResult.enums || [],
          existingAgent?.actions || [],
          existingAgent?.schedules || [],
          { step: 'models', completed: true }
        );
        
        dataStream.writeData({
          type: 'agent-data',
          content: JSON.stringify(partialAgent)
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'database',
          overview: agentOverview?.object,
          database: databaseResult,
          message: `Database schema complete: ${databaseResult.models.length} models`
        }, null, 2), session);

        databaseResults = databaseResult;
      }

      // Step 4: Generate Actions (was Step 3, now matching old version)
      if (decision.object.needsActions) {
        console.log('⚡ Step 4: Actions and Workflows Generation');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'actions', 
            status: 'processing',
            message: decision.object.scope?.actionsWork || 'Creating intelligent workflows and automation...'
          })
        });

        const actionsResult = await generateActions(promptUnderstanding as PromptUnderstanding, databaseResults || { models: [], enums: [] }, existingAgent || undefined, changeAnalysis, agentOverview, conversationContext, command);
        
        console.log(`🔧 Actions generation complete: ${actionsResult.actions.length} actions`);
        console.log('🔍 Raw AI actions results:', JSON.stringify({
          actionsCount: actionsResult.actions.length,
          actionNames: (actionsResult.actions || []).map((a: any) => a.name)
        }, null, 2));
        
        if (existingAgent) {
          console.log(`📊 Comparison: Existing had ${existingAgent.actions.length} actions`);
          console.log(`📋 Note: Intelligent merging will happen during final document save`);
        }
        
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'actions', 
            status: 'complete',
            data: { object: actionsResult },
            message: `Workflows complete: ${actionsResult.actions.length} automated actions`
          })
        });

        // Stream partial agent data after actions completion
        const partialAgent = createAgentData(
          agentOverview?.object?.name || existingAgent?.name || 'AI Agent System',
          agentOverview?.object?.description || existingAgent?.description || 'AI-generated agent system',
          agentOverview?.object?.domain || existingAgent?.domain || '',
          databaseResults?.models || [],
          databaseResults?.enums || [],
          actionsResult.actions || [],
          existingAgent?.schedules || [],
          { step: 'actions', completed: true }
        );
        
        dataStream.writeData({
          type: 'agent-data',
          content: JSON.stringify(partialAgent)
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'actions',
          overview: agentOverview?.object,
          database: databaseResults,
          actions: actionsResult,
          message: `Workflows complete: ${actionsResult.actions.length} automated actions`
        }, null, 2), session);

        actionsResults = actionsResult;
      }

      // Step 4.5: Schedules Generation (if actions were created)
      if (actionsResults && actionsResults.actions.length > 0) {
        console.log('📅 Step 4.5: Schedules and Timing Generation');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'schedules', 
            status: 'processing',
            message: 'Creating automated scheduling and timing configurations...'
          })
        });

        const schedulesResult = await generateSchedules(promptUnderstanding as PromptUnderstanding, databaseResults, actionsResults, existingAgent || undefined, changeAnalysis);
        
        console.log(`🔧 Schedules generation complete: ${schedulesResult.schedules.length} schedules`);
        
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'schedules', 
            status: 'complete',
            data: { object: schedulesResult },
            message: `Scheduling complete: ${schedulesResult.schedules.length} automated schedules`
          })
        });

        // Stream partial agent data after schedules completion
        const partialAgent = createAgentData(
          agentOverview?.object?.name || existingAgent?.name || 'AI Agent System',
          agentOverview?.object?.description || existingAgent?.description || 'AI-generated agent system',
          agentOverview?.object?.domain || existingAgent?.domain || '',
          databaseResults?.models || [],
          databaseResults?.enums || [],
          actionsResults?.actions || [],
          schedulesResult.schedules || [],
          { step: 'schedules', completed: true }
        );
        
        dataStream.writeData({
          type: 'agent-data',
          content: JSON.stringify(partialAgent)
        });

        schedulesResults = schedulesResult;
      } else {
        // No actions, so skip schedules but still show completion
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'schedules', 
            status: 'complete',
            data: { object: { schedules: [] } },
            message: 'No scheduling needed - no actions created'
          })
        });
      }

      // Step 5: Final Integration
      console.log('🔧 Step 5: Final System Integration');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'integration', 
          status: 'processing',
          message: 'Integrating all components and finalizing system...'
        })
      });

      // Create final agent with comprehensive metadata - matching old implementation
      console.log('🆕 Creating agent data with raw AI results for intelligent merging...');

      // Build comprehensive metadata from analysis phases
      const comprehensiveMetadata = {
        promptUnderstanding: promptUnderstanding,
        granularChanges: granularChanges,
        aiDecision: decision.object,
        changeAnalysis: changeAnalysis,
        lastUpdateReason: command,
        lastUpdateTimestamp: new Date().toISOString(),
        comprehensiveAnalysisUsed: true,
        operationType: currentOperation,
        promptAnalysisPhase: promptUnderstanding,
        granularChangesPhase: granularChanges,
        aiDecisionPhase: decision.object
      };

      // Create agent data using the old implementation signature (with schedules as separate parameter)
      finalAgent = createAgentData(
        agentOverview?.object?.name || existingAgent?.name || 'AI Agent System',
        agentOverview?.object?.description || existingAgent?.description || 'AI-generated agent system',
        agentOverview?.object?.domain || existingAgent?.domain || '',
        databaseResults?.models || [],
        databaseResults?.enums || [],
        actionsResults?.actions || [],
        schedulesResults?.schedules || [],
        comprehensiveMetadata
      );

      // Add schedules if they were generated (matching old implementation)
      if (schedulesResults?.schedules) {
        finalAgent.schedules = schedulesResults.schedules;
      }

      // Preserve creation date if updating existing agent
      if (existingAgent) {
        finalAgent.createdAt = existingAgent.createdAt;
        console.log('🔄 Using raw AI results - intelligent merging will preserve existing data during save');
      }

      console.log('🎯 Raw AI results assembled with comprehensive metadata (before intelligent merging):', JSON.stringify({
        name: finalAgent.name,
        modelsCount: finalAgent.models.length,
        actionsCount: finalAgent.actions.length,
        schedulesCount: finalAgent.schedules.length,
        hasMetadata: !!finalAgent.metadata,
        metadataFields: finalAgent.metadata ? Object.keys(finalAgent.metadata).length : 0,
        note: existingAgent ? 'Existing data will be preserved during intelligent document save' : 'New system being created'
      }, null, 2));

      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'integration', 
          status: 'complete',
          data: finalAgent,
          message: `Raw AI results ready: ${finalAgent.models.length} models, ${finalAgent.actions.length} actions, ${finalAgent.schedules.length} schedules${existingAgent ? ' (will merge with existing data)' : ''}`
        })
      });

      // Stream the final agent data to UI
      dataStream.writeData({
        type: 'agent-data',
        content: JSON.stringify(finalAgent)
      });

      // Final save - this will trigger intelligentDocumentUpdate which handles the merging
      console.log('💾 Saving document with intelligent merging...');
      if (deletionOperations) {
        console.log('🗑️ Applying deletion operations:', JSON.stringify(deletionOperations, null, 2));
      }
      if (existingAgent) {
        console.log('🔄 Before save - Raw AI data:', {
          models: finalAgent.models.length,
          actions: finalAgent.actions.length
        });
        console.log('🔄 Existing data to preserve:', {
          models: existingAgent.models.length,
          actions: existingAgent.actions.length
        });
      }

      // Save document with intelligent merging to preserve existing data
      await saveDocumentWithContent(
        documentId,
        finalAgent.name,
        JSON.stringify(finalAgent, null, 2),
        session,
        deletionOperations
      );

      // Generate success message based on decision object
      const successMessage = generateSuccessMessage(finalAgent, currentOperation === 'update' || currentOperation === 'extend', decision.object);
      
      dataStream.writeData({ type: 'finish', content: '' });
      
      console.log('✅ Agent builder completed successfully');
      console.log('📄 Final agent title:', finalAgent.name);
      
      return {
        id: documentId,
        title: finalAgent.name,
        kind: 'agent' as const,
        content: successMessage
      };

    } catch (error) {
      console.error('❌ Agent Builder Error:', error);
      
      const errorMessage = generateErrorMessage(error, 'Agent Building');
      
      await saveDocumentWithContent(documentId, 'Error Agent System', JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2), session);

      dataStream.writeData({ type: 'agent-step', content: JSON.stringify({ step: 'error', status: 'failed', message: 'System error occurred' }) });
      dataStream.writeData({ type: 'finish', content: errorMessage });
      
      return {
        id: documentId,
        title: 'Error Agent System',
        kind: 'agent' as const,
        content: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  },
}); 