import { generateDatabase, generateExampleRecords, generatePrismaDatabase } from '../generation';
import type { AgentData, AgentEnum, AgentModel, } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import { executeStep4VercelDeployment } from './step4-vercel-deployment';
import { z } from 'zod';

/**
 * STEP 1: Database Generation & Model Design
 * 
 * Generate database models, schemas, and example data based on comprehensive analysis.
 * This step creates the data foundation for the agent system.
 */

export interface Step1Input {
  step0Analysis: Step0Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
  // Added for auto-deployment context
  documentId?: string;
  session?: any;
  dataStream?: any;
  // Removed targetDatabaseProvider - agent apps are SQLite-only
}

export interface Step1Output {
  enums: AgentEnum[];
  models: AgentModel[];
  implementationNotes: string[];
  prismaSchema: string;
}


/**
 * Execute Step 1: Database Generation
 */
export async function executeStep1DatabaseGeneration(
  input: Step1Input
): Promise<Step1Output> {
  console.log('🗄️ STEP 1: Starting SQLite database generation and schema analysis...');
  
  const { step0Analysis, existingAgent, conversationContext, command } = input;
  
  try {
    console.log('🏗️ Generating SQLite Prisma database with Step 0 context...');
    console.log(`📊 Step 0 Model Analysis: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`);
    console.log(`🔍 Model Details: ${step0Analysis.models.length} total models identified in analysis`);
    console.log(`🗄️ Target Database: SQLite (agent apps are SQLite-only)`);

    const databaseResult = await generatePrismaDatabase({
      existingAgent,
      step0Analysis
      // Removed targetDatabaseProvider - function now defaults to SQLite internally
    });

    const result: Step1Output = {
      enums: databaseResult.enums,
      prismaSchema: databaseResult.prismaSchema,
      models: databaseResult.models,
      implementationNotes: [
        `Generated ${databaseResult.models.length} models based on Step 0 analysis`,
        `Step 0 identified ${step0Analysis.models.length} required models`,
        `Database generation strategy: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`
      ]
    };

    console.log('✅ STEP 1: Database generation completed successfully');
    console.log(`🗄️ Database Summary:
- Generated Models: ${result.models.length}
- Step 0 Model Context: ${step0Analysis.models.length} total (${step0Analysis.models.filter(m => m.operation === 'create').length} new, ${step0Analysis.models.filter(m => m.operation === 'update').length} updates)`);

    // 🚀 TRIGGER AUTO-DEPLOYMENT ASYNCHRONOUSLY
    // Deploy agent in background after database generation completes
    // Add a small delay to ensure document is properly saved before deployment
    setTimeout(() => {
      triggerAutoDeployment(existingAgent, step0Analysis, result, {
        documentId: input.documentId,
        session: input.session,
        dataStream: input.dataStream
      }).catch(error => {
        console.error('❌ Auto-deployment failed (but not blocking main process):', error);
      });
    }, 2000); // 2 second delay to ensure document is saved

    return result;
    
  } catch (error) {
    console.error('❌ STEP 1: Database generation failed:', error);
    throw new Error(`Step 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 1 output for completeness and quality
 */
export function validateStep1Output(output: Step1Output): boolean {
  try {
    if (!output.models.length) {
      console.warn('⚠️ No models generated');
      return false;
    }
    
    // Check that models have proper structure
    const invalidModels = output.models.filter(m => 
      !m.name || !m.fields || m.fields.length === 0
    );
    
    if (invalidModels.length > 0) {
      console.warn(`⚠️ Invalid models found: ${invalidModels.length}`);
      return false;
    }
    
    // Check for duplicate model names
    const modelNames = output.models.map(m => m.name);
    const uniqueNames = new Set(modelNames);
    if (modelNames.length !== uniqueNames.size) {
      console.warn('⚠️ Duplicate model names found');
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
 * Extract model insights for downstream steps
 */
export function extractModelInsights(output: Step1Output) {
  return {
    modelCount: output.models.length,
    totalFields: output.models.reduce((total, model) => total + model.fields.length, 0),
    hasRelationships: output.models.some(model => 
      model.fields.some(field => field.type.includes('Model'))
    )
  };
}

/**
 * Trigger auto-deployment asynchronously after database generation
 */
async function triggerAutoDeployment(
  existingAgent: AgentData | undefined,
  step0Analysis: Step0Output,
  step1Result: Step1Output,
  context?: {
    documentId?: string;
    session?: any;
    dataStream?: any;
  }
): Promise<void> {
  console.log('🚀 STARTING AUTO-DEPLOYMENT after database generation...');
  
  try {
    // Only auto-deploy if we have a meaningful agent to deploy
    // Check for either existing agent ID OR document ID (for first creation) + agent name
    if ((!existingAgent?.id && !context?.documentId) || !step0Analysis.agentName) {
      console.log('⏭️ Skipping auto-deployment: insufficient agent data', {
        hasExistingAgentId: !!existingAgent?.id,
        hasDocumentId: !!context?.documentId,
        hasAgentName: !!step0Analysis.agentName
      });
      return;
    }

    // Prepare deployment configuration with proper Vercel project name sanitization
    const sanitizedProjectName = step0Analysis.agentName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-') // Replace invalid chars with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .replace(/---/g, '--') // Ensure no triple hyphens
      .substring(0, 100); // Limit to 100 characters
    
    const deploymentConfig = {
      projectName: sanitizedProjectName,
      description: step0Analysis.agentDescription || `Auto-deployed agent: ${step0Analysis.agentName}`,
      environmentVariables: {},
      region: 'aws-us-east-1' as const,
      vercelTeam: undefined
    };

    console.log(`🔧 Auto-deployment config:`, {
      projectName: deploymentConfig.projectName,
      hasAgent: !!existingAgent,
      modelCount: step1Result.models.length,
      hasContext: !!context,
      hasDocumentId: !!context?.documentId
    });

    // Create a minimal agent data structure for deployment
    // Handle first creation (no existingAgent) vs updates (with existingAgent)
    const agentForDeployment: AgentData = {
      // Use existing agent as base, or create minimal structure for first creation
      ...(existingAgent || {
        id: context?.documentId || `agent-${Date.now()}`, // Temporary ID for first creation
        name: '', // Will be overridden below
        description: '', // Will be overridden below
        domain: '', // Will be overridden below
        avatar: '',
        theme: 'default',
        visibility: 'private',
        models: [],
        actions: [],
        schedules: [],
        enums: [],
        externalApis: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          lastModifiedBy: '',
          status: 'draft',
          tags: []
        },
        createdAt: new Date().toISOString(),
        prismaSchema: '' // Will be overridden below
      }),
      // Override with Step 0 analysis and Step 1 results
      name: step0Analysis.agentName,
      description: step0Analysis.agentDescription || existingAgent?.description || '',
      domain: step0Analysis.domain || existingAgent?.domain || '',
      models: step1Result.models,
      enums: step1Result.enums,
      // Keep existing actions and schedules if they exist
      actions: existingAgent?.actions || [],
      schedules: existingAgent?.schedules || [],
      externalApis: step0Analysis.externalApis || existingAgent?.externalApis || [],
      prismaSchema: step1Result.prismaSchema
    };

    // Execute deployment (this will run in the background)
    // Note: We create minimal step outputs since we only have database info at this point
    const deploymentResult = await executeStep4VercelDeployment({
      step1Output: step1Result,
      step2Output: {
        actions: existingAgent?.actions || [],
        implementationComplexity: 'low',
        implementationNotes: 'Auto-deployment with existing actions'
      },
      step3Output: {
        schedules: existingAgent?.schedules || [],
        implementationComplexity: 'low'
      },
      projectName: deploymentConfig.projectName,
      description: deploymentConfig.description,
      environmentVariables: deploymentConfig.environmentVariables,
      vercelTeam: deploymentConfig.vercelTeam,
      documentId: context?.documentId
    });

    if (deploymentResult.deploymentUrl) {
      console.log('✅ AUTO-DEPLOYMENT SUCCESSFUL!');
      console.log(`🌐 Deployment URL: ${deploymentResult.deploymentUrl}`);
      console.log(`📦 Project ID: ${deploymentResult.projectId}`);
      console.log(`🔄 Status: ${deploymentResult.status}`);
      
      // CRITICAL FIX: Update the agent's deployment info and save to document
      if (context?.documentId && context?.session) {
        console.log('💾 Saving deployment info to document...');
        console.log('🔍 AUTO-DEPLOYMENT DEBUG - Context details:', {
          hasDocumentId: !!context.documentId,
          documentId: context.documentId,
          hasSession: !!context.session,
          hasUserId: !!context.session?.user?.id,
          deploymentUrl: deploymentResult.deploymentUrl,
          deploymentStatus: deploymentResult.status
        });
        
        try {
          // Import database functions
          const { getDocumentById, saveOrUpdateDocument } = await import('../../../../db/queries');
          
          // Get current document
          const existingDoc = await getDocumentById({ id: context.documentId });
          
          if (existingDoc) {
            console.log('📄 AUTO-DEPLOYMENT DEBUG - Found existing document:', {
              documentTitle: existingDoc.title,
              hasContent: !!existingDoc.content,
              contentLength: existingDoc.content?.length || 0
            });
            
            // Parse current agent data
            let currentAgentData: AgentData;
            try {
              currentAgentData = JSON.parse(existingDoc.content || '{}');
              console.log('📋 AUTO-DEPLOYMENT DEBUG - Parsed current agent data:', {
                hasName: !!currentAgentData.name,
                modelCount: currentAgentData.models?.length || 0,
                actionCount: currentAgentData.actions?.length || 0,
                hadPreviousDeployment: !!currentAgentData.deployment,
                previousDeploymentUrl: currentAgentData.deployment?.deploymentUrl || 'none'
              });
            } catch {
              currentAgentData = existingAgent || {} as AgentData;
              console.log('⚠️ AUTO-DEPLOYMENT DEBUG - Failed to parse existing content, using fallback');
            }
            
            // Update agent data with deployment info
            const updatedAgentData: AgentData = {
              ...currentAgentData,
              deployment: {
                deploymentId: deploymentResult.deploymentId,
                projectId: deploymentResult.projectId,
                deploymentUrl: deploymentResult.deploymentUrl,
                status: deploymentResult.status,
                apiEndpoints: deploymentResult.apiEndpoints || [],
                vercelProjectId: deploymentResult.vercelProjectId,
                deployedAt: new Date().toISOString(),
                warnings: deploymentResult.warnings || [],
                deploymentNotes: deploymentResult.deploymentNotes || []
              },
              metadata: {
                ...currentAgentData.metadata,
                updatedAt: new Date().toISOString(),
                status: 'deployed'
              }
            };
            
            console.log('🔄 AUTO-DEPLOYMENT DEBUG - Updated agent data:', {
              deploymentAdded: !!updatedAgentData.deployment,
              deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
              deploymentStatus: updatedAgentData.deployment?.status,
              hasApiEndpoints: !!updatedAgentData.deployment?.apiEndpoints?.length,
              metadataStatus: updatedAgentData.metadata?.status
            });
            
            // Save updated agent data back to document
            await saveOrUpdateDocument({
              id: context.documentId,
              title: existingDoc.title,
              content: JSON.stringify(updatedAgentData, null, 2),
              kind: existingDoc.kind,
              userId: context.session.user?.id as string,
              metadata: existingDoc.metadata
            });
            
            console.log('✅ AUTO-DEPLOYMENT: Agent data with deployment URL saved to document!');
            console.log('🔗 AUTO-DEPLOYMENT FINAL: Deployment URL is', updatedAgentData.deployment?.deploymentUrl);
            
            // Stream the updated agent data to UI if dataStream is available
            if (context.dataStream) {
              console.log('📡 Streaming updated agent data with deployment URL to UI...');
              console.log('🔍 STREAMING DEBUG - Data being streamed:', {
                type: 'agent-data',
                hasDeployment: !!updatedAgentData.deployment,
                deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
                contentLength: JSON.stringify(updatedAgentData, null, 2).length
              });
              
              // Stream the deployment notification first
              context.dataStream.writeData({ 
                type: 'deployment-complete', 
                content: {
                  deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
                  projectId: updatedAgentData.deployment?.projectId,
                  status: updatedAgentData.deployment?.status
                }
              });
              
              // Then stream the full updated agent data
              context.dataStream.writeData({ 
                type: 'agent-data', 
                content: JSON.stringify(updatedAgentData, null, 2)
              });
              
              console.log('✅ AUTO-DEPLOYMENT: Deployment data streamed to UI successfully!');
            } else {
              console.warn('⚠️ AUTO-DEPLOYMENT: No dataStream available - UI will not update immediately');
              console.warn('💡 SOLUTION: User should refresh the page to see the "View Live App" button');
            }
            
          } else {
            console.error('❌ AUTO-DEPLOYMENT: Document not found, cannot save deployment URL');
          }
          
        } catch (saveError) {
          console.error('❌ AUTO-DEPLOYMENT: Failed to save deployment URL to document:', saveError);
          // Don't throw - deployment was successful, just saving failed
        }
        
      } else {
        console.warn('⚠️ AUTO-DEPLOYMENT: No document context available, deployment URL not saved to document');
        console.warn('  - Users will not see "View Live App" button until manual deployment');
        console.warn('🔍 AUTO-DEPLOYMENT DEBUG - Missing context:', {
          hasContext: !!context,
          hasDocumentId: !!context?.documentId,
          hasSession: !!context?.session,
          documentId: context?.documentId || 'undefined',
          sessionUserId: context?.session?.user?.id || 'undefined'
        });
      }
      
    } else {
      console.error('❌ Auto-deployment failed: No deployment URL returned');
      console.error('Deployment result:', deploymentResult);
    }

  } catch (error: any) {
    console.error('❌ Auto-deployment error:', error);
    // Don't throw - we don't want to break the main generation process
  }
} 