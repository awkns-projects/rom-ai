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
    const { name, description, pseudoSteps, availableModels, entityType, businessContext, inputParameters } = body;

    // Validate required fields
    if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, pseudoSteps' },
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

    // Generate executable code based on pseudo steps
    const systemPrompt = `You are a senior JavaScript developer generating executable code for ${entityType} operations.

TASK: Generate complete, executable JavaScript code based on the provided pseudo steps.

CONTEXT:
- Name: ${name}
- Description: ${description}
- Entity Type: ${entityType}
- Business Context: ${businessContext || 'General business operations'}
- Available Models: ${JSON.stringify(availableModels?.map((m: any) => ({ name: m.name, fields: m.fields?.map((f: any) => ({ name: f.name, type: f.type })) })) || [])}

PSEUDO STEPS TO IMPLEMENT:
${JSON.stringify(pseudoSteps, null, 2)}

REQUIRED INPUT PARAMETERS (from first step):
${JSON.stringify(extractedInputParams, null, 2)}

CODE GENERATION REQUIREMENTS:

1. EXECUTION CONTEXT:
   The code will be executed using: new Function('context', code)
   Where context = { db, ai, input, envVars }
   
   - db: Database operations (db.ModelName.find(), db.ModelName.create(), etc.)
   - ai: AI operations using generateObject function
   - input: User-provided input parameters (MUST include all parameters from the first step)
   - envVars: Environment variables for external APIs

2. INPUT PARAMETER HANDLING:
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

3. CODE STRUCTURE:
   - Start with input parameter validation
   - Process each pseudo step sequentially
   - Handle data flow between steps (output of step N becomes input of step N+1)
   - Include proper error handling
   - Return structured result object

4. DATABASE OPERATIONS:
   For database operations, use the actual API format:
   - db.findMany(modelName, { where: filter, limit: number }) - find multiple records
   - db.findUnique(modelName, where) - find single record  
   - db.create(modelName, data) - create new record
   - db.createMany(modelName, dataArray) - create multiple records (returns { count, records })
   - db.update(modelName, where, data) - update existing records
   - db.updateMany(modelName, where, data) - update multiple records (returns { count, records })
   - db.delete(modelName, where) - delete records
   - db.deleteMany(modelName, where) - delete multiple records (returns { count, records })
   
   STEP TYPE TO DATABASE OPERATION MAPPING:
   - "Database find unique" → db.findUnique(modelName, where)
   - "Database find many" → db.findMany(modelName, { where: filter })
   - "Database create" → db.create(modelName, data)
   - "Database create many" → db.createMany(modelName, dataArray)
   - "Database update unique" → db.update(modelName, where, data) 
   - "Database update many" → db.updateMany(modelName, where, data)
   - "Database delete unique" → db.delete(modelName, where)
   - "Database delete many" → db.deleteMany(modelName, where)

   IMPORTANT: The first parameter is always the MODEL NAME as a string, not db.ModelName.method()!

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
   For "call external api" step type, use fetch() with environment variables:
   
   // Shopify API example:
   const shopifyResponse = await fetch(\`https://\${envVars.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2023-10/products.json\`, {
     headers: { 
       'X-Shopify-Access-Token': envVars.SHOPIFY_ACCESS_TOKEN,
       'Content-Type': 'application/json'
     }
   });
   const shopifyData = await shopifyResponse.json();
   
   // Stripe API example:
   const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
     headers: { 
       'Authorization': \`Bearer \${envVars.STRIPE_SECRET_KEY}\`,
       'Content-Type': 'application/x-www-form-urlencoded'
     }
   });
   
   // Generic API example:
   const apiResponse = await fetch(envVars.API_BASE_URL + '/endpoint', {
     method: 'POST',
     headers: { 
       'Authorization': \`Bearer \${envVars.API_KEY}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(requestData)
   });

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
          content: `Generate executable JavaScript code for: ${name}

Pseudo Steps:
${pseudoSteps.map((step: any, index: number) => 
  `Step ${index + 1}: ${step.description}
  - Type: ${step.type}
  - Inputs: ${step.inputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}
  - Outputs: ${step.outputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}`
).join('\n\n')}

${extractedInputParams.length > 0 ? `
Input Parameters Required:
${extractedInputParams.map((param: any) => `- ${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}`).join('\n')}
` : ''}

Generate complete, executable code that can run in production with real data and properly handles all input parameters.`
        }
      ],
      temperature: 0.2,
    });

    // Ensure we return the input parameters we used
    const finalResult = {
      ...result.object,
      inputParameters: extractedInputParams.length > 0 ? extractedInputParams : result.object.inputParameters
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