import { NextRequest, NextResponse } from 'next/server';
import { getDocumentCredentials, credentialsToEnvVars, getDocumentOAuthConnections } from '@/lib/db/document-credentials';
import { getDocumentById } from '@/lib/db/queries';
import { checkAuthentication, hasAgentPermission } from '@/lib/auth-helpers';

async function processCredentials(documentId: string, document: any) {
  // Parse agent data - check both metadata (new format) and content (legacy)
  let agentData;
  
  // First try to get agent data from document metadata (new format)
  if (document.metadata && typeof document.metadata === 'object') {
    // Check if metadata has agent data fields directly
    if (document.metadata.name || document.metadata.models || document.metadata.actions) {
      agentData = document.metadata;
      console.log('🔍 Using agent data from document metadata');
    }
  }
  
  // Fallback to content (legacy format)
  if (!agentData) {
    try {
      agentData = typeof document.content === 'string' 
        ? JSON.parse(document.content) 
        : document.content;
      console.log('🔍 Using agent data from document content');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid agent data' }, { status: 400 });
    }
  }

  if (!agentData || typeof agentData !== 'object') {
    return NextResponse.json({ error: 'Not an agent document' }, { status: 400 });
  }
  
  console.log('🔍 Agent data structure:', {
    hasName: !!agentData.name,
    hasModels: !!agentData.models,
    hasActions: !!agentData.actions,
    hasSchedules: !!agentData.schedules,
    modelsCount: agentData.models?.length || 0,
    actionsCount: agentData.actions?.length || 0,
    schedulesCount: agentData.schedules?.length || 0
  });

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
      models: agentData.models || [],
      actions: agentData.actions || [],
      schedules: agentData.schedules || [],
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
      hasTheme: !!agentData.theme,
      agentDataStructure: {
        hasName: !!agentData.name,
        hasModels: !!agentData.models,
        hasActions: !!agentData.actions,
        hasSchedules: !!agentData.schedules,
        modelsCount: agentData.models?.length || 0,
        actionsCount: agentData.actions?.length || 0,
        schedulesCount: agentData.schedules?.length || 0
      }
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryDocumentId = searchParams.get('documentId');
    const queryAgentKey = searchParams.get('agentKey');
    
    // Check for old-style authentication (backward compatibility)
    if (queryDocumentId && queryAgentKey) {
      console.log('🔑 Using legacy authentication method:', { documentId: queryDocumentId, hasAgentKey: !!queryAgentKey });
      
      // Get the document to verify it exists
      const document = await getDocumentById({ id: queryDocumentId });
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Continue with legacy flow...
      return processCredentials(queryDocumentId, document);
    }
    
    // Check new authentication (supports both user sessions and agent tokens)
    const authResult = await checkAuthentication(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get document ID from different sources based on auth type
    let documentId: string;
    
    if (authResult.userType === 'agent') {
      // For agent requests, use the document ID from the token
      documentId = authResult.agent!.documentId;
      
      // Check if agent has read permission
      if (!hasAgentPermission(authResult.agent!.permissions, 'read')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } else {
      // For user requests, get document ID from query params
      if (!queryDocumentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      documentId = queryDocumentId;
    }
    
    console.log('🔑 Public agent credentials request:', { 
      documentId, 
      authType: authResult.userType,
      agentKey: authResult.userType === 'agent' ? authResult.agent?.agentKey : undefined 
    });

    // Get the document to verify it exists and get userId
    const doc = await getDocumentById({ id: documentId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // For user requests, verify document ownership
    if (authResult.userType === 'user') {
      if (doc.userId !== authResult.userId) {
        return NextResponse.json({ error: 'Unauthorized access to document' }, { status: 403 });
      }
    }

    return processCredentials(documentId, doc);

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