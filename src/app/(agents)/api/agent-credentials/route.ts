import { NextRequest, NextResponse } from 'next/server';
import { getDocumentCredentials, credentialsToEnvVars } from '@/lib/db/document-credentials';
import { getDocumentById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const agentKey = searchParams.get('agentKey'); // For deployed agents authentication

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // For deployed agents, we'll use a simple key-based auth for now
    // In production, this should be a proper JWT or API key system
    if (!agentKey) {
      return NextResponse.json({ error: 'Agent key is required' }, { status: 401 });
    }
    
    console.log('🔑 Agent credentials request:', { documentId, hasAgentKey: !!agentKey });

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
      return NextResponse.json({ error: 'Failed to retrieve credentials' }, { status: 500 });
    }

    // Convert credentials to environment variables format
    const envVars = credentialsToEnvVars(credentialsResult.credentials || []);

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
      }
    });

  } catch (error) {
    console.error('Error fetching agent credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint could be used to update credentials from the deployed app
    // For now, we'll keep it simple and not implement this
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (error) {
    console.error('Error updating agent credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 