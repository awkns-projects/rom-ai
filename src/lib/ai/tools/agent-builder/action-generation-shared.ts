import { generateObject } from 'ai';
import { z } from 'zod';
import { getAgentBuilderModel, generatePseudoSteps, generateUIComponents } from './generation';
import { sanitizeEnvironmentVariables, generateTitleAndName } from './utils';
import { generateMigrationActionCode, generateStepTypeCode, type MigrationStep } from './migration-code-generators';

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
 * UI Component Schema for action execution interface
 */
export const UIComponentSchema = z.object({
  id: z.string().describe('Unique component ID'),
  name: z.string().describe('Parameter name this component is linked to'),
  type: z.enum(['text', 'number', 'email', 'password', 'textarea', 'select', 'checkbox', 'radio', 'date', 'datetime-local', 'time', 'url', 'tel']).describe('Input component type'),
  label: z.string().describe('Human-readable label for the component'),
  description: z.string().describe('Help text or description for the user'),
  required: z.boolean().describe('Whether this input is required'),
  placeholder: z.string().optional().describe('Placeholder text for the input'),
  defaultValue: z.any().optional().describe('Default value for the component'),
  options: z.array(z.object({
    value: z.string().describe('Option value'),
    label: z.string().describe('Option display label')
  })).optional().describe('Options for select/radio components'),
  validation: z.object({
    min: z.number().optional().describe('Minimum value for numbers'),
    max: z.number().optional().describe('Maximum value for numbers'),
    minLength: z.number().optional().describe('Minimum length for strings'),
    maxLength: z.number().optional().describe('Maximum length for strings'),
    pattern: z.string().optional().describe('Regex pattern for validation')
  }).optional().describe('Validation rules for the component'),
  databaseModel: z.string().optional().describe('Database model name for relation fields'),
  multiple: z.boolean().optional().describe('Whether multiple values can be selected')
});

/**
 * Technical Specification Schema - architecture document that explains how pseudo steps connect and work together
 * Now includes UI components for action execution interface
 */
export const TechnicalSpecificationSchema = z.object({
  name: z.string().describe('Action name in camelCase'),
  title: z.string().describe('User-friendly action title'),
  purpose: z.string().describe('Brief technical purpose of the action'),
  
  // Available Prisma Schema
  availablePrismaSchema: z.string().describe('Complete Prisma schema with all available models, fields, and relationships that this action can use'),
  
  // UI Components for action execution (NEW - moved from separate step)
  uiComponents: z.array(UIComponentSchema).describe('UI components for action execution interface, generated based on input parameters and database relationships'),
  
  // Architecture and integration guidance (NOT step-by-step details)
  architectureOverview: z.string().describe('High-level architecture explaining how the pseudo steps work together as a cohesive system'),
  dataFlowStrategy: z.string().describe('How data flows between pseudo steps and what each step contributes to the overall workflow'),
  integrationPatterns: z.array(z.string()).describe('Technical patterns for connecting steps (e.g., "Step 1 output feeds into Step 2 filter", "Steps 2-3 run in parallel")'),
  
  // Technical constraints and requirements
  databaseIntegration: z.string().describe('How the action integrates with the Prisma database schema and what models/relationships it uses'),
  typeSystemGuidance: z.string().describe('TypeScript type considerations and how data types flow between steps'),
  errorHandlingStrategy: z.string().describe('Overall error handling approach and how errors are managed across steps'),
  
  // Performance and scalability architecture
  performanceArchitecture: z.string().describe('Performance considerations for the step sequence and how to optimize the workflow'),
  scalabilityConsiderations: z.string().describe('How the step sequence scales and handles large datasets'),
  
  // Input/Output contracts
  inputContract: z.string().describe('Overall input contract and how input parameters are distributed to steps'),
  outputContract: z.string().describe('Overall output contract and how step outputs are aggregated into final result'),
  variableContracts: z.string().describe('Detailed variable flow between steps including validation patterns to prevent missing variables'),
  
  // Environment and dependencies
  environmentVariables: z.array(z.string()).describe('List of environment variable names needed for the entire workflow'),
  codeDependencies: z.array(z.string()).describe('Required imports, libraries, and dependencies needed for the entire action'),
  
  // Implementation guidance (not step details)
  implementationNotes: z.array(z.string()).describe('Technical notes about implementing the pseudo step sequence correctly'),
  commonPitfalls: z.array(z.string()).describe('Common mistakes to avoid when implementing this step sequence')
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
  externalApis?: any[],
  availableEnums?: any[]
): Promise<TechnicalSpecification> {
  console.log(`📋 Generating technical specification for: ${name}`);
  
  const model = await getAgentBuilderModel();
  
  // Extract model information for database operations
  const modelInfo = availableModels.map(m => `${m.name}: ${m.fields?.map((f: any) => `${f.name}:${f.type}`).join(', ')}`).join('\n');
  
  // Extract external API information
  const externalApiInfo = externalApis?.map(api => `${api.provider} (${api.connectionType}): ${api.description}`).join('\n') || 'None';
  
  const systemPrompt = `You are a senior software architect writing a technical specification that explains how pseudo steps connect and work together. This spec provides architectural context for implementing a business action, focusing on integration patterns and data flow rather than step-by-step details.

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

Your technical specification should explain the ARCHITECTURE and INTEGRATION, not duplicate step details:

1. **ARCHITECTURE OVERVIEW**: Explain how the action works as a complete system
   - Overall workflow and business logic approach
   - How the action fits into the larger system architecture
   - Key architectural decisions and patterns used

2. **DATA FLOW STRATEGY**: Explain how data moves through the action
   - How input parameters are distributed to different steps
   - How step outputs connect to subsequent step inputs (prevent missing variables)
   - Variable naming conventions and data contracts between steps
   - Data transformation patterns and type conversions
   - Variable validation patterns to ensure data exists before use
   - Overall data flow architecture

3. **INTEGRATION PATTERNS**: Explain how steps connect together
   - Which steps run sequentially vs in parallel
   - Variable dependency mapping (which variables each step needs from previous steps)
   - How to validate that required variables exist before each step
   - Error handling flows between steps and variable validation failures
   - Dependency patterns between steps
   - Integration points with external systems

4. **DATABASE INTEGRATION**: Explain how the action uses the database
   - Which models and relationships are involved
   - Overall database access patterns
   - Transaction and consistency considerations
   - Performance implications of database usage

5. **TYPE SYSTEM GUIDANCE**: Explain TypeScript considerations
   - How types flow between steps
   - Type conversion requirements
   - Interface contracts between components

6. **ERROR HANDLING STRATEGY**: Explain overall error management
   - How errors are handled across the step sequence
   - Recovery patterns and fallback strategies
   - Error propagation and containment

TECHNICAL SPECIFICATION STRUCTURE:

You must provide:

1. **availablePrismaSchema**: Copy the exact Prisma schema provided above
2. **uiComponents**: UI components for action execution interface (NEW - see UI COMPONENT GENERATION section below)
3. **architectureOverview**: High-level explanation of how the action works as a system
4. **dataFlowStrategy**: How data flows between steps and transforms
5. **integrationPatterns**: How steps connect and depend on each other
6. **databaseIntegration**: How the action integrates with the database schema
7. **typeSystemGuidance**: TypeScript type flow and conversion requirements
8. **errorHandlingStrategy**: Overall approach to error handling across steps
9. **performanceArchitecture**: Performance and scalability considerations
10. **inputContract**: Overall input requirements and how they're distributed to steps
11. **outputContract**: Overall output structure and how step outputs are aggregated
12. **variableContracts**: Detailed variable flow between steps to prevent missing variables
13. **implementationNotes**: Technical notes for implementing the step sequence
14. **commonPitfalls**: Common mistakes to avoid when implementing

🎨 UI COMPONENT GENERATION REQUIREMENTS:

As part of the technical specification, you must ALSO generate UI components for the action execution interface. These components will be used to create forms for users to input parameters before executing the action.

**UI COMPONENT GENERATION RULES:**

1. **Parameter-Based Generation**: Create one UI component for each input parameter the action needs
2. **Smart Type Detection**: Determine appropriate input types based on parameter names and types:
   - Email fields → type: 'email'
   - Password fields → type: 'password'
   - Date fields → type: 'date' or 'datetime-local'
   - Long text → type: 'textarea'
   - Numbers → type: 'number'
   - Boolean → type: 'checkbox'
   - Enum fields → type: 'select' with options from enum values
   - Database relations → type: 'select' with databaseModel specified

3. **Database Relation Handling**: For parameters that reference other models:
   - Set type: 'select'
   - Set databaseModel: 'ModelName'
   - Set multiple: true/false based on whether it's a list
   - The UI will dynamically load records from the specified model

4. **Enum Field Handling**: For parameters that use enum types:
   - Set type: 'select'
   - Generate options array with value/label pairs from enum values
   - Use the exact enum values from the Prisma schema

5. **Validation Rules**: Include appropriate validation:
   - required: true for required parameters
   - min/max for numeric fields
   - minLength/maxLength for text fields
   - pattern for specific formats (email, phone, etc.)

6. **User Experience**: 
   - Generate helpful labels and descriptions
   - Provide sensible placeholders
   - Set appropriate default values
   - Group related parameters logically

**EXAMPLE UI COMPONENT GENERATION:**

If the action has input parameters:
- userId (String, required, database relation to User model)
- reportType (ReportType enum, required)
- startDate (DateTime, required)
- includeDetails (Boolean, optional)
- batchSize (Int, optional, default: 50)

Generate UI components following this pattern:
- userId parameter → User selection dropdown with databaseModel: "User"
- reportType parameter → Report type dropdown with enum options
- startDate parameter → Date picker component
- includeDetails parameter → Checkbox component
- batchSize parameter → Number input with validation

**CRITICAL UI COMPONENT REQUIREMENTS:**
1. ✅ Generate components for ALL input parameters the action needs
2. ✅ Use exact parameter names from the action's input contract
3. ✅ Use exact enum values from the Prisma schema for select options
4. ✅ Set databaseModel for relation fields to enable dynamic record loading
5. ✅ Include helpful labels, descriptions, and placeholders
6. ✅ Set appropriate validation rules based on parameter types
7. ✅ Provide sensible default values where appropriate
8. ❌ NEVER invent parameter names not in the input contract
9. ❌ NEVER use enum values not in the Prisma schema

Focus on ARCHITECTURE and INTEGRATION, not step-by-step implementation details.`;

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
 * Extract enum information from structured model data instead of parsing Prisma schema
 */
export function extractEnumInformationFromModels(availableModels: any[]): Record<string, string[]> {
  const enumInfo: Record<string, string[]> = {};
  
  // Extract enum information from all models
  availableModels.forEach(model => {
    if (model.enums && Array.isArray(model.enums)) {
      model.enums.forEach((enumDef: any) => {
        if (enumDef.name && enumDef.fields && Array.isArray(enumDef.fields)) {
          const enumValues = enumDef.fields.map((field: any) => field.name).filter(Boolean);
          if (enumValues.length > 0) {
            enumInfo[enumDef.name] = enumValues;
            console.log(`🎯 Extracted enum ${enumDef.name}:`, enumValues);
          }
        }
      });
    }
  });
  
  console.log('🔍 Total enums extracted from models:', {
    enumCount: Object.keys(enumInfo).length,
    enums: enumInfo
  });
  
  return enumInfo;
}

/**
 * Extract field information from structured model data to identify enum fields
 */
export function extractFieldInformationFromModels(availableModels: any[]): Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> {
  const fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> = {};
  const enumInfo = extractEnumInformationFromModels(availableModels);
  
  availableModels.forEach(model => {
    if (model.name && model.fields && Array.isArray(model.fields)) {
      fieldInfo[model.name] = {};
      
      model.fields.forEach((field: any) => {
        if (field.name && field.type) {
          const isEnum = enumInfo.hasOwnProperty(field.type);
          fieldInfo[model.name][field.name] = {
            type: field.type,
            isEnum,
            ...(isEnum && enumInfo[field.type] ? { enumValues: enumInfo[field.type] } : {})
          };
        }
      });
    }
  });
  
  return fieldInfo;
}

/**
 * Extract enum information from Prisma schema (fallback method)
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
 * Extract field information from Prisma schema for validation (fallback method)
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
 * Generate the actual enum validation code with proper error handling
 */
function generateEnumValidationCode(paramName: string, enumType: string, enumValues: string[]): string {
  if (!enumValues || enumValues.length === 0) {
    console.warn(`⚠️ No enum values provided for ${paramName} (type: ${enumType})`);
    return '';
  }
  
  return `
      // Validate enum parameter: ${paramName} (type: ${enumType})
      // Enum values extracted from structured model data: [${enumValues.join(', ')}]
      const validEnumValues_${paramName} = [${enumValues.map(v => `'${v}'`).join(', ')}];
      const paramValue_${paramName} = params.${paramName};
      
      if (paramValue_${paramName} && paramValue_${paramName} !== '') {
        // Try exact match first
        const exactMatch = validEnumValues_${paramName}.includes(paramValue_${paramName});
        
        if (!exactMatch) {
          // Try case-insensitive match for auto-correction
          const caseInsensitiveMatch = validEnumValues_${paramName}.find(val => 
            val.toLowerCase() === paramValue_${paramName}?.toLowerCase()
          );
          
          if (caseInsensitiveMatch) {
            // Fix case automatically
            console.log(\`🔄 Auto-correcting enum case for ${paramName}: "\${paramValue_${paramName}}" -> "\${caseInsensitiveMatch}"\`);
            params.${paramName} = caseInsensitiveMatch;
          } else {
            // Invalid enum value - add error
            errors.push('Parameter "${paramName}" must be one of: ${enumValues.join(', ')} (received: "' + paramValue_${paramName} + '")');
          }
        }
      }`;
}

/**
 * Extract enum information from the top-level enums array from database generation
 * Handles both raw format (strings) and AgentEnum format (objects)
 */
export function extractEnumInformationFromDatabase(availableEnums: any[]): Record<string, string[]> {
  const enumInfo: Record<string, string[]> = {};
  
  if (!availableEnums || !Array.isArray(availableEnums)) {
    console.warn('⚠️ No enums array provided or not an array');
    return enumInfo;
  }
  
  // Extract enum information from the top-level enums array
  availableEnums.forEach((enumDef: any) => {
    if (enumDef.name && enumDef.fields && Array.isArray(enumDef.fields)) {
      let enumValues: string[] = [];
      
      // Handle both raw format (strings) and AgentEnum format (objects)
      if (enumDef.fields.length > 0) {
        const firstField = enumDef.fields[0];
        
        if (typeof firstField === 'string') {
          // Raw format from ConvertSchemaToObject - fields are strings
          enumValues = enumDef.fields.filter(Boolean);
          console.log(`🎯 Extracted enum ${enumDef.name} (raw format):`, enumValues);
        } else if (firstField && typeof firstField === 'object' && firstField.name) {
          // AgentEnum format - fields are objects with name property
          enumValues = enumDef.fields.map((field: any) => field.name).filter(Boolean);
          console.log(`🎯 Extracted enum ${enumDef.name} (AgentEnum format):`, enumValues);
        } else {
          console.warn(`⚠️ Unknown enum field format for ${enumDef.name}:`, firstField);
          console.warn('Expected either string[] or object[] with name property');
          console.warn('Actual structure:', enumDef.fields);
        }
      }
      
      if (enumValues.length > 0) {
        enumInfo[enumDef.name] = enumValues;
      }
    }
  });
  
  console.log('🔍 Total enums extracted from database:', {
    enumCount: Object.keys(enumInfo).length,
    enums: enumInfo
  });
  
  return enumInfo;
}

/**
 * Extract field information from structured model data to identify enum fields
 * Now uses the correct top-level enums array
 */
export function extractFieldInformationFromDatabase(availableModels: any[], availableEnums: any[]): Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> {
  const fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> = {};
  const enumInfo = extractEnumInformationFromDatabase(availableEnums);
  
  availableModels.forEach(model => {
    if (model.name && model.fields && Array.isArray(model.fields)) {
      fieldInfo[model.name] = {};
      
      model.fields.forEach((field: any) => {
        if (field.name && field.type) {
          const isEnum = enumInfo.hasOwnProperty(field.type);
          fieldInfo[model.name][field.name] = {
            type: field.type,
            isEnum,
            ...(isEnum && enumInfo[field.type] ? { enumValues: enumInfo[field.type] } : {})
          };
        }
      });
    }
  });
  
  return fieldInfo;
}

/**
 * Generate input parameter validation code using structured model data
 * Updated to use the correct top-level enums array
 */
export function generateInputValidationCode(
  inputParameters: any[], 
  prismaSchema?: string,
  availableModels?: any[],
  availableEnums?: any[]
): string {
  if (!inputParameters || inputParameters.length === 0) {
    return `
    // No input parameters to validate
    `;
  }
  
  // Use structured model data if available, fallback to Prisma schema parsing
  let enumInfo: Record<string, string[]> = {};
  let fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> = {};
  
  if (availableEnums && availableEnums.length > 0) {
    // Preferred: Use top-level enums array from database generation
    enumInfo = extractEnumInformationFromDatabase(availableEnums);
    fieldInfo = extractFieldInformationFromDatabase(availableModels || [], availableEnums);
    console.log('🎯 Using structured database enum data for validation');
  } else if (availableModels && availableModels.length > 0) {
    // Fallback: Use model-nested enums (legacy support)
    enumInfo = extractEnumInformationFromModels(availableModels);
    fieldInfo = extractFieldInformationFromModels(availableModels);
    console.log('⚠️ Falling back to model-nested enum data for validation');
  } else if (prismaSchema) {
    // Final fallback: Parse Prisma schema
    enumInfo = extractEnumInformation(prismaSchema);
    fieldInfo = extractFieldInformation(prismaSchema);
    console.log('⚠️ Falling back to Prisma schema parsing for enum validation');
  } else {
    console.warn('⚠️ No enum data or Prisma schema available for validation');
  }
  
  // Debug logging for enum extraction
  console.log('🔍 DEBUG: Enum extraction in validation code generation:', {
    enumInfoKeys: Object.keys(enumInfo),
    enumInfoValues: enumInfo,
    hasEnums: !!(availableEnums && availableEnums.length > 0),
    hasModels: !!(availableModels && availableModels.length > 0),
    hasSchema: !!prismaSchema,
    enumCount: availableEnums?.length || 0,
    modelCount: availableModels?.length || 0
  });
  
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
        
        // Add enum validation using structured data
        const enumValidation = generateEnumValidationFromStructuredData(paramName, param, fieldInfo, enumInfo);
        if (enumValidation) {
          validationLogic += enumValidation;
        }
        
        return validationLogic;
      }).join('')}
      
      return errors;
    };
    
    const validationErrors = validateInputParameters(input);
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
 * Generate enum validation for a specific parameter using structured model data
 */
function generateEnumValidationFromStructuredData(
  paramName: string, 
  param: any, 
  fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>>,
  enumInfo: Record<string, string[]>
): string {
  // First, check if this parameter type directly matches an enum
  const paramType = param.type;
  if (enumInfo[paramType]) {
    const enumValues = enumInfo[paramType];
    console.log(`🎯 Direct enum match found for ${paramName} (type: ${paramType}):`, enumValues);
    return generateEnumValidationCode(paramName, paramType, enumValues);
  }
  
  // Try to find enum information for this parameter in field info
  for (const modelName in fieldInfo) {
    const modelFields = fieldInfo[modelName];
    if (modelFields[paramName] && modelFields[paramName].isEnum) {
      const enumValues = modelFields[paramName].enumValues || [];
      const enumType = modelFields[paramName].type;
      console.log(`🎯 Field-based enum match found for ${paramName} (type: ${enumType}):`, enumValues);
      return generateEnumValidationCode(paramName, enumType, enumValues);
    }
  }
  
  // Check if the parameter kind indicates it's an enum
  if (param.kind === 'enum') {
    // Try to infer enum type from parameter name or type
    const possibleEnumTypes = Object.keys(enumInfo);
    const matchingEnum = possibleEnumTypes.find(enumType => 
      paramType === enumType || 
      paramName.toLowerCase().includes(enumType.toLowerCase()) ||
      enumType.toLowerCase().includes(paramName.toLowerCase())
    );
    
    if (matchingEnum) {
      const enumValues = enumInfo[matchingEnum];
      console.log(`🎯 Inferred enum match found for ${paramName} (type: ${matchingEnum}):`, enumValues);
      return generateEnumValidationCode(paramName, matchingEnum, enumValues);
    }
  }
  
  // If no enum found but the field looks like it should be an enum, log warning
  if (param.kind === 'enum' || paramName.toLowerCase().includes('status') || paramName.toLowerCase().includes('type')) {
    console.warn(`⚠️ Parameter ${paramName} appears to be an enum but no validation rules found in structured data`);
    console.warn(`Available enums:`, Object.keys(enumInfo));
    console.warn(`Parameter info:`, { name: paramName, type: paramType, kind: param.kind });
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

TECHNICAL SPECIFICATION (Architecture Context):
${technicalSpec.architectureOverview}

AVAILABLE PRISMA SCHEMA:
${technicalSpec.availablePrismaSchema}

DATA FLOW STRATEGY:
${technicalSpec.dataFlowStrategy}

INTEGRATION PATTERNS:
${technicalSpec.integrationPatterns.join('\n')}

DATABASE INTEGRATION:
${technicalSpec.databaseIntegration}

ERROR HANDLING STRATEGY:
${technicalSpec.errorHandlingStrategy}

This technical specification provides architectural context to guide pseudo step generation.`;
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
  businessContext?: string,
  availableEnums?: any[]
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
    businessContext,
    availableEnums
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
  technicalSpec?: TechnicalSpecification,
  availableEnums?: any[]
): Promise<{
  code: string;
  envVars: any[];
  inputParameters: any[];
  outputParameters: any[];
  estimatedExecutionTime: string;
  testData: any;
}> {
  console.log(`🔨 Generating executable code for ${entityType}: ${name}`);
  
  // 🚨 CRITICAL DEBUG: Log what data we actually receive
  console.log('🔍 DEBUG: Data received by generateActionExecutableCode:');
  console.log('- availableModels count:', availableModels?.length || 0);
  console.log('- availableModels names:', availableModels?.map((m: any) => m.name) || []);
  console.log('- availableEnums count:', availableEnums?.length || 0);
  console.log('- availableEnums names:', availableEnums?.map((e: any) => e.name) || []);
  console.log('- prismaSchema length:', prismaSchema?.length || 0);
  console.log('- prismaSchema preview:', prismaSchema?.substring(0, 200) || 'No schema');
  console.log('- technicalSpec available:', !!technicalSpec);
  console.log('- technicalSpec.uiComponents count:', technicalSpec?.uiComponents?.length || 0);
  console.log('- technicalSpec.uiComponents preview:', technicalSpec?.uiComponents?.slice(0, 3) || 'No UI components');
  console.log('- pseudoSteps count:', pseudoSteps?.length || 0);

  // Validate required fields
  if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
    throw new Error('Missing required fields: name, description, pseudoSteps');
  }

  const model = await getAgentBuilderModel();

  // Extract input parameters from technical specification UI components (authoritative source)
  const extractedInputParams = inputParameters || (
    technicalSpec?.uiComponents && technicalSpec.uiComponents.length > 0 ? 
    technicalSpec.uiComponents
      .filter((component: any) => component.name && component.name.trim() !== '')
      .map((component: any) => ({
        name: component.name,
        type: component.type === 'number' ? 'Int' : 
              component.type === 'checkbox' ? 'Boolean' :
              component.type === 'date' || component.type === 'datetime-local' ? 'DateTime' :
              'String', // Map UI component types to parameter types
        required: component.required || false,
        description: component.description || `Input parameter for ${component.name}`,
        kind: component.databaseModel ? 'object' : 'scalar', // Set kind based on database relation
        relationModel: component.databaseModel, // Database relation model if applicable
        list: component.multiple || false // Handle multiple selections
      })) : 
    // Fallback to pseudo steps only if technical spec has no UI components
    (pseudoSteps.length > 0 && pseudoSteps[0].inputFields ? 
      pseudoSteps[0].inputFields
        .filter((field: any) => field.name && field.name.trim() !== '')
        .map((field: any) => ({
          name: field.name,
          type: field.type,
          required: field.required,
          description: field.description || `Input parameter for ${field.name}`,
          kind: field.kind || 'scalar',
          relationModel: field.relationModel
        })) : []
    )
  );

  // 🚨 CRITICAL DEBUG: Log what input parameters were actually extracted
  console.log('🔍 DEBUG: Input parameter extraction results:');
  console.log('- extractedInputParams count:', extractedInputParams.length);
  console.log('- extractedInputParams source:', 
    technicalSpec?.uiComponents && technicalSpec.uiComponents.length > 0 ? 'Technical Spec UI Components' : 
    pseudoSteps.length > 0 && pseudoSteps[0].inputFields ? 'Pseudo Steps Fallback' : 
    'None/Empty'
  );
  console.log('- extractedInputParams preview:', extractedInputParams.slice(0, 3));
  
  if (technicalSpec?.uiComponents) {
    console.log('- technicalSpec.uiComponents available:', technicalSpec.uiComponents.length);
    console.log('- UI component names:', technicalSpec.uiComponents.map((c: any) => c.name));
  } else {
    console.log('- technicalSpec.uiComponents: NOT AVAILABLE');
  }

  // Generate input validation code using structured database enum data (preferred) or fallbacks
  const inputValidationCode = generateInputValidationCode(extractedInputParams, prismaSchema, availableModels, availableEnums);
  
  // 🚨 CRITICAL DEBUG: Log the generated validation code
  console.log('🔍 DEBUG: Generated input validation code preview:');
  console.log(inputValidationCode.substring(0, 500) + '...');
  
  // Extract field information for enhanced validation - prefer structured database enum data
  let fieldInfo: Record<string, Record<string, { type: string; isEnum: boolean; enumValues?: string[] }>> = {};
  let enumInfo: Record<string, string[]> = {};
  
  if (availableEnums && availableEnums.length > 0) {
    // Preferred: Use top-level enums array from database generation
    enumInfo = extractEnumInformationFromDatabase(availableEnums);
    fieldInfo = extractFieldInformationFromDatabase(availableModels || [], availableEnums);
    console.log('🎯 Using structured database enum data for system prompt');
  } else if (availableModels && availableModels.length > 0) {
    // Fallback: Use model-nested enums (legacy support)
    enumInfo = extractEnumInformationFromModels(availableModels);
    fieldInfo = extractFieldInformationFromModels(availableModels);
    console.log('⚠️ Falling back to model-nested enum data for system prompt');
  } else if (prismaSchema) {
    // Final fallback: Parse Prisma schema
    fieldInfo = extractFieldInformation(prismaSchema);
    enumInfo = extractEnumInformation(prismaSchema);
    console.log('⚠️ Falling back to Prisma schema parsing for system prompt enum info');
  }
  
  console.log('🔍 DEBUG: Enum extraction results:', {
    enumInfoKeys: Object.keys(enumInfo),
    enumInfoValues: enumInfo,
    fieldInfoKeys: Object.keys(fieldInfo),
    schemaLength: prismaSchema?.length || 0,
    schemaSnippet: prismaSchema?.substring(0, 200) + '...' || 'No schema'
  });
  
  // 🚨 CRITICAL DEBUG: Log what will be included in system prompt
  console.log('🔍 DEBUG: System prompt enum section will include:');
  if (Object.keys(enumInfo).length > 0) {
    console.log('✅ ENUM INFORMATION SECTION:');
    Object.entries(enumInfo).forEach(([enumName, values]) => {
      console.log(`  - ${enumName}: [${values.join(', ')}]`);
    });
  } else {
    console.log('❌ NO ENUM INFORMATION - will show warning section');
  }
  
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

🚨 CRITICAL SYNTAX REQUIREMENT: Use template literals (\`backticks\`) for ALL string literals in your code to prevent syntax errors from apostrophes and quotes. NEVER use single quotes in console.log statements or error messages.

🚨 CRITICAL ERROR PREVENTION - THESE ERRORS KEEP HAPPENING AND MUST BE PREVENTED:

1. "Cannot read properties of undefined (reading 'map')" - YOU MUST validate ALL variables before calling .map()
2. "Unknown argument medicationRecords" - YOU MUST NOT use relation fields in update operations  
3. "Invalid value for argument status" - YOU MUST validate enum values before using them

🚨 🚨 🚨 ABSOLUTELY MANDATORY .map() VALIDATION - NO EXCEPTIONS:

BEFORE calling .map(), .filter(), .forEach(), or ANY array method on ANY variable, you MUST use this EXACT pattern:

REQUIRED VALIDATION PATTERN (copy this exactly):
if (!variableName || !Array.isArray(variableName)) {
  console.error(\`❌ Variable validation failed for variableName\`, {
    isUndefined: !variableName,
    isArray: Array.isArray(variableName),
    actualType: typeof variableName,
    actualValue: variableName
  });
  
  // Choose one approach:
  // Option 1: Use empty array fallback
  variableName = [];
  
  // Option 2: Throw descriptive error
  // throw new Error(\`Variable variableName is not available or not an array\`);
}

// Now safe to use array methods
const results = variableName.map(item => processItem(item));

🚨 THIS VALIDATION IS REQUIRED FOR:
- Database query results: step1_patients.map(...)
- AI generation results: aiGeneratedArray.map(...)  
- Any variable that might be undefined: someVariable.map(...)
- ALL array operations without exception

❌ ABSOLUTELY FORBIDDEN (causes crashes):
// This will crash if variable is undefined:
const results = someVariable.map(item => item.id); // NO VALIDATION!

TASK: Generate complete, executable JavaScript code based on the technical specification and pseudo steps.

🚨 REDIS LOGGING REQUIREMENT:
Your generated code MUST include Redis-based step logging for action execution tracking. The following globals are available:
- actionLogger: ActionExecutionLogger instance (available globally)
- executionId: string - unique execution ID for this action run (available globally)

MANDATORY REDIS LOGGING PATTERN:
1. ✅ At the start of EACH step, call: await actionLogger.startStep(executionId, stepNumber, stepName, inputData)
2. ✅ At the end of EACH step, call: await actionLogger.completeStep(executionId, stepNumber, outputData, errorMessage)
3. ✅ Use try-catch around each step to capture errors for Redis logging
4. ✅ Log meaningful input/output data that helps debug issues

EXAMPLE STEP LOGGING PATTERN:
\`\`\`javascript
// Step 1: Fetch user data
try {
  const stepInput = { userId: input.userId, batchSize: convertedParams.batchSize };
  await actionLogger.startStep(executionId, 1, 'Fetch user data', stepInput);
  
  // Step implementation...
  const step1_userData = await db.user.findMany({
    where: { id: input.userId },
    take: convertedParams.batchSize
  });
  
  const stepOutput = { 
    userCount: step1_userData.length,
    userIds: step1_userData.map(u => u.id),
    userData: step1_userData
  };
  
  await actionLogger.completeStep(executionId, 1, stepOutput);
  console.log(\`✅ Step 1 completed: Found \${step1_userData.length} users\`);
  
} catch (stepError) {
  await actionLogger.completeStep(executionId, 1, {}, stepError.message);
  console.error(\`❌ Step 1 failed:\`, stepError);
  throw stepError;
}
\`\`\`

🚨 CRITICAL REDIS LOGGING RULES:
1. ✅ ALWAYS wrap each step in try-catch for error logging
2. ✅ ALWAYS call startStep() before step implementation
3. ✅ ALWAYS call completeStep() after step implementation (even on errors)
4. ✅ Log meaningful data that helps with debugging
5. ✅ Include record counts, IDs, and key results in step output
6. ❌ NEVER skip Redis logging for any step
7. ❌ NEVER log sensitive data (passwords, API keys, etc.)

🚨 CRITICAL ERROR PREVENTION: The user has reported multiple critical errors:
1. AI keeps generating hardcoded enum values that don't match the actual schema
2. AI generates wrong model names like "contentModel" instead of actual model names
3. AI ignores the provided input validation code and creates its own validation
4. Generated code has runtime errors like "i.platforms.map is not a function"
5. Generated code has syntax errors from unescaped quotes in console.log statements
6. AI generates code that uses undefined input parameters (e.g., input.currentWeekStartDate when not provided)
7. AI calls .map() on undefined variables causing "Cannot read properties of undefined (reading 'map')" errors

🚨 ABSOLUTELY FORBIDDEN - DO NOT DO THESE THINGS:
❌ NEVER generate your own enum validation - use ONLY the provided INPUT PARAMETER VALIDATION CODE
❌ NEVER invent model names - use ONLY the models listed in AVAILABLE MODELS section
❌ NEVER ignore the provided validation code - include it exactly as provided
❌ NEVER assume data structures - always check if variables are arrays before calling .map()
❌ NEVER use single quotes in console.log statements - ALWAYS use template literals (\`backticks\`)
❌ NEVER hardcode foreign key values - ALWAYS use parameters or validate existence first
❌ NEVER create records with foreign keys unless you validate the referenced record exists
❌ NEVER hardcode any values like IDs, names, dates, or any data - ALWAYS use parameters or generate dynamically
❌ NEVER use example values like "user123", "campaign1", "2023-01-01" in production code
❌ NEVER use input parameters that aren't defined in the UI components (e.g., input.currentWeekStartDate when not provided)
❌ NEVER call .map() on variables without checking if they exist and are arrays first
❌ NEVER assume AI-generated objects exist - always validate before using them
❌ NEVER try to update relation fields in Prisma update operations (e.g., medicationRecords: { push: ... })
❌ NEVER use relation field names in the data object of update/create operations
❌ NEVER try to create nested relations in update operations - update the related records separately

🚨 CRITICAL SYNTAX ERROR PREVENTION:
ALWAYS use template literals (\`backticks\`) for ALL string literals in your generated code, especially:
- console.log(\`message\`) instead of console.log('message')
- throw new Error(\`message\`) instead of throw new Error('message')
- Any string that might contain apostrophes, quotes, or special characters

🚨 CRITICAL FOREIGN KEY ERROR PREVENTION:
NEVER create records with foreign key relationships unless:
1. ✅ The foreign key value comes from parameters (user input)
2. ✅ You validate the referenced record exists first
3. ✅ You handle the case where foreign key is optional/missing

This prevents errors like: "Foreign key constraint violated" and "authorId_fkey" errors.

${Object.keys(enumInfo).length > 0 ? `
🎯 ACTUAL ENUM INFORMATION FROM THE DATABASE MODEL DATA:
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

🚨 MANDATORY INPUT PARAMETER VALIDATION CODE - INCLUDE EXACTLY AS PROVIDED:
${inputValidationCode}

🚨 CRITICAL VALIDATION RULES:
1. ✅ INCLUDE the validation code above EXACTLY as provided - do not modify it
2. ✅ CALL validateInputParameters(parameters) at the start of your function
3. ✅ RETURN early if validation fails - do not continue with database operations
4. ❌ NEVER create your own enum validation arrays like ['DRAFT', 'APPROVED']
5. ❌ NEVER ignore the provided validation code and create your own
6. ❌ NEVER modify the enum values in the provided validation code

🚨 CRITICAL TYPE CONVERSION REQUIREMENTS:
All form inputs come as strings from the UI. You MUST convert them to proper types before database operations:

**COMMON TYPE CONVERSIONS NEEDED:**
- \`take\` parameter: MUST be converted to integer: \`parseInt(input.batchSize || '50', 10)\`
- \`skip\` parameter: MUST be converted to integer: \`parseInt(input.page || '0', 10) * parseInt(input.batchSize || '50', 10)\`
- Number parameters: Use \`parseInt()\` for integers, \`parseFloat()\` for decimals
- Date parameters: Use \`new Date(input.dateField)\` for date strings
- Boolean parameters: Use \`input.boolField === 'true'\` for boolean strings

**EXAMPLE OF CORRECT TYPE CONVERSION:**
\`\`\`javascript
// ❌ WRONG: This causes "Expected Int, provided String" errors
const records = await db.model.findMany({
  take: input.batchSize,  // String value like "50"
  skip: input.page * input.batchSize  // String multiplication
});

// ✅ CORRECT: Convert strings to proper types
const batchSize = parseInt(input.batchSize || '50', 10);
const page = parseInt(input.page || '0', 10);
const records = await db.model.findMany({
  take: batchSize,  // Integer value like 50
  skip: page * batchSize  // Proper integer arithmetic
});
\`\`\`

**MANDATORY TYPE CONVERSION PATTERN:**
Always add this type conversion block after input validation:
\`\`\`javascript
// 🔄 Type Conversion: Convert string inputs to proper types
const convertedParams = {
  ...input,
  // Convert numeric parameters
  batchSize: input.batchSize ? parseInt(input.batchSize, 10) : 50,
  page: input.page ? parseInt(input.page, 10) : 0,
  performanceScore: input.performanceScore ? parseFloat(input.performanceScore) : 0,
  // Convert date parameters
  startDate: input.startDate ? new Date(input.startDate) : new Date(),
  endDate: input.endDate ? new Date(input.endDate) : new Date(),
  // Convert boolean parameters
  isActive: input.isActive === 'true'
};
\`\`\`

Then use \`convertedParams\` instead of \`parameters\` in your database operations.

${technicalSpec ? `📋 TECHNICAL SPECIFICATION (Architecture Context):

Architecture Overview:
${technicalSpec.architectureOverview}

Data Flow Strategy:
${technicalSpec.dataFlowStrategy}

Integration Patterns:
${technicalSpec.integrationPatterns.join('\n- ')}

Database Integration:
${technicalSpec.databaseIntegration}

Type System Guidance:
${technicalSpec.typeSystemGuidance}

Error Handling Strategy:
${technicalSpec.errorHandlingStrategy}

Performance Architecture:
${technicalSpec.performanceArchitecture}

Input Contract:
${technicalSpec.inputContract}

Output Contract:
${technicalSpec.outputContract}

Variable Contracts:
${technicalSpec.variableContracts}

Implementation Notes:
${technicalSpec.implementationNotes.join('\n- ')}

Common Pitfalls to Avoid:
${technicalSpec.commonPitfalls.join('\n- ')}

🚨 CRITICAL: Use the PSEUDO STEPS below as your PRIMARY implementation guide since they may have been edited by the user. The technical specification above provides architectural context and explains how the steps connect together.
` : ''}

CONTEXT:
- Name: ${name}
- Description: ${description}
- Entity Type: ${entityType}
- Business Context: ${businessContext || 'General business operations'}

🚨 AVAILABLE MODELS - USE ONLY THESE MODEL NAMES AND FIELDS:
${availableModels?.map((m: any) => `
📋 MODEL: ${m.name}
   AVAILABLE FIELDS: ${m.fields?.map((f: any) => `${f.name}(${f.type})`).join(', ') || 'no fields'}
   🚨 CRITICAL: ONLY these fields exist - using any other field will cause runtime errors!
`).join('') || 'No models available'}

🚨 ABSOLUTELY CRITICAL FIELD VALIDATION RULES:
1. ✅ BEFORE writing ANY Prisma query, verify the field exists in the model above
2. ✅ ONLY use field names listed explicitly in the AVAILABLE FIELDS section
3. ❌ NEVER assume common fields like 'status', 'isActive', 'deleted', 'createdAt' exist
4. ❌ NEVER use fields not explicitly listed in the schema above
5. ✅ If you need a field that doesn't exist, use a different approach or skip that filter
6. ✅ Double-check every field name against the exact spelling in the schema
7. ✅ DISTINGUISH between scalar fields and relation fields - NEVER update relation fields directly
8. ❌ NEVER include relation field names (like 'medicationRecords', 'patient', 'doctor') in update data objects

🚨 MANDATORY FIELD VERIFICATION PATTERN:
Before using any field in a Prisma query, add this verification comment:
// FIELD VERIFICATION: Confirmed [fieldName] exists in [ModelName] schema above ✅
// RELATION CHECK: Confirmed [fieldName] is a SCALAR field, not a relation field ✅

🚨 CRITICAL: HOW TO IDENTIFY SCALAR vs RELATION FIELDS:

**SCALAR FIELDS (can be updated directly):**
- String fields: name, description, email, phone, address, etc.
- Number fields: age, price, quantity, score, etc.  
- Boolean fields: isActive, completed, verified, etc.
- DateTime fields: createdAt, updatedAt, startDate, endDate, etc.
- Enum fields: status, type, category, etc.

**RELATION FIELDS (CANNOT be updated directly):**
- Fields ending in plural: medicationRecords, patients, orders, etc.
- Fields referencing other models: patient, doctor, user, campaign, etc.
- Array fields: any field that represents a list of related records

**EXAMPLES FROM YOUR SCHEMA:**

✅ SCALAR FIELDS you CAN update in PatientRecord:
- id, patientId, name, dateOfBirth, medicalHistory, contactInformation

❌ RELATION FIELDS you CANNOT update in PatientRecord:
- medicationRecords (this is a relation to MedicationRecord model)
- weeklyReports (this is a relation to WeeklyReport model)

**CORRECT UPDATE PATTERN:**
await prisma.patientRecord.update({
  where: { id: patientId },
  data: {
    name: newName,           // ✅ Scalar field
    dateOfBirth: newDate,    // ✅ Scalar field  
    medicalHistory: newHistory // ✅ Scalar field
    // ❌ medicationRecords: { ... } // FORBIDDEN! This is a relation field
  }
});

EXAMPLE OF CORRECT FIELD VERIFICATION:
// FIELD VERIFICATION: Confirmed 'prescriptionId' exists in Prescription schema above ✅
const prescriptions = await prisma.prescription.findMany({
  where: {
    prescriptionId: parameters.prescriptionId  // ✅ Field exists in schema
  }
});

// ❌ WRONG - This would cause the exact error you're seeing:
// const prescriptions = await prisma.prescription.findMany({
//   where: {
//     status: "pending"  // ❌ 'status' field doesn't exist in Prescription model!
//   }
// });

🚨 CRITICAL MODEL USAGE RULES:
1. ✅ ONLY use model names listed above (e.g., "User", "AdCampaign", "Report")
2. ✅ Convert to camelCase for Prisma: "AdCampaign" → prisma.adCampaign
3. ❌ NEVER invent model names like "contentModel", "advertisementModel"
4. ❌ NEVER use model names not listed in the AVAILABLE MODELS section above
5. ✅ If a model doesn't exist, skip that operation or use a different approach

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

🎯 PRIMARY SOURCE - PSEUDO STEPS TO IMPLEMENT (USER-EDITED):
${pseudoSteps.map((step: any, index: number) => `
STEP ${index + 1}: ${step.description}
- Type: ${step.type}
${step.model ? `- Database Model: ${step.model} (use prisma.${step.model.charAt(0).toLowerCase() + step.model.slice(1)}.method())` : ''}
- Input Fields: ${step.inputFields?.map((f: any) => `${f.name} (${f.type}${f.required ? ', required' : ', optional'})`).join(', ') || 'None'}
- Output Fields: ${step.outputFields?.map((f: any) => `${f.name} (${f.type}${f.required ? ', required' : ', optional'})`).join(', ') || 'None'}
- Step Implementation: Based on type "${step.type}", implement the appropriate operation
${index === 0 ? `- Can access global parameters: ${extractedInputParams.map((p: any) => `parameters.${p.name}`).join(', ')} (available to all steps)` : step.inputFields?.length > 0 ? `- Uses inputs from previous steps: ${step.inputFields.map((f: any) => `${f.name}`).join(', ')} + any global parameters needed` : ''}
${step.outputFields?.length > 0 ? `- Must produce: ${step.outputFields.map((f: any) => `${f.name}`).join(', ')}` : ''}

🚨 CRITICAL: This step may have been customized by the user - implement EXACTLY as specified above.
`).join('\n')}

DETAILED STEP BREAKDOWN:
${JSON.stringify(pseudoSteps, null, 2)}

REQUIRED INPUT PARAMETERS (from technical specification UI components):
${JSON.stringify(extractedInputParams, null, 2)}

${technicalSpec?.uiComponents && technicalSpec.uiComponents.length > 0 ? `
🎨 UI COMPONENTS FROM TECHNICAL SPECIFICATION:
The technical specification includes ${technicalSpec.uiComponents.length} UI components that define the action's input interface:

${technicalSpec.uiComponents.map((component: any, index: number) => `
Component ${index + 1}: ${component.name}
- Type: ${component.type}
- Label: ${component.label || component.name}
- Required: ${component.required ? 'Yes' : 'No'}
- Description: ${component.description || 'No description'}
${component.databaseModel ? `- Database Model: ${component.databaseModel} (relation field)` : ''}
${component.options ? `- Options: ${component.options.map((opt: any) => opt.value || opt).join(', ')}` : ''}
${component.validation ? `- Validation: ${JSON.stringify(component.validation)}` : ''}
`).join('')}

🚨 CRITICAL: These UI components define the EXACT input parameters available as parameters.* in your code.
The input parameters listed above were extracted from these UI components.
` : `
⚠️ NO UI COMPONENTS FOUND IN TECHNICAL SPECIFICATION
This indicates the technical specification generation may not be working correctly.
Using fallback input parameters from pseudo steps.
`}

BEFORE YOU START - SCHEMA FIELD VERIFICATION:
${prismaSchema ? `
🚨 MANDATORY FIELD VERIFICATION CHECKLIST:
Before writing ANY Prisma query, you MUST complete this checklist:

1. ✅ Identify the model you're querying (e.g., "Prescription", "User", "Order")
2. ✅ Find that model in the AVAILABLE MODELS section above
3. ✅ Check the AVAILABLE FIELDS list for that model
4. ✅ Verify EVERY field you plan to use exists in that list
5. ✅ Add verification comments for each field: // FIELD VERIFICATION: Confirmed 'fieldName' exists ✅

🚨 CRITICAL EXAMPLE - Prescription Model:
If you see this in the available models:
📋 MODEL: Prescription
   AVAILABLE FIELDS: id(String), prescriptionId(String), patientId(String), medicationDetails(String), prescriptionDate(DateTime), doctorId(String)

Then you can ONLY use these fields: id, prescriptionId, patientId, medicationDetails, prescriptionDate, doctorId
❌ You CANNOT use: status, isActive, deleted, createdAt, updatedAt (they don't exist!)

⚠️ CRITICAL WARNING: If you reference ANY field not listed in AVAILABLE FIELDS, the code will fail at runtime with "Unknown argument" errors!

🚨 DOUBLE-CHECK REQUIREMENT:
For every Prisma query you write, ask yourself:
"Does this field exist in the AVAILABLE FIELDS list for this model?"
If the answer is NO or UNSURE, DO NOT use that field!
` : 'No Prisma schema provided - be extra careful with field names'}

CODE GENERATION REQUIREMENTS:

1. EXECUTION CONTEXT:
   The code will be executed directly as an async function with access to global variables:
   
   - prisma: Database operations (prisma.modelName.find(), prisma.modelName.create(), etc.)
   - generateObject: AI operations function (available globally)
   - aiModel: AI model instance (available globally)  
   - parameters: User-provided input parameters (MUST include all parameters from the first step)
   - process.env: Environment variables for external APIs ONLY (do not include NODE_ENV, PORT, or other system variables)
   - actionLogger: ActionExecutionLogger instance for Redis logging (available globally)
   - executionId: Unique execution ID for this action run (available globally)

2. INPUT PARAMETER STRUCTURE:
   CRITICAL: The action's main input parameters are defined by the technical specification UI components.
   These parameters are available as function parameters: input.parameterName
   
   Example: If the technical spec UI components define { scheduledDate, userId, reportType }
   Then ANY step can access them as: input.scheduledDate, input.userId, input.reportType
   Step 1 is just the first execution step - it can use any of the input parameters it needs!

3. INPUT PARAMETER HANDLING:
   ${extractedInputParams.length > 0 ? `
   The code should expect these input parameters (extracted from technical specification UI components):
   ${extractedInputParams.map((param: any) => `
   - input.${param.name}: ${param.type} (${param.required ? 'required' : 'optional'}) - ${param.description}
     ${param.kind === 'object' ? `This is a database relation ID for ${param.relationModel} model` : ''}
     ${param.list ? `⚠️ This is an ARRAY parameter - use { in: input.${param.name} } for database queries` : `⚠️ This is a SINGLE VALUE parameter - use direct comparison input.${param.name} for database queries`}
   `).join('')}
   
   🚨 CRITICAL INPUT PARAMETER SOURCE:
   ${technicalSpec?.uiComponents && technicalSpec.uiComponents.length > 0 ? 
     `✅ These parameters were extracted from ${technicalSpec.uiComponents.length} UI components in the technical specification.` :
     `⚠️ These parameters were extracted from pseudo steps as fallback (technical spec had no UI components).`
   }
   
   🚨 CRITICAL: Always validate required input parameters before processing.
   🚨 CRITICAL: Check if parameters are arrays vs single values before using in Prisma queries.
   🚨 CRITICAL: Convert string parameters to proper types (numbers, dates, etc.) before database operations.
   ` : 'Parameters will be provided as defined in the technical specification UI components.'}

4. CODE STRUCTURE - STEP-BY-STEP IMPLEMENTATION:
   Each pseudo step should be implemented as a distinct code block that:
   - Uses the exact inputFields defined in the step to access data
   - Produces the exact outputFields defined in the step
   - Implements the step type (Database find many, AI analysis, etc.)
   - Passes outputFields from step N as inputFields to step N+1
   - ✅ INCLUDES console.log statements for step input and output data
   
   STEP-BY-STEP CODE PATTERN:
   For each step, implement it as a separate code section with comments:
   // Step 1: [Step Description]
   // Input: [what this step needs - can be global parameters or previous step outputs]
   // Output: [list of output field names]
   console.log('🔄 Step 1: [Step Description]');
   console.log('📥 Step 1 Input:', { inputField1: value1, inputField2: value2 });
   // Implementation based on step type
   console.log('📤 Step 1 Output:', { outputField1: result1, outputField2: result2 });
   
   CRITICAL: Follow the exact data flow defined in pseudo steps:
   - Each step can use global input parameters (parameters.*) as needed
   - Each step can use outputs from previous steps as defined in inputFields
   - Produce all outputFields that are defined for each step
   - Store each step's outputs in variables for use by subsequent steps
   
   DATA FLOW IMPLEMENTATION:
   - Input parameters (from UI components) are available to ALL steps as input.*
   - Step 1 uses whatever input parameters it needs for its specific task
   - Step 2+ can use both input parameters AND outputs from previous steps
   - Store each step's outputs in variables for use by subsequent steps
   - Example: Step 1 uses input.userId, outputs "customerData", Step 2 uses both input.reportType AND customerData
   
   🚨 MANDATORY STEP VARIABLE NAMING PATTERN:
   - Step 1 outputs: step1_outputFieldName (e.g., step1_customerData)
   - Step 2 outputs: step2_outputFieldName (e.g., step2_analysisResult)
   - This ensures clear data flow tracking between steps
   
   🚨 MANDATORY VARIABLE VALIDATION BEFORE ARRAY OPERATIONS:
   For EVERY variable that you call .map(), .filter(), or array methods on, you MUST validate it first:
   
   // ✅ REQUIRED PATTERN before ANY .map() call:
   if (!step1_results || !Array.isArray(step1_results)) {
     console.error(\`❌ Step 1 results validation failed\`, {
       isUndefined: !step1_results,
       isArray: Array.isArray(step1_results),
       actualType: typeof step1_results
     });
     throw new Error(\`Step 1 results are not available or not an array\`);
   }
   
   // Now safe to use array methods
   const processedResults = step1_results.map(item => processItem(item));
   
   🚨 CRITICAL VARIABLE FLOW RULES:
   1. ✅ ALWAYS define variables before using them
   2. ✅ Use the EXACT output field names from the pseudo step definition
   3. ✅ Check if variables exist before accessing them
   4. ✅ Log variable values to verify they're defined correctly
   5. ❌ NEVER assume a variable exists without defining it first
   6. ✅ ALWAYS validate that variables are defined before calling methods like .map()
   7. ✅ Provide fallback values for undefined variables
   8. ✅ Handle empty arrays and null values gracefully
   
   🚨 MANDATORY STEP LOGGING PATTERN:
   For each step, include these exact console.log statements:
   
   // Step N: [Description]
   console.log(\`🔄 Step N: [Description]\`);
   console.log(\`📥 Step N Input:\`, { 
     inputField1: input.inputField1 || 'undefined',
     inputField2: previousStepOutput || 'undefined'
   });
   
   // ... step implementation ...
   
   console.log(\`📤 Step N Output:\`, { 
     outputField1: stepN_outputField1,
     outputField2: stepN_outputField2,
     recordCount: results?.length || 0
   });
   
   🚨 CRITICAL: Use template literals (\`backticks\`) instead of single quotes for console.log to avoid syntax errors with apostrophes.
   This logging helps debug data flow and identify where errors occur.
   
   🚨 CRITICAL: NO HARDCODED VALUES ALLOWED:
   Your generated code must NEVER contain hardcoded values. ALWAYS use input parameters or generate values dynamically:
   
   ❌ FORBIDDEN HARDCODED EXAMPLES:
   - authorId: "user123"
   - campaignId: "campaign1" 
   - status: "ACTIVE"
   - name: "Test Campaign"
   - email: "test@example.com"
   - date: "2023-01-01"
   - quantity: 100
   - Any specific IDs, names, dates, or values
   
   ✅ CORRECT DYNAMIC EXAMPLES:
   - authorId: input.authorId
   - campaignId: input.campaignId
   - status: input.status
   - name: input.name
   - email: input.email
   - date: input.date || new Date().toISOString()
   - quantity: input.quantity || 0
   - Use input parameters or generate values dynamically
   
   🚨 CRITICAL INPUT PARAMETER VALIDATION PATTERN:
   Before using ANY input parameter, validate it exists and has a valid value:
   
   // ✅ CORRECT: Validate input parameters before use and provide dynamic defaults
   const startDate = input.startDate || new Date().toISOString();
   const endDate = input.endDate || new Date().toISOString();
   
   if (!input.patientId) {
     console.error(\`❌ Required parameter patientId is missing\`);
     throw new Error(\`Required parameter patientId is missing\`);
   }
   
   // ❌ WRONG: Using parameters without validation OR hardcoded values
   // const records = await db.model.findMany({
   //   where: { 
   //     startDate: { gte: input.currentWeekStartDate }, // ❌ might be undefined!
   //     status: "ACTIVE" // ❌ hardcoded value!
   //   }
   // });
   
   // ✅ CORRECT: Use validated parameters with dynamic defaults
   const records = await db.model.findMany({
     where: { 
       startDate: { gte: startDate }, // ✅ validated with fallback
       status: input.status || 'pending' // ✅ dynamic with fallback
     }
   });
   
   🚨 CRITICAL ARRAY VALIDATION PATTERN:
   Before calling .map(), .filter(), or any array method, validate the variable:
   
   // ✅ CORRECT: Validate arrays before using array methods
   if (!step1_results || !Array.isArray(step1_results)) {
     console.error(\`❌ Step 1 results validation failed\`, {
       isUndefined: !step1_results,
       isArray: Array.isArray(step1_results),
       actualType: typeof step1_results,
       actualValue: step1_results
     });
     throw new Error(\`Step 1 results are not available or not an array\`);
   }
   
   const processedResults = step1_results.map(item => processItem(item)); // ✅ Safe to use .map()
   
   // ❌ WRONG: Calling .map() without validation
   // const processedResults = step1_results.map(item => processItem(item)); // ❌ Will crash if undefined!
   
   🚨 EXAMPLE OF CORRECT STEP IMPLEMENTATION WITH VARIABLE FLOW AND ERROR PREVENTION:
   
   // Step 1: Fetch active campaigns
   console.log(\`🔄 Step 1: Fetch active campaigns\`);
   console.log(\`📥 Step 1 Input:\`, { 
     status: input.status || 'undefined',
     batchSize: convertedParams.batchSize || 'undefined'
   });
   
   // Define step 1 output variables (use exact names from pseudo step outputFields)
   const step1_activeCampaigns = await db.adCampaign.findMany({
     where: { status: input.status },
     take: convertedParams.batchSize
   });
   
   // ✅ CRITICAL: Validate step 1 outputs exist and are arrays
   if (!step1_activeCampaigns || !Array.isArray(step1_activeCampaigns)) {
     console.error(\`❌ Step 1 validation failed: activeCampaigns is not a valid array\`, { 
       isUndefined: !step1_activeCampaigns,
       isArray: Array.isArray(step1_activeCampaigns),
       actualType: typeof step1_activeCampaigns,
       actualValue: step1_activeCampaigns
     });
     throw new Error(\`Step 1 failed: activeCampaigns is not available or not an array\`);
   }
   
   console.log(\`📤 Step 1 Output:\`, { 
     activeCampaigns: step1_activeCampaigns.length,
     campaignIds: step1_activeCampaigns.map(c => c.id)
   });
   
   // Step 2: Generate reports for campaigns  
   console.log(\`🔄 Step 2: Generate reports for campaigns\`);
   console.log(\`📥 Step 2 Input:\`, { 
     activeCampaigns: step1_activeCampaigns?.length || 0,
     campaignIds: step1_activeCampaigns?.map(c => c.id) || []
   });
   
   // ✅ CRITICAL: Validate step 2 inputs exist (from step 1 outputs)
   if (!step1_activeCampaigns || !Array.isArray(step1_activeCampaigns)) {
     console.error(\`❌ Step 2 validation failed: step1_activeCampaigns is not available\`, {
       isUndefined: !step1_activeCampaigns,
       isArray: Array.isArray(step1_activeCampaigns),
       length: step1_activeCampaigns?.length || 0
     });
     throw new Error(\`Step 2 failed: step1_activeCampaigns is not available or not an array\`);
   }
   
   // ✅ Handle empty results gracefully
   if (step1_activeCampaigns.length === 0) {
     console.log(\`⚠️ Step 2: No campaigns found, skipping report generation\`);
     const step2_reports = []; // Empty array for consistent data flow
     console.log(\`📤 Step 2 Output:\`, { reportsGenerated: 0, reportIds: [] });
   } else {
     // Define step 2 output variables (use exact names from pseudo step outputFields)
     const step2_reports = step1_activeCampaigns.map(campaign => ({
       campaignId: campaign.id,
       reportData: generateReportData(campaign)
     }));
     
     console.log(\`📤 Step 2 Output:\`, { 
       reportsGenerated: step2_reports.length,
       reportIds: step2_reports.map(r => r.campaignId)
     });
   }

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

   🚨 CRITICAL PRISMA updateMany/deleteMany RETURN VALUES:
   
   **EXTREMELY IMPORTANT**: updateMany and deleteMany operations DO NOT return arrays of records!
   They return objects with a 'count' property indicating how many records were affected.
   
   ❌ WRONG - This WILL cause ".map is not a function" errors:
   const updatedRecords = await prisma.content.updateMany({
     where: { status: 'Draft' },
     data: { status: 'Published' }
   });
   const recordIds = updatedRecords.map(record => record.id); // ❌ ERROR! updatedRecords is not an array
   
   ✅ CORRECT - Handle updateMany/deleteMany results properly:
   const updateResult = await prisma.content.updateMany({
     where: { status: 'Draft' },
     data: { status: 'Published' }
   });
   // updateResult = { count: 3 } (number of records updated)
   
   console.log(\`📤 Step Output:\`, { 
     recordsUpdated: updateResult.count,
     operation: 'updateMany'
   });
   
   // If you need the actual updated records, use findMany BEFORE the update:
   const recordsToUpdate = await prisma.content.findMany({
     where: { status: 'Draft' },
     select: { id: true } // Only get IDs for efficiency
   });
   
   const updateResult = await prisma.content.updateMany({
     where: { status: 'Draft' },
     data: { status: 'Published' }
   });
   
   const updatedRecordIds = recordsToUpdate.map(record => record.id);
   
   **MANDATORY PATTERN FOR updateMany/deleteMany OPERATIONS:**
   1. ✅ NEVER call .map(), .filter(), or array methods on updateMany/deleteMany results
   2. ✅ Access the 'count' property to get number of affected records
   3. ✅ If you need record data, query BEFORE the update/delete operation
   4. ✅ Log the count, not the full result object
   5. ✅ Use descriptive variable names like 'updateResult' or 'deleteResult', not 'updatedRecords'

   🚨 CRITICAL FOREIGN KEY CONSTRAINT PREVENTION:
   When creating records with foreign key relationships, you MUST:
   1. ✅ ALWAYS validate that foreign key values reference existing records
   2. ✅ Use parameters.userId, parameters.authorId, etc. from user input
   3. ✅ Check if the referenced record exists before creating
   4. ❌ NEVER hardcode foreign key values like authorId: "user123"
   5. ❌ NEVER generate random IDs for foreign key fields
   6. ❌ NEVER create records with foreign keys to non-existent records

   🚨 CRITICAL RELATION FIELD HANDLING:
   When working with Prisma relations, you MUST follow these rules:
   
   ❌ NEVER UPDATE RELATION FIELDS DIRECTLY:
   // This will cause "Unknown argument medicationRecords" errors:
   await prisma.patientRecord.update({
     where: { id: patientId },
     data: {
       medicationRecords: { push: { ... } } // ❌ FORBIDDEN! Relations can't be updated this way
     }
   });
   
   ✅ CORRECT APPROACHES FOR RELATIONS:
   
   **Option 1: Update only scalar fields**
   await prisma.patientRecord.update({
     where: { id: patientId },
     data: {
       name: updatedName,
       dateOfBirth: updatedDate,
       // Only include scalar fields, NO relation fields
     }
   });
   
   **Option 2: Create related records separately**
   // First update the main record
   await prisma.patientRecord.update({
     where: { id: patientId },
     data: { name: updatedName }
   });
   
   // Then create related records separately
   await prisma.medicationRecord.create({
     data: {
       patientId: patientId, // Foreign key reference
       medicationName: newMedication.name,
       dosage: newMedication.dosage
     }
   });
   
   **Option 3: Use connect/disconnect for existing relations**
   await prisma.patientRecord.update({
     where: { id: patientId },
     data: {
       medicationRecords: {
         connect: { id: existingMedicationId } // Connect to existing record
       }
     }
   });
   
   🚨 FORBIDDEN RELATION PATTERNS:
   ❌ medicationRecords: { push: ... }
   ❌ medicationRecords: { create: ... } (in update operations)
   ❌ medicationRecords: [{ ... }] (array of objects)
   ❌ medicationRecords: "string value"
   ❌ Any relation field name in update data object

   **CORRECT FOREIGN KEY PATTERN:**
   // Validate the foreign key exists first
   if (input.authorId) {
     const authorExists = await prisma.user.findUnique({
       where: { id: input.authorId }
     });
     if (!authorExists) {
       throw new Error(\`Author with ID \${input.authorId} does not exist\`);
     }
   }

   // Create record with validated foreign key (or without if not provided)
   const contentData = {
     title: input.title,      // ✅ Use input parameters
     body: input.body,        // ✅ Use input parameters
     status: input.status     // ✅ Use input parameters
   };
   
   // Only add foreign key if provided and validated
   if (input.authorId) {
     contentData.authorId = input.authorId;
   }
   
   const content = await prisma.contentModel.create({
     data: contentData  // ✅ Uses processed data with input parameters
   });

   🚨 ALTERNATIVE PATTERN - Create without foreign keys:
   // If foreign key relationships are complex, create records independently
   const content = await prisma.contentModel.create({
     data: {
       title: input.title,      // ✅ Use input parameters
       body: input.body,        // ✅ Use input parameters
       status: input.status     // ✅ Use input parameters
       // Note: No authorId - relationship can be established later if needed
     }
   });

   **WRONG PATTERNS THAT CAUSE FOREIGN KEY ERRORS:**
   ❌ const content = await prisma.contentModel.create({
        data: {
          authorId: "hardcoded-id", // Hardcoded - will fail if user doesn't exist
          title: "hardcoded title" // Hardcoded - should use parameters
        }
      });

   ❌ const content = await prisma.contentModel.create({
        data: {
          authorId: generateRandomId(), // Random ID - will fail constraint
          status: "ACTIVE" // Hardcoded enum - should use parameters
        }
      });
   
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
   
   EXAMPLES OF CORRECT DATABASE USAGE:
   // Find multiple water intake records - ONLY use fields that exist in the schema
   const batchSize = parseInt(input.batchSize || '50', 10);
   const page = parseInt(input.page || '0', 10);
   const waterIntakeRecords = await db.waterIntake.findMany({
     where: {
       userId: input.userId,  // ✅ userId exists in WaterIntake model
       date: { gte: input.startDate, lte: input.endDate }  // ✅ date exists in WaterIntake model
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
   const sleepPatterns = await db.sleepPattern.findMany({
     where: { 
       userId: input.userId,  // ✅ userId exists in SleepPattern model
       sleepStartTime: { gte: input.startDate }  // ✅ sleepStartTime exists in SleepPattern model
     }
   });
   
   // Create a new health report
   const healthReport = await db.healthReport.create({
     data: {
       userId: input.userId, // Use the provided userId parameter
       reportDate: new Date(),
       waterIntakeSummary: analysisResult.waterIntakeSummary,
       workoutSummary: analysisResult.workoutSummary,
       sleepSummary: analysisResult.sleepSummary
     }
   });

   🚨 CRITICAL FOREIGN KEY HANDLING:
   When creating records with foreign key relationships:
   - ✅ ALWAYS use input parameters for foreign key values: userId: input.userId
   - ❌ NEVER hardcode foreign key values: userId: "user123"
   - ✅ Validate foreign key parameters exist before creating records
   - ✅ Use existing IDs from previous steps or user input
   - ❌ NEVER generate random IDs for foreign keys - they must reference existing records
   
   // 🚨 ID GENERATION WARNING:
   // DO NOT use cuid() - it's not available in the runtime environment
   // For auto-generated IDs, let Prisma handle it (omit the ID field) or use:
   // - crypto.randomUUID() for UUID v4
   // - Date.now().toString() + Math.random().toString(36).substr(2, 9) for simple unique strings
   
   // Update multiple workout logs
   const updatedLogs = await db.workoutLog.updateMany({
     where: { userId: input.userId, status: 'pending' },
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
   
   // 🚨 CRITICAL: ALWAYS validate AI single object results before using them
   if (!object) {
     console.error(\`❌ AI generation failed - no object returned\`);
     throw new Error(\`AI analysis failed to return valid results\`);
   }
   
   // 🚨 CRITICAL: If AI object contains arrays, validate them before .map()
   if (object.recommendations && !Array.isArray(object.recommendations)) {
     console.error(\`❌ AI returned invalid recommendations array\`, {
       actualType: typeof object.recommendations,
       actualValue: object.recommendations
     });
     object.recommendations = []; // Fallback to empty array
   }
   
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
   
   // 🚨 CRITICAL: ALWAYS validate AI results before using them
   if (!arrayResult || !Array.isArray(arrayResult)) {
     console.error(\`❌ AI generation failed or returned invalid data\`, {
       isUndefined: !arrayResult,
       isArray: Array.isArray(arrayResult),
       actualType: typeof arrayResult,
       actualValue: arrayResult
     });
     // Provide fallback or throw error
     const arrayResult = []; // Empty array fallback
     // OR: throw new Error(\`AI generation failed to return valid array\`);
   }
   
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

9. ERROR HANDLING AND LOGGING:
   🚨 MANDATORY ERROR LOGGING PATTERN:
   
   try {
     // Step implementations with logging...
   } catch (error) {
     console.error(\`🚨 Action execution error:\`, error);
     console.error(\`🔍 Error details:\`, {
       errorMessage: error.message,
       errorStack: error.stack,
       actionName: '${name}',
       parametersReceived: Object.keys(parameters || {}),
       stepInProgress: \`Identify which step was executing when error occurred\`
     });
     return {
       success: false,
       data: null,
       message: \`Action execution failed: \${error.message || 'Unknown error'}\`,
       executionTime: Date.now() - startTime
     };
   }

   🚨 CRITICAL SYNTAX RULE: Use template literals (\`backticks\`) for ALL console.log and error messages to prevent syntax errors from apostrophes and quotes.

9. ENVIRONMENT VARIABLES:
   🚨🚨🚨 CRITICAL: DEFAULT TO ZERO ENVIRONMENT VARIABLES 🚨🚨🚨
   
   **MANDATORY DEFAULT: envVars: []**
   
   99% of business actions work perfectly with just:
   - Database operations (db.modelName.method())
   - AI operations (ai.generateObject())
   - Internal calculations and transformations
   
   🚨 ABSOLUTELY FORBIDDEN ENVIRONMENT VARIABLES:
   - API_KEY (too generic)
   - EMAIL_API_KEY, EMAIL_API_BASE_URL (too generic)
   - NOTIFICATION_API_KEY, NOTIFICATION_API_URL (too generic)  
   - SMS_API_KEY, PAYMENT_API_KEY (too generic)
   - UI_API_ENDPOINT, UI_API_KEY, API_ENDPOINT (too generic)
   - EXTERNAL_API_URL, THIRD_PARTY_API_KEY (too generic)
   - SERVICE_API_KEY, PLATFORM_API_URL (too generic)
   - Any environment variable with action names in it
   - Any environment variable longer than 50 characters
   - Any environment variable with periods, hyphens, or spaces
   
   🚨 ONLY GENERATE ENVIRONMENT VARIABLES IF:
   1. User explicitly mentioned a specific service by name (Stripe, SendGrid, etc.)
   2. AND the action description specifically mentions integrating with that service
   3. AND it's not an OAuth service (Gmail, Slack, Facebook, etc.)
   
   VALID EXAMPLES (ONLY if explicitly mentioned):
   - STRIPE_API_KEY (only if user said "integrate with Stripe")
   - SENDGRID_API_KEY (only if user said "send emails via SendGrid")
   - TWILIO_API_KEY (only if user said "send SMS via Twilio")
   
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
   - "UI_API_ENDPOINT" ← Too generic, not a specific service
   - "UI_API_KEY" ← Too generic, not a specific service
   - "API_ENDPOINT" ← Too generic, not a specific service
   - "EXTERNAL_API_URL" ← Too generic, not a specific service
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
   
   🚨🚨🚨 MANDATORY DEFAULT APPROACH: EMPTY ENVIRONMENT VARIABLES ARRAY 🚨🚨🚨
   
   **YOUR DEFAULT RESPONSE MUST BE:**
   - envVars: [] (empty array)
   - NOT envVars: null or undefined
   - NOT envVars: [{"name": "API_KEY", ...}]
   
   Unless the user explicitly mentioned a specific external service by name, generate ZERO environment variables.
   Most actions can work with just the database and AI - don't assume external APIs are needed.
   
   🚨 ABSOLUTE RULE: NEVER GENERATE DATABASE_URL OR ANY SYSTEM VARIABLES
   The system automatically provides: DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, AI_MODEL_PROVIDER, AI_MODEL_NAME, NEXTAUTH_SECRET, CRON_SECRET
   NEVER EVER generate these in your envVars array.
   
   🚨 FINAL ENV VAR VALIDATION CHECKLIST:
   Before generating ANY environment variable, ask yourself:
   1. Did the user explicitly mention a specific service by name? (not "API" or "external service")
   2. Is this service NOT OAuth-based? (OAuth services don't need env vars)
   3. Is this NOT a system-provided variable?
   4. Is the name shorter than 50 characters?
   5. Does the name contain ONLY letters, numbers, and underscores?
   
   If ANY answer is NO, then DON'T generate that environment variable.
   
   AUTHENTICATION METHOD REFERENCE:
   - OAuth APIs (no env vars needed): Gmail, Slack, Shopify, Facebook, LinkedIn, Instagram, Google Calendar, Microsoft Teams, Notion, Salesforce, HubSpot
   - System-provided APIs (no env vars needed): OpenAI, Anthropic, Grok (AI providers)
   - Third-party API Key APIs (env vars needed ONLY if specifically mentioned): Stripe, SendGrid, Twilio, specific custom APIs

9. FUNCTION SIGNATURE AND GLOBALS:
   Your generated function receives these parameters directly (NOT as globals):
   - db: Database interface with methods like db.user.findMany(), db.user.create(), etc.
   - input: User input parameters (access as input.parameterName)
   - envVars: Environment variables (access as envVars.VARIABLE_NAME)
   - testMode: Boolean indicating test mode
   - actionLogger: ActionExecutionLogger instance for Redis logging
   - executionId: Unique execution ID for this action run
   - console: Console logging interface
   - generateId: ID generation function
   - formatDate: Date formatting function
   - validateRequired: Field validation function
   - ai: AI interface for generateObject operations
   - z: Zod schema validation library
   
   🚨 CRITICAL PARAMETER USAGE:
   - Database operations: Use db.modelName.method() (NOT prisma.modelName.method())
   - Input parameters: Use input.parameterName (NOT parameters.parameterName)
   - Redis logging: Use actionLogger and executionId directly (these are correct)
   - AI operations: Use ai.generateObject() (NOT generateObject())
   
   CORRECT USAGE EXAMPLES:
   ✅ const users = await db.user.findMany({ where: { id: input.userId } });
   ✅ await actionLogger.startStep(executionId, 1, 'Fetch users', { userId: input.userId });
   ✅ const result = await ai.generateObject({ model, schema, messages });
   
   WRONG USAGE (DO NOT DO THIS):
   ❌ const users = await prisma.user.findMany({ where: { id: parameters.userId } });
   ❌ await actionLogger.startStep(executionId, 1, 'Fetch users', { userId: parameters.userId });
   ❌ const result = await generateObject({ model, schema, messages });
   
   🚨 CRITICAL FUNCTION SIGNATURE:
   Your function MUST use this EXACT signature with destructured parameters:
   
   async function actionName({ db, input, envVars, testMode, actionLogger, executionId, console, generateId, formatDate, validateRequired, ai, z }) {
     // Your code here
     return { success: boolean, data: any, message: string, executionTime: number };
   }
   
   The function will be called with a single object containing all parameters as named properties.

Generate production-ready, executable JavaScript code that implements the business logic described in the pseudo steps and properly uses the input parameters.

🚨 FINAL VALIDATION CHECKLIST - Your code MUST pass these checks:

1. **Input Parameter Validation**: MUST include the input validation code provided above:
   - ✅ COPY the validateInputParameters function from above EXACTLY - do not modify it
   - ✅ PASTE the validation code at the start of your function without changes
   - ✅ CALL validateInputParameters(parameters) before any database operations
   - ✅ RETURN early if validation fails - do not continue with database operations
   - ❌ NEVER create your own validation logic for enum fields
   - ❌ NEVER generate lines like "const validEnumValues_status = ['DRAFT', 'APPROVED']"
   - ❌ NEVER ignore the provided validation code

1.5. **Missing Parameter Handling**: MUST handle undefined input parameters gracefully:
   - ✅ BEFORE using input.parameterName, check if it exists: if (!input.parameterName) { ... }
   - ✅ PROVIDE fallback values: const startDate = input.startDate || new Date().toISOString()
   - ✅ VALIDATE required parameters exist before database queries
   - ❌ NEVER assume input parameters exist without checking
   - ❌ NEVER use input.undefinedParameter in database queries

2. **Step Logging**: MUST include console.log statements for each step:
   - ✅ Log step start: console.log('🔄 Step N: [Description]')
   - ✅ Log step input: console.log('📥 Step N Input:', { inputData })
   - ✅ Log step output: console.log('📤 Step N Output:', { outputData, recordCount })
   - ✅ Include data counts, IDs, and key results in logs
   - ✅ This helps debug data flow and identify where errors occur

3. **Enum Field Validation**: For any field that uses enum types:
   - NEVER pass empty strings ("") to enum fields
   - ALWAYS validate enum values before database operations  
   - Use conditional logic to skip enum filters if values are invalid
   - Provide meaningful default values or omit the field entirely

4. **Parameter Type Validation**: For each input parameter used in Prisma queries:
   - If parameter is marked as array/list: MUST use { in: paramValue }
   - If parameter is single value: MUST use direct comparison paramValue
   - NEVER mix these up or you'll get runtime errors

5. **Prisma Query Structure**: Every database query must:
   - ✅ ONLY use model names from the AVAILABLE MODELS section above
   - ✅ Convert model names to camelCase: "AdCampaign" → prisma.adCampaign
   - ❌ NEVER invent model names like "contentModel", "advertisementModel"
   - ✅ Use only fields that exist in the model schema
   - ✅ Use correct array vs single value syntax
   - ✅ Handle nullable fields appropriately
   - ✅ Build where clauses conditionally to avoid empty/invalid values

6. **Variable Flow Validation**: Your code must prevent missing variables:
   - ✅ DEFINE all step output variables using exact outputField names from pseudo steps
   - ✅ VALIDATE that step outputs exist before using them in next steps
   - ✅ CHECK if variables are defined: if (!variable) throw new Error('Variable undefined')
   - ✅ USE optional chaining: variable?.property instead of variable.property
   - ✅ PROVIDE fallbacks: variable || defaultValue
   - ✅ VALIDATE arrays before .map(): if (!Array.isArray(variable)) throw new Error('Not an array')
   - ✅ HANDLE AI generation failures: if (!aiResult) { console.error('AI failed'); return fallback; }
   - ❌ NEVER assume a variable from previous step exists without checking
   - ❌ NEVER call .map() on variables that might be undefined
   - ❌ NEVER assume AI generateObject calls succeed

7. **Error Prevention**: Your code should:
   - Validate input parameters before using them
   - Handle edge cases (empty arrays, null values, empty strings, etc.)
   - Use defensive programming practices
   - Build database queries conditionally based on parameter validity
   - ✅ ALWAYS check if variables are arrays before calling .map()
   - ✅ Use Array.isArray(variable) before variable.map()
   - ❌ NEVER assume a variable is an array without checking

CRITICAL: The user has reported these exact errors that your code MUST prevent:
1. "Invalid value for argument status. Expected StatusEnum" - caused by empty strings in enum fields
2. "Argument take: Invalid value provided. Expected Int, provided String" - caused by string values in numeric fields
3. "i.platforms.map is not a function" - caused by calling .map() on non-array variables
4. "Expected ',', got 's'" - caused by unescaped apostrophes in console.log('campaign's data') statements
5. "Foreign key constraint violated on the constraint: ContentModel_authorId_fkey" - caused by hardcoded foreign key values that don't exist
6. "TypeError: (intermediate value).map is not a function" - caused by calling .map() on updateMany/deleteMany results which return { count: number }, not arrays
7. "Unknown argument status. Available options are marked with ?" - caused by using fields that don't exist in the model schema
8. "Unknown argument medicationRecords. Available options are marked with ?" - caused by trying to update relation fields directly in Prisma update operations

🚨 CRITICAL FIELD VALIDATION ERROR PREVENTION:
The error "Unknown argument status" occurs when you use a field that doesn't exist in the Prisma model.
ALWAYS verify field existence before using in queries:

❌ WRONG - This causes "Unknown argument" errors:
const prescriptions = await prisma.prescription.findMany({
  where: {
    status: "pending"  // ❌ 'status' field doesn't exist in Prescription model!
  }
});

✅ CORRECT - Only use fields that exist in the schema:
// FIELD VERIFICATION: Confirmed 'prescriptionId' exists in Prescription schema above ✅
const prescriptions = await prisma.prescription.findMany({
  where: {
    prescriptionId: parameters.prescriptionId  // ✅ Field exists in schema
  }
});

🚨 MANDATORY ERROR PREVENTION PATTERNS:
✅ CORRECT array handling:
if (Array.isArray(someVariable)) {
  const results = someVariable.map(item => processItem(item));
} else {
  console.warn(\`Expected array but got: \${typeof someVariable}\`);
  const results = [];
}

❌ WRONG array handling:
const results = someVariable.map(item => processItem(item)); // Will crash if not array

✅ CORRECT string literals (prevents syntax errors):
console.log(\`🔄 Step 1: Find campaign's target audience\`);
throw new Error(\`Step failed: user's data is invalid\`);

❌ WRONG string literals (causes syntax errors):
console.log('🔄 Step 1: Find campaign's target audience'); // Breaks on apostrophe
throw new Error('Step failed: user's data is invalid'); // Breaks on apostrophe

Your generated code MUST:
- Include the provided validation code exactly as given
- Validate enum values before using them in Prisma queries
- Convert string parameters to proper types (integers, dates, booleans) before database operations
- Use parseInt() for take/skip parameters and parseFloat() for numeric comparisons
- Check Array.isArray() before calling .map() on any variable
- NEVER call .map() on updateMany/deleteMany results - they return { count: number }, not arrays
- Use template literals (\`backticks\`) for ALL console.log statements and error messages to prevent syntax errors
- Validate foreign key existence before creating records with relationships
- NEVER hardcode foreign key values - always use parameters or existing record IDs

🚨 FINAL VALIDATION CHECKLIST: Before submitting your code, verify that:
1. ✅ ALL console.log statements use template literals: console.log(\`message\`)
2. ✅ ALL error messages use template literals: throw new Error(\`message\`)
3. ✅ NO single quotes around strings that might contain apostrophes
4. ✅ ALL dynamic content uses \${variable} syntax within template literals
5. ✅ ALL foreign key fields use input parameters or validated existing IDs
6. ✅ NO hardcoded foreign key values like authorId: "user123"
7. ✅ Foreign key existence is validated before creating related records
8. ✅ NO .map() calls on updateMany/deleteMany results - use result.count instead
9. ✅ NO hardcoded values anywhere - all data comes from input parameters or dynamic generation
10. ✅ NO relation fields in update data objects - only scalar fields
11. ✅ ALL arrays validated before calling .map(), .filter(), or array methods
12. ✅ ALL AI-generated results validated before using (check for undefined/null)`;

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

🚨 CRITICAL IMPLEMENTATION REQUIREMENTS:

1. **Respect User Customizations**: The pseudo steps may have been edited by the user in the UI
   - ✅ Follow the EXACT step descriptions provided
   - ✅ Use the EXACT input/output fields specified
   - ✅ Use the EXACT step types specified
   - ✅ Use the EXACT model names specified in each step
   - ❌ NEVER modify or "improve" the user's step definitions

2. **Step Implementation Rules**:
   - For each pseudo step, create a clearly commented code section with logging
   - STEP 1 SPECIAL RULE: Step 1 inputs are the action's main input parameters (parameters.paramName)
   - STEP 2+ RULE: Use outputs from previous steps as inputs
   - Produce all the outputFields defined for each step  
   - Pass step outputs as inputs to subsequent steps using clear variable names
   - Follow the exact step type implementation (Database find many, AI analysis, etc.)
   - Handle the data flow between steps using the defined input/output structure

3. **User Edit Preservation**:
   - If user specified a model name, use that exact model name
   - If user specified field names, use those exact field names
   - If user customized the step description, implement exactly what they described
   - The technical specification is just context - the pseudo steps are authoritative

Generate production-ready code that follows the user-edited pseudo steps exactly and handles all input parameters correctly.`
      }
    ],
    temperature: 0.2,
  });

  // Sanitize environment variable names - ensure all required properties are present
  const validatedEnvVars = (result.object.envVars || []).map(envVar => ({
    name: envVar.name || '',
    description: envVar.description || '',
    required: envVar.required ?? false,
    sensitive: envVar.sensitive ?? false
  })).filter(envVar => envVar.name.trim() !== ''); // Remove any with empty names
  
  const envVarSanitization = sanitizeEnvironmentVariables(validatedEnvVars);
  
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
 * Complete action generation workflow - STREAMLINED 2-step flow: Technical Spec (with UI) → Pseudo Steps → Code
 * Technical specification now includes UI components, eliminating the separate UI generation step
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
  externalApis?: any[],
  availableEnums?: any[]
): Promise<any> {
  console.log(`🚀 Generating complete action using STREAMLINED 2-step flow: ${actionSpec.name}`);
  console.log(`📋 Streamlined Pattern: 1) Generate Technical Spec (with UI) → 2) Generate Pseudo Steps → 3) Generate Code`);

  const actionName = actionSpec.name;
  const actionTitle = actionSpec.title || actionSpec.name;
  const actionDescription = actionSpec.purpose || actionSpec.description || '';

  try {
    // Step 1: Generate Technical Specification (includes UI components)
    console.log(`📋 Step 1/3: Generating technical specification with UI components...`);
    const technicalSpec = await generateTechnicalSpecification(
      actionName,
      actionDescription,
      businessContext,
      availableModels,
      prismaSchema,
      externalApis,
      availableEnums
    );
    
    console.log(`✅ Step 1/3 complete: Generated technical specification with ${technicalSpec.uiComponents?.length || 0} UI components`);
    
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
    
    // UI Components are now included in the technical specification (Step 1)
    console.log(`🎨 Using UI components from technical specification...`);
    const uiComponents = technicalSpec.uiComponents || [];
    
    console.log(`✅ UI Components: Using ${uiComponents.length} components from technical specification`);
    
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
      technicalSpec, // Pass technical spec as primary implementation guide
      availableEnums // Pass the top-level enums array for proper validation
    );
    
    console.log(`✅ Step 3/3 complete: Generated ${codeResult.code.length} chars of executable code`);
    
    // Assemble complete action with all components
    const completeAction: any = {
      id: actionSpec.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName, // Code-safe name for API endpoints
      title: actionTitle, // Human-readable name for UI display
      description: actionDescription,
      role: actionSpec.role || 'member',
      
      // Step 1 results: Technical Specification (includes UI components)
      technicalSpecification: technicalSpec,
      
      // Step 2 results: Pseudo Steps
      pseudoSteps: pseudoSteps,
      
      // UI Components (from technical specification)
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
    
    console.log(`🎉 Complete action generated using streamlined 2-step flow: ${actionName}`);
    return completeAction;
    
  } catch (error) {
    console.error(`❌ Failed to generate complete action using streamlined flow: ${actionName}`, error);
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

UPDATED TECHNICAL SPECIFICATION (Architecture Context):
${updatedSpec.architectureOverview}

AVAILABLE PRISMA SCHEMA:
${updatedSpec.availablePrismaSchema}

DATA FLOW STRATEGY:
${updatedSpec.dataFlowStrategy}

DATABASE INTEGRATION:
${updatedSpec.databaseIntegration}

ERROR HANDLING STRATEGY:
${updatedSpec.errorHandlingStrategy}

This updated technical specification provides architectural context to guide pseudo step generation.`;

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

/**
 * NEW MIGRATION APPROACH: Generate pseudo steps directly from Step 0 analysis
 * Replaces the complex technical specification approach
 */
export async function generatePseudoStepsFromStep0(
  step0Analysis: any,
  targetModel: string,
  actionPurpose: string,
  availableModels: any[] = [],
  availableEnums: any[] = []
): Promise<any[]> {
  console.log(`🚀 NEW MIGRATION: Generating pseudo steps directly from Step 0 for ${targetModel}.${actionPurpose}`);
  
  const model = await getAgentBuilderModel();
  
  // Find the target model details
  const modelDetails = availableModels.find(m => m.name === targetModel);
  if (!modelDetails) {
    throw new Error(`Target model ${targetModel} not found in available models`);
  }
  
  // Extract business context from Step 0
  const businessContext = step0Analysis.phaseAAnalysis?.userRequestAnalysis?.mainGoal || 
                         step0Analysis.agentDescription || 
                         'Business operations';
  
  // Extract related models for context
  const relatedModels = availableModels.filter(m => m.name !== targetModel);
  
  const systemPrompt = `You are a database and AI operations architect designing focused pseudo steps for single-record processing.

🎯 MIGRATION APPROACH: One Action = One Model + One Record

TARGET MODEL: ${targetModel}
Available Fields: ${modelDetails.fields?.map((f: any) => `${f.name}:${f.type}`).join(', ') || 'no fields'}

RELATED MODELS (for context/relations):
${relatedModels.map(m => `- ${m.name}: ${m.fields?.map((f: any) => `${f.name}:${f.type}`).join(', ') || 'no fields'}`).join('\n')}

AVAILABLE ENUMS:
${availableEnums.map(e => `- ${e.name}: [${e.fields?.map((f: any) => f.name).join(', ') || 'no values'}]`).join('\n') || 'No enums available'}

BUSINESS CONTEXT: ${businessContext}
ACTION PURPOSE: ${actionPurpose}

🚨 CRITICAL REQUIREMENTS:

1. **SINGLE RECORD PROCESSING**: This action processes exactly ONE record of ${targetModel} at a time
2. **DYNAMIC INPUT FIELDS**: Input fields can be from other models, external APIs, or none at all
3. **FLEXIBLE DATA SOURCES**: Determine what external data is needed based on action purpose

🔧 NEW STEP TYPES AVAILABLE (NO DATABASE OPERATIONS):
- 'ai_generate_object': Generate structured data, output fields save automatically
- 'ai_generate_text': Generate text content, output fields save automatically
- 'ai_generate_text_websearch': Generate text with web search, output fields save automatically
- 'ai_generate_object_websearch': Generate structured data with web search, output fields save automatically
- 'ai_read_file_from_field': Read file from model field, output fields save automatically
- 'ai_generate_image': Generate image, output fields save automatically
- 'ai_modify_image': Modify existing image, output fields save automatically
- 'ai_read_image': Read/analyze image, output fields save automatically
- 'npm_package': Use npm package, output fields save automatically
- 'system_timestamp': Add timestamps, output fields save automatically
- 'system_calculate': Perform calculations, output fields save automatically

📋 INPUT/OUTPUT FIELD SEMANTICS:

**INPUT FIELDS** (where data comes from - COMPLETELY DYNAMIC):
- source: 'model_field' - Read from the target model record (only if needed for processing)
- source: 'external_data' - External APIs, other database models, user parameters (as needed)
- source: 'previous_step' - Output from previous pseudo step (for step chaining)
- source: 'system' - System-provided values (current date, user ID, etc.) (if required)

**EXTERNAL DATABASE MODEL FETCHING**:
For external_data source with database models, specify:
- externalModel: "ModelName" (e.g., "Doctor", "Order", "Customer")
- whereClause: { field: "value" } (e.g., { "speciality": "cardiology" })
- selectFields: ["field1", "field2"] (optional, defaults to all fields)

**EXAMPLES OF DYNAMIC EXTERNAL DATA**:
- External API: { source: "external_data", name: "weatherData" } (from API)
- Other Model: { source: "external_data", externalModel: "Doctor", whereClause: { "id": "input.record.doctorId" } }
- User Parameter: { source: "external_data", name: "analysisType" } (from user input)

**IMPORTANT**: Input fields are completely optional and dynamic. Steps can have:
- NO input fields (e.g., system timestamp generation)
- ONLY model fields (e.g., AI analysis of existing data)
- ONLY external data (e.g., API enrichment, other model data)
- MIXED sources (e.g., AI analysis with external context)

**OUTPUT FIELDS** (where data goes to):
- target: 'model_field' - Update a field in the target model record
- target: 'temporary' - Temporary value for next step
- target: 'return' - Value returned to caller

🎯 STEP DESIGN PRINCIPLES:
1. Each step receives the complete ${targetModel} record data
2. Steps can access external data (APIs, other models, user parameters) for context
3. Steps use AI/external APIs/npm packages to process record + external data
4. Steps generate output fields that get saved directly to the record
5. All output fields with target 'model_field' are automatically saved at the end

EXAMPLE PATTERNS:

**Pattern 1: No Input Fields (System Generation)**
Step 1: No input → System timestamp → Generate processingTimestamp, processingStatus

**Pattern 2: Model Fields Only (Internal Analysis)**  
Step 1: Record.symptoms, Record.history → AI analyze → Generate analysisResult, confidence

**Pattern 3: External Database Model Data**
Step 1: External Model fetch (Doctor where speciality=cardiology) → Process → Generate specialistNotes

**Pattern 4: External API Data**
Step 1: External API call → Process → Generate apiValidationResult, enrichmentData

**Pattern 5: Mixed Sources (Comprehensive Processing)**
Step 1: Record.data + External.model.data + External.api.data → AI process → Generate comprehensiveResult

Final: All output fields automatically saved to the ${targetModel} record

Generate 2-4 focused pseudo steps that implement "${actionPurpose}" for the ${targetModel} model.`;

  const result = await generateObject({
    model,
    schema: z.object({
      steps: z.array(z.object({
        id: z.string(),
        description: z.string(),
        type: z.enum([
          'ai_generate_object', 
          'ai_generate_text',
          'ai_generate_text_websearch',
          'ai_generate_object_websearch',
          'ai_read_file_from_field',
          'ai_generate_image',
          'ai_modify_image', 
          'ai_read_image',
          'npm_package',
          'system_timestamp',
          'system_calculate'
        ]),
        model: z.string().optional(),
        inputFields: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          kind: z.enum(['scalar', 'object', 'enum']),
          required: z.boolean(),
          list: z.boolean(),
          relationModel: z.string().optional(),
          description: z.string().optional(),
          source: z.enum(['model_field', 'external_data', 'previous_step', 'system']),
          // NEW: Dynamic database fetching properties
          externalModel: z.string().optional().describe('Model name to fetch from (for external_data source)'),
          whereClause: z.record(z.any()).optional().describe('Prisma where clause for fetching external data'),
          selectFields: z.array(z.string()).optional().describe('Specific fields to select from external model')
        })),
        outputFields: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          kind: z.enum(['scalar', 'object', 'enum']),
          required: z.boolean(),
          list: z.boolean(),
          relationModel: z.string().optional(),
          description: z.string().optional(),
          target: z.enum(['model_field', 'temporary', 'return'])
        })),
        // Additional properties for specific step types
        schema: z.any().optional(),
        prompt: z.string().optional(),
        maxLength: z.number().optional(),
        searchQuery: z.string().optional(),
        fileType: z.enum(['text', 'pdf', 'image', 'csv']).optional(),
        processing: z.string().optional(),
        dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
        style: z.string().optional(),
        modifications: z.string().optional(),
        preserveOriginal: z.boolean().optional(),
        updateConditions: z.array(z.string()).optional(),
        apiEndpoint: z.string().optional(),
        packageName: z.string().optional(),
        packageFunction: z.string().optional()
      })).min(2).max(4)
    }),
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate focused pseudo steps for the action "${actionPurpose}" that processes ONE record of the ${targetModel} model.

CRITICAL DESIGN REQUIREMENTS:
1. **Dynamic Input Fields**: Determine what external data is actually needed for "${actionPurpose}"
   - If the action can work with just the record data, use NO input fields
   - If external context is needed, specify exactly what external data is required
   - If other model data is needed, specify which models and fields
   - Don't assume any specific input fields - be purposeful and minimal

2. **Purpose-Driven Processing**: Design steps that accomplish "${actionPurpose}" effectively
   - Use appropriate step types (AI, external API, npm package, system, etc.)
   - Generate output fields that make sense for "${actionPurpose}"
   - Create meaningful, dynamic field names based on the purpose

3. **Minimal External Dependencies**: Only request external data that's truly necessary
   - Prefer using existing record data when possible
   - Only add external_data input fields if they're essential for the purpose
   - Be specific about what external data is needed and why

Generate 2-4 pseudo steps that implement "${actionPurpose}" with appropriate, dynamic input/output fields.`
      }
    ],
    temperature: 0.3,
    maxTokens: 2000
  });

  console.log(`✅ Generated ${result.object.steps.length} pseudo steps directly from Step 0 analysis`);
  return result.object.steps;
}

/**
 * NEW MIGRATION APPROACH: Generate executable code from pseudo steps for single-record processing
 * Now uses proper step-type-specific code generators and field source/target semantics
 */
export async function generateExecutableCodeFromPseudoSteps(
  pseudoSteps: any[],
  targetModel: string,
  modelDetails: any,
  availableEnums: any[] = []
): Promise<{
  code: string;
  envVars: any[];
  inputParameters: any[];
  outputParameters: any[];
  estimatedExecutionTime: string;
  testData: any;
}> {
  console.log(`🔨 NEW MIGRATION: Generating executable code for ${targetModel} with ${pseudoSteps.length} steps using step-type-specific generators`);
  
  // Convert pseudo steps to migration steps format
  const migrationSteps: MigrationStep[] = pseudoSteps.map((step: any) => ({
    ...step,
    inputFields: step.inputFields || [],
    outputFields: step.outputFields || []
  }));
  
  // Extract input parameters (external data with source: 'external_data')
  const inputParameters = migrationSteps
    .flatMap(step => step.inputFields)
    .filter(field => field.source === 'external_data')
    .map(field => ({
      name: field.name,
      type: field.type,
      required: field.required,
      description: field.description || `External data for ${field.name}`
    }));
  
  // Add record ID parameter (always required for single-record processing)
  if (!inputParameters.some(p => p.name === 'id')) {
    inputParameters.unshift({
      name: 'id',
      type: 'String',
      required: true,
      description: `${targetModel} record ID to process`
    });
  }

  // Extract output parameters (fields with target: 'return')
  const outputParameters = migrationSteps
    .flatMap(step => step.outputFields)
    .filter(field => field.target === 'return')
    .map(field => ({
      name: field.name,
      type: field.type,
      description: field.description || `Output parameter for ${field.name}`
    }));

  // 🚨 CRITICAL FIX: Do NOT auto-generate environment variables
  // Only generate env vars if user explicitly mentioned specific external services
  // Most actions should work with just database and AI - no env vars needed
  const envVars: any[] = [];
  
  // CONSERVATIVE APPROACH: Only generate env vars for very specific cases
  // Most business actions don't need external APIs
  console.log('🔍 DEBUG: Migration steps environment variable analysis:');
  migrationSteps.forEach(step => {
    console.log(`  Step ${step.id}: type=${step.type}, apiEndpoint=${step.apiEndpoint || 'none'}`);
  });
  
  // Don't auto-generate any environment variables unless absolutely necessary
  // Users can manually add env vars if they need specific external services

  // Generate action name from target model
  const actionName = `process${targetModel}Record`;
  
  // Use the migration code generator
  const generatedCode = generateMigrationActionCode(
    actionName,
    targetModel,
    migrationSteps,
    inputParameters,
    outputParameters,
    envVars
  );
  
  console.log(`✅ Generated migration code for ${targetModel} with proper step-type handlers`);
  
  return {
    code: generatedCode,
    envVars,
    inputParameters,
    outputParameters,
    estimatedExecutionTime: `${migrationSteps.length * 15}-${migrationSteps.length * 30} seconds`,
    testData: {
      input: { id: 'test-record-id' },
      expectedOutput: { recordId: 'test-record-id', success: true }
    }
  };
}

// Duplicate function removed - using the original one with enhancements

/**
 * NEW MIGRATION APPROACH: Complete simplified action generation
 */
export async function generateSimplifiedActionFromStep0(
  step0Analysis: any,
  targetModel: string,
  actionName: string,
  availableModels: any[] = [],
  availableEnums: any[] = [],
  actionTitle?: string,
  actionDescription?: string
): Promise<any> {
  console.log(`🚀 NEW MIGRATION: Generating complete action for ${targetModel}.${actionName}`);
  
  try {
    // Step 1: Generate pseudo steps directly from Step 0 (no tech spec needed)
    const pseudoSteps = await generatePseudoStepsFromStep0(
      step0Analysis,
      targetModel,
      actionDescription || actionName, // Use description if available, fallback to name
      availableModels,
      availableEnums
    );
    
    // Step 2: Generate executable code from pseudo steps
    const modelDetails = availableModels.find(m => m.name === targetModel);
    const executableCode = await generateExecutableCodeFromPseudoSteps(
      pseudoSteps,
      targetModel,
      modelDetails,
      availableEnums
    );
    
    // Use the provided name and title, or generate them if not provided
    const finalName = `${actionName}${targetModel}`;
    const finalTitle = actionTitle ? `${actionTitle} ${targetModel}` : `${actionName} ${targetModel}`;
    
    return {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: finalName.charAt(0).toLowerCase() + finalName.slice(1), // ensure camelCase
      title: finalTitle,
      description: actionDescription || `${actionName} for ${targetModel} records using single-record processing`,
      role: 'member',
      
      // NEW: Migration properties
      targetModel,
      processingMode: 'single',
      
           // Enhanced pseudo steps with new structure
     pseudoSteps: pseudoSteps.map((step: any) => ({
       ...step,
       inputFields: step.inputFields?.map((field: any) => ({ ...field, id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })) || [],
       outputFields: step.outputFields?.map((field: any) => ({ ...field, id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })) || []
     })),
      
      // Executable code
      execute: {
        type: 'code' as const,
        code: {
          script: executableCode.code,
          envVars: executableCode.envVars || []
        }
      },
      
      // Metadata
      _internal: {
        hasRealCode: true,
        hasTestCases: !!executableCode.testData,
        codeGenerationMetadata: {
          inputParameters: executableCode.inputParameters,
          outputParameters: executableCode.outputParameters,
          estimatedExecutionTime: executableCode.estimatedExecutionTime,
          testData: executableCode.testData
        }
      },
      
      // Required fields for compatibility
      dataSource: {
        type: 'database' as const,
        database: {
          models: [modelDetails].filter(Boolean)
        }
      },
      results: {
        model: targetModel,
        fields: {},
        fieldsToUpdate: {}
      }
    };
    
  } catch (error) {
    console.error(`❌ Failed to generate simplified action for ${targetModel}.${actionName}:`, error);
    throw error;
  }
} 

/**
 * ULTRA-STREAMLINED APPROACH: Extract executable actions directly from Step 0
 * This eliminates the need for Step 2 entirely by using Step 0's comprehensive analysis
 */
export function extractExecutableActionsFromStep0(
  step0Output: any,
  availableModels: any[] = [],
  availableEnums: any[] = []
): any[] {
  console.log('🚀 ULTRA-STREAMLINED: Extracting executable actions directly from Step 0');
  
  // If Step 0 already has executableActions (future enhancement), use them
  if (step0Output.executableActions && step0Output.executableActions.length > 0) {
    console.log(`✅ Using ${step0Output.executableActions.length} pre-generated executable actions from Step 0`);
    return step0Output.executableActions.map((actionSpec: any) => convertStep0ActionToAgentAction(actionSpec));
  }
  
  // Otherwise, use Step 0's action specifications to create simplified actions
  const actions = step0Output.actions || [];
  console.log(`📋 Converting ${actions.length} Step 0 action specifications to executable actions`);
  
  return actions.map((actionSpec: any, index: number) => {
    console.log(`🔄 Converting action ${index + 1}/${actions.length}: ${actionSpec.name}`);
    
    // Determine target model based on Step 0 analysis
    const targetModel = determineTargetModelFromStep0(actionSpec, step0Output, availableModels);
    
    // Create simplified executable action
    return {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionSpec.name,
      title: actionSpec.title || actionSpec.name,
      description: actionSpec.purpose,
      role: 'member',
      
      // NEW: Migration properties
      targetModel,
      processingMode: 'single',
      
      // Simplified pseudo steps based on Step 0 analysis
      pseudoSteps: generateSimplifiedPseudoStepsFromStep0Action(actionSpec, targetModel, availableModels),
      
      // Basic executable code structure
      execute: {
        type: 'code' as const,
        code: {
          script: generateBasicExecutableCodeFromStep0Action(actionSpec, targetModel, availableModels),
          envVars: extractEnvVarsFromStep0(step0Output)
        }
      },
      
      // Metadata
      _internal: {
        hasRealCode: true,
        hasTestCases: false,
        generatedFromStep0: true,
        codeGenerationMetadata: {
          inputParameters: extractInputParametersFromStep0Action(actionSpec, targetModel),
          outputParameters: extractOutputParametersFromStep0Action(actionSpec, targetModel),
          estimatedExecutionTime: '30-60 seconds',
          testData: { input: {}, expectedOutput: {} }
        }
      },
      
      // Required fields for compatibility
      dataSource: {
        type: 'database' as const,
        database: {
          models: availableModels.filter(m => m.name === targetModel)
        }
      },
      results: {
        model: targetModel,
        fields: {},
        fieldsToUpdate: {}
      }
    };
  });
}

/**
 * Convert Step 0 executable action to AgentAction format (future enhancement)
 */
function convertStep0ActionToAgentAction(step0Action: any): any {
  return {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: step0Action.name,
    title: step0Action.title,
    description: step0Action.purpose,
    role: 'member',
    targetModel: step0Action.targetModel,
    processingMode: step0Action.processingMode,
    pseudoSteps: step0Action.pseudoSteps,
    execute: {
      type: 'code' as const,
      code: {
        script: step0Action.executableCode.script,
        envVars: step0Action.executableCode.envVars
      }
    },
    _internal: {
      hasRealCode: true,
      hasTestCases: !!step0Action.executableCode.testData,
      generatedFromStep0: true,
      codeGenerationMetadata: {
        inputParameters: step0Action.executableCode.inputParameters,
        outputParameters: step0Action.executableCode.outputParameters,
        estimatedExecutionTime: step0Action.executableCode.estimatedExecutionTime,
        testData: step0Action.executableCode.testData
      }
    },
    dataSource: {
      type: 'database' as const,
      database: { models: [] }
    },
    results: {
      model: step0Action.targetModel,
      fields: {},
      fieldsToUpdate: {}
    }
  };
}

/**
 * Determine target model from Step 0 analysis
 */
export function determineTargetModelFromStep0(
  actionSpec: any,
  step0Output: any,
  availableModels: any[]
): string {
  // Try to infer from action purpose and available models
  const actionPurpose = actionSpec.purpose.toLowerCase();
  
  // Look for model names mentioned in the action purpose
  for (const model of availableModels) {
    const modelName = model.name.toLowerCase();
    if (actionPurpose.includes(modelName) || actionPurpose.includes(modelName.replace(/([A-Z])/g, ' $1').toLowerCase())) {
      return model.name;
    }
  }
  
  // Fallback to first available model
  return availableModels[0]?.name || 'UnknownModel';
}

/**
 * Generate simplified pseudo steps from Step 0 action specification
 */
function generateSimplifiedPseudoStepsFromStep0Action(
  actionSpec: any,
  targetModel: string,
  availableModels: any[]
): any[] {
  const modelDetails = availableModels.find(m => m.name === targetModel);
  const modelFields = modelDetails?.fields || [];
  
  // Create basic pseudo steps based on action purpose
  const actionPurpose = actionSpec.purpose.toLowerCase();
  const steps = [];
  
  // Step 1: Start with AI processing (no database read needed - record provided automatically)
  steps.push({
    id: `step_1_${Date.now()}`,
    type: 'ai_generate_object',
    description: `AI analysis for ${actionSpec.purpose}`,
    model: targetModel,
    prompt: `Analyze the ${targetModel} record data and ${actionSpec.purpose.toLowerCase()}. Provide structured insights and recommendations.`,
    inputFields: [], // Dynamic - will be determined by AI based on action purpose
    outputFields: [
      {
        id: `field_analysis_${Date.now()}`,
        name: `${actionSpec.purpose.toLowerCase().replace(/\s+/g, '')}Result`,
        type: 'String',
        kind: 'scalar',
        required: true,
        list: false,
        target: 'model_field',
        description: `${actionSpec.purpose} result`
      },
      {
        id: `field_confidence_${Date.now()}`,
        name: `${actionSpec.purpose.toLowerCase().replace(/\s+/g, '')}Confidence`,
        type: 'Float',
        kind: 'scalar',
        required: true,
        list: false,
        target: 'model_field',
        description: `${actionSpec.purpose} confidence score`
      }
    ],
    schema: {
      analysisResult: 'string',
      confidence: 'number',
      recommendations: 'array'
    }
  });
  
  // Step 2: Add timestamp (output fields save automatically)
  steps.push({
    id: `step_2_${Date.now()}`,
    type: 'system_timestamp',
    description: `Add processing timestamp to ${targetModel} record`,
    model: targetModel,
    inputFields: [], // No input needed for timestamp
    outputFields: [
      {
        id: `field_timestamp_${Date.now()}`,
        name: `last${actionSpec.purpose.replace(/\s+/g, '')}Time`,
        type: 'DateTime',
        kind: 'scalar',
        required: true,
        list: false,
        target: 'model_field',
        description: `When ${actionSpec.purpose.toLowerCase()} was last performed`
      },
      {
        id: `field_status_${Date.now()}`,
        name: `${actionSpec.purpose.toLowerCase().replace(/\s+/g, '')}Status`,
        type: 'String',
        kind: 'scalar',
        required: true,
        list: false,
        target: 'model_field',
        description: `${actionSpec.purpose} processing status`
      }
    ]
  });
  
  // No Step 3 needed - output fields from previous steps are automatically saved
  
  return steps;
}

/**
 * Generate basic executable code from Step 0 action specification
 */
function generateBasicExecutableCodeFromStep0Action(
  actionSpec: any,
  targetModel: string,
  availableModels: any[]
): string {
  const modelNameLower = targetModel.toLowerCase();
  
  return `
// ULTRA-STREAMLINED: Generated directly from Step 0 analysis
async function ${actionSpec.name}({ db, input, envVars, testMode, actionLogger, executionId, console, generateId, formatDate, validateRequired, ai, z }) {
  const startTime = Date.now();
  
  try {
    // Step 1: Read ${targetModel} record
    await actionLogger.startStep(executionId, 1, 'Read ${targetModel} record', { recordId: input.id });
    
    const record = await db.${modelNameLower}.findUnique({
      where: { id: input.id }
    });
    
    if (!record) {
      throw new Error(\`${targetModel} record with ID \${input.id} not found\`);
    }
    
    await actionLogger.completeStep(executionId, 1, { recordFound: true, recordId: record.id });
    console.log(\`✅ Step 1: Found ${targetModel} record\`, record.id);
    
    // Step 2: Process with AI (${actionSpec.purpose})
    await actionLogger.startStep(executionId, 2, '${actionSpec.purpose}', { recordId: record.id });
    
    const analysisResult = await ai.generateObject({
      model: 'gpt-4',
      schema: z.object({
        analysis: z.string().describe('Analysis result'),
        confidence: z.number().describe('Confidence score 0-100'),
        recommendations: z.array(z.string()).describe('Recommendations')
      }),
      messages: [
        {
          role: 'system',
          content: 'You are an expert analyst. ${actionSpec.purpose}.'
        },
        {
          role: 'user',
          content: \`Analyze this ${targetModel} record: \${JSON.stringify(record)}\`
        }
      ]
    });
    
    await actionLogger.completeStep(executionId, 2, { 
      analysisGenerated: true,
      confidence: analysisResult.object.confidence 
    });
    console.log(\`✅ Step 2: Generated analysis\`, analysisResult.object.confidence);
    
    // Step 3: Update record with analysis
    await actionLogger.startStep(executionId, 3, 'Update record', { recordId: record.id });
    
    const updatedRecord = await db.${modelNameLower}.update({
      where: { id: record.id },
             data: {
         // Update with dynamic field names based on action purpose
         [\`last\${actionSpec.purpose.replace(/\\s+/g, '')}Time\`]: new Date(),
         [\`\${actionSpec.purpose.toLowerCase().replace(/\\s+/g, '')}Status\`]: 'completed'
       }
    });
    
    await actionLogger.completeStep(executionId, 3, { recordUpdated: true });
    console.log(\`✅ Step 3: Updated ${targetModel} record\`);
    
    return {
      success: true,
      data: {
        recordId: updatedRecord.id,
                 [\`\${actionSpec.purpose.toLowerCase().replace(/\\s+/g, '')}Result\`]: analysisResult.object.analysis,
         [\`\${actionSpec.purpose.toLowerCase().replace(/\\s+/g, '')}Confidence\`]: analysisResult.object.confidence,
         additionalData: analysisResult.object.recommendations
      },
      message: \`Successfully processed ${targetModel} record: \${actionSpec.purpose}\`,
      executionTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error(\`❌ ${actionSpec.name} failed:\`, error);
    return {
      success: false,
      data: null,
      message: \`Failed to process ${targetModel} record: \${error.message}\`,
      executionTime: Date.now() - startTime
    };
  }
}`;
}

/**
 * Extract environment variables from Step 0 analysis
 * 🚨 CRITICAL FIX: Be extremely conservative about generating env vars
 */
function extractEnvVarsFromStep0(step0Output: any): any[] {
  console.log('🔍 DEBUG: Step 0 external APIs analysis:', step0Output.externalApis);
  
  // 🚨 CONSERVATIVE APPROACH: Don't auto-generate env vars
  // Most business actions work fine with just database and AI
  // Only generate env vars for very specific, explicitly mentioned services
  const envVars: any[] = [];
  
  const externalApis = step0Output.externalApis || [];
  
  // 🚨 SOCIAL MEDIA APIs USE OAUTH - NO ENVIRONMENT VARIABLES NEEDED
  // Social media platforms (Instagram, Facebook, Threads, X, TikTok) use OAuth authentication
  // They don't require API keys in environment variables - authentication is handled by OAuth flow
  
  const allowedSocialMediaServices = ['instagram', 'facebook', 'threads', 'x', 'tiktok'];
  
  externalApis.forEach((api: any) => {
    const providerLower = api.provider?.toLowerCase() || '';
    
    // Check if it's an allowed social media service
    if (allowedSocialMediaServices.includes(providerLower)) {
      if (api.connectionType === 'oauth') {
        console.log(`✅ Social media API detected: ${api.provider} - uses OAuth (no env vars needed)`);
      } else if (api.connectionType === 'api_key') {
        console.log(`⚠️ Warning: ${api.provider} is configured as api_key but social media APIs should use OAuth`);
        // Don't generate env vars even if misconfigured - social media should always be OAuth
      }
    } else {
      console.log(`🚫 Rejected non-social media API: ${api.provider} - only social media platforms allowed`);
    }
  });
  
  console.log(`🔍 DEBUG: Generated ${envVars.length} environment variables from Step 0`);
  return envVars;
}

/**
 * Extract input parameters from Step 0 action
 */
function extractInputParametersFromStep0Action(actionSpec: any, targetModel: string): any[] {
  return [
    {
      name: 'id',
      type: 'String',
      required: true,
      description: `${targetModel} record ID to process`
    }
  ];
}

/**
 * Extract output parameters from Step 0 action
 */
function extractOutputParametersFromStep0Action(actionSpec: any, targetModel: string): any[] {
  return [
         {
       name: 'recordId',
       type: 'String',
       description: `Processed ${targetModel} record ID`
     },
     {
       name: 'processingResult',
       type: 'String', 
       description: 'Dynamic processing result based on action purpose'
     },
     {
       name: 'processingMetadata',
       type: 'Object',
       description: 'Dynamic metadata about the processing performed'
     }
  ];
}

/**
 * Generate action from existing pseudo steps (from Step 0)
 * Uses existing pseudo steps and generates executable code with AI
 */
export async function generateActionFromPseudoSteps(
  actionSpec: any,
  availableModels: any[] = [],
  availableEnums: any[] = [],
  step0Analysis?: any
): Promise<any> {
  console.log(`🔨 Generating executable code from existing pseudo steps for: ${actionSpec.name}`);
  
  // Use the existing pseudo steps from actionSpec
  const pseudoSteps = actionSpec.pseudoSteps || [];
  const targetModel = actionSpec.targetModel || availableModels[0]?.name || 'UnknownModel';
  
  if (pseudoSteps.length === 0) {
    console.warn(`⚠️ No pseudo steps found for action: ${actionSpec.name}`);
    throw new Error(`Action ${actionSpec.name} has no pseudo steps to process`);
  }
  
  console.log(`📋 Using ${pseudoSteps.length} existing pseudo steps from Step 0`);
  
  // Generate executable code using the existing pseudo steps
  const executableCode = await generateExecutableCodeFromPseudoSteps(
    pseudoSteps,
    targetModel,
    availableModels.find(m => m.name === targetModel),
    availableEnums
  );
  
  // Create the complete action structure
  return {
    id: actionSpec.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: actionSpec.name,
    title: actionSpec.title || actionSpec.name,
    description: actionSpec.purpose || actionSpec.description,
    role: 'member',
    
    // Migration properties
    targetModel,
    processingMode: 'single',
    
    // Use the existing pseudo steps from Step 0
    pseudoSteps: pseudoSteps.map((step: any) => ({
      ...step,
      inputFields: step.inputFields?.map((field: any) => ({ 
        ...field, 
        id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      })) || [],
      outputFields: step.outputFields?.map((field: any) => ({ 
        ...field, 
        id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      })) || []
    })),
    
    // Executable code generated from pseudo steps
    execute: {
      type: 'code' as const,
      code: {
        script: executableCode.code,
        envVars: executableCode.envVars || []
      }
    },
    
    // Metadata
    _internal: {
      hasRealCode: true,
      hasTestCases: !!executableCode.testData,
      generatedFromStep0PseudoSteps: true,
      codeGenerationMetadata: {
        inputParameters: executableCode.inputParameters,
        outputParameters: executableCode.outputParameters,
        estimatedExecutionTime: executableCode.estimatedExecutionTime,
        testData: executableCode.testData
      }
    },
    
    // Required fields for compatibility
    dataSource: {
      type: 'database' as const,
      database: {
        models: availableModels.filter(m => m.name === targetModel)
      }
    },
    results: {
      model: targetModel,
      fields: {},
      fieldsToUpdate: {}
    }
  };
}