import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { executeScheduleDirectly } from '@/lib/schedule-executor';

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
    active: z.boolean().default(false)
  }).describe('Schedule interval configuration')
});

export async function POST(request: NextRequest) {
  try {
    // Check if this is a cron request
    const authHeader = request.headers.get('authorization');
    const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    let session = null;
    
    if (isCronRequest) {
      // For cron requests, we'll skip session authentication
      // The shared function will handle document ownership verification
    } else {
      // For regular requests, require authentication
      session = await auth();
      if (!session?.user?.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const validatedData = ExecuteScheduleSchema.parse(body);
    const { documentId, scheduleId, code, inputParameters, envVars, testMode, interval } = validatedData;

    // Call the shared execution function
    const result = await executeScheduleDirectly({
      documentId,
      scheduleId,
      code,
      inputParameters,
      envVars,
      testMode,
      interval
    });

    // For non-cron requests, verify document ownership
    if (!isCronRequest && session) {
      // The shared function doesn't verify ownership for non-cron requests
      // So we need to add this check here
      const { getDocumentById } = await import('@/lib/db/queries');
      const document = await getDocumentById({ id: documentId });
      if (!document || document.userId !== session.user.id) {
        return Response.json({ error: 'Unauthorized access to document' }, { status: 403 });
      }
    }

    // Return the result from the shared function
    if (result.success) {
      return Response.json({
        success: true,
        result: result.result,
        executionTime: result.executionTime,
        testMode,
        scheduleId,
        nextRun: result.nextRun,
        databaseUpdated: result.databaseUpdated,
        modelsAffected: result.modelsAffected,
        message: result.message
      });
    } else {
      return Response.json({
        success: false,
        error: result.error,
        executionTime: result.executionTime,
        testMode,
        scheduleId,
        nextRun: result.nextRun
      });
    }

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