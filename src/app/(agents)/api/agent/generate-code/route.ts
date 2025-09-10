import { NextRequest, NextResponse } from 'next/server';
import { generateActionExecutableCode } from '@/lib/ai/tools/agent-builder/action-generation-shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pseudoSteps, availableModels, entityType, businessContext, inputParameters, enhancedAnalysis, testResults } = body;

    // Use the shared function that replicates the exact API route logic
    const result = await generateActionExecutableCode(
      name,
      description,
      pseudoSteps,
      availableModels,
      entityType,
      businessContext,
      inputParameters,
      enhancedAnalysis,
      testResults
    );

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate code',
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
      endpoint: '/api/agent/generate-code',
      method: 'POST',
      requiredFields: ['name', 'description', 'pseudoSteps'],
      optionalFields: ['availableModels', 'entityType', 'businessContext'],
      responseFormat: 'Generated executable code with environment variables and parameters'
    }
  });
} 