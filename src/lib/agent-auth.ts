import { getToken } from 'next-auth/jwt';

// JWT Configuration
const JWT_SECRET = process.env.AGENT_JWT_SECRET || process.env.AUTH_SECRET || 'fallback-secret';
const JWT_ISSUER = 'rewrite-complete-main-app';
const JWT_AUDIENCE = 'sub-agent';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_THRESHOLD = 24 * 60 * 60; // 24 hours in seconds

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per agent

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface AgentTokenPayload {
  documentId: string;
  agentKey: string;
  deploymentUrl: string;
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AgentAuthResult {
  success: boolean;
  payload?: AgentTokenPayload;
  error?: string;
  needsRefresh?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Generate a secure token for agent authentication
 */
export async function generateAgentToken(
  documentId: string,
  agentKey: string,
  deploymentUrl: string,
  permissions: string[] = ['read', 'execute']
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_EXPIRY_SECONDS;
  
  const payload = {
    documentId,
    agentKey,
    deploymentUrl,
    permissions,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: now,
    exp: exp
  };

  // Create a simple signed token using base64 encoding and HMAC
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = btoa(payloadStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Create signature using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureData = encoder.encode(payloadB64 + '.' + JWT_SECRET);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode an agent token
 */
export async function verifyAgentToken(token: string): Promise<AgentAuthResult> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid token format' };
    }
    
    const [payloadB64, signature] = parts;
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureData = encoder.encode(payloadB64 + '.' + JWT_SECRET);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    if (signature !== expectedSignature) {
      return { success: false, error: 'Invalid token signature' };
    }
    
    // Decode payload
    const payloadB64Standard = payloadB64
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payloadB64.length + (4 - (payloadB64.length % 4)) % 4, '=');
    const payloadStr = atob(payloadB64Standard);
    const agentPayload = JSON.parse(payloadStr) as AgentTokenPayload;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (agentPayload.exp <= now) {
      return { success: false, error: 'Token expired' };
    }
    
    // Check issuer and audience
    if (agentPayload.iss !== JWT_ISSUER || agentPayload.aud !== JWT_AUDIENCE) {
      return { success: false, error: 'Invalid token issuer or audience' };
    }
    
    // Check if token needs refresh (within 24 hours of expiry)
    const needsRefresh = (agentPayload.exp - now) < REFRESH_THRESHOLD;

    return {
      success: true,
      payload: agentPayload,
      needsRefresh
    };
  } catch (error) {
    console.error('Agent token verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token'
    };
  }
}

/**
 * Extract agent token from request headers
 */
export function extractAgentToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for custom header
  return request.headers.get('x-agent-token');
}

/**
 * Check rate limits for an agent
 */
export function checkRateLimit(agentKey: string): RateLimitResult {
  const now = Date.now();
  const key = `agent:${agentKey}`;
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime
    };
  }
  
  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - existing.count,
    resetTime: existing.resetTime
  };
}

/**
 * Log agent request for audit trail
 */
export function logAgentRequest(
  agentKey: string,
  endpoint: string,
  method: string,
  success: boolean,
  metadata?: Record<string, any>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    agentKey,
    endpoint,
    method,
    success,
    metadata,
    ip: metadata?.ip || 'unknown'
  };
  
  // In production, send this to your logging service
  console.log('🔐 Agent Request:', JSON.stringify(logEntry, null, 2));
}

/**
 * Generate a secure agent key for deployment
 */
export function generateSecureAgentKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to base64url
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validate agent permissions for specific actions
 */
export function hasPermission(payload: AgentTokenPayload, requiredPermission: string): boolean {
  return payload.permissions.includes(requiredPermission) || payload.permissions.includes('admin');
}

/**
 * Create agent authentication headers for sub-agent requests
 */
export function createAgentAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'sub-agent/1.0'
  };
}

/**
 * Refresh an agent token if needed
 */
export async function refreshAgentTokenIfNeeded(
  currentToken: string,
  documentId: string,
  agentKey: string,
  deploymentUrl: string,
  permissions: string[]
): Promise<{ token: string; wasRefreshed: boolean }> {
  const verifyResult = await verifyAgentToken(currentToken);
  
  if (!verifyResult.success || verifyResult.needsRefresh) {
    const newToken = await generateAgentToken(documentId, agentKey, deploymentUrl, permissions);
    return { token: newToken, wasRefreshed: true };
  }
  
  return { token: currentToken, wasRefreshed: false };
}

/**
 * Validate deployment URL against whitelist (security measure)
 */
export function isValidDeploymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Allow Vercel deployments and localhost for development
    const allowedHosts = [
      'vercel.app',
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app'
    ];
    
    return allowedHosts.some(allowed => 
      parsed.hostname === allowed || parsed.hostname.endsWith(allowed)
    );
  } catch {
    return false;
  }
}

/**
 * Create agent authentication response headers
 */
export function createAgentResponseHeaders(rateLimit: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': rateLimit.resetTime.toString(),
    'X-Agent-Auth': 'verified'
  };
} 