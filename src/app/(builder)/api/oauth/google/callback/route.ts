import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { handleOAuthCallback, createOAuthCallbackData } from '@/lib/oauth-callback-handler';
import { verifyOAuthState, generateOAuthState } from '@/lib/oauth-security';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Create OAuth callback data
    const callbackData = createOAuthCallbackData(
      'google',
      profileData.id,
      tokenData.access_token,
      {
        username: profileData.name,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        scopes: tokenData.scope?.split(' ') || ['openid', 'email', 'profile'],
        profileData: {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          picture: profileData.picture,
          verified_email: profileData.verified_email,
          locale: profileData.locale,
        }
      }
    );

    // Handle OAuth callback and save to database
    return await handleOAuthCallback(request, 'google', callbackData);

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