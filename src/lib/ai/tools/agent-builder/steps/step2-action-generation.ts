import { generateActions, generatePrismaActions } from '../generation';
import type { AgentAction, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';

/**
 * STEP 2: Action Generation & API Design
 * 
 * Generate actions, endpoints, and API specifications based on database models and analysis.
 * This step creates the functional capabilities for the agent system.
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
 * Execute Step 2: Action Generation and Backend Logic
 */
export async function executeStep2ActionGeneration(
  input: Step2Input
): Promise<Step2Output> {
  console.log('🚀 STEP 2: Starting action generation and backend logic...');
  
  const { step0Analysis, databaseGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    // Create minimal prompt understanding with only data needed for action generation
    // const promptUnderstanding = createActionPromptUnderstanding(step0Analysis);

    console.log('🎯 Generating Prisma actions with Step 0 context...');
    console.log(`📊 Step 0 Action Analysis: ${step0Analysis.actions.filter(a => a.operation === 'create').length} new actions, ${step0Analysis.actions.filter(a => a.operation === 'update').length} action updates`);
    console.log(`🔄 Action Types: ${step0Analysis.actions.filter(a => a.type === 'query').length} queries, ${step0Analysis.actions.filter(a => a.type === 'mutation').length} mutations`);

    // Create a compatible database result structure from Step1Output
    // const compatibleDatabaseResult = {
    //   models: databaseGeneration.models,
    //   enums: databaseGeneration.models.flatMap(model => model.enums || []),
    //   prismaSchema: '' // This would need to be generated or passed from Step 1 if needed
    // };

    const actionsResult = await generatePrismaActions({
      // promptUnderstanding,
      // prismaSchema: databaseGeneration.prismaSchema,
      step0Analysis,
      existingAgent
  });

    const result: Step2Output = {
      actions: actionsResult.actions,
      implementationNotes: `Generated ${actionsResult.actions.length} Prisma actions for ${step0Analysis.domain}. ` +
        `Step 0 identified ${step0Analysis.actions.length} required actions with ${step0Analysis.actions.filter(a => a.operation === 'create').length} new and ${step0Analysis.actions.filter(a => a.operation === 'update').length} updates.`
    };

    console.log('✅ STEP 2: Action generation completed successfully');
    console.log(`🎯 Action Summary:
- Generated Actions: ${result.actions.length}
- Step 0 Action Context: ${step0Analysis.actions.length} total (${step0Analysis.actions.filter(a => a.operation === 'create').length} new, ${step0Analysis.actions.filter(a => a.operation === 'update').length} updates)
- Query vs Mutation: ${step0Analysis.actions.filter(a => a.type === 'query').length} queries, ${step0Analysis.actions.filter(a => a.type === 'mutation').length} mutations`);

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