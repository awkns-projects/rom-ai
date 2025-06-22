import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import type { AgentData } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';

/**
 * STEP 2: Technical Analysis & System Design
 * 
 * Analyze technical requirements and design the system architecture.
 * This step bridges the gap between understanding and implementation.
 */

export interface Step2Input {
  promptUnderstanding: Step0Output;
  decision: Step1Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step2Output {
  // Technical Requirements Analysis
  technicalRequirements: {
    dataModels: string[];
    integrations: string[];
    scalabilityNeeds: string[];
    securityRequirements: string[];
    performanceRequirements: string[];
  };
  
  // System Architecture Design
  systemArchitecture: {
    components: Array<{
      name: string;
      purpose: string;
      dependencies: string[];
      type: 'model' | 'action' | 'schedule' | 'integration';
    }>;
    dataFlow: Array<{
      from: string;
      to: string;
      data: string;
      trigger: string;
    }>;
    integrationPoints: string[];
  };
  
  // Design Decisions
  designDecisions: Array<{
    decision: string;
    rationale: string;
    alternatives: string[];
    tradeoffs: string;
  }>;
  
  // Implementation Strategy
  implementationStrategy: {
    approach: 'unified' | 'phased' | 'incremental';
    phases: string[];
    dependencies: string[];
    riskMitigation: Array<{
      risk: string;
      mitigation: string;
      contingency: string;
    }>;
  };
  
  // Quality Assurance Plan
  qualityPlan: {
    testingStrategy: string;
    validationPoints: string[];
    monitoringNeeds: string[];
    maintenanceConsiderations: string[];
  };
  
  // Enhanced metrics
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  confidence: number;
  estimatedEffort: 'low' | 'medium' | 'high' | 'very-high';
  technicalRisks: string[];
}

/**
 * Execute Step 2: Technical Analysis and System Design
 */
export async function executeStep2TechnicalAnalysis(
  input: Step2Input
): Promise<Step2Output> {
  console.log('🔧 STEP 2: Starting technical analysis and system design...');
  
  const { promptUnderstanding, decision, existingAgent, conversationContext, command } = input;
  
  try {
    const model = await getAgentBuilderModel();
    
    const systemPrompt = `You are a senior technical architect analyzing requirements and designing system architecture.

PROMPT UNDERSTANDING:
${JSON.stringify(promptUnderstanding, null, 2)}

STRATEGIC DECISIONS:
${JSON.stringify(decision, null, 2)}

${existingAgent ? `EXISTING SYSTEM:
${JSON.stringify({
  models: existingAgent.models?.length || 0,
  actions: existingAgent.actions?.length || 0,
  schedules: existingAgent.schedules?.length || 0,
  domain: existingAgent.domain
}, null, 2)}` : 'NEW SYSTEM CREATION'}

CONTEXT:
- User Command: "${command}"
- Conversation Context: ${conversationContext || 'None'}

Your task is to perform comprehensive technical analysis and system design:

1. TECHNICAL REQUIREMENTS ANALYSIS:
   - Identify specific data models needed
   - Determine integration requirements
   - Assess scalability and performance needs
   - Define security requirements
   - Consider technical constraints

2. SYSTEM ARCHITECTURE DESIGN:
   - Define system components and their purposes
   - Map data flow between components
   - Identify integration points
   - Plan component dependencies

3. DESIGN DECISIONS:
   - Make key architectural decisions
   - Provide clear rationale for each decision
   - Consider alternatives and tradeoffs
   - Document assumptions

4. IMPLEMENTATION STRATEGY:
   - Choose optimal implementation approach
   - Define implementation phases
   - Identify dependencies and risks
   - Plan risk mitigation strategies

5. QUALITY ASSURANCE:
   - Define testing strategy
   - Plan validation checkpoints
   - Identify monitoring needs
   - Consider maintenance requirements

Provide specific, actionable technical guidance that will inform the database, action, and schedule generation phases.`;

    const result = await generateObject({
      model,
      schema: z.object({
        technicalRequirements: z.object({
          dataModels: z.array(z.string()).describe('Specific data models/entities needed'),
          integrations: z.array(z.string()).describe('Required integrations with external systems'),
          scalabilityNeeds: z.array(z.string()).describe('Scalability requirements and considerations'),
          securityRequirements: z.array(z.string()).describe('Security requirements and constraints'),
          performanceRequirements: z.array(z.string()).describe('Performance requirements and benchmarks')
        }),
        systemArchitecture: z.object({
          components: z.array(z.object({
            name: z.string(),
            purpose: z.string(),
            dependencies: z.array(z.string()),
            type: z.enum(['model', 'action', 'schedule', 'integration'])
          })).describe('System components and their relationships'),
          dataFlow: z.array(z.object({
            from: z.string(),
            to: z.string(),
            data: z.string(),
            trigger: z.string()
          })).describe('Data flow patterns between components'),
          integrationPoints: z.array(z.string()).describe('Key integration points in the system')
        }),
        designDecisions: z.array(z.object({
          decision: z.string(),
          rationale: z.string(),
          alternatives: z.array(z.string()),
          tradeoffs: z.string()
        })).describe('Key architectural decisions with rationale'),
        implementationStrategy: z.object({
          approach: z.enum(['unified', 'phased', 'incremental']).describe('Overall implementation approach'),
          phases: z.array(z.string()).describe('Implementation phases in order'),
          dependencies: z.array(z.string()).describe('Critical dependencies between phases'),
          riskMitigation: z.array(z.object({
            risk: z.string(),
            mitigation: z.string(),
            contingency: z.string()
          })).describe('Risk mitigation strategies')
        }),
        qualityPlan: z.object({
          testingStrategy: z.string().describe('Overall testing approach'),
          validationPoints: z.array(z.string()).describe('Key validation checkpoints'),
          monitoringNeeds: z.array(z.string()).describe('Monitoring and observability needs'),
          maintenanceConsiderations: z.array(z.string()).describe('Long-term maintenance considerations')
        }),
        complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']).describe('Overall system complexity'),
        confidence: z.number().min(0).max(100).describe('Confidence level in the technical analysis'),
        estimatedEffort: z.enum(['low', 'medium', 'high', 'very-high']).describe('Estimated implementation effort'),
        technicalRisks: z.array(z.string()).describe('Key technical risks and concerns')
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Perform comprehensive technical analysis and system design for this request.`
        }
      ],
      temperature: 0.3 // Lower temperature for consistent technical analysis
    });

    console.log('✅ STEP 2: Technical analysis completed successfully');
    console.log(`🔧 Technical Analysis Summary:
- System Complexity: ${result.object.complexity}
- Implementation Effort: ${result.object.estimatedEffort}
- Confidence Level: ${result.object.confidence}%
- Components Identified: ${result.object.systemArchitecture.components.length}
- Technical Risks: ${result.object.technicalRisks.length}
- Design Decisions: ${result.object.designDecisions.length}`);

    return result.object;
    
  } catch (error) {
    console.error('❌ STEP 2: Technical analysis failed:', error);
    throw new Error(`Step 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 2 output for completeness and quality
 */
export function validateStep2Output(output: Step2Output): boolean {
  try {
    // Check essential technical requirements
    if (!output.technicalRequirements.dataModels.length) {
      console.warn('⚠️ No data models identified');
      return false;
    }
    
    if (!output.systemArchitecture.components.length) {
      console.warn('⚠️ No system components defined');
      return false;
    }
    
    if (output.confidence < 60) {
      console.warn(`⚠️ Low confidence level: ${output.confidence}%`);
      return false;
    }
    
    if (!output.designDecisions.length) {
      console.warn('⚠️ No design decisions documented');
      return false;
    }
    
    if (output.complexity === 'enterprise' && output.implementationStrategy.riskMitigation.length < 2) {
      console.warn('⚠️ Enterprise complexity requires more risk mitigation strategies');
      return false;
    }
    
    console.log('✅ Step 2 output validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Step 2 output validation failed:', error);
    return false;
  }
}

/**
 * Extract technical insights for downstream steps
 */
export function extractTechnicalInsights(output: Step2Output) {
  return {
    complexity: output.complexity,
    confidence: output.confidence,
    estimatedEffort: output.estimatedEffort,
    componentCount: output.systemArchitecture.components.length,
    modelComponents: output.systemArchitecture.components.filter(c => c.type === 'model'),
    actionComponents: output.systemArchitecture.components.filter(c => c.type === 'action'),
    scheduleComponents: output.systemArchitecture.components.filter(c => c.type === 'schedule'),
    integrationComponents: output.systemArchitecture.components.filter(c => c.type === 'integration'),
    dataFlowComplexity: output.systemArchitecture.dataFlow.length > 5 ? 'complex' : 
                       output.systemArchitecture.dataFlow.length > 2 ? 'moderate' : 'simple',
    riskLevel: output.technicalRisks.length > 3 ? 'high' : 
               output.technicalRisks.length > 1 ? 'medium' : 'low',
    implementationApproach: output.implementationStrategy.approach,
    requiresPhasing: output.implementationStrategy.approach !== 'unified',
    requiresCarefulHandling: output.complexity === 'complex' || output.complexity === 'enterprise' || 
                            output.confidence < 70 || output.technicalRisks.length > 2,
    primaryDataModels: output.technicalRequirements.dataModels.slice(0, 5),
    criticalIntegrations: output.technicalRequirements.integrations,
    keyDesignDecisions: output.designDecisions.map(d => d.decision)
  };
}

/**
 * Generate implementation guidance based on technical analysis
 */
export function generateImplementationGuidance(output: Step2Output): string {
  const insights = extractTechnicalInsights(output);
  
  let guidance = `## Implementation Guidance\n\n`;
  
  guidance += `**Complexity Level**: ${output.complexity}\n`;
  guidance += `**Recommended Approach**: ${output.implementationStrategy.approach}\n`;
  guidance += `**Estimated Effort**: ${output.estimatedEffort}\n\n`;
  
  if (insights.requiresPhasing) {
    guidance += `### Phased Implementation\n`;
    output.implementationStrategy.phases.forEach((phase, index) => {
      guidance += `${index + 1}. ${phase}\n`;
    });
    guidance += `\n`;
  }
  
  if (output.technicalRisks.length > 0) {
    guidance += `### Key Risks\n`;
    output.technicalRisks.forEach(risk => {
      guidance += `- ${risk}\n`;
    });
    guidance += `\n`;
  }
  
  if (output.designDecisions.length > 0) {
    guidance += `### Critical Design Decisions\n`;
    output.designDecisions.slice(0, 3).forEach(decision => {
      guidance += `- **${decision.decision}**: ${decision.rationale}\n`;
    });
  }
  
  return guidance;
} 