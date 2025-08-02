import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import type { AgentTokenPayload } from './agent-auth';

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  userType: 'user' | 'agent';
  agent?: {
    documentId: string;
    agentKey: string;
    permissions: string[];
  };
  error?: string;
}

/**
 * Check authentication for API endpoints - supports both user sessions and agent tokens
 */
export async function checkAuthentication(request: NextRequest): Promise<AuthResult> {
  // Check if this request has agent authentication headers (set by middleware)
  const agentAuth = request.headers.get('x-agent-auth');
  
  if (agentAuth === 'verified') {
    const documentId = request.headers.get('x-agent-document-id');
    const agentKey = request.headers.get('x-agent-key');
    const permissionsStr = request.headers.get('x-agent-permissions');
    
    if (documentId && agentKey && permissionsStr) {
      try {
        const permissions = JSON.parse(permissionsStr);
        return {
          isAuthenticated: true,
          userType: 'agent',
          agent: {
            documentId,
            agentKey,
            permissions
          }
        };
      } catch (e) {
        return {
          isAuthenticated: false,
          userType: 'agent',
          error: 'Invalid agent permissions format'
        };
      }
    }
  }
  
  // Fall back to user session authentication
  const session = await auth();
  if (session?.user?.id) {
    return {
      isAuthenticated: true,
      userId: session.user.id,
      userType: 'user'
    };
  }
  
  return {
    isAuthenticated: false,
    userType: 'user',
    error: 'No valid authentication found'
  };
}

/**
 * Require user authentication (for user-only endpoints)
 */
export async function requireUserAuth(request: NextRequest): Promise<{ userId: string } | Response> {
  const authResult = await checkAuthentication(request);
  
  if (!authResult.isAuthenticated || authResult.userType !== 'user') {
    return Response.json({ error: 'User authentication required' }, { status: 401 });
  }
  
  return { userId: authResult.userId! };
}

/**
 * Require agent authentication (for agent-only endpoints)
 */
export async function requireAgentAuth(request: NextRequest): Promise<{ 
  documentId: string; 
  agentKey: string; 
  permissions: string[] 
} | Response> {
  const authResult = await checkAuthentication(request);
  
  if (!authResult.isAuthenticated || authResult.userType !== 'agent') {
    return Response.json({ error: 'Agent authentication required' }, { status: 401 });
  }
  
  return {
    documentId: authResult.agent!.documentId,
    agentKey: authResult.agent!.agentKey,
    permissions: authResult.agent!.permissions
  };
}

/**
 * Check if agent has specific permission
 */
export function hasAgentPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes('admin');
}

/**
 * Get document owner for authentication - handles both user and agent contexts
 */
export async function getDocumentOwner(documentId: string, authResult: AuthResult): Promise<string | null> {
  if (authResult.userType === 'user' && authResult.userId) {
    return authResult.userId;
  }
  
  if (authResult.userType === 'agent' && authResult.agent?.documentId === documentId) {
    // For agent requests, get the actual document owner
    const { getDocumentById } = await import('@/lib/db/queries');
    const document = await getDocumentById({ id: documentId });
    return document?.userId || null;
  }
  
  return null;
} 