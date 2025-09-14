import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel, generatePseudoSteps, generateUIComponents } from './generation';
import { sanitizeEnvironmentVariables } from './utils';

/**
 * Sequential Implementation Step Schema
 */
export const SequentialStepSchema = z.object({
  stepNumber: z.number().describe('Step number in the execution sequence'),
  stepTitle: z.string().describe('Brief title describing what this step does'),
  description: z.string().describe('Detailed description of the step purpose and logic'),
  codePattern: z.string().describe('Actual TypeScript/JavaScript code pattern to implement this step'),
  inputFromPreviousStep: z.string().optional().describe('What data this step receives from the previous step'),
  outputToNextStep: z.string().optional().describe('What data this step produces for the next step'),
  databaseOperations: z.array(z.string()).optional().describe('Specific Prisma queries used in this step'),
  apiCalls: z.array(z.string()).optional().describe('External API calls made in this step'),
  errorHandling: z.string().optional().describe('Specific error handling for this step')
});

/**
 * Technical Specification Schema - code-focused specification document with sequential steps
 */
export const TechnicalSpecificationSchema = z.object({
  name: z.string().describe('Action name in camelCase'),
  title: z.string().describe('User-friendly action title'),
  purpose: z.string().describe('Brief technical purpose of the action'),
  
  // Available Prisma Schema
  availablePrismaSchema: z.string().describe('Complete Prisma schema with all available models, fields, and relationships that this action can use'),
  
  // Sequential implementation steps with actual code
  sequentialSteps: z.array(SequentialStepSchema).describe('Step-by-step implementation flow with actual code patterns'),
  
  // Input/Output schemas with TypeScript interfaces
  inputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
    defaultValue: z.any().optional()
  })).describe('Exact input parameters with TypeScript types'),
  
  outputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })).describe('Exact output parameters with TypeScript types'),
  
  // Environment variables needed
  environmentVariables: z.array(z.string()).describe('List of environment variable names needed for implementation'),
  
  // Code dependencies and imports
  codeDependencies: z.array(z.string()).describe('Required imports, libraries, and dependencies needed for implementation'),
  
  // Overall implementation approach
  implementationApproach: z.string().describe('High-level technical approach and architecture decisions'),
  
  // Performance and error handling
  performanceConsiderations: z.string().describe('Technical performance requirements, optimization strategies, and scalability considerations'),
  globalErrorHandling: z.string().describe('Overall error handling strategy and patterns used across all steps')
});

export type TechnicalSpecification = z.infer<typeof TechnicalSpecificationSchema>;

/**
 * Generate technical specification - code-focused spec that serves as implementation blueprint
 */
export async function generateTechnicalSpecification(
  name: string,
  description: string,
  businessContext: string,
  availableModels: any[],
  prismaSchema?: string,
  externalApis?: any[]
): Promise<TechnicalSpecification> {
  console.log(`📋 Generating technical specification for: ${name}`);
  
  const model = await getAgentBuilderModel();
  
  // Extract model information for database operations
  const modelInfo = availableModels.map(m => `${m.name}: ${m.fields?.map((f: any) => `${f.name}:${f.type}`).join(', ')}`).join('\n');
  
  // Extract external API information
  const externalApiInfo = externalApis?.map(api => `${api.provider} (${api.connectionType}): ${api.description}`).join('\n') || 'None';
  
  const systemPrompt = `You are a senior software architect writing a detailed technical specification for implementing a business action. This spec will be used directly by AI to generate executable code, so it must be technically precise and implementable.

CONTEXT:
- Action Name: ${name}
- Business Context: ${businessContext}
- Available Database Models: ${modelInfo || 'None specified'}
- External APIs: ${externalApiInfo}
${prismaSchema ? `
COMPLETE PRISMA SCHEMA:
${prismaSchema}

Use this exact schema for all database operations. Reference the actual model names, field names, and relationships shown above.
` : ''}

CRITICAL REQUIREMENTS:

1. **SEQUENTIAL STEP-BY-STEP IMPLEMENTATION**: Break down the action into specific, sequential steps
   - Each step should have actual TypeScript/JavaScript code patterns
   - Show exact data flow between steps (Step 1 output → Step 2 input)
   - Include specific Prisma queries for each database operation
   - Show actual API call patterns with request/response handling

2. **PRISMA SCHEMA INTEGRATION**: Use the provided Prisma schema exactly
   - Reference actual model names and field names from the schema
   - Use correct Prisma query syntax (findMany, create, update, etc.)
   - Respect field types, relationships, and constraints from the schema
   - Include proper error handling for database operations

3. **BATCH-FIRST ARCHITECTURE**: Design for batch processing and automation
   - Process collections of items, not individual records
   - Use filtering and scanning approaches instead of manual selection
   - Design for scalability (handle 1 to 1000+ items)
   - Include batch size limits and pagination strategies

4. **PARAMETER CHAINING SUPPORT**: Design outputs that can feed into other actions
   - Specify exact output data structures with descriptive field names
   - Include IDs, status indicators, and processed data objects
   - Design for workflow automation and action chaining

5. **REAL-WORLD IMPLEMENTATION PATTERNS**: Include production-ready patterns
   - Exponential backoff for API retries
   - Proper error handling and logging
   - Input validation and sanitization
   - Transaction management for data consistency

TECHNICAL SPECIFICATION STRUCTURE:

You must provide:

1. **availablePrismaSchema**: Copy the exact Prisma schema provided above
2. **sequentialSteps**: Array of implementation steps, each containing:
   - stepNumber: Sequential number (1, 2, 3...)
   - stepTitle: Brief title ("Query customers", "Sync to external API", etc.)
   - description: Detailed explanation of what this step does
   - codePattern: Actual TypeScript code that implements this step
   - inputFromPreviousStep: What data comes from the previous step
   - outputToNextStep: What data this step produces for the next step
   - databaseOperations: Array of specific Prisma queries used
   - apiCalls: Array of external API calls made (if any)
   - errorHandling: Specific error handling for this step

3. **inputParameters**: Exact TypeScript interface for action inputs
4. **outputParameters**: Exact TypeScript interface for action outputs
5. **environmentVariables**: List of required environment variables
6. **codeDependencies**: Required imports and libraries
7. **implementationApproach**: High-level technical approach
8. **performanceConsiderations**: Optimization strategies
9. **globalErrorHandling**: Overall error handling strategy

EXAMPLE SEQUENTIAL STEP:
{
  "stepNumber": 1,
  "stepTitle": "Query and Filter Customers",
  "description": "Query customers from database using date range and segment filters, implementing pagination for large datasets",
  "codePattern": "const customers = await prisma.customer.findMany({ where: { updatedAt: { gte: parameters.dateFrom, lte: parameters.dateTo }, segment: { in: parameters.customerSegments } }, take: parameters.batchSize || 50 });",
  "inputFromPreviousStep": "None (first step)",
  "outputToNextStep": "customers: Customer[] - Array of customer objects matching filter criteria",
  "databaseOperations": ["prisma.customer.findMany with date and segment filters"],
  "apiCalls": [],
  "errorHandling": "Catch Prisma errors and validate that at least one customer matches criteria"
}

Make this specification so detailed that AI can generate production-ready code directly from it without any ambiguity.`;

  const result = await generateObject({
    model,
    schema: TechnicalSpecificationSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate a comprehensive technical specification for implementing "${name}".

Description: ${description}

REQUIREMENTS:
1. **Include the complete Prisma schema** in availablePrismaSchema field
2. **Break down into sequential steps** with actual TypeScript code patterns
3. **Use exact model/field names** from the Prisma schema provided
4. **Show data flow** between steps (what each step receives and produces)
5. **Include specific Prisma queries** for each database operation
6. **Design for batch processing** with filtering and pagination
7. **Include proper error handling** for each step
8. **Specify exact input/output parameters** with TypeScript types

Focus on creating a step-by-step implementation guide that includes:
- Sequential implementation steps with actual code patterns
- Specific database operations using the provided Prisma schema
- Exact API integration patterns if external APIs are involved
- Detailed error handling and retry logic for each step
- Batch processing architecture for scalability
- Complete TypeScript interfaces for all data structures
- Production-ready implementation patterns

Make this specification so detailed that AI can generate production-ready code directly from each sequential step without any ambiguity or additional research.`
      }
    ],
    temperature: 0.2,
    maxTokens: 2000
  });

  console.log(`✅ Generated technical specification for: ${name}`);
  return result.object;
}

/**
 * Shared schema for code generation - extracted from /api/agent/generate-code
 */
export const CodeGenerationSchema = z.object({
  code: z.string().describe('Complete JavaScript code that can be executed with new Function()'),
  envVars: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    sensitive: z.boolean().default(false)
  })).describe('Environment variables needed for the code'),
  inputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
    defaultValue: z.any().optional()
  })).describe('Input parameters required before execution'),
  outputParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })).describe('Expected output parameters'),
  estimatedExecutionTime: z.string().describe('Estimated execution time'),
  testData: z.object({
    input: z.record(z.any()).optional().default({}),
    expectedOutput: z.record(z.any()).optional().default({})
  }).describe('Test data for validation')
});

/**
 * Enhanced Input Parameter Validation Schema
 */
export const InputValidationSchema = z.object({
  parameterName: z.string(),
  parameterType: z.string(),
  isRequired: z.boolean(),
  isArray: z.boolean(),
  enumValues: z.array(z.string()).optional(),
  defaultValue: z.any().optional(),
  validationRules: z.string().optional()
});

/**
 * Extract enum information from Prisma schema
 */
export function extractEnumInformation(prismaSchema: string): Record<string, string[]> {
  if (!prismaSchema) return {};
  
  const enumInfo: Record<string, string[]> = {};
  
  // Match enum definitions in Prisma schema
  const enumMatches = prismaSchema.match(/enum\s+(\w+)\s*\{([^}]+)\}/g);
  
  if (enumMatches) {
    enumMatches.forEach(enumMatch => {
      const nameMatch = enumMatch.match(/enum\s+(\w+)\s*\{/);
      if (nameMatch) {
        const enumName = nameMatch[1];
        const valuesMatch = enumMatch.match(/\{([^}]+)\}/);
        if (valuesMatch) {
          const values = valuesMatch[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//') && !line.startsWith('/*'))
            .map(line => line.split('//')[0].trim()) // Remove inline comments
            .filter(line => line);
          
          enumInfo[enumName] = values;
        }
      }
    });
  }
  
  return enumInfo;
}

/**
 * Extract field information from Prisma schema for validation
 */
export function extractFieldInformation(prismaSchema: string): Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> {
  if (!prismaSchema) return {};
  
  const fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> = {};
  const enumInfo = extractEnumInformation(prismaSchema);
  
  // Match model definitions
  const modelMatches = prismaSchema.match(/model\s+(\w+)\s*\{([^}]+)\}/g);
  
  if (modelMatches) {
    modelMatches.forEach(modelMatch => {
      const nameMatch = modelMatch.match(/model\s+(\w+)\s*\{/);
      if (nameMatch) {
        const modelName = nameMatch[1];
        fieldInfo[modelName] = {};
        
        const fieldsMatch = modelMatch.match(/\{([^}]+)\}/);
        if (fieldsMatch) {
          const fieldLines = fieldsMatch[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'));
          
          fieldLines.forEach(line => {
            const fieldMatch = line.match(/^(\w+)\s+(\w+)(\?)?(\[\])?/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const fieldType = fieldMatch[2];
              const isEnum = enumInfo.hasOwnProperty(fieldType);
              
              fieldInfo[modelName][fieldName] = {
                type: fieldType,
                isEnum,
                enumValues: isEnum ? enumInfo[fieldType] : undefined
              };
            }
          });
        }
      }
    });
  }
  
  return fieldInfo;
}

/**
 * Generate input parameter validation code
 */
export function generateInputValidationCode(
  inputParameters: any[], 
  prismaSchema?: string
): string {
  if (!inputParameters || inputParameters.length === 0) {
    return `
    // No input parameters to validate
    `;
  }
  
  const fieldInfo = extractFieldInformation(prismaSchema || '');
  
  const validationCode = `
    // 🚨 CRITICAL: Input Parameter Validation
    // Validate all required parameters and handle empty/invalid values
    
    const validateInputParameters = (params) => {
      const errors = [];
      
      ${inputParameters.map(param => {
        const isRequired = param.required;
        const isArray = param.list || param.type?.includes('[]');
        const paramName = param.name;
        
        let validationLogic = '';
        
        if (isRequired) {
          validationLogic += `
      // Validate required parameter: ${paramName}
      if (!params.${paramName} || params.${paramName} === '' || params.${paramName} === null || params.${paramName} === undefined) {
        errors.push('Required parameter "${paramName}" is missing or empty');
      }`;
        }
        
        if (isArray) {
          validationLogic += `
      // Validate array parameter: ${paramName}
      if (params.${paramName} && !Array.isArray(params.${paramName})) {
        errors.push('Parameter "${paramName}" must be an array');
      }
      if (params.${paramName} && Array.isArray(params.${paramName}) && params.${paramName}.length === 0 && ${isRequired}) {
        errors.push('Required array parameter "${paramName}" cannot be empty');
      }`;
        }
        
        // Add enum validation if we can detect enum fields
        const enumValidation = generateEnumValidation(paramName, param, fieldInfo);
        if (enumValidation) {
          validationLogic += enumValidation;
        } else if (param.kind === 'enum' || param.type?.endsWith('Status') || param.type?.endsWith('Enum')) {
          // This is an enum field but we couldn't find validation - add a warning
          validationLogic += `
      // WARNING: ${paramName} appears to be an enum field but no validation rules found
      // This suggests the enum information wasn't properly extracted from the schema
      console.warn('⚠️ Enum field ${paramName} (type: ${param.type}) detected but no validation rules available');`;
        }
        
        return validationLogic;
      }).join('')}
      
      return errors;
    };
    
    const validationErrors = validateInputParameters(parameters);
    if (validationErrors.length > 0) {
      return { 
        success: false, 
        data: null, 
        message: 'Input validation failed: ' + validationErrors.join(', '), 
        executionTime: Date.now() - startTime 
      };
    }
  `;
  
  return validationCode;
}

/**
 * Generate enum validation for a specific parameter
 */
function generateEnumValidation(
  paramName: string, 
  param: any, 
  fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>>
): string {
  // Try to find enum information for this parameter
  for (const modelName in fieldInfo) {
    const modelFields = fieldInfo[modelName];
    if (modelFields[paramName] && modelFields[paramName].isEnum) {
      const enumValues = modelFields[paramName].enumValues || [];
      return `
      // Validate enum parameter: ${paramName} (type: ${modelFields[paramName].type})
      const validEnumValues = ['${enumValues.join("', '")}'];
      const paramValue = params.${paramName};
      
      // Try exact match first, then case-insensitive match
      const exactMatch = validEnumValues.includes(paramValue);
      const caseInsensitiveMatch = validEnumValues.find(val => val.toLowerCase() === paramValue?.toLowerCase());
      
      if (paramValue && !exactMatch) {
        if (caseInsensitiveMatch) {
          // Fix case automatically
          console.log(\`🔄 Auto-correcting enum case: "\${paramValue}" -> "\${caseInsensitiveMatch}"\`);
          params.${paramName} = caseInsensitiveMatch;
        } else {
          errors.push('Parameter "${paramName}" must be one of: ${enumValues.join(', ')} (received: "' + paramValue + '")');
        }
      }`;
    }
  }
  
      // Also check if the parameter type itself is an enum (for cases where field mapping doesn't work)
  if (param.type && param.kind === 'enum') {
    // For fallback validation, we should rely on the main validation above
    console.warn(`⚠️ Fallback enum validation for ${paramName} - the main enum validation should have handled this`);
    return '';
  }
  
  return '';
}

/**
 * Generate safe Prisma query patterns with proper type checking
 */
export function generateSafePrismaQuery(
  modelName: string,
  operation: string,
  whereConditions: string[],
  inputParameters: any[]
): string {
  const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  
  const safeWhereConditions = whereConditions.map(condition => {
    // Find the parameter being used in this condition
    const paramMatch = condition.match(/parameters\.(\w+)/);
    if (paramMatch) {
      const paramName = paramMatch[1];
      const param = inputParameters.find(p => p.name === paramName);
      
      if (param && (param.list || param.type?.includes('[]'))) {
        // Array parameter - use 'in' operator
        return condition.replace(/parameters\.\w+/, `{ in: parameters.${paramName} }`);
      } else {
        // Single value parameter - direct comparison
        return condition;
      }
    }
    return condition;
  }).join(',\n        ');
  
  return `
    // Safe Prisma query with type checking
    const ${modelNameLower}Query = await prisma.${modelNameLower}.${operation}({
      where: {
        ${safeWhereConditions}
      }
    });`;
}

/**
 * Generate pseudo steps - extracted from /api/agent/generate-steps
 * Now supports technical specification as input for better step generation
 */
export async function generateActionPseudoSteps(
  name: string,
  description: string,
  availableModels: any[],
  entityType: string = 'action',
  businessContext?: string,
  technicalSpec?: TechnicalSpecification
): Promise<any[]> {
  console.log(`🧩 Generating pseudo steps for ${entityType}: ${name}`);

  // Validate required fields
  if (!name || !description || !entityType) {
    throw new Error('Missing required fields: name, description, entityType');
  }

  // If we have a technical specification, use it to enhance the description
  let enhancedDescription = description;
  if (technicalSpec) {
    enhancedDescription = `${description}

TECHNICAL SPECIFICATION:
${technicalSpec.implementationApproach}

AVAILABLE PRISMA SCHEMA:
${technicalSpec.availablePrismaSchema}

SEQUENTIAL IMPLEMENTATION STEPS:
${technicalSpec.sequentialSteps.map(step => `
Step ${step.stepNumber}: ${step.stepTitle}
${step.description}
Code Pattern: ${step.codePattern}
${step.databaseOperations ? `Database Operations: ${step.databaseOperations.join(', ')}` : ''}
${step.apiCalls ? `API Calls: ${step.apiCalls.join(', ')}` : ''}
`).join('\n')}

INPUT PARAMETERS:
${technicalSpec.inputParameters.map(p => `${p.name}: ${p.type} (${p.required ? 'required' : 'optional'}) - ${p.description}`).join('\n')}

OUTPUT PARAMETERS:
${technicalSpec.outputParameters.map(p => `${p.name}: ${p.type} - ${p.description}`).join('\n')}

GLOBAL ERROR HANDLING:
${technicalSpec.globalErrorHandling}

This technical specification should guide the pseudo step generation to ensure implementable, detailed steps.`;
  }

  // Generate pseudo steps using AI (removed type parameter since we removed action types)
  const pseudoSteps = await generatePseudoSteps(
    name,
    enhancedDescription,
    availableModels || [],
    entityType as 'action' | 'schedule',
    businessContext
  );

  return pseudoSteps;
}

/**
 * Generate UI components - extracted from /api/agent/generate-ui-components
 */
export async function generateActionUIComponents(
  name: string,
  description: string,
  pseudoSteps: any[],
  availableModels: any[],
  businessContext?: string
): Promise<any[]> {
  console.log(`🎨 Generating UI components for action: ${name}`);

  // Validate required fields
  if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
    throw new Error('Missing required fields: name, description, pseudoSteps');
  }

  // Generate UI components using AI
  const uiComponents = await generateUIComponents(
    name,
    description,
    pseudoSteps,
    availableModels || [],
    businessContext
  );

  return uiComponents;
}

/**
 * Generate executable code - extracted from /api/agent/generate-code
 * Now uses technical specification as primary source for code generation
 */
export async function generateActionExecutableCode(
  name: string,
  description: string,
  pseudoSteps: any[],
  availableModels: any[],
  entityType: string = 'general',
  businessContext?: string,
  inputParameters?: any[],
  enhancedAnalysis?: any,
  testResults?: any,
  prismaSchema?: string,
  technicalSpec?: TechnicalSpecification
): Promise<{
  code: string;
  envVars: any[];
  inputParameters: any[];
  outputParameters: any[];
  estimatedExecutionTime: string;
  testData: any;
}> {
  console.log(`🔨 Generating executable code for ${entityType}: ${name}`);

  // Validate required fields
  if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
    throw new Error('Missing required fields: name, description, pseudoSteps');
  }

  const model = await getAgentBuilderModel();

  // Extract input parameters from first step if not provided
  const extractedInputParams = inputParameters || (
    pseudoSteps.length > 0 && pseudoSteps[0].inputFields ? 
    pseudoSteps[0].inputFields
      .filter((field: any) => field.name && field.name.trim() !== '')
      .map((field: any) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description || `Input parameter for ${field.name}`,
        kind: field.kind || 'scalar', // Preserve the original kind from pseudo step generation
        relationModel: field.relationModel
      })) : []
  );

  // Generate input validation code if we have input parameters and Prisma schema
  const inputValidationCode = generateInputValidationCode(extractedInputParams, prismaSchema);
  
  // Extract field information for enhanced validation
  const fieldInfo = extractFieldInformation(prismaSchema || '');
  const enumInfo = extractEnumInformation(prismaSchema || '');
  
  console.log('🔍 DEBUG: Enum extraction results:', {
    enumInfoKeys: Object.keys(enumInfo),
    enumInfoValues: enumInfo,
    fieldInfoKeys: Object.keys(fieldInfo),
    schemaLength: prismaSchema?.length || 0,
    schemaSnippet: prismaSchema?.substring(0, 200) + '...' || 'No schema'
  });
  
  // Additional debug: Check if schema contains enum definitions
  if (prismaSchema) {
    const enumMatches = prismaSchema.match(/enum\s+(\w+)\s*\{([^}]+)\}/g);
    console.log('🔍 DEBUG: Raw enum matches found:', enumMatches?.length || 0);
    if (enumMatches) {
      enumMatches.forEach((match, index) => {
        console.log(`🔍 DEBUG: Enum ${index + 1}:`, match.substring(0, 100));
      });
    }
  }
  
  // Generate executable code based on technical specification and pseudo steps
  const systemPrompt = `You are a senior JavaScript developer generating executable code for ${entityType} operations.

TASK: Generate complete, executable JavaScript code based on the technical specification and pseudo steps.

🚨 CRITICAL ERROR PREVENTION: The user has reported that AI keeps generating hardcoded enum values that don't match the actual schema, causing validation errors like "Parameter 'status' must be one of: Planned, Active, Completed" when the actual schema has different enum values.

${Object.keys(enumInfo).length > 0 ? `
🎯 ACTUAL ENUM INFORMATION FROM THE PROVIDED PRISMA SCHEMA:
${Object.entries(enumInfo).map(([enumName, values]) => `- ${enumName}: [${values.join(', ')}]`).join('\n')}

🚨 ABSOLUTELY CRITICAL ENUM RULES - NO EXCEPTIONS:
1. NEVER pass empty strings ("") to enum fields
2. NEVER invent enum values - use ONLY the exact values listed above
3. NEVER hardcode enum arrays like ['Draft', 'Active', 'Completed'] - extract from the schema above
4. NEVER generate validation for enum values not in the schema above
5. For each enum field, find its type in the FIELD TYPE INFORMATION section below
6. Use the exact enum values from the matching enum in the list above
7. Example: If field type is "ContentStatus", find ContentStatus in the enum list above and use those exact values

🚨 ENUM VALIDATION GENERATION PATTERN:
For each enum field, follow this exact pattern:
1. Find the field in FIELD TYPE INFORMATION section
2. Identify its enum type (e.g., "ContentStatus")  
3. Find that enum in ACTUAL ENUM INFORMATION section above
4. Use those EXACT values in validation - no substitutions, no hardcoding

EXAMPLE OF CORRECT ENUM USAGE:
If the schema shows:
- ContentStatus: [Draft, Published, Archived]
- TaskStatus: [NotStarted, InProgress, Completed]

Then your validation MUST use:
✅ CORRECT: ['Draft', 'Published', 'Archived'] for ContentStatus fields
✅ CORRECT: ['NotStarted', 'InProgress', 'Completed'] for TaskStatus fields

❌ WRONG: ['Planned', 'Active', 'Completed', 'OnHold', 'Cancelled'] (invented values)
❌ WRONG: ['Draft', 'Active', 'Completed'] (generic hardcoded values)

🚨 CRITICAL: If you generate enum validation with values not in the schema above, you will cause validation failures!
` : `
🚨 NO ENUM INFORMATION PROVIDED - CRITICAL WARNING:
No enum information was extracted from the schema. This is unusual and suggests a problem.
ABSOLUTELY FORBIDDEN ACTIONS:
1. ❌ Do NOT generate any enum validation code with hardcoded values
2. ❌ Do NOT invent enum values like ['Draft', 'Active', 'Completed']
3. ❌ Do NOT assume what enum values should be
4. ❌ Do NOT create validation arrays for status, priority, or any enum-like fields

REQUIRED ACTIONS:
1. ✅ Treat all fields as regular string fields
2. ✅ Skip enum validation entirely
3. ✅ Let the database handle enum validation
4. ✅ Add logging to indicate missing enum information
`}

${Object.keys(fieldInfo).length > 0 ? `
FIELD TYPE INFORMATION FROM PRISMA SCHEMA:
${Object.entries(fieldInfo).map(([modelName, fields]) => `
Model ${modelName}:
${Object.entries(fields).map(([fieldName, info]) => `  - ${fieldName}: ${info.type}${info.isEnum ? ` (enum: ${info.enumValues?.join(', ')})` : ''}`).join('\n')}
`).join('')}
` : ''}

INPUT PARAMETER VALIDATION CODE (MUST BE INCLUDED):
${inputValidationCode}

🚨 CRITICAL TYPE CONVERSION REQUIREMENTS:
All form inputs come as strings from the UI. You MUST convert them to proper types before database operations:

**COMMON TYPE CONVERSIONS NEEDED:**
- \`take\` parameter: MUST be converted to integer: \`parseInt(parameters.batchSize || '50', 10)\`
- \`skip\` parameter: MUST be converted to integer: \`parseInt(parameters.page || '0', 10) * parseInt(parameters.batchSize || '50', 10)\`
- Number parameters: Use \`parseInt()\` for integers, \`parseFloat()\` for decimals
- Date parameters: Use \`new Date(parameters.dateField)\` for date strings
- Boolean parameters: Use \`parameters.boolField === 'true'\` for boolean strings

**EXAMPLE OF CORRECT TYPE CONVERSION:**
\`\`\`javascript
// ❌ WRONG: This causes "Expected Int, provided String" errors
const records = await prisma.model.findMany({
  take: parameters.batchSize,  // String value like "50"
  skip: parameters.page * parameters.batchSize  // String multiplication
});

// ✅ CORRECT: Convert strings to proper types
const batchSize = parseInt(parameters.batchSize || '50', 10);
const page = parseInt(parameters.page || '0', 10);
const records = await prisma.model.findMany({
  take: batchSize,  // Integer value like 50
  skip: page * batchSize  // Proper integer arithmetic
});
\`\`\`

**MANDATORY TYPE CONVERSION PATTERN:**
Always add this type conversion block after input validation:
\`\`\`javascript
// 🔄 Type Conversion: Convert string inputs to proper types
const convertedParams = {
  ...parameters,
  // Convert numeric parameters
  batchSize: parameters.batchSize ? parseInt(parameters.batchSize, 10) : 50,
  page: parameters.page ? parseInt(parameters.page, 10) : 0,
  performanceScore: parameters.performanceScore ? parseFloat(parameters.performanceScore) : 0,
  // Convert date parameters
  startDate: parameters.startDate ? new Date(parameters.startDate) : new Date(),
  endDate: parameters.endDate ? new Date(parameters.endDate) : new Date(),
  // Convert boolean parameters
  isActive: parameters.isActive === 'true'
};
\`\`\`

Then use \`convertedParams\` instead of \`parameters\` in your database operations.

${technicalSpec ? `🎯 TECHNICAL SPECIFICATION (PRIMARY SOURCE):

Implementation Approach:
${technicalSpec.implementationApproach}

Available Prisma Schema:
${technicalSpec.availablePrismaSchema}

Sequential Implementation Steps:
${technicalSpec.sequentialSteps.map(step => `
Step ${step.stepNumber}: ${step.stepTitle}
${step.description}
Code: ${step.codePattern}
${step.databaseOperations ? `DB Ops: ${step.databaseOperations.join(', ')}` : ''}
${step.apiCalls ? `API Calls: ${step.apiCalls.join(', ')}` : ''}
`).join('\n')}

Input Parameters:
${technicalSpec.inputParameters.map(p => `${p.name}: ${p.type} - ${p.description}`).join('\n')}

Output Parameters:
${technicalSpec.outputParameters.map(p => `${p.name}: ${p.type} - ${p.description}`).join('\n')}

Global Error Handling:
${technicalSpec.globalErrorHandling}

Code Dependencies:
${technicalSpec.codeDependencies}

Performance Considerations:
${technicalSpec.performanceConsiderations}

Environment Variables Needed:
${technicalSpec.environmentVariables.join(', ')}

🚨 CRITICAL: Use this technical specification as your PRIMARY implementation guide. The sequential steps contain the exact code patterns to implement. The pseudo steps below are secondary and should align with this specification.

SEQUENTIAL IMPLEMENTATION STEPS TO FOLLOW:
${technicalSpec.sequentialSteps.map(step => `
=== STEP ${step.stepNumber}: ${step.stepTitle} ===
Description: ${step.description}
Input: ${step.inputFromPreviousStep || 'None (first step)'}
Output: ${step.outputToNextStep || 'Final result'}

EXACT CODE PATTERN TO IMPLEMENT:
${step.codePattern}

${step.databaseOperations && step.databaseOperations.length > 0 ? `Database Operations: ${step.databaseOperations.join(', ')}` : ''}
${step.apiCalls && step.apiCalls.length > 0 ? `API Calls: ${step.apiCalls.join(', ')}` : ''}
${step.errorHandling ? `Error Handling: ${step.errorHandling}` : ''}
`).join('\n')}
` : ''}

CONTEXT:
- Name: ${name}
- Description: ${description}
- Entity Type: ${entityType}
- Business Context: ${businessContext || 'General business operations'}
- Available Models: ${JSON.stringify(availableModels?.map((m: any) => ({ name: m.name, fields: m.fields?.map((f: any) => ({ name: f.name, type: f.type })) })) || [])}

${prismaSchema ? `FULL PRISMA SCHEMA:
The complete Prisma schema with all relationships, constraints, and field attributes:

\`\`\`prisma
${prismaSchema}
\`\`\`

Use this schema to understand:
- Exact field names and types for each model
- Database relationships and foreign keys
- Required vs optional fields
- Default values and constraints
- Available enum values
- Primary keys and unique constraints

CRITICAL: Use the Prisma schema as the authoritative source for all database operations.
` : ''}

${enhancedAnalysis ? `ENHANCED ANALYSIS (VALIDATED):
✅ This action has been fully analyzed and tested with real scenarios
✅ Test scenarios executed: ${enhancedAnalysis.analysis?.testScenarios?.length || 0}
✅ Database operations validated: ${enhancedAnalysis.analysis?.analysis?.databaseOperations?.tablesToUpdate?.length || 0} tables
✅ External APIs validated: ${enhancedAnalysis.analysis?.analysis?.externalAPIs?.length || 0} APIs
✅ All business logic has been validated with actual data
` : ''}

${testResults ? `REAL TEST EXECUTION RESULTS:
✅ Successfully executed ${testResults.stepResults?.length || 0} steps
✅ Total execution time: ${testResults.executionTime || 0}ms
✅ All steps completed successfully
✅ Business validations passed
✅ Generate production-ready code based on these validated results
` : ''}

PSEUDO STEPS TO IMPLEMENT:
${pseudoSteps.map((step: any, index: number) => `
STEP ${index + 1}: ${step.description}
- Type: ${step.type}
${step.model ? `- Database Model: ${step.model} (use db.${step.model.charAt(0).toLowerCase() + step.model.slice(1)}.method())` : ''}
- Input Fields: ${step.inputFields?.map((f: any) => `${f.name} (${f.type}${f.required ? ', required' : ', optional'})`).join(', ') || 'None'}
- Output Fields: ${step.outputFields?.map((f: any) => `${f.name} (${f.type}${f.required ? ', required' : ', optional'})`).join(', ') || 'None'}
- Step Implementation: Based on type "${step.type}", implement the appropriate operation
${index === 0 ? `- Access inputs as: ${extractedInputParams.map((p: any) => `parameters.${p.name}`).join(', ')} (action's main input parameters)` : step.inputFields?.length > 0 ? `- Access inputs from previous steps: ${step.inputFields.map((f: any) => `${f.name}`).join(', ')}` : ''}
${step.outputFields?.length > 0 ? `- Must produce: ${step.outputFields.map((f: any) => `${f.name}`).join(', ')}` : ''}
`).join('\n')}

DETAILED STEP BREAKDOWN:
${JSON.stringify(pseudoSteps, null, 2)}

REQUIRED INPUT PARAMETERS (from first step):
${JSON.stringify(extractedInputParams, null, 2)}

BEFORE YOU START - SCHEMA FIELD VERIFICATION:
${prismaSchema ? `
Review the Prisma schema above and list the exact fields available for each model:

⚠️ WARNING: If you reference ANY field not listed above, the code will fail at runtime!
` : ''}

CODE GENERATION REQUIREMENTS:

1. EXECUTION CONTEXT:
   The code will be executed directly as an async function with access to global variables:
   
   - prisma: Database operations (prisma.modelName.find(), prisma.modelName.create(), etc.)
   - generateObject: AI operations function (available globally)
   - aiModel: AI model instance (available globally)  
   - parameters: User-provided input parameters (MUST include all parameters from the first step)
   - process.env: Environment variables for external APIs ONLY (do not include NODE_ENV, PORT, or other system variables)

2. INPUT PARAMETER STRUCTURE:
   CRITICAL: Step 1 uses the action's main input parameters, NOT separate step input fields.
   Access the action's input parameters directly as: parameters.parameterName
   
   Example: If the action has input parameters { scheduledDate, userId, reportType }
   Then Step 1 accesses them as: parameters.scheduledDate, parameters.userId, parameters.reportType
   Step 1's inputFields in the pseudo steps are for reference only - use the actual action inputs!

3. INPUT PARAMETER HANDLING:
   ${extractedInputParams.length > 0 ? `
   The code should expect these input parameters from step 1:
   ${extractedInputParams.map((param: any) => `
   - parameters.${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}
     ${param.kind === 'object' ? `This is a database relation ID for ${param.relationModel} model` : ''}
     ${param.list ? `⚠️ This is an ARRAY parameter - use { in: parameters.${param.name} } for Prisma queries` : `⚠️ This is a SINGLE VALUE parameter - use direct comparison parameters.${param.name} for Prisma queries`}
   `).join('')}
   
   🚨 CRITICAL: Always validate required input parameters before processing.
   🚨 CRITICAL: Check if parameters are arrays vs single values before using in Prisma queries.
   🚨 CRITICAL: Convert string parameters to proper types (numbers, dates, etc.) before database operations.
   ` : 'Parameters will be provided as defined in the first pseudo step.'}

4. CODE STRUCTURE - STEP-BY-STEP IMPLEMENTATION:
   Each pseudo step should be implemented as a distinct code block that:
   - Uses the exact inputFields defined in the step to access data
   - Produces the exact outputFields defined in the step
   - Implements the step type (Database find many, AI analysis, etc.)
   - Passes outputFields from step N as inputFields to step N+1
   
   STEP-BY-STEP CODE PATTERN:
   For each step, implement it as a separate code section with comments:
   // Step 1: [Step Description]
   // Input: [list of input field names]
   // Output: [list of output field names]
   // Implementation based on step type
   
   CRITICAL: Follow the exact data flow defined in pseudo steps:
   - Only use inputFields that are defined for each step
   - Produce all outputFields that are defined for each step
   - Use step outputs as inputs for subsequent steps
   - Each step's outputs become available for subsequent steps
   
   DATA FLOW IMPLEMENTATION:
   - Step 1 inputs MUST BE the action's main input parameters (parameters.parameterName)
   - Step 1 should not define separate input fields - it uses the action's input directly
   - Step 2+ inputs come from previous step outputs
   - Store each step's outputs in variables for use by subsequent steps
   - Example: Step 1 uses parameters.userId, Step 1 outputs "customerData", Step 2 uses customerData
   
   STEP VARIABLE NAMING PATTERN:
   - Step 1 outputs: step1_outputFieldName (e.g., step1_customerData)
   - Step 2 outputs: step2_outputFieldName (e.g., step2_analysisResult)
   - This ensures clear data flow tracking between steps

5. DATABASE OPERATIONS:
   🚨 CRITICAL: Each database step includes a "model" field that specifies which model to use!
   
   For database operations, use prisma directly (available as global):
   - prisma.modelName.findMany({ where: filter, take: limit }) - find multiple records
   - prisma.modelName.findUnique({ where: uniqueFilter }) - find single record  
   - prisma.modelName.create({ data: recordData }) - create new record
   - prisma.modelName.createMany({ data: recordsArray }) - create multiple records
   - prisma.modelName.update({ where: uniqueFilter, data: updateData }) - update existing record
   - prisma.modelName.updateMany({ where: filter, data: updateData }) - update multiple records
   - prisma.modelName.delete({ where: uniqueFilter }) - delete record
   - prisma.modelName.deleteMany({ where: filter }) - delete multiple records
   
   STEP TYPE TO DATABASE OPERATION MAPPING:
   For each database step, use the model field to determine the correct Prisma client method:
   - "Database find unique" with model "User" → prisma.user.findUnique({ where: { id: recordId } })
   - "Database find many" with model "Order" → prisma.order.findMany({ where: filter, include: relations })
   - "Database create" with model "Product" → prisma.product.create({ data: newData })
   - "Database create many" with model "Item" → prisma.item.createMany({ data: recordsArray })
   - "Database update unique" with model "User" → prisma.user.update({ where: { id: recordId }, data: updateData })
   - "Database update many" with model "Order" → prisma.order.updateMany({ where: filter, data: updateData })
   - "Database delete unique" with model "Product" → prisma.product.delete({ where: { id: recordId } })
   - "Database delete many" with model "Item" → prisma.item.deleteMany({ where: filter })

   IMPORTANT: 
   - Use the model field from each step to determine the correct Prisma client method
   - Convert model names to camelCase for Prisma client (e.g., "UserProfile" → db.userProfile)
   - Each step's model field tells you exactly which table/model to operate on
   
   ⚠️ CRITICAL DATABASE FIELD RULE:
   ONLY use fields that actually exist in the available models. DO NOT assume fields like 'deleted', 'createdAt', 'updatedAt', or any other fields unless they are explicitly defined in the model schema. Check the available models list to see what fields each model actually has.
   
   🚨 ABSOLUTELY FORBIDDEN FIELD ASSUMPTIONS:
   - NEVER use 'deleted' field unless it exists in the schema
   - NEVER use 'createdAt' or 'updatedAt' unless they exist in the schema  
   - NEVER use 'isActive', 'status', or other common fields unless they exist
   - ALWAYS verify field existence in the Prisma schema before using them
   - If you need to filter records, use fields that actually exist in the model
   
   🚨 CRITICAL ENUM FIELD HANDLING:
   
   When using enum fields in Prisma queries, ALWAYS validate enum values:
   
   **FOR ENUM PARAMETERS:**
   ✅ Validate enum values before using in queries:
   // CRITICAL: Extract enum values from the actual schema, don't hardcode them!
   // Use the enum information provided in the ENUM INFORMATION section above
   // Example: const validStatuses = Object.entries(enumInfo).find(([enumName]) => enumName.toLowerCase().includes('status'))?.[1] || [];
   const validStatuses = []; // REPLACE THIS with actual enum extraction from the ENUM INFORMATION above 
   const statusFilter = parameters.status && validStatuses.includes(parameters.status) 
     ? { status: parameters.status } 
     : {}; // Skip status filter if invalid
   
   const contentRecords = await prisma.contentModel.findMany({
     where: {
       ...statusFilter,
       campaignId: parameters.campaignId
     }
   });
   
   **WRONG EXAMPLES - THESE CAUSE THE EXACT ERROR REPORTED:**
   ❌ Using empty strings with enum fields:
   // This causes "Invalid value for argument status. Expected StatusEnum"
   const badRecords = await prisma.contentModel.findMany({
     where: {
       status: "", // ❌ Empty string passed to enum field
       campaignId: parameters.campaignId
     }
   });
   
   ❌ Not validating enum values:
   const unsafeRecords = await prisma.contentModel.findMany({
     where: {
       status: parameters.status, // ❌ Could be empty string or invalid value
     }
   });
   
   **CORRECT ENUM HANDLING PATTERN:**
   // Build where clause with enum validation
   const whereClause = {
     campaignId: parameters.campaignId
   };
   
   // Only add status filter if it's a valid enum value
   // CRITICAL: Use actual enum values from schema, not hardcoded values!
   // Example: const validStatusValues = Object.entries(enumInfo).find(([enumName]) => enumName.toLowerCase().includes('status'))?.[1] || [];
   const validStatusValues = []; // REPLACE THIS with actual enum extraction from the ENUM INFORMATION above
   if (parameters.status && validStatusValues.includes(parameters.status)) {
     whereClause.status = parameters.status;
   }
   
   const safeRecords = await prisma.contentModel.findMany({
     where: whereClause
   });

   🚨 CRITICAL ARRAY VS SINGLE VALUE HANDLING:
   
   When using Prisma queries, ALWAYS check if input parameters are arrays or single values:
   
   **FOR ARRAY PARAMETERS (when input is an array):**
   ✅ Use the 'in' operator for arrays:
   const topics = await prisma.topic.findMany({
     where: {
       name: { in: parameters.topicNames }  // ✅ parameters.topicNames is an array like ["AI", "Blockchain"]
     }
   });
   
   **FOR SINGLE VALUE PARAMETERS (when input is a string/number):**
   ✅ Use direct comparison for single values:
   const topic = await prisma.topic.findMany({
     where: {
       name: parameters.topicName  // ✅ parameters.topicName is a single string like "AI"
     }
   });
   
   **WRONG EXAMPLES - THESE WILL CAUSE RUNTIME ERRORS:**
   ❌ Using 'in' with single values:
   // const topics = await prisma.topic.findMany({
   //   where: { name: { in: "AI" } }  // ❌ ERROR: 'in' expects array, got string
   // });
   
   ❌ Using direct comparison with arrays:
   // const topics = await prisma.topic.findMany({
   //   where: { name: ["AI", "Blockchain"] }  // ❌ ERROR: Direct comparison expects single value
   // });
   
   **HOW TO HANDLE MIXED CASES:**
   // When input might be string or array, handle both cases:
   const whereCondition = Array.isArray(parameters.names) 
     ? { name: { in: parameters.names } }      // Array case - use 'in'
     : { name: parameters.names };             // Single value case - direct comparison
     
   const records = await prisma.model.findMany({ where: whereCondition });
   
   **REAL WORLD EXAMPLE - TOPIC FILTERING:**
   // ✅ CORRECT: Handle single topic name
   if (typeof parameters.name === 'string') {
     const topics = await prisma.topic.findMany({
       where: {
         isActive: parameters.isActive,
         name: parameters.name  // Single string comparison
       }
     });
   }
   
   // ✅ CORRECT: Handle multiple topic names
   if (Array.isArray(parameters.names)) {
     const topics = await prisma.topic.findMany({
       where: {
         isActive: parameters.isActive,
         name: { in: parameters.names }  // Array comparison with 'in'
       }
     });
   }
   
   // ❌ WRONG: This causes the exact error the user reported
   // const topics = await prisma.topic.findMany({
   //   where: {
   //     name: { in: "superman" }  // ERROR: 'in' expects array, got string
   //   }
   // });
   
   EXAMPLES OF CORRECT PRISMA USAGE:
   // Find multiple water intake records - ONLY use fields that exist in the schema
   const batchSize = parseInt(parameters.batchSize || '50', 10);
   const page = parseInt(parameters.page || '0', 10);
   const waterIntakeRecords = await prisma.waterIntake.findMany({
     where: {
       userId: parameters.userId,  // ✅ userId exists in WaterIntake model
       date: { gte: parameters.startDate, lte: parameters.endDate }  // ✅ date exists in WaterIntake model
     },
     take: batchSize,  // ✅ Converted to integer
     skip: page * batchSize,  // ✅ Proper integer arithmetic
     orderBy: { date: 'desc' }
   });
   
   // ❌ WRONG - using non-existent fields:
   // const records = await prisma.sleepPattern.findMany({
   //   where: { deleted: false }  // ❌ 'deleted' field doesn't exist in SleepPattern model
   // });
   
   // ✅ CORRECT - using only existing fields:
   const sleepPatterns = await prisma.sleepPattern.findMany({
     where: { 
       userId: parameters.userId,  // ✅ userId exists in SleepPattern model
       sleepStartTime: { gte: parameters.startDate }  // ✅ sleepStartTime exists in SleepPattern model
     }
   });
   
   // Create a new health report
   const healthReport = await prisma.healthReport.create({
     data: {
       userId: parameters.userId,
       reportDate: new Date(),
       waterIntakeSummary: analysisResult.waterIntakeSummary,
       workoutSummary: analysisResult.workoutSummary,
       sleepSummary: analysisResult.sleepSummary
     }
   });
   
   // 🚨 ID GENERATION WARNING:
   // DO NOT use cuid() - it's not available in the runtime environment
   // For auto-generated IDs, let Prisma handle it (omit the ID field) or use:
   // - crypto.randomUUID() for UUID v4
   // - Date.now().toString() + Math.random().toString(36).substr(2, 9) for simple unique strings
   
   // Update multiple workout logs
   const updatedLogs = await prisma.workoutLog.updateMany({
     where: { userId: parameters.userId, status: 'pending' },
     data: { status: 'completed', processedAt: new Date() }
   });

6. AI OPERATIONS:
   For AI analysis/decisions, use generateObject directly (available as global):
   
   // For single object results:
   const { object } = await generateObject({
     model: aiModel, // aiModel is available globally
     messages: [
       { role: 'system', content: 'You are an expert analyst...' },
       { role: 'user', content: 'Analyze this data: ' + JSON.stringify(dataToAnalyze) }
     ],
     schema: z.object({ 
       analysis: z.string().describe('Analysis results'),
       confidence: z.number().describe('Confidence score 0-100'),
       recommendations: z.array(z.string()).describe('Recommendations')
     })
   });
   
   // For array results - CRITICAL: Use output: 'array' and schema defines INDIVIDUAL ITEMS:
   const { object: arrayResult } = await generateObject({
     model: aiModel,
     output: 'array', // 🚨 REQUIRED for arrays
     messages: [
       { role: 'system', content: 'You are an expert analyst...' },
       { role: 'user', content: 'Generate multiple items: ' + JSON.stringify(dataToAnalyze) }
     ],
     schema: z.object({
       name: z.string().describe('Item name'),
       value: z.string().describe('Item value')
     }) // 🚨 Schema describes INDIVIDUAL items, NOT the array
   });
   
   // 🚨 COMMON MISTAKE - DO NOT DO THIS:
   // ❌ WRONG: schema: z.array(z.object({...})) - This will cause "Invalid schema" error
   // ✅ CORRECT: output: 'array', schema: z.object({...}) - Schema describes individual items
   
   // REAL WORLD EXAMPLE - Content Generation:
   // ✅ CORRECT way to generate multiple content ideas:
   const { object: contentIdeas } = await generateObject({
     model: aiModel,
     output: 'array', // This tells AI SDK we want an array
     messages: [
       { role: 'system', content: 'You are a content generator...' },
       { role: 'user', content: 'Generate content ideas for: ' + JSON.stringify(userPreferences) }
     ],
     schema: z.object({
       title: z.string().describe('Content title'),
       body: z.string().describe('Content body'),
       tags: z.string().optional().describe('Content tags')
     }) // Schema describes ONE content idea - AI SDK will generate an array of these
   });
   
   // ❌ WRONG way that causes "Invalid schema" error:
   // const { object: contentIdeas } = await generateObject({
   //   model: aiModel,
   //   schema: z.array(z.object({ title: z.string(), body: z.string() })) // DON'T DO THIS!
   // });

7. EXTERNAL API CALLS:
   🚨 AVOID GENERIC EXTERNAL API CALLS! 
   
   Most business logic can be handled with:
   - Database operations (prisma)
   - AI analysis (generateObject)
   - Internal calculations and transformations
   
   ONLY use external APIs if the user explicitly mentioned a specific service by name.
   
   If you must call an external API (because user specifically mentioned it):
   // Example for a SPECIFIC service like Stripe:
   const apiResponse = await fetch('https://api.stripe.com/v1/customers', {
     method: 'POST',
     headers: { 
       'Authorization': \`Bearer \${process.env.STRIPE_API_KEY}\`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(requestData)
   });
   
   // For OAuth APIs, tokens are provided through user authentication flow, not process.env
   // Use the oauth context provided by the system instead of environment variables

8. RETURN FORMAT:
   Always return: { success: boolean, data: any, message: string, executionTime: number }
   Where data contains the result of the action execution.

9. ENVIRONMENT VARIABLES:
   🚨 CRITICAL: ONLY generate environment variables if the user explicitly mentioned a specific external service!
   
   DO NOT generate generic environment variables like:
   - EMAIL_API_KEY, EMAIL_API_BASE_URL (too generic)
   - NOTIFICATION_API_KEY, NOTIFICATION_API_URL (too generic)  
   - SMS_API_KEY, PAYMENT_API_KEY (too generic)
   
   ONLY generate environment variables for SPECIFIC, NAMED services:
   - STRIPE_API_KEY (only if user mentioned Stripe specifically)
   - SENDGRID_API_KEY (only if user mentioned SendGrid specifically)
   - TWILIO_API_KEY (only if user mentioned Twilio specifically)
   - INSTAGRAM_API_KEY (only if user mentioned Instagram API specifically)
   
   🚨 DO NOT GENERATE SYSTEM-PROVIDED ENVIRONMENT VARIABLES:
   - OPENAI_API_KEY, ANTHROPIC_API_KEY, GROK_API_KEY (provided by system)
   - AI_MODEL_PROVIDER, AI_MODEL_NAME (provided by system)
   - DATABASE_URL, NEXTAUTH_SECRET, CRON_SECRET (provided by system)
   - Any AI provider configuration - these are handled by the deployment system
   
   CRITICAL ENVIRONMENT VARIABLE NAMING RULES:
   ⚠️ ABSOLUTELY NO ACTION NAMES IN ENVIRONMENT VARIABLES ⚠️
   ⚠️ ABSOLUTELY NO SYSTEM VARIABLES LIKE DATABASE_URL ⚠️
   
   - Use ONLY the API provider name as the prefix (e.g., "INSTAGRAM", "GOOGLE_SHEETS", "STRIPE")
   - NEVER EVER include the action name in environment variable names
   - NEVER generate DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, or other system variables
   - NEVER use hyphens, spaces, or special characters - only letters, numbers, and underscores
   - Environment variables must start with a letter or underscore, not a number
   
   ✅ CORRECT EXAMPLES (only if user explicitly mentioned these services):
   - "INSTAGRAM_API_KEY" (not "TRACK-PERFORMANCE-ANALYTICS_INSTAGRAM_API_KEY")
   - "GOOGLE_SHEETS_API_KEY" (not "PLAN-CONTENT-CALENDAR_GOOGLE_SHEETS_API_KEY")
   - "STRIPE_API_KEY" (not "MANAGE-PAYMENTS_STRIPE_API_KEY")
   
   ❌ WRONG EXAMPLES (DO NOT GENERATE THESE):
   - "TRACK-PERFORMANCE-ANALYTICS_INSTAGRAM_API_KEY" ← Contains action name + hyphens
   - "PLAN-CONTENT-CALENDAR_LATER_API_KEY" ← Contains action name + hyphens
   - "MANAGE-BRAND-OUTREACH_INSTAGRAM_API_BASE_URL" ← Contains action name + hyphens
   - "DATABASE_URL" ← System-provided, NEVER generate this
   - "OPENAI_API_KEY" ← System-provided, NEVER generate this
   - "ANTHROPIC_API_KEY" ← System-provided, NEVER generate this
   
   DO NOT generate environment variables for OAuth-based APIs:
   - OAuth APIs (Gmail, Slack, Shopify, Facebook, LinkedIn, etc.) use user authentication flow
   - OAuth tokens are provided by the system, not through environment variables
   - If an API uses OAuth, generate NO environment variables for it
   
   NEVER generate system environment variables like:
   - NODE_ENV, ENVIRONMENT, PORT, DATABASE_URL, NEXTAUTH_SECRET
   - OPENAI_API_KEY, ANTHROPIC_API_KEY, GROK_API_KEY (handled by system)
   - AI_MODEL_PROVIDER, AI_MODEL_NAME (handled by system)
   - Any internal application configuration variables
   - Any variables starting with NEXT_, VERCEL_, or other framework prefixes
   
   🚨 DEFAULT APPROACH: NO ENVIRONMENT VARIABLES
   Unless the user explicitly mentioned a specific external service by name, generate ZERO environment variables.
   Most actions can work with just the database and AI - don't assume external APIs are needed.
   
   🚨 ABSOLUTE RULE: NEVER GENERATE DATABASE_URL OR ANY SYSTEM VARIABLES
   The system automatically provides: DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, AI_MODEL_PROVIDER, AI_MODEL_NAME, NEXTAUTH_SECRET, CRON_SECRET
   NEVER EVER generate these in your envVars array. Your envVars array should be EMPTY unless the user explicitly mentioned external services.
   
   AUTHENTICATION METHOD REFERENCE:
   - OAuth APIs (no env vars needed): Gmail, Slack, Shopify, Facebook, LinkedIn, Instagram, Google Calendar, Microsoft Teams, Notion, Salesforce, HubSpot
   - System-provided APIs (no env vars needed): OpenAI, Anthropic, Grok (AI providers)
   - Third-party API Key APIs (env vars needed ONLY if specifically mentioned): Stripe, SendGrid, Twilio, specific custom APIs

9. FUNCTION SIGNATURE AND GLOBALS:
   Your generated function should NOT accept any parameters. Use these global variables directly:
   - prisma: Prisma client instance (use as prisma.modelName.method())
   - generateObject: AI utility function (available globally)
   - aiModel: AI model instance (available globally)
   - parameters: User input parameters (available globally)
   - process.env: Environment variables (available globally)
   
   CRITICAL: Use prisma directly, not through a context parameter:
   - prisma.waterIntake.findMany() 
   - prisma.healthReport.create()
   - prisma.workoutLog.updateMany()
   
   Function signature: async function actionName() { ... }
   Function return format: { success: boolean, data: any, message: string, executionTime: number }

Generate production-ready, executable JavaScript code that implements the business logic described in the pseudo steps and properly uses the input parameters.

🚨 FINAL VALIDATION CHECKLIST - Your code MUST pass these checks:

1. **Input Parameter Validation**: MUST include the input validation code provided above:
   - Include the validateInputParameters function at the start of your code
   - Call it before any database operations
   - Return early with error if validation fails

2. **Enum Field Validation**: For any field that uses enum types:
   - NEVER pass empty strings ("") to enum fields
   - ALWAYS validate enum values before database operations  
   - Use conditional logic to skip enum filters if values are invalid
   - Provide meaningful default values or omit the field entirely

3. **Parameter Type Validation**: For each input parameter used in Prisma queries:
   - If parameter is marked as array/list: MUST use { in: paramValue }
   - If parameter is single value: MUST use direct comparison paramValue
   - NEVER mix these up or you'll get runtime errors

4. **Prisma Query Structure**: Every database query must:
   - Use only fields that exist in the model schema
   - Use correct array vs single value syntax
   - Handle nullable fields appropriately
   - Build where clauses conditionally to avoid empty/invalid values

5. **Error Prevention**: Your code should:
   - Validate input parameters before using them
   - Handle edge cases (empty arrays, null values, empty strings, etc.)
   - Use defensive programming practices
   - Build database queries conditionally based on parameter validity

CRITICAL: The user has reported these exact errors that your code MUST prevent:
1. "Invalid value for argument status. Expected StatusEnum" - caused by empty strings in enum fields
2. "Argument \`take\`: Invalid value provided. Expected Int, provided String" - caused by string values in numeric fields

Your generated code MUST:
- Validate enum values before using them in Prisma queries
- Convert string parameters to proper types (integers, dates, booleans) before database operations
- Use parseInt() for take/skip parameters and parseFloat() for numeric comparisons`;

  const result = await generateObject({
    model,
    schema: CodeGenerationSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate executable JavaScript code for: ${name}

Pseudo Steps:
${pseudoSteps.map((step: any, index: number) => 
  `Step ${index + 1}: ${step.description}
  - Type: ${step.type}
  - Inputs: ${step.inputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}
  - Outputs: ${step.outputFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || 'None'}`
).join('\n\n')}

${extractedInputParams.length > 0 ? `
Input Parameters Required:
${extractedInputParams.map((param: any) => `- ${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}`).join('\n')}
` : ''}

Generate complete, executable code that implements each pseudo step as a distinct code block:

IMPLEMENTATION REQUIREMENTS:
1. For each pseudo step, create a clearly commented code section
2. STEP 1 SPECIAL RULE: Step 1 inputs are the action's main input parameters (input.paramName)
3. STEP 2+ RULE: Use outputs from previous steps as inputs
4. Produce all the outputFields defined for each step  
5. Pass step outputs as inputs to subsequent steps using clear variable names
6. Follow the exact step type implementation (Database find many, AI analysis, etc.)
7. Handle the data flow between steps using the defined input/output structure

Generate production-ready code that follows this step-by-step pattern and handles all input parameters correctly.`
      }
    ],
    temperature: 0.2,
  });

  // Sanitize environment variable names
  const envVarSanitization = sanitizeEnvironmentVariables(result.object.envVars || []);
  
  if (envVarSanitization.invalid.length > 0) {
    console.warn(`⚠️ Action "${name}": ${envVarSanitization.invalid.length} environment variables could not be sanitized:`, envVarSanitization.invalid);
  }

  // Ensure we return the input parameters we used
  return {
    code: result.object.code,
    envVars: envVarSanitization.sanitized,
    inputParameters: extractedInputParams.length > 0 ? extractedInputParams : result.object.inputParameters,
    outputParameters: result.object.outputParameters,
    estimatedExecutionTime: result.object.estimatedExecutionTime,
    testData: result.object.testData
  };
}

/**
 * Complete action generation workflow - NEW 3-step flow: Spec → Pseudo Steps → Code
 * Uses technical specification as primary source for implementation
 */
export async function generateCompleteAction(
  actionSpec: {
    name: string;
    title?: string;
    purpose?: string;
    description?: string;
    role?: string;
    id?: string;
  },
  availableModels: any[],
  businessContext: string,
  entityType: string = 'general',
  existingActions: any[] = [],
  prismaSchema?: string,
  externalApis?: any[]
): Promise<any> {
  console.log(`🚀 Generating complete action using NEW 3-step flow: ${actionSpec.name}`);
  console.log(`📋 New Pattern: 1) Generate Technical Spec → 2) Generate Pseudo Steps → 3) Generate Code`);

  const actionName = actionSpec.name;
  const actionTitle = actionSpec.title || actionSpec.name;
  const actionDescription = actionSpec.purpose || actionSpec.description || '';

  try {
    // Step 1: Generate Technical Specification (NEW)
    console.log(`📋 Step 1/3: Generating technical specification...`);
    const technicalSpec = await generateTechnicalSpecification(
      actionName,
      actionDescription,
      businessContext,
      availableModels,
      prismaSchema,
      externalApis
    );
    
    console.log(`✅ Step 1/3 complete: Generated technical specification`);
    
    // Step 2: Generate Pseudo Steps (informed by technical spec)
    console.log(`🧩 Step 2/3: Generating pseudo steps from technical specification...`);
    const pseudoSteps = await generateActionPseudoSteps(
      actionName,
      actionDescription,
      availableModels,
      'action',
      businessContext,
      technicalSpec // Pass technical spec to inform pseudo step generation
    );
    
    console.log(`✅ Step 2/3 complete: Generated ${pseudoSteps.length} pseudo steps`);
    
    // Step 2.5: Generate UI Components (NEW - needed for ActionExecutionModal)
    console.log(`🎨 Step 2.5/3: Generating UI components for action execution...`);
    const rawUIComponents = await generateActionUIComponents(
      actionName,
      actionDescription,
      pseudoSteps,
      availableModels,
      businessContext
    );
    
    // Convert UI components to format expected by ActionExecutionModal
    const uiComponents = rawUIComponents.map((component: any, index: number) => ({
      id: component.id || `input_${index}`,
      name: component.name || component.linkedToParameter || `input_${index}`,
      type: component.type || component.inputType || 'text',
      label: component.label || component.componentName || component.purpose || 'Input',
      description: component.description || component.helpText || '',
      required: component.required || false,
      placeholder: component.placeholder || '',
      options: component.options?.map((opt: any) => ({
        value: typeof opt === 'string' ? opt : opt.value || opt,
        label: typeof opt === 'string' ? opt : opt.label || opt.value || opt
      })) || undefined,
      defaultValue: component.defaultValue || (component.type === 'checkbox' ? false : ''),
      validation: component.validation
    }));
    
    // Fallback: If no UI components or insufficient components, extract from pseudo steps
    if (uiComponents.length === 0 && pseudoSteps.length > 0 && pseudoSteps[0].inputFields) {
      console.log(`🔄 Fallback: Extracting UI components from pseudo step input fields...`);
      
      // Helper function to create fallback components with enum support
      const createFallbackComponent = (field: any, index: number, enumInfo: Record<string, string[]>) => {
        // Determine input type based on field type and name
        let inputType = 'text';
        const fieldName = field.name.toLowerCase();
        const fieldType = field.type;
        let options: any[] | undefined = undefined;
        
        if (fieldType === 'Boolean') {
          inputType = 'checkbox';
        } else if (fieldType === 'Int' || fieldType === 'Float' || fieldType === 'Decimal') {
          inputType = 'number';
        } else if (fieldType === 'DateTime' || fieldName.includes('date') || fieldName.includes('time')) {
          if (fieldName.includes('date') && fieldName.includes('time')) {
            inputType = 'datetime-local';
          } else if (fieldName.includes('date')) {
            inputType = 'date';
          } else if (fieldName.includes('time')) {
            inputType = 'time';
          } else {
            inputType = 'datetime-local'; // Default for DateTime type
          }
        } else if (fieldName.includes('email')) {
          inputType = 'email';
        } else if (fieldName.includes('url') || fieldName.includes('link')) {
          inputType = 'url';
        } else if (field.list || fieldType === 'Json' || fieldName.includes('content') || fieldName.includes('description')) {
          inputType = 'textarea';
        } else if (field.kind === 'enum' || fieldType.endsWith('Enum') || enumInfo.hasOwnProperty(fieldType)) {
          // Handle enum fields - create select dropdown
          inputType = 'select';
          
          // Extract enum values from the extracted enum information
          const enumValues = enumInfo[fieldType] || [];
          if (enumValues.length > 0) {
            options = enumValues.map((value: string) => ({ 
              value, 
              label: value.replace(/([A-Z])/g, ' $1').trim() // Convert PascalCase to readable format
            }));
            console.log(`🎯 Found enum ${fieldType} with values:`, enumValues);
          } else {
            // No enum values found - this shouldn't happen if enum detection is working
            console.error(`❌ No enum values found for ${fieldType} - this indicates an enum detection failure`);
            console.error(`Available enums:`, Object.keys(enumInfo));
            console.error(`Field info:`, { fieldName, fieldType, fieldKind: field.kind });
            
            // Only provide minimal fallback if absolutely necessary
            options = [
              { value: '', label: 'Please select an option' }
            ];
            console.log(`⚠️ Created empty fallback for ${fieldType} - user will need to select from available options`);
          }
        }
        
        // Set default value based on type
        let defaultValue: any = '';
        if (fieldType === 'Boolean') {
          defaultValue = false;
        } else if (inputType === 'date') {
          defaultValue = new Date().toISOString().split('T')[0]; // Today's date
        } else if (inputType === 'datetime-local') {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          defaultValue = now.toISOString().slice(0, 16); // Current datetime
        } else if (inputType === 'number') {
          // Provide sensible defaults for common numeric parameters
          if (fieldName.includes('batch') || fieldName.includes('size') || fieldName.includes('limit')) {
            defaultValue = '50'; // Default batch size
          } else if (fieldName.includes('page') || fieldName.includes('offset')) {
            defaultValue = '0'; // Default page/offset
          } else if (fieldName.includes('score') || fieldName.includes('rating')) {
            defaultValue = '1'; // Default minimum score
          } else {
            defaultValue = '0'; // Generic numeric default
          }
        } else if (inputType === 'select' && options && options.length > 0) {
          defaultValue = ''; // Empty string for select - user must choose
        }
        
        return {
          id: `fallback_${index}`,
          name: field.name,
          type: inputType,
          label: field.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
          description: field.description || `Enter ${field.name}`,
          required: field.required || false,
          placeholder: field.placeholder || (inputType === 'datetime-local' ? 'Select date and time' : 
                                          inputType === 'date' ? 'Select date' :
                                          inputType === 'time' ? 'Select time' :
                                          inputType === 'select' ? 'Select an option' :
                                          `Enter ${field.name}`),
          defaultValue: defaultValue,
          options: options
        };
      };
      
      // Create fallback components using the helper function
      const currentEnumInfo = extractEnumInformation(prismaSchema || '');
      console.log('🔍 Current enum info for fallback components:', currentEnumInfo);
      
      const fallbackComponents = pseudoSteps[0].inputFields.map((field: any, index: number) => {
        console.log(`🔍 Processing field for UI: ${field.name} (type: ${field.type}, kind: ${field.kind})`);
        const component = createFallbackComponent(field, index, currentEnumInfo);
        console.log(`🎯 Generated UI component:`, { 
          name: component.name, 
          type: component.type, 
          hasOptions: !!component.options,
          optionCount: component.options?.length || 0,
          options: component.options
        });
        return component;
      });
      
      uiComponents.push(...fallbackComponents);
      console.log(`✅ Added ${fallbackComponents.length} fallback UI components from pseudo steps with proper input types`);
    }
    
    console.log(`✅ Step 2.5/3 complete: Generated ${uiComponents.length} UI components (converted to modal format)`);
    
    // Step 3: Generate Executable Code (using technical spec as primary source)
    console.log(`🔨 Step 3/3: Generating executable code from technical specification...`);
    const codeResult = await generateActionExecutableCode(
      actionName,
      actionDescription,
      pseudoSteps,
      availableModels,
      entityType,
      businessContext,
      undefined, // inputParameters
      undefined, // enhancedAnalysis
      undefined, // testResults
      prismaSchema,
      technicalSpec // Pass technical spec as primary implementation guide
    );
    
    console.log(`✅ Step 3/3 complete: Generated ${codeResult.code.length} chars of executable code`);
    
    // Assemble complete action with all components
    const completeAction: any = {
      id: actionSpec.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName, // Code-safe name for API endpoints
      title: actionTitle, // Human-readable name for UI display
      description: actionDescription,
      role: actionSpec.role || 'member',
      
      // Step 1 results: Technical Specification (NEW)
      technicalSpecification: technicalSpec,
      
      // Step 2 results: Pseudo Steps
      pseudoSteps: pseudoSteps,
      
      // Step 2.5 results: UI Components (NEW)
      uiComponentsDesign: uiComponents,
      
      // Step 3 results: Executable Code
      execute: {
        type: 'code' as const,
        code: {
          script: codeResult.code,
          envVars: codeResult.envVars || []
        }
      },
      
      // Additional metadata from code generation
      _internal: {
        hasRealCode: true,
        hasTestCases: !!codeResult.testData,
        codeGenerationMetadata: {
          inputParameters: codeResult.inputParameters,
          outputParameters: codeResult.outputParameters,
          estimatedExecutionTime: codeResult.estimatedExecutionTime,
          testData: codeResult.testData
        }
      },
      
      // Required fields for AgentAction interface
      dataSource: {
        type: 'database' as const,
        database: {
          models: availableModels || []
        }
      },
      results: {
        model: actionName,
        fields: {},
        fieldsToUpdate: {}
      }
    };
    
    console.log(`🎉 Complete action generated using API route logic: ${actionName}`);
    return completeAction;
    
  } catch (error) {
    console.error(`❌ Failed to generate complete action using API route logic: ${actionName}`, error);
    throw error;
  }
} 

/**
 * Bidirectional sync: Update technical specification based on pseudo step changes
 * This allows users to edit pseudo steps in the UI and have the spec reflect their changes
 */
export async function updateSpecFromPseudoSteps(
  originalSpec: TechnicalSpecification,
  updatedPseudoSteps: any[],
  businessContext: string
): Promise<TechnicalSpecification> {
  console.log(`🔄 Syncing technical specification with updated pseudo steps`);
  
  const model = await getAgentBuilderModel();
  
  const systemPrompt = `You are a technical specification writer updating a specification based on user-modified pseudo steps.

ORIGINAL TECHNICAL SPECIFICATION:
${JSON.stringify(originalSpec, null, 2)}

UPDATED PSEUDO STEPS (user-modified):
${JSON.stringify(updatedPseudoSteps, null, 2)}

TASK: Update the technical specification to reflect the changes made in the pseudo steps while maintaining technical accuracy and implementability.

REQUIREMENTS:
1. **Preserve Intent**: Keep the original purpose and business goals
2. **Reflect Changes**: Update implementation details to match the modified pseudo steps
3. **Maintain Quality**: Ensure the updated spec is still technically sound and implementable
4. **Code-Focus**: Keep the specification technical and code-focused
5. **Consistency**: Ensure all sections align with the updated implementation approach

Focus on updating:
- Implementation Approach: Reflect any algorithmic or process changes
- Database Operations: Update queries and operations based on step changes
- Input/Output Schemas: Adjust based on parameter changes in steps
- Error Handling Logic: Update based on error handling changes in steps
- Environment Variables: Add/remove based on new requirements
- Code Dependencies: Update based on new libraries or patterns needed

Return the updated technical specification that accurately reflects the user's pseudo step modifications.`;

  const result = await generateObject({
    model,
    schema: TechnicalSpecificationSchema,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Update the technical specification to reflect the changes made in the pseudo steps. Ensure the updated specification maintains technical accuracy while incorporating the user's modifications.`
      }
    ],
    temperature: 0.2,
    maxTokens: 2000
  });

  console.log(`✅ Updated technical specification based on pseudo step changes`);
  return result.object;
}

/**
 * Bidirectional sync: Update pseudo steps based on specification changes
 * This allows users to edit the spec directly and regenerate pseudo steps
 */
export async function updatePseudoStepsFromSpec(
  updatedSpec: TechnicalSpecification,
  originalPseudoSteps: any[],
  availableModels: any[],
  businessContext: string
): Promise<any[]> {
  console.log(`🔄 Regenerating pseudo steps from updated technical specification`);
  
  // Use the enhanced description approach but with updated spec
  const enhancedDescription = `${updatedSpec.purpose}

UPDATED TECHNICAL SPECIFICATION:
${updatedSpec.implementationApproach}

AVAILABLE PRISMA SCHEMA:
${updatedSpec.availablePrismaSchema}

SEQUENTIAL STEPS:
${updatedSpec.sequentialSteps.map(step => `Step ${step.stepNumber}: ${step.stepTitle} - ${step.description}`).join('\n')}

INPUT PARAMETERS:
${updatedSpec.inputParameters.map(p => `${p.name}: ${p.type} - ${p.description}`).join('\n')}

OUTPUT PARAMETERS:
${updatedSpec.outputParameters.map(p => `${p.name}: ${p.type} - ${p.description}`).join('\n')}

GLOBAL ERROR HANDLING:
${updatedSpec.globalErrorHandling}

This updated technical specification should guide the pseudo step generation to ensure implementable, detailed steps that reflect the specification changes.`;

  const pseudoSteps = await generatePseudoSteps(
    updatedSpec.name,
    enhancedDescription,
    availableModels || [],
    'action',
    businessContext
  );

  console.log(`✅ Regenerated ${pseudoSteps.length} pseudo steps from updated specification`);
  return pseudoSteps;
} 