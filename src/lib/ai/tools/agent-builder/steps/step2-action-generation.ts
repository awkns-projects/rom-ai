import { generateActions, generatePrismaActions, getAgentBuilderModel } from '../generation';
import { generateCompleteAction, updateSpecFromPseudoSteps, updatePseudoStepsFromSpec, type TechnicalSpecification } from '../action-generation-shared';
import type { AgentAction, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';
import { generateTitleAndName, sanitizeAgentName } from '../utils';
import { generateObject } from 'ai';
import { z } from 'zod';

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

🚨 CRITICAL BATCH PROCESSING REQUIREMENTS:

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

1. BUSINESS PROCESS FOCUS:
   - Generate actions that represent complete business workflows
   - Each action should orchestrate multiple steps and systems
   - Focus on automation and integration between systems
   - Actions should solve real business problems, not just data operations

2. BATCH-FIRST DESIGN PRINCIPLES:
   - Start with filtering criteria (date ranges, status, categories, etc.)
   - Process collections of items throughout the workflow
   - Use batch operations for updates/creates/deletes
   - Design smart defaults for filters when none provided
   - Ensure workflows scale from 1 to 1000+ items

3. PARAMETER CHAINING AWARENESS:
   - Design actions that produce useful outputs for chaining (IDs, status, data objects)
   - Consider how actions can work together in sequences
   - Make outputs descriptive and reusable (e.g., "customerIds", "reportUrl", "processedData")
   - Think about common workflow patterns where one action feeds into another

4. EXTERNAL API INTEGRATION:
   - If external APIs are specified, create actions that leverage those APIs
   - Each API should have at least one dedicated integration action
   - Design actions that combine multiple APIs for workflow automation
   - Focus on API-to-API orchestration and data synchronization

5. ACTION TYPES:
   - 'mutation': Actions that create, update, or modify data across systems
   - 'query': Actions that analyze, generate insights, or retrieve complex data

6. AVOID BASIC CRUD:
   - Don't generate actions like "Create Record", "Update Item", "Delete Entry"
   - Users already have basic database operations available
   - Focus on business logic that adds significant value

7. EXAMPLES OF CHAINABLE BATCH BUSINESS PROCESS ACTIONS:
   - "Import Customer Data" → processes all customers → outputs customerIds → feeds into "Send Welcome Email Campaign"
   - "Analyze Sales Data" → analyzes all sales → outputs reportId → feeds into "Generate Dashboard"
   - "Process Orders Batch" → processes all pending orders → outputs orderIds → feeds into "Update Inventory Levels"
   - "Fetch User Preferences" → gets all user preferences → outputs preferences → feeds into "Customize Experience Campaign"
   - "Validate Product Data" → validates all products → outputs validatedData → feeds into "Sync to Catalog"

8. INPUT PARAMETER DESIGN:
   Actions should accept parameters directly as defined in their pseudo steps.
   Parameters should be intuitive and match the action's natural requirements.

**ACTION DESIGN EXAMPLES:**

✅ GOOD ACTION DESIGNS:
- "Generate Weekly Report" (takes date range parameters)
- "Update Customer Profile" (takes customer ID and update data)
- "Process Order" (takes order ID and processing options)
- "Send Email Campaign" (takes campaign parameters and recipient criteria)

Generate 3-5 meaningful business process actions that can work independently OR be chained together for complex automation workflows.

🚨 CRITICAL NAMING FORMAT REQUIREMENTS:

FOR EACH ACTION, GENERATE TWO DISTINCT VALUES:

1. **name**: MUST be camelCase with NO spaces (e.g., "syncCustomerData", "generateSalesReport", "processOrderBatch")
   - Start with lowercase letter
   - No spaces, hyphens, underscores, or special characters
   - Use camelCase for multiple words
   - This will be used internally in code and APIs

2. **title**: MUST be properly spaced, capitalized text (e.g., "Sync Customer Data", "Generate Sales Report", "Process Order Batch")
   - Use normal spacing between words
   - Proper capitalization (Title Case)
   - This is what users will see in the interface
   - Should be the human-readable version of the name

EXAMPLES OF CORRECT NAMING:
- ✅ name: "syncCustomerProfiles", title: "Sync Customer Profiles"
- ✅ name: "generateWeeklyReport", title: "Generate Weekly Report"
- ✅ name: "processOrderQueue", title: "Process Order Queue"
- ✅ name: "updateInventoryLevels", title: "Update Inventory Levels"

❌ WRONG NAMING PATTERNS:
- name: "Sync Customer Data" (has spaces)
- name: "sync-customer-data" (has hyphens)
- title: "syncCustomerData" (no spaces, not user-friendly)
- title: "sync customer data" (not properly capitalized)

BOTH name AND title MUST BE PROVIDED FOR EVERY ACTION.`;

  const result = await generateObject({
    model,
    schema: z.object({
            actions: z.array(z.object({
        name: z.string().describe('camelCase identifier for internal use (e.g., "syncCustomerData", "generateSalesReport") - NO SPACES, will be used in code'),
        title: z.string().describe('User-friendly display name with proper spacing and capitalization (e.g., "Sync Customer Data", "Generate Sales Report") - what users see'),
        purpose: z.string().describe('Detailed description of the complete workflow including external API integrations'),
        operation: z.literal('create').describe('All generated actions are new'),
        businessValue: z.string().describe('Explanation of the business value and automation benefit'),
        expectedOutputs: z.array(z.string()).describe('List of key outputs this action produces that could be used by other actions (e.g., "customerId", "reportUrl", "processedData")').optional(),
        chainingSuggestions: z.string().describe('Brief note on how this action could work with others in a chained workflow').optional()
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
5. 🔗 PRODUCE CHAINABLE OUTPUTS: Design actions that output useful data for parameter chaining

${hasExternalApis ? 
  `Focus heavily on integrating these external services into comprehensive workflows that span multiple systems. Consider how data flows between different APIs and services.` :
  `Design internal business process automation and data analysis workflows that can be chained together.`
}

🔗 CHAINING EXAMPLES:
- Action 1: "Process New Customer" → outputs: customerId, customerData
- Action 2: "Send Welcome Email" → uses customerId from Action 1
- Action 3: "Setup Customer Dashboard" → uses customerData from Action 1

Generate actions that represent complete business processes AND can be chained together for complex workflows.`
      }
    ],
    temperature: 0.3,
    maxTokens: 1500
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
      implementationNotes: `Generated ${finalActions.length} actions following NEW 3-step pattern (technical spec → pseudo steps → executable code). ` +
        `${codeGeneratedCount} actions have executable code. ` +
        `Step 0 identified ${actionRequirements.length} required actions. ` +
        `Implementation complexity: ${implementationComplexity} (${hasExternalAPIs ? 'external APIs, ' : ''}${hasComplexDatabase ? 'complex database, ' : ''}${finalActions.length} total actions).`
    };

    console.log('✅ STEP 2: Action generation with NEW 3-step pattern completed successfully');
    console.log(`🎯 Final Summary:
- Total Actions: ${result.actions.length}
- Actions with Executable Code: ${codeGeneratedCount}
- Actions with Technical Specifications: ${result.actions.filter((a: any) => a.technicalSpecification).length}
- Actions with Pseudo Steps: ${result.actions.filter((a: any) => a.pseudoSteps?.length > 0).length}
- Implementation Complexity: ${implementationComplexity}
- NEW Pattern: ✅ Technical Spec → ✅ Pseudo Steps → ✅ Executable Code`);

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
    primaryActionTypes: [...new Set(output.actions.map((a: any) => a.type || 'query'))],
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