import { generateObject, type Message, tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '../providers';
import type { DataStreamWriter } from 'ai';
import { databaseBuilder } from './database-builder';
import { actionBuilder } from './action-builder';

// Shared interfaces
export interface AgentModel {
  id: string;
  name: string;
  idField: string;
  displayFields: string[];
  fields: AgentField[];
}

export interface AgentField {
  id: string;
  name: string;
  type: string;
  isId: boolean;
  unique: boolean;
  list: boolean;
  required: boolean;
  kind: 'scalar' | 'object' | 'enum';
  relationField: boolean;
  title: string;
  sort: boolean;
  order: number;
  defaultValue?: string;
}

export interface AgentEnum {
  id: string;
  name: string;
  fields: AgentEnumField[];
}

export interface AgentEnumField {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
}

export interface AgentAction {
  name: string;
  description: string;
  type: 'Create' | 'Update';
  schedule?: {
    enabled: boolean;
    pattern: string;
    timezone?: string;
    active?: boolean;
  };
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: DatabaseModel[];
    };
  };
  execute: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: EnvVar[];
    };
    prompt?: {
      template: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
}

export interface DatabaseModel {
  id: string;
  name: string;
  fields: DatabaseField[];
  where?: Record<string, any>;
  limit?: number;
}

export interface DatabaseField {
  id: string;
  name: string;
}

export interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
}

export interface AgentData {
  name: string;
  description: string;
  domain: string;
  models: AgentModel[];
  enums: AgentEnum[];
  actions: AgentAction[];
  createdAt: string;
}

// Shared utility functions
export function generateNewId(type: string, existingEntities: any[]): string {
  const prefixMap: Record<string, string> = {
    'model': 'mdl',
    'field': 'fld',
    'enum': 'enm',
    'enumField': 'enf',
    'action': 'act'
  };
  
  const prefix = prefixMap[type] || type.charAt(0);
  
  // Find the highest existing ID number
  const highestId = existingEntities.reduce((max, entity) => {
    if (entity.id?.startsWith(prefix)) {
      const idNumber = Number.parseInt(entity.id.slice(prefix.length), 10);
      return Number.isNaN(idNumber) ? max : Math.max(max, idNumber);
    }
    return max;
  }, 0);
  
  // Return the next ID in sequence
  return `${prefix}${highestId + 1}`;
}

export function analyzeConversationContext(messages: Message[]): string {
  const conversationContext = messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => {
      if (typeof msg.content === 'string') {
        return `${msg.role}: ${msg.content}`;
      } else {
        return `${msg.role}: [complex content]`;
      }
    })
    .slice(-10) // Last 10 messages for context
    .join('\n');

  return conversationContext;
}

export function createAgentData(
  name: string,
  description: string,
  domain: string,
  models: AgentModel[] = [],
  enums: AgentEnum[] = [],
  actions: AgentAction[] = []
): AgentData {
  return {
    name,
    description,
    domain,
    models,
    enums,
    actions,
    createdAt: new Date().toISOString()
  };
}

// Schema for agent overview
const agentOverviewSchema = z.object({
  name: z.string(),
  description: z.string(),
  domain: z.string().describe('The business domain (e.g., e-commerce, blog, crm)'),
  requirements: z.array(z.string()).describe('Key functional requirements'),
  features: z.array(z.string()).describe('Main features and capabilities'),
  architecture: z.string().describe('High-level architecture approach'),
});

export const agentBuilder = ({ 
  messages, 
  dataStream, 
  existingContext 
}: { 
  messages: Message[]; 
  dataStream: DataStreamWriter;
  existingContext?: string | null;
}) => tool({
  description: `A comprehensive AI agent builder that creates complete application systems with database schemas and automated workflows.
  
  This is the main orchestrator tool that:
  1. Analyzes requirements and creates system architecture
  2. Coordinates database schema creation (models, fields, enums)
  3. Coordinates action/workflow creation (business logic, automations)
  4. Produces a complete, integrated agent system
  
  The tool creates enterprise-grade applications with proper data modeling and intelligent automation.
  
  Examples:
  - "Build a complete e-commerce system with product management and order processing"
  - "Create a blog platform with user management and content workflows"
  - "Design a CRM system with customer tracking and automated communications"
  `,
  parameters: z.object({
    command: z.string().describe('High-level description of the agent system to build'),
    operation: z.enum(['create', 'update', 'extend']).optional().default('create').describe('Whether to create new, update existing, or extend current agent system'),
    context: z.string().optional().describe('Existing agent context to build upon')
  }),
  execute: async ({ command, operation = 'create', context }) => {
    console.log(`🤖 Agent Builder: Processing "${command}" - Operation: ${operation}`);
    
    // Stream initial setup
    dataStream.writeData({ type: 'kind', content: 'agent' });
    dataStream.writeData({ type: 'title', content: 'Agent Builder' });
    dataStream.writeData({ type: 'clear', content: '' });

    try {
      // Analyze conversation context
      const conversationContext = analyzeConversationContext(messages);
      console.log('📋 Conversation context analyzed:', conversationContext.length, 'characters');

      // Parse existing context - prioritize passed context, then existingContext from conversation
      let existingAgent: AgentData | null = null;
      const contextToUse = context || existingContext;
      
      if (contextToUse) {
        try {
          existingAgent = JSON.parse(contextToUse);
          console.log('✅ Successfully parsed existing agent context');
          console.log('📊 Existing agent data:', JSON.stringify(existingAgent, null, 2));
        } catch (e) {
          console.warn('⚠️ Failed to parse context, starting fresh:', e);
          existingAgent = null;
        }
      }

      // Step 1: System Overview & Architecture Planning
      console.log('🏗️ Step 1: System Architecture Planning');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'overview', 
          status: 'processing',
          message: 'Analyzing requirements and designing system architecture...'
        })
      });

      const overview = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: agentOverviewSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a senior system architect with expertise in designing complete application systems.

CONVERSATION CONTEXT:
${conversationContext}

TASK: ${existingAgent ? 'Analyze the conversation and user request to update/extend the existing agent system.' : 'Analyze the conversation and user request to create a comprehensive system architecture plan.'}

REQUEST: "${command}"
OPERATION: ${operation}
EXISTING AGENT: ${existingAgent ? JSON.stringify(existingAgent, null, 2) : 'None'}

${existingAgent ? `
EXISTING SYSTEM ANALYSIS:
- Current Name: ${existingAgent.name}
- Current Domain: ${existingAgent.domain}
- Current Models: ${existingAgent.models.length} (${existingAgent.models.map(m => m.name).join(', ')})
- Current Enums: ${existingAgent.enums.length} (${existingAgent.enums.map(e => e.name).join(', ')})
- Current Actions: ${existingAgent.actions.length} (${existingAgent.actions.map(a => a.name).join(', ')})

When updating/extending:
1. Preserve existing functionality and data structures
2. Build upon the current system architecture
3. Ensure compatibility with existing models and workflows
4. Focus on the specific improvements or additions requested
5. Maintain consistency with the existing domain and naming conventions
` : `
Your analysis should:
1. Identify the core business domain and system requirements
2. Define the main features and capabilities needed
3. Plan the overall architecture approach
4. Consider scalability, security, and maintainability
5. Understand data requirements and business workflows
6. Plan for user experience and system integration
`}

Focus on creating a ${existingAgent ? 'comprehensive update plan' : 'complete system overview'} that will guide both database design and workflow automation.

Consider these aspects:
- User management and authentication
- Core business entities and data models
- Business processes and workflows
- Integration requirements
- Performance and scalability needs
- Security and compliance requirements

${existingAgent ? 
  'Provide a clear update plan that enhances the existing system while maintaining backward compatibility.' :
  'Provide a clear, comprehensive system overview that serves as the foundation for building a complete application.'
}`
          }
        ],
        temperature: 0.2,
      });

      console.log('✅ System overview generated:', JSON.stringify(overview.object, null, 2));
      
      dataStream.writeData({
        type: 'agent-step', 
        content: JSON.stringify({ 
          step: 'overview', 
          status: 'complete', 
          data: overview.object,
          message: `System architecture planned: ${overview.object.name} - ${overview.object.description}`
        })
      });

      // Step 2: Database Schema Creation
      console.log('🗄️ Step 2: Creating Database Schema');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'models', 
          status: 'processing',
          message: 'Building database models, fields, and relationships...'
        })
      });

      // Use database builder as a sub-tool
      const databaseResult = await (databaseBuilder({ messages, dataStream }) as any).execute({
        command: `Create database schema for: ${overview.object.name}. Domain: ${overview.object.domain}. Requirements: ${overview.object.requirements.join(', ')}. Features: ${overview.object.features.join(', ')}`,
        operation,
        context: existingAgent ? JSON.stringify({
          models: existingAgent.models,
          enums: existingAgent.enums
        }) : undefined
      });

      console.log('✅ Database schema created:', databaseResult.success);

      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'models', 
          status: databaseResult.success ? 'complete' : 'error',
          data: databaseResult.data,
          message: databaseResult.message
        })
      });

      // Step 3: Action/Workflow Creation
      console.log('⚡ Step 3: Creating Actions and Workflows');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'actions', 
          status: 'processing',
          message: 'Building intelligent workflows and business automation...'
        })
      });

      // Use action builder as a sub-tool
      const actionResult = await (actionBuilder({ messages, dataStream }) as any).execute({
        command: `Create workflows for: ${overview.object.name}. Domain: ${overview.object.domain}. Features: ${overview.object.features.join(', ')}. Database context: ${JSON.stringify(databaseResult.data)}`,
        operation,
        context: existingAgent ? JSON.stringify({
          actions: existingAgent.actions,
          models: databaseResult.data?.models || existingAgent.models
        }) : JSON.stringify({
          models: databaseResult.data?.models || []
        })
      });

      console.log('✅ Actions and workflows created:', actionResult.success);

      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'actions', 
          status: actionResult.success ? 'complete' : 'error',
          data: actionResult.data,
          message: actionResult.message
        })
      });

      // Step 4: Final Integration
      console.log('🔧 Step 4: Final System Integration');
      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'integration', 
          status: 'processing',
          message: 'Integrating components and finalizing system...'
        })
      });

      // Combine all results into final agent data
      let finalAgent: AgentData;
      
      if (existingAgent && operation !== 'create') {
        // Merge with existing agent data
        console.log('🔄 Merging with existing agent data...');
        finalAgent = {
          ...existingAgent,
          name: overview.object.name || existingAgent.name,
          description: overview.object.description || existingAgent.description,
          domain: overview.object.domain || existingAgent.domain,
          models: [
            ...existingAgent.models,
            ...(databaseResult.data?.models || []).filter((newModel: AgentModel) => 
              !existingAgent.models.some(existing => existing.name === newModel.name)
            )
          ],
          enums: [
            ...existingAgent.enums,
            ...(databaseResult.data?.enums || []).filter((newEnum: AgentEnum) => 
              !existingAgent.enums.some(existing => existing.name === newEnum.name)
            )
          ],
          actions: [
            ...existingAgent.actions,
            ...(actionResult.data?.actions || []).filter((newAction: AgentAction) => 
              !existingAgent.actions.some(existing => existing.name === newAction.name)
            )
          ],
          createdAt: existingAgent.createdAt // Keep original creation date
        };
        console.log('✅ Merged agent data successfully');
      } else {
        // Create new agent data
        console.log('🆕 Creating new agent data...');
        finalAgent = createAgentData(
          overview.object.name,
          overview.object.description,
          overview.object.domain,
          databaseResult.data?.models || [],
          databaseResult.data?.enums || [],
          actionResult.data?.actions || []
        );
      }

      console.log('🎉 Final agent system assembled:', JSON.stringify(finalAgent, null, 2));

      dataStream.writeData({
        type: 'agent-step',
        content: JSON.stringify({ 
          step: 'integration', 
          status: 'complete',
          data: finalAgent,
          message: `System integration complete: ${finalAgent.models.length} models, ${finalAgent.enums.length} enums, ${finalAgent.actions.length} actions`
        })
      });

      // Stream final agent data
      dataStream.writeData({
        type: 'agent-data',
        content: JSON.stringify(finalAgent)
      });

      dataStream.writeData({ type: 'finish', content: '' });

      const result = {
        success: true,
        message: existingAgent && operation !== 'create' 
          ? `🔄 Successfully updated agent system: ${finalAgent.name}! Now has ${finalAgent.models.length} database models, ${finalAgent.enums.length} enums, and ${finalAgent.actions.length} automated workflows.`
          : `🎉 Successfully built complete agent system: ${overview.object.name}! Created ${finalAgent.models.length} database models, ${finalAgent.enums.length} enums, and ${finalAgent.actions.length} automated workflows for your ${overview.object.domain} system.`,
        data: finalAgent,
        steps: {
          overview: overview.object,
          database: databaseResult.data,
          actions: actionResult.data,
        }
      };

      console.log('📤 Returning agent result:', JSON.stringify(result, null, 2));
      
      return result;
      
    } catch (error) {
      console.error('💥 Agent builder execution failed:', error);
      
      const errorData = createAgentData(
        'Error Agent System',
        'Failed to generate complete agent system',
        '',
        [],
        [],
        []
      );

      // Stream error in agent format
      dataStream.writeData({
        type: 'agent-data',
        content: JSON.stringify({
          ...errorData,
          error: (error as Error).message || 'Unknown error'
        })
      });

      dataStream.writeData({ type: 'finish', content: '' });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        data: errorData
      };
    }
  },
});
