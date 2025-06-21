# Agent Builder System - Complete Technical Specification

## System Architecture Overview

The Agent Builder is a comprehensive AI-powered system that generates fully functional applications from natural language prompts. The system creates:
- **Database Models** with fields, relationships, and enums
- **Executable Actions** with business logic and UI components  
- **Automated Schedules** with CRUD operations and triggers
- **Complete Application** that runs independently

## Core Data Structures

### **AgentData (Root Structure)**
```typescript
interface AgentData {
  id: string;
  name: string;
  description: string;
  domain: string;
  createdAt: string;
  updatedAt?: string;
  
  models: AgentModel[];
  enums: AgentEnum[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  
  metadata?: {
    version?: string;
    lastModifiedBy?: string;
    tags?: string[];
    status?: 'active' | 'draft' | 'archived';
    createdAt?: string;
    updatedAt?: string;
    lastUpdateReason?: string;
    lastUpdateTimestamp?: string;
    [key: string]: any;
  };
}
```

### **AgentModel (Database Entity)**
```typescript
interface AgentModel {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  tableName?: string;
  idField: string; // Always "id"
  displayFields: string[];
  
  fields: AgentField[];
  enums?: AgentEnum[]; // Local enums for this model
  records?: ModelRecord[]; // Example records
  
  createdAt?: string;
  updatedAt?: string;
}

interface AgentField {
  id: string;
  name: string;
  type: string; // String, Int, Float, Boolean, DateTime, etc.
  isId: boolean;
  unique: boolean;
  list: boolean; // Array field
  required: boolean;
  kind: 'scalar' | 'object' | 'enum';
  relationField: boolean; // Connects to another model
  title: string; // Human-readable label
  sort: boolean;
  order: number;
  defaultValue?: string;
}

interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### **AgentEnum (Selection Options)**
```typescript
interface AgentEnum {
  id: string;
  name: string;
  fields: AgentEnumField[];
}

interface AgentEnumField {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
}
```

### **AgentAction (Business Logic + UI)**
```typescript
interface AgentAction {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  
  // Data source configuration
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: Array<{
        id: string;
        name: string;
        fields: Array<{ id: string; name: string; }>;
        where?: Record<string, any>;
        limit?: number;
      }>;
    };
  };
  
  // Execution configuration
  execute: {
    code: {
      script: string; // JavaScript execution code
      envVars?: EnvVar[];
    };
  };
  
  // Results processing
  results?: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
  
  createdAt?: string;
  updatedAt?: string;
}

interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
}
```

### **AgentSchedule (Automated Execution)**
```typescript
interface AgentSchedule {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  
  // Scheduling configuration
  interval: {
    pattern: string; // Cron pattern or human-readable
    timezone?: string;
    active?: boolean;
  };
  
  // Data source (same as actions)
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: Array<{
        id: string;
        name: string;
        fields: Array<{ id: string; name: string; }>;
        where?: Record<string, any>;
        limit?: number;
      }>;
    };
  };
  
  // Execution (code or AI prompt)
  execute?: {
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
  
  // Results processing
  results?: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
  
  createdAt?: string;
  updatedAt?: string;
}
```

---

## **STEP 0: Prompt Understanding & Feature Analysis**

### **Purpose**
Deep comprehension of user intent with comprehensive feature imagination and cross-component dependency mapping.

### **Function**: `generatePromptUnderstanding`

### **Input Data Structure**
```typescript
interface Step0Input {
  userRequest: string;
  existingAgent?: AgentData;
}
```

### **AI Prompt Template**
```typescript
const STEP0_PROMPT = `
You are an expert business analyst and system architect. Analyze this user request with extreme thoroughness to understand what they want to build.

USER REQUEST: "${userRequest}"

${existingAgent ? `
EXISTING SYSTEM CONTEXT:
${JSON.stringify(existingAgent, null, 2)}

This is an update/extension request for an existing system. Consider:
- What already exists and should be preserved
- What new functionality is being requested
- How the new request relates to existing components
- What the user's true intent is (add, modify, replace, delete)
` : `
This is a new system creation request.
`}

Provide comprehensive analysis covering:

1. USER REQUEST ANALYSIS:
   - What is the main goal the user wants to achieve?
   - What business context or domain is this for?
   - What's the complexity level (simple/moderate/complex/enterprise)?
   - What's the urgency level (low/medium/high/critical)?
   - How clear is the request (very_clear/clear/somewhat_unclear/unclear)?

2. FEATURE IMAGINATION - Think beyond what's explicitly stated:
   - What core features are absolutely essential?
   - What additional features would make this system excellent?
   - What user experience improvements should be included?
   - What business rules and validations are implied?
   - What integrations might be needed?

3. DATA MODELING NEEDS - Think about data structure:
   For each data entity you identify:
   - What models are required? (name, purpose, priority level)
   - What fields does each model need? (name, type, purpose, required status)
   - What enums are needed? (name, purpose, estimated values)
   - What relationships exist between models?

4. WORKFLOW AUTOMATION NEEDS - Think about actions and processes:
   - What one-time actions are needed? (manual user actions)
   - What recurring schedules are needed? (automated processes)  
   - What business rules need to be automated?
   - What business processes could benefit from automation?

5. CHANGE ANALYSIS (if updating existing system):
   - What specific changes are being requested?
   - What type of changes (create/update/delete)?
   - What's the target scope (models/actions/fields/system)?
   - What's the priority and estimated impact?

6. IMPLEMENTATION STRATEGY:
   - What's the recommended approach (incremental/comprehensive/modular/minimal-viable)?
   - What's the execution order?
   - What are the risks?
   - What are the success criteria?

Be extremely detailed and think about how everything connects together. Consider the user's business domain and imagine features they might not have thought of but would find valuable.
`;
```

### **Output Schema**: `promptUnderstandingSchema`
```typescript
interface Step0Output {
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
```

### **Dependencies**: None (first step)

---

## **STEP 1: AI Decision Making & Execution Strategy**

### **Purpose**
Determine optimal technical approach and execution strategy based on comprehensive analysis.

### **Function**: `generateDecision`

### **Input Data Structure**
```typescript
interface Step1Input {
  command: string;
  conversationContext: string;
  promptUnderstanding: Step0Output;
  existingAgent?: AgentData;
  granularChanges?: any;
  currentOperation: string;
}
```

### **AI Prompt Template**
```typescript
const STEP1_PROMPT = `
You are a technical architect making critical decisions about system implementation strategy.

COMPREHENSIVE ANALYSIS RESULTS:
${JSON.stringify(promptUnderstanding, null, 2)}

CONTEXT:
- User Command: "${command}"
- Operation Type: ${currentOperation}
- Conversation Context: ${conversationContext}
${existingAgent ? `- Existing System: ${JSON.stringify(existingAgent, null, 2)}` : '- New System Creation'}

Based on this analysis, make strategic decisions:

1. SCOPE DECISIONS:
   - Does this need a full agent system? (models + actions + schedules + UI)
   - Can we focus on database modeling only?
   - Can we focus on workflow automation only?
   - Is this a simple update that can be surgical?

2. EXECUTION STRATEGY:
   - Should components be generated together (unified) or separately (phased)?
   - Which components MUST be generated together for consistency?
   - What's the optimal order if phased?
   - What are the incremental targets if updating?

3. COMPONENT COORDINATION:
   - Must models and actions be generated together? (recommended: YES)
   - Must actions and schedules be generated together?
   - Should examples be workflow-based? (recommended: YES)
   - Must UI be data-integrated? (recommended: YES)

4. QUALITY ASSURANCE:
   - What validation steps are critical?
   - What are the highest risks?
   - What safety checks are needed?

5. RESOURCE ALLOCATION:
   - How much processing time is needed?
   - What's the complexity budget?
   - What's the minimum viable result?

Provide specific, actionable decisions with clear reasoning.
`;
```

### **Output Schema**: `decisionSchema`
```typescript
interface Step1Output {
  analysisReasoning: string;
  needsFullAgent: boolean;
  needsDatabase: boolean;
  needsActions: boolean;
  operation: 'create' | 'update' | 'extend';
  priority: 'agent-first' | 'database-first' | 'actions-first';
  scope: {
    agentWork?: string;
    databaseWork?: string;
    actionsWork?: string;
  };
}
```

### **Dependencies**: Step 0 (promptUnderstanding)

---

## **STEP 2: System Overview Generation (Conditional)**

### **Purpose**
Create comprehensive system architecture when building complete agent systems.

### **Function**: Not implemented as separate function (integrated into main flow)

### **Execution Condition**: `decision.needsFullAgent === true`

### **Generated Data Structure**
```typescript
interface Step2Output {
  name: string;
  description: string;
  domain: string;
  requirements: string[];
  features: string[];
  scope: string;
}
```

---

## **STEP 3: Unified Database Schema Generation**

### **Purpose**
Generate models and enums with complete field specifications and relationships.

### **Function**: `generateDatabase`

### **Input Data Structure**
```typescript
interface Step3Input {
  promptUnderstanding: Step0Output;
  existingAgent?: AgentData;
  changeAnalysis?: any;
  agentOverview?: any;
  conversationContext?: string;
  command?: string;
}
```

### **AI Prompt Template** (Comprehensive)
```typescript
const DATABASE_GENERATION_PROMPT = `
You are a database architect designing data models for this business system.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding, null, 2)}

${existingAgent ? `
EXISTING SYSTEM:
Models: ${existingAgent.models.length}
Actions: ${existingAgent.actions.length}
Enums: ${existingAgent.enums.length}

EXISTING MODELS:
${existingAgent.models.map(m => `- ${m.name}: ${m.fields?.length || 0} fields`).join('\n')}

EXISTING ENUMS:
${existingAgent.enums.map(e => `- ${e.name}: ${e.fields?.length || 0} values`).join('\n')}
` : 'This is a new system.'}

ACTION-AWARE DESIGN CONTEXT:
Based on the analysis, these actions will need to be supported:

### One-Time Actions:
${promptUnderstanding.workflowAutomationNeeds.oneTimeActions.map(action => `
- **${action.name}** (${action.complexity} complexity, Priority: ${action.priority})
  - Purpose: ${action.purpose}
  - Role: ${action.role}
  - Data Requirements: ${action.dataRequirements.join(', ')}
  - Expected Output: ${action.expectedOutput}
`).join('')}

### Recurring Schedules:
${promptUnderstanding.workflowAutomationNeeds.recurringSchedules.map(schedule => `
- **${schedule.name}** (${schedule.frequency}, ${schedule.complexity} complexity)
  - Purpose: ${schedule.purpose}
  - Role: ${schedule.role}
  - Data Requirements: ${schedule.dataRequirements.join(', ')}
  - Expected Output: ${schedule.expectedOutput}
`).join('')}

CRITICAL DATABASE DESIGN RULES:

1. ID FIELD NAMING:
   - Every model MUST have "id" as primary key field name
   - idField property MUST be set to "id"
   - Type MUST be "String", isId: true, unique: true, required: true

2. RELATIONSHIP FIELDS:
   - Relation fields MUST have relationField: true
   - Relation fields MUST have kind: "object"
   - Type MUST be target model name (e.g., "User", "Product")
   - List relations should be plural (e.g., "userIds", "productIds")
   - List relations should have defaultValue: []

3. ACTION-AWARE DESIGN:
   - Include status/state fields for workflow tracking
   - Include audit fields (createdAt, updatedAt, createdBy, updatedBy)
   - Include permission fields where actions require role-based access
   - Include fields for action results and error handling
   - Consider bulk operations and batch processing needs

4. FIELD REQUIREMENTS:
   - All fields must have proper types (String, Int, Float, Boolean, DateTime)
   - Required fields must have required: true
   - Unique fields must have unique: true
   - Sort-able fields must have sort: true
   - Proper order numbers for display

5. ENUM INTEGRATION:
   - Create enums for predefined values that actions will use
   - Enum fields in models must reference the enum properly
   - Include all values that actions will need to set or filter

Design models that fully support the identified business requirements and planned actions.
Each model should include all necessary fields for the workflows described.
`;
```

### **Output Schema**: `unifiedDatabaseSchema`
```typescript
interface Step3Output {
  models: Array<{
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    idField: string; // Always "id"
    displayFields: string[];
    fields: Array<{
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
      defaultValue?: string;
    }>;
    enums?: Array<{
      id: string;
      name: string;
      fields: Array<{
        id: string;
        name: string;
        type: string;
        defaultValue?: string;
      }>;
    }>;
  }>;
  enums?: Array<{
    id: string;
    name: string;
    fields: Array<{
      id: string;
      name: string;
      type: string;
      defaultValue?: string;
    }>;
  }>;
}
```

### **Dependencies**: Step 0 (promptUnderstanding), Step 1 (decision)

---

## **STEP 3.5: Example Records Generation**

### **Purpose**
Generate realistic example data that demonstrates actual workflow scenarios.

### **Function**: `generateExampleRecords`

### **Input Data Structure**
```typescript
interface Step3_5Input {
  models: AgentModel[];
  existingModels: AgentModel[];
  businessContext: string;
}
```

### **AI Prompt Template**
```typescript
const EXAMPLE_RECORDS_PROMPT = `
Generate realistic example records for these new database models:

MODELS TO GENERATE DATA FOR:
${JSON.stringify(models, null, 2)}

BUSINESS CONTEXT: ${businessContext}

GENERATION RULES:
1. Generate 3-5 realistic records per model
2. Use realistic business data appropriate for the domain
3. Ensure relationships between models are properly connected
4. Include variety in status/enum fields
5. Use realistic timestamps
6. Follow proper data types and constraints
7. Make data that would be useful for testing workflows

For each model, generate records that:
- Demonstrate different states/statuses
- Show relationships to other models
- Include realistic business scenarios
- Would be useful for testing the planned actions
- Represent typical use cases in this domain

Return a JSON object with model names as keys and arrays of example records as values.
`;
```

### **Output**: `Record<string, any[]>`

### **Dependencies**: Step 3 (models)

---

## **STEP 4: Unified Actions Generation**

### **Purpose**
Generate actions with complete business logic and UI components.

### **Function**: `generateActions`

### **Input Data Structure**
```typescript
interface Step4Input {
  promptUnderstanding: Step0Output;
  databaseResult: { models: AgentModel[], enums: AgentEnum[] };
  existingAgent?: AgentData;
  changeAnalysis?: any;
  agentOverview?: any;
  conversationContext?: string;
  command?: string;
}
```

### **AI Prompt Template**
```typescript
const ACTIONS_GENERATION_PROMPT = `
You are a workflow automation expert creating business actions that work with this database schema.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding, null, 2)}

DATABASE SCHEMA:
Models: ${JSON.stringify(databaseResult.models, null, 2)}
Enums: ${JSON.stringify(databaseResult.enums, null, 2)}

REQUIRED ACTIONS TO CREATE:
${promptUnderstanding.workflowAutomationNeeds.oneTimeActions.map(action => `
**${action.name}**
- Purpose: ${action.purpose}
- Role: ${action.role}
- Complexity: ${action.complexity}
- Business Value: ${action.businessValue}
- Steps: ${action.estimatedSteps.join(', ')}
- Data Requirements: ${action.dataRequirements.join(', ')}
- Expected Output: ${action.expectedOutput}
`).join('\n')}

CRITICAL ACTION DESIGN RULES:

1. DATA INTEGRATION:
   - Actions MUST use the exact model and field names from the schema
   - Reference only fields that actually exist in the models
   - Use proper enum values that exist in the enums
   - Include proper database operations (Create/Update)

2. CODE REQUIREMENTS:
   - Generate executable JavaScript code in the 'script' field
   - Code must handle input validation
   - Code must perform database operations correctly
   - Include proper error handling
   - Return appropriate success/error responses

3. BUSINESS LOGIC:
   - Implement the business rules identified in the analysis
   - Include proper permission checks based on user roles
   - Handle edge cases and validation
   - Follow the workflow steps outlined in requirements

4. TECHNICAL STRUCTURE:
   - Each action must have proper dataSource configuration
   - Use 'database' type for dataSource when reading from models
   - Include all required models and fields in dataSource
   - Set proper action type (Create/Update)
   - Set appropriate user role (admin/member)

Generate complete, working actions that implement the required business functionality.
`;
```

### **Output Schema**: `unifiedActionsSchema`
```typescript
interface Step4Output {
  actions: Array<{
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
        models: Array<{
          id: string;
          name: string;
          fields: Array<{ id: string; name: string; }>;
          where?: Record<string, any>;
          limit?: number;
        }>;
      };
    };
    execute: {
      code: {
        script: string;
        envVars?: EnvVar[];
      };
    };
    results?: {
      actionType: 'Create' | 'Update';
      model: string;
      identifierIds?: string[];
      fields?: Record<string, any>;
      fieldsToUpdate?: Record<string, any>;
    };
  }>;
}
```

### **Dependencies**: Step 0 (promptUnderstanding), Step 3 (databaseResult)

---

## **STEP 4.25: Enhanced Action Analysis & Code Generation**

### **Purpose**
Generate detailed action analysis and executable code with UI components following the comprehensive action requirements.

### **Functions**: 
- `generateActionsWithEnhancedAnalysis`
- `generateEnhancedActionAnalysis` 
- `generateEnhancedActionCode`
- `generateCompleteEnhancedAction`

This step provides enhanced action generation with:
- Detailed business analysis
- Complex input parameter handling (including nested objects and database ID arrays)
- Comprehensive UI component generation
- Executable JavaScript code with proper validation
- Test scenarios and examples

### **Action Generation Requirements (User Specification)**

#### **1. Action Description & AI Analysis**
Each action must include:

1. **Description**: Clear business purpose and functionality
2. **AI Analysis Components**:
   - **Tables that will be updated/created/deleted**: Specific models and operations
   - **Tables needed for operation**: Models required for reading/validation
   - **External REST API needs**: API endpoints, keys, and setup instructions
   - **Input parameters**: Consider if parameters come from DB models
   - **Output parameters**: Expected response structure
   - **Pseudo code steps**: Very detailed step-by-step logic
   - **Function code**: 
     - Use `database["ModelName"]` to get all records
     - Use filter/find to locate items
     - Show complete implementation
   - **UI view steps**: Minimal steps to gather input (manual + DB record selection)
   - **UI code**: React components using Tailwind CSS with submit buttons

#### **2. Enhanced Action Generation Process**

**Step 1: Imagination**
- Title, description, action for Member or Admin
- Code specifications for backend
- UI view specifications:
  - Run code view
  - Show results view

**Step 2: Generate Analysis** (All fields REQUIRED)
- [ ] **Tables that will be updated/created/deleted**
- [ ] **Tables needed for operation**
- [ ] **External REST API usage** (API keys, names, setup instructions)
- [ ] **Input parameters** (consider DB model sources)
- [ ] **Output parameters**
- [ ] **Pseudo code steps** (very detailed with input/output fields)
- [ ] **UI view steps** (minimal React components with Tailwind + submit buttons)
- [ ] **AI determination needs** (prompts, input fields, output fields)
- [ ] **Test scenarios** (validate code correctness)

**Step 3: Generate Code** (All fields REQUIRED)
- [ ] **Database parameter**: Whole database object for reading current DB info
- [ ] **Standard parameters**: `{database, input, envs}` for external API keys
- [ ] **Return format**: Tables updated/created/deleted in separate arrays
- [ ] **Output format**: `{output, data: [{modelId, updatedRecords, deletedRecords, createdRecords}]}`
- [ ] **External API calls**: Use fetch() with proper error checking
- [ ] **Pseudo code implementation**: Process using detailed steps

### **Schema Validation Error Prevention**

#### **Critical Schema Requirements**
To prevent `AI_NoObjectGeneratedError` and validation failures:

**1. Required Object Fields (NEVER undefined)**:
```typescript
// MUST provide actual objects, not undefined
returnType: {
  output: { success: true, data: {}, message: "" },  // REQUIRED OBJECT
  data: [{ modelId: "ModelName", createdRecords: [] }]
}

usage: {
  example: "const fn = new Function(...); await fn(db, input, member);",
  parameterExample: { key: "value" }  // REQUIRED OBJECT
}

testCases: [{
  name: "Test Name",
  description: "Test Description", 
  testFunctionBody: "test code here",
  mockData: { input: {}, database: {}, member: {} },  // REQUIRED OBJECT
  expectedResult: { success: true, data: {} },  // REQUIRED OBJECT
  executionExample: "Run test example"
}]

uiComponents: [{
  architecturePlan: {
    propsInterface: { prop: "type" },  // REQUIRED OBJECT
    // ... other fields
  },
  usage: {
    propsExamples: { prop: "value" },  // REQUIRED OBJECT
    stateExamples: { state: "value" }  // REQUIRED OBJECT
  }
}]

integrationCode: {
  errorHandling: "try/catch implementation"  // REQUIRED STRING
}
```

**2. Common Validation Errors & Fixes**:

| Error Path | Issue | Fix |
|------------|-------|-----|
| `codeComponents.mainFunction.returnType.output` | undefined | Provide object: `{success: true, data: {}, message: ""}` |
| `codeComponents.mainFunction.usage.parameterExample` | undefined | Provide object: `{param: "value"}` |
| `codeComponents.testCases[].mockData` | undefined | Provide object: `{input: {}, database: {}, member: {}}` |
| `codeComponents.testCases[].expectedResult` | undefined | Provide object: `{success: true, data: {}}` |
| `uiComponents[].architecturePlan.propsInterface` | undefined | Provide object: `{propName: "propType"}` |
| `uiComponents[].usage.propsExamples` | undefined | Provide object: `{prop: "exampleValue"}` |
| `uiComponents[].usage.stateExamples` | undefined | Provide object: `{state: "exampleState"}` |
| `integrationCode.errorHandling` | undefined | Provide string: error handling code |

**3. Error Prevention Strategies**:

- **Pre-validation**: Check all object fields before AI generation
- **Template Structure**: Use complete templates with all required fields
- **Fallback Values**: Provide default objects for optional fields
- **Schema Enforcement**: Validate against schema before returning results
- **Recovery Mechanisms**: Implement automatic retry with fixed structures

### **Enhanced Prompt Templates**

#### **Analysis Generation Prompt**
```typescript
const ENHANCED_ANALYSIS_PROMPT = `
Generate comprehensive action analysis with ALL REQUIRED FIELDS:

MANDATORY OBJECT REQUIREMENTS:
1. inputParameters.structure.nestedStructure.schema = {JSON Schema Object}
2. inputParameters.structure.exampleInputs[].input = {Actual Input Object}
3. outputParameters.successResponse.format = {JSON Schema Object}
4. outputParameters.errorResponse.format = {JSON Schema Object}
5. testScenarios[].inputData = {Actual Input Object}
6. testScenarios[].expectedOutput = {Actual Output Object}

ANALYSIS REQUIREMENTS:
- Tables to update/create/delete: [Specify exact models and operations]
- Tables needed for operation: [List all required models with fields]
- External APIs: [Include API names, keys, setup instructions]
- Input parameters: [Consider DB model relationships]
- Output parameters: [Define complete response structure]
- Pseudo code: [Very detailed step-by-step with input/output per step]
- UI steps: [Minimal React components with Tailwind CSS]
- Test scenarios: [Complete validation test cases]

NEVER return undefined for any object field.
`;
```

#### **Code Generation Prompt**
```typescript
const ENHANCED_CODE_PROMPT = `
Generate production-ready code with ALL REQUIRED OBJECT FIELDS:

MANDATORY STRUCTURE REQUIREMENTS:
1. returnType.output = {success: boolean, data: object, message: string}
2. usage.parameterExample = {parameter: "example_value"}
3. testCases[].mockData = {input: object, database: object, member: object}
4. testCases[].expectedResult = {success: boolean, data: object}
5. uiComponents[].architecturePlan.propsInterface = {propName: "propType"}
6. uiComponents[].usage.propsExamples = {prop: "value"}
7. uiComponents[].usage.stateExamples = {state: "value"}
8. integrationCode.errorHandling = "complete error handling code"

CODE REQUIREMENTS:
- Function parameters: MUST be ["database", "input", "member"]
- Database access: Use database["ModelName"] for all records
- Data filtering: Use .find() or .filter() for record selection
- Return format: {output: {}, data: [{modelId, createdRecords, updatedRecords, deletedRecords}]}
- External APIs: Use fetch() with proper error handling
- UI Components: React with Tailwind CSS, include submit buttons

NEVER return undefined for any required field.
`;
```

### **Key Features**:
1. **Advanced Input Parameter Analysis**: Supports nested objects, arrays, and database ID references
2. **UI Component Generation**: Creates React components with Tailwind CSS styling
3. **Code Execution**: Generates executable JavaScript with proper error handling
4. **Validation**: Includes comprehensive input validation and business rule enforcement
5. **Error Prevention**: Built-in validation to prevent schema mismatches
6. **Test Coverage**: Comprehensive test scenarios for validation

### **Dependencies**: Step 0 (promptUnderstanding), Step 3 (databaseResult)

---

## **STEP 4.5: Schedules Generation**

### **Purpose**
Generate automated schedules for recurring tasks.

### **Function**: `generateSchedules`

### **Input Data Structure**
```typescript
interface Step4_5Input {
  promptUnderstanding: Step0Output;
  databaseSchema: any;
  actions: any;
  existingAgent?: AgentData;
  changeAnalysis?: any;
}
```

### **AI Prompt Template**
```typescript
const SCHEDULES_GENERATION_PROMPT = `
You are an automation expert creating scheduled tasks for this business system.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding, null, 2)}

AVAILABLE ACTIONS:
${JSON.stringify(actions, null, 2)}

DATABASE MODELS:
${JSON.stringify(databaseSchema, null, 2)}

REQUIRED SCHEDULES TO CREATE:
${promptUnderstanding.workflowAutomationNeeds.recurringSchedules.map(schedule => `
**${schedule.name}**
- Purpose: ${schedule.purpose}
- Frequency: ${schedule.frequency}
- Timing: ${schedule.timing}
- Role: ${schedule.role}
- Complexity: ${schedule.complexity}
- Business Value: ${schedule.businessValue}
- Steps: ${schedule.estimatedSteps.join(', ')}
- Data Requirements: ${schedule.dataRequirements.join(', ')}
- Expected Output: ${schedule.expectedOutput}
`).join('\n')}

SCHEDULE DESIGN RULES:

1. TIMING CONFIGURATION:
   - Convert frequency requirements to proper cron patterns or readable schedules
   - Set appropriate timezone if specified
   - Make schedules active by default

2. DATA INTEGRATION:
   - Use database type for dataSource when reading from models
   - Reference only existing models and fields
   - Include proper filtering and limits

3. EXECUTION LOGIC:
   - Generate executable code or AI prompts as appropriate
   - Include proper error handling
   - Implement the business logic described
   - Handle edge cases and validation

4. RESULTS PROCESSING:
   - Set proper action type (Create/Update)
   - Target appropriate models
   - Include necessary field mappings

Generate complete, working schedules that automate the required recurring tasks.
`;
```

### **Output Schema**: `unifiedSchedulesSchema`
```typescript
interface Step4_5Output {
  schedules: Array<{
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
        models: Array<{
          id: string;
          name: string;
          fields: Array<{ id: string; name: string; }>;
          where?: Record<string, any>;
          limit?: number;
        }>;
      };
    };
    execute?: {
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
    results?: {
      actionType: 'Create' | 'Update';
      model: string;
      identifierIds?: string[];
      fields?: Record<string, any>;
      fieldsToUpdate?: Record<string, any>;
    };
  }>;
}
```

### **Dependencies**: Step 0 (promptUnderstanding), Step 3 (databaseSchema), Step 4 (actions)

---

## **STEP 5: Final Integration & Validation**

### **Purpose**
Integrate all components and perform final validation with intelligent merging.

### **Functions**:
- `performDeepMerge` (from merging.ts)
- `intelligentDocumentUpdate` (from index.ts)
- Various validation functions

### **Integration Process**:
1. **Create Final Agent Data**: Combine all generated components
2. **Intelligent Merging**: Preserve existing data while incorporating new components
3. **Cross-Reference Validation**: Ensure all references between components are valid
4. **Document Persistence**: Save with comprehensive metadata

### **Key Features**:
- **Surgical Updates**: Only modify what needs to change
- **Data Preservation**: Existing data is intelligently preserved
- **Reference Validation**: All model/enum/action references are validated
- **Comprehensive Metadata**: Track generation process and changes

---

## **ERROR PREVENTION & TROUBLESHOOTING GUIDE**

### **Common Schema Validation Errors**

#### **1. AI_NoObjectGeneratedError: "response did not match schema"**

**Root Cause**: AI returning `undefined` for required object fields in the schema.

**Prevention Strategies**:

1. **Pre-Generation Validation**:
```typescript
// Before calling generateObject, validate template structure
const validateTemplate = (template: any) => {
  const requiredObjectFields = [
    'codeComponents.mainFunction.returnType.output',
    'codeComponents.mainFunction.usage.parameterExample',
    'codeComponents.testCases[].mockData',
    'codeComponents.testCases[].expectedResult',
    'uiComponents[].architecturePlan.propsInterface',
    'uiComponents[].usage.propsExamples',
    'uiComponents[].usage.stateExamples',
    'integrationCode.errorHandling'
  ];
  
  // Validate each path exists and is not undefined
  requiredObjectFields.forEach(path => {
    if (getNestedValue(template, path) === undefined) {
      throw new Error(`Required field ${path} is undefined`);
    }
  });
};
```

2. **Template Enforcement**:
```typescript
// Use complete templates with all required fields
const SAFE_ACTION_TEMPLATE = {
  actionId: "action_" + Date.now(),
  actionName: "Action Name",
  codeComponents: {
    mainFunction: {
      name: "functionName",
      parameterNames: ["database", "input", "member"],
      functionBody: "// function implementation",
      parameterDescriptions: {
        database: "Database access object",
        input: "User input parameters", 
        member: "User context and permissions"
      },
      returnType: {
        output: { success: true, data: {}, message: "Success" },
        data: [{ modelId: "ModelName", createdRecords: [] }]
      },
      usage: {
        example: "const fn = new Function('database', 'input', 'member', functionBody);",
        parameterExample: { param: "value" }
      }
    },
    testCases: [{
      name: "Test Case",
      description: "Test description",
      testFunctionBody: "// test code",
      mockData: { input: {}, database: {}, member: {} },
      expectedResult: { success: true, data: {} },
      executionExample: "Run test"
    }],
    // ... other required fields
  },
  uiComponents: [{
    componentName: "Component",
    componentType: "input-form",
    architecturePlan: {
      propsInterface: { prop: "type" },
      // ... other fields
    },
    usage: {
      propsExamples: { prop: "value" },
      stateExamples: { state: "value" }
    }
  }],
  integrationCode: {
    errorHandling: "try { /* code */ } catch (error) { /* handle */ }"
  }
};
```

3. **Recovery Mechanisms**:
```typescript
// Implement automatic recovery for validation errors
const generateWithRecovery = async (prompt: string) => {
  try {
    return await generateObject({ schema, prompt });
  } catch (error) {
    if (error.message.includes('Required') || error.message.includes('undefined')) {
      console.log('🔧 Applying validation error fix...');
      
      // Use fixed template with all required fields
      return await generateObject({
        schema,
        prompt: prompt + "\n\nCRITICAL: Provide ALL required object fields. Never use undefined.",
        temperature: 0.1 // Lower temperature for more consistent output
      });
    }
    throw error;
  }
};
```

#### **2. Type Validation Errors**

**Common Issues**:
- Arrays expected but strings provided
- Objects expected but undefined provided
- Enum values not matching schema

**Prevention**:
```typescript
// Validate data types before schema validation
const validateDataTypes = (data: any, schema: any) => {
  // Check arrays
  if (schema.type === 'array' && !Array.isArray(data)) {
    throw new Error(`Expected array, got ${typeof data}`);
  }
  
  // Check objects
  if (schema.type === 'object' && (typeof data !== 'object' || data === null)) {
    throw new Error(`Expected object, got ${typeof data}`);
  }
  
  // Check enums
  if (schema.enum && !schema.enum.includes(data)) {
    throw new Error(`Value ${data} not in enum ${schema.enum}`);
  }
};
```

### **Action Generation Best Practices**

#### **1. Database Operations**
```typescript
// Correct database access pattern
const functionBody = `
// 1. Validate input
if (!input.leadId) throw new Error('Lead ID required');

// 2. Access database records
const leads = database['Lead']; // Use exact model name
const lead = leads.find(l => l.id === input.leadId);

// 3. Validate existence
if (!lead) throw new Error('Lead not found');

// 4. Perform operations
lead.status = 'Updated';
lead.updatedAt = new Date().toISOString();

// 5. Return proper format
return {
  output: { success: true, data: lead, message: 'Lead updated' },
  data: [{ modelId: 'Lead', updatedRecords: [lead] }]
};
`;
```

#### **2. UI Component Generation**
```typescript
// Correct React component pattern
const uiComponent = {
  componentName: "LeadSelector",
  componentType: "selection-interface",
  implementation: {
    reactCode: `
import React, { useState } from 'react';

const LeadSelector = ({ leads, onSelect }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-green-800 mb-4">
        Select Lead
      </h3>
      <div className="space-y-2">
        {leads.map(lead => (
          <div
            key={lead.id}
            onClick={() => {
              setSelectedLead(lead);
              onSelect(lead);
            }}
            className="p-3 border rounded-md cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors"
          >
            <div className="font-medium text-gray-900">{lead.name}</div>
            <div className="text-sm text-gray-600">{lead.email}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onSelect(selectedLead)}
        disabled={!selectedLead}
        className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Select Lead
      </button>
    </div>
  );
};

export default LeadSelector;
    `,
    // ... other required fields
  }
};
```

#### **3. Test Case Generation**
```typescript
// Comprehensive test case structure
const testCase = {
  name: "Valid Lead Selection",
  description: "Test selecting a valid lead",
  testFunctionBody: `
const mockDatabase = {
  Lead: [
    { id: 'lead_1', name: 'John Doe', email: 'john@example.com', status: 'New' }
  ]
};
const mockInput = { leadId: 'lead_1' };
const mockMember = { id: 'user_1', role: 'sales' };

const result = await functionName(mockDatabase, mockInput, mockMember);
return result.output.success === true;
  `,
  mockData: {
    input: { leadId: 'lead_1' },
    database: { Lead: [{ id: 'lead_1', name: 'John Doe' }] },
    member: { id: 'user_1', role: 'sales' }
  },
  expectedResult: {
    success: true,
    data: { id: 'lead_1', name: 'John Doe', status: 'Updated' },
    message: 'Lead updated successfully'
  },
  executionExample: "Run with mock data to validate functionality"
};
```

### **Debugging Guide**

#### **1. Schema Validation Debugging**
```typescript
// Debug schema validation errors
const debugSchemaValidation = (error: any, data: any) => {
  console.log('Schema Validation Error:', error.message);
  console.log('Error Issues:', error.issues);
  
  // Check each issue
  error.issues.forEach((issue: any) => {
    console.log(`Path: ${issue.path.join('.')}`);
    console.log(`Expected: ${issue.expected}`);
    console.log(`Received: ${issue.received}`);
    console.log(`Message: ${issue.message}`);
    
    // Get actual value at path
    const actualValue = getNestedValue(data, issue.path.join('.'));
    console.log(`Actual Value:`, actualValue);
  });
};
```

#### **2. Generation Debugging**
```typescript
// Debug generation process
const debugGeneration = async (prompt: string, schema: any) => {
  console.log('🔍 Starting generation debug...');
  console.log('Prompt length:', prompt.length);
  console.log('Schema keys:', Object.keys(schema.shape || schema));
  
  try {
    const result = await generateObject({ schema, prompt });
    console.log('✅ Generation successful');
    return result;
  } catch (error) {
    console.log('❌ Generation failed:', error.message);
    
    // Try with simplified schema
    const simplifiedSchema = createSimplifiedSchema(schema);
    console.log('🔧 Retrying with simplified schema...');
    
    return await generateObject({ schema: simplifiedSchema, prompt });
  }
};
```

### **Performance Optimization**

#### **1. Reduce Generation Complexity**
- Use lower temperature (0.1) for consistent output
- Limit prompt length to essential information
- Use structured examples in prompts
- Implement caching for repeated generations

#### **2. Error Recovery Optimization**
- Implement exponential backoff for retries
- Use fallback templates for common failures
- Cache successful generation patterns
- Monitor error rates and adjust prompts accordingly

### **Monitoring & Alerting**

#### **1. Error Tracking**
```typescript
// Track common errors
const errorTracker = {
  schemaValidation: 0,
  generationTimeout: 0,
  templateMismatch: 0,
  
  logError: (type: string, error: any) => {
    errorTracker[type]++;
    console.log(`Error ${type}: ${error.message}`);
    
    // Alert if error rate is high
    if (errorTracker[type] > 5) {
      console.warn(`High error rate for ${type}: ${errorTracker[type]} errors`);
    }
  }
};
```

#### **2. Success Metrics**
- Generation success rate
- Schema validation pass rate
- Average generation time
- Error recovery success rate

This comprehensive error prevention guide should help prevent the common validation errors and provide clear guidance for troubleshooting issues in the Agent Builder system.

# Test Case Planning & Validation Framework

## **Overview**
This section provides comprehensive test case planning for validating actions and schedules in the Agent Builder system. Each generated action and schedule must include executable test scenarios that validate functionality, error handling, and business logic.

## **Test Case Architecture**

### **1. Action Test Case Structure**

#### **Required Test Components**
Every action must include these test case types:

1. **Success Scenarios**: Valid inputs with expected successful outputs
2. **Validation Errors**: Invalid inputs testing input validation
3. **Business Logic Errors**: Valid inputs that fail business rules
4. **Database Constraint Errors**: Operations that violate database constraints
5. **External API Errors**: Failed external service calls
6. **Edge Cases**: Boundary conditions and unusual but valid scenarios

#### **Test Case Schema**
```typescript
interface ActionTestCase {
  scenarioName: string;
  description: string;
  inputData: Record<string, any>; // Must be actual object, not string
  expectedOutput: Record<string, any>; // Must be actual object, not string
  expectedDatabaseChanges: Array<{
    model: string;
    operation: 'create' | 'update' | 'delete';
    recordCount: number;
    specificChanges?: Record<string, any>;
  }>;
  shouldSucceed: boolean;
  errorExpected?: string;
  databaseIdsInInput: Array<{
    path: string; // JSON path to the database ID
    modelName: string; // Model this ID should reference
    value: any; // The ID value used in the test
  }>;
  mockDatabaseState: Record<string, any[]>; // Required database records for test
  memberContext: {
    id: string;
    role: 'admin' | 'member';
    email: string;
    permissions?: string[];
  };
}
```

### **2. Schedule Test Case Structure**

#### **Required Test Components**
Every schedule must include these test case types:

1. **Execution Success**: Schedule runs successfully with expected data processing
2. **Data Availability**: Schedule handles missing or insufficient data
3. **Timing Validation**: Schedule respects timing constraints and intervals
4. **Role Permissions**: Schedule enforces proper role-based access
5. **Error Recovery**: Schedule handles failures gracefully
6. **Resource Limits**: Schedule respects data processing limits

#### **Schedule Test Schema**
```typescript
interface ScheduleTestCase {
  scenarioName: string;
  description: string;
  scheduleConfig: {
    interval: string; // Cron pattern or readable format
    timezone?: string;
    active: boolean;
  };
  mockDatabaseState: Record<string, any[]>;
  environmentVars: Record<string, string>;
  expectedOutput: {
    success: boolean;
    recordsProcessed: number;
    databaseChanges: Array<{
      model: string;
      operation: 'create' | 'update' | 'delete';
      recordCount: number;
    }>;
    nextScheduledRun?: string;
  };
  shouldSucceed: boolean;
  errorExpected?: string;
  memberContext: {
    id: string;
    role: 'admin' | 'member';
    email: string;
  };
}
```

## **Test Case Examples**

### **Action Test Case Example: "Create Lead Follow-up"**

```typescript
// Test Case 1: Successful Lead Follow-up Creation
const successfulFollowUpTest = {
  scenarioName: "Successful Lead Follow-up Creation",
  description: "Test creating a follow-up task for an existing lead with valid template",
  
  // Input data (must be actual object)
  inputData: {
    leadId: "lead_123",
    emailTemplateId: "template_456",
    followUpDateTime: "2024-01-15T10:00:00Z",
    priority: "high",
    notes: "Initial follow-up after demo"
  },
  
  // Expected output (must be actual object)
  expectedOutput: {
    success: true,
    message: "Follow-up scheduled successfully",
    data: {
      followUpId: "followup_789",
      scheduledFor: "2024-01-15T10:00:00Z",
      leadId: "lead_123",
      status: "scheduled"
    }
  },
  
  // Database changes expected
  expectedDatabaseChanges: [
    {
      model: "FollowUp",
      operation: "create",
      recordCount: 1,
      specificChanges: {
        leadId: "lead_123",
        templateId: "template_456",
        scheduledDate: "2024-01-15T10:00:00Z",
        status: "scheduled"
      }
    },
    {
      model: "Lead",
      operation: "update", 
      recordCount: 1,
      specificChanges: {
        lastFollowUpDate: "2024-01-15T10:00:00Z",
        status: "follow_up_scheduled"
      }
    }
  ],
  
  shouldSucceed: true,
  
  // Database IDs referenced in input
  databaseIdsInInput: [
    {
      path: "leadId",
      modelName: "Lead",
      value: "lead_123"
    },
    {
      path: "emailTemplateId", 
      modelName: "EmailTemplate",
      value: "template_456"
    }
  ],
  
  // Required database state for test
  mockDatabaseState: {
    Lead: [
      {
        id: "lead_123",
        name: "John Doe",
        email: "john@example.com",
        status: "qualified",
        assignedTo: "user_456"
      }
    ],
    EmailTemplate: [
      {
        id: "template_456",
        name: "Follow-up Template",
        subject: "Following up on our conversation",
        body: "Hi {{leadName}}, following up...",
        active: true
      }
    ],
    FollowUp: [] // Empty initially
  },
  
  memberContext: {
    id: "user_456",
    role: "member",
    email: "sales@company.com",
    permissions: ["create_followup", "read_leads"]
  }
};

// Test Case 2: Invalid Lead ID Error
const invalidLeadTest = {
  scenarioName: "Invalid Lead ID Error",
  description: "Test error handling when lead ID doesn't exist",
  
  inputData: {
    leadId: "nonexistent_lead",
    emailTemplateId: "template_456", 
    followUpDateTime: "2024-01-15T10:00:00Z"
  },
  
  expectedOutput: {
    success: false,
    error: "Lead not found",
    code: "LEAD_NOT_FOUND",
    details: {
      leadId: "nonexistent_lead",
      message: "The specified lead does not exist or you don't have permission to access it"
    }
  },
  
  expectedDatabaseChanges: [], // No changes should occur
  
  shouldSucceed: false,
  errorExpected: "Lead not found",
  
  databaseIdsInInput: [
    {
      path: "leadId",
      modelName: "Lead", 
      value: "nonexistent_lead"
    }
  ],
  
  mockDatabaseState: {
    Lead: [
      {
        id: "lead_123", // Different ID than requested
        name: "Jane Smith",
        email: "jane@example.com"
      }
    ],
    EmailTemplate: [
      {
        id: "template_456",
        name: "Follow-up Template",
        active: true
      }
    ]
  },
  
  memberContext: {
    id: "user_456",
    role: "member", 
    email: "sales@company.com"
  }
};

// Test Case 3: Permission Denied Error
const permissionDeniedTest = {
  scenarioName: "Permission Denied - Admin Only Action",
  description: "Test that member role cannot execute admin-only actions",
  
  inputData: {
    leadId: "lead_123",
    emailTemplateId: "template_456",
    followUpDateTime: "2024-01-15T10:00:00Z"
  },
  
  expectedOutput: {
    success: false,
    error: "Insufficient permissions",
    code: "PERMISSION_DENIED",
    details: {
      requiredRole: "admin",
      userRole: "member",
      action: "create_followup"
    }
  },
  
  expectedDatabaseChanges: [],
  shouldSucceed: false,
  errorExpected: "Insufficient permissions",
  
  databaseIdsInInput: [
    {
      path: "leadId",
      modelName: "Lead",
      value: "lead_123"
    }
  ],
  
  mockDatabaseState: {
    Lead: [
      {
        id: "lead_123",
        name: "John Doe",
        email: "john@example.com"
      }
    ]
  },
  
  memberContext: {
    id: "user_789",
    role: "member", // Member trying to execute admin action
    email: "junior@company.com"
  }
};
```

### **Schedule Test Case Example: "Daily Lead Scoring"**

```typescript
// Test Case 1: Successful Daily Lead Scoring
const successfulLeadScoringTest = {
  scenarioName: "Successful Daily Lead Scoring Execution",
  description: "Test daily schedule that scores leads based on activity and profile data",
  
  scheduleConfig: {
    interval: "0 2 * * *", // Daily at 2 AM
    timezone: "UTC",
    active: true
  },
  
  mockDatabaseState: {
    Lead: [
      {
        id: "lead_001",
        name: "John Doe",
        email: "john@example.com",
        company: "TechCorp",
        score: 0,
        lastActivity: "2024-01-14T15:30:00Z",
        source: "website",
        status: "new"
      },
      {
        id: "lead_002", 
        name: "Jane Smith",
        email: "jane@bigcompany.com",
        company: "BigCompany Inc",
        score: 25,
        lastActivity: "2024-01-13T10:00:00Z",
        source: "referral",
        status: "qualified"
      }
    ],
    Activity: [
      {
        id: "activity_001",
        leadId: "lead_001",
        type: "email_open",
        timestamp: "2024-01-14T15:30:00Z",
        value: 1
      },
      {
        id: "activity_002",
        leadId: "lead_001", 
        type: "website_visit",
        timestamp: "2024-01-14T16:00:00Z",
        value: 1
      }
    ],
    LeadScore: [] // Will be populated by schedule
  },
  
  environmentVars: {
    SCORING_ALGORITHM_VERSION: "v2.1",
    MAX_SCORE: "100",
    ACTIVITY_WEIGHT: "0.3",
    PROFILE_WEIGHT: "0.7"
  },
  
  expectedOutput: {
    success: true,
    recordsProcessed: 2,
    databaseChanges: [
      {
        model: "Lead",
        operation: "update",
        recordCount: 2 // Both leads updated with new scores
      },
      {
        model: "LeadScore",
        operation: "create", 
        recordCount: 2 // Score history records created
      }
    ],
    nextScheduledRun: "2024-01-16T02:00:00Z",
    summary: {
      leadsScored: 2,
      averageScoreIncrease: 15,
      highValueLeads: 1
    }
  },
  
  shouldSucceed: true,
  
  memberContext: {
    id: "system",
    role: "admin",
    email: "system@company.com"
  }
};

// Test Case 2: No Leads to Process
const noLeadsToProcessTest = {
  scenarioName: "No Leads Available for Scoring",
  description: "Test schedule behavior when no leads need scoring",
  
  scheduleConfig: {
    interval: "0 2 * * *",
    timezone: "UTC", 
    active: true
  },
  
  mockDatabaseState: {
    Lead: [], // No leads in database
    Activity: [],
    LeadScore: []
  },
  
  environmentVars: {
    SCORING_ALGORITHM_VERSION: "v2.1"
  },
  
  expectedOutput: {
    success: true,
    recordsProcessed: 0,
    databaseChanges: [],
    nextScheduledRun: "2024-01-16T02:00:00Z",
    summary: {
      message: "No leads found for scoring",
      leadsScored: 0
    }
  },
  
  shouldSucceed: true,
  
  memberContext: {
    id: "system",
    role: "admin", 
    email: "system@company.com"
  }
};

// Test Case 3: Schedule Execution Error
const scheduleExecutionErrorTest = {
  scenarioName: "Database Connection Error During Execution",
  description: "Test error handling when database operations fail",
  
  scheduleConfig: {
    interval: "0 2 * * *",
    timezone: "UTC",
    active: true
  },
  
  mockDatabaseState: {
    Lead: [
      {
        id: "lead_001",
        name: "John Doe",
        email: "john@example.com"
      }
    ]
  },
  
  environmentVars: {
    SCORING_ALGORITHM_VERSION: "v2.1",
    SIMULATE_DB_ERROR: "true" // Trigger database error for testing
  },
  
  expectedOutput: {
    success: false,
    error: "Database operation failed",
    code: "DB_CONNECTION_ERROR",
    recordsProcessed: 0,
    databaseChanges: [],
    retryScheduled: true,
    nextRetryAt: "2024-01-15T02:30:00Z" // 30 minutes later
  },
  
  shouldSucceed: false,
  errorExpected: "Database operation failed",
  
  memberContext: {
    id: "system",
    role: "admin",
    email: "system@company.com"
  }
};
```

## **Executable Test Code Generation**

### **Action Test Code Template**

```typescript
// Generated test function for action validation
function generateActionTestCode(actionName: string, testCase: ActionTestCase): string {
  return `
// Test: ${testCase.scenarioName}
async function test_${actionName.replace(/\s+/g, '_')}_${testCase.scenarioName.replace(/\s+/g, '_')}() {
  console.log('🧪 Running test: ${testCase.scenarioName}');
  
  // Setup mock database
  const mockDatabase = ${JSON.stringify(testCase.mockDatabaseState, null, 2)};
  
  // Setup member context
  const member = ${JSON.stringify(testCase.memberContext, null, 2)};
  
  // Setup input data
  const input = ${JSON.stringify(testCase.inputData, null, 2)};
  
  try {
    // Execute the action
    const result = await executeGeneratedAction(
      actionFunctionBody, // The generated action code
      mockDatabase,
      input,
      member
    );
    
    // Validate success expectation
    if (${testCase.shouldSucceed}) {
      console.log('✅ Action executed successfully');
      
      // Validate output structure
      assert(result.output, 'Result should have output property');
      assert(result.data, 'Result should have data property');
      
      // Validate expected output
      ${generateOutputValidation(testCase.expectedOutput)}
      
      // Validate database changes
      ${generateDatabaseChangeValidation(testCase.expectedDatabaseChanges)}
      
      console.log('✅ All validations passed');
      return { success: true, result };
      
    } else {
      console.log('❌ Action should have failed but succeeded');
      return { success: false, error: 'Expected failure but got success' };
    }
    
  } catch (error) {
    if (!${testCase.shouldSucceed}) {
      console.log('✅ Action failed as expected');
      
      // Validate error message
      ${testCase.errorExpected ? `
      assert(error.message.includes('${testCase.errorExpected}'), 
        'Error message should contain: ${testCase.errorExpected}');
      ` : ''}
      
      console.log('✅ Error validation passed');
      return { success: true, error: error.message };
      
    } else {
      console.log('❌ Action failed unexpectedly:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Helper function to validate output
function validateOutput(actual, expected) {
  ${generateOutputValidation(testCase.expectedOutput)}
}

// Helper function to validate database changes
function validateDatabaseChanges(mockDatabase, expectedChanges) {
  ${generateDatabaseChangeValidation(testCase.expectedDatabaseChanges)}
}
`;
}

function generateOutputValidation(expectedOutput: Record<string, any>): string {
  const validations = Object.entries(expectedOutput).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return `assert(result.output.${key}, 'Output should have ${key} property');
      validateNestedObject(result.output.${key}, ${JSON.stringify(value)});`;
    } else {
      return `assert(result.output.${key} === ${JSON.stringify(value)}, 
        'Expected ${key} to be ${JSON.stringify(value)} but got ' + result.output.${key});`;
    }
  }).join('\n      ');
  
  return validations;
}

function generateDatabaseChangeValidation(expectedChanges: any[]): string {
  return expectedChanges.map((change, index) => `
    // Validate database change ${index + 1}: ${change.model} ${change.operation}
    const ${change.model.toLowerCase()}Changes = result.data.find(d => d.modelId === '${change.model}');
    assert(${change.model.toLowerCase()}Changes, 'Should have ${change.model} changes');
    
    ${change.operation === 'create' ? `
    assert(${change.model.toLowerCase()}Changes.createdRecords.length === ${change.recordCount}, 
      'Should have created ${change.recordCount} ${change.model} records');
    ` : ''}
    
    ${change.operation === 'update' ? `
    assert(${change.model.toLowerCase()}Changes.updatedRecords.length === ${change.recordCount}, 
      'Should have updated ${change.recordCount} ${change.model} records');
    ` : ''}
    
    ${change.operation === 'delete' ? `
    assert(${change.model.toLowerCase()}Changes.deletedRecords.length === ${change.recordCount}, 
      'Should have deleted ${change.recordCount} ${change.model} records');
    ` : ''}
  `).join('\n');
}
```

### **Schedule Test Code Template**

```typescript
// Generated test function for schedule validation
function generateScheduleTestCode(scheduleName: string, testCase: ScheduleTestCase): string {
  return `
// Test: ${testCase.scenarioName}
async function test_${scheduleName.replace(/\s+/g, '_')}_${testCase.scenarioName.replace(/\s+/g, '_')}() {
  console.log('🧪 Running schedule test: ${testCase.scenarioName}');
  
  // Setup mock database
  const mockDatabase = ${JSON.stringify(testCase.mockDatabaseState, null, 2)};
  
  // Setup environment variables
  const envVars = ${JSON.stringify(testCase.environmentVars, null, 2)};
  
  // Setup member context
  const member = ${JSON.stringify(testCase.memberContext, null, 2)};
  
  // Setup schedule configuration
  const scheduleConfig = ${JSON.stringify(testCase.scheduleConfig, null, 2)};
  
  try {
    // Execute the schedule
    const result = await executeGeneratedSchedule(
      scheduleFunctionBody, // The generated schedule code
      mockDatabase,
      envVars,
      member,
      scheduleConfig
    );
    
    // Validate success expectation
    if (${testCase.shouldSucceed}) {
      console.log('✅ Schedule executed successfully');
      
      // Validate output structure
      assert(result.success !== undefined, 'Result should have success property');
      assert(result.recordsProcessed !== undefined, 'Result should have recordsProcessed');
      
      // Validate expected output
      ${generateScheduleOutputValidation(testCase.expectedOutput)}
      
      console.log('✅ Schedule validation passed');
      return { success: true, result };
      
    } else {
      console.log('❌ Schedule should have failed but succeeded');
      return { success: false, error: 'Expected failure but got success' };
    }
    
  } catch (error) {
    // Handle expected vs unexpected errors
    if (!testCase.shouldSucceed && testCase.errorExpected) {
      const expectedError = error.message.includes(testCase.errorExpected);
      return {
        success: expectedError,
        error: expectedError ? null : `Expected error '${testCase.errorExpected}' but got '${error.message}'`,
        duration: Date.now() - startTime
      };
    } else if (testCase.shouldSucceed) {
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
        duration: Date.now() - startTime
      };
    } else {
      return {
        success: true,
        error: null,
        duration: Date.now() - startTime
      };
    }
  }
}

// Helper function to execute schedule with proper context
async function executeGeneratedSchedule(scheduleCode, database, envVars, member, config) {
  // Create function with schedule parameters
  const scheduleFunction = new Function('database', 'envs', 'member', 'config', scheduleCode);
  
  // Execute with proper context
  return await scheduleFunction(database, envVars, member, config);
}
`;
}

function generateScheduleOutputValidation(expectedOutput: any): string {
  return Object.entries(expectedOutput).map(([key, value]) => {
    if (key === 'databaseChanges' && Array.isArray(value)) {
      return value.map((change: any, index: number) => `
        // Validate database change ${index + 1}
        const change${index} = result.databaseChanges.find(c => c.model === '${change.model}');
        assert(change${index}, 'Should have ${change.model} database change');
        assert(change${index}.operation === '${change.operation}', 
          'Expected ${change.operation} operation for ${change.model}');
        assert(change${index}.recordCount === ${change.recordCount}, 
          'Expected ${change.recordCount} records for ${change.model}');
      `).join('\n');
    } else if (typeof value === 'object' && value !== null) {
      return `assert(result.${key}, 'Result should have ${key} property');
      validateNestedObject(result.${key}, ${JSON.stringify(value)});`;
    } else {
      return `assert(result.${key} === ${JSON.stringify(value)}, 
        'Expected ${key} to be ${JSON.stringify(value)} but got ' + result.${key});`;
    }
  }).join('\n      ');
}
```

## **Test Execution Framework**

### **Running Action Tests**

```typescript
// Complete test execution example for actions
async function runActionTestSuite(actionName: string, actionCode: string, testCases: ActionTestCase[]) {
  console.log(`🧪 Running test suite for action: ${actionName}`);
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const testResult = await executeActionTest(actionName, actionCode, testCase);
      results.push({
        testName: testCase.scenarioName,
        success: testResult.success,
        error: testResult.error,
        duration: testResult.duration
      });
      
      if (testResult.success) {
        console.log(`✅ ${testCase.scenarioName}: PASSED`);
      } else {
        console.log(`❌ ${testCase.scenarioName}: FAILED - ${testResult.error}`);
      }
      
    } catch (error) {
      console.log(`💥 ${testCase.scenarioName}: ERROR - ${error.message}`);
      results.push({
        testName: testCase.scenarioName,
        success: false,
        error: error.message
      });
    }
  }
  
  // Generate test summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Test Summary for ${actionName}:`);
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  return {
    actionName,
    totalTests: total,
    passedTests: passed,
    failedTests: total - passed,
    successRate: Math.round((passed / total) * 100),
    results
  };
}

async function executeActionTest(actionName: string, actionCode: string, testCase: ActionTestCase) {
  const startTime = Date.now();
  
  try {
    // Setup test environment
    const mockDatabase = { ...testCase.mockDatabaseState };
    const member = { ...testCase.memberContext };
    const input = { ...testCase.inputData };
    
    // Execute action
    const result = await executeGeneratedAction(actionCode, mockDatabase, input, member);
    
    // Validate results
    const validation = validateActionResult(result, testCase);
    
    return {
      success: validation.success,
      error: validation.error,
      result: result,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    // Handle expected vs unexpected errors
    if (!testCase.shouldSucceed && testCase.errorExpected) {
      const expectedError = error.message.includes(testCase.errorExpected);
      return {
        success: expectedError,
        error: expectedError ? null : `Expected error '${testCase.errorExpected}' but got '${error.message}'`,
        duration: Date.now() - startTime
      };
    } else if (testCase.shouldSucceed) {
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
        duration: Date.now() - startTime
      };
    } else {
      return {
        success: true,
        error: null,
        duration: Date.now() - startTime
      };
    }
  }
}

function validateActionResult(result: any, testCase: ActionTestCase) {
  try {
    // Validate basic structure
    if (!result.output || !result.data) {
      return { success: false, error: 'Result missing required output or data properties' };
    }
    
    // Validate expected output
    if (testCase.shouldSucceed) {
      const outputValidation = validateExpectedOutput(result.output, testCase.expectedOutput);
      if (!outputValidation.success) {
        return outputValidation;
      }
      
      // Validate database changes
      const dbValidation = validateExpectedDatabaseChanges(result.data, testCase.expectedDatabaseChanges);
      if (!dbValidation.success) {
        return dbValidation;
      }
    }
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: `Validation error: ${error.message}` };
  }
}

function validateExpectedOutput(actual: any, expected: any): { success: boolean; error?: string } {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (!(key in actual)) {
      return { success: false, error: `Missing expected output property: ${key}` };
    }
    
    if (typeof expectedValue === 'object' && expectedValue !== null) {
      const nestedValidation = validateExpectedOutput(actual[key], expectedValue);
      if (!nestedValidation.success) {
        return nestedValidation;
      }
    } else if (actual[key] !== expectedValue) {
      return { 
        success: false, 
        error: `Expected ${key} to be ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actual[key])}` 
      };
    }
  }
  
  return { success: true };
}

function validateExpectedDatabaseChanges(actualData: any[], expectedChanges: any[]): { success: boolean; error?: string } {
  for (const expectedChange of expectedChanges) {
    const modelData = actualData.find(d => d.modelId === expectedChange.model);
    
    if (!modelData) {
      return { success: false, error: `Expected database changes for model ${expectedChange.model} but none found` };
    }
    
    const operationKey = `${expectedChange.operation}dRecords`;
    const actualCount = modelData[operationKey]?.length || 0;
    
    if (actualCount !== expectedChange.recordCount) {
      return { 
        success: false, 
        error: `Expected ${expectedChange.recordCount} ${expectedChange.operation} records for ${expectedChange.model} but got ${actualCount}` 
      };
    }
  }
  
  return { success: true };
}
```

### **Running Schedule Tests**

```typescript
// Complete test execution example for schedules
async function runScheduleTestSuite(scheduleName: string, scheduleCode: string, testCases: ScheduleTestCase[]) {
  console.log(`🧪 Running test suite for schedule: ${scheduleName}`);
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const testResult = await executeScheduleTest(scheduleName, scheduleCode, testCase);
      results.push({
        testName: testCase.scenarioName,
        success: testResult.success,
        error: testResult.error,
        duration: testResult.duration
      });
      
      if (testResult.success) {
        console.log(`✅ ${testCase.scenarioName}: PASSED`);
      } else {
        console.log(`❌ ${testCase.scenarioName}: FAILED - ${testResult.error}`);
      }
      
    } catch (error) {
      console.log(`💥 ${testCase.scenarioName}: ERROR - ${error.message}`);
      results.push({
        testName: testCase.scenarioName,
        success: false,
        error: error.message
      });
    }
  }
  
  // Generate test summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Test Summary for ${scheduleName}:`);
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  return {
    scheduleName,
    totalTests: total,
    passedTests: passed,
    failedTests: total - passed,
    successRate: Math.round((passed / total) * 100),
    results
  };
}

async function executeScheduleTest(scheduleName: string, scheduleCode: string, testCase: ScheduleTestCase) {
  const startTime = Date.now();
  
  try {
    // Setup test environment
    const mockDatabase = { ...testCase.mockDatabaseState };
    const envVars = { ...testCase.environmentVars };
    const member = { ...testCase.memberContext };
    const config = { ...testCase.scheduleConfig };
    
    // Execute schedule
    const result = await executeGeneratedSchedule(scheduleCode, mockDatabase, envVars, member, config);
    
    // Validate results
    const validation = validateScheduleResult(result, testCase);
    
    return {
      success: validation.success,
      error: validation.error,
      result: result,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    // Handle expected vs unexpected errors
    if (!testCase.shouldSucceed && testCase.errorExpected) {
      const expectedError = error.message.includes(testCase.errorExpected);
      return {
        success: expectedError,
        error: expectedError ? null : `Expected error '${testCase.errorExpected}' but got '${error.message}'`,
        duration: Date.now() - startTime
      };
    } else if (testCase.shouldSucceed) {
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
        duration: Date.now() - startTime
      };
    } else {
      return {
        success: true,
        error: null,
        duration: Date.now() - startTime
      };
    }
  }
}

function validateScheduleResult(result: any, testCase: ScheduleTestCase) {
  try {
    // Validate basic structure
    if (result.success === undefined || result.recordsProcessed === undefined) {
      return { success: false, error: 'Result missing required success or recordsProcessed properties' };
    }
    
    // Validate expected output
    if (testCase.shouldSucceed) {
      const outputValidation = validateExpectedScheduleOutput(result, testCase.expectedOutput);
      if (!outputValidation.success) {
        return outputValidation;
      }
    }
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: `Validation error: ${error.message}` };
  }
}

function validateExpectedScheduleOutput(actual: any, expected: any): { success: boolean; error?: string } {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (key === 'databaseChanges' && Array.isArray(expectedValue)) {
      const dbValidation = validateExpectedDatabaseChanges(actual.databaseChanges || [], expectedValue);
      if (!dbValidation.success) {
        return dbValidation;
      }
    } else if (!(key in actual)) {
      return { success: false, error: `Missing expected output property: ${key}` };
    } else if (typeof expectedValue === 'object' && expectedValue !== null) {
      const nestedValidation = validateExpectedScheduleOutput(actual[key], expectedValue);
      if (!nestedValidation.success) {
        return nestedValidation;
      }
    } else if (actual[key] !== expectedValue) {
      return { 
        success: false, 
        error: `Expected ${key} to be ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actual[key])}` 
      };
    }
  }
  
  return { success: true };
}
```

## **Integration with Enhanced Action Generation**

The test cases are automatically integrated into the enhanced action generation process:

1. **During Analysis Phase**: Test scenarios are generated as part of `enhancedActionAnalysisSchema`
2. **During Code Generation**: Test code is generated as part of `enhancedActionCodeSchema`
3. **During Validation**: Tests are executed to validate generated code
4. **During Documentation**: Test results are included in the final documentation

This comprehensive test framework ensures that every generated action and schedule is thoroughly validated with realistic scenarios, proper error handling, and complete coverage of business logic requirements. 