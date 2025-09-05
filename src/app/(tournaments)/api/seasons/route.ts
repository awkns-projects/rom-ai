import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { season, seasonPrize } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const seasons = await db
      .select()
      .from(season)
      .orderBy(desc(season.startDate));

    // Get prizes for each season
    const seasonsWithPrizes = await Promise.all(
      seasons.map(async (s) => {
        const prizes = await db
          .select()
          .from(seasonPrize)
          .where(eq(seasonPrize.seasonId, s.id))
          .orderBy(seasonPrize.rank);

        return {
          ...s,
          prizes
        };
      })
    );

    return NextResponse.json(seasonsWithPrizes);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
} 