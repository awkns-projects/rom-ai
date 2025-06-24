import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById, saveOrUpdateDocument } from '@/lib/db/queries';

// Schema for the schedule execution request
const ExecuteScheduleSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent data'),
  scheduleId: z.string().describe('Schedule ID to execute'),
  code: z.string().describe('JavaScript code to execute'),
  inputParameters: z.record(z.any()).describe('Input parameters for the code'),
  envVars: z.record(z.string()).describe('Environment variables'),
  testMode: z.boolean().default(false).describe('Whether this is a test run (no database updates)'),
  interval: z.object({
    pattern: z.string(),
    timezone: z.string().optional(),
    active: z.boolean()
  }).describe('Schedule interval configuration')
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ExecuteScheduleSchema.parse(body);
    const { documentId, scheduleId, code, inputParameters, envVars, testMode, interval } = validatedData;

    // Fetch the document to get the real database structure and records
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return Response.json({ error: 'Unauthorized access to document' }, { status: 403 });
    }

    if (!document.content) {
      return Response.json({ error: 'Document has no content' }, { status: 400 });
    }

    // Parse the agent data from document content
    let agentData;
    try {
      agentData = JSON.parse(document.content);
    } catch (parseError) {
      return Response.json({ error: 'Invalid agent data format' }, { status: 400 });
    }

    if (!agentData.models || !Array.isArray(agentData.models)) {
      return Response.json({ error: 'No models found in agent data' }, { status: 400 });
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
            throw new Error(`Record not found in ${modelName}`);
          }
          
          const existingRecord = model.records[recordIndex];
          const updatedRecord = {
            ...existingRecord,
            data: { ...existingRecord.data, ...data },
            updatedAt: now
          };
          
          model.records[recordIndex] = updatedRecord;

          // Log the update operation
          changeLog.push({
            modelName,
            operation: 'update',
            recordId: updatedRecord.id,
            data: data,
            previousData: existingRecord.data,
            timestamp: now
          });
          
          return {
            id: updatedRecord.id,
            ...updatedRecord.data,
            createdAt: updatedRecord.createdAt,
            updatedAt: updatedRecord.updatedAt
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
            throw new Error(`Record not found in ${modelName}`);
          }
          
          const deletedRecord = model.records[recordIndex];
          model.records.splice(recordIndex, 1);

          // Log the delete operation
          changeLog.push({
            modelName,
            operation: 'delete',
            recordId: deletedRecord.id,
            previousData: deletedRecord.data,
            timestamp: now
          });
          
          return {
            id: deletedRecord.id,
            ...deletedRecord.data,
            createdAt: deletedRecord.createdAt,
            updatedAt: deletedRecord.updatedAt
          };
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
    const startTime = Date.now();
    let result: any;
    let executionError: string | null = null;

    try {
      // Create a function from the code string and execute it
      const func = new Function('context', `
        const { db, env, input, console, schedule } = context;
        ${code}
      `);
      
      result = await func(context);
    } catch (error: any) {
      console.error('Schedule execution error:', error);
      executionError = error.message || 'Unknown execution error';
    }

    const executionTime = Date.now() - startTime;

    // Calculate next run time based on cron pattern
    const calculateNextRun = (cronPattern: string): string => {
      // Simple next run calculation - in a real app you'd use a proper cron library
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
      return nextRun.toISOString();
    };

    const nextRun = calculateNextRun(interval.pattern);

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
        await saveOrUpdateDocument({
          id: documentId,
          title: document.title,
          kind: document.kind,
          content: JSON.stringify(agentData),
          userId: session.user.id,
          metadata: {
            ...(document.metadata as Record<string, any> || {}),
            lastScheduleExecution: new Date().toISOString(),
            executionHistory: [
              ...((document.metadata as any)?.executionHistory || []).slice(-9), // Keep last 9
              {
                timestamp: new Date().toISOString(),
                executionTime,
                success: !executionError,
                testMode: false,
                scheduleId,
                type: 'schedule'
              }
            ]
          }
        });
      } catch (saveError) {
        console.error('Failed to save document after schedule execution:', saveError);
      }
    }

    // Return execution result
    if (executionError) {
      return Response.json({
        success: false,
        error: executionError,
        executionTime,
        testMode,
        scheduleId,
        nextRun: testMode ? null : nextRun
      });
    }

    return Response.json({
      success: true,
      result,
      executionTime,
      testMode,
      scheduleId,
      nextRun: testMode ? null : nextRun,
      databaseUpdated: !testMode && changeLog.length > 0,
      modelsAffected,
      message: testMode 
        ? `Schedule tested successfully. ${changeLog.length} operations simulated.`
        : `Schedule executed successfully. ${changeLog.length} database operations completed.`
    });

  } catch (error: any) {
    console.error('Schedule execution API error:', error);
    
    if (error.name === 'ZodError') {
      return Response.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ 
    message: 'Schedule execution endpoint',
    methods: ['POST'],
    description: 'Execute a schedule with database operations'
  });
} 