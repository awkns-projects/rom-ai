import { generateSchedules } from '../generation';
import type { AgentSchedule, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';
import type { Step2Output } from './step2-action-generation';

/**
 * STEP 3: Schedule Generation & Automation Design
 * 
 * Generate schedules, automation rules, and recurring processes based on database models and actions.
 * This step creates the automation capabilities for the agent system.
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
  implementationComplexity: 'low' | 'medium' | 'high';
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
 * Execute Step 3: Schedule Generation and Automation Planning
 */
export async function executeStep3ScheduleGeneration(
  input: Step3Input
): Promise<Step3Output> {
  console.log('⏰ STEP 3: Starting schedule generation and automation planning...');
  
  const { step0Analysis, databaseGeneration, actionGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    // Create minimal prompt understanding with only data needed for schedule generation
    // const promptUnderstanding = createSchedulePromptUnderstanding(step0Analysis);

    console.log('📅 Generating schedules with Step 0 context...');
    console.log(`📊 Step 0 Schedule Analysis: ${step0Analysis.schedules.filter(s => s.operation === 'create').length} new schedules, ${step0Analysis.schedules.filter(s => s.operation === 'update').length} schedule updates`);
    console.log(`⏱️ Schedule Details: ${step0Analysis.schedules.length} total schedules identified in analysis`);
    
    // Log available actions for schedule generation
    console.log(`🎯 Available Actions from Step 2: ${actionGeneration.actions?.length || 0} actions`);
    if (actionGeneration.actions && actionGeneration.actions.length > 0) {
      console.log(`🔗 Action IDs that schedules can reference:`);
      actionGeneration.actions.forEach((action: any, index: number) => {
        console.log(`   ${index + 1}. "${action.id}" - ${action.name} (${action.type || 'query'})`);
      });
    } else {
      console.warn(`⚠️ No actions available from Step 2 - schedules will have limited functionality`);
    }

    // Note: generateSchedules gets actual schedule requirements from Step 0 analysis 
    // and uses actions from Step 2 to create action chains
    const schedulesResult = await generateSchedules({
      step0Analysis,
      existingAgent,
      availableActions: actionGeneration.actions || []
    });

    const result: Step3Output = {
      schedules: schedulesResult.schedules,
      implementationComplexity: schedulesResult.schedules.length > 3 ? 'high' : schedulesResult.schedules.length > 1 ? 'medium' : 'low'
    };

    // Validate action connections
    const availableActionIds = new Set((actionGeneration.actions || []).map((a: any) => a.id));
    const schedulesWithSteps = result.schedules.filter((s: any) => s.steps && s.steps.length > 0);
    const totalSteps = result.schedules.reduce((sum: number, s: any) => sum + (s.steps?.length || 0), 0);
    const validSteps = result.schedules.reduce((sum: number, s: any) => 
      sum + (s.steps?.filter((step: any) => step.actionId && availableActionIds.has(step.actionId)).length || 0), 0
    );

    console.log('✅ STEP 3: Schedule generation completed successfully');
    console.log(`⏰ Schedule Summary:
- Generated Schedules: ${result.schedules.length}
- Schedules with Action Steps: ${schedulesWithSteps.length}
- Total Action Steps: ${totalSteps}
- Valid Action References: ${validSteps}/${totalSteps} (${totalSteps > 0 ? Math.round((validSteps/totalSteps) * 100) : 0}%)
- Step 0 Schedule Context: ${step0Analysis.schedules.length} total (${step0Analysis.schedules.filter(s => s.operation === 'create').length} new, ${step0Analysis.schedules.filter(s => s.operation === 'update').length} updates)`);

    if (validSteps < totalSteps) {
      console.warn(`⚠️ ${totalSteps - validSteps} schedule steps reference invalid or missing action IDs`);
    }

    return result;
    
  } catch (error) {
    console.error('❌ STEP 3: Schedule generation failed:', error);
    throw new Error(`Step 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const schedulesWithSteps = output.schedules.filter((s: any) => s.steps && s.steps.length > 0);
  const totalSteps = output.schedules.reduce((sum: number, s: any) => sum + (s.steps?.length || 0), 0);
  const stepsWithActionIds = output.schedules.reduce((sum: number, s: any) => 
    sum + (s.steps?.filter((step: any) => step.actionId).length || 0), 0
  );
  
  return {
    scheduleCount: output.schedules.length,
    schedulesWithActionSteps: schedulesWithSteps.length,
    totalActionSteps: totalSteps,
    stepsWithActionIds: stepsWithActionIds,
    actionConnectionRate: totalSteps > 0 ? stepsWithActionIds / totalSteps : 0,
    implementationComplexity: output.schedules.length > 3 ? 'high' : output.schedules.length > 1 ? 'medium' : 'low'
  };
} 