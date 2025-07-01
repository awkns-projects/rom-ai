import { generatePseudoSteps, getAgentBuilderModel } from '../generation';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { AgentSchedule, AgentData, PseudoCodeStep, StepField } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';
import type { Step3Output } from './step3-database-generation';
import type { Step4Output } from './step4-action-generation';

// Schema for schedule code generation
const ScheduleCodeGenerationSchema = z.object({
  code: z.string().describe('Complete executable code for the schedule'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean(),
    defaultValue: z.string().optional()
  })).describe('Environment variables required by the schedule'),
  inputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
    validation: z.record(z.any()).optional()
  })).describe('Input parameters for the schedule'),
  outputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })).describe('Expected output parameters from the schedule'),
  cronPattern: z.string().describe('Cron pattern for schedule timing'),
  timezone: z.string().describe('Timezone for schedule execution')
});

/**
 * STEP 5: Intelligent Schedule Generation
 * 
 * Generate automated schedules using a two-phase approach:
 * 1. Generate pseudo-code steps for each schedule
 * 2. Generate executable code from the pseudo-code steps
 */

export interface Step5Input {
  promptUnderstanding: Step0Output;
  decision: Step1Output;
  technicalAnalysis?: any; // Optional for backward compatibility
  databaseGeneration: Step3Output;
  actionGeneration: Step4Output;
  existingAgent?: AgentData;
  changeAnalysis?: any;
}

export interface Step5Output {
  schedules: AgentSchedule[];
  // Enhanced fields from hybrid approach
  scheduleCoordination: {
    frequencyDistribution: Record<string, number>;
    timingConflicts: string[];
    resourceUsage: {
      peakHours: string[];
      lightHours: string[];
      conflictingSchedules: string[];
    };
  };
  validationResults: {
    databaseCompatibility: boolean;
    actionCompatibility: boolean;
    timingValidation: boolean;
    overallScore: number;
  };
  automationCoverage: {
    recurringTasksCovered: number;
    businessProcessesCovered: number;
    maintenanceTasksCovered: number;
    coveragePercentage: number;
  };
  qualityMetrics: {
    scheduleReliability: number;
    businessValue: number;
    maintainability: number;
    resourceEfficiency: number;
  };
}

/**
 * Enhanced schedule generation with two-phase approach
 */
export async function executeStep5ScheduleGeneration(
  input: Step5Input
): Promise<Step5Output> {
  console.log('⏰ STEP 5: Starting two-phase schedule generation...');
  
  const { promptUnderstanding, decision, databaseGeneration, actionGeneration, existingAgent, changeAnalysis } = input;
  
  try {
    // Extract schedule requirements from prompt understanding
    const scheduleRequests = extractScheduleRequests(promptUnderstanding, actionGeneration);
    
    // Transform database models for compatibility
    const availableModels = transformStep3ModelsToAgentModels(databaseGeneration.models);
    
    const schedules: AgentSchedule[] = [];
    
    // Process each schedule request using two-phase approach
    for (const scheduleRequest of scheduleRequests) {
      console.log(`📅 Processing schedule: ${scheduleRequest.name}`);
      
      // Phase 1: Generate pseudo-code steps
      const pseudoSteps = await generatePseudoSteps(
        scheduleRequest.name,
        scheduleRequest.purpose || `Schedule for ${scheduleRequest.name}`,
        'Create', // Default to Create type
        availableModels,
        'schedule',
        `Business context: ${promptUnderstanding.userRequestAnalysis.businessContext}. ` +
        `Target models: ${databaseGeneration.models.map(m => m.name).join(', ')}. ` +
        `Available actions: ${actionGeneration.actions.map(a => a.name).join(', ')}. ` +
        `Schedule frequency: ${scheduleRequest.frequency}. ` +
        `Prisma schema context: Use fields from the database models for accurate data operations.`
      );
      
      // Phase 2: Generate executable code from pseudo steps
      const codeResult = await generateScheduleCode(
        scheduleRequest.name,
        scheduleRequest.purpose || `Schedule for ${scheduleRequest.name}`,
        pseudoSteps,
        availableModels,
        databaseGeneration,
        scheduleRequest.frequency,
        promptUnderstanding.userRequestAnalysis.businessContext
      );
      
      // Create AgentSchedule object
      const schedule: AgentSchedule = {
        id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: scheduleRequest.name,
        description: scheduleRequest.purpose || `Schedule for ${scheduleRequest.name}`,
        emoji: getScheduleEmoji(scheduleRequest.name),
        type: determineScheduleType(pseudoSteps),
        role: 'admin', // Default to admin for schedules
        pseudoSteps: pseudoSteps.map(step => ({
          id: step.id,
          inputFields: step.inputFields || [],
          outputFields: step.outputFields || [],
          description: step.description,
          type: step.type as 'Database find unique' | 'Database find many' | 'Database update unique' | 'Database update many' | 'Database create' | 'Database create many' | 'Database delete unique' | 'Database delete many' | 'call external api' | 'ai analysis'
        })),
        interval: {
          pattern: codeResult.cronPattern,
          timezone: codeResult.timezone,
          active: true
        },
        dataSource: {
          type: 'database',
          database: {
            models: extractReferencedModels(pseudoSteps, availableModels)
          }
        },
        execute: {
          type: 'code',
          code: {
            script: codeResult.code,
            envVars: codeResult.envVars
          }
        },
        results: {
          actionType: determineScheduleType(pseudoSteps),
          model: extractPrimaryModel(pseudoSteps, availableModels) || 'Unknown',
          fields: extractResultFields(codeResult.outputParameters)
        }
      };
      
      schedules.push(schedule);
    }
    
    // Enhanced validation and coordination analysis
    console.log('🔍 Analyzing schedule coordination and validation...');
    const validationResults = await validateScheduleGeneration(
      schedules, 
      databaseGeneration, 
      actionGeneration,
      promptUnderstanding
    );
    
    // Analyze schedule coordination patterns
    const scheduleCoordination = analyzeScheduleCoordination(schedules);
    
    // Calculate automation coverage
    const automationCoverage = calculateAutomationCoverage(
      schedules, 
      promptUnderstanding
    );
    
    // Calculate quality metrics
    const qualityMetrics = calculateScheduleQualityMetrics(
      schedules, 
      databaseGeneration, 
      actionGeneration,
      promptUnderstanding
    );

    const result: Step5Output = {
      schedules,
      scheduleCoordination,
      validationResults,
      automationCoverage,
      qualityMetrics
    };

    console.log('✅ STEP 5: Schedule generation completed successfully');
    console.log(`⏰ Schedule Summary:
- Total Schedules: ${result.schedules.length}
- Automation Coverage: ${result.automationCoverage.coveragePercentage}%
- Database Compatibility: ${result.validationResults.databaseCompatibility ? '✅' : '❌'}
- Action Compatibility: ${result.validationResults.actionCompatibility ? '✅' : '❌'}
- Overall Quality Score: ${result.validationResults.overallScore}/100`);

    return result;
    
  } catch (error) {
    console.error('❌ STEP 5: Schedule generation failed:', error);
    throw new Error(`Step 5 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract schedule requests from prompt understanding
 */
function extractScheduleRequests(promptUnderstanding: Step0Output, actionGeneration: Step4Output) {
  const requests = [];
  
  // Extract from recurring schedules
  for (const schedule of promptUnderstanding.workflowAutomationNeeds.recurringSchedules || []) {
    requests.push({
      name: schedule.name,
      purpose: schedule.purpose,
      frequency: schedule.frequency,
      timing: schedule.timing,
      priority: schedule.priority
    });
  }
  
  // Extract from business processes that require schedules
  for (const process of promptUnderstanding.workflowAutomationNeeds.businessProcesses || []) {
    if (process.requiresSchedules) {
      requests.push({
        name: `${process.name} Schedule`,
        purpose: `Automated schedule for ${process.name}`,
        frequency: 'daily',
        timing: '09:00',
        priority: 'medium'
      });
    }
  }
  
  // If no explicit schedules, create some based on actions
  if (requests.length === 0) {
    for (const action of actionGeneration.actions.slice(0, 3)) { // Limit to first 3 actions
      requests.push({
        name: `${action.name} Schedule`,
        purpose: `Regular execution of ${action.name}`,
        frequency: 'daily',
        timing: '09:00',
        priority: 'medium'
      });
    }
  }
  
  return requests;
}

/**
 * Generate executable code for a schedule
 */
async function generateScheduleCode(
  name: string,
  description: string,
  pseudoSteps: any[],
  availableModels: any[],
  databaseGeneration: Step3Output,
  frequency: string,
  businessContext?: string
): Promise<z.infer<typeof ScheduleCodeGenerationSchema>> {
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `You are an expert schedule code generator. Generate complete, executable code for a schedule based on pseudo-code steps.

SCHEDULE DETAILS:
- Name: ${name}
- Description: ${description}
- Frequency: ${frequency}
- Business Context: ${businessContext || 'General business operations'}

PSEUDO-CODE STEPS:
${JSON.stringify(pseudoSteps, null, 2)}

AVAILABLE DATABASE MODELS:
${availableModels.map(model => `- ${model.name}: ${model.fields.map((f: any) => f.name).join(', ')}`).join('\n')}

REQUIREMENTS:
1. Generate complete executable JavaScript code that implements the pseudo-code steps
2. Use proper error handling and validation
3. Include database operations using the available models
4. Return structured results with clear success/failure indication
5. Include proper logging for monitoring and debugging
6. Use environment variables for configuration where appropriate
7. Generate appropriate cron pattern based on frequency
8. Handle edge cases and potential failures gracefully

The code should follow this structure:
- Validate input parameters
- Check permissions and business rules  
- Execute the main schedule logic
- Update database records as needed
- Return structured results

Generate practical, production-ready code that can be executed safely in a business environment.`;

  const result = await generateObject({
    model,
    schema: ScheduleCodeGenerationSchema,
    messages: [
      {
        role: 'system' as const,
        content: systemPrompt
      }
    ],
    temperature: 0.3,
  });

  return result.object;
}

/**
 * Determine schedule type based on pseudo steps
 */
function determineScheduleType(pseudoSteps: any[]): AgentSchedule['type'] {
  const stepsText = JSON.stringify(pseudoSteps).toLowerCase();
  
  if (stepsText.includes('create') || stepsText.includes('add') || stepsText.includes('insert') || stepsText.includes('new')) {
    return 'Create';
  } else if (stepsText.includes('update') || stepsText.includes('edit') || stepsText.includes('modify') || stepsText.includes('change')) {
    return 'Update';
  } else {
    return 'Create'; // Default fallback
  }
}

/**
 * Get appropriate emoji for schedule
 */
function getScheduleEmoji(scheduleName: string): string {
  const name = scheduleName.toLowerCase();
  
  if (name.includes('backup') || name.includes('save')) return '💾';
  if (name.includes('report') || name.includes('summary')) return '📊';
  if (name.includes('email') || name.includes('notification')) return '📧';
  if (name.includes('cleanup') || name.includes('maintenance')) return '🧹';
  if (name.includes('sync') || name.includes('update')) return '🔄';
  if (name.includes('check') || name.includes('monitor')) return '🔍';
  if (name.includes('process') || name.includes('workflow')) return '⚙️';
  
  return '⏰'; // Default schedule emoji
}

/**
 * Extract referenced models from pseudo steps
 */
function extractReferencedModels(pseudoSteps: any[], availableModels: any[]): any[] {
  const stepsText = JSON.stringify(pseudoSteps).toLowerCase();
  const referencedModels = [];
  
  for (const model of availableModels) {
    if (stepsText.includes(model.name.toLowerCase())) {
      referencedModels.push({
        id: model.id,
        name: model.name,
        fields: model.fields.slice(0, 5) // Limit fields for performance
      });
    }
  }
  
  // If no models found, include the first available model as fallback
  if (referencedModels.length === 0 && availableModels.length > 0) {
    referencedModels.push({
      id: availableModels[0].id,
      name: availableModels[0].name,
      fields: availableModels[0].fields.slice(0, 3)
    });
  }
  
  return referencedModels;
}

/**
 * Extract primary model from pseudo steps
 */
function extractPrimaryModel(pseudoSteps: any[], availableModels: any[]): string | undefined {
  const stepsText = JSON.stringify(pseudoSteps).toLowerCase();
  
  for (const model of availableModels) {
    if (stepsText.includes(model.name.toLowerCase())) {
      return model.name;
    }
  }
  
  return availableModels[0]?.name;
}

/**
 * Extract result fields from output parameters
 */
function extractResultFields(outputParameters: any[]): Record<string, any> {
  const fields: Record<string, any> = {};
  
  for (const param of outputParameters) {
    fields[param.name] = {
      type: param.type,
      description: param.description
    };
  }
  
  return fields;
}

/**
 * Transform Step3Output models to AgentModel format for compatibility
 */
function transformStep3ModelsToAgentModels(step3Models: Step3Output['models']): any[] {
  return step3Models.map(model => ({
    id: model.name.toLowerCase(),
    name: model.name,
    displayName: model.displayName,
    description: model.description,
    tableName: model.tableName,
    fields: model.fields.map(field => ({
      id: `${model.name}.${field.name}`,
      name: field.name,
      displayName: field.displayName,
      type: field.type,
      description: field.description,
      required: field.isRequired,
      isId: field.isPrimary,
      isUnique: field.isUnique,
      defaultValue: field.defaultValue,
      kind: field.type === 'Enum' ? 'enum' : 'scalar',
      relationField: !!field.relationship,
      list: false,
      enumValues: field.enumValues
    })),
    idField: model.fields.find(f => f.isPrimary)?.name || 'id',
    displayFields: model.fields.slice(0, 3).map(f => f.name),
    enums: []
  }));
}

/**
 * Enhanced schedule validation with comprehensive checks
 */
async function validateScheduleGeneration(
  schedules: AgentSchedule[],
  databaseGeneration: Step3Output,
  actionGeneration: Step4Output,
  promptUnderstanding: Step0Output
) {
  console.log('🔍 Validating schedule generation comprehensively...');
  
  // Database compatibility validation
  const databaseCompatibility = validateScheduleDatabaseCompatibility(schedules, databaseGeneration.models);
  
  // Action compatibility validation
  const actionCompatibility = validateScheduleActionCompatibility(schedules, actionGeneration.actions);
  
  // Timing validation
  const timingValidation = validateScheduleTiming(schedules);
  
  const overallScore = Math.round(
    (databaseCompatibility.score + actionCompatibility.score + timingValidation.score) / 3
  );
  
  return {
    databaseCompatibility: databaseCompatibility.passed,
    actionCompatibility: actionCompatibility.passed,
    timingValidation: timingValidation.passed,
    overallScore,
    details: {
      databaseIssues: databaseCompatibility.issues,
      actionIssues: actionCompatibility.issues,
      timingIssues: timingValidation.issues
    }
  };
}

/**
 * Validate schedule database compatibility
 */
function validateScheduleDatabaseCompatibility(schedules: AgentSchedule[], models: any[]) {
  const issues: string[] = [];
  let score = 100;
  const modelNames = new Set(models.map(m => m.name));
  
  for (const schedule of schedules) {
    // Check if schedule references valid models in results
    if (schedule.results?.model && !modelNames.has(schedule.results.model)) {
      issues.push(`Schedule "${schedule.name}" references non-existent model "${schedule.results.model}"`);
      score -= 15;
    }
    
    // Check if schedule has proper database configuration
    if (schedule.dataSource?.database) {
      for (const dbModel of schedule.dataSource.database.models) {
        if (!modelNames.has(dbModel.name)) {
          issues.push(`Schedule "${schedule.name}" data source references non-existent model "${dbModel.name}"`);
          score -= 10;
        }
      }
    }
    
    // Check if Create/Update schedules have proper field mappings
    if ((schedule.type === 'Create' || schedule.type === 'Update') && schedule.results?.model) {
      const model = models.find(m => m.name === schedule.results.model);
      if (model && schedule.results.fields) {
        const requiredFields = model.fields.filter((f: any) => f.required && f.name !== 'id');
        const scheduleFields = Object.keys(schedule.results.fields);
        const missingFields = requiredFields.filter((rf: any) => 
          !scheduleFields.includes(rf.name)
        );
        
        if (missingFields.length > 0) {
          issues.push(`Schedule "${schedule.name}" missing required fields: ${missingFields.map((f: any) => f.name).join(', ')}`);
          score -= 8;
        }
      }
    }
  }
  
  return {
    passed: score >= 80,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Validate schedule action compatibility
 */
function validateScheduleActionCompatibility(schedules: AgentSchedule[], actions: any[]) {
  const issues: string[] = [];
  let score = 100;
  const actionNames = new Set(actions.map(a => a.name));
  
  for (const schedule of schedules) {
    // Check if schedule execution references existing actions (indirectly)
    if (schedule.execute?.code?.script) {
      const script = schedule.execute.code.script;
      // Look for potential action references in the code
      const potentialActionRefs = script.match(/\b\w+Action\b/g) || [];
      for (const ref of potentialActionRefs) {
        const actionName = ref.replace('Action', '');
        const matchingAction = actions.find(a => 
          a.name.toLowerCase().includes(actionName.toLowerCase())
        );
        if (!matchingAction) {
          issues.push(`Schedule "${schedule.name}" may reference non-existent action "${ref}"`);
          score -= 5;
        }
      }
    }
    
    // Check if schedule and actions work on the same models (good coordination)
    if (schedule.results?.model) {
      const relatedActions = actions.filter(a => 
        a.results?.model === schedule.results.model
      );
      if (relatedActions.length === 0) {
        issues.push(`Schedule "${schedule.name}" works on model "${schedule.results.model}" but no actions target this model`);
        score -= 10;
      }
    }
  }
  
  return {
    passed: score >= 70,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Validate schedule timing
 */
function validateScheduleTiming(schedules: AgentSchedule[]) {
  const issues: string[] = [];
  let score = 100;
  
  for (const schedule of schedules) {
    // Check if schedule has valid interval configuration
    if (!schedule.interval?.pattern) {
      issues.push(`Schedule "${schedule.name}" missing interval pattern`);
      score -= 15;
      continue;
    }
    
    // Check for reasonable timing patterns
    const pattern = schedule.interval.pattern.toLowerCase();
    const validPatterns = ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'cron'];
    const hasValidPattern = validPatterns.some(p => pattern.includes(p)) || 
                           pattern.match(/^\d+\s+(minute|hour|day|week|month)s?$/);
    
    if (!hasValidPattern) {
      issues.push(`Schedule "${schedule.name}" has invalid interval pattern: "${schedule.interval.pattern}"`);
      score -= 10;
    }
    
    // Check timezone configuration
    if (schedule.interval.timezone && !schedule.interval.timezone.match(/^[A-Z][a-z]+\/[A-Z][a-z_]+$/)) {
      issues.push(`Schedule "${schedule.name}" has invalid timezone format: "${schedule.interval.timezone}"`);
      score -= 5;
    }
    
    // Check if schedule is active by default
    if (schedule.interval.active === false) {
      issues.push(`Schedule "${schedule.name}" is set to inactive by default`);
      score -= 3;
    }
  }
  
  // Check for potential timing conflicts
  const hourlySchedules = schedules.filter(s => 
    s.interval?.pattern.toLowerCase().includes('hourly') ||
    s.interval?.pattern.includes('hour')
  );
  
  if (hourlySchedules.length > 5) {
    issues.push(`Too many hourly schedules (${hourlySchedules.length}) may cause resource conflicts`);
    score -= 10;
  }
  
  return {
    passed: score >= 80,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Analyze schedule coordination patterns
 */
function analyzeScheduleCoordination(schedules: AgentSchedule[]) {
  const frequencyDistribution: Record<string, number> = {};
  const timingConflicts: string[] = [];
  const peakHours: string[] = [];
  const lightHours: string[] = [];
  const conflictingSchedules: string[] = [];
  
  // Analyze frequency distribution
  for (const schedule of schedules) {
    const pattern = schedule.interval?.pattern || 'unknown';
    const frequency = extractFrequency(pattern);
    frequencyDistribution[frequency] = (frequencyDistribution[frequency] || 0) + 1;
  }
  
  // Identify potential timing conflicts
  const hourlySchedules = schedules.filter(s => extractFrequency(s.interval?.pattern || '') === 'hourly');
  const dailySchedules = schedules.filter(s => extractFrequency(s.interval?.pattern || '') === 'daily');
  
  if (hourlySchedules.length > 3) {
    timingConflicts.push(`${hourlySchedules.length} hourly schedules may cause resource contention`);
    conflictingSchedules.push(...hourlySchedules.map(s => s.name));
  }
  
  if (dailySchedules.length > 10) {
    timingConflicts.push(`${dailySchedules.length} daily schedules may overwhelm the system`);
  }
  
  // Determine peak and light hours based on schedule distribution
  if (hourlySchedules.length > 0) {
    peakHours.push('Business hours (9 AM - 5 PM)');
  }
  
  if (dailySchedules.length > 0) {
    lightHours.push('Late night (2 AM - 6 AM)');
  }
  
  return {
    frequencyDistribution,
    timingConflicts,
    resourceUsage: {
      peakHours,
      lightHours,
      conflictingSchedules
    }
  };
}

/**
 * Extract frequency from schedule pattern
 */
function extractFrequency(pattern: string): string {
  const p = pattern.toLowerCase();
  if (p.includes('hour')) return 'hourly';
  if (p.includes('day')) return 'daily';
  if (p.includes('week')) return 'weekly';
  if (p.includes('month')) return 'monthly';
  if (p.includes('quarter')) return 'quarterly';
  if (p.includes('year')) return 'yearly';
  if (p.includes('minute')) return 'minutely';
  return 'custom';
}

/**
 * Calculate automation coverage
 */
function calculateAutomationCoverage(
  schedules: AgentSchedule[],
  promptUnderstanding: Step0Output
) {
  const recurringSchedules = promptUnderstanding.workflowAutomationNeeds.recurringSchedules || [];
  const businessProcesses = promptUnderstanding.workflowAutomationNeeds.businessProcesses || [];
  
  // Count covered recurring tasks
  let recurringTasksCovered = 0;
  for (const requiredSchedule of recurringSchedules) {
    const matchingSchedule = schedules.find(s => 
      s.name.toLowerCase().includes(requiredSchedule.name.toLowerCase()) ||
      s.description.toLowerCase().includes(requiredSchedule.purpose.toLowerCase())
    );
    if (matchingSchedule) recurringTasksCovered++;
  }
  
  // Count covered business processes
  let businessProcessesCovered = 0;
  for (const process of businessProcesses) {
    if (process.requiresSchedules) {
      const matchingSchedule = schedules.find(s => 
        s.description.toLowerCase().includes(process.name.toLowerCase()) ||
        process.involvedModels.some(model => 
          s.results?.model === model
        )
      );
      if (matchingSchedule) businessProcessesCovered++;
    }
  }
  
  // Count maintenance tasks (schedules that handle system maintenance)
  const maintenanceTasksCovered = schedules.filter(s => 
    s.description.toLowerCase().includes('maintenance') ||
    s.description.toLowerCase().includes('cleanup') ||
    s.description.toLowerCase().includes('backup') ||
    s.description.toLowerCase().includes('sync')
  ).length;
  
  const totalRequired = recurringSchedules.length + 
                       businessProcesses.filter(p => p.requiresSchedules).length + 
                       Math.max(1, Math.floor(schedules.length * 0.2)); // Assume 20% should be maintenance
  
  const totalCovered = recurringTasksCovered + businessProcessesCovered + maintenanceTasksCovered;
  const coveragePercentage = totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 100;
  
  return {
    recurringTasksCovered,
    businessProcessesCovered,
    maintenanceTasksCovered,
    coveragePercentage: Math.min(100, coveragePercentage)
  };
}

/**
 * Calculate schedule quality metrics
 */
function calculateScheduleQualityMetrics(
  schedules: AgentSchedule[],
  databaseGeneration: Step3Output,
  actionGeneration: Step4Output,
  promptUnderstanding: Step0Output
) {
  // Schedule reliability: How well-configured and robust the schedules are
  const schedulesWithValidTiming = schedules.filter(s => 
    s.interval?.pattern && s.interval.pattern.length > 0
  ).length;
  const schedulesWithTimezone = schedules.filter(s => s.interval?.timezone).length;
  const scheduleReliability = schedules.length > 0 ? 
    Math.round(((schedulesWithValidTiming + schedulesWithTimezone) / (schedules.length * 2)) * 100) : 0;
  
  // Business value: How much business value the schedules provide
  const businessCriticalSchedules = schedules.filter(s => 
    s.description.toLowerCase().includes('critical') ||
    s.description.toLowerCase().includes('important') ||
    s.description.toLowerCase().includes('essential') ||
    s.role === 'admin'
  ).length;
  const businessValue = schedules.length > 0 ? 
    Math.round((businessCriticalSchedules / schedules.length) * 100) : 0;
  
  // Maintainability: How easy it will be to maintain the schedules
  const schedulesWithComplexCode = schedules.filter(s => 
    s.execute?.code?.script && s.execute.code.script.length > 300
  ).length;
  const schedulesWithCustomFunctions = schedules.filter(s => 
    s.dataSource?.customFunction
  ).length;
  const complexityPenalty = (schedulesWithComplexCode + schedulesWithCustomFunctions) * 10;
  const maintainability = Math.max(0, 100 - complexityPenalty);
  
  // Resource efficiency: How efficiently the schedules use system resources
  const hourlySchedules = schedules.filter(s => 
    extractFrequency(s.interval?.pattern || '') === 'hourly'
  ).length;
  const minutelySchedules = schedules.filter(s => 
    extractFrequency(s.interval?.pattern || '') === 'minutely'
  ).length;
  const resourcePenalty = (hourlySchedules * 5) + (minutelySchedules * 15);
  const resourceEfficiency = Math.max(0, 100 - resourcePenalty);
  
  return {
    scheduleReliability,
    businessValue,
    maintainability,
    resourceEfficiency
  };
}

/**
 * Validate Step 5 output for completeness and quality
 */
export function validateStep5Output(output: Step5Output): boolean {
  try {
    if (!output.schedules.length) {
      console.warn('⚠️ No schedules generated');
      return false;
    }
    
    if (output.validationResults.overallScore < 70) {
      console.warn(`⚠️ Low validation score: ${output.validationResults.overallScore}/100`);
      return false;
    }
    
    if (!output.validationResults.databaseCompatibility) {
      console.warn('⚠️ Schedules not compatible with database schema');
      return false;
    }
    
    if (!output.validationResults.timingValidation) {
      console.warn('⚠️ Schedule timing validation failed');
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
    
    // Check for reasonable automation coverage
    if (output.automationCoverage.coveragePercentage < 50) {
      console.warn(`⚠️ Low automation coverage: ${output.automationCoverage.coveragePercentage}%`);
      return false;
    }
    
    console.log('✅ Step 5 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 5 output validation failed:', error);
    return false;
  }
}

/**
 * Extract schedule insights for downstream steps
 */
export function extractScheduleInsights(output: Step5Output) {
  return {
    scheduleCount: output.schedules.length,
    automationCoverage: output.automationCoverage.coveragePercentage,
    databaseCompatibility: output.validationResults.databaseCompatibility,
    actionCompatibility: output.validationResults.actionCompatibility,
    qualityScore: output.validationResults.overallScore,
    hasTimingConflicts: output.scheduleCoordination.timingConflicts.length > 0,
    frequencyDistribution: output.scheduleCoordination.frequencyDistribution,
    resourceEfficiency: output.qualityMetrics.resourceEfficiency,
    businessValue: output.qualityMetrics.businessValue,
    primaryFrequencies: Object.keys(output.scheduleCoordination.frequencyDistribution)
      .sort((a, b) => output.scheduleCoordination.frequencyDistribution[b] - output.scheduleCoordination.frequencyDistribution[a])
      .slice(0, 3),
    requiresCarefulHandling: output.validationResults.overallScore < 80 || 
                            output.scheduleCoordination.timingConflicts.length > 2 ||
                            output.qualityMetrics.resourceEfficiency < 70
  };
} 