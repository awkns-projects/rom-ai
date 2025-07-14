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
  type: 'Database create' | 'Database update' | 'Database read' | 'Database delete' | 'External api read' | 'External api write' | 'AI analysis' | 'AI generation';
  generatedCode?: string; // Generated step function code
  testCode?: string; // Generated test code for the step
  testCases?: Array<{
    name: string;
    input: Record<string, any>;
    expectedOutput: Record<string, any>;
    expectedChanges?: Array<{
      type: 'database' | 'external_api' | 'ai_analysis' | 'ai_generation';
      description: string;
      model?: string;
      operation?: string;
      recordCount?: number;
    }>;
  }>;
}

export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  output: Record<string, any>;
  changes: Array<{
    type: 'database' | 'external_api' | 'ai_analysis' | 'ai_generation';
    description: string;
    model?: string;
    operation?: string;
    recordCount?: number;
    apiEndpoint?: string;
    tokensUsed?: number;
    executionTime?: number;
  }>;
  error?: string;
}

export interface AgentAction {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the action
  description: string;
  role: 'admin' | 'member';
  type: 'view' | 'mutation'; // View for read operations, mutation for write operations
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
      script: string; // Main function that composes all step functions
      stepFunctions?: string[]; // Individual step function codes
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