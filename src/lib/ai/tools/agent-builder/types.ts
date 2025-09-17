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

// NEW: Migration types for enhanced pseudo steps (CORRECTED)
export type FieldSource = 
  | 'model_field'      // Direct field from the target model record
  | 'external_data'    // External APIs, other models, user parameters
  | 'previous_step'    // Output from previous pseudo step
  | 'system';          // System-provided values (current date, user ID, etc.)

export type FieldTarget = 
  | 'model_field'      // Update a field in the target model record
  | 'temporary'        // Temporary value for next step (not saved to model)
  | 'return';          // Value returned to caller (for action chaining)

// NEW: Enhanced step types for the migration (NO DATABASE OPERATIONS)
export type NewStepType = 
  | 'ai_generate_object'         // Generate structured data
  | 'ai_generate_text'           // Generate text content
  | 'ai_generate_text_websearch' // Generate text with web search
  | 'ai_generate_object_websearch' // Generate structured data with web search
  | 'ai_read_file_from_field'    // Read file from model field
  | 'ai_generate_image'          // Generate image
  | 'ai_modify_image'            // Modify existing image
  | 'ai_read_image'              // Read/analyze image from field
  | 'npm_package'                // Use npm package functionality
  | 'system_timestamp'           // Add system timestamps
  | 'system_calculate';          // Perform calculations

// NEW: Enhanced field definition for migration
export interface EnhancedStepField {
  id: string;
  name: string;
  type: string; // 'String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', or model name for relations
  kind: 'scalar' | 'object' | 'enum';
  required: boolean;
  list: boolean;
  relationModel?: string; // For object fields, reference to model name
  description?: string;
  defaultValue?: string;
  // NEW: Migration-specific properties
  source?: FieldSource;     // Where this field's value comes from
  target?: FieldTarget;     // Where this field's value goes to
  // NEW: Dynamic database fetching properties
  externalModel?: string;   // Model name to fetch from (for external_data source)
  whereClause?: Record<string, any>; // Prisma where clause for fetching external data
  selectFields?: string[];  // Specific fields to select from external model
}

// ParamValue type for supporting static values, references to previous actions, and alias-based references during loops
export type ParamValue = 
  | { type: 'static'; value: any }
  | { type: 'ref'; fromActionIndex: number; outputKey: string }
  | { type: 'alias'; fromAlias: string; outputKey: string };

// NEW: Enhanced WHERE clause for schedule chaining
export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
  value: any | ParameterReference;
}

export interface ParameterReference {
  type: 'previous_step_output' | 'system_value' | 'schedule_parameter';
  source: string;
}

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
  // NEW: WHERE clause for record selection (migration feature)
  whereClause?: {
    model: string;               // Target model name
    conditions: WhereCondition[];
  };
  // Chain control (migration feature)
  continueOnError?: boolean;
  maxRecords?: number;           // Limit processing
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
  
  // NEW: Migration properties
  targetModel?: string;    // REQUIRED for new actions: target model name
  processingMode?: 'single' | 'batch'; // Processing scope (migration: always 'single')
  
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
  
  // NEW: Enhanced pseudo steps for migration
  pseudoSteps?: Array<{
    id: string;
    inputFields: EnhancedStepField[];
    outputFields: EnhancedStepField[];
    description: string;
    type: NewStepType; // Use new step types
    model?: string; // For database operations, specifies which model/table to operate on
    // Additional properties for specific step types
    schema?: any;      // For AI generate object steps
    prompt?: string;   // For AI steps
    maxLength?: number; // For AI text generation
    searchQuery?: string; // For web search steps
    fileType?: 'text' | 'pdf' | 'image' | 'csv'; // For file reading steps
    processing?: string; // Processing instructions
    dimensions?: { width: number; height: number }; // For image generation
    style?: string;    // Art style for image generation
    modifications?: string; // Image modification instructions
    preserveOriginal?: boolean; // Keep original image
    updateConditions?: string[]; // Optional conditions for DB updates
    apiEndpoint?: string; // For external API calls
    packageName?: string; // For npm package steps
    packageFunction?: string; // Specific function to call
  }>;
  
  // Keep existing properties for backward compatibility
  technicalSpecification?: any;
  uiComponentsDesign?: any[];
  _internal?: {
    hasRealCode?: boolean;
    hasTestCases?: boolean;
    codeGenerationMetadata?: any;
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
  // Web search results for enhanced package discovery and documentation
  webSearchResults?: {
    recommendedPackages?: Array<{
      name: string;
      version: string;
      description: string;
      npmUrl: string;
      githubUrl?: string;
      weeklyDownloads?: number;
      lastUpdated?: string;
      tags: string[];
      useCase: string;
      integrationNotes?: string;
      envVarDocumentation?: {
        title: string;
        url: string;
        description: string;
        keyType: 'api_key' | 'oauth' | 'token' | 'credentials' | 'config';
      }[];
    }>;
    foundPatterns?: any[];
    integrationNotes?: string[];
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