import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isProduction, // Use production-appropriate cookie settings
    });

    if (token) {
      console.log('🔄 Guest auth: User already has token, redirecting to root');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('👤 Guest auth: Creating guest session', {
      redirectUrl: redirectUrl.slice(0, 100),
      isProduction,
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });

    // Attempt to sign in as guest
    const result = await signIn('guest', { redirect: true, redirectTo: redirectUrl });
    
    return result;
  } catch (error) {
    console.error('❌ Guest auth failed:', {
      error: error instanceof Error ? error.message : error,
      redirectUrl: redirectUrl.slice(0, 100),
      isProduction,
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });
    
    // If guest auth fails, redirect to login page as fallback
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
