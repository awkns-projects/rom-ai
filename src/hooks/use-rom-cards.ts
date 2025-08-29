import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface CardType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: string;
  maxSlots: number;
  features: string[];
  isActive: boolean;
}

export interface RomCard {
  id: string;
  name: string;
  isDeployed: boolean;
  balance: string;
  totalSpent: string;
  lastUsed: string | null;
  createdAt: string;
  cardType: {
    id: string;
    name: string;
    displayName: string;
    maxSlots: number;
  };
}

export function useCardTypes() {
  const { data, error, isLoading } = useSWR<CardType[]>('/api/card-types', fetcher);

  return {
    cardTypes: data || [],
    error,
    isLoading,
  };
}

export function useRomCards() {
  const { data, error, isLoading } = useSWR<RomCard[]>('/api/rom-cards', fetcher);

  const refreshCards = useCallback(() => {
    mutate('/api/rom-cards');
  }, []);

  return {
    romCards: data || [],
    error,
    isLoading,
    refreshCards,
  };
}

export function usePurchaseCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseCard = useCallback(async (cardTypeId: string, cardName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardTypeId, cardName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase card');
      }

      const result = await response.json();
      
      // Refresh ROM cards list
      mutate('/api/rom-cards');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    purchaseCard,
    isLoading,
    error,
  };
} 