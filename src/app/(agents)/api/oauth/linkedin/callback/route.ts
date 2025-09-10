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
      console.error('LinkedIn OAuth error:', error, errorDescription);
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
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=token_exchange&message=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Validate token response
    if (!tokenData.access_token) {
      console.error('LinkedIn token response missing access_token:', tokenData);
      return NextResponse.redirect(
        new URL('/chat?error=invalid_token&message=Invalid token response from LinkedIn', request.url)
      );
    }

    // Get user profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      console.error('LinkedIn profile fetch failed:', errorData);
      return NextResponse.redirect(
        new URL('/chat?error=profile_fetch&message=Failed to fetch user profile', request.url)
      );
    }

    const profileData = await profileResponse.json();

    // Get user email address
    let email = null;
    try {
      const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        if (emailData.elements && emailData.elements.length > 0) {
          email = emailData.elements[0]['handle~'].emailAddress;
        }
      }
    } catch (emailError) {
      console.warn('Failed to fetch LinkedIn email:', emailError);
    }

    // Extract profile picture URL
    let profilePictureUrl = null;
    try {
      if (profileData.profilePicture && profileData.profilePicture['displayImage~']) {
        const pictures = profileData.profilePicture['displayImage~'].elements;
        if (pictures && pictures.length > 0) {
          // Get the largest available image
          const largest = pictures.reduce((prev: any, current: any) => 
            (current.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize.width > 
             prev.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize.width) ? current : prev
          );
          profilePictureUrl = largest.identifiers[0].identifier;
        }
      }
    } catch (pictureError) {
      console.warn('Failed to extract LinkedIn profile picture:', pictureError);
    }

    // Save OAuth connection to database
    const connectionData = {
      provider: 'linkedin' as const,
      providerUserId: profileData.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      scope: tokenData.scope || 'r_liteprofile r_emailaddress w_member_social',
      profileData: {
        id: profileData.id,
        firstName: profileData.localizedFirstName,
        lastName: profileData.localizedLastName,
        name: `${profileData.localizedFirstName || ''} ${profileData.localizedLastName || ''}`.trim(),
        email: email,
        profilePicture: profilePictureUrl,
      },
    };

    // TODO: Get actual user ID from session
    const userId = 'temp-user-id';
    await saveOAuthConnection(userId, connectionData);

    // Redirect back to chat with success
    const displayName = connectionData.profileData.name || 'LinkedIn User';
    return NextResponse.redirect(
      new URL(`/chat?oauth_success=linkedin&connection_data=${encodeURIComponent(JSON.stringify({
        provider: 'linkedin',
        userId: profileData.id,
        name: displayName,
        email: email,
        profilePicture: profilePictureUrl,
        isActive: true
      }))}`, request.url)
    );

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
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