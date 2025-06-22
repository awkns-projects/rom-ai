import type { 
  AgentData, 
  AgentModel, 
  AgentField, 
  AgentEnum, 
  AgentEnumField, 
  AgentAction, 
  AgentSchedule 
} from './types';
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
  console.log('🔄 Starting comprehensive deep merge...');
  
  if (!existing) {
    console.log('📝 No existing agent data, returning incoming data as-is');
    return incoming;
  }

  // Initialize safe arrays to prevent null/undefined errors
  const safeExistingModels = existing.models || [];
  const safeIncomingModels = incoming.models || [];
  const safeExistingActions = existing.actions || [];
  const safeIncomingActions = incoming.actions || [];
  const safeExistingSchedules = existing.schedules || [];
  const safeIncomingSchedules = incoming.schedules || [];

  console.log(`📊 Merging data:
- Existing: ${safeExistingModels.length} models, ${safeExistingActions.length} actions, ${safeExistingSchedules.length} schedules
- Incoming: ${safeIncomingModels.length} models, ${safeIncomingActions.length} actions, ${safeIncomingSchedules.length} schedules`);

  // Perform intelligent array merging
  const mergedModels = mergeModelsIntelligently(safeExistingModels, safeIncomingModels);
  const mergedActions = mergeActionsIntelligently(safeExistingActions, safeIncomingActions);
  const mergedSchedules = mergeSchedulesIntelligently(safeExistingSchedules, safeIncomingSchedules);

  // Critical safety checks to prevent data loss
  if (mergedModels.length === 0 && safeExistingModels.length > 0) {
    console.warn('⚠️ SAFETY CHECK: Merged models resulted in empty array, preserving existing models');
    mergedModels.push(...safeExistingModels);
  }

  if (mergedActions.length === 0 && safeExistingActions.length > 0) {
    console.warn('⚠️ SAFETY CHECK: Merged actions resulted in empty array, preserving existing actions');
    mergedActions.push(...safeExistingActions);
  }

  if (mergedSchedules.length === 0 && safeExistingSchedules.length > 0) {
    console.warn('⚠️ SAFETY CHECK: Merged schedules resulted in empty array, preserving existing schedules');
    mergedSchedules.push(...safeExistingSchedules);
  }

  const result = {
    ...existing,
    ...incoming,
    id: existing.id, // Always preserve the existing ID
    models: mergedModels,
    actions: mergedActions,
    schedules: mergedSchedules,
    createdAt: existing.createdAt, // Preserve original creation time
    metadata: {
      ...existing.metadata,
      ...incoming.metadata,
      updatedAt: new Date().toISOString(),
      operationType: 'merge'
    }
  };

  // Apply deletion operations if specified
  if (deletionOperations) {
    console.log('🗑️ Applying deletion operations...');
    return applyDeletionOperations(result, deletionOperations);
  }

  // Final result logging
  const totalModelEnums = result.models.reduce((sum, model) => sum + (model.enums?.length || 0), 0);
  console.log(`✅ Deep merge completed:
- Final: ${result.models.length} models, ${result.actions.length} actions, ${result.schedules.length} schedules
- Total Model Enums: ${totalModelEnums}
- Models with decreased count: ${result.models.length < safeExistingModels.length ? '⚠️ YES' : 'No'}
- Actions with decreased count: ${result.actions.length < safeExistingActions.length ? '⚠️ YES' : 'No'}
- Model Enums with decreased count: ${totalModelEnums < safeExistingModels.reduce((sum, model) => sum + (model.enums?.length || 0), 0) ? '⚠️ YES' : 'No'}`);

  return result;
}

/**
 * Intelligently merges model arrays, preserving existing models and adding new ones
 * @param existing - Existing models
 * @param incoming - New models to merge
 * @returns Merged models array
 */
export function mergeModelsIntelligently(existing: AgentModel[], incoming: AgentModel[]): AgentModel[] {
  console.log(`🔄 Merging models: ${existing.length} existing + ${incoming.length} incoming`);
  
  const result: AgentModel[] = [];
  const processedIds = new Set<string>();

  // Process existing models first
  existing.forEach(existingModel => {
    const incomingMatch = incoming.find(inc => 
      inc.id === existingModel.id || 
      inc.name === existingModel.name
    );

    if (incomingMatch) {
      console.log(`🔄 Merging existing model: ${existingModel.name}`);
      
      // Merge model-scoped enums intelligently
      const mergedEnums = mergeModelEnums(existingModel.enums || [], incomingMatch.enums || []);
      
      const merged: AgentModel = {
        ...existingModel,
        ...incomingMatch,
        id: existingModel.id, // Preserve original ID
        fields: mergeFieldsIntelligently(existingModel.fields, incomingMatch.fields),
        records: mergeModelRecords(existingModel.records || [], incomingMatch.records || []),
        enums: mergedEnums
      };
      
      result.push(merged);
      processedIds.add(incomingMatch.id || incomingMatch.name);
    } else {
      console.log(`✅ Preserving existing model: ${existingModel.name}`);
      result.push(existingModel);
    }
  });

  // Add new models from incoming that weren't matched
  incoming.forEach(incomingModel => {
    if (!processedIds.has(incomingModel.id || incomingModel.name)) {
      console.log(`➕ Adding new model: ${incomingModel.name}`);
      result.push(incomingModel);
    }
  });

  console.log(`✅ Model merge complete: ${result.length} total models`);
  return result;
}

function mergeModelEnums(existing: AgentEnum[], incoming: AgentEnum[]): AgentEnum[] {
  console.log(`🔄 Merging model enums: ${existing.length} existing + ${incoming.length} incoming`);
  
  const result: AgentEnum[] = [];
  const processedIds = new Set<string>();

  // Process existing enums first
  existing.forEach(existingEnum => {
    const incomingMatch = incoming.find(inc => 
      inc.id === existingEnum.id || 
      inc.name === existingEnum.name
    );

    if (incomingMatch) {
      console.log(`🔄 Merging existing enum: ${existingEnum.name}`);
      const merged: AgentEnum = {
        ...existingEnum,
        ...incomingMatch,
        id: existingEnum.id, // Preserve original ID
        fields: mergeEnumFields(existingEnum.fields, incomingMatch.fields)
      };
      
      result.push(merged);
      processedIds.add(incomingMatch.id || incomingMatch.name);
    } else {
      console.log(`✅ Preserving existing enum: ${existingEnum.name}`);
      result.push(existingEnum);
    }
  });

  // Add new enums from incoming that weren't matched
  incoming.forEach(incomingEnum => {
    if (!processedIds.has(incomingEnum.id || incomingEnum.name)) {
      console.log(`➕ Adding new enum: ${incomingEnum.name}`);
      result.push(incomingEnum);
    }
  });

  console.log(`✅ Model enum merge complete: ${result.length} total enums`);
  return result;
}

function mergeEnumFields(existing: AgentEnumField[], incoming: AgentEnumField[]): AgentEnumField[] {
  const result: AgentEnumField[] = [];
  const processedNames = new Set<string>();

  // Process existing fields first
  existing.forEach(existingField => {
    const incomingMatch = incoming.find(inc => inc.name === existingField.name);
    
    if (incomingMatch) {
      // Merge the fields, keeping existing structure but updating with incoming changes
      const merged: AgentEnumField = {
        ...existingField,
        ...incomingMatch
      };
      result.push(merged);
      processedNames.add(incomingMatch.name);
    } else {
      // Keep existing field as-is
      result.push(existingField);
    }
  });

  // Add new fields from incoming that weren't matched
  incoming.forEach(incomingField => {
    if (!processedNames.has(incomingField.name)) {
      result.push(incomingField);
    }
  });

  return result;
}

/**
 * Merges model fields
 * @param existing - Existing model
 * @param incoming - Incoming model
 * @returns Merged model
 */
export function mergeModelFields(existing: AgentModel, incoming: AgentModel): AgentModel {
  return {
    ...existing,
    ...incoming,
    fields: mergeFieldsIntelligently(existing.fields, incoming.fields),
    enums: mergeModelEnums(existing.enums || [], incoming.enums || [])
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
              updatedField.name = `${updatedField.name}s`; // Convert "productId" to "productIds"
            } else if (updatedField.name.endsWith('id')) {
              updatedField.name = `${updatedField.name}s`; // Convert "productid" to "productids"
            } else {
              updatedField.name = `${updatedField.name}Ids`; // Add "Ids" suffix for other cases
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
              updatedField.name = `${updatedField.name}s`; // Convert "productId" to "productIds"
            } else if (updatedField.name.endsWith('id')) {
              updatedField.name = `${updatedField.name}s`; // Convert "productid" to "productids"
            } else {
              updatedField.name = `${updatedField.name}Ids`; // Add "Ids" suffix for other cases
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
              newField.name = `${newField.name}s`; // Convert "productId" to "productIds"
            } else if (newField.name.endsWith('id')) {
              newField.name = `${newField.name}s`; // Convert "productid" to "productids"
            } else {
              newField.name = `${newField.name}Ids`; // Add "Ids" suffix for other cases
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
  console.log('🗑️ Applying deletion operations...');
  
  const result = { ...agentData };
  
  // Delete models
  if (deletionOperations.modelsToDelete?.length > 0) {
    console.log(`🗑️ Deleting ${deletionOperations.modelsToDelete.length} models`);
    result.models = result.models.filter(model => 
      !deletionOperations.modelsToDelete.includes(model.name) && 
      !deletionOperations.modelsToDelete.includes(model.id)
    );
  }
  
  // Delete actions
  if (deletionOperations.actionsToDelete?.length > 0) {
    console.log(`🗑️ Deleting ${deletionOperations.actionsToDelete.length} actions`);
    result.actions = result.actions.filter(action => 
      !deletionOperations.actionsToDelete.includes(action.name) && 
      !deletionOperations.actionsToDelete.includes(action.id)
    );
  }
  
  // Delete schedules
  if (deletionOperations.schedulesToDelete?.length > 0) {
    console.log(`🗑️ Deleting ${deletionOperations.schedulesToDelete.length} schedules`);
    result.schedules = result.schedules.filter(schedule => 
      !deletionOperations.schedulesToDelete.includes(schedule.name) && 
      !deletionOperations.schedulesToDelete.includes(schedule.id)
    );
  }
  
  // Delete fields from specific models
  if (deletionOperations.fieldDeletions) {
    console.log('🗑️ Deleting specific fields from models');
    result.models = result.models.map(model => {
      const fieldsToDelete = deletionOperations.fieldDeletions[model.name];
      if (fieldsToDelete?.length > 0) {
        console.log(`🗑️ Deleting ${fieldsToDelete.length} fields from model ${model.name}`);
        return {
          ...model,
          fields: model.fields.filter(field => !fieldsToDelete.includes(field.name))
        };
      }
      return model;
    });
  }
  
  // Delete enums from specific models
  if (deletionOperations.enumDeletions) {
    console.log('🗑️ Deleting specific enums from models');
    result.models = result.models.map(model => {
      const enumsToDelete = deletionOperations.enumDeletions[model.name];
      if (enumsToDelete?.length > 0) {
        console.log(`🗑️ Deleting ${enumsToDelete.length} enums from model ${model.name}`);
        return {
          ...model,
          enums: (model.enums || []).filter(enumItem => !enumsToDelete.includes(enumItem.name))
        };
      }
      return model;
    });
  }
  
  console.log('✅ Deletion operations completed');
  return result;
}

/**
 * Logs content changes between existing and merged data
 * @param existing - Original agent data
 * @param merged - Merged agent data
 */
export function logContentChanges(existing: AgentData, merged: AgentData): void {
  console.log('📊 Content Changes Summary:');
  console.log(`  Models: ${existing.models?.length || 0} → ${merged.models?.length || 0}`);
  
  // Count model-scoped enums
  const existingEnumCount = (existing.models || []).reduce((sum, model) => sum + (model.enums?.length || 0), 0);
  const mergedEnumCount = (merged.models || []).reduce((sum, model) => sum + (model.enums?.length || 0), 0);
  console.log(`  Model Enums: ${existingEnumCount} → ${mergedEnumCount}`);
  
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

/**
 * Intelligently merges model records
 * @param existing - Existing model records
 * @param incoming - New model records to merge
 * @returns Merged records array
 */
export function mergeModelRecords(existing: any[], incoming: any[]): any[] {
  // Defensive coding: ensure inputs are arrays
  if (!Array.isArray(existing)) {
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    incoming = [];
  }

  const merged = [...existing];
  const existingIds = new Set(existing.map(r => r.id));
  
  for (const incomingRecord of incoming) {
    if (!existingIds.has(incomingRecord.id)) {
      // Add new record if it doesn't exist
      merged.push(incomingRecord);
    }
    // Note: We don't update existing records to preserve user data
    // Only add new example records
  }
  
  return merged;
} 