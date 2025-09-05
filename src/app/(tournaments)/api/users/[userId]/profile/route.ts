import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  userTournamentProfile,
  userSeasonPoints,
  userAchievement,
  achievementDefinition
} from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

// GET /api/users/[userId]/profile - Get user tournament profile with stats
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get user profile
    const [profile] = await db
      .select()
      .from(userTournamentProfile)
      .where(eq(userTournamentProfile.userId, params.userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get season points for all seasons
    const seasonPoints = await db
      .select()
      .from(userSeasonPoints)
      .where(eq(userSeasonPoints.userId, params.userId));

    // Get user achievements
    const achievements = await db
      .select({
        achievement: achievementDefinition,
        unlockedAt: userAchievement.unlockedAt
      })
      .from(userAchievement)
      .leftJoin(achievementDefinition, eq(userAchievement.achievementId, achievementDefinition.id))
      .where(eq(userAchievement.userId, params.userId))
      .orderBy(desc(userAchievement.unlockedAt));

    // Transform season points to match frontend format
    const seasonPointsMap = seasonPoints.reduce((acc, sp) => {
      acc[sp.seasonId] = sp.points;
      return acc;
    }, {} as Record<string, number>);

    const userProfile = {
      ...profile,
      seasonPoints: seasonPointsMap,
      achievements: achievements.map(a => ({
        ...a.achievement,
        unlockedAt: a.unlockedAt
      }))
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId]/profile - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const updates = await request.json();

    // Only allow updating certain fields
    const allowedFields = ['username', 'avatar', 'badge', 'isOnline'];
    const updateData = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const [updatedProfile] = await db
      .update(userTournamentProfile)
      .set(updateData)
      .where(eq(userTournamentProfile.userId, params.userId))
      .returning();

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 