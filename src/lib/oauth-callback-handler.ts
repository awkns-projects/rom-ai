import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveOAuthConnection } from './db/oauth-tokens';

export interface OAuthCallbackData {
  provider: 'instagram' | 'facebook' | 'shopify' | 'threads' | 'google' | 'github-oauth' | 'linkedin' | 'notion';
  providerUserId: string;
  username?: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: string[];
  providerData?: any;
  profileData?: any;
  documentId?: string; // Optional document ID
}

export async function handleOAuthCallback(
  request: NextRequest,
  provider: string,
  callbackData: OAuthCallbackData,
  originalChatId?: string
): Promise<NextResponse> {
  // Try to get documentId and chatId from state parameter
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  
  let documentId = null;
  let chatId = null;
  
  if (state) {
    const stateParts = state.split('_');
    for (let i = 0; i < stateParts.length; i++) {
      if (stateParts[i] === 'doc' && i + 1 < stateParts.length) {
        documentId = stateParts[i + 1];
      }
      if (stateParts[i] === 'chat' && i + 1 < stateParts.length) {
        chatId = stateParts[i + 1];
      }
    }
  }
  
  try {
    // Verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // If we have a documentId, add it to the callback data
    if (documentId) {
      callbackData.documentId = documentId;
    }

    // Save OAuth connection to database
    const saveResult = await saveOAuthConnection(session.user.id, callbackData);
    
    if (!saveResult.success) {
      console.error(`Failed to save ${provider} OAuth connection:`, saveResult.error);
      const redirectUrl = chatId 
        ? `/chat/${chatId}?oauth_error=${encodeURIComponent('Failed to save connection')}`
        : `/chat?oauth_error=${encodeURIComponent('Failed to save connection')}`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Create response data for client
    const responseData = {
      provider: callbackData.provider,
      accessToken: callbackData.accessToken,
      refreshToken: callbackData.refreshToken,
      expiresAt: callbackData.expiresAt?.toISOString(),
      userId: callbackData.providerUserId,
      username: callbackData.username,
      isActive: true,
      connectedAt: new Date().toISOString(),
      ...callbackData.providerData,
      ...callbackData.profileData
    };

    const connectionDataEncoded = encodeURIComponent(JSON.stringify(responseData));
    
    const redirectUrl = chatId 
      ? `/chat/${chatId}?oauth_success=${provider}&connection=${connectionDataEncoded}`
      : `/chat?oauth_success=${provider}&connection=${connectionDataEncoded}`;
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error(`${provider} OAuth callback error:`, error);
    const redirectUrl = chatId 
      ? `/chat/${chatId}?oauth_error=${encodeURIComponent('OAuth callback failed')}`
      : `/chat?oauth_error=${encodeURIComponent('OAuth callback failed')}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
}

// Helper function to create OAuth callback data
export function createOAuthCallbackData(
  provider: OAuthCallbackData['provider'],
  providerUserId: string,
  accessToken: string,
  options: {
    username?: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
    scopes?: string[];
    providerData?: any;
    profileData?: any;
  } = {}
): OAuthCallbackData {
  return {
    provider,
    providerUserId,
    username: options.username,
    accessToken,
    refreshToken: options.refreshToken,
    expiresAt: options.expiresAt,
    scopes: options.scopes,
    providerData: options.providerData,
    profileData: options.profileData
  };
} 