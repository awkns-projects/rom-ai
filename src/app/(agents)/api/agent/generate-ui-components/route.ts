import { NextRequest, NextResponse } from 'next/server';
import { generateActionUIComponents } from '@/lib/ai/tools/agent-builder/action-generation-shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pseudoSteps, availableModels, businessContext, availableEnums } = body;

    // Validate required fields
    if (!name || !description || !pseudoSteps || !Array.isArray(pseudoSteps)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, pseudoSteps' },
        { status: 400 }
      );
    }

    // Generate UI components using AI
    const uiComponents = await generateActionUIComponents(
      name,
      description,
      pseudoSteps,
      availableModels || [],
      businessContext,
      availableEnums
    );

    return NextResponse.json({
      success: true,
      uiComponents
    });

  } catch (error) {
    console.error('Error generating UI components:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate UI components',
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
      endpoint: '/api/agent/generate-ui-components',
      method: 'POST',
      requiredFields: ['name', 'description', 'pseudoSteps'],
      optionalFields: ['availableModels', 'businessContext', 'availableEnums'],
      responseFormat: 'Generated UI components array'
    }
  });
} 