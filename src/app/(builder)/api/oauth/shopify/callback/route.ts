import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { handleOAuthCallback, createOAuthCallbackData } from '@/lib/oauth-callback-handler';
import { z } from 'zod';
import crypto from 'crypto';

const ShopifyCallbackSchema = z.object({
  code: z.string(),
  hmac: z.string(),
  shop: z.string(),
  state: z.string().optional(),
  timestamp: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

// Verify Shopify HMAC signature for security
function verifyShopifyHmac(query: Record<string, string>, secret: string): boolean {
  const { hmac, ...params } = query;
  
  // Create query string from sorted parameters
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Calculate HMAC
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(hmac)
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validatedParams = ShopifyCallbackSchema.parse(params);

    // Check for OAuth errors
    if (validatedParams.error) {
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent(validatedParams.error_description || validatedParams.error)}`, request.url)
      );
    }

    if (!validatedParams.code) {
      return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
    }

    // Verify HMAC signature for security
    const shopifySecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!shopifySecret) {
      console.error('SHOPIFY_CLIENT_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    if (!verifyShopifyHmac(params, shopifySecret)) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 400 });
    }

    // Validate shop domain
    const shopDomain = validatedParams.shop;
    if (!shopDomain.endsWith('.myshopify.com')) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Exchange authorization code for access token
    const shopifyClientId = process.env.SHOPIFY_CLIENT_ID;
    if (!shopifyClientId) {
      console.error('SHOPIFY_CLIENT_ID is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const tokenResponse = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: shopifyClientId,
        client_secret: shopifySecret,
        code: validatedParams.code
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Shopify token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to exchange authorization code')}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get shop information
    const shopResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!shopResponse.ok) {
      return NextResponse.redirect(
        new URL(`/chat?oauth_error=${encodeURIComponent('Failed to get shop information')}`, request.url)
      );
    }

    const shopData = await shopResponse.json();

    // Create OAuth callback data
    const callbackData = createOAuthCallbackData(
      'shopify',
      shopData.shop.id.toString(),
      tokenData.access_token,
      {
        username: shopData.shop.name,
        refreshToken: undefined, // Shopify doesn't use refresh tokens
        expiresAt: undefined, // Shopify tokens don't expire unless revoked
        scopes: tokenData.scope?.split(',') || [],
        providerData: {
          shopInfo: {
            name: shopData.shop.name,
            email: shopData.shop.email,
            domain: shopData.shop.domain,
            currency: shopData.shop.currency,
            timezone: shopData.shop.iana_timezone,
            plan: shopData.shop.plan_name
          },
          storeUrl: shopDomain
        }
      }
    );

    // Handle OAuth callback and save to database
    return await handleOAuthCallback(request, 'shopify', callbackData);

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/chat?oauth_error=${encodeURIComponent('OAuth callback failed')}`, request.url)
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 