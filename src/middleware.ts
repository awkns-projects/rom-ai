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

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Check if request is coming from ngrok or localhost for testing/development
  const host = request.headers.get('host');
  const ngrokUrl = process.env.NGROK_URL;
  
  const isNgrokRequest = host && (
    host.includes('.ngrok-free.app') ||
    host.includes('.ngrok.io') ||
    host.includes('.ngrok.app') ||
    (ngrokUrl && (
      host.includes(ngrokUrl.replace(/https?:\/\//, '')) ||
      request.url.includes(ngrokUrl)
    ))
  );

  // Allow localhost in development
  const isLocalhostRequest = host && (
    host.startsWith('localhost:') ||
    host.startsWith('127.0.0.1:') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );

  const isTrustedRequest = isNgrokRequest || (isDevelopmentEnvironment && isLocalhostRequest);

  if (!token && !isTrustedRequest) {
    const redirectUrl = encodeURIComponent(request.url);

    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  // Allow trusted requests (ngrok/localhost) to continue even without token
  if (!token && isTrustedRequest) {
    console.log(`🔓 Allowing trusted request from ${host} to ${pathname}`);
    return NextResponse.next();
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
