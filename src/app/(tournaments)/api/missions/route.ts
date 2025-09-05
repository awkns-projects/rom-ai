import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  mission,
  solution,
  userTournamentProfile,
  missionPrize,
  pointsTransaction,
  userSeasonPoints
} from '@/lib/db/schema';
import { eq, desc, and, count, sql } from 'drizzle-orm';

// GET /api/missions - Fetch missions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status');
    const authorId = searchParams.get('authorId');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = db
      .select({
        mission: mission,
        author: userTournamentProfile,
        solutionCount: sql<number>`(
          SELECT COUNT(*) FROM "Solution" 
          WHERE "Solution"."missionId" = "Mission".id
        )`.as('solutionCount')
      })
      .from(mission)
      .leftJoin(userTournamentProfile, eq(mission.authorId, userTournamentProfile.userId));

    // Apply filters
    const conditions = [];
    if (seasonId) conditions.push(eq(mission.seasonId, seasonId));
    if (category && category !== 'all') conditions.push(eq(mission.category, category as any));
    if (difficulty && difficulty !== 'all') conditions.push(eq(mission.difficulty, difficulty as any));
    if (status && status !== 'all') conditions.push(eq(mission.status, status as any));
    if (authorId) conditions.push(eq(mission.authorId, authorId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.orderBy(desc(mission.createdAt));
        break;
      case 'oldest':
        query = query.orderBy(mission.createdAt);
        break;
      case 'points':
        query = query.orderBy(desc(mission.points));
        break;
      case 'votes':
        query = query.orderBy(desc(mission.upvotes));
        break;
      default:
        query = query.orderBy(desc(mission.createdAt));
    }

    const missions = await query.limit(limit);

    // Get mission prizes and solutions for each mission
    const missionsWithPrizesAndSolutions = await Promise.all(
      missions.map(async (m) => {
        const [prizes, solutions] = await Promise.all([
          db
            .select()
            .from(missionPrize)
            .where(eq(missionPrize.missionId, m.mission.id)),
          db
            .select({
              solution: solution,
              author: userTournamentProfile
            })
            .from(solution)
            .leftJoin(userTournamentProfile, eq(solution.authorId, userTournamentProfile.userId))
            .where(eq(solution.missionId, m.mission.id))
        ]);

        return {
          ...m.mission,
          author: m.author,
          solutions: solutions.map(s => ({
            ...s.solution,
            author: s.author
          })),
          missionPrizes: prizes
        };
      })
    );

    return NextResponse.json(missionsWithPrizesAndSolutions);
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch missions' },
      { status: 500 }
    );
  }
}

// POST /api/missions - Create new mission
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      seasonId,
      authorId,
      title,
      description,
      category,
      difficulty,
      tags = [],
      deadline,
      bonusPoints = 0
    } = data;

    // Validate required fields
    if (!seasonId || !authorId || !title || !description || !category || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate points based on difficulty
    const difficultyPoints: Record<string, number> = {
      easy: 75,
      medium: 150,
      hard: 300,
      expert: 500
    };

    const totalPoints = difficultyPoints[difficulty] + bonusPoints;

    // Create mission
    const [newMission] = await db
      .insert(mission)
      .values({
        seasonId,
        authorId,
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        points: totalPoints,
        tags: Array.isArray(tags) ? tags : [],
        deadline: deadline ? new Date(deadline) : null
      })
      .returning();

    // Add bonus prize if specified
    if (bonusPoints > 0) {
      await db.insert(missionPrize).values({
        missionId: newMission.id,
        value: bonusPoints.toString(),
        type: 'credits',
        description: 'Creator bonus reward',
        providedBy: 'creator',
        condition: 'Best Solution',
        icon: '💰'
      });
    }

    // Award points to mission creator
    await db.insert(pointsTransaction).values({
      userId: authorId,
      seasonId,
      amount: totalPoints,
      type: 'mission_submission',
      description: `Posted mission: ${title}`,
      relatedMissionId: newMission.id
    });

    // Update user's total points and season points
    await db
      .update(userTournamentProfile)
      .set({
        totalPoints: sql`"totalPoints" + ${totalPoints}`,
        submittedMissions: sql`"submittedMissions" + 1`,
        level: sql`GREATEST(1, FLOOR(SQRT(("totalPoints" + ${totalPoints}) / 100)))`
      })
      .where(eq(userTournamentProfile.userId, authorId));

    // Update season points
    await db
      .insert(userSeasonPoints)
      .values({
        userId: authorId,
        seasonId,
        points: totalPoints
      })
      .onConflictDoUpdate({
        target: [userSeasonPoints.userId, userSeasonPoints.seasonId],
        set: {
          points: sql`"UserSeasonPoints"."points" + ${totalPoints}`,
          updatedAt: sql`NOW()`
        }
      });

    return NextResponse.json(newMission, { status: 201 });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { error: 'Failed to create mission' },
      { status: 500 }
    );
  }
} 