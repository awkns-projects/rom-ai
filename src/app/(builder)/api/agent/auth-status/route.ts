import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById } from '@/lib/db/queries';
import { getDocumentOAuthConnections } from '@/lib/db/document-credentials';

interface AuthStatus {
  provider: string;
  connectionType: string;
  isAuthenticated: boolean;
  isExpired: boolean;
  hasConnection: boolean;
  username?: string;
  scopes?: string[];
  expiresAt?: Date;
  lastUpdated?: Date;
  requiredByActions?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get the document to verify it exists and user has access
    const document = await getDocumentById({ id: documentId });
    if (!document || document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Parse agent data to get external APIs configuration
    let agentData;
    try {
      // Check if agent data is in metadata (new format) or content (old format)
      if (document.metadata && typeof document.metadata === 'object') {
        agentData = document.metadata;
      } else {
        agentData = typeof document.content === 'string' 
          ? JSON.parse(document.content) 
          : document.content;
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid agent data' }, { status: 400 });
    }

    // Get OAuth connections for this document
    const oauthResult = await getDocumentOAuthConnections(documentId, session.user.id);
    const oauthConnections = oauthResult.success ? oauthResult.connections || [] : [];

    // Extract external APIs from agent data
    const externalApis = agentData?.externalApis || [];
    
    // Build authentication status for each external API
    const authStatus = externalApis.map((api: any) => {
      const oauthConnection = oauthConnections.find(
        conn => conn.provider === api.provider && conn.isActive
      );

      const isExpired = oauthConnection?.expiresAt && new Date(oauthConnection.expiresAt) < new Date();

      return {
        provider: api.provider,
        connectionType: api.connectionType, // 'oauth' or 'api_key'
        isAuthenticated: !!oauthConnection && !isExpired,
        isExpired: !!isExpired,
        hasConnection: !!oauthConnection,
        username: oauthConnection?.username,
        scopes: oauthConnection?.scopes,
        expiresAt: oauthConnection?.expiresAt,
        lastUpdated: oauthConnection?.updatedAt
      };
    });

    // Also check if actions require specific external APIs
    const actions = agentData?.actions || [];
    const requiredProviders = new Set<string>();
    
    actions.forEach((action: any) => {
      if (action.externalApiProvider) {
        requiredProviders.add(action.externalApiProvider);
      }
      // Also check pseudoSteps for OAuth/API key requirements
      action.pseudoSteps?.forEach((step: any) => {
        if (step.oauthTokens?.provider) {
          requiredProviders.add(step.oauthTokens.provider);
        }
        if (step.apiKeys?.provider) {
          requiredProviders.add(step.apiKeys.provider);
        }
      });
    });

         // Add status for required providers that aren't in externalApis config
     Array.from(requiredProviders).forEach(provider => {
       if (!authStatus.find((status: AuthStatus) => status.provider === provider)) {
        const oauthConnection = oauthConnections.find(
          conn => conn.provider === provider && conn.isActive
        );
        
        const isExpired = oauthConnection?.expiresAt && new Date(oauthConnection.expiresAt) < new Date();

        authStatus.push({
          provider,
          connectionType: 'oauth', // Default assumption for action-required providers
          isAuthenticated: !!oauthConnection && !isExpired,
          isExpired: !!isExpired,
          hasConnection: !!oauthConnection,
          username: oauthConnection?.username,
          scopes: oauthConnection?.scopes,
          expiresAt: oauthConnection?.expiresAt,
          lastUpdated: oauthConnection?.updatedAt,
          requiredByActions: true
        });
      }
    });

    return NextResponse.json({
      success: true,
      authStatus,
             summary: {
         totalProviders: authStatus.length,
         authenticatedProviders: authStatus.filter((s: AuthStatus) => s.isAuthenticated).length,
         expiredProviders: authStatus.filter((s: AuthStatus) => s.isExpired).length,
         missingProviders: authStatus.filter((s: AuthStatus) => !s.hasConnection).length,
         allAuthenticated: authStatus.length > 0 && authStatus.every((s: AuthStatus) => s.isAuthenticated)
       }
    });

  } catch (error) {
    console.error('Error getting auth status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get authentication status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 