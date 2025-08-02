import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';
import { extractAgentToken, verifyAgentToken, checkRateLimit, createAgentResponseHeaders, logAgentRequest } from './lib/agent-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests for sub-agents
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Agent-Token, X-Agent-Key, X-Document-ID',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Allow health checks without authentication
  if (pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  // Let NextAuth handle all auth routes without interference
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Skip middleware for cron endpoints - they handle their own authentication
  if (pathname.startsWith('/api/execute-schedules') || 
      (pathname.startsWith('/api/agent/execute-schedule') && 
       request.headers.get('authorization')?.startsWith('Bearer '))) {
    return NextResponse.next();
  }

  // Handle agent authentication for specific API endpoints
  const agentEndpoints = [
    '/api/agent-credentials-public',
    '/api/agent-credentials', 
    '/api/agent/execute-action',
    '/api/agent/execute-schedule',
    '/api/user/api-keys'
  ];

  if (agentEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    const agentToken = extractAgentToken(request);
    
    if (agentToken) {
      const authResult = await verifyAgentToken(agentToken);
      
      if (authResult.success && authResult.payload) {
        // Check rate limits
        const rateLimit = checkRateLimit(authResult.payload.agentKey);
        
        if (!rateLimit.allowed) {
          logAgentRequest(
            authResult.payload.agentKey,
            pathname,
            request.method,
            false,
            { error: 'rate_limit_exceeded', ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown' }
          );
          
          const response = NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
          
          // Add rate limit headers
          const headers = createAgentResponseHeaders(rateLimit);
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        }
        
        // Log successful agent request
        logAgentRequest(
          authResult.payload.agentKey,
          pathname,
          request.method,
          true,
          { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', needsRefresh: authResult.needsRefresh }
        );
        
        // Add agent auth headers to request for downstream handlers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-agent-auth', 'verified');
        requestHeaders.set('x-agent-document-id', authResult.payload.documentId);
        requestHeaders.set('x-agent-key', authResult.payload.agentKey);
        requestHeaders.set('x-agent-permissions', JSON.stringify(authResult.payload.permissions));
        
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        
        // Add rate limit headers to response
        const responseHeaders = createAgentResponseHeaders(rateLimit);
        Object.entries(responseHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        // Add refresh warning if needed
        if (authResult.needsRefresh) {
          response.headers.set('X-Agent-Token-Refresh-Needed', 'true');
        }
        
        return response;
      } else {
        // Invalid agent token
        logAgentRequest(
          'unknown',
          pathname,
          request.method,
          false,
          { error: authResult.error, ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown' }
        );
        
        return NextResponse.json(
          { error: 'Invalid agent authentication' },
          { status: 401 }
        );
      }
    }
    // If no agent token provided, continue with normal auth flow
  }

  // Get host and environment info
  const host = request.headers.get('host') || '';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check for development/testing environments that bypass auth
  const isNgrokRequest = host.includes('.ngrok-free.app') || 
                        host.includes('.ngrok.io') || 
                        host.includes('.ngrok.app') ||
                        (process.env.NGROK_URL && host.includes(process.env.NGROK_URL.replace(/https?:\/\//, '')));
                        
  const isLocalhostRequest = isDevelopmentEnvironment && (
    host.startsWith('localhost:') ||
    host.startsWith('127.0.0.1:') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );

  // For development environments, allow bypassing auth for certain cases
  const isTrustedRequest = isNgrokRequest || isLocalhostRequest;

  // Prevent redirect loops - if we're already being redirected FROM guest auth, allow it through
  const referer = request.headers.get('referer');
  const isFromGuestAuth = referer && referer.includes('/api/auth/guest');
  const isFromSignIn = referer && referer.includes('/api/auth/signin');
  
  if (isFromGuestAuth || isFromSignIn) {
    console.log(`🔄 Allowing request from auth redirect: ${pathname}`);
    return NextResponse.next();
  }

  // Try to get the NextAuth token
  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isProduction,
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    // If token verification fails, allow through to prevent loops
    if (isTrustedRequest || pathname === '/') {
      console.log(`🔓 Token error, allowing through: ${pathname}`);
      return NextResponse.next();
    }
  }

  // Handle unauthenticated users
  if (!token) {
    // Allow trusted requests to continue without authentication for development
    if (isTrustedRequest) {
      console.log(`🔓 Allowing trusted request: ${host}${pathname}`);
      return NextResponse.next();
    }

    // For production, only redirect to guest auth for specific routes
    const shouldRedirectToAuth = pathname === '/' || 
                                pathname.startsWith('/chat') || 
                                pathname.startsWith('/deployment') ||
                                pathname.startsWith('/auth-test');

    if (!shouldRedirectToAuth) {
      console.log(`🔓 Allowing access to public route: ${pathname}`);
      return NextResponse.next();
    }

    // Redirect to guest authentication for production
    console.log(`🔒 No token, redirecting to guest auth: ${pathname}`);
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/signin/guest?callbackUrl=${redirectUrl}`, request.url),
    );
  }

  // Handle authenticated users trying to access login/register
  const isGuest = guestRegex.test(token?.email ?? '');
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    console.log(`↩️ Authenticated user accessing ${pathname}, redirecting to chat`);
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // Allow the request to continue
  console.log(`✅ Auth check passed: ${token.email?.slice(0, 15)}... → ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - /api/auth (NextAuth routes)
     * - /api/health (health check)
     * - /ping (test endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|api/health|ping).*)',
  ],
};
