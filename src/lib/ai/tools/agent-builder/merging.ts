import type { 
  AgentData, 
  AgentModel,
  AgentAction,
  AgentSchedule
} from './types';

/**
 * Simple merge that preserves existing records when updating agents
 * Now that we trust the Prisma schema output, we only need to preserve existing records
 * @param existing - Existing agent data
 * @param incoming - New agent data from Prisma schema
 * @returns Merged agent data with preserved records
 */
export function performDeepMerge(
  existing: AgentData | null | undefined,
  incoming: AgentData
): AgentData {
  console.log('🔄 Starting simple merge with record preservation...');
  
  if (!existing) {
    console.log('📝 No existing agent data, returning incoming data as-is');
    return incoming;
  }

  console.log(`📊 Merging data:
- Existing: ${existing.models?.length || 0} models with records
- Incoming: ${incoming.models?.length || 0} models from Prisma schema`);

  // Preserve existing records by model name
  const modelsWithPreservedRecords = incoming.models.map(incomingModel => {
    const existingModel = existing.models?.find(em => em.name === incomingModel.name);
    
    if (existingModel?.records && existingModel.records.length > 0) {
      console.log(`📦 Preserving ${existingModel.records.length} records for model: ${incomingModel.name}`);
      return {
        ...incomingModel,
        records: existingModel.records
      };
    }
    
    return incomingModel;
  });

  const totalRecords = modelsWithPreservedRecords.reduce((sum, model) => sum + (model.records?.length || 0), 0);

  const result = {
    ...incoming,
    id: existing.id, // Always preserve the existing ID
    models: modelsWithPreservedRecords,
    createdAt: existing.createdAt, // Preserve original creation time
    metadata: {
      ...existing.metadata,
      ...incoming.metadata,
      updatedAt: new Date().toISOString(),
      operationType: 'prisma_schema_update'
    }
  };

  console.log(`✅ Simple merge completed:
- Final: ${result.models.length} models, ${result.actions.length} actions, ${result.schedules.length} schedules
- Total preserved records: ${totalRecords}`);

  return result;
}

/**
 * Intelligently merge actions from existing and incoming data
 * Preserves existing actions and adds new ones, avoiding duplicates
 */
export function mergeActionsIntelligently(
  existingActions: AgentAction[] = [],
  incomingActions: AgentAction[] = []
): AgentAction[] {
  console.log(`🔀 Merging actions: ${existingActions.length} existing + ${incomingActions.length} incoming`);
  
  if (existingActions.length === 0) {
    console.log('📝 No existing actions, returning all incoming actions');
    return incomingActions;
  }
  
  if (incomingActions.length === 0) {
    console.log('📝 No incoming actions, returning existing actions');
    return existingActions;
  }
  
  const mergedActions: AgentAction[] = [...existingActions];
  let addedCount = 0;
  
  for (const incomingAction of incomingActions) {
    // Check if action already exists (by name, case-insensitive)
    const existingAction = existingActions.find(action => 
      action.name.toLowerCase().trim() === incomingAction.name.toLowerCase().trim()
    );
    
    if (!existingAction) {
      // Add new action
      mergedActions.push(incomingAction);
      addedCount++;
      console.log(`➕ Added new action: ${incomingAction.name}`);
    } else {
      console.log(`⚪ Skipped duplicate action: ${incomingAction.name}`);
    }
  }
  
  console.log(`✅ Action merge complete: ${mergedActions.length} total (${addedCount} new)`);
  return mergedActions;
}

/**
 * Intelligently merge schedules from existing and incoming data
 * Preserves existing schedules and adds new ones, avoiding duplicates
 */
export function mergeSchedulesIntelligently(
  existingSchedules: AgentSchedule[] = [],
  incomingSchedules: AgentSchedule[] = []
): AgentSchedule[] {
  console.log(`🔀 Merging schedules: ${existingSchedules.length} existing + ${incomingSchedules.length} incoming`);
  
  if (existingSchedules.length === 0) {
    console.log('📝 No existing schedules, returning all incoming schedules');
    return incomingSchedules;
  }
  
  if (incomingSchedules.length === 0) {
    console.log('📝 No incoming schedules, returning existing schedules');
    return existingSchedules;
  }
  
  const mergedSchedules: AgentSchedule[] = [...existingSchedules];
  let addedCount = 0;
  
  for (const incomingSchedule of incomingSchedules) {
    // Check if schedule already exists (by name, case-insensitive)
    const existingSchedule = existingSchedules.find(schedule => 
      schedule.name.toLowerCase().trim() === incomingSchedule.name.toLowerCase().trim()
    );
    
    if (!existingSchedule) {
      // Add new schedule
      mergedSchedules.push(incomingSchedule);
      addedCount++;
      console.log(`➕ Added new schedule: ${incomingSchedule.name}`);
    } else {
      console.log(`⚪ Skipped duplicate schedule: ${incomingSchedule.name}`);
    }
  }
  
  console.log(`✅ Schedule merge complete: ${mergedSchedules.length} total (${addedCount} new)`);
  return mergedSchedules;
}

/**
 * Log content changes between existing and merged agent data
 */
export function logContentChanges(existing: AgentData, merged: AgentData): void {
  console.log('📈 CONTENT CHANGE SUMMARY:');
  
  const existingCounts = {
    models: existing.models?.length || 0,
    actions: existing.actions?.length || 0,
    schedules: existing.schedules?.length || 0,
    records: existing.models?.reduce((sum, model) => sum + (model.records?.length || 0), 0) || 0
  };
  
  const mergedCounts = {
    models: merged.models?.length || 0,
    actions: merged.actions?.length || 0,
    schedules: merged.schedules?.length || 0,
    records: merged.models?.reduce((sum, model) => sum + (model.records?.length || 0), 0) || 0
  };
  
  console.log(`Models: ${existingCounts.models} → ${mergedCounts.models} (${mergedCounts.models - existingCounts.models >= 0 ? '+' : ''}${mergedCounts.models - existingCounts.models})`);
  console.log(`Actions: ${existingCounts.actions} → ${mergedCounts.actions} (${mergedCounts.actions - existingCounts.actions >= 0 ? '+' : ''}${mergedCounts.actions - existingCounts.actions})`);
  console.log(`Schedules: ${existingCounts.schedules} → ${mergedCounts.schedules} (${mergedCounts.schedules - existingCounts.schedules >= 0 ? '+' : ''}${mergedCounts.schedules - existingCounts.schedules})`);
  console.log(`Records: ${existingCounts.records} → ${mergedCounts.records} (${mergedCounts.records - existingCounts.records >= 0 ? '+' : ''}${mergedCounts.records - existingCounts.records})`);
} 