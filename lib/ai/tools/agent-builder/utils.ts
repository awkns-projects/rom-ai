import type { Message } from 'ai';
import type { 
  AgentData, 
  AgentModel, 
  AgentField, 
  AgentAction, 
  AgentSchedule, 
  AgentEnum 
} from './types';
import { generateUUID } from '../../../utils';

/**
 * Generates simple sequential IDs for non-document entities
 * @param type - Entity type (e.g., 'action', 'field')
 * @param existingEntities - Array of existing entities to avoid ID conflicts
 * @returns Generated ID string
 */
export function generateNewId(type: string, existingEntities: any[]): string {
  const prefix = type.substring(0, 3).toLowerCase();
  const nextId = existingEntities.length + 1;
  return `${prefix}${nextId}`;
}

/**
 * Analyzes conversation context to extract relevant information
 * @param messages - Array of conversation messages
 * @returns Formatted context string
 */
export function analyzeConversationContext(messages: any[]): string {
  // Extract relevant context from conversation messages
  return messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(' ')
    .substring(0, 1000); // Limit context size
}

/**
 * Escapes strings for use in AI prompt templates
 * @param str - String to escape
 * @returns Escaped string safe for template use
 */
export function escapeForTemplate(str: string): string {
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

/**
 * Creates a complete AgentData object with all required fields
 * @param name - Agent name
 * @param description - Agent description
 * @param domain - Agent domain
 * @param models - Array of models
 * @param enums - Array of enums
 * @param actions - Array of actions
 * @param schedules - Array of schedules
 * @param metadata - Optional metadata
 * @param exampleRecords - Optional example records for new models
 * @returns Complete AgentData object
 */
export function createAgentData(
  name: string,
  description: string,
  domain: string,
  models: AgentModel[] = [],
  enums: AgentEnum[] = [],
  actions: AgentAction[] = [],
  schedules: AgentSchedule[] = [],
  metadata?: any,
  exampleRecords?: { modelName: string; records: Record<string, any>[] }[]
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
    metadata,
    ...(exampleRecords && exampleRecords.length > 0 && { exampleRecords })
  };
}

/**
 * Cleans null and undefined values from an object recursively
 * @param obj - Object to clean
 * @returns Cleaned object
 */
export function cleanNullValues(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(cleanNullValues);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanedValue = cleanNullValues(value);
    if (cleanedValue !== null) {
      cleaned[key] = cleanedValue;
    }
  }
  return cleaned;
}

/**
 * Performs deep equality comparison between two objects
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Merges arrays by a key field, preferring items from newItems array
 * @param existing - Existing array of items
 * @param newItems - New array of items to merge
 * @param keyField - Field to use as unique key (default: 'id')
 * @returns Merged array
 */
export function mergeArraysByKey<T extends { id: string }>(
  existing: T[], 
  newItems: T[], 
  keyField: keyof T = 'id'
): T[] {
  const merged = [...existing];
  
  for (const newItem of newItems) {
    const existingIndex = merged.findIndex(item => item[keyField] === newItem[keyField]);
    if (existingIndex >= 0) {
      merged[existingIndex] = { ...merged[existingIndex], ...newItem };
    } else {
      merged.push(newItem);
    }
  }
  
  return merged;
}

/**
 * Generates a UUID for document IDs
 * @returns UUID string
 */
export function generateDocumentId(): string {
  return generateUUID();
}

/**
 * Validates that a string is a valid JSON
 * @param str - String to validate
 * @returns True if valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parses JSON with error handling
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJSONParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Ensures all actions have unique IDs
 * @param actions - Array of actions to process
 * @returns Actions with guaranteed IDs
 */
export function ensureActionsHaveIds(
  actions: any[], 
  existingActions: AgentAction[] = []
): AgentAction[] {
  return actions.map(action => {
    if (!action.id) {
      return {
        ...action,
        id: generateNewId('action', existingActions)
      };
    }
    return action;
  });
}

/**
 * Ensures all schedules have required fields and unique IDs
 * @param schedules - Array of schedules to process
 * @returns Schedules with guaranteed required fields
 */
export function ensureSchedulesHaveIds(
  schedules: any[], 
  existingSchedules: AgentSchedule[] = []
): AgentSchedule[] {
  return schedules.map(schedule => {
    if (!schedule.id) {
      return {
        ...schedule,
        id: generateNewId('schedule', existingSchedules)
      };
    }
    return schedule;
  });
}

/**
 * Ensures all required schedule fields are present
 * @param schedules - Array of schedules to validate
 * @returns Validated schedules with required fields
 */
export function ensureRequiredScheduleFields(schedules: any[]): any[] {
  return schedules.map(schedule => ({
    id: schedule.id || generateNewId('schedule', []),
    name: schedule.name || 'Unnamed Schedule',
    emoji: schedule.emoji,
    description: schedule.description || 'No description provided',
    type: schedule.type || 'Create',
    role: schedule.role || 'admin',
    interval: schedule.interval || {
      pattern: '0 0 * * *', // Daily at midnight
      timezone: 'UTC',
      active: true
    },
    dataSource: schedule.dataSource || {
      type: 'custom',
      customFunction: {
        code: '// Custom function code here',
        envVars: []
      }
    },
    execute: schedule.execute || {
      type: 'prompt',
      prompt: {
        template: 'Default prompt template',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    results: schedule.results || {
      actionType: schedule.type || 'Create',
      model: 'default'
    }
  }));
}

/**
 * Ensures all required action fields are present
 * @param actions - Array of actions to validate
 * @returns Validated actions with required fields
 */
export function ensureRequiredActionFields(actions: any[]): any[] {
  return actions.map(action => ({
    id: action.id || generateNewId('action', []),
    name: action.name || 'Unnamed Action',
    emoji: action.emoji,
    description: action.description || 'No description provided',
    type: action.type || 'Create',
    role: action.role || 'admin',
    dataSource: action.dataSource || {
      type: 'custom',
      customFunction: {
        code: '// Custom function code here',
        envVars: []
      }
    },
    execute: action.execute || {
      type: 'prompt',
      prompt: {
        template: 'Default prompt template',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    results: action.results || {
      actionType: action.type || 'Create',
      model: 'default'
    }
  }));
}

export function createInitialAgentData(
  name: string,
  description: string,
  domain: string,
  models: AgentModel[] = [],
  enums: AgentEnum[] = [],
  actions: AgentAction[] = [],
  schedules: AgentSchedule[] = [],
  metadata: any = {}
): AgentData {
  const now = new Date().toISOString();
  
  return {
    id: generateUUID(),
    name,
    description,
    domain,
    models,
    enums,
    actions,
    schedules,
    createdAt: now,
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      lastModifiedBy: 'agent-builder',
      tags: [],
      status: 'active',
      ...metadata
    }
  };
} 