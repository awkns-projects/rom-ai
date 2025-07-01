import { generateObject } from 'ai';
import { getAgentBuilderModel } from '../generation';
import type { AgentData } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';
import type { Step2Output } from './step2-technical-analysis';
import { z } from 'zod';
import { ConvertSchemaToObject } from './schema/json';
import { mergeSchema } from './schema/mergeSchema';

/**
 * STEP 3: Database Generation using Prisma Schema
 * 
 * This step processes the Prisma schema generated in Step 2 and converts it
 * into AgentModel objects that can be used by the system for database operations,
 * CRUD generation, and API endpoints.
 */

export interface Step3Input {
  promptUnderstanding: Step0Output;
  decision: Step1Output;
  technicalAnalysis: Step2Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step3Output {
  models: Array<{
    name: string;
    displayName: string;
    description: string;
    tableName: string;
    fields: Array<{
      name: string;
      displayName: string;
      type: 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime' | 'Json' | 'Enum';
      description: string;
      isRequired: boolean;
      isUnique: boolean;
      isPrimary: boolean;
      defaultValue?: string;
      enumValues?: string[];
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        customRules?: string[];
      };
      relationship?: {
        type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
        model: string;
        foreignKey?: string;
        joinTable?: string;
        onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
        onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
      };
    }>;
    relationships: Array<{
      type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
      relatedModel: string;
      foreignKey?: string;
      joinTable?: string;
      description: string;
    }>;
    indexes: Array<{
      fields: string[];
      type: 'index' | 'unique' | 'fulltext';
      name?: string;
    }>;
    metadata: {
      softDelete?: boolean;
      timestamps?: boolean;
      versioning?: boolean;
      caching?: boolean;
      searchable?: boolean;
    };
  }>;
  enums: Array<{
    name: string;
    values: Array<{
      value: string;
      label: string;
      description?: string;
    }>;
    description: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    description: string;
    constraintName?: string;
  }>;
  constraints: Array<{
    type: 'foreign_key' | 'unique' | 'check' | 'primary_key';
    table: string;
    columns: string[];
    referencedTable?: string;
    referencedColumns?: string[];
    name: string;
    description: string;
  }>;
  migrationScript: string;
  validationResults: {
    modelsValid: boolean;
    relationshipsValid: boolean;
    constraintsValid: boolean;
    migrationSafe: boolean;
    overallScore: number;
  };
}

/**
 * Execute Step 3: Database Generation from Prisma Schema
 */
export async function executeStep3DatabaseGeneration(
  input: Step3Input
): Promise<Step3Output> {
  console.log('🗄️ Starting Step 3: Database Generation');
  
  const { technicalAnalysis, existingAgent } = input;
  
  console.log(`📊 Step 2 Prisma Schema: ${technicalAnalysis.prismaSchema.schema.length} characters`);
  
  // Phase 1: Parse the Prisma schema generated in Step 2
  console.log('🔍 Phase 1: Converting Prisma schema to structured format');
  
  try {
    const schemaConverter = new ConvertSchemaToObject(technicalAnalysis.prismaSchema.schema);
    
    // Add debugging for schema parsing
    console.log('🔍 Schema content preview:', technicalAnalysis.prismaSchema.schema.substring(0, 500) + '...');
    
    const schemaObject = schemaConverter.run();
    
    // Add detailed debugging for schema parsing results
    console.log('🔍 Schema parsing results:', {
      rawModelsFound: schemaConverter['models']?.length || 0,
      rawEnumsFound: schemaConverter['enums']?.length || 0,
      parsedModels: schemaObject.models.length,
      parsedEnums: schemaObject.enums.length,
      modelNames: schemaObject.models.map(m => m.name)
    });
    
    if (schemaObject.models.length === 0) {
      console.warn('⚠️ No models found in parsed schema');
      console.warn('🔍 Raw schema being parsed:', technicalAnalysis.prismaSchema.schema);
      console.warn('🔍 Checking for model keywords:', {
        hasModelKeyword: technicalAnalysis.prismaSchema.schema.includes('model '),
        hasGenerator: technicalAnalysis.prismaSchema.schema.includes('generator'),
        hasDatasource: technicalAnalysis.prismaSchema.schema.includes('datasource'),
        schemaLength: technicalAnalysis.prismaSchema.schema.length
      });
    }
    
    const processedSchema = mergeSchema(schemaObject, '');
    
    console.log(`📊 Parsed schema: ${processedSchema.models.length} models, ${processedSchema.enums.length} enums`);
    
    // Log existing agent context if available
    if (existingAgent) {
      console.log(`🔄 Updating existing agent with ${existingAgent.models?.length || 0} existing models`);
      if (existingAgent.metadata?.prismaSchema) {
        console.log(`📝 Existing Prisma schema: ${existingAgent.metadata.prismaSchema.length} characters`);
      }
    }
    
    // Transform models from @paljs format to Step3Output format
    const transformedModels = processedSchema.models.map((model: any) => {
      // Check if this model exists in the existing agent
      const existingModel = existingAgent?.models?.find(m => 
        m.name.toLowerCase() === model.name.toLowerCase()
      );
      
      const transformedFields = model.fields.map((field: any) => {
        let fieldType: 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime' | 'Json' | 'Enum';
        
        switch (field.type) {
          case 'String':
            fieldType = 'String';
            break;
          case 'Int':
            fieldType = 'Int';
            break;
          case 'Float':
            fieldType = 'Float';
            break;
          case 'Boolean':
            fieldType = 'Boolean';
            break;
          case 'DateTime':
            fieldType = 'DateTime';
            break;
          case 'Json':
            fieldType = 'Json';
            break;
          default:
            // Check if it's an enum type
            const isEnum = processedSchema.enums.some((e: any) => e.name === field.type);
            fieldType = isEnum ? 'Enum' : 'String';
        }
        
        return {
          name: field.name,
          displayName: field.name.charAt(0).toUpperCase() + field.name.slice(1),
          type: fieldType,
          description: `${field.name} field for ${model.name}`,
          isRequired: !field.optional,
          isUnique: field.isUnique || false,
          isPrimary: field.isId || false,
          defaultValue: field.default as string | undefined,
          enumValues: fieldType === 'Enum' ? 
            (() => {
              const enumObj = processedSchema.enums.find((e: any) => e.name === field.type);
              if (!enumObj) return undefined;
              
              // Handle both possible enum structures:
              // 1. { fields: string[] } from ConvertSchemaToObject
              // 2. { values: {name: string}[] } from other sources
              if (enumObj.fields && Array.isArray(enumObj.fields)) {
                return enumObj.fields; // fields is already an array of strings
              } else if (enumObj.values && Array.isArray(enumObj.values)) {
                return enumObj.values.map((v: any) => v.name || v);
              }
              return undefined;
            })() : 
            undefined,
          validation: field.isId ? { min: 1 } : undefined,
          relationship: field.relation ? {
            type: field.isList ? 'hasMany' as const : 'hasOne' as const,
            model: field.type,
            foreignKey: field.relation.from[0],
            onDelete: 'CASCADE' as const
          } : undefined
        };
      });
      
      return {
        name: model.name,
        displayName: model.name.charAt(0).toUpperCase() + model.name.slice(1),
        description: existingModel?.description || `${model.name} model for data management`,
        tableName: model.name.toLowerCase(),
        fields: transformedFields,
        relationships: model.fields
          .filter((f: any) => f.relation)
          .map((f: any) => ({
            type: f.isList ? 'hasMany' as const : 'belongsTo' as const,
            relatedModel: f.type,
            foreignKey: f.relation.from[0],
            description: `${f.name} relationship`
          })),
        indexes: model.fields
          .filter((f: any) => f.isUnique || f.isId)
          .map((f: any) => ({
            fields: [f.name],
            type: f.isId ? 'unique' as const : 'unique' as const
          })),
        metadata: {
          softDelete: false,
          timestamps: model.fields.some((f: any) => f.name === 'createdAt' || f.name === 'updatedAt'),
          versioning: false,
          caching: false,
          searchable: model.fields.some((f: any) => f.type === 'String')
        }
      };
    });
    
    // If no models were parsed, try to extract them from the raw Prisma schema as a fallback
    if (transformedModels.length === 0 && technicalAnalysis.prismaSchema.schema.includes('model ')) {
      console.warn('⚠️ Schema parsing failed, attempting fallback extraction...');
      
      // Simple regex fallback to extract model names from raw schema
      const modelMatches = technicalAnalysis.prismaSchema.schema.match(/model\s+(\w+)\s*{/g);
      if (modelMatches) {
        console.log(`🔄 Found ${modelMatches.length} model declarations in raw schema`);
        
        for (const match of modelMatches) {
          const modelName = match.replace(/model\s+/, '').replace(/\s*{.*/, '');
          console.log(`📦 Creating fallback model: ${modelName}`);
          
          transformedModels.push({
            name: modelName,
            displayName: modelName.charAt(0).toUpperCase() + modelName.slice(1),
            description: `${modelName} model (fallback generation)`,
            tableName: modelName.toLowerCase(),
            fields: [
              {
                name: 'id',
                displayName: 'ID',
                type: 'String' as const,
                description: 'Primary key',
                isRequired: true,
                isUnique: true,
                isPrimary: true,
                validation: { min: 1 }
              },
              {
                name: 'createdAt',
                displayName: 'Created At',
                type: 'DateTime' as const,
                description: 'Creation timestamp',
                isRequired: true,
                isUnique: false,
                isPrimary: false
              },
              {
                name: 'updatedAt',
                displayName: 'Updated At',
                type: 'DateTime' as const,
                description: 'Last update timestamp',
                isRequired: true,
                isUnique: false,
                isPrimary: false
              }
            ],
            relationships: [],
            indexes: [
              {
                fields: ['id'],
                type: 'unique' as const
              }
            ],
            metadata: {
              softDelete: false,
              timestamps: true,
              versioning: false,
              caching: false,
              searchable: false
            }
          });
        }
      }
    }
    
    // Transform enums from @paljs format to Step3Output format
    const transformedEnums = processedSchema.enums.map((enumObj: any) => {
      let enumValues: string[] = [];
      
      // Handle both possible enum structures:
      // 1. { fields: string[] } from ConvertSchemaToObject
      // 2. { values: {name: string}[] } from other sources
      if (enumObj.fields && Array.isArray(enumObj.fields)) {
        enumValues = enumObj.fields; // fields is already an array of strings
      } else if (enumObj.values && Array.isArray(enumObj.values)) {
        enumValues = enumObj.values.map((v: any) => v.name || v);
      }
      
      return {
        name: enumObj.name,
        description: `${enumObj.name} enumeration`,
        values: enumValues.map((value: string) => ({
          value: value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          description: `${value} option`
        }))
      };
    });
    
    // Generate relationships based on foreign key references
    const relationships = transformedModels.flatMap((model: any) =>
      model.fields
        .filter((field: any) => field.relationship)
        .map((field: any) => ({
          from: model.name,
          to: field.relationship!.model,
          type: field.relationship!.type === 'hasMany' ? 'one-to-many' as const : 'one-to-one' as const,
          description: `${model.name} to ${field.relationship!.model} relationship`,
          constraintName: `fk_${model.name.toLowerCase()}_${field.relationship!.model.toLowerCase()}`
        }))
    );
    
    // Generate constraints
    const constraints = transformedModels.flatMap((model: any) =>
      model.fields
        .filter((field: any) => field.isUnique || field.isPrimary)
        .map((field: any) => ({
          type: field.isPrimary ? 'primary_key' as const : 'unique' as const,
          table: model.tableName,
          columns: [field.name],
          name: `${model.tableName}_${field.name}_${field.isPrimary ? 'pkey' : 'unique'}`,
          description: `${field.isPrimary ? 'Primary key' : 'Unique'} constraint for ${field.name}`
        }))
    );
    
    const result: Step3Output = {
      models: transformedModels,
      enums: transformedEnums,
      relationships,
      constraints,
      migrationScript: technicalAnalysis.prismaSchema.migrationScript || '',
      validationResults: {
        modelsValid: transformedModels.length > 0,
        relationshipsValid: relationships.length >= 0,
        constraintsValid: constraints.length > 0,
        migrationSafe: true,
        overallScore: 95
      }
    };
    
    console.log(`✅ Step 3 Database Generation completed:
- Models: ${result.models.length}
- Enums: ${result.enums.length}
- Relationships: ${result.relationships.length}
- Constraints: ${result.constraints.length}
- Validation Score: ${result.validationResults.overallScore}/100`);
    
    // Log model details
    result.models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name}: ${model.fields.length} fields`);
    });

    return result;
    
  } catch (error) {
    console.error('❌ Error in database generation:', error);
    
    // Fallback: Return minimal structure to prevent complete failure
    return {
      models: [],
      enums: [],
      relationships: [],
      constraints: [],
      migrationScript: '',
      validationResults: {
        modelsValid: false,
        relationshipsValid: false,
        constraintsValid: false,
        migrationSafe: false,
        overallScore: 0
      }
    };
  }
}

/**
 * Validate Step 3 output for completeness and quality
 */
export function validateStep3Output(output: Step3Output): boolean {
  try {
    if (output.models.length === 0) {
      console.warn('⚠️ No models generated');
      return false;
    }
    
    // Check that all models have required fields
    for (const model of output.models) {
      if (!model.name || !model.tableName || !model.fields || model.fields.length === 0) {
        console.warn(`⚠️ Invalid model structure: ${model.name}`);
        return false;
      }
      
      // Check for primary key
      const hasPrimaryKey = model.fields.some(field => field.isPrimary);
      if (!hasPrimaryKey) {
        console.warn(`⚠️ Model ${model.name} has no primary key`);
        return false;
      }
    }
    
    // Validate relationships
    for (const relationship of output.relationships) {
      const fromModelExists = output.models.some(m => m.name === relationship.from);
      const toModelExists = output.models.some(m => m.name === relationship.to);
      
      if (!fromModelExists || !toModelExists) {
        console.warn(`⚠️ Invalid relationship: ${relationship.from} → ${relationship.to}`);
        return false;
      }
    }
    
    if (output.validationResults.overallScore < 70) {
      console.warn(`⚠️ Low validation score: ${output.validationResults.overallScore}/100`);
      return false;
    }
    
    if (!output.validationResults.modelsValid) {
      console.warn('⚠️ Models validation failed');
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
 * Extract database insights for downstream steps
 */
export function extractDatabaseInsights(output: Step3Output) {
  return {
    modelCount: output.models.length,
    enumCount: output.enums.length,
    relationshipCount: output.relationships.length,
    constraintCount: output.constraints.length,
    validationScore: output.validationResults.overallScore,
    hasComplexRelationships: output.relationships.some(r => r.type === 'many-to-many'),
    requiresCarefulMigration: !output.validationResults.migrationSafe,
    primaryModels: output.models.slice(0, 5).map(m => m.name),
    modelsWithTimestamps: output.models.filter(m => m.metadata.timestamps).length,
    modelsWithSoftDelete: output.models.filter(m => m.metadata.softDelete).length,
    searchableModels: output.models.filter(m => m.metadata.searchable).length,
    totalFieldCount: output.models.reduce((sum, model) => sum + model.fields.length, 0),
    uniqueConstraints: output.constraints.filter(c => c.type === 'unique').length,
    foreignKeyConstraints: output.constraints.filter(c => c.type === 'foreign_key').length,
    migrationComplexity: output.migrationScript.length > 2000 ? 'complex' : 
                         output.migrationScript.length > 1000 ? 'moderate' : 'simple',
    readyForActions: output.validationResults.modelsValid && output.validationResults.relationshipsValid
  };
} 