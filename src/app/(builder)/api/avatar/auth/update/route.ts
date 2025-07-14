import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById, saveOrUpdateDocument } from '@/lib/db/queries';

// Schema for updating avatar authentication state
const AvatarAuthUpdateSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent/avatar data'),
  authUpdate: z.object({
    isAuthenticated: z.boolean().describe('Whether user is authenticated'),
    provider: z.string().nullable().describe('Provider name (shopify, slack, etc.)'),
    accessToken: z.string().nullable().describe('Access token for the provider'),
    externalService: z.string().nullable().describe('External service URL or identifier'),
    connectionType: z.enum(['oauth', 'api_key', 'none']).optional().describe('Type of connection')
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AvatarAuthUpdateSchema.parse(body);
    const { documentId, authUpdate } = validatedData;

    // Fetch the document
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to document' }, { status: 403 });
    }

    // Parse existing agent data
    let agentData;
    try {
      agentData = document.content ? JSON.parse(document.content) : {};
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid agent data format' }, { status: 400 });
    }

    // Update avatar authentication state
    const currentAvatar = agentData.avatar || {};
    const updatedAvatar = {
      ...currentAvatar,
      isAuthenticated: authUpdate.isAuthenticated,
      accessToken: authUpdate.accessToken,
      externalService: authUpdate.externalService,
      // Preserve existing avatar properties
      name: currentAvatar.name || agentData.name || 'Agent',
      personality: currentAvatar.personality,
      characterNames: currentAvatar.characterNames,
      type: currentAvatar.type || 'rom-unicorn',
      romUnicornType: currentAvatar.romUnicornType || 'default',
      // Add timestamp for tracking
      lastAuthUpdate: new Date().toISOString()
    };

    // Update external API metadata if provider is specified
    if (authUpdate.provider) {
      agentData.externalApiMetadata = {
        ...agentData.externalApiMetadata,
        provider: authUpdate.provider,
        requiresConnection: authUpdate.isAuthenticated,
        connectionType: authUpdate.connectionType || agentData.externalApiMetadata?.connectionType || 'oauth',
        primaryUseCase: agentData.externalApiMetadata?.primaryUseCase || `Integration with ${authUpdate.provider}`,
        requiredScopes: agentData.externalApiMetadata?.requiredScopes || []
      };
    }

    // Update the agent data
    const updatedAgentData = {
      ...agentData,
      avatar: updatedAvatar
    };

    // Save the updated document
    await saveOrUpdateDocument({
      id: documentId,
      content: JSON.stringify(updatedAgentData),
      userId: session.user.id,
      title: document.title,
      kind: 'agent'
    });

    console.log('🔐 Avatar authentication state updated:', {
      documentId,
      provider: authUpdate.provider,
      isAuthenticated: authUpdate.isAuthenticated,
      hasExternalService: !!authUpdate.externalService
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar authentication state updated successfully',
      authState: {
        isAuthenticated: authUpdate.isAuthenticated,
        provider: authUpdate.provider,
        externalService: authUpdate.externalService,
        connectionType: authUpdate.connectionType || 'oauth'
      }
    });

  } catch (error) {
    console.error('Error updating avatar auth state:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar authentication state' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current authentication status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Fetch the document
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to document' }, { status: 403 });
    }

    // Parse agent data and return current auth state
    let agentData;
    try {
      agentData = document.content ? JSON.parse(document.content) : {};
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid agent data format' }, { status: 400 });
    }

    const avatar = agentData.avatar || {};
    const externalApiMetadata = agentData.externalApiMetadata || {};

    return NextResponse.json({
      authState: {
        isAuthenticated: avatar.isAuthenticated || false,
        provider: externalApiMetadata.provider || null,
        externalService: avatar.externalService || null,
        connectionType: externalApiMetadata.connectionType || 'unknown',
        lastAuthUpdate: avatar.lastAuthUpdate || null
      }
    });

  } catch (error) {
    console.error('Error retrieving avatar auth state:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve avatar authentication state' },
      { status: 500 }
    );
  }
} 