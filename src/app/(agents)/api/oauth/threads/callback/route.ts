import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const ThreadsCallbackSchema = z.object({
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
    
    const validatedParams = ThreadsCallbackSchema.parse(params);

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
    const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_CLIENT_ID!,
        client_secret: process.env.THREADS_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/threads/callback`,
        code: validatedParams.code
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Threads token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to exchange authorization code')}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get long-lived access token (similar to Instagram)
    const longLivedTokenResponse = await fetch(`https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${tokenData.access_token}`);
    
    let finalTokenData = tokenData;
    if (longLivedTokenResponse.ok) {
      finalTokenData = await longLivedTokenResponse.json();
    }

    // Get user profile information
    const userResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${finalTokenData.access_token}`);
    
    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to get user profile')}`, request.url)
      );
    }

    const userData = await userResponse.json();

    // Get user's threads (optional, for additional context)
    const threadsResponse = await fetch(`https://graph.threads.net/v1.0/me/threads?fields=id,media_type,text,timestamp&access_token=${finalTokenData.access_token}`);
    let threadsData = null;
    if (threadsResponse.ok) {
      threadsData = await threadsResponse.json();
    }

    // Create OAuth connection object
    const oauthConnection = {
      provider: 'threads' as const,
      accessToken: finalTokenData.access_token,
      refreshToken: finalTokenData.refresh_token,
      expiresAt: finalTokenData.expires_in ? 
        new Date(Date.now() + finalTokenData.expires_in * 1000).toISOString() : 
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // Default 60 days
      userId: userData.id,
      username: userData.username,
      isActive: true,
      connectedAt: new Date().toISOString(),
      // Additional Threads-specific data
      profile: {
        username: userData.username,
        biography: userData.threads_biography,
        profilePicture: userData.threads_profile_picture_url
      },
      recentThreads: threadsData?.data?.slice(0, 5) || [] // Store latest 5 threads for context
    };

    // Store the connection in session storage or database
    // For now, we'll redirect with the connection data
    const connectionData = encodeURIComponent(JSON.stringify(oauthConnection));
    
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=threads&connection=${connectionData}`, request.url)
    );

  } catch (error) {
    console.error('Threads OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/chat?oauth_error=${encodeURIComponent('OAuth callback failed')}`, request.url)
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 