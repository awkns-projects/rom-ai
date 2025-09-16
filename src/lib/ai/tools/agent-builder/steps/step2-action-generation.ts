import { generateActions, generatePrismaActions, getAgentBuilderModel } from '../generation';
import { generateCompleteAction, updateSpecFromPseudoSteps, updatePseudoStepsFromSpec, type TechnicalSpecification } from '../action-generation-shared';
import type { AgentAction, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';
import { generateTitleAndName, sanitizeAgentName } from '../utils';
import { generateObject } from 'ai';
import { z } from 'zod';
import { searchNpmPackages, searchApiDocumentation, combineSearchResults, type WebSearchResult, type NpmPackage } from '../web-search-utils';
import type { OrchestratorConfig } from './orchestrator';

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
  // Web search configuration
  orchestratorConfig?: OrchestratorConfig;
}

export interface Step2Output {
  actions: AgentAction[];
  implementationNotes: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  // Web search results
  webSearchResults?: {
    recommendedPackages: NpmPackage[];
    integrationNotes: string[];
  };
}

// Schemas and functions moved to action-generation-shared.ts for reuse

// Functions moved to action-generation-shared.ts for reuse with API routes

// Old generateActionExecutableCode function moved to action-generation-shared.ts



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
- Available Database Models: ${availableModels.map((m: any) => `${m.name} (${m.fields?.map((f: any) => f.name).join(', ') || 'no fields'})`).join('\n') || 'No models available'}
- External APIs: ${externalApis && externalApis.length > 0 ? 
  externalApis.map((api: any) => `${api.provider} (${api.connectionType})`).join('\n') :
  '- No external APIs specified'
}

🚨 CRITICAL: FOCUS ON COMPLEX BUSINESS PROCESS ACTIONS

**NOTE: CRUD actions are automatically generated separately and not needed here**

**GENERATE: COMPLEX BUSINESS PROCESS ACTIONS**
Generate advanced actions that require:
- AI generation/analysis
- Complex multi-step workflows
- Multiple database operations
- Report generation
- External API integrations
- actionType: "complex"

🚨 CRITICAL BATCH PROCESSING REQUIREMENTS (for COMPLEX actions only):

**ZERO MANUAL SELECTION ALLOWED - ONLY AUTOMATED SCANNING/FILTERING:**

1. **NEVER DESIGN SINGLE-ITEM SELECTION WORKFLOWS**: Do not create actions that require users to manually pick one specific item to process
2. **NO DROPDOWNS FOR ITEM SELECTION**: Never create "Select Product ID", "Choose Customer", "Pick Order" dropdowns
3. **START WITH AUTOMATED SCANNING**: Always begin with database scans, API queries, or automated data retrieval
4. **USE SMART FILTERING**: Replace manual selection with intelligent filters (date ranges, status, categories, conditions)
5. **PROCESS EVERYTHING BY DEFAULT**: Design actions that process ALL relevant items unless filtered out
6. **AUTONOMOUS OPERATION**: Actions should run without human intervention - fully automated scanning and processing

**EXAMPLES OF CORRECT BATCH DESIGN:**
- ✅ "Sync All Low-Stock Products" (scans inventory, finds low stock items automatically)
- ✅ "Process Pending Orders from Last 24 Hours" (filters by date and status automatically)  
- ✅ "Update Customer Profiles with New Preferences" (scans all customers, applies updates)
- ✅ "Validate Product Data Against External API" (processes entire product catalog)

**FORBIDDEN PATTERNS:**
- ❌ "Select Product ID" dropdowns
- ❌ "Choose specific customer" selection
- ❌ "Pick individual order" workflows
- ❌ Any manual item selection interfaces

🔗 PARAMETER CHAINING CAPABILITIES:
- Actions can now be chained together in schedules using parameter references
- Each action's output can be used as input for subsequent actions
- Design actions with clear, useful outputs that can feed into other actions
- Consider how actions can work together as part of larger automated workflows

REQUIREMENTS:

1. COMPLEX BUSINESS PROCESS ACTIONS:
   - Generate actions that represent complete business workflows
   - Each action should orchestrate multiple steps and systems
   - Focus on automation and integration between systems
   - Actions should solve real business problems, not just data operations
   - actionType: "complex"

3. BATCH-FIRST DESIGN PRINCIPLES (for complex actions):
   - Start with filtering criteria (date ranges, status, categories, etc.)
   - Process collections of items throughout the workflow
   - Use batch operations for updates/creates/deletes
   - Design smart defaults for filters when none provided
   - Ensure workflows scale from 1 to 1000+ items

4. PARAMETER CHAINING AWARENESS:
   - Design actions that produce useful outputs for chaining (IDs, status, data objects)
   - Consider how actions can work together in sequences
   - Make outputs descriptive and reusable (e.g., "customerIds", "reportUrl", "processedData")
   - Think about common workflow patterns where one action feeds into another

5. EXTERNAL API INTEGRATION:
   - If external APIs are specified, create actions that leverage those APIs
   - Each API should have at least one dedicated integration action
   - Design actions that combine multiple APIs for workflow automation
   - Focus on API-to-API orchestration and data synchronization

6. ACTION TYPES:
   - CRUD actions: actionType: "crud" - redirect to model pages
   - Complex actions: actionType: "complex" - execute with modal and tracking

EXAMPLES OF COMPLEX ACTIONS (actionType: "complex"):
- "Generate Weekly Sales Report" (AI analysis + report generation)
- "Sync Customer Data from External API" (API integration + batch processing)
- "Analyze Product Performance" (complex queries + AI insights)
- "Process Order Fulfillment Workflow" (multi-step business process)

Generate actions that represent complete business processes AND can be chained together for complex workflows.

🚨 CRITICAL NAMING FORMAT REQUIREMENTS:

FOR EACH ACTION, GENERATE TWO DISTINCT VALUES:

1. **name**: MUST be camelCase with NO spaces (e.g., "createCustomerRecord", "generateSalesReport", "processOrderBatch")
   - Start with lowercase letter
   - No spaces, hyphens, underscores, or special characters
   - Use camelCase for multiple words
   - This will be used internally in code and APIs

2. **title**: MUST be properly spaced, capitalized text (e.g., "Create Customer Record", "Generate Sales Report", "Process Order Batch")
   - Use normal spacing between words
   - Proper capitalization (Title Case)
   - This is what users will see in the interface
   - Should be the human-readable version of the name

EXAMPLES OF CORRECT NAMING:
- ✅ name: "createCustomerRecord", title: "Create Customer Record", actionType: "crud", crudOperation: "create", targetModel: "Customer"
- ✅ name: "generateWeeklyReport", title: "Generate Weekly Report", actionType: "complex"
- ✅ name: "updateProductRecord", title: "Update Product Record", actionType: "crud", crudOperation: "update", targetModel: "Product"
- ✅ name: "syncInventoryData", title: "Sync Inventory Data", actionType: "complex"

❌ WRONG NAMING PATTERNS:
- name: "Create Customer Data" (has spaces)
- name: "sync-inventory-data" (has hyphens)
- title: "createCustomerRecord" (no spaces, not user-friendly)
- title: "sync inventory data" (not properly capitalized)

BOTH name AND title MUST BE PROVIDED FOR EVERY ACTION.`;

  const result = await generateObject({
    model,
    schema: z.object({
      actions: z.array(z.object({
        name: z.string().describe('camelCase identifier for internal use (e.g., "createCustomerRecord", "generateSalesReport") - NO SPACES, will be used in code'),
        title: z.string().describe('User-friendly display name with proper spacing and capitalization (e.g., "Create Customer Record", "Generate Sales Report") - what users see'),
        purpose: z.string().describe('Detailed description of the complete workflow including external API integrations'),
        operation: z.literal('create').describe('All generated actions are new'),
        actionType: z.enum(['crud', 'complex']).describe('Type of action: "crud" for model operations, "complex" for business processes'),
        crudOperation: z.enum(['create', 'read', 'update', 'delete', 'list']).optional().describe('CRUD operation type (only for crud actions)'),
        targetModel: z.string().optional().describe('Target model name (only for crud actions)'),
        businessValue: z.string().describe('Explanation of the business value and automation benefit'),
        expectedOutputs: z.array(z.string()).describe('List of key outputs this action produces that could be used by other actions (e.g., "customerId", "reportUrl", "processedData")').optional(),
        chainingSuggestions: z.string().describe('Brief note on how this action could work with others in a chained workflow').optional()
      })).min(3).max(15).describe('CRUD actions for all models PLUS business process actions that integrate systems and automate workflows')
    }),
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Based on the business context "${businessContext}" and domain "${entityType}", generate COMPLEX BUSINESS PROCESS ACTIONS that:

1. Leverage the available external APIs: ${externalApis.map((api: any) => api.provider).join(', ') || 'none'}
2. Require AI generation, analysis, or complex processing
3. Integrate multiple systems for end-to-end automation
4. Generate reports or insights
5. Perform multi-step workflows that can't be done with simple database queries
6. 🔗 PRODUCE CHAINABLE OUTPUTS: Design actions that output useful data for parameter chaining

${hasExternalApis ? 
  `Focus heavily on integrating these external services into comprehensive workflows that span multiple systems. Consider how data flows between different APIs and services.` :
  `Design internal business process automation and data analysis workflows that can be chained together.`
}

🔗 CHAINING EXAMPLES:
- Action 1: "Process New Customer" → outputs: customerId, customerData
- Action 2: "Send Welcome Email" → uses customerId from Action 1
- Action 3: "Setup Customer Dashboard" → uses customerData from Action 1

Generate 3-7 complex business process actions that represent complete workflows and can be chained together.

**NOTE: Do not generate basic CRUD actions (Create/Read/Update/Delete) as these are handled automatically by the system.**`
      }
    ],
    temperature: 0.3,
    maxTokens: 2000
  });

  console.log(`✅ AI generated ${result.object.actions.length} business process actions`);
  
  // Validate that AI generated proper name and title formats
  const validatedActions = result.object.actions.map(action => {
    // Validate name format (should be camelCase)
    if (!action.name || /\s/.test(action.name) || /[-_]/.test(action.name)) {
      console.warn(`⚠️ Action name "${action.name}" is not camelCase. Expected format: "syncCustomerData"`);
    }
    
    // Validate title format (should have spaces and proper capitalization)
    if (!action.title || !/\s/.test(action.title) || action.title === action.name) {
      console.warn(`⚠️ Action title "${action.title}" is not user-friendly. Expected format: "Sync Customer Data"`);
    }
    
    return action;
  });
  
  return validatedActions.map(action => ({
    name: action.name,
    title: action.title,
    purpose: action.purpose,
    operation: action.operation,
    actionType: action.actionType,
    crudOperation: action.crudOperation,
    targetModel: action.targetModel,
    _aiGenerated: true,
    businessValue: action.businessValue,
    expectedOutputs: action.expectedOutputs || [],
    chainingSuggestions: action.chainingSuggestions
  }));
}

/**
 * Create a complete action using shared API route logic
 */
async function createCompleteAction(
  actionSpec: any,
  availableModels: any[],
  businessContext: string,
  entityType: string,
  existingActions: any[] = [],
  prismaSchema?: string,
  externalApis?: any[],
  availableEnums?: any[]
): Promise<any> {
  // Use the AI-generated values directly - the AI should generate proper name and title
  const actionTitle = actionSpec.title;
  const actionName = actionSpec.name;
  
  console.log(`🚀 Creating complete action using AI-generated values: ${actionName} (title: "${actionTitle}")`);
  
  try {
    // Use the shared function that replicates the exact same logic as the API routes
    return await generateCompleteAction(
      {
        name: actionName,
        title: actionTitle,
        purpose: actionSpec.purpose,
        description: actionSpec.description,
        role: actionSpec.role,
        id: actionSpec.id
      },
      availableModels,
      businessContext,
      entityType,
      existingActions,
      prismaSchema,
      externalApis,
      availableEnums
    );
  } catch (error) {
    console.error(`❌ Failed to create complete action using shared logic: ${actionName}`, error);
    throw error;
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
    // Action type logging removed - actions no longer have type fields

    // Determine business context and entity type from step0 analysis
    const businessContext = step0Analysis.phaseAAnalysis?.userRequestAnalysis?.mainGoal || step0Analysis.agentDescription || 'Business operations';
    const entityType = step0Analysis.domain || 'general';
    const availableModels = databaseGeneration.models || [];
    
    console.log(`🎯 Context: ${businessContext} | Domain: ${entityType} | Models: ${availableModels.length}`);
    
    // 🌐 WEB SEARCH ENHANCEMENT: Find relevant npm packages and API documentation
    let webSearchResults: Step2Output['webSearchResults'];
    if (input.orchestratorConfig?.enableWebSearch) {
      console.log('🔍 Searching for relevant npm packages and API documentation...');
      
      try {
        const packageSearches: Promise<WebSearchResult>[] = [];
        const docSearches: Promise<WebSearchResult>[] = [];
        
        // Search for domain-specific packages
        packageSearches.push(
          searchNpmPackages(
            `${entityType} ${businessContext} next.js typescript`,
            `${entityType} business automation`,
            input.orchestratorConfig
          )
        );
        
        // Search for external API packages if APIs are specified
        if (step0Analysis.externalApis && step0Analysis.externalApis.length > 0) {
          for (const api of step0Analysis.externalApis.slice(0, 3)) { // Limit to first 3 APIs
            packageSearches.push(
              searchNpmPackages(
                `${api.provider} typescript sdk client`,
                `${api.provider} integration`,
                input.orchestratorConfig
              )
            );
            
            docSearches.push(
              searchApiDocumentation(
                api.provider,
                `${entityType} integration with Next.js`,
                input.orchestratorConfig
              )
            );
          }
        }
        
        // Search for common business automation packages
        packageSearches.push(
          searchNpmPackages(
            'prisma database orm validation zod',
            'database and validation utilities',
            input.orchestratorConfig
          )
        );
        
        const [packageResults, docResults] = await Promise.all([
          Promise.all(packageSearches),
          Promise.all(docSearches)
        ]);
        
        const combinedResults = await combineSearchResults(packageResults, [], docResults);
        
        webSearchResults = {
          recommendedPackages: combinedResults.recommendedPackages,
          integrationNotes: [
            `Found ${combinedResults.recommendedPackages.length} recommended npm packages for enhanced functionality`,
            `Located ${combinedResults.relevantDocs.length} documentation resources for API integrations`,
            'Web search enhanced action generation with industry-standard packages'
          ]
        };
        
        console.log(`✅ Web search enhanced action generation with ${combinedResults.recommendedPackages.length} packages and ${combinedResults.relevantDocs.length} docs`);
        
      } catch (webSearchError) {
        console.warn('⚠️ Web search failed, continuing with standard generation:', webSearchError);
        webSearchResults = {
          recommendedPackages: [],
          integrationNotes: ['Web search unavailable, using standard action generation']
        };
      }
    }
    
    // Generate only complex business process actions (CRUD handled via Data Models UI + Chat tools)
    let actionsToGenerate: any[] = [];
    
    if (actionRequirements.length > 0) {
      console.log(`📋 Step 0 provided ${actionRequirements.length} specific action requirements`);
      // Filter out any CRUD actions from Step 0 requirements
      actionsToGenerate = actionRequirements.filter(action => (action as any).actionType !== 'crud');
      console.log(`✅ Using ${actionsToGenerate.length} complex actions from Step 0 (${actionRequirements.length - actionsToGenerate.length} CRUD actions filtered out)`);
    } else {
      console.log('📝 No specific actions from Step 0, generating AI-powered business process actions');
      actionsToGenerate = await generateBusinessProcessActions(
        businessContext,
        entityType,
        step0Analysis,
        availableModels
      );
      console.log(`✅ AI Generated ${actionsToGenerate.length} business process actions`);
    }
    
    console.log(`🎯 Total Actions to Generate: ${actionsToGenerate.length} (complex actions only)`);
    console.log(`🔧 Complex Actions: ${actionsToGenerate.map((a: any) => a.name).join(', ')}`);
    console.log(`📊 CRUD Operations: Available via Data Models UI and Chat interface tools`);
    
    console.log(`🔨 Generating ${actionsToGenerate.length} complete actions...`);
    
    // Generate complete complex actions (no CRUD actions to process)
    const completeActions = await Promise.all(
      actionsToGenerate.map(async (actionSpec: any, index: number) => {
        console.log(`\n🔄 Processing complex action ${index + 1}/${actionsToGenerate.length}: ${actionSpec.name}`);
        
        // All actions here are complex actions - generate full implementation
        return await createCompleteAction(
          actionSpec,
          availableModels,
          businessContext,
          entityType,
          existingAgent?.actions || [],
          databaseGeneration?.prismaSchema,
          step0Analysis.externalApis || [],
          databaseGeneration?.enums || []
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
    
    // Calculate implementation complexity (only complex actions now)
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
      implementationNotes: `Generated ${finalActions.length} complex business process actions. ` +
        `${codeGeneratedCount} actions have executable code. ` +
        `Step 0 identified ${actionRequirements.length} required actions. ` +
        `CRUD operations available via Data Models UI and Chat interface tools. ` +
        `Implementation complexity: ${implementationComplexity} (${hasExternalAPIs ? 'external APIs, ' : ''}${hasComplexDatabase ? 'complex database, ' : ''}${finalActions.length} actions). ` +
        `${webSearchResults?.integrationNotes.join(' ') || ''}`,
      webSearchResults
    };

    console.log('✅ STEP 2: Action generation completed successfully');
    console.log(`🎯 Final Summary:
- Total Actions: ${result.actions.length} (complex actions only)
- Actions with Executable Code: ${codeGeneratedCount}
- Actions with Technical Specifications: ${result.actions.filter((a: any) => a.technicalSpecification).length}
- Actions with Pseudo Steps: ${result.actions.filter((a: any) => a.pseudoSteps?.length > 0).length}
- Implementation Complexity: ${implementationComplexity}
- CRUD Operations: Available via Data Models UI and Chat tools
- Optimization: ✅ No CRUD action generation overhead`);

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

    // Check that actions follow the NEW 3-step pattern
    const actionsWithTechnicalSpecs = output.actions.filter((a: any) => a.technicalSpecification);
    const actionsWithPseudoSteps = output.actions.filter((a: any) => a.pseudoSteps && a.pseudoSteps.length > 0);
    const actionsWithCode = output.actions.filter(a => 
      a.execute && a.execute.type === 'code' && a.execute.code?.script
    );

    if (actionsWithCode.length === 0) {
      console.warn('⚠️ No actions have executable code');
      return false;
    }
    
    console.log(`✅ Step 2 output validation passed: ${output.actions.length} actions`);
    console.log(`📊 NEW 3-Step Pattern Compliance: ${actionsWithTechnicalSpecs.length} with technical specs, ${actionsWithPseudoSteps.length} with pseudo steps, ${actionsWithCode.length} with code`);
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
  const actionsWithTechnicalSpecs = output.actions.filter((a: any) => a.technicalSpecification);
  const actionsWithPseudoSteps = output.actions.filter((a: any) => a.pseudoSteps && a.pseudoSteps.length > 0);
  
  return {
    actionCount: output.actions.length,
    hasCustomCode: actionsWithCode.length > 0,
    hasPromptExecution: actionsWithPrompts.length > 0,
    primaryActionTypes: Array.from(new Set(output.actions.map((a: any) => a.type || 'query'))),
    codeGenerationSuccess: actionsWithCode.length / output.actions.length,
    implementationComplexity: output.implementationComplexity,
    executableActionsCount: actionsWithCode.length,
    // NEW 3-Step Pattern metrics
    technicalSpecPatternCompliance: {
      technicalSpecsGenerated: actionsWithTechnicalSpecs.length / output.actions.length,
      pseudoStepsGenerated: actionsWithPseudoSteps.length / output.actions.length,
      executableCodeGenerated: actionsWithCode.length / output.actions.length,
      fullPatternCompliance: actionsWithTechnicalSpecs.filter((a: any) => 
        actionsWithPseudoSteps.some((b: any) => b.id === a.id) && 
        actionsWithCode.some((c: any) => c.id === a.id)
      ).length / output.actions.length
    }
  };
} 