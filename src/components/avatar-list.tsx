"use client"

import React, { useState } from 'react'
import { useAvatars, type Avatar } from '@/hooks/use-avatar'
import { CompositeUnicorn } from './composite-unicorn'
import Image from 'next/image'

interface AvatarListProps {
  onSelectAvatar?: (avatar: Avatar) => void
  documentId?: string
}

export function AvatarList({ onSelectAvatar, documentId }: AvatarListProps) {
  const { avatars, isLoading, error } = useAvatars(documentId)
  const [isSelecting, setIsSelecting] = useState<string | null>(null)

  const handleSelectAvatar = async (avatar: Avatar) => {
    try {
      setIsSelecting(avatar.id)
      // Connect avatar to document (same as generating new avatar)
      if (onSelectAvatar) {
        await onSelectAvatar(avatar)
      }
    } catch (error) {
      console.error('Failed to select avatar:', error)
    } finally {
      setIsSelecting(null)
    }
  }

  const renderAvatarPreview = (avatar: Avatar, size = 64) => {
    if (avatar.type === 'rom-unicorn' && avatar.unicornParts) {
      return <CompositeUnicorn parts={avatar.unicornParts} size={size} />
    } else if (avatar.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage) {
      return (
        <Image
          src={avatar.uploadedImage}
          alt={avatar.name}
          width={size}
          height={size}
          className="rounded-lg object-cover"
        />
      )
    } else if (avatar.type === 'custom' && avatar.customType === 'wallet' && avatar.selectedNFT) {
      return <span className="text-2xl">{avatar.selectedNFT.split(' ')[0]}</span>
    } else {
      return <span className="text-2xl text-gray-400">🦄</span>
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-400">Loading avatars...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-400">Failed to load avatars</p>
      </div>
    )
  }

  if (avatars.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
          <span className="text-gray-400 text-xl">🎨</span>
        </div>
        <p className="text-sm text-gray-400 mb-2">No avatars created yet</p>
        <p className="text-xs text-gray-500">Generate your first avatar to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {avatars.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => handleSelectAvatar(avatar)}
          disabled={isSelecting === avatar.id}
          className={`
            relative p-3 rounded-lg transition-all duration-200 text-left
            ${avatar.isActive 
              ? 'bg-green-500/20 border-2 border-green-500/50 shadow-lg shadow-green-500/20' 
              : 'bg-gray-800/50 border-2 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600'
            }
            ${isSelecting === avatar.id ? 'opacity-50' : ''}
          `}
        >
          {/* Avatar Preview */}
          <div className="w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mb-2">
            {renderAvatarPreview(avatar, 80)}
          </div>

          {/* Avatar Name */}
          <div className="text-center">
            <h4 className="font-medium text-gray-100 truncate text-sm">{avatar.name}</h4>
          </div>

          {/* Loading indicator */}
          {isSelecting === avatar.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Active indicator */}
          {avatar.isActive && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border border-gray-900" />
          )}
        </button>
      ))}
    </div>
  )
} 