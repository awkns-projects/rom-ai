import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/utils';

export interface Avatar {
  id: string;
  userId: string;
  documentId?: string;
  name: string;
  personality?: string;
  characterNames?: string;
  type: string;
  romUnicornType?: string;
  customType?: string;
  uploadedImage?: string;
  selectedStyle?: string;
  connectedWallet?: string;
  selectedNFT?: string;
  unicornParts?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAvatars(documentId?: string) {
  const apiUrl = documentId ? `/api/avatar?documentId=${documentId}` : '/api/avatar';
  const { data: avatars, error, isLoading } = useSWR<Avatar[]>(apiUrl, fetcher);
  
  const createAvatar = useCallback(async (avatarData: Omit<Avatar, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/api/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...avatarData, documentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create avatar');
    }

    const newAvatar = await response.json();
    
    // Revalidate the avatars list
    mutate(apiUrl);
    
    return newAvatar;
  }, [apiUrl, documentId]);

  const updateAvatar = useCallback(async (id: string, updates: Partial<Avatar>) => {
    const response = await fetch('/api/avatar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update avatar');
    }

    const updatedAvatar = await response.json();
    
    // Revalidate the avatars list
    mutate(apiUrl);
    
    return updatedAvatar;
  }, [apiUrl]);

  const setActiveAvatar = useCallback(async (avatarId: string) => {
    const response = await fetch('/api/avatar?action=set-active', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarId, documentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to set active avatar');
    }

    const activeAvatar = await response.json();
    
    // Revalidate the avatars list
    mutate(apiUrl);
    
    return activeAvatar;
  }, [apiUrl, documentId]);

  const deleteAvatar = useCallback(async (id: string) => {
    const response = await fetch(`/api/avatar?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete avatar');
    }

    // Revalidate the avatars list
    mutate(apiUrl);
    
    return true;
  }, [apiUrl]);

  return {
    avatars: avatars || [],
    isLoading,
    error,
    createAvatar,
    updateAvatar,
    setActiveAvatar,
    deleteAvatar,
  };
}

export function useActiveAvatar(documentId?: string) {
  const apiUrl = documentId ? `/api/avatar?active=true&documentId=${documentId}` : '/api/avatar?active=true';
  const { data: activeAvatar, error, isLoading } = useSWR<Avatar | null>(apiUrl, fetcher);
  
  return {
    activeAvatar,
    isLoading,
    error,
  };
} 