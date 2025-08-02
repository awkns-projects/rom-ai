import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const host = request.headers.get('host') || '';
  const url = new URL(request.url);
  
  try {
    // Test token retrieval with different configurations
    const tokenTests = [];
    
    // Test 1: Standard token retrieval
    try {
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: isProduction,
      });
      tokenTests.push({
        test: 'standard_token',
        success: !!token,
        token: token ? { email: token.email, type: token.type } : null
      });
    } catch (error) {
      tokenTests.push({
        test: 'standard_token',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Force secure cookie false
    try {
      const tokenInsecure = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: false,
      });
      tokenTests.push({
        test: 'insecure_cookie',
        success: !!tokenInsecure,
        token: tokenInsecure ? { email: tokenInsecure.email, type: tokenInsecure.type } : null
      });
    } catch (error) {
      tokenTests.push({
        test: 'insecure_cookie',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Get all cookies from request
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').map(c => c.trim()).filter(c => c.includes('next-auth'));

    // Environment comparison
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      isProduction,
      host,
      protocol: url.protocol,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      authSecretLength: process.env.AUTH_SECRET?.length || 0,
    };

    // Cookie analysis
    const cookieAnalysis = {
      raw_cookies: cookies,
      has_session_token: cookies.some(c => c.includes('session-token')),
      has_secure_session: cookies.some(c => c.includes('__Secure-next-auth.session-token')),
      has_host_csrf: cookies.some(c => c.includes('__Host-next-auth.csrf-token')),
      total_auth_cookies: cookies.length,
    };

    // Expected vs actual cookie names
    const expectedCookieNames = isProduction ? [
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url', 
      '__Host-next-auth.csrf-token'
    ] : [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token'
    ];

    const diagnostics = {
      environment,
      token_tests: tokenTests,
      cookie_analysis: cookieAnalysis,
      expected_cookies: expectedCookieNames,
      url_analysis: {
        request_host: host,
        nextauth_url: process.env.NEXTAUTH_URL,
        domain_match: process.env.NEXTAUTH_URL?.includes(host),
        www_mismatch: (host.includes('rom.cards') && process.env.NEXTAUTH_URL?.includes('www.rom.cards')) ||
                     (host.includes('www.rom.cards') && process.env.NEXTAUTH_URL?.includes('rom.cards')),
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on findings
    if (diagnostics.url_analysis.www_mismatch) {
      diagnostics.recommendations.push('Fix NEXTAUTH_URL domain mismatch - ensure www/non-www consistency');
    }
    
    if (!cookieAnalysis.has_session_token) {
      diagnostics.recommendations.push('No session token found - user not authenticated or cookies not set properly');
    }

    if (isProduction && !cookieAnalysis.has_secure_session) {
      diagnostics.recommendations.push('Production missing secure session cookies - check HTTPS and cookie settings');
    }

    if (!tokenTests.some(t => t.success)) {
      diagnostics.recommendations.push('All token retrieval tests failed - check AUTH_SECRET and cookie configuration');
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      diagnostics
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 