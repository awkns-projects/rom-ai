import { generateObject } from 'ai';
import { getAgentBuilderModel } from '../generation';
import { promptUnderstandingSchema } from '../schemas';
import type { AgentData, PromptUnderstanding } from '../types';

/**
 * STEP 0: Prompt Understanding & Feature Analysis
 * 
 * Deep comprehension of user intent with comprehensive feature imagination 
 * and cross-component dependency mapping.
 */

export interface Step0Input {
  userRequest: string;
  existingAgent?: AgentData;
}

export interface Step0Output extends PromptUnderstanding {}

/**
 * Generate comprehensive prompt understanding and feature imagination
 * This is the foundation step that informs all subsequent generation steps
 */
export async function executeStep0PromptUnderstanding(
  input: Step0Input
): Promise<Step0Output> {
  console.log('📋 STEP 0: Starting comprehensive prompt understanding...');
  
  const { userRequest, existingAgent } = input;
  
  try {
    const model = await getAgentBuilderModel();
    
    const systemPrompt = `You are an expert business analyst and system architect. Analyze this user request with extreme thoroughness to understand what they want to build.

${existingAgent ? `
EXISTING SYSTEM CONTEXT:
${JSON.stringify(existingAgent, null, 2)}

🔍 CRITICAL: This is an update/extension request for an existing system. Your analysis must focus on:
- What NEW functionality is being requested (not what already exists)
- What SPECIFIC additions or changes are needed
- How the new request ADDS TO or MODIFIES the existing system
- What the user's true intent is (add new tables/models, add new actions, modify existing ones, etc.)

ANALYSIS APPROACH:
1. First, understand what ALREADY EXISTS in the system
2. Then, identify what is NEW or DIFFERENT in the user's request
3. Focus your analysis on the DELTA (what needs to be added/changed)
4. Be very specific about what new models, actions, or schedules are needed

For example:
- If user says "add an animal table", focus on the Animal model and related actions
- If user says "add user management", focus on User model and auth actions
- If user says "modify the product table", focus on what changes to Product model

DO NOT regenerate existing functionality - only analyze what's NEW!
` : `
This is a new system creation request.
`}

Provide comprehensive analysis covering:

1. USER REQUEST ANALYSIS:
   - What is the main goal the user wants to achieve?
   - What business context or domain is this for?
   - What's the complexity level (simple/moderate/complex/enterprise)?
   - What's the urgency level (low/medium/high/critical)?
   - How clear is the request (very_clear/clear/somewhat_unclear/unclear)?
   ${existingAgent ? `
   - What SPECIFIC NEW functionality is being requested?
   - What CHANGES to existing functionality are needed?
   ` : ''}

2. FEATURE IMAGINATION - Think beyond what's explicitly stated:
   - What core features are absolutely essential?
   - What additional features would make this system excellent?
   - What user experience improvements should be included?
   - What business rules and validations are implied?
   - What integrations might be needed?
   ${existingAgent ? `
   - What NEW features complement the existing system?
   - What existing features might need modification?
   ` : ''}

3. DATA MODELING NEEDS - Think about data structure:
   ${existingAgent ? `
   🔍 FOCUS ON NEW MODELS ONLY - Don't duplicate existing ones!
   Existing models: ${existingAgent.models?.map(m => m.name).join(', ') || 'none'}
   ` : ''}
   For each NEW data entity you identify:
   - What NEW models are required? (name, purpose, priority level)
   - What fields does each NEW model need? (name, type, purpose, required status)
   - What NEW enums are needed? (name, purpose, estimated values)
   - What NEW relationships exist between models (including with existing models)?

4. WORKFLOW AUTOMATION NEEDS - Think about actions and processes:
   ${existingAgent ? `
   🔍 FOCUS ON NEW ACTIONS ONLY - Don't duplicate existing ones!
   Existing actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}
   ` : ''}
   - What NEW one-time actions are needed? (manual user actions)
   - What NEW recurring schedules are needed? (automated processes)  
   - What NEW business rules need to be automated?
   - What NEW business processes could benefit from automation?
   
   IMPORTANT: For roles, only use 'admin' or 'member':
   - Use 'admin' for administrative/management functions
   - Use 'member' for regular user functions

5. CHANGE ANALYSIS (if updating existing system):
   - What specific changes are being requested?
   - What type of changes (create/update/delete)?
   - What's the target scope (models/actions/fields/system)?
   - What's the priority and estimated impact?
   - What existing components need to be modified?
   - What new components need to be created?

6. IMPLEMENTATION STRATEGY:
   - What's the recommended approach (incremental/comprehensive/modular/minimal-viable)?
   - What's the execution order?
   - What are the risks?
   - What are the success criteria?
   ${existingAgent ? `
   - How should new components integrate with existing ones?
   - What existing components might be affected?
   ` : ''}

${existingAgent ? `
🚨 CRITICAL REMINDER: Focus on what's NEW in the request, not what already exists!
Your analysis should identify the DELTA - what needs to be added or changed.
` : ''}

Be extremely detailed and think about how everything connects together. Consider the user's business domain and imagine features they might not have thought of but would find valuable.`;

    const result = await generateObject({
      model,
      schema: promptUnderstandingSchema,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `USER REQUEST: "${userRequest}"

Analyze this request comprehensively and provide detailed understanding that will guide the entire system generation process.`
        }
      ],
      temperature: 0.7 // Higher temperature for creative feature imagination
    });

    console.log('✅ STEP 0: Prompt understanding completed successfully');
    console.log(`📊 Analysis Summary:
- Complexity: ${result.object.userRequestAnalysis.complexity}
- Business Context: ${result.object.userRequestAnalysis.businessContext}
- Required Models: ${result.object.dataModelingNeeds.requiredModels.length}
- Required Actions: ${result.object.workflowAutomationNeeds.requiredActions.length}
- Implementation Approach: ${result.object.implementationStrategy.recommendedApproach}`);

    return result.object;
    
  } catch (error) {
    console.error('❌ STEP 0: Prompt understanding failed:', error);
    throw new Error(`Step 0 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 0 output to ensure it has all required information
 */
export function validateStep0Output(output: Step0Output): boolean {
  try {
    // Check required fields
    if (!output.userRequestAnalysis?.mainGoal) {
      console.warn('⚠️ Missing main goal in user request analysis');
      return false;
    }
    
    if (!output.dataModelingNeeds?.requiredModels?.length) {
      console.warn('⚠️ No required models identified');
      return false;
    }
    
    if (!output.workflowAutomationNeeds?.requiredActions?.length) {
      console.warn('⚠️ No required actions identified');
      return false;
    }
    
    if (!output.implementationStrategy?.recommendedApproach) {
      console.warn('⚠️ No implementation strategy identified');
      return false;
    }
    
    console.log('✅ Step 0 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 0 output validation failed:', error);
    return false;
  }
}

/**
 * Extract key insights from Step 0 for downstream steps
 */
export function extractStep0Insights(output: Step0Output) {
  return {
    businessDomain: output.userRequestAnalysis.businessContext,
    complexity: output.userRequestAnalysis.complexity,
    isUpdate: output.changeAnalysisPlan.length > 0,
    modelCount: output.dataModelingNeeds.requiredModels.length,
    actionCount: output.workflowAutomationNeeds.requiredActions.length,
    scheduleCount: output.workflowAutomationNeeds.recurringSchedules.length,
    approach: output.implementationStrategy.recommendedApproach,
    executionOrder: output.implementationStrategy.executionOrder,
    riskLevel: output.implementationStrategy.riskAssessment.length > 3 ? 'high' : 'medium'
  };
} 