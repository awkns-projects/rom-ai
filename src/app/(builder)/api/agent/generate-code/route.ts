import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '@/lib/ai/tools/agent-builder/generation';
import type { PseudoCodeStep, AgentModel } from '@/artifacts/agent/types';

const StepCodeSchema = z.object({
  functionCode: z.string().describe('Complete step function code'),
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
      type: z.enum(['database', 'external_api', 'ai_analysis', 'ai_generation']),
      description: z.string(),
      model: z.string().optional(),
      operation: z.string().optional(),
      recordCount: z.number().optional()
    })).optional()
  })).describe('Test cases for this step')
});

const MainCodeSchema = z.object({
  mainFunctionCode: z.string().describe('Complete main composition function'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean()
  })).describe('All environment variables needed')
});

async function generateStepFunction(
  step: PseudoCodeStep,
  stepIndex: number,
  availableModels: AgentModel[],
  businessContext?: string
): Promise<z.infer<typeof StepCodeSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `You are an expert JavaScript developer generating step function code.

STEP DETAILS:
- Type: ${step.type}
- Description: ${step.description}
- Input Fields: ${step.inputFields?.map(f => `${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`).join(', ')}
- Output Fields: ${step.outputFields?.map(f => `${f.name}: ${f.type}${f.required ? ' (required)' : ' (optional)'}`).join(', ')}

AVAILABLE MODELS: ${availableModels.map(m => m.name).join(', ')}
BUSINESS CONTEXT: ${businessContext || 'General business operations'}

CRITICAL EXECUTION REQUIREMENTS:
Your generated code MUST be executable in both test and production environments.

FUNCTION SIGNATURE - USE EXACTLY THIS PATTERN:
\`\`\`javascript
async function step${stepIndex + 1}({prisma, ai, openai, xai, replicate, input, env}) {
  try {
    // Your implementation here
    
    // MUST return this exact structure:
    return {
      success: true,
      output: {
        // Your step output data here
      },
      changes: [
        // Array of change log entries
        {
          type: 'database' | 'external_api' | 'ai_analysis' | 'ai_generation',
          description: 'What was done',
          model: 'ModelName', // for database operations
          operation: 'create' | 'update' | 'read' | 'delete', // for database operations
          recordCount: 1, // for database operations
          apiEndpoint: 'https://api.example.com', // for API operations
          tokensUsed: 100, // for AI operations
          executionTime: Date.now() - startTime
        }
      ]
    };
  } catch (error) {
    return {
      success: false,
      output: {},
      changes: [],
      error: error.message
    };
  }
}
\`\`\`

PARAMETER USAGE:
- prisma: Database client for Prisma operations (prisma.modelName.create(), etc.)
- ai: Vercel AI SDK client (ai.generateObject())
- openai: OpenAI client (@ai-sdk/openai)
- xai: xAI client (@ai-sdk/xai)  
- replicate: Replicate client for AI generation
- input: Object containing input fields for this step
- env: Object containing environment variables

RETURN FORMAT - CRITICAL:
ALWAYS return exactly this structure:
{
  success: boolean,
  output: any, // Your actual result data
  changes: Array<ChangeLog>, // Required for tracking
  error?: string // Only if success is false
}

STEP TYPE IMPLEMENTATION:
${getStepTypeInstructions(step.type)}

ERROR HANDLING:
- Wrap ALL operations in try-catch blocks
- Return success: false with error message on failures
- Never throw errors - always return structured response
- Validate all inputs before processing
- Handle missing environment variables gracefully

EXAMPLE IMPLEMENTATIONS:

For Database operations:
\`\`\`javascript
async function step1({prisma, ai, openai, xai, replicate, input, env}) {
  try {
    const startTime = Date.now();
    
    // Validate required inputs
    if (!input.name) {
      return {
        success: false,
        output: {},
        changes: [],
        error: 'Missing required field: name'
      };
    }
    
    // Perform database operation
    const result = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email
      }
    });
    
    return {
      success: true,
      output: { user: result },
      changes: [{
        type: 'database',
        description: 'Created new user',
        model: 'User',
        operation: 'create',
        recordCount: 1,
        executionTime: Date.now() - startTime
      }]
    };
  } catch (error) {
    return {
      success: false,
      output: {},
      changes: [],
      error: error.message
    };
  }
}
\`\`\`

For AI Analysis:
\`\`\`javascript
async function step2({prisma, ai, openai, xai, replicate, input, env}) {
  try {
    const startTime = Date.now();
    
    const analysis = await ai.generateObject({
      schema: z.object({
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        confidence: z.number(),
        summary: z.string()
      }),
      messages: [
        { role: 'system', content: 'Analyze the sentiment of the given text.' },
        { role: 'user', content: input.text }
      ]
    });
    
    return {
      success: true,
      output: { analysis: analysis.object },
      changes: [{
        type: 'ai_analysis',
        description: 'Performed sentiment analysis',
        tokensUsed: 150, // estimate
        executionTime: Date.now() - startTime
      }]
    };
  } catch (error) {
    return {
      success: false,
      output: {},
      changes: [],
      error: error.message
    };
  }
}
\`\`\`

For External API:
\`\`\`javascript
async function step3({prisma, ai, openai, xai, replicate, input, env}) {
  try {
    const startTime = Date.now();
    
    if (!env.API_KEY) {
      return {
        success: false,
        output: {},
        changes: [],
        error: 'Missing required environment variable: API_KEY'
      };
    }
    
    const response = await fetch('https://api.example.com/data', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${env.API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });
    
    if (!response.ok) {
      throw new Error(\`API call failed: \${response.status}\`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      output: { apiResponse: data },
      changes: [{
        type: 'external_api',
        description: 'Called external API',
        apiEndpoint: 'https://api.example.com/data',
        executionTime: Date.now() - startTime
      }]
    };
  } catch (error) {
    return {
      success: false,
      output: {},
      changes: [],
      error: error.message
    };
  }
}
\`\`\`

Generate COMPLETE, PRODUCTION-READY code that follows these exact patterns.`;

  const result = await generateObject({
    model,
    schema: StepCodeSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      }
    ],
    temperature: 0.1
  });

  return result.object;
}

async function generateMainFunction(
  name: string,
  description: string,
  steps: PseudoCodeStep[],
  entityType: 'action' | 'schedule',
  availableModels: AgentModel[]
): Promise<z.infer<typeof MainCodeSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `Generate a main ${entityType} function that composes all step functions in sequence.

${entityType.toUpperCase()} DETAILS:
- Name: ${name}
- Description: ${description}
- Steps: ${steps.length} steps to execute in order

STEP SUMMARY:
${steps.map((step, index) => `${index + 1}. ${step.type}: ${step.description}`).join('\n')}

CRITICAL EXECUTION REQUIREMENTS:
Your generated code MUST be executable in both test and production environments.

MAIN FUNCTION SIGNATURE - USE EXACTLY THIS PATTERN:
\`\`\`javascript
// Step functions (these will be available in scope)
${steps.map((step, index) => `
async function step${index + 1}({prisma, ai, openai, xai, replicate, input, env}) {
  // Step implementation will be generated separately
}`).join('')}

// Main composition function
async function execute${entityType === 'action' ? 'Action' : 'Schedule'}({prisma, ai, openai, xai, replicate, input, env}) {
  try {
    const startTime = Date.now();
    const allChanges = [];
    let currentOutput = input; // Start with initial input
    
    // Execute steps in sequence
    ${steps.map((step, index) => `
    // Step ${index + 1}: ${step.description}
    console.log('Executing step ${index + 1}: ${step.description}');
    const step${index + 1}Result = await step${index + 1}({
      prisma,
      ai,
      openai,
      xai,
      replicate,
      input: currentOutput, // Pass previous output as input
      env
    });
    
    if (!step${index + 1}Result.success) {
      return {
        success: false,
        output: {},
        changes: allChanges,
        error: \`Step ${index + 1} failed: \${step${index + 1}Result.error}\`,
        executionTime: Date.now() - startTime,
        stepsExecuted: ${index}
      };
    }
    
    // Collect changes and update current output
    allChanges.push(...step${index + 1}Result.changes);
    currentOutput = { ...currentOutput, ...step${index + 1}Result.output };`).join('')}
    
    // Return final result
    return {
      success: true,
      output: currentOutput,
      changes: allChanges,
      executionTime: Date.now() - startTime,
      stepsExecuted: ${steps.length}
    };
    
  } catch (error) {
    return {
      success: false,
      output: {},
      changes: [],
      error: error.message,
      executionTime: Date.now() - startTime,
      stepsExecuted: 0
    };
  }
}

// Execute the main function and return result
return await execute${entityType === 'action' ? 'Action' : 'Schedule'}({prisma, ai, openai, xai, replicate, input, env});
\`\`\`

EXECUTION FLOW REQUIREMENTS:
1. Validate initial input
2. Initialize step tracking and change logs
3. Execute each step function in sequence with proper parameter passing
4. Handle step dependencies (step N output becomes part of step N+1 input)
5. Aggregate all change logs from each step
6. Return final output with complete change tracking

RETURN FORMAT - CRITICAL:
ALWAYS return exactly this structure:
{
  success: boolean,
  output: any, // Final combined output from all steps
  changes: Array<ChangeLog>, // All changes from all steps
  executionTime: number,
  stepsExecuted: number,
  error?: string // Only if success is false
}

ERROR HANDLING:
- Wrap entire execution in try-catch
- Stop execution and return error if any step fails
- Track which steps were completed before failure
- Include execution time even for failures
- Never throw errors - always return structured response

STEP INTEGRATION:
- Pass output from previous steps to next steps
- Combine outputs progressively (currentOutput = {...currentOutput, ...stepResult.output})
- Collect all change logs from each step
- Log progress for each step execution

ENVIRONMENT VARIABLE EXTRACTION:
Extract and document all required environment variables from step implementations.

Generate a robust, production-ready main function that properly composes all steps.`;

  const result = await generateObject({
    model,
    schema: MainCodeSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      }
    ],
    temperature: 0.1
  });

  return result.object;
}

function getStepTypeInstructions(stepType: string): string {
  switch (stepType) {
    case 'Database create':
      return `Use prisma.modelName.create() or prisma.modelName.createMany(). Validate required fields before creation. Handle unique constraint violations. Return created record(s) in output. Log database changes with model name and record count.`;

    case 'Database update':
      return `Use prisma.modelName.update() or prisma.modelName.updateMany(). Include proper where clause for targeting records. Validate update data before execution. Return updated record(s) in output. Log database changes with model name and record count.`;

    case 'Database read':
      return `Use prisma.modelName.findUnique(), findFirst(), or findMany(). Include proper where clauses and filters. Use include/select for related data as needed. Handle pagination if applicable. Return found record(s) in output. Log read operations with model name and record count.`;

    case 'Database delete':
      return `Use prisma.modelName.delete() or prisma.modelName.deleteMany(). Include proper where clause for targeting records. Consider soft delete vs hard delete. Return deletion count in output. Log database changes with model name and record count.`;

    case 'External api read':
      return `Use fetch() for GET requests. Include proper headers and authentication from env. Parse JSON response. Handle API rate limits and errors. Return API response data in output. Log API calls with endpoint and response status.`;

    case 'External api write':
      return `Use fetch() for POST/PUT/DELETE requests. Include proper headers, body, and authentication from env. Parse JSON response. Handle API rate limits and errors. Return API response data in output. Log API calls with endpoint, method, and response status.`;

    case 'AI analysis':
      return `Use ai.generateObject() with proper Zod schema. Define structured output schema for analysis results. Include meaningful prompts for the AI model. Handle AI model errors and rate limits. Return structured analysis results in output. Log AI usage with tokens used and execution time.`;

    case 'AI generation':
      return `Use replicate client for AI content generation. Handle different model types (text, image, etc.). Include proper prompts and parameters. Handle generation errors and timeouts. Return generated content in output. Log AI generation with model used and execution time.`;

    default:
      return 'Handle this step type according to its specific requirements.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pseudoSteps, availableModels, entityType, businessContext } = body;

    // Validate required fields
    if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, pseudoSteps' },
        { status: 400 }
      );
    }

    if (pseudoSteps.length === 0) {
      return NextResponse.json(
        { error: 'At least one pseudo step is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 Generating code for ${entityType}: ${name} with ${pseudoSteps.length} steps`);

    // Process each step to generate code and tests
    const stepsWithCode = await Promise.all(
      pseudoSteps.map(async (step: PseudoCodeStep, index: number) => {
        console.log(`  📝 Processing step ${index + 1}: ${step.type} - ${step.description}`);
        
        const stepResult = await generateStepFunction(
          step,
          index,
          availableModels || [],
          businessContext
        );

        return {
          ...step,
          generatedCode: stepResult.functionCode,
          testCode: stepResult.testCode,
          testCases: stepResult.testCases,
          envVars: stepResult.envVars
        };
      })
    );

    // Generate main composition function
    console.log(`🏗️ Generating main composition function for ${entityType}: ${name}`);
    const mainResult = await generateMainFunction(
      name,
      description,
      stepsWithCode,
      entityType as 'action' | 'schedule',
      availableModels || []
    );

    // Collect all environment variables
    const allEnvVars = [...mainResult.envVars];
    stepsWithCode.forEach(step => {
      if (step.envVars) {
        step.envVars.forEach((envVar: any) => {
          if (!allEnvVars.some(existing => existing.name === envVar.name)) {
            allEnvVars.push(envVar);
          }
        });
      }
    });

    // Extract input parameters from first step
    const inputParameters = stepsWithCode[0]?.inputFields?.map(field => ({
      name: field.name,
      type: field.type,
      required: field.required,
      description: field.description || `Input parameter for ${field.name}`,
      kind: field.kind,
      relationModel: field.relationModel
    })) || [];

    // Extract output parameters from last step
    const outputParameters = stepsWithCode[stepsWithCode.length - 1]?.outputFields?.map(field => ({
      name: field.name,
      type: field.type,
      description: field.description || `Output parameter: ${field.name}`
    })) || [];

    console.log(`✅ Generated complete ${entityType} code with ${stepsWithCode.length} step functions`);

    return NextResponse.json({
      success: true,
      code: mainResult.mainFunctionCode,
      stepFunctions: stepsWithCode.map(step => step.generatedCode),
      steps: stepsWithCode,
      envVars: allEnvVars,
      inputParameters,
      outputParameters,
      executionMetadata: {
        stepCount: stepsWithCode.length,
        hasExternalAPIs: allEnvVars.length > 0,
        hasAIOperations: stepsWithCode.some(step => 
          step.type === 'AI analysis' || step.type === 'AI generation'
        ),
        hasDatabaseOperations: stepsWithCode.some(step => 
          step.type.startsWith('Database')
        )
      }
    });

  } catch (error) {
    console.error('❌ Error generating code:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    documentation: {
      endpoint: '/api/agent/generate-code',
      method: 'POST',
      requiredFields: ['name', 'description', 'pseudoSteps'],
      optionalFields: ['availableModels', 'entityType', 'businessContext'],
      stepTypes: [
        'Database create',
        'Database update', 
        'Database read',
        'Database delete',
        'External api read',
        'External api write', 
        'AI analysis',
        'AI generation'
      ],
      functionSignature: 'function stepN({prisma, ai, openai, xai, replicate, input, env})',
      responseFormat: {
        code: 'Main composition function',
        stepFunctions: 'Array of individual step function codes',
        steps: 'Array of steps with generated code and tests',
        envVars: 'Required environment variables',
        inputParameters: 'Required input parameters',
        outputParameters: 'Expected output parameters'
      }
    }
  });
} 