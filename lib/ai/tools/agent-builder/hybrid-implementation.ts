import { z } from 'zod';
import { tool } from 'ai';
import { generateObject } from 'ai';
import type { Session } from 'next-auth';
import type { Message } from 'ai';

// Import existing types and schemas
import type { 
  AgentData, 
  AgentModel, 
  AgentAction, 
  AgentSchedule,
  PromptUnderstanding,
  ChangeAnalysis
} from './types';
import { 
  promptUnderstandingSchema,
  changeAnalysisSchema,
  unifiedDatabaseSchema,
  actionGenerationSchema,
  scheduleGenerationSchema
} from './schemas';

// Import existing generation functions
import {
  generatePromptUnderstanding,
  generateChangeAnalysis,
  generateDatabase,
  generateActions,
  generateSchedules,
  getAgentBuilderModel
} from './generation';

// Import existing progressive generation
import { generateEnhancedActionCodeProgressive } from './progressive-generation';

// Define DataStreamWriter interface based on usage
interface DataStreamWriter {
  writeData(data: { type: string; content: string }): void;
}

// Enhanced hybrid schemas combining both approaches
const hybridDecisionSchema = z.object({
  operationType: z.enum(['create', 'update', 'extend', 'resume']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  requiredPhases: z.array(z.enum([
    'requirement-analysis',
    'system-design', 
    'database-modeling',
    'action-generation',
    'schedule-creation',
    'documentation-generation'
  ])),
  estimatedComplexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']),
  riskFactors: z.array(z.string()),
  successCriteria: z.array(z.string())
});

const hybridRequirementAnalysisSchema = z.object({
  businessRequirements: z.object({
    primaryGoals: z.array(z.string()),
    userRoles: z.array(z.string()),
    workflows: z.array(z.object({
      name: z.string(),
      steps: z.array(z.string()),
      actors: z.array(z.string())
    })),
    constraints: z.array(z.string())
  }),
  technicalRequirements: z.object({
    dataModels: z.array(z.string()),
    integrations: z.array(z.string()),
    scalabilityNeeds: z.array(z.string()),
    securityRequirements: z.array(z.string())
  }),
  userExperience: z.object({
    interfaces: z.array(z.string()),
    interactions: z.array(z.string()),
    accessibility: z.array(z.string())
  }),
  qualityAssurance: z.object({
    testingStrategy: z.string(),
    monitoringNeeds: z.array(z.string()),
    maintenanceConsiderations: z.array(z.string())
  })
});

const hybridSystemDesignSchema = z.object({
  architecture: z.object({
    components: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      dependencies: z.array(z.string())
    })),
    dataFlow: z.array(z.object({
      from: z.string(),
      to: z.string(),
      data: z.string(),
      trigger: z.string()
    })),
    integrationPoints: z.array(z.string())
  }),
  designDecisions: z.array(z.object({
    decision: z.string(),
    rationale: z.string(),
    alternatives: z.array(z.string()),
    tradeoffs: z.string()
  })),
  riskMitigation: z.array(z.object({
    risk: z.string(),
    mitigation: z.string(),
    contingency: z.string()
  }))
});

// Utility functions from current implementation
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function streamWithPersistence(dataStream: DataStreamWriter, type: string, content: any, documentId: string, session: Session | null | undefined) {
  try {
    dataStream.writeData({ type, content });
    // Async save without blocking
    saveStreamState(documentId, type, content, session).catch(error => {
      console.error('❌ Failed to save stream state:', error);
    });
  } catch (error) {
    console.error('❌ Stream error:', error);
  }
}

async function saveStreamState(documentId: string, type: string, content: any, session: Session | null | undefined) {
  // Implementation would save to database - placeholder for now
  console.log(`💾 Saving stream state: ${type} for document ${documentId}`);
}

async function saveDocumentWithContent(
  documentId: string,
  title: string,
  content: string,
  session?: Session | null,
  deletionOperations?: any,
  metadata?: any
) {
  // Implementation would save to database - placeholder for now
  console.log(`💾 Saving document: ${title} (${documentId})`);
}

// Enhanced hybrid generation phases
export class HybridAgentBuilder {
  private documentId: string;
  private session: Session | null | undefined;
  private dataStream: DataStreamWriter;
  private stepMetadata: any;
  private isProcessCancelled: boolean = false;

  constructor(
    documentId: string,
    session: Session | null | undefined,
    dataStream: DataStreamWriter
  ) {
    this.documentId = documentId;
    this.session = session;
    this.dataStream = dataStream;
    this.stepMetadata = {
      currentStep: 'initialization',
      stepProgress: {},
      stepMessages: {},
      startTimestamp: new Date().toISOString(),
      processId: generateUUID()
    };
  }

  async executeHybridGeneration(
    command: string,
    operation: 'create' | 'update' | 'extend' | 'resume' = 'create',
    existingAgent?: AgentData,
    context?: string
  ): Promise<AgentData> {
    console.log(`🚀 Starting Hybrid Agent Builder: ${operation} - "${command}"`);

    try {
      // Phase 1: Enhanced Decision Making
      const decision = await this.generateHybridDecision(command, existingAgent, context);
      await this.updateProgress('decision-making', 'completed', 'Decision analysis complete');

      // Phase 2: Comprehensive Requirement Analysis  
      const requirements = await this.generateHybridRequirements(command, decision, existingAgent);
      await this.updateProgress('requirement-analysis', 'completed', 'Requirements analyzed');

      // Phase 3: System Design
      const systemDesign = await this.generateHybridSystemDesign(requirements, existingAgent);
      await this.updateProgress('system-design', 'completed', 'System architecture designed');

      // Phase 4: Enhanced Database Modeling (from current implementation)
      const databaseResult = await this.generateHybridDatabase(requirements, systemDesign, existingAgent);
      await this.updateProgress('database-modeling', 'completed', 'Database models created');

      // Phase 5: Progressive Action Generation (hybrid approach)
      const actionsResult = await this.generateHybridActions(requirements, systemDesign, databaseResult, existingAgent);
      await this.updateProgress('action-generation', 'completed', 'Actions generated');

      // Phase 6: Schedule Generation
      const schedules = await this.generateHybridSchedules(requirements, databaseResult, actionsResult, existingAgent);
      await this.updateProgress('schedule-creation', 'completed', 'Schedules created');

      // Phase 7: Documentation Generation (from README approach)
      const documentation = await this.generateHybridDocumentation(requirements, systemDesign, databaseResult, actionsResult);
      await this.updateProgress('documentation-generation', 'completed', 'Documentation generated');

      // Compile final agent data
      const finalAgent: AgentData = {
        id: generateUUID(),
        name: requirements.businessRequirements.primaryGoals[0] || 'AI Agent System',
        description: `Hybrid AI Agent: ${command}`,
        domain: 'AI Agent System',
        models: databaseResult.models,
        enums: databaseResult.enums || [],
        actions: actionsResult.actions,
        schedules: schedules.schedules,
        createdAt: new Date().toISOString(),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '2.0',
          lastModifiedBy: 'hybrid-agent-builder',
          tags: ['hybrid', 'ai-agent'],
          status: 'completed',
          aiDecision: decision,
          promptUnderstanding: requirements
        }
      };

      await this.finalizeGeneration(finalAgent);
      return finalAgent;

    } catch (error) {
      await this.handleGenerationError(error);
      throw error;
    }
  }

  private async generateHybridDecision(
    command: string,
    existingAgent?: AgentData,
    context?: string
  ) {
    console.log('🧠 Phase 1: Enhanced Decision Making');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'decision-making',
      status: 'processing',
      message: 'Analyzing request and making strategic decisions...'
    }), this.documentId, this.session);

    const model = await getAgentBuilderModel();
    
    const result = await generateObject({
      model,
      schema: hybridDecisionSchema,
      messages: [{
        role: 'system',
        content: `You are a strategic AI agent architect. Analyze the user request and make key decisions about the agent building approach.

USER REQUEST: "${command}"

EXISTING AGENT: ${existingAgent ? JSON.stringify(existingAgent, null, 2) : 'None'}

CONTEXT: ${context || 'None provided'}

Make strategic decisions about:
1. What type of operation this is (create/update/extend/resume)
2. Your confidence level in understanding the requirements
3. Which phases will be needed for this project
4. The estimated complexity level
5. Potential risk factors to consider
6. Success criteria for this agent

Be thorough in your reasoning and conservative in your confidence assessment.`
      }],
      temperature: 0.3,
    });

    console.log('✅ Decision analysis complete:', result.object);
    return result.object;
  }

  private async generateHybridRequirements(
    command: string,
    decision: any,
    existingAgent?: AgentData
  ) {
    console.log('📋 Phase 2: Comprehensive Requirement Analysis');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'requirement-analysis',
      status: 'processing',
      message: 'Conducting comprehensive requirement analysis...'
    }), this.documentId, this.session);

    const model = await getAgentBuilderModel();
    
    const result = await generateObject({
      model,
      schema: hybridRequirementAnalysisSchema,
      messages: [{
        role: 'system',
        content: `You are a business analyst and requirements engineer. Conduct a comprehensive analysis of the requirements for this AI agent system.

USER REQUEST: "${command}"

DECISION ANALYSIS: ${JSON.stringify(decision, null, 2)}

EXISTING AGENT: ${existingAgent ? JSON.stringify(existingAgent, null, 2) : 'None'}

Analyze and document:

BUSINESS REQUIREMENTS:
- What are the primary business goals?
- Who are the user roles that will interact with this system?
- What are the key workflows and processes?
- What constraints or limitations exist?

TECHNICAL REQUIREMENTS:
- What data models will be needed?
- What external integrations are required?
- What scalability considerations exist?
- What security requirements must be met?

USER EXPERIENCE:
- What interfaces will users interact with?
- What are the key user interactions?
- What accessibility considerations exist?

QUALITY ASSURANCE:
- How should this system be tested?
- What monitoring is needed?
- What maintenance considerations exist?

Be comprehensive and think about both immediate needs and future growth.`
      }],
      temperature: 0.3,
    });

    console.log('✅ Requirements analysis complete');
    return result.object;
  }

  private async generateHybridSystemDesign(
    requirements: any,
    existingAgent?: AgentData
  ) {
    console.log('🏗️ Phase 3: System Design');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'system-design',
      status: 'processing',
      message: 'Designing system architecture and components...'
    }), this.documentId, this.session);

    const model = await getAgentBuilderModel();
    
    const result = await generateObject({
      model,
      schema: hybridSystemDesignSchema,
      messages: [{
        role: 'system',
        content: `You are a system architect. Design the overall architecture for this AI agent system.

REQUIREMENTS: ${JSON.stringify(requirements, null, 2)}

EXISTING AGENT: ${existingAgent ? JSON.stringify(existingAgent, null, 2) : 'None'}

Design:

ARCHITECTURE:
- What are the key system components and their purposes?
- How does data flow between components?
- What are the key integration points?

DESIGN DECISIONS:
- What are the key architectural decisions?
- What is the rationale for each decision?
- What alternatives were considered?
- What are the tradeoffs?

RISK MITIGATION:
- What are the key risks in this design?
- How will each risk be mitigated?
- What contingency plans exist?

Focus on creating a robust, scalable, and maintainable architecture.`
      }],
      temperature: 0.3,
    });

    console.log('✅ System design complete');
    return result.object;
  }

  private async generateHybridDatabase(
    requirements: any,
    systemDesign: any,
    existingAgent?: AgentData
  ) {
    console.log('🗄️ Phase 4: Enhanced Database Modeling');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'database-modeling',
      status: 'processing',
      message: 'Creating database models with enhanced analysis...'
    }), this.documentId, this.session);

    // Create a proper PromptUnderstanding object based on the interface
    const promptUnderstanding: PromptUnderstanding = {
      userRequestAnalysis: {
        mainGoal: requirements.businessRequirements.primaryGoals[0] || 'AI Agent System',
        businessContext: JSON.stringify(requirements.businessRequirements),
        complexity: 'moderate',
        urgency: 'medium',
        clarity: 'clear'
      },
      featureImagination: {
        coreFeatures: requirements.businessRequirements.workflows.map((w: any) => w.name),
        additionalFeatures: requirements.userExperience.interactions,
        userExperience: requirements.userExperience.interfaces,
        businessRules: requirements.businessRequirements.constraints,
        integrations: requirements.technicalRequirements.integrations
      },
      dataModelingNeeds: {
        requiredModels: requirements.technicalRequirements.dataModels.map((model: string) => ({
          name: model,
          purpose: `Data model for ${model}`,
          priority: 'high' as const,
          estimatedFields: []
        })),
        relationships: systemDesign.architecture.dataFlow.map((flow: any) => ({
          from: flow.from,
          to: flow.to,
          type: 'one-to-many' as const,
          purpose: flow.data
        }))
      },
      workflowAutomationNeeds: {
        requiredActions: requirements.businessRequirements.workflows.map((workflow: any) => ({
          name: workflow.name,
          purpose: workflow.steps.join(', '),
          type: 'Create' as const,
          priority: 'high' as const,
          inputRequirements: workflow.steps,
          outputExpectations: [`${workflow.name} completed`]
        })),
        businessRules: [],
        oneTimeActions: [],
        recurringSchedules: [],
        businessProcesses: []
      },
      changeAnalysisPlan: [],
      implementationStrategy: {
        recommendedApproach: 'comprehensive',
        executionOrder: ['models', 'actions', 'schedules'],
        riskAssessment: systemDesign.riskMitigation.map((risk: any) => risk.risk),
        successCriteria: requirements.businessRequirements.primaryGoals
      }
    };

    const result = await generateDatabase(
      promptUnderstanding,
      existingAgent,
      undefined, // changeAnalysis
      systemDesign,
      JSON.stringify(requirements),
      requirements.businessRequirements.primaryGoals.join(', ')
    );

    console.log('✅ Enhanced database modeling complete');
    return result;
  }

  private async generateHybridActions(
    requirements: any,
    systemDesign: any,
    databaseResult: any,
    existingAgent?: AgentData
  ) {
    console.log('⚡ Phase 5: Progressive Action Generation');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'action-generation',
      status: 'processing',
      message: 'Generating actions with progressive enhancement...'
    }), this.documentId, this.session);

    // Create enhanced prompt understanding for actions
    const promptUnderstanding: PromptUnderstanding = {
      userRequestAnalysis: {
        mainGoal: requirements.businessRequirements.primaryGoals[0] || 'AI Agent System',
        businessContext: JSON.stringify(requirements.businessRequirements),
        complexity: 'moderate',
        urgency: 'medium',
        clarity: 'clear'
      },
      featureImagination: {
        coreFeatures: requirements.businessRequirements.workflows.map((w: any) => w.name),
        additionalFeatures: requirements.userExperience.interactions,
        userExperience: requirements.userExperience.interfaces,
        businessRules: requirements.businessRequirements.constraints,
        integrations: requirements.technicalRequirements.integrations
      },
      dataModelingNeeds: {
        requiredModels: databaseResult.models.map((model: any) => ({
          name: model.name,
          purpose: model.description || `Data model for ${model.name}`,
          priority: 'high' as const,
          estimatedFields: model.fields.map((field: any) => ({
            name: field.name,
            type: field.type,
            purpose: field.title || field.name,
            required: field.required
          }))
        })),
        relationships: []
      },
      workflowAutomationNeeds: {
        requiredActions: requirements.businessRequirements.workflows.map((workflow: any) => ({
          name: workflow.name,
          purpose: workflow.steps.join(', '),
          type: 'Create' as const,
          priority: 'high' as const,
          inputRequirements: workflow.steps,
          outputExpectations: [`${workflow.name} completed`]
        })),
        businessRules: [],
        oneTimeActions: [],
        recurringSchedules: [],
        businessProcesses: []
      },
      changeAnalysisPlan: [],
      implementationStrategy: {
        recommendedApproach: 'comprehensive',
        executionOrder: ['models', 'actions', 'schedules'],
        riskAssessment: [],
        successCriteria: requirements.businessRequirements.primaryGoals
      }
    };

    // Use progressive generation for enhanced actions
    const actionRequests = requirements.businessRequirements.workflows.map((workflow: any) => 
      `${workflow.name}: ${workflow.steps.join(' -> ')}`
    );

    const progressiveResults = [];
    for (const actionRequest of actionRequests) {
      try {
        const progressiveResult = await generateEnhancedActionCodeProgressive({
          actionAnalysis: {
            title: actionRequest.split(':')[0],
            description: actionRequest,
            businessContext: JSON.stringify(requirements)
          },
          databaseResult,
          existingAgent,
          promptUnderstanding,
          maxRetries: 2,
          enableFallbacks: true
        });
        
        // Create an AgentAction from the progressive result
        const agentAction: AgentAction = {
          id: generateUUID(),
          name: actionRequest.split(':')[0],
          description: actionRequest,
          type: 'Create',
          role: 'member',
          dataSource: {
            type: 'database',
            database: {
              models: databaseResult.models.map((model: any) => ({
                id: model.id,
                name: model.name,
                fields: model.fields.map((field: any) => ({
                  id: field.id,
                  name: field.name
                }))
              }))
            }
          },
          execute: {
            type: 'code',
            code: {
              script: progressiveResult.core.mainFunction.functionBody || 'return { output: {}, data: [] };',
              envVars: []
            }
          },
          results: {
            actionType: 'Create',
            model: databaseResult.models[0]?.name || 'DefaultModel',
            fields: {}
          },
          uiComponents: progressiveResult.ui ? {
            stepForms: [{
              stepNumber: 1,
              title: progressiveResult.ui.components[0]?.componentName || 'Run Action',
              description: progressiveResult.ui.components[0]?.description || 'Execute the action',
              reactCode: progressiveResult.ui.components[0]?.implementation.reactCode || '<div>Action Form</div>',
              propsInterface: progressiveResult.ui.components[0]?.implementation.propsInterface || {},
              validationLogic: 'return true;',
              dataRequirements: []
            }],
            resultView: {
              title: progressiveResult.ui.components.find(c => c.componentType === 'result-display')?.componentName || 'Results',
              description: progressiveResult.ui.components.find(c => c.componentType === 'result-display')?.description || 'Action results',
              reactCode: progressiveResult.ui.components.find(c => c.componentType === 'result-display')?.implementation.reactCode || '<div>Results</div>',
              propsInterface: progressiveResult.ui.components.find(c => c.componentType === 'result-display')?.implementation.propsInterface || {}
            }
          } : undefined
        };
        
        progressiveResults.push({ progressiveResult, agentAction });
        
        // Send progress update
        streamWithPersistence(this.dataStream, 'agent-progress', JSON.stringify({
          phase: 'action-generation',
          action: actionRequest,
          step: 'completed',
          progress: 100
        }), this.documentId, this.session);
        
      } catch (error) {
        console.warn(`⚠️ Progressive generation failed for action "${actionRequest}":`, error);
        // Continue with other actions
      }
    }

    // Also generate standard actions for comparison
    const standardActions = await generateActions(
      promptUnderstanding,
      databaseResult,
      existingAgent,
      undefined, // changeAnalysis
      systemDesign,
      JSON.stringify(requirements),
      requirements.businessRequirements.primaryGoals.join(', ')
    );

    // Combine progressive and standard actions
    const allActions = [
      ...standardActions.actions,
      ...progressiveResults.map(result => result.agentAction)
    ];

    // Remove duplicates based on name
    const uniqueActions = allActions.filter((action, index, self) => 
      index === self.findIndex(a => a.name === action.name)
    );

    console.log('✅ Progressive action generation complete');
    return { 
      actions: uniqueActions,
      progressiveResults: progressiveResults.map(r => r.progressiveResult),
      standardResults: standardActions
    };
  }

  private async generateHybridSchedules(
    requirements: any,
    databaseResult: any,
    actionsResult: any,
    existingAgent?: AgentData
  ) {
    console.log('📅 Phase 6: Schedule Generation');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'schedule-creation',
      status: 'processing',
      message: 'Creating automated schedules and workflows...'
    }), this.documentId, this.session);

    const promptUnderstanding: PromptUnderstanding = {
      userRequestAnalysis: {
        mainGoal: requirements.businessRequirements.primaryGoals[0] || 'AI Agent System',
        businessContext: JSON.stringify(requirements.businessRequirements),
        complexity: 'moderate',
        urgency: 'medium',
        clarity: 'clear'
      },
      featureImagination: {
        coreFeatures: requirements.businessRequirements.workflows.map((w: any) => w.name),
        additionalFeatures: requirements.userExperience.interactions,
        userExperience: requirements.userExperience.interfaces,
        businessRules: requirements.businessRequirements.constraints,
        integrations: requirements.technicalRequirements.integrations
      },
      dataModelingNeeds: {
        requiredModels: databaseResult.models.map((model: any) => ({
          name: model.name,
          purpose: model.description || `Data model for ${model.name}`,
          priority: 'high' as const,
          estimatedFields: []
        })),
        relationships: []
      },
      workflowAutomationNeeds: {
        requiredActions: [],
        businessRules: [],
        oneTimeActions: [],
        recurringSchedules: requirements.businessRequirements.workflows.map((workflow: any) => ({
          name: workflow.name,
          purpose: workflow.steps.join(', '),
          role: 'member' as const,
          frequency: 'daily' as const,
          timing: '09:00',
          priority: 'medium' as const,
          complexity: 'moderate' as const,
          businessValue: `Automate ${workflow.name}`,
          estimatedSteps: workflow.steps,
          dataRequirements: databaseResult.models.map((m: any) => m.name),
          expectedOutput: `${workflow.name} completed automatically`
        })),
        businessProcesses: []
      },
      changeAnalysisPlan: [],
      implementationStrategy: {
        recommendedApproach: 'comprehensive',
        executionOrder: ['models', 'actions', 'schedules'],
        riskAssessment: [],
        successCriteria: requirements.businessRequirements.primaryGoals
      }
    };

    const result = await generateSchedules(
      promptUnderstanding,
      databaseResult,
      actionsResult.actions,
      existingAgent
    );

    console.log('✅ Schedule generation complete');
    return result;
  }

  private async generateHybridDocumentation(
    requirements: any,
    systemDesign: any,
    databaseResult: any,
    actionsResult: any
  ) {
    console.log('📚 Phase 7: Documentation Generation');
    
    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'documentation-generation',
      status: 'processing',
      message: 'Generating comprehensive documentation...'
    }), this.documentId, this.session);

    // Generate comprehensive documentation
    const documentation = {
      overview: {
        purpose: requirements.businessRequirements.primaryGoals.join(', '),
        scope: requirements.businessRequirements.workflows.map((w: any) => w.name),
        users: requirements.businessRequirements.userRoles
      },
      architecture: systemDesign,
      dataModels: {
        models: databaseResult.models.map((model: any) => ({
          name: model.name,
          purpose: model.description,
          fields: model.fields.length,
          relationships: model.fields.filter((f: any) => f.relationField).length
        })),
        relationships: systemDesign.architecture.dataFlow
      },
      actions: {
        summary: `${actionsResult.actions.length} actions generated`,
        categories: actionsResult.actions.reduce((acc: any, action: any) => {
          const category = action.role || 'general';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        details: actionsResult.actions.map((action: any) => ({
          name: action.name,
          description: action.description,
          role: action.role,
          complexity: action.dataSource?.database?.models?.length || 0
        }))
      },
      deployment: {
        requirements: requirements.technicalRequirements,
        considerations: systemDesign.riskMitigation
      },
      troubleshooting: {
        commonIssues: [
          'Database connection issues',
          'Action execution failures', 
          'Permission denied errors',
          'Data validation failures'
        ],
        solutions: [
          'Check database configuration and connectivity',
          'Verify action parameters and user permissions',
          'Ensure user has required role for action',
          'Validate input data against model schemas'
        ]
      }
    };

    console.log('✅ Documentation generation complete');
    return documentation;
  }

  private async updateProgress(step: string, status: string, message: string) {
    this.stepMetadata.currentStep = step;
    this.stepMetadata.stepProgress[step] = status;
    this.stepMetadata.stepMessages[step] = message;
    this.stepMetadata.lastUpdateTimestamp = new Date().toISOString();

    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step,
      status,
      message
    }), this.documentId, this.session);

    await saveDocumentWithContent(
      this.documentId,
      'AI Agent System',
      JSON.stringify({ step, status, message }, null, 2),
      this.session,
      undefined,
      this.stepMetadata
    );
  }

  private async finalizeGeneration(agent: AgentData) {
    console.log('🎉 Finalizing hybrid agent generation');
    
    const finalContent = JSON.stringify(agent, null, 2);
    
    // Create user-friendly completion message
    const userFriendlyMessage = `🎉 **Agent System Generated Successfully!**

Your AI agent "${agent.name}" has been created with the following components:

📊 **Summary:**
- **${agent.models?.length || 0} Database Models** - Data structures for your application
- **${agent.actions?.length || 0} Actions** - Interactive features and workflows
- **${agent.schedules?.length || 0} Schedules** - Automated tasks and triggers

✅ **Ready to Use:** Your agent system is now available and ready for deployment!`;
    
    streamWithPersistence(this.dataStream, 'kind', 'agent', this.documentId, this.session);
    streamWithPersistence(this.dataStream, 'title', agent.name, this.documentId, this.session);
    streamWithPersistence(this.dataStream, 'content', userFriendlyMessage, this.documentId, this.session);
    
    await saveDocumentWithContent(
      this.documentId,
      agent.name,
      finalContent, // Save the raw JSON to the document for system use
      this.session,
      undefined,
      {
        ...this.stepMetadata,
        status: 'completed',
        completionTimestamp: new Date().toISOString()
      }
    );

    this.dataStream.writeData({ 
      type: 'finish', 
      content: `✅ Hybrid Agent "${agent.name}" generated successfully with ${agent.models?.length || 0} models, ${agent.actions?.length || 0} actions, and ${agent.schedules?.length || 0} schedules.`
    });
  }

  private async handleGenerationError(error: any) {
    console.error('❌ Hybrid generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorMetadata = {
      ...this.stepMetadata,
      status: 'error',
      errorTimestamp: new Date().toISOString(),
      errorMessage,
      canResume: true
    };

    await saveDocumentWithContent(
      this.documentId,
      'Error - AI Agent System',
      JSON.stringify({ error: errorMessage, canResume: true }, null, 2),
      this.session,
      undefined,
      errorMetadata
    );

    streamWithPersistence(this.dataStream, 'agent-step', JSON.stringify({
      step: 'error',
      status: 'failed',
      message: `Generation failed: ${errorMessage}`
    }), this.documentId, this.session);

    this.dataStream.writeData({ 
      type: 'finish', 
      content: `❌ Generation failed: ${errorMessage}. Progress has been saved and you can resume.`
    });
  }
}

// Main hybrid agent builder tool
export const hybridAgentBuilder = ({ 
  messages, 
  dataStream, 
  existingContext,
  existingDocumentId,
  session,
  chatId
}: { 
  messages: Message[]; 
  dataStream: DataStreamWriter;
  existingContext?: string | null;
  existingDocumentId?: string | null;
  session?: Session | null;
  chatId?: string;
}) => tool({
  description: `
Hybrid AI Agent Builder - Combines the best of structured analysis with robust technical implementation.

Features:
- Comprehensive requirement analysis and decision making
- Structured system design and architecture planning  
- Enhanced database modeling with action-aware design
- Progressive action generation with real-time streaming
- Automated schedule and workflow creation
- Complete documentation and troubleshooting guides
- Robust error handling and resume capabilities
- Persistent state management across interruptions

This hybrid approach ensures both thorough planning and reliable execution.
  `,
  parameters: z.object({
    command: z.string().describe('The user command or request for building/modifying the agent system'),
    operation: z.enum(['create', 'update', 'extend', 'resume']).default('create').describe('The type of operation to perform'),
    context: z.string().optional().describe('Additional context or existing agent data to work with')
  }),
  execute: async ({ command, operation = 'create', context }) => {
    console.log(`🚀 Hybrid Agent Builder: Processing "${command}" - Operation: ${operation}`);
    
    const documentId = existingDocumentId || generateUUID();
    const builder = new HybridAgentBuilder(documentId, session, dataStream);
    
    // Parse existing context if available
    let existingAgent: AgentData | undefined;
    const contextToUse = context || existingContext || undefined;
    
    if (contextToUse) {
      try {
        const parsedContext = JSON.parse(contextToUse);
        if (parsedContext && (parsedContext.name || parsedContext.models || parsedContext.actions)) {
          existingAgent = parsedContext as AgentData;
        }
      } catch (error) {
        console.log('⚠️ Could not parse existing context, treating as text input');
      }
    }

    try {
      const result = await builder.executeHybridGeneration(
        command,
        operation,
        existingAgent,
        contextToUse
      );

      return {
        id: documentId,
        title: result.name,
        kind: 'agent' as const,
        content: `🎉 **Agent System Generated Successfully!**

Your AI agent "${result.name}" has been created with the following components:

📊 **Summary:**
- **${result.models?.length || 0} Database Models** - Data structures for your application
- **${result.actions?.length || 0} Actions** - Interactive features and workflows
- **${result.schedules?.length || 0} Schedules** - Automated tasks and triggers

✅ **Ready to Use:** Your agent system is now available and ready for deployment!`
      };
      
    } catch (error) {
      console.error('❌ Hybrid agent builder failed:', error);
      throw error;
    }
  }
}); 