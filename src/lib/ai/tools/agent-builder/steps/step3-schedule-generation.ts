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

    // Note: generateSchedules gets actual schedule requirements from Step 0 analysis 
    // The promptUnderstanding only provides minimal business context
    const schedulesResult = await generateSchedules({
        step0Analysis,
      existingAgent
   } );

    const result: Step3Output = {
      schedules: schedulesResult.schedules
    };

    console.log('✅ STEP 3: Schedule generation completed successfully');
    console.log(`⏰ Schedule Summary:
- Generated Schedules: ${result.schedules.length}
- Step 0 Schedule Context: ${step0Analysis.schedules.length} total (${step0Analysis.schedules.filter(s => s.operation === 'create').length} new, ${step0Analysis.schedules.filter(s => s.operation === 'update').length} updates)`);

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
  return {
    scheduleCount: output.schedules.length
  };
} 