import { generateObject } from 'ai';
import { getProvider } from '../../providers';
import { getBestModelFor } from '../../models';
import type { 
  AgentData, 
  AgentModel, 
  AgentEnum, 
  AgentAction, 
  AgentSchedule, 
  PromptUnderstanding, 
  ChangeAnalysis 
} from './types';
import { 
  promptUnderstandingSchema, 
  changeAnalysisSchema, 
  unifiedDatabaseSchema,
  unifiedActionsSchema,
  unifiedSchedulesSchema,
  decisionSchema,
  granularChangeAnalysisSchema,
  deletionOperationsSchema
} from './schemas';
import { z } from 'zod';

// Mock implementations for missing functions - these will be replaced by actual imports in your environment
const mockProvider = {
  languageModel: (model: string) => model as any // This will work with your actual provider
};

const mockSupportsStructuredOutput = (model: string) => true;

// Simple mock implementation that returns the schema structure
async function mockGenerateObject(config: any): Promise<{ object: any }> {
  // This is a fallback mock - in your environment, the real generateObject will be used
  return { object: {} };
}

// Helper function to get the best model for agent builder tasks
async function getAgentBuilderModel() {
  const bestModel = getBestModelFor('generateObject');
  if (!bestModel) {
    throw new Error('No compatible model found for agent builder tasks');
  }
  const provider = await getProvider(bestModel);
  return provider(bestModel);
}

/**
 * Step 1: Generate comprehensive prompt understanding and feature imagination
 */
export async function generatePromptUnderstanding(
  userRequest: string,
  existingAgent?: AgentData
): Promise<z.infer<typeof promptUnderstandingSchema>> {
  console.log('Generating prompt understanding...');
  
  try {
    const model = await getAgentBuilderModel();
    
    const result = await generateObject({
      model,
      schema: promptUnderstandingSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert business analyst and system architect. Analyze the user's request and provide comprehensive understanding of their needs.
          
          Generate a detailed analysis that covers:
          - User request analysis with scope and objectives
          - Feature imagination including core features, UX, and business rules
          - Data modeling needs with required models, fields, and relationships
          - Workflow automation needs including actions, schedules, and business processes
          - Change analysis plan with specific changes needed
          - Implementation strategy with recommended approach
          
          Be thorough and specific in your analysis. All fields are required.`
        },
        {
          role: 'user',
          content: `Analyze this request: ${userRequest}${existingAgent ? `\n\nExisting agent context: ${JSON.stringify(existingAgent, null, 2)}` : ''}`
        }
      ]
    });

    console.log('Generated prompt understanding:', result.object);
    return result.object;
  } catch (error) {
    console.error('Error generating prompt understanding:', error);
    throw error;
  }
}

/**
 * Step 2: Generate change analysis for existing systems
 */
export async function generateChangeAnalysis(
  userRequest: string,
  existingAgent: AgentData
): Promise<z.infer<typeof changeAnalysisSchema>> {
  console.log('Generating change analysis...');
  
  try {
    const model = await getAgentBuilderModel();
    
    const result = await generateObject({
      model,
      schema: changeAnalysisSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert system analyst. Analyze the requested changes against the existing agent configuration and provide a comprehensive change analysis.
          
          Focus on:
          - What specifically needs to be changed, added, or removed
          - Impact assessment for each change
          - Dependencies between changes
          - Risk analysis and mitigation strategies
          
          All fields in the schema are required.`
        },
        {
          role: 'user',
          content: `User request: ${userRequest}\n\nExisting agent: ${JSON.stringify(existingAgent, null, 2)}`
        }
      ]
    });

    console.log('Generated change analysis:', result.object);
    return result.object;
  } catch (error) {
    console.error('Error generating change analysis:', error);
    throw error;
  }
}

/**
 * Step 3: Generate database models and enums
 */
export async function generateDatabase(
  promptUnderstanding: PromptUnderstanding,
  existingAgent?: AgentData,
  changeAnalysis?: ChangeAnalysis,
  agentOverview?: any,
  conversationContext?: string,
  command?: string
): Promise<{ models: AgentModel[], enums: AgentEnum[] }> {
  console.log('🗄️ Starting database generation with real AI...');
  
  const existingModelsContext = existingAgent ? `
EXISTING MODELS:
${(existingAgent.models || []).map((model: any) => `- ${model.name}: ${model.description || 'No description'}`).join('\n')}

EXISTING ENUMS:
${(existingAgent.enums || []).map((enumItem: any) => `- ${enumItem.name}: ${(enumItem.fields || []).map((f: any) => f.name).join(', ')}`).join('\n')}
` : '';

  const expectedCounts = changeAnalysis ? `
Expected Results:
- Total Models: ${changeAnalysis.expectedResult.totalModels}
- Total Enums: ${changeAnalysis.expectedResult.totalEnums}
` : '';

  const model = await getAgentBuilderModel();

  const result = await generateObject({
    model,
    schema: unifiedDatabaseSchema,
    messages: [
      {
        role: 'system' as const,
        content: `You are a database architect. Design data models based on the business requirements.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding, null, 2)}

${existingModelsContext}

${expectedCounts}

${changeAnalysis ? `
CHANGE ANALYSIS:
${JSON.stringify(changeAnalysis, null, 2)}
` : ''}

CRITICAL ID FIELD NAMING RULES:
1. Every model MUST have "id" as the primary key field name (NOT productId, userId, etc.)
2. The idField property MUST always be set to "id"
3. Relationship fields (foreign keys) CAN use descriptive names like "userId", "productId", etc.
4. Primary key fields should have type "String", isId: true, unique: true, required: true

CRITICAL RELATION FIELD RULES:
1. Relation fields MUST have relationField: true
2. Relation fields MUST have kind: "object" (NOT "scalar")
3. Relation fields MUST have type set to the target model name (e.g., "User", "Product")
4. Foreign key fields like "userId" should reference the "User" model
5. LIST RELATION FIELDS: If list: true AND relationField: true, field name should be plural (e.g., "productIds", "userIds")
6. LIST RELATION FIELDS: Should have defaultValue: [] to indicate empty array

EXAMPLE CORRECT MODELS:
{
  "name": "Order",
  "idField": "id",
  "fields": [
    {
      "name": "id",
      "type": "String",
      "isId": true,
      "unique": true,
      "required": true,
      "kind": "scalar",
      "relationField": false
    },
    {
      "name": "userId", 
      "type": "User",
      "isId": false,
      "kind": "object",
      "relationField": true,
      "list": false
    },
    {
      "name": "productIds",
      "type": "Product", 
      "isId": false,
      "kind": "object",
      "relationField": true,
      "list": true,
      "defaultValue": []
    }
  ]
}

Design models that:
1. Support all the required business features
2. Have proper relationships and constraints
3. Include appropriate enums for predefined values
4. Follow database best practices
5. Are optimized for the intended use cases
6. ALWAYS use "id" as the primary key field name

Each model should have:
- A clear purpose and description
- An appropriate emoji representation
- All necessary fields with correct types
- Proper relationships to other models
- Display fields for UI purposes
- PRIMARY KEY FIELD ALWAYS NAMED "id"

Each enum should have:
- A clear purpose
- All necessary values
- Proper field definitions`
      }
    ],
    temperature: 0.3,
  });

  console.log('✅ Database generation complete');
  
  // Helper function to intelligently select display fields
  function selectDisplayFields(fields: any[]): string[] {
    const priorityFields = ['name', 'title', 'label', 'email', 'username'];
    const fallbackFields = ['description', 'text', 'content', 'value'];
    
    // Look for priority fields first
    for (const priority of priorityFields) {
      const field = fields.find(f => f.name.toLowerCase() === priority);
      if (field) {
        return [field.name];
      }
    }
    
    // Look for fallback fields
    for (const fallback of fallbackFields) {
      const field = fields.find(f => f.name.toLowerCase().includes(fallback));
      if (field) {
        return [field.name];
      }
    }
    
    // If no suitable field found, look for non-ID string fields
    const stringFields = fields.filter(f => 
      !f.isId && 
      f.type === 'String' && 
      !f.relationField &&
      !f.name.toLowerCase().includes('id')
    );
    
    if (stringFields.length > 0) {
      return [stringFields[0].name];
    }
    
    // Last resort: use 'id' only if no other suitable fields exist
    return ['id'];
  }

  // Fix models to ensure they have all required fields and FORCE idField to be "id"
  const fixedModels = (result.object.models || []).map((model: any) => {
    const modelFields = (model.fields || []).map((field: any) => {
      // If this is the primary key field, ensure it's named "id"
      if (field.isId || field.name === model.idField) {
        return {
          ...field,
          id: field.id || `field_id`,
          name: 'id', // Force primary key field name to be "id"
          title: field.title || 'ID',
          type: 'String',
          isId: true,
          unique: true,
          required: true,
          kind: 'scalar',
          relationField: false,
          sort: field.sort !== undefined ? field.sort : true,
          order: field.order || 0,
          defaultValue: field.defaultValue || undefined
        };
      }
      
      // For other fields, keep their names as-is (allows userId, productId, etc. for relationships)
      return {
        ...field,
        id: field.id || `field_${field.name.toLowerCase().replace(/\s+/g, '_')}`,
        title: field.title || field.name,
        kind: field.relationField ? 'object' : (field.kind || 'scalar'), // Force relation fields to have kind: 'object'
        relationField: field.relationField || false,
        list: field.list || false,
        // Handle list relation fields with proper naming and structure
        ...(field.relationField && field.list ? {
          // For list relation fields, ensure plural naming (e.g., productIds, userIds)
          name: field.name.endsWith('Ids') || field.name.endsWith('ids') 
            ? field.name 
            : field.name.endsWith('Id') 
              ? field.name + 's'  // Convert "productId" to "productIds"
              : field.name.endsWith('id')
                ? field.name + 's'  // Convert "productid" to "productids"
                : field.name + 'Ids', // Add "Ids" suffix for other cases
          defaultValue: field.defaultValue !== undefined ? field.defaultValue : []
        } : {}),
        // For relation fields, ensure type is a model name, not a primitive type
        type: field.relationField && field.type && ['String', 'Int', 'Float', 'Boolean'].includes(field.type) 
          ? field.name.replace(/Id$/, '') // Convert "userId" to "User", "categoryId" to "Category"
          : field.type,
        sort: field.sort !== undefined ? field.sort : true,
        order: field.order || 0,
        defaultValue: field.relationField && field.list 
          ? (field.defaultValue !== undefined ? field.defaultValue : [])
          : (field.defaultValue || undefined)
      };
    });

    return {
      ...model,
      id: model.id || `model_${model.name.toLowerCase().replace(/\s+/g, '_')}`,
      emoji: model.emoji || '📊',
      description: model.description || `${model.name} data model`,
      hasPublishedField: model.hasPublishedField || false,
      idField: 'id', // ALWAYS force this to be "id", regardless of what AI generated
      displayFields: model.displayFields && model.displayFields.length > 0 
        ? model.displayFields 
        : selectDisplayFields(modelFields), // Use intelligent selection instead of ['id']
      fields: modelFields,
      enums: model.enums || [],
      forms: model.forms || [],
      records: model.records || []
    };
  });

  const fixedEnums = (result.object.enums || []).map((enumItem: any) => ({
    ...enumItem,
    id: enumItem.id || `enum_${enumItem.name.toLowerCase().replace(/\s+/g, '_')}`,
    fields: (enumItem.fields || []).map((field: any) => ({
      ...field,
      id: field.id || `enum_field_${field.name.toLowerCase().replace(/\s+/g, '_')}`,
      type: field.type || 'String',
      defaultValue: field.defaultValue || undefined
    }))
  }));

  return {
    models: fixedModels,
    enums: fixedEnums
  };
}

/**
 * Step 4: Generate actions
 */
export async function generateActions(
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[], enums: AgentEnum[] },
  existingAgent?: AgentData,
  changeAnalysis?: ChangeAnalysis,
  agentOverview?: any,
  conversationContext?: string,
  command?: string
): Promise<{ actions: AgentAction[] }> {
  console.log('⚡ Starting actions generation with real AI...');
  
  const businessRulesContext = promptUnderstanding.featureImagination.businessRules || 'Standard business rules apply';
  const userRolesContext = promptUnderstanding.featureImagination.userExperience || 'General users and administrators';
  
  const existingActionsContext = existingAgent ? `
EXISTING ACTIONS:
${(existingAgent.actions || []).map((action: any) => `- ${action.name}: ${action.description || 'No description'}`).join('\n')}
` : '';

  const model = await getAgentBuilderModel();

  const result = await generateObject({
    model,
    schema: unifiedActionsSchema,
    messages: [
      {
        role: 'system' as const,
        content: `You are a workflow automation expert. Design actions that implement business processes.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding.workflowAutomationNeeds, null, 2)}

AVAILABLE DATA MODELS:
${(databaseResult.models || []).map(model => `- ${model.name}: ${(model.fields || []).map(f => f.name).join(', ')}`).join('\n')}

AVAILABLE ENUMS:
${(databaseResult.enums || []).map(enumItem => `- ${enumItem.name}: ${(enumItem.fields || []).map(f => f.name).join(' | ')}`).join('\n') || 'None'}

Business Rules: ${Array.isArray(businessRulesContext) ? businessRulesContext.join(', ') : businessRulesContext}

User Roles: ${Array.isArray(userRolesContext) ? userRolesContext.join(', ') : userRolesContext}

${existingActionsContext}

Design actions that:
1. Implement the required business processes
2. Follow the business rules
3. Respect user role permissions
4. Use the available data models
5. Provide clear value to users

Each action should:
- Have a clear purpose and description
- Use appropriate data sources (database queries)
- Execute meaningful business logic
- Return proper results
- Have appropriate role-based access`
      }
    ],
    temperature: 0.3,
  });

  console.log('✅ Actions generation complete');
  
  // Fix actions to ensure they have all required fields
  const fixedActions = (result.object.actions || []).map((action: any) => ({
    ...action,
    id: action.id || `action_${action.name.toLowerCase().replace(/\s+/g, '_')}`,
    emoji: action.emoji || '⚡',
    type: action.type || 'Create',
    role: action.role || 'member',
    dataSource: {
      type: action.dataSource?.type || 'database',
      customFunction: action.dataSource?.customFunction || undefined,
      database: action.dataSource?.type === 'custom' 
        ? (action.dataSource?.database || null)
        : (action.dataSource?.database || {
            models: (databaseResult.models || []).slice(0, 1).map(model => ({
              id: model.id,
              name: model.name,
              fields: (model.fields || []).slice(0, 3).map(field => ({
                id: field.id,
                name: field.name
              }))
            }))
          })
    },
    execute: {
      type: action.execute?.type || 'prompt',
      code: action.execute?.code || undefined,
      prompt: action.execute?.prompt || {
        template: `Process ${action.name} request`,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    results: {
      actionType: action.results?.actionType || action.type || 'Create',
      model: action.results?.model || (databaseResult.models[0]?.name || 'DefaultModel'),
      identifierIds: action.results?.identifierIds || undefined,
      fields: action.results?.fields || {},
      fieldsToUpdate: action.results?.fieldsToUpdate || undefined
    }
  }));

  return {
    actions: fixedActions
  };
}

/**
 * Step 5: Generate schedules
 */
export async function generateSchedules(
  promptUnderstanding: PromptUnderstanding,
  databaseSchema: any,
  actions: any,
  existingAgent?: AgentData,
  changeAnalysis?: ChangeAnalysis
): Promise<{ schedules: AgentSchedule[] }> {
  console.log('🕒 Starting schedules generation with real AI...');
  
  const model = await getAgentBuilderModel();

  const result = await generateObject({
    model,
    schema: unifiedSchedulesSchema,
    messages: [
      {
        role: 'system' as const,
        content: `You are a scheduling automation expert. Design schedules that automate business processes.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding.workflowAutomationNeeds, null, 2)}

AVAILABLE ACTIONS:
${Array.isArray(actions) ? actions.map((action: any) => `- ${action.name}: ${action.description}`).join('\n') : 'No actions available'}

AVAILABLE DATA MODELS:
${databaseSchema?.models?.map((model: any) => `- ${model.name}`).join('\n') || 'No models available'}

Design schedules that:
1. Automate recurring business processes
2. Trigger at appropriate intervals
3. Use available actions effectively
4. Provide business value through automation

Each schedule should:
- Have a clear purpose and timing
- Use appropriate intervals (cron patterns)
- Execute meaningful actions
- Have proper role-based access`
      }
    ],
    temperature: 0.3,
  });

  console.log('✅ Schedules generation complete');
  
  // Fix schedules to ensure they have all required fields
  const fixedSchedules = (result.object.schedules || []).map((schedule: any) => ({
    ...schedule,
    id: schedule.id || `schedule_${schedule.name.toLowerCase().replace(/\s+/g, '_')}`,
    emoji: schedule.emoji || '🕒',
    type: schedule.type || 'Create',
    role: schedule.role || 'admin',
    interval: {
      pattern: schedule.interval?.pattern || '0 0 * * *',
      timezone: schedule.interval?.timezone || 'UTC',
      active: schedule.interval?.active !== undefined ? schedule.interval.active : true
    },
    dataSource: {
      type: schedule.dataSource?.type || 'database',
      customFunction: schedule.dataSource?.customFunction || undefined,
      database: schedule.dataSource?.type === 'custom' 
        ? (schedule.dataSource?.database || null)
        : (schedule.dataSource?.database || {
            models: databaseSchema?.models?.slice(0, 1).map((model: any) => ({
              id: model.id,
              name: model.name,
              fields: model.fields?.slice(0, 3).map((field: any) => ({
                id: field.id,
                name: field.name
              })) || []
            })) || []
          })
    },
    execute: {
      type: schedule.execute?.type || 'prompt',
      code: schedule.execute?.code || undefined,
      prompt: schedule.execute?.prompt || {
        template: `Execute ${schedule.name} schedule`,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    results: {
      actionType: schedule.results?.actionType || schedule.type || 'Create',
      model: schedule.results?.model || (databaseSchema?.models?.[0]?.name || 'DefaultModel'),
      identifierIds: schedule.results?.identifierIds || undefined,
      fields: schedule.results?.fields || {},
      fieldsToUpdate: schedule.results?.fieldsToUpdate || undefined
    }
  }));

  return {
    schedules: fixedSchedules
  };
}

/**
 * Validation helper
 */
export function validateGenerationResult(
  result: any, 
  expectedCount: number, 
  itemType: string
): boolean {
  if (!result || typeof result !== 'object') {
    console.warn(`❌ Invalid ${itemType} result: not an object`);
    return false;
  }

  const items = result[itemType] || result.object?.[itemType];
  if (!Array.isArray(items)) {
    console.warn(`❌ Invalid ${itemType} result: no array found`);
    return false;
  }

  if (items.length < expectedCount) {
    console.warn(`❌ ${itemType} count mismatch: expected ${expectedCount}, got ${items.length}`);
    return false;
  }

  return true;
}

/**
 * Retry helper with enhanced prompts
 */
export async function retryGenerationWithEnhancedPrompt(
  generationFunction: Function,
  originalPrompt: string,
  expectedCount: number,
  itemType: string
): Promise<any> {
  console.log(`🔄 Retrying ${itemType} generation with enhanced prompt...`);
  
  const enhancedPrompt = `${originalPrompt}\n\nIMPORTANT: You must generate exactly ${expectedCount} ${itemType}. This is critical for the system to function properly.`;
  
  return generationFunction(enhancedPrompt);
}

export async function generateDecision(
  command: string,
  conversationContext: string,
  promptUnderstanding: PromptUnderstanding,
  existingAgent?: AgentData,
  granularChanges?: any,
  currentOperation: string = 'create'
) {
  console.log('🧠 Starting decision generation with real AI...');
  
  const model = await getAgentBuilderModel();
  
  const result = await generateObject({
    model,
    schema: decisionSchema,
    messages: [
      {
        role: 'system' as const,
        content: `You are an AI system architect that analyzes user requests to determine the optimal development approach.

CONVERSATION CONTEXT:
${conversationContext}

USER REQUEST: "${command}"

COMPREHENSIVE ANALYSIS RESULTS:
${JSON.stringify(promptUnderstanding, null, 2)}

${granularChanges ? `
GRANULAR CHANGE PLAN:
${JSON.stringify(granularChanges, null, 2)}
` : ''}

EXISTING SYSTEM: ${existingAgent ? JSON.stringify({
  name: existingAgent.name,
  description: existingAgent.description,
  domain: existingAgent.domain,
  models: (existingAgent.models || []).map(m => m.name),
  enums: (existingAgent.enums || []).map(e => e.name),
  actions: (existingAgent.actions || []).map(a => a.name)
}, null, 2) : 'None'}

Based on the comprehensive analysis above, determine the technical approach:

1. ANALYSIS REASONING: Synthesize the prompt understanding into technical requirements
2. SCOPE DETERMINATION:
   - needsFullAgent: Based on the required models (${promptUnderstanding.dataModelingNeeds.requiredModels.length}) and actions (${promptUnderstanding.workflowAutomationNeeds.requiredActions.length})
   - needsDatabase: Based on the ${promptUnderstanding.dataModelingNeeds.requiredModels.length} required models
   - needsActions: Based on the ${promptUnderstanding.workflowAutomationNeeds.requiredActions.length} required actions
3. OPERATION TYPE: ${currentOperation} (based on existing system presence)
4. PRIORITY: Based on dependencies and implementation strategy from analysis
5. SPECIFIC WORK: Reference the detailed plans already created

The prompt understanding has already done the heavy lifting - now translate that into technical execution decisions.`
      }
    ],
    temperature: 0.3,
  });

  console.log('✅ Decision generation complete');
  return result;
}

export async function generateGranularChangeAnalysis(
  command: string,
  promptUnderstanding: PromptUnderstanding,
  existingAgent?: AgentData
) {
  console.log('🔍 Starting granular change analysis with real AI...');
  
  const model = await getAgentBuilderModel();
  
  const result = await generateObject({
    model,
    schema: granularChangeAnalysisSchema,
    messages: [
      {
        role: 'system' as const,
        content: `You are a technical project manager creating detailed implementation plans.

PROMPT UNDERSTANDING RESULTS:
${JSON.stringify(promptUnderstanding, null, 2)}

EXISTING SYSTEM: ${existingAgent ? JSON.stringify({
  models: (existingAgent.models || []).map(m => ({ id: m.id, name: m.name, fields: (m.fields || []).map(f => ({ id: f.id, name: f.name, type: f.type })) })),
  enums: (existingAgent.enums || []).map(e => ({ id: e.id, name: e.name, fields: (e.fields || []).map(f => ({ id: f.id, name: f.name })) })),
  actions: (existingAgent.actions || []).map(a => ({ id: a.id, name: a.name, type: a.type }))
}, null, 2) : 'None'}

Create a detailed execution plan that breaks down each change into specific operations:

1. ANALYZE EACH CHANGE from the change analysis plan
2. CREATE SPECIFIC OPERATIONS for each change (add-model, modify-field, etc.)
3. IDENTIFY DEPENDENCIES between operations
4. ASSESS RISKS for each operation
5. CREATE EXECUTION PHASES that group related operations
6. PLAN RISK MITIGATION strategies

For each specific change:
- Be granular: "add User model" becomes "add-model: User" with specific field operations
- Include field-level changes: "add email field to User" becomes "add-field: email in User model"
- Consider data types, relationships, and constraints
- Think about validation and potential conflicts

For execution planning:
- Group related changes into logical phases
- Ensure dependencies are satisfied before dependent operations
- Consider rollback strategies for each phase
- Identify critical path and potential bottlenecks

${existingAgent ? `
PRESERVATION STRATEGY:
- Identify exactly what existing data must be preserved
- Plan how to safely modify existing structures
- Consider backward compatibility requirements
- Plan data migration if needed
` : ''}

Be thorough and consider edge cases. This plan will guide the actual implementation.`
      }
    ],
    temperature: 0.2,
  });

  console.log('✅ Granular change analysis complete');
  return result;
}

export async function generateDeletionOperations(
  command: string,
  changeAnalysis: any,
  existingAgent: AgentData,
  granularChanges?: any
) {
  console.log('🗑️ Starting deletion operations generation with real AI...');
  
  const model = await getAgentBuilderModel();
  
  const result = await generateObject({
    model,
    schema: deletionOperationsSchema,
    messages: [
      {
        role: 'system' as const,
        content: `You are a data migration specialist. Determine what needs to be deleted or modified.

USER COMMAND: "${command}"

CHANGE ANALYSIS:
${JSON.stringify(changeAnalysis, null, 2)}

${granularChanges ? `
GRANULAR CHANGES:
${JSON.stringify(granularChanges, null, 2)}
` : ''}

EXISTING SYSTEM:
${JSON.stringify({
  models: (existingAgent.models || []).map(m => ({ id: m.id, name: m.name })),
  actions: (existingAgent.actions || []).map(a => ({ id: a.id, name: a.name })),
  schedules: (existingAgent.schedules || []).map(s => ({ id: s.id, name: s.name }))
}, null, 2)}

Determine what needs to be deleted:
1. Which models should be removed?
2. Which actions should be removed?
3. Which schedules should be removed?
4. Which fields should be removed from existing models?

Only suggest deletions that are explicitly requested or clearly implied by the user's intent.
Be conservative - when in doubt, preserve existing data.`
      }
    ],
    temperature: 0.2,
  });

  console.log('✅ Deletion operations generation complete');
  return result;
}

/**
 * Generate example records for newly created models
 */
export async function generateExampleRecords(
  models: AgentModel[],
  existingModels: AgentModel[] = [],
  businessContext: string = ''
): Promise<Record<string, any[]>> {
  // Identify newly created models (not in existing models)
  const newModels = models.filter(model => 
    !existingModels.some(existing => existing.name === model.name)
  );

  if (newModels.length === 0) {
    return {};
  }

  const modelNames = newModels.map(m => m.name).join(', ');
  console.log(`🎯 Generating example records for new models: ${modelNames}`);

  const prompt = `You are an expert data generator. Generate realistic example records for the following newly created models.

BUSINESS CONTEXT:
${businessContext}

NEW MODELS TO GENERATE EXAMPLES FOR:
${newModels.map(model => `
Model: ${model.name}
Description: ${model.description || 'No description provided'}
Fields: ${model.fields.map(f => `${f.name} (${f.type}${f.required ? ', required' : ''}${f.list ? ', list' : ''}${f.relationField ? ', relation' : ''})`).join(', ')}
Display Fields: ${model.displayFields.join(', ')}
`).join('\n')}

GENERATION RULES:
1. Generate 3-5 realistic example records for each model
2. Use realistic, diverse data that fits the business context
3. For relation fields, use realistic IDs (e.g., "user_123", "product_456")
4. For list fields, provide arrays with 1-3 items
5. For enum fields, use values that make sense for the context
6. Ensure required fields are always populated
7. Make display fields meaningful and unique
8. Use consistent ID formats (e.g., "modelname_001", "modelname_002")

RESPONSE FORMAT:
Return a JSON object where each key is the model name and the value is an array of record objects.

Example format:
{
  "User": [
    {
      "id": "user_001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ],
  "Product": [
    {
      "id": "product_001", 
      "name": "Widget A",
      "price": 29.99,
      "userId": "user_001"
    }
  ]
}

Generate realistic, contextually appropriate example data:`;

  try {
    const model = await getAgentBuilderModel();
    
    // Create a dynamic schema based on the new models
    const exampleRecordsSchema = z.object(
      newModels.reduce((acc, model) => {
        acc[model.name] = z.array(z.object({
          id: z.string(),
        }).passthrough());
        return acc;
      }, {} as Record<string, any>)
    );
    
    const result = await generateObject({
      model,
      prompt,
      schema: exampleRecordsSchema
    });

    console.log(`✅ Generated example records for ${Object.keys(result.object).length} models`);
    
    return result.object;
  } catch (error) {
    console.error('❌ Failed to generate example records:', error);
    return {};
  }
}