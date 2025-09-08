import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  solution,
  mission,
  userTournamentProfile,
  pointsTransaction,
  userSeasonPoints,
  notification
} from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// POST /api/solutions - Submit new solution
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      missionId,
      seasonId,
      authorId,
      content,
      characterConfig
    } = data;

    // Validate required fields
    if (!missionId || !seasonId || !authorId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if mission exists and is open
    const [missionData] = await db
      .select()
      .from(mission)
      .where(eq(mission.id, missionId))
      .limit(1);

    if (!missionData) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    if (missionData.status !== 'open') {
      return NextResponse.json(
        { error: 'Mission is not accepting solutions' },
        { status: 400 }
      );
    }

    const basePoints = 50;

    // Create solution
    const [newSolution] = await db
      .insert(solution)
      .values({
        missionId,
        seasonId,
        authorId,
        content: content.trim(),
        points: basePoints,
        characterConfig: characterConfig || null
      })
      .returning();

    // Award points to solution author
    await db.insert(pointsTransaction).values({
      userId: authorId,
      seasonId,
      amount: basePoints,
      type: 'solution_submission',
      description: 'Submitted solution',
      relatedSolutionId: newSolution.id,
      relatedMissionId: missionId
    });

    // Update user's total points and season points
    await db
      .update(userTournamentProfile)
      .set({
        totalPoints: sql`"totalPoints" + ${basePoints}`,
        level: sql`GREATEST(1, FLOOR(SQRT(("totalPoints" + ${basePoints}) / 100)))`
      })
      .where(eq(userTournamentProfile.userId, authorId));

    // Update season points
    await db
      .insert(userSeasonPoints)
      .values({
        userId: authorId,
        seasonId,
        points: basePoints,
        solutionsSubmitted: 1
      })
      .onConflictDoUpdate({
        target: [userSeasonPoints.userId, userSeasonPoints.seasonId],
        set: {
          points: sql`"UserSeasonPoints"."points" + ${basePoints}`,
          solutionsSubmitted: sql`"UserSeasonPoints"."solutionsSubmitted" + 1`,
          updatedAt: sql`NOW()`
        }
      });

    // Create notification
    await db.insert(notification).values({
      userId: authorId,
      type: 'solution_accepted',
      title: 'Solution Submitted!',
      message: `Your solution for "${missionData.title}" has been posted and earned you ${basePoints} points!`,
      link: `/tournament?mission=${missionId}`
    });

    return NextResponse.json(newSolution, { status: 201 });
  } catch (error) {
    console.error('Error submitting solution:', error);
    return NextResponse.json(
      { error: 'Failed to submit solution' },
      { status: 500 }
    );
  }
} 