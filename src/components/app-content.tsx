'use client'

import type { User } from 'next-auth'

import { SessionProvider } from 'next-auth/react'

import { AppWrapper } from '@/components/app-wrapper'
import { PrivyProvider } from '@/components/providers/privy-provider'
import { GoogleAuthProvider } from '@/components/providers/google-auth-provider'
import { XAuthProvider } from '@/components/providers/x-auth-provider'
import { FacebookAuthProvider } from '@/components/providers/facebook-auth-provider'
import { InstagramAuthProvider } from '@/components/providers/instagram-auth-provider'
import { ThreadsAuthProvider } from '@/components/providers/threads-auth-provider'
import { ShopifyAuthProvider } from '@/components/providers/shopify-auth-provider';
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface AppContentProps {
  children: React.ReactNode
  session: { user: User } | null
  isCollapsed: boolean
}

export function AppContent({ children, session, isCollapsed }: AppContentProps) {
  return (
    <PrivyProvider>
      <GoogleAuthProvider>
        <XAuthProvider>
          <FacebookAuthProvider>
            <InstagramAuthProvider>
              <ThreadsAuthProvider>
                <ShopifyAuthProvider>
                  <SessionProvider>
                    <AppWrapper>
                      <SidebarProvider defaultOpen={!isCollapsed}>
                        <AppSidebar user={session?.user} />
                        <SidebarInset>{children}</SidebarInset>
                      </SidebarProvider>
                    </AppWrapper>
                  </SessionProvider>
                </ShopifyAuthProvider>
              </ThreadsAuthProvider>
            </InstagramAuthProvider>
          </FacebookAuthProvider>
        </XAuthProvider>
      </GoogleAuthProvider>
    </PrivyProvider>
  )
} 