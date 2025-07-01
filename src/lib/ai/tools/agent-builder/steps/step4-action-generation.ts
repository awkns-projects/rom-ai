import { generateActions } from '../generation';
import type { AgentAction, AgentData, PseudoCodeStep, StepField } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';
import type { Step2Output } from './step2-technical-analysis';
import type { Step3Output, extractDatabaseInsights } from './step3-database-generation';
import { generatePseudoSteps } from '../generation';
import { generateObject } from 'ai';
import { getAgentBuilderModel } from '../generation';
import { z } from 'zod';

/**
 * STEP 4: Two-Phase Action Generation
 * 
 * Phase 1: Generate pseudo-code steps using Prisma schema context
 * Phase 2: Generate executable code from pseudo-code steps
 * Uses the database models and fields from Step 3 for accurate action generation
 */

export interface Step4Input {
  promptUnderstanding: Step0Output;
  decision: Step1Output;
  technicalAnalysis: Step2Output;
  databaseGeneration: Step3Output;
  existingAgent?: AgentData;
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

// Code generation schema for actions
const ActionCodeGenerationSchema = z.object({
  code: z.string().describe('Complete JavaScript code that can be executed with new Function()'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean().default(false)
  })).describe('Environment variables needed for the code'),
  inputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
    defaultValue: z.any().optional()
  })).describe('Input parameters required before execution'),
  outputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })).describe('Expected output parameters'),
  estimatedExecutionTime: z.string().describe('Estimated execution time'),
  testData: z.object({
    input: z.record(z.any()).optional().default({}),
    expectedOutput: z.record(z.any()).optional().default({})
  }).describe('Test data for validation')
});

/**
 * Two-phase action generation with database-aware design
 */
export async function executeStep4ActionGeneration(
  input: Step4Input
): Promise<Step4Output> {
  console.log('⚡ STEP 4: Starting two-phase action generation...');
  
  const { promptUnderstanding, decision, technicalAnalysis, databaseGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    // PHASE 1: Generate pseudo-code steps for each required action
    console.log('📋 Phase 1: Generating pseudo-code steps from prompt understanding...');
    
    const requiredActions = promptUnderstanding.workflowAutomationNeeds.requiredActions || [];
    const oneTimeActions = promptUnderstanding.workflowAutomationNeeds.oneTimeActions || [];
    const allActionRequests = [...requiredActions, ...oneTimeActions];
    
    console.log(`Found ${allActionRequests.length} actions to generate`);
    
    // Transform database models for pseudo step generation
    const availableModels = transformStep3ModelsToAgentModels(databaseGeneration.models);
    
    // Generate pseudo steps for each action
    const actionsWithPseudoSteps = await Promise.all(
      allActionRequests.map(async (actionRequest) => {
        console.log(`🔄 Generating pseudo steps for: ${actionRequest.name}`);
        
        const pseudoSteps = await generatePseudoSteps(
          actionRequest.name,
          actionRequest.purpose || `Action to ${actionRequest.name}`,
          'Create', // Default to Create type
          availableModels,
          'action',
          `Business context: ${promptUnderstanding.userRequestAnalysis.businessContext}. ` +
          `Target models: ${databaseGeneration.models.map(m => m.name).join(', ')}. ` +
          `Prisma schema context: Use fields from the database models for accurate data operations.`
        );
        
        return {
          actionRequest,
          pseudoSteps
        };
      })
    );

    // PHASE 2: Generate executable code for each action
    console.log('💻 Phase 2: Generating executable code from pseudo steps...');
    
    const actionsWithCode = await Promise.all(
      actionsWithPseudoSteps.map(async ({ actionRequest, pseudoSteps }) => {
        console.log(`🔧 Generating code for: ${actionRequest.name}`);
        
        const codeResult = await generateActionCode(
          actionRequest.name,
          actionRequest.purpose || `Action to ${actionRequest.name}`,
          pseudoSteps,
          availableModels,
          databaseGeneration,
          promptUnderstanding.userRequestAnalysis.businessContext
        );
        
        // Create AgentAction object
        const action: AgentAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: actionRequest.name,
          description: actionRequest.purpose || `Action to ${actionRequest.name}`,
          type: determineActionType(pseudoSteps),
          emoji: getActionEmoji(actionRequest.name),
          role: 'member', // Default to member since role property doesn't exist on actionRequest
          pseudoSteps: pseudoSteps.map(step => ({
            id: step.id,
            inputFields: step.inputFields || [],
            outputFields: step.outputFields || [],
            description: step.description,
            type: step.type as 'Database find unique' | 'Database find many' | 'Database update unique' | 'Database update many' | 'Database create' | 'Database create many' | 'Database delete unique' | 'Database delete many' | 'call external api' | 'ai analysis'
          })),
          execute: {
            type: 'code',
            code: {
              script: codeResult.code,
              envVars: codeResult.envVars
            }
          },
          dataSource: {
            type: 'database',
            database: {
              models: extractReferencedModels(pseudoSteps, availableModels)
            }
          },
          results: {
            actionType: determineActionType(pseudoSteps),
            model: extractPrimaryModel(pseudoSteps, availableModels) || 'Unknown',
            fields: extractResultFields(codeResult.outputParameters)
          },
          uiComponents: {
            stepForms: generateStepForms(codeResult.inputParameters, availableModels),
            resultView: generateResultView(actionRequest.name, codeResult.outputParameters)
          }
        };
        
        return action;
      })
    );

    console.log(`✅ Generated ${actionsWithCode.length} actions with code`);

    // Enhanced validation and coordination analysis
    console.log('🔍 Analyzing action coordination and validation...');
    const validationResults = await validateActionGeneration(actionsWithCode, databaseGeneration, promptUnderstanding);
    
    // Analyze action coordination patterns
    const actionCoordination = analyzeActionCoordination(actionsWithCode, promptUnderstanding);
    
    // Assess implementation complexity
    const implementationComplexity = assessImplementationComplexity(actionsWithCode, databaseGeneration);
    
    // Analyze resource requirements
    const resourceRequirements = analyzeResourceRequirements(actionsWithCode);
    
    // Calculate quality metrics
    const qualityMetrics = calculateQualityMetrics(actionsWithCode, databaseGeneration, promptUnderstanding);

    const result: Step4Output = {
      actions: actionsWithCode,
      actionCoordination,
      validationResults,
      implementationComplexity,
      resourceRequirements,
      qualityMetrics
    };

    console.log('✅ STEP 4: Two-phase action generation completed successfully');
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
 * Generate executable code for an action based on pseudo steps
 */
async function generateActionCode(
  name: string,
  description: string,
  pseudoSteps: any[],
  availableModels: any[],
  databaseGeneration: Step3Output,
  businessContext?: string
): Promise<z.infer<typeof ActionCodeGenerationSchema>> {
  const model = await getAgentBuilderModel();
  
  // Extract input parameters from first step
  const extractedInputParams = pseudoSteps.length > 0 && pseudoSteps[0].inputFields ? 
    pseudoSteps[0].inputFields
      .filter((field: any) => field.name && field.name.trim() !== '')
      .map((field: any) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description || `Input parameter for ${field.name}`,
        kind: field.kind === 'object' ? 'object' : 'scalar',
        relationModel: field.relationModel
      })) : [];

  const systemPrompt = `You are a senior JavaScript developer generating executable code for action operations.

TASK: Generate complete, executable JavaScript code based on the provided pseudo steps.

CONTEXT:
- Name: ${name}
- Description: ${description}
- Business Context: ${businessContext || 'General business operations'}
- Available Models: ${JSON.stringify(availableModels?.map((m: any) => ({ name: m.name, fields: m.fields?.map((f: any) => ({ name: f.name, type: f.type })) })) || [])}
- Prisma Schema Models: ${databaseGeneration.models.map(m => `${m.name}: ${m.fields.map(f => `${f.name} (${f.type})`).join(', ')}`).join(' | ')}

PSEUDO STEPS TO IMPLEMENT:
${JSON.stringify(pseudoSteps, null, 2)}

REQUIRED INPUT PARAMETERS (from first step):
${JSON.stringify(extractedInputParams, null, 2)}

CODE GENERATION REQUIREMENTS:

1. EXECUTION CONTEXT:
   The code will be executed using: new Function('context', code)
   Where context = { db, ai, input, envVars }
   
   - db: Database operations referencing Prisma schema models
   - ai: AI operations using generateObject function
   - input: User-provided input parameters (MUST include all parameters from the first step)
   - envVars: Environment variables for external APIs

2. DATABASE OPERATIONS WITH PRISMA SCHEMA:
   Use the actual Prisma schema models and fields from Step 3:
   
   Available Models and Fields:
   ${databaseGeneration.models.map(model => `
   - ${model.name} (table: ${model.tableName}):
     Fields: ${model.fields.map(f => `${f.name}: ${f.type}${f.isRequired ? ' (required)' : ''}${f.isPrimary ? ' (primary)' : ''}${f.relationship ? ` -> ${f.relationship.model}` : ''}`).join(', ')}
   `).join('')}
   
   Database API format:
   - db.findMany(modelName, { where: filter, limit: number })
   - db.findUnique(modelName, where)
   - db.create(modelName, data)
   - db.update(modelName, where, data)
   - db.delete(modelName, where)

3. INPUT PARAMETER HANDLING:
   ${extractedInputParams.length > 0 ? `
   The code MUST expect these input parameters in the input object:
   ${extractedInputParams.map((param: any) => `
   - input.${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}
     ${param.kind === 'object' ? `This is a database relation ID for ${param.relationModel} model` : ''}
   `).join('')}
   
   Always validate required input parameters at the start of your code:
   ${extractedInputParams.filter((p: any) => p.required).map((param: any) => `
   if (!input.${param.name}) throw new Error('Required parameter ${param.name} is missing');`).join('')}
   ` : 'No input parameters required.'}

4. RETURN FORMAT:
   Always return: { success: boolean, data: any, message: string, executionTime: number }

Generate production-ready, executable JavaScript code that implements the business logic described in the pseudo steps and properly uses the Prisma schema models and fields.`;

  const result = await generateObject({
    model,
    schema: ActionCodeGenerationSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate executable JavaScript code for: ${name}

Pseudo Steps:
${pseudoSteps.map((step: any, index: number) => 
  `Step ${index + 1}: ${step.description}
  - Type: ${step.type}
  - Inputs: ${step.inputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}
  - Outputs: ${step.outputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}`
).join('\n\n')}

Use the Prisma schema models and fields provided in the context for accurate database operations.`
      }
    ],
    temperature: 0.2,
  });

  return result.object;
}

/**
 * Helper functions for action generation
 */
function determineActionType(pseudoSteps: any[]): AgentAction['type'] {
  // Extract action type based on pseudo steps content
  const stepsText = JSON.stringify(pseudoSteps).toLowerCase();
  
  if (stepsText.includes('create') || stepsText.includes('add') || stepsText.includes('insert') || stepsText.includes('new')) {
    return 'Create';
  } else if (stepsText.includes('update') || stepsText.includes('edit') || stepsText.includes('modify') || stepsText.includes('change')) {
    return 'Update';
  } else {
    return 'Create'; // Default fallback
  }
}

function getActionEmoji(actionName: string): string {
  const name = actionName.toLowerCase();
  if (name.includes('create') || name.includes('add')) return '➕';
  if (name.includes('update') || name.includes('edit')) return '✏️';
  if (name.includes('delete') || name.includes('remove')) return '🗑️';
  if (name.includes('send') || name.includes('email')) return '📧';
  if (name.includes('process') || name.includes('analyze')) return '⚙️';
  return '🔄'; // Default
}

function extractReferencedModels(pseudoSteps: any[], availableModels: any[]): any[] {
  const referencedModelNames = new Set<string>();
  
  pseudoSteps.forEach(step => {
    [...(step.inputFields || []), ...(step.outputFields || [])].forEach((field: any) => {
      if (field.relationModel) {
        referencedModelNames.add(field.relationModel);
      }
    });
  });
  
  return availableModels.filter(model => referencedModelNames.has(model.name));
}

function extractPrimaryModel(pseudoSteps: any[], availableModels: any[]): string | undefined {
  // Look for the most frequently referenced model
  const modelCounts: Record<string, number> = {};
  
  pseudoSteps.forEach(step => {
    [...(step.inputFields || []), ...(step.outputFields || [])].forEach((field: any) => {
      if (field.relationModel) {
        modelCounts[field.relationModel] = (modelCounts[field.relationModel] || 0) + 1;
      }
    });
  });
  
  const primaryModel = Object.entries(modelCounts).sort(([,a], [,b]) => b - a)[0];
  return primaryModel ? primaryModel[0] : undefined;
}

function extractResultFields(outputParameters: any[]): Record<string, any> {
  const fields: Record<string, any> = {};
  
  outputParameters.forEach(param => {
    fields[param.name] = {
      type: param.type,
      description: param.description
    };
  });
  
  return fields;
}

function generateStepForms(inputParameters: any[], availableModels: any[]): any[] {
  return inputParameters.map(param => ({
    id: param.name,
    type: param.type,
    label: param.description || param.name,
    required: param.required || false,
    validation: param.validation || {}
  }));
}

function generateResultView(actionName: string, outputParameters: any[]): any {
  return {
    type: 'table',
    title: `${actionName} Results`,
    columns: outputParameters.map(param => ({
      key: param.name,
      label: param.description || param.name,
      type: param.type
    }))
  };
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
  
  // Database complexity factor based on relationship count and model complexity
  const relationshipCount = databaseGeneration.relationships.length;
  if (relationshipCount > 10) complexityScore += 30;
  else if (relationshipCount > 5) complexityScore += 15;
  
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
    .map(a => `${a.name} API`)
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
  const relationshipComplexity = databaseGeneration.relationships.length > 10 ? 20 : 
                                databaseGeneration.relationships.length > 5 ? 10 : 0;
  const maintainability = Math.max(0, 100 - (actionsWithComplexCode * 10) - relationshipComplexity);
  
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