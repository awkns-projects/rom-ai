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
  })).describe('Array of data models')
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
      code: z.object({
        script: z.string().describe('JavaScript code to execute the action'),
        envVars: z.array(z.object({
          name: z.string(),
          description: z.string(),
          required: z.boolean(),
          sensitive: z.boolean()
        })).optional().describe('Environment variables needed for the action')
      }).describe('Code execution configuration - all actions use code execution'),
    }).describe('How the action is executed'),
    results: z.object({
      actionType: z.enum(['Create', 'Update']).describe('Type of action result'),
      model: z.string().describe('Target model for the results'),
      identifierIds: z.array(z.string()).optional().describe('Fields that identify existing records for updates'),
      fields: z.record(z.any()).optional().describe('Fields to set for Create actions'),
      fieldsToUpdate: z.record(z.any()).optional().describe('Fields to update for Update actions')
    }).optional().describe('Configuration for how results are processed')
  }))
});

export const prismaActionsSchema = z.object({
  actions: z.array(z.object({
    id: z.string().describe('Unique identifier for the action'),
    name: z.string().describe('Name of the action'),
    emoji: z.string().optional().describe('Single emoji that visually represents this action (e.g., ✉️ for email, 📊 for reports, 🔄 for sync)'),
    description: z.string().describe('Detailed description of what this action does and its business purpose'),
    type: z.enum(['Query', 'Mutation']).describe('Action type - Query for reading data, Mutation for writing data'),
    role: z.enum(['admin', 'member']).describe('Role required to execute this action')
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
  actionsToDelete: z.array(z.string()).describe('Names or IDs of actions to delete'),
  schedulesToDelete: z.array(z.string()).describe('Names or IDs of schedules to delete'),
  fieldDeletions: z.record(z.array(z.string())).describe('Fields to delete from specific models (model name -> field names)'),
  enumDeletions: z.record(z.array(z.string())).optional().describe('Enums to delete from specific models (model name -> enum names)')
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
      frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'custom']),
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

// Enhanced Input Parameter Schema for Flexible Nested Structures
export const inputParameterFieldSchema = z.object({
  name: z.string().describe('Field name or path (e.g., "userId", "address.cityId", "items[].productId")'),
  type: z.string().describe('Data type (string, number, boolean, object, array, etc.)'),
  description: z.string().describe('Description of what this field contains'),
  source: z.enum(['user_input', 'database_selection', 'computed', 'environment']).describe('Where this data comes from'),
  validation: z.string().optional().describe('Validation rules for this field'),
  
  // Database ID Detection
  isDatabaseId: z.boolean().optional().describe('Whether this field represents a database record ID'),
  databaseIdModel: z.string().optional().describe('If isDatabaseId is true, which model this ID references'),
  isMultipleIds: z.boolean().optional().describe('Whether this field accepts multiple database IDs (array)'),
  
  // Nested Structure Support
  isNested: z.boolean().optional().describe('Whether this field contains nested objects or arrays'),
  nestingPath: z.string().optional().describe('JSON path to this field (e.g., "user.profile.cityId", "items[0].productId")'),
  parentField: z.string().optional().describe('Parent field name if this is a nested field'),
  
  // Array/Object Structure
  isArray: z.boolean().optional().describe('Whether this field is an array'),
  arrayItemType: z.string().optional().describe('Type of items in the array if isArray is true'),
  objectSchema: z.record(z.any()).optional().describe('Schema of nested object structure'),
  
  // Examples and Defaults
  exampleValue: z.any().optional().describe('Example value for this field'),
  defaultValue: z.any().optional().describe('Default value if not provided'),
  required: z.boolean().describe('Whether this field is required')
});

// Enhanced Input Structure Schema
export const inputStructureSchema = z.object({
  description: z.string().describe('Overall description of the input structure'),
  isFlexible: z.boolean().describe('Whether the input accepts arbitrary JSON structures'),
  
  // Flat field definitions (for simple inputs)
  flatFields: z.array(inputParameterFieldSchema).optional().describe('Simple top-level fields'),
  
  // Nested structure definition (for complex inputs)
  nestedStructure: z.object({
    schema: z.record(z.any()).describe('JSON schema defining the complete input structure'),
    databaseIdPaths: z.array(z.object({
      path: z.string().describe('JSON path to the database ID field (e.g., "user.id", "items[].productId")'),
      modelName: z.string().describe('Database model this ID references'),
      isArray: z.boolean().describe('Whether this path can contain multiple IDs'),
      required: z.boolean().describe('Whether this database ID is required'),
      description: z.string().describe('Description of what this database ID represents')
    })).describe('All database ID fields found in the nested structure')
  }).optional().describe('Complex nested input structure with database ID mapping'),
  
  // Validation and Processing
  validationRules: z.array(z.string()).describe('Overall validation rules for the input structure'),
  processingNotes: z.array(z.string()).describe('Special processing requirements for nested data'),
  
  // Examples
  exampleInputs: z.array(z.object({
    name: z.string().describe('Example name'),
    description: z.string().describe('What this example demonstrates'),
    input: z.record(z.any()).describe('Example input object'),
    databaseIdsUsed: z.array(z.string()).describe('Which database IDs are used in this example')
  })).describe('Example input structures showing various use cases')
});

// Update the enhanced action analysis schema to use the new input structure
export const enhancedActionAnalysisSchema = z.object({
  // Step 1: Imagination
  imagination: z.object({
    title: z.string().describe('Clear, descriptive title for the action'),
    description: z.string().describe('Detailed description of what the action accomplishes'),
    targetRole: z.enum(['member', 'admin', 'both']).describe('Who can execute this action'),
    businessValue: z.string().describe('The business value and impact this action provides'),
    userScenarios: z.array(z.string()).describe('Real-world scenarios when users would need this action')
  }),

  // Step 2: Technical Analysis
  analysis: z.object({
    databaseOperations: z.object({
      tablesToUpdate: z.array(z.object({
        modelName: z.string(),
        operation: z.enum(['create', 'update', 'delete']),
        fields: z.array(z.string()),
        reason: z.string()
      })).describe('Tables that will be modified'),
      tablesToRead: z.array(z.object({
        modelName: z.string(),
        fields: z.array(z.string()),
        purpose: z.string(),
        filters: z.record(z.any()).optional()
      })).describe('Tables needed for reading data'),
      relationships: z.array(z.object({
        from: z.string(),
        to: z.string(),
        type: z.string(),
        purpose: z.string()
      })).describe('Model relationships involved')
    }),

    externalAPIs: z.array(z.object({
      apiName: z.string(),
      purpose: z.string(),
      endpoint: z.string().optional(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
      requiredKeys: z.array(z.object({
        keyName: z.string(),
        description: z.string(),
        sensitive: z.boolean(),
        howToObtain: z.string()
      })),
      requestFormat: z.record(z.any()).optional(),
      responseFormat: z.record(z.any()).optional(),
      errorHandling: z.string()
    })).describe('External APIs that need to be called'),

    // Enhanced Input Parameters with Nested Structure Support
    inputParameters: z.object({
      structure: inputStructureSchema.describe('Complete input structure definition'),
      
      // Legacy support for simple flat parameters (deprecated but kept for compatibility)
      required: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
        source: z.enum(['user_input', 'database_selection', 'computed', 'environment']),
        validation: z.string().optional(),
        fromModel: z.string().optional().describe('If from database, which model'),
        isDatabaseId: z.boolean().optional().describe('Whether this field represents a database record ID'),
        databaseIdModel: z.string().optional().describe('If isDatabaseId is true, which model this ID references'),
        isMultipleIds: z.boolean().optional().describe('Whether this field accepts multiple database IDs (array)')
      })).optional().describe('Legacy flat required parameters (use structure instead)'),
      optional: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
        source: z.enum(['user_input', 'database_selection', 'computed', 'environment']),
        defaultValue: z.any().optional(),
        validation: z.string().optional(),
        fromModel: z.string().optional(),
        isDatabaseId: z.boolean().optional().describe('Whether this field represents a database record ID'),
        databaseIdModel: z.string().optional().describe('If isDatabaseId is true, which model this ID references'),
        isMultipleIds: z.boolean().optional().describe('Whether this field accepts multiple database IDs (array)')
      })).optional().describe('Legacy flat optional parameters (use structure instead)'),
      
      standardParameters: z.object({
        input: z.object({
          description: z.string().describe('Description of the input object structure'),
          structure: inputStructureSchema.describe('Complete input structure with database ID mapping'),
          databaseIdFields: z.array(z.string()).optional().describe('Flat list of database ID field paths for quick reference')
        }),
        member: z.object({
          description: z.string().describe('Description of the member parameter (user executing the action)'),
          requiredProperties: z.array(z.string()).describe('Required properties of the member object (e.g., id, role, email)')
        }),
        database: z.object({
          description: z.string().describe('Description of the database parameter'),
          modelsUsed: z.array(z.string()).describe('Which database models this action will access'),
          accessPattern: z.string().describe('How the action accesses database models (e.g., database["ModelName"])')
        })
      }).describe('Standard action parameters that are always available')
    }).describe('Input parameters needed for the action'),

    outputParameters: z.object({
      successResponse: z.object({
        format: z.record(z.any()),
        description: z.string()
      }),
      errorResponse: z.object({
        format: z.record(z.any()),
        description: z.string()
      }),
      sideEffects: z.array(z.string()).describe('What else happens as a result of this action')
    }).describe('Expected outputs and side effects'),

    pseudoCodeSteps: z.array(z.object({
      stepNumber: z.number(),
      description: z.string(),
      operation: z.enum(['validate_input', 'database_read', 'database_write', 'api_call', 'computation', 'ai_processing', 'notification', 'logging']),
      inputFields: z.array(z.string()),
      outputFields: z.array(z.string()),
      errorHandling: z.string(),
      dependencies: z.array(z.number()).describe('Which previous steps this depends on')
    })).describe('Detailed step-by-step pseudo code with inputs/outputs'),

    uiComponents: z.array(z.object({
      componentName: z.string(),
      purpose: z.string(),
      inputType: z.enum(['text', 'number', 'email', 'password', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'file', 'database_record_selector', 'nested_object_editor', 'dynamic_array_editor']),
      linkedToParameter: z.string().describe('Which input parameter path this component collects (supports nested paths)'),
      validation: z.string().optional(),
      options: z.array(z.string()).optional().describe('For select/radio components'),
      databaseModel: z.string().optional().describe('For database record selectors'),
      required: z.boolean(),
      placeholder: z.string().optional(),
      helpText: z.string().optional(),
      nestedFields: z.array(z.string()).optional().describe('For nested object editors, which fields to include'),
      arrayItemSchema: z.record(z.any()).optional().describe('For array editors, schema of each item')
    })).describe('UI components needed to collect input'),

    aiProcessing: z.array(z.object({
      stepNumber: z.number(),
      purpose: z.string(),
      prompt: z.string(),
      inputFields: z.array(z.string()),
      outputFields: z.array(z.string()),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional()
    })).describe('AI processing steps if needed'),

    testScenarios: z.array(z.object({
      scenarioName: z.string(),
      description: z.string(),
      inputData: z.record(z.any()).describe('Test input data (can be nested JSON)'),
      expectedOutput: z.record(z.any()),
      expectedDatabaseChanges: z.array(z.object({
        model: z.string(),
        operation: z.string(),
        recordCount: z.number()
      })),
      shouldSucceed: z.boolean(),
      errorExpected: z.string().optional(),
      databaseIdsInInput: z.array(z.object({
        path: z.string().describe('JSON path to the database ID'),
        modelName: z.string().describe('Model this ID should reference'),
        value: z.any().describe('The ID value used in the test')
      })).describe('Database IDs present in the test input')
    })).describe('Test scenarios to validate the action')
  })
});

// Enhanced Action Code Generation Schema
export const enhancedActionCodeSchema = z.object({
  actionId: z.string(),
  actionName: z.string(),
  
  // Generated code components
  codeComponents: z.object({
    mainFunction: z.object({
      name: z.string(),
      parameterNames: z.array(z.string()).describe('Parameter names in order: MUST be ["database", "input", "member"] - these are the standard action parameters'),
      functionBody: z.string().describe('Function body string for new Function() constructor - should NOT include function declaration, just the body with return statement'),
      parameterDescriptions: z.object({
        database: z.string().describe('Description of how the database parameter is used'),
        input: z.string().describe('Description of the input parameter structure and usage'),
        member: z.string().describe('Description of how the member parameter is used')
      }).describe('Detailed descriptions of each standard parameter'),
      returnType: z.object({
        output: z.record(z.any()).describe('Action output data'),
        data: z.array(z.object({
          modelId: z.string(),
          createdRecords: z.array(z.record(z.any())).optional(),
          updatedRecords: z.array(z.record(z.any())).optional(),
          deletedRecords: z.array(z.string()).optional()
        })).describe('Database operation results')
      }),
      usage: z.object({
        example: z.string().describe('Example of how to call this function using new Function()'),
        parameterExample: z.record(z.any()).describe('Example parameter values')
      })
    }),

    validationFunctions: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      parameterNames: z.array(z.string()).describe('Parameter names for this validation function'),
      functionBody: z.string().describe('Function body string for new Function() constructor')
    })).describe('Input validation helper functions'),

    apiHelpers: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      apiName: z.string(),
      parameterNames: z.array(z.string()).describe('Parameter names for this API helper'),
      functionBody: z.string().describe('Function body string for new Function() constructor')
    })).describe('External API helper functions'),

    databaseHelpers: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      modelName: z.string(),
      operation: z.string(),
      parameterNames: z.array(z.string()).describe('Parameter names for this database helper'),
      functionBody: z.string().describe('Function body string for new Function() constructor')
    })).describe('Database operation helper functions'),

    testCases: z.array(z.object({
      name: z.string(),
      description: z.string(),
      testFunctionBody: z.string().describe('Test function body for new Function() constructor'),
      mockData: z.record(z.any()),
      expectedResult: z.record(z.any()),
      executionExample: z.string().describe('Example of how to run this test')
    })).describe('Generated test cases')
  }),

  // UI Component Code - Enhanced with detailed generation steps
  uiComponents: z.array(z.object({
    componentName: z.string().describe('Descriptive name for the component'),
    componentType: z.enum(['input-form', 'selection-interface', 'result-display', 'navigation', 'feedback']).describe('Type of UI component'),
    
    // Step 1: UX Analysis & Wireframing
    uxAnalysis: z.object({
      userJourney: z.string().describe('User journey and mental model for this component'),
      informationHierarchy: z.string().describe('Information hierarchy and progressive disclosure strategy'),
      interactionPatterns: z.array(z.string()).describe('Micro-interactions and animation patterns needed'),
      visualHierarchy: z.string().describe('Visual hierarchy and spacing strategy'),
      errorStates: z.array(z.string()).describe('Error states and edge cases to handle'),
      loadingStates: z.array(z.string()).describe('Loading states and feedback patterns')
    }).describe('Comprehensive UX analysis for the component'),

    // Step 2: Component Architecture Planning
    architecturePlan: z.object({
      componentComposition: z.string().describe('Component composition and reusability strategy'),
      stateManagement: z.string().describe('State management approach and hooks used'),
      propsInterface: z.record(z.any()).describe('TypeScript interface for component props'),
      validationStrategy: z.string().describe('Validation and error handling approach'),
      accessibilityFeatures: z.array(z.string()).describe('Accessibility considerations and ARIA labels'),
      performanceOptimizations: z.array(z.string()).describe('Performance optimizations implemented')
    }).describe('Component architecture and technical planning'),

    // Step 3: Visual Design System
    designSystem: z.object({
      colorPalette: z.object({
        primary: z.array(z.string()).describe('Primary green color variations'),
        secondary: z.array(z.string()).describe('Secondary color variations'),
        feedback: z.object({
          success: z.string(),
          error: z.string(),
          warning: z.string(),
          info: z.string()
        }).describe('Feedback color system')
      }).describe('Color palette with matrix green theme variations'),
      typography: z.object({
        headings: z.array(z.string()).describe('Typography scale for headings'),
        body: z.array(z.string()).describe('Body text typography classes'),
        mono: z.array(z.string()).describe('Monospace font classes for code/data')
      }).describe('Typography scale and hierarchy'),
      spacing: z.object({
        padding: z.array(z.string()).describe('Padding scale used'),
        margin: z.array(z.string()).describe('Margin scale used'),
        gap: z.array(z.string()).describe('Gap spacing for grids and flex')
      }).describe('Spacing system using Tailwind spacing'),
      effects: z.object({
        borderRadius: z.array(z.string()).describe('Border radius values'),
        shadows: z.array(z.string()).describe('Shadow effects used'),
        animations: z.array(z.string()).describe('Animation classes and timing')
      }).describe('Visual effects and animations'),
      interactiveStates: z.object({
        hover: z.array(z.string()).describe('Hover state styles'),
        focus: z.array(z.string()).describe('Focus state styles'),
        active: z.array(z.string()).describe('Active state styles'),
        disabled: z.array(z.string()).describe('Disabled state styles')
      }).describe('Interactive state styling')
    }).describe('Complete visual design system tokens'),

    // Step 4: Interaction Design
    interactionDesign: z.object({
      inputMethods: z.array(z.string()).describe('Input methods and validation feedback'),
      keyboardNavigation: z.string().describe('Keyboard navigation support'),
      touchInteractions: z.string().describe('Touch and mobile interactions'),
      loadingFeedback: z.string().describe('Loading states and progress feedback'),
      successStates: z.string().describe('Success animations and celebrations'),
      errorRecovery: z.string().describe('Error recovery patterns and guidance')
    }).describe('Comprehensive interaction design patterns'),

    // Step 5: Advanced UX Patterns Implementation
    advancedPatterns: z.object({
      inputEnhancements: z.array(z.string()).describe('Advanced input features like floating labels, autocomplete, etc.'),
      selectionInterfaces: z.array(z.string()).describe('Visual selection patterns like card grids, search, etc.'),
      layoutFeatures: z.array(z.string()).describe('Advanced layout features like collapsible sections, tabs, etc.'),
      feedbackComponents: z.array(z.string()).describe('Advanced feedback like toasts, progress bars, etc.')
    }).describe('Advanced UX patterns implemented'),

    // Component Implementation
    implementation: z.object({
      reactCode: z.string().describe('Complete React component code with TypeScript and advanced Tailwind CSS styling'),
      hookUsage: z.array(z.string()).describe('React hooks used and their purposes'),
      eventHandlers: z.array(z.string()).describe('Event handlers for user interactions'),
      validationLogic: z.string().describe('Client-side validation and error handling code'),
      responsiveDesign: z.string().describe('Responsive design implementation across breakpoints'),
      animationCode: z.string().describe('Animation and transition implementations')
    }).describe('Complete component implementation details'),

    // Usage and Integration
    usage: z.object({
      integrationExample: z.string().describe('Example of how to integrate this component'),
      propsExamples: z.record(z.any()).describe('Example prop values'),
      stateExamples: z.record(z.any()).describe('Example state management'),
      eventHandlingExamples: z.string().describe('Example event handling implementations')
    }).describe('Usage examples and integration guidance'),

    description: z.string().describe('High-level description of what this component does and its UX goals')
  })).describe('Generated React UI components with detailed UX/UI generation steps'),

  // Integration code
  integrationCode: z.object({
    actionRegistration: z.string().describe('Code to register the action in the system'),
    routeHandler: z.string().describe('API route handler code'),
    permissionChecks: z.string().describe('Role-based permission checking code'),
    errorHandling: z.string().describe('Comprehensive error handling code')
  }),

  // Execution instructions
  executionInstructions: z.object({
    mainFunctionUsage: z.string().describe('Complete example of how to execute the main function using new Function()'),
    parameterSetup: z.string().describe('How to set up the parameters (database, input, envs)'),
    errorHandling: z.string().describe('How to handle errors when executing the function'),
    testingInstructions: z.string().describe('How to test the generated functions')
  })
});

// Combined Enhanced Action Schema (Analysis + Code)
export const enhancedActionSchema = z.object({
  analysis: enhancedActionAnalysisSchema,
  codeGeneration: enhancedActionCodeSchema
}); 