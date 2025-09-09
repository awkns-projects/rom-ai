# Privy Auth Integration with Next-Auth Provider Implementation Plan

## Executive Summary

This document outlines the detailed plan for integrating Privy authentication as a Next-Auth provider in the existing Next.js 15 application. The current app uses Next-Auth 5.0.0-beta.25 with multiple OAuth providers and has a comprehensive authentication system with PostgreSQL database, Prisma ORM, and extensive tournament/agent features.

## Current Authentication Architecture Analysis

### Existing Setup
- **Next-Auth Version**: 5.0.0-beta.25 (latest beta)
- **Database**: PostgreSQL with Drizzle ORM (not Prisma as initially assumed)
- **Session Strategy**: JWT
- **Current Providers**: 
  - Credentials (email/password)
  - Guest authentication
  - Facebook, Google, GitHub, LinkedIn, Notion, Instagram, Shopify, Threads
- **Custom OAuth Handling**: Separate OAuth connection system for agent integrations

### Key Files Structure
```
src/
├── app/(auth)/
│   ├── auth.ts              # Main NextAuth configuration
│   ├── auth.config.ts       # NextAuth config object
│   ├── actions.ts           # Login/register server actions
│   └── login/page.tsx       # Login UI
├── lib/
│   ├── auth-helpers.ts      # Auth utilities
│   ├── db/
│   │   ├── schema.ts        # Database schema (Drizzle)
│   │   ├── queries.ts       # Database operations
│   │   └── oauth-tokens.ts  # OAuth token management
└── middleware.ts            # Route protection
```

### Database Schema
The user table already includes a `privyId` field:
```sql
privyId: text('privyId').unique(), // Privy user ID (did:privy:...)
```

## Privy Integration Strategy

### 1. Privy Provider Implementation Approach

**Option A: Custom OAuth2 Provider (Recommended)**
- Implement Privy as a custom OAuth2 provider within Next-Auth
- Leverage Privy's OAuth flow for authentication
- Maintain compatibility with existing Next-Auth patterns

**Option B: Credentials Provider Wrapper**
- Use Privy SDK within a credentials provider
- Handle Privy authentication in the authorize callback
- More complex but allows for advanced Privy features

### 2. Technical Implementation Plan

#### Phase 1: Environment Setup
1. **Install Privy Dependencies**
   ```bash
   npm install @privy-io/react-auth @privy-io/server-auth
   ```

2. **Environment Variables**
   ```env
   # Add to .env.local
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   PRIVY_VERIFICATION_KEY=your_verification_key
   ```

#### Phase 2: Custom Privy Provider Creation

**File: `src/lib/auth/privy-provider.ts`**
```typescript
import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

export interface PrivyProfile {
  id: string
  email?: string
  phone?: string
  wallet?: {
    address: string
    type: 'ethereum' | 'solana'
  }
  // Additional Privy profile fields
}

export interface PrivyProviderOptions extends OAuthUserConfig<PrivyProfile> {
  appId: string
  appSecret: string
}

export default function PrivyProvider(
  options: PrivyProviderOptions
): OAuthConfig<PrivyProfile> {
  return {
    id: 'privy',
    name: 'Privy',
    type: 'oauth',
    version: '2.0',
    authorization: {
      url: 'https://auth.privy.io/oauth/authorize',
      params: {
        scope: 'openid email profile wallet',
        response_type: 'code',
      },
    },
    token: 'https://auth.privy.io/oauth/token',
    userinfo: 'https://auth.privy.io/oauth/userinfo',
    client: {
      id: options.appId,
      secret: options.appSecret,
    },
    profile(profile: PrivyProfile) {
      return {
        id: profile.id,
        email: profile.email,
        name: profile.email || profile.wallet?.address || 'Anonymous',
        image: null,
        privyId: profile.id,
        walletAddress: profile.wallet?.address,
        walletType: profile.wallet?.type,
        type: 'regular' as const,
      }
    },
  }
}
```

#### Phase 3: Next-Auth Configuration Updates

**File: `src/app/(auth)/auth.ts`** - Add Privy provider:
```typescript
import PrivyProvider from '@/lib/auth/privy-provider'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // ... existing config
  providers: [
    // ... existing providers
    PrivyProvider({
      appId: process.env.PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // ... existing JWT logic
      
      // Handle Privy-specific data
      if (account?.provider === 'privy' && user) {
        token.privyId = user.privyId
        token.walletAddress = user.walletAddress
        token.walletType = user.walletType
      }
      
      return token
    },
    
    async session({ session, token }) {
      // ... existing session logic
      
      // Add Privy data to session
      if (token.privyId) {
        session.user.privyId = token.privyId
        session.user.walletAddress = token.walletAddress
        session.user.walletType = token.walletType
      }
      
      return session
    },
    
    async signIn({ user, account, profile }) {
      if (account?.provider === 'privy') {
        // Custom Privy sign-in logic
        try {
          // Check if user exists or create new user
          const existingUser = await getUser(user.email!)
          
          if (existingUser.length === 0) {
            // Create new user with Privy ID
            await createPrivyUser({
              email: user.email!,
              privyId: user.privyId!,
              walletAddress: user.walletAddress,
              walletType: user.walletType,
            })
          } else {
            // Update existing user with Privy ID if not set
            await updateUserPrivyId(existingUser[0].id, user.privyId!)
          }
          
          return true
        } catch (error) {
          console.error('Privy sign-in error:', error)
          return false
        }
      }
      
      return true
    },
  },
})
```

#### Phase 4: Database Operations

**File: `src/lib/db/queries.ts`** - Add Privy-specific functions:
```typescript
export async function createPrivyUser({
  email,
  privyId,
  walletAddress,
  walletType,
}: {
  email: string
  privyId: string
  walletAddress?: string
  walletType?: string
}) {
  try {
    const result = await db.insert(user).values({
      email,
      privyId,
      // Store wallet info in metadata or separate fields
    }).returning()
    
    return result
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create Privy user')
  }
}

export async function updateUserPrivyId(userId: string, privyId: string) {
  try {
    await db.update(user)
      .set({ privyId })
      .where(eq(user.id, userId))
    
    return true
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update user Privy ID')
  }
}

export async function getUserByPrivyId(privyId: string) {
  try {
    const result = await db.select().from(user).where(eq(user.privyId, privyId))
    return result
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by Privy ID')
  }
}
```

#### Phase 5: Type Definitions

**File: `src/types/next-auth.d.ts`** - Extend Next-Auth types:
```typescript
import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      type: UserType
      privyId?: string
      walletAddress?: string
      walletType?: 'ethereum' | 'solana'
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    type: UserType
    privyId?: string
    walletAddress?: string
    walletType?: 'ethereum' | 'solana'
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    type: UserType
    privyId?: string
    walletAddress?: string
    walletType?: 'ethereum' | 'solana'
  }
}
```

#### Phase 6: UI Integration

**File: `src/components/privy-login-button.tsx`**
```typescript
'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function PrivyLoginButton() {
  const handlePrivyLogin = async () => {
    try {
      await signIn('privy', { callbackUrl: '/chat' })
    } catch (error) {
      console.error('Privy login error:', error)
    }
  }

  return (
    <Button
      onClick={handlePrivyLogin}
      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white"
    >
      <span className="mr-2">🔐</span>
      Continue with Privy
    </Button>
  )
}
```

**Update `src/app/(auth)/login/page.tsx`**:
Add the Privy login button to the existing login form.

#### Phase 7: Advanced Privy Features Integration

**File: `src/lib/privy-server.ts`** - Server-side Privy utilities:
```typescript
import { PrivyApi } from '@privy-io/server-auth'

const privy = new PrivyApi(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

export async function verifyPrivyToken(token: string) {
  try {
    const user = await privy.verifyAuthToken(token)
    return user
  } catch (error) {
    console.error('Privy token verification failed:', error)
    return null
  }
}

export async function getPrivyUser(privyUserId: string) {
  try {
    const user = await privy.getUser(privyUserId)
    return user
  } catch (error) {
    console.error('Failed to get Privy user:', error)
    return null
  }
}
```

### 3. Database Schema Considerations

The existing schema already has the `privyId` field, but we might want to add additional fields for wallet information:

```typescript
// In schema.ts - extend the user table
export const user = pgTable('User', {
  // ... existing fields
  privyId: text('privyId').unique(),
  walletAddress: text('walletAddress'),
  walletType: varchar('walletType', { enum: ['ethereum', 'solana'] }),
  // ... rest of fields
})
```

### 4. OAuth Connection Integration

Since the app has an existing OAuth connection system, we should integrate Privy with it:

**File: `src/lib/db/oauth-tokens.ts`** - Add Privy support:
```typescript
// Add 'privy' to the provider enum in schema.ts
provider: varchar('provider', {
  enum: ['instagram', 'facebook', 'shopify', 'threads', 'google', 'github-oauth', 'linkedin', 'notion', 'privy']
}).notNull(),
```

### 5. Middleware Updates

**File: `src/middleware.ts`** - Handle Privy-specific routing:
```typescript
// Add any Privy-specific route handling if needed
// The existing middleware should work with the new provider
```

### 6. Testing Strategy

1. **Unit Tests**
   - Test Privy provider configuration
   - Test database operations
   - Test token verification

2. **Integration Tests**
   - Test full authentication flow
   - Test session management
   - Test wallet connection scenarios

3. **E2E Tests**
   - Test login with Privy
   - Test user creation/update
   - Test session persistence

### 7. Security Considerations

1. **Token Handling**
   - Secure storage of Privy tokens
   - Proper token validation
   - Token refresh mechanisms

2. **Wallet Security**
   - Secure wallet address storage
   - Validation of wallet signatures
   - Protection against wallet spoofing

3. **Privacy**
   - Proper handling of PII
   - Compliance with data protection regulations
   - User consent management

### 8. Deployment Considerations

1. **Environment Variables**
   - Secure management of Privy credentials
   - Different configs for dev/staging/prod

2. **Database Migrations**
   - Plan for adding new fields
   - Backup existing user data
   - Rollback strategies

3. **Monitoring**
   - Log Privy authentication events
   - Monitor authentication success/failure rates
   - Alert on authentication anomalies

## Implementation Timeline

### Week 1: Foundation
- Set up Privy provider
- Basic authentication flow
- Database schema updates

### Week 2: Integration
- UI components
- Session management
- Error handling

### Week 3: Advanced Features
- Wallet integration
- OAuth connection system integration
- Security hardening

### Week 4: Testing & Deployment
- Comprehensive testing
- Documentation
- Production deployment

## Risk Mitigation

1. **Backward Compatibility**
   - Ensure existing auth methods continue working
   - Gradual rollout strategy
   - Fallback mechanisms

2. **Data Migration**
   - Safe migration of existing users
   - Data validation procedures
   - Rollback procedures

3. **Performance**
   - Monitor authentication latency
   - Optimize database queries
   - Cache frequently accessed data

## Success Metrics

1. **Technical Metrics**
   - Authentication success rate > 99%
   - Session establishment time < 2s
   - Zero data loss during migration

2. **User Experience Metrics**
   - User adoption of Privy auth
   - Reduced authentication friction
   - User satisfaction scores

3. **Business Metrics**
   - Increased user registration
   - Improved user retention
   - Enhanced security posture

## Conclusion

This implementation plan provides a comprehensive approach to integrating Privy authentication as a Next-Auth provider while maintaining compatibility with the existing system. The phased approach ensures minimal disruption to current functionality while adding powerful new authentication capabilities.

The key success factors are:
1. Maintaining backward compatibility
2. Secure handling of wallet data
3. Seamless user experience
4. Comprehensive testing
5. Proper monitoring and alerting

By following this plan, the application will gain modern Web3 authentication capabilities while preserving its existing robust authentication system. 