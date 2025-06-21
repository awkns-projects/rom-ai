import type { 
  AgentData, 
  AgentModel, 
  AgentField, 
  AgentEnum, 
  AgentEnumField, 
  AgentAction, 
  AgentSchedule 
} from './types';
import { deepEqual, mergeArraysByKey } from './utils';
import { generateUUID } from '../../../utils';

/**
 * Performs deep merge of existing and incoming agent data
 * @param existing - Existing agent data
 * @param incoming - New agent data to merge
 * @param deletionOperations - Optional deletion operations to apply
 * @returns Merged agent data
 */
export function performDeepMerge(
  existing: AgentData | null | undefined,
  incoming: AgentData,
  deletionOperations?: any
): AgentData {
  console.log('🔄 Starting deep merge operation');
  
  // Handle case where existing is null/undefined (new document)
  if (!existing) {
    console.log('📊 No existing data - using incoming data as-is');
    console.log(`📊 Incoming: ${incoming.models?.length || 0} models, ${incoming.actions?.length || 0} actions, ${incoming.schedules?.length || 0} schedules`);
    return incoming;
  }
  
  console.log(`📊 Existing: ${existing.models?.length || 0} models, ${existing.actions?.length || 0} actions, ${existing.schedules?.length || 0} schedules`);
  console.log(`📊 Incoming: ${incoming.models?.length || 0} models, ${incoming.actions?.length || 0} actions, ${incoming.schedules?.length || 0} schedules`);

  // Start with existing data as base
  const merged: AgentData = {
    ...existing,
    // Update top-level properties only if they're different and meaningful
    name: incoming.name && incoming.name !== existing.name ? incoming.name : existing.name,
    description: incoming.description && incoming.description !== existing.description ? incoming.description : existing.description,
    domain: incoming.domain && incoming.domain !== existing.domain ? incoming.domain : existing.domain,
    // Keep original creation date
    createdAt: existing.createdAt || incoming.createdAt || new Date().toISOString(),
    // Merge metadata intelligently
    metadata: {
      // Start with existing metadata
      ...(existing.metadata || {}),
      // Then merge in incoming metadata
      ...(incoming.metadata || {}),
      // Then ensure required fields are present with final values
      createdAt: existing.metadata?.createdAt || incoming.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: String(parseInt(existing.metadata?.version || '0') + 1),
      lastModifiedBy: 'ai-agent-builder',
      tags: existing.metadata?.tags || [],
      status: existing.metadata?.status || 'active',
      // Preserve comprehensive analysis from latest update
      promptUnderstanding: incoming.metadata?.promptUnderstanding || existing.metadata?.promptUnderstanding,
      granularChanges: incoming.metadata?.granularChanges || existing.metadata?.granularChanges,
      aiDecision: incoming.metadata?.aiDecision || existing.metadata?.aiDecision,
      changeAnalysis: incoming.metadata?.changeAnalysis || existing.metadata?.changeAnalysis,
      lastUpdateReason: incoming.metadata?.lastUpdateReason || existing.metadata?.lastUpdateReason,
      lastUpdateTimestamp: incoming.metadata?.lastUpdateTimestamp || new Date().toISOString(),
      comprehensiveAnalysisUsed: incoming.metadata?.comprehensiveAnalysisUsed || existing.metadata?.comprehensiveAnalysisUsed,
      operationType: incoming.metadata?.operationType || existing.metadata?.operationType
    }
  };

  // Apply deletion operations before merging
  if (deletionOperations) {
    merged.models = performDeletionOperations(merged.models || [], deletionOperations.modelsToDelete, deletionOperations.modelFieldDeletions);
    merged.actions = performDeletionOperations(merged.actions || [], deletionOperations.actionsToDelete);
  }

  // Ensure arrays are properly initialized and valid before merging
  const safeExistingModels = Array.isArray(merged.models) ? merged.models : [];
  const safeIncomingModels = Array.isArray(incoming.models) ? incoming.models : [];
  const safeExistingActions = Array.isArray(merged.actions) ? merged.actions : [];
  const safeIncomingActions = Array.isArray(incoming.actions) ? incoming.actions : [];
  const safeExistingSchedules = Array.isArray(merged.schedules) ? merged.schedules : [];
  const safeIncomingSchedules = Array.isArray(incoming.schedules) ? incoming.schedules : [];

  // Intelligent array merging for models
  merged.models = mergeModelsIntelligently(safeExistingModels, safeIncomingModels);
  
  // Critical safety check: If merged result has fewer items than existing and incoming was empty,
  // this indicates a potential data loss scenario - preserve existing data
  if (safeExistingModels.length > 0 && safeIncomingModels.length === 0 && merged.models.length === 0) {
    console.log('🚨 CRITICAL SAFETY CHECK: Merged models resulted in empty array when existing data exists');
    console.log('🛡️ Preserving existing models to prevent data loss');
    merged.models = safeExistingModels;
  }
  
  // Intelligent array merging for actions
  merged.actions = mergeActionsIntelligently(safeExistingActions, safeIncomingActions);
  
  // Critical safety check: If merged result has fewer items than existing and incoming was empty,
  // this indicates a potential data loss scenario - preserve existing data
  if (safeExistingActions.length > 0 && safeIncomingActions.length === 0 && merged.actions.length === 0) {
    console.log('🚨 CRITICAL SAFETY CHECK: Merged actions resulted in empty array when existing data exists');
    console.log('🛡️ Preserving existing actions to prevent data loss');
    merged.actions = safeExistingActions;
  }
  
  // Intelligent array merging for schedules
  merged.schedules = mergeSchedulesIntelligently(safeExistingSchedules, safeIncomingSchedules);
  
  console.log('📊 Deep merge completed with comprehensive metadata preservation');
  console.log(`📊 Final result: ${merged.models?.length || 0} models, ${merged.actions?.length || 0} actions, ${merged.schedules?.length || 0} schedules`);
  
  // Final validation: Ensure we never have fewer items than we started with unless explicitly deleted
  if ((merged.models?.length || 0) < (existing.models?.length || 0) && !deletionOperations?.modelsToDelete?.length) {
    console.warn(`⚠️ WARNING: Model count decreased from ${existing.models?.length || 0} to ${merged.models?.length || 0} without explicit deletion operations`);
  }
  if ((merged.actions?.length || 0) < (existing.actions?.length || 0) && !deletionOperations?.actionsToDelete?.length) {
    console.warn(`⚠️ WARNING: Action count decreased from ${existing.actions?.length || 0} to ${merged.actions?.length || 0} without explicit deletion operations`);
  }
  
  return merged;
}

/**
 * Intelligently merges model arrays, preserving existing models and adding new ones
 * @param existing - Existing models
 * @param incoming - New models to merge
 * @returns Merged models array
 */
export function mergeModelsIntelligently(existing: AgentModel[], incoming: AgentModel[]): AgentModel[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    console.warn('⚠️ mergeModelsIntelligently: existing is not an array, using empty array');
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    console.warn('⚠️ mergeModelsIntelligently: incoming is not an array, using empty array');
    incoming = [];
  }

  console.log(`🔄 Merging ${existing.length} existing models with ${incoming.length} incoming models`);
  
  const mergedModels: AgentModel[] = [...existing];
  
  for (const incomingModel of incoming) {
    const existingIndex = mergedModels.findIndex(e => 
      e.id === incomingModel.id || 
      e.name.toLowerCase() === incomingModel.name.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Merge existing model with new data
      const existingModel = mergedModels[existingIndex];
      mergedModels[existingIndex] = {
        ...existingModel,
        ...incomingModel,
        // Preserve original ID
        id: existingModel.id,
        // Intelligent field merging
        fields: mergeFieldsIntelligently(existingModel.fields || [], incomingModel.fields || []),
        // Intelligent enum merging
        enums: mergeEnumsIntelligently(existingModel.enums || [], incomingModel.enums || [])
      };
    } else {
      // Add new model
      mergedModels.push(incomingModel);
    }
  }
  
  return mergedModels;
}

/**
 * Merges fields between existing and incoming models
 * @param existing - Existing model
 * @param incoming - Incoming model with potential changes
 * @returns Merged model
 */
export function mergeModelFields(existing: AgentModel, incoming: AgentModel): AgentModel {
  return {
    ...existing,
    ...incoming,
    fields: mergeFieldsIntelligently(existing.fields, incoming.fields),
    enums: mergeEnumsIntelligently(existing.enums || [], incoming.enums || [])
  };
}

/**
 * Intelligently merges field arrays
 * @param existing - Existing fields
 * @param incoming - New fields to merge
 * @returns Merged fields array
 */
export function mergeFieldsIntelligently(existing: AgentField[], incoming: AgentField[]): AgentField[] {
  const merged = [...existing];
  const existingIds = new Set(existing.map(f => f.id));
  const existingNames = new Set(existing.map(f => f.name));
  
  for (const incomingField of incoming) {
    const existingById = existing.find(f => f.id === incomingField.id);
    const existingByName = existing.find(f => f.name === incomingField.name);
    
    if (existingById) {
      // Update existing field by ID
      const index = merged.findIndex(f => f.id === incomingField.id);
      const updatedField = { ...existingById, ...incomingField };
      // Apply relation field fixes
      if (updatedField.relationField) {
        updatedField.kind = 'object';
        // For relation fields, ensure type is a model name, not a primitive type
        if (updatedField.type && ['String', 'Int', 'Float', 'Boolean'].includes(updatedField.type)) {
          updatedField.type = updatedField.name.replace(/Id$/, ''); // Convert "userId" to "User"
        }
        // Handle list relation fields with proper naming and structure
        if (updatedField.list) {
          // Ensure plural naming for list relation fields
          if (!updatedField.name.endsWith('Ids') && !updatedField.name.endsWith('ids')) {
            if (updatedField.name.endsWith('Id')) {
              updatedField.name = updatedField.name + 's'; // Convert "productId" to "productIds"
            } else if (updatedField.name.endsWith('id')) {
              updatedField.name = updatedField.name + 's'; // Convert "productid" to "productids"
            } else {
              updatedField.name = updatedField.name + 'Ids'; // Add "Ids" suffix for other cases
            }
          }
          // Ensure default value is an empty array
          if (updatedField.defaultValue === undefined) {
            updatedField.defaultValue = [];
          }
        }
      }
      merged[index] = updatedField;
      
    } else if (existingByName && !incomingField.id) {
      // Update existing field by name
      const index = merged.findIndex(f => f.name === incomingField.name);
      const updatedField = { ...existingByName, ...incomingField, id: existingByName.id };
      // Apply relation field fixes
      if (updatedField.relationField) {
        updatedField.kind = 'object';
        // For relation fields, ensure type is a model name, not a primitive type
        if (updatedField.type && ['String', 'Int', 'Float', 'Boolean'].includes(updatedField.type)) {
          updatedField.type = updatedField.name.replace(/Id$/, ''); // Convert "userId" to "User"
        }
        // Handle list relation fields with proper naming and structure
        if (updatedField.list) {
          // Ensure plural naming for list relation fields
          if (!updatedField.name.endsWith('Ids') && !updatedField.name.endsWith('ids')) {
            if (updatedField.name.endsWith('Id')) {
              updatedField.name = updatedField.name + 's'; // Convert "productId" to "productIds"
            } else if (updatedField.name.endsWith('id')) {
              updatedField.name = updatedField.name + 's'; // Convert "productid" to "productids"
            } else {
              updatedField.name = updatedField.name + 'Ids'; // Add "Ids" suffix for other cases
            }
          }
          // Ensure default value is an empty array
          if (updatedField.defaultValue === undefined) {
            updatedField.defaultValue = [];
          }
        }
      }
      merged[index] = updatedField;
      
    } else if (!existingIds.has(incomingField.id) && !existingNames.has(incomingField.name)) {
      // Add new field
      const newField = { ...incomingField };
      if (!newField.id) {
        newField.id = generateUUID();
      }
      // Apply relation field fixes
      if (newField.relationField) {
        newField.kind = 'object';
        // For relation fields, ensure type is a model name, not a primitive type
        if (newField.type && ['String', 'Int', 'Float', 'Boolean'].includes(newField.type)) {
          newField.type = newField.name.replace(/Id$/, ''); // Convert "userId" to "User"
        }
        // Handle list relation fields with proper naming and structure
        if (newField.list) {
          // Ensure plural naming for list relation fields
          if (!newField.name.endsWith('Ids') && !newField.name.endsWith('ids')) {
            if (newField.name.endsWith('Id')) {
              newField.name = newField.name + 's'; // Convert "productId" to "productIds"
            } else if (newField.name.endsWith('id')) {
              newField.name = newField.name + 's'; // Convert "productid" to "productids"
            } else {
              newField.name = newField.name + 'Ids'; // Add "Ids" suffix for other cases
            }
          }
          // Ensure default value is an empty array
          if (newField.defaultValue === undefined) {
            newField.defaultValue = [];
          }
        }
      }
      merged.push(newField);
    }
  }
  
  return merged;
}

/**
 * Intelligently merges enum arrays
 * @param existing - Existing enums
 * @param incoming - New enums to merge
 * @returns Merged enums array
 */
export function mergeEnumsIntelligently(existing: AgentEnum[], incoming: AgentEnum[]): AgentEnum[] {
  const merged = [...existing];
  
  for (const incomingEnum of incoming) {
    const existingIndex = merged.findIndex(e => 
      e.id === incomingEnum.id || 
      e.name.toLowerCase() === incomingEnum.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Merge existing enum with incoming changes, preserving ID
      const existingEnum = merged[existingIndex];
      merged[existingIndex] = {
        ...existingEnum,
        ...incomingEnum,
        id: existingEnum.id,
        fields: mergeEnumFieldsIntelligently(existingEnum.fields || [], incomingEnum.fields || [])
      };
    } else {
      // Add new enum
      merged.push(incomingEnum);
    }
  }
  
  return merged;
}

/**
 * Merges enum field arrays
 * @param existing - Existing enum fields
 * @param incoming - New enum fields to merge
 * @returns Merged enum fields array
 */
export function mergeEnumFieldsIntelligently(existing: AgentEnumField[], incoming: AgentEnumField[]): AgentEnumField[] {
  const merged = [...existing];
  
  for (const incomingField of incoming) {
    const existingIndex = merged.findIndex(f => 
      f.id === incomingField.id || 
      f.name.toLowerCase() === incomingField.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Merge existing enum field with incoming changes, preserving ID
      const existingField = merged[existingIndex];
      merged[existingIndex] = {
        ...existingField,
        ...incomingField,
        id: existingField.id
      };
    } else {
      // Add new enum field
      merged.push(incomingField);
    }
  }
  
  return merged;
}

/**
 * Intelligently merges action arrays
 * @param existing - Existing actions
 * @param incoming - New actions to merge
 * @returns Merged actions array
 */
export function mergeActionsIntelligently(existing: AgentAction[], incoming: AgentAction[]): AgentAction[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    console.warn('⚠️ mergeActionsIntelligently: existing is not an array, using empty array');
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    console.warn('⚠️ mergeActionsIntelligently: incoming is not an array, using empty array');
    incoming = [];
  }

  console.log(`🔄 Merging ${existing.length} existing actions with ${incoming.length} incoming actions`);
  
  const mergedActions: AgentAction[] = [...existing];
  
  for (const incomingAction of incoming) {
    const existingIndex = mergedActions.findIndex(e => e.id === incomingAction.id);
    
    if (existingIndex >= 0) {
      // Merge existing action with new data
      mergedActions[existingIndex] = mergeActionDetails(mergedActions[existingIndex], incomingAction);
    } else {
      // Add new action
      mergedActions.push(incomingAction);
    }
  }
  
  return mergedActions;
}

/**
 * Merges details between existing and incoming actions
 * @param existing - Existing action
 * @param incoming - Incoming action with potential changes
 * @returns Merged action
 */
export function mergeActionDetails(existing: AgentAction, incoming: AgentAction): AgentAction {
  return {
    ...existing,
    ...incoming,
    // Preserve ID
    id: existing.id,
    // Intelligent merging of complex properties
    dataSource: {
      ...existing.dataSource,
      ...incoming.dataSource,
      // Merge database models if both exist
      database: incoming.dataSource?.database || existing.dataSource?.database ? {
        models: [
          ...(existing.dataSource?.database?.models || []),
          ...(incoming.dataSource?.database?.models || [])
        ].filter((model, index, self) => 
          index === self.findIndex(m => m.id === model.id || m.name === model.name)
        )
      } : undefined
    },
    execute: {
      ...existing.execute,
      ...incoming.execute
    },
    results: {
      ...existing.results,
      ...incoming.results
    }
  };
}

/**
 * Intelligently merges schedule arrays
 * @param existing - Existing schedules
 * @param incoming - New schedules to merge
 * @returns Merged schedules array
 */
export function mergeSchedulesIntelligently(existing: AgentSchedule[], incoming: AgentSchedule[]): AgentSchedule[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    console.warn('⚠️ mergeSchedulesIntelligently: existing is not an array, using empty array');
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    console.warn('⚠️ mergeSchedulesIntelligently: incoming is not an array, using empty array');
    incoming = [];
  }

  console.log(`🔄 Merging ${existing.length} existing schedules with ${incoming.length} incoming schedules`);
  
  const mergedSchedules: AgentSchedule[] = [...existing];
  
  for (const incomingSchedule of incoming) {
    const existingIndex = mergedSchedules.findIndex(e => e.id === incomingSchedule.id);
    
    if (existingIndex >= 0) {
      // Merge existing schedule with new data, preserving ID
      mergedSchedules[existingIndex] = {
        ...mergedSchedules[existingIndex],
        ...incomingSchedule,
        id: mergedSchedules[existingIndex].id
      };
    } else {
      // Add new schedule
      mergedSchedules.push(incomingSchedule);
    }
  }
  
  return mergedSchedules;
}

/**
 * Merges details between existing and incoming schedules
 * @param existing - Existing schedule
 * @param incoming - Incoming schedule with potential changes
 * @returns Merged schedule
 */
export function mergeScheduleDetails(existing: AgentSchedule, incoming: AgentSchedule): AgentSchedule {
  return {
    ...existing,
    ...incoming,
    interval: {
      ...existing.interval,
      ...incoming.interval
    },
    dataSource: {
      ...existing.dataSource,
      ...incoming.dataSource,
      database: incoming.dataSource.database || existing.dataSource.database,
      customFunction: incoming.dataSource.customFunction || existing.dataSource.customFunction
    },
    execute: {
      ...existing.execute,
      ...incoming.execute,
      code: incoming.execute.code || existing.execute.code,
      prompt: incoming.execute.prompt || existing.execute.prompt
    },
    results: {
      ...existing.results,
      ...incoming.results
    }
  };
}

/**
 * Applies deletion operations to agent data
 * @param agentData - Agent data to modify
 * @param deletionOperations - Deletion operations to apply
 * @returns Modified agent data
 */
export function applyDeletionOperations(agentData: AgentData, deletionOperations: any): AgentData {
  const modified = { ...agentData };
  
  // Apply model deletions
  if (deletionOperations.modelsToDelete?.length > 0) {
    modified.models = modified.models.filter(model => 
      !deletionOperations.modelsToDelete.includes(model.id) && 
      !deletionOperations.modelsToDelete.includes(model.name)
    );
  }
  
  // Apply action deletions
  if (deletionOperations.actionsToDelete?.length > 0) {
    modified.actions = modified.actions.filter(action => 
      !deletionOperations.actionsToDelete.includes(action.id) && 
      !deletionOperations.actionsToDelete.includes(action.name)
    );
  }
  
  // Apply field deletions
  if (deletionOperations.modelFieldDeletions) {
    for (const [modelKey, fieldsToDelete] of Object.entries(deletionOperations.modelFieldDeletions)) {
      const modelIndex = modified.models.findIndex(m => m.id === modelKey || m.name === modelKey);
      if (modelIndex >= 0 && Array.isArray(fieldsToDelete)) {
        modified.models[modelIndex].fields = modified.models[modelIndex].fields.filter(field =>
          !fieldsToDelete.includes(field.id) && !fieldsToDelete.includes(field.name)
        );
      }
    }
  }
  
  return modified;
}

/**
 * Logs content changes between existing and merged agent data
 * @param existing - Original agent data
 * @param merged - Merged agent data
 */
export function logContentChanges(existing: AgentData, merged: AgentData): void {
  console.log('📊 Content Changes Summary:');
  console.log(`  Models: ${existing.models?.length || 0} → ${merged.models?.length || 0}`);
  console.log(`  Enums: ${existing.enums?.length || 0} → ${merged.enums?.length || 0}`);
  console.log(`  Actions: ${existing.actions?.length || 0} → ${merged.actions?.length || 0}`);
  console.log(`  Schedules: ${existing.schedules?.length || 0} → ${merged.schedules?.length || 0}`);
  
  // Log specific changes
  const existingModels = existing.models || [];
  const mergedModels = merged.models || [];
  const existingActions = existing.actions || [];
  const mergedActions = merged.actions || [];
  const existingSchedules = existing.schedules || [];
  const mergedSchedules = merged.schedules || [];
  
  const newModels = mergedModels.filter(m => 
    !existingModels.some(em => em.id === m.id || em.name === m.name)
  );
  const newActions = mergedActions.filter(a => 
    !existingActions.some(ea => ea.id === a.id || ea.name === a.name)
  );
  const newSchedules = mergedSchedules.filter(s => 
    !existingSchedules.some(es => es.id === s.id || es.name === s.name)
  );
  
  if (newModels.length > 0) {
    console.log(`  ➕ New models: ${newModels.map(m => m.name).join(', ')}`);
  }
  if (newActions.length > 0) {
    console.log(`  ➕ New actions: ${newActions.map(a => a.name).join(', ')}`);
  }
  if (newSchedules.length > 0) {
    console.log(`  ➕ New schedules: ${newSchedules.map(s => s.name).join(', ')}`);
  }
}

function performDeletionOperations<T extends { id?: string; name?: string }>(
  items: T[],
  itemsToDelete?: string[],
  fieldDeletions?: Record<string, string[]>
): T[] {
  if (!Array.isArray(items)) return [];
  
  let result = [...items];
  
  // Remove items by ID or name
  if (itemsToDelete && itemsToDelete.length > 0) {
    result = result.filter(item => {
      const shouldDelete = itemsToDelete.includes(item.id || '') || 
                          itemsToDelete.includes(item.name || '');
      if (shouldDelete) {
        console.log(`🗑️ Deleting item: ${item.name || item.id}`);
      }
      return !shouldDelete;
    });
  }
  
  // Remove specific fields from items
  if (fieldDeletions) {
    result = result.map(item => {
      const itemId = item.id || item.name || '';
      if (fieldDeletions[itemId]) {
        const updatedItem = { ...item };
        fieldDeletions[itemId].forEach(field => {
          if (field in updatedItem) {
            delete (updatedItem as any)[field];
            console.log(`🗑️ Deleted field ${field} from ${itemId}`);
          }
        });
        return updatedItem;
      }
      return item;
    });
  }
  
  return result;
} 