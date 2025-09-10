import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel, generatePseudoSteps, generateUIComponents } from './generation';
import { sanitizeEnvironmentVariables } from './utils';

/**
 * Shared schema for code generation - extracted from /api/agent/generate-code
 */
export const CodeGenerationSchema = z.object({
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

/**
 * Generate pseudo steps - extracted from /api/agent/generate-steps
 */
export async function generateActionPseudoSteps(
  name: string,
  description: string,
  availableModels: any[],
  entityType: string = 'action',
  businessContext?: string
): Promise<any[]> {
  console.log(`🧩 Generating pseudo steps for ${entityType}: ${name}`);

  // Validate required fields
  if (!name || !description || !entityType) {
    throw new Error('Missing required fields: name, description, entityType');
  }

  // Generate pseudo steps using AI (removed type parameter since we removed action types)
  const pseudoSteps = await generatePseudoSteps(
    name,
    description,
    availableModels || [],
    entityType as 'action' | 'schedule',
    businessContext
  );

  return pseudoSteps;
}

/**
 * Generate UI components - extracted from /api/agent/generate-ui-components
 */
export async function generateActionUIComponents(
  name: string,
  description: string,
  pseudoSteps: any[],
  availableModels: any[],
  businessContext?: string
): Promise<any[]> {
  console.log(`🎨 Generating UI components for action: ${name}`);

  // Validate required fields
  if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
    throw new Error('Missing required fields: name, description, pseudoSteps');
  }

  // Generate UI components using AI
  const uiComponents = await generateUIComponents(
    name,
    description,
    pseudoSteps,
    availableModels || [],
    businessContext
  );

  return uiComponents;
}

/**
 * Generate executable code - extracted from /api/agent/generate-code
 */
export async function generateActionExecutableCode(
  name: string,
  description: string,
  pseudoSteps: any[],
  availableModels: any[],
  entityType: string = 'general',
  businessContext?: string,
  inputParameters?: any[],
  enhancedAnalysis?: any,
  testResults?: any
): Promise<{
  code: string;
  envVars: any[];
  inputParameters: any[];
  outputParameters: any[];
  estimatedExecutionTime: string;
  testData: any;
}> {
  console.log(`🔨 Generating executable code for ${entityType}: ${name}`);

  // Validate required fields
  if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
    throw new Error('Missing required fields: name, description, pseudoSteps');
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

  // Generate executable code based on pseudo steps - same logic as API route
  const systemPrompt = `You are a senior JavaScript developer generating executable code for ${entityType} operations.

TASK: Generate complete, executable JavaScript code based on the provided pseudo steps.

CONTEXT:
- Name: ${name}
- Description: ${description}
- Entity Type: ${entityType}
- Business Context: ${businessContext || 'General business operations'}
- Available Models: ${JSON.stringify(availableModels?.map((m: any) => ({ name: m.name, fields: m.fields?.map((f: any) => ({ name: f.name, type: f.type })) })) || [])}

${enhancedAnalysis ? `ENHANCED ANALYSIS (VALIDATED):
✅ This action has been fully analyzed and tested with real scenarios
✅ Test scenarios executed: ${enhancedAnalysis.analysis?.testScenarios?.length || 0}
✅ Database operations validated: ${enhancedAnalysis.analysis?.analysis?.databaseOperations?.tablesToUpdate?.length || 0} tables
✅ External APIs validated: ${enhancedAnalysis.analysis?.analysis?.externalAPIs?.length || 0} APIs
✅ All business logic has been validated with actual data
` : ''}

${testResults ? `REAL TEST EXECUTION RESULTS:
✅ Successfully executed ${testResults.stepResults?.length || 0} steps
✅ Total execution time: ${testResults.executionTime || 0}ms
✅ All steps completed successfully
✅ Business validations passed
✅ Generate production-ready code based on these validated results
` : ''}

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
   - envVars: Environment variables for external APIs ONLY (do not include NODE_ENV, PORT, or other system variables)

2. CRITICAL BATCH INPUT REQUIREMENT:
   ⚡ ALL ACTIONS MUST ACCEPT BATCH INPUT WITH items[] ARRAY:
   
   The input MUST always be structured as: input = { items: Array<{parameters}> }
   
   NEVER generate actions that accept single-item inputs like { userId: "123" }
   ALWAYS generate actions that accept: { items: [{ userId: "123" }] }
   
   Your code MUST:
   - Validate that input.items exists and is a non-empty array
   - Process each item in the array (even if typically only one item)
   - Return results that include count and processed items
   - Use for-loop to iterate over input.items array
   - Return object with success, data (array), count, and message properties

3. INPUT PARAMETER HANDLING:
   ${extractedInputParams.length > 0 ? `
   The code MUST expect these input parameters wrapped in items array:
   ${extractedInputParams.map((param: any) => `
   - input.items[].${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}
     ${param.kind === 'object' ? `This is a database relation ID for ${param.relationModel} model` : ''}
   `).join('')}
   
   Always validate required input parameters for each item:
   Loop through input.items and check each required parameter exists on the item object.
   ` : 'Each item in input.items array should contain the action-specific parameters.'}

4. CODE STRUCTURE:
   - Start with input.items array validation
   - Process each item in the array sequentially
   - Handle data flow between steps (output of step N becomes input of step N+1)
   - Include proper error handling
   - Return structured result with count and processed items

5. DATABASE OPERATIONS:
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

6. AI OPERATIONS:
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

7. EXTERNAL API CALLS:
   For "call external api" step type, use fetch() with proper authentication and environment handling:
   
   // API Key authentication example with test/live environment support:
   const baseUrl = envVars.API_BASE_URL || envVars.API_BASE_URL_PROD;
   const apiKey = envVars.API_KEY;
   
   const apiResponse = await fetch(\`\${baseUrl}/endpoint\`, {
     method: 'POST',
     headers: { 
       'Authorization': \`Bearer \${apiKey}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(requestData)
   });
   
   // For OAuth APIs, tokens are provided through user authentication flow, not envVars
   // Use the oauth context provided by the system instead of environment variables

8. RETURN FORMAT:
   Always return: { success: boolean, data: any, count: number, message: string, executionTime: number }
   Where data contains the processed results array and count is the number of items processed.

9. ENVIRONMENT VARIABLES:
   ONLY generate environment variables for external APIs that use API KEY authentication:
   - API keys (e.g., STRIPE_API_KEY, OPENAI_API_KEY)
   - API base URLs for API key services (e.g., OPENAI_BASE_URL)
   - API-specific configuration for API key services (e.g., STRIPE_WEBHOOK_SECRET)
   
   CRITICAL ENVIRONMENT VARIABLE NAMING RULES:
   ⚠️ ABSOLUTELY NO ACTION NAMES IN ENVIRONMENT VARIABLES ⚠️
   
   - Use ONLY the API provider name as the prefix (e.g., "INSTAGRAM", "GOOGLE_SHEETS", "STRIPE", "OPENAI")
   - NEVER EVER include the action name in environment variable names
   - NEVER use hyphens, spaces, or special characters - only letters, numbers, and underscores
   - Environment variables must start with a letter or underscore, not a number
   
   ✅ CORRECT EXAMPLES:
   - "INSTAGRAM_API_KEY" (not "TRACK-PERFORMANCE-ANALYTICS_INSTAGRAM_API_KEY")
   - "GOOGLE_SHEETS_API_KEY" (not "PLAN-CONTENT-CALENDAR_GOOGLE_SHEETS_API_KEY")
   - "STRIPE_API_KEY" (not "MANAGE-PAYMENTS_STRIPE_API_KEY")
   
   ❌ WRONG EXAMPLES (DO NOT GENERATE THESE):
   - "TRACK-PERFORMANCE-ANALYTICS_INSTAGRAM_API_KEY" ← Contains action name + hyphens
   - "PLAN-CONTENT-CALENDAR_LATER_API_KEY" ← Contains action name + hyphens
   - "MANAGE-BRAND-OUTREACH_INSTAGRAM_API_BASE_URL" ← Contains action name + hyphens
   
   DO NOT generate environment variables for OAuth-based APIs:
   - OAuth APIs (Gmail, Slack, Shopify, Facebook, LinkedIn, etc.) use user authentication flow
   - OAuth tokens are provided by the system, not through environment variables
   - If an API uses OAuth, generate NO environment variables for it
   
   NEVER generate system environment variables like:
   - NODE_ENV, ENVIRONMENT, PORT, DATABASE_URL, NEXTAUTH_SECRET
   - Any internal application configuration variables
   - Any variables starting with NEXT_, VERCEL_, or other framework prefixes
   
   AUTHENTICATION METHOD REFERENCE:
   - OAuth APIs (no env vars needed): Gmail, Slack, Shopify, Facebook, LinkedIn, Instagram, Google Calendar, Microsoft Teams, Notion, Salesforce, HubSpot
   - API Key APIs (env vars needed): Stripe, OpenAI, generic REST APIs

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

  // Sanitize environment variable names
  const envVarSanitization = sanitizeEnvironmentVariables(result.object.envVars || []);
  
  if (envVarSanitization.invalid.length > 0) {
    console.warn(`⚠️ Action "${name}": ${envVarSanitization.invalid.length} environment variables could not be sanitized:`, envVarSanitization.invalid);
  }

  // Ensure we return the input parameters we used
  return {
    code: result.object.code,
    envVars: envVarSanitization.sanitized,
    inputParameters: extractedInputParams.length > 0 ? extractedInputParams : result.object.inputParameters,
    outputParameters: result.object.outputParameters,
    estimatedExecutionTime: result.object.estimatedExecutionTime,
    testData: result.object.testData
  };
}

/**
 * Complete action generation workflow - combines all three steps
 * This replicates the exact same flow as the UI but in a single function call
 */
export async function generateCompleteAction(
  actionSpec: {
    name: string;
    title?: string;
    purpose?: string;
    description?: string;
    role?: string;
    id?: string;
  },
  availableModels: any[],
  businessContext: string,
  entityType: string = 'general',
  existingActions: any[] = []
): Promise<any> {
  console.log(`🚀 Generating complete action using API route logic: ${actionSpec.name}`);

  const actionName = actionSpec.name;
  const actionTitle = actionSpec.title || actionSpec.name;
  const actionDescription = actionSpec.purpose || actionSpec.description || '';

  try {
    // Step 1: Generate Pseudo Steps (same as /api/agent/generate-steps)
    console.log(`📋 Step 1/3: Generating pseudo steps...`);
    const pseudoSteps = await generateActionPseudoSteps(
      actionName,
      actionDescription,
      availableModels,
      'action',
      businessContext
    );
    
    console.log(`✅ Step 1/3 complete: Generated ${pseudoSteps.length} pseudo steps`);
    
    // Step 2: Generate UI Components (same as /api/agent/generate-ui-components)
    console.log(`🎨 Step 2/3: Generating UI components...`);
    const uiComponents = await generateActionUIComponents(
      actionName,
      actionDescription,
      pseudoSteps,
      availableModels,
      businessContext
    );
    
    console.log(`✅ Step 2/3 complete: Generated ${uiComponents.length} UI components`);
    
    // Step 3: Generate Executable Code (same as /api/agent/generate-code)
    console.log(`🔨 Step 3/3: Generating executable code...`);
    const codeResult = await generateActionExecutableCode(
      actionName,
      actionDescription,
      pseudoSteps,
      availableModels,
      entityType,
      businessContext
    );
    
    console.log(`✅ Step 3/3 complete: Generated ${codeResult.code.length} chars of executable code`);
    
    // Assemble complete action with all components
    const completeAction: any = {
      id: actionSpec.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName, // Code-safe name for API endpoints
      title: actionTitle, // Human-readable name for UI display
      description: actionDescription,
      role: actionSpec.role || 'member',
      
      // Step 1 results: Pseudo Steps
      pseudoSteps: pseudoSteps,
      
      // Step 2 results: UI Components  
      uiComponentsDesign: uiComponents,
      
      // Step 3 results: Executable Code
      execute: {
        type: 'code' as const,
        code: {
          script: codeResult.code,
          envVars: codeResult.envVars || []
        }
      },
      
      // Additional metadata from code generation
      _internal: {
        hasRealCode: true,
        hasTestCases: !!codeResult.testData,
        codeGenerationMetadata: {
          inputParameters: codeResult.inputParameters,
          outputParameters: codeResult.outputParameters,
          estimatedExecutionTime: codeResult.estimatedExecutionTime,
          testData: codeResult.testData
        }
      },
      
      // Required fields for AgentAction interface
      dataSource: {
        type: 'database' as const,
        database: {
          models: availableModels || []
        }
      },
      results: {
        model: actionName,
        fields: {},
        fieldsToUpdate: {}
      }
    };
    
    console.log(`🎉 Complete action generated using API route logic: ${actionName}`);
    return completeAction;
    
  } catch (error) {
    console.error(`❌ Failed to generate complete action using API route logic: ${actionName}`, error);
    throw error;
  }
} 