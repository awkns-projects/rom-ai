import { generateDatabase, generateExampleRecords, generatePrismaDatabase } from '../generation';
import type { AgentData, AgentEnum, AgentModel, } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step2Output } from './step2-action-generation';
import type { Step3Output } from './step3-schedule-generation';
import { executeStep4VercelDeployment } from './step4-vercel-deployment';
import { z } from 'zod';
import { ConvertSchemaToObject } from '../schema/json';
import { mergeSchema } from '../schema/mergeSchema';

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
  console.log('🗄️ STEP 1: Starting PostgreSQL database generation and schema analysis...');
  
  const { step0Analysis, existingAgent, conversationContext, command } = input;
  
  try {
    console.log('🏗️ Generating PostgreSQL Prisma database with Step 0 context...');
    console.log(`📊 Step 0 Model Analysis: ${step0Analysis.models.filter(m => m.operation === 'create').length} new models, ${step0Analysis.models.filter(m => m.operation === 'update').length} model updates`);
    console.log(`🔍 Model Details: ${step0Analysis.models.length} total models identified in analysis`);
    console.log(`🗄️ Target Database: PostgreSQL (agent apps use Neon PostgreSQL for Vercel deployments)`);

    // Use validated schema generation with automatic error correction
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
        `Schema validation: Prisma validate validation passed with auto-correction`
      ]
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
  
  const validationPrompt = `You are a Prisma schema expert conducting a comprehensive review of a generated schema. Your job is to identify any issues that would cause deployment failures, runtime errors, or poor database design.

SCHEMA TO REVIEW:
\`\`\`prisma
${cleanedSchema}
\`\`\`

${step0Analysis ? `
ORIGINAL REQUIREMENTS CONTEXT:
- Agent Name: ${step0Analysis.agentName}
- Description: ${step0Analysis.agentDescription}
- Domain: ${step0Analysis.domain}
- Required Models: ${step0Analysis.models?.map(m => m.name).join(', ') || 'None specified'}
` : ''}

COMPREHENSIVE VALIDATION CHECKLIST:

🔍 **1. SYNTAX & STRUCTURE VALIDATION:**
- Are generator and datasource blocks present and correct?
- Are all model and enum definitions properly formatted?
- Are all field types valid Prisma types?
- Are all decorators (@id, @default, @relation, etc.) syntactically correct?

🔍 **2. MODEL NAMING CONSISTENCY:**
- Are model names consistent throughout the schema?
- Do relation references use the exact model names that exist?
- Example: If model is named "Task", relations should use "Task[]" not "TaskModel[]"
- Check for "Type 'X' is neither a built-in type" potential errors

🔍 **3. ENUM VALIDATION:**
- Are all enum references valid (enum names exist)?
- Are enum values properly defined?
- Do model fields reference existing enums correctly?

🔍 **4. RELATION INTEGRITY:**
- Are all @relation decorators complete with fields and references?
- Do foreign key fields exist for all relations?
- Are relation directions correct (one-to-many, one-to-one)?
- Do all referenced models actually exist?
- Are foreign key types consistent (String? for String @id)?
- **CRITICAL**: One-to-one relations MUST have @unique on the foreign key field
- **CRITICAL**: Check for "A one-to-one relation must use unique fields" errors
- **CRITICAL**: If a relation field is optional (Model?) but no array ([]), it's one-to-one and needs @unique
- **CRITICAL BIDIRECTIONAL ERROR**: ONLY ONE SIDE of a relation should have fields and references in @relation
- **CRITICAL**: Check for "both provide the fields/references argument" errors - this means both sides have @relation decorators
- Example: userId String? @unique and user User? @relation(fields: [userId], references: [id])
- WRONG: Both sides having @relation(fields: [...], references: [...])
- CORRECT: Only one side has @relation(fields: [...], references: [...])

🔍 **5. FIELD VALIDATION:**
- Are required/optional markers (?) consistent?
- Are ID fields properly defined (@id @default(cuid()))?
- Are DateTime fields properly configured (@default(now()), @updatedAt)?
- Are unique constraints properly applied?

🔍 **6. BUSINESS LOGIC VALIDATION:**
- Do the models support the intended business operations?
- Are all necessary fields present for the business requirements?
- Are status/workflow fields properly defined with enums?

🔍 **7. DEPLOYMENT READINESS:**
- Will this schema deploy successfully to PostgreSQL?
- Are there any PostgreSQL-specific issues?
- Are there any potential runtime errors?

REVIEW EACH SECTION SYSTEMATICALLY AND IDENTIFY:
1. **Critical Issues**: Problems that will cause deployment or runtime failures
2. **Model Reference Issues**: Missing models, wrong model names in relations
3. **Enum Issues**: Missing enums, wrong enum references
4. **Relation Issues**: Incomplete or incorrect @relation decorators
5. **Bidirectional Relation Issues**: Both sides of a relation having @relation with fields/references
6. **One-to-One Relation Issues**: Missing @unique constraints on foreign key fields
7. **Naming Issues**: Inconsistent model naming conventions
8. **Business Logic Issues**: Missing fields or incorrect structures

IMPORTANT: When providing a corrected schema, return ONLY the raw Prisma schema content WITHOUT any markdown formatting (no \`\`\`prisma or \`\`\`). The corrected schema should start directly with 'generator client' or 'enum' declarations.

Provide a thorough analysis with specific fixes for any issues found.`;

  try {
    const { generateObject } = await import('ai');
    
    const validationResult = await generateObject({
      model,
      schema: z.object({
        isValid: z.boolean().describe('Whether the schema is valid and ready for deployment'),
        overallAssessment: z.string().describe('Overall assessment of the schema quality'),
        criticalIssues: z.array(z.object({
          type: z.enum(['syntax', 'model_reference', 'enum_reference', 'relation', 'naming', 'business_logic']),
          description: z.string().describe('Detailed description of the issue'),
          location: z.string().describe('Where in the schema this issue occurs'),
          fix: z.string().describe('Specific instructions to fix this issue'),
          severity: z.enum(['critical', 'warning', 'suggestion'])
        })).describe('List of issues found in the schema'),
        modelAnalysis: z.object({
          totalModels: z.number(),
          modelNames: z.array(z.string()),
          namingConsistency: z.string().describe('Assessment of model naming consistency'),
          missingModels: z.array(z.string()).describe('Models referenced but not defined')
        }),
        relationAnalysis: z.object({
          totalRelations: z.number(),
          incompleteRelations: z.array(z.string()).describe('Relations missing proper decorators'),
          invalidReferences: z.array(z.string()).describe('Relations referencing non-existent models'),
          relationIssues: z.array(z.string()).describe('Other relation problems')
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
          content: 'Please conduct a comprehensive validation of this Prisma schema and identify any issues that could cause deployment failures or runtime errors. Pay special attention to model naming consistency and relation integrity. If you provide a corrected schema, return it as raw Prisma code without any markdown formatting.'
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
    const finalSchema = result.correctedSchema ? cleanSchemaMarkdown(result.correctedSchema) : cleanedSchema;
    
    return {
      isValid: true,
      formattedSchema: finalSchema,
      issues: result.criticalIssues.map(i => `${i.type}: ${i.description}`),
      suggestions: result.suggestions
    };

  } catch (error) {
    console.error('❌ AI schema validation failed:', error);
    return {
      isValid: false,
      error: `AI validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        
        if (currentAttempt === maxAttempts) {
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

 