import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { achievementDefinition } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/achievements - Get all achievement definitions
export async function GET() {
  try {
    const achievements = await db
      .select()
      .from(achievementDefinition)
      .where(eq(achievementDefinition.isActive, true))
      .orderBy(achievementDefinition.category, achievementDefinition.rarity);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
} 