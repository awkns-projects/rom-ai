import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  mission,
  solution,
  userTournamentProfile,
  missionPrize,
  missionVote,
  season
} from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/missions/[missionId] - Get mission with solutions
export async function GET(
  request: NextRequest,
  { params }: { params: { missionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('userId');

    // Get mission details
    const [missionData] = await db
      .select({
        mission: mission,
        author: userTournamentProfile,
        seasonData: season
      })
      .from(mission)
      .leftJoin(userTournamentProfile, eq(mission.authorId, userTournamentProfile.userId))
      .leftJoin(season, eq(mission.seasonId, season.id))
      .where(eq(mission.id, params.missionId))
      .limit(1);

    if (!missionData) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Get solutions
    const solutions = await db
      .select({
        solution: solution,
        author: userTournamentProfile
      })
      .from(solution)
      .leftJoin(userTournamentProfile, eq(solution.authorId, userTournamentProfile.userId))
      .where(eq(solution.missionId, params.missionId))
      .orderBy(desc(solution.createdAt));

    // Get mission prizes
    const prizes = await db
      .select()
      .from(missionPrize)
      .where(eq(missionPrize.missionId, params.missionId));

    // Get current user's vote if provided
    let userVote = null;
    if (currentUserId) {
      const [vote] = await db
        .select()
        .from(missionVote)
        .where(and(
          eq(missionVote.missionId, params.missionId),
          eq(missionVote.userId, currentUserId)
        ))
        .limit(1);
      userVote = vote || null;
    }

    return NextResponse.json({
      ...missionData.mission,
      author: missionData.author,
      seasonData: missionData.seasonData,
      solutions: solutions.map(s => ({
        ...s.solution,
        author: s.author
      })),
      missionPrizes: prizes,
      userVote
    });
  } catch (error) {
    console.error('Error fetching mission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mission' },
      { status: 500 }
    );
  }
} 