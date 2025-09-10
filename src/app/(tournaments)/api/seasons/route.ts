import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { season, seasonPrize } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    let seasons = await db
      .select()
      .from(season)
      .orderBy(desc(season.startDate));

    // If no seasons exist, create default ones
    if (seasons.length === 0) {
      console.log('No seasons found, creating default seasons...');
      
      const defaultSeasons = await db.insert(season).values([
        {
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
        },
        {
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
        }
      ]).returning();

      // Create some default prizes for the first season
      await db.insert(seasonPrize).values([
        {
          seasonId: defaultSeasons[0].id,
          rank: 1,
          title: 'Grand Champion',
          description: 'First place winner of Genesis Tournament',
          value: '5000.00',
          type: 'cash',
          icon: '🏆'
        },
        {
          seasonId: defaultSeasons[0].id,
          rank: 2,
          title: 'Elite Solver',
          description: 'Second place winner',
          value: '2500.00',
          type: 'cash',
          icon: '🥈'
        },
        {
          seasonId: defaultSeasons[0].id,
          rank: 3,
          title: 'Rising Star',
          description: 'Third place winner',
          value: '1000.00',
          type: 'cash',
          icon: '🥉'
        }
      ]);

      seasons = defaultSeasons;
      console.log('✅ Created default seasons and prizes');
    }

    // Get prizes for each season
    const seasonsWithPrizes = await Promise.all(
      seasons.map(async (s) => {
        const prizes = await db
          .select()
          .from(seasonPrize)
          .where(eq(seasonPrize.seasonId, s.id))
          .orderBy(seasonPrize.rank);

        return {
          ...s,
          prizes
        };
      })
    );

    return NextResponse.json(seasonsWithPrizes);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
} 