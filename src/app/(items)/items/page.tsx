"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useWindowSize } from 'usehooks-ts'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { SidebarToggle } from '@/components/sidebar-toggle'
import { PlusIcon } from '@/components/icons'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ModelSelector } from '@/components/model-selector'
import { VisibilitySelector } from '@/components/visibility-selector'
import Link from 'next/link'

const AIPlayer = dynamic(() => import("@/components/deployment/ai-player").then(mod => ({ default: mod.default })), { ssr: false })

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('chatId')
  const { data: session } = useSession()
  const { open } = useSidebar()
  const { width: windowWidth } = useWindowSize()

  return (
    <div className="min-h-screen bg-black text-green-200">
      {/* Header matching main app design */}
      {/* <header className="flex sticky top-0 bg-black border-b border-green-500/20 py-1.5 items-center px-2 md:px-2 gap-2 backdrop-blur-xl z-50">
        <SidebarToggle />

        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0 font-mono"
                onClick={() => {
                  window.location.href = '/chat';
                }}
              >
                <PlusIcon />
                <span className="hidden md:inline">NEW AGENT</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-black border-green-500/30 text-green-200 font-mono">NEW AGENT</TooltipContent>
          </Tooltip>
        )}

        {session && (
          <ModelSelector
            session={session}
            selectedModelId="gpt-4o-mini"
            selectedProviderId="openai"
            className="order-1 md:order-2"
          />
        )}

        {session && (
          <VisibilitySelector
            chatId=""
            selectedVisibilityType="private"
            className="order-1 md:order-3"
          />
        )}

        <Button
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black border border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto font-mono font-medium"
          asChild
        >
          <Link href="/marketplace">
            <span className="md:hidden">💎</span>
            <span className="hidden md:inline">Marketplace</span>
          </Link>
        </Button>

        <Button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 py-1.5 px-2 h-fit md:h-[34px] order-5 font-mono font-medium"
          asChild
        >
          <Link href="/play">
            <span className="md:hidden">🤖</span>
            <span className="hidden md:inline">Play</span>
          </Link>
        </Button>
      </header> */}

      {/* Main Content */}
      <AIPlayer />
    </div>
  )
}