import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import { promptUnderstandingSchema } from '../schemas';
import type { AgentData, PromptUnderstanding } from '../types';

/**
 * STEP 0: Simplified Analysis for Database, Actions, and Schedules Design
 * 
 * Focused analysis that provides exactly what's needed for:
 * - Database generation (models, fields, relationships)
 * - Action generation (workflows, business processes)
 * - Schedule generation (automation, recurring tasks)
 */

export interface Step0Input {
  userRequest: string;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
  currentOperation?: string;
}

export interface Step0Output extends PromptUnderstanding {
  // Basic analysis fields needed by downstream steps
  operation: 'create' | 'update' | 'extend';
  priority: 'agent-first' | 'database-first' | 'actions-first';
  confidence: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  
  // Required by orchestrator for agent name and description
  agentName: string;
  agentDescription: string;
  domain: string;
  primaryIntent: string;
  keywords: string[];
  
  // Basic technical requirements
  needsDatabase: boolean;
  needsActions: boolean;
  needsFullAgent: boolean;
  
  // Minimal fields for risk assessment
  estimatedComplexity: 'low' | 'medium' | 'high' | 'very-high';
  technicalRisks: string[];
}

/**
 * Execute simplified analysis focused on business requirements
 */
export async function executeStep0ComprehensiveAnalysis(
  input: Step0Input
): Promise<Step0Output> {
  console.log('🚀 STEP 0: Starting simplified business analysis...');
  
  const { userRequest, existingAgent, conversationContext, command, currentOperation } = input;
  
  try {
    const model = await getAgentBuilderModel();
    
    const systemPrompt = `You are a business analyst focused on understanding user requirements for database, actions, and schedules design.

${existingAgent ? `
EXISTING SYSTEM CONTEXT:
Models: ${existingAgent.models?.map(m => m.name).join(', ') || 'none'}
Actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}
Schedules: ${existingAgent.schedules?.map(s => s.name).join(', ') || 'none'}

🔍 This is an update/extension request. Focus on what NEW functionality is needed.
` : `This is a new system creation request.`}

ANALYSIS REQUIREMENTS:

1. USER REQUEST ANALYSIS:
   - What is the main goal?
   - What business context/domain?
   - What's the complexity level?
   - How urgent is this?
   - How clear is the request?

2. BUSINESS FEATURES (keep simple):
   - What 3-5 core features are needed?
   - What 2-3 additional features would be valuable?
   - What basic user experience improvements?
   - What essential business rules?
   - What key integrations might be needed?

3. DATA REQUIREMENTS (focus on essentials):
   ${existingAgent ? `Focus on NEW models only. Existing: ${existingAgent.models?.map(m => m.name).join(', ') || 'none'}` : ''}
   - What 2-5 key data models are needed?
   - What 3-7 fields for each model?
   - What simple relationships between models?
   - What 1-3 enums might be needed per model?

4. WORKFLOW REQUIREMENTS (practical focus):
   ${existingAgent ? `Focus on NEW actions/schedules only. Existing actions: ${existingAgent.actions?.map(a => a.name).join(', ') || 'none'}` : ''}
   - What 2-5 manual actions are needed?
   - What 1-3 automated schedules are needed?
   - What key business processes should be automated?
   - What essential workflows are required?

5. AGENT DETAILS:
   - Suggest a clear agent name
   - Provide practical agent description
   - Identify the business domain
   - What's the primary intent?
   - List 3-5 key keywords

Be focused and practical. Provide exactly what's needed for database, actions, and schedules generation without overcomplicating.`;

    const result = await generateObject({
      model,
      schema: z.object({
        // Core prompt understanding (simplified but sufficient)
        userRequestAnalysis: z.object({
          mainGoal: z.string(),
          businessContext: z.string(),
          complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']),
          urgency: z.enum(['low', 'medium', 'high', 'critical']),
          clarity: z.enum(['very_clear', 'clear', 'somewhat_unclear', 'unclear'])
        }),
        featureImagination: z.object({
          coreFeatures: z.array(z.string()).max(5),
          additionalFeatures: z.array(z.string()).max(3),
          userExperience: z.array(z.string()).max(3),
          businessRules: z.array(z.string()).max(3),
          integrations: z.array(z.string()).max(3)
        }),
        dataModelingNeeds: z.object({
          requiredModels: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            estimatedFields: z.array(z.object({
              name: z.string(),
              type: z.string(),
              purpose: z.string(),
              required: z.boolean(),
              enumValues: z.array(z.string()).optional()
            })).max(7),
            estimatedEnums: z.array(z.object({
              name: z.string(),
              purpose: z.string(),
              estimatedValues: z.array(z.string()).max(5)
            })).max(3).optional()
          })).max(5),
          relationships: z.array(z.object({
            from: z.string(),
            to: z.string(),
            type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
            purpose: z.string()
          })).max(5)
        }),
        workflowAutomationNeeds: z.object({
          requiredActions: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            type: z.enum(['Create', 'Update']),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            inputRequirements: z.array(z.string()).max(3),
            outputExpectations: z.array(z.string()).max(3)
          })).max(5),
          businessRules: z.array(z.object({
            condition: z.string(),
            action: z.string(),
            priority: z.enum(['critical', 'high', 'medium', 'low'])
          })).max(3),
          oneTimeActions: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            role: z.enum(['admin', 'member']),
            triggerType: z.enum(['manual', 'event-driven']),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            complexity: z.enum(['simple', 'moderate', 'complex']),
            businessValue: z.string(),
            estimatedSteps: z.array(z.string()).max(5),
            dataRequirements: z.array(z.string()).max(3),
            expectedOutput: z.string()
          })).max(5),
          recurringSchedules: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            role: z.enum(['admin', 'member']),
            frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'custom']),
            timing: z.string(),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            complexity: z.enum(['simple', 'moderate', 'complex']),
            businessValue: z.string(),
            estimatedSteps: z.array(z.string()).max(5),
            dataRequirements: z.array(z.string()).max(3),
            expectedOutput: z.string()
          })).max(3),
          businessProcesses: z.array(z.object({
            name: z.string(),
            description: z.string(),
            involvedModels: z.array(z.string()).max(3),
            automationPotential: z.enum(['high', 'medium', 'low']),
            requiresActions: z.boolean(),
            requiresSchedules: z.boolean()
          })).max(3)
        }),
        changeAnalysisPlan: z.array(z.object({
          changeId: z.string(),
          description: z.string(),
          type: z.enum(['create', 'update', 'delete']),
          targetType: z.enum(['models', 'actions', 'fields', 'system', 'integrations']),
          priority: z.enum(['critical', 'high', 'medium', 'low']),
          dependencies: z.array(z.string()).max(3),
          estimatedImpact: z.enum(['minimal', 'moderate', 'significant', 'major']),
          specificTargets: z.array(z.string()).max(3)
        })).max(5),
        implementationStrategy: z.object({
          recommendedApproach: z.enum(['incremental', 'comprehensive', 'modular', 'minimal-viable']),
          executionOrder: z.array(z.string()).max(5),
          riskAssessment: z.array(z.string()).max(3),
          successCriteria: z.array(z.string()).max(3)
        }),
        
        // Additional fields required by orchestrator
        operation: z.enum(['create', 'update', 'extend']),
        priority: z.enum(['agent-first', 'database-first', 'actions-first']),
        confidence: z.number().min(0).max(100),
        complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']),
        
        // Agent details
        agentName: z.string(),
        agentDescription: z.string(),
        domain: z.string(),
        primaryIntent: z.string(),
        keywords: z.array(z.string()).max(5),
        
        // Basic requirements
        needsDatabase: z.boolean(),
        needsActions: z.boolean(),
        needsFullAgent: z.boolean(),
        
        // Risk assessment
        estimatedComplexity: z.enum(['low', 'medium', 'high', 'very-high']),
        technicalRisks: z.array(z.string()).max(3)
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `USER REQUEST: "${userRequest}"

Analyze this request and provide a focused business analysis for database, actions, and schedules generation. Keep it practical and concise - focus on the essential requirements only.

${existingAgent ? 'Focus on what NEW functionality is needed beyond what already exists.' : 'This is a new system - design everything from scratch.'}`
        }
      ],
      temperature: 0.4,
      maxTokens: 3000
    });

    console.log('✅ STEP 0: Simplified analysis completed successfully');
    console.log(`📊 Analysis Summary:
- Operation: ${result.object.operation}
- Priority: ${result.object.priority}
- Confidence: ${result.object.confidence}%
- Complexity: ${result.object.complexity}
- Agent: ${result.object.agentName}
- Domain: ${result.object.domain}
- Models needed: ${result.object.dataModelingNeeds.requiredModels.length}
- Actions needed: ${result.object.workflowAutomationNeeds.requiredActions.length}
- Schedules needed: ${result.object.workflowAutomationNeeds.recurringSchedules.length}`);

    return result.object;
    
  } catch (error) {
    console.error('❌ STEP 0: Analysis failed:', error);
    throw new Error(`Step 0 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate simplified analysis output
 */
export function validateStep0Output(output: Step0Output): boolean {
  try {
    if (!output.userRequestAnalysis?.mainGoal) {
      console.warn('⚠️ Missing main goal in user request analysis');
      return false;
    }
    
    if (!output.agentName) {
      console.warn('⚠️ Missing agent name');
      return false;
    }
    
    if (output.confidence < 50) {
      console.warn(`⚠️ Low confidence level: ${output.confidence}%`);
      return false;
    }
    
    if (!output.dataModelingNeeds?.requiredModels?.length && !output.workflowAutomationNeeds?.requiredActions?.length) {
      console.warn('⚠️ No models or actions identified');
      return false;
    }
    
    console.log('✅ Step 0 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 0 output validation failed:', error);
    return false;
  }
}

/**
 * Extract insights from analysis for downstream steps
 */
export function extractStep0Insights(output: Step0Output) {
  return {
    complexity: output.complexity,
    confidence: output.confidence,
    primaryIntent: output.primaryIntent,
    estimatedComplexity: output.estimatedComplexity,
    modelCount: output.dataModelingNeeds.requiredModels.length,
    actionCount: output.workflowAutomationNeeds.requiredActions.length,
    scheduleCount: output.workflowAutomationNeeds.recurringSchedules.length,
    needsDatabase: output.needsDatabase,
    needsActions: output.needsActions,
    needsFullAgent: output.needsFullAgent,
    businessContext: output.userRequestAnalysis.businessContext,
    domain: output.domain,
    riskLevel: output.technicalRisks.length > 2 ? 'high' : output.technicalRisks.length > 0 ? 'medium' : 'low'
  };
} 