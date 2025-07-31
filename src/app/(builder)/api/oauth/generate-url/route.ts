import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateOAuthState } from '@/lib/oauth-security';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerId, shopDomain } = await request.json();

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const state = generateOAuthState();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/oauth/${providerId}/callback`;

    const params = new URLSearchParams({
      client_id: getClientId(providerId),
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      ...getProviderScopes(providerId)
    });

    let authUrl: string;

    switch (providerId) {
      case 'shopify':
        if (!shopDomain) {
          return NextResponse.json({ error: 'Shop domain is required for Shopify' }, { status: 400 });
        }
        authUrl = `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
        break;
      
      case 'instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
        break;
      
      case 'facebook':
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
        break;
      
      case 'threads':
        authUrl = `https://threads.net/oauth/authorize?${params.toString()}`;
        break;
      
      case 'google':
        authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
        break;
      
      case 'github-oauth':
        authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
        break;
      
      case 'linkedin':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
        break;
      
      case 'notion':
        authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
        break;
      
      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({
      authUrl,
      state,
      providerId
    });

  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getClientId(providerId: string): string {
  const clientIds: Record<string, string> = {
    'instagram': process.env.INSTAGRAM_CLIENT_ID!,
    'facebook': process.env.FACEBOOK_CLIENT_ID!,
    'shopify': process.env.SHOPIFY_CLIENT_ID!,
    'threads': process.env.THREADS_CLIENT_ID!,
    'google': process.env.GOOGLE_CLIENT_ID!,
    'github-oauth': process.env.GITHUB_OAUTH_CLIENT_ID!,
    'linkedin': process.env.LINKEDIN_CLIENT_ID!,
    'notion': process.env.NOTION_CLIENT_ID!
  };

  const clientId = clientIds[providerId];
  if (!clientId) {
    throw new Error(`Client ID not found for provider: ${providerId}`);
  }

  return clientId;
}

function getProviderScopes(providerId: string): Record<string, string> {
  const scopes: Record<string, string> = {
    'instagram': 'user_profile,user_media',
    'facebook': 'public_profile,pages_read_engagement',
    'shopify': 'read_products,write_products,read_orders,write_orders',
    'threads': 'threads_basic,threads_content_publish',
    'google': 'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
    'github-oauth': 'user:email repo read:org',
    'linkedin': 'r_liteprofile r_emailaddress w_member_social',
    'notion': 'read_content write_content'
  };

  return { scope: scopes[providerId] || '' };
} 