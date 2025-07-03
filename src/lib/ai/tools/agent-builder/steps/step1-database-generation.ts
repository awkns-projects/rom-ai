import { generateDatabase, generateExampleRecords, generatePrismaDatabase } from '../generation';
import type { AgentData, AgentEnum, AgentModel, } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import { z } from 'zod';

/**
 * STEP 1: Database Generation & Model Design
 * 
 * Generate database models, schemas, and example data based on comprehensive analysis.
 * This step creates the data foundation for the agent system.
 */

export interface Step1Input {
  promptUnderstanding: Step0Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step1Output {
  prismaSchema: string;
  models: AgentModel[];
  enums: AgentEnum[];
  exampleRecords: Record<string, any[]>;
  designRationale: string;
  actionAwarenessScore: number;
  relationshipComplexity: 'simple' | 'moderate' | 'complex';
  scalabilityConsiderations: string[];
  validationResults: {
    fieldValidation: boolean;
    relationshipValidation: boolean;
    actionCompatibility: boolean;
    overallScore: number;
    details: {
      fieldIssues: string[];
      relationshipIssues: string[];
      actionCompatibilityIssues: string[];
    };
  };
}

/**
 * Execute Step 1: Database Generation and Model Design
 */
export async function executeStep1DatabaseGeneration(
  input: Step1Input
): Promise<Step1Output> {
  console.log('🗃️ STEP 1: Starting database generation and model design...');
  
  const { promptUnderstanding, existingAgent, conversationContext, command } = input;
  
  try {
    // Use original generateDatabase function with enhanced context
    console.log('📊 Generating database schema with action-aware design...');
    const databaseResult = await generatePrismaDatabase(
      promptUnderstanding,
      existingAgent,
      // conversationContext,
      // command
    );

    // Enhanced validation and analysis from hybrid approach
    console.log('🔍 Performing comprehensive database validation...');
    const schemaObject = databaseResult.schemaObject;
    const schemaString = databaseResult.schemaString;
    const validationResults = await validateDatabaseDesign(schemaObject, promptUnderstanding);
    
    // Generate example records with business context
    console.log('📝 Generating realistic example records...');
    const exampleRecords = await generateExampleRecords(
      schemaObject.models,
      existingAgent?.models || [],
      promptUnderstanding.userRequestAnalysis.businessContext
    );

    // Analyze design quality and action awareness
    const designAnalysis = analyzeDatabaseDesign(schemaObject, promptUnderstanding);

    const result: Step1Output = {
      prismaSchema: schemaString,
      models: schemaObject.models,
      enums: schemaObject.enums,
      exampleRecords,
      designRationale: designAnalysis.rationale,
      actionAwarenessScore: designAnalysis.actionAwarenessScore,
      relationshipComplexity: designAnalysis.relationshipComplexity,
      scalabilityConsiderations: designAnalysis.scalabilityConsiderations,
      validationResults
    };

    console.log('✅ STEP 1: Database generation completed successfully');
    console.log(`📊 Database Summary:
- Models: ${result.models.length}
- Model Enums: ${result.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0)}
- Action Awareness Score: ${result.actionAwarenessScore}/100
- Relationship Complexity: ${result.relationshipComplexity}
- Validation Score: ${result.validationResults.overallScore}/100`);

    return result;
    
  } catch (error) {
    console.error('❌ STEP 1: Database generation failed:', error);
    throw new Error(`Step 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced database design validation with hybrid approach insights
 */
async function validateDatabaseDesign(
  databaseResult: { models: AgentModel[] },
  promptUnderstanding: Step0Output
) {
  console.log('🔍 Validating database design comprehensively...');
  
  // Field validation
  const fieldValidation = validateModelFields(databaseResult.models);
  
  // Relationship validation
  const relationshipValidation = validateModelRelationships(databaseResult.models);
  
  // Action compatibility validation
  const actionCompatibility = validateActionCompatibility(
    databaseResult.models,
    promptUnderstanding.workflowAutomationNeeds
  );
  
  const overallScore = Math.round(
    (fieldValidation.score + relationshipValidation.score + actionCompatibility.score) / 3
  );
  
  return {
    fieldValidation: fieldValidation.passed,
    relationshipValidation: relationshipValidation.passed,
    actionCompatibility: actionCompatibility.passed,
    overallScore,
    details: {
      fieldIssues: fieldValidation.issues,
      relationshipIssues: relationshipValidation.issues,
      actionCompatibilityIssues: actionCompatibility.issues
    }
  };
}

/**
 * Validate model fields for completeness and correctness
 */
function validateModelFields(models: AgentModel[]) {
  const issues: string[] = [];
  let score = 100;
  
  for (const model of models) {
    // Check ID field
    const idField = model.fields.find(f => f.name === 'id');
    if (!idField || !idField.isId) {
      issues.push(`Model ${model.name} missing proper ID field`);
      score -= 10;
    }
    
    // Check required fields
    const requiredFields = model.fields.filter(f => f.required);
    if (requiredFields.length === 0) {
      issues.push(`Model ${model.name} has no required fields`);
      score -= 5;
    }
    
    // Check display fields
    if (!model.displayFields.length) {
      issues.push(`Model ${model.name} has no display fields`);
      score -= 5;
    }
    
    // Check field types
    for (const field of model.fields) {
      if (!field.type) {
        issues.push(`Field ${field.name} in ${model.name} missing type`);
        score -= 3;
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
 * Validate model relationships for consistency
 */
function validateModelRelationships(models: AgentModel[]) {
  const issues: string[] = [];
  let score = 100;
  const modelNames = new Set(models.map(m => m.name));
  
  for (const model of models) {
    for (const field of model.fields) {
      if (field.relationField) {
        // Check if target model exists
        if (!modelNames.has(field.type)) {
          issues.push(`Relation field ${field.name} in ${model.name} references non-existent model ${field.type}`);
          score -= 15;
        }
        
        // Check relation field properties
        if (field.kind !== 'object') {
          issues.push(`Relation field ${field.name} in ${model.name} should have kind 'object'`);
          score -= 5;
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
 * Validate database design for action compatibility
 */
function validateActionCompatibility(
  models: AgentModel[],
  workflowNeeds: Step0Output['workflowAutomationNeeds']
) {
  const issues: string[] = [];
  let score = 100;
  
  // Check if models support required actions
  const requiredActions = workflowNeeds.requiredActions || [];
  const oneTimeActions = workflowNeeds.oneTimeActions || [];
  const recurringSchedules = workflowNeeds.recurringSchedules || [];
  
  const allActions = [...requiredActions, ...oneTimeActions, ...recurringSchedules];
  
  for (const action of allActions) {
    // Check if models have status fields for workflow tracking
    const needsStatusTracking = action.purpose.toLowerCase().includes('track') || 
                               action.purpose.toLowerCase().includes('status') ||
                               action.purpose.toLowerCase().includes('workflow');
    
    if (needsStatusTracking) {
      const hasStatusFields = models.some(model => 
        model.fields.some(field => 
          field.name.toLowerCase().includes('status') || 
          field.name.toLowerCase().includes('state')
        )
      );
      
      if (!hasStatusFields) {
        issues.push(`Action "${action.name}" requires status tracking but no status fields found`);
        score -= 10;
      }
    }
    
    // Check if models have audit fields for tracking changes
    const needsAuditTrail = action.purpose.toLowerCase().includes('audit') ||
                           action.purpose.toLowerCase().includes('track') ||
                           action.purpose.toLowerCase().includes('history');
    
    if (needsAuditTrail) {
      const hasAuditFields = models.some(model =>
        model.fields.some(field =>
          field.name === 'createdAt' || field.name === 'updatedAt' ||
          field.name === 'createdBy' || field.name === 'updatedBy'
        )
      );
      
      if (!hasAuditFields) {
        issues.push(`Action "${action.name}" requires audit trail but no audit fields found`);
        score -= 8;
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
 * Analyze database design quality and provide insights
 */
function analyzeDatabaseDesign(
  databaseResult: { models: AgentModel[] },
  promptUnderstanding: Step0Output
) {
  const models = databaseResult.models;
  
  // Calculate action awareness score
  let actionAwarenessScore = 0;
  const requiredActions = promptUnderstanding.workflowAutomationNeeds.requiredActions.length;
  const oneTimeActions = promptUnderstanding.workflowAutomationNeeds.oneTimeActions.length;
  const recurringSchedules = promptUnderstanding.workflowAutomationNeeds.recurringSchedules.length;
  const totalActions = requiredActions + oneTimeActions + recurringSchedules;
  
  // Check for workflow-supporting fields
  const hasStatusFields = models.some(m => m.fields.some(f => f.name.includes('status')));
  const hasAuditFields = models.some(m => m.fields.some(f => f.name.includes('createdAt')));
  const hasUserFields = models.some(m => m.fields.some(f => f.name.includes('userId') || f.name.includes('assignedTo')));
  
  if (hasStatusFields) actionAwarenessScore += 30;
  if (hasAuditFields) actionAwarenessScore += 25;
  if (hasUserFields) actionAwarenessScore += 20;
  if (totalActions > 0 && models.length >= totalActions) actionAwarenessScore += 10;
  
  // Determine relationship complexity
  const totalRelationships = models.reduce((count, model) => 
    count + model.fields.filter(f => f.relationField).length, 0
  );
  
  let relationshipComplexity: 'simple' | 'moderate' | 'complex';
  if (totalRelationships <= 2) relationshipComplexity = 'simple';
  else if (totalRelationships <= 5) relationshipComplexity = 'moderate';
  else relationshipComplexity = 'complex';
  
  // Generate scalability considerations
  const scalabilityConsiderations: string[] = [];
  
  if (models.length > 5) {
    scalabilityConsiderations.push('Consider database indexing for performance');
  }
  
  if (totalRelationships > 3) {
    scalabilityConsiderations.push('Monitor query performance with complex joins');
  }
  
  if (totalActions > 3) {
    scalabilityConsiderations.push('Plan for concurrent action execution');
  }
  
  const hasLargeTextField = models.some(m => 
    m.fields.some(f => f.name.includes('description') || f.name.includes('content'))
  );
  if (hasLargeTextField) {
    scalabilityConsiderations.push('Consider text search optimization for large content fields');
  }
  
  // Generate design rationale
  const rationale = `Database design supports ${models.length} models with ${relationshipComplexity} relationship structure. Action-aware design score: ${actionAwarenessScore}/100. The schema is optimized for ${promptUnderstanding.userRequestAnalysis.businessContext} domain with support for ${totalActions} planned actions.`;
  
  return {
    rationale,
    actionAwarenessScore,
    relationshipComplexity,
    scalabilityConsiderations
  };
}

/**
 * Validate Step 1 output for completeness and quality
 */
export function validateStep1Output(output: Step1Output): boolean {
  try {
    if (!output.models.length) {
      console.warn('⚠️ No models generated');
      return false;
    }
    
    if (output.validationResults.overallScore < 70) {
      console.warn(`⚠️ Low validation score: ${output.validationResults.overallScore}/100`);
      return false;
    }
    
    if (output.actionAwarenessScore < 50) {
      console.warn(`⚠️ Low action awareness score: ${output.actionAwarenessScore}/100`);
      return false;
    }
    
    // Check that all models have ID fields
    const modelsWithoutId = output.models.filter(m => 
      !m.fields.some(f => f.name === 'id' && f.isId)
    );
    
    if (modelsWithoutId.length > 0) {
      console.warn(`⚠️ Models without proper ID fields: ${modelsWithoutId.map(m => m.name).join(', ')}`);
      return false;
    }
    
    console.log('✅ Step 1 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 1 output validation failed:', error);
    return false;
  }
}

/**
 * Extract database insights for downstream steps
 */
export function extractDatabaseInsights(output: Step1Output) {
  return {
    modelCount: output.models.length,
    enumCount: output.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0),
    relationshipComplexity: output.relationshipComplexity,
    actionAwarenessScore: output.actionAwarenessScore,
    validationScore: output.validationResults.overallScore,
    scalabilityConsiderations: output.scalabilityConsiderations,
    hasExampleData: Object.keys(output.exampleRecords).length > 0,
    primaryModels: output.models.slice(0, 3).map(m => m.name),
    requiresCarefulHandling: output.relationshipComplexity === 'complex' || output.validationResults.overallScore < 80
  };
} 