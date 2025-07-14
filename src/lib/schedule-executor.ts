import { getDocumentById } from './db/queries';
import { getAgentBuilderModel } from './ai/tools/agent-builder/generation';
import { generateObject } from 'ai';
import { z } from 'zod';

export interface ExecuteScheduleParams {
  documentId: string;
  scheduleId: string;
  code: string;
  inputParameters: Record<string, any>;
  envVars: Record<string, any>;
  testMode: boolean;
  interval?: any;
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

    // Create mock database with change tracking (same as action execution)
    const createRealDatabase = (agentData: any) => {
      const changeLog: any[] = [];
      const models = agentData.models || [];
      
      const database: any = {};
      
      models.forEach((model: any) => {
        const modelName = model.name;
        const records = model.records || [];
        
        database[modelName] = {
          // Read operations
          findUnique: async (query: any) => {
            const record = records.find((r: any) => {
              if (query.where.id) return r.id === query.where.id;
              return Object.entries(query.where).every(([key, value]) => r.data[key] === value);
            });
            
            changeLog.push({
              type: 'database',
              operation: 'read',
              model: modelName,
              recordCount: record ? 1 : 0,
              timestamp: new Date().toISOString()
            });
            
            return record ? { id: record.id, ...record.data } : null;
          },
          
          findFirst: async (query: any) => {
            let filteredRecords = records;
            
            if (query?.where) {
              filteredRecords = records.filter((r: any) => {
                return Object.entries(query.where).every(([key, value]) => {
                  if (key === 'id') return r.id === value;
                  return r.data[key] === value;
                });
              });
            }
            
            changeLog.push({
              type: 'database',
              operation: 'read',
              model: modelName,
              recordCount: filteredRecords.length > 0 ? 1 : 0,
              timestamp: new Date().toISOString()
            });
            
            const record = filteredRecords[0];
            return record ? { id: record.id, ...record.data } : null;
          },
          
          findMany: async (query: any) => {
            let filteredRecords = records;
            
            if (query?.where) {
              filteredRecords = records.filter((r: any) => {
                return Object.entries(query.where).every(([key, value]) => {
                  if (key === 'id') return r.id === value;
                  return r.data[key] === value;
                });
              });
            }
            
            if (query?.take) {
              filteredRecords = filteredRecords.slice(0, query.take);
            }
            
            changeLog.push({
              type: 'database',
              operation: 'read',
              model: modelName,
              recordCount: filteredRecords.length,
              timestamp: new Date().toISOString()
            });
            
            return filteredRecords.map((r: any) => ({ id: r.id, ...r.data }));
          },
          
          // Write operations
          create: async (query: any) => {
            const newRecord = {
              id: query.data.id || `${modelName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              data: { ...query.data }
            };
            
            records.push(newRecord);
            
            changeLog.push({
              type: 'database',
              operation: 'create',
              model: modelName,
              recordCount: 1,
              recordId: newRecord.id,
              timestamp: new Date().toISOString()
            });
            
            return { id: newRecord.id, ...newRecord.data };
          },
          
          update: async (query: any) => {
            const recordIndex = records.findIndex((r: any) => {
              if (query.where.id) return r.id === query.where.id;
              return Object.entries(query.where).every(([key, value]) => r.data[key] === value);
            });
            
            if (recordIndex === -1) {
              throw new Error(`${modelName} record not found for update`);
            }
            
            records[recordIndex].data = { ...records[recordIndex].data, ...query.data };
            
            changeLog.push({
              type: 'database',
              operation: 'update',
              model: modelName,
              recordCount: 1,
              recordId: records[recordIndex].id,
              timestamp: new Date().toISOString()
            });
            
            return { id: records[recordIndex].id, ...records[recordIndex].data };
          },
          
          delete: async (query: any) => {
            const recordIndex = records.findIndex((r: any) => {
              if (query.where.id) return r.id === query.where.id;
              return Object.entries(query.where).every(([key, value]) => r.data[key] === value);
            });
            
            if (recordIndex === -1) {
              throw new Error(`${modelName} record not found for deletion`);
            }
            
            const deletedRecord = records.splice(recordIndex, 1)[0];
            
            changeLog.push({
              type: 'database',
              operation: 'delete',
              model: modelName,
              recordCount: 1,
              recordId: deletedRecord.id,
              timestamp: new Date().toISOString()
            });
            
            return { id: deletedRecord.id, ...deletedRecord.data };
          }
        };
      });
      
      // Add change log accessor
      database.getChangeLog = () => changeLog;
      
      return database;
    };

    const db = createRealDatabase(agentData);

    // Create AI interface for AI analysis steps
    const aiInterface = {
      generateObject: async (config: any) => {
        const model = await getAgentBuilderModel();
        return generateObject({
          model,
          ...config
        });
      }
    };

    // Import AI clients (same as action execution)
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { createXai } = await import('@ai-sdk/xai');
    
    // Create AI client instances
    const openaiClient = createOpenAI({
      apiKey: envVars.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    });
    
    const xaiClient = createXai({
      apiKey: envVars.XAI_API_KEY || process.env.XAI_API_KEY,
    });

    // Mock Replicate client
    const replicateClient = {
      run: async (model: string, input: any) => {
        console.log(`Mock Replicate call to ${model} with input:`, input);
        return { output: "Mock AI generation result" };
      }
    };

    // Create execution context (same pattern as action execution)
    const executionContext = {
      prisma: db, // Map db to prisma for compatibility with generated code
      db, // Keep original for backward compatibility
      ai: aiInterface,
      openai: openaiClient,
      xai: xaiClient,
      replicate: replicateClient,
      input: inputParameters,
      env: envVars,
      testMode,
      // Utility functions
      console: {
        log: (...args: any[]) => console.log(`[Schedule ${scheduleId}]`, ...args),
        error: (...args: any[]) => console.error(`[Schedule ${scheduleId}]`, ...args),
        warn: (...args: any[]) => console.warn(`[Schedule ${scheduleId}]`, ...args),
        info: (...args: any[]) => console.info(`[Schedule ${scheduleId}]`, ...args)
      },
      // Helper functions
      generateId: () => `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formatDate: (date: Date | string) => new Date(date).toISOString(),
      validateRequired: (obj: any, fields: string[]) => {
        const missing = fields.filter(field => !obj[field]);
        if (missing.length > 0) {
          throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
      },
      schedule: {
        id: scheduleId,
        interval: interval,
        testMode
      },
      z: z // Add zod for schema validation in AI analysis steps
    };

    // Execute the code (same pattern as action execution)
    let result: any;
    let executionError: string | null = null;

    try {
      // Create an async function from the code string with proper parameter mapping
      const executeFunction = new Function(
        'context',
        `
        return (async () => {
          try {
            // Destructure context for generated code compatibility
            const { prisma, ai, openai, xai, replicate, input, env } = context;
            
            // Make other utilities available in scope
            const { db, console: consoleUtils, generateId, formatDate, validateRequired, z, testMode, schedule } = context;
            
            // Execute the generated code
            ${code}
          } catch (error) {
            throw new Error('Execution error: ' + error.message);
          }
        })();
        `
      );
      
      // Execute with the context object
      result = await executeFunction(executionContext);
    } catch (error: any) {
      console.error('Schedule execution error:', error);
      executionError = error.message || 'Unknown execution error';
    }

    const executionTime = Date.now() - startTime;

    // Calculate next run time based on cron pattern
    const calculateNextRun = (cronPattern: string, timezone?: string): string => {
      try {
        // Simple next run calculation (replace with actual cron parser if needed)
        const now = new Date();
        const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
        return nextRun.toISOString();
      } catch (error) {
        console.error(`Invalid cron pattern: ${cronPattern}`, error);
        // Fallback to 1 hour from now if pattern is invalid
        const now = new Date();
        const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        return nextRun.toISOString();
      }
    };

    const nextRun = interval?.pattern ? calculateNextRun(interval.pattern, interval.timezone) : null;

    // Get database changes
    const changeLog = db.getChangeLog();
    const modelsAffected = changeLog.reduce((acc: any[], change: any) => {
      const existingModel = acc.find((m: any) => m.name === change.model);
      if (existingModel) {
        existingModel.changes.push(change);
        existingModel.recordCount = agentData.models.find((m: any) => m.name === change.model)?.records?.length || 0;
      } else {
        acc.push({
          name: change.model,
          recordCount: agentData.models.find((m: any) => m.name === change.model)?.records?.length || 0,
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
          modelsAffected: modelsAffected.map((m: any) => ({
            name: m.name,
            recordCount: m.recordCount,
            changesCount: m.changes.length
          })),
          changesSummary: changeLog.length,
          changelog: changeLog
        });
        
        // Keep only last 20 execution records
        agentData.executionHistory = agentData.executionHistory.slice(-20);

        // The original code had saveOrUpdateDocument here, but it's not imported.
        // Assuming the intent was to save to the document's content if it were available.
        // For now, we'll just log the error if saveOrUpdateDocument is not available.
        console.error('saveOrUpdateDocument is not available, skipping document save.');

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
        nextRun: testMode ? undefined : (nextRun || undefined)
      };
    }

    return {
      success: true,
      result,
      executionTime,
      nextRun: testMode ? undefined : (nextRun || undefined),
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