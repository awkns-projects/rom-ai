import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/utils';

export interface Agent {
  chatId: string;
  title: string;
  agentData: {
    name?: string;
    description?: string;
    domain?: string;
    theme?: string;
    avatar?: any;
    models?: any[];
    actions?: any[];
    schedules?: any[];
    externalApis?: any[];
  };
  documentId?: string;
  createdAt: string;
}

interface PaginatedResponse {
  agents: Agent[];
  hasMore: boolean;
  total?: number;
}

interface UseAgentsOptions {
  limit?: number;
  enabled?: boolean;
}

export function useAgents(options: UseAgentsOptions = {}) {
  const { limit = 12, enabled = true } = options;
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  const { data, error, isLoading } = useSWR<PaginatedResponse>(
    enabled ? `/api/user-agents?limit=${limit}` : null,
    fetcher,
    {
      onSuccess: (data) => {
        setAllAgents(data.agents);
        setHasMore(data.hasMore);
      }
    }
  );
  
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !allAgents.length) return;
    
    setIsLoadingMore(true);
    try {
      // Use the last agent's chatId as startingAfter for cursor-based pagination
      const lastAgent = allAgents[allAgents.length - 1];
      const response = await fetcher(`/api/user-agents?limit=${limit}&startingAfter=${lastAgent.chatId}`);
      
      // Deduplicate agents by chatId to prevent duplicate keys
      const existingChatIds = new Set(allAgents.map(agent => agent.chatId));
      const newAgents = response.agents.filter((agent: Agent) => !existingChatIds.has(agent.chatId));
      
      setAllAgents(prev => [...prev, ...newAgents]);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to load more agents:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, allAgents, limit]);

  const refreshAgents = useCallback(() => {
    setAllAgents([]);
    setHasMore(true);
    mutate(`/api/user-agents?limit=${limit}`);
  }, [limit]);

  const reset = useCallback(() => {
    setAllAgents([]);
    setHasMore(true);
  }, []);

  return {
    agents: allAgents,
    error,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refreshAgents,
    reset
  };
}

export function useAgent(agentId?: string) {
  const { data: agent, error, isLoading } = useSWR<Agent>(
    agentId ? `/api/document?id=${agentId}` : null,
    fetcher
  );

  return {
    agent,
    error,
    isLoading
  };
} 