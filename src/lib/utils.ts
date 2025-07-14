import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        const { code, cause } = errorData;
        throw new ChatSDKError(code as ErrorCode, cause);
      } catch (parseError) {
        // If we can't parse the error response as JSON, create a generic error
        console.error('Failed to parse error response:', parseError);
        throw new ChatSDKError('bad_request:api', `HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  } catch (error) {
    // Handle network errors or other fetch failures
    if (error instanceof ChatSDKError) {
      throw error; // Re-throw ChatSDKError as-is
    }
    
    // For other errors (network issues, etc.), create a generic error
    console.error('Fetch request failed:', error);
    throw new ChatSDKError('offline:api', error instanceof Error ? error.message : 'Network request failed');
  }
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

/**
 * Avatar Authentication Utilities
 */

export interface AvatarAuthState {
  isAuthenticated: boolean;
  provider: string | null;
  accessToken: string | null;
  envVars: Record<string, string>;
  externalService: string | null;
  availableProviders: string[];
  connectionType: 'oauth' | 'api_key' | 'none' | 'unknown';
}

/**
 * Fetch avatar authentication tokens for action execution via client app API
 */
export async function getAvatarAuthTokens(documentId: string, component?: string): Promise<AvatarAuthState> {
  try {
    // Use client app API instead of main app API
    const url = new URL('/api/client/auth', window.location.origin);
    url.searchParams.set('documentId', documentId);
    if (component) {
      url.searchParams.set('component', component);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch avatar auth tokens via client API:', response.statusText);
      return {
        isAuthenticated: false,
        provider: null,
        accessToken: null,
        envVars: {},
        externalService: null,
        availableProviders: [],
        connectionType: 'unknown'
      };
    }

    const result = await response.json();
    
    // Extract auth state from client API response
    const authState = {
      isAuthenticated: result.isAuthenticated || false,
      provider: result.provider || null,
      accessToken: result.accessToken || null,
      envVars: result.envVars || {},
      externalService: result.externalService || null,
      availableProviders: result.availableProviders || [],
      connectionType: result.connectionType || 'unknown'
    };

    console.log('🔗 Client API: Retrieved avatar auth tokens', {
      isAuthenticated: authState.isAuthenticated,
      provider: authState.provider,
      hasEnvVars: Object.keys(authState.envVars).length > 0,
      requestId: result.clientMetadata?.requestId
    });

    return authState;
  } catch (error) {
    console.error('Error fetching avatar auth tokens via client API:', error);
    return {
      isAuthenticated: false,
      provider: null,
      accessToken: null,
      envVars: {},
      externalService: null,
      availableProviders: [],
      connectionType: 'unknown'
    };
  }
}

/**
 * Merge avatar tokens with action environment variables
 */
export function mergeAvatarTokensWithEnvVars(
  avatarTokens: AvatarAuthState,
  actionEnvVars: Record<string, string> = {}
): Record<string, string> {
  const mergedEnvVars = { ...actionEnvVars };
  
  // Add avatar tokens to environment variables
  if (avatarTokens.isAuthenticated && avatarTokens.envVars) {
    Object.assign(mergedEnvVars, avatarTokens.envVars);
  }
  
  return mergedEnvVars;
}

/**
 * Check if an action requires external authentication
 */
export function actionRequiresExternalAuth(actionCode: string): boolean {
  if (!actionCode) return false;
  
  // Check for common external API patterns
  const externalApiPatterns = [
    /fetch.*api\./i,
    /shopify/i,
    /slack/i,
    /gmail/i,
    /stripe/i,
    /salesforce/i,
    /hubspot/i,
    /calendar/i,
    /teams/i,
    /github/i,
    /trello/i,
    /notion/i,
    /airtable/i,
    /mailchimp/i,
    /twilio/i,
    /discord/i,
    /linkedin/i,
    /twitter/i,
    /facebook/i,
    /pinterest/i,
    /tiktok/i,
    /instagram/i
  ];
  
  return externalApiPatterns.some(pattern => pattern.test(actionCode));
}

/**
 * Get authentication status message for UI
 */
export function getAuthStatusMessage(avatarTokens: AvatarAuthState): string {
  if (!avatarTokens.isAuthenticated) {
    return 'No external API authentication configured';
  }
  
  if (avatarTokens.provider) {
    return `Connected to ${avatarTokens.provider}${avatarTokens.externalService ? ` (${avatarTokens.externalService})` : ''}`;
  }
  
  return 'External API authentication available';
}

/**
 * Validate authentication requirements for action execution
 */
export function validateAuthRequirements(
  actionCode: string,
  avatarTokens: AvatarAuthState
): { isValid: boolean; message: string; requiredAuth?: string } {
  const requiresAuth = actionRequiresExternalAuth(actionCode);
  
  if (!requiresAuth) {
    return { isValid: true, message: 'No external authentication required' };
  }
  
  if (!avatarTokens.isAuthenticated) {
    return {
      isValid: false,
      message: 'Action requires external API authentication, but no tokens are configured. Please set up authentication in the avatar creator.',
      requiredAuth: 'external_api'
    };
  }
  
  if (!avatarTokens.provider) {
    return {
      isValid: false,
      message: 'External API provider not identified. Please check your authentication setup.',
      requiredAuth: 'provider_identification'
    };
  }
  
  return {
    isValid: true,
    message: `Ready to execute with ${avatarTokens.provider} authentication`
  };
}
