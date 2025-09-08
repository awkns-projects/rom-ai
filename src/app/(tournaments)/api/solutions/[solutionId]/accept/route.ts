import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  solution,
  mission,
  pointsTransaction,
  userTournamentProfile,
  userSeasonPoints,
  notification
} from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// POST /api/solutions/[solutionId]/accept - Accept a solution (mission owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: { solutionId: string } }
) {
  try {
    const { userId } = await request.json(); // Mission owner's ID

    // Get solution and mission details
    const [solutionData] = await db
      .select({
        solution: solution,
        mission: mission
      })
      .from(solution)
      .leftJoin(mission, eq(solution.missionId, mission.id))
      .where(eq(solution.id, params.solutionId))
      .limit(1);

    if (!solutionData) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }

    // Check if user is mission owner
    if (solutionData.mission?.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only mission owner can accept solutions' },
        { status: 403 }
      );
    }

    // Check if solution is already accepted
    if (solutionData.solution.isAccepted) {
      return NextResponse.json(
        { error: 'Solution is already accepted' },
        { status: 400 }
      );
    }

    // Calculate bonus points for accepted solution
    const missionPoints = solutionData.mission?.points || 0;
    const bonusPoints = Math.floor(missionPoints * 0.5); // 50% of mission points as bonus

    // Mark solution as accepted and award bonus points
    await db
      .update(solution)
      .set({
        isAccepted: true,
        points: sql`points + ${bonusPoints}`
      })
      .where(eq(solution.id, params.solutionId));

    // Award bonus points to solution author
    await db.insert(pointsTransaction).values({
      userId: solutionData.solution.authorId,
      seasonId: solutionData.solution.seasonId,
      amount: bonusPoints,
      type: 'solution_accepted',
      description: 'Solution accepted by mission owner',
      relatedSolutionId: params.solutionId,
      relatedMissionId: solutionData.solution.missionId
    });

    // Update user's total points
    await db
      .update(userTournamentProfile)
      .set({
        totalPoints: sql`"totalPoints" + ${bonusPoints}`,
        solvedMissions: sql`"solvedMissions" + 1`,
        level: sql`GREATEST(1, FLOOR(SQRT(("totalPoints" + ${bonusPoints}) / 100)))`
      })
      .where(eq(userTournamentProfile.userId, solutionData.solution.authorId));

    // Update season points
    await db
      .insert(userSeasonPoints)
      .values({
        userId: solutionData.solution.authorId,
        seasonId: solutionData.solution.seasonId,
        points: bonusPoints,
        solutionsAccepted: 1
      })
      .onConflictDoUpdate({
        target: [userSeasonPoints.userId, userSeasonPoints.seasonId],
        set: {
          points: sql`points + ${bonusPoints}`,
          solutionsAccepted: sql`solutions_accepted + 1`,
          updatedAt: sql`NOW()`
        }
      });

    // Update mission status to solved
    await db
      .update(mission)
      .set({ status: 'solved' })
      .where(eq(mission.id, solutionData.solution.missionId));

    // Create notification for solution author
    await db.insert(notification).values({
      userId: solutionData.solution.authorId,
      type: 'solution_accepted',
      title: 'Solution Accepted!',
      message: `Your solution was accepted and earned you ${bonusPoints} bonus points!`,
      link: `/tournament?mission=${solutionData.solution.missionId}`
    });

    return NextResponse.json({
      success: true,
      bonusPoints,
      message: 'Solution accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting solution:', error);
    return NextResponse.json(
      { error: 'Failed to accept solution' },
      { status: 500 }
    );
  }
} 