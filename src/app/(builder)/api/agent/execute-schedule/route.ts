import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import type { ActionChainStep, ExecutionContext } from '@/artifacts/agent/types/schedule';
import { resolveStepParams } from '@/artifacts/agent/utils/parameter-resolver';

// Schema for ParamValue - matches the TypeScript type exactly
const ParamValueSchema = z.union([
  z.object({
    type: z.literal('static'),
    value: z.any()
  }),
  z.object({
    type: z.literal('ref'),
    fromActionIndex: z.number(),
    outputKey: z.string()
  }),
  z.object({
    type: z.literal('alias'),
    fromAlias: z.string(),
    outputKey: z.string()
  })
]);

// Schema for ActionChainStep
const ActionChainStepSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  delay: z.object({
    duration: z.number(),
    unit: z.enum(['seconds', 'minutes', 'hours'])
  }).optional(),
  inputParams: z.record(ParamValueSchema).optional(),
  loopOver: z.object({
    listSource: ParamValueSchema,
    itemAlias: z.string()
  }).optional(),
  condition: z.object({
    type: z.enum(['always', 'if', 'unless']),
    expression: z.string().optional()
  }).optional(),
  onError: z.object({
    action: z.enum(['stop', 'continue', 'retry']),
    retryCount: z.number().optional(),
    retryDelay: z.number().optional()
  }).optional()
});

// Schema for the schedule execution request
const ExecuteScheduleSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent data'),
  scheduleId: z.string().describe('Schedule ID to execute'),
  steps: z.array(ActionChainStepSchema).describe('Action chain steps to execute'),
  testMode: z.boolean().default(false).describe('Whether this is a test run (no database updates)'),
  trigger: z.object({
    pattern: z.string(),
    timezone: z.string().optional(),
    active: z.boolean().default(false)
  }).describe('Schedule trigger configuration'),
  globalInputs: z.record(z.any()).optional().describe('Global inputs available to all steps')
});

export async function POST(request: NextRequest) {
  try {
    // Check if this is a cron request
    const authHeader = request.headers.get('authorization');
    const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    let session = null;
    
    if (isCronRequest) {
      // For cron requests, we'll skip session authentication
      console.log('Processing cron schedule execution request');
    } else {
      // For regular requests, require authentication
      session = await auth();
      if (!session?.user?.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const validatedData = ExecuteScheduleSchema.parse(body);
    const { documentId, scheduleId, steps, testMode, trigger, globalInputs } = validatedData;
    
    // Cast steps to proper type after validation
    const typedSteps = steps as ActionChainStep[];

    // For non-cron requests, verify document ownership
    if (!isCronRequest && session) {
      const { getDocumentById } = await import('@/lib/db/queries');
      const document = await getDocumentById({ id: documentId });
      if (!document || document.userId !== session.user.id) {
        return Response.json({ error: 'Unauthorized access to document' }, { status: 403 });
      }
    }

    // Execute the action chain
    const result = await executeActionChain({
      documentId,
      scheduleId,
      steps: typedSteps,
      testMode,
      globalInputs
    });

    if (result.success) {
      return Response.json({
        success: true,
        results: result.results,
        executionTime: result.executionTime,
        stepsCompleted: result.stepsCompleted,
        totalSteps: typedSteps.length,
        testMode,
        scheduleId,
        message: result.message || 'Schedule executed successfully'
      });
    } else {
      return Response.json({
        success: false,
        error: result.error,
        executionTime: result.executionTime,
        stepsCompleted: result.stepsCompleted || 0,
        totalSteps: typedSteps.length,
        testMode,
        scheduleId
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

// Execute a chain of actions with parameter resolution
async function executeActionChain({
  documentId,
  scheduleId,
  steps,
  testMode,
  globalInputs
}: {
  documentId: string;
  scheduleId: string;
  steps: ActionChainStep[];
  testMode: boolean;
  globalInputs?: Record<string, any>;
}): Promise<{
  success: boolean;
  results?: any[];
  executionTime: number;
  stepsCompleted: number;
  error?: string;
  message?: string;
}> {
  const startTime = Date.now();
  const results: any[] = [];
  const context: ExecutionContext = {
    stepResults: {},
    globalInputs,
    environment: process.env as Record<string, string>
  };

  try {
    // Get document data to access actions
    const { getDocumentById } = await import('@/lib/db/queries');
    const document = await getDocumentById({ id: documentId });
    
    if (!document) {
      throw new Error('Document not found');
    }

    // Parse agent data
    const agentData = document.content ? JSON.parse(document.content) : {};
    const actions = agentData.actions || [];

    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const step = steps[stepIndex];
      
      try {
        // Find the action for this step
        const action = actions.find((a: any) => a.id === step.actionId);
        if (!action) {
          throw new Error(`Action with ID ${step.actionId} not found`);
        }

        // Execute the action
        const resolvedParams = resolveStepParams(step.inputParams, context);
        
        // Add delay if specified
        if (step.delay && step.delay.duration > 0) {
          await new Promise(resolve => setTimeout(resolve, step.delay!.duration));
        }

        const stepResult = await executeAction({
          action,
          parameters: resolvedParams,
          testMode,
          documentId
        });

        // Store result in context for future steps
        context.stepResults[stepIndex] = stepResult;
        results.push({
          stepIndex,
          stepId: step.id,
          stepName: step.name,
          actionId: step.actionId,
          actionName: action.name,
          result: stepResult,
          executionTime: Date.now() - startTime
        });

      } catch (stepError: any) {
        const errorAction = step.onError?.action || 'stop';
        const errorMessage = `Step ${stepIndex + 1} (${step.name}) failed: ${stepError.message}`;
        
        if (errorAction === 'stop') {
          return {
            success: false,
            results,
            executionTime: Date.now() - startTime,
            stepsCompleted: stepIndex,
            error: errorMessage
          };
        } else if (errorAction === 'continue') {
          // Continue to next step, but log the error
          console.warn(errorMessage);
          context.stepResults[stepIndex] = { error: stepError.message };
          results.push({
            stepIndex,
            stepId: step.id,
            stepName: step.name,
            actionId: step.actionId,
            result: { error: stepError.message },
            executionTime: Date.now() - startTime
          });
        } else if (errorAction === 'retry') {
          // Retry logic could be implemented here
          throw stepError; // For now, treat as stop
        }
      }
    }

    return {
      success: true,
      results,
      executionTime: Date.now() - startTime,
      stepsCompleted: steps.length,
      message: `Successfully executed ${steps.length} step${steps.length === 1 ? '' : 's'}`
    };

  } catch (error: any) {
    return {
      success: false,
      results,
      executionTime: Date.now() - startTime,
      stepsCompleted: results.length,
      error: error.message
    };
  }
}

// Execute a single action with resolved parameters
async function executeAction({
  action,
  parameters,
  testMode,
  documentId
}: {
  action: any;
  parameters: Record<string, any>;
  testMode: boolean;
  documentId: string;
}): Promise<any> {
  // Use the existing execute-action endpoint logic
  const executeResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agent/execute-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      actionId: action.id,
      inputParameters: parameters,
      testMode
    })
  });

  if (!executeResponse.ok) {
    const errorData = await executeResponse.json();
    throw new Error(errorData.error || 'Action execution failed');
  }

  const result = await executeResponse.json();
  if (!result.success) {
    throw new Error(result.error || 'Action execution failed');
  }

  return result.result;
}

export async function GET() {
  return Response.json({ 
    message: 'Schedule execution endpoint',
    methods: ['POST'],
    description: 'Execute a schedule with chained actions and parameter resolution'
  });
} 