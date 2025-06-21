import { z } from 'zod';

// Schema for AI decision making
export const decisionSchema = z.object({
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
export const unifiedAgentSchema = z.object({
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  requirements: z.array(z.string()),
  features: z.array(z.string()),
  architecture: z.string()
});

export const unifiedDatabaseSchema = z.object({
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

export const unifiedActionsSchema = z.object({
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
      }).nullable().optional().describe('Custom function configuration if type is custom'),
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
      }).nullable().optional().describe('Database models configuration if type is database')
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
    }).optional().describe('Configuration for how the action is executed'),
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
export const changeAnalysisSchema = z.object({
  userIntent: z.enum(['add', 'modify', 'delete', 'replace']),
  targetType: z.enum(['models', 'enums', 'actions', 'fields', 'system']),
  preserveExisting: z.boolean(),
  specificTargets: z.array(z.string()),
  expectedResult: z.object({
    totalModels: z.number(),
    totalEnums: z.number(),
    totalActions: z.number(),
    newItems: z.array(z.string()),
    modifiedItems: z.array(z.string()),
    deletedItems: z.array(z.string())
  })
});

// Granular change analysis schema
export const granularChangeAnalysisSchema = z.object({
  changeDetails: z.object({
    operationType: z.enum(['create', 'add', 'modify', 'delete', 'restructure']).describe('Type of operation being performed'),
    targetScope: z.enum(['models', 'actions', 'schedules', 'fields', 'enums', 'mixed', 'integrations', 'system']).describe('What is being changed'),
    preservationStrategy: z.enum(['preserve-all', 'preserve-targeted', 'replace-targeted', 'full-replacement']).describe('How to handle existing data')
  }),
  specificChanges: z.array(z.object({
    type: z.enum(['add-model', 'modify-model', 'delete-model', 'add-field', 'modify-field', 'delete-field', 'add-enum', 'modify-enum', 'delete-enum', 'add-action', 'modify-action', 'delete-action']).describe('Specific type of change'),
    target: z.string().describe('Name or ID of the target item'),
    parentTarget: z.string().optional().describe('Parent item if this is a nested change'),
    details: z.object({
      reason: z.string().describe('Why this change is needed'),
      impact: z.enum(['low', 'medium', 'high', 'critical']).describe('Impact level of this change'),
      dependencies: z.array(z.string()).describe('Other changes this depends on'),
      risks: z.array(z.string()).describe('Potential risks or issues')
    })
  })),
  executionPlan: z.object({
    phases: z.array(z.object({
      name: z.string(),
      description: z.string(),
      operations: z.array(z.string()),
      dependencies: z.array(z.string()),
      risks: z.array(z.string())
    })),
    criticalPath: z.array(z.string()),
    rollbackStrategy: z.string()
  }),
  expectedOutcome: z.string().describe('What the final result should look like')
});

// Deletion operations schema
export const deletionOperationsSchema = z.object({
  modelsToDelete: z.array(z.string()).describe('Names or IDs of models to delete'),
  enumsToDelete: z.array(z.string()).describe('Names or IDs of enums to delete'),
  actionsToDelete: z.array(z.string()).describe('Names or IDs of actions to delete'),
  schedulesToDelete: z.array(z.string()).describe('Names or IDs of schedules to delete'),
  fieldDeletions: z.record(z.array(z.string())).describe('Fields to delete from specific models (model name -> field names)')
});

// Enhanced schema for detailed prompt understanding and feature imagination
export const promptUnderstandingSchema = z.object({
  userRequestAnalysis: z.object({
    mainGoal: z.string(),
    businessContext: z.string(),
    complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    clarity: z.enum(['very_clear', 'clear', 'somewhat_unclear', 'unclear'])
  }),
  featureImagination: z.object({
    coreFeatures: z.array(z.string()),
    additionalFeatures: z.array(z.string()),
    userExperience: z.array(z.string()),
    businessRules: z.array(z.string()),
    integrations: z.array(z.string())
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
        enumValues: z.array(z.string()).optional()
      })),
      estimatedEnums: z.array(z.object({
        name: z.string(),
        purpose: z.string(),
        estimatedValues: z.array(z.string())
      })).optional()
    })),
    relationships: z.array(z.object({
      from: z.string(),
      to: z.string(),
      type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
      purpose: z.string()
    }))
  }),
  workflowAutomationNeeds: z.object({
    requiredActions: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      type: z.enum(['Create', 'Update']),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      inputRequirements: z.array(z.string()),
      outputExpectations: z.array(z.string())
    })),
    businessRules: z.array(z.object({
      condition: z.string(),
      action: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low'])
    })),
    userRoles: z.array(z.object({
      name: z.string(),
      permissions: z.array(z.string())
    })),
    oneTimeActions: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      role: z.enum(['admin', 'member']),
      triggerType: z.enum(['manual', 'event-driven']),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      complexity: z.enum(['simple', 'moderate', 'complex']),
      businessValue: z.string(),
      estimatedSteps: z.array(z.string()),
      dataRequirements: z.array(z.string()),
      expectedOutput: z.string()
    })),
    recurringSchedules: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      role: z.enum(['admin', 'member']),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'custom']),
      timing: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      complexity: z.enum(['simple', 'moderate', 'complex']),
      businessValue: z.string(),
      estimatedSteps: z.array(z.string()),
      dataRequirements: z.array(z.string()),
      expectedOutput: z.string()
    })),
    businessProcesses: z.array(z.object({
      name: z.string(),
      description: z.string(),
      involvedModels: z.array(z.string()),
      automationPotential: z.enum(['high', 'medium', 'low']),
      requiresActions: z.boolean(),
      requiresSchedules: z.boolean()
    }))
  }),
  changeAnalysisPlan: z.array(z.object({
    changeId: z.string(),
    description: z.string(),
    type: z.enum(['create', 'update', 'delete']),
    targetType: z.enum(['models', 'actions', 'fields', 'system', 'integrations']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    dependencies: z.array(z.string()),
    estimatedImpact: z.enum(['minimal', 'moderate', 'significant', 'major']),
    specificTargets: z.array(z.string())
  })),
  implementationStrategy: z.object({
    recommendedApproach: z.enum(['incremental', 'comprehensive', 'modular', 'minimal-viable']),
    executionOrder: z.array(z.string()),
    riskAssessment: z.array(z.string()),
    successCriteria: z.array(z.string())
  })
});

// Schema for schedules
export const unifiedSchedulesSchema = z.object({
  schedules: z.array(z.object({
    id: z.string().describe('Unique identifier for the schedule'),
    name: z.string().describe('Name of the schedule'),
    emoji: z.string().optional().describe('Single emoji that visually represents this schedule (e.g., ⏰ for daily tasks, 📊 for reports, 🔄 for sync)'),
    description: z.string().describe('Detailed description of what this schedule does and its business purpose'),
    type: z.enum(['Create', 'Update']).describe('Schedule type - Create for new records, Update for existing'),
    role: z.enum(['admin', 'member']).describe('Role required to execute this schedule'),
    interval: z.object({
      pattern: z.string().describe('Cron pattern or human-readable schedule (e.g., "daily", "weekly", "0 9 * * *")'),
      timezone: z.string().optional().describe('Timezone for the schedule'),
      active: z.boolean().optional().describe('Whether the schedule is active')
    }).describe('Scheduling configuration'),
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
      }).nullable().optional().describe('Custom function configuration if type is custom'),
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
      }).nullable().optional().describe('Database models configuration if type is database')
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
    }).optional().describe('Configuration for how the schedule is executed'),
    results: z.object({
      actionType: z.enum(['Create', 'Update']).describe('Type of action result'),
      model: z.string().describe('Target model for the results'),
      identifierIds: z.array(z.string()).optional().describe('Fields that identify existing records for updates'),
      fields: z.record(z.any()).optional().describe('Fields to set for Create actions'),
      fieldsToUpdate: z.record(z.any()).optional().describe('Fields to update for Update actions')
    }).optional().describe('Configuration for how results are processed')
  }))
});

// Add aliases for backward compatibility with generation functions
export const databaseGenerationSchema = unifiedDatabaseSchema;
export const actionGenerationSchema = unifiedActionsSchema;
export const scheduleGenerationSchema = unifiedSchedulesSchema; 