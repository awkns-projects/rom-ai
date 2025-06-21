import type { 
  AgentData, 
  AgentModel, 
  AgentAction, 
  AgentSchedule,
  AgentField,
  AgentEnum
} from './types';
import { generateNewId } from './utils';
import { generateUUID } from '../../../utils';

/**
 * Creates complete agent data structure - matching old implementation signature
 * @param name - Agent name
 * @param description - Agent description
 * @param domain - Business domain
 * @param models - Database models
 * @param enums - Database enums
 * @param actions - Agent actions
 * @param schedules - Agent schedules
 * @param metadata - Additional metadata for the agent
 * @returns Complete agent data structure
 */
export function createAgentData(
  name: string,
  description: string,
  domain: string,
  models: AgentModel[] = [],
  enums: AgentEnum[] = [],
  actions: AgentAction[] = [],
  schedules: AgentSchedule[] = [],
  metadata?: any
): AgentData {
  return {
    id: generateUUID(),
    name,
    description,
    domain,
    models,
    enums,
    actions,
    schedules,
    createdAt: new Date().toISOString(),
    metadata
  };
}

/**
 * Generates success message for agent creation/update
 * @param agent - Agent data
 * @param isUpdate - Whether this was an update operation
 * @returns Success message
 */
export function generateSuccessMessage(
  agentData: AgentData, 
  isUpdating: boolean = false,
  decision?: any
): string {
  if (decision) {
    // Generate appropriate success message based on decision
    if (decision.needsFullAgent) {
      return `🎉 Successfully ${isUpdating ? 'updated' : 'created'} ${agentData.name}! Your complete ${agentData.domain} system includes ${agentData.models.length} database models, ${agentData.actions.length} automated workflows, and ${agentData.schedules.length} scheduled tasks.`;
    } else if (decision.needsDatabase && decision.needsActions) {
      return `🎉 Successfully built database and workflows for ${agentData.name}! Added ${agentData.models.length} models, ${agentData.actions.length} actions, and ${agentData.schedules.length} schedules.`;
    } else if (decision.needsDatabase) {
      return `🗄️ Successfully designed database schema for ${agentData.name}! Created ${agentData.models.length} models.`;
    } else if (decision.needsActions) {
      return `⚡ Successfully created workflows for ${agentData.name}! Built ${agentData.actions.length} automated actions and ${agentData.schedules.length} schedules.`;
    } else {
      return `✅ Successfully analyzed and updated ${agentData.name}!`;
    }
  }

  // Fallback to original logic
  const action = isUpdating ? 'updated' : 'created';
  const components = [];
  
  if (agentData.models.length > 0) {
    components.push(`${agentData.models.length} database models`);
  }
  
  if (agentData.actions.length > 0) {
    components.push(`${agentData.actions.length} automated actions`);
  }
  
  if (agentData.schedules.length > 0) {
    components.push(`${agentData.schedules.length} scheduled tasks`);
  }
  
  const componentText = components.length > 0 
    ? ` with ${components.join(', ')}`
    : '';
  
  return `🎉 Successfully ${action} ${agentData.name}${componentText}!`;
}

/**
 * Generates error message for failed agent operations
 * @param error - Error that occurred
 * @param operation - Operation that failed
 * @returns Error message
 */
export function generateErrorMessage(error: any, operation: string): string {
  const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
  
  return `❌ **Agent Builder Error**\n\n` +
    `**Operation:** ${operation}\n` +
    `**Error:** ${errorMessage}\n\n` +
    `Please try again or contact support if the issue persists.`;
}

/**
 * Creates agent result object for API responses
 * @param documentId - Document ID
 * @param title - Result title
 * @param content - Result content
 * @param kind - Document kind
 * @returns Agent result object
 */
export function createAgentResult(
  documentId: string,
  title: string,
  content: string,
  kind: string = 'agent'
) {
  return {
    documentId,
    title,
    kind,
    content
  };
}

/**
 * Logs agent data for debugging
 * @param agent - Agent data to log
 * @param operation - Operation being performed
 */
export function logAgentData(agent: AgentData, operation: string): void {
  console.log(`📋 ${operation} Agent Data:`);
  console.log(`  Name: ${agent.name}`);
  console.log(`  Domain: ${agent.domain}`);
  console.log(`  Models: ${agent.models.length}`);
  console.log(`  Actions: ${agent.actions.length}`);
  console.log(`  Schedules: ${agent.schedules?.length || 0}`);
  console.log(`  Created: ${agent.metadata.createdAt}`);
  console.log(`  Updated: ${agent.metadata.updatedAt}`);
}

/**
 * Validates agent data structure
 * @param agent - Agent data to validate
 * @returns Validation result
 */
export function validateAgentData(agent: AgentData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!agent.name || agent.name.trim().length === 0) {
    errors.push('Agent name is required');
  }
  
  if (!agent.description || agent.description.trim().length === 0) {
    errors.push('Agent description is required');
  }
  
  if (!agent.models || agent.models.length === 0) {
    errors.push('At least one model is required');
  }
  
  if (!agent.actions || agent.actions.length === 0) {
    errors.push('At least one action is required');
  }
  
  // Validate models
  agent.models?.forEach((model, index) => {
    if (!model.name || model.name.trim().length === 0) {
      errors.push(`Model ${index + 1} is missing a name`);
    }
    
    if (!model.fields || model.fields.length === 0) {
      errors.push(`Model "${model.name}" has no fields`);
    }
  });
  
  // Validate actions
  agent.actions?.forEach((action, index) => {
    if (!action.name || action.name.trim().length === 0) {
      errors.push(`Action ${index + 1} is missing a name`);
    }
    
    if (!action.execute) {
      errors.push(`Action "${action.name}" is missing execute configuration`);
    }
  });
  
  // Validate schedules
  agent.schedules?.forEach((schedule, index) => {
    if (!schedule.name || schedule.name.trim().length === 0) {
      errors.push(`Schedule ${index + 1} is missing a name`);
    }
    
    if (!schedule.execute) {
      errors.push(`Schedule "${schedule.name}" is missing execute configuration`);
    }
    
    if (!schedule.interval) {
      errors.push(`Schedule "${schedule.name}" is missing interval configuration`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
} 