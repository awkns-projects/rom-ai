import { NextRequest, NextResponse } from 'next/server';
import { saveOAuthConnection } from '@/lib/db/oauth-tokens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      console.error('GitHub OAuth error:', error, errorDescription);
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

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID!,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/github-oauth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('GitHub token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=token_exchange&message=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Validate token response
    if (!tokenData.access_token || tokenData.error) {
      console.error('GitHub token response error:', tokenData);
      return NextResponse.redirect(
        new URL(`/chat?error=invalid_token&message=${encodeURIComponent(tokenData.error_description || 'Invalid token response from GitHub')}`, request.url)
      );
    }

    // Get user profile information
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      console.error('GitHub profile fetch failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=profile_fetch&message=Failed to fetch user profile', request.url)
      );
    }

    const profileData = await profileResponse.json();

    // Get user email if not public
    let email = profileData.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    // Save OAuth connection to database
    const connectionData = {
      provider: 'github-oauth' as const,
      providerUserId: profileData.id.toString(),
      username: profileData.login,
      accessToken: tokenData.access_token,
      refreshToken: null, // GitHub doesn't use refresh tokens
      expiresAt: null, // GitHub tokens don't expire
      scope: tokenData.scope || 'user:email repo read:org',
      profileData: {
        id: profileData.id,
        login: profileData.login,
        name: profileData.name,
        email: email,
        avatar_url: profileData.avatar_url,
        company: profileData.company,
        blog: profileData.blog,
        location: profileData.location,
        bio: profileData.bio,
        public_repos: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
      },
    };

    // TODO: Get actual user ID from session
    const userId = 'temp-user-id';
    await saveOAuthConnection(userId, connectionData);

    // Redirect back to chat with success
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=github-oauth&connection_data=${encodeURIComponent(JSON.stringify({
        provider: 'github-oauth',
        userId: profileData.id.toString(),
        username: profileData.login,
        name: profileData.name,
        email: email,
        avatar_url: profileData.avatar_url,
        isActive: true
      }))}`, request.url)
    );

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
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