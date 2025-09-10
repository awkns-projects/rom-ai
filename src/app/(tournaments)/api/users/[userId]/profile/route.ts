import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  userTournamentProfile,
  userSeasonPoints,
  userAchievement,
  achievementDefinition,
  user
} from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

// GET /api/users/[userId]/profile - Get user tournament profile with stats
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;
    
    // Get user profile
    let [profile] = await db
      .select()
      .from(userTournamentProfile)
      .where(eq(userTournamentProfile.userId, userId))
      .limit(1);

    // If profile doesn't exist, create it automatically
    if (!profile) {
      console.log(`Creating tournament profile for user ${userId}`);
      
      // First check if the user exists in the user table
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Create a default tournament profile
      [profile] = await db.insert(userTournamentProfile).values({
        userId: userId,
        username: existingUser.email?.split('@')[0] || 'Player',
        avatar: '🧑‍💻',
        totalPoints: 0,
        level: 1,
        badge: 'Newcomer',
        submittedMissions: 0,
        solvedMissions: 0,
        currentStreak: 0,
        longestStreak: 0,
        isOnline: true
      }).returning();

      console.log(`✅ Created tournament profile for ${profile.username}`);
    }

    // Get season points for all seasons
    const seasonPoints = await db
      .select()
      .from(userSeasonPoints)
      .where(eq(userSeasonPoints.userId, userId));

    // Get user achievements
    const achievements = await db
      .select({
        achievement: achievementDefinition,
        unlockedAt: userAchievement.unlockedAt
      })
      .from(userAchievement)
      .leftJoin(achievementDefinition, eq(userAchievement.achievementId, achievementDefinition.id))
      .where(eq(userAchievement.userId, userId))
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
    const { userId } = await params;
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
      .where(eq(userTournamentProfile.userId, userId))
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