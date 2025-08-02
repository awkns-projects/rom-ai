import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not_set',
      hasNgrokUrl: !!process.env.NGROK_URL,
    },
    version: '1.0.0',
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
} 