import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';

// Schema for client action execution request
const ClientExecuteActionSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent data'),
  code: z.string().describe('JavaScript code to execute'),
  inputParameters: z.record(z.any()).describe('Input parameters for the code'),
  envVars: z.record(z.string()).optional().describe('Environment variables'),
  testMode: z.boolean().default(false).describe('Whether this is a test run (no database updates)'),
  // Client-specific fields
  clientMetadata: z.object({
    component: z.string().optional().describe('UI component making the request'),
    userId: z.string().optional().describe('Client user ID'),
    sessionId: z.string().optional().describe('Client session ID'),
    timestamp: z.string().optional().describe('Request timestamp')
  }).optional()
});

// Configuration for main app communication
const MAIN_APP_CONFIG = {
  baseUrl: process.env.MAIN_APP_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  retries: 2
};

/**
 * Client App API: Execute Action
 * Proxies requests to main app's execute-action API with client-side processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ClientExecuteActionSchema.parse(body);
    const { documentId, code, inputParameters, envVars = {}, testMode, clientMetadata } = validatedData;

    console.log('🎯 Client App: Action execution request', {
      documentId,
      testMode,
      component: clientMetadata?.component,
      codeLength: code.length,
      envVarsCount: Object.keys(envVars).length,
      inputParamsCount: Object.keys(inputParameters).length
    });

    // Client-side processing: Add client metadata to environment variables
    const enhancedEnvVars = {
      ...envVars,
      CLIENT_USER_ID: session.user.id,
      CLIENT_REQUEST_ID: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      CLIENT_TIMESTAMP: new Date().toISOString(),
      CLIENT_COMPONENT: clientMetadata?.component || 'unknown',
      CLIENT_TEST_MODE: testMode.toString()
    };

    // Prepare request payload for main app
    const mainAppPayload = {
      documentId,
      code,
      inputParameters,
      envVars: enhancedEnvVars,
      testMode
    };

    // Make request to main app API with retry logic
    let lastError;
    for (let attempt = 1; attempt <= MAIN_APP_CONFIG.retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${MAIN_APP_CONFIG.retries}: Calling main app execute-action API`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MAIN_APP_CONFIG.timeout);

        const mainAppResponse = await fetch(`${MAIN_APP_CONFIG.baseUrl}/api/agent/execute-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
            'X-Client-App': 'true',
            'X-Client-Component': clientMetadata?.component || 'unknown'
          },
          body: JSON.stringify(mainAppPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!mainAppResponse.ok) {
          const errorText = await mainAppResponse.text();
          throw new Error(`Main app API error (${mainAppResponse.status}): ${errorText}`);
        }

        const result = await mainAppResponse.json();

        // Client-side post-processing: Add client metadata to response
        const enhancedResult = {
          ...result,
          clientMetadata: {
            requestId: enhancedEnvVars.CLIENT_REQUEST_ID,
            component: clientMetadata?.component,
            processedAt: new Date().toISOString(),
            attempt,
            mainAppLatency: Date.now() - parseInt(enhancedEnvVars.CLIENT_REQUEST_ID.split('_')[1])
          }
        };

        console.log('✅ Client App: Action execution successful', {
          success: result.success,
          executionTime: result.executionTime,
          modelsAffected: result.modelsAffected?.length || 0,
          attempt,
          requestId: enhancedEnvVars.CLIENT_REQUEST_ID
        });

        return NextResponse.json(enhancedResult);

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
        
        if (attempt < MAIN_APP_CONFIG.retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    console.error('❌ Client App: All attempts failed for action execution');
    return NextResponse.json(
      { 
        error: 'Failed to execute action after multiple attempts',
        details: lastError instanceof Error ? lastError.message : 'Unknown error',
        clientMetadata: {
          requestId: enhancedEnvVars.CLIENT_REQUEST_ID,
          attempts: MAIN_APP_CONFIG.retries,
          failedAt: new Date().toISOString()
        }
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Client App: Action execution request failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Client app internal error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint for client API
 */
export async function GET(request: NextRequest) {
  try {
    // Check connection to main app
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const healthCheck = await fetch(`${MAIN_APP_CONFIG.baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal
    }).catch(() => null);
    
    clearTimeout(timeoutId);

    const mainAppStatus = healthCheck?.ok ? 'connected' : 'disconnected';

    return NextResponse.json({
      status: 'ok',
      service: 'client-app-execute-action',
      timestamp: new Date().toISOString(),
      mainApp: {
        url: MAIN_APP_CONFIG.baseUrl,
        status: mainAppStatus,
        timeout: MAIN_APP_CONFIG.timeout,
        retries: MAIN_APP_CONFIG.retries
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        service: 'client-app-execute-action',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 