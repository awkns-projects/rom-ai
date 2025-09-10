import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { notification } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/users/[userId]/notifications - Get user notifications
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(desc(notification.createdAt))
      .limit(limit);

    if (unreadOnly) {
      query = db
        .select()
        .from(notification)
        .where(and(eq(notification.userId, userId), eq(notification.read, false)))
        .orderBy(desc(notification.createdAt))
        .limit(limit);
    }

    const notifications = await query;
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 