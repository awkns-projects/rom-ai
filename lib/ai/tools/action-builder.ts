import { generateObject, type Message, tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '../providers';
import type { DataStreamWriter } from 'ai';
import { 
  type AgentAction,
  analyzeConversationContext,
  createAgentData,
  type AgentData
} from './agent-builder';

// Schemas for action components
const actionOverviewSchema = z.object({
  name: z.string(),
  description: z.string(),
  domain: z.string().describe('The business domain (e.g., e-commerce, blog, crm)'),
  workflows: z.array(z.string()).describe('Key business workflows to automate'),
  integrations: z.array(z.string()).describe('External systems or APIs to integrate with'),
});

const actionsSchema = z.object({
  actions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(['Create', 'Update']),
    schedule: z.object({
      enabled: z.boolean(),
      pattern: z.string(),
      timezone: z.string().optional(),
      active: z.boolean().optional(),
    }).optional(),
    dataSource: z.object({
      type: z.enum(['custom', 'database']),
      customFunction: z.object({
        code: z.string(),
        envVars: z.array(z.object({
          name: z.string(),
          description: z.string(),
          required: z.boolean(),
          sensitive: z.boolean(),
        })).optional(),
      }).optional(),
      database: z.object({
        models: z.array(z.object({
          id: z.string(),
          name: z.string(),
          fields: z.array(z.object({
            id: z.string(),
            name: z.string(),
          })),
          where: z.record(z.any()).optional(),
          limit: z.number().optional(),
        })),
      }).optional(),
    }),
    execute: z.object({
      type: z.enum(['code', 'prompt']),
      code: z.object({
        script: z.string(),
        envVars: z.array(z.object({
          name: z.string(),
          description: z.string(),
          required: z.boolean(),
          sensitive: z.boolean(),
        })).optional(),
      }).optional(),
      prompt: z.object({
        template: z.string(),
        model: z.string().optional(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
      }).optional(),
    }),
    results: z.object({
      actionType: z.enum(['Create', 'Update']),
      model: z.string(),
      identifierIds: z.array(z.string()).optional(),
      fields: z.record(z.any()).optional(),
      fieldsToUpdate: z.record(z.any()).optional(),
    }),
  })),
});

// Function to imagine what database models might be needed based on actions
function imagineDatabaseFromActions(actions: AgentAction[]): string[] {
  const suggestions = [];
  
  // User-related actions suggest user management tables
  if (actions.some(a => a.name.toLowerCase().includes('user') || a.description.toLowerCase().includes('user'))) {
    suggestions.push('User table with authentication fields (id, email, password, role)');
    suggestions.push('UserProfile table for extended user information');
    suggestions.push('UserSession table for session management');
  }
  
  // Content-related actions suggest content management tables
  if (actions.some(a => ['post', 'article', 'content', 'blog'].some(term => 
    a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)))) {
    suggestions.push('Post/Article table with content fields (title, content, status, publishedAt)');
    suggestions.push('Category table for content organization');
    suggestions.push('Tag table for content tagging');
  }
  
  // Order/payment actions suggest e-commerce tables
  if (actions.some(a => ['order', 'payment', 'purchase', 'cart'].some(term => 
    a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)))) {
    suggestions.push('Order table with order details (id, userId, total, status)');
    suggestions.push('Product table with product information');
    suggestions.push('Payment table for transaction records');
  }
  
  // Notification actions suggest communication tables
  if (actions.some(a => ['notification', 'email', 'alert', 'message'].some(term => 
    a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)))) {
    suggestions.push('Notification table for user notifications');
    suggestions.push('EmailQueue table for email management');
    suggestions.push('NotificationTemplate table for message templates');
  }
  
  // Analytics actions suggest tracking tables
  if (actions.some(a => ['analytics', 'tracking', 'metrics', 'report'].some(term => 
    a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)))) {
    suggestions.push('Analytics table for event tracking');
    suggestions.push('Report table for generated reports');
    suggestions.push('Metric table for system metrics');
  }
  
  // General suggestions
  suggestions.push('Audit table for system activity logging');
  suggestions.push('Configuration table for system settings');
  
  return suggestions;
}

// Convert actions to agent format
const convertToAgentFormat = (actions: any[], existingData?: any): AgentData => {
  return createAgentData(
    existingData?.name || 'Agent System',
    existingData?.description || 'Generated agent system with actions',
    existingData?.domain || '',
    existingData?.models || [],
    existingData?.enums || [],
    actions?.map((action: any) => ({
      name: action.name || 'Action',
      description: action.description || 'Generated action',
      type: action.type || 'Create',
      schedule: action.schedule || {
        enabled: false,
        pattern: '',
        timezone: 'UTC',
        active: false
      },
      dataSource: action.dataSource || {
        type: 'custom',
        customFunction: {
          code: '',
          envVars: []
        }
      },
      execute: action.execute || {
        type: 'code',
        code: {
          script: '',
          envVars: []
        }
      },
      results: action.results || {
        actionType: 'Create',
        model: '',
        identifierIds: [],
        fields: {},
        fieldsToUpdate: {}
      }
    })) || []
  );
};

export const actionBuilder = ({ 
  messages, 
  dataStream, 
  existingContext 
}: { 
  messages: Message[]; 
  dataStream: DataStreamWriter;
  existingContext?: string | null;
}) => tool({
  description: `A specialized action builder that creates intelligent automated workflows and business logic processes.
  
  This tool focuses specifically on:
  1. Workflow Automation - Creating business process automations
  2. Data Processing - Building data transformation and validation workflows
  3. Integration Logic - Connecting with external systems and APIs
  4. Business Rules - Implementing automated decision-making processes
  
  The tool analyzes the conversation context to understand requirements and can suggest what database models might be needed based on the actions.
  
  Examples:
  - "Create user registration and authentication workflow"
  - "Build order processing and fulfillment automation"
  - "Design content moderation and publishing actions"
  - "Set up notification and alert systems"
  `,
  parameters: z.object({
    command: z.string().describe('The natural language command describing what actions/workflows to build'),
    operation: z.enum(['create', 'update', 'analyze']).optional().describe('Action operation type - create new, update existing, or analyze current'),
    context: z.string().optional().describe('Current action state or database context for incremental updates'),
  }),
  execute: async ({ command, operation = 'create', context }) => {
    console.log(`⚡ Action Builder: Processing "${command}" - Operation: ${operation}`);
    
    // Don't stream initial setup - this is a sub-tool
    // dataStream.writeData({ type: 'kind', content: 'agent' });
    // dataStream.writeData({ type: 'title', content: 'Agent Builder' });
    // dataStream.writeData({ type: 'clear', content: '' });

    try {
      // Analyze conversation context
      const conversationContext = analyzeConversationContext(messages);
      console.log('📋 Conversation context analyzed:', conversationContext.length, 'characters');

      // Parse existing context if provided
      let existingContext: any = {};
      if (context) {
        try {
          existingContext = JSON.parse(context);
          console.log('✅ Successfully parsed existing context');
        } catch (e) {
          console.warn('⚠️ Failed to parse context, starting fresh:', e);
          existingContext = {};
        }
      }

      // Step 1: Action Overview & Planning
      console.log('📋 Step 1: Action Architecture Planning');

      const overview = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: actionOverviewSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a senior workflow automation architect with expertise in business process design and system integration.

CONVERSATION CONTEXT:
${conversationContext}

TASK: Analyze the conversation and user request to create a comprehensive action automation plan.

REQUEST: "${command}"
OPERATION: ${operation}
EXISTING CONTEXT: ${JSON.stringify(existingContext)}

Your analysis should:
1. Identify the core business domain and workflow requirements
2. Extract key business processes that need automation
3. Understand integration points with external systems
4. Plan for scalability, reliability, and maintainability
5. Consider the specific operation type (create/update/analyze)

Focus on understanding the business workflows thoroughly. Consider:
- User-facing workflows (registration, checkout, content creation)
- Background processes (data processing, notifications, cleanup)
- Integration workflows (API calls, data synchronization)
- Business rule enforcement (validation, approval processes)
- Monitoring and alerting needs

Provide a clear, professional action overview that serves as the foundation for workflow implementation.`
          }
        ],
        temperature: 0.2,
      });

      console.log('✅ Action overview generated:', JSON.stringify(overview.object, null, 2));

      // Step 2: Automated Actions
      console.log('⚡ Step 2: Creating Automated Actions');

      const actions = await generateObject({
        model: myProvider.languageModel('artifact-model'),
        schema: actionsSchema,
        messages: [
          {
            role: 'system' as const,
            content: `You are a workflow automation expert and business process architect with deep knowledge of modern automation patterns.

CONVERSATION CONTEXT:
${conversationContext}

ACTION OVERVIEW:
- System: ${overview.object.name}
- Domain: ${overview.object.domain}
- Description: ${overview.object.description}
- Key Workflows: ${overview.object.workflows.join(', ')}
- Integrations: ${overview.object.integrations.join(', ')}

EXISTING CONTEXT: ${JSON.stringify(existingContext)}

TASK: Design intelligent automated actions that bring business workflows to life.

Requirements:
1. Create actions for each workflow identified in the overview
2. Design data validation and processing automations
3. Build notification and communication workflows
4. Create integration points for external systems
5. Implement business rule enforcement and decision logic
6. Add monitoring, analytics, and maintenance actions

Action Types to Consider:
- User onboarding and authentication flows
- Data processing and transformation workflows
- Status updates and state transition management
- Scheduled maintenance and cleanup routines
- Real-time notifications and alert systems
- Integration with external APIs and services
- Business intelligence and reporting automation
- Content management and moderation workflows
- E-commerce order processing and fulfillment
- Customer support and ticketing automation

Technical Guidelines:
- Use realistic data sources (database queries or custom functions)
- Implement proper error handling and validation logic
- Design for scalability and performance under load
- Include both scheduled and event-driven actions
- Use appropriate execution methods (code scripts or AI prompts)
- Target realistic models for results (consider database structure)
- Consider security, permissions, and data privacy
- Make each action production-ready with clear business value

For Database Sources:
- Query relevant tables based on the business logic
- Use proper WHERE clauses for filtering
- Consider performance with appropriate LIMIT clauses
- Select only necessary fields to optimize queries

For Code Execution:
- Write clean, maintainable JavaScript/TypeScript code
- Include proper error handling and logging
- Use environment variables for sensitive configuration
- Implement retry logic for external API calls

For AI Prompt Execution:
- Create clear, specific prompts for the desired outcome
- Use appropriate temperature settings (0.1-0.3 for factual, 0.7-0.9 for creative)
- Set reasonable maxTokens limits
- Include context and examples in prompts

Make each action a complete, production-ready automation with clear business value and technical implementation details.`
          }
        ],
        temperature: 0.4,
      });

      console.log('✅ Actions generated:', JSON.stringify(actions.object, null, 2));

      // Generate database suggestions based on action structure
      const databaseSuggestions = imagineDatabaseFromActions(actions.object.actions);
      console.log('💡 Generated database suggestions:', databaseSuggestions);

      // Combine all results
      const finalActions = {
        name: overview.object.name,
        description: overview.object.description,
        domain: overview.object.domain,
        actions: actions.object.actions,
        createdAt: new Date().toISOString(),
        metadata: {
          overview: overview.object,
          actionCount: actions.object.actions.length,
          scheduledActions: actions.object.actions.filter(a => a.schedule?.enabled).length,
          codeActions: actions.object.actions.filter(a => a.execute.type === 'code').length,
          promptActions: actions.object.actions.filter(a => a.execute.type === 'prompt').length,
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          operation: operation,
          databaseSuggestions: databaseSuggestions
        }
      };

      console.log('🎉 Final action system assembled:', JSON.stringify(finalActions, null, 2));

      // Stream final actions in agent format
      const agentData = convertToAgentFormat(finalActions.actions || [], existingContext);
      
      // Don't stream data - this is a sub-tool, return the data
      // dataStream.writeData({
      //   type: 'agent-data',
      //   content: JSON.stringify(agentData)
      // });

      // dataStream.writeData({ type: 'finish', content: '' });

      const result = {
        success: true,
        message: `🎉 Successfully built action system for ${overview.object.name}! Created ${actions.object.actions.length} automated workflows for your ${overview.object.domain} system. Consider these database models: ${databaseSuggestions.slice(0, 3).join(', ')}`,
        data: agentData,
        databaseSuggestions: databaseSuggestions,
        steps: {
          overview: overview.object,
          actions: actions.object,
        }
      };

      console.log('📤 Returning action result:', JSON.stringify(result, null, 2));
      
      return result;
      
    } catch (error) {
      console.error('💥 Action builder execution failed:', error);
      
      const errorData = createAgentData(
        'Error Action System',
        'Failed to generate action workflows',
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