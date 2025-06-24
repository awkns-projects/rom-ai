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
const MAX_ERROR_COUNT = 3; // Maximum consecutive errors before disabling schedule
const ERROR_RESET_HOURS = 24; // Hours to wait before allowing retry after max errors

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
  errorCount?: number;
  lastError?: string;
  lastErrorAt?: string;
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

    // Check for too many consecutive errors
    if (schedule.errorCount && schedule.errorCount >= MAX_ERROR_COUNT) {
      // Check if enough time has passed since last error to allow retry
      if (schedule.lastErrorAt) {
        const lastErrorTime = new Date(schedule.lastErrorAt);
        const now = new Date();
        const hoursSinceLastError = (now.getTime() - lastErrorTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastError < ERROR_RESET_HOURS) {
          return { 
            shouldRun: false, 
            error: `Schedule disabled due to ${schedule.errorCount} consecutive errors. Will retry after ${ERROR_RESET_HOURS} hours from last error.` 
          };
        }
        // If enough time has passed, allow retry (error count will be reset on success)
      } else {
        return { 
          shouldRun: false, 
          error: `Schedule disabled due to ${schedule.errorCount} consecutive errors.` 
        };
      }
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
function safeJsonParse(content: string | null, fallback: any = null): any {
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

            // Log schedule details for debugging
            const errorInfo = schedule.errorCount ? ` (errors: ${schedule.errorCount})` : '';
            console.log(`📋 Queuing schedule ${schedule.id} (${schedule.name})${errorInfo} for execution`);

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
      
      // Update error tracking based on execution result
      if (executionResult) {
        if (executionResult.success) {
          // Reset error count on successful execution
          item.schedule.errorCount = 0;
          delete item.schedule.lastError;
          delete item.schedule.lastErrorAt;
          console.log(`✅ Schedule ${item.schedule.id} (${item.schedule.name}) executed successfully`);
        } else {
          // Increment error count on failure
          item.schedule.errorCount = (item.schedule.errorCount || 0) + 1;
          item.schedule.lastError = executionResult.error || 'Unknown error';
          item.schedule.lastErrorAt = new Date().toISOString();
          console.error(`❌ Schedule ${item.schedule.id} (${item.schedule.name}) failed (error #${item.schedule.errorCount}): ${executionResult.error}`);
        }
      } else {
        // No execution result found - treat as error
        item.schedule.errorCount = (item.schedule.errorCount || 0) + 1;
        item.schedule.lastError = 'No execution result returned';
        item.schedule.lastErrorAt = new Date().toISOString();
        console.warn(`⚠️ No execution result found for schedule ${item.schedule.id} (error #${item.schedule.errorCount})`);
      }
      
      // Group by document for batch updates
      if (!documentsToUpdate.has(item.documentId)) {
        documentsToUpdate.set(item.documentId, {
          document: documents.find(d => d.id === item.documentId),
          agentData: item.agentData
        });
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
    
    // Count schedules with errors and disabled schedules
    let schedulesWithErrors = 0;
    let disabledSchedules = 0;
    for (const item of schedulesToExecute) {
      if (item.schedule.errorCount && item.schedule.errorCount > 0) {
        schedulesWithErrors++;
        if (item.schedule.errorCount >= MAX_ERROR_COUNT) {
          disabledSchedules++;
        }
      }
    }
    
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
      schedulesWithErrors,
      disabledSchedules,
      validationErrors: totalErrors, // Separate validation/processing errors from execution failures
      limits: {
        maxDocuments: MAX_DOCUMENTS_PER_RUN,
        maxSchedules: MAX_SCHEDULES_PER_RUN,
        maxConcurrency: MAX_CONCURRENT_EXECUTIONS,
        maxErrorCount: MAX_ERROR_COUNT,
        errorResetHours: ERROR_RESET_HOURS
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
  try {
    const body = await request.json();
    
    // Check if this is an error reset request
    if (body.action === 'reset-errors') {
      return await handleErrorReset(request, body);
    }
    
    // Otherwise, treat as normal cron execution
    return GET(request);
  } catch (error) {
    // If JSON parsing fails, treat as normal cron execution
    return GET(request);
  }
}

// Helper function to reset errors for schedules
async function handleErrorReset(request: NextRequest, body: any) {
  try {
    // Verify authorization for error reset
    const authHeader = request.headers.get('authorization');
    if ((authHeader !== `Bearer ${process.env.CRON_SECRET}`) && process.env.NODE_ENV === 'production') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, scheduleId } = body;
    
    if (!documentId) {
      return Response.json({ error: 'documentId is required for error reset' }, { status: 400 });
    }

    const documents = await getAllDocuments();
    const document = documents.find(d => d.id === documentId);
    
    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const agentData = safeJsonParse(document.content);
    if (!agentData || !agentData.schedules) {
      return Response.json({ error: 'Invalid document or no schedules found' }, { status: 400 });
    }

    let resetsPerformed = 0;
    
    // Reset errors for specific schedule or all schedules
    for (const schedule of agentData.schedules) {
      if (!scheduleId || schedule.id === scheduleId) {
        if (schedule.errorCount && schedule.errorCount > 0) {
          schedule.errorCount = 0;
          delete schedule.lastError;
          delete schedule.lastErrorAt;
          resetsPerformed++;
          console.log(`🔄 Reset errors for schedule ${schedule.id} (${schedule.name})`);
        }
      }
    }

    if (resetsPerformed > 0) {
      const updateSuccess = await safeUpdateDocument(document, agentData);
      if (!updateSuccess) {
        return Response.json({ error: 'Failed to save error reset' }, { status: 500 });
      }
    }

    return Response.json({
      success: true,
      message: `Reset errors for ${resetsPerformed} schedule(s)`,
      documentId,
      scheduleId: scheduleId || 'all',
      resetsPerformed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reset failed:', error);
    return Response.json({
      error: 'Failed to reset errors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 