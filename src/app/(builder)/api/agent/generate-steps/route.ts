import { NextRequest, NextResponse } from 'next/server';
import { generatePseudoSteps } from '@/lib/ai/tools/agent-builder/generation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, availableModels, entityType, businessContext, type } = body;

    // Validate required fields
    if (!name || !description || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, entityType' },
        { status: 400 }
      );
    }

    // Default to 'mutation' if no type is provided, or validate the provided type
    const actionType = type || 'mutation';
    if (actionType !== 'query' && actionType !== 'mutation') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "query" or "mutation"' },
        { status: 400 }
      );
    }

    // Generate pseudo steps using AI
    const pseudoSteps = await generatePseudoSteps(
      name,
      description,
      actionType,
      availableModels || [],
      entityType,
      businessContext
    );

    // Enhanced analysis is temporarily disabled to avoid complexity
    // TODO: Implement proper enhanced analysis integration when needed

    return NextResponse.json({
      success: true,
      pseudoSteps,
      // Store the enhanced analysis for testing but don't expose details  
      _internal: {
        hasRealCode: false,
        hasTestCases: false
      }
    });

  } catch (error) {
    console.error('Error generating pseudo steps:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate pseudo steps',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    documentation: {
      endpoint: '/api/agent/generate-steps',
      method: 'POST',
      requiredFields: ['name', 'description', 'entityType'],
      optionalFields: ['availableModels', 'businessContext', 'type'],
      supportedTypes: ['query', 'mutation'],
      defaultType: 'mutation',
      responseFormat: 'Generated pseudo steps array'
    }
  });
} 