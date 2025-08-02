import { auth } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // Check if user already has a valid session
    const session = await auth();
    if (session?.user) {
      console.log('🔄 Guest auth: User already has session, redirecting');
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Check if there's already a token
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isProduction,
    });

    if (token) {
      console.log('🔄 Guest auth: User already has token, redirecting');
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    console.log('👤 Guest auth: No existing session, redirecting to signin', {
      redirectUrl: redirectUrl.slice(0, 100),
      isProduction,
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });

    // Redirect directly to NextAuth's guest signin endpoint
    const signInUrl = new URL('/api/auth/signin/guest', request.url);
    signInUrl.searchParams.set('callbackUrl', redirectUrl);
    
    console.log('🔗 Redirecting to:', signInUrl.toString());
    return NextResponse.redirect(signInUrl);

  } catch (error) {
    console.error('❌ Guest auth failed:', {
      error: error instanceof Error ? error.message : error,
      redirectUrl: redirectUrl.slice(0, 100),
      isProduction,
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });
    
    // If everything fails, redirect to home and let middleware handle it
    return NextResponse.redirect(new URL('/', request.url));
  }
}
