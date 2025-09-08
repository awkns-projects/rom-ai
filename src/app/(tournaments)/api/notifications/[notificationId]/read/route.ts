import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { notification } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/notifications/[notificationId]/read - Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    await db
      .update(notification)
      .set({ read: true })
      .where(eq(notification.id, params.notificationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
} 