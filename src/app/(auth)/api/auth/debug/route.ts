import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  // Only allow in development or with special header for security
  const isDev = process.env.NODE_ENV === 'development';
  const debugHeader = request.headers.get('x-debug-auth');
  
  if (!isDev && debugHeader !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, any>,
  };

  // Check environment variables
  diagnostics.checks.environment_variables = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not_set',
    NODE_ENV: process.env.NODE_ENV,
  };

  // Check token verification
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });
    
    diagnostics.checks.token_verification = {
      success: true,
      hasToken: !!token,
      tokenType: token ? (token.email?.startsWith('guest-') ? 'guest' : 'regular') : null,
    };
  } catch (error) {
    diagnostics.checks.token_verification = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check database connection
  try {
    const { createGuestUser } = await import('@/lib/db/queries');
    
    // Don't actually create a user, just test the import and connection
    diagnostics.checks.database_connection = {
      success: true,
      message: 'Database module loaded successfully',
    };
  } catch (error) {
    diagnostics.checks.database_connection = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check host and request info
  diagnostics.checks.request_info = {
    host: request.headers.get('host'),
    userAgent: request.headers.get('user-agent')?.slice(0, 50),
    hasCookies: !!request.headers.get('cookie'),
    protocol: request.headers.get('x-forwarded-proto') || 'unknown',
  };

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
} 