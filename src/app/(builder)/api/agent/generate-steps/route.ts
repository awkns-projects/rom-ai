import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateEnhancedPseudoSteps } from '@/lib/ai/tools/agent-builder/generation';

// Enhanced step generation schema
const EnhancedStepSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    description: z.string(),
    type: z.enum(['Database find unique', 'Database find many', 'Database update unique', 'Database update many', 'Database create', 'Database create many', 'Database delete unique', 'Database delete many', 'Database upsert', 'Database aggregate', 'Database count', 'api call post', 'api call get', 'api call put', 'api call delete', 'graphql query', 'graphql mutation', 'ai analysis', 'ai generate object']),
    inputFields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      kind: z.enum(['scalar', 'object', 'enum']),
      required: z.boolean(),
      list: z.boolean(),
      relationModel: z.string().optional(),
      description: z.string().optional(),
      defaultValue: z.string().optional()
    })),
    outputFields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      kind: z.enum(['scalar', 'object', 'enum']),
      required: z.boolean(),
      list: z.boolean(),
      relationModel: z.string().optional(),
      description: z.string().optional(),
      defaultValue: z.string().optional()
    })),
    oauthTokens: z.object({
      provider: z.string(),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      expiresAt: z.string().optional()
    }).optional(),
    apiKeys: z.object({
      provider: z.string(),
      keyName: z.string(),
      keyValue: z.string()
    }).optional(),
    mockInput: z.record(z.any()),
    mockOutput: z.record(z.any()),
    testCode: z.string(),
    actualCode: z.string(),
    logMessage: z.string(),
    stepOrder: z.number(),
    dependsOn: z.array(z.string()).optional(),
    isOptional: z.boolean().optional(),
    errorHandling: z.object({
      retryAttempts: z.number().optional(),
      fallbackAction: z.string().optional(),
      continueOnError: z.boolean().optional()
    }).optional()
  })),
  externalApiProvider: z.enum(['gmail', 'shopify', 'stripe', 'slack', 'notion', 'salesforce', 'hubspot', 'facebook', 'instagram', 'linkedin', 'threads', 'github', 'google-calendar', 'microsoft-teams']).nullable(),
  apiValidation: z.object({
    isValid: z.boolean(),
    singleProvider: z.boolean(),
    conflictingProviders: z.array(z.string()).optional()
  }),
  testCode: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, availableModels, entityType, businessContext, type, documentId } = body;

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

    // Use the unified enhanced step generation function
    const result = await generateEnhancedPseudoSteps(
      name,
      description,
      actionType,
      availableModels || [],
      businessContext,
      documentId
    );

    return NextResponse.json({
      success: true,
      pseudoSteps: result.steps,
      externalApiProvider: result.externalApiProvider,
      testCode: result.testCode,
      _internal: {
        hasRealCode: true,
        hasTestCases: true,
        validatedSteps: true,
        apiValidation: result.apiValidation
      }
    });

  } catch (error) {
    console.error('Error generating enhanced steps:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate enhanced steps',
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