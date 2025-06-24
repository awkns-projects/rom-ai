import { NextRequest } from 'next/server';
import { getAllDocuments, saveOrUpdateDocument } from '@/lib/db/queries';
import { CronExpressionParser } from 'cron-parser';
import { executeScheduleDirectly } from '@/lib/schedule-executor';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes (maximum for Hobby plan)
export const dynamic = 'force-dynamic';

// Configuration constants
const MAX_DOCUMENTS_PER_RUN = 50; // Limit documents processed per cron run
const MAX_SCHEDULES_PER_RUN = 100; // Limit total schedules processed per cron run
const MAX_CONCURRENT_EXECUTIONS = 5; // Limit concurrent schedule executions
const EXECUTION_TIMEOUT = 4 * 60 * 1000; // 4 minutes (less than maxDuration)
const CRON_TIMEOUT = 4.5 * 60 * 1000; // 4.5 minutes total cron timeout

// Interface for schedule with lastProcessedAt
interface ScheduleWithTracking {
  id: string;
  name: string;
  interval: {
    pattern: string;
    timezone?: string;
    active: boolean;
  };
  lastProcessedAt?: string;
  savedInputs?: {
    inputParameters: Record<string, any>;
    envVars: Record<string, string>;
    lastUpdated: string;
  };
  execute?: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: Array<{
        name: string;
        description: string;
        required: boolean;
        sensitive: boolean;
      }>;
    };
  };
}

// Helper function to check if a schedule should run based on cron pattern and last execution
function shouldScheduleRun(schedule: ScheduleWithTracking): { shouldRun: boolean; error?: string } {
  try {
    // Validate basic schedule structure
    if (!schedule || typeof schedule !== 'object') {
      return { shouldRun: false, error: 'Invalid schedule object' };
    }

    if (!schedule.id || typeof schedule.id !== 'string') {
      return { shouldRun: false, error: 'Schedule missing valid ID' };
    }

    if (!schedule.interval || typeof schedule.interval !== 'object') {
      return { shouldRun: false, error: 'Schedule missing interval configuration' };
    }

    if (!schedule.interval.active) {
      return { shouldRun: false };
    }

    if (!schedule.interval.pattern || typeof schedule.interval.pattern !== 'string') {
      return { shouldRun: false, error: 'Schedule missing cron pattern' };
    }

    // Parse the cron pattern with better error handling
    let interval;
    try {
      interval = CronExpressionParser.parse(schedule.interval.pattern, {
        tz: schedule.interval.timezone || 'UTC'
      });
    } catch (error) {
      const errorMsg = `Invalid cron pattern for schedule ${schedule.id}: ${schedule.interval.pattern} - ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      return { shouldRun: false, error: errorMsg };
    }

    const now = new Date();
    
    // If never processed, check if we're past the first scheduled time
    if (!schedule.lastProcessedAt) {
      try {
        // For first time execution, check if current time is past any scheduled execution time
        // Get the next execution time from a point in the past to see if we should have run by now
        const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        const nextScheduledFromPast = CronExpressionParser.parse(schedule.interval.pattern, {
          currentDate: pastDate,
          tz: schedule.interval.timezone || 'UTC'
        }).next().toDate();
        
        return { shouldRun: now >= nextScheduledFromPast };
      } catch (error) {
        return { shouldRun: false, error: `Failed to calculate next run time: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }

    // Check if enough time has passed since last execution
    try {
      const lastProcessed = new Date(schedule.lastProcessedAt);
      
      // Validate the lastProcessedAt date
      if (isNaN(lastProcessed.getTime())) {
        console.warn(`Invalid lastProcessedAt date for schedule ${schedule.id}, treating as never processed`);
        const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        const nextScheduledFromPast = CronExpressionParser.parse(schedule.interval.pattern, {
          currentDate: pastDate,
          tz: schedule.interval.timezone || 'UTC'
        }).next().toDate();
        return { shouldRun: now >= nextScheduledFromPast };
      }

      const nextScheduledRun = CronExpressionParser.parse(schedule.interval.pattern, {
        currentDate: lastProcessed,
        tz: schedule.interval.timezone || 'UTC'
      }).next().toDate();

      return { shouldRun: now >= nextScheduledRun };
    } catch (error) {
      return { shouldRun: false, error: `Failed to calculate schedule timing: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  } catch (error) {
    return { shouldRun: false, error: `Unexpected error in shouldScheduleRun: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Helper function to execute a schedule with timeout protection
async function executeSchedule(documentId: string, schedule: ScheduleWithTracking): Promise<{
  success: boolean;
  error?: string;
  executionTime?: number;
  result?: any;
}> {
  const startTime = Date.now();
  
  try {
    // Validate inputs
    if (!documentId || typeof documentId !== 'string') {
      return {
        success: false,
        error: 'Invalid document ID'
      };
    }

    // Check if schedule has execute configuration
    if (!schedule?.execute) {
      return {
        success: false,
        error: 'Schedule missing execute configuration'
      };
    }

    // Only handle code execution type for now
    if (schedule.execute.type !== 'code') {
      return {
        success: false,
        error: `Unsupported execution type: ${schedule.execute.type}`
      };
    }

    if (!schedule.execute.code?.script) {
      return {
        success: false,
        error: 'No executable code found'
      };
    }

    if (typeof schedule.execute.code.script !== 'string') {
      return {
        success: false,
        error: 'Invalid script format'
      };
    }

    // Use saved inputs if available, otherwise use empty objects
    const inputParameters = schedule.savedInputs?.inputParameters || {};
    const envVars = schedule.savedInputs?.envVars || {};

    // Add timeout protection for execution
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), EXECUTION_TIMEOUT);
    });

    // Call the direct execution function with timeout protection
    const result = await Promise.race([
      executeScheduleDirectly({
        documentId,
        scheduleId: schedule.id,
        code: schedule.execute.code.script,
        inputParameters,
        envVars,
        testMode: false, // Always run in production mode for cron
        interval: schedule.interval
      }),
      timeoutPromise
    ]);

    return {
      success: result.success,
      error: result.error,
      executionTime: Date.now() - startTime,
      result: result.result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error',
      executionTime: Date.now() - startTime
    };
  }
}

// Helper function to execute schedules with concurrency control
async function executeSchedulesWithConcurrencyLimit(
  schedules: Array<{ documentId: string; schedule: ScheduleWithTracking }>,
  maxConcurrent: number = MAX_CONCURRENT_EXECUTIONS
): Promise<Array<{
  documentId: string;
  scheduleId: string;
  scheduleName: string;
  success: boolean;
  error?: string;
  executionTime?: number;
}>> {
  const results: Array<{
    documentId: string;
    scheduleId: string;
    scheduleName: string;
    success: boolean;
    error?: string;
    executionTime?: number;
  }> = [];

  // Process schedules in batches to control concurrency
  for (let i = 0; i < schedules.length; i += maxConcurrent) {
    const batch = schedules.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async ({ documentId, schedule }) => {
      const executionResult = await executeSchedule(documentId, schedule);
      return {
        documentId,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        success: executionResult.success,
        error: executionResult.error,
        executionTime: executionResult.executionTime
      };
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          documentId: 'unknown',
          scheduleId: 'unknown',
          scheduleName: 'unknown',
          success: false,
          error: `Batch execution failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`
        });
      }
    }
  }

  return results;
}

// Helper function to safely parse JSON with fallback
function safeJsonParse(content: string, fallback: any = null): any {
  try {
    if (!content || typeof content !== 'string') {
      return fallback;
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

// Helper function to safely update document
async function safeUpdateDocument(document: any, agentData: any): Promise<boolean> {
  try {
    if (!document?.id || !agentData) {
      return false;
    }

    const updatedContent = JSON.stringify(agentData, null, 2);
    await saveOrUpdateDocument({
      id: document.id,
      content: updatedContent,
      userId: document.userId,
      title: document.title || 'Untitled',
      kind: 'agent',
      metadata: {
        ...(document.metadata as Record<string, any> || {}),
        lastScheduleExecution: new Date().toISOString()
      }
    });
    return true;
  } catch (error) {
    console.error(`Failed to update document ${document.id}:`, error);
    return false;
  }
}

// Main cron job handler
export async function GET(request: NextRequest) {
  console.log('🕒 Cron job started: Checking active schedules...');
  const cronStartTime = Date.now();
  
  // Overall timeout protection for the entire cron job
  const cronTimeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Cron job timeout')), CRON_TIMEOUT);
  });

  try {
    const result = await Promise.race([
      processCronJob(request, cronStartTime),
      cronTimeoutPromise
    ]);
    return result;
  } catch (error) {
    console.error('❌ Cron job failed with timeout or unexpected error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - cronStartTime
    }, { 
      status: 500 
    });
  }
}

// Separate function for the main cron logic to enable timeout wrapping
async function processCronJob(request: NextRequest, startTime: number) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, we might not have this header, so only check in production
      if (process.env.NODE_ENV === 'production') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get all documents to scan for schedules with timeout
    let allDocuments;
    try {
      const QUERY_TIMEOUT = 30000; // 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), QUERY_TIMEOUT);
      });
      
      allDocuments = await Promise.race([
        getAllDocuments(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      return Response.json({ 
        success: false,
        error: `Failed to fetch documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      }, { status: 500 });
    }
    
    if (!allDocuments || !Array.isArray(allDocuments) || allDocuments.length === 0) {
      console.log('📄 No documents found');
      return Response.json({ 
        success: true, 
        message: 'No documents to process',
        processedSchedules: 0,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      });
    }

    // Limit the number of documents to process
    const documents = allDocuments.slice(0, MAX_DOCUMENTS_PER_RUN);
    if (allDocuments.length > MAX_DOCUMENTS_PER_RUN) {
      console.log(`📊 Processing ${documents.length} of ${allDocuments.length} documents (limited for performance)`);
    }

    let totalSchedulesProcessed = 0;
    let totalSchedulesSkipped = 0;
    let totalErrors = 0;
    const schedulesToExecute: Array<{ documentId: string; schedule: ScheduleWithTracking; agentData: any }> = [];
    const processedDocuments = new Set<string>(); // Track documents that already have a schedule queued for execution

    // First pass: identify schedules that need to run (without executing)
    for (const document of documents) {
      try {
        if (!document?.content) {
          continue;
        }

        const agentData = safeJsonParse(document.content);
        if (!agentData) {
          console.error(`Failed to parse document ${document.id}: Invalid JSON`);
          totalErrors++;
          continue;
        }

        if (!agentData.schedules || !Array.isArray(agentData.schedules)) {
          continue;
        }

        // Check each schedule in the document
        for (const schedule of agentData.schedules as ScheduleWithTracking[]) {
          try {
            totalSchedulesProcessed++;

            // Check if we've hit the schedule limit
            if (schedulesToExecute.length >= MAX_SCHEDULES_PER_RUN) {
              totalSchedulesSkipped++;
              continue;
            }

            // Skip if we already have a schedule from this document queued for execution
            if (processedDocuments.has(document.id)) {
              console.log(`⏭️ Skipping schedule ${schedule.id} (${schedule.name}) - document ${document.id} already has a schedule queued`);
              totalSchedulesSkipped++;
              continue;
            }

            // Check if this schedule should run
            const scheduleCheck = shouldScheduleRun(schedule);
            if (scheduleCheck.error) {
              console.error(`Schedule validation error for ${schedule.id}: ${scheduleCheck.error}`);
              totalErrors++;
              continue;
            }

            if (!scheduleCheck.shouldRun) {
              console.log(`⏭️ Skipping schedule ${schedule.id} (${schedule.name}) - not ready to run`);
              continue;
            }

            // Add to execution queue and mark document as processed
            schedulesToExecute.push({
              documentId: document.id,
              schedule,
              agentData
            });
            processedDocuments.add(document.id);

          } catch (scheduleError) {
            console.error(`Unexpected error checking schedule ${schedule?.id || 'unknown'}:`, scheduleError);
            totalErrors++;
          }
        }
      } catch (documentError) {
        console.error(`Unexpected error processing document ${document.id}:`, documentError);
        totalErrors++;
      }
    }

    console.log(`📋 Found ${schedulesToExecute.length} schedules ready to execute`);

    if (schedulesToExecute.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No schedules ready to execute',
        documentsScanned: documents.length,
        schedulesProcessed: totalSchedulesProcessed,
        schedulesExecuted: 0,
        schedulesSkipped: totalSchedulesSkipped,
        totalErrors,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      });
    }

    // Second pass: execute schedules with concurrency control
    console.log(`🚀 Executing ${schedulesToExecute.length} schedules with max concurrency ${MAX_CONCURRENT_EXECUTIONS}`);
    
    const executionResults = await executeSchedulesWithConcurrencyLimit(
      schedulesToExecute.map(item => ({ 
        documentId: item.documentId, 
        schedule: item.schedule 
      }))
    );

    // Third pass: update documents with execution timestamps
    const documentsToUpdate = new Map<string, any>();
    for (const item of schedulesToExecute) {
      const executionResult = executionResults.find(
        r => r.documentId === item.documentId && r.scheduleId === item.schedule.id
      );
      
      // Always update lastProcessedAt timestamp, regardless of execution success/failure
      // This prevents infinite retries of failed schedules
      item.schedule.lastProcessedAt = new Date().toISOString();
      
      // Group by document for batch updates
      if (!documentsToUpdate.has(item.documentId)) {
        documentsToUpdate.set(item.documentId, {
          document: documents.find(d => d.id === item.documentId),
          agentData: item.agentData
        });
      }
      
      // Log execution result for debugging
      if (executionResult) {
        if (executionResult.success) {
          console.log(`✅ Schedule ${item.schedule.id} (${item.schedule.name}) executed successfully`);
        } else {
          console.error(`❌ Schedule ${item.schedule.id} (${item.schedule.name}) failed: ${executionResult.error}`);
        }
      } else {
        console.warn(`⚠️ No execution result found for schedule ${item.schedule.id}`);
      }
    }

    // Update all documents that had executed schedules
    let documentsUpdated = 0;
    for (const [documentId, { document, agentData }] of documentsToUpdate) {
      const updateSuccess = await safeUpdateDocument(document, agentData);
      if (updateSuccess) {
        documentsUpdated++;
      } else {
        console.warn(`Failed to update document ${documentId} after schedule execution`);
        totalErrors++; // Count document update failures as errors
      }
    }

    // Count successes and failures
    const successfulExecutions = executionResults.filter(r => r.success).length;
    const failedExecutions = executionResults.filter(r => !r.success).length;
    
    // Note: totalErrors already includes validation errors and document update failures
    // Don't double-count execution failures if they were already counted elsewhere

    const summary = {
      success: failedExecutions === 0 && totalErrors === 0,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      documentsScanned: documents.length,
      totalDocuments: allDocuments.length,
      documentsUpdated,
      schedulesProcessed: totalSchedulesProcessed,
      schedulesExecuted: successfulExecutions,
      schedulesSkipped: totalSchedulesSkipped,
      schedulesFailed: failedExecutions,
      validationErrors: totalErrors, // Separate validation/processing errors from execution failures
      limits: {
        maxDocuments: MAX_DOCUMENTS_PER_RUN,
        maxSchedules: MAX_SCHEDULES_PER_RUN,
        maxConcurrency: MAX_CONCURRENT_EXECUTIONS
      },
      executionResults
    };

    console.log(`🎯 Cron job completed: ${successfulExecutions}/${schedulesToExecute.length} schedules executed successfully, ${failedExecutions} execution failures, ${totalErrors} validation/processing errors`);
    
    return Response.json(summary);

  } catch (error) {
    console.error('❌ Cron job failed with unexpected error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime
    }, { 
      status: 500 
    });
  }
}

// Also handle POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
} 