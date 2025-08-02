import type { DatabaseModel, EnvVar } from './action';

// ParamValue type for supporting static values, references to previous actions, and alias-based references during loops
export type ParamValue = 
  | { type: 'static'; value: any }
  | { type: 'ref'; fromActionIndex: number; outputKey: string }
  | { type: 'alias'; fromAlias: string; outputKey: string };

// Legacy interface for backward compatibility
export interface LegacyAgentSchedule {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  interval: {
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

// Interface for step execution in action chains
export interface ActionChainStep {
  id: string;
  actionId: string; // Reference to an existing Action
  name: string; // Display name for this step
  description?: string;
  delay?: {
    duration: number; // in milliseconds
    unit: 'seconds' | 'minutes' | 'hours';
  };
  // Updated to use ParamValue system for parameter chaining
  inputParams?: Record<string, ParamValue>;
  condition?: {
    type: 'always' | 'if' | 'unless';
    expression?: string; // Future feature for conditional execution
  };
  onError?: {
    action: 'stop' | 'continue' | 'retry';
    retryCount?: number;
    retryDelay?: number;
  };
}

// Interface for scheduled action chains
export interface AgentSchedule {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the schedule
  description: string;
  role: 'admin' | 'member';
  
  // Timing configuration
  trigger: {
    type: 'cron' | 'interval' | 'date' | 'manual';
    pattern?: string; // cron expression for cron type
    interval?: {
      value: number;
      unit: 'minutes' | 'hours' | 'days' | 'weeks';
    };
    date?: string; // ISO date string for one-time execution
    timezone?: string;
    active?: boolean;
  };

  // Action chain configuration
  steps: ActionChainStep[];
  
  // Global configuration for the entire chain
  globalInputs?: Record<string, any>; // Inputs available to all steps
  environment?: {
    envVars: EnvVar[];
  };
  
  // Execution history and results
  lastExecution?: {
    timestamp: string;
    success: boolean;
    duration: number;
    stepsCompleted: number;
    totalSteps: number;
    error?: string;
    results?: Record<string, any>[];
  };
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

// Runtime execution context for resolving parameter references
export interface ExecutionContext {
  stepResults: Record<number, any>; // Results from each step by index
  globalInputs?: Record<string, any>;
  environment?: Record<string, string>;
  aliases?: Record<string, any>; // Alias context for loop iterations
}

// Helper interface for parameter resolution
export interface ResolvedParams {
  [key: string]: any;
} 