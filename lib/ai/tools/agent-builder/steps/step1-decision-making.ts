import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import { decisionSchema } from '../schemas';
import type { AgentData, PromptUnderstanding } from '../types';
import type { Step0Output } from './step0-prompt-understanding';

/**
 * STEP 1: AI Decision Making & Execution Strategy
 * 
 * Determine optimal technical approach and execution strategy based on comprehensive analysis.
 * Enhanced with hybrid approach for better decision making and risk assessment.
 */

export interface Step1Input {
  command: string;
  conversationContext: string;
  promptUnderstanding: Step0Output;
  existingAgent?: AgentData;
  granularChanges?: any;
  currentOperation: string;
}

export interface Step1Output {
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
  // Enhanced fields from hybrid approach
  confidence: number;
  riskFactors: string[];
  successCriteria: string[];
  estimatedComplexity: 'low' | 'medium' | 'high' | 'very-high';
  recommendedPhases: string[];
  dependencies: string[];
  fallbackStrategies: string[];
}

/**
 * Enhanced decision making with hybrid approach logic
 * Preserves original functionality while adding comprehensive analysis
 */
export async function executeStep1Decision(
  input: Step1Input
): Promise<Step1Output> {
  console.log('🎯 STEP 1: Starting enhanced decision making and strategy planning...');
  
  const { command, conversationContext, promptUnderstanding, existingAgent, currentOperation } = input;
  
  try {
    const model = await getAgentBuilderModel();
    
    // Enhanced system prompt incorporating hybrid approach insights
    const systemPrompt = `You are a technical architect making critical decisions about system implementation strategy.

COMPREHENSIVE ANALYSIS RESULTS:
${JSON.stringify(promptUnderstanding, null, 2)}

CONTEXT:
- User Command: "${command}"
- Operation Type: ${currentOperation}
- Conversation Context: ${conversationContext}
${existingAgent ? `- Existing System: ${JSON.stringify(existingAgent, null, 2)}` : '- New System Creation'}

HYBRID APPROACH DECISION FRAMEWORK:

Based on this analysis, make strategic decisions covering:

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

6. ENHANCED HYBRID ANALYSIS:
   - Confidence level in the approach (0-100)
   - Risk factors and mitigation strategies
   - Success criteria and measurable outcomes
   - Fallback strategies if primary approach fails
   - Dependencies between components
   - Recommended execution phases

Provide specific, actionable decisions with clear reasoning and confidence assessment.`;

    const result = await generateObject({
      model,
      schema: z.object({
        analysisReasoning: z.string().describe('Detailed reasoning for the chosen approach'),
        needsFullAgent: z.boolean().describe('Whether a complete agent system is needed'),
        needsDatabase: z.boolean().describe('Whether database generation is needed'),
        needsActions: z.boolean().describe('Whether action generation is needed'),
        operation: z.enum(['create', 'update', 'extend']).describe('Type of operation to perform'),
        priority: z.enum(['agent-first', 'database-first', 'actions-first']).describe('Priority order for generation'),
        scope: z.object({
          agentWork: z.string().optional().describe('Scope of agent work needed'),
          databaseWork: z.string().optional().describe('Scope of database work needed'),
          actionsWork: z.string().optional().describe('Scope of actions work needed')
        }),
        // Enhanced hybrid approach fields
        confidence: z.number().min(0).max(100).describe('Confidence level in the approach'),
        riskFactors: z.array(z.string()).describe('Identified risk factors and concerns'),
        successCriteria: z.array(z.string()).describe('Measurable success criteria'),
        estimatedComplexity: z.enum(['low', 'medium', 'high', 'very-high']).describe('Overall complexity assessment'),
        recommendedPhases: z.array(z.string()).describe('Recommended execution phases'),
        dependencies: z.array(z.string()).describe('Dependencies between components'),
        fallbackStrategies: z.array(z.string()).describe('Fallback strategies if primary approach fails')
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Make strategic decisions for this request with comprehensive analysis and confidence assessment.`
        }
      ],
      temperature: 0.3 // Lower temperature for consistent strategic decisions
    });

    console.log('✅ STEP 1: Decision making completed successfully');
    console.log(`📊 Decision Summary:
- Operation: ${result.object.operation}
- Priority: ${result.object.priority}
- Confidence: ${result.object.confidence}%
- Complexity: ${result.object.estimatedComplexity}
- Risk Factors: ${result.object.riskFactors.length}
- Success Criteria: ${result.object.successCriteria.length}`);

    return result.object;
    
  } catch (error) {
    console.error('❌ STEP 1: Decision making failed:', error);
    throw new Error(`Step 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 1 output to ensure strategic decisions are sound
 */
export function validateStep1Output(output: Step1Output): boolean {
  try {
    // Check required strategic decisions
    if (!output.analysisReasoning) {
      console.warn('⚠️ Missing analysis reasoning');
      return false;
    }
    
    if (output.confidence < 50) {
      console.warn(`⚠️ Low confidence level: ${output.confidence}%`);
      return false;
    }
    
    if (!output.successCriteria.length) {
      console.warn('⚠️ No success criteria defined');
      return false;
    }
    
    if (output.estimatedComplexity === 'very-high' && output.riskFactors.length < 3) {
      console.warn('⚠️ Very high complexity but insufficient risk analysis');
      return false;
    }
    
    console.log('✅ Step 1 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 1 output validation failed:', error);
    return false;
  }
}

/**
 * Extract execution strategy from Step 1 for downstream coordination
 */
export function extractExecutionStrategy(output: Step1Output) {
  return {
    approach: output.operation,
    priority: output.priority,
    confidence: output.confidence,
    complexity: output.estimatedComplexity,
    phases: output.recommendedPhases,
    dependencies: output.dependencies,
    riskLevel: output.riskFactors.length > 3 ? 'high' : output.riskFactors.length > 1 ? 'medium' : 'low',
    needsFullGeneration: output.needsFullAgent,
    canUseIncrementalApproach: output.operation === 'update' || output.operation === 'extend',
    requiresCarefulValidation: output.estimatedComplexity === 'high' || output.estimatedComplexity === 'very-high'
  };
}

/**
 * Determine if fallback strategies should be activated
 */
export function shouldActivateFallback(output: Step1Output, currentError?: Error): boolean {
  const lowConfidence = output.confidence < 70;
  const highRisk = output.riskFactors.length > 2;
  const veryHighComplexity = output.estimatedComplexity === 'very-high';
  const hasError = !!currentError;
  
  return lowConfidence || highRisk || veryHighComplexity || hasError;
}

/**
 * Get recommended fallback strategy based on current situation
 */
export function getRecommendedFallback(output: Step1Output, currentError?: Error): string {
  if (currentError) {
    return output.fallbackStrategies[0] || 'Retry with simplified approach';
  }
  
  if (output.estimatedComplexity === 'very-high') {
    return 'Break down into smaller, manageable phases';
  }
  
  if (output.confidence < 60) {
    return 'Request more specific requirements from user';
  }
  
  return 'Proceed with additional validation checks';
} 