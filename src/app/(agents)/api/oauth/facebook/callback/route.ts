import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const FacebookCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validatedParams = FacebookCallbackSchema.parse(params);

    // Check for OAuth errors
    if (validatedParams.error) {
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent(validatedParams.error_description || validatedParams.error)}`, request.url)
      );
    }

    if (!validatedParams.code) {
      return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/facebook/callback`,
      code: validatedParams.code
    });

    const tokenResponseFetch = await fetch(tokenUrl);

    if (!tokenResponseFetch.ok) {
      const errorData = await tokenResponseFetch.text();
      console.error('Facebook token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to exchange authorization code')}`, request.url)
      );
    }

    const tokenData = await tokenResponseFetch.json();

    // Get long-lived access token
    const longLivedTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      fb_exchange_token: tokenData.access_token
    });

    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    
    let finalTokenData = tokenData;
    if (longLivedTokenResponse.ok) {
      finalTokenData = await longLivedTokenResponse.json();
    }

    // Get user profile information
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${finalTokenData.access_token}`);
    
    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to get user profile')}`, request.url)
      );
    }

    const userData = await userResponse.json();

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${finalTokenData.access_token}`);
    let pagesData = null;
    if (pagesResponse.ok) {
      pagesData = await pagesResponse.json();
    }

    // Create OAuth connection object
    const oauthConnection = {
      provider: 'facebook' as const,
      accessToken: finalTokenData.access_token,
      refreshToken: finalTokenData.refresh_token,
      expiresAt: finalTokenData.expires_in ? 
        new Date(Date.now() + finalTokenData.expires_in * 1000).toISOString() : 
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // Default 60 days
      userId: userData.id,
      username: userData.name,
      isActive: true,
      connectedAt: new Date().toISOString(),
      // Additional Facebook-specific data
      pages: pagesData?.data || []
    };

    // Store the connection in session storage or database
    // For now, we'll redirect with the connection data
    const connectionData = encodeURIComponent(JSON.stringify(oauthConnection));
    
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=facebook&connection=${connectionData}`, request.url)
    );

  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/chat?oauth_error=${encodeURIComponent('OAuth callback failed')}`, request.url)
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 