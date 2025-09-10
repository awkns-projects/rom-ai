'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'

interface PrivyLoginButtonProps {
  className?: string
  callbackUrl?: string
}

export function PrivyLoginButton({ className, callbackUrl = '/' }: PrivyLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPrivyConfigured, setIsPrivyConfigured] = useState<boolean | null>(null)
  const { login, authenticated, getAccessToken } = usePrivy()

  // Check if Privy is configured (client-side only to prevent hydration issues)
  useEffect(() => {
    setIsPrivyConfigured(!!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  }, [])

  const handlePrivyLogin = async () => {
    await login() // Opens Privy modal
  }

  useEffect(() => {
    async function handlePrivyLogin() {
      if (authenticated) {
        const token = await getAccessToken()

        const result = await signIn('privy', { 
          token,
          redirect: false,
        })
        
        if (result?.ok) {
          console.log('✅ NextAuth sign-in successful, redirecting...')
          window.location.href = callbackUrl
        } else {
          console.error('❌ NextAuth sign-in failed:', result)
          alert(`NextAuth sign-in failed: ${result?.error || 'Unknown error'}

This usually means:
1. Server-side Privy configuration is missing (PRIVY_APP_SECRET)
2. JWT token verification failed
3. Database connection issues

Check server logs for more details.`)
        }
      }
    }

    handlePrivyLogin()
  }, [authenticated, callbackUrl])

  // Show loading state while checking configuration
  if (isPrivyConfigured === null) {
    return (
      <Button
        disabled
        className={`bg-gray-400 text-gray-600 cursor-not-allowed ${className}`}
      >
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
        Loading...
      </Button>
    )
  }

  if (!isPrivyConfigured) {
    return (
      <Button
        disabled
        className={`bg-gray-400 text-gray-600 cursor-not-allowed ${className}`}
      >
        <span className="mr-2">🔐</span>
        Privy Not Configured
      </Button>
    )
  }

  return (
    <Button
      onClick={handlePrivyLogin}
      disabled={isLoading}
      className={`bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white transition-all duration-150 ${className}`}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Connecting...
        </>
      ) : (
        <>
          <span className="mr-2">🔐</span>
          Continue without wallet
        </>
      )}
    </Button>
  )
}

/**
 * Alternative Privy login button for wallet-first authentication
 */
export function PrivyWalletButton({ className, callbackUrl = '/' }: PrivyLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPrivyConfigured, setIsPrivyConfigured] = useState<boolean | null>(null)
  const { connectWallet, authenticated, getAccessToken } = usePrivy()

  // Check if Privy is configured (client-side only to prevent hydration issues)
  useEffect(() => {
    setIsPrivyConfigured(!!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  }, [])

  const handleWalletConnect = async () => {
    if (!isPrivyConfigured) {
      console.error('❌ Privy is not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID environment variable.')
      alert(`Privy authentication is not configured. 

To enable Privy:
1. Go to console.privy.io
2. Create an app and copy your App ID
3. Add to .env.local:
   # Client-side (for React components)
   NEXT_PUBLIC_PRIVY_APP_ID="your-app-id"
   
   # Server-side (for JWT verification)
   PRIVY_APP_ID="your-app-id"  
   PRIVY_APP_SECRET="your-app-secret"
4. Restart the dev server

See setup-privy.md for details.`)
      return
    }

    try {
      setIsLoading(true)
      console.log('👛 Starting wallet connection...')

      // If not authenticated, trigger wallet connection
      if (!authenticated) {
        console.log('🔗 Opening wallet connection modal...')
        await connectWallet() // Opens wallet connection modal
        console.log('✅ Wallet connection completed')
      }
      
      // Get the Privy access token (JWT)
      console.log('🔑 Getting Privy access token...')
      const token = await getAccessToken()
      if (!token) {
        console.error('❌ Failed to get Privy access token')
        console.log('🔍 Debug info:', { 
          authenticated, 
          hasPrivyAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID 
        })
        alert(`Failed to get authentication token after wallet connection. 

This usually means:
1. Wallet connection was canceled
2. Privy environment variables are missing
3. Network connectivity issues

Check the console for more details.`)
        return
      }

      console.log('✅ Got Privy token, signing in with NextAuth...')
      
      // Hand the token to NextAuth Privy credentials provider
      const result = await signIn('privy', { 
        token,
        redirect: false,
      })
      
      if (result?.ok) {
        console.log('✅ NextAuth sign-in successful, redirecting...')
        window.location.href = callbackUrl
      } else {
        console.error('❌ NextAuth sign-in failed:', result)
        alert(`Wallet authentication failed: ${result?.error || 'Unknown error'}

This usually means:
1. Server-side Privy configuration is missing (PRIVY_APP_SECRET)
2. JWT token verification failed
3. Database connection issues

Check server logs for more details.`)
      }
    } catch (error) {
      console.error('❌ Wallet connection error:', error)
      alert(`Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or contact support if the issue persists.`)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking configuration
  if (isPrivyConfigured === null) {
    return (
      <Button
        disabled
        className={`bg-gray-400 text-gray-600 cursor-not-allowed ${className}`}
      >
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
        Loading...
      </Button>
    )
  }

  if (!isPrivyConfigured) {
    return (
      <Button
        disabled
        className={`bg-gray-400 text-gray-600 cursor-not-allowed ${className}`}
      >
        <span className="mr-2">👛</span>
        Privy Not Configured
      </Button>
    )
  }

  return (
    <Button
      onClick={handleWalletConnect}
      disabled={isLoading}
      className={`bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white transition-all duration-150 ${className}`}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Connecting...
        </>
      ) : (
        <>
          <span className="mr-2">👛</span>
          Connect Wallet
        </>
      )}
    </Button>
  )
} 