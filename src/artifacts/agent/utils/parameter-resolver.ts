import type { ParamValue, ExecutionContext, ResolvedParams } from '../types/schedule';

/**
 * Resolves a ParamValue to its actual value using the execution context
 */
export function resolveParamValue(
  param: ParamValue,
  context: ExecutionContext
): any {
  switch (param.type) {
    case 'static':
      return param.value;
    
    case 'ref':
      const stepResult = context.stepResults[param.fromActionIndex];
      if (!stepResult) {
        throw new Error(`No result found for step ${param.fromActionIndex}`);
      }
      
      if (!(param.outputKey in stepResult)) {
        throw new Error(`Output key '${param.outputKey}' not found in step ${param.fromActionIndex} result`);
      }
      
      return stepResult[param.outputKey];
    
    case 'alias':
      if (!context.aliases || !(param.fromAlias in context.aliases)) {
        throw new Error(`Alias '${param.fromAlias}' not found in execution context`);
      }
      
      const aliasValue = context.aliases[param.fromAlias];
      if (!aliasValue || typeof aliasValue !== 'object') {
        throw new Error(`Alias '${param.fromAlias}' does not resolve to an object`);
      }
      
      if (!(param.outputKey in aliasValue)) {
        throw new Error(`Output key '${param.outputKey}' not found in alias '${param.fromAlias}'`);
      }
      
      return aliasValue[param.outputKey];
    
    default:
      throw new Error(`Unknown ParamValue type: ${(param as any).type}`);
  }
}

/**
 * Resolves all parameters for a step using the execution context
 */
export function resolveStepParams(
  inputParams: Record<string, ParamValue> | undefined,
  context: ExecutionContext
): ResolvedParams {
  if (!inputParams) {
    return {};
  }

  const resolved: ResolvedParams = {};
  
  for (const [key, param] of Object.entries(inputParams)) {
    try {
      resolved[key] = resolveParamValue(param, context);
    } catch (error) {
      throw new Error(`Failed to resolve parameter '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return resolved;
}

/**
 * Validates that all parameter references in a schedule are valid
 */
export function validateParameterReferences(
  steps: Array<{ inputParams?: Record<string, ParamValue>; loopOver?: { listSource: ParamValue; itemAlias: string } }>,
  availableOutputs: Record<number, string[]> // Map of step index to available output keys
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const availableAliases = new Set<string>();
  
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    
    // Validate loop configuration
    if (step.loopOver) {
      const loopValidation = validateLoopConfiguration(step.loopOver, stepIndex, availableOutputs);
      errors.push(...loopValidation.errors);
      
      // Add alias to available aliases for subsequent steps
      if (loopValidation.isValid) {
        availableAliases.add(step.loopOver.itemAlias);
      }
    }
    
    if (!step.inputParams) continue;
    
    for (const [paramKey, param] of Object.entries(step.inputParams)) {
      if (param.type === 'ref') {
        // Check if referenced step exists and is before current step
        if (param.fromActionIndex >= stepIndex) {
          errors.push(`Step ${stepIndex} parameter '${paramKey}' references step ${param.fromActionIndex}, but can only reference previous steps`);
          continue;
        }
        
        // Check if referenced output key exists
        const availableKeys = availableOutputs[param.fromActionIndex];
        if (!availableKeys || !availableKeys.includes(param.outputKey)) {
          errors.push(`Step ${stepIndex} parameter '${paramKey}' references output '${param.outputKey}' from step ${param.fromActionIndex}, but that output doesn't exist`);
        }
      } else if (param.type === 'alias') {
        // Check if alias is available (from current or previous steps with loops)
        if (!availableAliases.has(param.fromAlias)) {
          errors.push(`Step ${stepIndex} parameter '${paramKey}' references alias '${param.fromAlias}', but no such alias is available from loop configurations`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extracts available output keys from action results
 */
export function extractOutputKeys(result: any): string[] {
  if (!result || typeof result !== 'object') {
    return [];
  }
  
  // Handle arrays by using the first element as template
  if (Array.isArray(result)) {
    if (result.length === 0) return [];
    return extractOutputKeys(result[0]);
  }
  
  return Object.keys(result);
}

/**
 * Creates a static ParamValue
 */
export function createStaticParam(value: any): ParamValue {
  return { type: 'static', value };
}

/**
 * Creates a reference ParamValue
 */
export function createRefParam(fromActionIndex: number, outputKey: string): ParamValue {
  return { type: 'ref', fromActionIndex, outputKey };
}

/**
 * Creates an alias ParamValue
 */
export function createAliasParam(fromAlias: string, outputKey: string): ParamValue {
  return { type: 'alias', fromAlias, outputKey };
}

/**
 * Validates loop configuration for a step
 */
export function validateLoopConfiguration(
  loopOver: { listSource: ParamValue; itemAlias: string } | undefined,
  stepIndex: number,
  availableOutputs: Record<number, string[]>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!loopOver) {
    return { isValid: true, errors: [] };
  }
  
  // Validate listSource parameter
  if (loopOver.listSource.type === 'ref') {
    // Check if referenced step exists and is before current step
    if (loopOver.listSource.fromActionIndex >= stepIndex) {
      errors.push(`Step ${stepIndex} loop references step ${loopOver.listSource.fromActionIndex}, but can only reference previous steps`);
    } else {
      // Check if referenced output key exists
      const availableKeys = availableOutputs[loopOver.listSource.fromActionIndex];
      if (!availableKeys || !availableKeys.includes(loopOver.listSource.outputKey)) {
        errors.push(`Step ${stepIndex} loop references output '${loopOver.listSource.outputKey}' from step ${loopOver.listSource.fromActionIndex}, but that output doesn't exist`);
      }
    }
  }
  
  // Validate alias name
  if (!loopOver.itemAlias || !loopOver.itemAlias.trim()) {
    errors.push(`Step ${stepIndex} loop requires a valid item alias name`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

 