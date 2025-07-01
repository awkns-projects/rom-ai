import type { DatabaseModel, EnvVar, PseudoCodeStep } from './action';

// Interface for recurring scheduled tasks
export interface AgentSchedule {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the schedule
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  pseudoSteps?: PseudoCodeStep[];
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
  savedInputs?: {
    inputParameters: Record<string, any>;
    envVars: Record<string, string>;
    lastUpdated: string;
  };
} 