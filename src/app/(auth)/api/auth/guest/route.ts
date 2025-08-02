import { NextResponse } from 'next/server';
import { createGuestUser } from '@/lib/db/queries';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedirectParam = searchParams.has('_redirect');

  try {
    console.log('👤 Guest auth: Processing request', {
      callbackUrl: callbackUrl.slice(0, 50),
      hasRedirectParam,
    });

    // Check if user already has a valid token to prevent loops
    try {
      const existingToken = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: isProduction,
      });
      
      if (existingToken) {
        console.log('✅ User already authenticated, redirecting to:', callbackUrl);
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
    } catch (tokenError) {
      console.log('🔍 No existing token, proceeding with guest auth');
    }

    // Prevent infinite loops - if we've already redirected, just go home
    if (hasRedirectParam) {
      console.log('🔄 Preventing redirect loop, going to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Create guest user (this ensures we have a user in the database)
    const [guestUser] = await createGuestUser();
    console.log('✅ Guest user created:', guestUser.email);

    // Redirect to NextAuth's built-in signin endpoint with guest provider
    const signinUrl = new URL('/api/auth/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', callbackUrl);
    
    console.log('🔗 Redirecting to NextAuth signin:', signinUrl.toString());
    return NextResponse.redirect(signinUrl);

  } catch (error) {
    console.error('❌ Guest auth error:', {
      error: error instanceof Error ? error.message : error,
      callbackUrl: callbackUrl.slice(0, 50),
    });
    
    // On any error, redirect to home
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('error', 'guest_auth_failed');
    return NextResponse.redirect(homeUrl);
  }
}
