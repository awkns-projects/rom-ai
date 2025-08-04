import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { saveUserApiKeys, deleteUserApiKeys, hasUserApiKeys } from '@/lib/db/api-keys';
import { z } from 'zod';
import { checkAuthentication, hasAgentPermission, getDocumentOwner } from '@/lib/auth-helpers';

const apiKeySchema = z.object({
  provider: z.enum(['openai', 'xai']),
  apiKey: z.string().min(1).max(200),
});

const deleteSchema = z.object({
  providers: z.array(z.enum(['openai', 'xai'])).min(1),
});

// Get user's API key status with masked key previews
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuthentication(request);
    
    if (!authResult.isAuthenticated) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    let userId: string;
    
    if (authResult.userType === 'user') {
      userId = authResult.userId!;
    } else {
      // For agent requests, check read permission and get document owner
      if (!hasAgentPermission(authResult.agent!.permissions, 'read')) {
        return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      
      const documentOwner = await getDocumentOwner(authResult.agent!.documentId, authResult);
      if (!documentOwner) {
        return Response.json({ error: 'Document owner not found' }, { status: 404 });
      }
      userId = documentOwner;
    }

    const keyStatus = await hasUserApiKeys(userId);
    
    // If keys exist, get masked versions for display
    let maskedKeys = {};
    if (keyStatus.hasOpenaiKey || keyStatus.hasXaiKey) {
      const { getUserApiKeys } = await import('@/lib/db/api-keys');
      const apiKeys = await getUserApiKeys(userId);
      
      maskedKeys = {
        openaiKeyPreview: apiKeys.openaiApiKey ? maskApiKey(apiKeys.openaiApiKey) : null,
        xaiKeyPreview: apiKeys.xaiApiKey ? maskApiKey(apiKeys.xaiApiKey) : null,
      };
    }
    
    return Response.json({ ...keyStatus, ...maskedKeys });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// Helper function to mask API keys for display
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) return apiKey;
  
  // Show first 6 characters and last 4 characters
  const start = apiKey.substring(0, 6);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}${'•'.repeat(8)}${end}`;
}

// Save/update user's API key
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const body = await request.json();
    const { provider, apiKey } = apiKeySchema.parse(body);

    // Basic API key format validation
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    
    if (provider === 'xai' && !apiKey.startsWith('xai-')) {
      return new ChatSDKError('bad_request:api').toResponse();
    }

    const apiKeys = provider === 'openai' 
      ? { openaiApiKey: apiKey }
      : { xaiApiKey: apiKey };

    await saveUserApiKeys(session.user.id, apiKeys);
    
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// Delete user's API keys
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const body = await request.json();
    const { providers } = deleteSchema.parse(body);

    await deleteUserApiKeys(session.user.id, providers);
    
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
} 