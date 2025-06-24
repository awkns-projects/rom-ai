import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById, saveOrUpdateDocument } from '@/lib/db/queries';
import { generateObject } from 'ai';
import { getAgentBuilderModel } from '@/lib/ai/tools/agent-builder/generation';

// Schema for the execution request
const ExecuteActionSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent data'),
  code: z.string().describe('JavaScript code to execute'),
  inputParameters: z.record(z.any()).describe('Input parameters for the code'),
  envVars: z.record(z.string()).describe('Environment variables'),
  testMode: z.boolean().default(false).describe('Whether this is a test run (no database updates)')
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ExecuteActionSchema.parse(body);
    const { documentId, code, inputParameters, envVars, testMode } = validatedData;

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

        // Create multiple records
        createMany: (modelName: string, dataArray: any[]) => {
          const now = new Date().toISOString();
          const createdRecords = [];
          
          if (testMode) {
            // In test mode, just simulate the creation
            for (const data of dataArray) {
              const testRecord = {
                id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...data,
                createdAt: now,
                updatedAt: now
              };
              createdRecords.push(testRecord);

              changeLog.push({
                modelName,
                operation: 'create',
                recordId: testRecord.id,
                data: data,
                timestamp: now
              });
            }

            return { count: createdRecords.length, records: createdRecords };
          }

          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          if (!model.records) model.records = [];
          
          for (const data of dataArray) {
            const newRecord = {
              id: `${modelName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              modelId: model.id,
              data: data,
              createdAt: now,
              updatedAt: now
            };
            
            model.records.push(newRecord);
            createdRecords.push({
              id: newRecord.id,
              ...newRecord.data,
              createdAt: newRecord.createdAt,
              updatedAt: newRecord.updatedAt
            });

            // Log each create operation
            changeLog.push({
              modelName,
              operation: 'create',
              recordId: newRecord.id,
              data: data,
              timestamp: now
            });
          }
          
          return { count: createdRecords.length, records: createdRecords };
        },

        // Update a record
        update: (modelName: string, where: any, data: any) => {
          const now = new Date().toISOString();
          
          if (testMode) {
            // In test mode, just simulate the update
            const testRecord = {
              id: where.id || `test_${Date.now()}`,
              ...data,
              updatedAt: now
            };

            changeLog.push({
              modelName,
              operation: 'update',
              recordId: testRecord.id,
              data: data,
              previousData: { simulated: 'previous data not available in test mode' },
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
          
          // Store previous data for change tracking
          const previousData = { ...model.records[recordIndex].data };
          
          model.records[recordIndex] = {
            ...model.records[recordIndex],
            data: { ...model.records[recordIndex].data, ...data },
            updatedAt: now
          };

          // Log the update operation
          changeLog.push({
            modelName,
            operation: 'update',
            recordId: model.records[recordIndex].id,
            data: data,
            previousData: previousData,
            timestamp: now
          });
          
          return {
            id: model.records[recordIndex].id,
            ...model.records[recordIndex].data,
            createdAt: model.records[recordIndex].createdAt,
            updatedAt: model.records[recordIndex].updatedAt
          };
        },

        // Update multiple records
        updateMany: (modelName: string, where: any, data: any) => {
          const now = new Date().toISOString();
          const updatedRecords = [];
          
          if (testMode) {
            // In test mode, just simulate the update
            const testRecord = {
              id: where.id || `test_${Date.now()}`,
              ...data,
              updatedAt: now
            };

            changeLog.push({
              modelName,
              operation: 'updateMany',
              data: data,
              previousData: { simulated: 'previous data not available in test mode' },
              timestamp: now
            });

            return { count: 1, records: [testRecord] };
          }

          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          const recordsToUpdate = (model.records || []).filter((record: any) => {
            return Object.entries(where).every(([key, value]) => {
              return record.data[key] === value || record.id === value;
            });
          });
          
          for (const record of recordsToUpdate) {
            const recordIndex = model.records.findIndex((r: any) => r.id === record.id);
            const previousData = { ...record.data };
            
            model.records[recordIndex] = {
              ...record,
              data: { ...record.data, ...data },
              updatedAt: now
            };

            updatedRecords.push({
              id: record.id,
              ...model.records[recordIndex].data,
              createdAt: record.createdAt,
              updatedAt: now
            });

            // Log each update operation
            changeLog.push({
              modelName,
              operation: 'update',
              recordId: record.id,
              data: data,
              previousData: previousData,
              timestamp: now
            });
          }
          
          return { count: updatedRecords.length, records: updatedRecords };
        },

        // Delete a record
        delete: (modelName: string, where: any) => {
          const now = new Date().toISOString();
          
          if (testMode) {
            // In test mode, just simulate the deletion
            const testRecord = {
              id: where.id || `test_${Date.now()}`,
              deleted: true
            };

            changeLog.push({
              modelName,
              operation: 'delete',
              recordId: testRecord.id,
              previousData: { simulated: 'deleted record data not available in test mode' },
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
          
          // Store data of deleted record
          const deletedRecord = model.records[recordIndex];
          const previousData = { ...deletedRecord.data };
          
          // Remove from model records
          model.records.splice(recordIndex, 1);

          // Log the delete operation
          changeLog.push({
            modelName,
            operation: 'delete',
            recordId: deletedRecord.id,
            previousData: previousData,
            timestamp: now
          });
          
          return {
            id: deletedRecord.id,
            deleted: true
          };
        },

        // Delete multiple records
        deleteMany: (modelName: string, where: any) => {
          const now = new Date().toISOString();
          const deletedRecords = [];
          
          if (testMode) {
            // In test mode, just simulate the deletion
            const testRecord = {
              id: where.id || `test_${Date.now()}`,
              deleted: true
            };

            changeLog.push({
              modelName,
              operation: 'deleteMany',
              previousData: { simulated: 'deleted record data not available in test mode' },
              timestamp: now
            });

            return { count: 1, records: [testRecord] };
          }

          const model = models.find((m: any) => m.name === modelName);
          if (!model) {
            throw new Error(`Model ${modelName} not found`);
          }
          
          const recordsToDelete = (model.records || []).filter((record: any) => {
            return Object.entries(where).every(([key, value]) => {
              return record.data[key] === value || record.id === value;
            });
          });
          
          for (const record of recordsToDelete) {
            const recordIndex = model.records.findIndex((r: any) => r.id === record.id);
            const previousData = { ...record.data };
            
            // Remove from model records
            model.records.splice(recordIndex, 1);

            deletedRecords.push({
              id: record.id,
              deleted: true
            });

            // Log each delete operation
            changeLog.push({
              modelName,
              operation: 'delete',
              recordId: record.id,
              previousData: previousData,
              timestamp: now
            });
          }
          
          return { count: deletedRecords.length, records: deletedRecords };
        },

        // Get change log for reporting
        getChangeLog: () => changeLog
      };
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

    // Create execution context
    const executionContext = {
      db,
      input: inputParameters,
      envVars,
      testMode,
      // Utility functions
      console: {
        log: (...args: any[]) => console.log('[Action Execution]', ...args),
        error: (...args: any[]) => console.error('[Action Execution]', ...args),
        warn: (...args: any[]) => console.warn('[Action Execution]', ...args)
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
      ai: aiInterface,
      z: z // Add zod for schema validation in AI analysis steps
    };

    // Execute the code
    let result;
    let executionError = null;
    const startTime = Date.now();

    try {
      // Create a function from the code string
      const executeFunction = new Function(
        'db', 'input', 'envVars', 'testMode', 'console', 'generateId', 'formatDate', 'validateRequired', 'ai', 'z',
        `
        try {
          ${code}
        } catch (error) {
          throw new Error('Execution error: ' + error.message);
        }
        `
      );

      // Execute with the context
      result = await executeFunction(
        executionContext.db,
        executionContext.input,
        executionContext.envVars,
        executionContext.testMode,
        executionContext.console,
        executionContext.generateId,
        executionContext.formatDate,
        executionContext.validateRequired,
        executionContext.ai,
        executionContext.z
      );

    } catch (error) {
      executionError = error instanceof Error ? error.message : 'Unknown execution error';
      console.error('Code execution failed:', error);
    }

    const executionTime = Date.now() - startTime;

    // Get change log for reporting
    const changeLog = db.getChangeLog();

    // Save updated agent data back to document if not in test mode and no errors
    if (!testMode && !executionError) {
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
          type: 'action',
          error: executionError,
          changelog: changeLog
        });
        
        // Keep only last 20 execution records
        agentData.executionHistory = agentData.executionHistory.slice(-20);

        const updatedContent = JSON.stringify(agentData);
        await saveOrUpdateDocument({
          id: documentId,
          title: document.title,
          content: updatedContent,
          kind: document.kind as any,
          userId: session.user.id,
          metadata: {
            ...(document.metadata as Record<string, any> || {}),
            lastActionExecution: new Date().toISOString()
          }
        });
        console.log('✅ Document updated with new database state');
      } catch (saveError) {
        console.error('❌ Failed to save updated document:', saveError);
      }
    }

    // Return execution results
    // (changeLog is already defined above)
    
    // Organize changes by model for better UI display
    const modelChanges = agentData.models.map((model: any) => {
      const modelChangeLog = changeLog.filter(change => 
        change.modelName === model.name && 
        ['create', 'update', 'delete'].includes(change.operation)
      );
      
      return {
        name: model.name,
        recordCount: (model.records || []).length,
        changes: modelChangeLog.map(change => ({
          operation: change.operation,
          recordId: change.recordId,
          data: change.data,
          previousData: change.previousData,
          timestamp: change.timestamp
        }))
      };
    });

    return Response.json({
      success: !executionError,
      result: result || null,
      error: executionError,
      executionTime,
      testMode,
      databaseUpdated: !testMode && !executionError,
      modelsAffected: modelChanges,
      changeLog: changeLog, // Keep full change log for debugging
      changesCount: changeLog.filter(c => ['create', 'update', 'delete'].includes(c.operation)).length
    });

  } catch (error) {
    console.error('Execute action API error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return Response.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'Action execution API',
    methods: ['POST'],
    description: 'Execute action code with real database records from document',
    schema: {
      documentId: 'string (required) - Document ID containing agent data',
      code: 'string (required) - JavaScript code to execute',
      inputParameters: 'object (required) - Input parameters for the code',
      envVars: 'object (required) - Environment variables',
      testMode: 'boolean (optional) - Whether this is a test run (default: false)'
    },
    context: {
      db: 'Real database interface with findMany, findUnique, create, createMany, update, updateMany, delete, deleteMany methods',
      input: 'Input parameters passed to the code',
      envVars: 'Environment variables',
      testMode: 'Boolean indicating if this is a test run',
      utilities: 'console, generateId, formatDate, validateRequired helper functions',
      ai: 'AI variable for generating objects with schema validation',
      z: 'Zod schema validation library for AI analysis steps'
    }
  });
} 