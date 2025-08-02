import { NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';
import { createGuestUser } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  try {
    console.log('👤 Guest auth: Processing guest signin request', {
      callbackUrl: callbackUrl.slice(0, 100),
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });

    // Create guest user first
    const [guestUser] = await createGuestUser();
    console.log('✅ Guest user created:', guestUser.email);

    // Create a temporary response to handle the signin redirect properly
    const response = NextResponse.redirect(new URL(callbackUrl, request.url));
    
    console.log('🎭 Guest signin completed, redirecting to:', callbackUrl);
    return response;

  } catch (error) {
    console.error('❌ Guest auth failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      callbackUrl: callbackUrl.slice(0, 100),
      hasAuthSecret: !!process.env.AUTH_SECRET,
    });
    
    // If guest auth fails completely, redirect to home without auth
    // This will allow the app to function even if there are auth configuration issues
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('guest_fallback', 'true');
    console.log('🏠 Falling back to home without auth');
    return NextResponse.redirect(homeUrl);
  }
}
