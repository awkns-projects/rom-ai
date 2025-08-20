"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useAgents, type Agent } from '@/hooks/use-agents'
import { CompositeUnicorn } from './composite-unicorn'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { generateUUID } from '@/lib/utils'

interface AgentListProps {
  onSelectAgent?: (agent: Agent) => void
  limit?: number
}

export function AgentList({ onSelectAgent, limit = 12 }: AgentListProps) {
  const { agents, isLoading, isLoadingMore, hasMore, loadMore, error } = useAgents({ limit })
  const [isSelecting, setIsSelecting] = useState<string | null>(null)
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  const handleSelectAgent = async (agent: Agent) => {
    try {
      setIsSelecting(agent.chatId)
      
      if (onSelectAgent) {
        await onSelectAgent(agent)
      } else {
        // Redirect to the existing chat where the agent was created
        router.push(`/chat/${agent.chatId}`)
      }
    } catch (error) {
      console.error('Failed to select agent:', error)
    } finally {
      setIsSelecting(null)
    }
  }

  const renderAgentAvatar = (agent: Agent, size = 64) => {
    // Get avatar from agentData 
    const avatar = agent.agentData?.avatar
    
    if (avatar?.type === 'rom-unicorn' && avatar.unicornParts) {
      return <CompositeUnicorn parts={avatar.unicornParts} size={size} />
    } else if (avatar?.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage) {
      return (
        <Image
          src={avatar.uploadedImage}
          alt={agent.agentData?.name || agent.title}
          width={size}
          height={size}
          className="rounded-lg object-cover"
        />
      )
    } else if (avatar?.type === 'custom' && avatar.customType === 'wallet' && avatar.selectedNFT) {
      return <span className="text-2xl">{avatar.selectedNFT.split(' ')[0]}</span>
    } else {
      return <span className="text-2xl text-gray-400">🤖</span>
    }
  }

  const getThemeColors = (theme?: string) => {
    switch (theme) {
      case 'blue':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          shadow: 'shadow-blue-500/20'
        }
      case 'purple':
        return {
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/50',
          shadow: 'shadow-purple-500/20'
        }
      case 'red':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          shadow: 'shadow-red-500/20'
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          shadow: 'shadow-yellow-500/20'
        }
      case 'pink':
        return {
          bg: 'bg-pink-500/20',
          border: 'border-pink-500/50',
          shadow: 'shadow-pink-500/20'
        }
      case 'green':
      default:
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/50',
          shadow: 'shadow-green-500/20'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-400">Loading agents...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-400">Failed to load agents</p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
          <span className="text-gray-400 text-xl">🤖</span>
        </div>
        <p className="text-sm text-gray-400 mb-2">No agents created yet</p>
        <p className="text-xs text-gray-500">Create your first AI agent to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents
          // Additional safety: deduplicate agents at render time to prevent duplicate keys
          .filter((agent, index, array) => 
            array.findIndex(a => a.chatId === agent.chatId) === index
          )
          .map((agent) => {
          const themeColors = getThemeColors(agent.agentData?.theme)
          const agentName = agent.agentData?.name || agent.title
          const agentDescription = agent.agentData?.description
          const agentDomain = agent.agentData?.domain
          
          return (
            <button
              key={agent.chatId}
              onClick={() => handleSelectAgent(agent)}
              disabled={isSelecting === agent.chatId}
              className={`
                relative p-4 rounded-xl transition-all duration-200 text-left
                bg-gray-800/50 border-2 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600
                ${isSelecting === agent.chatId ? 'opacity-50' : ''}
                hover:scale-105 hover:shadow-lg
              `}
            >
              {/* Agent Avatar */}
              <div className="w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mb-3 max-w-[120px] mx-auto">
                {renderAgentAvatar(agent, 100)}
              </div>

              {/* Agent Info */}
              <div className="space-y-2">
                <div className="text-center">
                  <h4 className="font-bold text-gray-100 truncate text-base">{agentName}</h4>
                  {agentDomain && (
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-mono mt-1 border-2 ${themeColors.bg} ${themeColors.border}`}>
                      {agentDomain}
                    </div>
                  )}
                </div>
                
                {agentDescription && (
                  <p className="text-xs text-gray-400 text-center leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {agentDescription}
                  </p>
                )}
                
                {/* Agent Stats */}
                <div className="flex justify-center gap-4 text-xs text-gray-500 pt-2">
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>{agent.agentData?.models?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    <span>{agent.agentData?.actions?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏰</span>
                    <span>{agent.agentData?.schedules?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              {isSelecting === agent.chatId && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Load More Section */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex flex-col items-center gap-4 py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
              <span className="text-sm">Loading more agents...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              Load More Agents
            </button>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && agents.length > 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">You've reached the end of your agents list</p>
        </div>
      )}
    </div>
  )
} 