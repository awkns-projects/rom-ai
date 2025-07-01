import { generateSchedules } from '../generation';
import type { AgentSchedule, AgentData } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';
import type { Step3Output } from './step3-database-generation';
import type { Step4Output } from './step4-action-generation';

/**
 * STEP 5: Intelligent Schedule Generation
 * 
 * Generate automated schedules that work seamlessly with the database and actions.
 * Enhanced with hybrid approach for schedule coordination and validation.
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
 * Enhanced schedule generation with hybrid approach logic
 * Preserves original generateSchedules functionality while adding comprehensive validation
 */
export async function executeStep5ScheduleGeneration(
  input: Step5Input
): Promise<Step5Output> {
  console.log('⏰ STEP 5: Starting enhanced schedule generation...');
  
  const { promptUnderstanding, decision, databaseGeneration, actionGeneration, existingAgent, changeAnalysis } = input;
  
  try {
    // Use original generateSchedules function with enhanced context
    console.log('📅 Generating schedules with database and action awareness...');
    const schedulesResult = await generateSchedules(
      promptUnderstanding,
      databaseGeneration, // Pass database schema
      actionGeneration.actions, // Pass actions for coordination
      existingAgent,
      changeAnalysis
    );

    // Enhanced validation and coordination analysis
    console.log('🔍 Analyzing schedule coordination and validation...');
    const validationResults = await validateScheduleGeneration(
      schedulesResult.schedules, 
      databaseGeneration, 
      actionGeneration,
      promptUnderstanding
    );
    
    // Analyze schedule coordination patterns
    const scheduleCoordination = analyzeScheduleCoordination(schedulesResult.schedules);
    
    // Calculate automation coverage
    const automationCoverage = calculateAutomationCoverage(
      schedulesResult.schedules, 
      promptUnderstanding
    );
    
    // Calculate quality metrics
    const qualityMetrics = calculateScheduleQualityMetrics(
      schedulesResult.schedules, 
      databaseGeneration, 
      actionGeneration,
      promptUnderstanding
    );

    const result: Step5Output = {
      schedules: schedulesResult.schedules,
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