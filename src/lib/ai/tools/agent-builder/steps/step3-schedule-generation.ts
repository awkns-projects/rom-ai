import { generateSchedules } from '../generation';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import type { AgentSchedule, AgentData, AgentModel } from '../types';
import type { PseudoCodeStep, StepField } from '@/artifacts/agent/types/action';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';
import type { Step2Output } from './step2-action-generation';

/**
 * STEP 3: Schedule Generation & Automation Design
 * 
 * Generate schedules, automation rules, and recurring processes based on database models and actions.
 * This step creates the automation capabilities for the agent system with complete executable code.
 */

export interface Step3Input {
  step0Analysis: Step0Output;
  databaseGeneration: Step1Output;
  actionGeneration: Step2Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step3Output {
  schedules: AgentSchedule[];
}

// Schema for step-based code generation (same as step2)
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
  mainFunctionCode: z.string().describe('Complete main composition function for schedule execution'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean()
  })).describe('All environment variables needed'),
  executionInstructions: z.string().describe('Instructions for executing this schedule')
});

/**
 * Generate step function code for schedules with real library integration
 */
async function generateScheduleStepFunction(
  step: PseudoCodeStep,
  stepIndex: number,
  availableModels: AgentModel[],
  businessContext?: string
): Promise<z.infer<typeof StepCodeSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `You are an expert JavaScript developer generating schedule step function code with REAL library integration.

STEP DETAILS:
- Type: ${step.type}
- Description: ${step.description}
- Input Fields: ${step.inputFields?.map((f: StepField) => `${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`).join(', ')}
- Output Fields: ${step.outputFields?.map((f: StepField) => `${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`).join(', ')}

AVAILABLE MODELS: ${availableModels.map(m => m.name).join(', ')}
BUSINESS CONTEXT: ${businessContext || 'General business automation'}

CRITICAL EXECUTION REQUIREMENTS - USE REAL LIBRARIES FOR SCHEDULES:

1. **Function Signature**: Use the EXACT signature expected by schedule execution system:
   \`\`\`javascript
   async function scheduleStep${stepIndex + 1}({prisma, ai, openai, xai, replicate, input, env}) {
     // Implementation here
     return {
       success: true,
       output: { /* step outputs */ },
       changes: [{ /* database/api changes */ }]
     };
   }
   \`\`\`

2. **Database Operations**: Use REAL Prisma client calls for automation:
   \`\`\`javascript
   // Schedule-specific database operations
   const overdueRecords = await prisma.task.findMany({
     where: { 
       dueDate: { lt: new Date() },
       status: 'pending'
     },
     include: { assignee: true }
   });
   
   // Bulk updates for automation
   const updated = await prisma.task.updateMany({
     where: { status: 'pending', dueDate: { lt: new Date() } },
     data: { status: 'overdue', updatedAt: new Date() }
   });
   \`\`\`

3. **AI Operations**: Use REAL AI SDK for automation analysis:
   \`\`\`javascript
   // Smart automation decisions
   const automation = await ai.generateObject({
     schema: z.object({
       shouldTrigger: z.boolean(),
       priority: z.enum(['low', 'medium', 'high', 'urgent']),
       actions: z.array(z.string()),
       reasoning: z.string()
     }),
     messages: [
       { role: 'system', content: 'Analyze if automation should trigger' },
       { role: 'user', content: \`Data: \${JSON.stringify(input.data)}\` }
     ]
   });
   \`\`\`

4. **External API Operations**: Use REAL fetch for integrations:
   \`\`\`javascript
   // Send notifications, sync data, etc.
   const notification = await fetch(\`https://api.slack.com/api/chat.postMessage\`, {
     method: 'POST',
     headers: {
       'Authorization': \`Bearer \${env.SLACK_TOKEN}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       channel: env.SLACK_CHANNEL,
       text: \`Automated update: \${input.message}\`
     })
   });
   \`\`\`

5. **Return Format**: MUST return exactly this structure for schedules:
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

Generate COMPLETE, EXECUTABLE JavaScript code for schedule automation with real library integration.`;

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
        content: `Generate schedule step function code for: ${step.description}`
      }
    ],
    temperature: 0.1
  });

  return result.object;
}

/**
 * Generate main composition function for schedule execution
 */
async function generateScheduleMainFunction(
  name: string,
  description: string,
  steps: PseudoCodeStep[],
  frequency: string,
  availableModels: AgentModel[],
  businessContext?: string
): Promise<z.infer<typeof MainCodeSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `Generate a main schedule function that orchestrates all step functions with REAL execution context for automation.

SCHEDULE DETAILS:
- Name: ${name}
- Description: ${description}
- Frequency: ${frequency}
- Steps: ${steps.length} steps to execute in order

STEP SUMMARY:
${steps.map((step, index) => `${index + 1}. ${step.type}: ${step.description}`).join('\n')}

CRITICAL EXECUTION REQUIREMENTS FOR SCHEDULES:

1. **Function Signature**: Use EXACT signature expected by schedule execution system:
   \`\`\`javascript
   async function execute${name.replace(/\s+/g, '')}Schedule({prisma, ai, openai, xai, replicate, input, env}) {
     // Implementation here
     return {
       output: { /* final outputs */ },
       data: [{ /* all database changes */ }],
       nextRun: new Date(Date.now() + getNextInterval('${frequency}')).toISOString()
     };
   }
   \`\`\`

2. **Parameter Mapping for Automation**: Map execution context to schedule steps:
   \`\`\`javascript
   // Create AI interface for automation decisions
   const aiInterface = {
     generateObject: async (config) => {
       return await ai.generateObject(config);
     }
   };
   
   // Execute each automation step with proper context
   const step1Result = await scheduleStep1({
     prisma,
     ai: aiInterface,
     openai,
     xai,
     replicate,
     input: { ...input, timestamp: new Date() },
     env
   });
   \`\`\`

3. **Schedule-Specific Error Handling**: Include automation-aware error handling:
   \`\`\`javascript
   try {
     // Step execution
   } catch (error) {
     console.error('Schedule step failed:', error);
     // Log to monitoring system
     await logScheduleError('${name}', error);
     throw new Error(\`Schedule failed: \${error.message}\`);
   }
   \`\`\`

4. **Return Format**: MUST return exactly this structure for schedules:
   \`\`\`javascript
   return {
     output: {
       // All final outputs from last step or combined
       success: true,
       message: 'Schedule executed successfully',
       executedAt: new Date().toISOString(),
       frequency: '${frequency}',
       // ... other outputs
     },
     data: [
       // All database changes from all steps
       ...step1Result.changes,
       ...step2Result.changes,
       // etc.
     ],
     nextRun: new Date(Date.now() + getNextInterval('${frequency}')).toISOString()
   };
   \`\`\`

Generate COMPLETE, EXECUTABLE schedule composition function with real library integration and automation logic.`;

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
        content: `Generate main schedule function for: ${name} (${frequency})`
      }
    ],
    temperature: 0.1
  });

  return result.object;
}

/**
 * Create a minimal PromptUnderstanding structure for schedule generation
 * This provides only the essential context needed by generateSchedules
 */
function createSchedulePromptUnderstanding(step0: Step0Output): any {
  const phaseA = step0.phaseAAnalysis;
  
  return {
    userRequestAnalysis: {
      mainGoal: phaseA?.userRequestAnalysis.mainGoal || `Generate schedules for ${step0.agentName}`,
      businessContext: phaseA?.userRequestAnalysis.businessContext || step0.domain,
      complexity: phaseA?.userRequestAnalysis.complexity || 'moderate',
      urgency: phaseA?.userRequestAnalysis.urgency || 'medium',
      clarity: phaseA?.userRequestAnalysis.clarity || 'clear'
    },
    featureImagination: {
      coreFeatures: phaseA?.featureRequirements.coreFeatures || [],
      additionalFeatures: phaseA?.featureRequirements.additionalFeatures || [],
      userExperience: phaseA?.featureRequirements.userExperience || [],
      businessRules: phaseA?.featureRequirements.businessRules || [],
      integrations: phaseA?.featureRequirements.integrations || []
    },
    workflowAutomationNeeds: {
      // Minimal required structure - generateSchedules mainly uses this for context
      requiredActions: [], // Not duplicating Step 0 actions - they're available separately
      businessRules: [],
      oneTimeActions: [],
      recurringSchedules: [], // Not duplicating Step 0 schedules - they're available separately
      businessProcesses: phaseA?.semanticRequirements.businessProcesses.map(process => ({
        name: process.name,
        description: process.description,
        involvedModels: [],
        automationPotential: process.automationPotential,
        requiresActions: true,
        requiresSchedules: process.isRecurring
      })) || []
    }
  };
}

/**
 * Execute Step 3: Schedule Generation with Complete Code Generation
 */
export async function executeStep3ScheduleGeneration(
  input: Step3Input
): Promise<Step3Output> {
  console.log('⏰ STEP 3: Starting schedule generation with complete code generation...');
  
  const { step0Analysis, databaseGeneration, actionGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    console.log('📅 Generating schedules with Step 0 context...');
    console.log(`📊 Step 0 Schedule Analysis: ${step0Analysis.schedules.filter(s => s.operation === 'create').length} new schedules, ${step0Analysis.schedules.filter(s => s.operation === 'update').length} schedule updates`);
    console.log(`⏱️ Schedule Details: ${step0Analysis.schedules.length} total schedules identified in analysis`);

    // Generate base schedules first
    const schedulesResult = await generateSchedules({
      step0Analysis,
      existingAgent
    });

    // Now generate complete executable code for each schedule
    console.log('⚡ Generating step-based executable code for each schedule...');
    
    const schedulesWithCode = await Promise.all(
      schedulesResult.schedules.map(async (schedule) => {
        try {
          // Generate pseudo steps if not present
          if (!schedule.pseudoSteps || schedule.pseudoSteps.length === 0) {
            console.log(`📝 Generating pseudo steps for schedule: ${schedule.name}`);
            // Generate basic pseudo steps structure for this schedule
            schedule.pseudoSteps = [{
              id: `step_${Date.now()}`,
              type: schedule.type === 'query' ? 'Database read' : 'Database update',
              description: schedule.description || `Execute scheduled ${schedule.name}`,
              inputFields: [{
                id: `field_${Date.now()}`,
                name: 'timestamp',
                type: 'DateTime',
                kind: 'scalar' as const,
                required: true,
                list: false,
                description: 'Schedule execution timestamp'
              }],
              outputFields: [{
                id: `field_${Date.now() + 1}`,
                name: 'result',
                type: 'String',
                kind: 'scalar' as const,
                required: true,
                list: false,
                description: 'Schedule execution result'
              }]
            }];
          }

          // Generate step functions for schedule
          const stepFunctions = await Promise.all(
            schedule.pseudoSteps.map((step: PseudoCodeStep, index: number) => 
              generateScheduleStepFunction(step, index, databaseGeneration.models, step0Analysis.domain)
            )
          );

          // Generate main composition function for schedule
          const mainFunction = await generateScheduleMainFunction(
            schedule.name,
            schedule.description || '',
            schedule.pseudoSteps,
            schedule.interval?.pattern || 'daily',
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
            ...schedule,
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
          console.error(`Error generating code for schedule ${schedule.name}:`, error);
          return schedule; // Return original schedule if code generation fails
        }
      })
    );

    const result: Step3Output = {
      schedules: schedulesWithCode
    };

    console.log('✅ STEP 3: Schedule generation with complete code completed successfully');
    console.log(`⏰ Schedule Summary:
- Generated Schedules: ${result.schedules.length}
- Schedules with Executable Code: ${result.schedules.filter(s => s.execute?.code?.script).length}
- Step 0 Schedule Context: ${step0Analysis.schedules.length} total (${step0Analysis.schedules.filter(s => s.operation === 'create').length} new, ${step0Analysis.schedules.filter(s => s.operation === 'update').length} updates)
- Real Library Integration: Prisma, AI SDK, Replicate, External APIs`);

    return result;
  } catch (error) {
    console.error('❌ STEP 3: Schedule generation failed:', error);
    throw new Error(`Step 3 schedule generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 3 output for completeness and quality
 */
export function validateStep3Output(output: Step3Output): boolean {
  try {
    if (!output.schedules.length) {
      console.warn('⚠️ No schedules generated');
      return false;
    }
    
    // Check that schedules have proper structure
    const invalidSchedules = output.schedules.filter(s => 
      !s.name || !s.description || !s.interval?.pattern
    );
    
    if (invalidSchedules.length > 0) {
      console.warn(`⚠️ Invalid schedules found: ${invalidSchedules.length}`);
      return false;
    }
    
    console.log('✅ Step 3 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 3 output validation failed:', error);
    return false;
  }
}

/**
 * Extract schedule insights for downstream steps
 */
export function extractScheduleInsights(output: Step3Output) {
  return {
    scheduleCount: output.schedules.length
  };
} 