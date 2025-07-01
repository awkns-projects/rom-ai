export interface StepField {
  id: string;
  name: string;
  type: string; // 'String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', or model name for relations
  kind: 'scalar' | 'object' | 'enum';
  required: boolean;
  list: boolean;
  relationModel?: string; // For object fields, reference to model name
  description?: string;
  defaultValue?: string;
}

export interface PseudoCodeStep {
  id: string;
  inputFields: StepField[];
  outputFields: StepField[];
  description: string;
  type: 'Database find unique' | 'Database find many' | 'Database update unique' | 'Database update many' | 'Database create' | 'Database create many' | 'Database delete unique' | 'Database delete many' | 'call external api' | 'ai analysis';
}

export interface AgentAction {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the action
  description: string;
  role: 'admin' | 'member';
  pseudoSteps?: PseudoCodeStep[];
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
  uiComponents?: {
    stepForms: Array<{
      stepNumber: number;
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, any>;
      validationLogic: string;
      dataRequirements: Array<{
        modelName: string;
        fields: string[];
        purpose: string;
      }>;
    }>;
    resultView: {
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, any>;
    };
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