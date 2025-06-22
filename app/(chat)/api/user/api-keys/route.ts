import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { saveUserApiKeys, deleteUserApiKeys, hasUserApiKeys } from '@/lib/db/api-keys';
import { z } from 'zod';

const apiKeySchema = z.object({
  provider: z.enum(['openai', 'xai']),
  apiKey: z.string().min(1).max(200),
});

const deleteSchema = z.object({
  providers: z.array(z.enum(['openai', 'xai'])).min(1),
});

// Get user's API key status (not the actual keys for security)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const keyStatus = await hasUserApiKeys(session.user.id);
    
    return Response.json(keyStatus);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
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