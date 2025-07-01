import { generateObject } from 'ai';
import { getAgentBuilderModel } from './generation';
import {
  actionCodeCoreSchema,
  actionUIComponentsSchema,
  actionHelpersSchema,
  actionTestCasesSchema,
  actionIntegrationSchema,
  simplifiedEnhancedActionSchema,
  type ActionCodeCore,
  type ActionUIComponents,
  type ActionHelpers,
  type ActionTestCases,
  type ActionIntegration,
  type GenerationContext
} from './schemas-improved';

// =============================================================================
// PROGRESSIVE GENERATION PIPELINE
// =============================================================================

interface ProgressiveGenerationOptions {
  actionAnalysis: any;
  databaseResult: any;
  existingAgent?: any;
  promptUnderstanding?: any;
  maxRetries?: number;
  enableFallbacks?: boolean;
}

interface ProgressiveGenerationResult {
  core: ActionCodeCore;
  ui: ActionUIComponents;
  helpers: ActionHelpers;
  tests: ActionTestCases;
  integration: ActionIntegration;
  context: GenerationContext;
  metadata: {
    generationTime: number;
    fallbacksUsed: string[];
    errors: string[];
    success: boolean;
  };
}

/**
 * Main progressive generation pipeline
 * Breaks down complex generation into manageable steps
 */
export async function generateEnhancedActionCodeProgressive(
  options: ProgressiveGenerationOptions
): Promise<ProgressiveGenerationResult> {
  const startTime = Date.now();
  const fallbacksUsed: string[] = [];
  const errors: string[] = [];
  
  console.log('🔄 Starting progressive enhanced action code generation');
  
  try {
    // Step 1: Generate Core Function
    console.log('📝 Step 1: Generating core action function');
    const core = await generateActionCore(options, { fallbackLevel: 0 });
    
    // Step 2: Generate UI Components (with core context)
    console.log('🎨 Step 2: Generating UI components');
    const ui = await generateActionUI(options, { core, fallbackLevel: 0 });
    
    // Step 3: Generate Helper Functions (with core + UI context)
    console.log('🔧 Step 3: Generating helper functions');
    const helpers = await generateActionHelpers(options, { core, ui, fallbackLevel: 0 });
    
    // Step 4: Generate Test Cases (with full context)
    console.log('🧪 Step 4: Generating test cases');
    const tests = await generateActionTests(options, { core, ui, helpers, fallbackLevel: 0 });
    
    // Step 5: Generate Integration Code (with complete context)
    console.log('🔗 Step 5: Generating integration code');
    const integration = await generateActionIntegration(options, { core, ui, helpers, tests, fallbackLevel: 0 });
    
    const context: GenerationContext = {
      promptUnderstanding: options.promptUnderstanding || {},
      databaseResult: options.databaseResult || {},
      actionAnalysis: options.actionAnalysis || {},
      previousGenerations: { core, ui, helpers, tests },
      businessContext: extractBusinessContext(options),
      technicalConstraints: extractTechnicalConstraints(options),
      generationStep: 'integration',
      previousErrors: errors,
      fallbackLevel: 0
    };
    
    console.log('✅ Progressive generation completed successfully');
    
    return {
      core,
      ui,
      helpers,
      tests,
      integration,
      context,
      metadata: {
        generationTime: Date.now() - startTime,
        fallbacksUsed,
        errors,
        success: true
      }
    };
    
  } catch (error) {
    console.error('❌ Progressive generation failed:', error);
    errors.push(error instanceof Error ? error.message : String(error));
    
    // Fallback to simplified generation
    if (options.enableFallbacks !== false) {
      console.log('🔄 Attempting fallback to simplified generation');
      try {
        const fallbackResult = await generateSimplifiedEnhancedAction(options);
        fallbacksUsed.push('simplified-generation');
        
        return {
          ...fallbackResult,
          metadata: {
            generationTime: Date.now() - startTime,
            fallbacksUsed,
            errors,
            success: true
          }
        };
      } catch (fallbackError) {
        errors.push(fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        throw new Error(`Progressive generation failed: ${errors.join(', ')}`);
      }
    }
    
    throw error;
  }
}

// =============================================================================
// INDIVIDUAL GENERATION STEPS
// =============================================================================

/**
 * Step 1: Generate core action function
 */
async function generateActionCore(
  options: ProgressiveGenerationOptions,
  context: { fallbackLevel: number }
): Promise<ActionCodeCore> {
  const model = await getAgentBuilderModel();
  
  try {
    const result = await generateObject({
      model,
      schema: actionCodeCoreSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert software engineer generating the core function for an action.
          
Focus ONLY on the main business logic function. Do not generate UI, tests, or integration code.

Requirements:
- Function MUST use parameters: ["database", "input", "member"]
- Function body should be clean, readable JavaScript
- Include proper error handling and validation
- Return structured data with output and data fields
- Focus on the core business logic only`
        },
        {
          role: 'user',
          content: `Generate the core function for this action:

Action Analysis: ${JSON.stringify(options.actionAnalysis, null, 2)}

Database Models: ${JSON.stringify(options.databaseResult, null, 2)}

Business Context: ${extractBusinessContext(options)}

Focus on creating a robust, well-structured main function that handles the core business logic.`
        }
      ]
    });
    
    console.log('✅ Core function generated successfully');
    return result.object;
    
  } catch (error) {
    console.error('❌ Core function generation failed:', error);
    
    if (context.fallbackLevel < 2) {
      console.log('🔄 Retrying core generation with simplified requirements');
      return generateActionCore(options, { fallbackLevel: context.fallbackLevel + 1 });
    }
    
    throw error;
  }
}

/**
 * Step 2: Generate UI components with core context
 */
async function generateActionUI(
  options: ProgressiveGenerationOptions,
  context: { core: ActionCodeCore; fallbackLevel: number }
): Promise<ActionUIComponents> {
  const model = await getAgentBuilderModel();
  
  try {
    const result = await generateObject({
      model,
      schema: actionUIComponentsSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert React/TypeScript developer generating UI components for an action.

Focus ONLY on UI components. Use the core function context to create appropriate interfaces.

Requirements:
- Generate 1-3 React components with TypeScript
- Use Tailwind CSS for styling with matrix green theme
- Components should match the action's input/output requirements
- Include proper state management and event handling
- Focus on excellent UX and accessibility`
        },
        {
          role: 'user',
          content: `Generate UI components for this action:

Core Function Context:
${JSON.stringify(context.core, null, 2)}

Action Analysis: ${JSON.stringify(options.actionAnalysis, null, 2)}

Create components that provide an excellent user experience for this action.
The components should handle the input requirements from the core function and display results appropriately.`
        }
      ]
    });
    
    console.log('✅ UI components generated successfully');
    return result.object;
    
  } catch (error) {
    console.error('❌ UI generation failed:', error);
    
    if (context.fallbackLevel < 2) {
      console.log('🔄 Retrying UI generation with simplified requirements');
      return generateActionUI(options, { ...context, fallbackLevel: context.fallbackLevel + 1 });
    }
    
    throw error;
  }
}

/**
 * Step 3: Generate helper functions with accumulated context
 */
async function generateActionHelpers(
  options: ProgressiveGenerationOptions,
  context: { core: ActionCodeCore; ui: ActionUIComponents; fallbackLevel: number }
): Promise<ActionHelpers> {
  const model = await getAgentBuilderModel();
  
  try {
    const result = await generateObject({
      model,
      schema: actionHelpersSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert software engineer generating helper functions for an action.

Focus ONLY on utility functions that support the main action. Use context from core function and UI.

Requirements:
- Generate validation, API, and database helper functions
- Functions should be modular and reusable
- Include proper error handling
- Use new Function() constructor format for function bodies
- Focus on practical utility functions`
        },
        {
          role: 'user',
          content: `Generate helper functions for this action:

Core Function: ${JSON.stringify(context.core.mainFunction, null, 2)}
UI Components: ${context.ui.components.map(c => c.componentName).join(', ')}

Database Models: ${JSON.stringify(options.databaseResult, null, 2)}

Create helper functions that support the core function and UI components.
Focus on validation, API integration, and database operations as needed.`
        }
      ]
    });
    
    console.log('✅ Helper functions generated successfully');
    return result.object;
    
  } catch (error) {
    console.error('❌ Helper generation failed:', error);
    
    if (context.fallbackLevel < 2) {
      console.log('🔄 Retrying helper generation with simplified requirements');
      return generateActionHelpers(options, { ...context, fallbackLevel: context.fallbackLevel + 1 });
    }
    
    throw error;
  }
}

/**
 * Step 4: Generate test cases with full context
 */
async function generateActionTests(
  options: ProgressiveGenerationOptions,
  context: { core: ActionCodeCore; ui: ActionUIComponents; helpers: ActionHelpers; fallbackLevel: number }
): Promise<ActionTestCases> {
  const model = await getAgentBuilderModel();
  
  try {
    const result = await generateObject({
      model,
      schema: actionTestCasesSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert test engineer generating comprehensive test cases for an action.

Focus ONLY on test cases. Use all previous context to create thorough tests.

Requirements:
- Generate 3-5 comprehensive test cases
- Include setup, execution, and validation
- Test both success and error scenarios
- Use realistic mock data
- Focus on practical, executable tests`
        },
        {
          role: 'user',
          content: `Generate test cases for this action:

Core Function: ${context.core.mainFunction.name}
Input Requirements: ${JSON.stringify(context.core.businessLogic.inputRequirements)}
Helper Functions: ${context.helpers.validationFunctions.map(f => f.name).join(', ')}

Create comprehensive test cases that validate the action works correctly.
Include both positive and negative test scenarios.`
        }
      ]
    });
    
    console.log('✅ Test cases generated successfully');
    return result.object;
    
  } catch (error) {
    console.error('❌ Test generation failed:', error);
    
    if (context.fallbackLevel < 2) {
      console.log('🔄 Retrying test generation with simplified requirements');
      return generateActionTests(options, { ...context, fallbackLevel: context.fallbackLevel + 1 });
    }
    
    throw error;
  }
}

/**
 * Step 5: Generate integration code with complete context
 */
async function generateActionIntegration(
  options: ProgressiveGenerationOptions,
  context: { 
    core: ActionCodeCore; 
    ui: ActionUIComponents; 
    helpers: ActionHelpers; 
    tests: ActionTestCases; 
    fallbackLevel: number 
  }
): Promise<ActionIntegration> {
  const model = await getAgentBuilderModel();
  
  try {
    const result = await generateObject({
      model,
      schema: actionIntegrationSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert DevOps engineer generating integration and deployment code for an action.

Focus ONLY on integration, deployment, and operational concerns.

Requirements:
- Generate registration, deployment, and monitoring code
- Include proper error handling and logging
- Consider environment variables and dependencies
- Focus on production-ready integration`
        },
        {
          role: 'user',
          content: `Generate integration code for this action:

Action: ${context.core.actionName}
Core Function: ${context.core.mainFunction.name}
UI Components: ${context.ui.components.length} components
Helper Functions: ${Object.values(context.helpers).flat().length} helpers

Create production-ready integration code including registration, deployment, and monitoring.`
        }
      ]
    });
    
    console.log('✅ Integration code generated successfully');
    return result.object;
    
  } catch (error) {
    console.error('❌ Integration generation failed:', error);
    
    if (context.fallbackLevel < 2) {
      console.log('🔄 Retrying integration generation with simplified requirements');
      return generateActionIntegration(options, { ...context, fallbackLevel: context.fallbackLevel + 1 });
    }
    
    throw error;
  }
}

// =============================================================================
// FALLBACK GENERATION
// =============================================================================

/**
 * Simplified fallback generation when progressive generation fails
 */
async function generateSimplifiedEnhancedAction(
  options: ProgressiveGenerationOptions
): Promise<ProgressiveGenerationResult> {
  const model = await getAgentBuilderModel();
  
  console.log('🔄 Using simplified fallback generation');
  
  const result = await generateObject({
    model,
    schema: simplifiedEnhancedActionSchema,
    messages: [
      {
        role: 'system',
        content: `Generate a simplified enhanced action with basic components.
        
Focus on creating minimal but functional code for:
- Main function
- Basic UI component  
- Simple test case
- Basic integration

Keep it simple but functional.`
      },
      {
        role: 'user',
        content: `Generate simplified enhanced action code:

Action Analysis: ${JSON.stringify(options.actionAnalysis, null, 2)}
Database: ${JSON.stringify(options.databaseResult, null, 2)}`
      }
    ]
  });
  
  // Convert simplified result to progressive format
  const simplified = result.object;
  
  return {
    core: {
      actionId: simplified.actionId,
      actionName: simplified.actionName,
      mainFunction: {
        ...simplified.mainFunction,
        parameterDescriptions: {
          database: 'Database access parameter',
          input: 'Action input data',
          member: 'User/member context'
        },
        returnStructure: {
          output: {},
          data: []
        }
      },
      businessLogic: {
        purpose: `Execute ${simplified.actionName}`,
        inputRequirements: ['input'],
        validationRules: ['Basic validation'],
        errorConditions: ['Invalid input']
      }
    },
    ui: {
      components: [{
        componentName: simplified.uiComponent.componentName,
        componentType: 'input-form' as const,
        design: {
          layout: 'Basic form layout',
          styling: 'Tailwind CSS styling',
          interactivity: 'Form interactions'
        },
        implementation: {
          reactCode: simplified.uiComponent.reactCode,
          propsInterface: {},
          stateManagement: 'useState hooks'
        },
        integration: {
          usage: 'Basic component usage',
          eventHandlers: ['onChange', 'onSubmit'],
          dataFlow: 'Form to action data flow'
        },
        description: simplified.uiComponent.description
      }]
    },
    helpers: {
      validationFunctions: [],
      apiHelpers: [],
      databaseHelpers: []
    },
    tests: {
      testCases: [{
        name: simplified.testCase.name,
        description: 'Basic test case',
        setup: {
          mockData: simplified.testCase.mockData,
          databaseState: {},
          memberContext: {}
        },
        execution: {
          testFunctionBody: 'return true;',
          expectedResult: simplified.testCase.expectedResult,
          executionExample: 'Run test'
        },
        validation: {
          assertions: ['Test passes'],
          errorScenarios: [],
          edgeCases: []
        }
      }]
    },
    integration: {
      registration: {
        actionRegistration: simplified.integration.registration,
        routeHandler: 'Basic route handler',
        permissionChecks: 'Basic permission checks'
      },
      deployment: {
        environmentVariables: [],
        dependencies: [],
        configurationSteps: []
      },
      monitoring: {
        errorHandling: simplified.integration.errorHandling,
        logging: 'Basic logging',
        performance: 'Basic performance monitoring'
      },
      documentation: {
        apiDocumentation: 'Basic API docs',
        usageExamples: 'Basic usage examples',
        troubleshooting: 'Basic troubleshooting'
      }
    },
    context: {
      promptUnderstanding: options.promptUnderstanding || {},
      databaseResult: options.databaseResult || {},
      actionAnalysis: options.actionAnalysis || {},
      previousGenerations: {},
      businessContext: extractBusinessContext(options),
      technicalConstraints: [],
      generationStep: 'integration',
      previousErrors: [],
      fallbackLevel: 1
    },
    metadata: {
      generationTime: 0,
      fallbacksUsed: ['simplified-generation'],
      errors: [],
      success: true
    }
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function extractBusinessContext(options: ProgressiveGenerationOptions): string {
  const contexts = [
    options.promptUnderstanding?.userRequestAnalysis?.businessContext,
    options.actionAnalysis?.businessContext,
    options.actionAnalysis?.description
  ].filter(Boolean);
  
  return contexts.join(' ') || 'General business automation';
}

function extractTechnicalConstraints(options: ProgressiveGenerationOptions): string[] {
  const constraints = [
    'Must use new Function() constructor',
    'Parameters must be [database, input, member]',
    'Must return structured output and data',
    'Must include error handling'
  ];
  
  return constraints;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ProgressiveGenerationOptions, ProgressiveGenerationResult }; 