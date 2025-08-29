import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { order, orderItem, cardType, romCard, cardSlot } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// POST - Create new order (purchase card)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardTypeId, cardName } = await request.json();

    if (!cardTypeId || !cardName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get card type details
    const cardTypeData = await db
      .select()
      .from(cardType)
      .where(eq(cardType.id, cardTypeId))
      .limit(1);

    if (cardTypeData.length === 0) {
      return NextResponse.json({ error: 'Invalid card type' }, { status: 400 });
    }

    const cardTypeInfo = cardTypeData[0];

    // Create order
    const newOrder = await db
      .insert(order)
      .values({
        userId: session.user.id,
        cardTypeId,
        amount: cardTypeInfo.price,
        currency: 'USD',
        status: 'completed', // For now, assume instant completion
        paymentMethod: 'internal', // Will be replaced with actual payment processing
      })
      .returning();

    // Create ROM card
    const newCard = await db
      .insert(romCard)
      .values({
        userId: session.user.id,
        cardTypeId,
        name: cardName,
        balance: '100.00', // Starting balance
        totalSpent: '0.00',
      })
      .returning();

    // Create order item
    await db
      .insert(orderItem)
      .values({
        orderId: newOrder[0].id,
        romCardId: newCard[0].id,
        cardTypeId,
        quantity: 1,
        unitPrice: cardTypeInfo.price,
        totalPrice: cardTypeInfo.price,
      });

    // Create empty slots for the card
    const slots = [];
    for (let i = 1; i <= cardTypeInfo.maxSlots; i++) {
      slots.push({
        romCardId: newCard[0].id,
        slotNumber: i,
      });
    }

    await db.insert(cardSlot).values(slots);

    return NextResponse.json({
      order: newOrder[0],
      card: newCard[0],
      cardType: cardTypeInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's orders
export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await db
      .select({
        id: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        createdAt: order.createdAt,
        cardType: {
          id: cardType.id,
          name: cardType.name,
          displayName: cardType.displayName,
        }
      })
      .from(order)
      .leftJoin(cardType, eq(order.cardTypeId, cardType.id))
      .where(eq(order.userId, session.user.id))
      .orderBy(order.createdAt);

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 