import { useState, useEffect, useCallback } from 'react';

export interface ActionExecutionLog {
  executionId: string;
  actionName: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  steps: ActionStepLog[];
  error?: string;
  totalExecutionTime?: number;
}

export interface ActionStepLog {
  stepNumber: number;
  stepName: string;
  startTime: string;
  endTime?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  executionTime?: number;
}

interface UseExecutionLogsOptions {
  userId?: string;
  executionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

interface UseExecutionLogsReturn {
  executions: ActionExecutionLog[];
  selectedExecution: ActionExecutionLog | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectExecution: (execution: ActionExecutionLog | null) => void;
}

export function useExecutionLogs({
  userId,
  executionId,
  autoRefresh = false,
  refreshInterval = 5000,
  limit = 20
}: UseExecutionLogsOptions = {}): UseExecutionLogsReturn {
  const [executions, setExecutions] = useState<ActionExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ActionExecutionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    try {
      setError(null);
      
      if (executionId) {
        // Fetch specific execution
        const response = await fetch(`/api/execution-logs/${executionId}`);
        const result = await response.json();
        
        if (result.success) {
          const execution = result.data;
          setExecutions([execution]);
          setSelectedExecution(execution);
        } else {
          setError(result.error || 'Failed to fetch execution');
          setExecutions([]);
          setSelectedExecution(null);
        }
      } else {
        // Fetch multiple executions
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        params.append('limit', limit.toString());
        
        const response = await fetch(`/api/execution-logs?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setExecutions(result.data);
          // Auto-select first execution if none selected
          if (result.data.length > 0 && !selectedExecution) {
            setSelectedExecution(result.data[0]);
          }
          // Update selected execution if it exists in the new data
          if (selectedExecution) {
            const updatedExecution = result.data.find(
              (exec: ActionExecutionLog) => exec.executionId === selectedExecution.executionId
            );
            if (updatedExecution) {
              setSelectedExecution(updatedExecution);
            }
          }
        } else {
          setError(result.error || 'Failed to fetch executions');
          setExecutions([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
      setError('Failed to fetch executions');
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  }, [executionId, userId, limit, selectedExecution]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchExecutions();
  }, [fetchExecutions]);

  const selectExecution = useCallback((execution: ActionExecutionLog | null) => {
    setSelectedExecution(execution);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchExecutions, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchExecutions]);

  return {
    executions,
    selectedExecution,
    loading,
    error,
    refresh,
    selectExecution
  };
}

/**
 * Hook for tracking a specific execution in real-time
 */
export function useExecutionTracking(executionId: string) {
  return useExecutionLogs({
    executionId,
    autoRefresh: true,
    refreshInterval: 2000 // Refresh every 2 seconds for active tracking
  });
}

/**
 * Hook for viewing user's execution history
 */
export function useExecutionHistory(userId?: string, limit: number = 50) {
  return useExecutionLogs({
    userId,
    limit,
    autoRefresh: false // Don't auto-refresh history view
  });
} 