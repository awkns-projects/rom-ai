import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  missionVote,
  solutionVote,
  mission,
  solution,
  pointsTransaction,
  userTournamentProfile,
  userSeasonPoints
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/voting - Handle votes for missions and solutions
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      type, // 'mission' | 'solution'
      targetId, // missionId or solutionId
      userId,
      voteType // 'up' | 'down'
    } = data;

    // Validate required fields
    if (!type || !targetId || !userId || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'mission') {
      await handleMissionVote(targetId, userId, voteType);
    } else if (type === 'solution') {
      await handleSolutionVote(targetId, userId, voteType);
    } else {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}

async function handleMissionVote(missionId: string, userId: string, voteType: 'up' | 'down') {
  // Check if user already voted
  const existingVote = await db
    .select()
    .from(missionVote)
    .where(and(
      eq(missionVote.missionId, missionId),
      eq(missionVote.userId, userId)
    ))
    .limit(1);

  if (existingVote.length > 0) {
    // Update existing vote
    await db
      .update(missionVote)
      .set({ voteType })
      .where(and(
        eq(missionVote.missionId, missionId),
        eq(missionVote.userId, userId)
      ));
  } else {
    // Create new vote
    await db.insert(missionVote).values({
      missionId,
      userId,
      voteType
    });
  }

  // Update mission vote counts
  const voteCount = await db
    .select({
      upvotes: sql<number>`COUNT(CASE WHEN vote_type = 'up' THEN 1 END)`,
      downvotes: sql<number>`COUNT(CASE WHEN vote_type = 'down' THEN 1 END)`
    })
    .from(missionVote)
    .where(eq(missionVote.missionId, missionId));

  if (voteCount.length > 0) {
    await db
      .update(mission)
      .set({
        upvotes: voteCount[0].upvotes,
        downvotes: voteCount[0].downvotes
      })
      .where(eq(mission.id, missionId));
  }
}

async function handleSolutionVote(solutionId: string, userId: string, voteType: 'up' | 'down') {
  // Check if user already voted
  const existingVote = await db
    .select()
    .from(solutionVote)
    .where(and(
      eq(solutionVote.solutionId, solutionId),
      eq(solutionVote.userId, userId)
    ))
    .limit(1);

  if (existingVote.length > 0) {
    // Update existing vote
    await db
      .update(solutionVote)
      .set({ voteType })
      .where(and(
        eq(solutionVote.solutionId, solutionId),
        eq(solutionVote.userId, userId)
      ));
  } else {
    // Create new vote
    await db.insert(solutionVote).values({
      solutionId,
      userId,
      voteType
    });
  }

  // Update solution vote counts
  const voteCount = await db
    .select({
      upvotes: sql<number>`COUNT(CASE WHEN vote_type = 'up' THEN 1 END)`,
      downvotes: sql<number>`COUNT(CASE WHEN vote_type = 'down' THEN 1 END)`
    })
    .from(solutionVote)
    .where(eq(solutionVote.solutionId, solutionId));

  if (voteCount.length > 0) {
    await db
      .update(solution)
      .set({
        upvotes: voteCount[0].upvotes,
        downvotes: voteCount[0].downvotes
      })
      .where(eq(solution.id, solutionId));

    // Award points to solution author for upvotes
    if (voteType === 'up') {
      const [solutionData] = await db
        .select()
        .from(solution)
        .where(eq(solution.id, solutionId))
        .limit(1);

      if (solutionData) {
        const votePoints = 5;

        // Award points
        await db.insert(pointsTransaction).values({
          userId: solutionData.authorId,
          seasonId: solutionData.seasonId,
          amount: votePoints,
          type: 'vote_received',
          description: 'Received upvote on solution',
          relatedSolutionId: solutionId
        });

        // Update user points
        await db
          .update(userTournamentProfile)
          .set({
            totalPoints: sql`"totalPoints" + ${votePoints}`,
            level: sql`GREATEST(1, FLOOR(SQRT(("totalPoints" + ${votePoints}) / 100)))`
          })
          .where(eq(userTournamentProfile.userId, solutionData.authorId));

        // Update season points
        await db
          .insert(userSeasonPoints)
          .values({
            userId: solutionData.authorId,
            seasonId: solutionData.seasonId,
            points: votePoints
          })
          .onConflictDoUpdate({
            target: [userSeasonPoints.userId, userSeasonPoints.seasonId],
            set: {
              points: sql`points + ${votePoints}`,
              updatedAt: sql`NOW()`
            }
          });
      }
    }
  }
} 