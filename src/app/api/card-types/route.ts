import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { cardType } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cardTypes = await db
      .select()
      .from(cardType)
      .where(eq(cardType.isActive, true))
      .orderBy(cardType.price);

    return NextResponse.json(cardTypes);
  } catch (error) {
    console.error('Error fetching card types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card types' },
      { status: 500 }
    );
  }
} 