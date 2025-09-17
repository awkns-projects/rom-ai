# AI Generation Logic Migration Specification

## Executive Summary

This document outlines the migration from the current complex action generation system to a simplified, model-centric approach where:
- Each action processes **one database model** and **one record at a time**
- Schedules orchestrate chains of actions using WHERE clauses for batch processing
- Pseudo steps have redefined input/output semantics focused on model field operations
- Technical specification and pseudo code generation are streamlined and integrated

## Current State Analysis

### Current Architecture Issues
1. **Complex Multi-Model Actions**: Actions currently try to handle multiple models and complex workflows
2. **Batch Processing Complexity**: Actions attempt to handle batching internally
3. **Unclear Input/Output Semantics**: Pseudo steps have ambiguous field meanings
4. **Over-Engineering**: Technical specifications and pseudo code generation are overly complex
5. **Poor Reusability**: Actions are monolithic and hard to compose

### Current Code Locations
- Action generation: `src/lib/ai/tools/agent-builder/action-generation-shared.ts`
- Step 2 (actions): `src/lib/ai/tools/agent-builder/steps/step2-action-generation.ts`
- Step 3 (schedules): `src/lib/ai/tools/agent-builder/steps/step3-schedule-generation.ts`
- Step 0 analysis: `src/lib/ai/tools/agent-builder/steps/step0-comprehensive-analysis.ts`

## New Architecture Specification

### 1. Action-Model Relationship

#### New Principle: One Action = One Model + One Record
```typescript
interface NewActionSpec {
  // Core identity
  name: string;           // camelCase: "updatePatientRecord"
  title: string;          // Display: "Update Patient Record"
  
  // Model binding (NEW)
  targetModel: string;    // REQUIRED: "PatientRecord", "MedicationRecord", etc.
  
  // Processing scope (NEW)
  processingMode: 'single';  // Always single record processing
  
  // Simplified purpose
  purpose: string;        // What this action does to ONE record of the target model
}
```

#### Migration Impact
- **BEFORE**: Actions could process multiple models, batch operations, complex workflows
- **AFTER**: Actions are laser-focused on ONE model, ONE record operations
- **Benefit**: Simpler, more reusable, easier to test and maintain

### 2. Pseudo Step Redefinition

#### New Input/Output Field Semantics

**BEFORE (Current)**:
```typescript
// Input fields: Mixed sources, unclear semantics
inputFields: [
  { name: "userId", type: "String", source: "parameter" },
  { name: "batchSize", type: "Int", source: "parameter" },
  { name: "previousStepData", type: "Object", source: "step" }
]

// Output fields: Mixed destinations, unclear semantics  
outputFields: [
  { name: "processedRecords", type: "Array", destination: "next_step" },
  { name: "reportUrl", type: "String", destination: "return" }
]
```

**AFTER (New)**:
```typescript
// Input fields: Model fields + related model data
inputFields: [
  { name: "patientId", type: "String", source: "model_field" },        // From target model
  { name: "doctorName", type: "String", source: "related_model" },     // From related model
  { name: "currentDate", type: "DateTime", source: "system" }          // System-provided
]

// Output fields: Model fields to update/populate
outputFields: [
  { name: "diagnosisText", type: "String", target: "model_field" },    // Update model field
  { name: "confidenceScore", type: "Float", target: "model_field" },   // Update model field
  { name: "lastProcessed", type: "DateTime", target: "model_field" }   // Update model field
]
```

#### Field Source Types
1. **`model_field`**: Direct field from the target model record
2. **`related_model`**: Field from a related model (via foreign key)
3. **`system`**: System-provided values (current date, user ID, etc.)
4. **`parameter`**: Action parameters (for filtering, configuration)
5. **`previous_step`**: Output from previous pseudo step

#### Field Target Types
1. **`model_field`**: Update a field in the target model record
2. **`temporary`**: Temporary value for next step (not saved to model)
3. **`return`**: Value returned to caller (for action chaining)

### 3. New Step Types Specification

#### Core Step Types
```typescript
type NewStepType = 
  | 'db_update_fields'           // Update specific model fields
  | 'ai_generate_object'         // Generate structured data
  | 'ai_generate_text'           // Generate text content
  | 'ai_generate_object_websearch' // Generate with web search
  | 'ai_read_file_from_field'    // Read file from model field
  | 'ai_generate_image'          // Generate image
  | 'ai_modify_image'            // Modify existing image
  | 'ai_read_image'
  | 'external_api'
  | 'npm_package'
  | 'system_timestamp'           // Add system timestamps
  | 'system_calculate'           // Perform calculations
```

#### Step Type Specifications

##### 1. Database Update Fields
```typescript
interface DbUpdateFieldsStep {
  type: 'db_update_fields';
  description: string;
  inputFields: ModelField[];      // Fields to read
  outputFields: ModelField[];     // Fields to update
  updateConditions?: string[];    // Optional conditions
}
```

##### 2. AI Generate Object
```typescript
interface AiGenerateObjectStep {
  type: 'ai_generate_object';
  description: string;
  inputFields: ModelField[];      // Context for AI
  outputFields: ModelField[];     // Structured fields to populate
  schema: ZodSchema;             // Output structure
  prompt: string;                // AI prompt template
}
```

##### 3. AI Generate Text
```typescript
interface AiGenerateTextStep {
  type: 'ai_generate_text';
  description: string;
  inputFields: ModelField[];      // Context for AI
  outputFields: ModelField[];     // Text fields to populate
  prompt: string;                // AI prompt template
  maxLength?: number;            // Optional length limit
}
```

##### 4. AI Generate with Web Search
```typescript
interface AiGenerateObjectWebsearchStep {
  type: 'ai_generate_object_websearch';
  description: string;
  inputFields: ModelField[];      // Context + search terms
  outputFields: ModelField[];     // Fields to populate with search-enhanced data
  searchQuery: string;           // Web search query template
  schema: ZodSchema;             // Output structure
  prompt: string;                // AI prompt template
}
```

##### 5. AI Read File from Field
```typescript
interface AiReadFileFromFieldStep {
  type: 'ai_read_file_from_field';
  description: string;
  inputFields: ModelField[];      // Must include file path/URL field
  outputFields: ModelField[];     // Fields to populate with file content
  fileType: 'text' | 'pdf' | 'image' | 'csv';
  processing?: string;           // Optional processing instructions
}
```

##### 6. AI Generate Image
```typescript
interface AiGenerateImageStep {
  type: 'ai_generate_image';
  description: string;
  inputFields: ModelField[];      // Context for image generation
  outputFields: ModelField[];     // Image URL/path fields to populate
  prompt: string;                // Image generation prompt
  dimensions?: { width: number; height: number };
  style?: string;                // Art style preferences
}
```

##### 7. AI Modify Image
```typescript
interface AiModifyImageStep {
  type: 'ai_modify_image';
  description: string;
  inputFields: ModelField[];      // Must include source image field
  outputFields: ModelField[];     // Modified image fields to populate
  modifications: string;         // Modification instructions
  preserveOriginal?: boolean;    // Keep original image
}
```

### 4. Schedule-Action Chaining Mechanism

#### New Schedule Structure
```typescript
interface NewScheduleSpec {
  name: string;                  // camelCase: "dailyPatientProcessing"
  title: string;                 // Display: "Daily Patient Processing"
  
  // Execution definition
  trigger: {
    pattern: string;             // Cron pattern
    timezone?: string;
  };
  
  // Action chain (NEW)
  actionChain: ScheduleStep[];
}

interface ScheduleStep {
  stepNumber: number;
  actionId: string;              // Reference to action
  
  // WHERE clause for record selection (NEW)
  whereClause: {
    model: string;               // Target model name
    conditions: WhereCondition[];
  };
  
  // Parameter mapping (NEW)
  parameters?: {
    [key: string]: string | ParameterReference;
  };
  
  // Chain control
  continueOnError?: boolean;
  maxRecords?: number;           // Limit processing
}

interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
  value: any | ParameterReference;
}

interface ParameterReference {
  type: 'previous_step_output' | 'system_value' | 'schedule_parameter';
  source: string;
}
```

#### Example Schedule Chain
```typescript
const exampleSchedule = {
  name: "dailyPatientProcessing",
  title: "Daily Patient Processing",
  trigger: { pattern: "0 9 * * *" }, // 9 AM daily
  
  actionChain: [
    {
      stepNumber: 1,
      actionId: "analyzePatientSymptoms",
      whereClause: {
        model: "PatientRecord",
        conditions: [
          { field: "lastAnalyzed", operator: "<", value: { type: "system_value", source: "yesterday" } },
          { field: "status", operator: "=", value: "active" }
        ]
      },
      maxRecords: 100
    },
    {
      stepNumber: 2,
      actionId: "generateTreatmentPlan",
      whereClause: {
        model: "PatientRecord", 
        conditions: [
          { field: "symptomsAnalyzed", operator: "IS NOT NULL" },
          { field: "treatmentPlan", operator: "IS NULL" }
        ]
      },
      continueOnError: true
    }
  ]
};
```

### 5. Simplified Generation Process

#### Remove Complex Technical Specifications
**CURRENT PROCESS** (Remove):
1. Generate Technical Specification (complex, over-engineered)
2. Generate Pseudo Steps (from tech spec)
3. Generate UI Components (separate step)
4. Generate Executable Code (from all above)

**NEW PROCESS** (Simplified):
1. **Generate Pseudo Steps directly from Step 0 analysis**
2. **Generate Executable Code from Pseudo Steps**

#### New Generation Flow
```typescript
// Step 2: Action Generation (Simplified)
async function generateActionFromStep0(
  step0Analysis: Step0Output,
  targetModel: string,
  actionPurpose: string
): Promise<AgentAction> {
  
  // 1. Generate Pseudo Steps directly from Step 0
  const pseudoSteps = await generatePseudoStepsFromStep0(
    step0Analysis,
    targetModel,
    actionPurpose
  );
  
  // 2. Generate Executable Code from Pseudo Steps
  const executableCode = await generateExecutableCodeFromPseudoSteps(
    pseudoSteps,
    targetModel,
    step0Analysis.models.find(m => m.name === targetModel)
  );
  
  return {
    name: generateActionName(targetModel, actionPurpose),
    title: generateActionTitle(targetModel, actionPurpose),
    targetModel,
    pseudoSteps,
    execute: {
      type: 'code',
      code: executableCode
    }
  };
}
```

## Migration Implementation Plan

### Phase 1: Core Infrastructure Changes
1. **Update Action Interface**
   - Add `targetModel` field to all actions
   - Add `processingMode: 'single'` field
   - Remove complex multi-model support

2. **Redefine Pseudo Step Schema**
   - Update input/output field semantics
   - Add field source/target type enums
   - Create new step type definitions

3. **Update Schedule Interface**
   - Add `actionChain` structure
   - Add `whereClause` support
   - Add parameter chaining support

### Phase 2: Generation Logic Migration
1. **Simplify Action Generation**
   - Remove technical specification generation
   - Generate pseudo steps directly from Step 0
   - Focus on single-model operations

2. **Update Step Types**
   - Implement new AI operation step types
   - Add file processing capabilities
   - Add image generation/modification

3. **Implement Schedule Chaining**
   - Add WHERE clause generation
   - Implement parameter passing between actions
   - Add batch processing orchestration

### Phase 3: Code Generation Updates
1. **Update Executable Code Generation**
   - Generate single-record processing code
   - Implement new step type handlers
   - Add proper error handling for chains

2. **Update UI Components**
   - Generate model-field-focused UIs
   - Remove complex batch selection interfaces
   - Add schedule chain configuration UIs

### Phase 4: Testing & Validation
1. **Create Migration Tests**
   - Test single-record processing
   - Validate schedule chaining
   - Test new step types

2. **Performance Validation**
   - Benchmark single-record vs batch processing
   - Validate schedule execution efficiency
   - Test parameter chaining performance

## Benefits of New Architecture

### 1. Simplicity
- **Actions**: Single responsibility, easy to understand
- **Schedules**: Clear orchestration, predictable execution
- **Steps**: Well-defined input/output semantics

### 2. Reusability
- **Actions**: Can be reused across different schedules
- **Steps**: Standard patterns for common operations
- **Chains**: Composable workflows

### 3. Maintainability
- **Debugging**: Easier to trace single-record operations
- **Testing**: Simpler unit tests for focused actions
- **Updates**: Modify individual actions without affecting others

### 4. Performance
- **Parallel Processing**: Schedules can run actions in parallel for different records
- **Resource Management**: Better control over processing loads
- **Error Isolation**: Failures in one record don't affect others

## Migration Timeline

### Week 1: Infrastructure
- Update type definitions
- Modify database schemas
- Update core interfaces

### Week 2: Generation Logic
- Implement simplified action generation
- Update pseudo step generation
- Add new step type handlers

### Week 3: Schedule System
- Implement action chaining
- Add WHERE clause processing
- Update schedule execution engine

### Week 4: Testing & Deployment
- Comprehensive testing
- Performance validation
- Gradual rollout

## Backward Compatibility

### Migration Strategy
1. **Dual Mode**: Support both old and new action formats during transition
2. **Automatic Migration**: Convert existing actions to new format where possible
3. **Manual Migration**: Provide tools for complex action conversion
4. **Deprecation Timeline**: 30-day notice for old format removal

### Risk Mitigation
1. **Feature Flags**: Enable/disable new system components
2. **Rollback Plan**: Quick revert to old system if needed
3. **Monitoring**: Track migration success rates and performance
4. **User Communication**: Clear documentation of changes

## Conclusion

This migration transforms the AI generation system from a complex, monolithic approach to a simple, composable architecture. The new system will be easier to understand, maintain, and extend while providing better performance and reliability.

The key insight is that **simplicity enables complexity** - by making individual actions simple and focused, we enable complex workflows through composition and orchestration at the schedule level. 