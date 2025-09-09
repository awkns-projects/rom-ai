import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

// Import the existing UserType from the auth configuration
type UserType = 'guest' | 'regular'

declare module 'next-auth' {
  /**
   * Extends the built-in session.user type
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      type: UserType
      // Privy-specific fields (simplified)
      privyDid?: string
      privySessionId?: string
    } & DefaultSession['user']
  }

  /**
   * Extends the built-in User type (used during sign-in)
   */
  interface User extends DefaultUser {
    type: UserType
    // Privy-specific fields (simplified)
    privyDid?: string
    privySessionId?: string
  }

  /**
   * Extends the built-in Account type for OAuth providers
   */
  interface Account {
    provider: string
    providerAccountId: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
    token_type?: string
    scope?: string
    id_token?: string
    session_state?: string
    // Privy-specific account fields
    privy_user_id?: string
    wallet_address?: string
    wallet_type?: string
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT type
   */
  interface JWT extends DefaultJWT {
    id: string
    type: UserType
    // Privy-specific JWT fields (simplified)
    privyDid?: string
    privySessionId?: string
    // Store OAuth account information
    accounts?: Array<{
      provider: string
      access_token?: string
      refresh_token?: string
      expires_at?: number
    }>
  }
} 