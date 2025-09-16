import { NextRequest, NextResponse } from 'next/server';
import { getActionLogger } from '@/lib/redis/client';

// Make this route dynamic to handle dynamic params
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: 'Execution ID is required' }, 
        { status: 400 }
      );
    }

    const actionLogger = await getActionLogger();
    const execution = await actionLogger.getExecution(executionId);

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: execution
    });

  } catch (error) {
    console.error('❌ Failed to retrieve execution log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve execution log',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 