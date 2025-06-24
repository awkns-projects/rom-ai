import { NextRequest, NextResponse } from 'next/server';
import { generatePseudoSteps } from '@/lib/ai/tools/agent-builder/generation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, availableModels, entityType, businessContext } = body;

    // Validate required fields
    if (!name || !description || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, entityType' },
        { status: 400 }
      );
    }

    // Generate pseudo steps using AI
    const pseudoSteps = await generatePseudoSteps(
      name,
      description,
      'Create',
      availableModels || [],
      entityType,
      businessContext
    );

    return NextResponse.json({
      success: true,
      pseudoSteps
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
      optionalFields: ['availableModels', 'businessContext'],
      responseFormat: 'Generated pseudo steps array'
    }
  });
} 