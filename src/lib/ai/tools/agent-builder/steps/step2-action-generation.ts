import { generateActions, generatePrismaActions, generatePseudoSteps, generateUIComponents } from '../generation';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import type { AgentAction, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';

/**
 * STEP 2: Action Generation & API Design
 * 
 * Generate actions, endpoints, and API specifications based on database models and analysis.
 * This step creates the functional capabilities for the agent system WITH EXECUTABLE CODE.
 * 
 * Follows the same three-step pattern as individual API routes:
 * 1. Generate pseudo steps (like /generate-steps)
 * 2. Generate UI components (like /generate-ui-components)  
 * 3. Generate executable code (like /generate-code)
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
  implementationComplexity: 'low' | 'medium' | 'high';
}

// Schema for code generation - same as /generate-code route
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

/**
 * STEP 2A: Generate Pseudo Steps (like /generate-steps route)
 */
async function generateActionPseudoSteps(
  actionName: string,
  actionDescription: string,
  actionType: 'query' | 'mutation',
  availableModels: any[],
  businessContext: string
): Promise<any[]> {
  console.log(`🧩 Step 2A: Generating pseudo steps for action: ${actionName}`);
  
  // Use the same logic as /generate-steps route
  return await generatePseudoSteps(
    actionName,
    actionDescription,
    actionType,
    availableModels || [],
    'action', // entityType
    businessContext
  );
}

/**
 * STEP 2B: Generate UI Components (like /generate-ui-components route)
 */
async function generateActionUIComponents(
  actionName: string,
  actionDescription: string,
  pseudoSteps: any[],
  availableModels: any[],
  businessContext: string
): Promise<any[]> {
  console.log(`🎨 Step 2B: Generating UI components for action: ${actionName}`);
  
  // Use the same logic as /generate-ui-components route
  return await generateUIComponents(
    actionName,
    actionDescription,
    pseudoSteps,
    availableModels || [],
    businessContext
  );
}

/**
 * STEP 2C: Generate Executable Code (like /generate-code route)
 */
async function generateActionExecutableCode(
  actionName: string,
  actionDescription: string,
  actionType: 'query' | 'mutation',
  pseudoSteps: any[],
  availableModels: any[],
  businessContext: string,
  entityType: string = 'general'
): Promise<{
  code: string;
  envVars: any[];
  inputParameters: any[];
  outputParameters: any[];
  estimatedExecutionTime: string;
  testData: any;
}> {
  console.log(`🔨 Step 2C: Generating executable code for action: ${actionName}`);
  
  const model = await getAgentBuilderModel();
  
  // Extract input parameters from first step if available - same logic as /generate-code route
  const extractedInputParams = pseudoSteps.length > 0 && pseudoSteps[0].inputFields ? 
    pseudoSteps[0].inputFields
      .filter((field: any) => field.name && field.name.trim() !== '')
      .map((field: any) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description || `Input parameter for ${field.name}`,
        kind: field.kind === 'object' ? 'object' : 'scalar',
        relationModel: field.relationModel
      })) : [];

  // Use the exact same system prompt as /generate-code route
  const systemPrompt = `You are a senior JavaScript developer generating executable code for ${entityType} operations.

TASK: Generate complete, executable JavaScript code based on the provided pseudo steps.

CONTEXT:
- Name: ${actionName}
- Description: ${actionDescription}
- Entity Type: ${entityType}
- Business Context: ${businessContext}
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

7. RETURN FORMAT:
   Always return: { success: boolean, data: any, message: string, executionTime: number }

8. PERFORMANCE:
   - Include execution time tracking
   - Handle errors gracefully
   - Use appropriate database queries (findUnique vs findMany)
   - Minimize API calls

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
        content: `Generate executable JavaScript code for: ${actionName}

Action Description: ${actionDescription}
Action Type: ${actionType}

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

  return {
    code: result.object.code,
    envVars: result.object.envVars,
    inputParameters: extractedInputParams.length > 0 ? extractedInputParams : result.object.inputParameters,
    outputParameters: result.object.outputParameters,
    estimatedExecutionTime: result.object.estimatedExecutionTime,
    testData: result.object.testData
  };
}

/**
 * AI-powered business process action generation (replaces hardcoded logic)
 */
async function generateBusinessProcessActions(
  businessContext: string,
  entityType: string,
  step0Analysis: any,
  availableModels: any[]
): Promise<any[]> {
  console.log('🤖 Using AI to generate business process actions based on context');
  
  const model = await getAgentBuilderModel();
  
  // Extract external API information
  const externalApis = step0Analysis.externalApis || [];
  const hasExternalApis = externalApis.length > 0;
  
  const systemPrompt = `You are a business process architect who designs high-level workflow actions that integrate multiple systems and automate business processes.

BUSINESS CONTEXT:
- Business Goal: ${businessContext}
- Domain: ${entityType}
- Agent Description: ${step0Analysis.agentDescription || 'No description'}
- Available Models: ${availableModels.map(m => m.name).join(', ') || 'none'}

EXTERNAL API INTEGRATIONS:
${hasExternalApis ? 
  externalApis.map((api: any) => `- ${api.provider}: ${api.primaryUseCase} (${api.connectionType})`).join('\n') :
  '- No external APIs specified'
}

REQUIREMENTS:

1. BUSINESS PROCESS FOCUS:
   - Generate actions that represent complete business workflows
   - Each action should orchestrate multiple steps and systems
   - Focus on automation and integration between systems
   - Actions should solve real business problems, not just data operations

2. EXTERNAL API INTEGRATION:
   - If external APIs are specified, create actions that leverage those APIs
   - Each API should have at least one dedicated integration action
   - Design actions that combine multiple APIs for workflow automation
   - Focus on API-to-API orchestration and data synchronization

3. ACTION TYPES:
   - 'mutation': Actions that create, update, or modify data across systems
   - 'query': Actions that analyze, generate insights, or retrieve complex data

4. AVOID BASIC CRUD:
   - Don't generate actions like "Create Record", "Update Item", "Delete Entry"
   - Users already have basic database operations available
   - Focus on business logic that adds significant value

5. EXAMPLES OF GOOD BUSINESS PROCESS ACTIONS:
   - "Sync Shopify Product Catalog" - Connect to Shopify, fetch products, update local database
   - "Generate Automated Reports" - Analyze data, format results, distribute via email/Slack
   - "Process Customer Onboarding" - Multi-step workflow with validations and notifications
   - "Monitor Inventory Levels" - Check stock, predict demand, trigger reorder workflows

Generate 3-5 meaningful business process actions that represent complete workflows and leverage available integrations.`;

  const result = await generateObject({
    model,
    schema: z.object({
      actions: z.array(z.object({
        name: z.string().describe('Business process action name (e.g., "Sync Customer Data", "Generate Sales Report")'),
        purpose: z.string().describe('Detailed description of the complete workflow including external API integrations'),
        type: z.enum(['query', 'mutation']).describe('query for data analysis/retrieval, mutation for data modification/creation'),
        operation: z.literal('create').describe('All generated actions are new'),
        businessValue: z.string().describe('Explanation of the business value and automation benefit')
      })).min(3).max(5).describe('Business process actions that integrate systems and automate workflows')
    }),
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Based on the business context "${businessContext}" and domain "${entityType}", generate business process actions that:

1. Leverage the available external APIs: ${externalApis.map((api: any) => api.provider).join(', ') || 'none'}
2. Automate complete business workflows (not individual database operations)
3. Integrate multiple systems for end-to-end automation
4. Solve real business problems and add significant value

${hasExternalApis ? 
  `Focus heavily on integrating these external services into comprehensive workflows that span multiple systems.` :
  `Design internal business process automation and data analysis workflows.`
}

Generate actions that represent complete business processes, not basic CRUD operations.`
      }
    ],
    temperature: 0.3,
    maxTokens: 1500
  });

  console.log(`✅ AI generated ${result.object.actions.length} business process actions`);
  
  return result.object.actions.map(action => ({
    name: action.name,
    purpose: action.purpose,
    type: action.type,
    operation: action.operation,
    _aiGenerated: true,
    businessValue: action.businessValue
  }));
}

/**
 * Create a complete action by combining all three steps (like the API routes)
 */
async function createCompleteAction(
  actionSpec: any,
  availableModels: any[],
  businessContext: string,
  entityType: string,
  existingActions: any[] = []
): Promise<any> {
  const actionName = actionSpec.name;
  const actionDescription = actionSpec.purpose || actionSpec.description;
  const actionType = actionSpec.type || 'mutation';
  
  console.log(`🚀 Creating complete action: ${actionName} (${actionType})`);
  
  try {
    // Step 2A: Generate Pseudo Steps (like /generate-steps)
    const pseudoSteps = await generateActionPseudoSteps(
      actionName,
      actionDescription,
      actionType,
      availableModels,
      businessContext
    );
    
    console.log(`✅ Step 2A complete: Generated ${pseudoSteps.length} pseudo steps`);
    
    // Step 2B: Generate UI Components (like /generate-ui-components)
    const uiComponents = await generateActionUIComponents(
      actionName,
      actionDescription,
      pseudoSteps,
      availableModels,
      businessContext
    );
    
    console.log(`✅ Step 2B complete: Generated ${uiComponents.length} UI components`);
    
    // Step 2C: Generate Executable Code (like /generate-code)
    const codeResult = await generateActionExecutableCode(
      actionName,
      actionDescription,
      actionType,
      pseudoSteps,
      availableModels,
      businessContext,
      entityType
    );
    
    console.log(`✅ Step 2C complete: Generated ${codeResult.code.length} chars of executable code`);
    
    // Assemble complete action with all components
    const completeAction: any = {
      id: actionSpec.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName,
      description: actionDescription,
      type: actionType,
      role: actionSpec.role || 'member',
      
      // Step 2A results: Pseudo Steps
      pseudoSteps: pseudoSteps,
      
      // Step 2B results: UI Components  
      uiComponentsDesign: uiComponents,
      
      // Step 2C results: Executable Code
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
        actionType: 'Create' as const,
        model: actionName,
        identifierIds: [],
        fields: {}
      }
    };
    
    console.log(`🎉 Complete action created: ${actionName} with pseudo steps, UI components, and executable code`);
    return completeAction;
    
  } catch (error) {
    console.error(`❌ Failed to create complete action: ${actionName}`, error);
    
    // Return a fallback action with basic structure
    return {
      id: actionSpec.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName,
      description: actionDescription,
      type: actionType,
      role: actionSpec.role || 'member',
      execute: {
        type: 'prompt' as const,
        prompt: {
          content: `Execute action: ${actionDescription}`,
          model: 'gpt-4',
          temperature: 0.2
        }
      },
      dataSource: {
        type: 'database' as const,
        database: {
          models: availableModels || []
        }
      },
      results: {
        actionType: 'Create' as const,
        model: actionName,
        identifierIds: [],
        fields: {}
      },
      _internal: {
        hasRealCode: false,
        hasTestCases: false,
        codeGenerationError: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Execute Step 2: Action Generation and Backend Logic WITH API ROUTE PATTERN
 */
export async function executeStep2ActionGeneration(
  input: Step2Input
): Promise<Step2Output> {
  console.log('🚀 STEP 2: Starting action generation following API route pattern...');
  console.log('📋 Pattern: 1) Generate pseudo steps → 2) Generate UI components → 3) Generate executable code');
  
  const { step0Analysis, databaseGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    // Extract action requirements from Step 0 analysis
    const actionRequirements = step0Analysis.actions || [];
    console.log(`📊 Step 0 Action Analysis: ${actionRequirements.filter(a => a.operation === 'create').length} new actions, ${actionRequirements.filter(a => a.operation === 'update').length} action updates`);
    console.log(`🔄 Action Types: ${actionRequirements.filter(a => a.type === 'query').length} queries, ${actionRequirements.filter(a => a.type === 'mutation').length} mutations`);

    // Determine business context and entity type from step0 analysis
    const businessContext = step0Analysis.phaseAAnalysis?.userRequestAnalysis?.mainGoal || step0Analysis.agentDescription || 'Business operations';
    const entityType = step0Analysis.domain || 'general';
    const availableModels = databaseGeneration.models || [];
    
    console.log(`🎯 Context: ${businessContext} | Domain: ${entityType} | Models: ${availableModels.length}`);
    
    // If no specific actions defined, use AI to generate intelligent actions based on business context
    let actionsToGenerate = actionRequirements;
    if (actionsToGenerate.length === 0) {
      console.log('📝 No specific actions defined, using AI to generate business process actions based on context');
      
      actionsToGenerate = await generateBusinessProcessActions(
        businessContext,
        entityType,
        step0Analysis,
        availableModels
      );
      
      console.log(`🎯 AI Generated ${actionsToGenerate.length} business process actions`);
      console.log(`🔧 Action Types: ${actionsToGenerate.map(a => a.name).join(', ')}`);
    }
    
    console.log(`🔨 Generating ${actionsToGenerate.length} complete actions...`);
    
    // Generate complete actions following the API route pattern
    const completeActions = await Promise.all(
      actionsToGenerate.map(async (actionSpec: any, index: number) => {
        console.log(`\n🔄 Processing action ${index + 1}/${actionsToGenerate.length}: ${actionSpec.name}`);
        
        return await createCompleteAction(
          actionSpec,
          availableModels,
          businessContext,
          entityType,
          existingAgent?.actions || []
        );
      })
    );
    
    // Handle incremental updates by merging with existing actions
    let finalActions = completeActions;
    if (existingAgent?.actions && existingAgent.actions.length > 0) {
      console.log(`📊 Merging with ${existingAgent.actions.length} existing actions`);
      
      // Add existing actions that aren't being updated
      const newActionNames = new Set(completeActions.map(a => a.name));
      const existingActionsToKeep = existingAgent.actions.filter(a => !newActionNames.has(a.name));
      
      finalActions = [...existingActionsToKeep, ...completeActions];
      console.log(`✅ Final action count: ${finalActions.length} (${existingActionsToKeep.length} existing + ${completeActions.length} new)`);
    }
    
    // Calculate implementation complexity
    const codeGeneratedCount = finalActions.filter((a: any) => a._internal?.hasRealCode).length;
    const hasExternalAPIs = step0Analysis.externalApis && step0Analysis.externalApis.length > 0;
    const hasComplexDatabase = databaseGeneration.models.length > 3;
    
    let implementationComplexity: 'low' | 'medium' | 'high' = 'low';
    if (hasExternalAPIs && hasComplexDatabase) {
      implementationComplexity = 'high';
    } else if (hasExternalAPIs || hasComplexDatabase || finalActions.length > 5) {
      implementationComplexity = 'medium';
    }
    
    const result: Step2Output = {
      actions: finalActions,
      implementationComplexity,
      implementationNotes: `Generated ${finalActions.length} actions following API route pattern (pseudo steps → UI components → executable code). ` +
        `${codeGeneratedCount} actions have executable code. ` +
        `Step 0 identified ${actionRequirements.length} required actions. ` +
        `Implementation complexity: ${implementationComplexity} (${hasExternalAPIs ? 'external APIs, ' : ''}${hasComplexDatabase ? 'complex database, ' : ''}${finalActions.length} total actions).`
    };

    console.log('✅ STEP 2: Action generation with API route pattern completed successfully');
    console.log(`🎯 Final Summary:
- Total Actions: ${result.actions.length}
- Actions with Executable Code: ${codeGeneratedCount}
- Actions with Pseudo Steps: ${result.actions.filter((a: any) => a.pseudoSteps?.length > 0).length}
- Actions with UI Components: ${result.actions.filter((a: any) => a.uiComponentsDesign?.length > 0).length}
- Implementation Complexity: ${implementationComplexity}
- Pattern: ✅ Pseudo Steps → ✅ UI Components → ✅ Executable Code`);

    return result;
    
  } catch (error) {
    console.error('❌ STEP 2: Action generation failed:', error);
    throw new Error(`Step 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      !a.name || !a.description || !a.execute
    );
    
    if (invalidActions.length > 0) {
      console.warn(`⚠️ Invalid actions found: ${invalidActions.length}`);
      return false;
    }

    // Check that actions follow the API route pattern
    const actionsWithPseudoSteps = output.actions.filter((a: any) => a.pseudoSteps && a.pseudoSteps.length > 0);
    const actionsWithUIComponents = output.actions.filter((a: any) => a.uiComponentsDesign && a.uiComponentsDesign.length > 0);
    const actionsWithCode = output.actions.filter(a => 
      a.execute && a.execute.type === 'code' && a.execute.code?.script
    );

    if (actionsWithCode.length === 0) {
      console.warn('⚠️ No actions have executable code');
      return false;
    }
    
    console.log(`✅ Step 2 output validation passed: ${output.actions.length} actions`);
    console.log(`📊 API Route Pattern Compliance: ${actionsWithPseudoSteps.length} with pseudo steps, ${actionsWithUIComponents.length} with UI components, ${actionsWithCode.length} with code`);
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
  const actionsWithCode = output.actions.filter((a: any) => a._internal?.hasRealCode);
  const actionsWithPrompts = output.actions.filter((a: any) => a.execute && a.execute.type === 'prompt');
  const actionsWithPseudoSteps = output.actions.filter((a: any) => a.pseudoSteps && a.pseudoSteps.length > 0);
  const actionsWithUIComponents = output.actions.filter((a: any) => a.uiComponentsDesign && a.uiComponentsDesign.length > 0);
  
  return {
    actionCount: output.actions.length,
    hasCustomCode: actionsWithCode.length > 0,
    hasPromptExecution: actionsWithPrompts.length > 0,
    primaryActionTypes: [...new Set(output.actions.map((a: any) => a.type || 'query'))],
    codeGenerationSuccess: actionsWithCode.length / output.actions.length,
    implementationComplexity: output.implementationComplexity,
    executableActionsCount: actionsWithCode.length,
    // API Route Pattern metrics
    apiRoutePatternCompliance: {
      pseudoStepsGenerated: actionsWithPseudoSteps.length / output.actions.length,
      uiComponentsGenerated: actionsWithUIComponents.length / output.actions.length,
      executableCodeGenerated: actionsWithCode.length / output.actions.length,
      fullPatternCompliance: actionsWithPseudoSteps.filter((a: any) => 
        actionsWithUIComponents.some((b: any) => b.id === a.id) && 
        actionsWithCode.some((c: any) => c.id === a.id)
      ).length / output.actions.length
    }
  };
} 