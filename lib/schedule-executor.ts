import { getDocumentById, saveOrUpdateDocument } from '@/lib/db/queries';
import { CronExpressionParser } from 'cron-parser';

interface ExecuteScheduleParams {
  documentId: string;
  scheduleId: string;
  code: string;
  inputParameters: Record<string, any>;
  envVars: Record<string, string>;
  testMode: boolean;
  interval: {
    pattern: string;
    timezone?: string;
    active: boolean;
  };
}

export async function executeScheduleDirectly(params: ExecuteScheduleParams): Promise<{
  success: boolean;
  error?: string;
  executionTime?: number;
  result?: any;
  databaseUpdated?: boolean;
  modelsAffected?: any[];
  nextRun?: string;
  message?: string;
}> {
  const { documentId, scheduleId, code, inputParameters, envVars, testMode, interval } = params;
  const startTime = Date.now();

  try {
    // Fetch the document to get the real database structure and records
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return {
        success: false,
        error: 'Document not found'
      };
    }

    const userId = document.userId;
    if (!userId) {
      return {
        success: false,
        error: 'Unable to determine user ID'
      };
    }

    if (!document.content) {
      return {
        success: false,
        error: 'Document has no content'
      };
    }

    // Parse the agent data from document content
    let agentData;
    try {
      agentData = JSON.parse(document.content);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid agent data format'
      };
    }

    if (!agentData.models || !Array.isArray(agentData.models)) {
      return {
        success: false,
        error: 'No models found in agent data'
      };
    }

    // Create real database interface from agent data
    const createRealDatabase = (agentData: any) => {
      const models = agentData.models || [];
      const changeLog: Array<{
        modelName: string;
        operation: 'create' | 'update' | 'delete' | 'find' | 'updateMany' | 'deleteMany';
        recordId?: string;
        data?: any;
        previousData?: any;
        timestamp: string;
      }> = [];
      
      return {
        // Get all records for a model
        findMany: (modelName: string, options?: { where?: any; limit?: number }) => {
          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          let records = model.records || [];
          
          // Apply where filter if provided
          if (options?.where) {
            records = records.filter((record: any) => {
              return Object.entries(options.where).every(([key, value]) => {
                return record.data[key] === value;
              });
            });
          }
          
          // Apply limit if provided
          if (options?.limit && options.limit > 0) {
            records = records.slice(0, options.limit);
          }
          
          const result = records.map((record: any) => ({
            id: record.id,
            ...record.data,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          }));

          // Log the find operation for debugging
          changeLog.push({
            modelName,
            operation: 'find',
            timestamp: new Date().toISOString(),
            data: { found: result.length, options }
          });
          
          return result;
        },

        // Find a single record
        findUnique: (modelName: string, where: any) => {
          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          const record = (model.records || []).find((record: any) => {
            return Object.entries(where).every(([key, value]) => {
              return record.data[key] === value || record.id === value;
            });
          });
          
          if (!record) return null;
          
          const result = {
            id: record.id,
            ...record.data,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          };

          // Log the find operation
          changeLog.push({
            modelName,
            operation: 'find',
            recordId: record.id,
            timestamp: new Date().toISOString(),
            data: { found: true, where }
          });
          
          return result;
        },

        // Create a new record
        create: (modelName: string, data: any) => {
          const now = new Date().toISOString();
          
          if (testMode) {
            // In test mode, just simulate the creation
            const testRecord = {
              id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...data,
              createdAt: now,
              updatedAt: now
            };

            changeLog.push({
              modelName,
              operation: 'create',
              recordId: testRecord.id,
              data: data,
              timestamp: now
            });

            return testRecord;
          }

          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          const newRecord = {
            id: `${modelName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            modelId: model.id,
            data: data,
            createdAt: now,
            updatedAt: now
          };
          
          // Add to model records (will be saved later if not in test mode)
          if (!model.records) model.records = [];
          model.records.push(newRecord);

          // Log the create operation
          changeLog.push({
            modelName,
            operation: 'create',
            recordId: newRecord.id,
            data: data,
            timestamp: now
          });
          
          return {
            id: newRecord.id,
            ...newRecord.data,
            createdAt: newRecord.createdAt,
            updatedAt: newRecord.updatedAt
          };
        },

        // Update a record
        update: (modelName: string, where: any, data: any) => {
          const now = new Date().toISOString();
          
          if (testMode) {
            // In test mode, just simulate the update
            const testRecord = {
              id: where.id || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...data,
              updatedAt: now
            };

            changeLog.push({
              modelName,
              operation: 'update',
              recordId: testRecord.id,
              data: data,
              timestamp: now
            });

            return testRecord;
          }

          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          const recordIndex = (model.records || []).findIndex((record: any) => {
            return Object.entries(where).every(([key, value]) => {
              return record.data[key] === value || record.id === value;
            });
          });
          
          if (recordIndex === -1) {
            throw new Error(`Record not found for update in ${modelName}`);
          }
          
          const record = model.records[recordIndex];
          const previousData = { ...record.data };
          
          // Update the record
          record.data = { ...record.data, ...data };
          record.updatedAt = now;
          
          // Log the update operation
          changeLog.push({
            modelName,
            operation: 'update',
            recordId: record.id,
            data: data,
            previousData: previousData,
            timestamp: now
          });
          
          return {
            id: record.id,
            ...record.data,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          };
        },

        // Delete a record
        delete: (modelName: string, where: any) => {
          const now = new Date().toISOString();
          
          if (testMode) {
            // In test mode, just simulate the deletion
            const testRecord = {
              id: where.id || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            changeLog.push({
              modelName,
              operation: 'delete',
              recordId: testRecord.id,
              timestamp: now
            });

            return testRecord;
          }

          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          const recordIndex = (model.records || []).findIndex((record: any) => {
            return Object.entries(where).every(([key, value]) => {
              return record.data[key] === value || record.id === value;
            });
          });
          
          if (recordIndex === -1) {
            throw new Error(`Record not found for deletion in ${modelName}`);
          }
          
          const record = model.records[recordIndex];
          const deletedRecord = {
            id: record.id,
            ...record.data,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          };
          
          // Remove the record
          model.records.splice(recordIndex, 1);
          
          // Log the delete operation
          changeLog.push({
            modelName,
            operation: 'delete',
            recordId: record.id,
            previousData: record.data,
            timestamp: now
          });
          
          return deletedRecord;
        },

        // Get change log
        getChangeLog: () => changeLog
      };
    };

    // Create the database interface
    const db = createRealDatabase(agentData);

    // Create execution context
    const context = {
      db,
      env: envVars,
      input: inputParameters,
      console: {
        log: (...args: any[]) => console.log(`[Schedule ${scheduleId}]`, ...args),
        error: (...args: any[]) => console.error(`[Schedule ${scheduleId}]`, ...args),
        warn: (...args: any[]) => console.warn(`[Schedule ${scheduleId}]`, ...args),
        info: (...args: any[]) => console.info(`[Schedule ${scheduleId}]`, ...args)
      },
      schedule: {
        id: scheduleId,
        interval: interval,
        testMode
      }
    };

    // Execute the code
    let result: any;
    let executionError: string | null = null;

    try {
      // Create an async function from the code string (same approach as execute-action)
      const executeFunction = new Function(
        'db', 'env', 'input', 'console', 'schedule',
        `
        return (async () => {
          try {
            ${code}
          } catch (error) {
            throw new Error('Execution error: ' + error.message);
          }
        })();
        `
      );
      
      // Execute with the context parameters and await the promise
      result = await executeFunction(
        context.db,
        context.env,
        context.input,
        context.console,
        context.schedule
      );
    } catch (error: any) {
      console.error('Schedule execution error:', error);
      executionError = error.message || 'Unknown execution error';
    }

    const executionTime = Date.now() - startTime;

    // Calculate next run time based on cron pattern
    const calculateNextRun = (cronPattern: string, timezone?: string): string => {
      try {
        const interval = CronExpressionParser.parse(cronPattern, {
          tz: timezone || 'UTC'
        });
        return interval.next().toDate().toISOString();
      } catch (error) {
        console.error(`Invalid cron pattern: ${cronPattern}`, error);
        // Fallback to 1 hour from now if pattern is invalid
        const now = new Date();
        const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        return nextRun.toISOString();
      }
    };

    const nextRun = calculateNextRun(interval.pattern, interval.timezone);

    // Get database changes
    const changeLog = db.getChangeLog();
    const modelsAffected = changeLog.reduce((acc: any[], change) => {
      const existingModel = acc.find(m => m.name === change.modelName);
      if (existingModel) {
        existingModel.changes.push(change);
        existingModel.recordCount = agentData.models.find((m: any) => m.name === change.modelName)?.records?.length || 0;
      } else {
        acc.push({
          name: change.modelName,
          recordCount: agentData.models.find((m: any) => m.name === change.modelName)?.records?.length || 0,
          changes: [change]
        });
      }
      return acc;
    }, []);

    // Save changes to document if not in test mode
    if (!testMode && changeLog.length > 0) {
      try {
        // Add execution history to agent data content instead of metadata
        if (!agentData.executionHistory) {
          agentData.executionHistory = [];
        }
        
        // Add new execution record
        agentData.executionHistory.push({
          timestamp: new Date().toISOString(),
          executionTime,
          success: !executionError,
          testMode: false,
          scheduleId,
          type: 'schedule',
          modelsAffected: modelsAffected.map(m => ({
            name: m.name,
            recordCount: m.recordCount,
            changesCount: m.changes.length
          })),
          changesSummary: changeLog.length,
          changelog: changeLog
        });
        
        // Keep only last 20 execution records
        agentData.executionHistory = agentData.executionHistory.slice(-20);

        await saveOrUpdateDocument({
          id: documentId,
          title: document.title,
          kind: document.kind,
          content: JSON.stringify(agentData),
          userId: userId,
          metadata: {
            ...(document.metadata as Record<string, any> || {}),
            lastScheduleExecution: new Date().toISOString()
          }
        });
      } catch (saveError) {
        console.error('Failed to save document after schedule execution:', saveError);
      }
    }

    // Return execution result
    if (executionError) {
      return {
        success: false,
        error: executionError,
        executionTime,
        nextRun: testMode ? undefined : nextRun
      };
    }

    return {
      success: true,
      result,
      executionTime,
      nextRun: testMode ? undefined : nextRun,
      databaseUpdated: !testMode && changeLog.length > 0,
      modelsAffected,
      message: testMode 
        ? `Schedule tested successfully. ${changeLog.length} operations simulated.`
        : `Schedule executed successfully. ${changeLog.length} database operations completed.`
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('Schedule execution error:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown execution error',
      executionTime
    };
  }
} 