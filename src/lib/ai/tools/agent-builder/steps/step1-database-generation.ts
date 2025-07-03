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
  step0Analysis: Step0Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step1Output {
  enums: AgentEnum[];
  models: AgentModel[];
  implementationNotes: string[];
  prismaSchema: string;
}


/**
 * Execute Step 1: Database Generation
 */
export async function executeStep1DatabaseGeneration(
  input: Step1Input
): Promise<Step1Output> {
  console.log('🗄️ STEP 1: Starting database generation and schema analysis...');
  
  const { step0Analysis, existingAgent, conversationContext, command } = input;
  
  try {
    // Create minimal prompt understanding with only data needed for database generation
    // const promptUnderstanding = createDatabasePromptUnderstanding(step0Analysis);

    console.log('🏗️ Generating Prisma database with Step 0 context...');
    console.log(`📊 Step 0 Model Analysis: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`);
    console.log(`🔍 Model Details: ${step0Analysis.models.length} total models identified in analysis`);

    const databaseResult = await generatePrismaDatabase({
      existingAgent,
      step0Analysis
    });

    const result: Step1Output = {
      enums: databaseResult.enums,
      prismaSchema: databaseResult.prismaSchema,
      models: databaseResult.models,
      implementationNotes: [
        `Generated ${databaseResult.models.length} models based on Step 0 analysis`,
        `Step 0 identified ${step0Analysis.models.length} required models`,
        `Database generation strategy: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`
      ]
    };

    console.log('✅ STEP 1: Database generation completed successfully');
    console.log(`🗄️ Database Summary:
- Generated Models: ${result.models.length}
- Step 0 Model Context: ${step0Analysis.models.length} total (${step0Analysis.models.filter(m => m.operation === 'create').length} new, ${step0Analysis.models.filter(m => m.operation === 'update').length} updates)`);

    return result;
    
  } catch (error) {
    console.error('❌ STEP 1: Database generation failed:', error);
    throw new Error(`Step 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    
    // Check that models have proper structure
    const invalidModels = output.models.filter(m => 
      !m.name || !m.fields || m.fields.length === 0
    );
    
    if (invalidModels.length > 0) {
      console.warn(`⚠️ Invalid models found: ${invalidModels.length}`);
      return false;
    }
    
    // Check for duplicate model names
    const modelNames = output.models.map(m => m.name);
    const uniqueNames = new Set(modelNames);
    if (modelNames.length !== uniqueNames.size) {
      console.warn('⚠️ Duplicate model names found');
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
 * Extract model insights for downstream steps
 */
export function extractModelInsights(output: Step1Output) {
  return {
    modelCount: output.models.length,
    totalFields: output.models.reduce((total, model) => total + model.fields.length, 0),
    hasRelationships: output.models.some(model => 
      model.fields.some(field => field.type.includes('Model'))
    )
  };
} 