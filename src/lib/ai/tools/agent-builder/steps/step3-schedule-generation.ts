import { generateSchedules } from '../generation';
import type { AgentSchedule, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';
import type { Step2Output } from './step2-action-generation';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';

/**
 * STEP 3: Schedule Generation & Automation Design - MIGRATION APPROACH
 * 
 * NEW APPROACH: Generate schedules that chain actions with WHERE clauses for batch processing
 * - Schedules orchestrate multiple single-record actions
 * - Use WHERE clauses to select records for processing
 * - Support parameter chaining between actions
 * - Enable parallel processing of multiple records
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
 * NEW MIGRATION APPROACH: Generate schedules with action chaining and WHERE clauses
 */
async function generateActionChainingSchedules(
  step0Analysis: Step0Output,
  availableModels: any[],
  availableActions: any[]
): Promise<AgentSchedule[]> {
  console.log('🚀 NEW MIGRATION: Generating schedules with action chaining and WHERE clauses');
  
  const model = await getAgentBuilderModel();
  
  // Extract business context
  const businessContext = step0Analysis.phaseAAnalysis?.userRequestAnalysis?.mainGoal || 
                         step0Analysis.agentDescription || 
                         'Business operations';
  
  // Group actions by target model for efficient chaining
  const actionsByModel: Record<string, any[]> = {};
  availableActions.forEach(action => {
    if (action.targetModel) {
      if (!actionsByModel[action.targetModel]) {
        actionsByModel[action.targetModel] = [];
      }
      actionsByModel[action.targetModel].push(action);
    }
  });
  
  console.log(`📊 Actions grouped by model:`, Object.keys(actionsByModel).map(model => `${model}: ${actionsByModel[model].length} actions`));
  
  const systemPrompt = `You are a workflow automation architect designing schedules that chain single-record actions for batch processing.

🎯 MIGRATION APPROACH: Schedules Chain Actions + WHERE Clauses = Batch Processing

BUSINESS CONTEXT: ${businessContext}
DOMAIN: ${step0Analysis.domain}

AVAILABLE MODELS:
${availableModels.map(m => `- ${m.name}: ${m.fields?.map((f: any) => `${f.name}:${f.type}`).join(', ') || 'no fields'}`).join('\n')}

AVAILABLE ACTIONS BY MODEL:
${Object.entries(actionsByModel).map(([model, actions]) => `
${model}:
${actions.map((a: any) => `  - ${a.name}: ${a.description}`).join('\n')}
`).join('')}

🚨 CRITICAL SCHEDULE DESIGN REQUIREMENTS:

1. **ACTION CHAINING**: Each schedule chains 2-4 actions that work together
2. **WHERE CLAUSE FILTERING**: Use WHERE clauses to select records for processing
3. **SINGLE-RECORD ACTIONS**: Each action processes one record, schedule handles batch
4. **BUSINESS WORKFLOWS**: Design schedules that implement complete business processes

🔧 SCHEDULE DESIGN PATTERNS:

**Pattern 1: Sequential Processing**
- Step 1: Action A with WHERE clause → processes matching records
- Step 2: Action B with WHERE clause → processes records updated by Step 1
- Step 3: Action C with WHERE clause → final processing

**Pattern 2: Model-to-Model Workflows**
- Step 1: Process Model A records with Action X
- Step 2: Process related Model B records with Action Y
- Step 3: Update Model A records based on Model B results

**Pattern 3: Periodic Maintenance**
- Step 1: Find stale records with WHERE clause
- Step 2: Refresh/update those records
- Step 3: Clean up or archive processed records

🎯 WHERE CLAUSE EXAMPLES:
- { model: "Customer", conditions: [{ field: "lastUpdated", operator: "<", value: "7 days ago" }] }
- { model: "Order", conditions: [{ field: "status", operator: "=", value: "pending" }] }
- { model: "Product", conditions: [{ field: "stock", operator: "<", value: 10 }] }

📅 SCHEDULE FREQUENCY GUIDELINES:
- Hourly: Critical real-time processing
- Daily: Regular maintenance and updates  
- Weekly: Analysis and reporting
- Monthly: Deep analysis and cleanup

Generate schedules as needed (0-4) that chain actions together for business workflows.`;

  const result = await generateObject({
    model,
    schema: z.object({
      schedules: z.array(z.object({
        name: z.string().describe('camelCase schedule name (e.g., "dailyCustomerProcessing")'),
        title: z.string().describe('User-friendly title (e.g., "Daily Customer Processing")'),
        description: z.string().describe('What this schedule accomplishes'),
        frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
        businessValue: z.string().describe('Why this schedule is important'),
        actionChain: z.array(z.object({
          stepNumber: z.number(),
          actionName: z.string().describe('Name of action to execute'),
          targetModel: z.string().describe('Model this step processes'),
          whereConditions: z.array(z.object({
            field: z.string(),
            operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'IS NULL', 'IS NOT NULL']),
            value: z.any().describe('Value to compare against (can be string, number, array, or system value)')
          })),
          maxRecords: z.number().optional().describe('Maximum records to process in this step'),
          continueOnError: z.boolean().optional().describe('Whether to continue if this step fails')
        })).min(1).max(4)
      })).min(0).max(4)
    }),
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Design schedules that chain the available actions together for business workflows (0-4 schedules as needed).

Each schedule should:
1. Use WHERE clauses to select records for processing
2. Chain 2-4 actions that work together
3. Implement a complete business process
4. Process records efficiently in batches

Available actions to chain:
${availableActions.map(a => `- ${a.name} (${a.targetModel}): ${a.description}`).join('\n')}

Focus on creating valuable automated workflows that solve real business problems.`
      }
    ],
    temperature: 0.4,
    maxTokens: 2000
  });

  console.log(`✅ Generated ${result.object.schedules.length} action-chaining schedules`);
  
  // Convert to AgentSchedule format
  const schedules: AgentSchedule[] = result.object.schedules.map(scheduleSpec => {
    // Create cron pattern based on frequency
    const getCronPattern = (freq: string): string => {
      switch (freq) {
        case 'hourly': return '0 * * * *';
        case 'daily': return '0 9 * * *';  // 9 AM daily
        case 'weekly': return '0 9 * * 1'; // 9 AM Mondays
        case 'monthly': return '0 9 1 * *'; // 9 AM 1st of month
        default: return '0 9 * * *';
      }
    };
    
    // Convert action chain to ActionChainStep format
    const steps = scheduleSpec.actionChain.map(chainStep => {
      // Find the corresponding action
      const action = availableActions.find(a => a.name === chainStep.actionName);
  
  return {
        id: `step_${chainStep.stepNumber}_${Date.now()}`,
        actionId: action?.id || `unknown_${chainStep.actionName}`,
        name: `Step ${chainStep.stepNumber}: ${chainStep.actionName}`,
        description: `Process ${chainStep.targetModel} records with ${chainStep.actionName}`,
        // NEW: WHERE clause for record selection
        whereClause: {
          model: chainStep.targetModel,
          conditions: chainStep.whereConditions.map(condition => ({
            field: condition.field,
            operator: condition.operator,
            value: condition.value
          }))
        },
        // NEW: Chain control
        continueOnError: chainStep.continueOnError || false,
        maxRecords: chainStep.maxRecords || 100,
        inputParams: {}, // Could be populated with parameter references
        condition: { type: 'always' as const },
        onError: {
          action: chainStep.continueOnError ? 'continue' as const : 'stop' as const
        }
      };
    });
    
    return {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: scheduleSpec.name,
      title: scheduleSpec.title,
      description: scheduleSpec.description,
      trigger: {
        type: 'cron' as const,
        pattern: getCronPattern(scheduleSpec.frequency),
        active: true
      },
      steps,
      globalInputs: {},
      createdAt: new Date().toISOString(),
      version: 1
    };
  });
  
  return schedules;
}

/**
 * Execute Step 3: Schedule Generation using NEW MIGRATION APPROACH
 */
export async function executeStep3ScheduleGeneration(
  input: Step3Input
): Promise<Step3Output> {
  console.log('⏰ STEP 3: Starting schedule generation using NEW MIGRATION APPROACH...');
  console.log('📋 Migration Pattern: Generate schedules that chain actions with WHERE clauses for batch processing');
  
  const { step0Analysis, databaseGeneration, actionGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    const availableModels = databaseGeneration.models || [];
    const availableActions = actionGeneration.actions || [];
    
    console.log(`📊 Available Models: ${availableModels.length}`);
    console.log(`📊 Available Actions: ${availableActions.length}`);
    
    if (availableActions.length === 0) {
      console.warn('⚠️ No actions available for schedule generation');
      return {
        schedules: [],
        implementationComplexity: 'low'
      };
    }
    
    // Generate schedules using NEW MIGRATION APPROACH
    console.log('🔨 Generating action-chaining schedules...');
    const generatedSchedules = await generateActionChainingSchedules(
      step0Analysis,
      availableModels,
      availableActions
    );
    
    // Handle incremental updates by merging with existing schedules
    let finalSchedules = generatedSchedules;
    if (existingAgent?.schedules && existingAgent.schedules.length > 0) {
      console.log(`📊 Merging with ${existingAgent.schedules.length} existing schedules`);
      
      // Add existing schedules that aren't being updated
      const newScheduleNames = new Set(generatedSchedules.map(s => s.name));
      const existingSchedulesToKeep = existingAgent.schedules.filter(s => !newScheduleNames.has(s.name));
      
      finalSchedules = [...existingSchedulesToKeep, ...generatedSchedules];
      console.log(`✅ Final schedule count: ${finalSchedules.length} (${existingSchedulesToKeep.length} existing + ${generatedSchedules.length} new)`);
    }

    // Validate action connections
    const availableActionIds = new Set(availableActions.map(a => a.id));
    const schedulesWithSteps = finalSchedules.filter(s => s.steps && s.steps.length > 0);
    const totalSteps = finalSchedules.reduce((sum, s) => sum + (s.steps?.length || 0), 0);
    const validSteps = finalSchedules.reduce((sum, s) => 
      sum + (s.steps?.filter(step => step.actionId && availableActionIds.has(step.actionId)).length || 0), 0
    );
    
    // Calculate implementation complexity
    const avgStepsPerSchedule = totalSteps / Math.max(finalSchedules.length, 1);
    const hasComplexChains = avgStepsPerSchedule > 3;
    const hasMultipleModels = new Set(finalSchedules.flatMap(s => 
      s.steps?.map(step => (step as any).whereClause?.model).filter(Boolean) || []
    )).size > 3;
    
    let implementationComplexity: 'low' | 'medium' | 'high' = 'low';
    if (hasComplexChains && hasMultipleModels) {
      implementationComplexity = 'high';
    } else if (hasComplexChains || hasMultipleModels || finalSchedules.length > 3) {
      implementationComplexity = 'medium';
    }

    const result: Step3Output = {
      schedules: finalSchedules,
      implementationComplexity
    };

    console.log('✅ STEP 3: NEW MIGRATION schedule generation completed successfully');
    console.log(`⏰ Migration Summary:
- Generated Schedules: ${result.schedules.length}
- Schedules with Action Chains: ${schedulesWithSteps.length}
- Total Action Steps: ${totalSteps}
- Valid Action References: ${validSteps}/${totalSteps} (${totalSteps > 0 ? Math.round((validSteps/totalSteps) * 100) : 0}%)
- Average Steps per Schedule: ${Math.round(avgStepsPerSchedule * 10) / 10}
- Implementation Complexity: ${implementationComplexity}
- WHERE Clause Support: ✅ Enabled for batch processing`);

    if (validSteps < totalSteps) {
      console.warn(`⚠️ ${totalSteps - validSteps} schedule steps reference invalid or missing action IDs`);
    }

    return result;
    
  } catch (error) {
    console.error('❌ STEP 3: NEW MIGRATION schedule generation failed:', error);
    throw new Error(`Step 3 migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      !s.name || !s.description || !s.trigger?.pattern
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