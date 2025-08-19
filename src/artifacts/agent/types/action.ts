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

export type StepCategory = 'database' | 'external_api' | 'ai_operation' | 'data_operation';

export interface PseudoCodeStep {
  id: string;
  description: string;
  type: 
    // Prisma Database Operations
    | 'findUnique' | 'findUniqueOrThrow' | 'findFirst' | 'findFirstOrThrow' | 'findMany' 
    | 'create' | 'createMany' | 'createManyAndReturn'
    | 'update' | 'updateMany' | 'upsert'
    | 'delete' | 'deleteMany'
    | 'count' | 'aggregate' | 'groupBy'
    | '$transaction' | '$executeRaw' | '$queryRaw'
    // External API Operations
    | 'api call post' | 'api call get' | 'api call put' | 'api call delete' | 'api call patch'
    | 'graphql query' | 'graphql mutation' | 'graphql subscription'
    // AI Operations
    | 'ai analysis' | 'ai generate object' | 'ai generate text' | 'ai generate image'
    // JavaScript Data Operations
    | 'map' | 'filter' | 'reduce' | 'find' | 'forEach' | 'sort' | 'slice' | 'concat' | 'join'
    | 'parse json' | 'stringify json' | 'validate data' | 'transform data' | 'merge objects';
  
  // Auto-computed category based on type
  category?: StepCategory;
  
  // Input/Output definitions
  inputFields: StepField[];
  outputFields: StepField[];
  
  // Authentication & API configuration
  oauthTokens?: {
    provider: string; // e.g., 'gmail', 'shopify', 'stripe'
    accessToken: string; // Reference to oauth table field
    refreshToken?: string;
    expiresAt?: string;
  };
  apiKeys?: {
    provider: string;
    keyName: string; // Reference to credentials table field
    keyValue: string;
  };
  
  // Mock data for testing
  mockInput: Record<string, any>;
  mockOutput: Record<string, any>;
  
  // Code generation
  testCode: string; // Test code for this specific step (no hardcoding)
  actualCode: string; // Actual executable code for this step
  logMessage: string; // Log message template for this step
  
  // Metadata
  stepOrder: number;
  dependsOn?: string[]; // Array of step IDs this step depends on
  isOptional?: boolean;
  errorHandling?: {
    retryAttempts?: number;
    fallbackAction?: string;
    continueOnError?: boolean;
  };
}

export interface UIComponent {
  id: string;
  stepNumber: number;
  type: 'input' | 'select' | 'textarea' | 'checkbox' | 'date' | 'number' | 'email' | 'phone';
  label: string;
  name: string;
  description: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  defaultValue?: string;
}

export interface TestCase {
  id: string;
  description: string;
  inputFields: StepField[];
  expectedOutputFields: StepField[];
}

export interface AgentAction {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the action
  description: string;
  type: 'mutation' | 'query'; // Action type
  role: 'admin' | 'member';
  
  // External API validation - only one type per action
  externalApiProvider?: 'gmail' | 'shopify' | 'stripe' | 'slack' | 'notion' | 'salesforce' | 'hubspot' | 'facebook' | 'instagram' | 'linkedin' | 'threads' | 'github' | 'google-calendar' | 'microsoft-teams' | null;
  
  // Enhanced step structure
  pseudoSteps?: PseudoCodeStep[];
  uiComponentsDesign?: UIComponent[]; // UI components for the action interface
  testCases?: TestCase[]; // Test cases for validation
  
  // Execution code - this is what gets executed in the sub-agent
  execute: {
    code: {
      script: string; // The live executable code
      envVars?: EnvVar[];
    };
  };
  
  // Test code for validating the action
  testCode?: string; // Combined test code that can validate the live code
  executionLogs?: string[]; // Execution log templates
  
  _internal?: {
    enhancedAnalysis?: any; // Enhanced analysis with real code and test cases (hidden from user)
    hasRealCode?: boolean;
    hasTestCases?: boolean;
    validatedSteps?: boolean; // Whether all steps have been validated
    apiValidation?: {
      isValid: boolean;
      singleProvider: boolean;
      conflictingProviders?: string[];
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

// Utility functions for step categorization
export function getStepCategory(stepType: PseudoCodeStep['type']): StepCategory {
  // Database operations
  if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany',
       'create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert',
       'delete', 'deleteMany', 'count', 'aggregate', 'groupBy', 
       '$transaction', '$executeRaw', '$queryRaw'].includes(stepType)) {
    return 'database';
  }
  
  // External API operations
  if (['api call post', 'api call get', 'api call put', 'api call delete', 'api call patch',
       'graphql query', 'graphql mutation', 'graphql subscription'].includes(stepType)) {
    return 'external_api';
  }
  
  // AI operations
  if (['ai analysis', 'ai generate object', 'ai generate text', 'ai generate image'].includes(stepType)) {
    return 'ai_operation';
  }
  
  // Data operations (JavaScript)
  if (['map', 'filter', 'reduce', 'find', 'forEach', 'sort', 'slice', 'concat', 'join',
       'parse json', 'stringify json', 'validate data', 'transform data', 'merge objects'].includes(stepType)) {
    return 'data_operation';
  }
  
  return 'data_operation'; // default fallback
}

export function getStepCategoryInfo(category: StepCategory): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (category) {
    case 'database':
      return {
        icon: '🗄️',
        label: 'Database',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-400/30'
      };
    case 'external_api':
      return {
        icon: '🌐',
        label: 'External API',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-400/30'
      };
    case 'ai_operation':
      return {
        icon: '🧠',
        label: 'AI Operation',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-400/30'
      };
    case 'data_operation':
      return {
        icon: '⚙️',
        label: 'Data Transform',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-400/30'
      };
    default:
      return {
        icon: '⚡',
        label: 'Operation',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-400/30'
      };
  }
}

export function getStepTypeDisplay(stepType: PseudoCodeStep['type']): string {
  const category = getStepCategory(stepType);
  const categoryInfo = getStepCategoryInfo(category);
  
  // Format step type for display
  const formatType = (type: string): string => {
    if (type.startsWith('$')) return type; // Keep $transaction, $executeRaw as-is
    if (type.includes(' ')) return type; // Keep "api call post" as-is
    
    // Convert camelCase to readable format
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  return `${categoryInfo.icon} ${categoryInfo.label}: ${formatType(stepType)}`;
} 