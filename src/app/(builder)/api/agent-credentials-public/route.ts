import { NextRequest, NextResponse } from 'next/server';
import { getDocumentCredentials, credentialsToEnvVars, getDocumentOAuthConnections } from '@/lib/db/document-credentials';
import { getDocumentById } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const agentKey = searchParams.get('agentKey');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    if (!agentKey) {
      return NextResponse.json({ error: 'Agent key is required' }, { status: 401 });
    }
    
    console.log('🔑 Public agent credentials request:', { documentId, hasAgentKey: !!agentKey });

    // Get the document to verify it exists and get userId
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Parse agent data to verify this is an agent document
    let agentData;
    try {
      agentData = typeof document.content === 'string' 
        ? JSON.parse(document.content) 
        : document.content;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid agent data' }, { status: 400 });
    }

    if (!agentData || typeof agentData !== 'object') {
      return NextResponse.json({ error: 'Not an agent document' }, { status: 400 });
    }

    // Get encrypted credentials from document metadata
    const credentialsResult = await getDocumentCredentials(documentId, document.userId);
    
    if (!credentialsResult.success) {
      console.warn('Failed to retrieve credentials, returning empty set');
    }

    // Get OAuth connections for this document
    const oauthResult = await getDocumentOAuthConnections(documentId, document.userId);
    
    if (!oauthResult.success) {
      console.warn('Failed to retrieve OAuth connections, continuing without them');
    }

    // Convert credentials to environment variables format
    const envVars = credentialsToEnvVars(credentialsResult.credentials || []);
    
    // Add OAuth tokens to environment variables
    if (oauthResult.success && oauthResult.connections) {
      oauthResult.connections.forEach(connection => {
        const providerPrefix = connection.provider.toUpperCase().replace('-', '_');
        envVars[`${providerPrefix}_ACCESS_TOKEN`] = connection.accessToken;
        if (connection.refreshToken) {
          envVars[`${providerPrefix}_REFRESH_TOKEN`] = connection.refreshToken;
        }
        if (connection.username) {
          envVars[`${providerPrefix}_USERNAME`] = connection.username;
        }
      });
    }

    // Return credentials and agent configuration
    return NextResponse.json({
      success: true,
      credentials: envVars,
      agentConfig: {
        name: agentData.name,
        description: agentData.description,
        domain: agentData.domain,
        avatar: agentData.avatar,
        theme: agentData.theme || 'green',
        externalApis: agentData.externalApis || []
      },
      debug: {
        documentId,
        hasCredentials: !!credentialsResult.credentials?.length,
        credentialCount: credentialsResult.credentials?.length || 0,
        hasOAuthConnections: !!oauthResult.connections?.length,
        oauthConnectionCount: oauthResult.connections?.length || 0,
        oauthProviders: oauthResult.connections?.map(c => c.provider) || [],
        envVarCount: Object.keys(envVars).length,
        hasAvatar: !!agentData.avatar,
        hasTheme: !!agentData.theme
      }
    });

  } catch (error) {
    console.error('Error fetching agent credentials:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 