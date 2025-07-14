import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';

// Schema for client auth request
const ClientAuthRequestSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent/avatar data'),
  action: z.enum(['get', 'update']).optional().default('get').describe('Action to perform'),
  authUpdate: z.object({
    isAuthenticated: z.boolean().describe('Whether user is authenticated'),
    provider: z.string().nullable().describe('Provider name (shopify, slack, etc.)'),
    accessToken: z.string().nullable().describe('Access token for the provider'),
    externalService: z.string().nullable().describe('External service URL or identifier'),
    connectionType: z.enum(['oauth', 'api_key', 'none']).optional().describe('Type of connection')
  }).optional().describe('Auth update data (for update action)'),
  // Client-specific fields
  clientMetadata: z.object({
    component: z.string().optional().describe('UI component making the request'),
    userId: z.string().optional().describe('Client user ID'),
    requestType: z.enum(['initial_load', 'refresh', 'update']).optional().describe('Type of request')
  }).optional()
});

// Configuration for main app communication
const MAIN_APP_CONFIG = {
  baseUrl: process.env.MAIN_APP_URL || 'http://localhost:3000',
  timeout: 10000, // 10 seconds for auth requests
  retries: 2
};

/**
 * Client App API: Authentication Management
 * Proxies requests to main app's avatar auth APIs with client-side processing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    const component = url.searchParams.get('component');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    console.log('🎯 Client App: Auth get request', {
      documentId,
      component,
      userId: session.user.id
    });

    // Make request to main app API with retry logic
    let lastError;
    for (let attempt = 1; attempt <= MAIN_APP_CONFIG.retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${MAIN_APP_CONFIG.retries}: Calling main app avatar auth API`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MAIN_APP_CONFIG.timeout);

        const mainAppResponse = await fetch(`${MAIN_APP_CONFIG.baseUrl}/api/avatar/auth?documentId=${encodeURIComponent(documentId)}`, {
          method: 'GET',
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
            'X-Client-App': 'true',
            'X-Client-Component': component || 'unknown'
          },
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
            requestId: `auth_get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            component,
            processedAt: new Date().toISOString(),
            attempt,
            requestType: 'get'
          }
        };

        console.log('✅ Client App: Auth get successful', {
          isAuthenticated: result.isAuthenticated,
          provider: result.provider,
          hasToken: !!result.accessToken,
          attempt
        });

        return NextResponse.json(enhancedResult);

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
        
        if (attempt < MAIN_APP_CONFIG.retries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    console.error('❌ Client App: All attempts failed for auth get');
    return NextResponse.json(
      { 
        error: 'Failed to get auth state after multiple attempts',
        details: lastError instanceof Error ? lastError.message : 'Unknown error'
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Client App: Auth get request failed:', error);
    return NextResponse.json(
      { error: 'Client app internal error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ClientAuthRequestSchema.parse(body);
    const { documentId, authUpdate, clientMetadata } = validatedData;

    if (!authUpdate) {
      return NextResponse.json({ error: 'Auth update data is required' }, { status: 400 });
    }

    console.log('🎯 Client App: Auth update request', {
      documentId,
      provider: authUpdate.provider,
      isAuthenticated: authUpdate.isAuthenticated,
      component: clientMetadata?.component,
      userId: session.user.id
    });

    // Client-side processing: Add client metadata to auth update
    const enhancedAuthUpdate = {
      ...authUpdate,
      // Add client-side timestamps
      clientUpdatedAt: new Date().toISOString(),
      clientUserId: session.user.id,
      clientComponent: clientMetadata?.component
    };

    // Prepare request payload for main app
    const mainAppPayload = {
      documentId,
      authUpdate: enhancedAuthUpdate
    };

    // Make request to main app API with retry logic
    let lastError;
    for (let attempt = 1; attempt <= MAIN_APP_CONFIG.retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${MAIN_APP_CONFIG.retries}: Calling main app avatar auth update API`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MAIN_APP_CONFIG.timeout);

        const mainAppResponse = await fetch(`${MAIN_APP_CONFIG.baseUrl}/api/avatar/auth/update`, {
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
            requestId: `auth_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            component: clientMetadata?.component,
            processedAt: new Date().toISOString(),
            attempt,
            requestType: 'update'
          }
        };

        console.log('✅ Client App: Auth update successful', {
          provider: authUpdate.provider,
          isAuthenticated: authUpdate.isAuthenticated,
          attempt
        });

        return NextResponse.json(enhancedResult);

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
        
        if (attempt < MAIN_APP_CONFIG.retries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    console.error('❌ Client App: All attempts failed for auth update');
    return NextResponse.json(
      { 
        error: 'Failed to update auth state after multiple attempts',
        details: lastError instanceof Error ? lastError.message : 'Unknown error'
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Client App: Auth update request failed:', error);
    
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