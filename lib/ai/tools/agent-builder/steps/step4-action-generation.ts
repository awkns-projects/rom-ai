import { generateActions } from '../generation';
import type { AgentAction, AgentData } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';
import type { Step3Output } from './step3-database-generation';

/**
 * STEP 4: Comprehensive Action Generation
 * 
 * Generate intelligent actions that work seamlessly with the database schema.
 * Enhanced with hybrid approach for action coordination and validation.
 */

export interface Step4Input {
  promptUnderstanding: Step0Output;
  decision: Step1Output;
  technicalAnalysis?: any; // Optional for backward compatibility
  databaseGeneration: Step3Output;
  existingAgent?: AgentData;
  changeAnalysis?: any;
  agentOverview?: any;
  conversationContext?: string;
  command?: string;
}

export interface Step4Output {
  actions: AgentAction[];
  // Enhanced fields from hybrid approach
  actionCoordination: {
    sequentialActions: string[];
    parallelActions: string[];
    conditionalActions: string[];
  };
  validationResults: {
    databaseCompatibility: boolean;
    workflowCoverage: boolean;
    actionCompleteness: boolean;
    overallScore: number;
  };
  implementationComplexity: 'low' | 'medium' | 'high';
  resourceRequirements: {
    computeIntensive: boolean;
    externalAPIs: string[];
    backgroundProcessing: boolean;
  };
  qualityMetrics: {
    actionCoverage: number;
    databaseIntegration: number;
    userExperience: number;
    maintainability: number;
  };
}

/**
 * Enhanced action generation with hybrid approach logic
 * Preserves original generateActions functionality while adding comprehensive validation
 */
export async function executeStep4ActionGeneration(
  input: Step4Input
): Promise<Step4Output> {
  console.log('⚡ STEP 4: Starting enhanced action generation...');
  
  const { promptUnderstanding, decision, databaseGeneration, existingAgent, changeAnalysis, agentOverview, conversationContext, command } = input;
  
  try {
    // Use original generateActions function with enhanced context
    console.log('🎯 Generating actions with database-aware design...');
    const actionsResult = await generateActions(
      promptUnderstanding,
      databaseGeneration, // Pass the full databaseGeneration object which has models and enums
      existingAgent,
      changeAnalysis,
      agentOverview,
      conversationContext,
      command
    );

    // Enhanced validation and coordination analysis
    console.log('🔍 Analyzing action coordination and validation...');
    const validationResults = await validateActionGeneration(actionsResult.actions, databaseGeneration, promptUnderstanding);
    
    // Analyze action coordination patterns
    const actionCoordination = analyzeActionCoordination(actionsResult.actions, promptUnderstanding);
    
    // Assess implementation complexity
    const implementationComplexity = assessImplementationComplexity(actionsResult.actions, databaseGeneration);
    
    // Analyze resource requirements
    const resourceRequirements = analyzeResourceRequirements(actionsResult.actions);
    
    // Calculate quality metrics
    const qualityMetrics = calculateQualityMetrics(actionsResult.actions, databaseGeneration, promptUnderstanding);

    const result: Step4Output = {
      actions: actionsResult.actions,
      actionCoordination,
      validationResults,
      implementationComplexity,
      resourceRequirements,
      qualityMetrics
    };

    console.log('✅ STEP 4: Action generation completed successfully');
    console.log(`⚡ Action Summary:
- Total Actions: ${result.actions.length}
- Implementation Complexity: ${result.implementationComplexity}
- Database Compatibility: ${result.validationResults.databaseCompatibility ? '✅' : '❌'}
- Workflow Coverage: ${result.validationResults.workflowCoverage ? '✅' : '❌'}
- Overall Quality Score: ${result.validationResults.overallScore}/100`);

    return result;
    
  } catch (error) {
    console.error('❌ STEP 4: Action generation failed:', error);
    throw new Error(`Step 4 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced action validation with comprehensive checks
 */
async function validateActionGeneration(
  actions: AgentAction[],
  databaseGeneration: Step3Output,
  promptUnderstanding: Step0Output
) {
  console.log('🔍 Validating action generation comprehensively...');
  
  // Database compatibility validation
  const databaseCompatibility = validateDatabaseCompatibility(actions, databaseGeneration.models);
  
  // Workflow coverage validation
  const workflowCoverage = validateWorkflowCoverage(actions, promptUnderstanding.workflowAutomationNeeds);
  
  // Action completeness validation
  const actionCompleteness = validateActionCompleteness(actions);
  
  const overallScore = Math.round(
    (databaseCompatibility.score + workflowCoverage.score + actionCompleteness.score) / 3
  );
  
  return {
    databaseCompatibility: databaseCompatibility.passed,
    workflowCoverage: workflowCoverage.passed,
    actionCompleteness: actionCompleteness.passed,
    overallScore,
    details: {
      databaseIssues: databaseCompatibility.issues,
      workflowIssues: workflowCoverage.issues,
      completenessIssues: actionCompleteness.issues
    }
  };
}

/**
 * Validate database compatibility of actions
 */
function validateDatabaseCompatibility(actions: AgentAction[], models: any[]) {
  const issues: string[] = [];
  let score = 100;
  const modelNames = new Set(models.map(m => m.name));
  
  for (const action of actions) {
    // Check if action references valid models through results.model
    if (action.results?.model && !modelNames.has(action.results.model)) {
      issues.push(`Action "${action.name}" references non-existent model "${action.results.model}"`);
      score -= 15;
    }
    
    // Check if action has proper type
    if (!action.type) {
      issues.push(`Action "${action.name}" missing type`);
      score -= 10;
    }
    
    // Check if Create/Update actions have proper field mappings in results
    if ((action.type === 'Create' || action.type === 'Update') && action.results?.model) {
      const model = models.find(m => m.name === action.results.model);
      if (model && action.results.fields) {
        const requiredFields = model.fields.filter((f: any) => f.required && f.name !== 'id');
        const actionFields = Object.keys(action.results.fields);
        const missingFields = requiredFields.filter((rf: any) => 
          !actionFields.includes(rf.name)
        );
        
        if (missingFields.length > 0) {
          issues.push(`Action "${action.name}" missing required fields: ${missingFields.map((f: any) => f.name).join(', ')}`);
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
 * Validate workflow coverage of actions
 */
function validateWorkflowCoverage(actions: AgentAction[], workflowNeeds: Step0Output['workflowAutomationNeeds']) {
  const issues: string[] = [];
  let score = 100;
  
  const requiredActions = workflowNeeds.requiredActions || [];
  const oneTimeActions = workflowNeeds.oneTimeActions || [];
  const recurringSchedules = workflowNeeds.recurringSchedules || [];
  
  // Check required actions coverage
  for (const requiredAction of requiredActions) {
    const matchingAction = actions.find(a => 
      a.name.toLowerCase().includes(requiredAction.name.toLowerCase()) ||
      a.description.toLowerCase().includes(requiredAction.purpose.toLowerCase())
    );
    
    if (!matchingAction) {
      issues.push(`Required action "${requiredAction.name}" not covered`);
      score -= 20;
    }
  }
  
  // Check one-time actions coverage
  for (const oneTimeAction of oneTimeActions) {
    const matchingAction = actions.find(a => 
      a.name.toLowerCase().includes(oneTimeAction.name.toLowerCase()) ||
      a.description.toLowerCase().includes(oneTimeAction.purpose.toLowerCase())
    );
    
    if (!matchingAction) {
      issues.push(`One-time action "${oneTimeAction.name}" not covered`);
      score -= 15;
    }
  }
  
  // Check recurring schedules coverage (these would be handled by schedules, but actions might support them)
  for (const schedule of recurringSchedules) {
    const matchingAction = actions.find(a => 
      a.name.toLowerCase().includes(schedule.name.toLowerCase()) ||
      a.description.toLowerCase().includes(schedule.purpose.toLowerCase())
    );
    
    if (!matchingAction) {
      issues.push(`Recurring schedule "${schedule.name}" not covered by actions`);
      score -= 5; // Lower penalty since schedules handle this
    }
  }
  
  return {
    passed: score >= 70,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Validate action completeness
 */
function validateActionCompleteness(actions: AgentAction[]) {
  const issues: string[] = [];
  let score = 100;
  
  for (const action of actions) {
    // Check basic properties
    if (!action.name) {
      issues.push('Action missing name');
      score -= 10;
    }
    
    if (!action.description) {
      issues.push(`Action "${action.name}" missing description`);
      score -= 8;
    }
    
    if (!action.type) {
      issues.push(`Action "${action.name}" missing type`);
      score -= 8;
    }
    
    // Check type-specific requirements
    if ((action.type === 'Create' || action.type === 'Update') && !action.results?.model) {
      issues.push(`${action.type} action "${action.name}" missing target model in results`);
      score -= 10;
    }
    
    // Check execution configuration
    if (!action.execute || (!action.execute.code && !action.execute.prompt)) {
      issues.push(`Action "${action.name}" missing execution configuration`);
      score -= 10;
    }
    
    // Check data source configuration
    if (!action.dataSource) {
      issues.push(`Action "${action.name}" missing data source configuration`);
      score -= 8;
    }
    
    // Check role assignment
    if (!action.role) {
      issues.push(`Action "${action.name}" missing role assignment`);
      score -= 5;
    }
  }
  
  return {
    passed: score >= 80,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Analyze action coordination patterns
 */
function analyzeActionCoordination(actions: AgentAction[], promptUnderstanding: Step0Output) {
  const sequentialActions: string[] = [];
  const parallelActions: string[] = [];
  const conditionalActions: string[] = [];
  
  for (const action of actions) {
    // Identify sequential actions (Update actions often depend on existing data)
    if (action.type === 'Update') {
      sequentialActions.push(action.name);
    }
    
    // Identify parallel actions (Create actions that don't depend on each other)
    if (action.type === 'Create') {
      parallelActions.push(action.name);
    }
    
    // Identify conditional actions (those with complex execution logic)
    if (action.execute?.code?.script.includes('if') || 
        action.execute?.prompt?.template.includes('condition') ||
        action.description.toLowerCase().includes('condition')) {
      conditionalActions.push(action.name);
    }
  }
  
  return {
    sequentialActions,
    parallelActions,
    conditionalActions
  };
}

/**
 * Assess implementation complexity
 */
function assessImplementationComplexity(actions: AgentAction[], databaseGeneration: Step3Output): 'low' | 'medium' | 'high' {
  let complexityScore = 0;
  
  // Database complexity factor
  if (databaseGeneration.relationshipComplexity === 'complex') complexityScore += 30;
  else if (databaseGeneration.relationshipComplexity === 'moderate') complexityScore += 15;
  
  // Action count factor
  if (actions.length > 10) complexityScore += 25;
  else if (actions.length > 5) complexityScore += 15;
  
  // Action type complexity
  const hasCustomCode = actions.some(a => a.execute?.code?.script);
  const hasPromptExecution = actions.some(a => a.execute?.prompt);
  const hasCustomDataSource = actions.some(a => a.dataSource?.customFunction);
  const hasUIComponents = actions.some(a => a.uiComponents);
  
  if (hasCustomCode) complexityScore += 20;
  if (hasPromptExecution) complexityScore += 15;
  if (hasCustomDataSource) complexityScore += 25;
  if (hasUIComponents) complexityScore += 10;
  
  // Admin vs member complexity
  const adminActions = actions.filter(a => a.role === 'admin');
  if (adminActions.length > actions.length / 2) complexityScore += 10;
  
  if (complexityScore >= 60) return 'high';
  if (complexityScore >= 30) return 'medium';
  return 'low';
}

/**
 * Analyze resource requirements
 */
function analyzeResourceRequirements(actions: AgentAction[]) {
  const computeIntensive = actions.some(a => 
    a.execute?.code?.script.includes('complex') ||
    a.description.toLowerCase().includes('analyze') ||
    a.description.toLowerCase().includes('process') ||
    a.description.toLowerCase().includes('calculate') ||
    a.dataSource?.customFunction
  );
  
  const externalAPIs = actions
    .filter(a => a.execute?.code?.script.includes('fetch') || a.execute?.code?.script.includes('api'))
    .map(a => a.name + ' API')
    .filter((api, index, self) => self.indexOf(api) === index);
  
  const backgroundProcessing = actions.some(a => 
    a.description.toLowerCase().includes('batch') ||
    a.description.toLowerCase().includes('background') ||
    a.description.toLowerCase().includes('queue') ||
    a.execute?.code?.script.includes('setTimeout') ||
    a.execute?.code?.script.includes('setInterval')
  );
  
  return {
    computeIntensive,
    externalAPIs,
    backgroundProcessing
  };
}

/**
 * Calculate quality metrics
 */
function calculateQualityMetrics(
  actions: AgentAction[],
  databaseGeneration: Step3Output,
  promptUnderstanding: Step0Output
) {
  // Action coverage: How well actions cover the required functionality
  const requiredActions = promptUnderstanding.workflowAutomationNeeds.requiredActions.length;
  const oneTimeActions = promptUnderstanding.workflowAutomationNeeds.oneTimeActions.length;
  const recurringSchedules = promptUnderstanding.workflowAutomationNeeds.recurringSchedules.length;
  const totalNeeded = requiredActions + oneTimeActions + recurringSchedules;
  const actionCoverage = totalNeeded > 0 ? Math.min(100, (actions.length / totalNeeded) * 100) : 100;
  
  // Database integration: How well actions integrate with the database
  const databaseActions = actions.filter(a => a.results?.model).length;
  const totalActions = actions.length;
  const databaseIntegration = totalActions > 0 ? (databaseActions / totalActions) * 100 : 0;
  
  // User experience: How intuitive and user-friendly the actions are
  const actionsWithDescription = actions.filter(a => a.description && a.description.length > 10).length;
  const actionsWithEmoji = actions.filter(a => a.emoji).length;
  const userExperience = totalActions > 0 ? 
    ((actionsWithDescription + actionsWithEmoji) / (totalActions * 2)) * 100 : 0;
  
  // Maintainability: How easy it will be to maintain and extend
  const actionsWithComplexCode = actions.filter(a => 
    a.execute?.code?.script && a.execute.code.script.length > 200
  ).length;
  const complexityPenalty = databaseGeneration.relationshipComplexity === 'complex' ? 20 : 
                           databaseGeneration.relationshipComplexity === 'moderate' ? 10 : 0;
  const maintainability = Math.max(0, 100 - (actionsWithComplexCode * 10) - complexityPenalty);
  
  return {
    actionCoverage: Math.round(actionCoverage),
    databaseIntegration: Math.round(databaseIntegration),
    userExperience: Math.round(userExperience),
    maintainability: Math.round(maintainability)
  };
}

/**
 * Validate Step 4 output for completeness and quality
 */
export function validateStep4Output(output: Step4Output): boolean {
  try {
    if (!output.actions.length) {
      console.warn('⚠️ No actions generated');
      return false;
    }
    
    if (output.validationResults.overallScore < 70) {
      console.warn(`⚠️ Low validation score: ${output.validationResults.overallScore}/100`);
      return false;
    }
    
    if (!output.validationResults.databaseCompatibility) {
      console.warn('⚠️ Actions not compatible with database schema');
      return false;
    }
    
    if (!output.validationResults.workflowCoverage) {
      console.warn('⚠️ Actions do not cover required workflow needs');
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
    
    console.log('✅ Step 4 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 4 output validation failed:', error);
    return false;
  }
}

/**
 * Extract action insights for downstream steps
 */
export function extractActionInsights(output: Step4Output) {
  return {
    actionCount: output.actions.length,
    implementationComplexity: output.implementationComplexity,
    databaseCompatibility: output.validationResults.databaseCompatibility,
    workflowCoverage: output.validationResults.workflowCoverage,
    qualityScore: output.validationResults.overallScore,
    hasCustomCode: output.actions.some(a => a.execute?.code),
    hasPromptExecution: output.actions.some(a => a.execute?.prompt),
    requiresBackgroundProcessing: output.resourceRequirements.backgroundProcessing,
    sequentialActionCount: output.actionCoordination.sequentialActions.length,
    parallelActionCount: output.actionCoordination.parallelActions.length,
    conditionalActionCount: output.actionCoordination.conditionalActions.length,
    primaryActionTypes: [...new Set(output.actions.map(a => a.type))],
    requiresCarefulHandling: output.implementationComplexity === 'high' || output.validationResults.overallScore < 80
  };
} 