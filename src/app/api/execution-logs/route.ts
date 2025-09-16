import { NextRequest, NextResponse } from 'next/server';
import { getActionLogger } from '@/lib/redis/client';

// Make this route dynamic to handle search params
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const all = searchParams.get('all') === 'true';

    const actionLogger = await getActionLogger();

    let executions;
    if (all) {
      // Get all recent executions
      executions = await actionLogger.getRecentExecutions(limit);
    } else if (userId) {
      // Get executions for specific user
      executions = await actionLogger.getUserExecutions(userId, limit);
    } else {
      // Get all recent executions if no userId specified
      executions = await actionLogger.getRecentExecutions(limit);
    }

    return NextResponse.json({
      success: true,
      data: executions,
      count: executions.length
    });

  } catch (error) {
    console.error('❌ Failed to retrieve execution logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve execution logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 