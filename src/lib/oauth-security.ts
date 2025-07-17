import crypto from 'crypto';

// OAuth security utilities

// Generate secure random state for CSRF protection
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Verify OAuth state to prevent CSRF attacks
export function verifyOAuthState(receivedState: string, expectedState: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(receivedState),
    Buffer.from(expectedState)
  );
}

// PKCE (Proof Key for Code Exchange) implementation
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// Generate PKCE challenge for enhanced security
export function generatePKCEChallenge(): PKCEChallenge {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

// Validate OAuth callback parameters
export interface OAuthCallbackValidation {
  isValid: boolean;
  errors: string[];
}

export function validateOAuthCallback(params: {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}): OAuthCallbackValidation {
  const errors: string[] = [];

  // Check for OAuth errors
  if (params.error) {
    errors.push(`OAuth error: ${params.error_description || params.error}`);
  }

  // Validate required parameters
  if (!params.code && !params.error) {
    errors.push('Missing authorization code');
  }

  if (!params.state) {
    errors.push('Missing state parameter (CSRF protection)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate provider-specific requirements
export function validateProviderRequirements(
  provider: string,
  params: Record<string, string>
): OAuthCallbackValidation {
  const errors: string[] = [];

  switch (provider) {
    case 'shopify':
      // Shopify requires shop domain validation
      if (!params.shop || !params.shop.endsWith('.myshopify.com')) {
        errors.push('Invalid Shopify shop domain');
      }
      // Shopify requires HMAC verification (handled in callback)
      if (!params.hmac) {
        errors.push('Missing HMAC signature');
      }
      break;

    case 'google':
      // Google OAuth standard validation
      break;

    case 'github-oauth':
      // GitHub OAuth standard validation
      break;

    case 'linkedin':
      // LinkedIn OAuth standard validation
      break;

    case 'notion':
      // Notion OAuth standard validation
      break;

    case 'instagram':
    case 'facebook':
    case 'threads':
      // Meta platforms standard validation
      break;

    default:
      errors.push(`Unsupported OAuth provider: ${provider}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rate limiting for OAuth attempts
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blocked: boolean;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkOAuthRateLimit(
  identifier: string, // IP address or user ID
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    // First attempt
    rateLimitMap.set(identifier, {
      attempts: 1,
      lastAttempt: now,
      blocked: false
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs
    };
  }

  // Check if window has expired
  if (now - entry.lastAttempt > windowMs) {
    // Reset the counter
    rateLimitMap.set(identifier, {
      attempts: 1,
      lastAttempt: now,
      blocked: false
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs
    };
  }

  // Check if blocked
  if (entry.blocked || entry.attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.lastAttempt + windowMs
    };
  }

  // Increment attempts
  entry.attempts++;
  entry.lastAttempt = now;
  
  if (entry.attempts >= maxAttempts) {
    entry.blocked = true;
  }

  rateLimitMap.set(identifier, entry);

  return {
    allowed: !entry.blocked,
    remaining: Math.max(0, maxAttempts - entry.attempts),
    resetTime: entry.lastAttempt + windowMs
  };
}

// Clean up expired rate limit entries
export function cleanupRateLimit(): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  for (const [identifier, entry] of rateLimitMap.entries()) {
    if (now - entry.lastAttempt > windowMs) {
      rateLimitMap.delete(identifier);
    }
  }
}

// Validate redirect URI to prevent open redirect attacks
export function validateRedirectUri(
  redirectUri: string,
  allowedDomains: string[]
): boolean {
  try {
    const url = new URL(redirectUri);
    
    // Check if the domain is in the allowed list
    return allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        // Wildcard subdomain
        const baseDomain = domain.substring(2);
        return url.hostname === baseDomain || url.hostname.endsWith(`.${baseDomain}`);
      }
      return url.hostname === domain;
    });
  } catch {
    return false;
  }
}

// Security headers for OAuth responses
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
}

// Log OAuth security events
export function logSecurityEvent(
  event: 'oauth_attempt' | 'oauth_success' | 'oauth_failure' | 'oauth_blocked',
  details: {
    provider?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    error?: string;
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details
  };

  // In production, you would send this to your logging service
  console.log('OAuth Security Event:', logEntry);
}

// Environment variables validation
export function validateOAuthEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'AUTH_SECRET',
    'NEXTAUTH_URL',
    'INSTAGRAM_CLIENT_ID',
    'INSTAGRAM_CLIENT_SECRET', 
    'FACEBOOK_CLIENT_ID',
    'FACEBOOK_CLIENT_SECRET',
    'SHOPIFY_CLIENT_ID',
    'SHOPIFY_CLIENT_SECRET',
    'THREADS_CLIENT_ID',
    'THREADS_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing
  };
} 