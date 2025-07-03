import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import type { AgentData } from '../types';

/**
 * STEP 0: Two-Phase Analysis for Database, Actions, and Schedules Design
 * 
 * Phase A: Feature Collection - Semantic values and business requirements
 * Phase B: Technical Aggregation - Concrete models, actions, and schedules
 * 
 * COMBINED OUTPUT: Step0Output contains BOTH Phase A and Phase B data in one unified structure
 * - All Step0B fields are directly accessible (models, actions, schedules, etc.)
 * - All Step0A data is accessible via step0Output.phaseAAnalysis
 * - This ensures downstream steps have complete context from both phases
 * 
 * IMPORTANT DISTINCTION FOR ACTIONS & SCHEDULES:
 * - `operation`: 'create' | 'update' - Whether this is a NEW entity or UPDATING existing one
 * - `type`: 'query' | 'mutation' - Whether this READS data (query) or WRITES/MODIFIES data (mutation)
 * 
 * Example:
 * - NEW query action: { operation: 'create', type: 'query' }
 * - UPDATE existing mutation: { operation: 'update', type: 'mutation', updateDescription: "Add filtering by date" }
 */

export interface Step0Input {
  userRequest: string;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
  currentOperation?: string;
}

// Phase A: Feature Collection Output
export interface Step0AOutput {
  // Basic analysis
  operation: 'create' | 'update' | 'extend';
  confidence: number;
  
  // Agent details
  agentName: string;
  agentDescription: string;
  domain: string;
  primaryIntent: string;
  keywords: string[];
  
  // User request analysis
  userRequestAnalysis: {
    mainGoal: string;
    businessContext: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    clarity: 'very_clear' | 'clear' | 'somewhat_unclear' | 'unclear';
  };
  
  // Feature imagination
  featureRequirements: {
    coreFeatures: string[];
    additionalFeatures: string[];
    userExperience: string[];
    businessRules: string[];
    integrations: string[];
  };
  
  // Semantic requirements
  semanticRequirements: {
    dataEntities: Array<{
      name: string;
      purpose: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      businessValue: string;
      relationships: string[];
    }>;
    businessProcesses: Array<{
      name: string;
      description: string;
      triggerConditions: string[];
      expectedOutcomes: string[];
      automationPotential: 'high' | 'medium' | 'low';
      isRecurring: boolean;
    }>;
    manualActions: Array<{
      name: string;
      purpose: string;
      userRole: 'admin' | 'member';
      businessValue: string;
      requiredData: string[];
    }>;
    automatedSchedules: Array<{
      name: string;
      purpose: string;
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
      businessValue: string;
      requiredData: string[];
    }>;
  };
}

// Phase B: Technical Aggregation Output
export interface Step0BOutput {
  // Basic info
  operation: 'create' | 'update' | 'extend';
  confidence: number;
  agentName: string;
  agentDescription: string;
  domain: string;
  
  // Enhanced arrays with operation tracking
  models: Array<{
    name: string;
    purpose: string;
    operation: 'create' | 'update';
    updateDescription?: string; // Only present when operation is 'update'
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      operation: 'create' | 'update';
      updateDescription?: string; // Only present when operation is 'update'
    }>;
    enums?: Array<{
      name: string;
      values: string[];
      operation: 'create' | 'update';
      updateDescription?: string; // Only present when operation is 'update'
    }>;
  }>;
  
  actions: Array<{
    name: string;
    purpose: string;
    type: 'query' | 'mutation';
    operation: 'create' | 'update';
    updateDescription?: string; // Only present when operation is 'update'
  }>;
  
  schedules: Array<{
    name: string;
    purpose: string;
    type: 'query' | 'mutation';
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    operation: 'create' | 'update';
    updateDescription?: string; // Only present when operation is 'update'
  }>;
  
  // CRITICAL: Include Phase A analysis for downstream steps
  // This ensures ALL steps have access to BOTH Phase A semantic analysis AND Phase B technical specs
  phaseAAnalysis?: Step0AOutput;
}

/**
 * UNIFIED STEP 0 OUTPUT
 * 
 * This is the complete output from Step 0 that contains BOTH Phase A and Phase B data.
 * All downstream steps (Step 1, 2, 3) receive this unified structure, ensuring they have 
 * access to both semantic business requirements AND concrete technical specifications.
 * 
 * Usage in downstream steps:
 * - Access Phase B data directly: step0Output.models, step0Output.actions, etc.
 * - Access Phase A data via: step0Output.phaseAAnalysis.featureRequirements, etc.
 * - Use createPromptUnderstandingFromStep0() to bridge with legacy generation functions
 */
export type Step0Output = Step0BOutput;

/**
 * PHASE A: Feature Collection - Extract semantic requirements and business features
 */
export async function executeStep0AFeatureCollection(
  input: Step0Input
): Promise<Step0AOutput> {
  console.log('🚀 STEP 0A: Starting feature collection and semantic analysis...');
  
  const { userRequest, existingAgent, conversationContext, command, currentOperation } = input;
  
  try {
    const model = await getAgentBuilderModel();
    
    const systemPrompt = `You are a business analyst focused on understanding user requirements at a semantic level. Your goal is to extract business features, understand user intent, and identify high-level requirements without getting into technical implementation details.

${existingAgent ? `
EXISTING SYSTEM CONTEXT:
Models: ${existingAgent.models?.map(m => m.name).join(', ') || 'none'}
Actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}
Schedules: ${existingAgent.schedules?.map(s => s.name).join(', ') || 'none'}

🔍 This is an update/extension request. Focus on what NEW functionality and features are needed beyond what already exists.
` : `This is a new system creation request. Design everything from scratch.`}

ANALYSIS FOCUS:

1. UNDERSTAND THE REQUEST:
   - What is the main business goal?
   - What domain/industry context?
   - How complex is this requirement?
   - How urgent and clear is the request?

2. IDENTIFY BUSINESS FEATURES:
   - What are the 3-5 core features needed?
   - What 2-3 additional features would add value?
   - What user experience improvements are required?
   - What business rules must be enforced?
   - What integrations might be needed?

3. EXTRACT SEMANTIC REQUIREMENTS:
   - What business entities/concepts need to be represented?
   - What business processes need to happen?
   - What manual actions do users need to perform?
   - What automated schedules need to run?
   - Focus on WHAT needs to be done, not HOW

4. AGENT DETAILS:
   - Suggest an appropriate agent name
   - Provide a clear agent description
   - Identify the business domain
   - What's the primary intent?
   - List relevant keywords

Be focused on business value and user needs. Don't worry about technical implementation - that comes in the next phase.`;

    const result = await generateObject({
      model,
      schema: z.object({
        operation: z.enum(['create', 'update', 'extend']),
        confidence: z.number().min(0).max(100),
        
        agentName: z.string(),
        agentDescription: z.string(),
        domain: z.string(),
        primaryIntent: z.string(),
        keywords: z.array(z.string()).max(5),
        
        userRequestAnalysis: z.object({
          mainGoal: z.string(),
          businessContext: z.string(),
          complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']),
          urgency: z.enum(['low', 'medium', 'high', 'critical']),
          clarity: z.enum(['very_clear', 'clear', 'somewhat_unclear', 'unclear'])
        }),
        
        featureRequirements: z.object({
          coreFeatures: z.array(z.string()).max(5),
          additionalFeatures: z.array(z.string()).max(3),
          userExperience: z.array(z.string()).max(3),
          businessRules: z.array(z.string()).max(3),
          integrations: z.array(z.string()).max(3)
        }),
        
        semanticRequirements: z.object({
          dataEntities: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            businessValue: z.string(),
            relationships: z.array(z.string()).max(3)
          })).max(7),
          businessProcesses: z.array(z.object({
            name: z.string(),
            description: z.string(),
            triggerConditions: z.array(z.string()).max(3),
            expectedOutcomes: z.array(z.string()).max(3),
            automationPotential: z.enum(['high', 'medium', 'low']),
            isRecurring: z.boolean()
          })).max(5),
          manualActions: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            userRole: z.enum(['admin', 'member']),
            businessValue: z.string(),
            requiredData: z.array(z.string()).max(3)
          })).max(7),
          automatedSchedules: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'custom']),
            businessValue: z.string(),
            requiredData: z.array(z.string()).max(3)
          })).max(5)
        })
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `USER REQUEST: "${userRequest}"

Analyze this request and extract the business features and semantic requirements. Focus on WHAT needs to be done and WHY, not HOW to implement it.

${existingAgent ? 'Focus on what NEW functionality is needed beyond what already exists.' : 'This is a new system - identify all requirements from scratch.'}`
        }
      ],
      temperature: 0.4,
      maxTokens: 2500
    });

    console.log('✅ STEP 0A: Feature collection completed successfully');
    console.log(`📊 Phase A Summary:
- Operation: ${result.object.operation}
- Confidence: ${result.object.confidence}%
- Agent: ${result.object.agentName}
- Domain: ${result.object.domain}
- Data entities: ${result.object.semanticRequirements.dataEntities.length}
- Business processes: ${result.object.semanticRequirements.businessProcesses.length}
- Manual actions: ${result.object.semanticRequirements.manualActions.length}
- Automated schedules: ${result.object.semanticRequirements.automatedSchedules.length}`);

    return result.object;
    
  } catch (error) {
    console.error('❌ STEP 0A: Feature collection failed:', error);
    throw new Error(`Step 0A failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * PHASE B: Technical Aggregation - Convert semantic requirements into concrete technical specifications
 */
export async function executeStep0BTechnicalAggregation(
  input: Step0Input,
  phaseAOutput: Step0AOutput
): Promise<Step0BOutput> {
  console.log('🚀 STEP 0B: Starting technical aggregation...');
  
  const { userRequest, existingAgent } = input;
  
  try {
    const model = await getAgentBuilderModel();
    
    const systemPrompt = `You are a technical architect who converts business requirements into concrete technical specifications for database models, actions, and schedules.

${existingAgent ? `
EXISTING SYSTEM:
Models: ${existingAgent.models?.map(m => `${m.name} (${m.fields?.map(f => f.name).join(', ') || 'no fields'})`).join(', ') || 'none'}
Actions: ${existingAgent.actions?.map(a => `${a.name} (${a.type})`).join(', ') || 'none'}
Schedules: ${existingAgent.schedules?.map(s => `${s.name} (${s.interval?.pattern || 'no pattern'})`).join(', ') || 'none'}

IMPORTANT: For each model, field, enum, action, and schedule, determine if it should be:
- operation: "create" - This is a completely new entity that doesn't exist
- operation: "update" - This entity exists but needs modifications

For "update" operations, provide updateDescription explaining what changes are needed.
` : `This is a new system - all operations should be "create".`}

TECHNICAL SPECIFICATION REQUIREMENTS:

1. DATABASE MODELS:
   ${existingAgent ? `
   - For EXISTING models: operation="update", add new fields, update existing fields, add enums
   - For NEW models: operation="create", design complete new models
   - For each field: mark as "create" (new field) or "update" (modify existing field)
   - For each enum: mark as "create" (new enum) or "update" (modify existing enum)
   - Update descriptions should explain: "Add new field X for Y purpose" or "Modify field X to include Z"
   ` : `
   - Design 2-5 key data models from scratch (all operation="create")
   `}
   - Each model should have 3-7 practical fields
   - Include proper field types (String, Int, DateTime, Boolean, etc.)
   - Define necessary enums (max 3 per model, 5 values each)
   - Specify relationships between models

2. MANUAL ACTIONS (query/mutation only):
   ${existingAgent ? `
   - For EXISTING actions: operation="update" with updateDescription of what changes
   - For NEW actions: operation="create"
   - Existing actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}
   ` : 'All actions are new (operation="create")'}
   - Type: MUST be either 'query' (read data) or 'mutation' (write/modify data)
   - Operation: MUST be either 'create' (new action) or 'update' (modify existing action)
   - User-triggered operations that require manual interaction
   - Include role requirements (admin/member)
   - Specify input/output requirements
   - Define complexity and business value

3. AUTOMATED SCHEDULES (query/mutation only):
   ${existingAgent ? `
   - For EXISTING schedules: operation="update" with updateDescription of what changes
   - For NEW schedules: operation="create"  
   - Existing schedules: ${existingAgent.schedules?.map(s => s.name).join(', ') || 'none'}
   ` : 'All schedules are new (operation="create")'}
   - Type: MUST be either 'query' (read data) or 'mutation' (write/modify data)
   - Operation: MUST be either 'create' (new schedule) or 'update' (modify existing schedule)
   - Frequency: daily, weekly, or monthly
   - Automated recurring operations that run without user intervention
   - Define frequency and timing
   - Include role requirements (admin/member)
   - Specify expected outputs

4. UPDATE DESCRIPTIONS:
   - For models: "Add support for X feature by including Y fields"
   - For fields: "Add field to track Z" or "Modify field to support additional data"
   - For enums: "Add new values for X cases" or "Update enum to include Y options"
   - For actions: "Enhance action to support Z functionality"
   - For schedules: "Update schedule to include X processing"

Convert the semantic requirements into concrete technical specifications with proper create/update tracking.`;

    const result = await generateObject({
      model,
      schema: z.object({
        // From Phase A
        operation: z.enum(['create', 'update', 'extend']),
        confidence: z.number().min(0).max(100),
        
        agentName: z.string(),
        agentDescription: z.string(),
        domain: z.string(),
        
        models: z.array(z.object({
          name: z.string(),
          purpose: z.string(),
          operation: z.enum(['create', 'update']),
          updateDescription: z.string().optional(),
          fields: z.array(z.object({
            name: z.string(),
            type: z.string(),
            required: z.boolean(),
            operation: z.enum(['create', 'update']),
            updateDescription: z.string().optional()
          })).max(7),
          enums: z.array(z.object({
            name: z.string(),
            values: z.array(z.string()).max(5),
            operation: z.enum(['create', 'update']),
            updateDescription: z.string().optional()
          })).max(3).optional()
        })).max(5),
        
        actions: z.array(z.object({
          name: z.string(),
          purpose: z.string(),
          type: z.enum(['query', 'mutation']),
          operation: z.enum(['create', 'update']),
          updateDescription: z.string().optional()
        })).max(7),
        
        schedules: z.array(z.object({
          name: z.string(),
          purpose: z.string(),
          type: z.enum(['query', 'mutation']),
          frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
          operation: z.enum(['create', 'update']),
          updateDescription: z.string().optional()
        })).max(5)
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `ORIGINAL USER REQUEST: "${userRequest}"

COMPREHENSIVE PHASE A ANALYSIS:

AGENT DETAILS:
- Name: ${phaseAOutput.agentName}
- Description: ${phaseAOutput.agentDescription}
- Domain: ${phaseAOutput.domain}
- Primary Intent: ${phaseAOutput.primaryIntent}
- Keywords: ${phaseAOutput.keywords.join(', ')}

USER REQUEST ANALYSIS:
- Main Goal: ${phaseAOutput.userRequestAnalysis.mainGoal}
- Business Context: ${phaseAOutput.userRequestAnalysis.businessContext}
- Complexity: ${phaseAOutput.userRequestAnalysis.complexity}
- Urgency: ${phaseAOutput.userRequestAnalysis.urgency}
- Clarity: ${phaseAOutput.userRequestAnalysis.clarity}

FEATURE REQUIREMENTS:
- Core Features: ${phaseAOutput.featureRequirements.coreFeatures.join(', ')}
- Additional Features: ${phaseAOutput.featureRequirements.additionalFeatures.join(', ')}
- User Experience: ${phaseAOutput.featureRequirements.userExperience.join(', ')}
- Business Rules: ${phaseAOutput.featureRequirements.businessRules.join(', ')}
- Integrations: ${phaseAOutput.featureRequirements.integrations.join(', ')}

DETAILED SEMANTIC REQUIREMENTS:

Data Entities (with priorities and relationships):
${phaseAOutput.semanticRequirements.dataEntities.map(e => `
- **${e.name}** (Priority: ${e.priority})
  - Purpose: ${e.purpose}
  - Business Value: ${e.businessValue}
  - Relationships: ${e.relationships.join(', ') || 'standalone'}`).join('')}

Business Processes (with automation potential):
${phaseAOutput.semanticRequirements.businessProcesses.map(p => `
- **${p.name}** (Automation: ${p.automationPotential}, Recurring: ${p.isRecurring})
  - Description: ${p.description}
  - Triggers: ${p.triggerConditions.join(', ')}
  - Outcomes: ${p.expectedOutcomes.join(', ')}`).join('')}

Manual Actions (with roles and data needs):
${phaseAOutput.semanticRequirements.manualActions.map(a => `
- **${a.name}** (Role: ${a.userRole})
  - Purpose: ${a.purpose}
  - Business Value: ${a.businessValue}
  - Required Data: ${a.requiredData.join(', ')}`).join('')}

Automated Schedules (with frequency and data needs):
${phaseAOutput.semanticRequirements.automatedSchedules.map(s => `
- **${s.name}** (Frequency: ${s.frequency})
  - Purpose: ${s.purpose}
  - Business Value: ${s.businessValue}
  - Required Data: ${s.requiredData.join(', ')}`).join('')}

TECHNICAL DESIGN INSTRUCTIONS:

Using ALL the above information, convert these semantic requirements into concrete technical specifications:

1. DATABASE MODELS - Use entity priorities, relationships, and business rules:
   - High/Critical priority entities should become primary models
   - Use relationship information to design proper foreign keys and associations
   - Apply business rules as field constraints and validations
   - Consider integration requirements for external data fields

2. MANUAL ACTIONS - Use core features, user roles, and required data:
   - Map core features to essential actions
   - Design actions based on user roles (admin vs member)
   - Include input fields based on required data from semantic analysis
   - Consider urgency level for action prioritization

3. AUTOMATED SCHEDULES - Use business processes and automation potential:
   - High automation potential processes should become schedules
   - Use frequency information from automated schedules
   - Consider business process triggers and outcomes
   - Map recurring business processes to schedule operations

${existingAgent ? 'Focus on NEW models and additional fields for existing models, plus new actions and schedules that fulfill the identified requirements.' : 'Design everything from scratch based on the comprehensive analysis above.'}`
        }
      ],
      temperature: 0.3,
      maxTokens: 4000
    });

    // Copy Phase A data and merge with Phase B results, including phaseAAnalysis
    const output: Step0BOutput = {
      ...result.object,
      operation: phaseAOutput.operation,
      confidence: phaseAOutput.confidence,
      agentName: phaseAOutput.agentName,
      agentDescription: phaseAOutput.agentDescription,
      domain: phaseAOutput.domain,
      phaseAAnalysis: phaseAOutput
    };

    console.log('✅ STEP 0B: Technical aggregation completed successfully');
    console.log(`📊 Phase B Summary:
- Models: ${output.models.length} (${output.models.filter(m => m.operation === 'create').length} new, ${output.models.filter(m => m.operation === 'update').length} updates)
- Actions: ${output.actions.length} (${output.actions.filter(a => a.operation === 'create').length} new, ${output.actions.filter(a => a.operation === 'update').length} updates, ${output.actions.filter(a => a.type === 'query').length} queries, ${output.actions.filter(a => a.type === 'mutation').length} mutations)
- Schedules: ${output.schedules.length} (${output.schedules.filter(s => s.operation === 'create').length} new, ${output.schedules.filter(s => s.operation === 'update').length} updates, ${output.schedules.filter(s => s.type === 'query').length} queries, ${output.schedules.filter(s => s.type === 'mutation').length} mutations)`);

    return output;
    
  } catch (error) {
    console.error('❌ STEP 0B: Technical aggregation failed:', error);
    throw new Error(`Step 0B failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main entry point: Execute complete two-phase analysis
 */
export async function executeStep0ComprehensiveAnalysis(
  input: Step0Input
): Promise<Step0Output> {
  console.log('🚀 STEP 0: Starting two-phase comprehensive analysis...');
  
  try {
    // Phase A: Feature Collection
    const phaseAOutput = await executeStep0AFeatureCollection(input);
    
    // Phase B: Technical Aggregation
    const phaseBOutput = await executeStep0BTechnicalAggregation(input, phaseAOutput);
    
    console.log('✅ STEP 0: Two-phase analysis completed successfully');
    return phaseBOutput;
    
  } catch (error) {
    console.error('❌ STEP 0: Two-phase analysis failed:', error);
    throw error;
  }
}

/**
 * Validate analysis output
 */
export function validateStep0Output(output: Step0Output): boolean {
  try {
    if (!output.agentName) {
      console.warn('⚠️ Missing agent name');
      return false;
    }
    
    if (output.confidence < 50) {
      console.warn(`⚠️ Low confidence level: ${output.confidence}%`);
      return false;
    }
    
    if (!output.models.length && !output.actions.length && !output.schedules.length) {
      console.warn('⚠️ No models, actions, or schedules identified');
      return false;
    }
    
    // Validate operation tracking
    const modelsWithoutOperation = output.models.filter(m => !m.operation);
    const actionsWithoutOperation = output.actions.filter(a => !a.operation);
    const schedulesWithoutOperation = output.schedules.filter(s => !s.operation);
    
    if (modelsWithoutOperation.length > 0) {
      console.warn(`⚠️ Models missing operation type: ${modelsWithoutOperation.map(m => m.name).join(', ')}`);
      return false;
    }
    
    if (actionsWithoutOperation.length > 0) {
      console.warn(`⚠️ Actions missing operation type: ${actionsWithoutOperation.map(a => a.name).join(', ')}`);
      return false;
    }
    
    if (schedulesWithoutOperation.length > 0) {
      console.warn(`⚠️ Schedules missing operation type: ${schedulesWithoutOperation.map(s => s.name).join(', ')}`);
      return false;
    }
    
    // Validate type field for actions and schedules (query/mutation)
    const actionsWithoutType = output.actions.filter(a => !a.type);
    const schedulesWithoutType = output.schedules.filter(s => !s.type);
    
    if (actionsWithoutType.length > 0) {
      console.warn(`⚠️ Actions missing type (query/mutation): ${actionsWithoutType.map(a => a.name).join(', ')}`);
      return false;
    }
    
    if (schedulesWithoutType.length > 0) {
      console.warn(`⚠️ Schedules missing type (query/mutation): ${schedulesWithoutType.map(s => s.name).join(', ')}`);
      return false;
    }
    
    // Validate update descriptions for update operations
    const modelsNeedingDescriptions = output.models.filter(m => m.operation === 'update' && !m.updateDescription);
    const actionsNeedingDescriptions = output.actions.filter(a => a.operation === 'update' && !a.updateDescription);
    const schedulesNeedingDescriptions = output.schedules.filter(s => s.operation === 'update' && !s.updateDescription);
    
    if (modelsNeedingDescriptions.length > 0) {
      console.warn(`⚠️ Models marked for update missing descriptions: ${modelsNeedingDescriptions.map(m => m.name).join(', ')}`);
    }
    
    if (actionsNeedingDescriptions.length > 0) {
      console.warn(`⚠️ Actions marked for update missing descriptions: ${actionsNeedingDescriptions.map(a => a.name).join(', ')}`);
    }
    
    if (schedulesNeedingDescriptions.length > 0) {
      console.warn(`⚠️ Schedules marked for update missing descriptions: ${schedulesNeedingDescriptions.map(s => s.name).join(', ')}`);
    }
    
    console.log('✅ Step 0 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 0 output validation failed:', error);
    return false;
  }
}

/**
 * Extracts key insights and metrics from Step 0 output for orchestration and logging
 * 
 * Usage by orchestrator:
 * - Call extractStep0Insights() to get summary metrics for logging
 * - Steps 1, 2, 3 now directly access Step0Output fields as needed
 * - No complex bridging required - each step extracts what it needs
 */
export function extractStep0Insights(step0Output: Step0Output) {
  return {
    confidence: step0Output.confidence,
    agentName: step0Output.agentName,
    domain: step0Output.domain,
    modelsCount: step0Output.models.length,
    actionsCount: step0Output.actions.length,
    schedulesCount: step0Output.schedules.length,
    operationBreakdown: {
      models: {
        create: step0Output.models.filter(m => m.operation === 'create').length,
        update: step0Output.models.filter(m => m.operation === 'update').length
      },
      actions: {
        create: step0Output.actions.filter(a => a.operation === 'create').length,
        update: step0Output.actions.filter(a => a.operation === 'update').length
      },
      schedules: {
        create: step0Output.schedules.filter(s => s.operation === 'create').length,
        update: step0Output.schedules.filter(s => s.operation === 'update').length
      }
    },
    typeBreakdown: {
      actions: {
        query: step0Output.actions.filter(a => a.type === 'query').length,
        mutation: step0Output.actions.filter(a => a.type === 'mutation').length
      },
      schedules: {
        query: step0Output.schedules.filter(s => s.type === 'query').length,
        mutation: step0Output.schedules.filter(s => s.type === 'mutation').length
      }
    },
    hasUpdates: step0Output.models.some(m => m.operation === 'update') || 
                step0Output.actions.some(a => a.operation === 'update') || 
                step0Output.schedules.some(s => s.operation === 'update'),
    totalEntitiesWithUpdates: step0Output.models.filter(m => m.operation === 'update').length +
                             step0Output.actions.filter(a => a.operation === 'update').length +
                             step0Output.schedules.filter(s => s.operation === 'update').length,
    totalEntities: step0Output.models.length + step0Output.actions.length + step0Output.schedules.length
  };
} 