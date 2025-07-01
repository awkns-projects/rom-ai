import { generateObject, type CoreMessage } from 'ai';
import { getProvider } from '../../providers';
import { getBestModelFor } from '../../models';
import type { 
  AgentData, 
  PromptUnderstanding, 
  ChangeAnalysis, 
  AgentModel, 
  AgentAction, 
  AgentSchedule
} from './types';
import { 
  promptUnderstandingSchema,
  changeAnalysisSchema,
  enhancedActionAnalysisSchema,
  enhancedActionCodeSchema,
  unifiedDatabaseSchema,
  unifiedActionsSchema,
  unifiedSchedulesSchema,
  decisionSchema,
  granularChangeAnalysisSchema,
  deletionOperationsSchema
} from './schemas';
import { z } from 'zod';

// Define PseudoCodeStep interface locally to avoid import issues
interface PseudoCodeStep {
  id: string;
  description: string;
  type: string;
  inputFields: Array<{
    id: string;
    name: string;
    type: string;
    kind: 'scalar' | 'object' | 'enum';
    required: boolean;
    list: boolean;
    description: string;
    relationModel?: string;
  }>;
  outputFields: Array<{
    id: string;
    name: string;
    type: string;
    kind: 'scalar' | 'object' | 'enum';
    required: boolean;
    list: boolean;
    description: string;
    relationModel?: string;
  }>;
}

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
export async function getAgentBuilderModel() {
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
): Promise<{ models: AgentModel[] }> {
  console.log('🗄️ Starting database generation with real AI...');
  console.log('📋 Input analysis:', {
    hasExistingAgent: !!existingAgent,
    existingModels: existingAgent?.models?.length || 0,
    existingModelEnums: existingAgent?.models?.reduce((sum, model) => sum + (model.enums?.length || 0), 0) || 0,
    isIncremental: !!(existingAgent?.models?.length)
  });

  const existingModelsContext = existingAgent ? `
EXISTING MODELS (DO NOT REGENERATE THESE):
${(existingAgent.models || []).map((model: any) => `- ${model.name}: ${model.description || 'No description'}${model.enums?.length ? ` (${model.enums.length} enums)` : ''}`).join('\n')}
` : '';

  const expectedCounts = changeAnalysis ? `
Expected Results:
- Total Models: ${changeAnalysis.expectedResult.totalModels}
- Total Enums: ${changeAnalysis.expectedResult.totalEnums}
` : '';

  // Extract action requirements from prompt understanding to inform database design
  const actionRequirements = promptUnderstanding.workflowAutomationNeeds?.requiredActions || [];
  const oneTimeActions = promptUnderstanding.workflowAutomationNeeds?.oneTimeActions || [];
  const recurringSchedules = promptUnderstanding.workflowAutomationNeeds?.recurringSchedules || [];
  
  // Build action requirements analysis
  let actionAnalysis = '';
  if (actionRequirements.length > 0 || oneTimeActions.length > 0 || recurringSchedules.length > 0) {
    actionAnalysis = `
    
    ## ACTION REQUIREMENTS ANALYSIS
    
    ### Required Actions to Support:
    ${actionRequirements.map(action => `
    - **${action.name}** (${action.type}, Priority: ${action.priority})
      - Purpose: ${action.purpose}
      - Input Requirements: ${action.inputRequirements.join(', ')}
      - Output Expectations: ${action.outputExpectations.join(', ')}
    `).join('')}
    
    ### One-Time Actions to Support:
    ${oneTimeActions.map(action => `
    - **${action.name}** (${action.complexity} complexity, Priority: ${action.priority})
      - Purpose: ${action.purpose}
      - Role: ${action.role}
      - Steps: ${action.estimatedSteps.join(', ')}
      - Data Requirements: ${action.dataRequirements.join(', ')}
    `).join('')}
    
    ### Recurring Schedules to Support:
    ${recurringSchedules.map(schedule => `
    - **${schedule.name}** (${schedule.frequency}, ${schedule.complexity} complexity)
      - Purpose: ${schedule.purpose}
      - Role: ${schedule.role}
      - Steps: ${schedule.estimatedSteps.join(', ')}
      - Data Requirements: ${schedule.dataRequirements.join(', ')}
    `).join('')}
    
    ### Action-Aware Database Design Principles:
    - Design models to support all identified actions above
    - Include status fields for workflow tracking (e.g., status, stage, progress)
    - Add user permission fields where actions require role-based access
    - Include audit trail fields (createdAt, updatedAt, createdBy, updatedBy)
    - Design relationships that support the data flow between actions
    - Consider bulk operations and batch processing requirements
    - Include fields for action results and error handling
    `;
  }

  const model = await getAgentBuilderModel();

  // Determine if this is an incremental update
  const isIncrementalUpdate = existingAgent && (existingAgent.models || []).length > 0;
  
  // Build the system prompt with focus on incremental updates
  let systemPrompt = `You are a database architect. `;
  
  if (isIncrementalUpdate) {
    console.log('🔄 INCREMENTAL UPDATE detected - analyzing what new items are needed');
    
    systemPrompt += `This is an INCREMENTAL UPDATE to an existing system. Your job is to ANALYZE what new models and enums are NEEDED to fulfill the user's request, then create them.

INTELLIGENT INCREMENTAL UPDATE APPROACH:
1. ANALYZE the user's request to understand what they want to accomplish
2. COMPARE against existing models to identify gaps
3. DETERMINE what new models/enums are NEEDED (not just mentioned) to fulfill the request
4. CREATE the missing models/enums that are required
5. ENSURE new models integrate properly with existing ones

EXAMPLE SCENARIOS:
- If user says "I need to track animals" and no Animal model exists → CREATE Animal model
- If user says "add categories to products" and no Category model exists → CREATE Category model  
- If user says "I want to manage inventory" and no Inventory model exists → CREATE Inventory model
- If user says "track user preferences" and no Preference model exists → CREATE Preference model

CRITICAL ANALYSIS QUESTIONS:
- What does the user want to accomplish?
- What data models are REQUIRED to support this functionality?
- What models are missing from the existing system?
- What enums are needed to support the new functionality?

`;
  } else {
    console.log('🆕 NEW SYSTEM creation - generating complete database schema');
    
    systemPrompt += `Design a complete data model based on the business requirements AND the actions that will be built.

`;
  }

  systemPrompt += `BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding, null, 2)}

${existingModelsContext}

${expectedCounts}

${changeAnalysis ? `
CHANGE ANALYSIS:
${JSON.stringify(changeAnalysis, null, 2)}
` : ''}

${actionAnalysis}

CRITICAL ID FIELD NAMING RULES:
1. Every model MUST have "id" as the primary key field name (NOT productId, userId, etc.)
2. The idField property MUST always be set to "id"
3. Relationship fields (foreign keys) CAN use descriptive names like "userId", "productId", etc.
4. Primary key fields should have type "String", isId: true, unique: true, required: true

CRITICAL MODEL NAMING RULES:
1. Model names MUST ALWAYS be SINGULAR, never plural
2. Use "User" not "Users", "Product" not "Products", "Order" not "Orders"
3. Use "Category" not "Categories", "Company" not "Companies"
4. This follows proper database modeling conventions where each model represents a single entity
5. Examples: User, Product, Order, Category, Company, Task, Project, Invoice, Customer

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
    },
    {
      "name": "status",
      "type": "String",
      "isId": false,
      "kind": "scalar",
      "relationField": false,
      "required": true,
      "defaultValue": "pending"
    },
    {
      "name": "createdAt",
      "type": "DateTime",
      "isId": false,
      "kind": "scalar",
      "relationField": false,
      "required": true
    },
    {
      "name": "updatedAt",
      "type": "DateTime",
      "isId": false,
      "kind": "scalar",
      "relationField": false,
      "required": true
    }
  ]
}

CORRECT MODEL NAMES (SINGULAR):
✅ User, Product, Order, Category, Company, Task, Project, Invoice, Customer, Lead, Contact, Event, Message, File, Document, Report, Campaign, Team, Role, Permission, Setting, Notification, Comment, Review, Rating, Payment, Subscription, Plan, Feature, Bug, Issue, Ticket, Article, Post, Page, Menu, Widget, Tag, Label, Status, Priority, Type, Template, Layout, Theme, Style, Asset, Image, Video, Audio

❌ INCORRECT MODEL NAMES (PLURAL):
❌ Users, Products, Orders, Categories, Companies, Tasks, Projects, Invoices, Customers, Leads, Contacts, Events, Messages, Files, Documents, Reports, Campaigns, Teams, Roles, Permissions, Settings, Notifications, Comments, Reviews, Ratings, Payments, Subscriptions, Plans, Features, Bugs, Issues, Tickets, Articles, Posts, Pages, Menus, Widgets, Tags, Labels, Statuses, Priorities, Types, Templates, Layouts, Themes, Styles, Assets, Images, Videos, Audios

ACTION-AWARE DATABASE DESIGN PRINCIPLES:
1. Include status/state fields for records that actions will modify
2. Include timestamp fields (createdAt, updatedAt) for audit trails
3. Include user reference fields (createdBy, updatedBy) for tracking
4. Include metadata fields that actions might need to store
5. Consider search and filter fields that actions might use
6. Include enum fields for predefined values that actions will set
7. Think about bulk operations - fields that support batch processing
8. Consider approval workflows - fields for approval status, approver, etc.
9. Think about soft deletes - deletedAt, isDeleted fields if needed
10. Consider priority, order, or sequence fields for sorting

${isIncrementalUpdate ? `
FOR INCREMENTAL UPDATES:
- ONLY create models that are NEW and explicitly requested
- Do NOT recreate existing models
- Focus on the delta/difference in the user's request
- Consider relationships to existing models
- Return minimal set of new models/enums only

` : `
Design models that:
1. Support all the required business features
2. Support ALL the planned actions and their data needs
3. Have proper relationships and constraints
4. Include appropriate enums for predefined values
5. Follow database best practices
6. Are optimized for the intended use cases
7. ALWAYS use "id" as the primary key field name
8. Include fields that actions will need for filtering, sorting, searching
9. Include workflow state management fields
10. Include audit trail and permission fields

`}Each model should have:
- A clear purpose and description
- An appropriate emoji representation
- A SINGULAR NAME (User, not Users; Product, not Products; Order, not Orders)
- All necessary fields with correct types
- Proper relationships to other models
- Display fields for UI purposes
- PRIMARY KEY FIELD ALWAYS NAMED "id"
- Fields that support the planned actions
- Workflow and state management fields
- Audit and permission fields where appropriate

Each enum should have:
- A clear purpose
- All necessary values used by models AND actions
- Proper field definitions
- Values that actions will need to set or filter by`;

  const result = await generateObject({
    model,
    schema: unifiedDatabaseSchema,
    messages: [
      {
        role: 'system' as const,
        content: systemPrompt
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

  const fixedModels = (result.object.models || []).map((model: any, index: number) => {
    // Check if this model already exists in the existing agent
    const existingModel = existingAgent?.models?.find(m => m.name === model.name);
    const modelId = existingModel?.id || model.id || `model_${model.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`;
    
    return {
      ...model,
      id: modelId,
      idField: model.idField || 'id',
      displayFields: model.displayFields && model.displayFields.length > 0 ? model.displayFields : selectDisplayFields(model.fields || []),
      fields: (model.fields || []).map((field: any, fieldIndex: number) => {
        // Check if this field already exists in the existing model
        const existingField = existingModel?.fields?.find(f => f.name === field.name);
        const fieldId = existingField?.id || field.id || `field_${field.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${fieldIndex}`;
        
        return {
          ...field,
          id: fieldId,
          type: field.type || 'String',
          isId: field.isId || false,
          unique: field.unique || false,
          required: field.required || false,
          list: field.list || false,
          kind: field.kind || 'scalar',
          relationField: field.relationField || false,
          title: field.title || field.name,
          order: field.order || 0,
          sort: field.sort || false,
          defaultValue: field.defaultValue || undefined
        };
      }),
      enums: (model.enums || []).map((enumItem: any, enumIndex: number) => {
        // Check if this enum already exists in the existing model
        const existingEnum = existingModel?.enums?.find(e => e.name === enumItem.name);
        const enumId = existingEnum?.id || enumItem.id || `enum_${enumItem.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${enumIndex}`;
        
        return {
          ...enumItem,
          id: enumId,
          fields: (enumItem.fields || []).map((field: any, enumFieldIndex: number) => {
            // Check if this enum field already exists in the existing enum
            const existingEnumField = existingEnum?.fields?.find(f => f.name === field.name);
            const enumFieldId = existingEnumField?.id || field.id || `enum_field_${field.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${enumFieldIndex}`;
            
            return {
              ...field,
              id: enumFieldId,
              type: field.type || 'String',
              defaultValue: field.defaultValue || undefined
            };
          })
        };
      }),
      forms: model.forms || [],
      records: model.records || []
    };
  });

  // If this is an incremental update, we need to merge with existing models
  if (isIncrementalUpdate) {
    console.log(`🔄 Incremental update: Generated ${fixedModels.length} new models`);
    const existingModelEnums = (existingAgent.models || []).reduce((sum: number, model: any) => sum + (model.enums?.length || 0), 0);
    const newModelEnums = fixedModels.reduce((sum: number, model: any) => sum + (model.enums?.length || 0), 0);
    console.log(`📊 Existing agent has ${(existingAgent.models || []).length} models with ${existingModelEnums} total enums`);
    
    // Simple merge approach: concatenate existing and new models
    const mergedModels = [...(existingAgent.models || []), ...fixedModels];
    const finalModelEnums = mergedModels.reduce((sum: number, model: any) => sum + (model.enums?.length || 0), 0);
    
    console.log(`📊 Final result: ${mergedModels.length} total models with ${finalModelEnums} total enums`);
    
    return {
      models: mergedModels
    };
  }

  const totalEnums = fixedModels.reduce((sum, model) => sum + (model.enums?.length || 0), 0);
  console.log(`📊 Generated ${fixedModels.length} models with ${totalEnums} total enums`);

  return {
    models: fixedModels
  };
}

/**
 * Step 4: Generate actions
 */
export async function generateActions(
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[] },
  existingAgent?: AgentData,
  changeAnalysis?: ChangeAnalysis,
  agentOverview?: any,
  conversationContext?: string,
  command?: string
): Promise<{ actions: AgentAction[] }> {
  console.log('⚡ Starting actions generation with real AI...');
  
  const businessRulesContext = promptUnderstanding.featureImagination.businessRules || 'Standard business rules apply';
  const userExperienceContext = promptUnderstanding.featureImagination.userExperience || 'General users and administrators';
  
  const existingActionsContext = existingAgent ? `
EXISTING ACTIONS (DO NOT REGENERATE THESE):
${(existingAgent.actions || []).map((action: any) => `- ${action.name}: ${action.description || 'No description'}`).join('\n')}
` : '';

  // Determine if this is an incremental update
  const isIncrementalUpdate = existingAgent && (existingAgent.actions || []).length > 0;
  
  // For incremental updates, focus on new actions only
  const expectedActionCount = isIncrementalUpdate 
    ? Math.max(1, Math.min(3, promptUnderstanding.workflowAutomationNeeds.requiredActions.length || 1))
    : Math.max(1, Math.min(5, promptUnderstanding.workflowAutomationNeeds.requiredActions.length || 2));
  
  const model = await getAgentBuilderModel();

  // Build the system prompt with focus on incremental updates
  let systemPrompt = `You are a workflow automation expert. `;
  
  if (isIncrementalUpdate) {
    systemPrompt += `This is an INCREMENTAL UPDATE to an existing system. Your job is to ANALYZE what new actions are NEEDED to fulfill the user's request, then create them.

INTELLIGENT INCREMENTAL UPDATE APPROACH:
1. ANALYZE the user's request to understand what functionality they want
2. COMPARE against existing actions to identify gaps  
3. DETERMINE what new actions are NEEDED (not just mentioned) to fulfill the request
4. CREATE the missing actions that are required
5. ENSURE new actions work with existing models and actions

EXAMPLE SCENARIOS:
- If user says "I need to manage animals" and no animal actions exist → CREATE animal management actions
- If user says "add reporting features" and no report actions exist → CREATE reporting actions
- If user says "I want user notifications" and no notification actions exist → CREATE notification actions
- If user says "track inventory" and no inventory actions exist → CREATE inventory actions

CRITICAL ANALYSIS QUESTIONS:
- What functionality does the user want to accomplish?
- What actions are REQUIRED to support this functionality?
- What actions are missing from the existing system?
- What workflows need to be supported?

`;
  } else {
    systemPrompt += `Design actions that implement business processes.

`;
  }

  systemPrompt += `BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding.workflowAutomationNeeds, null, 2)}

AVAILABLE DATA MODELS:
${(databaseResult.models || []).map(model => `- ${model.name}: ${(model.fields || []).map(f => f.name).join(', ')}`).join('\n')}

AVAILABLE ENUMS:
${databaseResult.models.flatMap(model => model.enums || []).map(enumItem => `- ${enumItem.name}: ${(enumItem.fields || []).map(f => f.name).join(' | ')}`).join('\n') || 'None'}

${existingActionsContext}

CRITICAL ENVVARS REQUIREMENTS:
- ALL envVars fields MUST be arrays, never null or undefined
- If no environment variables are needed, provide an empty array: []
- Each envVar object must have: name, description, required (boolean), sensitive (boolean)

EXAMPLE envVars structure:
{
  "envVars": [
    {
      "name": "API_KEY",
      "description": "API key for external service",
      "required": true,
      "sensitive": true
    }
  ]
}

OR if no environment variables needed:
{
  "envVars": []
}

NEVER use null for envVars - always use an array (empty array if no env vars needed).

Business Rules: ${Array.isArray(businessRulesContext) ? businessRulesContext.join(', ') : businessRulesContext}

User Experience: ${Array.isArray(userExperienceContext) ? userExperienceContext.join(', ') : userExperienceContext}

GENERATION REQUIREMENTS:
${isIncrementalUpdate ? `
1. Create ONLY ${expectedActionCount} NEW actions that are specifically requested by the user
2. Do NOT recreate existing actions
3. Focus on the delta/difference in the user's request
4. Each new action should solve a specific new business need
5. Use appropriate data models from the available models (including new ones)
6. Consider relationships to existing actions without duplicating them
` : `
1. Create ${expectedActionCount} high-quality actions that implement the business requirements
2. Each action should have a clear business purpose and practical implementation
3. Use appropriate data models from the available models
4. Include proper error handling and validation
5. Set appropriate user roles (admin/member) based on action sensitivity
`}6. ALL envVars fields must be arrays (use empty array [] if no env vars needed)
7. Provide meaningful names, descriptions, and emojis for each action
8. Code should be production-ready with proper error handling

ACTION STRUCTURE REQUIREMENTS:
- id: unique identifier
- name: clear, descriptive name
- emoji: single relevant emoji
- description: detailed business purpose
- type: 'Create' or 'Update'
- role: 'admin' or 'member'
- dataSource.customFunction.envVars: MUST be array (empty [] if none needed)
- execute.code.envVars: MUST be array (empty [] if none needed)

Generate exactly ${expectedActionCount} actions that solve real business problems.`;

  // Generate with manual post-processing to fix envVars
  let rawResult;
  try {
    rawResult = await generateObject({
      model,
      schema: unifiedActionsSchema,
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt
        }
      ],
      temperature: 0.1
    });
  } catch (error: any) {
    // If validation fails due to null envVars, try to fix the raw data and re-validate
    if (error?.cause?.issues?.some((issue: any) => 
      issue.path?.includes('envVars') && issue.expected === 'array' && issue.received === 'null'
    )) {
      console.log('🔧 Detected null envVars, attempting to fix...');
      
      // Get the raw value before validation failed
      const rawData = error.value;
      if (rawData?.actions && Array.isArray(rawData.actions)) {
        // Fix envVars fields
        rawData.actions = rawData.actions.map((action: any) => {
          const fixedAction = { ...action };
          
          // Fix dataSource.customFunction.envVars
          if (fixedAction.dataSource?.customFunction) {
            if (fixedAction.dataSource.customFunction.envVars === null || 
                fixedAction.dataSource.customFunction.envVars === undefined) {
              fixedAction.dataSource.customFunction.envVars = [];
            }
          }
          
          // Fix execute.code.envVars
          if (fixedAction.execute?.code) {
            if (fixedAction.execute.code.envVars === null || 
                fixedAction.execute.code.envVars === undefined) {
              fixedAction.execute.code.envVars = [];
            }
          }
          
          return fixedAction;
        });
        
        // Try to validate the fixed data with the schema
        try {
          const validatedData = unifiedActionsSchema.parse(rawData);
          rawResult = { object: validatedData };
          console.log('✅ Successfully fixed envVars validation');
        } catch (revalidationError) {
          console.error('❌ Failed to fix envVars, throwing original error');
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  
  const result = rawResult;

  console.log('✅ Actions generation complete');
  
  // Fix actions to ensure they have all required fields and proper envVars arrays
  const fixedActions = (result.object.actions || []).map((action: any, index: number) => {
    // Check if this action already exists in the existing agent
    const existingAction = existingAgent?.actions?.find(a => a.name === action.name);
    const actionId = existingAction?.id || action.id || `action_${action.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`;
    
    return {
      ...action,
      id: actionId,
      emoji: action.emoji || '⚡',
      type: action.type || 'Create',
      role: action.role || 'member',
      dataSource: {
        type: action.dataSource?.type || 'database',
        customFunction: action.dataSource?.customFunction ? {
          code: action.dataSource.customFunction.code,
          // Ensure envVars is always an array
          envVars: Array.isArray(action.dataSource.customFunction.envVars) ? action.dataSource.customFunction.envVars : []
        } : undefined,
        database: action.dataSource?.type === 'custom' 
          ? (action.dataSource?.database || undefined)
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
        code: {
          script: action.execute?.code?.script || `
// Action: ${action.name}
// Parameters: database, input, member
try {
  // Validate input
  if (!input) throw new Error('Input is required');
  
  // Check permissions
  if (member.role !== '${action.role || 'member'}' && '${action.role || 'member'}' === 'admin') {
    throw new Error('Admin access required');
  }
  
  // Execute action logic
  const result = {
    message: '${action.name} executed successfully',
    data: input
  };
  
  return {
    output: result,
    data: [{
      modelId: '${(databaseResult.models || [])[0]?.name || 'DefaultModel'}',
      createdRecords: [],
      updatedRecords: [],
      deletedRecords: []
    }]
  };
} catch (error) {
  throw new Error('Action failed: ' + error.message);
}`,
          envVars: Array.isArray(action.execute?.code?.envVars) ? action.execute.code.envVars : []
        }
      },
      results: {
        actionType: action.results?.actionType || action.type || 'Create',
        model: action.results?.model || ((databaseResult.models || [])[0]?.name || 'DefaultModel'),
        identifierIds: action.results?.identifierIds || undefined,
        fields: action.results?.fields || {},
        fieldsToUpdate: action.results?.fieldsToUpdate || undefined
      }
    };
  });

  // If this is an incremental update, we need to merge with existing actions
  if (isIncrementalUpdate) {
    console.log(`🔄 Incremental update: Generated ${fixedActions.length} new actions`);
    console.log(`📊 Existing agent has ${(existingAgent.actions || []).length} actions`);
    
    // Simple merge approach: concatenate existing and new actions
    const mergedActions = [...(existingAgent.actions || []), ...fixedActions];
    
    console.log(`📊 Final result: ${mergedActions.length} total actions`);
    
    return {
      actions: mergedActions
    };
  }

  return {
    actions: fixedActions
  };
}

/**
 * ENHANCED ACTION GENERATION INTEGRATION
 * Bridge function that can use enhanced generation when detailed analysis is needed
 */
export async function generateActionsWithEnhancedAnalysis(
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[] },
  useEnhancedGeneration = false,
  existingAgent?: AgentData,
  businessContext?: string
): Promise<{ 
  actions: AgentAction[], 
  enhancedAnalysis?: Array<{
    analysis: z.infer<typeof enhancedActionAnalysisSchema>,
    codeGeneration: z.infer<typeof enhancedActionCodeSchema>
  }>
}> {
  if (!useEnhancedGeneration) {
    // Use standard generation
    return await generateActions(promptUnderstanding, databaseResult, existingAgent);
  }

  // Use enhanced generation for detailed actions
  console.log('🚀 Using enhanced action generation with comprehensive analysis...');
  
  const actionRequests = promptUnderstanding.workflowAutomationNeeds.requiredActions.map(
    action => `${action.name}: ${action.purpose}`
  );

  const enhancedResults = await generateBatchEnhancedActions(
    actionRequests,
    promptUnderstanding,
    databaseResult,
    existingAgent,
    businessContext
  );

  return {
    actions: enhancedResults.map((r: any) => r.actionConfig),
    enhancedAnalysis: enhancedResults.map((r: any) => ({
      analysis: r.analysis,
      codeGeneration: r.codeGeneration
    }))
  };
}

/**
 * Step 5: Generate schedules
 */
export async function generateSchedules(
  promptUnderstanding: PromptUnderstanding,
  databaseResult: any, // Changed parameter name to match actual usage
  actions: any,
  existingAgent?: AgentData,
  changeAnalysis?: ChangeAnalysis
): Promise<{ schedules: AgentSchedule[] }> {
  console.log('🕒 Starting schedules generation with real AI...');
  
  // Determine if this is an incremental update
  const isIncrementalUpdate = existingAgent && (existingAgent.schedules || []).length > 0;
  
  const model = await getAgentBuilderModel();

  // Build the system prompt with focus on incremental updates
  let systemPrompt = `You are a scheduling automation expert. `;
  
  if (isIncrementalUpdate) {
    systemPrompt += `This is an INCREMENTAL UPDATE to an existing system. Your job is to ONLY create NEW schedules that are specifically requested by the user, NOT to regenerate existing ones.

CRITICAL INCREMENTAL UPDATE RULES:
1. ONLY generate NEW schedules that are explicitly mentioned in the user request
2. DO NOT regenerate or modify existing schedules unless specifically asked
3. Focus on what's NEW or DIFFERENT in the user's request
4. If user asks to "add daily animal feeding schedule", create ONLY new animal-related schedules
5. Return ONLY the new schedules, not the existing ones
6. Create maximum 2 new schedules for incremental updates

EXISTING SCHEDULES (DO NOT REGENERATE THESE):
${(existingAgent.schedules || []).map((schedule: any) => `- ${schedule.name}: ${schedule.description || 'No description'}`).join('\n')}

`;
  } else {
    systemPrompt += `Design schedules that automate business processes.

`;
  }

  systemPrompt += `BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding.workflowAutomationNeeds, null, 2)}

AVAILABLE ACTIONS:
${Array.isArray(actions) ? actions.map((action: any) => `- ${action.name}: ${action.description}`).join('\n') : 'No actions available'}

AVAILABLE DATA MODELS:
${(databaseResult?.models || []).map((model: any) => `- ${model.name}`).join('\n') || 'No models available'}

${isIncrementalUpdate ? `
FOR INCREMENTAL UPDATES:
- ONLY create schedules that are NEW and explicitly requested
- Do NOT recreate existing schedules
- Focus on the delta/difference in the user's request
- Consider relationships to existing schedules without duplicating them
- Return minimal set of new schedules only

` : `
Design schedules that:
1. Automate recurring business processes
2. Trigger at appropriate intervals
3. Use available actions effectively
4. Provide business value through automation

`}Each schedule should:
- Have a clear purpose and timing
- Use appropriate intervals (cron patterns)
- Execute meaningful actions
- Have proper role-based access`;

  const result = await generateObject({
    model,
    schema: unifiedSchedulesSchema,
    messages: [
      {
        role: 'system' as const,
        content: systemPrompt
      }
    ],
    temperature: 0.3,
  });

  console.log('✅ Schedules generation complete');
  
  // Fix schedules to ensure they have all required fields
  const fixedSchedules = (result.object.schedules || []).map((schedule: any, index: number) => {
    // Check if this schedule already exists in the existing agent
    const existingSchedule = existingAgent?.schedules?.find(s => s.name === schedule.name);
    const scheduleId = existingSchedule?.id || schedule.id || `schedule_${schedule.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`;
    
    return {
      ...schedule,
      id: scheduleId,
      emoji: schedule.emoji || '🕒',
      type: schedule.type || 'Create',
      role: schedule.role || 'admin',
      interval: {
        pattern: schedule.interval?.pattern || '0 0 * * *',
        timezone: schedule.interval?.timezone || 'UTC',
        active: schedule.interval?.active !== undefined ? schedule.interval.active : false
      },
      dataSource: {
        type: schedule.dataSource?.type || 'database',
        customFunction: schedule.dataSource?.customFunction ? {
          code: schedule.dataSource.customFunction.code,
          envVars: Array.isArray(schedule.dataSource.customFunction.envVars) ? schedule.dataSource.customFunction.envVars : []
        } : undefined,
        database: schedule.dataSource?.type === 'custom' 
          ? (schedule.dataSource?.database || null)
          : (schedule.dataSource?.database || {
              models: (databaseResult?.models || []).slice(0, 1).map((model: any) => ({
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
        code: {
          script: schedule.execute?.code?.script || `
// Schedule: ${schedule.name}
// Parameters: database, envs
try {
  // Validate input
  if (!input) throw new Error('Input is required');
  
  // Check permissions
  if (member.role !== '${schedule.role || 'admin'}' && '${schedule.role || 'admin'}' === 'admin') {
    throw new Error('Admin access required');
  }
  
  // Execute schedule logic
  const result = {
    message: '${schedule.name} executed successfully',
    data: input
  };
  
  return {
    output: result,
    data: [{
      modelId: '${(databaseResult?.models || [])[0]?.name || 'DefaultModel'}',
      createdRecords: [],
      updatedRecords: [],
      deletedRecords: []
    }]
  };
} catch (error) {
  throw new Error('Schedule failed: ' + error.message);
}`,
          envVars: Array.isArray(schedule.execute?.code?.envVars) ? schedule.execute.code.envVars : []
        }
      },
      results: {
        actionType: schedule.results?.actionType || schedule.type || 'Create',
        model: schedule.results?.model || ((databaseResult?.models || [])[0]?.name || 'DefaultModel'),
        identifierIds: schedule.results?.identifierIds || undefined,
        fields: schedule.results?.fields || {},
        fieldsToUpdate: schedule.results?.fieldsToUpdate || undefined
      }
    };
  });

  // If this is an incremental update, we need to merge with existing schedules
  if (isIncrementalUpdate) {
    console.log(`🔄 Incremental update: Generated ${fixedSchedules.length} new schedules`);
    console.log(`📊 Existing agent has ${(existingAgent.schedules || []).length} schedules`);
    
    // Simple merge approach: concatenate existing and new schedules
    const mergedSchedules = [...(existingAgent.schedules || []), ...fixedSchedules];
    
    console.log(`📊 Final result: ${mergedSchedules.length} total schedules`);
    
    return {
      schedules: mergedSchedules
    };
  }

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
  currentOperation = 'create'
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
  models: (existingAgent.models || []).map(m => ({ id: m.id, name: m.name })),
  actions: (existingAgent.actions || []).map(a => ({ id: a.id, name: a.name })),
  schedules: (existingAgent.schedules || []).map(s => ({ id: s.id, name: s.name }))
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
  models: (existingAgent.models || []).map(m => ({ id: m.id, name: m.name })),
  actions: (existingAgent.actions || []).map(a => ({ id: a.id, name: a.name })),
  schedules: (existingAgent.schedules || []).map(s => ({ id: s.id, name: s.name }))
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
${existingAgent ? JSON.stringify({
  models: (existingAgent.models || []).map(m => ({ id: m.id, name: m.name })),
  actions: (existingAgent.actions || []).map(a => ({ id: a.id, name: a.name })),
  schedules: (existingAgent.schedules || []).map(s => ({ id: s.id, name: s.name }))
}, null, 2) : 'None'}

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
  businessContext = ''
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

/**
 * ENHANCED ACTION GENERATION - Step 1: IMAGINE
 * Define the use case conceptually with title, description, user role, and specifications
 */
export async function generateEnhancedActionImagination(
  actionRequest: string,
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[] },
  existingAgent?: AgentData,
  businessContext?: string
): Promise<{
  title: string;
  description: string;
  userRole: 'member' | 'admin';
  codeSpecification: {
    backendRequirements: string;
    uiRequirements: {
      runCodeView: string;
      showResultsView: string;
    };
  };
}> {
  console.log('🎯 Step 1: IMAGINE - Defining use case conceptually...');
  
  const model = await getAgentBuilderModel();
  
  const availableModels = databaseResult.models.map(m => ({
    name: m.name,
    fields: m.fields.map(f => ({ name: f.name, type: f.type, relationField: f.relationField })),
    description: m.description
  }));

  const result = await generateObject({
    model,
    schema: z.object({
      title: z.string().describe('Clear, descriptive action title'),
      description: z.string().describe('Detailed description of what this action accomplishes'),
      userRole: z.enum(['member', 'admin']).describe('Who can execute this action'),
      codeSpecification: z.object({
        backendRequirements: z.string().describe('What the backend code needs to accomplish'),
        uiRequirements: z.object({
          runCodeView: z.string().describe('UI requirements for collecting user inputs and running the action'),
          showResultsView: z.string().describe('UI requirements for displaying action results')
        })
      })
    }),
    messages: [
      {
        role: 'system' as const,
        content: `You are an expert product manager defining action requirements.

ACTION REQUEST: "${actionRequest}"

BUSINESS CONTEXT: ${businessContext || 'General business application'}

AVAILABLE DATA MODELS:
${availableModels.map(m => `${m.name}: ${m.fields.map(f => `${f.name}(${f.type})`).join(', ')}`).join('\n')}

EXISTING ACTIONS: ${existingAgent?.actions?.map(a => a.name).join(', ') || 'None'}

Define the action conceptually:

1.1. TITLE & DESCRIPTION: What this action does from a user perspective
1.2. USER ROLE: Whether this requires admin privileges or members can use it  
1.3. CODE SPECIFICATION:
   - Backend code requirements: What business logic needs to be implemented
   - UI views requirements: What interfaces are needed for input collection and result display

Focus on the business value and user experience, not technical implementation details.`
      }
    ],
    temperature: 0.2
  });

  console.log('✅ Step 1 complete: Action imagination defined');
  
  // Ensure all required properties are present
  const imagination = result.object;
  return {
    title: imagination.title || 'Action Title',
    description: imagination.description || 'Action description',
    userRole: imagination.userRole || 'member',
    codeSpecification: {
      backendRequirements: imagination.codeSpecification?.backendRequirements || 'Backend requirements',
      uiRequirements: {
        runCodeView: imagination.codeSpecification?.uiRequirements?.runCodeView || 'UI for running code',
        showResultsView: imagination.codeSpecification?.uiRequirements?.showResultsView || 'UI for showing results'
      }
    }
  };
}

/**
 * ENHANCED ACTION GENERATION - Step 2: GENERATE ANALYSIS  
 * Plan the operation logically before writing code following the instruction guidelines
 */
export async function generateEnhancedActionAnalysis(
  actionRequest: string,
  imagination: any,
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[] },
  existingAgent?: AgentData,
  businessContext?: string
): Promise<z.infer<typeof enhancedActionAnalysisSchema>> {
  const model = await getAgentBuilderModel();
  
  // Get available models with enhanced field information
  const availableModels = databaseResult.models.map(model => ({
    name: model.name,
    fields: model.fields.map(field => ({
      name: field.name,
      type: field.type,
      required: field.required || false,
      list: field.list || false,
      unique: field.unique || false,
      defaultValue: field.defaultValue
    }))
  }));

  // Get available enums from all models
  const availableEnums = databaseResult.models.flatMap(model => model.enums || []).map(enumDef => ({
    name: enumDef.name,
    values: enumDef.fields.map(f => f.name)
  }));

  const result = await generateObject({
    model,
    schema: enhancedActionAnalysisSchema,
    messages: [ {
      role: 'user',
      content: `You are an expert AI system architect tasked with creating comprehensive action analysis for enterprise automation systems.

CRITICAL REQUIREMENTS - ALL FIELDS MUST BE PROVIDED:

**IMAGINATION SECTION:**
- title: "${imagination.title}"
- description: "${imagination.description}" 
- targetRole: "${imagination.targetRole}"
- businessValue: "${imagination.businessValue}"
- userScenarios: ${JSON.stringify(imagination.userScenarios)}

**ANALYSIS SECTION - MUST INCLUDE ALL REQUIRED FIELDS:**

1. **inputParameters.structure.nestedStructure.schema** - REQUIRED OBJECT:
   Must be a valid JSON Schema object with these exact properties:
   {
     "type": "object",
     "properties": {
       "leadId": { "type": "string", "description": "Lead identifier" },
       "emailTemplateId": { "type": "string", "description": "Template identifier" },
       "followUpDateTime": { "type": "string", "format": "date-time", "description": "When to send email" }
     },
     "required": ["leadId", "emailTemplateId", "followUpDateTime"]
   }

2. **inputParameters.structure.exampleInputs[].input** - REQUIRED OBJECT:
   Each example must have an "input" property that is an actual object:
   {
     "leadId": "lead_123",
     "emailTemplateId": "template_456", 
     "followUpDateTime": "2024-01-15T10:00:00Z"
   }

3. **inputParameters.standardParameters** - REQUIRED OBJECT:
   Must include input, member, and database objects with proper structure.

4. **outputParameters.successResponse.format** - REQUIRED OBJECT:
   Must be a JSON Schema object defining the success response structure.

5. **outputParameters.errorResponse.format** - REQUIRED OBJECT:
   Must be a JSON Schema object defining the error response structure.

6. **testScenarios[].inputData** - REQUIRED OBJECT:
   Each test scenario must have inputData as an actual object, not a string.

7. **testScenarios[].expectedOutput** - REQUIRED OBJECT:
   Each test scenario must have expectedOutput as an actual object, not a string.

**ACTION REQUEST:** ${actionRequest}

**AVAILABLE MODELS:** ${JSON.stringify(availableModels, null, 2)}

**AVAILABLE ENUMS:** ${JSON.stringify(availableEnums, null, 2)}

**BUSINESS CONTEXT:** ${businessContext || 'General business automation'}

Generate a comprehensive analysis following this EXACT structure:

{
  "imagination": {
    "title": "${imagination.title}",
    "description": "${imagination.description}",
    "targetRole": "${imagination.targetRole}",
    "businessValue": "${imagination.businessValue}",
    "userScenarios": ${JSON.stringify(imagination.userScenarios)}
  },
  "analysis": {
    "databaseOperations": {
      "tablesToUpdate": [
        {
          "modelName": "Lead",
          "operation": "update", 
          "fields": ["status", "lastContactDate"],
          "reason": "Update lead status after follow-up"
        }
      ],
      "tablesToRead": [
        {
          "modelName": "Lead",
          "fields": ["id", "name", "email", "status"],
          "purpose": "Get lead details for follow-up"
        },
        {
          "modelName": "EmailTemplate", 
          "fields": ["id", "name", "subject", "body"],
          "purpose": "Get template for email content"
        }
      ],
      "relationships": []
    },
    "externalAPIs": [],
    "inputParameters": {
      "structure": {
        "description": "Input structure for ${actionRequest}",
        "isFlexible": false,
        "flatFields": [
          {
            "name": "leadId",
            "type": "string",
            "description": "ID of the lead to follow up with",
            "source": "user_input",
            "validation": "required",
            "isDatabaseId": true,
            "databaseIdModel": "Lead",
            "required": true
          },
          {
            "name": "emailTemplateId", 
            "type": "string",
            "description": "ID of email template to use",
            "source": "user_input",
            "validation": "required",
            "isDatabaseId": true,
            "databaseIdModel": "EmailTemplate",
            "required": true
          },
          {
            "name": "followUpDateTime",
            "type": "string",
            "description": "When to send the follow-up email",
            "source": "user_input", 
            "validation": "required, ISO 8601 format",
            "required": true
          }
        ],
        "nestedStructure": {
          "schema": {
            "type": "object",
            "properties": {
              "leadId": {
                "type": "string",
                "description": "ID of the lead to follow up with"
              },
              "emailTemplateId": {
                "type": "string", 
                "description": "ID of email template to use"
              },
              "followUpDateTime": {
                "type": "string",
                "format": "date-time",
                "description": "When to send the follow-up email"
              }
            },
            "required": ["leadId", "emailTemplateId", "followUpDateTime"]
          },
          "databaseIdPaths": [
            {
              "path": "leadId",
              "modelName": "Lead",
              "isArray": false,
              "required": true,
              "description": "Lead identifier"
            },
            {
              "path": "emailTemplateId", 
              "modelName": "EmailTemplate",
              "isArray": false,
              "required": true,
              "description": "Template identifier"
            }
          ]
        },
        "validationRules": [
          "leadId must be a valid Lead ID",
          "emailTemplateId must be a valid EmailTemplate ID",
          "followUpDateTime must be in ISO 8601 format"
        ],
        "processingNotes": [
          "Validate lead exists before scheduling",
          "Validate template exists and is active"
        ],
        "exampleInputs": [
          {
            "name": "Basic Follow-up",
            "description": "Schedule follow-up email for a lead",
            "input": {
              "leadId": "lead_123",
              "emailTemplateId": "template_456",
              "followUpDateTime": "2024-01-15T10:00:00Z"
            },
            "databaseIdsUsed": ["leadId", "emailTemplateId"]
          }
        ]
      },
      "standardParameters": {
        "input": {
          "description": "Input parameters for the action",
          "structure": {
            "description": "Input structure for ${actionRequest}",
            "isFlexible": false,
            "flatFields": [
              {
                "name": "leadId",
                "type": "string", 
                "description": "ID of the lead to follow up with",
                "source": "user_input",
                "validation": "required",
                "isDatabaseId": true,
                "databaseIdModel": "Lead",
                "required": true
              },
              {
                "name": "emailTemplateId",
                "type": "string",
                "description": "ID of email template to use", 
                "source": "user_input",
                "validation": "required",
                "isDatabaseId": true,
                "databaseIdModel": "EmailTemplate",
                "required": true
              },
              {
                "name": "followUpDateTime",
                "type": "string",
                "description": "When to send the follow-up email",
                "source": "user_input",
                "validation": "required, ISO 8601 format",
                "required": true
              }
            ],
            "nestedStructure": {
              "schema": {
                "type": "object",
                "properties": {
                  "leadId": {
                    "type": "string",
                    "description": "ID of the lead to follow up with"
                  },
                  "emailTemplateId": {
                    "type": "string",
                    "description": "ID of email template to use"
                  },
                  "followUpDateTime": {
                    "type": "string",
                    "format": "date-time", 
                    "description": "When to send the follow-up email"
                  }
                },
                "required": ["leadId", "emailTemplateId", "followUpDateTime"]
              },
              "databaseIdPaths": [
                {
                  "path": "leadId",
                  "modelName": "Lead",
                  "isArray": false,
                  "required": true,
                  "description": "Lead identifier"
                },
                {
                  "path": "emailTemplateId",
                  "modelName": "EmailTemplate", 
                  "isArray": false,
                  "required": true,
                  "description": "Template identifier"
                }
              ]
            },
            "validationRules": [
              "leadId must be a valid Lead ID",
              "emailTemplateId must be a valid EmailTemplate ID",
              "followUpDateTime must be in ISO 8601 format"
            ],
            "processingNotes": [
              "Validate lead exists before scheduling",
              "Validate template exists and is active"
            ],
            "exampleInputs": [
              {
                "name": "Basic Follow-up",
                "description": "Schedule follow-up email for a lead",
                "input": {
                  "leadId": "lead_123",
                  "emailTemplateId": "template_456",
                  "followUpDateTime": "2024-01-15T10:00:00Z"
                },
                "databaseIdsUsed": ["leadId", "emailTemplateId"]
              }
            ]
          },
          "databaseIdFields": ["leadId", "emailTemplateId"]
        },
        "member": {
          "description": "The member executing the action",
          "requiredProperties": ["id", "role", "email"]
        },
        "database": {
          "description": "Database access for reading and updating records",
          "modelsUsed": ["Lead", "EmailTemplate"],
          "accessPattern": "database[\\"ModelName\\"]"
        }
      }
    },
    "outputParameters": {
      "successResponse": {
        "description": "Confirmation of scheduled follow-up",
        "format": {
          "type": "object",
          "properties": {
            "message": {
              "type": "string",
              "description": "Success confirmation message"
            },
            "scheduledId": {
              "type": "string", 
              "description": "ID of the scheduled follow-up"
            },
            "scheduledFor": {
              "type": "string",
              "format": "date-time",
              "description": "When the email will be sent"
            }
          },
          "required": ["message", "scheduledId", "scheduledFor"]
        }
      },
      "errorResponse": {
        "description": "Error information when scheduling fails",
        "format": {
          "type": "object",
          "properties": {
            "error": {
              "type": "string",
              "description": "Error message"
            },
            "code": {
              "type": "string",
              "description": "Error code"
            },
            "details": {
              "type": "object",
              "description": "Additional error details"
            }
          },
          "required": ["error", "code"]
        }
      },
      "sideEffects": [
        "Follow-up email is scheduled in the system",
        "Lead status may be updated",
        "Activity log is created"
      ]
    },
    "pseudoCodeSteps": [
      {
        "stepNumber": 1,
        "description": "Validate input parameters",
        "operation": "validate_input",
        "inputFields": ["leadId", "emailTemplateId", "followUpDateTime"],
        "outputFields": [],
        "errorHandling": "Return validation error if invalid",
        "dependencies": []
      },
      {
        "stepNumber": 2,
        "description": "Fetch lead from database",
        "operation": "database_read",
        "inputFields": ["leadId"],
        "outputFields": ["lead"],
        "errorHandling": "Return error if lead not found",
        "dependencies": [1]
      },
      {
        "stepNumber": 3,
        "description": "Fetch email template from database",
        "operation": "database_read", 
        "inputFields": ["emailTemplateId"],
        "outputFields": ["template"],
        "errorHandling": "Return error if template not found",
        "dependencies": [1]
      },
      {
        "stepNumber": 4,
        "description": "Schedule the follow-up email",
        "operation": "schedule_email",
        "inputFields": ["lead", "template", "followUpDateTime"],
        "outputFields": ["scheduledId"],
        "errorHandling": "Return error if scheduling fails",
        "dependencies": [2, 3]
      },
      {
        "stepNumber": 5,
        "description": "Update lead status",
        "operation": "database_write",
        "inputFields": ["leadId", "status"],
        "outputFields": [],
        "errorHandling": "Log error if update fails",
        "dependencies": [4]
      }
    ],
    "uiComponents": [
      {
        "componentName": "LeadSelector",
        "purpose": "Select the lead for follow-up",
        "inputType": "database_record_selector",
        "linkedToParameter": "leadId",
        "databaseModel": "Lead",
        "required": true,
        "placeholder": "Select a lead",
        "helpText": "Choose the lead to follow up with"
      },
      {
        "componentName": "TemplateSelector",
        "purpose": "Select email template",
        "inputType": "database_record_selector", 
        "linkedToParameter": "emailTemplateId",
        "databaseModel": "EmailTemplate",
        "required": true,
        "placeholder": "Select template",
        "helpText": "Choose the email template to use"
      },
      {
        "componentName": "DateTimePicker",
        "purpose": "Set follow-up date and time",
        "inputType": "date",
        "linkedToParameter": "followUpDateTime",
        "validation": "required, future date",
        "required": true,
        "placeholder": "Select date and time",
        "helpText": "When should the follow-up be sent?"
      }
    ],
    "aiProcessing": [],
    "testScenarios": [
      {
        "scenarioName": "Valid Follow-up Scheduling",
        "description": "Test scheduling with valid lead and template",
        "inputData": {
          "leadId": "lead_123",
          "emailTemplateId": "template_456", 
          "followUpDateTime": "2024-01-15T10:00:00Z"
        },
        "expectedOutput": {
          "message": "Follow-up email scheduled successfully",
          "scheduledId": "schedule_789",
          "scheduledFor": "2024-01-15T10:00:00Z"
        },
        "expectedDatabaseChanges": [
          {
            "model": "Lead",
            "operation": "update",
            "recordCount": 1
          }
        ],
        "shouldSucceed": true,
        "databaseIdsInInput": [
          {
            "path": "leadId",
            "modelName": "Lead"
          },
          {
            "path": "emailTemplateId",
            "modelName": "EmailTemplate"
          }
        ]
      },
      {
        "scenarioName": "Invalid Lead ID",
        "description": "Test with non-existent lead ID",
        "inputData": {
          "leadId": "invalid_lead",
          "emailTemplateId": "template_456",
          "followUpDateTime": "2024-01-15T10:00:00Z"
        },
        "expectedOutput": {
          "error": "Lead not found",
          "code": "LEAD_NOT_FOUND"
        },
        "expectedDatabaseChanges": [],
        "shouldSucceed": false,
        "errorExpected": "Lead not found",
        "databaseIdsInInput": [
          {
            "path": "leadId",
            "modelName": "Lead"
          }
        ]
      },
      {
        "scenarioName": "Invalid Template ID", 
        "description": "Test with non-existent template ID",
        "inputData": {
          "leadId": "lead_123",
          "emailTemplateId": "invalid_template",
          "followUpDateTime": "2024-01-15T10:00:00Z"
        },
        "expectedOutput": {
          "error": "Email template not found",
          "code": "TEMPLATE_NOT_FOUND"
        },
        "expectedDatabaseChanges": [],
        "shouldSucceed": false,
        "errorExpected": "Template not found",
        "databaseIdsInInput": [
          {
            "path": "emailTemplateId",
            "modelName": "EmailTemplate"
          }
        ]
      }
    ]
  }
}

CRITICAL: Ensure every required field is present as the correct data type (objects must be objects, not strings or undefined).`
    }]
  });

  return result.object;
}

/**
 * ENHANCED ACTION GENERATION - Step 3: GENERATE CODE
 * Generate complete, production-ready code including main function, helpers,
 * UI components, and test cases
 */
export async function generateEnhancedActionCode(
  actionAnalysis: z.infer<typeof enhancedActionAnalysisSchema>,
  databaseResult: { models: AgentModel[] },
  existingAgent?: AgentData
): Promise<z.infer<typeof enhancedActionCodeSchema>> {
  console.log('🔧 Starting enhanced action code generation with focus on UI components...');
  
  // Get the agent builder model
  const model = await getAgentBuilderModel();
  
  // Map available models for the action analysis
  const availableModels = databaseResult.models.map(m => ({
    name: m.name,
    fields: m.fields.map(f => ({ name: f.name, type: f.type, required: f.required }))
  }));

  try {
    const result = await generateObject({
      model,
      schema: enhancedActionCodeSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert full-stack developer generating production-ready code. 

CRITICAL REQUIREMENT: Every field in the schema must be provided with the correct data type. Never return undefined for any required field.

OBJECT FIELD REQUIREMENTS:
- All "object" fields must contain actual objects with key-value pairs
- All "array" fields must contain actual arrays with elements
- Never use undefined, null, or string placeholders for object/array fields

Generate complete, working code with proper error handling.`
        },
        {
          role: 'user',
          content: `Generate enhanced action code for:

Action Analysis: ${JSON.stringify(actionAnalysis, null, 2)}

Database Models: ${JSON.stringify(availableModels, null, 2)}

Requirements:
1. Generate complete working code
2. Include comprehensive error handling
3. Create modern React UI components with matrix green theme
4. Provide complete test cases with mock data
5. Include proper integration code

Focus on creating production-ready, functional code that can be immediately used.`
        }
      ],
      temperature: 0.1
    });

    console.log('✅ Enhanced action code generation complete');
    return result.object;
  } catch (error: any) {
    console.log('⚠️ Enhanced action code generation failed, attempting recovery...');
    
    // Check if this is a validation error
    if (error.message && (error.message.includes('undefined') || error.message.includes('Required'))) {
      console.log('🔧 Applying validation error fix...');
      
      try {
        // Generate with explicit structure to avoid validation errors
        const fixedResult = await generateObject({
          model,
          schema: enhancedActionCodeSchema,
          messages: [
            {
              role: 'system',
              content: `Generate code with EXACT structure requirements. Every object field must be filled.

MANDATORY OBJECT FIXES:
1. returnType.output must be object like: {"success": true, "data": {}, "message": ""}
2. usage.parameterExample must be object like: {"key": "value"}
3. testCases[].mockData must be object like: {"input": {}, "database": {}, "member": {}}
4. testCases[].expectedResult must be object like: {"success": true, "data": {}}
5. architecturePlan.propsInterface must be object like: {"prop": "type"}
6. usage.propsExamples must be object like: {"prop": "value"}
7. usage.stateExamples must be object like: {"state": "value"}

Never use undefined for any field.`
            },
            {
              role: 'user',
              content: `Generate complete structure for action: ${actionAnalysis.imagination?.title || 'Data Action'}

Use this EXACT template structure:

{
  "actionId": "data-action-${Date.now()}",
  "actionName": "Data Processing Action",
  "codeComponents": {
    "mainFunction": {
      "name": "processData",
      "parameterNames": ["database", "input", "member"],
      "functionBody": "try { const result = await database.create('Data', input); return { output: { success: true, data: result, message: 'Success' }, data: [{ modelId: 'Data', createdRecords: [result] }] }; } catch (error) { throw new Error('Failed: ' + error.message); }",
      "parameterDescriptions": {
        "database": "Database connection object",
        "input": "Input data from user",
        "member": "User context and permissions"
      },
      "returnType": {
        "output": {"success": true, "data": {"id": "123"}, "message": "Operation completed"},
        "data": [{"modelId": "Data", "createdRecords": [{"id": "123"}]}]
      },
      "usage": {
        "example": "const fn = new Function('database', 'input', 'member', functionBody); await fn(db, data, user);",
        "parameterExample": {"userId": "123", "content": "test data"}
      }
    },
    "validationFunctions": [
      {
        "name": "validateInput",
        "purpose": "Validate input data",
        "parameterNames": ["input"],
        "functionBody": "if (!input) throw new Error('Input required'); return true;"
      }
    ],
    "apiHelpers": [
      {
        "name": "callAPI",
        "purpose": "Call external API",
        "apiName": "DataAPI",
        "parameterNames": ["data"],
        "functionBody": "const response = await fetch('/api/data', {method: 'POST', body: JSON.stringify(data)}); return response.json();"
      }
    ],
    "databaseHelpers": [
      {
        "name": "saveData",
        "purpose": "Save to database",
        "modelName": "Data",
        "operation": "create",
        "parameterNames": ["database", "data"],
        "functionBody": "return await database.create('Data', data);"
      }
    ],
    "testCases": [
      {
        "name": "Success test",
        "description": "Test successful operation",
        "testFunctionBody": "const result = await processData(mockDb, mockInput, mockMember); return result.output.success;",
        "mockData": {"input": {"content": "test"}, "database": {"create": "function"}, "member": {"id": "123"}},
        "expectedResult": {"success": true, "data": {"id": "123"}, "message": "Success"},
        "executionExample": "Run with mock data"
      },
      {
        "name": "Error test",
        "description": "Test error handling",
        "testFunctionBody": "try { await processData(null, null, null); return false; } catch (e) { return true; }",
        "mockData": {"input": null, "database": null, "member": null},
        "expectedResult": {"success": false, "error": "Validation failed"},
        "executionExample": "Test error scenarios"
      },
      {
        "name": "Validation test",
        "description": "Test input validation",
        "testFunctionBody": "return validateInput({content: 'test'});",
        "mockData": {"input": {"content": "test"}},
        "expectedResult": {"valid": true},
        "executionExample": "Test validation logic"
      }
    ]
  },
  "uiComponents": [
    {
      "componentName": "DataForm",
      "componentType": "input-form",
      "uxAnalysis": {
        "userJourney": "User inputs data and submits",
        "informationHierarchy": "Form fields with clear labels",
        "interactionPatterns": ["hover", "focus", "validation"],
        "visualHierarchy": "Primary form with submit button",
        "errorStates": ["validation errors", "network errors"],
        "loadingStates": ["form submission", "data loading"]
      },
      "architecturePlan": {
        "componentComposition": "Form with inputs and validation",
        "stateManagement": "useState for form state",
        "propsInterface": {"onSubmit": "function", "values": "object", "onChange": "function"},
        "validationStrategy": "Real-time validation",
        "accessibilityFeatures": ["ARIA labels", "keyboard nav"],
        "performanceOptimizations": ["debounced validation"]
      },
      "designSystem": {
        "colorPalette": {
          "primary": ["#00ff00", "#00cc00"],
          "secondary": ["#ffffff", "#f0f0f0"],
          "feedback": {"success": "#00ff00", "error": "#ff0000", "warning": "#ffa500", "info": "#0066cc"}
        },
        "typography": {
          "headings": ["text-xl font-bold"],
          "body": ["text-base"],
          "mono": ["font-mono text-sm"]
        },
        "spacing": {
          "padding": ["p-4", "p-2"],
          "margin": ["m-4", "m-2"],
          "gap": ["gap-4", "gap-2"]
        },
        "effects": {
          "borderRadius": ["rounded-lg"],
          "shadows": ["shadow-lg"],
          "animations": ["transition-all"]
        },
        "interactiveStates": {
          "hover": ["hover:bg-green-600"],
          "focus": ["focus:ring-2"],
          "active": ["active:bg-green-700"],
          "disabled": ["disabled:opacity-50"]
        }
      },
      "interactionDesign": {
        "inputMethods": ["text input", "validation"],
        "keyboardNavigation": "Tab navigation",
        "touchInteractions": "Touch-friendly",
        "loadingFeedback": "Loading spinner",
        "successStates": "Success animation",
        "errorRecovery": "Clear error messages"
      },
      "advancedPatterns": {
        "inputEnhancements": ["floating labels"],
        "selectionInterfaces": ["dropdowns"],
        "layoutFeatures": ["responsive grid"],
        "feedbackComponents": ["toast notifications"]
      },
      "implementation": {
        "reactCode": "import React, { useState } from 'react'; export default function DataForm({ onSubmit, values = {}, onChange }) { const [isSubmitting, setIsSubmitting] = useState(false); return (<div className=\"p-6 bg-black border border-green-500 rounded-lg\"><form onSubmit={onSubmit}><input className=\"w-full p-3 bg-gray-900 border border-green-500 rounded text-green-400\" placeholder=\"Enter data\" /><button type=\"submit\" className=\"mt-4 px-6 py-2 bg-green-600 text-black rounded hover:bg-green-700\">Submit</button></form></div>); }",
        "hookUsage": ["useState for form state"],
        "eventHandlers": ["onSubmit", "onChange"],
        "validationLogic": "Real-time validation",
        "responsiveDesign": "Mobile-first design",
        "animationCode": "CSS transitions"
      },
      "usage": {
        "integrationExample": "<DataForm onSubmit={handleSubmit} values={data} onChange={handleChange} />",
        "propsExamples": {"values": {"content": "test"}, "onSubmit": "function", "onChange": "function"},
        "stateExamples": {"formData": {"content": ""}, "isSubmitting": false, "errors": {}},
        "eventHandlingExamples": "Handle form events with validation"
      },
      "description": "Modern data input form with matrix green theme"
    }
  ],
  "integrationCode": {
    "actionRegistration": "system.registerAction({id: 'data-action', handler: processData});",
    "routeHandler": "app.post('/api/data', async (req, res) => { const result = await processData(db, req.body, req.user); res.json(result); });",
    "permissionChecks": "function checkPermissions(user) { return user.role === 'admin' || user.role === 'user'; }",
    "errorHandling": "try { await processData(); } catch (error) { console.error(error); throw error; }"
  },
  "executionInstructions": {
    "mainFunctionUsage": "const fn = new Function('database', 'input', 'member', functionBody); await fn(db, data, user);",
    "parameterSetup": "const db = getDatabase(); const input = req.body; const member = req.user;",
    "errorHandling": "try { const result = await execute(); } catch (error) { handleError(error); }",
    "testingInstructions": "Run test cases to verify functionality"
  }
}

Generate using this exact structure with all object fields properly filled.`
            }
          ],
          temperature: 0.1
        });

        console.log('✅ Enhanced action code generation recovered successfully');
        return fixedResult.object;
      } catch (retryError) {
        console.error('❌ Enhanced action code generation retry failed:', retryError);
        throw error; // Throw original error for debugging
      }
    }
    
    throw error;
  }
}

/**
 * ENHANCED ACTION GENERATION - Complete Process
 * Execute the full 3-step enhanced action generation process
 */
export async function generateCompleteEnhancedAction(
  actionRequest: string,
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[] },
  existingAgent?: AgentData,
  businessContext?: string
): Promise<{
  imagination: any,
  analysis: z.infer<typeof enhancedActionAnalysisSchema>,
  codeGeneration: z.infer<typeof enhancedActionCodeSchema>,
  actionConfig: AgentAction
}> {
  console.log('🚀 Starting complete enhanced action generation process...');
  
  // Step 1: Generate imagination (define use case conceptually)
  const imagination = await generateEnhancedActionImagination(
    actionRequest,
    promptUnderstanding,
    databaseResult,
    existingAgent,
    businessContext
  );

  // Step 2: Generate comprehensive analysis (plan operation logically)
  const analysis = await generateEnhancedActionAnalysis(
    actionRequest,
    imagination,
    promptUnderstanding,
    databaseResult,
    existingAgent,
    businessContext
  );

  // Step 3: Generate complete code (write working code)
  const codeGeneration = await generateEnhancedActionCode(
    analysis,
    databaseResult,
    existingAgent
  );

  // Step 4: Create action configuration for the system
  const actionConfig: AgentAction = {
    id: codeGeneration.actionId,
    name: imagination.title,
    emoji: '⚡', // Default, can be customized
    description: imagination.description,
    type: analysis.analysis.databaseOperations.tablesToUpdate.some(t => t.operation === 'create') ? 'Create' : 'Update',
    role: imagination.userRole,
    dataSource: {
      type: 'custom',
      customFunction: {
        code: codeGeneration.codeComponents.mainFunction.functionBody,
        envVars: (analysis.analysis.externalAPIs || []).flatMap(api => 
          (api.requiredKeys || []).map(key => ({
            name: key.keyName,
            description: key.description,
            required: true,
            sensitive: key.sensitive
          }))
        )
      },
      database: undefined
    },
    execute: {
      type: 'code',
      code: {
        script: codeGeneration.codeComponents.mainFunction.functionBody,
        envVars: (analysis.analysis.externalAPIs || []).flatMap(api => 
          (api.requiredKeys || []).map(key => ({
            name: key.keyName,
            description: key.description,
            required: true,
            sensitive: key.sensitive
          }))
        )
      }
    },
    results: {
      actionType: analysis.analysis.databaseOperations.tablesToUpdate.some(t => t.operation === 'create') ? 'Create' : 'Update',
      model: analysis.analysis.databaseOperations.tablesToUpdate[0]?.modelName || 'DefaultModel',
      fields: {},
      fieldsToUpdate: {}
    },
    // Map generated UI components to action configuration
    uiComponents: {
      stepForms: (codeGeneration.uiComponents || [])
        .filter((component: any) => component.componentName.toLowerCase().includes('form') || component.componentName.toLowerCase().includes('step'))
        .map((component: any, index: number) => ({
          stepNumber: index + 1,
          title: component.componentName.replace(/([A-Z])/g, ' $1').trim(),
          description: component.description,
          reactCode: component.reactCode,
          propsInterface: component.propsInterface,
          validationLogic: component.validationLogic,
          dataRequirements: analysis.analysis.databaseOperations.tablesToRead.map(table => ({
            modelName: table.modelName,
            fields: table.fields,
            purpose: table.purpose
          }))
        })),
      resultView: {
        title: `${imagination.title} Results`,
        description: `View the results of ${imagination.title.toLowerCase()}`,
        reactCode: (codeGeneration.uiComponents || [])
          .find((component: any) => component.componentName.toLowerCase().includes('result') || component.componentName.toLowerCase().includes('output'))?.implementation?.reactCode || 
          'export default function ResultComponent({ result, isLoading, error }: { result: any; isLoading: boolean; error: string | null }) { return <div>{isLoading ? "Loading..." : error ? error : JSON.stringify(result)}</div>; }',
        propsInterface: (codeGeneration.uiComponents || [])
          .find((component: any) => component.componentName.toLowerCase().includes('result') || component.componentName.toLowerCase().includes('output'))?.architecturePlan?.propsInterface || 
          { result: 'any', isLoading: 'boolean', error: 'string | null' }
      }
    }
  };

  console.log('✅ Complete enhanced action generation finished');
  
  return {
    imagination,
    analysis,
    codeGeneration,
    actionConfig
  };
}

/**
 * BATCH ENHANCED ACTION GENERATION
 * Generate multiple enhanced actions from a list of requirements
 */
export async function generateBatchEnhancedActions(
  actionRequests: string[],
  promptUnderstanding: PromptUnderstanding,
  databaseResult: { models: AgentModel[] },
  existingAgent?: AgentData,
  businessContext?: string
): Promise<Array<{
  request: string,
  imagination: any,
  analysis: z.infer<typeof enhancedActionAnalysisSchema>,
  codeGeneration: z.infer<typeof enhancedActionCodeSchema>,
  actionConfig: AgentAction
}>> {
  console.log(`🔄 Starting batch enhanced action generation for ${actionRequests.length} actions...`);
  
  const results = [];
  
  for (const request of actionRequests) {
    try {
      const result = await generateCompleteEnhancedAction(
        request,
        promptUnderstanding,
        databaseResult,
        existingAgent,
        businessContext
      );
      
      results.push({
        request,
        ...result
      });
      
      console.log(`✅ Completed enhanced action: ${result.imagination.title}`);
    } catch (error) {
      console.error(`❌ Failed to generate enhanced action for: ${request}`, error);
    }
  }
  
  console.log(`🎉 Batch enhanced action generation complete: ${results.length}/${actionRequests.length} successful`);
  return results;
}

/**
 * EXECUTE GENERATED ACTION FUNCTION
 * Helper function to execute generated action code using new Function() pattern
 */
export function executeGeneratedAction(
  functionBody: string,
  database: any,
  input: Record<string, any>,
  member: Record<string, any> = { id: 'anonymous', role: 'member', email: 'anonymous@example.com' }
): Promise<{ output: Record<string, any>, data: Array<{ modelId: string, createdRecords?: any[], updatedRecords?: any[], deletedRecords?: string[] }> }> {
  try {
    // Create the function using new Function() constructor with standard parameters
    const actionFunction = new Function('database', 'input', 'member', functionBody);
    
    // Execute the function with provided parameters
    const result = actionFunction(database, input, member);
    
    // Handle both sync and async results
    if (result && typeof result.then === 'function') {
      return result;
    } else {
      return Promise.resolve(result);
    }
  } catch (error) {
    console.error('Error executing generated action:', error);
    throw new Error(`Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * VALIDATE GENERATED FUNCTION BODY
 * Helper function to validate that a generated function body is syntactically correct
 */
export function validateGeneratedFunctionBody(
  functionBody: string,
  parameterNames: string[] = ['database', 'input', 'member']
): { isValid: boolean, error?: string } {
  try {
    // Try to create the function to check for syntax errors
    new Function(...parameterNames, functionBody);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown syntax error' 
    };
  }
}

/**
 * CREATE FUNCTION EXECUTION EXAMPLE
 * Generate example code showing how to use the generated function
 */
export function createFunctionExecutionExample(
  actionAnalysis: z.infer<typeof enhancedActionAnalysisSchema>,
  codeGeneration: z.infer<typeof enhancedActionCodeSchema>
): string {
  const requiredParams = actionAnalysis.analysis.inputParameters.required || [];
  const exampleInput = requiredParams.reduce((acc, param) => {
    if (param.isDatabaseId) {
      // Use example database ID format
      acc[param.name] = param.isMultipleIds ? [`${param.databaseIdModel?.toLowerCase()}_001`, `${param.databaseIdModel?.toLowerCase()}_002`] : `${param.databaseIdModel?.toLowerCase()}_001`;
    } else {
      acc[param.name] = param.type === 'string' ? 'example_value' : 
                       param.type === 'number' ? 42 : 
                       param.type === 'boolean' ? true : 'example_value';
    }
    return acc;
  }, {} as Record<string, any>);

  const exampleMember = {
    id: 'user_123',
    role: 'member',
    email: 'user@example.com',
    name: 'John Doe'
  };

  const exampleEnvs = actionAnalysis.analysis.externalAPIs.reduce((acc, api) => {
    api.requiredKeys.forEach(key => {
      acc[key.keyName] = 'your_api_key_here';
    });
    return acc;
  }, {} as Record<string, string>);

  const databaseIdFields = requiredParams
    .filter(param => param.isDatabaseId)
    .map(param => `${param.name} (${param.databaseIdModel} ID${param.isMultipleIds ? 's' : ''})`)
    .join(', ');

  // Handle models used - fallback to database operations if standardParameters not available
  const analysisWithStandardParams = actionAnalysis.analysis as any;
  const modelsUsed = analysisWithStandardParams.standardParameters?.database?.modelsUsed || 
    actionAnalysis.analysis.databaseOperations.tablesToRead.map(table => table.modelName)
      .concat(actionAnalysis.analysis.databaseOperations.tablesToUpdate.map(table => table.modelName))
      .filter((model, index, self) => self.indexOf(model) === index);

  return `
// Example usage of generated action function
const functionBody = \`${codeGeneration.codeComponents.mainFunction.functionBody}\`;

// Set up parameters
const database = {
  // Your database object with models accessible via database["ModelName"]
  // Available models: ${codeGeneration.codeComponents.databaseHelpers.map(h => h.modelName).join(', ')}
  ${modelsUsed.map((model: string) => `"${model}": [
    // Array of ${model} records
    { id: "${model.toLowerCase()}_001", /* other fields */ },
    { id: "${model.toLowerCase()}_002", /* other fields */ }
  ]`).join(',\n  ')}
};

const input = ${JSON.stringify(exampleInput, null, 2)};
${databaseIdFields ? `// Note: Input contains database ID fields: ${databaseIdFields}` : ''}

const member = ${JSON.stringify(exampleMember, null, 2)};
// Member represents the user executing the action

${Object.keys(exampleEnvs).length > 0 ? `
// Environment variables (if needed for external APIs)
const envs = ${JSON.stringify(exampleEnvs, null, 2)};
` : ''}

// Execute the function
async function runAction() {
  try {
    const result = await executeGeneratedAction(functionBody, database, input, member);
    console.log('Action result:', result);
    
    // Result structure:
    // {
    //   output: { /* action-specific output data */ },
    //   data: [{ 
    //     modelId: "model_name", 
    //     createdRecords: [...], 
    //     updatedRecords: [...], 
    //     deletedRecords: [...] 
    //   }]
    // }
    
    return result;
  } catch (error) {
    console.error('Action failed:', error);
    throw error;
  }
}

// Alternative direct execution
const actionFunction = new Function('database', 'input', 'member', functionBody);
const result = await actionFunction(database, input, member);

// Database ID field handling examples:
${requiredParams.filter(p => p.isDatabaseId).map(param => `
// ${param.name} is a database ID referencing ${param.databaseIdModel}
const ${param.databaseIdModel?.toLowerCase()}Record = database["${param.databaseIdModel}"].find(record => record.id === input.${param.name});
if (!${param.databaseIdModel?.toLowerCase()}Record) {
  throw new Error('${param.databaseIdModel} not found with ID: ' + input.${param.name});
}`).join('')}
`;
}

/**
 * Generate a default result view component for actions without specific result UI
 */
function generateDefaultResultView(actionTitle: string): string {
  return `
import React from 'react';

interface ResultViewProps {
  result: any;
  isLoading: boolean;
  error: string | null;
}

export default function ${actionTitle.replace(/\s+/g, '')}ResultView({ result, isLoading, error }: ResultViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-green-300 font-mono">Processing ${actionTitle.toLowerCase()}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-red-300 font-mono">Action Failed</h3>
        </div>
        <p className="text-red-400 font-mono text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-green-400">✅</span>
        </div>
        <h3 className="text-lg font-semibold text-green-300 font-mono">${actionTitle} Completed</h3>
      </div>
      
      {result?.output && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-green-300 font-mono mb-2">Result:</h4>
            <pre className="bg-black/50 border border-green-500/20 rounded-lg p-4 text-xs text-green-200 font-mono overflow-auto">
              {JSON.stringify(result.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {result?.data && result.data.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-green-300 font-mono mb-2">Database Changes:</h4>
          <div className="space-y-2">
            {result.data.map((change: any, index: number) => (
              <div key={index} className="bg-black/30 border border-green-500/10 rounded-lg p-3">
                <div className="text-xs text-green-400 font-mono">Model: {change.modelId}</div>
                {change.createdRecords && change.createdRecords.length > 0 && (
                  <div className="text-xs text-green-300 font-mono">Created: {change.createdRecords.length} records</div>
                )}
                {change.updatedRecords && change.updatedRecords.length > 0 && (
                  <div className="text-xs text-green-300 font-mono">Updated: {change.updatedRecords.length} records</div>
                )}
                {change.deletedRecords && change.deletedRecords.length > 0 && (
                  <div className="text-xs text-green-300 font-mono">Deleted: {change.deletedRecords.length} records</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`;
}

/**
 * COMPREHENSIVE EXAMPLE: Enhanced Action Generation with Database ID Handling
 * This function demonstrates how to use the enhanced action generation system
 * with proper database ID field handling
 */
export function createEnhancedActionExample(): string {
  return `
// ENHANCED ACTION GENERATION EXAMPLE
// This example shows how to generate actions with database ID handling

import { 
  generateCompleteEnhancedAction, 
  executeGeneratedAction,
  validateGeneratedFunctionBody 
} from './generation';

// Example: Generate a "Create Blog Post" action
async function generateBlogPostAction() {
  const actionRequest = "Create a new blog post with author assignment and category selection";
  
  const promptUnderstanding = {
    // Your prompt understanding data...
    workflowAutomationNeeds: {
      requiredActions: [
        { name: "Create Blog Post", purpose: "Allow users to create new blog posts" }
      ]
    }
  };
  
  const databaseResult = {
    models: [
      {
        name: "User",
        fields: [
          { name: "id", type: "String", relationField: false },
          { name: "name", type: "String", relationField: false },
          { name: "email", type: "String", relationField: false }
        ]
      },
      {
        name: "Category", 
        fields: [
          { name: "id", type: "String", relationField: false },
          { name: "name", type: "String", relationField: false }
        ]
      },
      {
        name: "BlogPost",
        fields: [
          { name: "id", type: "String", relationField: false },
          { name: "title", type: "String", relationField: false },
          { name: "content", type: "String", relationField: false },
          { name: "authorId", type: "String", relationField: false },
          { name: "categoryIds", type: "String", relationField: false, list: true }
        ]
      }
    ],
    enums: []
  };
  
  // Generate the enhanced action
  const result = await generateCompleteEnhancedAction(
    actionRequest,
    promptUnderstanding,
    databaseResult,
    undefined, // no existing agent
    "Blog management system"
  );
  
  console.log("Generated Action Analysis:", result.analysis);
  console.log("Generated Code:", result.codeGeneration);
  
  // The generated input parameters will include:
  // - title: string (regular field)
  // - content: string (regular field)  
  // - authorId: string (database ID field, isDatabaseId: true, databaseIdModel: "User")
  // - categoryIds: string[] (database ID array, isDatabaseId: true, isMultipleIds: true, databaseIdModel: "Category")
  
  return result;
}

// Example: Execute the generated action
async function executeBlogPostAction() {
  const functionBody = \`
    try {
      // Validate input
      if (!input.title || !input.content) {
        throw new Error('Title and content are required');
      }
      
      // Validate database IDs
      const author = database["User"].find(u => u.id === input.authorId);
      if (!author) {
        throw new Error('Author not found with ID: ' + input.authorId);
      }
      
      const categories = input.categoryIds.map(id => {
        const category = database["Category"].find(c => c.id === id);
        if (!category) {
          throw new Error('Category not found with ID: ' + id);
        }
        return category;
      });
      
      // Check permissions
      if (member.role !== 'admin' && member.id !== input.authorId) {
        throw new Error('You can only create posts for yourself');
      }
      
      // Create new blog post
      const newPost = {
        id: 'post_' + Date.now(),
        title: input.title,
        content: input.content,
        authorId: input.authorId,
        categoryIds: input.categoryIds,
        createdAt: new Date().toISOString(),
        createdBy: member.id
      };
      
      // Add to database (in real implementation, this would save to actual database)
      database["BlogPost"].push(newPost);
      
      return {
        output: {
          success: true,
          blogPost: newPost,
          author: author,
          categories: categories
        },
        data: [{
          modelId: "BlogPost",
          createdRecords: [newPost]
        }]
      };
    } catch (error) {
      throw new Error('Failed to create blog post: ' + error.message);
    }
  \`;
  
  // Set up test data
  const database = {
    "User": [
      { id: "user_001", name: "John Doe", email: "john@example.com" },
      { id: "user_002", name: "Jane Smith", email: "jane@example.com" }
    ],
    "Category": [
      { id: "cat_001", name: "Technology" },
      { id: "cat_002", name: "Business" },
      { id: "cat_003", name: "Lifestyle" }
    ],
    "BlogPost": []
  };
  
  const input = {
    title: "My First Blog Post",
    content: "This is the content of my blog post...",
    authorId: "user_001", // Database ID field
    categoryIds: ["cat_001", "cat_002"] // Database ID array field
  };
  
  const member = {
    id: "user_001",
    role: "member", 
    email: "john@example.com",
    name: "John Doe"
  };
  
  // Execute the action
  const result = await executeGeneratedAction(functionBody, database, input, member);
  
  console.log("Action execution result:", result);
  console.log("Created blog post:", result.output.blogPost);
  console.log("Database now contains:", database["BlogPost"].length, "blog posts");
  
  return result;
}

// Example: Validate function body
function validateBlogPostFunction() {
  const functionBody = \`
    // Function body here...
    return { output: {}, data: [] };
  \`;
  
  const validation = validateGeneratedFunctionBody(functionBody);
  
  if (validation.isValid) {
    console.log("✅ Function body is valid");
  } else {
    console.log("❌ Function body is invalid:", validation.error);
  }
  
  return validation;
}

// Usage examples
export {
  generateBlogPostAction,
  executeBlogPostAction, 
  validateBlogPostFunction
};
`;
}

/**
 * Generate pseudo code steps for actions or schedules
 */
export async function generatePseudoSteps(
  name: string,
  description: string,
  type: 'Create' | 'Update',
  availableModels: AgentModel[],
  entityType: 'action' | 'schedule',
  businessContext?: string
): Promise<PseudoCodeStep[]> {
  console.log(`🧩 Generating pseudo steps for ${entityType}: ${name}`);
  
  const model = await getAgentBuilderModel();

  const systemPrompt = `You are a business process expert creating detailed pseudo code steps for a ${entityType}.

ENTITY DETAILS:
- Name: ${name}
- Description: ${description}
- Type: ${type}
- Entity Type: ${entityType}

AVAILABLE DATA MODELS:
${availableModels.map(model => `
- ${model.name}: ${(model.fields || []).map(f => `${f.name} (${f.type})`).join(', ')}
`).join('')}

${businessContext ? `BUSINESS CONTEXT: ${businessContext}` : ''}

Create a logical sequence of pseudo code steps that accomplish the goal. Each step should:

1. **Input/Output Clarity**: Define exactly what data goes in and what comes out
2. **Database Operations**: Use specific model names and fields from the available models
3. **External API Calls**: Include calls to external services like Shopify, payment gateways, etc.
4. **AI Operations**: Use AI for analysis, decision making, or data processing when needed
5. **Business Logic**: Include validation, calculations, and business rules
6. **Error Handling**: Consider what could go wrong and how to handle it
7. **Realistic Workflow**: Follow a logical business process flow

STEP TYPES TO USE:
- Database find unique: Get one specific record
- Database find many: Get multiple records with criteria
- Database create: Create new records
- Database update unique: Update one specific record
- Database update many: Update multiple records
- Database delete unique: Delete one specific record
- Database delete many: Delete multiple records
- call external api: Make API calls to external services (Shopify, payment processors, etc.)
- ai analysis: Use AI for analysis, decision making, or data processing

**CRITICAL FIELD TYPE RULES**:
When defining field types, follow these EXACT patterns:

1. **For database model references (relationships)**:
   - Use the EXACT model name: "${availableModels.map(m => m.name).join('", "')}"
   - Example: If referencing a Customer, use type "Customer" (not "String")

2. **For database model ID fields (foreign keys)**:
   - Use ModelName + "Id" pattern: "${availableModels.map(m => `${m.name}Id`).join('", "')}"
   - Example: To reference a Customer by ID, use type "CustomerId" (not "String")
   - Example: To reference a Lead by ID, use type "LeadId" (not "String")

3. **For scalar/primitive data**:
   - Use: String, Int, Float, Boolean, DateTime, Json, Bytes

**RELATIONSHIP FIELD EXAMPLES**:
${availableModels.map(model => `
- To reference a ${model.name} record: type = "${model.name}"
- To reference a ${model.name} by ID: type = "${model.name}Id"
`).join('')}

**IMPORTANT**: When you see field names like "leadId", "customerId", "orderId", etc., the type should be "${availableModels.map(m => m.name).find(name => name.toLowerCase() === 'lead') ? 'LeadId' : 'ModelNameId'}", NOT "String"!

For ${type} operations:
${type === 'Create' ? '- Focus on data validation, creation, and confirmation steps' : '- Focus on finding existing records, validation, updating, and confirmation steps'}

Generate 3-7 logical steps that would accomplish this ${entityType}'s purpose. Be specific about database model relationships and connections.

**EXAMPLE FIELD PATTERNS**:
❌ WRONG: { name: "leadId", type: "String" }
✅ CORRECT: { name: "leadId", type: "LeadId" }

❌ WRONG: { name: "customer", type: "String" }
✅ CORRECT: { name: "customer", type: "Customer" }

Follow these patterns exactly to ensure proper relationship detection!`;

  const pseudoStepsSchema = z.object({
    steps: z.array(z.object({
      description: z.string().describe('Clear description of what this step does'),
      type: z.enum([
        'Database find unique', 
        'Database find many', 
        'Database update unique', 
        'Database update many', 
        'Database create', 
        'Database create many', 
        'Database delete unique', 
        'Database delete many',
        'call external api',
        'ai analysis'
      ]),
      inputFields: z.array(z.object({
        name: z.string().describe('Field name'),
        type: z.string().describe(`Data type - CRITICAL: Use exact patterns: For relationships use "${availableModels.map(m => m.name).join('", "')}", for IDs use "${availableModels.map(m => `${m.name}Id`).join('", "')}", for scalars use String, Int, Boolean, etc. Example: "leadId" field should be type "LeadId" NOT "String"`),
        description: z.string().describe('What this field represents'),
        required: z.boolean().describe('Whether this field is required'),
        list: z.boolean().default(false).describe('Whether this field contains multiple values (array)')
      })).describe('Input fields this step needs'),
      outputFields: z.array(z.object({
        name: z.string().describe('Field name'),
        type: z.string().describe(`Data type - CRITICAL: Use exact patterns: For relationships use "${availableModels.map(m => m.name).join('", "')}", for IDs use "${availableModels.map(m => `${m.name}Id`).join('", "')}", for scalars use String, Int, Boolean, etc. Example: "leadId" field should be type "LeadId" NOT "String"`),
        description: z.string().describe('What this field represents'),
        required: z.boolean().describe('Whether this field will always be present'),
        list: z.boolean().default(false).describe('Whether this field contains multiple values (array)')
      })).describe('Output fields this step produces')
    }))
  });

  const result = await generateObject({
    model,
    schema: pseudoStepsSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      }
    ],
    temperature: 0.4,
  });

  // Helper function to determine field properties based on type and available models
  const getFieldProperties = (fieldType: string, availableModels: AgentModel[]) => {
    console.log(`🔍 Analyzing field type: "${fieldType}" against models: [${availableModels.map(m => m.name).join(', ')}]`);
    
    // Check if this is a model name (exact match)
    const isModelType = availableModels.some(model => model.name === fieldType);
    
    // Check if this is a model ID field (ends with model name + "Id")
    const modelIdMatch = availableModels.find(model => 
      fieldType === `${model.name}Id` || 
      fieldType.toLowerCase() === `${model.name.toLowerCase()}id`
    );
    
    // Additional pattern checks for common variations
    const alternativeIdMatch = availableModels.find(model => {
      const modelNameLower = model.name.toLowerCase();
      const fieldTypeLower = fieldType.toLowerCase();
      
      // Check variations like: leadid, lead_id, leadID
      return (
        fieldTypeLower === `${modelNameLower}id` ||
        fieldTypeLower === `${modelNameLower}_id` ||
        fieldTypeLower === `${modelNameLower}ID` ||
        fieldType === `${model.name}_id` ||
        fieldType === `${model.name}ID`
      );
    });
    
    const finalModelMatch = modelIdMatch || alternativeIdMatch;
    
    if (isModelType) {
      console.log(`✅ Detected direct model reference: ${fieldType} -> ${fieldType}`);
      return {
        kind: 'object' as const,
        relationModel: fieldType,
        finalType: fieldType
      };
    } else if (finalModelMatch) {
      console.log(`✅ Detected model ID reference: ${fieldType} -> ${finalModelMatch.name}`);
      return {
        kind: 'object' as const,
        relationModel: finalModelMatch.name,
        finalType: 'String' // IDs are typically strings
      };
    } else {
      console.log(`➡️ Scalar field detected: ${fieldType}`);
      return {
        kind: 'scalar' as const,
        relationModel: undefined,
        finalType: fieldType
      };
    }
  };

  // Convert steps to internal format
  console.log(`Generated ${result.object.steps.length} pseudo steps. Converting to internal format...`);
  
  const convertedSteps: PseudoCodeStep[] = result.object.steps.map((step: any, index: number) => {
    console.log(`\n📝 Converting step ${index + 1}: ${step.type}`);
    
    // Post-process input fields to catch missed relationship patterns
    const processedInputFields = step.inputFields?.map((field: any) => {
      let processedType = field.type;
      
      // Special handling: if field name ends with "Id" but type is "String",
      // check if it should be a relationship
      if (field.name.endsWith('Id') && field.type === 'String') {
        const potentialModelName = field.name.slice(0, -2); // Remove "Id"
        const matchingModel = availableModels.find(model => 
          model.name.toLowerCase() === potentialModelName.toLowerCase()
        );
        
        if (matchingModel) {
          console.log(`🔧 Auto-correcting: ${field.name} type from "String" to "${matchingModel.name}Id"`);
          processedType = `${matchingModel.name}Id`;
        }
      }
      
      const properties = getFieldProperties(processedType, availableModels);
      
      return {
        id: `field_${Date.now()}_${index}_input_${field.name}`,
        name: field.name,
        type: properties.finalType,
        kind: properties.kind,
        relationModel: properties.relationModel,
        required: field.required || false,
        list: field.list || false,
        description: field.description
      };
    }) || [];
    
    // Process output fields similarly
    const processedOutputFields = step.outputFields?.map((field: any) => {
      let processedType = field.type;
      
      // Apply same post-processing for output fields
      if (field.name.endsWith('Id') && field.type === 'String') {
        const potentialModelName = field.name.slice(0, -2);
        const matchingModel = availableModels.find(model => 
          model.name.toLowerCase() === potentialModelName.toLowerCase()
        );
        
        if (matchingModel) {
          console.log(`🔧 Auto-correcting: ${field.name} type from "String" to "${matchingModel.name}Id"`);
          processedType = `${matchingModel.name}Id`;
        }
      }
      
      const properties = getFieldProperties(processedType, availableModels);
      
      return {
        id: `field_${Date.now()}_${index}_output_${field.name}`,
        name: field.name,
        type: properties.finalType,
        kind: properties.kind,
        relationModel: properties.relationModel,
        required: field.required || false,
        list: field.list || false,
        description: field.description
      };
    }) || [];

    return {
      id: `step_${Date.now()}_${index}`,
      step: index + 1,
      type: step.type,
      title: step.title || step.description,
      description: step.description,
      inputFields: processedInputFields,
      outputFields: processedOutputFields,
      code: step.code || ''
    };
  });

  console.log(`✅ Generated ${convertedSteps.length} pseudo steps for ${name}`);
  console.log(`🔍 Detected relationship fields:`, convertedSteps.flatMap(step => 
    [...step.inputFields, ...step.outputFields]
      .filter(f => f.kind === 'object')
      .map(f => `${f.name} (${f.type}) -> ${f.relationModel}`)
  ));
  
  return convertedSteps;
}

/**
 * Generate processing time estimate for schedules
 */
export async function generateProcessingTimeEstimate(
  scheduleName: string,
  description: string,
  pseudoSteps: PseudoCodeStep[],
  interval: string,
  businessContext?: string
): Promise<{
  estimatedDuration: string;
  complexity: 'low' | 'medium' | 'high';
  resourceUsage: 'light' | 'moderate' | 'heavy';
  reasoning: string;
}> {
  console.log(`⏱️ Generating processing time estimate for schedule: ${scheduleName}`);
  
  const model = await getAgentBuilderModel();

  const systemPrompt = `You are a performance analysis expert estimating processing time for automated schedules.

SCHEDULE DETAILS:
- Name: ${scheduleName}
- Description: ${description}
- Interval: ${interval}
- Number of Steps: ${pseudoSteps.length}

PSEUDO STEPS ANALYSIS:
${pseudoSteps.map((step, index) => `
Step ${index + 1}: ${step.type} - ${step.description}
- Inputs: ${step.inputFields.length} fields
- Outputs: ${step.outputFields.length} fields
`).join('')}

${businessContext ? `BUSINESS CONTEXT: ${businessContext}` : ''}

Analyze the complexity and estimate realistic processing time considering:

1. **Database Operations**: Number and complexity of database queries/writes
2. **Data Volume**: Potential amount of data being processed
3. **Business Logic**: Complexity of validations and calculations
4. **Network/External Calls**: Any external API calls or file operations
5. **Scheduling Frequency**: How often this runs affects resource planning

Provide realistic estimates that help users understand:
- How long each execution might take
- Resource impact on the system
- Whether the schedule frequency is appropriate`;

  const estimateSchema = z.object({
    estimatedDuration: z.string().describe('Human-readable duration estimate (e.g., "2-5 seconds", "30-60 seconds", "2-3 minutes")'),
    complexity: z.enum(['low', 'medium', 'high']).describe('Overall complexity level'),
    resourceUsage: z.enum(['light', 'moderate', 'heavy']).describe('Expected system resource usage'),
    reasoning: z.string().describe('Detailed explanation of the estimate and factors considered')
  });

  const result = await generateObject({
    model,
    schema: estimateSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      }
    ],
    temperature: 0.3,
  });

  console.log(`✅ Generated processing time estimate: ${result.object.estimatedDuration}`);
  return result.object;
}
