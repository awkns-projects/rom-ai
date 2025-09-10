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
      console.error('Notion OAuth error:', error, errorDescription);
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
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/notion/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Notion token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=token_exchange&message=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Validate token response
    if (!tokenData.access_token) {
      console.error('Notion token response missing access_token:', tokenData);
      return NextResponse.redirect(
        new URL('/chat?error=invalid_token&message=Invalid token response from Notion', request.url)
      );
    }

    // Get user information from the token response (Notion includes it in the token response)
    const botInfo = tokenData.bot_id ? {
      id: tokenData.bot_id,
      name: 'Notion Bot',
      type: 'bot',
    } : null;

    const workspaceInfo = tokenData.workspace_id ? {
      id: tokenData.workspace_id,
      name: tokenData.workspace_name || 'Notion Workspace',
      icon: tokenData.workspace_icon,
    } : null;

    const ownerInfo = tokenData.owner ? {
      type: tokenData.owner.type,
      user: tokenData.owner.user,
      workspace: tokenData.owner.workspace,
    } : null;

    // Get user profile information if we have a user ID
    let userProfile = null;
    if (ownerInfo?.user?.id) {
      try {
        const userResponse = await fetch(`https://api.notion.com/v1/users/${ownerInfo.user.id}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Notion-Version': '2022-06-28',
          },
        });

        if (userResponse.ok) {
          userProfile = await userResponse.json();
        }
      } catch (userError) {
        console.warn('Failed to fetch Notion user profile:', userError);
      }
    }

    // Determine display name and user ID
    let displayName = 'Notion User';
    let userId = tokenData.workspace_id || tokenData.bot_id || 'unknown';

    if (userProfile) {
      displayName = userProfile.name || displayName;
      userId = userProfile.id;
    } else if (workspaceInfo) {
      displayName = workspaceInfo.name;
      userId = workspaceInfo.id;
    }

    // Save OAuth connection to database
    const connectionData = {
      provider: 'notion' as const,
      providerUserId: userId,
      accessToken: tokenData.access_token,
      refreshToken: null, // Notion doesn't use refresh tokens
      expiresAt: null, // Notion tokens don't expire
      scope: 'read_content write_content',
      profileData: {
        bot: botInfo,
        workspace: workspaceInfo,
        owner: ownerInfo,
        user: userProfile,
        token_type: tokenData.token_type,
        duplicated_template_id: tokenData.duplicated_template_id,
      },
    };

    // TODO: Get actual user ID from session
    const appUserId = 'temp-user-id';
    await saveOAuthConnection(appUserId, connectionData);

    // Redirect back to chat with success
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=notion&connection_data=${encodeURIComponent(JSON.stringify({
        provider: 'notion',
        userId: userId,
        name: displayName,
        workspace: workspaceInfo?.name,
        workspaceIcon: workspaceInfo?.icon,
        isActive: true
      }))}`, request.url)
    );

  } catch (error) {
    console.error('Notion OAuth callback error:', error);
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