import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  userAchievement,
  achievementDefinition
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/users/[userId]/achievements - Get user's unlocked achievements
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userAchievements = await db
      .select({
        achievement: achievementDefinition,
        userAchievement: userAchievement
      })
      .from(userAchievement)
      .leftJoin(achievementDefinition, eq(userAchievement.achievementId, achievementDefinition.id))
      .where(eq(userAchievement.userId, params.userId))
      .orderBy(userAchievement.unlockedAt);

    return NextResponse.json(userAchievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    );
  }
} 