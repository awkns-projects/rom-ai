// Load environment variables first
import 'dotenv/config';

import { db } from './db';
import {
  season,
  seasonPrize,
  achievementDefinition,
  userTournamentProfile,
  mission,
  solution,
  user,
  userAchievement,
  userSeasonPoints
} from './schema';

export async function seedTournamentData() {
  console.log('🌱 Seeding tournament data...');

  try {
    // Check if seasons already exist
    const existingSeasons = await db.query.season.findMany({
      where: (season, { inArray }) => inArray(season.name, ['Genesis Tournament', 'Innovation Sprint'])
    });

    let season1, season2;

    if (existingSeasons.length === 0) {
      // Create seasons if they don't exist
      console.log('Creating new seasons...');
      [season1] = await db.insert(season).values({
        name: 'Genesis Tournament',
        description: 'The inaugural season of competitive problem solving',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        status: 'active',
        theme: 'Foundation Building',
        image: '/images/seasons/season1.png',
        totalPrizePool: '15000.00',
        participantCount: 1247,
        missionCount: 89
      }).returning();

      [season2] = await db.insert(season).values({
        name: 'Innovation Sprint',
        description: 'Focus on creative solutions and breakthrough thinking',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        status: 'upcoming',
        theme: 'Creative Innovation',
        image: '/images/seasons/season2.png',
        totalPrizePool: '20000.00',
        participantCount: 0,
        missionCount: 0
      }).returning();
    } else {
      console.log('Using existing seasons...');
      season1 = existingSeasons.find(s => s.name === 'Genesis Tournament')!;
      season2 = existingSeasons.find(s => s.name === 'Innovation Sprint')!;
    }

    console.log('✅ Created seasons');

    // Create season prizes for season 1
    await db.insert(seasonPrize).values([
      {
        seasonId: season1.id,
        rank: 1,
        title: 'Grand Champion',
        description: 'First place winner',
        value: '5000.00',
        type: 'cash',
        icon: '🏆'
      },
      {
        seasonId: season1.id,
        rank: 2,
        title: 'Elite Solver',
        description: 'Second place winner',
        value: '3000.00',
        type: 'cash',
        icon: '🥈'
      },
      {
        seasonId: season1.id,
        rank: 3,
        title: 'Master Contributor',
        description: 'Third place winner',
        value: '1500.00',
        type: 'cash',
        icon: '🥉'
      },
      {
        seasonId: season1.id,
        rank: 4,
        title: 'Rising Star',
        description: 'Top 10 finisher',
        value: '500.00',
        type: 'credits',
        icon: '⭐'
      },
      {
        seasonId: season1.id,
        rank: 5,
        title: 'Dedicated Solver',
        description: 'Top 25 finisher',
        value: '250.00',
        type: 'credits',
        icon: '🎯'
      }
    ]);

    // Create season prizes for season 2
    await db.insert(seasonPrize).values([
      {
        seasonId: season2.id,
        rank: 1,
        title: 'Innovation Champion',
        description: 'Most innovative solutions',
        value: '7500.00',
        type: 'cash',
        icon: '💡'
      },
      {
        seasonId: season2.id,
        rank: 2,
        title: 'Creative Genius',
        description: 'Outstanding creativity',
        value: '4500.00',
        type: 'cash',
        icon: '🎨'
      },
      {
        seasonId: season2.id,
        rank: 3,
        title: 'Breakthrough Thinker',
        description: 'Revolutionary approach',
        value: '2500.00',
        type: 'cash',
        icon: '🚀'
      },
      {
        seasonId: season2.id,
        rank: 4,
        title: 'Innovation NFT',
        description: 'Exclusive digital collectible',
        value: '1.00',
        type: 'nft',
        icon: '🖼️'
      },
      {
        seasonId: season2.id,
        rank: 5,
        title: 'Beta Access',
        description: 'Early access to new features',
        value: '1.00',
        type: 'access',
        icon: '🔑'
      }
    ]);

    console.log('✅ Created season prizes');

    // Create achievements
    const achievementDefs = await db.insert(achievementDefinition).values([
      {
        name: 'First Steps',
        description: 'Submitted your first mission',
        icon: '🚀',
        rarity: 'common',
        category: 'missions',
        criteria: { type: 'missions_completed', threshold: 1 },
        points: 25,
        isActive: true
      },
      {
        name: 'Problem Solver',
        description: 'Solved 10 missions',
        icon: '🧩',
        rarity: 'rare',
        category: 'solutions',
        criteria: { type: 'solutions_accepted', threshold: 10 },
        points: 100,
        isActive: true
      },
      {
        name: 'Code Ninja',
        description: 'Solved 50 technical missions',
        icon: '🥷',
        rarity: 'epic',
        category: 'solutions',
        criteria: { type: 'solutions_accepted', threshold: 50, category: 'technical' },
        points: 500,
        isActive: true
      },
      {
        name: 'Legend',
        description: 'Reached level 15',
        icon: '👑',
        rarity: 'legendary',
        category: 'level',
        criteria: { type: 'level_reached', threshold: 15 },
        points: 1000,
        isActive: true
      },
      {
        name: 'Streak Master',
        description: 'Maintained a 30-day solving streak',
        icon: '🔥',
        rarity: 'epic',
        category: 'activity',
        criteria: { type: 'streak_days', threshold: 30 },
        points: 300,
        isActive: true
      },
      {
        name: 'Community Helper',
        description: 'Received 100 upvotes',
        icon: '🤝',
        rarity: 'rare',
        category: 'social',
        criteria: { type: 'upvotes_received', threshold: 100 },
        points: 200,
        isActive: true
      }
    ]).returning();

    console.log('✅ Created achievements');

    console.log('🎉 Tournament data seeded successfully!');
    return {
      seasons: [season1, season2],
      achievements: achievementDefs,
      message: 'Tournament data seeded successfully'
    };

  } catch (error) {
    console.error('❌ Error seeding tournament data:', error);
    throw error;
  }
}

// Helper function to create demo user profiles
export async function createDemoUsers() {
  console.log('👥 Creating demo user profiles...');

  const demoUsers = [
    {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      username: 'CodeMaster',
      avatar: '🧑‍💻',
      totalPoints: 2850,
      level: 12,
      badge: 'Elite Solver',
      submittedMissions: 23,
      solvedMissions: 47,
      currentStreak: 7,
      longestStreak: 12,
      isOnline: true
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440002',
      username: 'DataWizard',
      avatar: '🧙‍♀️',
      totalPoints: 1920,
      level: 9,
      badge: 'Data Expert',
      submittedMissions: 18,
      solvedMissions: 31,
      currentStreak: 3,
      longestStreak: 8,
      isOnline: false
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440003',
      username: 'AIEnthusiast',
      avatar: '🤖',
      totalPoints: 3200,
      level: 15,
      badge: 'AI Pioneer',
      submittedMissions: 29,
      solvedMissions: 62,
      currentStreak: 12,
      longestStreak: 18,
      isOnline: true
    }
  ];

  // First create users in the User table
  for (const userData of demoUsers) {
    await db.insert(user).values({
      email: `${userData.username.toLowerCase()}@example.com`
    }).onConflictDoNothing();
  }

  // Then create their tournament profiles
  for (const userData of demoUsers) {
    await db.insert(userTournamentProfile).values({
      userId: userData.userId,
      username: userData.username,
      avatar: userData.avatar,
      totalPoints: userData.totalPoints,
      level: userData.level,
      badge: userData.badge,
      submittedMissions: userData.submittedMissions,
      solvedMissions: userData.solvedMissions,
      currentStreak: userData.currentStreak,
      longestStreak: userData.longestStreak,
      isOnline: userData.isOnline
    }).onConflictDoNothing();
  }

  console.log('✅ Created demo users and tournament profiles');
  return demoUsers;
}

// Helper function to create sample missions
export async function createSampleMissions(seasonId: string, userIds: string[]) {
  console.log('🎯 Creating sample missions...');

  const missions = await db.insert(mission).values([
    {
      seasonId: seasonId,
      title: 'Optimize React Component Performance',
      description: 'I have a React component that renders a large list of items (1000+) and it\'s causing severe performance issues. The component re-renders frequently and the UI becomes unresponsive. Looking for optimization strategies and best practices.',
      category: 'technical',
      difficulty: 'medium',
      points: 150,
      authorId: userIds[0],
      deadline: new Date('2024-02-15T23:59:59Z'),
      tags: ['react', 'performance', 'optimization', 'frontend']
    },
    {
      seasonId: seasonId,
      title: 'Database Schema Design for Multi-tenant SaaS',
      description: 'Need help designing a scalable database schema for a multi-tenant SaaS application. The system needs to handle customer isolation, data partitioning, and efficient querying across tenants.',
      category: 'technical',
      difficulty: 'hard',
      points: 300,
      authorId: userIds[1],
      tags: ['database', 'saas', 'architecture', 'scalability']
    },
    {
      seasonId: seasonId,
      title: 'AI Model for Content Moderation',
      description: 'Looking to implement an AI model that can automatically detect and flag inappropriate content in user-generated posts. Need guidance on model selection, training data, and implementation approach.',
      category: 'research',
      difficulty: 'expert',
      points: 500,
      authorId: userIds[2],
      deadline: new Date('2024-03-01T23:59:59Z'),
      tags: ['ai', 'machine-learning', 'content-moderation', 'nlp']
    },
    {
      seasonId: seasonId,
      title: 'Marketing Strategy for B2B SaaS Launch',
      description: 'Launching a new B2B SaaS product and need a comprehensive go-to-market strategy. Looking for advice on pricing models, customer acquisition channels, and competitive positioning.',
      category: 'business',
      difficulty: 'medium',
      points: 200,
      authorId: userIds[0],
      tags: ['marketing', 'saas', 'strategy', 'b2b']
    },
    {
      seasonId: seasonId,
      title: 'Creative UI/UX for Mobile Game',
      description: 'Designing a mobile puzzle game and need fresh ideas for user interface and user experience. Looking for innovative interaction patterns and visual design concepts that enhance gameplay.',
      category: 'creative',
      difficulty: 'medium',
      points: 180,
      authorId: userIds[1],
      tags: ['ui-ux', 'mobile', 'gaming', 'design']
    }
  ]).returning();

  console.log('✅ Created sample missions');
  return missions;
}

// Helper function to create sample solutions
export async function createSampleSolutions(missionIds: string[], userIds: string[], seasonId: string) {
  console.log('💡 Creating sample solutions...');

  const solutions = await db.insert(solution).values([
    // Solutions for Mission 1 (React Performance)
    {
      missionId: missionIds[0],
      seasonId: seasonId,
      content: 'For optimizing React performance with large lists, I recommend using React.memo() for the list items, implementing virtualization with react-window, and using useMemo() for expensive calculations.',
      authorId: userIds[2]
    },
    {
      missionId: missionIds[0],
      seasonId: seasonId,
      content: 'Another approach is to use React.useMemo() and React.useCallback() strategically. Also consider implementing pagination or infinite scroll to limit initial render.',
      authorId: userIds[1]
    },
    {
      missionId: missionIds[0],
      seasonId: seasonId,
      content: 'Have you tried using the React DevTools Profiler? It can help identify which components are causing the performance bottleneck.',
      authorId: userIds[0]
    },
    // Solutions for Mission 2 (Database Schema)
    {
      missionId: missionIds[1],
      seasonId: seasonId,
      content: 'For multi-tenant SaaS database design, I suggest using a hybrid approach with Row-level Security (RLS) for shared tables and schema-per-tenant for custom fields.',
      authorId: userIds[0]
    },
    {
      missionId: missionIds[1],
      seasonId: seasonId,
      content: 'Consider using separate databases per tenant for ultimate isolation. Pros: Complete isolation, easier compliance. Cons: More complex backup/migration, higher costs.',
      authorId: userIds[1]
    },
    // Solutions for Mission 3 (AI Content Moderation)
    {
      missionId: missionIds[2],
      seasonId: seasonId,
      content: 'For AI content moderation, I recommend a multi-layered approach: Start with OpenAI Moderation API, add custom fine-tuning for your content types, and implement human-in-the-loop for edge cases.',
      authorId: userIds[0]
    },
    {
      missionId: missionIds[2],
      seasonId: seasonId,
      content: 'Consider using Hugging Face Transformers for a self-hosted solution. Benefits: Full control, no API costs, privacy-first.',
      authorId: userIds[2]
    },
    // Solutions for Mission 5 (Mobile Game UI/UX)
    {
      missionId: missionIds[4],
      seasonId: seasonId,
      content: 'For mobile puzzle game UI/UX, focus on thumb-friendly design, visual hierarchy, and micro-interactions. Place primary actions in the bottom 1/3 of screen and add haptic feedback.',
      authorId: userIds[2]
    },
    {
      missionId: missionIds[4],
      seasonId: seasonId,
      content: 'Here\'s a fresh take on puzzle game interactions: Use gesture-based controls, implement adaptive difficulty, and add engagement features like daily challenges and AR mode.',
      authorId: userIds[1]
    }
  ]).returning();

  console.log('✅ Created sample solutions');
  return solutions;
}

// Helper function to create user achievements
export async function createUserAchievements(userIds: string[], achievementIds: string[]) {
  console.log('🏆 Creating user achievements...');

  await db.insert(userAchievement).values([
    // CodeMaster achievements
    { userId: userIds[0], achievementId: achievementIds[0], unlockedAt: new Date('2024-01-15T10:00:00Z') },
    { userId: userIds[0], achievementId: achievementIds[1], unlockedAt: new Date('2024-01-20T15:30:00Z') },
    { userId: userIds[0], achievementId: achievementIds[2], unlockedAt: new Date('2024-01-25T09:15:00Z') },

    // DataWizard achievements
    { userId: userIds[1], achievementId: achievementIds[0], unlockedAt: new Date('2024-02-20T10:00:00Z') },
    { userId: userIds[1], achievementId: achievementIds[1], unlockedAt: new Date('2024-02-25T15:30:00Z') },

    // AIEnthusiast achievements (all of them - they're the top player)
    { userId: userIds[2], achievementId: achievementIds[0], unlockedAt: new Date('2024-01-01T10:00:00Z') },
    { userId: userIds[2], achievementId: achievementIds[1], unlockedAt: new Date('2024-01-05T15:30:00Z') },
    { userId: userIds[2], achievementId: achievementIds[2], unlockedAt: new Date('2024-01-10T09:15:00Z') },
    { userId: userIds[2], achievementId: achievementIds[3], unlockedAt: new Date('2024-01-30T12:00:00Z') }
  ]);

  console.log('✅ Created user achievements');
}

// Helper function to create user season points for leaderboard
export async function createUserSeasonPoints(userIds: string[], seasons: any[]) {
  console.log('📊 Creating user season points...');

  // Create season points for both seasons
  for (const season of seasons) {
    await db.insert(userSeasonPoints).values([
      // CodeMaster - current leader
      {
        userId: userIds[0],
        seasonId: season.id,
        points: season.name === 'Genesis Tournament' ? 2850 : 1200,
        rank: 1,
        missionsCompleted: season.name === 'Genesis Tournament' ? 12 : 5,
        solutionsSubmitted: season.name === 'Genesis Tournament' ? 23 : 8,
        solutionsAccepted: season.name === 'Genesis Tournament' ? 18 : 6
      },
      // AIEnthusiast - close second
      {
        userId: userIds[2],
        seasonId: season.id,
        points: season.name === 'Genesis Tournament' ? 2400 : 1100,
        rank: 2,
        missionsCompleted: season.name === 'Genesis Tournament' ? 15 : 7,
        solutionsSubmitted: season.name === 'Genesis Tournament' ? 29 : 12,
        solutionsAccepted: season.name === 'Genesis Tournament' ? 22 : 9
      },
      // DataWizard - third place
      {
        userId: userIds[1],
        seasonId: season.id,
        points: season.name === 'Genesis Tournament' ? 1920 : 800,
        rank: 3,
        missionsCompleted: season.name === 'Genesis Tournament' ? 8 : 3,
        solutionsSubmitted: season.name === 'Genesis Tournament' ? 18 : 6,
        solutionsAccepted: season.name === 'Genesis Tournament' ? 14 : 4
      }
    ]).onConflictDoNothing();
  }

  console.log('✅ Created user season points for all seasons');
}

// Enhanced seed function that creates all essential tournament data
export async function seedCompleteTournamentData() {
  console.log('🌱 Starting complete tournament data seeding...');

  try {
    // Step 1: Create base tournament data (seasons, achievements, users)
    const { seasons, achievements } = await seedTournamentData();
    const demoUsers = await createDemoUsers();

    // Step 2: Create sample missions
    const seasonId = seasons[0].id;
    const userIds = demoUsers.map(u => u.userId);
    const missions = await createSampleMissions(seasonId, userIds);

    // Step 3: Create sample solutions
    const missionIds = missions.map((m: any) => m.id);
    const solutions = await createSampleSolutions(missionIds, userIds, seasonId);

    // Step 4: Create user achievements
    const achievementIds = achievements.map((a: any) => a.id);
    await createUserAchievements(userIds, achievementIds);

    // Step 5: Create user season points for leaderboard
    await createUserSeasonPoints(userIds, seasons);

    console.log('🎉 Complete tournament system seeded successfully!');
    return {
      seasons,
      users: demoUsers,
      missions,
      solutions,
      achievements,
      message: 'Complete tournament system seeded successfully'
    };

  } catch (error) {
    console.error('❌ Error seeding complete tournament data:', error);
    throw error;
  }
}

// Run seed script
if (require.main === module) {
  seedCompleteTournamentData()
    .then(() => {
      console.log('🎯 All done! Tournament system is ready with complete data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
} 