import { NextResponse } from 'next/server';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check environment variables
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    timestamp: new Date().toISOString(),
  };

  // Check if critical environment variables are missing
  const missingVars = [];
  if (!process.env.AUTH_SECRET) missingVars.push('AUTH_SECRET');
  if (!process.env.POSTGRES_URL) missingVars.push('POSTGRES_URL');
  if (isProduction && !process.env.NEXTAUTH_URL) missingVars.push('NEXTAUTH_URL');

  const status = missingVars.length === 0 ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 500;

  return NextResponse.json({
    status,
    service: 'rom-cards-auth',
    environment: envCheck,
    missing_vars: missingVars,
    auth_endpoints: {
      guest_auth: '/api/auth/guest',
      nextauth_signin: '/api/auth/signin',
      nextauth_callback: '/api/auth/callback',
      debug: '/api/auth/debug'
    },
    recommendations: missingVars.length > 0 ? [
      'Set missing environment variables in Vercel dashboard',
      'Ensure AUTH_SECRET is at least 32 characters long',
      'Verify POSTGRES_URL connection string is correct',
      isProduction ? 'Set NEXTAUTH_URL to https://rom.cards' : null
    ].filter(Boolean) : ['All environment variables configured correctly']
  }, { status: statusCode });
} 