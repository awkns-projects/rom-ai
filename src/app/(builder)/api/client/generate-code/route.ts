import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';

// Schema for client code generation request
const ClientGenerateCodeSchema = z.object({
  name: z.string().describe('Action or schedule name'),
  description: z.string().describe('Description of what it should do'),
  pseudoSteps: z.array(z.any()).optional().describe('Pseudo code steps'),
  availableModels: z.array(z.any()).optional().describe('Available data models'),
  entityType: z.enum(['action', 'schedule']).describe('Type of entity to generate code for'),
  businessContext: z.string().optional().describe('Business context'),
  // Client-specific fields
  clientMetadata: z.object({
    component: z.string().optional().describe('UI component making the request'),
    userId: z.string().optional().describe('Client user ID'),
    generationType: z.enum(['initial', 'regenerate']).optional().describe('Type of generation')
  }).optional()
});

// Configuration for main app communication
const MAIN_APP_CONFIG = {
  baseUrl: process.env.MAIN_APP_URL || 'http://localhost:3000',
  timeout: 60000, // 60 seconds for code generation
  retries: 2
};

/**
 * Client App API: Generate Code
 * Proxies requests to main app's generate-code API with client-side processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ClientGenerateCodeSchema.parse(body);
    const { name, description, pseudoSteps, availableModels, entityType, businessContext, clientMetadata } = validatedData;

    console.log('🎯 Client App: Code generation request', {
      name,
      entityType,
      component: clientMetadata?.component,
      generationType: clientMetadata?.generationType,
      pseudoStepsCount: pseudoSteps?.length || 0,
      modelsCount: availableModels?.length || 0
    });

    // Client-side processing: Add client context to business context
    const enhancedBusinessContext = [
      businessContext || '',
      `Generated via client app by user ${session.user.id}`,
      `Component: ${clientMetadata?.component || 'unknown'}`,
      `Generation type: ${clientMetadata?.generationType || 'initial'}`
    ].filter(Boolean).join('\n');

    // Prepare request payload for main app
    const mainAppPayload = {
      name,
      description,
      pseudoSteps,
      availableModels,
      entityType,
      businessContext: enhancedBusinessContext
    };

    // Make request to main app API with retry logic
    let lastError;
    for (let attempt = 1; attempt <= MAIN_APP_CONFIG.retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${MAIN_APP_CONFIG.retries}: Calling main app generate-code API`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MAIN_APP_CONFIG.timeout);

        const mainAppResponse = await fetch(`${MAIN_APP_CONFIG.baseUrl}/api/agent/generate-code`, {
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
            requestId: `codegen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            component: clientMetadata?.component,
            generationType: clientMetadata?.generationType,
            processedAt: new Date().toISOString(),
            attempt,
            entityType
          }
        };

        console.log('✅ Client App: Code generation successful', {
          hasCode: !!result.code,
          codeLength: result.code?.length || 0,
          envVarsCount: result.envVars?.length || 0,
          entityType,
          attempt
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
    console.error('❌ Client App: All attempts failed for code generation');
    return NextResponse.json(
      { 
        error: 'Failed to generate code after multiple attempts',
        details: lastError instanceof Error ? lastError.message : 'Unknown error',
        clientMetadata: {
          entityType,
          component: clientMetadata?.component,
          attempts: MAIN_APP_CONFIG.retries,
          failedAt: new Date().toISOString()
        }
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Client App: Code generation request failed:', error);
    
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
 * Health check endpoint for client code generation API
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      service: 'client-app-generate-code',
      timestamp: new Date().toISOString(),
      mainApp: {
        url: MAIN_APP_CONFIG.baseUrl,
        timeout: MAIN_APP_CONFIG.timeout,
        retries: MAIN_APP_CONFIG.retries
      },
      capabilities: {
        supportedEntityTypes: ['action', 'schedule'],
        maxTimeout: MAIN_APP_CONFIG.timeout,
        retryStrategy: 'exponential-backoff'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        service: 'client-app-generate-code',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 