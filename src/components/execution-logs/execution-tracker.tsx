'use client';

import React from 'react';
import { useExecutionTracking } from '@/hooks/use-execution-logs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  AlertTriangle
} from 'lucide-react';

interface ExecutionTrackerProps {
  executionId: string;
  title?: string;
  compact?: boolean;
  showSteps?: boolean;
  maxHeight?: string;
}

export function ExecutionTracker({
  executionId,
  title = 'Action Execution',
  compact = false,
  showSteps = true,
  maxHeight = '400px'
}: ExecutionTrackerProps) {
  const { selectedExecution: execution, loading, error } = useExecutionTracking(executionId);

  if (loading) {
    return (
      <Card className={compact ? 'w-full' : ''}>
        <CardContent className="flex items-center justify-center py-4">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Loading execution...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'w-full' : ''}>
        <CardContent className="flex items-center justify-center py-4 text-red-600">
          <XCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!execution) {
    return (
      <Card className={compact ? 'w-full' : ''}>
        <CardContent className="flex items-center justify-center py-4 text-gray-500">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm">Execution not found</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100', text: 'Running', spin: true };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', text: 'Completed', spin: false };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', text: 'Failed', spin: false };
      default:
        return { icon: Play, color: 'text-gray-500', bg: 'bg-gray-100', text: 'Unknown', spin: false };
    }
  };

  const status = getStatusDisplay(execution.status);
  const StatusIcon = status.icon;

  // Calculate progress
  const totalSteps = execution.steps.length;
  const completedSteps = execution.steps.filter(step => step.endTime).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card className={compact ? 'w-full' : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
            {title}
          </span>
          <Badge variant="outline" className={status.bg}>
            {status.text}
          </Badge>
        </CardTitle>
        {!compact && (
          <div className="text-xs text-gray-500">
            ID: {execution.executionId}
          </div>
        )}
      </CardHeader>
      
      <CardContent className={compact ? 'pt-0' : ''}>
        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span>Progress</span>
            <span>{completedSteps}/{totalSteps} steps</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Timing Info */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">
              {execution.totalExecutionTime ? 
                formatDuration(execution.totalExecutionTime) : 
                execution.endTime ? 
                  formatDuration(new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) :
                  formatDuration(Date.now() - new Date(execution.startTime).getTime())
              }
            </span>
          </div>
          <div className="text-right text-gray-600">
            {new Date(execution.startTime).toLocaleTimeString()}
          </div>
        </div>

        {/* Error Display */}
        {execution.error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <strong>Error:</strong> {execution.error}
          </div>
        )}

        {/* Steps */}
        {showSteps && execution.steps.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">
              Execution Steps
            </div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: compact ? '200px' : maxHeight }}>
                {execution.steps.map((step) => {
                  const stepCompleted = !!step.endTime;
                  const stepFailed = !!step.error;
                  
                  return (
                    <div
                      key={step.stepNumber}
                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                        stepFailed ? 'bg-red-50 border border-red-200' :
                        stepCompleted ? 'bg-green-50 border border-green-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      {stepFailed ? (
                        <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      ) : stepCompleted ? (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <RefreshCw className="h-3 w-3 text-blue-500 animate-spin flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          Step {step.stepNumber}: {step.stepName}
                        </div>
                        {stepCompleted && step.executionTime && (
                          <div className="text-gray-500">
                            {formatDuration(step.executionTime)}
                          </div>
                        )}
                        {stepFailed && step.error && (
                          <div className="text-red-600 mt-1 text-xs">
                            {step.error}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutionTracker; 