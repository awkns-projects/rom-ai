import { NextRequest } from 'next/server';
import { getAllDocuments, saveOrUpdateDocument } from '@/lib/db/queries';
import { CronExpressionParser } from 'cron-parser';
import { executeScheduleDirectly } from '@/lib/schedule-executor';

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
function shouldScheduleRun(schedule: ScheduleWithTracking): boolean {
  if (!schedule.interval.active) {
    return false;
  }

  if (!schedule.interval.pattern) {
    return false;
  }

  // Parse the cron pattern
  let interval;
  try {
    interval = CronExpressionParser.parse(schedule.interval.pattern, {
      tz: schedule.interval.timezone || 'UTC'
    });
  } catch (error) {
    console.error(`Invalid cron pattern for schedule ${schedule.id}: ${schedule.interval.pattern}`);
    return false;
  }

  const now = new Date();
  
  // If never processed, check if we're past the first scheduled time
  if (!schedule.lastProcessedAt) {
    const nextRun = interval.prev().toDate();
    return now >= nextRun;
  }

  // Check if enough time has passed since last execution
  const lastProcessed = new Date(schedule.lastProcessedAt);
  const nextScheduledRun = CronExpressionParser.parse(schedule.interval.pattern, {
    currentDate: lastProcessed,
    tz: schedule.interval.timezone || 'UTC'
  }).next().toDate();

  return now >= nextScheduledRun;
}

// Helper function to execute a schedule
async function executeSchedule(documentId: string, schedule: ScheduleWithTracking): Promise<{
  success: boolean;
  error?: string;
  executionTime?: number;
  result?: any;
}> {
  if (!schedule.execute?.code?.script) {
    return {
      success: false,
      error: 'No executable code found'
    };
  }

  try {
    // Use saved inputs if available, otherwise use empty objects
    const inputParameters = schedule.savedInputs?.inputParameters || {};
    const envVars = schedule.savedInputs?.envVars || {};

    // Call the direct execution function instead of making HTTP request
    const result = await executeScheduleDirectly({
      documentId,
      scheduleId: schedule.id,
      code: schedule.execute.code.script,
      inputParameters,
      envVars,
      testMode: false, // Always run in production mode for cron
      interval: schedule.interval
    });

    return {
      success: result.success,
      error: result.error,
      executionTime: result.executionTime,
      result: result.result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error',
      executionTime: 0
    };
  }
}

// Main cron job handler
export async function GET(request: NextRequest) {
  console.log('🕒 Cron job started: Checking active schedules...');
  
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, we might not have this header, so only check in production
      if (process.env.NODE_ENV === 'production') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get all documents to scan for schedules
    const documents = await getAllDocuments();
    
    if (!documents || documents.length === 0) {
      console.log('📄 No documents found');
      return Response.json({ 
        success: true, 
        message: 'No documents to process',
        processedSchedules: 0
      });
    }

    let totalSchedulesProcessed = 0;
    let totalSchedulesExecuted = 0;
    const executionResults: Array<{
      documentId: string;
      scheduleId: string;
      scheduleName: string;
      success: boolean;
      error?: string;
      executionTime?: number;
    }> = [];

    // Process each document
    for (const document of documents) {
      if (!document.content) continue;

      let agentData;
      try {
        agentData = JSON.parse(document.content);
      } catch (parseError) {
        console.error(`Failed to parse document ${document.id}:`, parseError);
        continue;
      }

      if (!agentData.schedules || !Array.isArray(agentData.schedules)) {
        continue;
      }

      // Check each schedule in the document
      for (const schedule of agentData.schedules as ScheduleWithTracking[]) {
        totalSchedulesProcessed++;

        // Check if this schedule should run
        if (!shouldScheduleRun(schedule)) {
          console.log(`⏭️ Skipping schedule ${schedule.id} (${schedule.name}) - not ready to run`);
          continue;
        }

        console.log(`🚀 Executing schedule ${schedule.id} (${schedule.name})`);
        totalSchedulesExecuted++;

        // Execute the schedule
        const executionResult = await executeSchedule(document.id, schedule);
        
        // Update the schedule's lastProcessedAt timestamp
        schedule.lastProcessedAt = new Date().toISOString();
        
        // Save the updated document with the new timestamp
        try {
          // Update the schedule's lastProcessedAt timestamp
          schedule.lastProcessedAt = new Date().toISOString();

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
        } catch (saveError) {
          console.error(`Failed to update document ${document.id}:`, saveError);
        }

        // Log the execution result
        executionResults.push({
          documentId: document.id,
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          success: executionResult.success,
          error: executionResult.error,
          executionTime: executionResult.executionTime
        });

        if (executionResult.success) {
          console.log(`✅ Schedule ${schedule.id} executed successfully in ${executionResult.executionTime}ms`);
        } else {
          console.error(`❌ Schedule ${schedule.id} failed: ${executionResult.error}`);
        }
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      documentsScanned: documents.length,
      schedulesProcessed: totalSchedulesProcessed,
      schedulesExecuted: totalSchedulesExecuted,
      executionResults
    };

    console.log(`🎯 Cron job completed: ${totalSchedulesExecuted}/${totalSchedulesProcessed} schedules executed`);
    
    return Response.json(summary);

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}

// Also handle POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
} 