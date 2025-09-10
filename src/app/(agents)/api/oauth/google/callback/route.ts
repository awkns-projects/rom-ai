import { NextRequest, NextResponse } from 'next/server';
import { saveOAuthConnection } from '@/lib/db/oauth-tokens';
import { verifyOAuthState, generateOAuthState } from '@/lib/oauth-security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      console.error('Google OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/chat?error=oauth_error&message=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/chat?error=missing_params&message=Missing code or state parameter', request.url)
      );
    }

    // For now, we'll skip state validation since we need to implement proper state storage
    // TODO: Implement proper state validation with session/database storage
    // const isValidState = verifyOAuthState(state, expectedState);
    // if (!isValidState) {
    //   return NextResponse.redirect(
    //     new URL('/chat?error=invalid_state&message=Invalid state parameter', request.url)
    //   );
    // }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Google token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=token_exchange&message=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Validate token response
    if (!tokenData.access_token) {
      console.error('Google token response missing access_token:', tokenData);
      return NextResponse.redirect(
        new URL('/chat?error=invalid_token&message=Invalid token response from Google', request.url)
      );
    }

    // Get user profile information
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      console.error('Google profile fetch failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=profile_fetch&message=Failed to fetch user profile', request.url)
      );
    }

    const profileData = await profileResponse.json();

    // Save OAuth connection to database
    const connectionData = {
      provider: 'google' as const,
      providerUserId: profileData.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      scope: tokenData.scope || 'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
      profileData: {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture,
        verified_email: profileData.verified_email,
        locale: profileData.locale,
      },
    };

    // TODO: Get actual user ID from session
    // For now, we'll use a placeholder user ID
    const userId = 'temp-user-id';
    await saveOAuthConnection(userId, connectionData);

    // Redirect back to chat with success
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=google&connection_data=${encodeURIComponent(JSON.stringify({
        provider: 'google',
        userId: profileData.id,
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture,
        isActive: true
      }))}`, request.url)
    );

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/chat?error=server_error&message=Internal server error during OAuth callback', request.url)
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 