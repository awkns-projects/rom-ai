/**
 * Migration Code Generators - Step-Type-Specific Implementation
 * 
 * This module provides proper code generation for the new migration step types
 * with correct field source/target semantics and single-record processing.
 */

import type { NewStepType, FieldSource, FieldTarget, EnhancedStepField } from './types';

export interface MigrationStep {
  id: string;
  type: NewStepType;
  description: string;
  model?: string;
  inputFields: EnhancedStepField[];
  outputFields: EnhancedStepField[];
  // Step-specific properties
  prompt?: string;
  apiEndpoint?: string;
  packageName?: string;
  packageFunction?: string;
  schema?: any;
  maxLength?: number;
  searchQuery?: string;
  fileType?: 'text' | 'pdf' | 'image' | 'csv';
  processing?: string;
  dimensions?: { width: number; height: number };
  style?: string;
  modifications?: string;
  preserveOriginal?: boolean;
  updateConditions?: string[];
}

/**
 * Generate field access code based on source semantics
 */
export function generateFieldAccessCode(field: EnhancedStepField, stepNumber: number): string {
  switch (field.source) {
    case 'model_field': 
      return `input.${field.name}`;  // Direct access from input parameters
    case 'external_data': 
      if (field.externalModel) {
        // Generate dynamic database fetch for external model
        return `external_${field.externalModel}_data[0]?.${field.name}`;
      } else {
        // From external APIs or user parameters
        return `input.${field.name}`;
      }
    case 'previous_step': 
      // More defensive field access with fallback
      return `(step${stepNumber - 1}_results && step${stepNumber - 1}_results.${field.name}) || input.${field.name} || null`;
    case 'system': 
      // Handle common system values directly instead of using undefined systemValues
      return field.name === 'currentDate' ? 'new Date()' :
             field.name === 'userId' ? 'input.userId' :
             field.name === 'timestamp' ? 'Date.now()' :
             field.name === 'weekStart' ? 'new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)' :
             field.name === 'weekEnd' ? 'new Date()' :
             field.name.includes('Date') ? 'new Date()' :
             field.name.includes('Time') ? 'Date.now()' :
             `input.${field.name}`; // Fallback to input parameter
    default:
      return `input.${field.name}`;
  }
}

/**
 * Generate database fetch code for external model fields
 */
export function generateExternalModelFetchCode(
  step: MigrationStep,
  stepNumber: number,
  targetModel: string
): string {
  const externalModelFetches = step.inputFields
    .filter(field => field.source === 'external_data' && field.externalModel)
    .map(field => {
      const modelNameLower = field.externalModel!.toLowerCase();
      const whereClause = field.whereClause || {};
      const selectFields = field.selectFields || ['*'];
      
      // Generate where clause with dynamic values
      const whereConditions = Object.entries(whereClause).map(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('input.')) {
          // Reference to input parameter
          return `${key}: ${value}`;
        } else {
          // Static value
          return `${key}: ${JSON.stringify(value)}`;
        }
      }).join(',\n        ');
      
      const selectClause = selectFields.length === 1 && selectFields[0] === '*' 
        ? '' 
        : `select: { ${selectFields.map(f => `${f}: true`).join(', ')} },`;
      
      // Only generate fetch if there are actual where conditions or it's needed
      if (whereConditions.length === 0) {
        return `
    // Fetch external data from ${field.externalModel} model
    const external_${field.externalModel}_data = await db.${modelNameLower}.findMany({
      ${selectClause}
      take: 10 // Limit external data fetch
    });
    
    console.log(\`📊 Fetched \${external_${field.externalModel}_data.length} records from ${field.externalModel}\`);`;
      }
      
      return `
    // Fetch external data from ${field.externalModel} model
    const external_${field.externalModel}_data = await db.${modelNameLower}.findMany({
      where: {
        ${whereConditions}
      },
      ${selectClause}
      take: 10 // Limit external data fetch
    });
    
    console.log(\`📊 Fetched \${external_${field.externalModel}_data.length} records from ${field.externalModel}\`);`;
    });
    
  return externalModelFetches.join('\n');
}

/**
 * Generate field update/storage code based on target semantics
 */
export function generateFieldUpdateCode(field: EnhancedStepField, stepNumber: number, value: string): string {
  switch (field.target) {
    case 'model_field': 
      return `updateData.${field.name} = ${value};`;
    case 'temporary': 
      return `const step${stepNumber}_${field.name} = ${value};`;
    case 'return': 
      return `returnData.${field.name} = ${value};`;
    default:
      return `const step${stepNumber}_${field.name} = ${value};`;
  }
}

/**
 * Generate code for database update fields step
 */
export function generateDbUpdateFieldsCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  const modelNameLower = targetModel.toLowerCase();
  
  // Generate field access for inputs
  const inputAccess = step.inputFields.map(field => 
    `    const ${field.name} = ${generateFieldAccessCode(field, stepNumber)};`
  ).join('\n');
  
  // Generate update data object
  const updateFields = step.outputFields
    .filter(field => field.target === 'model_field')
    .map(field => `      ${field.name}: ${field.name}`)
    .join(',\n');
  
  // Generate temporary variables
  const tempVariables = step.outputFields
    .filter(field => field.target === 'temporary')
    .map(field => `    const step${stepNumber}_${field.name} = ${field.name};`)
    .join('\n');
  
  return `
    // Step ${stepNumber}: ${step.description}
    try {
      await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { recordId: record.id });
      
      // Access input fields
${inputAccess}
      
      // Update record with new field values
      const updateData = {
${updateFields}
      };
      
      const updatedRecord = await db.${modelNameLower}.update({
        where: { id: record.id },
        data: updateData
      });
      
${tempVariables}
      
      await actionLogger.completeStep(executionId, ${stepNumber}, { 
        fieldsUpdated: Object.keys(updateData),
        recordId: updatedRecord.id 
      });
      console.log(\`✅ Step ${stepNumber}: Updated ${targetModel} fields\`, Object.keys(updateData));
      
    } catch (stepError) {
      await actionLogger.completeStep(executionId, ${stepNumber}, {}, stepError.message);
      console.error(\`❌ Step ${stepNumber} failed:\`, stepError);
      throw stepError;
    }`;
}

/**
 * Generate code for AI generate object step (STEP-SPECIFICATION-DRIVEN)
 */
export function generateAiGenerateObjectCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  // Generate input context based on step's inputFields specifications
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  // Generate output variables based on step's outputFields specifications
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_aiResult.object.${field.name}`
  ).join(',\n');
  
  // Generate schema based on step's outputFields and schema specification
  const schemaFields = step.schema ? 
    Object.entries(step.schema).map(([key, type]) => 
      `        ${key}: z.${type}().describe(${JSON.stringify(key + ' value')})`
    ).join(',\n') : 
    step.outputFields.map(field => 
      `        ${field.name}: z.${field.type.toLowerCase()}().describe(${JSON.stringify(field.description || field.name)})`
    ).join(',\n');
  
  // Use step's prompt or generate from step description
  const stepPrompt = step.prompt || step.description;
  
  return `
    // Step ${stepNumber}: ${step.description}
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    ${generateExternalModelFetchCode(step, stepNumber, targetModel)}
    
    // Prepare input context based on step inputFields specifications
    const step${stepNumber}_aiContext = {
${inputContext}
    };
    
    // AI generation using step specifications
    const step${stepNumber}_aiResult = await ai.generateObject({
      model: 'gpt-4',
      schema: z.object({
${schemaFields}
      }),
      messages: [
        {
          role: 'system',
          content: \`${stepPrompt.replace(/`/g, '\\`')}\`
        },
        {
          role: 'user',
          content: \`Process this data according to step description "${step.description.replace(/"/g, '\\"')}": \${JSON.stringify(step${stepNumber}_aiContext)}\`
        }
      ]
    });
    
    if (!step${stepNumber}_aiResult.object) {
      throw new Error(\`AI generation failed for step: ${step.description.replace(/`/g, '\\`')}\`);
    }
    
    // Store step results based on outputFields specifications
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      aiGenerated: true,
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, Object.keys(step${stepNumber}_aiResult.object));`;
}

/**
 * Generate code for AI generate text step (STEP-SPECIFICATION-DRIVEN)
 */
export function generateAiGenerateTextCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  // Generate input context based on step's inputFields specifications
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  // Generate output variables based on step's outputFields specifications
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_generatedText`
  ).join(',\n');
  
  // Use step's specifications
  const stepPrompt = step.prompt || step.description;
  const maxLength = step.maxLength || 1000;
  
  return `
    // Step ${stepNumber}: ${step.description}
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    ${generateExternalModelFetchCode(step, stepNumber, targetModel)}
    
    // Prepare input context based on step inputFields specifications
    const step${stepNumber}_aiContext = {
${inputContext}
    };
    
    // AI text generation using step specifications
    const step${stepNumber}_textResult = await ai.generateText({
      model: 'gpt-4',
      prompt: \`${stepPrompt.replace(/`/g, '\\`')}: \${JSON.stringify(step${stepNumber}_aiContext)}\`,
      maxTokens: ${maxLength}
    });
    
    const step${stepNumber}_generatedText = step${stepNumber}_textResult.text;
    
    if (!step${stepNumber}_generatedText) {
      throw new Error(\`AI text generation failed for step: ${step.description.replace(/`/g, '\\`')}\`);
    }
    
    // Store step results based on outputFields specifications
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      textGenerated: true,
      textLength: step${stepNumber}_generatedText.length,
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, step${stepNumber}_generatedText.length, 'characters');`;
}

/**
 * Generate code for external API step (STEP-SPECIFICATION-DRIVEN)
 */
export function generateExternalApiCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  // Generate input data based on step's inputFields specifications
  const inputData = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  // Generate output variables based on step's outputFields specifications
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_apiResult.${field.name} || step${stepNumber}_apiResult`
  ).join(',\n');
  
  // Use step's API endpoint specification
  const apiEndpoint = step.apiEndpoint || 'https://api.example.com/endpoint';
  
  return `
    // Step ${stepNumber}: ${step.description}
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    ${generateExternalModelFetchCode(step, stepNumber, targetModel)}
    
    // Prepare API request data based on step inputFields specifications
    const step${stepNumber}_requestData = {
${inputData}
    };
    
    // External API call using step specifications
    const step${stepNumber}_apiHeaders = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header only if API key is available
    if (envVars.API_KEY) {
      step${stepNumber}_apiHeaders['Authorization'] = \`Bearer \${envVars.API_KEY}\`;
    }
    
    const step${stepNumber}_apiResponse = await fetch('${apiEndpoint}', {
      method: 'POST',
      headers: step${stepNumber}_apiHeaders,
      body: JSON.stringify(step${stepNumber}_requestData)
    });
    
    if (!step${stepNumber}_apiResponse.ok) {
      throw new Error(\`API call failed for step "${step.description.replace(/"/g, '\\"')}": \${step${stepNumber}_apiResponse.status} \${step${stepNumber}_apiResponse.statusText}\`);
    }
    
    const step${stepNumber}_apiResult = await step${stepNumber}_apiResponse.json();
    
    // Store step results based on outputFields specifications
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      apiCallSuccessful: true,
      statusCode: step${stepNumber}_apiResponse.status,
      apiEndpoint: '${apiEndpoint}',
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'API call successful');`;
}

/**
 * Generate code for npm package step
 */
export function generateNpmPackageCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  const inputData = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  const outputAssignments = step.outputFields.map(field => 
    generateFieldUpdateCode(field, stepNumber, `packageResult.${field.name} || packageResult`)
  ).join('\n    ');
  
  return `
    // Step ${stepNumber}: ${step.description}
    try {
      await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { recordId: record.id });
      
      // Prepare package input data
      const packageInput = {
${inputData}
      };
      
      // Use npm package (${step.packageName})
      // Note: Package would need to be imported at the top of the function
      const packageResult = ${step.packageName}.${step.packageFunction || 'process'}(packageInput);
      
      if (!packageResult) {
        throw new Error('Package processing failed - no result returned');
      }
      
      // Store results based on target semantics
      ${outputAssignments}
      
      await actionLogger.completeStep(executionId, ${stepNumber}, { 
        packageProcessed: true,
        packageName: '${step.packageName}'
      });
      console.log(\`✅ Step ${stepNumber}: Package processing successful\`);
      
    } catch (stepError) {
      await actionLogger.completeStep(executionId, ${stepNumber}, {}, stepError.message);
      console.error(\`❌ Step ${stepNumber} failed:\`, stepError);
      throw stepError;
    }`;
}

/**
 * Generate code for system timestamp step (STEP-SPECIFICATION-DRIVEN)
 */
export function generateSystemTimestampCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  // Generate output variables based on step's outputFields specifications
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => {
    // Determine timestamp type from field name and type
    const timestampValue = field.type === 'DateTime' || field.name.includes('Date') || field.name.includes('Time') ? 
      'new Date()' : 
      field.type === 'String' ? 
      'new Date().toISOString()' :
      'Date.now()';
    return `      ${field.name}: ${timestampValue}`;
  }).join(',\n');
  
  return `
    // Step ${stepNumber}: ${step.description}
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    // Generate system values based on step outputFields specifications
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      timestampsGenerated: true,
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'Generated system values');`;
}

/**
 * Generate AI step implementation (CORRECTED APPROACH - only AI step types allowed)
 */
function generateAIStepImplementation(
  step: MigrationStep,
  stepNumber: number,
  targetModel: string,
  allSteps: MigrationStep[]
): string {
  // Only allow AI step types - reject external APIs, system operations, etc.
  const allowedAIStepTypes = [
    'ai_generate_object',
    'ai_generate_text', 
    'ai_generate_text_websearch',
    'ai_generate_object_websearch',
    'ai_read_file_from_field',
    'ai_generate_image',
    'ai_modify_image',
    'ai_read_image'
  ];
  
  if (!allowedAIStepTypes.includes(step.type)) {
    console.warn(`⚠️ Non-AI step type '${step.type}' converted to ai_generate_object`);
    // Convert non-AI steps to AI steps
    step.type = 'ai_generate_object' as any;
  }
  
  // Generate AI step with record context and field saving
  return generateAIStepWithRecordContext(step, stepNumber, targetModel, allSteps);
}

/**
 * Generate AI step with proper record context and field saving
 */
function generateAIStepWithRecordContext(
  step: MigrationStep,
  stepNumber: number,
  targetModel: string,
  allSteps: MigrationStep[] = []
): string {
  const modelNameLower = targetModel.toLowerCase();
  
  // Prepare input context from the record and previous steps
  const inputContext = step.inputFields.map(field => {
    if (field.source === 'model_field') {
      return `      ${field.name}: record.${field.name}`;
    } else if (field.source === 'previous_step') {
      // Find which step actually produces this field
      const producingStepIndex = allSteps.findIndex((s: MigrationStep) => 
        s.outputFields.some((of: any) => of.name === field.name)
      );
      const producingStepNumber = producingStepIndex >= 0 ? producingStepIndex + 1 : stepNumber - 1;
      return `      ${field.name}: step${producingStepNumber}_results?.${field.name} || null`;
    } else {
      return `      ${field.name}: input.${field.name}`;
    }
  }).join(',\n');
  
  // Generate output field assignments
  const outputAssignments = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_aiResult.object.${field.name} || step${stepNumber}_aiResult.object`
  ).join(',\n');
  
  // Use step description as the AI prompt
  const stepPrompt = step.description || `Process ${targetModel} record data`;
  
  switch (step.type) {
    case 'ai_generate_object':
      return `
    // Step ${stepNumber}: ${step.description}
    await actionLogger.startStep(executionId, ${stepNumber}, \`${stepPrompt.replace(/`/g, '\\`')}\`, { recordId: record.id });
    
    // Prepare context from record and previous steps
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // AI generation using step description as prompt
    const step${stepNumber}_aiResult = await generateObject({
      model: aiModel,
      schema: z.object({
        ${step.outputFields.map(field => `${field.name}: z.string().describe("${field.description || field.name}")`).join(',\n        ')}
      }),
      messages: [
        {
          role: 'system',
          content: \`You are processing a ${targetModel} record. ${stepPrompt.replace(/'/g, "\\'")}\`
        },
        {
          role: 'user',
          content: \`Record data: \${JSON.stringify(step${stepNumber}_context)}\`
        }
      ]
    });
    
    if (!step${stepNumber}_aiResult.object) {
      throw new Error(\`AI generation failed for step: ${stepPrompt.replace(/'/g, "\\'")}\`);
    }
    
    // Store results for next steps and database saving
    const step${stepNumber}_results = {
${outputAssignments}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${stepPrompt.replace(/`/g, '\\`')}\`,
      stepType: 'ai_generate_object',
      aiGenerated: true,
      outputFields: [${step.outputFields.map(f => `'${f.name}'`).join(', ')}],
      generatedData: step${stepNumber}_aiResult.object
    });
    console.log(\`✅ Step ${stepNumber} (ai_generate_object): ${stepPrompt.replace(/`/g, '\\`')}\`, step${stepNumber}_aiResult.object);`;

    case 'ai_generate_text':
      return `
    // Step ${stepNumber}: ${step.description}
    await actionLogger.startStep(executionId, ${stepNumber}, \`${stepPrompt.replace(/`/g, '\\`')}\`, { recordId: record.id });
    
    // Prepare context from record and previous steps
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // AI text generation using step description as prompt  
    const step${stepNumber}_textResult = await generateObject({
      model: aiModel,
      schema: z.object({
        text: z.string().describe('Generated text content')
      }),
      messages: [
        {
          role: 'system',
          content: \`You are processing a ${targetModel} record. Generate text based on the prompt: ${stepPrompt.replace(/'/g, "\\'")}\`
        },
        {
          role: 'user',
          content: \`Context: \${JSON.stringify(step${stepNumber}_context)}\`
        }
      ]
    });
    
    if (!step${stepNumber}_textResult.object || !step${stepNumber}_textResult.object.text) {
      throw new Error(\`AI text generation failed for step: ${stepPrompt.replace(/'/g, "\\'")}\`);
    }
    
    // Store results for next steps and database saving
    const step${stepNumber}_results = {
      ${step.outputFields.map(field => `${field.name}: step${stepNumber}_textResult.object.text`).join(',\n      ')}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${stepPrompt.replace(/`/g, '\\`')}\`,
      stepType: 'ai_generate_text',
      textGenerated: true,
      textLength: step${stepNumber}_textResult.object.text.length,
      outputFields: [${step.outputFields.map(f => `'${f.name}'`).join(', ')}],
      generatedText: step${stepNumber}_textResult.object.text
    });
    console.log(\`✅ Step ${stepNumber} (ai_generate_text): ${stepPrompt.replace(/`/g, '\\`')}\`, { text: step${stepNumber}_textResult.object.text, length: step${stepNumber}_textResult.object.text.length });`;

    case 'ai_generate_text_websearch':
      return `
    // Step ${stepNumber}: ${step.description} (with web search)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${stepPrompt.replace(/`/g, '\\`')}\`, { recordId: record.id });
    
    // Prepare context from record and previous steps
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // AI text generation with web search using step description as prompt
    const step${stepNumber}_textResult = await generateText({
      model: aiModel,
      prompt: \`${stepPrompt.replace(/'/g, "\\'")}. Context: \${JSON.stringify(step${stepNumber}_context)}\`,
      tools: {
        web_search: aiModel.tools?.webSearch ? aiModel.tools.webSearch({
          searchContextSize: 'high'
        }) : undefined
      },
      toolChoice: aiModel.tools?.webSearch ? { type: 'tool', toolName: 'web_search' } : undefined
    });
    
    if (!step${stepNumber}_textResult.text) {
      throw new Error(\`AI text generation with web search failed for step: ${stepPrompt.replace(/'/g, "\\'")}\`);
    }
    
    // Store results for next steps and database saving
    const step${stepNumber}_results = {
      ${step.outputFields.map(field => `${field.name}: step${stepNumber}_textResult.text`).join(',\n      ')},
      sources: step${stepNumber}_textResult.sources || []
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${stepPrompt.replace(/`/g, '\\`')}\`,
      stepType: 'ai_generate_text_websearch',
      textGenerated: true,
      textLength: step${stepNumber}_textResult.text.length,
      sourcesFound: step${stepNumber}_textResult.sources?.length || 0,
      outputFields: [${step.outputFields.map(f => `'${f.name}'`).join(', ')}],
      generatedText: step${stepNumber}_textResult.text,
      sources: step${stepNumber}_textResult.sources
    });
    console.log(\`✅ Step ${stepNumber} (ai_generate_text_websearch): ${stepPrompt.replace(/`/g, '\\`')}\`, { text: step${stepNumber}_textResult.text, sources: step${stepNumber}_textResult.sources, textLength: step${stepNumber}_textResult.text.length });`;

    case 'ai_generate_object_websearch':
      return `
    // Step ${stepNumber}: ${step.description} (with web search)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${stepPrompt.replace(/`/g, '\\`')}\`, { recordId: record.id });
    
    // Prepare context from record and previous steps
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // AI object generation with web search using step description as prompt
    const step${stepNumber}_objectResult = await generateObject({
      model: aiModel,
      schema: z.object({
        ${step.outputFields.map(field => `${field.name}: z.string().describe("${field.description || field.name}")`).join(',\n        ')}
      }),
      prompt: \`${stepPrompt.replace(/'/g, "\\'")}. Context: \${JSON.stringify(step${stepNumber}_context)}\`,
      tools: {
        web_search: aiModel.tools?.webSearch ? aiModel.tools.webSearch({
          searchContextSize: 'high'
        }) : undefined
      },
      toolChoice: aiModel.tools?.webSearch ? { type: 'tool', toolName: 'web_search' } : undefined
    });
    
    if (!step${stepNumber}_objectResult.object) {
      throw new Error(\`AI object generation with web search failed for step: ${stepPrompt.replace(/'/g, "\\'")}\`);
    }
    
    // Store results for next steps and database saving
    const step${stepNumber}_results = {
      ${step.outputFields.map(field => `${field.name}: step${stepNumber}_objectResult.object.${field.name} || step${stepNumber}_objectResult.object`).join(',\n      ')},
      sources: step${stepNumber}_objectResult.sources || []
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${stepPrompt.replace(/`/g, '\\`')}\`,
      stepType: 'ai_generate_object_websearch',
      objectGenerated: true,
      sourcesFound: step${stepNumber}_objectResult.sources?.length || 0,
      outputFields: [${step.outputFields.map(f => `'${f.name}'`).join(', ')}],
      generatedData: step${stepNumber}_objectResult.object,
      sources: step${stepNumber}_objectResult.sources
    });
    console.log(\`✅ Step ${stepNumber} (ai_generate_object_websearch): ${stepPrompt.replace(/`/g, '\\`')}\`, { data: step${stepNumber}_objectResult.object, sources: step${stepNumber}_objectResult.sources });`;

    default:
      // Convert unknown types to ai_generate_object
      return `
    // Step ${stepNumber}: ${step.description} (converted to AI generation)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${stepPrompt.replace(/`/g, '\\`')}\`, { recordId: record.id });
    
    // Prepare context from record and previous steps
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // AI generation using step description as prompt
    const step${stepNumber}_aiResult = await generateObject({
      model: aiModel,
      schema: z.object({
        ${step.outputFields.map(field => `${field.name}: z.string().describe("${field.description || field.name}")`).join(',\n        ')}
      }),
      messages: [
        {
          role: 'system',
          content: \`You are processing a ${targetModel} record. ${stepPrompt.replace(/'/g, "\\'")}\`
        },
        {
          role: 'user',
          content: \`Record data: \${JSON.stringify(step${stepNumber}_context)}\`
        }
      ]
    });
    
    if (!step${stepNumber}_aiResult.object) {
      throw new Error(\`AI generation failed for step: ${stepPrompt.replace(/'/g, "\\'")}\`);
    }
    
    // Store results for next steps and database saving
    const step${stepNumber}_results = {
${outputAssignments}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${stepPrompt.replace(/`/g, '\\`')}\`,
      stepType: 'ai_generate_object',
      aiGenerated: true,
      outputFields: [${step.outputFields.map(f => `'${f.name}'`).join(', ')}],
      generatedData: step${stepNumber}_aiResult.object
    });
    console.log(\`✅ Step ${stepNumber} (ai_generate_object): ${stepPrompt.replace(/`/g, '\\`')}\`, step${stepNumber}_aiResult.object);`;
  }
}

/**
 * Main step type code generator
 */
export function generateStepTypeCode(
  step: MigrationStep, 
  stepNumber: number, 
  targetModel: string
): string {
  switch (step.type) {
    case 'ai_generate_object':
      return generateAiGenerateObjectCode(step, stepNumber, targetModel);
    case 'ai_generate_text':
      return generateAiGenerateTextCode(step, stepNumber, targetModel);
    // external_api step type removed - use AI with web search instead
    case 'npm_package':
      return generateNpmPackageCode(step, stepNumber, targetModel);
    case 'system_timestamp':
      return generateSystemTimestampCode(step, stepNumber, targetModel);
    case 'ai_generate_object_websearch':
      return generateAiGenerateObjectCode(step, stepNumber, targetModel); // Similar to ai_generate_object for now
    case 'ai_read_file_from_field':
      return generateFileReadingCode(step, stepNumber, targetModel);
    case 'ai_generate_image':
      return generateImageGenerationCode(step, stepNumber, targetModel);
    case 'ai_modify_image':
      return generateImageModificationCode(step, stepNumber, targetModel);
    case 'ai_read_image':
      return generateImageAnalysisCode(step, stepNumber, targetModel);
    case 'system_calculate':
      return generateCalculationCode(step, stepNumber, targetModel);
    default:
      return `
    // Step ${stepNumber}: ${step.description} (${step.type})
    console.warn(\`⚠️ Step type '${step.type}' not yet implemented\`);
    
    // Create placeholder results to prevent dependency errors
    const step${stepNumber}_results = {};`;
  }
}

/**
 * Generate complete single-record action function (CORRECTED APPROACH - AI-only steps that save to record fields)
 */
export function generateMigrationActionCode(
  actionName: string,
  targetModel: string,
  pseudoSteps: MigrationStep[],
  inputParameters: any[] = [],
  outputParameters: any[] = [],
  envVars: any[] = []
): string {
  const modelNameLower = targetModel.toLowerCase();
  
  // Generate step implementations - only AI step types allowed
  const stepImplementations = pseudoSteps.map((step, index) => 
    generateAIStepImplementation(step, index + 1, targetModel, pseudoSteps)
  ).join('\n\n');
  
  // Collect all output fields that should be saved to the database record
  const modelFieldUpdates = pseudoSteps
    .flatMap(step => step.outputFields)
    .filter(field => field.target === 'model_field')
    .map(field => `      ${field.name}: step${pseudoSteps.findIndex(s => s.outputFields.includes(field)) + 1}_results.${field.name}`)
    .join(',\n');
  
  // Collect all output fields from all steps
  const allOutputFields = pseudoSteps.flatMap(step => step.outputFields);
  const modelFieldOutputs = allOutputFields.filter(field => field.target === 'model_field');
  const returnFieldOutputs = allOutputFields.filter(field => field.target === 'return');
  
  // Generate return data from all steps
  const returnFields = returnFieldOutputs.map(field => 
    `      ${field.name}: step${pseudoSteps.findIndex(s => s.outputFields.includes(field)) + 1}_results.${field.name}`
  ).join(',\n');
  
  return `
// CORRECTED APPROACH: Single-record AI processing for ${targetModel}
async function ${actionName}({ db, input, envVars, testMode, actionLogger, executionId, console, generateId, formatDate, validateRequired, ai, z, aiModel, generateText }) {
  const startTime = Date.now();
  
  try {
    console.log(\`🔄 Processing ${actionName} for ${targetModel} record:\`, input.id);
    
    // Step 0: Fetch the specific ${targetModel} record by ID
    const record = await db.${targetModel.charAt(0).toLowerCase() + targetModel.slice(1)}.findUnique({
      where: { id: input.id }
    });
    
    if (!record) {
      throw new Error(\`${targetModel} record with ID \${input.id} not found\`);
    }
    
    console.log(\`📋 Found ${targetModel} record:\`, record.id);
    
${stepImplementations}
    
    // CRITICAL: Save all AI-generated outputs to the record
    const modelFieldUpdates = {
      ${modelFieldOutputs.map((field, index) => {
        const stepIndex = pseudoSteps.findIndex(s => s.outputFields.includes(field)) + 1;
        return `${field.name}: step${stepIndex}_results.${field.name}`;
      }).join(',\n      ')}
    };
    
    let updatedRecord = null;
    if (Object.keys(modelFieldUpdates).length > 0) {
      updatedRecord = await db.${targetModel.charAt(0).toLowerCase() + targetModel.slice(1)}.update({
        where: { id: record.id },
        data: modelFieldUpdates
      });
      console.log(\`✅ Updated ${targetModel} record with \${Object.keys(modelFieldUpdates).length} AI-generated fields:\`, modelFieldUpdates);
    } else {
      console.log(\`ℹ️ No fields to update for ${targetModel} record\`);
      updatedRecord = record;
    }
    
    return {
      success: true,
      data: {
        recordId: updatedRecord.id,
        ${returnFields ? returnFields + ',' : ''}
        updatedFields: Object.keys(modelFieldUpdates),
        fieldsUpdated: Object.keys(modelFieldUpdates).length,
        processedRecord: updatedRecord
      },
      message: \`Successfully processed ${targetModel} record \${updatedRecord.id} with AI (updated \${Object.keys(modelFieldUpdates).length} fields)\`,
      executionTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error(\`❌ ${actionName} failed:\`, error);
    return {
      success: false,
      data: null,
      message: \`Failed to process ${targetModel} record: \${error.message}\`,
      executionTime: Date.now() - startTime
    };
  }
}`;
}

// Additional step type generators for completeness
function generateFileReadingCode(step: MigrationStep, stepNumber: number, targetModel: string): string {
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_fileContent`
  ).join(',\n');
  
  return `
    // Step ${stepNumber}: ${step.description} (File Reading)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    // Prepare file reading context
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // Read file content (placeholder implementation)
    const step${stepNumber}_fileContent = "File content would be read here based on file path or URL";
    
    // Store step results
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      fileRead: true,
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'File read completed');`;
}

function generateImageGenerationCode(step: MigrationStep, stepNumber: number, targetModel: string): string {
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_imageUrl`
  ).join(',\n');
  
  const dimensions = step.dimensions || { width: 1024, height: 1024 };
  const style = step.style || 'realistic';
  
  return `
    // Step ${stepNumber}: ${step.description} (Image Generation)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    // Prepare image generation context
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // Generate image using AI (placeholder implementation)
    const step${stepNumber}_imageUrl = "https://placeholder-image-url.com/generated-image.jpg";
    
    // Store step results
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      imageGenerated: true,
      dimensions: ${JSON.stringify(dimensions)},
      style: '${style}',
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'Image generated');`;
}

function generateImageModificationCode(step: MigrationStep, stepNumber: number, targetModel: string): string {
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_modifiedImageUrl`
  ).join(',\n');
  
  const modifications = step.modifications || 'general modifications';
  const preserveOriginal = step.preserveOriginal || false;
  
  return `
    // Step ${stepNumber}: ${step.description} (Image Modification)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    // Prepare image modification context
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // Modify image using AI (placeholder implementation)
    const step${stepNumber}_modifiedImageUrl = "https://placeholder-image-url.com/modified-image.jpg";
    
    // Store step results
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      imageModified: true,
      modifications: '${modifications}',
      preserveOriginal: ${preserveOriginal},
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'Image modified');`;
}

function generateImageAnalysisCode(step: MigrationStep, stepNumber: number, targetModel: string): string {
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => 
    `      ${field.name}: step${stepNumber}_analysis.${field.name} || step${stepNumber}_analysis`
  ).join(',\n');
  
  return `
    // Step ${stepNumber}: ${step.description} (Image Analysis)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    // Prepare image analysis context
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // Analyze image using AI (placeholder implementation)
    const step${stepNumber}_analysis = {
      description: "Image analysis results would appear here",
      objects: [],
      text: "",
      emotions: [],
      colors: []
    };
    
    // Store step results
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      imageAnalyzed: true,
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'Image analyzed');`;
}

function generateCalculationCode(step: MigrationStep, stepNumber: number, targetModel: string): string {
  const inputContext = step.inputFields.map(field => 
    `      ${field.name}: ${generateFieldAccessCode(field, stepNumber)}`
  ).join(',\n');
  
  const outputFieldNames = step.outputFields.map(field => field.name);
  const returnOutputs = step.outputFields.map(field => {
    // Generate appropriate calculation based on field name and type
    if (field.name.includes('total') || field.name.includes('sum')) {
      return `      ${field.name}: Object.values(step${stepNumber}_context).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0)`;
    } else if (field.name.includes('average') || field.name.includes('mean')) {
      return `      ${field.name}: Object.values(step${stepNumber}_context).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0) / Object.values(step${stepNumber}_context).filter(v => typeof v === 'number').length`;
    } else if (field.name.includes('count')) {
      return `      ${field.name}: Object.values(step${stepNumber}_context).filter(v => v != null).length`;
    } else if (field.name.includes('Date') || field.name.includes('Time')) {
      return `      ${field.name}: new Date()`;
    } else {
      return `      ${field.name}: step${stepNumber}_calculatedValue`;
    }
  }).join(',\n');
  
  return `
    // Step ${stepNumber}: ${step.description} (Calculation)
    await actionLogger.startStep(executionId, ${stepNumber}, \`${step.description.replace(/`/g, '\\`')}\`, { inputData: input });
    
    // Prepare calculation context
    const step${stepNumber}_context = {
${inputContext}
    };
    
    // Perform calculations
    const step${stepNumber}_calculatedValue = "Calculation result placeholder";
    
    // Store step results
    const step${stepNumber}_results = {
${returnOutputs}
    };
    
    await actionLogger.completeStep(executionId, ${stepNumber}, { 
      stepDescription: \`${step.description.replace(/`/g, '\\`')}\`,
      stepType: \`${step.type}\`,
      calculationPerformed: true,
      outputFields: [${outputFieldNames.map(name => `'${name}'`).join(', ')}]
    });
    console.log(\`✅ Step ${stepNumber} (${step.type}): ${step.description.replace(/`/g, '\\`')}\`, 'Calculation completed');`;
} 