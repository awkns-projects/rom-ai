import { generateObject, type Message, tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '../providers';
import type { DataStreamWriter } from 'ai';
import { 
  type AgentModel, 
  type AgentEnum, 
  analyzeConversationContext,
  createAgentData,
  type AgentData
} from './agent-builder';

// Schemas for database components
const databaseOverviewSchema = z.object({
  name: z.string(),
  description: z.string(),
  domain: z.string().describe('The business domain (e.g., e-commerce, blog, crm)'),
  entities: z.array(z.string()).describe('Main entities to model in the database'),
  relationships: z.array(z.string()).describe('Key relationships between entities'),
});

const modelsSchema = z.object({
  models: z.array(z.object({
    id: z.string(),
    name: z.string(),
    idField: z.string(),
    displayFields: z.array(z.string()),
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      isId: z.boolean(),
      unique: z.boolean(),
      list: z.boolean(),
      required: z.boolean(),
      kind: z.enum(['scalar', 'object', 'enum']),
      relationField: z.boolean(),
      title: z.string(),
      sort: z.boolean(),
      order: z.number(),
      defaultValue: z.string().optional(),
    })),
  })),
});

const enumsSchema = z.object({
  enums: z.array(z.object({
    id: z.string(),
    name: z.string(),
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      defaultValue: z.string().optional(),
    })),
  })),
});

// Function to imagine what actions might be needed based on database structure
function imagineActionsFromDatabase(models: AgentModel[], enums: AgentEnum[]): string[] {
  const suggestions = [];
  
  // User management actions
  if (models.some(m => m.name.toLowerCase().includes('user'))) {
    suggestions.push('User registration and authentication workflow');
    suggestions.push('User profile management and updates');
    suggestions.push('Password reset and email verification');
  }
  
  // Content management actions
  if (models.some(m => ['post', 'article', 'content', 'blog'].some(term => m.name.toLowerCase().includes(term)))) {
    suggestions.push('Content creation and publishing workflow');
    suggestions.push('Content moderation and approval process');
    suggestions.push('SEO optimization and metadata generation');
  }
  
  // E-commerce actions
  if (models.some(m => ['order', 'product', 'payment', 'cart'].some(term => m.name.toLowerCase().includes(term)))) {
    suggestions.push('Order processing and fulfillment');
    suggestions.push('Inventory management and stock alerts');
    suggestions.push('Payment processing and invoice generation');
  }
  
  // Status-based actions from enums
  enums.forEach(enumDef => {
    if (enumDef.fields.some(f => ['PENDING', 'APPROVED', 'REJECTED'].includes(f.name))) {
      suggestions.push(`Automated ${enumDef.name.toLowerCase()} status transitions`);
    }
    if (enumDef.fields.some(f => ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(f.name))) {
      suggestions.push(`${enumDef.name.toLowerCase()} lifecycle management`);
    }
  });
  
  // Data maintenance actions
  suggestions.push('Data validation and cleanup routines');
  suggestions.push('Automated backup and archival processes');
  suggestions.push('Analytics and reporting generation');
  
  return suggestions;
}

// Convert database schema to agent format
const convertToAgentFormat = (schema: any): AgentData => {
  return createAgentData(
    schema.name || 'Database Schema',
    schema.description || 'Generated database schema',
    schema.domain || '',
    schema.models?.map((model: any) => ({
      id: model.id || model.name?.toLowerCase() || 'model',
      name: model.name || 'Model',
      idField: model.idField || 'id',
      displayFields: model.displayFields || [],
      fields: model.fields?.map((field: any) => ({
        id: field.id || field.name?.toLowerCase() || 'field',
        name: field.name || 'Field',
        type: field.type || 'String',
        isId: field.isId || false,
        unique: field.unique || false,
        list: field.list || false,
        required: field.required || false,
        kind: field.kind || 'scalar',
        relationField: field.relationField || false,
        title: field.title || field.name || 'Field',
        sort: field.sort || false,
        order: field.order || 0,
        defaultValue: field.defaultValue
      })) || []
    })) || [],
    schema.enums?.map((enumItem: any) => ({
      id: enumItem.id || enumItem.name?.toLowerCase() || 'enum',
      name: enumItem.name || 'Enum',
      fields: enumItem.fields?.map((field: any) => ({
        id: field.id || field.name?.toLowerCase() || 'field',
        name: field.name || 'Field',
        type: field.type || 'String',
        defaultValue: field.defaultValue
      })) || []
    })) || [],
    [] // Database builder doesn't create actions
  );
};

export const databaseBuilder = ({ messages, dataStream }: { messages: Message[]; dataStream: DataStreamWriter }) => tool({
  description: `A specialized database builder that creates comprehensive database schemas with models, relationships, and enumerations. 
  
  This tool focuses specifically on:
  1. Database Architecture - Planning the data structure and relationships
  2. Entity Models - Creating tables with proper fields, constraints, and relationships
  3. Enumerations - Defining controlled vocabularies for data consistency
  4. Schema Optimization - Ensuring performance, scalability, and maintainability
  
  The tool analyzes the conversation context to understand requirements and can suggest what actions might be needed based on the database structure.
  
  Examples:
  - "Create database tables for a blog system"
  - "Design user management database schema"
  - "Build e-commerce product and order tables"
  - "Add enum types for status management"
  `,
  parameters: z.object({
    command: z.string().describe('The natural language command describing what database schema to build'),
    operation: z.enum(['create', 'update', 'analyze']).optional().describe('Database operation type - create new, update existing, or analyze current'),
    context: z.string().optional().describe('Current database state for incremental updates'),
  }),
  execute: async ({ command, operation = 'create', context }) => {
    console.log(`🗄️ Database Builder: Processing "${command}" - Operation: ${operation}`);
    
    // Don't stream initial setup - this is a sub-tool
    // dataStream.writeData({ type: 'kind', content: 'agent' });
    // dataStream.writeData({ type: 'title', content: 'Agent Builder' });
    // dataStream.writeData({ type: 'clear', content: '' });

    try {
      // Analyze conversation context
      const conversationContext = analyzeConversationContext(messages);
      console.log('📋 Conversation context analyzed:', conversationContext.length, 'characters');

      // Parse existing context if provided
      let existingDatabase: any = {};
      if (context) {
        try {
          existingDatabase = JSON.parse(context);
          console.log('✅ Successfully parsed existing database context');
        } catch (e) {
          console.warn('⚠️ Failed to parse context, starting fresh:', e);
          existingDatabase = {};
        }
      }

      // Step 1: Database Overview & Planning
      console.log('📋 Step 1: Database Architecture Planning');

      const overview = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: databaseOverviewSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a senior database architect with expertise in modern application design and data modeling.

CONVERSATION CONTEXT:
${conversationContext}

TASK: Analyze the conversation and user request to create a comprehensive database architecture plan.

REQUEST: "${command}"
OPERATION: ${operation}
EXISTING DATABASE: ${JSON.stringify(existingDatabase)}

Your analysis should:
1. Identify the core business domain and data requirements
2. Extract key entities that need to be modeled as database tables
3. Understand the relationships between entities
4. Plan for scalability, performance, and data integrity
5. Consider the specific operation type (create/update/analyze)

Focus on understanding the data requirements thoroughly. Consider:
- Primary entities and their attributes
- Relationships (one-to-one, one-to-many, many-to-many)
- Data constraints and validation needs
- Performance considerations
- Future extensibility

Provide a clear, professional database overview that serves as the foundation for schema implementation.`
          }
        ],
        temperature: 0.2,
      });

      console.log('✅ Database overview generated:', JSON.stringify(overview.object, null, 2));

      // Step 2: Database Models
      console.log('🗄️ Step 2: Creating Database Models');

      const models = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: modelsSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a database architect specializing in relational database design and modern application patterns.

CONVERSATION CONTEXT:
${conversationContext}

DATABASE OVERVIEW:
- System: ${overview.object.name}
- Domain: ${overview.object.domain}
- Description: ${overview.object.description}
- Key Entities: ${overview.object.entities.join(', ')}
- Relationships: ${overview.object.relationships.join(', ')}

TASK: Design comprehensive database models (tables) for this system.

Requirements:
1. Create models for each entity identified in the overview
2. Include standard audit fields (id, createdAt, updatedAt, deleted, deletedAt)
3. Design proper relationships between entities using foreign keys
4. Use appropriate field types and constraints
5. Consider performance and scalability
6. Include UI metadata for admin interfaces
7. Handle the ${operation} operation appropriately

Technical Guidelines:
- Use these ID patterns: Models (mdl1, mdl2, etc.), Fields (fld1, fld2, etc.)
- Always include a unique ID field as the primary key (usually 'id' of type String)
- Add created/updated timestamps for audit trails (createdAt, updatedAt of type DateTime)
- Consider soft deletes with deleted/deletedAt fields (Boolean and DateTime)
- Use proper data types (String, Int, Float, Boolean, DateTime, Json, Bytes)
- Set appropriate constraints (required, unique, list for arrays)
- Design for normalization while considering query performance
- Use meaningful field names and titles for UI display

Data Types to Use:
- String: for text fields, IDs, names, descriptions
- Int: for numbers, counts, quantities
- Float: for decimal numbers, prices, percentages
- Boolean: for flags, status indicators
- DateTime: for timestamps, dates
- Json: for flexible structured data
- Bytes: for binary data, files

Make the models production-ready and enterprise-grade with proper indexing considerations.`
          }
        ],
        temperature: 0.3,
      });

      console.log('✅ Database models generated:', JSON.stringify(models.object, null, 2));

      // Step 3: Enumerations
      console.log('🔢 Step 3: Creating Enumerations');

      const enums = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: enumsSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a data modeling expert specializing in controlled vocabularies and data consistency.

CONVERSATION CONTEXT:
${conversationContext}

DATABASE CONTEXT:
- System: ${overview.object.name} (${overview.object.domain})
- Models Created: ${models.object.models.map(m => m.name).join(', ')}
- Model Fields: ${models.object.models.map(m => m.fields.map(f => `${m.name}.${f.name}`).join(', ')).join(' | ')}

TASK: Create comprehensive enumerations for controlled vocabularies.

Requirements:
1. Analyze the models to identify fields that need controlled values
2. Create enums for status fields (ACTIVE, INACTIVE, PENDING, DRAFT, PUBLISHED, etc.)
3. Define role and permission enumerations
4. Add category and classification enums
5. Include any domain-specific controlled vocabularies
6. Consider workflow states and business process statuses

Technical Guidelines:
- Use ID pattern: enm1, enm2, etc. for enum IDs
- Use enumField pattern: enf1, enf2, etc. for enum field IDs
- Use UPPERCASE values for enum fields (ACTIVE, PENDING, CANCELLED)
- Ensure enum values are meaningful and self-documenting
- Consider future extensibility
- Group related values logically
- Use String type for all enum field types

Focus on creating enums that will be actually used by the models and provide real value for data consistency and business logic.`
          }
        ],
        temperature: 0.3,
      });

      console.log('✅ Database enums generated:', JSON.stringify(enums.object, null, 2));

      // Generate action suggestions based on database structure
      const actionSuggestions = imagineActionsFromDatabase(models.object.models, enums.object.enums);
      console.log('💡 Generated action suggestions:', actionSuggestions);

      // Combine all results
      const finalDatabase = {
        name: overview.object.name,
        description: overview.object.description,
        domain: overview.object.domain,
        models: models.object.models,
        enums: enums.object.enums,
        createdAt: new Date().toISOString(),
        metadata: {
          overview: overview.object,
          modelCount: models.object.models.length,
          enumCount: enums.object.enums.length,
          totalFields: models.object.models.reduce((sum, model) => sum + model.fields.length, 0),
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          operation: operation,
          actionSuggestions: actionSuggestions
        }
      };

      console.log('🎉 Final database schema assembled:', JSON.stringify(finalDatabase, null, 2));

      // Stream final database schema in agent format
      const agentData = convertToAgentFormat(finalDatabase);
      
      // Don't stream data - this is a sub-tool, return the data
      // dataStream.writeData({
      //   type: 'agent-data',
      //   content: JSON.stringify(agentData)
      // });

      // dataStream.writeData({ type: 'finish', content: '' });

      const result = {
        success: true,
        message: `🎉 Successfully built database schema for ${overview.object.name}! Created ${models.object.models.length} models and ${enums.object.enums.length} enums for your ${overview.object.domain} system. Consider these actions: ${actionSuggestions.slice(0, 3).join(', ')}`,
        data: agentData,
        actionSuggestions: actionSuggestions,
        steps: {
          overview: overview.object,
          models: models.object,
          enums: enums.object,
        }
      };

      console.log('📤 Returning database result:', JSON.stringify(result, null, 2));
      
      return result;
      
    } catch (error) {
      console.error('💥 Database builder execution failed:', error);
      
      const errorData = createAgentData(
        'Error Database',
        'Failed to generate database schema',
        '',
        [],
        [],
        []
      );

      // Don't stream error - this is a sub-tool, return the error
      // dataStream.writeData({
      //   type: 'agent-data',
      //   content: JSON.stringify({
      //     ...errorData,
      //     error: (error as Error).message || 'Unknown error'
      //   })
      // });

      // dataStream.writeData({ type: 'finish', content: '' });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        data: errorData
      };
    }
  },
}); 