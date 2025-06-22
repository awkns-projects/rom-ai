
import type { 
  AgentData, 
  AgentModel, 
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
  return `${str.substring(0, maxLength - 3)}...`;
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

/**
 * Run Action with UI Components
 * Executes an action with generated step forms and result view
 */
export interface ActionRunState {
  currentStep: number;
  stepData: Record<number, any>;
  isLoading: boolean;
  error: string | null;
  result: any;
  isComplete: boolean;
}

/**
 * Execute action with step forms
 */
export async function executeActionWithUI(
  action: any, // AgentAction with uiComponents
  database: Record<string, any[]>,
  member: Record<string, any>
): Promise<{
  stepForms: Array<{
    stepNumber: number;
    title: string;
    description: string;
    component: string; // React component code
    dataRequirements: Array<{
      modelName: string;
      fields: string[];
      purpose: string;
    }>;
  }>;
  executeAction: (stepData: Record<number, any>) => Promise<any>;
  resultView: {
    title: string;
    description: string;
    component: string; // React component code
  };
}> {
  if (!action.uiComponents) {
    throw new Error('Action does not have UI components configured');
  }

  // Prepare step forms with database data
  const stepForms = action.uiComponents.stepForms.map((step: any) => ({
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    component: step.reactCode,
    dataRequirements: step.dataRequirements
  }));

  // Function to execute the action with collected step data
  const executeAction = async (stepData: Record<number, any>) => {
    try {
      // Merge all step data into input object
      const input = Object.values(stepData).reduce((acc, data) => ({ ...acc, ...data }), {});
      
      // Execute the action function
      if (action.execute.type === 'code' && action.execute.code?.script) {
        const actionFunction = new Function('database', 'input', 'member', action.execute.code.script);
        const result = await actionFunction(database, input, member);
        return result;
      } else {
        throw new Error('Action execution type not supported');
      }
    } catch (error) {
      throw new Error(`Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    stepForms,
    executeAction,
    resultView: {
      title: action.uiComponents.resultView.title,
      description: action.uiComponents.resultView.description,
      component: action.uiComponents.resultView.reactCode
    }
  };
}

/**
 * Get database data for step form requirements
 */
export function getDatabaseDataForStep(
  database: Record<string, any[]>,
  dataRequirements: Array<{
    modelName: string;
    fields: string[];
    purpose: string;
  }>
): Record<string, any[]> {
  const stepData: Record<string, any[]> = {};
  
  dataRequirements.forEach(requirement => {
    const modelData = database[requirement.modelName] || [];
    // Filter to only include required fields
    const filteredData = modelData.map(record => {
      const filtered: any = {};
      requirement.fields.forEach(field => {
        if (record[field] !== undefined) {
          filtered[field] = record[field];
        }
      });
      return filtered;
    });
    stepData[requirement.modelName] = filteredData;
  });
  
  return stepData;
}

/**
 * Validate step form data
 */
export function validateStepData(
  stepData: any,
  validationLogic: string
): { isValid: boolean; errors: string[] } {
  try {
    // Create validation function from string
    const validationFunction = new Function('data', validationLogic);
    const validationResult = validationFunction(stepData);
    
    if (typeof validationResult === 'boolean') {
      return { isValid: validationResult, errors: validationResult ? [] : ['Validation failed'] };
    } else if (typeof validationResult === 'object' && validationResult !== null) {
      return {
        isValid: validationResult.isValid || false,
        errors: validationResult.errors || []
      };
    } else {
      return { isValid: true, errors: [] };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Create a mock database for testing actions
 */
export function createMockDatabase(models: any[]): Record<string, any[]> {
  const mockDB: Record<string, any[]> = {};
  
  models.forEach(model => {
    mockDB[model.name] = model.records || [];
  });
  
  return mockDB;
}

/**
 * Generate step form component template
 */
export function generateStepFormTemplate(
  stepTitle: string,
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    options?: string[];
    databaseModel?: string;
  }>
): string {
  return `
import React, { useState, useEffect } from 'react';

interface ${stepTitle.replace(/\s+/g, '')}Props {
  onNext: (data: any) => void;
  onPrevious?: () => void;
  databaseData?: Record<string, any[]>;
  initialData?: any;
}

export default function ${stepTitle.replace(/\s+/g, '')}({ onNext, onPrevious, databaseData, initialData }: ${stepTitle.replace(/\s+/g, '')}Props) {
  const [formData, setFormData] = useState(initialData || {
    ${fields.map(field => `${field.name}: ${field.type === 'boolean' ? 'false' : field.type === 'number' ? '0' : "''"}`).join(',\n    ')}
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    ${fields.filter(f => f.required).map(field => `
    if (!formData.${field.name}) {
      newErrors.${field.name} = '${field.name} is required';
    }`).join('')}
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-green-200 font-mono mb-4">${stepTitle}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          ${fields.map(field => `
          <div className="space-y-2">
            <label className="text-green-300 font-mono font-medium block">
              ${field.name.charAt(0).toUpperCase() + field.name.slice(1)}
              ${field.required ? ' *' : ''}
            </label>
            ${field.databaseModel ? `
            <select
              value={formData.${field.name}}
              onChange={(e) => setFormData(prev => ({ ...prev, ${field.name}: e.target.value }))}
              className="w-full bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono rounded-lg px-3 py-2"
            >
              <option value="">Select ${field.databaseModel}</option>
              {(databaseData?.${field.databaseModel} || []).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.title || item.id}
                </option>
              ))}
            </select>
            ` : field.options ? `
            <select
              value={formData.${field.name}}
              onChange={(e) => setFormData(prev => ({ ...prev, ${field.name}: e.target.value }))}
              className="w-full bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono rounded-lg px-3 py-2"
            >
              <option value="">Select option</option>
              ${field.options.map(option => `<option value="${option}">${option}</option>`).join('\n              ')}
            </select>
            ` : field.type === 'textarea' ? `
            <textarea
              value={formData.${field.name}}
              onChange={(e) => setFormData(prev => ({ ...prev, ${field.name}: e.target.value }))}
              placeholder="Enter ${field.name}"
              rows={4}
              className="w-full bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono rounded-lg px-3 py-2"
            />
            ` : `
            <input
              type="${field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}"
              value={formData.${field.name}}
              onChange={(e) => setFormData(prev => ({ ...prev, ${field.name}: e.target.value }))}
              placeholder="Enter ${field.name}"
              className="w-full bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono rounded-lg px-3 py-2"
            />
            `}
            {errors.${field.name} && (
              <p className="text-red-400 text-sm font-mono">{errors.${field.name}}</p>
            )}
          </div>
          `).join('')}
          
          <div className="flex justify-between pt-4">
            {onPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-mono"
              >
                Previous
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-mono ml-auto"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;
} 