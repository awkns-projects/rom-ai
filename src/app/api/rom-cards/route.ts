import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { romCard, cardType, cardSlot } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET - Fetch user's ROM cards
export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cards = await db
      .select({
        id: romCard.id,
        name: romCard.name,
        isDeployed: romCard.isDeployed,
        balance: romCard.balance,
        totalSpent: romCard.totalSpent,
        lastUsed: romCard.lastUsed,
        createdAt: romCard.createdAt,
        cardType: {
          id: cardType.id,
          name: cardType.name,
          displayName: cardType.displayName,
          maxSlots: cardType.maxSlots,
        }
      })
      .from(romCard)
      .leftJoin(cardType, eq(romCard.cardTypeId, cardType.id))
      .where(eq(romCard.userId, session.user.id))
      .orderBy(romCard.createdAt);

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching ROM cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ROM cards' },
      { status: 500 }
    );
  }
}

// POST - Create new ROM card (after purchase)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, cardTypeId } = await request.json();

    if (!name || !cardTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify card type exists
    const cardTypeExists = await db
      .select()
      .from(cardType)
      .where(eq(cardType.id, cardTypeId))
      .limit(1);

    if (cardTypeExists.length === 0) {
      return NextResponse.json({ error: 'Invalid card type' }, { status: 400 });
    }

    const newCard = await db
      .insert(romCard)
      .values({
        userId: session.user.id,
        cardTypeId,
        name,
        balance: '0.00',
        totalSpent: '0.00',
      })
      .returning();

    // Create empty slots for the card
    const maxSlots = cardTypeExists[0].maxSlots;
    const slots = [];
    for (let i = 1; i <= maxSlots; i++) {
      slots.push({
        romCardId: newCard[0].id,
        slotNumber: i,
      });
    }

    await db.insert(cardSlot).values(slots);

    return NextResponse.json(newCard[0], { status: 201 });
  } catch (error) {
    console.error('Error creating ROM card:', error);
    return NextResponse.json(
      { error: 'Failed to create ROM card' },
      { status: 500 }
    );
  }
} 