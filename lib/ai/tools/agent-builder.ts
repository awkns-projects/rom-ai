import { generateObject, type Message, tool , type DataStreamWriter } from 'ai';
import { z } from 'zod';
import { myProvider } from '../providers';
import { generateUUID } from '@/lib/utils';
import { saveOrUpdateDocument, getDocumentById } from '@/lib/db/queries';
import type { Session } from 'next-auth';

// Shared interfaces
export interface AgentModel {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  idField: string;
  displayFields: string[];
  fields: AgentField[];
  enums: AgentEnum[];
}

export interface AgentField {
  id: string;
  name: string;
  type: string;
  isId: boolean;
  unique: boolean;
  list: boolean;
  required: boolean;
  kind: 'scalar' | 'object' | 'enum';
  relationField: boolean;
  title: string;
  sort: boolean;
  order: number;
  defaultValue?: string;
}

export interface AgentEnum {
  id: string;
  name: string;
  fields: AgentEnumField[];
}

export interface AgentEnumField {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
}

// New Schedule interface for recurring tasks
export interface AgentSchedule {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  interval: {
    pattern: string;
    timezone?: string;
    active?: boolean;
  };
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: DatabaseModel[];
    };
  };
  execute: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: EnvVar[];
    };
    prompt?: {
      template: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
}

export interface DatabaseModel {
  id: string;
  name: string;
  fields: DatabaseField[];
  where?: Record<string, any>;
  limit?: number;
}

export interface DatabaseField {
  id: string;
  name: string;
}

export interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
}

export interface AgentData {
  name: string;
  description: string;
  domain: string;
  models: AgentModel[];
  enums: AgentEnum[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  createdAt: string;
  metadata?: {
    promptUnderstanding?: any;
    granularChanges?: any;
    aiDecision?: any;
    changeAnalysis?: any;
    lastUpdateReason?: string;
    lastUpdateTimestamp?: string;
    comprehensiveAnalysisUsed?: boolean;
    operationType?: string;
    promptAnalysisPhase?: {
      userRequestAnalysis?: any;
      featureImagination?: any;
      dataModelingNeeds?: any;
      workflowAutomationNeeds?: any;
      changeAnalysisPlan?: any;
      implementationStrategy?: any;
    };
    granularChangesPhase?: {
      changeDetails?: any;
      specificChanges?: any;
      executionPlan?: any;
      expectedOutcomes?: any;
    };
    aiDecisionPhase?: {
      analysisReasoning?: string;
      scopeDetermination?: any;
      operationType?: string;
      priority?: string;
    };
  };
}

// Schema for AI decision making
const decisionSchema = z.object({
  analysisReasoning: z.string().describe('Detailed reasoning about what the user is asking for'),
  needsFullAgent: z.boolean().describe('Whether this requires a complete agent system with database and actions'),
  needsDatabase: z.boolean().describe('Whether this requires database modeling or schema work'),
  needsActions: z.boolean().describe('Whether this requires workflow automation or business logic'),
  operation: z.enum(['create', 'update', 'extend']).describe('What type of operation to perform'),
  priority: z.enum(['agent-first', 'database-first', 'actions-first']).describe('Which component should be built first'),
  scope: z.object({
    agentWork: z.string().optional().describe('What agent-level work needs to be done'),
    databaseWork: z.string().optional().describe('What database work needs to be done'),
    actionsWork: z.string().optional().describe('What actions/workflow work needs to be done')
  })
});

// Enhanced schemas for unified generation
const unifiedAgentSchema = z.object({
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  requirements: z.array(z.string()),
  features: z.array(z.string()),
  architecture: z.string()
});

const unifiedDatabaseSchema = z.object({
  models: z.array(z.object({
    id: z.string().describe('Unique identifier for the model'),
    name: z.string().describe('Name of the data model'),
    emoji: z.string().optional().describe('Single emoji that visually represents this model (e.g., 👤 for User, 📧 for Email, 🛒 for Order)'),
    description: z.string().optional().describe('Detailed description of what this model represents and its purpose'),
    idField: z.string().describe('Name of the primary identifier field'),
    displayFields: z.array(z.string()).describe('Fields to show in lists and previews'),
    fields: z.array(z.object({
      id: z.string().describe('Unique identifier for the field'),
      name: z.string().describe('Field name in database'),
      type: z.string().describe('Data type (String, Int, Float, Boolean, DateTime, etc.) - Use String for ID fields'),
      isId: z.boolean().describe('Whether this is the primary identifier field'),
      unique: z.boolean().describe('Whether values must be unique'),
      list: z.boolean().describe('Whether this field contains a list/array'),
      required: z.boolean().describe('Whether this field is required'),
      kind: z.enum(['scalar', 'object', 'enum']).describe('Kind of field - scalar for primitive types, object for relations, enum for predefined values'),
      relationField: z.boolean().describe('Whether this connects to another model'),
      title: z.string().describe('Human-readable label for the field'),
      sort: z.boolean().describe('Whether this field can be sorted'),
      order: z.number().describe('Display order of the field'),
      defaultValue: z.string().optional().describe('Default value for the field')
    })).describe('List of fields in this model'),
    enums: z.array(z.object({
    id: z.string(),
    name: z.string(),
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
        defaultValue: z.string().optional()
      }))
    })).optional().describe('Enumeration types used by this model')
  })).describe('Array of data models'),
  enums: z.array(z.object({
    id: z.string(),
    name: z.string(),
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      defaultValue: z.string().optional()
    }))
  })).optional().describe('Global enumeration types')
});

const unifiedActionsSchema = z.object({
  actions: z.array(z.object({
    id: z.string().describe('Unique identifier for the action'),
    name: z.string().describe('Name of the action'),
    emoji: z.string().optional().describe('Single emoji that visually represents this action (e.g., ✉️ for email, 📊 for reports, 🔄 for sync)'),
    description: z.string().describe('Detailed description of what this action does and its business purpose'),
    type: z.enum(['Create', 'Update']).describe('Action type - Create for new records, Update for existing'),
    role: z.enum(['admin', 'member']).describe('Role required to execute this action'),
    dataSource: z.object({
      type: z.enum(['custom', 'database']).describe('Data source type'),
      customFunction: z.object({
        code: z.string().describe('JavaScript code for custom data fetching'),
        envVars: z.array(z.object({
          name: z.string(),
          description: z.string(),
          required: z.boolean(),
          sensitive: z.boolean()
        })).optional().describe('Environment variables needed for the custom function')
      }).optional().describe('Custom function configuration if type is custom'),
      database: z.object({
        models: z.array(z.object({
          id: z.string(),
          name: z.string(),
          fields: z.array(z.object({
            id: z.string(),
            name: z.string()
          })),
          where: z.record(z.any()).optional(),
          limit: z.number().optional()
        }))
      }).optional().describe('Database models configuration if type is database')
    }).describe('Configuration for how data is sourced'),
    execute: z.object({
      type: z.enum(['code', 'prompt']).describe('Execution type - code or AI prompt'),
      code: z.object({
        script: z.string().describe('JavaScript code to execute'),
        envVars: z.array(z.object({
          name: z.string(),
          description: z.string(),
          required: z.boolean(),
          sensitive: z.boolean()
        })).optional().describe('Environment variables needed for the script')
      }).optional().describe('Code execution configuration if type is code'),
      prompt: z.object({
        template: z.string().describe('AI prompt template'),
        model: z.string().optional().describe('AI model to use'),
        temperature: z.number().optional().describe('Temperature for AI generation'),
        maxTokens: z.number().optional().describe('Maximum tokens for AI response')
      }).nullable().optional().describe('AI prompt configuration if type is prompt')
    }).describe('Configuration for how the action is executed'),
    results: z.object({
      actionType: z.enum(['Create', 'Update']).describe('Type of action result'),
      model: z.string().describe('Target model for the results'),
      identifierIds: z.array(z.string()).optional().describe('Fields that identify existing records for updates'),
      fields: z.record(z.any()).optional().describe('Fields to set for Create actions'),
      fieldsToUpdate: z.record(z.any()).optional().describe('Fields to update for Update actions')
    }).optional().describe('Configuration for how results are processed')
  }))
});

// Change analysis schema for better AI guidance
const changeAnalysisSchema = z.object({
  userIntent: z.enum(['add', 'modify', 'delete', 'replace']).describe('What the user wants to do'),
  targetType: z.enum(['models', 'enums', 'actions', 'fields', 'system']).describe('What they want to change'),
  preserveExisting: z.boolean().describe('Whether to keep all existing items'),
  specificTargets: z.array(z.string()).describe('Specific names of items to target'),
  expectedResult: z.object({
    totalModels: z.number().describe('Expected total number of models after changes'),
    totalEnums: z.number().describe('Expected total number of enums after changes'), 
    totalActions: z.number().describe('Expected total number of actions after changes'),
    newItems: z.array(z.string()).describe('Names of new items to be added'),
    modifiedItems: z.array(z.string()).describe('Names of existing items to be modified'),
    deletedItems: z.array(z.string()).describe('Names of items to be deleted')
  }).describe('Expected outcome after changes')
});

// Enhanced schema for deletion operations
const deletionOperationsSchema = z.object({
  modelsToDelete: z.array(z.string()).describe('IDs or names of models to delete'),
  actionsToDelete: z.array(z.string()).describe('IDs or names of actions to delete'),
  modelFieldDeletions: z.record(z.array(z.string())).describe('Fields to delete from specific models (modelId/name -> field names)'),
  modelEnumDeletions: z.record(z.array(z.string())).describe('Enums to delete from specific models (modelId/name -> enum names)')
});

// Enhanced schema for detailed prompt understanding and feature imagination
const promptUnderstandingSchema = z.object({
  userRequestAnalysis: z.object({
    mainGoal: z.string().describe('Primary objective the user wants to achieve'),
    businessContext: z.string().describe('Business domain and context'),
    complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']).describe('Complexity level of the request'),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).describe('Perceived urgency level'),
    clarity: z.enum(['very_clear', 'clear', 'somewhat_unclear', 'unclear']).describe('How clear the requirements are')
  }),
  
  featureImagination: z.object({
    coreFeatures: z.array(z.string()).describe('Essential features required for the system'),
    additionalFeatures: z.array(z.string()).describe('Nice-to-have features that would enhance the system'),
    userExperience: z.array(z.string()).describe('Key user experience considerations'),
    businessRules: z.array(z.string()).describe('Important business rules and constraints'),
    integrations: z.array(z.string()).describe('External systems or services that need integration')
  }),
  
  dataModelingNeeds: z.object({
    requiredModels: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      estimatedFields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        purpose: z.string(),
        required: z.boolean(),
        enumValues: z.array(z.string()).optional().describe('If this field is an enum, list the possible values')
      })),
      estimatedEnums: z.array(z.object({
        name: z.string(),
        purpose: z.string(),
        estimatedValues: z.array(z.string())
      })).optional().describe('Model-specific enums that belong to this model')
    })).describe('Database models that need to be created'),
    
    relationships: z.array(z.object({
      from: z.string(),
      to: z.string(),
      type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
      purpose: z.string()
    })).describe('Relationships between models')
  }),
  
  workflowAutomationNeeds: z.object({
    requiredActions: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      triggerType: z.enum(['scheduled', 'event-driven', 'manual']),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      complexity: z.enum(['simple', 'moderate', 'complex']),
      estimatedSteps: z.array(z.string())
    })).describe('Workflow actions that need to be created'),
    
    businessProcesses: z.array(z.object({
      name: z.string(),
      description: z.string(),
      involvedModels: z.array(z.string()),
      automationPotential: z.enum(['high', 'medium', 'low'])
    })).describe('Business processes that could be automated')
  }),
  
  changeAnalysisPlan: z.array(z.object({
    changeId: z.string(),
    description: z.string(),
    type: z.enum(['create', 'update', 'delete']),
    targetType: z.enum(['models', 'actions', 'fields', 'system', 'integrations']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    dependencies: z.array(z.string()).describe('Other changes this depends on'),
    estimatedImpact: z.enum(['minimal', 'moderate', 'significant', 'major']),
    specificTargets: z.array(z.string()).describe('Specific items to be affected')
  })).describe('Detailed plan of all changes needed, broken down into manageable pieces'),
  
  implementationStrategy: z.object({
    recommendedApproach: z.enum(['incremental', 'comprehensive', 'modular', 'minimal-viable']),
    executionOrder: z.array(z.string()).describe('Order in which changes should be implemented'),
    riskAssessment: z.array(z.string()).describe('Potential risks and mitigation strategies'),
    successCriteria: z.array(z.string()).describe('How to measure success of the implementation')
  })
});

// Enhanced change analysis schema for granular change management
const granularChangeAnalysisSchema = z.object({
  changeDetails: z.object({
    operationType: z.enum(['create', 'update', 'delete', 'extend', 'modify']),
    targetScope: z.enum(['system', 'models', 'actions', 'fields', 'specific-items']),
    impactLevel: z.enum(['minimal', 'moderate', 'significant', 'breaking']),
    preservationStrategy: z.enum(['preserve-all', 'preserve-most', 'selective-preserve', 'replace-targeted'])
  }),
  
  specificChanges: z.array(z.object({
    id: z.string(),
    type: z.enum(['add-model', 'add-action', 'add-field', 'modify-model', 'modify-action', 'modify-field', 'delete-model', 'delete-action', 'delete-field']),
    target: z.string().describe('Name or ID of the target item'),
    parentTarget: z.string().optional().describe('Parent item if this is a nested change (e.g., model name for field changes)'),
    details: z.object({
      currentValue: z.string().optional().describe('Current value (for updates)'),
      newValue: z.string().optional().describe('New value to set'),
      reason: z.string().describe('Why this change is needed'),
      dependencies: z.array(z.string()).describe('Other changes this depends on')
    }),
    validation: z.object({
      conflictRisk: z.enum(['none', 'low', 'medium', 'high']).describe('Risk of conflicts with existing data'),
      dataLossRisk: z.enum(['none', 'low', 'medium', 'high']).describe('Risk of data loss'),
      breakingChange: z.boolean().describe('Whether this is a breaking change')
    })
  })),
  
  executionPlan: z.object({
    phases: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      changes: z.array(z.string()).describe('Change IDs to execute in this phase'),
      prerequisites: z.array(z.string()).describe('What must be completed before this phase'),
      estimatedComplexity: z.enum(['low', 'medium', 'high']),
      rollbackPlan: z.string().describe('How to rollback if this phase fails')
    })),
    
    riskMitigation: z.array(z.object({
      risk: z.string(),
      mitigation: z.string(),
      contingency: z.string()
    }))
  }),
  
  expectedOutcome: z.object({
    totalModels: z.number(),
    totalActions: z.number(),
    newItems: z.array(z.string()),
    modifiedItems: z.array(z.string()),
    deletedItems: z.array(z.string()),
    preservedItems: z.array(z.string())
  })
});

// Updated Action interface for one-time triggers
export interface AgentAction {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: DatabaseModel[];
    };
  };
  execute: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: EnvVar[];
    };
    prompt?: {
      template: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
}

// Shared utility functions
export function generateNewId(type: string, existingEntities: any[]): string {
  const prefixMap: Record<string, string> = {
    'model': 'mdl',
    'field': 'fld',
    'enum': 'enm',
    'enumField': 'enf',
    'action': 'act'
  };
  
  const prefix = prefixMap[type] || type.charAt(0);
  
  // Find the highest existing ID number
  const highestId = existingEntities.reduce((max, entity) => {
    if (entity.id?.startsWith(prefix)) {
      const idNumber = Number.parseInt(entity.id.slice(prefix.length), 10);
      return Number.isNaN(idNumber) ? max : Math.max(max, idNumber);
    }
    return max;
  }, 0);
  
  // Return the next ID in sequence
  return `${prefix}${highestId + 1}`;
}

export function analyzeConversationContext(messages: Message[]): string {
  const conversationContext = messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => {
      if (typeof msg.content === 'string') {
        return `${msg.role}: ${msg.content}`;
      } else {
        return `${msg.role}: [complex content]`;
      }
    })
    .slice(-10) // Last 10 messages for context
    .join('\n');

  return conversationContext;
}

export function createAgentData(
  name: string,
  description: string,
  domain: string,
  models: AgentModel[] = [],
  enums: AgentEnum[] = [],
  actions: AgentAction[] = [],
  metadata?: any
): AgentData {
  return {
    name,
    description,
    domain,
    models,
    enums,
    actions,
    schedules: [],
    createdAt: new Date().toISOString(),
    metadata
  };
}

// Helper function to perform deep content comparison and intelligent merging
async function intelligentDocumentUpdate(
  documentId: string,
  newTitle: string,
  newContent: string,
  session?: Session | null,
  deletionOperations?: any
): Promise<boolean> {
  if (!session?.user?.id) {
    console.log('❌ No session, skipping intelligent update');
    return false;
  }

  try {
    // Get current document
    const existingDoc = await getDocumentById({ id: documentId });
    
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
    // Fallback to simple update
    await saveOrUpdateDocument({
      id: documentId,
      title: newTitle,
      kind: 'agent',
      content: newContent,
      userId: session.user.id
    });
    return true;
  }
}

// Deep merge function that intelligently combines existing and new data
function performDeepMerge(existing: AgentData, incoming: AgentData, deletionOperations?: any): AgentData {
  console.log('🔍 Performing deep merge analysis...');
  
  // Start with existing data as base
  const merged: AgentData = {
    ...existing,
    // Update top-level properties only if they're different and meaningful
    name: incoming.name && incoming.name !== existing.name ? incoming.name : existing.name,
    description: incoming.description && incoming.description !== existing.description ? incoming.description : existing.description,
    domain: incoming.domain && incoming.domain !== existing.domain ? incoming.domain : existing.domain,
    // Keep original creation date
    createdAt: existing.createdAt || incoming.createdAt || new Date().toISOString(),
    // Merge metadata intelligently
    metadata: {
      ...(existing.metadata || {}),
      ...(incoming.metadata || {}),
      // Preserve comprehensive analysis from latest update
      promptUnderstanding: incoming.metadata?.promptUnderstanding || existing.metadata?.promptUnderstanding,
      granularChanges: incoming.metadata?.granularChanges || existing.metadata?.granularChanges,
      aiDecision: incoming.metadata?.aiDecision || existing.metadata?.aiDecision,
      changeAnalysis: incoming.metadata?.changeAnalysis || existing.metadata?.changeAnalysis,
      lastUpdateReason: incoming.metadata?.lastUpdateReason || existing.metadata?.lastUpdateReason,
      lastUpdateTimestamp: incoming.metadata?.lastUpdateTimestamp || new Date().toISOString(),
      comprehensiveAnalysisUsed: incoming.metadata?.comprehensiveAnalysisUsed || existing.metadata?.comprehensiveAnalysisUsed,
      operationType: incoming.metadata?.operationType || existing.metadata?.operationType
    }
  };

  // Apply deletion operations before merging
  if (deletionOperations) {
    merged.models = performDeletionOperations(merged.models || [], deletionOperations.modelsToDelete, deletionOperations.modelFieldDeletions);
    merged.actions = performDeletionOperations(merged.actions || [], deletionOperations.actionsToDelete);
  }

  // Ensure arrays are properly initialized and valid before merging
  const safeExistingModels = Array.isArray(merged.models) ? merged.models : [];
  const safeIncomingModels = Array.isArray(incoming.models) ? incoming.models : [];
  const safeExistingActions = Array.isArray(merged.actions) ? merged.actions : [];
  const safeIncomingActions = Array.isArray(incoming.actions) ? incoming.actions : [];
  const safeExistingSchedules = Array.isArray(merged.schedules) ? merged.schedules : [];
  const safeIncomingSchedules = Array.isArray(incoming.schedules) ? incoming.schedules : [];

  // Intelligent array merging for models
  merged.models = mergeModelsIntelligently(safeExistingModels, safeIncomingModels);
  
  // Intelligent array merging for actions
  merged.actions = mergeActionsIntelligently(safeExistingActions, safeIncomingActions);
  
  // Intelligent array merging for schedules
  merged.schedules = mergeSchedulesIntelligently(safeExistingSchedules, safeIncomingSchedules);
  
  console.log('📊 Deep merge completed with comprehensive metadata preservation');
  
  return merged;
}

// Intelligent merging for models with proper ID preservation
function mergeModelsIntelligently(existing: AgentModel[], incoming: AgentModel[]): AgentModel[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    console.warn('⚠️ mergeModelsIntelligently: existing is not an array, using empty array');
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    console.warn('⚠️ mergeModelsIntelligently: incoming is not an array, using empty array');
    incoming = [];
  }

  console.log(`🔄 Merging ${existing.length} existing models with ${incoming.length} incoming models`);
  
  const mergedModels: AgentModel[] = [...existing];
  
  for (const incomingModel of incoming) {
    const existingIndex = mergedModels.findIndex(e => 
      e.id === incomingModel.id || 
      e.name.toLowerCase() === incomingModel.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Merge existing model with incoming changes, preserving ID
      const existingModel = mergedModels[existingIndex];
      console.log(`🔄 Merging model: ${incomingModel.name}`);
      
      mergedModels[existingIndex] = {
        ...existingModel,
        ...incomingModel,
        // Always preserve existing ID
        id: existingModel.id,
        fields: mergeFieldsIntelligently(existingModel.fields || [], incomingModel.fields || []),
        enums: mergeEnumsIntelligently(existingModel.enums || [], incomingModel.enums || [])
      };
    } else {
      // Add new model
      console.log(`➕ Adding new model: ${incomingModel.name}`);
      mergedModels.push(incomingModel);
    }
  }
  
  console.log(`✅ Model merging complete: ${mergedModels.length} total models`);
  return mergedModels;
}

// Intelligent merging for model enums (model-specific enums)
function mergeEnumsIntelligently(existing: AgentEnum[], incoming: AgentEnum[]): AgentEnum[] {
  const merged = [...existing];
  
  for (const incomingEnum of incoming) {
    const existingIndex = merged.findIndex(e => 
      e.id === incomingEnum.id || 
      e.name.toLowerCase() === incomingEnum.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Merge existing enum with incoming changes, preserving ID
      const existingEnum = merged[existingIndex];
      merged[existingIndex] = {
        ...existingEnum,
        ...incomingEnum,
        id: existingEnum.id,
        fields: mergeEnumFieldsIntelligently(existingEnum.fields || [], incomingEnum.fields || [])
      };
    } else {
      // Add new enum
      merged.push(incomingEnum);
    }
  }
  
  return merged;
}

// Merge enum fields intelligently
function mergeEnumFieldsIntelligently(existing: AgentEnumField[], incoming: AgentEnumField[]): AgentEnumField[] {
  const merged = [...existing];
  
  for (const incomingField of incoming) {
    const existingIndex = merged.findIndex(f => 
      f.id === incomingField.id || 
      f.name.toLowerCase() === incomingField.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Merge existing enum field with incoming changes, preserving ID
      const existingField = merged[existingIndex];
      merged[existingIndex] = {
        ...existingField,
        ...incomingField,
        id: existingField.id
      };
    } else {
      // Add new enum field
      merged.push(incomingField);
    }
  }
  
  return merged;
}

// Merge individual model fields intelligently
function mergeModelFields(existing: AgentModel, incoming: AgentModel): AgentModel {
  const merged: AgentModel = {
    ...existing,
    // Update basic properties if they've changed
    name: incoming.name || existing.name,
    idField: incoming.idField || existing.idField,
    displayFields: incoming.displayFields && incoming.displayFields.length > 0 ? incoming.displayFields : existing.displayFields
  };
  
  // Intelligent field merging
  merged.fields = mergeFieldsIntelligently(existing.fields || [], incoming.fields || []);
  
  return merged;
}

// Merge fields within a model
function mergeFieldsIntelligently(existing: AgentField[], incoming: AgentField[]): AgentField[] {
  const merged = [...existing];
  const existingIds = new Set(existing.map(f => f.id));
  const existingNames = new Set(existing.map(f => f.name));
  
  for (const incomingField of incoming) {
    const existingById = existing.find(f => f.id === incomingField.id);
    const existingByName = existing.find(f => f.name === incomingField.name);
    
    if (existingById) {
      // Update existing field by ID
      const index = merged.findIndex(f => f.id === incomingField.id);
      merged[index] = { ...existingById, ...incomingField };
      
    } else if (existingByName && !incomingField.id) {
      // Update existing field by name
      const index = merged.findIndex(f => f.name === incomingField.name);
      merged[index] = { ...existingByName, ...incomingField, id: existingByName.id };
      
    } else if (!existingIds.has(incomingField.id) && !existingNames.has(incomingField.name)) {
      // Add new field
      const newField = { ...incomingField };
      if (!newField.id) {
        newField.id = generateNewId('field', merged);
      }
      merged.push(newField);
    }
  }
  
  return merged;
}

// Intelligent action merging  
function mergeActionsIntelligently(existing: AgentAction[], incoming: AgentAction[]): AgentAction[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    console.warn('⚠️ mergeActionsIntelligently: existing is not an array, using empty array');
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    console.warn('⚠️ mergeActionsIntelligently: incoming is not an array, using empty array');
    incoming = [];
  }

  console.log(`🔄 Merging ${existing.length} existing actions with ${incoming.length} incoming actions`);
  
  const mergedActions: AgentAction[] = [...existing];
  
  for (const incomingAction of incoming) {
    const existingIndex = mergedActions.findIndex(e => e.id === incomingAction.id);
    
    if (existingIndex >= 0) {
      // Merge existing action with new data
      mergedActions[existingIndex] = mergeActionDetails(mergedActions[existingIndex], incomingAction);
    } else {
      // Add new action
      mergedActions.push(incomingAction);
    }
  }
  
  return mergedActions;
}

// Merge action details intelligently
function mergeActionDetails(existing: AgentAction, incoming: AgentAction): AgentAction {
  return {
    ...existing,
    ...incoming,
    // Preserve ID
    id: existing.id,
    // Intelligent merging of complex properties
    dataSource: {
      ...existing.dataSource,
      ...incoming.dataSource,
      // Merge database models if both exist
      database: incoming.dataSource?.database || existing.dataSource?.database ? {
        models: [
          ...(existing.dataSource?.database?.models || []),
          ...(incoming.dataSource?.database?.models || [])
        ].filter((model, index, self) => 
          index === self.findIndex(m => m.id === model.id || m.name === model.name)
        )
      } : undefined
    },
    execute: {
      ...existing.execute,
      ...incoming.execute
    },
    results: {
      ...existing.results,
      ...incoming.results
    }
  };
}

// Deep equality check
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

// Log content changes for debugging
function logContentChanges(existing: AgentData, merged: AgentData): void {
  console.log('📋 Content Changes Summary:');
  
  // Check top-level changes
  if (existing.name !== merged.name) {
    console.log(`  🏷️  Name: "${existing.name}" → "${merged.name}"`);
  }
  if (existing.description !== merged.description) {
    console.log(`  📝 Description: "${existing.description}" → "${merged.description}"`);
  }
  if (existing.domain !== merged.domain) {
    console.log(`  🌐 Domain: "${existing.domain}" → "${merged.domain}"`);
  }
  
  // Check array length changes with proper null/undefined checks
  const existingModels = existing.models || [];
  const mergedModels = merged.models || [];
  const existingActions = existing.actions || [];
  const mergedActions = merged.actions || [];
  
  const modelDiff = mergedModels.length - existingModels.length;
  const actionDiff = mergedActions.length - existingActions.length;
  
  if (modelDiff !== 0) {
    console.log(`  📊 Models: ${existingModels.length} → ${mergedModels.length} (${modelDiff > 0 ? '+' : ''}${modelDiff})`);
  }
  if (actionDiff !== 0) {
    console.log(`  ⚡ Actions: ${existingActions.length} → ${mergedActions.length} (${actionDiff > 0 ? '+' : ''}${actionDiff})`);
  }
}

// Update the saveDocumentWithContent function to use intelligent updating
async function saveDocumentWithContent(
  documentId: string,
  title: string,
  content: string,
  session?: Session | null,
  deletionOperations?: any
) {
  if (session?.user?.id) {
    try {
      const wasUpdated = await intelligentDocumentUpdate(documentId, title, content, session, deletionOperations);
      if (wasUpdated) {
        console.log(`💾 Agent document intelligently updated: ${documentId} - ${title}`);
      } else {
        console.log(`✅ Agent document unchanged: ${documentId} - ${title}`);
      }
    } catch (error) {
      console.error('❌ Failed to save agent document:', error);
    }
  }
}

// Helper function to merge and deduplicate arrays of objects by ID
function mergeArraysByKey<T extends { id: string }>(existing: T[], newItems: T[], keyField: keyof T = 'id'): T[] {
  const merged = [...existing];
  const existingIds = new Set(existing.map(item => item[keyField]));
  
  for (const newItem of newItems) {
    if (!existingIds.has(newItem[keyField])) {
      merged.push(newItem);
    } else {
      // Update existing item
      const existingIndex = merged.findIndex(item => item[keyField] === newItem[keyField]);
      if (existingIndex >= 0) {
        merged[existingIndex] = newItem;
      }
    }
  }
  
  return merged;
}

// Helper function to ensure all actions have IDs
function ensureActionsHaveIds(actions: any[], existingActions: AgentAction[] = []): AgentAction[] {
  const result: AgentAction[] = [];
  
  for (const action of actions) {
    if (!action.id) {
      // Generate a new ID for this action
      const allExistingActions = [...existingActions, ...result];
      action.id = generateNewId('action', allExistingActions);
      console.log(`🆔 Generated ID ${action.id} for action: ${action.name}`);
    }
    result.push(action as AgentAction);
  }
  
  return result;
}

// Helper function to ensure all existing data is preserved
function ensureDataIntegrity(
  aiResult: any,
  existingAgent: AgentData | null,
  resultType: 'database' | 'actions'
): any {
  if (!existingAgent) {
    // Even for new agents, ensure actions have IDs
    if (resultType === 'actions' && aiResult.actions) {
      return {
        actions: ensureActionsHaveIds(aiResult.actions)
      };
    }
    return aiResult;
  }

  if (resultType === 'database') {
    const existingModels = existingAgent.models || [];
    const existingEnums = existingAgent.enums || [];
    const aiModels = aiResult.models || [];
    const aiEnums = aiResult.enums || [];

    // Always start with existing data and merge new items
    const mergedModels = mergeArraysByKey(existingModels, aiModels);
    const mergedEnums = mergeArraysByKey(existingEnums, aiEnums);

    // Log what happened
    console.log(`🔧 Database merge: ${existingModels.length} existing + ${aiModels.length} AI = ${mergedModels.length} total models`);
    console.log(`🔧 Database merge: ${existingEnums.length} existing + ${aiEnums.length} AI = ${mergedEnums.length} total enums`);
      
      return {
      models: mergedModels,
      enums: mergedEnums
    };
  }

  if (resultType === 'actions') {
    const existingActions = existingAgent.actions || [];
    const aiActions = aiResult.actions || [];

    // Ensure AI actions have IDs
    const aiActionsWithIds = ensureActionsHaveIds(aiActions, existingActions);

    // Use ID-based merging for actions (same as models/enums)
    const mergedActions = mergeArraysByKey(existingActions, aiActionsWithIds);

    // Log what happened
    console.log(`🔧 Actions merge: ${existingActions.length} existing + ${aiActionsWithIds.length} AI = ${mergedActions.length} total actions`);
    console.log('🔧 Actions merge details:');
    console.log('  - Existing action IDs:', existingActions.map((a: AgentAction) => `${a.id}:${a.name}`));
    console.log('  - AI action IDs:', aiActionsWithIds.map((a: AgentAction) => `${a.id}:${a.name}`));
    console.log('  - Final action IDs:', mergedActions.map((a: AgentAction) => `${a.id}:${a.name}`));
      
      return {
      actions: mergedActions
    };
  }

  return aiResult;
}

// Helper function to migrate existing actions that might not have IDs
function migrateActionsWithIds(existingAgent: AgentData): AgentData {
  if (!existingAgent.actions) return existingAgent;
  
  let hasChanges = false;
  const migratedActions = existingAgent.actions.map((action, index) => {
    if (!action.id) {
      hasChanges = true;
      const newId = `act${index + 1}`;
      console.log(`🔄 Migrating action "${action.name}" to ID: ${newId}`);
      return { ...action, id: newId };
    }
    return action;
  });
  
  if (hasChanges) {
    console.log(`🔄 Migrated ${migratedActions.length} actions to have IDs`);
    return { ...existingAgent, actions: migratedActions };
  }
  
  return existingAgent;
}

// Deletion operations function
function performDeletionOperations(items: any[], itemsToDelete: string[] = [], fieldDeletions: Record<string, string[]> = {}): any[] {
  if (!itemsToDelete && !fieldDeletions) return items;

  console.log('🗑️ Performing deletion operations...');
  
  let result = [...items];
  
  // Delete entire items
  if (itemsToDelete && itemsToDelete.length > 0) {
    const itemsBeforeCount = result.length;
    result = result.filter(item => {
      const shouldDelete = itemsToDelete.some(deleteId => 
        item.id === deleteId || 
        item.name?.toLowerCase() === deleteId.toLowerCase()
      );
      
      if (shouldDelete) {
        console.log(`🗑️ Deleted item: ${item.name || item.id}`);
      }
      
      return !shouldDelete;
    });
    console.log(`🗑️ Deleted ${itemsBeforeCount - result.length} items`);
  }
  
  // Delete specific fields from items
  if (fieldDeletions && Object.keys(fieldDeletions).length > 0) {
    result = result.map(item => {
      const fieldsToDelete = fieldDeletions[item.id] || fieldDeletions[item.name?.toLowerCase()];
      
      if (fieldsToDelete && fieldsToDelete.length > 0) {
        const updatedItem = { ...item };
        
        if (updatedItem.fields && Array.isArray(updatedItem.fields)) {
          const fieldsBeforeCount = updatedItem.fields.length;
          updatedItem.fields = updatedItem.fields.filter((field: any) => {
            const shouldDelete = fieldsToDelete.some(deleteField => 
              field.id === deleteField || 
              field.name?.toLowerCase() === deleteField.toLowerCase()
            );
            
            if (shouldDelete) {
              console.log(`🗑️ Deleted field: ${field.name || field.id} from ${item.name}`);
            }
            
            return !shouldDelete;
          });
          console.log(`🗑️ Deleted ${fieldsBeforeCount - updatedItem.fields.length} fields from ${item.name}`);
        }

        // Handle enum deletions for models
        if (updatedItem.enums && Array.isArray(updatedItem.enums)) {
          const enumsBeforeCount = updatedItem.enums.length;
          updatedItem.enums = updatedItem.enums.filter((enumItem: any) => {
            // Safety check: ensure enumValueDeletions exists and is an array
            if (!fieldDeletions.enumValueDeletions || !Array.isArray(fieldDeletions.enumValueDeletions)) {
              return true; // Keep all enums if no deletions specified
            }
            
            const shouldDelete = fieldDeletions.enumValueDeletions.some((deletion: any) => 
              deletion.enumId === enumItem.id
            );
            
            if (shouldDelete) {
              return false; // Delete this enum
            }
            
            return true; // Keep this enum
          });
          console.log(`🗑️ Deleted ${enumsBeforeCount - updatedItem.enums.length} enums from ${item.name}`);
        }
        
        return updatedItem;
      }
      
      return item;
    });
  }
  
  return result;
}

function mergeSchedulesIntelligently(existing: AgentSchedule[], incoming: AgentSchedule[]): AgentSchedule[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    console.warn('⚠️ mergeSchedulesIntelligently: existing is not an array, using empty array');
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    console.warn('⚠️ mergeSchedulesIntelligently: incoming is not an array, using empty array');
    incoming = [];
  }

  console.log(`🔄 Merging ${existing.length} existing schedules with ${incoming.length} incoming schedules`);
  
  const mergedSchedules: AgentSchedule[] = [...existing];
  
  for (const incomingSchedule of incoming) {
    const existingIndex = mergedSchedules.findIndex(e => e.id === incomingSchedule.id);
    
    if (existingIndex >= 0) {
      // Merge existing schedule with new data
      mergedSchedules[existingIndex] = {
        ...mergedSchedules[existingIndex],
        ...incomingSchedule,
        // Preserve creation metadata if it exists
        id: mergedSchedules[existingIndex].id, // Always keep existing ID
      };
    } else {
      // Add new schedule
      mergedSchedules.push(incomingSchedule);
    }
  }
  
  return mergedSchedules;
}

function cleanNullValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanNullValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanNullValues(value);
      if (cleanedValue !== undefined && cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return obj;
}

function ensureRequiredActionFields(action: any): any {
  // Ensure the action has all required fields with defaults
  if (!action.results || typeof action.results !== 'object') {
    action.results = {
      actionType: action.type || 'Create',
      model: action.results?.model || 'Unknown',
      ...(action.results || {})
    };
  }
  
  // Ensure results has required fields
  if (!action.results.actionType) {
    action.results.actionType = action.type || 'Create';
  }
  
  if (!action.results.model) {
    action.results.model = 'Unknown';
  }
  
  return action;
}

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
              console.log('  - models:', existingAgent.models.map(m => m.name));
              console.log('  - actions:', existingAgent.actions.map(a => `${a.id}:${a.name}`));
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

      // Step 0: Comprehensive Prompt Understanding & Feature Imagination
      console.log('🧠 Step 0: Comprehensive Prompt Understanding & Feature Imagination');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'prompt-understanding', 
          status: 'processing',
          message: 'Analyzing user request in detail and imagining features...'
        })
      });

      await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
        status: 'understanding',
        step: 'prompt-understanding',
        message: 'Analyzing user request in detail and imagining features...'
      }, null, 2), session);

      const promptUnderstanding = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: promptUnderstandingSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a senior business analyst and system architect who excels at understanding user requests and imagining comprehensive feature sets.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"
OPERATION: ${currentOperation}

EXISTING SYSTEM: ${existingAgent ? JSON.stringify({
  name: existingAgent.name,
  description: existingAgent.description,
  domain: existingAgent.domain,
  models: existingAgent.models.map(m => ({ name: m.name, enumCount: m.enums?.length || 0 })),
  actions: existingAgent.actions.map(a => ({ name: a.name, type: a.type }))
}, null, 2) : 'None - creating from scratch'}

Your task is to deeply understand what the user wants and imagine a comprehensive feature set:

1. ANALYZE THE REQUEST:
   - What is the user's main goal?
   - What business domain are they working in?
   - How complex is this request?
   - How clear are their requirements?

2. IMAGINE FEATURES:
   - What core features are absolutely essential?
   - What additional features would make this system great?
   - What user experience considerations are important?
   - What business rules need to be enforced?
   - What integrations might be needed?

3. DATA MODELING NEEDS:
   - What entities/models will be needed? Be specific about estimated fields
   - What enumerations will be needed? Think about status types, categories, etc.
   - What relationships exist between entities?

4. WORKFLOW AUTOMATION NEEDS:
   - What business processes could be automated?
   - What scheduled tasks are needed?
   - What event-driven actions make sense?

5. CHANGE ANALYSIS PLAN:
   - Break down the work into specific, manageable changes
   - Identify dependencies between changes
   - Assess the impact and priority of each change
   - Think about what could go wrong and how to mitigate risks

6. IMPLEMENTATION STRATEGY:
   - What's the best approach: incremental, comprehensive, etc.?
   - What order should changes be implemented in?
   - What are the success criteria?

${existingAgent ? `
CONTEXT FOR EXISTING SYSTEM:
Since this is a ${currentOperation} operation on an existing system, consider:
- How to build upon existing foundation: ${existingAgent.models.map(m => m.name).join(', ')}
- What existing workflows already exist: ${existingAgent.actions.map(a => a.name).join(', ')}
- How to maintain compatibility while adding new capabilities
- What data migration or transformation might be needed
` : ''}

Be thorough, imaginative, and practical. Think like a product manager planning a comprehensive system.`
          }
        ],
        temperature: 0.4,
      });

      console.log('🎯 Prompt Understanding Complete:', JSON.stringify(promptUnderstanding.object, null, 2));
      
      dataStream.writeData({
        type: 'agent-step', 
        content: JSON.stringify({ 
          step: 'prompt-understanding', 
          status: 'complete', 
          data: promptUnderstanding.object,
          message: `Analysis complete: ${promptUnderstanding.object.userRequestAnalysis.complexity} ${promptUnderstanding.object.userRequestAnalysis.businessContext} system with ${promptUnderstanding.object.dataModelingNeeds.requiredModels.length} models and ${promptUnderstanding.object.workflowAutomationNeeds.requiredActions.length} actions planned`
        })
      });

      await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
        status: 'planning',
        step: 'prompt-understanding',
        promptUnderstanding: promptUnderstanding.object
      }, null, 2), session);

      // Step 0.5: Granular Change Analysis (if needed)
      let granularChanges: any = null;
      if (promptUnderstanding.object.changeAnalysisPlan.length > 0) {
        console.log('🔍 Step 0.5: Granular Change Analysis');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'granular-analysis', 
            status: 'processing',
            message: `Breaking down ${promptUnderstanding.object.changeAnalysisPlan.length} changes into detailed execution plan...`
          })
        });

        granularChanges = await generateObject({
          model: myProvider.languageModel('artifact-model'),
          schema: granularChangeAnalysisSchema,
          messages: [
            {
              role: 'system' as const,
              content: `You are a technical project manager creating detailed implementation plans.

PROMPT UNDERSTANDING RESULTS:
${JSON.stringify(promptUnderstanding.object, null, 2)}

EXISTING SYSTEM: ${existingAgent ? JSON.stringify({
  models: existingAgent.models.map(m => ({ id: m.id, name: m.name, fields: m.fields.map(f => ({ id: f.id, name: f.name, type: f.type })) })),
  enums: existingAgent.enums.map(e => ({ id: e.id, name: e.name, fields: e.fields.map(f => ({ id: f.id, name: f.name })) })),
  actions: existingAgent.actions.map(a => ({ id: a.id, name: a.name, type: a.type }))
}, null, 2) : 'None'}

Create a detailed execution plan that breaks down each change into specific operations:

1. ANALYZE EACH CHANGE from the change analysis plan
2. CREATE SPECIFIC OPERATIONS for each change (add-model, modify-field, etc.)
3. IDENTIFY DEPENDENCIES between operations
4. ASSESS RISKS for each operation
5. CREATE EXECUTION PHASES that group related operations
6. PLAN RISK MITIGATION strategies

For each specific change:
- Be granular: "add User model" becomes "add-model: User" with specific field operations
- Include field-level changes: "add email field to User" becomes "add-field: email in User model"
- Consider data types, relationships, and constraints
- Think about validation and potential conflicts

For execution planning:
- Group related changes into logical phases
- Ensure dependencies are satisfied before dependent operations
- Consider rollback strategies for each phase
- Identify critical path and potential bottlenecks

${existingAgent ? `
PRESERVATION STRATEGY:
- Identify exactly what existing data must be preserved
- Plan how to safely modify existing structures
- Consider backward compatibility requirements
- Plan data migration if needed
` : ''}

Be thorough and consider edge cases. This plan will guide the actual implementation.`
            }
          ],
          temperature: 0.2,
        });

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
          promptUnderstanding: promptUnderstanding.object,
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
        promptUnderstanding: promptUnderstanding.object,
        granularChanges: granularChanges?.object
      }, null, 2), session);

      const decision = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: decisionSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are an AI system architect that analyzes user requests to determine the optimal development approach.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"

COMPREHENSIVE ANALYSIS RESULTS:
${JSON.stringify(promptUnderstanding.object, null, 2)}

${granularChanges ? `
GRANULAR CHANGE PLAN:
${JSON.stringify(granularChanges.object, null, 2)}
` : ''}

EXISTING SYSTEM: ${existingAgent ? JSON.stringify({
  name: existingAgent.name,
  description: existingAgent.description,
  domain: existingAgent.domain,
  models: existingAgent.models.map(m => m.name),
  enums: existingAgent.enums.map(e => e.name),
  actions: existingAgent.actions.map(a => a.name)
}, null, 2) : 'None'}

Based on the comprehensive analysis above, determine the technical approach:

1. ANALYSIS REASONING: Synthesize the prompt understanding into technical requirements
2. SCOPE DETERMINATION:
   - needsFullAgent: Based on the required models (${promptUnderstanding.object.dataModelingNeeds.requiredModels.length}) and actions (${promptUnderstanding.object.workflowAutomationNeeds.requiredActions.length})
   - needsDatabase: Based on the ${promptUnderstanding.object.dataModelingNeeds.requiredModels.length} required models
   - needsActions: Based on the ${promptUnderstanding.object.workflowAutomationNeeds.requiredActions.length} required actions
3. OPERATION TYPE: ${currentOperation} (based on existing system presence)
4. PRIORITY: Based on dependencies and implementation strategy from analysis
5. SPECIFIC WORK: Reference the detailed plans already created

The prompt understanding has already done the heavy lifting - now translate that into technical execution decisions.`
          }
        ],
        temperature: 0.3,
      });

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

      await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
        status: 'planning',
        step: 'analysis',
        decision: decision.object,
        existingAgent: existingAgent
      }, null, 2), session);

      // Initialize results
      let finalAgent: AgentData;
      let agentOverview: any = null;
      let databaseResults: any = null;
      let actionsResults: any = null;
      let deletionOperations: any = null;

      // Step 1.5: Change Analysis (for existing systems)
      let changeAnalysis: any = null;
      if (existingAgent && (currentOperation === 'extend' || currentOperation === 'update')) {
        // Use granular changes if available, otherwise fall back to simpler analysis
        if (granularChanges) {
          console.log('🔍 Step 1.5: Using Granular Change Analysis');
          changeAnalysis = {
            object: {
              userIntent: granularChanges.object.changeDetails.operationType,
              targetType: granularChanges.object.changeDetails.targetScope,
              preserveExisting: granularChanges.object.changeDetails.preservationStrategy !== 'replace-targeted',
              specificTargets: granularChanges.object.specificChanges.map((c: any) => c.target),
              expectedResult: granularChanges.object.expectedOutcome
            }
          };
          
          // Use existing deletion operations logic if there are delete operations
          const deleteOperations = granularChanges.object.specificChanges.filter((c: any) => 
            c.type.startsWith('delete-')
          );
          
          if (deleteOperations.length > 0) {
            console.log('🗑️ Generating deletion operations from granular analysis...');
            
            const deletionOperationsResult = await generateObject({
              model: myProvider.languageModel('artifact-model'),
              schema: deletionOperationsSchema,
              messages: [
                {
                  role: 'system' as const,
                  content: `Generate specific deletion operations based on the granular change analysis.

USER REQUEST: "${command}"
GRANULAR CHANGES: ${JSON.stringify(granularChanges.object, null, 2)}

EXISTING SYSTEM:
- Models: ${existingAgent.models.map(m => `${m.name} (${m.id})`).join(', ')}
- Enums: ${existingAgent.enums.map(e => `${e.name} (${e.id})`).join(', ')}
- Actions: ${existingAgent.actions.map(a => `${a.name} (${a.id})`).join(', ')}

DELETE OPERATIONS TO PROCESS:
${deleteOperations.map((op: any) => `- ${op.type}: ${op.target}${op.parentTarget ? ` (in ${op.parentTarget})` : ''} - ${op.details.reason}`).join('\n')}

Generate deletion operations for items that should be removed:
- Use exact names or IDs from the existing system
- Process each delete operation from the granular analysis
- Be conservative - only delete what is specifically identified`
                }
              ],
              temperature: 0.1,
            });

            deletionOperations = deletionOperationsResult.object;
            console.log('🗑️ Deletion operations:', JSON.stringify(deletionOperations, null, 2));
          }
          
          dataStream.writeData({
            type: 'agent-step', 
            content: JSON.stringify({ 
              step: 'change-analysis', 
              status: 'complete', 
              data: changeAnalysis.object,
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

          changeAnalysis = await generateObject({
            model: myProvider.languageModel('artifact-model'),
            schema: changeAnalysisSchema,
            messages: [
              {
                role: 'system' as const,
                content: `You are a change analyst determining exactly what modifications should be made to an existing system.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"
OPERATION: ${currentOperation}

PROMPT UNDERSTANDING CONTEXT:
${promptUnderstanding ? JSON.stringify(promptUnderstanding.object, null, 2) : 'Not available'}

EXISTING SYSTEM:
- Name: ${existingAgent.name}
- Models: ${existingAgent.models.map(m => m.name).join(', ')} (${existingAgent.models.length} total)
- Enums: ${existingAgent.enums.map(e => e.name).join(', ')} (${existingAgent.enums.length} total)
- Actions: ${existingAgent.actions.map(a => a.name).join(', ')} (${existingAgent.actions.length} total)

Your task is to analyze EXACTLY what the user wants to change, leveraging the prompt understanding results above.

${promptUnderstanding ? `
REFERENCE THE DETAILED ANALYSIS:
- Required Models: ${promptUnderstanding.object.dataModelingNeeds.requiredModels.map((m: any) => m.name).join(', ')}
- Required Actions: ${promptUnderstanding.object.workflowAutomationNeeds.requiredActions.map((a: any) => a.name).join(', ')}
- Change Plan: ${promptUnderstanding.object.changeAnalysisPlan.length} changes identified
` : ''}

Follow the same analysis patterns as before, but use the prompt understanding to inform your decisions.`
              }
            ],
            temperature: 0.1,
          });

          console.log('🎯 Change Analysis:', JSON.stringify(changeAnalysis.object, null, 2));
          
          dataStream.writeData({
            type: 'agent-step', 
            content: JSON.stringify({ 
              step: 'change-analysis', 
              status: 'complete', 
              data: changeAnalysis.object,
              message: `Change analysis complete: ${changeAnalysis.object.userIntent} ${changeAnalysis.object.specificTargets.join(', ')} - preserving ${changeAnalysis.object.preserveExisting ? 'all' : 'some'} existing data`
            })
          });

          // Generate deletion operations if needed
          if (changeAnalysis.object.userIntent === 'delete' || changeAnalysis.object.expectedResult.deletedItems.length > 0) {
            console.log('🗑️ Generating deletion operations...');
            
            const deletionOperationsResult = await generateObject({
              model: myProvider.languageModel('artifact-model'),
              schema: deletionOperationsSchema,
              messages: [
                {
                  role: 'system' as const,
                  content: `Generate specific deletion operations based on the change analysis.

USER REQUEST: "${command}"
CHANGE ANALYSIS: ${JSON.stringify(changeAnalysis.object, null, 2)}

EXISTING SYSTEM:
- Models: ${existingAgent.models.map(m => `${m.name} (${m.id})`).join(', ')}
- Enums: ${existingAgent.enums.map(e => `${e.name} (${e.id})`).join(', ')}
- Actions: ${existingAgent.actions.map(a => `${a.name} (${a.id})`).join(', ')}

Generate deletion operations for items that should be removed:
- Use exact names or IDs from the existing system
- Only delete what the user specifically requested
- Be conservative - when in doubt, don't delete`
                }
              ],
              temperature: 0.1,
            });

            deletionOperations = deletionOperationsResult.object;
            console.log('🗑️ Deletion operations:', JSON.stringify(deletionOperations, null, 2));
          }
        }
      }

      // Step 2: Execute based on AI decision
      if (decision.object.needsFullAgent || decision.object.priority === 'agent-first') {
        // Generate agent overview first
        console.log('🏗️ Step 2a: System Architecture Overview');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'overview', 
            status: 'processing',
            message: decision.object.scope.agentWork || 'Creating system architecture overview...'
          })
        });

        await saveDocumentWithContent(documentId, isUpdatingExisting ? 'Updating Agent System' : 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'overview',
          decision: decision.object,
          message: 'Creating system architecture overview...'
        }, null, 2), session);

        agentOverview = await generateObject({
          model: myProvider.languageModel('artifact-model'),
          schema: unifiedAgentSchema,
          messages: [
            {
              role: 'system' as const,
              content: `You are a senior system architect creating comprehensive system overviews.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"
AI ANALYSIS: ${decision.object.analysisReasoning}
OPERATION: ${currentOperation}

EXISTING SYSTEM: ${existingAgent ? JSON.stringify({
  name: existingAgent.name,
  description: existingAgent.description,
  domain: existingAgent.domain,
  models: existingAgent.models.map(m => m.name),
  enums: existingAgent.enums.map(e => e.name),
  actions: existingAgent.actions.map(a => a.name)
}, null, 2) : 'None'}

${existingAgent && currentOperation !== 'create' ? `
IMPORTANT: This is a ${currentOperation} operation. You must:
1. PRESERVE the existing system name, description, and domain unless specifically requested to change them
2. Build upon the existing foundation
3. Focus on the new requirements while maintaining existing functionality
4. Ensure compatibility with existing models: ${existingAgent.models.map(m => m.name).join(', ')}
5. Ensure compatibility with existing actions: ${existingAgent.actions.map(a => a.name).join(', ')}
` : ''}

Create a comprehensive system overview that serves as the foundation for ${decision.object.needsDatabase ? 'database design' : ''} ${decision.object.needsDatabase && decision.object.needsActions ? 'and' : ''} ${decision.object.needsActions ? 'workflow automation' : ''}.

Your overview should be ${currentOperation === 'create' ? 'a complete new system design' : `an ${currentOperation} plan that enhances the existing system`}.`
            }
          ],
          temperature: 0.2,
        });

        dataStream.writeData({
          type: 'agent-step', 
          content: JSON.stringify({ 
            step: 'overview', 
            status: 'complete', 
            data: agentOverview.object,
            message: `System overview complete: ${agentOverview.object.name}`
          })
        });

        await saveDocumentWithContent(documentId, agentOverview.object.name, JSON.stringify({
          status: 'processing',
          step: 'overview',
          overview: agentOverview.object,
          decision: decision.object
        }, null, 2), session);
      }

      // Step 3: Database Generation (if needed)
      if (decision.object.needsDatabase) {
        console.log('🗄️ Step 3: Database Schema Generation');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'models', 
            status: 'processing',
            message: decision.object.scope.databaseWork || 'Generating database schema and models...'
          })
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'database',
          overview: agentOverview?.object,
          message: 'Generating database schema and models...'
        }, null, 2), session);

        const rawDatabaseResults = await generateObject({
          model: myProvider.languageModel('artifact-model'),
          schema: unifiedDatabaseSchema,
          messages: [
            {
              role: 'system' as const,
              content: `You are a database architect creating comprehensive data models.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"
AI ANALYSIS: ${decision.object.analysisReasoning}
SPECIFIC DATABASE WORK: ${decision.object.scope.databaseWork || 'Complete database schema design'}

COMPREHENSIVE PROMPT UNDERSTANDING:
${JSON.stringify(promptUnderstanding.object, null, 2)}

${granularChanges ? `
GRANULAR CHANGE PLAN:
${JSON.stringify(granularChanges.object, null, 2)}

🎯 SPECIFIC DATABASE OPERATIONS TO IMPLEMENT:
${granularChanges.object.specificChanges
  .filter((c: any) => c.type.includes('model') || c.type.includes('enum') || c.type.includes('field'))
  .map((c: any) => `- ${c.type}: ${c.target}${c.parentTarget ? ` (in ${c.parentTarget})` : ''} - ${c.details.reason}`)
  .join('\n')}
` : ''}

${changeAnalysis ? `
🎯 CHANGE ANALYSIS RESULTS:
- User Intent: ${changeAnalysis.object.userIntent}
- Target Type: ${changeAnalysis.object.targetType}
- Preserve Existing: ${changeAnalysis.object.preserveExisting}
- Specific Targets: ${changeAnalysis.object.specificTargets.join(', ')}
- Expected New Items: ${changeAnalysis.object.expectedResult.newItems.join(', ')}
- Expected Total Models: ${changeAnalysis.object.expectedResult.totalModels}
- Expected Total Enums: ${changeAnalysis.object.expectedResult.totalEnums}

🎯 CRITICAL INSTRUCTION: Generate ONLY the ${changeAnalysis.object.expectedResult.newItems.length} new items: ${changeAnalysis.object.expectedResult.newItems.join(', ')}
` : ''}

${agentOverview ? `
SYSTEM OVERVIEW:
- Name: ${agentOverview.object.name}
- Domain: ${agentOverview.object.domain}
- Requirements: ${agentOverview.object.requirements.join(', ')}
- Features: ${agentOverview.object.features.join(', ')}
` : ''}

DETAILED MODELING REQUIREMENTS FROM ANALYSIS:
Models to Create: ${promptUnderstanding.object.dataModelingNeeds.requiredModels.map((m: any) => 
  `${m.name} (${m.purpose}) - Priority: ${m.priority} - Fields: ${m.estimatedFields.map((f: any) => `${f.name}:${f.type}`).join(', ')}`
).join(' | ')}

Model-Specific Enums: ${promptUnderstanding.object.dataModelingNeeds.requiredModels
  .filter((m: any) => m.estimatedEnums && m.estimatedEnums.length > 0)
  .map((m: any) => `${m.name}: ${m.estimatedEnums.map((e: any) => `${e.name} (${e.purpose}) - Values: ${e.estimatedValues.join(', ')}`).join(', ')}`)
  .join(' | ')}

Relationships: ${promptUnderstanding.object.dataModelingNeeds.relationships.map((r: any) => 
  `${r.from} -> ${r.to} (${r.type}): ${r.purpose}`
).join(' | ')}

EXISTING DATABASE: ${existingAgent && existingAgent.models.length > 0 ? `
🔍 EXISTING SYSTEM CONTEXT:

Current System: ${existingAgent.models.length} models, ${existingAgent.enums.length} enums
Models: ${existingAgent.models.map(m => `${m.name} (${m.id})`).join(', ')}
Enums: ${existingAgent.enums.map(e => `${e.name} (${e.id})`).join(', ')}

⚡ INTELLIGENT MERGING APPROACH:
- You should focus ONLY on NEW items the user is requesting
- Our intelligent merging system will automatically preserve all existing data
- Do NOT duplicate existing models/enums - they will be preserved automatically
- Generate ONLY what is new or specifically requested by the user

📋 INSTRUCTIONS FOR ${currentOperation.toUpperCase()} OPERATION:
${changeAnalysis ? `
1. Generate EXACTLY ${changeAnalysis.object.expectedResult.newItems.length} new items: ${changeAnalysis.object.expectedResult.newItems.join(', ')}
2. Do NOT generate existing items: ${existingAgent.models.map(m => m.name).join(', ')}
3. Expected result: ${changeAnalysis.object.expectedResult.totalModels} total models (${existingAgent.models.length} existing + ${changeAnalysis.object.expectedResult.newItems.length} new)
4. Use next available IDs: models start from mdl${existingAgent.models.length + 1}, enums from enm${existingAgent.enums.length + 1}
` : `
1. Focus on NEW models/enums that the user specifically requested
2. Do NOT include existing models/enums in your response  
3. Use next available IDs: models start from mdl${existingAgent.models.length + 1}, enums from enm${existingAgent.enums.length + 1}
`}
5. The intelligent merging system will combine your new items with existing data
6. Only generate what is specifically needed for the user's request

DETAILED FIELD SPECIFICATIONS:
${promptUnderstanding.object.dataModelingNeeds.requiredModels.map((m: any) => 
  `${m.name}: ${m.estimatedFields.map((f: any) => `${f.name} (${f.type}${f.required ? ', required' : ''}) - ${f.purpose}`).join(', ')}`
).join(' | ')}

✅ CONFIDENCE GUARANTEE: All existing data is automatically preserved by the intelligent merging system.
` : 'No existing database - create from scratch'}

${granularChanges ? `
🎯 IMPLEMENTATION GUIDANCE FROM GRANULAR ANALYSIS:
Execute these specific database changes: ${granularChanges.object.specificChanges
  .filter((c: any) => c.type.includes('model') || c.type.includes('enum') || c.type.includes('field'))
  .map((c: any) => `${c.type}:${c.target}`).join(', ')}

Follow the execution phases: ${granularChanges.object.executionPlan.phases.map((p: any) => p.name).join(' -> ')}
` : ''}

Design ${existingAgent ? `NEW database models that extend the existing system${changeAnalysis ? ` (specifically: ${changeAnalysis.object.expectedResult.newItems.join(', ')})` : ''}` : 'comprehensive database models that support the complete system'}. 

IMPLEMENTATION REQUIREMENTS:
1. ${existingAgent ? `ONLY ${changeAnalysis ? `${changeAnalysis.object.expectedResult.newItems.join(', ')} models/enums` : 'new models/enums specifically requested by the user'}` : 'Core entity models based on the detailed analysis above'}
2. Use the EXACT field specifications from the prompt understanding analysis
3. Implement the specified relationships from the analysis
4. ${existingAgent ? 'Do NOT duplicate existing models - they are preserved automatically' : 'Complete data model for the system'}
5. Proper relationships and constraints as specified in the analysis
6. Audit fields (id, createdAt, updatedAt, deleted, deletedAt)
7. UI metadata for admin interfaces
8. Follow the priority levels: critical > important > nice-to-have
9. IMPORTANT: Generate auto-generated descriptions for each model that explain their purpose and usage in 1-2 sentences

Use proper ID patterns: Models (mdl1, mdl2, etc.), Fields (fld1, fld2, etc.), Enums (enm1, enm2, etc.), Enum Fields (enf1, enf2, etc.)
Use appropriate data types: String, Int, Float, Boolean, DateTime, Json, Bytes

🆔 CRITICAL ID FIELD NAMING CONVENTION:
- ALWAYS use 'id' as the name for primary identifier fields (NOT cart_id, user_id, product_id, etc.)
- Set idField to 'id' for all models
- The primary key field must always be named 'id' with type 'String'
- Example: { name: 'id', type: 'String', isId: true, unique: true, required: true }

${existingAgent ? `
🎯 REMEMBER: Generate ONLY ${changeAnalysis ? changeAnalysis.object.expectedResult.newItems.join(', ') : 'new items specified in the prompt understanding'}. Existing data is preserved automatically.
${changeAnalysis ? `Expected output: ${changeAnalysis.object.expectedResult.newItems.length} models/enums, NOT ${existingAgent.models.length + existingAgent.enums.length}` : ''}
` : 'Create a complete system from scratch based on the comprehensive analysis above.'}`
            }
          ],
          temperature: 0.3,
        });

        if (existingAgent) {
          console.log('🔍 Existing agent data before merge:', JSON.stringify({
            modelsCount: existingAgent.models.length,
            enumsCount: existingAgent.enums.length,
            modelNames: existingAgent.models.map(m => m.name),
            enumNames: existingAgent.enums.map(e => e.name)
          }, null, 2));
        }
        // Use raw AI results - let intelligentDocumentUpdate handle the merging
        databaseResults = rawDatabaseResults.object;

        // Validation and retry logic for existing systems
        if (changeAnalysis && existingAgent) {
          const expectedNewModels = changeAnalysis.object.expectedResult.newItems.filter((item: string) => 
            changeAnalysis.object.targetType === 'models' || 
            !existingAgent.models.some(m => m.enums?.some(e => e.name.toLowerCase() === item.toLowerCase()))
          ).length;
          
          const actualNewModels = databaseResults.models.length;
          
          console.log('🔍 Validation Check:');
          console.log(`  Expected new models: ${expectedNewModels}`);
          console.log(`  Actual new models: ${actualNewModels}`);
          
          // Check if AI generated too many or too few items
          const shouldRetry = (
            (expectedNewModels > 0 && actualNewModels === 0) || // Expected models but got none
            (actualNewModels > expectedNewModels + 2) || // Generated way too many models
            (actualNewModels === 0 && changeAnalysis.object.expectedResult.newItems.length > 0) // Expected items but got nothing
          );
          
          if (shouldRetry) {
            console.log('⚠️ AI output validation failed, retrying with stronger guidance...');
            
            dataStream.writeData({
              type: 'agent-step',
              content: JSON.stringify({ 
                step: 'models', 
                status: 'processing',
                message: 'Refining database generation with corrected guidance...'
              })
            });
            
            const retryDatabaseResults = await generateObject({
              model: myProvider.languageModel('artifact-model'),
              schema: unifiedDatabaseSchema,
              messages: [
                {
                  role: 'system' as const,
                  content: `🚨 RETRY - The previous attempt did not generate the correct items. Follow instructions EXACTLY.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"

🎯 CRITICAL VALIDATION ERROR:
- Expected ${expectedNewModels} new models for: ${changeAnalysis.object.expectedResult.newItems.join(', ')}
- Previous attempt generated ${actualNewModels} models
- This is INCORRECT and does not match user requirements

🎯 EXACT REQUIREMENTS:
- Generate EXACTLY these new items: ${changeAnalysis.object.expectedResult.newItems.join(', ')}
- Do NOT generate existing items: ${existingAgent.models.map(m => m.name).join(', ')}
- Expected output: ${changeAnalysis.object.expectedResult.newItems.length} new items ONLY
- ID FIELD NAMING: Always name the ID field 'id' (not model-specific like 'cart_id')

EXISTING SYSTEM (DO NOT DUPLICATE):
- Existing Models: ${existingAgent.models.map(m => `${m.name} (${m.id})`).join(', ')}

🎯 CRITICAL: ID patterns and naming:
- Models: Always use 'id' as the primary key field name (type: String)
- Fields: Use format 'fld[number]' (e.g., fld1, fld2, fld3)
- Enums: Use format 'enm[number]' (e.g., enm1, enm2, enm3)
- Enum fields: Use format 'efld[number]' (e.g., efld1, efld2, efld3)

EXAMPLE MODEL WITH CORRECT ID FIELD:
{
  "id": "mdl1",
  "name": "Cart",
  "idField": "id",
  "fields": [
    {
      "id": "fld1",
      "name": "id",
      "type": "String",
      "isId": true,
      "unique": true,
      "required": true
    }
  ]
}

🎯 SPECIFIC INSTRUCTION:
Generate ONLY the ${changeAnalysis.object.expectedResult.newItems.length} new items requested by the user: ${changeAnalysis.object.expectedResult.newItems.join(', ')}

Use next available IDs: models start from mdl${existingAgent.models.length + 1}

⚠️ CRITICAL: Do NOT include any existing models in your response. They are preserved automatically.`
                }
              ],
              temperature: 0.1, // Lower temperature for more precise following of instructions
            });
            
            databaseResults = retryDatabaseResults.object;
            console.log('🔄 Retry completed. New result:', {
              models: databaseResults.models.length,
              modelNames: databaseResults.models.map((m: any) => m.name)
            });
          }
        }

        console.log(`🔧 Database generation complete: ${databaseResults.models.length} models`);
        console.log('🔍 Raw AI database results:', JSON.stringify({
          modelsCount: databaseResults.models.length,
          modelNames: databaseResults.models.map((m: any) => m.name)
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
            data: { object: databaseResults },
            message: `Database schema complete: ${databaseResults.models.length} models`
          })
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'database',
          overview: agentOverview?.object,
          database: databaseResults,
          message: `Database schema complete: ${databaseResults.models.length} models`
        }, null, 2), session);
      }

      // Step 4: Actions Generation (if needed)
      if (decision.object.needsActions) {
        console.log('⚡ Step 4: Actions and Workflows Generation');
        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'actions', 
            status: 'processing',
            message: decision.object.scope.actionsWork || 'Creating intelligent workflows and automation...'
          })
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'actions',
          overview: agentOverview?.object,
          database: databaseResults,
          message: 'Creating intelligent workflows and automation...'
        }, null, 2), session);

        // Prepare context for actions generation
        const availableModels = databaseResults?.models || existingAgent?.models || [];
        const modelContext = availableModels.length > 0 ? 
          `Available Database Models: ${availableModels.map((m: AgentModel) => `${m.name} (${m.fields?.map((f: any) => f.name).join(', ') || 'no fields'})`).join(', ')}` :
          'No database models available';

        const rawActionsResults = await generateObject({
          model: myProvider.languageModel('artifact-model'),
          schema: unifiedActionsSchema,
          messages: [
            {
              role: 'system' as const,
              content: `You are an expert workflow automation designer creating intelligent action systems.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"
OPERATION: ${currentOperation}

${promptUnderstanding ? `
PROMPT UNDERSTANDING CONTEXT:
- Required Actions: ${promptUnderstanding.object.workflowAutomationNeeds.requiredActions.map((a: any) => a.name).join(', ')}
- Business Context: ${promptUnderstanding.object.userRequestAnalysis.businessContext}
` : ''}

${modelContext}

${agentOverview ? `
SYSTEM OVERVIEW:
- Name: ${agentOverview.object.name}
- Domain: ${agentOverview.object.domain}
- Description: ${agentOverview.object.description}
` : ''}

${existingAgent ? `
EXISTING SYSTEM CONTEXT:
- Existing Actions: ${existingAgent.actions.map(a => a.name).join(', ')} (${existingAgent.actions.length} total)
- Operation: ${currentOperation} 
- Update Goals: ${changeAnalysis ? changeAnalysis.object.expectedResult.newItems.join(', ') : 'Enhance functionality'}

${currentOperation === 'extend' || currentOperation === 'update' ? `
CHANGE ANALYSIS:
${changeAnalysis ? JSON.stringify({
  userIntent: changeAnalysis.object.userIntent,
  preserveExisting: changeAnalysis.object.preserveExisting,
  expectedNewItems: changeAnalysis.object.expectedResult.newItems,
  deletedItems: changeAnalysis.object.expectedResult.deletedItems
}, null, 2) : 'Analysis in progress'}

GUIDANCE: Only generate NEW actions as requested. Existing actions will be preserved automatically.
- Generate ONLY the actions mentioned in expectedResult.newItems
- Do NOT duplicate existing actions: ${existingAgent.actions.map(a => a.name).join(', ')}
` : ''}
` : ''}

DESIGN PRINCIPLES:
1. Create PRACTICAL, business-value actions
2. Use REAL database operations when possible
3. Include proper error handling
4. Design for scalability and maintenance
5. Focus on automation that saves human effort

ACTION TYPES TO CONSIDER:
- Data Processing: Clean, validate, transform data
- Notifications: Send alerts, updates, reports
- Integration: Connect with external systems  
- Analytics: Generate insights, reports, metrics
- Maintenance: Cleanup, optimization, backups
- Content Management: Create, update, organize content
- User Management: Onboarding, access control, lifecycle

Each action should:
- Have a clear business purpose
- Use appropriate data sources (database queries when possible)
- Include realistic execution logic (code or AI prompts)
- Specify exact output formats and target models
- Consider scheduling needs (though scheduling is handled separately)
- Include a detailed description explaining what the action does and why it's valuable
- Have a description that explains the action's business value and purpose

Be creative but practical. Focus on actions that would genuinely help users accomplish their goals efficiently.`
            }
          ],
          temperature: 0.4,
        });

        // Use raw AI results - let intelligentDocumentUpdate handle the merging
        if (existingAgent) {
          console.log('🔍 Existing agent data before generation:', JSON.stringify({
            actionsCount: existingAgent.actions.length,
            actionNames: existingAgent.actions.map(a => a.name)
          }, null, 2));
        }

        actionsResults = rawActionsResults.object;

        // Clean null values from actions and ensure required fields
        if (actionsResults?.actions) {
          actionsResults.actions = actionsResults.actions.map((action: any) => {
            const cleaned = cleanNullValues(action);
            return ensureRequiredActionFields(cleaned);
          });
        }

        console.log(`🔧 Actions generation complete: ${actionsResults.actions.length} actions`);
        console.log('🔍 Raw AI actions results:', JSON.stringify({
          actionsCount: actionsResults.actions.length,
          actionNames: actionsResults.actions.map((a: any) => a.name)
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
            data: { object: actionsResults },
            message: `Workflows complete: ${actionsResults.actions.length} automated actions`
          })
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'actions',
          overview: agentOverview?.object,
          database: databaseResults,
          actions: actionsResults,
          message: `Workflows complete: ${actionsResults.actions.length} automated actions`
        }, null, 2), session);
      }

      // Step 4.5: Schedules Generation (if actions were created)
      let schedulesResults: any = null;
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

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'schedules',
          overview: agentOverview?.object,
          database: databaseResults,
          actions: actionsResults,
          message: 'Creating automated scheduling and timing configurations...'
        }, null, 2), session);

        const unifiedSchedulesSchema = z.object({
          schedules: z.array(z.object({
            id: z.string().describe('Unique identifier for the schedule'),
            name: z.string().describe('Name of the schedule'),
            emoji: z.string().optional().describe('Single emoji that visually represents this schedule (e.g., 📅 for daily, 🔄 for recurring, ⏰ for timed)'),
            description: z.string().describe('Detailed description of what this schedule does and its business purpose'),
            type: z.enum(['Create', 'Update']).describe('Schedule type - Create for new records, Update for existing'),
            role: z.enum(['admin', 'member']).describe('Role required to execute this schedule'),
            interval: z.object({
              pattern: z.string().describe('Cron pattern or interval description (e.g., "daily", "weekly", "0 9 * * 1" for every Monday at 9am)'),
              timezone: z.string().optional().describe('Timezone for the schedule (e.g., "America/New_York")'),
              active: z.boolean().optional().describe('Whether the schedule is currently active')
            }).describe('Schedule timing configuration'),
            dataSource: z.object({
              type: z.enum(['custom', 'database']).describe('Data source type'),
              customFunction: z.object({
                code: z.string().describe('JavaScript code for custom data fetching'),
                envVars: z.array(z.object({
                  name: z.string(),
                  description: z.string(),
                  required: z.boolean(),
                  sensitive: z.boolean()
                })).optional().describe('Environment variables needed for the custom function')
              }).optional().describe('Custom function configuration if type is custom'),
              database: z.object({
                models: z.array(z.object({
                  id: z.string(),
                  name: z.string(),
                  fields: z.array(z.object({
                    id: z.string(),
                    name: z.string()
                  })),
                  where: z.record(z.any()).optional(),
                  limit: z.number().optional()
                }))
              }).optional().describe('Database models configuration if type is database')
            }).describe('Configuration for how data is sourced'),
            execute: z.object({
              type: z.enum(['code', 'prompt']).describe('Execution type - code or AI prompt'),
              code: z.object({
                script: z.string().describe('JavaScript code to execute'),
                envVars: z.array(z.object({
                  name: z.string(),
                  description: z.string(),
                  required: z.boolean(),
                  sensitive: z.boolean()
                })).optional().describe('Environment variables needed for the script')
              }).optional().describe('Code execution configuration if type is code'),
              prompt: z.object({
                template: z.string().describe('AI prompt template'),
                model: z.string().optional().describe('AI model to use'),
                temperature: z.number().optional().describe('Temperature for AI generation'),
                maxTokens: z.number().optional().describe('Maximum tokens for AI response')
              }).nullable().optional().describe('AI prompt configuration if type is prompt')
            }).describe('Configuration for how the schedule is executed'),
            results: z.object({
              actionType: z.enum(['Create', 'Update']).describe('Type of action result'),
              model: z.string().describe('Target model for the results'),
              identifierIds: z.array(z.string()).optional().describe('Fields that identify existing records for updates'),
              fields: z.record(z.any()).optional().describe('Fields to set for Create actions'),
              fieldsToUpdate: z.record(z.any()).optional().describe('Fields to update for Update actions')
            }).optional().describe('Configuration for how results are processed')
          })),
        });

        const rawSchedulesResults = await generateObject({
          model: myProvider.languageModel('artifact-model'),
          schema: unifiedSchedulesSchema,
          messages: [
            {
              role: 'system' as const,
              content: `You are an expert at creating automated scheduling systems for business workflows.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"

AVAILABLE ACTIONS TO SCHEDULE:
${actionsResults.actions.map((action: any) => `- ${action.name}: ${action.description} (${action.type})`).join('\n')}

AVAILABLE MODELS:
${(databaseResults?.models || existingAgent?.models || []).map((model: any) => `- ${model.name}: ${model.fields?.map((f: any) => f.name).join(', ') || 'no fields'}`).join('\n')}

GUIDELINES FOR SCHEDULE CREATION:
1. Create schedules that make business sense
2. Use realistic cron patterns (daily, weekly, monthly)
3. Consider business hours and timezones
4. Focus on high-value automation opportunities
5. Each schedule should have a clear purpose
6. ALWAYS include a results configuration - this is REQUIRED

COMMON SCHEDULING PATTERNS:
- Daily reports: "0 9 * * 1-5" (9 AM weekdays)
- Weekly summaries: "0 10 * * 1" (Monday 10 AM)
- Monthly cleanup: "0 2 1 * *" (1st of month, 2 AM)
- Hourly monitoring: "0 * * * *" (every hour)
- End of business: "0 17 * * 1-5" (5 PM weekdays)

RESULTS CONFIGURATION EXAMPLES:
- For Create actions: { "actionType": "Create", "model": "ModelName", "fields": { "field1": "value1" } }
- For Update actions: { "actionType": "Update", "model": "ModelName", "identifierIds": ["id"], "fieldsToUpdate": { "field1": "newValue" } }

For each schedule:
- Choose appropriate timing based on the action's purpose
- Use UTC timezone unless specified otherwise
- Create realistic data processing logic
- Ensure outputs align with business needs
- Include proper error handling and logging
- MUST include a complete "results" object with actionType, model, and appropriate fields

The results configuration tells the system:
- What type of action to perform (Create or Update)
- Which model/table to target
- What data to create or which fields to update
- How to identify existing records for updates

Focus on creating 1-3 high-impact schedules that would genuinely help automate business processes.`
            }
          ],
          temperature: 0.3,
        });

        schedulesResults = rawSchedulesResults.object;

        // Ensure all schedules have valid results fields
        if (schedulesResults?.schedules) {
          schedulesResults.schedules = schedulesResults.schedules.map((schedule: any) => {
            // If results is missing or invalid, add a default one
            if (!schedule.results || typeof schedule.results !== 'object') {
              const firstModel = (databaseResults?.models || existingAgent?.models || [])[0];
              const modelName = firstModel ? firstModel.name : 'DefaultModel';
              
              schedule.results = {
                actionType: schedule.type || 'Create',
                model: modelName,
                fields: {},
                ...(schedule.type === 'Update' && { identifierIds: ['id'], fieldsToUpdate: {} })
              };
            }
            
            // Ensure required fields exist in results
            if (!schedule.results.actionType) {
              schedule.results.actionType = schedule.type || 'Create';
            }
            
            if (!schedule.results.model) {
              const firstModel = (databaseResults?.models || existingAgent?.models || [])[0];
              schedule.results.model = firstModel ? firstModel.name : 'DefaultModel';
            }
            
            return schedule;
          });
        }

        console.log(`🔧 Schedules generation complete: ${schedulesResults.schedules.length} schedules`);
        console.log('🔍 Raw AI schedules results:', JSON.stringify({
          schedulesCount: schedulesResults.schedules.length,
          scheduleNames: schedulesResults.schedules.map((s: any) => s.name)
        }, null, 2));

        dataStream.writeData({
          type: 'agent-step',
          content: JSON.stringify({ 
            step: 'schedules', 
            status: 'complete',
            data: { object: schedulesResults },
            message: `Scheduling complete: ${schedulesResults.schedules.length} automated schedules`
          })
        });

        await saveDocumentWithContent(documentId, agentOverview?.object?.name || existingAgent?.name || 'AI Agent System', JSON.stringify({
          status: 'processing',
          step: 'schedules',
          overview: agentOverview?.object,
          database: databaseResults,
          actions: actionsResults,
          schedules: schedulesResults,
          message: `Scheduling complete: ${schedulesResults.schedules.length} automated schedules`
        }, null, 2), session);
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

      // Create final agent with RAW AI results - let intelligentDocumentUpdate do the merging
      console.log('🆕 Creating agent data with raw AI results for intelligent merging...');
      
      // Build comprehensive metadata from analysis phases
      const comprehensiveMetadata = {
        promptUnderstanding: promptUnderstanding?.object,
        granularChanges: granularChanges?.object,
        aiDecision: decision.object,
        changeAnalysis: changeAnalysis?.object,
        lastUpdateReason: command,
        lastUpdateTimestamp: new Date().toISOString(),
        comprehensiveAnalysisUsed: true,
        operationType: currentOperation,
        promptAnalysisPhase: promptUnderstanding?.object,
        granularChangesPhase: granularChanges?.object,
        aiDecisionPhase: decision.object
      };

        finalAgent = createAgentData(
        agentOverview?.object?.name || existingAgent?.name || 'AI Agent System',
        agentOverview?.object?.description || existingAgent?.description || 'AI-generated agent system',
        agentOverview?.object?.domain || existingAgent?.domain || '',
          databaseResults?.models || [],
          databaseResults?.enums || [],
        actionsResults?.actions || [],
        comprehensiveMetadata
      );

      // Add schedules if they were generated
      if (schedulesResults?.schedules) {
        finalAgent.schedules = mergeSchedulesIntelligently(finalAgent.schedules || [], schedulesResults.schedules);
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
      
      await saveDocumentWithContent(documentId, finalAgent.name, JSON.stringify(finalAgent, null, 2), session, deletionOperations);

      dataStream.writeData({ type: 'finish', content: '' });

      // Generate appropriate success message
      let successMessage = '';
      if (decision.object.needsFullAgent) {
        successMessage = `🎉 Successfully created ${finalAgent.name}! Your complete ${finalAgent.domain} system includes ${finalAgent.models.length} database models, ${finalAgent.actions.length} automated workflows, and ${finalAgent.schedules.length} scheduled tasks.`;
      } else if (decision.object.needsDatabase && decision.object.needsActions) {
        successMessage = `🎉 Successfully built database and workflows for ${finalAgent.name}! Added ${finalAgent.models.length} models, ${finalAgent.actions.length} actions, and ${finalAgent.schedules.length} schedules.`;
      } else if (decision.object.needsDatabase) {
        successMessage = `🗄️ Successfully designed database schema for ${finalAgent.name}! Created ${finalAgent.models.length} models.`;
      } else if (decision.object.needsActions) {
        successMessage = `⚡ Successfully created workflows for ${finalAgent.name}! Built ${finalAgent.actions.length} automated actions and ${finalAgent.schedules.length} schedules.`;
      } else {
        successMessage = `✅ Successfully analyzed and updated ${finalAgent.name}!`;
      }

      const result = {
        id: documentId,
        title: finalAgent.name,
        kind: 'agent' as const,
        content: successMessage
      };

      console.log('📤 Returning agent result:', JSON.stringify(result, null, 2));
      
      return result;
      
    } catch (error) {
      console.error('💥 Agent builder execution failed:', error);
      
      const errorData = createAgentData(
        'Error Agent System',
        'Failed to generate agent system',
        '',
        [],
        [],
        []
      );

      dataStream.writeData({
        type: 'agent-data',
        content: JSON.stringify({
          ...errorData,
          error: (error as Error).message || 'Unknown error'
        })
      });

      // Save error state
      await saveDocumentWithContent(documentId, 'Error Agent System', JSON.stringify({
        ...errorData,
        error: (error as Error).message || 'Unknown error'
      }, null, 2), session);

      dataStream.writeData({ type: 'finish', content: '' });
      
      return {
        id: documentId,
        title: 'Error Agent System',
        kind: 'agent' as const,
        content: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  },
});

