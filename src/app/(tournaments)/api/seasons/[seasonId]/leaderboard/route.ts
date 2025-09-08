import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  userSeasonPoints,
  userTournamentProfile
} from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// GET /api/seasons/[seasonId]/leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: { seasonId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const leaderboard = await db
      .select({
        user: userTournamentProfile,
        seasonPoints: userSeasonPoints,
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${userSeasonPoints.points} DESC)`.as('rank')
      })
      .from(userSeasonPoints)
      .leftJoin(userTournamentProfile, eq(userSeasonPoints.userId, userTournamentProfile.userId))
      .where(eq(userSeasonPoints.seasonId, params.seasonId))
      .orderBy(desc(userSeasonPoints.points))
      .limit(limit);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 