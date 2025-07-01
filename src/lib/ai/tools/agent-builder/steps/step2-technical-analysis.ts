import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel } from '../generation';
import type { AgentData } from '../types';
import type { Step0Output } from './step0-prompt-understanding';
import type { Step1Output } from './step1-decision-making';

/**
 * STEP 2: Technical Analysis and Prisma Schema Generation
 * 
 * Enhanced technical analysis that includes comprehensive Prisma schema generation.
 * This step analyzes technical requirements and generates a complete Prisma schema
 * that will be used by subsequent steps for database generation, actions, and schedules.
 */

export interface Step2Input {
  promptUnderstanding: Step0Output;
  decision: Step1Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
}

export interface Step2Output {
  // Original technical analysis fields
  complexity: 'simple' | 'moderate' | 'complex';
  systemArchitecture: {
    components: string[];
    dataFlow: string[];
    integrations: string[];
  };
  technicalRequirements: {
    databaseComplexity: 'simple' | 'moderate' | 'complex';
    apiIntegrations: string[];
    backgroundJobs: boolean;
    realTimeFeatures: boolean;
  };
  recommendedApproach: {
    architecture: string;
    rationale: string;
    tradeoffs: string[];
  };
  riskAssessment: {
    technicalRisks: string[];
    mitigationStrategies: string[];
    complexityScore: number;
  };
  
  // NEW: Prisma Schema Generation
  prismaSchema: {
    schema: string;
  };
}

/**
 * Execute Step 2: Technical Analysis with Prisma Schema Generation
 */
export async function executeStep2TechnicalAnalysis(
  input: Step2Input
): Promise<Step2Output> {
  console.log('🏗️ STEP 2: Starting technical analysis with Prisma schema generation...');
  
  const { promptUnderstanding, decision, existingAgent, conversationContext, command } = input;
  
  try {
    // PHASE 1: Original Technical Analysis
    console.log('📊 Phase 1: Performing technical analysis...');
    
    const model = await getAgentBuilderModel();
    
    const technicalAnalysisSchema = z.object({
      complexity: z.enum(['simple', 'moderate', 'complex']).describe('Overall system complexity based on requirements'),
      systemArchitecture: z.object({
        components: z.array(z.string()).describe('Key system components needed'),
        dataFlow: z.array(z.string()).describe('How data flows through the system'),
        integrations: z.array(z.string()).describe('External systems or APIs to integrate with')
      }),
      technicalRequirements: z.object({
        databaseComplexity: z.enum(['simple', 'moderate', 'complex']).describe('Database design complexity'),
        apiIntegrations: z.array(z.string()).describe('Required API integrations'),
        backgroundJobs: z.boolean().describe('Whether background job processing is needed'),
        realTimeFeatures: z.boolean().describe('Whether real-time features are required')
      }),
      recommendedApproach: z.object({
        architecture: z.string().describe('Recommended technical architecture approach'),
        rationale: z.string().describe('Why this approach was chosen'),
        tradeoffs: z.array(z.string()).describe('Technical tradeoffs and considerations')
      }),
      riskAssessment: z.object({
        technicalRisks: z.array(z.string()).describe('Potential technical risks'),
        mitigationStrategies: z.array(z.string()).describe('Strategies to mitigate risks'),
        complexityScore: z.number().min(0).max(100).describe('Overall complexity score (0-100)')
      })
    });

    const technicalAnalysisPrompt = `You are a senior software architect analyzing technical requirements for an AI agent system.

BUSINESS REQUIREMENTS:
${JSON.stringify(promptUnderstanding.userRequestAnalysis, null, 2)}

DECISION CONTEXT:
Operation: ${decision.operation}
Priority: ${decision.priority}
Needs Full Agent: ${decision.needsFullAgent}
Needs Database: ${decision.needsDatabase}
Needs Actions: ${decision.needsActions}

DATA MODELING NEEDS:
${JSON.stringify(promptUnderstanding.dataModelingNeeds, null, 2)}

WORKFLOW AUTOMATION NEEDS:
${JSON.stringify(promptUnderstanding.workflowAutomationNeeds, null, 2)}

${existingAgent ? `
EXISTING AGENT CONTEXT:
${JSON.stringify({
  name: existingAgent.name,
  domain: existingAgent.domain,
  modelCount: existingAgent.models?.length || 0,
  actionCount: existingAgent.actions?.length || 0,
  scheduleCount: existingAgent.schedules?.length || 0
}, null, 2)}
` : ''}

Analyze the technical requirements and provide:

1. **System Complexity**: Assess overall complexity (simple/moderate/complex)
2. **System Architecture**: Define components, data flow, and integrations needed
3. **Technical Requirements**: Database complexity, API needs, background jobs, real-time features
4. **Recommended Approach**: Architecture strategy with rationale and tradeoffs
5. **Risk Assessment**: Technical risks, mitigation strategies, and complexity scoring

Focus on practical, scalable solutions that can handle the business requirements efficiently.`;

    const technicalAnalysisResult = await generateObject({
      model,
      schema: technicalAnalysisSchema,
      messages: [
        {
          role: 'system',
          content: technicalAnalysisPrompt
        }
      ],
      temperature: 0.1
    });

    console.log('✅ Phase 1: Technical analysis completed');

    // PHASE 2: Enhanced Prisma Schema Generation with Existing Schema Consideration
    console.log('🗄️ Phase 2: Generating/updating Prisma schema...');
    
    // Extract existing schema information for updating
    let existingPrismaSchema = '';
    let existingModels: string[] = [];
    let existingActions: string[] = [];
    let existingSchedules: string[] = [];
    
    if (existingAgent) {
      // Get existing Prisma schema string
      existingPrismaSchema = existingAgent.metadata?.prismaSchema || '';
      
      // Extract existing model names
      existingModels = (existingAgent.models || []).map(m => m.name);
      
      // Extract existing action names and their referenced models
      existingActions = (existingAgent.actions || []).map(a => a.name);
      
      // Extract existing schedule names and their referenced models
      existingSchedules = (existingAgent.schedules || []).map(s => s.name);
      
      console.log(`📋 Found existing schema with ${existingModels.length} models, ${existingActions.length} actions, ${existingSchedules.length} schedules`);
    }
    
    const prismaSchemaSchema = z.object({
      schema: z.string().describe('Complete Prisma schema string with models, enums, and relationships'),
    });

    const prismaSchemaPrompt = `You are a database expert specializing in Prisma ORM. Generate a complete, production-ready Prisma schema based on the business requirements and technical analysis.

BUSINESS CONTEXT: ${promptUnderstanding.userRequestAnalysis.businessContext}

REQUIRED MODELS FROM ANALYSIS:
${JSON.stringify(promptUnderstanding.dataModelingNeeds.requiredModels, null, 2)}

WORKFLOW AUTOMATION NEEDS:
${JSON.stringify(promptUnderstanding.workflowAutomationNeeds, null, 2)}

TECHNICAL REQUIREMENTS:
- Database Complexity: ${technicalAnalysisResult.object.technicalRequirements.databaseComplexity}
- Background Jobs: ${technicalAnalysisResult.object.technicalRequirements.backgroundJobs}
- Real-time Features: ${technicalAnalysisResult.object.technicalRequirements.realTimeFeatures}
- API Integrations: ${technicalAnalysisResult.object.technicalRequirements.apiIntegrations.join(', ')}

${existingAgent && existingPrismaSchema ? `
EXISTING PRISMA SCHEMA (MUST preserve and extend, DO NOT remove existing models unless explicitly requested):
${existingPrismaSchema}

EXISTING MODELS TO PRESERVE: ${existingModels.join(', ')}
EXISTING ACTIONS: ${existingActions.join(', ')}
EXISTING SCHEDULES: ${existingSchedules.join(', ')}

CRITICAL UPDATE RULES:
1. PRESERVE all existing models unless explicitly requested to remove them
2. PRESERVE all existing fields - NEVER delete existing fields
3. EXTEND existing models with new fields if needed for new functionality
4. ADD new models required by the new request
5. MAINTAIN all existing relationships
6. ENSURE backward compatibility with existing actions and schedules
7. Make ALL new fields optional (except id fields) to ensure compatibility
` : ''}

PRISMA SCHEMA GENERATION REQUIREMENTS:

1. **Schema Structure**:
   - Include proper generator client configuration
   - Include datasource db configuration for PostgreSQL
   - Convert all required models to proper Prisma model syntax
   - Include all model relationships with proper Prisma syntax
   ${existingAgent ? '- PRESERVE existing models and extend them as needed' : ''}

2. **Field Requirements - CRITICAL**:
   - ALL fields must be OPTIONAL except for id fields (use ? syntax)
   - ID fields should use @id @default(cuid())
   - Use String? instead of String for all non-id fields
   - Use Int? instead of Int for all non-id fields
   - Use Float? instead of Float for all non-id fields
   - Use Boolean? instead of Boolean for all non-id fields
   - Use DateTime? instead of DateTime for all non-id fields
   - Make relation fields optional with ?
   ${existingAgent ? '- NEVER delete existing fields, only add new optional fields' : ''}

3. **Field Type Mapping**:
   - String → String?
   - Int → Int?  
   - Float → Float?
   - Boolean → Boolean?
   - DateTime → DateTime?
   - Json → Json?
   - ID fields should use @id @default(cuid()) and remain required

4. **Relationship Mapping**:
   - One-to-one: Use proper relation syntax with @relation
   - One-to-many: Parent has array field, child has single field
   - Many-to-many: Use explicit join tables when needed
   - Foreign keys: Generate proper references
   - Make all relation fields optional with ?
   ${existingAgent ? '- PRESERVE existing relationships and add new ones as needed' : ''}

5. **Indexes and Constraints**:
   - Add @unique for unique fields
   - Add @@index for performance optimization
   - Add @@map for custom table names if needed
   - Add proper @default values where appropriate

6. **Enums**:
   - Convert model enums to Prisma enum types
   - Reference enums properly in model fields with ?
   ${existingAgent ? '- PRESERVE existing enums and add new ones as needed' : ''}

7. **Performance Optimization**:
   - Add indexes on foreign key fields
   - Add indexes on frequently queried fields
   - Consider composite indexes for complex queries

8. **Workflow Support**:
   - Include status/state fields for workflow tracking (optional)
   - Include audit fields (createdAt?, updatedAt?, createdBy?, updatedBy?) - all optional except timestamps with @default
   - Include soft delete fields if needed (deletedAt?, deleted?) - all optional

EXAMPLE PRISMA SCHEMA STRUCTURE:

\`\`\`
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  pending
  processing
  completed
  cancelled
}

model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  name      String?
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Order {
  id       String       @id @default(cuid())
  userId   String?
  user     User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  status   OrderStatus? @default(pending)
  total    Float?
  items    OrderItem[]
  
  @@index([userId])
  @@index([status])
  @@map("orders")
}
\`\`\`

Generate a complete Prisma schema that:
- Follows best practices for production use
- Makes ALL fields optional except id fields for maximum flexibility
- Includes proper relationships and constraints
- Has performance optimizations
- Includes realistic default values
- Uses camelCase for field names
- Uses snake_case for table names (with @@map)
- Supports the workflow automation needs
- Includes proper validation and scoring
${existingAgent ? '- PRESERVES and EXTENDS existing schema rather than replacing it' : ''}
${existingAgent ? '- NEVER deletes existing fields, only adds new optional fields' : ''}
- Does NOT include migration script generation (we handle migrations separately)

REMEMBER: Make every field optional except id fields to ensure backward compatibility!`;

    const prismaSchemaResult = await generateObject({
      model,
      schema: prismaSchemaSchema,
      messages: [
        {
          role: 'system',
          content: prismaSchemaPrompt
        }
      ],
      temperature: 0.1
    });

    console.log('✅ Phase 2: Prisma schema generation completed');
    
    // Validate that the schema contains models
    if (!prismaSchemaResult.object.schema.includes('model ')) {
      console.warn('⚠️ Generated Prisma schema contains no models, regenerating...');
      
      // Fallback: Generate a minimal schema based on the required models
      const requiredModels = promptUnderstanding.dataModelingNeeds.requiredModels || [];
      let fallbackSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

      // Add basic models if none were generated
      if (requiredModels.length > 0) {
        for (const modelSpec of requiredModels) {
          fallbackSchema += `model ${modelSpec.name} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("${modelSpec.name.toLowerCase()}")
}

`;
        }
      } else {
        // Create a basic model if no requirements specified
        fallbackSchema += `model Record {
  id        String   @id @default(cuid())
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("records")
}

`;
      }
      
      // Override the generated schema with the fallback
      prismaSchemaResult.object.schema = fallbackSchema;
      console.log('🔄 Using fallback Prisma schema with basic models');
    }

    const result: Step2Output = {
      // Technical analysis results
      complexity: technicalAnalysisResult.object.complexity,
      systemArchitecture: technicalAnalysisResult.object.systemArchitecture,
      technicalRequirements: technicalAnalysisResult.object.technicalRequirements,
      recommendedApproach: technicalAnalysisResult.object.recommendedApproach,
      riskAssessment: technicalAnalysisResult.object.riskAssessment,
      
      // Prisma schema results
      prismaSchema: {
        ...prismaSchemaResult.object,
        // Override migration script to be empty since we don't generate migrations
      }
    };

    console.log('✅ STEP 2: Technical analysis with Prisma schema completed successfully');
    console.log(`🏗️ Technical Summary:
- System Complexity: ${result.complexity}
- Database Complexity: ${result.technicalRequirements.databaseComplexity}
- Components: ${result.systemArchitecture.components.length}
- API Integrations: ${result.technicalRequirements.apiIntegrations.length}
- Background Jobs: ${result.technicalRequirements.backgroundJobs ? 'Yes' : 'No'}
- Real-time Features: ${result.technicalRequirements.realTimeFeatures ? 'Yes' : 'No'}`);

    console.log(`🗄️ Prisma Schema Summary:

${existingAgent ? `- Existing Models Preserved: ${existingModels.length}` : ''}`);

    return result;
    
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
    // Validate technical analysis
    if (!output.complexity || !output.systemArchitecture || !output.technicalRequirements) {
      console.warn('⚠️ Technical analysis incomplete');
      return false;
    }
    
    if (output.riskAssessment.complexityScore > 90) {
      console.warn(`⚠️ Very high complexity score: ${output.riskAssessment.complexityScore}/100`);
      return false;
    }
    
    // Validate Prisma schema
    if (!output.prismaSchema.schema || output.prismaSchema.schema.length < 100) {
      console.warn('⚠️ Prisma schema too short or missing');
      return false;
    }
    
    if (!output.prismaSchema.migrationScript) {
      console.warn('⚠️ Migration script missing');
      return false;
    }
    
    if (output.prismaSchema.validationResults.overallScore < 70) {
      console.warn(`⚠️ Low Prisma schema validation score: ${output.prismaSchema.validationResults.overallScore}/100`);
      return false;
    }
    
    if (!output.prismaSchema.validationResults.schemaValidity) {
      console.warn('⚠️ Prisma schema is not valid');
      return false;
    }
    
    if (output.prismaSchema.models.length === 0) {
      console.warn('⚠️ No models defined in Prisma schema');
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
    databaseComplexity: output.technicalRequirements.databaseComplexity,
    componentCount: output.systemArchitecture.components.length,
    integrationCount: output.technicalRequirements.apiIntegrations.length,
    requiresBackgroundJobs: output.technicalRequirements.backgroundJobs,
    requiresRealTime: output.technicalRequirements.realTimeFeatures,
    complexityScore: output.riskAssessment.complexityScore,
    technicalRisks: output.riskAssessment.technicalRisks.length,
    recommendedArchitecture: output.recommendedApproach.architecture,
    
    // Prisma schema insights
    prismaSchemaLength: output.prismaSchema.schema.length,
    modelCount: output.prismaSchema.models.length,
    relationCount: output.prismaSchema.relations.length,
    enumCount: output.prismaSchema.enums.length,
    indexCount: output.prismaSchema.indexes.length,
    prismaValidationScore: output.prismaSchema.validationResults.overallScore,
    hasComplexRelationships: output.prismaSchema.relations.some(r => r.type === 'many-to-many'),
    requiresCarefulMigration: !output.prismaSchema.validationResults.migrationSafety,
    primaryModels: output.prismaSchema.models.slice(0, 3).map(m => m.name),
    performanceOptimized: output.prismaSchema.validationResults.performanceOptimization,
    readyForDatabase: output.prismaSchema.validationResults.schemaValidity && output.prismaSchema.validationResults.relationshipConsistency
  };
}

/**
 * Generate human-readable guidance from technical insights
 */
export function generateTechnicalGuidance(output: Step2Output): string {
  const insights = extractTechnicalInsights(output);
  
  let guidance = `## Technical Analysis Summary\n\n`;
  
  guidance += `**Complexity Level**: ${output.complexity}\n`;
  guidance += `**Recommended Approach**: ${output.recommendedApproach.architecture}\n`;
  guidance += `**Database Complexity**: ${output.technicalRequirements.databaseComplexity}\n\n`;
  
  if (output.systemArchitecture.components.length > 0) {
    guidance += `### System Components\n`;
    output.systemArchitecture.components.forEach((component, index) => {
      guidance += `${index + 1}. ${component}\n`;
    });
    guidance += `\n`;
  }
  
  if (output.riskAssessment.technicalRisks.length > 0) {
    guidance += `### Key Risks\n`;
    output.riskAssessment.technicalRisks.forEach(risk => {
      guidance += `- ${risk}\n`;
    });
    guidance += `\n`;
  }
  
  if (output.recommendedApproach.tradeoffs.length > 0) {
    guidance += `### Tradeoffs\n`;
    output.recommendedApproach.tradeoffs.forEach(tradeoff => {
      guidance += `- ${tradeoff}\n`;
    });
    guidance += `\n`;
  }

  if (output.prismaSchema.models.length > 0) {
    guidance += `### Database Models\n`;
    output.prismaSchema.models.forEach(model => {
      guidance += `- **${model.name}**: ${model.fields.length} fields\n`;
    });
    guidance += `\n`;
  }

  if (output.prismaSchema.relations.length > 0) {
    guidance += `### Key Relationships\n`;
    output.prismaSchema.relations.forEach(relation => {
      guidance += `- ${relation.fromModel} → ${relation.toModel} (${relation.type})\n`;
    });
  }
  
  return guidance;
} 