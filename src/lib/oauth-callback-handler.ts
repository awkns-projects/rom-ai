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
  callbackData: OAuthCallbackData
): Promise<NextResponse> {
  try {
    // Verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get documentId from state parameter
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const documentId = state?.includes('_') ? state.split('_')[1] : null;
    
    // If we have a documentId, add it to the callback data
    if (documentId) {
      callbackData.documentId = documentId;
    }

    // Save OAuth connection to database
    const saveResult = await saveOAuthConnection(session.user.id, callbackData);
    
    if (!saveResult.success) {
      console.error(`Failed to save ${provider} OAuth connection:`, saveResult.error);
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to save connection')}`, request.url)
      );
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
    
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=${provider}&connection=${connectionDataEncoded}`, request.url)
    );

  } catch (error) {
    console.error(`${provider} OAuth callback error:`, error);
    return NextResponse.redirect(
      new URL(`/chat?oauth_error=${encodeURIComponent('OAuth callback failed')}`, request.url)
    );
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