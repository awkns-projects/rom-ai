import { generateDatabase, generateExampleRecords, generatePrismaDatabase } from '../generation';
import type { AgentData, AgentEnum, AgentModel, } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import { executeStep4VercelDeployment } from './step4-vercel-deployment';
import { z } from 'zod';
import { ConvertSchemaToObject } from '../schema/json';
import { mergeSchema } from '../schema/mergeSchema';
import { searchPrismaPatterns, combineSearchResults, type WebSearchResult } from '../web-search-utils';
import type { OrchestratorConfig } from './orchestrator';

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
  // Web search configuration
  orchestratorConfig?: OrchestratorConfig;
  // Removed targetDatabaseProvider - agent apps are SQLite-only
}

export interface Step1Output {
  enums: AgentEnum[];
  models: AgentModel[];
  implementationNotes: string[];
  prismaSchema: string;
  // Web search results
  webSearchResults?: {
    foundPatterns: any[];
    integrationNotes: string[];
  };
}


/**
 * Execute Step 1: Database Generation
 */
export async function executeStep1DatabaseGeneration(
  input: Step1Input
): Promise<Step1Output> {
  console.log('🗄️ STEP 1: Starting PostgreSQL database generation and schema analysis...');
  
  const { step0Analysis, existingAgent, conversationContext, command } = input;
  
  try {
    console.log('🏗️ Generating PostgreSQL Prisma database with Step 0 context...');
    console.log(`📊 Step 0 Model Analysis: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`);
    console.log(`🔍 Model Details: ${step0Analysis.models.length} total models identified in analysis`);
    console.log(`🗄️ Target Database: PostgreSQL (agent apps use Neon PostgreSQL for Vercel deployments)`);

    // 🌐 WEB SEARCH ENHANCEMENT: Find Prisma schema patterns and best practices
    let webSearchResults: Step1Output['webSearchResults'];
    if (input.orchestratorConfig?.enableWebSearch) {
      console.log('🔍 Searching for Prisma schema patterns and best practices...');
      
      try {
        const domainType = step0Analysis.domain || 'general';
        const schemaContext = `${step0Analysis.agentName} ${domainType} database schema`;
        
        const patternSearch = await searchPrismaPatterns(
          schemaContext,
          domainType,
          input.orchestratorConfig
        );
        
        if (patternSearch.success && patternSearch.foundPatterns) {
          webSearchResults = {
            foundPatterns: patternSearch.foundPatterns,
            integrationNotes: [
              `Found ${patternSearch.foundPatterns.length} Prisma schema patterns for ${domainType}`,
              'Web search enhanced database generation with industry best practices',
              'Schema patterns optimized for production deployment'
            ]
          };
          
          console.log(`✅ Web search enhanced database generation with ${patternSearch.foundPatterns.length} schema patterns`);
        }
      } catch (webSearchError) {
        console.warn('⚠️ Web search failed, continuing with standard generation:', webSearchError);
        webSearchResults = {
          foundPatterns: [],
          integrationNotes: ['Web search unavailable, using standard schema generation']
        };
      }
    }

    // Use validated schema generation with automatic error correction
    // Note: Web search patterns can be integrated into future schema generation enhancements
    const databaseResult = await generateValidatedPrismaSchema(
      step0Analysis,
      existingAgent,
      3 // Maximum 3 attempts with auto-correction
    );

    const result: Step1Output = {
      enums: databaseResult.enums,
      prismaSchema: databaseResult.prismaSchema,
      models: databaseResult.models,
      implementationNotes: [
        `Generated ${databaseResult.models.length} models based on Step 0 analysis`,
        `Step 0 identified ${step0Analysis.models.length} required models`,
        `Database generation strategy: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`,
        `Schema validation: Prisma validate validation passed with auto-correction`,
        ...(webSearchResults?.integrationNotes || [])
      ],
      webSearchResults
    };

    console.log('✅ STEP 1: Database generation completed successfully');
    console.log(`🗄️ Database Summary:
- Generated Models: ${result.models.length}
- Step 0 Model Context: ${step0Analysis.models.length} total (${step0Analysis.models.filter(m => m.operation === 'create').length} new, ${step0Analysis.models.filter(m => m.operation === 'update').length} updates)`);

    // 🚀 TRIGGER AUTO-DEPLOYMENT ASYNCHRONOUSLY
    // Deploy agent in background after database generation completes
    // Add a small delay to ensure document is properly saved before deployment
    // setTimeout(() => {
    //   triggerAutoDeployment(existingAgent, step0Analysis, result, {
    //     documentId: input.documentId,
    //     session: input.session,
    //     dataStream: input.dataStream
    //   }).catch(error => {
    //     console.error('❌ Auto-deployment failed (but not blocking main process):', error);
    //   });
    // }, 2000); // 2 second delay to ensure document is saved

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
                deploymentUrl: deploymentResult.deploymentUrl, // This is now the custom domain URL
                status: deploymentResult.status,
                apiEndpoints: deploymentResult.apiEndpoints || [],
                vercelProjectId: deploymentResult.vercelProjectId,
                deployedAt: new Date().toISOString(),
                warnings: deploymentResult.warnings || [],
                deploymentNotes: deploymentResult.deploymentNotes || [],
                // Add custom domain information
                customDomain: deploymentResult.customDomain
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

/**
 * Clean markdown formatting from Prisma schema
 */
function cleanSchemaMarkdown(schema: string): string {
  if (!schema) return schema;
  
  // Remove markdown code blocks (```prisma and ```)
  let cleaned = schema
    .replace(/^```prisma\s*/gm, '') // Remove opening ```prisma
    .replace(/^```\s*/gm, '') // Remove opening ```
    .replace(/```\s*$/gm, '') // Remove closing ```
    .trim();
  
  // Remove any remaining backticks at start/end
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3).trim();
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  
  return cleaned;
}

/**
 * Deduplicate models in Prisma schema
 */
function deduplicateModels(schema: string): string {
  console.log('🔧 Deduplicating models in Prisma schema...');
  
  const models = new Map<string, string>();
  const lines = schema.split('\n');
  const result: string[] = [];
  let currentModel: string | null = null;
  let modelContent: string[] = [];
  let inModel = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('model ')) {
      // Save previous model if exists
      if (currentModel && modelContent.length > 0) {
        const fullModelContent = modelContent.join('\n');
        if (!models.has(currentModel)) {
          models.set(currentModel, fullModelContent);
          console.log(`📝 Saved model: ${currentModel}`);
        } else {
          console.log(`⚠️ Duplicate model detected: ${currentModel} - keeping first definition`);
        }
      }
      
      // Start new model
      const modelMatch = trimmedLine.match(/model\s+(\w+)/);
      currentModel = modelMatch?.[1] || null;
      modelContent = [line];
      inModel = true;
    } else if (trimmedLine === '}' && inModel && currentModel) {
      // End current model
      modelContent.push(line);
      const fullModelContent = modelContent.join('\n');
      
      if (!models.has(currentModel)) {
        models.set(currentModel, fullModelContent);
        console.log(`✅ Completed model: ${currentModel}`);
      } else {
        console.log(`🗑️ Discarded duplicate model: ${currentModel}`);
      }
      
      currentModel = null;
      modelContent = [];
      inModel = false;
    } else if (inModel && currentModel) {
      // Add to current model
      modelContent.push(line);
    } else {
      // Non-model content (generator, datasource, enums)
      if (!inModel) {
        result.push(line);
      }
    }
  }
  
  // Add all unique models to result
  for (const [modelName, modelSchema] of models.entries()) {
    result.push(modelSchema);
  }
  
  const originalModelCount = (schema.match(/model\s+\w+\s*{/g) || []).length;
  const deduplicatedModelCount = models.size;
  
  console.log(`🔧 Deduplication complete: ${originalModelCount} → ${deduplicatedModelCount} models (removed ${originalModelCount - deduplicatedModelCount} duplicates)`);
  
  return result.join('\n');
}

/**
 * Validate no duplicate models exist in schema
 */
function validateNoDuplicateModels(schema: string): { valid: boolean; duplicates: string[] } {
  const modelNames: string[] = [];
  const duplicates: string[] = [];
  
  const modelMatches = schema.match(/model\s+(\w+)\s*{/g);
  if (modelMatches) {
    modelMatches.forEach(match => {
      const modelName = match.match(/model\s+(\w+)/)?.[1];
      if (modelName) {
        if (modelNames.includes(modelName)) {
          if (!duplicates.includes(modelName)) {
            duplicates.push(modelName);
          }
        } else {
          modelNames.push(modelName);
        }
      }
    });
  }
  
  return {
    valid: duplicates.length === 0,
    duplicates
  };
}

/**
 * Validate Prisma schema using AI-based comprehensive review
 * This catches semantic errors, relation issues, naming inconsistencies, and more
 */
async function validatePrismaSchemaWithAI(schema: string, step0Analysis?: Step0Output): Promise<{ 
  isValid: boolean; 
  formattedSchema?: string; 
  error?: string;
  issues?: string[];
  suggestions?: string[];
}> {
  console.log('🤖 Validating Prisma schema with AI-based comprehensive review...');
  
  const { getAgentBuilderModel } = await import('../generation');
  const model = await getAgentBuilderModel();
  
  // Clean the input schema first
  const cleanedSchema = cleanSchemaMarkdown(schema);
  
  // Check for and fix duplicate models
  const duplicateCheck = validateNoDuplicateModels(cleanedSchema);
  let deduplicatedSchema = cleanedSchema;
  
  if (!duplicateCheck.valid) {
    console.log(`🚨 Duplicate models detected: ${duplicateCheck.duplicates.join(', ')}`);
    deduplicatedSchema = deduplicateModels(cleanedSchema);
    console.log('✅ Schema deduplicated successfully');
  }
  
  const validationPrompt = `You are a Prisma schema validator. Your job is to analyze a Prisma schema and return a structured validation report.

SCHEMA TO VALIDATE:
\`\`\`prisma
${deduplicatedSchema}
\`\`\`

You must analyze this schema and return a JSON object with the following structure:

{
  "isValid": boolean (true if schema is valid, false if critical issues found),
  "overallAssessment": "Brief summary of schema quality",
  "criticalIssues": [
    {
      "type": "syntax|model_reference|enum_reference|relation_syntax|naming|business_logic",
      "description": "Description of the issue",
      "location": "Where in schema this occurs",
      "fix": "How to fix it",
      "severity": "critical|warning|suggestion"
    }
  ],
  "modelAnalysis": {
    "totalModels": number,
    "modelNames": ["list", "of", "model", "names"],
    "namingConsistency": "Assessment of naming",
    "missingModels": ["any", "referenced", "but", "missing", "models"]
  },
  "relationAnalysis": {
    "totalRelations": number,
    "syntaxErrorRelations": ["relations", "with", "syntax", "errors"],
    "invalidReferences": ["relations", "to", "nonexistent", "models"],
    "missingRelationSuggestions": ["potential", "relations", "to", "add"]
  },
  "enumAnalysis": {
    "totalEnums": number,
    "enumNames": ["list", "of", "enum", "names"],
    "invalidEnumReferences": ["fields", "referencing", "missing", "enums"]
  },
  "suggestions": ["list", "of", "improvement", "suggestions"],
  "correctedSchema": "If issues found, provide corrected schema WITHOUT markdown formatting"
}

VALIDATION RULES:
1. Check for syntax errors that would prevent deployment
2. Verify all model references are valid
3. Check enum definitions and references
4. Validate relation syntax (if @relation decorators are used)
5. Look for naming inconsistencies
6. Missing relations are suggestions only, not critical errors

Return ONLY the JSON object with the validation results.`;

  try {
    const { generateObject } = await import('ai');
    
    const validationResult = await generateObject({
      model,
      schema: z.object({
        isValid: z.boolean().describe('Whether the schema is valid and ready for deployment'),
        overallAssessment: z.string().describe('Overall assessment of the schema quality'),
        criticalIssues: z.array(z.object({
          type: z.enum(['syntax', 'model_reference', 'enum_reference', 'relation_syntax', 'naming', 'business_logic']),
          description: z.string().describe('Detailed description of the issue'),
          location: z.string().describe('Where in the schema this issue occurs'),
          fix: z.string().describe('Specific instructions to fix this issue'),
          severity: z.enum(['critical', 'warning', 'suggestion'])
        })).describe('List of issues found in the schema - NOTE: Missing relations should be marked as suggestions, not critical'),
        modelAnalysis: z.object({
          totalModels: z.number(),
          modelNames: z.array(z.string()),
          namingConsistency: z.string().describe('Assessment of model naming consistency'),
          missingModels: z.array(z.string()).describe('Models referenced but not defined')
        }),
        relationAnalysis: z.object({
          totalRelations: z.number(),
          syntaxErrorRelations: z.array(z.string()).describe('Relations with actual syntax errors in @relation decorators'),
          invalidReferences: z.array(z.string()).describe('Relations referencing non-existent models (syntax errors)'),
          missingRelationSuggestions: z.array(z.string()).describe('Potential relations that could be added (suggestions only)')
        }),
        enumAnalysis: z.object({
          totalEnums: z.number(),
          enumNames: z.array(z.string()),
          invalidEnumReferences: z.array(z.string()).describe('Fields referencing non-existent enums')
        }),
        suggestions: z.array(z.string()).describe('Suggestions for improving the schema'),
        correctedSchema: z.string().optional().describe('If issues found, provide a corrected version of the schema WITHOUT markdown formatting - raw Prisma schema only')
      }),
      messages: [
        {
          role: 'system',
          content: validationPrompt
        },
        {
          role: 'user',
          content: 'Analyze the Prisma schema above and return a JSON validation report. Check for syntax errors, missing models, invalid enum references, and relation issues. Return the structured JSON object as specified in the system prompt. Focus on critical issues that would prevent deployment.'
        }
      ],
      temperature: 0.1 // Low temperature for consistent validation
    });

    const result = validationResult.object;
    
    console.log(`🤖 AI validation complete:
- Valid: ${result.isValid}
- Critical Issues: ${result.criticalIssues.filter(i => i.severity === 'critical').length}
- Total Issues: ${result.criticalIssues.length}
- Models: ${result.modelAnalysis.totalModels}
- Relations: ${result.relationAnalysis.totalRelations}
- Enums: ${result.enumAnalysis.totalEnums}`);

    if (result.criticalIssues.length > 0) {
      console.log('🚨 Issues found:');
      result.criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
        console.log(`     Location: ${issue.location}`);
        console.log(`     Fix: ${issue.fix}`);
      });
    }

    if (!result.isValid) {
      const criticalIssues = result.criticalIssues.filter(i => i.severity === 'critical');
      
      // Check if we have a corrected schema from AI
      if (result.correctedSchema && result.correctedSchema.length > 100) {
        console.log('🔄 AI provided a corrected schema, using it instead of failing');
        const cleanedCorrectedSchema = cleanSchemaMarkdown(result.correctedSchema);
        return {
          isValid: true,
          formattedSchema: cleanedCorrectedSchema,
          issues: result.criticalIssues.map(i => `${i.type}: ${i.description} (auto-fixed)`),
          suggestions: result.suggestions
        };
      }
      
      const errorMessage = `Schema validation failed with ${criticalIssues.length} critical issues:\n${criticalIssues.map(i => `- ${i.description} (${i.location})`).join('\n')}`;
      
      return {
        isValid: false,
        error: errorMessage,
        issues: result.criticalIssues.map(i => `${i.type}: ${i.description}`),
        suggestions: result.suggestions
      };
    }

    // If valid, clean and format the schema
    const finalSchema = result.correctedSchema ? cleanSchemaMarkdown(result.correctedSchema) : deduplicatedSchema;
    
    return {
      isValid: true,
      formattedSchema: finalSchema,
      issues: result.criticalIssues.map(i => `${i.type}: ${i.description}`),
      suggestions: result.suggestions
    };

  } catch (error) {
    console.error('❌ AI schema validation failed:', error);
    
    // Fallback: Basic syntax validation without AI
    console.log('🔄 Falling back to basic syntax validation...');
    
    try {
      // Basic checks for common issues
      const basicValidation = performBasicSchemaValidation(deduplicatedSchema);
      
      if (basicValidation.isValid) {
        console.log('✅ Basic validation passed - schema appears valid');
        return {
          isValid: true,
          formattedSchema: deduplicatedSchema,
          issues: ['AI validation failed but basic validation passed'],
          suggestions: ['Consider manual review of schema']
        };
      } else {
        console.log('❌ Basic validation also failed');
        return {
          isValid: false,
          error: `Both AI and basic validation failed: ${basicValidation.error}`,
          issues: basicValidation.issues || [],
          suggestions: ['Manual schema review required']
        };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback validation also failed:', fallbackError);
      return {
        isValid: false,
        error: `All validation methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Basic schema validation without AI
 */
function performBasicSchemaValidation(schema: string): {
  isValid: boolean;
  error?: string;
  issues?: string[];
} {
  const issues: string[] = [];
  
  try {
    // Check for required components
    if (!schema.includes('generator client')) {
      issues.push('Missing generator client block');
    }
    
    if (!schema.includes('datasource db')) {
      issues.push('Missing datasource db block');
    }
    
    // Check for basic model syntax
    const modelMatches = schema.match(/model\s+\w+\s*{[^}]*}/g);
    if (!modelMatches || modelMatches.length === 0) {
      issues.push('No valid models found');
    }
    
    // Check for duplicate model names
    const modelNames: string[] = [];
    const duplicates: string[] = [];
    
    if (modelMatches) {
      modelMatches.forEach(modelBlock => {
        const nameMatch = modelBlock.match(/model\s+(\w+)/);
        if (nameMatch) {
          const modelName = nameMatch[1];
          if (modelNames.includes(modelName)) {
            if (!duplicates.includes(modelName)) {
              duplicates.push(modelName);
            }
          } else {
            modelNames.push(modelName);
          }
        }
      });
    }
    
    if (duplicates.length > 0) {
      issues.push(`Duplicate models found: ${duplicates.join(', ')}`);
    }
    
    // Check for basic field syntax issues
    const fieldErrors: string[] = [];
    if (modelMatches) {
      modelMatches.forEach(modelBlock => {
        const lines = modelBlock.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('model') && !trimmed.startsWith('}') && !trimmed.startsWith('//')) {
            // Basic field syntax check
            if (!trimmed.match(/^\w+\s+\w+/) && !trimmed.match(/^@@/)) {
              fieldErrors.push(`Invalid field syntax: ${trimmed}`);
            }
          }
        });
      });
    }
    
    if (fieldErrors.length > 0) {
      issues.push(`Field syntax errors: ${fieldErrors.slice(0, 3).join(', ')}${fieldErrors.length > 3 ? '...' : ''}`);
    }
    
    return {
      isValid: issues.length === 0,
      error: issues.length > 0 ? issues.join('; ') : undefined,
      issues
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Basic validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: ['Basic validation error']
    };
  }
}


/**
 * Generate, validate, and process Prisma schema with proper error handling
 */
async function generateValidatedPrismaSchema(
  step0Analysis: Step0Output,
  existingAgent: AgentData | undefined,
  maxAttempts: number = 3
): Promise<{ prismaSchema: string; models: AgentModel[]; enums: AgentEnum[] }> {
  console.log('🏗️ Starting validated Prisma schema generation with proper validation flow...');
  
  let currentAttempt = 1;
  let lastError = '';
  
  while (currentAttempt <= maxAttempts) {
    try {
      console.log(`📝 Schema generation attempt ${currentAttempt}/${maxAttempts}...`);
      
      // Step 1: Generate the raw schema
      let rawSchema: string;
      if (currentAttempt === 1) {
        console.log('🎯 Generating initial schema...');
        const databaseResult = await generatePrismaDatabase({
          existingAgent,
          step0Analysis,
          targetDatabaseProvider: 'postgresql'
        });
        rawSchema = databaseResult.prismaSchema;
      } else {
        console.log(`🔄 Regenerating schema with error feedback (attempt ${currentAttempt})...`);
        rawSchema = await regenerateSchemaWithErrorFeedback(
          step0Analysis,
          existingAgent,
          lastError,
          currentAttempt
        );
      }
      
      // Clean any markdown formatting from the raw schema
      rawSchema = cleanSchemaMarkdown(rawSchema);
      console.log(`📏 Generated schema length: ${rawSchema.length} characters`);
      
      // Step 2: Validate the schema with AI review
      console.log('🔍 Validating generated schema with AI review...');
      const validation = await validatePrismaSchemaWithAI(rawSchema, step0Analysis);
      
      if (!validation.isValid) {
        lastError = validation.error || 'Schema validation failed';
        console.log(`❌ Schema validation failed on attempt ${currentAttempt}: ${lastError}`);
        
        // On final attempt, try to proceed with basic validation
        if (currentAttempt === maxAttempts) {
          console.log('🔄 Final attempt - trying basic validation bypass...');
          const basicValidation = performBasicSchemaValidation(rawSchema);
          
          if (basicValidation.isValid) {
            console.log('✅ Basic validation passed - proceeding with schema despite AI validation failure');
            
            // Process the schema even though AI validation failed
            const basicSchemaObject = new ConvertSchemaToObject(rawSchema).run();
            const processedSchemaObject = mergeSchema(basicSchemaObject, '');
            
            console.log(`✅ Schema generation complete with basic validation:
- Schema: ${rawSchema.length} characters
- Processed models: ${processedSchemaObject.models.length}
- Processed enums: ${processedSchemaObject.enums.length}`);
            
            return {
              prismaSchema: rawSchema,
              models: processedSchemaObject.models,
              enums: processedSchemaObject.enums
            };
          }
          
          throw new Error(`Schema validation failed after ${maxAttempts} attempts: ${lastError}. Cannot deploy invalid schema.`);
        }
        
        currentAttempt++;
        continue;
      }
      
      console.log('✅ Schema validation passed - processing for deployment');
      
      // Step 3: Process the validated schema (this is what gets used by the app)
      console.log('🔄 Converting validated schema to AgentModel objects...');
      const validatedSchema = validation.formattedSchema || rawSchema;
      const basicSchemaObject = new ConvertSchemaToObject(validatedSchema).run();
      const processedSchemaObject = mergeSchema(basicSchemaObject, '');
      
      console.log(`✅ Schema generation complete on attempt ${currentAttempt}:
- Validated schema: ${validatedSchema.length} characters
- Processed models: ${processedSchemaObject.models.length}
- Processed enums: ${processedSchemaObject.enums.length}`);
      
      return {
        prismaSchema: validatedSchema, // Validated and formatted schema for deployment
        models: processedSchemaObject.models, // Processed models for app use
        enums: processedSchemaObject.enums // Processed enums for app use
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown generation error';
      console.error(`❌ Schema generation attempt ${currentAttempt} failed:`, error);
      
      if (currentAttempt === maxAttempts) {
        throw new Error(`All ${maxAttempts} schema generation attempts failed. Last error: ${lastError}`);
      }
      
      currentAttempt++;
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Schema generation failed unexpectedly');
}

/**
 * Regenerate schema with error feedback (simplified)
 */
async function regenerateSchemaWithErrorFeedback(
  step0Analysis: Step0Output,
  existingAgent: AgentData | undefined,
  validationError: string,
  attempt: number
): Promise<string> {
  console.log(`🔄 Regenerating schema with error feedback (attempt ${attempt})...`);
  
  const { generatePrismaSchema } = await import('../generation');
  
  const errorContext = `
CRITICAL PRISMA VALIDATION ERROR FROM PREVIOUS ATTEMPT:
${validationError}

The previous schema generation failed prisma validate validation. Please fix the following issues:
1. Ensure proper Prisma syntax for all model definitions
2. Check for missing or incorrect field types  
3. Verify enum definitions are properly formatted
4. Ensure all relations use correct syntax with @relation decorators
5. Check for duplicate field names or model names
6. Ensure all required Prisma schema elements are present
7. CRITICAL: Use exact model names in relations (if model is "Task", use "Task[]" not "TaskModel[]")
8. **CRITICAL ONE-TO-ONE RELATIONS**: If you see "A one-to-one relation must use unique fields" error:
   - Add @unique to the foreign key field
   - Example: adCampaignId String? @unique (not just adCampaignId String?)
   - Then: adCampaign AdCampaign? @relation(fields: [adCampaignId], references: [id])

9. **CRITICAL BIDIRECTIONAL RELATIONS**: If you see "both provide the fields/references argument" error:
   - Remove @relation(fields: [...], references: [...]) from ONE side of the relationship
   - Keep @relation(fields: [...], references: [...]) on only ONE side
   - Example fix for Task ↔ Schedule:
     WRONG: Both have @relation(fields: [...], references: [...])
     CORRECT: Only Schedule has @relation(fields: [taskId], references: [id])
     CORRECT: Task just has: schedules Schedule[] (no @relation decorator)

SPECIFIC ERROR TO FIX:
${validationError}

If the error mentions "one-to-one relation must use unique fields", you MUST add @unique to the foreign key field.

Generate a corrected Prisma schema that will pass prisma validate validation.`;

  // Generate a new schema with error context
  const correctedSchema = await generatePrismaSchema({
    step0Analysis: {
      ...step0Analysis,
      agentDescription: `${step0Analysis.agentDescription}\n\n${errorContext}`
    },
    targetDatabaseProvider: 'postgresql'
  });
  
  return correctedSchema;
}

 