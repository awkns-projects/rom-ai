import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '@/lib/ai/tools/agent-builder/generation';

const CodeGenerationSchema = z.object({
  code: z.string().describe('Complete JavaScript code that can be executed with new Function()'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean().default(false)
  })).describe('Environment variables needed for the code'),
  inputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
    defaultValue: z.any().optional()
  })).describe('Input parameters required before execution'),
  outputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })).describe('Expected output parameters'),
  estimatedExecutionTime: z.string().describe('Estimated execution time'),
  testData: z.object({
    input: z.record(z.any()).optional().default({}),
    expectedOutput: z.record(z.any()).optional().default({})
  }).describe('Test data for validation')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pseudoSteps, availableModels, entityType, businessContext, inputParameters, enhancedAnalysis, testResults, type } = body;

    // Validate required fields
    if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, pseudoSteps' },
        { status: 400 }
      );
    }

    // Validate action type
    const actionType = type || 'mutation';
    if (actionType !== 'query' && actionType !== 'mutation') {
      return NextResponse.json(
        { error: 'Invalid action type. Must be "query" or "mutation"' },
        { status: 400 }
      );
    }

    const model = await getAgentBuilderModel();

    // Extract input parameters from first step if not provided
    const extractedInputParams = inputParameters || (
      pseudoSteps.length > 0 && pseudoSteps[0].inputFields ? 
      pseudoSteps[0].inputFields
        .filter((field: any) => field.name && field.name.trim() !== '')
        .map((field: any) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          description: field.description || `Input parameter for ${field.name}`,
          kind: field.kind === 'object' ? 'object' : 'scalar',
          relationModel: field.relationModel
        })) : []
    );

    // Assemble enhanced step information for code generation
    const enhancedSteps = pseudoSteps.map((step: any, index: number) => ({
      ...step,
      stepIndex: index + 1,
      hasActualCode: Boolean(step.actualCode),
      hasTestCode: Boolean(step.testCode),
      hasMockData: Boolean(step.mockInput && step.mockOutput),
      hasAuthentication: Boolean(step.oauthTokens || step.apiKeys)
    }));

    // Validate external API consistency
    const externalApiProviders = enhancedSteps
      .filter(step => step.oauthTokens || step.apiKeys)
      .map(step => step.oauthTokens?.provider || step.apiKeys?.provider)
      .filter((provider, index, arr) => arr.indexOf(provider) === index);

    if (externalApiProviders.length > 1) {
      return NextResponse.json({
        error: 'Invalid action: Multiple external API providers detected',
        details: `Actions can only use one external API provider. Found: ${externalApiProviders.join(', ')}`,
        conflictingProviders: externalApiProviders
      }, { status: 400 });
    }

    // Generate executable code based on enhanced step information
    const systemPrompt = `You are a senior JavaScript architect generating production-ready code by assembling validated step components.

TASK: Generate complete, executable JavaScript code using the provided enhanced step information.

CONTEXT:
- Name: ${name}
- Description: ${description}
- Action Type: ${actionType} (${actionType === 'mutation' ? 'MODIFIES data - creates, updates, deletes' : 'READS data only - queries, analyzes, searches'})
- Entity Type: ${entityType}
- Business Context: ${businessContext || 'General business operations'}
- External API Provider: ${externalApiProviders[0] || 'none'}
- Available Models: ${JSON.stringify(availableModels?.map((m: any) => ({ name: m.name, fields: m.fields?.map((f: any) => ({ name: f.name, type: f.type })) })) || [])}

ENHANCED STEPS WITH ACTUAL CODE:
${JSON.stringify(enhancedSteps, null, 2)}

REQUIRED INPUT PARAMETERS:
${JSON.stringify(extractedInputParams, null, 2)}

CODE ASSEMBLY STRATEGY:
1. **USE ACTUAL STEP CODE**: Each step provides actualCode - assemble these in sequence
2. **ADD LOGGING**: Include logMessage templates for each step
3. **HANDLE DEPENDENCIES**: Respect dependsOn relationships and data flow
4. **ERROR HANDLING**: Implement retry logic and fallback actions from errorHandling
5. **AUTHENTICATION**: Include OAuth tokens and API keys from step configuration

**🎯 ACTION TYPE COMPLIANCE:**
${actionType === 'mutation' ? `
This is a MUTATION action - it MUST modify data:
- Include database write operations (create, update, delete, upsert)
- External API calls that modify remote data
- Focus on data transformation and persistence
- Return details about what was changed/created
- Include validation before making changes
` : `
This is a QUERY action - it MUST NOT modify data:
- Only use read operations (find, aggregate, count)
- External API calls should only retrieve data
- Focus on data retrieval, analysis, and insights
- Never include create, update, delete operations
- Return data insights, search results, or analysis
`}

CODE ASSEMBLY REQUIREMENTS:

1. EXECUTION CONTEXT:
   The code will be executed using: new Function('prisma', 'input', 'member', 'ai', 'envVars', 'logger', code)
   Where the parameters are:
   
   - prisma: Prisma client for database operations (prisma.modelName.findMany(), etc.)
   - input: User-provided input parameters
   - member: User context (id, role, email)
   - ai: AI operations using generateObject function
   - envVars: Environment variables for external APIs
   - logger: Logging functions (logger.info(), logger.error()) for step tracking

2. STEP CODE ASSEMBLY:
   Each step provides actualCode that should be assembled in sequence with logging:
   
   // Step X execution with logging
   logger.info('Starting step {stepOrder}: {logMessage}');
   try {
     {actualCode}
     logger.info('Completed step {stepOrder} successfully');
   } catch (error) {
     logger.error('Step {stepOrder} failed: ' + error.message);
     // Apply error handling logic from step.errorHandling
   }
   
   CRITICAL: Use logger.info() and logger.error() throughout the code to track step execution progress.

3. DEPENDENCY MANAGEMENT:
   - Respect step dependencies defined in dependsOn arrays
   - Pass output from previous steps as input to dependent steps
   - Handle data flow variables between steps

4. AUTHENTICATION HANDLING:
   For steps with oauthTokens or apiKeys:
   // OAuth example
   const accessToken = envVars.{PROVIDER}_ACCESS_TOKEN;
   const refreshToken = envVars.{PROVIDER}_REFRESH_TOKEN;
   
   // API Key example  
   const apiKey = envVars.{PROVIDER}_API_KEY;

5. ERROR HANDLING:
   Implement retry logic and fallback actions from errorHandling configuration:
   let retryCount = 0;
   const maxRetries = {retryAttempts || 3};
   while (retryCount < maxRetries) {
     try {
       // Step execution
       break;
     } catch (error) {
       retryCount++;
       if (retryCount >= maxRetries) {
         if ({continueOnError}) {
           logger.warn('Step failed but continuing: ' + error.message);
           break;
         } else {
           throw error;
         }
       }
       await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
     }
   }

6. INPUT PARAMETER VALIDATION:
   ${extractedInputParams.length > 0 ? `
   The code MUST expect these input parameters in the input object:
   ${extractedInputParams.map((param: any) => `
   - input.${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}
     ${param.kind === 'object' ? `This is a database relation ID for ${param.relationModel} model` : ''}
   `).join('')}
   
   Always validate required input parameters at the start of your code:
   ${extractedInputParams.filter((p: any) => p.required).map((param: any) => `
   if (!input.${param.name}) throw new Error('Required parameter ${param.name} is missing');`).join('')}
   ` : 'No input parameters required.'}

7. CODE STRUCTURE:
   - Start with input parameter validation
   - Initialize variables for step data flow
   - Execute each step in order, respecting dependencies
   - Handle authentication for external API steps
   - Include comprehensive logging
   - Return structured result with all step outputs

4. DATABASE OPERATIONS:
   For database operations, use Prisma Client syntax directly:
   - prisma.modelName.findMany({ where: filter, take: limit }) - find multiple records
   - prisma.modelName.findUnique({ where }) - find single record  
   - prisma.modelName.create({ data }) - create new record
   - prisma.modelName.createMany({ data: dataArray }) - create multiple records
   - prisma.modelName.update({ where, data }) - update existing records
   - prisma.modelName.updateMany({ where, data }) - update multiple records
   - prisma.modelName.delete({ where }) - delete records
   - prisma.modelName.deleteMany({ where }) - delete multiple records
   
   STEP TYPE TO DATABASE OPERATION MAPPING:
   - "Database find unique" → prisma.modelName.findUnique({ where })
   - "Database find many" → prisma.modelName.findMany({ where: filter })
   - "Database create" → prisma.modelName.create({ data })
   - "Database create many" → prisma.modelName.createMany({ data: dataArray })
   - "Database update unique" → prisma.modelName.update({ where, data }) 
   - "Database update many" → prisma.modelName.updateMany({ where, data })
   - "Database delete unique" → prisma.modelName.delete({ where })
   - "Database delete many" → prisma.modelName.deleteMany({ where })

   IMPORTANT: 
   - Use camelCase for model names (e.g., prisma.customerOrder, not prisma.CustomerOrder)
   - All operations take objects with named parameters ({ where, data, etc.})

5. AI OPERATIONS:
   For AI analysis/decisions, use:
   const result = await ai.generateObject({
     messages: [
       { role: 'system', content: 'You are an expert analyst...' },
       { role: 'user', content: 'Analyze this data: ' + JSON.stringify(dataToAnalyze) }
     ],
     schema: z.object({ 
       analysis: z.string().describe('Analysis results'),
       confidence: z.number().describe('Confidence score 0-100'),
       recommendations: z.array(z.string()).describe('Recommendations')
     })
   });

   Example AI Analysis patterns:
   - Sentiment analysis: Analyze text content for positive/negative sentiment
   - Data classification: Categorize records based on content or patterns
   - Risk assessment: Evaluate risk levels based on multiple factors
   - Recommendation generation: Generate personalized recommendations
   - Anomaly detection: Identify unusual patterns in data

6. EXTERNAL API CALLS:
   For "call external api" step type, use fetch() with proper authentication and environment handling:
   
   // OAuth2 API example with test/live environment support:
   const isTestMode = envVars.ENVIRONMENT === 'test' || envVars.NODE_ENV === 'development';
   const baseUrl = isTestMode ? envVars.API_BASE_URL_TEST : envVars.API_BASE_URL;
   const accessToken = isTestMode ? envVars.OAUTH_ACCESS_TOKEN_TEST : envVars.OAUTH_ACCESS_TOKEN;
   
   const apiResponse = await fetch(\`\${baseUrl}/endpoint\`, {
     method: 'POST',
     headers: { 
       'Authorization': \`Bearer \${accessToken}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(requestData)
   });
   
   // Shopify API example with test/live store support:
   const shopifyStoreName = isTestMode ? envVars.SHOPIFY_STORE_NAME_TEST : envVars.SHOPIFY_STORE_NAME;
   const shopifyToken = isTestMode ? envVars.SHOPIFY_ACCESS_TOKEN_TEST : envVars.SHOPIFY_ACCESS_TOKEN;
   
   const shopifyResponse = await fetch(\`https://\${shopifyStoreName}.myshopify.com/admin/api/2023-10/products.json\`, {
     headers: { 
       'X-Shopify-Access-Token': shopifyToken,
       'Content-Type': 'application/json'
     }
   });
   
   // Stripe API example with test/live keys:
   const stripeKey = isTestMode ? envVars.STRIPE_SECRET_KEY_TEST : envVars.STRIPE_SECRET_KEY;
   
   const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
     headers: { 
       'Authorization': \`Bearer \${stripeKey}\`,
       'Content-Type': 'application/x-www-form-urlencoded'
     }
   });
   
   // Generic API with environment variables:
   const genericApiKey = isTestMode ? envVars.API_KEY_TEST : envVars.API_KEY;
   const genericBaseUrl = envVars.API_BASE_URL || (isTestMode ? envVars.API_BASE_URL_TEST : envVars.API_BASE_URL_PROD);
   
   const genericResponse = await fetch(\`\${genericBaseUrl}/endpoint\`, {
     method: 'POST',
     headers: { 
       'Authorization': \`Bearer \${genericApiKey}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(requestData)
   });
   
   // Environment Variables Guide:
   // For OAuth2: OAUTH_ACCESS_TOKEN, OAUTH_ACCESS_TOKEN_TEST, API_BASE_URL, API_BASE_URL_TEST
   // For Shopify: SHOPIFY_STORE_NAME, SHOPIFY_STORE_NAME_TEST, SHOPIFY_ACCESS_TOKEN, SHOPIFY_ACCESS_TOKEN_TEST  
   // For Stripe: STRIPE_SECRET_KEY (sk_live_...), STRIPE_SECRET_KEY_TEST (sk_test_...)
   // General: ENVIRONMENT ('test'/'production'), NODE_ENV ('development'/'test'/'production')

7. RETURN FORMAT:
   Always return: { success: boolean, data: any, message: string, executionTime: number }

8. REAL-WORLD EXAMPLES:
   - "Find customers spending > $100 and upgrade to elite": Query customers, filter by spending, update status
   - "Generate weekly sales report": Aggregate sales data, create report, optionally send email
   - "Analyze sentiment of reviews": Fetch reviews, use AI for sentiment analysis, store results

Generate production-ready, executable JavaScript code that implements the business logic described in the pseudo steps and properly uses the input parameters.`;

    const result = await generateObject({
      model,
      schema: CodeGenerationSchema,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Generate production-ready JavaScript code for: ${name}

ASSEMBLE CODE FROM ENHANCED STEPS:
${enhancedSteps.map((step: any) => 
  `Step ${step.stepOrder}: ${step.description}
  - Type: ${step.type}
  - Actual Code: ${step.actualCode || 'NOT PROVIDED - generate basic implementation'}
  - Test Code: ${step.testCode || 'NOT PROVIDED'}
  - Log Message: ${step.logMessage || 'Step ' + step.stepOrder + ' executing'}
  - Mock Input: ${JSON.stringify(step.mockInput || {})}
  - Mock Output: ${JSON.stringify(step.mockOutput || {})}
  - Dependencies: ${step.dependsOn?.join(', ') || 'None'}
  - Error Handling: ${step.errorHandling ? `Retries: ${step.errorHandling.retryAttempts || 3}, Continue on error: ${step.errorHandling.continueOnError || false}` : 'Default'}
  - Authentication: ${step.oauthTokens ? `OAuth (${step.oauthTokens.provider})` : step.apiKeys ? `API Key (${step.apiKeys.provider})` : 'None'}
  - Inputs: ${step.inputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}
  - Outputs: ${step.outputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}`
).join('\n\n')}

${extractedInputParams.length > 0 ? `
Input Parameters Required:
${extractedInputParams.map((param: any) => `- ${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}`).join('\n')}
` : ''}

ASSEMBLY INSTRUCTIONS:
1. Use the actualCode from each step as the core implementation
2. Add the logMessage for each step execution
3. Implement the error handling configuration for each step
4. Handle authentication for steps that require it
5. Respect step dependencies and data flow
6. Include comprehensive logging throughout

Generate the final assembled code that combines all step implementations into a cohesive, executable action.`
        }
      ],
      temperature: 0.2,
    });

    // Generate live test code that combines all steps
    const generateTestCode = (steps: any[]) => {
      const testSteps = steps.map(step => {
        const mockInput = JSON.stringify(step.mockInput || {});
        const mockOutput = JSON.stringify(step.mockOutput || {});
        
        return `
    // Test Step ${step.stepOrder}: ${step.description}
    console.log('Testing step ${step.stepOrder}: ${step.description}');
    const step${step.stepOrder}Input = ${mockInput};
    const step${step.stepOrder}ExpectedOutput = ${mockOutput};
    
    // Execute step ${step.stepOrder} test code
    ${step.testCode || `// No specific test code provided for step ${step.stepOrder}`}
    
    console.log('Step ${step.stepOrder} test completed');`;
      }).join('\n');

      return `
// Live Test Code for Action: ${name}
async function testAction(input = {}) {
  console.log('Starting live test for action: ${name}');
  console.log('Input parameters:', input);
  
  const testResults = {
    success: false,
    steps: [],
    totalTime: 0,
    errors: []
  };
  
  const startTime = Date.now();
  
  try {
${testSteps}
    
    testResults.success = true;
    testResults.totalTime = Date.now() - startTime;
    console.log('All tests completed successfully');
    
  } catch (error) {
    testResults.errors.push(error.message);
    console.error('Test failed:', error.message);
  }
  
  return testResults;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAction };
}`;
    };

          const testCode = generateTestCode(enhancedSteps);

    // Generate execution logs
    const executionLogs = enhancedSteps.map(step => step.logMessage || `Step ${step.stepOrder}: ${step.description}`);

    // Ensure we return the enhanced information
    const finalResult = {
      ...result.object,
      inputParameters: extractedInputParams.length > 0 ? extractedInputParams : result.object.inputParameters,
      externalApiProvider: externalApiProviders[0] || null,
      testCode,
      executionLogs,
      enhancedSteps: enhancedSteps.length,
      apiValidation: {
        isValid: externalApiProviders.length <= 1,
        singleProvider: externalApiProviders.length === 1,
        provider: externalApiProviders[0] || null
      }
    };

    return NextResponse.json({
      success: true,
      ...finalResult
    });

  } catch (error) {
    console.error('Error generating code:', error);
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
      responseFormat: 'Generated executable code with environment variables and parameters'
    }
  });
} 