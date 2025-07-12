"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAvatars, type Avatar } from '@/hooks/use-avatar'
import { CompositeUnicorn } from './composite-unicorn'
import Image from 'next/image'

interface AvatarListProps {
  onSelectAvatar?: (avatar: Avatar) => void
  onRegenerateAvatar?: (avatar: Avatar) => void
  showActions?: boolean
}

export function AvatarList({ onSelectAvatar, onRegenerateAvatar, showActions = true }: AvatarListProps) {
  const { avatars, isLoading, error, setActiveAvatar, deleteAvatar } = useAvatars()
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null)
  const [isSettingActive, setIsSettingActive] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleSetActive = async (avatar: Avatar) => {
    try {
      setIsSettingActive(avatar.id)
      await setActiveAvatar(avatar.id)
    } catch (error) {
      console.error('Failed to set active avatar:', error)
    } finally {
      setIsSettingActive(null)
    }
  }

  const handleDelete = async (avatar: Avatar) => {
    try {
      setIsDeleting(avatar.id)
      await deleteAvatar(avatar.id)
    } catch (error) {
      console.error('Failed to delete avatar:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRegenerate = (avatar: Avatar) => {
    if (onRegenerateAvatar) {
      onRegenerateAvatar(avatar)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-green-400">Generated Avatars</h3>
        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
          {avatars.length} avatar{avatars.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-3">
        {avatars.map((avatar) => (
          <Card key={avatar.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Avatar Preview */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {renderAvatarPreview(avatar, 48)}
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-100 truncate">{avatar.name}</h4>
                    {avatar.isActive && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="capitalize">{avatar.type.replace('-', ' ')}</span>
                    {avatar.romUnicornType && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{avatar.romUnicornType}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(avatar.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center gap-2">
                    {/* View Details */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 h-8 w-8 p-0"
                          onClick={() => setSelectedAvatar(avatar)}
                        >
                          <span className="text-xs">👁️</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-green-400">{avatar.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                              {renderAvatarPreview(avatar, 128)}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            {avatar.personality && (
                              <div>
                                <span className="text-gray-400">Personality:</span>
                                <p className="text-gray-300">{avatar.personality}</p>
                              </div>
                            )}
                            {avatar.characterNames && (
                              <div>
                                <span className="text-gray-400">Inspired by:</span>
                                <p className="text-blue-400">{avatar.characterNames}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400">Type:</span>
                              <p className="text-gray-300 capitalize">{avatar.type.replace('-', ' ')}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Created:</span>
                              <p className="text-gray-300">{new Date(avatar.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Set Active */}
                    {!avatar.isActive && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 h-8 w-8 p-0"
                              onClick={() => handleSetActive(avatar)}
                              disabled={isSettingActive === avatar.id}
                            >
                              {isSettingActive === avatar.id ? (
                                <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full" />
                              ) : (
                                <span className="text-xs">⭐</span>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Set as active avatar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Regenerate */}
                    {onRegenerateAvatar && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 h-8 w-8 p-0"
                              onClick={() => handleRegenerate(avatar)}
                            >
                              <span className="text-xs">🔄</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerate avatar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 h-8 w-8 p-0"
                          disabled={isDeleting === avatar.id}
                        >
                          {isDeleting === avatar.id ? (
                            <div className="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full" />
                          ) : (
                            <span className="text-xs">🗑️</span>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-400">Delete Avatar</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Are you sure you want to delete "{avatar.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleDelete(avatar)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 