import { generateDatabase, generateExampleRecords, generatePrismaDatabase } from '../generation';
import type { AgentData, AgentEnum, AgentModel, } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import { executeStep4VercelDeployment } from './step4-vercel-deployment';
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
  // Added for auto-deployment context
  documentId?: string;
  session?: any;
  dataStream?: any;
  // Removed targetDatabaseProvider - agent apps are SQLite-only
}

export interface Step1Output {
  enums: AgentEnum[];
  models: AgentModel[];
  implementationNotes: string[];
  prismaSchema: string;
}

/**
 * Helper function to create AgentField objects with all required properties
 */
const createField = (id: string, name: string, type: string, required: boolean, isId = false, unique = false, defaultValue?: string): any => ({
  id,
  name,
  type,
  required,
  isId,
  unique,
  list: false,
  kind: 'scalar',
  relationField: false,
  title: name.charAt(0).toUpperCase() + name.slice(1),
  sort: false,
  order: 0,
  ...(defaultValue && { defaultValue })
});

/**
 * Enhance business models with user relationships based on Step 0 analysis
 */
function enhanceModelsWithUserRelationships(
  businessModels: AgentModel[], 
  step0Analysis: any
): AgentModel[] {
  // Skip if no authentication required
  if (!step0Analysis.userAccess?.requiresAuthentication) {
    console.log('📝 No authentication required - skipping user relationship analysis');
    return businessModels;
  }

  const userDataScoping = step0Analysis.userAccess?.userDataScoping || 'shared_data';
  
  console.log(`🔍 Analyzing user relationships with scoping: ${userDataScoping}`);
  
  // If data is shared, don't add user relationships
  if (userDataScoping === 'shared_data') {
    console.log('📊 Shared data scoping - no user relationships needed');
    return businessModels;
  }

  // For user_scoped or mixed data, analyze which models need user relationships
  return businessModels.map(model => {
    const modelName = model.name.toLowerCase();
    
    // Determine if this model should be user-scoped
    const needsUserRelation = shouldModelHaveUserRelation(model, userDataScoping);
    
    if (!needsUserRelation) {
      return model;
    }

    // Add userId field and relation
    const hasUserField = model.fields.some(f => f.name === 'userId');
    if (hasUserField) {
      console.log(`✅ Model ${model.name} already has userId field`);
      return model;
    }

    console.log(`👤 Adding userId relation to model: ${model.name}`);
    
    const userField = createField('userId', 'userId', 'String', true);
    const updatedFields = [...model.fields, userField];

    return {
      ...model,
      fields: updatedFields,
      _userRelationAdded: true
    };
  });
}

/**
 * Determine if a model should have a user relationship
 */
function shouldModelHaveUserRelation(model: AgentModel, userDataScoping: string): boolean {
  const modelName = model.name.toLowerCase();
  
  // System tables don't need user relations (handled separately)
  const systemTables = ['scheduleexecution', 'actionexecutionlog', 'chatconversation', 'chatmessage', 'appuser'];
  if (systemTables.includes(modelName)) {
    return false;
  }

  // Configuration/lookup tables typically don't need user relations
  const configTables = ['setting', 'config', 'category', 'tag', 'status'];
  if (configTables.some(config => modelName.includes(config))) {
    return false;
  }

  // If mixed scoping, user-specific data models need relations
  if (userDataScoping === 'mixed') {
    const userSpecificModels = ['profile', 'preference', 'dashboard', 'personal', 'user', 'account', 'my'];
    const isUserSpecific = userSpecificModels.some(keyword => modelName.includes(keyword));
    return isUserSpecific;
  }

  // If user_scoped, most models need user relations
  if (userDataScoping === 'user_scoped') {
    return true;
  }

  return false;
}

/**
 * Generate system enums required for all sub-agent databases
 */
function generateSystemEnums(): AgentEnum[] {
  return [
    {
      id: 'UserRole',
      name: 'UserRole',
      fields: [
        { id: 'MEMBER', name: 'MEMBER', type: 'String' },
        { id: 'ADMIN', name: 'ADMIN', type: 'String' }
      ]
    }
  ];
}

/**
 * Generate system tables required for all sub-agent databases
 * These tables handle logging, chat, user management, and operation tracking
 */
function generateSystemTables(): AgentModel[] {

  return [
    // 1. Schedule Execution Logging
    {
      id: 'ScheduleExecution',
      name: 'ScheduleExecution',
      description: 'Tracks schedule execution history and timing',
      idField: 'id',
      displayFields: ['scheduleName', 'status', 'startedAt'],
      enums: [],
      fields: [
        createField('id', 'id', 'String', true, true, false, 'cuid()'),
        createField('scheduleId', 'scheduleId', 'String', true),
        createField('scheduleName', 'scheduleName', 'String', true),
        createField('startedAt', 'startedAt', 'DateTime', true),
        createField('completedAt', 'completedAt', 'DateTime', false),
        createField('status', 'status', 'String', true),
        createField('totalActions', 'totalActions', 'Int', true, false, false, '0'),
        createField('successfulActions', 'successfulActions', 'Int', true, false, false, '0'),
        createField('failedActions', 'failedActions', 'Int', true, false, false, '0'),
        createField('errorMessage', 'errorMessage', 'String', false),
        createField('executionTimeMs', 'executionTimeMs', 'Int', false),
        createField('triggerType', 'triggerType', 'String', true),
        createField('createdAt', 'createdAt', 'DateTime', true, false, false, 'now()')
      ]
    },
    
    // 2. Action Execution Logging
    {
      id: 'ActionExecutionLog',
      name: 'ActionExecutionLog',
      description: 'Detailed logs for individual action executions',
      idField: 'id',
      displayFields: ['actionName', 'status', 'startedAt'],
      enums: [],
      fields: [
        createField('id', 'id', 'String', true, true, false, 'cuid()'),
        createField('scheduleExecutionId', 'scheduleExecutionId', 'String', false),
        createField('actionId', 'actionId', 'String', true),
        createField('actionName', 'actionName', 'String', true),
        createField('actionType', 'actionType', 'String', true),
        createField('stepNumber', 'stepNumber', 'Int', false),
        createField('inputParameters', 'inputParameters', 'String', false),
        createField('startedAt', 'startedAt', 'DateTime', true),
        createField('completedAt', 'completedAt', 'DateTime', false),
        createField('status', 'status', 'String', true),
        createField('resultData', 'resultData', 'String', false),
        createField('errorMessage', 'errorMessage', 'String', false),
        createField('executionTimeMs', 'executionTimeMs', 'Int', false),
        createField('triggerSource', 'triggerSource', 'String', true),
        createField('createdAt', 'createdAt', 'DateTime', true, false, false, 'now()')
      ]
    },

    // 3. Chat Conversations
    {
      id: 'ChatConversation',
      name: 'ChatConversation',
      description: 'Chat conversation sessions with the AI assistant',
      idField: 'id',
      displayFields: ['title', 'status', 'lastActivity'],
      enums: [],
      fields: [
        createField('id', 'id', 'String', true, true, false, 'cuid()'),
        createField('userId', 'userId', 'String', false),
        createField('title', 'title', 'String', false),
        createField('summary', 'summary', 'String', false),
        createField('messageCount', 'messageCount', 'Int', true, false, false, '0'),
        createField('toolCallCount', 'toolCallCount', 'Int', true, false, false, '0'),
        createField('lastActivity', 'lastActivity', 'DateTime', true, false, false, 'now()'),
        createField('status', 'status', 'String', true, false, false, 'active'),
        createField('createdAt', 'createdAt', 'DateTime', true, false, false, 'now()'),
        createField('updatedAt', 'updatedAt', 'DateTime', true, false, false, 'now()')
      ]
    },

    // 4. Chat Messages
    {
      id: 'ChatMessage',
      name: 'ChatMessage',
      description: 'Individual messages within chat conversations',
      idField: 'id',
      displayFields: ['role', 'content', 'createdAt'],
      enums: [],
      fields: [
        createField('id', 'id', 'String', true, true, false, 'cuid()'),
        createField('conversationId', 'conversationId', 'String', true),
        createField('role', 'role', 'String', true),
        createField('content', 'content', 'String', true),
        createField('toolCalls', 'toolCalls', 'String', false),
        createField('toolResults', 'toolResults', 'String', false),
        createField('tokenCount', 'tokenCount', 'Int', false),
        createField('messageIndex', 'messageIndex', 'Int', true),
        createField('parentMessageId', 'parentMessageId', 'String', false),
        createField('edited', 'edited', 'Boolean', true, false, false, 'false'),
        createField('createdAt', 'createdAt', 'DateTime', true, false, false, 'now()'),
        createField('updatedAt', 'updatedAt', 'DateTime', true, false, false, 'now()')
      ]
    },

    // 5. Sub-Agent App Users
    {
      id: 'AppUser',
      name: 'AppUser',
      description: 'Users who interact with the deployed sub-agent application',
      idField: 'id',
      displayFields: ['email', 'name', 'role'],
      enums: [],
      fields: [
        createField('id', 'id', 'String', true, true, false, 'cuid()'),
        createField('email', 'email', 'String', false, false, true),
        createField('password', 'password', 'String', false),
        createField('name', 'name', 'String', false),
        createField('role', 'role', 'UserRole', true, false, false, 'MEMBER'),
        createField('avatar', 'avatar', 'String', false),
        createField('preferences', 'preferences', 'String', false),
        createField('lastLoginAt', 'lastLoginAt', 'DateTime', false),
        createField('loginCount', 'loginCount', 'Int', true, false, false, '0'),
        createField('isActive', 'isActive', 'Boolean', true, false, false, 'true'),
        createField('createdAt', 'createdAt', 'DateTime', true, false, false, 'now()'),
        createField('updatedAt', 'updatedAt', 'DateTime', true, false, false, 'now()')
      ]
    }
  ];
}

/**
 * Merge system tables and enums into the generated Prisma schema
 */
function mergeSystemTablesIntoSchema(
  schema: string, 
  systemModels: AgentModel[], 
  systemEnums: AgentEnum[],
  enhancedBusinessModels?: AgentModel[]
): string {
  // Find the end of the existing models (before any potential extra content)
  const systemTablesSection = `

// =============================================================================
// SYSTEM ENUMS & TABLES - AUTO-GENERATED FOR SUB-AGENT FUNCTIONALITY
// These are automatically added to every agent database for:
// - Schedule execution logging and timing
// - Action execution tracking and results  
// - AI call monitoring and cost tracking
// - Database operation auditing
// - External API call logging
// - Chat conversation persistence
// - Sub-agent user management and sessions
// =============================================================================

// System Enums
${systemEnums.map(enumDef => `enum ${enumDef.name} {
${enumDef.fields.map(field => `  ${field.name}`).join('\n')}
}`).join('\n\n')}

// System Tables
${systemModels.map(model => {
  const fieldsString = model.fields.map(field => {
    let fieldDef = `  ${field.name} ${field.type}`;
    
    // Add field attributes
    if (field.isId) fieldDef += ' @id';
    if (field.unique) fieldDef += ' @unique';
    if (field.defaultValue) {
      if (field.defaultValue === 'now()') fieldDef += ' @default(now())';
      else if (field.defaultValue === 'cuid()') fieldDef += ' @default(cuid())';
      else if (field.defaultValue === 'true') fieldDef += ' @default(true)';
      else if (field.defaultValue === 'false') fieldDef += ' @default(false)';
      else if (!isNaN(Number(field.defaultValue))) fieldDef += ` @default(${field.defaultValue})`;
      else fieldDef += ` @default("${field.defaultValue}")`;
    }
    if (!field.required) fieldDef += '?';
    
    return fieldDef;
  }).join('\n');

  return `model ${model.name} {
${fieldsString}
}`;
}).join('\n\n')}

// System table relations
model ChatMessage {
  conversation ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([createdAt])
}

model ActionExecutionLog {
  scheduleExecution ScheduleExecution? @relation(fields: [scheduleExecutionId], references: [id], onDelete: Cascade)

  @@index([scheduleExecutionId])
  @@index([actionId])
  @@index([startedAt])
}

model UserSession {
  user AppUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model AiCallLog {
  conversation ChatConversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)

  @@index([conversationId])
  @@index([createdAt])
  @@index([provider])
}

model DatabaseOperationLog {
  @@index([tableName])
  @@index([operation])
  @@index([createdAt])
  @@index([triggerSource])
}

model ExternalApiCallLog {
  actionExecution ActionExecutionLog? @relation(fields: [actionExecutionId], references: [id], onDelete: Cascade)

  @@index([actionExecutionId])
  @@index([apiProvider])
  @@index([createdAt])
}

model ScheduleExecution {
  actionLogs ActionExecutionLog[]

  @@index([scheduleId])
  @@index([status])
  @@index([startedAt])
}

model ChatConversation {
  messages ChatMessage[]
  aiCalls  AiCallLog[]

  @@index([userId])
  @@index([lastActivity])
  @@index([status])
}

model AppUser {
  sessions UserSession[]

  @@index([email])
  @@index([createdAt])
  @@index([isActive])
}`;

  // Add the system tables to the end of the schema
  return schema + systemTablesSection;
}

/**
 * Execute Step 1: Database Generation
 */
export async function executeStep1DatabaseGeneration(
  input: Step1Input
): Promise<Step1Output> {
  console.log('🗄️ STEP 1: Starting SQLite database generation and schema analysis...');
  
  const { step0Analysis, existingAgent, conversationContext, command } = input;
  
  try {
    console.log('🏗️ Generating SQLite Prisma database with Step 0 context...');
    console.log(`📊 Step 0 Model Analysis: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`);
    console.log(`🔍 Model Details: ${step0Analysis.models.length} total models identified in analysis`);
    console.log(`🗄️ Target Database: SQLite (agent apps are SQLite-only)`);

    // Generate business models from Step 0 analysis
    const databaseResult = await generatePrismaDatabase({
      existingAgent,
      step0Analysis
      // Removed targetDatabaseProvider - function now defaults to SQLite internally
    });

    console.log('🛠️ Adding system tables and enums for sub-agent functionality...');
    console.log('👥 Analyzing user relationships for business models...');
    
    // Analyze and enhance business models with user relationships
    const enhancedBusinessModels = enhanceModelsWithUserRelationships(
      databaseResult.models, 
      step0Analysis
    );
    
    // Generate system tables and enums required for all sub-agents
    const systemTables = generateSystemTables();
    const systemEnums = generateSystemEnums();
    
    // Merge system tables into the schema
    const enhancedSchema = mergeSystemTablesIntoSchema(
      databaseResult.prismaSchema, 
      systemTables, 
      systemEnums,
      enhancedBusinessModels
    );
    
    // Combine enhanced business models with system models and enums
    const allModels = [...enhancedBusinessModels, ...systemTables];
    const allEnums = [...databaseResult.enums, ...systemEnums];

    const result: Step1Output = {
      enums: allEnums,
      prismaSchema: enhancedSchema,
      models: allModels,
      implementationNotes: [
        `Generated ${databaseResult.models.length} business models based on Step 0 analysis`,
        `Enhanced ${enhancedBusinessModels.filter((m: any) => m._userRelationAdded).length} models with user relationships`,
        `User access type: ${step0Analysis.userAccess?.appType || 'not specified'} with ${step0Analysis.userAccess?.userDataScoping || 'shared_data'} data scoping`,
        `Added ${systemTables.length} system tables for sub-agent functionality`,
        `Added ${systemEnums.length} system enums (UserRole: MEMBER, ADMIN)`,
        `Total models: ${allModels.length} (${enhancedBusinessModels.length} business + ${systemTables.length} system)`,
        `Total enums: ${allEnums.length} (${databaseResult.enums.length} business + ${systemEnums.length} system)`,
        `System tables include: schedule logs, action logs, chat, users with member/admin roles`,
        `Step 0 identified ${step0Analysis.models.length} required models`,
        `Database generation strategy: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`
      ]
    };

    console.log('✅ STEP 1: Database generation completed successfully');
    console.log(`🗄️ Database Summary:
- Business Models: ${databaseResult.models.length} → ${enhancedBusinessModels.length} (with user relations)
- Models with User Relations: ${enhancedBusinessModels.filter((m: any) => m._userRelationAdded).length}
- User Access: ${step0Analysis.userAccess?.appType || 'not specified'} (${step0Analysis.userAccess?.userDataScoping || 'shared_data'} scoping)
- Business Enums: ${databaseResult.enums.length}
- System Tables: ${systemTables.length}
- System Enums: ${systemEnums.length} (UserRole: MEMBER/ADMIN)
- Total Models: ${result.models.length}
- Total Enums: ${result.enums.length}
- Step 0 Model Context: ${step0Analysis.models.length} total (${step0Analysis.models.filter(m => m.operation === 'create').length} new, ${step0Analysis.models.filter(m => m.operation === 'update').length} updates)`);

    // 🚀 TRIGGER AUTO-DEPLOYMENT ASYNCHRONOUSLY
    // Deploy agent in background after database generation completes
    // Add a small delay to ensure document is properly saved before deployment
    setTimeout(() => {
      triggerAutoDeployment(existingAgent, step0Analysis, result, {
        documentId: input.documentId,
        session: input.session,
        dataStream: input.dataStream
      }).catch(error => {
        console.error('❌ Auto-deployment failed (but not blocking main process):', error);
      });
    }, 2000); // 2 second delay to ensure document is saved

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

/**
 * Trigger auto-deployment asynchronously after database generation
 */
async function triggerAutoDeployment(
  existingAgent: AgentData | undefined,
  step0Analysis: Step0Output,
  step1Result: Step1Output,
  context?: {
    documentId?: string;
    session?: any;
    dataStream?: any;
  }
): Promise<void> {
  console.log('🚀 STARTING AUTO-DEPLOYMENT after database generation...');
  
  try {
    // Only auto-deploy if we have a meaningful agent to deploy
    // Check for either existing agent ID OR document ID (for first creation) + agent name
    if ((!existingAgent?.id && !context?.documentId) || !step0Analysis.agentName) {
      console.log('⏭️ Skipping auto-deployment: insufficient agent data', {
        hasExistingAgentId: !!existingAgent?.id,
        hasDocumentId: !!context?.documentId,
        hasAgentName: !!step0Analysis.agentName
      });
      return;
    }

    // Prepare deployment configuration with proper Vercel project name sanitization
    const sanitizedProjectName = step0Analysis.agentName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-') // Replace invalid chars with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .replace(/---/g, '--') // Ensure no triple hyphens
      .substring(0, 100); // Limit to 100 characters
    
    const deploymentConfig = {
      projectName: sanitizedProjectName,
      description: step0Analysis.agentDescription || `Auto-deployed agent: ${step0Analysis.agentName}`,
      environmentVariables: {},
      region: 'aws-us-east-1' as const,
      vercelTeam: undefined
    };

    console.log(`🔧 Auto-deployment config:`, {
      projectName: deploymentConfig.projectName,
      hasAgent: !!existingAgent,
      modelCount: step1Result.models.length,
      hasContext: !!context,
      hasDocumentId: !!context?.documentId
    });

    // Create a minimal agent data structure for deployment
    // Handle first creation (no existingAgent) vs updates (with existingAgent)
    const agentForDeployment: AgentData = {
      // Use existing agent as base, or create minimal structure for first creation
      ...(existingAgent || {
        id: context?.documentId || `agent-${Date.now()}`, // Temporary ID for first creation
        name: '', // Will be overridden below
        description: '', // Will be overridden below
        domain: '', // Will be overridden below
        avatar: '',
        theme: 'default',
        visibility: 'private',
        models: [],
        actions: [],
        schedules: [],
        enums: [],
        externalApis: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          lastModifiedBy: '',
          status: 'draft',
          tags: []
        },
        createdAt: new Date().toISOString(),
        prismaSchema: '' // Will be overridden below
      }),
      // Override with Step 0 analysis and Step 1 results
      name: step0Analysis.agentName,
      description: step0Analysis.agentDescription || existingAgent?.description || '',
      domain: step0Analysis.domain || existingAgent?.domain || '',
      models: step1Result.models,
      enums: step1Result.enums,
      // Keep existing actions and schedules if they exist
      actions: existingAgent?.actions || [],
      schedules: existingAgent?.schedules || [],
      externalApis: step0Analysis.externalApis || existingAgent?.externalApis || [],
      prismaSchema: step1Result.prismaSchema
    };

    // Execute deployment (this will run in the background)
    // Note: We create minimal step outputs since we only have database info at this point
    const deploymentResult = await executeStep4VercelDeployment({
      step1Output: step1Result,
      step2Output: {
        actions: existingAgent?.actions || [],
        implementationComplexity: 'low',
        implementationNotes: 'Auto-deployment with existing actions'
      },
      step3Output: {
        schedules: existingAgent?.schedules || [],
        implementationComplexity: 'low'
      },
      projectName: deploymentConfig.projectName,
      description: deploymentConfig.description,
      environmentVariables: deploymentConfig.environmentVariables,
      vercelTeam: deploymentConfig.vercelTeam,
      documentId: context?.documentId
    });

    if (deploymentResult.deploymentUrl) {
      console.log('✅ AUTO-DEPLOYMENT SUCCESSFUL!');
      console.log(`🌐 Deployment URL: ${deploymentResult.deploymentUrl}`);
      console.log(`📦 Project ID: ${deploymentResult.projectId}`);
      console.log(`🔄 Status: ${deploymentResult.status}`);
      
      // CRITICAL FIX: Update the agent's deployment info and save to document
      if (context?.documentId && context?.session) {
        console.log('💾 Saving deployment info to document...');
        console.log('🔍 AUTO-DEPLOYMENT DEBUG - Context details:', {
          hasDocumentId: !!context.documentId,
          documentId: context.documentId,
          hasSession: !!context.session,
          hasUserId: !!context.session?.user?.id,
          deploymentUrl: deploymentResult.deploymentUrl,
          deploymentStatus: deploymentResult.status
        });
        
        try {
          // Import database functions
          const { getDocumentById, saveOrUpdateDocument } = await import('../../../../db/queries');
          
          // Get current document
          const existingDoc = await getDocumentById({ id: context.documentId });
          
          if (existingDoc) {
            console.log('📄 AUTO-DEPLOYMENT DEBUG - Found existing document:', {
              documentTitle: existingDoc.title,
              hasContent: !!existingDoc.content,
              contentLength: existingDoc.content?.length || 0
            });
            
            // Parse current agent data
            let currentAgentData: AgentData;
            try {
              currentAgentData = JSON.parse(existingDoc.content || '{}');
              console.log('📋 AUTO-DEPLOYMENT DEBUG - Parsed current agent data:', {
                hasName: !!currentAgentData.name,
                modelCount: currentAgentData.models?.length || 0,
                actionCount: currentAgentData.actions?.length || 0,
                hadPreviousDeployment: !!currentAgentData.deployment,
                previousDeploymentUrl: currentAgentData.deployment?.deploymentUrl || 'none'
              });
            } catch {
              currentAgentData = existingAgent || {} as AgentData;
              console.log('⚠️ AUTO-DEPLOYMENT DEBUG - Failed to parse existing content, using fallback');
            }
            
            // Update agent data with deployment info
            const updatedAgentData: AgentData = {
              ...currentAgentData,
              deployment: {
                deploymentId: deploymentResult.deploymentId,
                projectId: deploymentResult.projectId,
                deploymentUrl: deploymentResult.deploymentUrl,
                status: deploymentResult.status,
                apiEndpoints: deploymentResult.apiEndpoints || [],
                vercelProjectId: deploymentResult.vercelProjectId,
                deployedAt: new Date().toISOString(),
                warnings: deploymentResult.warnings || [],
                deploymentNotes: deploymentResult.deploymentNotes || []
              },
              metadata: {
                ...currentAgentData.metadata,
                updatedAt: new Date().toISOString(),
                status: 'deployed'
              }
            };
            
            console.log('🔄 AUTO-DEPLOYMENT DEBUG - Updated agent data:', {
              deploymentAdded: !!updatedAgentData.deployment,
              deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
              deploymentStatus: updatedAgentData.deployment?.status,
              hasApiEndpoints: !!updatedAgentData.deployment?.apiEndpoints?.length,
              metadataStatus: updatedAgentData.metadata?.status
            });
            
            // Save updated agent data back to document
            await saveOrUpdateDocument({
              id: context.documentId,
              title: existingDoc.title,
              content: JSON.stringify(updatedAgentData, null, 2),
              kind: existingDoc.kind,
              userId: context.session.user?.id as string,
              metadata: existingDoc.metadata
            });
            
            console.log('✅ AUTO-DEPLOYMENT: Agent data with deployment URL saved to document!');
            console.log('🔗 AUTO-DEPLOYMENT FINAL: Deployment URL is', updatedAgentData.deployment?.deploymentUrl);
            
            // Stream the updated agent data to UI if dataStream is available
            if (context.dataStream) {
              console.log('📡 Streaming updated agent data with deployment URL to UI...');
              console.log('🔍 STREAMING DEBUG - Data being streamed:', {
                type: 'agent-data',
                hasDeployment: !!updatedAgentData.deployment,
                deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
                contentLength: JSON.stringify(updatedAgentData, null, 2).length
              });
              
              // Stream the deployment notification first
              context.dataStream.writeData({ 
                type: 'deployment-complete', 
                content: {
                  deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
                  projectId: updatedAgentData.deployment?.projectId,
                  status: updatedAgentData.deployment?.status
                }
              });
              
              // Then stream the full updated agent data
              context.dataStream.writeData({ 
                type: 'agent-data', 
                content: JSON.stringify(updatedAgentData, null, 2)
              });
              
              console.log('✅ AUTO-DEPLOYMENT: Deployment data streamed to UI successfully!');
            } else {
              console.warn('⚠️ AUTO-DEPLOYMENT: No dataStream available - UI will not update immediately');
              console.warn('💡 SOLUTION: User should refresh the page to see the "View Live App" button');
            }
            
          } else {
            console.error('❌ AUTO-DEPLOYMENT: Document not found, cannot save deployment URL');
          }
          
        } catch (saveError) {
          console.error('❌ AUTO-DEPLOYMENT: Failed to save deployment URL to document:', saveError);
          // Don't throw - deployment was successful, just saving failed
        }
        
      } else {
        console.warn('⚠️ AUTO-DEPLOYMENT: No document context available, deployment URL not saved to document');
        console.warn('  - Users will not see "View Live App" button until manual deployment');
        console.warn('🔍 AUTO-DEPLOYMENT DEBUG - Missing context:', {
          hasContext: !!context,
          hasDocumentId: !!context?.documentId,
          hasSession: !!context?.session,
          documentId: context?.documentId || 'undefined',
          sessionUserId: context?.session?.user?.id || 'undefined'
        });
      }
      
    } else {
      console.error('❌ Auto-deployment failed: No deployment URL returned');
      console.error('Deployment result:', deploymentResult);
    }

  } catch (error: any) {
    console.error('❌ Auto-deployment error:', error);
    // Don't throw - we don't want to break the main generation process
  }
} 