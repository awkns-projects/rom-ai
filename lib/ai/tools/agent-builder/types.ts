// Core agent interfaces
export interface AgentModel {
  id: string;
  name: string;
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

export interface AgentSchedule {
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

export interface AgentAction {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
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
  // UI Components for running the action
  uiComponents?: {
    stepForms: Array<{
      stepNumber: number;
      title: string;
      description: string;
      reactCode: string; // React component code as string
      propsInterface: Record<string, any>; // TypeScript interface for props
      validationLogic: string; // Client-side validation
      dataRequirements: Array<{
        modelName: string;
        fields: string[];
        purpose: string;
      }>; // Database data needed for this step
    }>;
    resultView: {
      title: string;
      description: string;
      reactCode: string; // React component code for displaying results
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
    targetType: 'models' | 'actions' | 'fields' | 'system' | 'integrations';
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
  targetType: 'models' | 'enums' | 'actions' | 'fields' | 'system';
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
    };
  };
} 