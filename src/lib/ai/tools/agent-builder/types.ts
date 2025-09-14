// Core agent interfaces
export interface AgentModel {
  id: string;
  name: string; // Code-safe name for database tables and Prisma models
  title: string; // Human-readable display name for UI
  emoji?: string;
  description?: string;
  idField: string;
  displayFields: string[];
  fields: AgentField[];
  enums: AgentEnum[];
  records?: ModelRecord[];
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
  defaultValue?: string | any[]; // String for scalar fields, array for list fields (e.g., list relation fields like productIds: [])
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

// ParamValue type for supporting static values, references to previous actions, and alias-based references during loops
export type ParamValue = 
  | { type: 'static'; value: any }
  | { type: 'ref'; fromActionIndex: number; outputKey: string }
  | { type: 'alias'; fromAlias: string; outputKey: string };

// Interface for step execution in action chains
export interface ActionChainStep {
  id: string;
  actionId: string; // Reference to an existing Action
  name: string; // Display name for this step
  description?: string;
  delay?: {
    duration: number; // duration in the specified unit
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
  title?: string; // User-friendly display title
  emoji?: string; // AI-generated emoji representing the schedule
  description: string;
  
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
    envVars: Array<{
      name: string;
      description: string;
      required: boolean;
      sensitive: boolean;
    }>;
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

export interface AgentAction {
  id: string;
  name: string; // Code-safe name for API endpoints and deployments
  title: string; // Human-readable display name for UI
  emoji?: string;
  description: string;
  role: 'admin' | 'member';
  dataSource?: {
    type: 'database' | 'custom';
    customFunction?: {
      code: string;
      envVars: Array<{
        name: string;
        description: string;
        required: boolean;
        sensitive: boolean;
      }>;
    };
    database?: {
      models: Array<{
        id: string;
        name: string;
        fields: Array<{
          id: string;
          name: string;
        }>;
      }>;
    };
  };
  execute?: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars: Array<{
        name: string;
        description: string;
        required: boolean;
        sensitive: boolean;
      }>;
    };
    prompt?: {
      content: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    model: string;
    fields: Record<string, any>;
    fieldsToUpdate: Record<string, any>;
  };
  uiComponents?: {
    stepForms?: Array<{
      stepNumber: number;
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, string>;
      validationLogic: string;
      dataRequirements: Array<{
        modelName: string;
        fields: string[];
        purpose: string;
      }>;
    }>;
    resultView?: {
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, string>;
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

export interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentData {
  id: string;
  name: string;
  description: string;
  domain: string;
  models: AgentModel[];
  enums: AgentEnum[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  createdAt: string;
  metadata: AgentMetadata;
  prismaSchema: string;
  externalApis?: Array<{
    provider: string;
    requiresConnection: boolean;
    connectionType: 'oauth' | 'api_key' | 'none';
    primaryUseCase: string;
    requiredScopes: string[];
    priority: 'primary' | 'secondary';
  }>;
  deployment?: {
    deploymentId: string;
    projectId: string;
    deploymentUrl: string;
    status: 'pending' | 'building' | 'ready' | 'error';
    apiEndpoints: string[];
    vercelProjectId: string;
    deployedAt: string;
    warnings: string[];
    deploymentNotes: string[];
    // Custom domain information
    customDomain?: {
      domain: string;
      assigned: boolean;
      verified: boolean;
      existing: boolean;
      customUrl?: string;
    };
  };
}

export interface PromptUnderstanding {
  userRequestAnalysis: {
    mainGoal: string;
    businessContext: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    clarity: 'very_clear' | 'clear' | 'somewhat_unclear' | 'unclear';
  };
  
  featureImagination: {
    coreFeatures: string[];
    additionalFeatures: string[];
    userExperience: string[];
    businessRules: string[];
    integrations: string[];
  };
  
  dataModelingNeeds: {
    requiredModels: Array<{
      name: string;
      purpose: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      estimatedFields: Array<{
        name: string;
        type: string;
        purpose: string;
        required: boolean;
        enumValues?: string[];
      }>;
      estimatedEnums?: Array<{
        name: string;
        purpose: string;
        estimatedValues: string[];
      }>;
    }>;
    
    relationships: Array<{
      from: string;
      to: string;
      type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
      purpose: string;
    }>;
  };
  
  workflowAutomationNeeds: {
    requiredActions: Array<{
      name: string;
      purpose: string;
      type: 'Create' | 'Update';
      priority: 'critical' | 'high' | 'medium' | 'low';
      inputRequirements: string[];
      outputExpectations: string[];
    }>;
    
    businessRules: Array<{
      condition: string;
      action: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
    }>;
    
    oneTimeActions: Array<{
      name: string;
      purpose: string;
      role: 'admin' | 'member';
      triggerType: 'manual' | 'event-driven';
      priority: 'critical' | 'high' | 'medium' | 'low';
      complexity: 'simple' | 'moderate' | 'complex';
      businessValue: string;
      estimatedSteps: string[];
      dataRequirements: string[];
      expectedOutput: string;
    }>;
    
    recurringSchedules: Array<{
      name: string;
      purpose: string;
      role: 'admin' | 'member';
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
      timing: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      complexity: 'simple' | 'moderate' | 'complex';
      businessValue: string;
      estimatedSteps: string[];
      dataRequirements: string[];
      expectedOutput: string;
    }>;
    
    businessProcesses: Array<{
      name: string;
      description: string;
      involvedModels: string[];
      automationPotential: 'high' | 'medium' | 'low';
      requiresActions: boolean;
      requiresSchedules: boolean;
    }>;
  };
  
  changeAnalysisPlan: Array<{
    changeId: string;
    description: string;
    type: 'create' | 'update' | 'delete';
    targetType: 'models' | 'actions' | 'schedules' | 'fields' | 'system' | 'integrations';
    priority: 'critical' | 'high' | 'medium' | 'low';
    dependencies: string[];
    estimatedImpact: 'minimal' | 'moderate' | 'significant' | 'major';
    specificTargets: string[];
  }>;
  
  implementationStrategy: {
    recommendedApproach: 'incremental' | 'comprehensive' | 'modular' | 'minimal-viable';
    executionOrder: string[];
    riskAssessment: string[];
    successCriteria: string[];
  };
}

export interface ChangeAnalysis {
  userIntent: 'add' | 'modify' | 'delete' | 'replace';
  targetType: 'models' | 'enums' | 'actions' | 'schedules' | 'fields' | 'system' | 'integrations';
  preserveExisting: boolean;
  specificTargets: string[];
  expectedResult: {
    totalModels: number;
    totalEnums: number;
    totalActions: number;
    newItems: string[];
    modifiedItems: string[];
    deletedItems: string[];
  };
}

export interface AgentMetadata {
  createdAt: string;
  updatedAt: string;
  version: string;
  lastModifiedBy: string;
  tags: string[];
  status: string;
  promptUnderstanding?: any;
  granularChanges?: any;
  aiDecision?: any;
  changeAnalysis?: any;
  technicalAnalysis?: any;
  lastUpdateReason?: string;
  lastUpdateTimestamp?: string;
  comprehensiveAnalysisUsed?: boolean;
  operationType?: string;
  promptAnalysisPhase?: {
    complexity: string;
    businessContext: string;
    dataModeling: any;
    workflowAutomation: any;
  };
  granularChangesPhase?: {
    changeDetails: any;
    specificChanges: any[];
    executionPlan: any;
    expectedOutcome: any;
  };
  databaseGenerationPhase?: {
    models: any[];
    enums: any[];
    generationApproach: string;
    validationResults: any;
  };
  actionGenerationPhase?: {
    actions: any[];
    generationApproach: string;
    validationResults: any;
  };
  scheduleGenerationPhase?: {
    schedules: any[];
    generationApproach: string;
    validationResults: any;
  };
  mergingPhase?: {
    approach: string;
    preservationStrategy: string;
    conflictResolution: any;
    finalCounts: {
      models: number;
      actions: number;
      schedules: number;
      enums: number;
    };
  };
} 