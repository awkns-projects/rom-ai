import { generateActions, generatePrismaActions } from '../generation';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import type { AgentAction, AgentData, AgentModel } from '../types';
import type { PseudoCodeStep, StepField } from '@/artifacts/agent/types/action';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';

/**
 * STEP 2: Action Generation & API Design
 * 
 * Generate actions, endpoints, and API specifications based on database models and analysis.
 * This step creates the functional capabilities for the agent system with complete executable code.
 */

export interface Step2Input {
  step0Analysis: Step0Output;
  databaseGeneration: Step1Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step2Output {
  actions: AgentAction[];
  implementationNotes: string;
}

// Schema for step-based code generation
const StepCodeSchema = z.object({
  functionCode: z.string().describe('Complete step function code with real library integration'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean()
  })).describe('Environment variables needed for this step'),
  testCode: z.string().describe('Test code for this step'),
  testCases: z.array(z.object({
    name: z.string(),
    input: z.record(z.any()),
    expectedOutput: z.record(z.any()),
    expectedChanges: z.array(z.object({
      type: z.enum(['database_create', 'database_update', 'database_read', 'database_delete', 'external_api_read', 'external_api_write', 'ai_analysis', 'ai_generation']),
      description: z.string(),
      model: z.string().optional(),
      operation: z.string().optional(),
      recordCount: z.number().optional()
    })).optional()
  })).describe('Test cases for this step')
});

const MainCodeSchema = z.object({
  mainFunctionCode: z.string().describe('Complete main composition function with proper parameter mapping'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean()
  })).describe('All environment variables needed'),
  executionInstructions: z.string().describe('Instructions for executing this action')
});

/**
 * Generate step function code with real library integration
 */
async function generateStepFunction(
  step: PseudoCodeStep,
  stepIndex: number,
  availableModels: AgentModel[],
  businessContext?: string
): Promise<z.infer<typeof StepCodeSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `You are an expert JavaScript developer generating step function code with REAL library integration.

STEP DETAILS:
- Type: ${step.type}
- Description: ${step.description}
- Input Fields: ${step.inputFields?.map((f: StepField) => `${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`).join(', ')}
- Output Fields: ${step.outputFields?.map((f: StepField) => `${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`).join(', ')}

AVAILABLE MODELS: ${availableModels.map(m => m.name).join(', ')}
BUSINESS CONTEXT: ${businessContext || 'General business operations'}

CRITICAL EXECUTION REQUIREMENTS - USE REAL LIBRARIES:

1. **Function Signature**: Use the EXACT signature expected by execution system:
   \`\`\`javascript
   async function step${stepIndex + 1}({prisma, ai, openai, xai, replicate, input, env}) {
     // Implementation here
     return {
       success: true,
       output: { /* step outputs */ },
       changes: [{ /* database/api changes */ }]
     };
   }
   \`\`\`

2. **Database Operations**: Use REAL Prisma client calls:
   \`\`\`javascript
   // Database Read
   const users = await prisma.user.findMany({
     where: { status: 'active' },
     include: { posts: true }
   });
   
   // Database Create  
   const newUser = await prisma.user.create({
     data: {
       name: input.name,
       email: input.email,
       status: 'active'
     }
   });
   
   // Database Update
   const updatedUser = await prisma.user.update({
     where: { id: input.userId },
     data: { lastLoginAt: new Date() }
   });
   \`\`\`

3. **AI Operations**: Use REAL AI SDK calls:
   \`\`\`javascript
   // For structured analysis using generateObject
   const analysis = await ai.generateObject({
     schema: z.object({
       sentiment: z.enum(['positive', 'negative', 'neutral']),
       confidence: z.number(),
       keywords: z.array(z.string())
     }),
     messages: [
       { role: 'system', content: 'Analyze sentiment' },
       { role: 'user', content: input.text }
     ]
   });
   
   // For content generation using Replicate
   const generated = await replicate.run(
     "replicate/model-name",
     { input: { prompt: input.prompt } }
   );
   \`\`\`

4. **External API Operations**: Use REAL fetch calls:
   \`\`\`javascript
   const response = await fetch(\`https://api.service.com/endpoint\`, {
     method: 'POST',
     headers: {
       'Authorization': \`Bearer \${env.API_KEY}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(input.data)
   });
   const result = await response.json();
   \`\`\`

5. **Return Format**: MUST return exactly this structure:
   \`\`\`javascript
   return {
     success: true,
     output: {
               // All step output fields go here
        ${step.outputFields?.map((f: StepField) => `${f.name}: /* actual value */`).join(',\n       ')}
     },
     changes: [{
       type: '${step.type.toLowerCase().replace(' ', '_')}',
       description: '${step.description}',
       model: '${availableModels[0]?.name || 'Model'}', // if database operation
       operation: 'create|read|update|delete', // if database operation
       recordCount: 1 // number of records affected
     }]
   };
   \`\`\`

Generate COMPLETE, EXECUTABLE JavaScript code that uses real libraries and follows the exact function signature.`;

  const result = await generateObject({
    model,
    schema: StepCodeSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate step function code for: ${step.description}`
      }
    ],
    temperature: 0.1
  });

  return result.object;
}

/**
 * Generate main composition function with real parameter mapping
 */
async function generateMainFunction(
  name: string,
  description: string,
  steps: PseudoCodeStep[],
  availableModels: AgentModel[],
  businessContext?: string
): Promise<z.infer<typeof MainCodeSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `Generate a main action function that orchestrates all step functions with REAL execution context.

ACTION DETAILS:
- Name: ${name}
- Description: ${description}
- Steps: ${steps.length} steps to execute in order

STEP SUMMARY:
${steps.map((step, index) => `${index + 1}. ${step.type}: ${step.description}`).join('\n')}

CRITICAL EXECUTION REQUIREMENTS:

1. **Function Signature**: Use EXACT signature expected by execution system:
   \`\`\`javascript
   async function execute${name.replace(/\s+/g, '')}({prisma, ai, openai, xai, replicate, input, env}) {
     // Implementation here
     return {
       output: { /* final outputs */ },
       data: [{ /* all database changes */ }]
     };
   }
   \`\`\`

2. **Parameter Mapping**: Map execution context to step functions:
   \`\`\`javascript
   // Create AI interface for structured operations
   const aiInterface = {
     generateObject: async (config) => {
       return await ai.generateObject(config);
     }
   };
   
   // Execute each step with proper context
   const step1Result = await step1({
     prisma,
     ai: aiInterface,
     openai,
     xai,
     replicate,
     input,
     env
   });
   \`\`\`

3. **Error Handling**: Include comprehensive error handling:
   \`\`\`javascript
   try {
     // Step execution
   } catch (error) {
     console.error('Step failed:', error);
     throw new Error(\`Action failed: \${error.message}\`);
   }
   \`\`\`

4. **Return Format**: MUST return exactly this structure:
   \`\`\`javascript
   return {
     output: {
       // All final outputs from last step or combined
       success: true,
       message: 'Action completed successfully',
       // ... other outputs
     },
     data: [
       // All database changes from all steps
       ...step1Result.changes,
       ...step2Result.changes,
       // etc.
     ]
   };
   \`\`\`

Generate COMPLETE, EXECUTABLE composition function with real library integration.`;

  const result = await generateObject({
    model,
    schema: MainCodeSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate main function for action: ${name}`
      }
    ],
    temperature: 0.1
  });

  return result.object;
}

/**
 * Create a minimal PromptUnderstanding structure for action generation
 * This provides only the essential context needed by generatePrismaActions
 */
function createActionPromptUnderstanding(step0: Step0Output): any {
  const phaseA = step0.phaseAAnalysis;
  
  return {
    workflowAutomationNeeds: {
      // Minimal required structure - generatePrismaActions mainly uses this for context
      requiredActions: [], // Not duplicating Step 0 actions - they're available separately
      businessRules: [],
      oneTimeActions: phaseA?.semanticRequirements.manualActions.map(action => ({
        name: action.name,
        purpose: action.purpose,
        role: action.userRole,
        triggerType: 'manual' as const,
        priority: 'medium' as const,
        complexity: 'moderate' as const,
        businessValue: action.businessValue,
        estimatedSteps: [],
        dataRequirements: action.requiredData,
        expectedOutput: action.purpose
      })) || [],
      recurringSchedules: [],
      businessProcesses: []
    },
    featureImagination: {
      coreFeatures: phaseA?.featureRequirements.coreFeatures || [],
      additionalFeatures: phaseA?.featureRequirements.additionalFeatures || [],
      userExperience: phaseA?.featureRequirements.userExperience || [],
      businessRules: phaseA?.featureRequirements.businessRules || [],
      integrations: phaseA?.featureRequirements.integrations || []
    }
  };
}

/**
 * Execute Step 2: Action Generation with Complete Code Generation
 */
export async function executeStep2ActionGeneration(
  input: Step2Input
): Promise<Step2Output> {
  console.log('🚀 STEP 2: Starting action generation with complete code generation...');
  
  const { step0Analysis, databaseGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    console.log('🎯 Generating Prisma actions with Step 0 context...');
    console.log(`📊 Step 0 Action Analysis: ${step0Analysis.actions.filter(a => a.operation === 'create').length} new actions, ${step0Analysis.actions.filter(a => a.operation === 'update').length} action updates`);
    console.log(`🔄 Action Types: ${step0Analysis.actions.filter(a => a.type === 'query').length} queries, ${step0Analysis.actions.filter(a => a.type === 'mutation').length} mutations`);

    // Generate base actions first
    const actionsResult = await generatePrismaActions({
      step0Analysis,
      existingAgent
    });

    // Now generate complete executable code for each action
    console.log('⚡ Generating step-based executable code for each action...');
    
    const actionsWithCode = await Promise.all(
      actionsResult.actions.map(async (action) => {
        try {
          // Generate pseudo steps if not present
          if (!action.pseudoSteps || action.pseudoSteps.length === 0) {
            console.log(`📝 Generating pseudo steps for action: ${action.name}`);
            // Generate basic pseudo steps structure for this action
            action.pseudoSteps = [{
              id: `step_${Date.now()}`,
              type: action.type === 'query' ? 'Database read' : 'Database create',
              description: action.description || `Execute ${action.name}`,
              inputFields: [{
                id: `field_${Date.now()}`,
                name: 'input',
                type: 'String',
                kind: 'scalar' as const,
                required: true,
                list: false,
                description: 'Action input data'
              }],
              outputFields: [{
                id: `field_${Date.now() + 1}`,
                name: 'result',
                type: 'String',
                kind: 'scalar' as const,
                required: true,
                list: false,
                description: 'Action result data'
              }]
            }];
          }

          // Generate step functions
          const stepFunctions = await Promise.all(
            action.pseudoSteps.map((step: PseudoCodeStep, index: number) => 
              generateStepFunction(step, index, databaseGeneration.models, step0Analysis.domain)
            )
          );

          // Generate main composition function
          const mainFunction = await generateMainFunction(
            action.name,
            action.description || '',
            action.pseudoSteps,
            databaseGeneration.models,
            step0Analysis.domain
          );

          // Combine all code
          const stepFunctionCodes = stepFunctions.map((sf: any) => sf.functionCode).join('\n\n');
          const allCode = `${stepFunctionCodes}\n\n${mainFunction.mainFunctionCode}`;

          // Combine all environment variables
          const allEnvVars = [
            ...stepFunctions.flatMap((sf: any) => sf.envVars),
            ...mainFunction.envVars
          ].reduce((acc: any[], env: any) => {
            // Deduplicate by name
            if (!acc.find((e: any) => e.name === env.name)) {
              acc.push(env);
            }
            return acc;
          }, [] as any[]);

          return {
            ...action,
            // Store step functions for individual execution if needed
            stepFunctions: stepFunctions.map((sf: any) => sf.functionCode),
            // Update execute block with complete code
            execute: {
              type: 'code' as const,
              code: {
                script: allCode,
                envVars: allEnvVars
              }
            },
            // Store execution instructions
            executionInstructions: mainFunction.executionInstructions
          };
        } catch (error) {
          console.error(`Error generating code for action ${action.name}:`, error);
          return action; // Return original action if code generation fails
        }
      })
    );

    const result: Step2Output = {
      actions: actionsWithCode,
      implementationNotes: `Generated ${actionsWithCode.length} Prisma actions with complete executable code for ${step0Analysis.domain}. ` +
        `Step 0 identified ${step0Analysis.actions.length} required actions with ${step0Analysis.actions.filter(a => a.operation === 'create').length} new and ${step0Analysis.actions.filter(a => a.operation === 'update').length} updates. ` +
        `Each action includes step functions and main composition code with real library integration.`
    };

    console.log('✅ STEP 2: Action generation with complete code completed successfully');
    console.log(`⚡ Action Summary:
- Generated Actions: ${result.actions.length}
- Actions with Executable Code: ${result.actions.filter(a => a.execute?.code?.script).length}
- Step 0 Action Context: ${step0Analysis.actions.length} total (${step0Analysis.actions.filter(a => a.operation === 'create').length} new, ${step0Analysis.actions.filter(a => a.operation === 'update').length} updates)
- Real Library Integration: Prisma, AI SDK, Replicate, External APIs`);

    return result;
  } catch (error) {
    console.error('❌ STEP 2: Action generation failed:', error);
    throw new Error(`Step 2 action generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 2 output for completeness and quality
 */
export function validateStep2Output(output: Step2Output): boolean {
  try {
    if (!output.actions.length) {
      console.warn('⚠️ No actions generated');
      return false;
    }
    
    // Check that actions have proper structure
    const invalidActions = output.actions.filter(a => 
      !a.name || !a.description || !a.type
    );
    
    if (invalidActions.length > 0) {
      console.warn(`⚠️ Invalid actions found: ${invalidActions.length}`);
      return false;
    }
    
    console.log('✅ Step 2 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 2 output validation failed:', error);
    return false;
  }
}

/**
 * Extract action insights for downstream steps
 */
export function extractActionInsights(output: Step2Output) {
  return {
    actionCount: output.actions.length,
    hasCustomCode: output.actions.some(a => a.execute?.code),
    hasPromptExecution: output.actions.some(a => a.execute?.prompt),
    primaryActionTypes: [...new Set(output.actions.map(a => a.type))]
  };
} 