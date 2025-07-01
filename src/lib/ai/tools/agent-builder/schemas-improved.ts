import { z } from 'zod';

// =============================================================================
// IMPROVED SCHEMAS - Decomposed for Better AI Generation Success
// =============================================================================

// Core Action Function Schema (Step 1)
export const actionCodeCoreSchema = z.object({
  actionId: z.string().describe('Unique identifier for the action'),
  actionName: z.string().describe('Human-readable name for the action'),
  
  mainFunction: z.object({
    name: z.string().describe('Function name'),
    parameterNames: z.array(z.string()).describe('MUST be ["database", "input", "member"] - standard action parameters'),
    functionBody: z.string().describe('Function body string for new Function() constructor - just the body with return statement'),
    
    parameterDescriptions: z.object({
      database: z.string().describe('How the database parameter is used'),
      input: z.string().describe('Input parameter structure and usage'),
      member: z.string().describe('How the member parameter is used')
    }),
    
    returnStructure: z.object({
      output: z.record(z.any()).describe('Action output data structure'),
      data: z.array(z.object({
        modelId: z.string(),
        operation: z.enum(['create', 'update', 'delete']),
        recordCount: z.number()
      })).describe('Database operation results summary')
    })
  }).describe('Main action function definition'),

  businessLogic: z.object({
    purpose: z.string().describe('What this action accomplishes'),
    inputRequirements: z.array(z.string()).describe('Required input fields'),
    validationRules: z.array(z.string()).describe('Input validation rules'),
    errorConditions: z.array(z.string()).describe('Possible error scenarios')
  }).describe('Business logic and requirements')
});

// UI Components Schema (Step 2) 
export const actionUIComponentsSchema = z.object({
  components: z.array(z.object({
    componentName: z.string().describe('Descriptive component name'),
    componentType: z.enum(['input-form', 'selection-interface', 'result-display']).describe('UI component type'),
    
    design: z.object({
      layout: z.string().describe('Layout strategy and structure'),
      styling: z.string().describe('Tailwind CSS classes and styling approach'),
      interactivity: z.string().describe('User interaction patterns')
    }),
    
    implementation: z.object({
      reactCode: z.string().describe('Complete React component code with TypeScript'),
      propsInterface: z.record(z.any()).describe('TypeScript props interface'),
      stateManagement: z.string().describe('State management approach')
    }),
    
    integration: z.object({
      usage: z.string().describe('How to use this component'),
      eventHandlers: z.array(z.string()).describe('Event handlers needed'),
      dataFlow: z.string().describe('How data flows through the component')
    }),
    
    description: z.string().describe('Component purpose and UX goals')
  })).describe('UI components for the action')
});

// Helper Functions Schema (Step 3)
export const actionHelpersSchema = z.object({
  validationFunctions: z.array(z.object({
    name: z.string().describe('Validation function name'),
    purpose: z.string().describe('What this validates'),
    parameterNames: z.array(z.string()).describe('Function parameters'),
    functionBody: z.string().describe('Function body for new Function() constructor'),
    usage: z.string().describe('How to use this validation function')
  })).describe('Input validation helper functions'),

  apiHelpers: z.array(z.object({
    name: z.string().describe('API helper function name'),
    purpose: z.string().describe('What this helper does'),
    apiName: z.string().describe('External API being called'),
    parameterNames: z.array(z.string()).describe('Function parameters'),
    functionBody: z.string().describe('Function body for new Function() constructor'),
    errorHandling: z.string().describe('Error handling strategy')
  })).describe('External API helper functions'),

  databaseHelpers: z.array(z.object({
    name: z.string().describe('Database helper function name'),
    purpose: z.string().describe('Database operation purpose'),
    modelName: z.string().describe('Target database model'),
    operation: z.enum(['create', 'read', 'update', 'delete']).describe('CRUD operation'),
    parameterNames: z.array(z.string()).describe('Function parameters'),
    functionBody: z.string().describe('Function body for new Function() constructor'),
    queryStrategy: z.string().describe('Database query approach')
  })).describe('Database operation helper functions')
});

// Test Cases Schema (Step 4)
export const actionTestCasesSchema = z.object({
  testCases: z.array(z.object({
    name: z.string().describe('Test case name'),
    description: z.string().describe('What this test validates'),
    
    setup: z.object({
      mockData: z.record(z.any()).describe('Mock data for the test'),
      databaseState: z.record(z.any()).describe('Required database state'),
      memberContext: z.record(z.any()).describe('Member/user context for test')
    }),
    
    execution: z.object({
      testFunctionBody: z.string().describe('Test function body for new Function() constructor'),
      expectedResult: z.record(z.any()).describe('Expected test outcome'),
      executionExample: z.string().describe('How to run this test')
    }),
    
    validation: z.object({
      assertions: z.array(z.string()).describe('What to assert in the test'),
      errorScenarios: z.array(z.string()).describe('Error conditions to test'),
      edgeCases: z.array(z.string()).describe('Edge cases covered')
    })
  })).describe('Comprehensive test cases')
});

// Integration Schema (Step 5)
export const actionIntegrationSchema = z.object({
  registration: z.object({
    actionRegistration: z.string().describe('Code to register action in system'),
    routeHandler: z.string().describe('API route handler implementation'),
    permissionChecks: z.string().describe('Role-based permission checking')
  }),
  
  deployment: z.object({
    environmentVariables: z.array(z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
      defaultValue: z.string().optional()
    })).describe('Required environment variables'),
    
    dependencies: z.array(z.string()).describe('External dependencies needed'),
    configurationSteps: z.array(z.string()).describe('Setup and configuration steps')
  }),
  
  monitoring: z.object({
    errorHandling: z.string().describe('Comprehensive error handling strategy'),
    logging: z.string().describe('Logging and monitoring approach'),
    performance: z.string().describe('Performance considerations')
  }),
  
  documentation: z.object({
    apiDocumentation: z.string().describe('API endpoint documentation'),
    usageExamples: z.string().describe('Usage examples and integration guide'),
    troubleshooting: z.string().describe('Common issues and solutions')
  })
});

// =============================================================================
// PROGRESSIVE GENERATION CONTEXT
// =============================================================================

export const generationContextSchema = z.object({
  // Core context from previous steps
  promptUnderstanding: z.record(z.any()).describe('User request analysis'),
  databaseResult: z.record(z.any()).describe('Generated database schema'),
  actionAnalysis: z.record(z.any()).describe('Action analysis results'),
  
  // Progressive context accumulation
  previousGenerations: z.object({
    core: z.any().optional().describe('Generated core function'),
    ui: z.any().optional().describe('Generated UI components'),
    helpers: z.any().optional().describe('Generated helper functions'),
    tests: z.any().optional().describe('Generated test cases')
  }),
  
  // Business and technical context
  businessContext: z.string().describe('Business domain and requirements'),
  technicalConstraints: z.array(z.string()).describe('Technical limitations and requirements'),
  
  // Generation metadata
  generationStep: z.enum(['core', 'ui', 'helpers', 'tests', 'integration']).describe('Current generation step'),
  previousErrors: z.array(z.string()).describe('Errors from previous attempts'),
  fallbackLevel: z.number().describe('Current fallback level (0 = primary, 1+ = fallback)')
});

// =============================================================================
// COMBINED SCHEMAS FOR BACKWARD COMPATIBILITY
// =============================================================================

// Progressive Enhanced Action Schema
export const progressiveEnhancedActionSchema = z.object({
  core: actionCodeCoreSchema,
  ui: actionUIComponentsSchema,
  helpers: actionHelpersSchema,
  tests: actionTestCasesSchema,
  integration: actionIntegrationSchema,
  context: generationContextSchema
});

// Simplified Enhanced Action Schema for fallback
export const simplifiedEnhancedActionSchema = z.object({
  actionId: z.string(),
  actionName: z.string(),
  
  mainFunction: z.object({
    name: z.string(),
    parameterNames: z.array(z.string()),
    functionBody: z.string()
  }),
  
  uiComponent: z.object({
    componentName: z.string(),
    reactCode: z.string(),
    description: z.string()
  }),
  
  testCase: z.object({
    name: z.string(),
    mockData: z.record(z.any()),
    expectedResult: z.record(z.any())
  }),
  
  integration: z.object({
    registration: z.string(),
    errorHandling: z.string()
  })
});

// =============================================================================
// GENERATION STEP SCHEMAS
// =============================================================================

export const generationStepSchemas = {
  core: actionCodeCoreSchema,
  ui: actionUIComponentsSchema,
  helpers: actionHelpersSchema,
  tests: actionTestCasesSchema,
  integration: actionIntegrationSchema,
  simplified: simplifiedEnhancedActionSchema
} as const;

export type GenerationStep = keyof typeof generationStepSchemas;
export type ActionCodeCore = z.infer<typeof actionCodeCoreSchema>;
export type ActionUIComponents = z.infer<typeof actionUIComponentsSchema>;
export type ActionHelpers = z.infer<typeof actionHelpersSchema>;
export type ActionTestCases = z.infer<typeof actionTestCasesSchema>;
export type ActionIntegration = z.infer<typeof actionIntegrationSchema>;
export type GenerationContext = z.infer<typeof generationContextSchema>; 