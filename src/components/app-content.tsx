'use client'

import { SessionProvider } from 'next-auth/react'
import { AppWrapper } from '@/components/app-wrapper'
import { PrivyProvider } from '@/components/providers/privy-provider'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { User } from 'next-auth'

interface AppContentProps {
  children: React.ReactNode
  session: { user: User } | null
  isCollapsed: boolean
}

export function AppContent({ children, session, isCollapsed }: AppContentProps) {
  return (
    <PrivyProvider>
      <SessionProvider>
        <AppWrapper>
          <SidebarProvider defaultOpen={!isCollapsed}>
            <AppSidebar user={session?.user} />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </AppWrapper>
      </SessionProvider>
    </PrivyProvider>
  )
} 