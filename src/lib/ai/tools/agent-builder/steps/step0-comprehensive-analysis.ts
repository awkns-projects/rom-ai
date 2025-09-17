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
  
  // External API analysis
  externalApiAnalysis: {
    requiredApis: Array<{
      name: string; // e.g., 'gmail', 'shopify', 'slack', 'stripe'
      purpose: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      useCase: string;
      requiredScopes: string[];
    }>;
    primaryApi: string | null; // The main API this agent will focus on
    requiresExternalApi: boolean;
    apiConflictResolution?: string; // If multiple APIs detected, explanation of which one was chosen
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

// NEW: Enhanced Step 0 action output with complete executable specifications
export interface Step0ExecutableAction {
  // Existing Step 0B fields
  name: string; // Code-safe name for API endpoints
  title: string; // Human-readable display name for UI
  purpose: string;
  operation: 'create' | 'update';
  updateDescription?: string;
  
  // NEW: Direct executable specifications
  targetModel: string;           // Which model this action processes
  processingMode: 'single';      // Always single-record processing
  
  // NEW: Direct pseudo steps (no separate generation needed)
  pseudoSteps: Array<{
    id: string;
    type: 'db_update_fields' | 'ai_generate_object' | 'ai_generate_text' | 'ai_generate_object_websearch' | 
          'ai_read_file_from_field' | 'ai_generate_image' | 'ai_modify_image' | 'ai_read_image' | 
          'external_api' | 'npm_package' | 'system_timestamp' | 'system_calculate';
    description: string;
    model?: string; // Target model for this step
    inputFields: Array<{
      id: string;
      name: string;
      type: string;
      kind: 'scalar' | 'object' | 'enum';
      required: boolean;
      list: boolean;
      relationModel?: string;
      description?: string;
      source: 'model_field' | 'related_model' | 'system' | 'parameter' | 'previous_step';
    }>;
    outputFields: Array<{
      id: string;
      name: string;
      type: string;
      kind: 'scalar' | 'object' | 'enum';
      required: boolean;
      list: boolean;
      relationModel?: string;
      description?: string;
      target: 'model_field' | 'temporary' | 'return';
    }>;
    // Step-specific properties
    prompt?: string;             // For AI steps
    apiEndpoint?: string;        // For external API steps
    packageName?: string;        // For npm package steps
    packageFunction?: string;    // Specific package function
    schema?: any;               // For AI generate object steps
    maxLength?: number;         // For AI text generation
    searchQuery?: string;       // For web search steps
    fileType?: 'text' | 'pdf' | 'image' | 'csv'; // For file reading
    processing?: string;        // Processing instructions
    dimensions?: { width: number; height: number }; // For image generation
    style?: string;            // Art style for images
    modifications?: string;     // Image modification instructions
    preserveOriginal?: boolean; // Keep original image
    updateConditions?: string[]; // Optional conditions for DB updates
  }>;
  
  // NEW: Direct executable code (no separate generation needed)
  executableCode: {
    script: string;              // Ready-to-run JavaScript
    envVars: Array<{            // Environment variables needed
      name: string;
      description: string;
      required: boolean;
      sensitive: boolean;
    }>;
    inputParameters: Array<{     // UI input parameters
      name: string;
      type: string;
      required: boolean;
      description: string;
      defaultValue?: any;
    }>;
    outputParameters: Array<{    // Return values
      name: string;
      type: string;
      description: string;
    }>;
    estimatedExecutionTime: string;
    testData: {
      input: Record<string, any>;
      expectedOutput: Record<string, any>;
    };
  };
}

// Enhanced Phase B: Technical Aggregation Output with executable actions
export interface Step0BOutput {
  // Basic info
  operation: 'create' | 'update' | 'extend';
  confidence: number;
  agentName: string;
  agentDescription: string;
  domain: string;
  
  // Enhanced external APIs metadata (now supporting multiple APIs)
  externalApis: Array<{
    provider: string; // e.g., 'shopify', 'gmail', 'slack', 'stripe'
    requiresConnection: boolean;
    connectionType: 'oauth' | 'api_key' | 'none';
    primaryUseCase: string;
    requiredScopes: string[];
    priority: 'primary' | 'secondary'; // Indicate primary vs secondary APIs
  }>;
  
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
  
  // NEW: Complete executable actions instead of simple specifications
  executableActions: Step0ExecutableAction[];
  
  // DEPRECATED: Keep for backward compatibility but will be populated from executableActions
  actions: Array<{
    name: string; // Code-safe name for API endpoints
    title: string; // Human-readable display name for UI
    purpose: string;
    operation: 'create' | 'update';
    updateDescription?: string; // Only present when operation is 'update'
  }>;
  
  schedules: Array<{
    name: string; // Code-safe name for cron jobs
    title: string; // Human-readable display name for UI
    purpose: string;
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

You excel at inferring detailed requirements from minimal user input. Users will typically provide:
1. Their CONTEXT (role, industry, situation)
2. A LIST OF TASKS they want help with

From this minimal information, you must intelligently infer:
- What commands users would naturally want to give
- What variables should be flexible in those commands
- What background automation should happen after commands
- What data needs to be tracked and processed
- What integrations would be valuable

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

2. INTELLIGENT COMMAND INFERENCE:
   - Based on their context and tasks, what commands would users naturally want to give?
   - What would be the most useful commands for someone in their situation?
   - Think about their daily workflow and pain points
   - Consider what they'd want to say to an assistant: "Create...", "Monitor...", "Update...", "Generate...", "Track..."

3. VARIABLE IDENTIFICATION:
   - For each inferred command, what parts should be flexible?
   - What would users want to customize each time? (quantities, topics, timeframes, criteria, etc.)
   - What parameters would make commands reusable for different situations?
   - Think about: numbers, dates, categories, thresholds, recipients, formats, etc.

4. BACKGROUND AUTOMATION PLANNING:
   - After a user gives a command, what should happen automatically?
   - Should the agent monitor things continuously?
   - What data processing needs to happen?
   - When should notifications be sent?
   - What reports or summaries should be generated?
   - How often should things be checked or updated?

5. IDENTIFY EXTERNAL API REQUIREMENTS:
   🚨 CRITICAL: ONLY SOCIAL MEDIA PLATFORMS ARE ALLOWED 🚨
   
   ALLOWED EXTERNAL APIs (ONLY THESE):
   - instagram (Instagram)
   - facebook (Facebook)
   - threads (Threads)
   - x (X/Twitter)
   - tiktok (TikTok)
   
   🚨 ABSOLUTELY FORBIDDEN APIs:
   - Any non-social media APIs (Stripe, SendGrid, Shopify, Gmail, Slack, etc.)
   - Any business/productivity APIs
   - Any payment/financial APIs
   - Any email/communication APIs (except social media)
   - Any e-commerce APIs
   - Any analytics APIs (except social media analytics)
   
   VALIDATION RULES:
   - Look for the "🔗 External Tools/APIs I Want to Connect:" section in the user's request
   - ONLY include APIs that are EXPLICITLY LISTED in this section AND are in the allowed list above
   - If user mentions any non-social media API, IGNORE it completely
   - If this section is missing or empty, set requiresExternalApi to false
   - Do NOT infer APIs from tasks, context, or other parts of the request
   - Do NOT add APIs just because they might be useful for the use case
   - For each ALLOWED API EXPLICITLY LISTED in the external tools section, determine its purpose and priority level (critical/high/medium/low)
   - What specific social media functionality is needed from each LISTED API?
   - What scopes/permissions would be required for each LISTED social media API?
   - IMPORTANT: The external tools section is the ONLY source for API requirements, and only social media APIs are allowed

6. IDENTIFY BUSINESS FEATURES:
   - What are the 3-5 core features needed?
   - What 2-3 additional features would add value?
   - What user experience improvements are required?
   - What business rules must be enforced?
   - What integrations might be needed?

7. EXTRACT SEMANTIC REQUIREMENTS:
   - What business entities/concepts need to be represented?
   - What business processes need to happen?
   - What manual actions do users need to perform?
   - What automated schedules need to run?
   - Focus on WHAT needs to be done, not HOW

8. AGENT DETAILS:
   - Suggest an appropriate agent name
   - Provide a clear agent description
   - Identify the business domain
   - What's the primary intent?
   - List relevant keywords

Be focused on business value and user needs. Use your intelligence to fill in the gaps from minimal user input. Think about what would make their life easier and their work more efficient.`;

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
        
        externalApiAnalysis: z.object({
          requiredApis: z.array(z.object({
            name: z.enum(['instagram', 'facebook', 'threads', 'x', 'tiktok']).describe('ONLY social media platforms allowed: instagram, facebook, threads, x, tiktok'),
            purpose: z.string().describe('Social media specific purpose only'),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            useCase: z.string().describe('Social media use case only'),
            requiredScopes: z.array(z.string()).max(5).describe('Social media API scopes only (read_posts, write_posts, analytics, etc.)')
          })).max(5).describe('ONLY social media APIs allowed - reject any non-social media APIs'),
          primaryApi: z.enum(['instagram', 'facebook', 'threads', 'x', 'tiktok']).nullable().describe('Primary social media API, null if none'),
          requiresExternalApi: z.boolean(),
          apiConflictResolution: z.string().optional()
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

Analyze this request and extract the business features and semantic requirements. The user has provided minimal information - use your intelligence to infer detailed requirements.

INTELLIGENT ANALYSIS REQUIRED:
- The user likely provided their CONTEXT (role/situation) and a LIST OF TASKS
- From this minimal input, infer what commands they'd naturally want to give
- Determine what variables should be flexible in those commands
- Plan what background automation should happen after commands are given
- Think about their daily workflow and what would make their life easier

COMMAND INFERENCE EXAMPLES:
- If they mention "social media posts" → infer commands like "Create social media campaign", "Schedule posts", "Analyze engagement"
- If they mention "price monitoring" → infer commands like "Monitor product prices", "Set price alerts", "Generate price reports"
- If they mention "expense tracking" → infer commands like "Log expenses", "Categorize transactions", "Generate budget reports"

VARIABLE INFERENCE EXAMPLES:
- "Create posts" → variables: number of posts, topics, platforms, scheduling times
- "Monitor prices" → variables: products, price thresholds, monitoring frequency
- "Track expenses" → variables: categories, date ranges, budget limits

BACKGROUND AUTOMATION EXAMPLES:
- After "Monitor prices" → continuously check prices, send alerts when thresholds hit, generate trend reports
- After "Schedule posts" → automatically post at specified times, track engagement, suggest optimal times
- After "Log expenses" → categorize automatically, update budgets, send spending alerts

EXTERNAL API DETECTION:
🚨 CRITICAL: ONLY SOCIAL MEDIA PLATFORMS ARE ALLOWED 🚨

ALLOWED APIs: instagram, facebook, threads, x, tiktok
FORBIDDEN: Any non-social media APIs (Stripe, SendGrid, Shopify, Gmail, Slack, etc.)

- Look specifically for the "🔗 External Tools/APIs I Want to Connect:" section in the user's request
- ONLY include APIs that are EXPLICITLY LISTED in this section AND are social media platforms
- If user mentions any non-social media API (Stripe, Gmail, Shopify, etc.), COMPLETELY IGNORE IT
- If the section is present but empty, set requiresExternalApi to false and primaryApi to null
- If the section is not present, set requiresExternalApi to false and primaryApi to null
- Do NOT infer APIs from tasks or context - only use the explicit list provided
- Do NOT add APIs that might be helpful but weren't specifically listed in the external tools section
- If multiple ALLOWED APIs are explicitly listed, prioritize based on their importance to the core functionality
- The external tools section is the ONLY source of truth for external API requirements, and only social media APIs are allowed

${existingAgent ? 'Focus on what NEW functionality is needed beyond what already exists.' : 'This is a new system - identify all requirements from scratch.'}

Use your intelligence to create a comprehensive analysis from this minimal input. Think about what someone in their situation would really need and want.`
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

You specialize in converting INFERRED user needs into technical implementations. Phase A has analyzed minimal user input (context + task list) and intelligently inferred:
- What commands users would want to give
- What variables should be flexible in those commands  
- What background automation should happen
- What data needs to be tracked

Your job is to convert these inferred requirements into concrete technical specifications.

${existingAgent ? `
EXISTING SYSTEM:
Models: ${existingAgent.models?.map(m => `${m.name} (${m.fields?.map(f => f.name).join(', ') || 'no fields'})`).join(', ') || 'none'}
Actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}
Schedules: ${existingAgent.schedules?.map(s => `${s.name} (${s.trigger?.pattern || 'no pattern'})`).join(', ') || 'none'}

IMPORTANT: For each model, field, enum, action, and schedule, determine if it should be:
- operation: "create" - This is a completely new entity that doesn't exist
- operation: "update" - This entity exists but needs modifications

For "update" operations, provide updateDescription explaining what changes are needed.
` : `This is a new system - all operations should be "create".`}

TECHNICAL SPECIFICATION REQUIREMENTS:

0. EXTERNAL API INTEGRATION:
   🚨 CRITICAL: ONLY SOCIAL MEDIA PLATFORMS ARE ALLOWED 🚨
   
   ALLOWED APIs: instagram, facebook, threads, x (twitter), tiktok
   FORBIDDEN: Any non-social media APIs (Stripe, SendGrid, Shopify, Gmail, Slack, etc.)
   
   - Based on the Phase A analysis, only integrate APIs that were explicitly mentioned AND are social media platforms
   - Do NOT add or suggest additional APIs beyond what was identified in Phase A
   - IGNORE any non-social media APIs that may have been mentioned
   - For each ALLOWED API identified in Phase A:
     * All social media APIs use OAuth connection type (never api_key)
     * Set priority: 'primary' (core functionality) or 'secondary' (additional features)
     * Define primaryUseCase explaining the main social media functionality this API enables
     * Specify required scopes/permissions for social media operations (read posts, write posts, analytics, etc.)
   - Design models, actions, and schedules to work ONLY with the ALLOWED social media APIs from Phase A analysis

1. DATABASE MODELS - Convert inferred data needs into database schemas:
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
  - Design models to support the inferred commands and their variables
  - If external APIs are specified, design models that integrate with those APIs' data structures

🚨 CRITICAL MODEL-ACTION FIELD COORDINATION:

**MODELS MUST INCLUDE FIELDS THAT ACTIONS WILL POPULATE:**

For each model, anticipate what fields actions will need to save results:

**For AI Analysis Actions:**
- Add fields with dynamic names based on action purpose and domain
- Types: String for text results, Float for numeric scores, DateTime for timestamps, Json for structured data

**For External API Actions:**  
- Add fields with names related to the specific API and its purpose
- Types: String for API responses, Boolean for validation results, Json for complex API data

**For Image/File Processing Actions:**
- Add fields based on the type of processing and file format
- Types: String for URLs/text, Json for structured data, Boolean for processing flags

**For System Actions:**
- Add standard processing metadata fields
- Types: DateTime for timestamps, String for status/notes, Boolean for flags

**DYNAMIC FIELD GENERATION PRINCIPLES:**
- Field names should be derived from action purposes and domain context
- Field types should match the expected output of each processing type
- All action output fields should be optional (nullable) 
- Field names should be descriptive and domain-appropriate
- Avoid generic names - use specific, meaningful field names based on business context

🔧 FIELD COORDINATION STRATEGY:
1. **Analyze the manual actions** from Phase A to understand what processing will happen
2. **Dynamically determine output fields** based on action purposes and domain context
3. **Include anticipated output fields** in the corresponding models with appropriate names
4. **Use appropriate field types** based on processing type (String, Float, DateTime, Boolean, Json)
5. **Make all action output fields optional** (nullable) since they'll be populated later
6. **Generate field names dynamically** based on business context and action purposes

This ensures field coordination without hardcoded values, allowing the AI to generate appropriate field names based on the specific business domain and action requirements.

2. BUSINESS PROCESS ACTIONS - Convert inferred commands into action specifications:
   ${existingAgent ? `
   - For EXISTING actions: operation="update" with updateDescription of what changes
   - For NEW actions: operation="create"
   - Existing actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}
   ` : 'All actions are new (operation="create")'}
   - Operation: MUST be either 'create' (new action) or 'update' (modify existing action)
   
   CRITICAL: Convert Phase A's inferred commands into BUSINESS PROCESS ACTIONS, not basic CRUD operations
   - Each action should represent a complete workflow that users would naturally want to trigger
   - Focus on the commands that Phase A identified users would want to give
   - Include the flexible variables that Phase A identified for each command
   - Actions should orchestrate external API calls, data processing, and business logic
   - Users already have basic CRUD capabilities - don't generate those
   
   COMMAND → ACTION MAPPING EXAMPLES:
   - Inferred command "Create social media campaign" → "Generate Social Media Campaign" action
   - Inferred command "Monitor product prices" → "Track Product Price Changes" action  
   - Inferred command "Generate expense report" → "Create Expense Analysis Report" action
   - Inferred command "Schedule content posts" → "Schedule Content Publishing" action
   
   Generate 3-7 meaningful business process actions that implement the inferred user commands

3. AUTOMATED SCHEDULES - Convert inferred background automation into schedule specifications:
   ${existingAgent ? `
   - For EXISTING schedules: operation="update" with updateDescription of what changes
   - For NEW schedules: operation="create"  
   - Existing schedules: ${existingAgent.schedules?.map(s => s.name).join(', ') || 'none'}
   ` : 'All schedules are new (operation="create")'}
   - Operation: MUST be either 'create' (new schedule) or 'update' (modify existing schedule)
   - Frequency: daily, weekly, or monthly
   - Convert Phase A's background automation plans into automated recurring operations
   - Each schedule should implement the continuous monitoring/processing that Phase A identified
   - Define frequency and timing based on the business needs identified
   - If external APIs are specified, design schedules that sync with or process those APIs' data

4. UPDATE DESCRIPTIONS:
   - For models: "Add support for X feature by including Y fields"
   - For fields: "Add field to track Z" or "Modify field to support additional data"
   - For enums: "Add new values for X cases" or "Update enum to include Y options"
   - For actions: "Enhance action to support Z functionality"
   - For schedules: "Update schedule to include X processing"

Convert the inferred semantic requirements into concrete technical specifications with proper create/update tracking, supporting multiple external API integrations as specified.

🚨 CRITICAL NAMING FORMAT REQUIREMENTS FOR ALL ENTITIES:

FOR EVERY MODEL, ACTION, AND SCHEDULE, GENERATE TWO DISTINCT VALUES:

**FOR DATABASE MODELS:**
1. **name**: MUST be PascalCase with NO spaces and NO "Model" suffix (e.g., "Customer", "Product", "Order")
   - Start with uppercase letter
   - No spaces, hyphens, underscores, or special characters
   - Use PascalCase for multiple words
   - This follows Prisma schema conventions
   - NEVER add "Model" suffix - it's redundant and breaks conventions

2. **title**: MUST be properly spaced, capitalized text (e.g., "Customer", "Product", "Order")
   - Use normal spacing between words if multiple words
   - Proper capitalization (Title Case)
   - This is what users will see in the interface

**FOR ACTIONS AND SCHEDULES:**
1. **name**: MUST be camelCase with NO spaces (e.g., "syncCustomerData", "generateDailyReport")
   - Start with lowercase letter
   - No spaces, hyphens, underscores, or special characters
   - Use camelCase for multiple words

2. **title**: MUST be properly spaced, capitalized text (e.g., "Sync Customer Data", "Generate Daily Report")
   - Use normal spacing between words
   - Proper capitalization (Title Case)

EXAMPLES OF CORRECT NAMING:
**Models:**
- ✅ name: "Customer", title: "Customer"
- ✅ name: "PatientRecord", title: "Patient Record"
- ✅ name: "MedicalDiagnosis", title: "Medical Diagnosis"

**Actions:**
- ✅ name: "syncInventoryData", title: "Sync Inventory Data"
- ✅ name: "generateDailyReport", title: "Generate Daily Report"
- ✅ name: "processOrderQueue", title: "Process Order Queue"

❌ WRONG NAMING PATTERNS:
**Models:**
- name: "customerModel" (has "Model" suffix - wrong!)
- name: "Customer Profile" (has spaces)
- name: "customer-profile" (has hyphens)
- name: "customerprofile" (not properly capitalized)

**Actions:**
- name: "Sync Inventory Data" (has spaces)
- name: "sync-inventory-data" (has hyphens)
- title: "syncInventoryData" (no spaces, not user-friendly)
- title: "sync inventory data" (not properly capitalized)

BOTH name AND title MUST BE PROVIDED FOR EVERY ENTITY.`;

    const result = await generateObject({
      model,
      schema: z.object({
        // From Phase A
        operation: z.enum(['create', 'update', 'extend']),
        confidence: z.number().min(0).max(100),
        
        agentName: z.string(),
        agentDescription: z.string(),
        domain: z.string(),
        
        externalApis: z.array(z.object({
          provider: z.enum(['instagram', 'facebook', 'threads', 'x', 'tiktok']).describe('ONLY social media platforms allowed'),
          requiresConnection: z.boolean(),
          connectionType: z.enum(['oauth']).describe('Social media APIs only use OAuth'),
          primaryUseCase: z.string().describe('Social media specific use case'),
          requiredScopes: z.array(z.string()).max(5).describe('Social media API scopes'),
          priority: z.enum(['primary', 'secondary'])
        })).max(5).describe('ONLY social media APIs allowed - maximum 5 social media platforms'),
        
        models: z.array(z.object({
          name: z.string().describe('camelCase model name for internal use (e.g., "socialMediaPost", "customerProfile") - NO SPACES'),
          title: z.string().describe('User-friendly display name with proper spacing (e.g., "Social Media Post", "Customer Profile") - what users see'),
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
          name: z.string().describe('camelCase action name for internal use (e.g., "syncShopifyInventory", "generateWeeklyReport") - NO SPACES'),
          title: z.string().describe('User-friendly display name with proper spacing (e.g., "Sync Shopify Inventory", "Generate Weekly Report") - what users see'),
          purpose: z.string().describe('Complete workflow description including external API integration and business logic'),
          operation: z.enum(['create', 'update']),
          updateDescription: z.string().optional()
        })).min(3).max(7).describe('Business process actions that integrate external APIs and orchestrate workflows - NOT basic CRUD operations'),
        
        schedules: z.array(z.object({
          name: z.string().describe('camelCase schedule name for internal use (e.g., "weeklyReportGeneration", "dailyDataSync") - NO SPACES'),
          title: z.string().describe('User-friendly display name with proper spacing (e.g., "Weekly Report Generation", "Daily Data Sync") - what users see'),
          purpose: z.string(),
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

EXTERNAL API ANALYSIS:
- Requires External API: ${phaseAOutput.externalApiAnalysis.requiresExternalApi}
- Primary API: ${phaseAOutput.externalApiAnalysis.primaryApi || 'none'}
- Required APIs: ${phaseAOutput.externalApiAnalysis.requiredApis.map(api => `${api.name} (${api.priority})`).join(', ') || 'none'}
${phaseAOutput.externalApiAnalysis.apiConflictResolution ? `- API Integration Strategy: ${phaseAOutput.externalApiAnalysis.apiConflictResolution}` : ''}

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

Using ALL the above information, convert these inferred semantic requirements into concrete technical specifications:

0. EXTERNAL API INTEGRATION:
   - Required APIs: ${phaseAOutput.externalApiAnalysis.requiredApis.map(api => api.name).join(', ') || 'none'}
   - Support MULTIPLE APIs - design the agent to work with ALL identified APIs
   - For each API, set appropriate priority (primary for core functionality, secondary for additional features)
   - All models, actions, and schedules should support integration with the relevant APIs

1. DATABASE MODELS - Convert inferred data tracking needs into database schemas:
   - Use entity priorities, relationships, and business rules from the semantic analysis
   - Design models to support the inferred commands and their flexible variables
   - High/Critical priority entities should become primary models
   - Use relationship information to design proper foreign keys and associations
   - Apply business rules as field constraints and validations
   - Consider integration requirements for external data fields
   - If external APIs specified, design models that match those APIs' data structures

2. BUSINESS PROCESS ACTIONS - Convert inferred user commands into action implementations:
   - Map each inferred command from the manual actions analysis to a complete business process action
   - For external API requirements, create dedicated integration actions
   - Each action should represent a full workflow, not a single database operation
   - Focus on automation between systems (API → Processing → Output)
   - Include support for the flexible variables identified for each command
   
   COMMAND MAPPING STRATEGY:
   - Look at the "Manual Actions" from semantic requirements - these are the commands users want to give
   - Convert each manual action into an automated business process action
   - For multi-system workflows, create combined process actions
   - Ensure actions support the variable parameters that would make them flexible
   
   AVOID creating actions for basic CRUD operations that users already have

3. AUTOMATED SCHEDULES - Convert inferred background automation into schedule implementations:
   - Use the "Automated Schedules" from semantic requirements as the foundation
   - High automation potential processes should become schedules
   - Use frequency information from automated schedules analysis
   - Consider business process triggers and outcomes
   - Map recurring business processes to schedule operations
   - Implement the continuous monitoring/processing that was inferred
   - If external APIs specified, design schedules that sync with or process those APIs' data

${existingAgent ? 'Focus on NEW models and additional fields for existing models, plus new actions and schedules that fulfill the inferred requirements.' : 'Design everything from scratch based on the comprehensive inference above.'}

CRITICAL ACTION GENERATION REQUIREMENTS:

Convert the inferred user commands into business process actions. For example:

✅ CORRECT Business Process Actions (based on inferred commands):
1. If Phase A inferred "Create social media campaign" command → "Generate Social Media Campaign" action
2. If Phase A inferred "Monitor price changes" command → "Track Product Price Changes" action  
3. If Phase A inferred "Send status updates" command → "Distribute Status Notifications" action
4. If Phase A inferred "Generate reports" command → "Create Analytics Report" action

❌ AVOID Basic CRUD Actions:
- "Create Product", "Update Inventory Item", "Delete Record" - users already have these
- "Set Configuration", "Update Settings" - these are configuration, not business processes
- "List Items", "View Data" - these are basic queries users already have

Generate 3-7 business process actions that implement the commands Phase A inferred users would want to give.`
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
      phaseAAnalysis: phaseAOutput,
      // TODO: Implement ultra-streamlined executable actions generation
      executableActions: [] // Placeholder - will be implemented in next phase
    };

    console.log('✅ STEP 0B: Technical aggregation completed successfully');
    console.log(`📊 Phase B Summary:
- Models: ${output.models.length} (${output.models.filter(m => m.operation === 'create').length} new, ${output.models.filter(m => m.operation === 'update').length} updates)
- Actions: ${output.actions.length} (${output.actions.filter(a => a.operation === 'create').length} new, ${output.actions.filter(a => a.operation === 'update').length} updates)
- Schedules: ${output.schedules.length} (${output.schedules.filter(s => s.operation === 'create').length} new, ${output.schedules.filter(s => s.operation === 'update').length} updates)`);  

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
    
    // Type validation removed - actions and schedules no longer have type fields
    
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
    // Type breakdown removed - actions and schedules no longer have type fields
    hasUpdates: step0Output.models.some(m => m.operation === 'update') || 
                step0Output.actions.some(a => a.operation === 'update') || 
                step0Output.schedules.some(s => s.operation === 'update'),
    totalEntitiesWithUpdates: step0Output.models.filter(m => m.operation === 'update').length +
                             step0Output.actions.filter(a => a.operation === 'update').length +
                             step0Output.schedules.filter(s => s.operation === 'update').length,
    totalEntities: step0Output.models.length + step0Output.actions.length + step0Output.schedules.length
  };
} 