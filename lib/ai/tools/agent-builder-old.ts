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
  actions: AgentAction[] = [],
  metadata?: any
): AgentData {
  return {
    name,
    description,
    domain,
    models,
    actions,
    schedules: [],
    createdAt: new Date().toISOString(),
    metadata
  };
}
