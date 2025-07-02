"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from 'lucide-react'
import Component from "@/components/deployment/ai-cassette-player"

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('chatId')

  return (
    <div className="min-h-screen bg-black text-green-200">
      {/* Header - Show when chatId exists */}
        <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-green-500/20 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (chatId) {
                    router.push(`/chat/${chatId}`)
                  } else {
                    window.history.back()
                  }
                }}
                className="text-green-300 hover:text-green-200 hover:bg-green-500/10 p-2"
              >
                <ArrowLeftIcon size={18} />
                <span className="ml-2 font-mono">BACK</span>
              </Button>
            </div>
         
            <div className="w-32" />
          </div>
        </header>

      {/* Main Content */}
      <Component />
    </div>
  )
}