'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  User, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  Code
} from 'lucide-react';

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

interface ExecutionLogViewerProps {
  executionId?: string;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showParameters?: boolean;
  maxHeight?: string;
}

export function ExecutionLogViewer({
  executionId,
  userId,
  autoRefresh = false,
  refreshInterval = 5000,
  showParameters = true,
  maxHeight = '600px'
}: ExecutionLogViewerProps) {
  const [executions, setExecutions] = useState<ActionExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ActionExecutionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showParametersExpanded, setShowParametersExpanded] = useState(false);

  // Fetch executions
  const fetchExecutions = async () => {
    try {
      setError(null);
      
      if (executionId) {
        // Fetch specific execution
        const response = await fetch(`/api/execution-logs/${executionId}`);
        const result = await response.json();
        
        if (result.success) {
          setSelectedExecution(result.data);
          setExecutions([result.data]);
        } else {
          setError(result.error || 'Failed to fetch execution');
        }
      } else {
        // Fetch multiple executions
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        params.append('limit', '20');
        
        const response = await fetch(`/api/execution-logs?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setExecutions(result.data);
          if (result.data.length > 0 && !selectedExecution) {
            setSelectedExecution(result.data[0]);
          }
        } else {
          setError(result.error || 'Failed to fetch executions');
        }
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
      setError('Failed to fetch executions');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchExecutions();
    
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchExecutions, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [executionId, userId, autoRefresh, refreshInterval]);

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50', text: 'Running' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', text: 'Completed' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', text: 'Failed' };
      default:
        return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50', text: 'Unknown' };
    }
  };

  // Toggle step expansion
  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading execution logs...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-red-600">
          <XCircle className="h-6 w-6 mr-2" />
          {error}
          <Button variant="outline" size="sm" onClick={fetchExecutions} className="ml-4">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Execution List (if showing multiple) */}
      {!executionId && executions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Execution History
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchExecutions}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 overflow-y-auto space-y-2">
              {executions.map((execution) => {
                const status = getStatusDisplay(execution.status);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={execution.executionId}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedExecution?.executionId === execution.executionId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedExecution(execution)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        <span className="font-medium">{execution.actionName}</span>
                        <Badge variant="outline" className={status.bg}>
                          {status.text}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(execution.startTime)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Execution Details */}
      {selectedExecution && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {selectedExecution.actionName}
                  <Badge variant="outline" className={getStatusDisplay(selectedExecution.status).bg}>
                    {getStatusDisplay(selectedExecution.status).text}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Execution ID: {selectedExecution.executionId}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchExecutions}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Execution Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Started</div>
                  <div className="text-sm text-gray-600">
                    {formatTimestamp(selectedExecution.startTime)}
                  </div>
                </div>
              </div>
              
              {selectedExecution.endTime && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Ended</div>
                    <div className="text-sm text-gray-600">
                      {formatTimestamp(selectedExecution.endTime)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-sm text-gray-600">
                    {formatDuration(selectedExecution.totalExecutionTime)}
                  </div>
                </div>
              </div>
              
              {selectedExecution.userId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">User</div>
                    <div className="text-sm text-gray-600">
                      {selectedExecution.userId}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Parameters */}
            {showParameters && Object.keys(selectedExecution.parameters).length > 0 && (
              <div className="mb-6">
                <button 
                  onClick={() => setShowParametersExpanded(!showParametersExpanded)}
                  className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded"
                >
                  {showParametersExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Code className="h-4 w-4" />
                  <span className="font-medium">Input Parameters</span>
                </button>
                {showParametersExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedExecution.parameters, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Error (if any) */}
            {selectedExecution.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <XCircle className="h-4 w-4" />
                  Execution Error
                </div>
                <div className="text-red-600 text-sm">
                  {selectedExecution.error}
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Steps */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Execution Steps ({selectedExecution.steps.length})
              </h3>
              
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight }}>
                {selectedExecution.steps.map((step) => {
                  const isExpanded = expandedSteps.has(step.stepNumber);
                  const hasError = !!step.error;
                  const isCompleted = !!step.endTime;
                  
                  return (
                    <Card key={step.stepNumber} className={hasError ? 'border-red-200' : ''}>
                      <div>
                        <button 
                          className="w-full"
                          onClick={() => toggleStep(step.stepNumber)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">
                                  Step {step.stepNumber}: {step.stepName}
                                </span>
                                {hasError ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDuration(step.executionTime)}
                              </div>
                            </div>
                          </CardHeader>
                        </button>
                        
                        {isExpanded && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {/* Step Timing */}
                              <div className="text-xs text-gray-500 grid grid-cols-2 gap-4">
                                <div>Started: {formatTimestamp(step.startTime)}</div>
                                {step.endTime && (
                                  <div>Ended: {formatTimestamp(step.endTime)}</div>
                                )}
                              </div>

                              {/* Step Input */}
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  📥 Input
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(step.input, null, 2)}
                                  </pre>
                                </div>
                              </div>

                              {/* Step Output */}
                              {step.output && (
                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    📤 Output
                                  </div>
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <pre className="text-xs overflow-x-auto">
                                      {JSON.stringify(step.output, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Step Error */}
                              {step.error && (
                                <div>
                                  <div className="text-sm font-medium text-red-700 mb-2">
                                    ❌ Error
                                  </div>
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="text-sm text-red-600">
                                      {step.error}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 