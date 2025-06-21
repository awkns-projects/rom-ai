'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useMemo, useEffect, useCallback } from 'react';
import type { Vote, Document } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon, PlayIcon, CodeIcon, BoxIcon, RouteIcon, WarningIcon, LoaderIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText, generateUUID, fetcher } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useArtifact } from '@/hooks/use-artifact';
import { useChat } from '@ai-sdk/react';
import useSWR from 'swr';

// Agent Builder Loading Component
const AgentBuilderLoading = memo(({ args, message, isLoading }: { args: any; message?: UIMessage; isLoading?: boolean }) => {
  const { metadata } = useArtifact();
  const [autoRetryAttempted, setAutoRetryAttempted] = useState(false);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [autoRetryCompleted, setAutoRetryCompleted] = useState(false);
  
  // Fetch the document to get persisted metadata
  const { data: documents } = useSWR<Array<Document>>(
    args?.documentId ? `/api/document?id=${args.documentId}` : null,
    fetcher
  );

  // Get persisted metadata from document
  const persistedMetadata = useMemo(() => {
    const document = documents?.[0];
    if (document?.metadata && typeof document.metadata === 'object') {
      return document.metadata as any;
    }
    return null;
  }, [documents]);

  // Auto-retry logic for timeout
  useEffect(() => {
    // Only auto-retry once, and only if we haven't already attempted it
    if (!autoRetryAttempted && 
        !isLoading && 
        !isAutoRetrying &&
        (persistedMetadata?.status === 'timeout' || persistedMetadata?.currentStep === 'timeout')) {
      
      console.log('🔄 Timeout detected, starting auto-retry countdown...', {
        autoRetryAttempted,
        isLoading,
        isAutoRetrying,
        persistedMetadata: persistedMetadata?.status,
        currentStep: persistedMetadata?.currentStep,
        timeoutOccurred: persistedMetadata?.timeoutOccurred
      });
      
      // Only auto-retry if timeout actually occurred (not just old timeout state)
      const timeoutTimestamp = persistedMetadata?.timeoutTimestamp;
      const isRecentTimeout = timeoutTimestamp && 
        (new Date().getTime() - new Date(timeoutTimestamp).getTime()) < 300000; // 5 minutes
      
      if (!isRecentTimeout && !persistedMetadata?.timeoutOccurred) {
        console.log('⚠️ Timeout state detected but not recent or confirmed, skipping auto-retry');
        return;
      }
      
      setAutoRetryAttempted(true);
      
      // Start 10-second countdown
      let countdown = 10;
      setRetryCountdown(countdown);
      setIsAutoRetrying(true);
      
      const countdownInterval = setInterval(() => {
        countdown--;
        setRetryCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          console.log('🔄 Auto-retrying agent builder after timeout...', {
            documentId: args?.documentId,
            command: args?.command,
            operation: 'resume'
          });
          
          // Trigger retry by simulating a resume action
          const retryEvent = new CustomEvent('agent-builder-auto-retry', {
            detail: { 
              documentId: args?.documentId,
              command: args?.command,
              operation: 'resume'
            }
          });
          console.log('🔄 Dispatching agent-builder-auto-retry event...', retryEvent.detail);
          window.dispatchEvent(retryEvent);
          
          setIsAutoRetrying(false);
          
          // Set a flag to indicate auto-retry has completed
          // We'll check if steps are still incomplete after a brief delay
          setTimeout(() => {
            setAutoRetryCompleted(true);
          }, 2000); // Give some time for the retry to process
        }
      }, 1000);
      
      // Store interval ID for cleanup
      return () => {
        clearInterval(countdownInterval);
        setIsAutoRetrying(false);
      };
    }
  }, [persistedMetadata, autoRetryAttempted, isLoading, isAutoRetrying, args]);

  // Cancel auto-retry function
  const cancelAutoRetry = () => {
    setIsAutoRetrying(false);
    setRetryCountdown(0);
    console.log('🚫 Auto-retry canceled by user');
  };
  
  // Add timeout/error steps if they exist in metadata - memoized to prevent re-renders
  const dynamicSteps = useMemo(() => {
    const steps = [
      { id: 'prompt-understanding', label: 'Understanding Requirements' },
      { id: 'granular-analysis', label: 'Detailed Planning' },
      { id: 'analysis', label: 'AI Analysis & Decision Making' },
      { id: 'change-analysis', label: 'Change Impact Analysis' },
      { id: 'overview', label: 'System Architecture' },
      { id: 'models', label: 'Database Models Creation' },
      { id: 'actions', label: 'Automated Actions Setup' },
      { id: 'execution', label: 'Execution Logic & UI Components' },
      { id: 'schedules', label: 'Scheduling & Timing' },
      { id: 'integration', label: 'System Integration' }
    ];
    
    const baseSteps = [...steps];
    if (persistedMetadata?.status === 'timeout' || persistedMetadata?.currentStep === 'timeout') {
      baseSteps.push({ id: 'timeout', label: 'Process Timeout' });
    }
    if (persistedMetadata?.status === 'error' || persistedMetadata?.currentStep === 'error') {
      baseSteps.push({ id: 'error', label: 'Process Error' });
    }
    return baseSteps;
  }, [persistedMetadata?.status, persistedMetadata?.currentStep]);

  // Get step status from metadata or tool call parts or persisted metadata - memoized with useCallback
  const getStepStatus = useCallback((stepId: string) => {
    // Check for step data in message parts (for streaming state)
    if (message?.parts) {
      for (const part of message.parts) {
        if (part.type === 'tool-invocation' && part.toolInvocation?.toolName === 'agentBuilder') {
          // Check if this part has step data
          const content = part.toolInvocation.state === 'call' ? part.toolInvocation.args : 
                          part.toolInvocation.state === 'result' ? part.toolInvocation.result : null;
          
          if (content && typeof content === 'object') {
            // Check for step progress in the content
            if (content.stepProgress && content.stepProgress[stepId]) {
              return content.stepProgress[stepId];
            }
            if (content.currentStep === stepId) {
              return 'processing';
            }
          }
        }
      }
    }
    
    // Check metadata (real-time streaming state)
    if (metadata?.stepProgress && metadata.stepProgress[stepId]) {
      return metadata.stepProgress[stepId];
    }
    
    if (metadata?.currentStep === stepId) {
      return 'processing';
    }
    
    // Check persisted metadata from database
    if (persistedMetadata?.stepProgress && persistedMetadata.stepProgress[stepId]) {
      return persistedMetadata.stepProgress[stepId];
    }
    
    if (persistedMetadata?.currentStep === stepId) {
      // Check if this step was interrupted by timeout or error
      if (persistedMetadata.status === 'timeout' && stepId === 'timeout') {
        return 'timeout';
      }
      if (persistedMetadata.status === 'error' && stepId === 'error') {
        return 'error';
      }
      return 'processing';
    }
    
    // Check for timeout state
    if (stepId === 'timeout' && (persistedMetadata?.status === 'timeout' || persistedMetadata?.currentStep === 'timeout')) {
      return 'timeout';
    }
    
    // Check for error state
    if (stepId === 'error' && (persistedMetadata?.status === 'error' || persistedMetadata?.currentStep === 'error')) {
      return 'error';
    }
    
    // Determine based on step order and persisted data
    const stepOrder = ['prompt-understanding', 'granular-analysis', 'analysis', 'change-analysis', 'overview', 'models', 'actions', 'execution', 'schedules', 'integration'];
    const currentStepIndex = (metadata?.currentStep || persistedMetadata?.currentStep) ? 
      stepOrder.indexOf(metadata?.currentStep || persistedMetadata?.currentStep) : -1;
    const thisStepIndex = stepOrder.indexOf(stepId);
    
    // If we have explicit metadata or are actively streaming or have persisted state
    if (metadata?.currentStep || metadata?.stepProgress || persistedMetadata?.currentStep || persistedMetadata?.stepProgress) {
      if (currentStepIndex >= 0 && thisStepIndex < currentStepIndex) {
        return 'complete';
      }
      if (currentStepIndex >= 0 && thisStepIndex > currentStepIndex) {
        return 'pending';
      }
    }
    
    // Default to pending for initial state
    return 'pending';
  }, [message?.parts, metadata?.stepProgress, metadata?.currentStep, persistedMetadata?.stepProgress, persistedMetadata?.currentStep, persistedMetadata?.status]);

  // Get step message from metadata or tool call data or persisted metadata
  const getStepMessage = (stepId: string) => {
    // Check metadata first (real-time)
    if (metadata?.stepMessages && metadata.stepMessages[stepId]) {
      return metadata.stepMessages[stepId];
    }
    
    // Check persisted metadata
    if (persistedMetadata?.stepMessages && persistedMetadata.stepMessages[stepId]) {
      return persistedMetadata.stepMessages[stepId];
    }
    
    // Check message parts for stored step data
    if (message?.parts) {
      for (const part of message.parts) {
        if (part.type === 'tool-invocation' && part.toolInvocation?.toolName === 'agentBuilder') {
          const content = part.toolInvocation.state === 'call' ? part.toolInvocation.args : 
                          part.toolInvocation.state === 'result' ? part.toolInvocation.result : null;
          
          if (content && typeof content === 'object' && content.stepMessages && content.stepMessages[stepId]) {
            return content.stepMessages[stepId];
          }
        }
      }
    }
    
    return '';
  };

  // Check if process was incomplete and can be resumed
  const canResume = useMemo(() => {
    if (!persistedMetadata) return false;
    
    // Check if any step is marked as processing or if not all steps are complete
    const hasProcessingStep = dynamicSteps.some(step => {
      const status = getStepStatus(step.id);
      return status === 'processing';
    });
    
    const allStepsComplete = dynamicSteps.every(step => {
      const status = getStepStatus(step.id);
      return status === 'complete';
    });
    
    // Check for timeout or error states that can be resumed
    const hasTimeoutOrError = persistedMetadata.status === 'timeout' || 
                              persistedMetadata.status === 'error' ||
                              persistedMetadata.canResume === true;
    
    return !allStepsComplete && (hasProcessingStep || persistedMetadata.currentStep || hasTimeoutOrError);
  }, [persistedMetadata, dynamicSteps, getStepStatus]);

  // Check if process timed out
  const isTimedOut = useMemo(() => {
    return persistedMetadata?.status === 'timeout' || 
           persistedMetadata?.currentStep === 'timeout' ||
           dynamicSteps.some(step => getStepStatus(step.id) === 'timeout');
  }, [persistedMetadata, dynamicSteps, getStepStatus]);

  // Check if we should show continue button after auto-retry
  const shouldShowContinueButton = useMemo(() => {
    if (!autoRetryCompleted || isLoading || isAutoRetrying) return false;
    
    // Check if steps are still incomplete after auto-retry
    const allStepsComplete = dynamicSteps.every(step => {
      const status = getStepStatus(step.id);
      return status === 'complete';
    });
    
    return !allStepsComplete;
  }, [autoRetryCompleted, isLoading, isAutoRetrying, dynamicSteps, getStepStatus]);

  // Determine if we're actively processing - should be based on whether AI is working
  const isProcessing = isLoading || isAutoRetrying;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-black border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-6 border-b border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-green-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-green-500/20">
              {isProcessing ? (
                <div className="animate-spin">
                  <div className="size-6 border-2 border-green-400 border-t-transparent rounded-full" />
                </div>
              ) : isAutoRetrying ? (
                <span className="text-blue-400 text-xl">🔄</span>
              ) : shouldShowContinueButton ? (
                <span className="text-orange-400 text-xl">⏯️</span>
              ) : isTimedOut ? (
                <span className="text-yellow-400 text-xl">⏱️</span>
              ) : (
                <span className="text-green-400 text-xl">🤖</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-green-100">
                {isAutoRetrying ? 'Auto-Retrying Agent Builder' :
                 isProcessing ? 'Building AI Agent' : 
                 shouldShowContinueButton ? 'Agent Building Needs Continuation' :
                 isTimedOut ? 'Agent Building Timed Out' :
                 canResume ? 'Resume Agent Building' : 'AI Agent Builder'}
              </h3>
              <p className="text-green-300/70 text-sm">
                {isAutoRetrying ? `Automatically retrying in ${retryCountdown}s...` :
                 isProcessing ? 'Creating your intelligent automation system...' : 
                 shouldShowContinueButton ? 'Auto-retry completed but more steps needed' :
                 isTimedOut ? 'Process timed out but can be resumed' :
                 canResume ? 'Continue building your interrupted agent system' : 
                 'Ready to build your agent system'}
              </p>
            </div>
            {isAutoRetrying && (
              <button 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={cancelAutoRetry}
              >
                Cancel ({retryCountdown}s)
              </button>
            )}
            {shouldShowContinueButton && (
              <button 
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  // Reset the auto-retry completed flag and trigger continue
                  setAutoRetryCompleted(false);
                  const retryEvent = new CustomEvent('agent-builder-auto-retry', {
                    detail: { 
                      documentId: args?.documentId,
                      command: args?.command,
                      operation: 'continue'
                    }
                  });
                  window.dispatchEvent(retryEvent);
                  console.log('Continue building agent after auto-retry clicked');
                }}
              >
                Continue Building
              </button>
            )}
            {(canResume || isTimedOut) && !isProcessing && !isAutoRetrying && !shouldShowContinueButton && (
              <button 
                className={cn(
                  "px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors",
                  isTimedOut 
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => {
                  // Trigger resume by sending a continue message
                  const retryEvent = new CustomEvent('agent-builder-auto-retry', {
                    detail: { 
                      documentId: args?.documentId,
                      command: args?.command,
                      operation: 'resume'
                    }
                  });
                  window.dispatchEvent(retryEvent);
                  console.log('Manual resume agent building clicked');
                }}
              >
                {isTimedOut && !autoRetryAttempted ? 'Retry Now' : 
                 isTimedOut ? 'Manual Retry' : 'Resume Building'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-black">
          <div className="bg-zinc-900/50 border border-green-500/10 rounded-xl p-4">
            <p className="text-sm text-green-200/80">
              <span className="font-medium text-green-100">Request:</span> {args.command}
            </p>
            {isAutoRetrying && (
              <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  🔄 Automatically retrying in {retryCountdown} seconds. Click &quot;Cancel&quot; to stop.
                </p>
              </div>
            )}
            {shouldShowContinueButton && (
              <div className="mt-2 p-2 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-300">
                  ⏯️ Auto-retry completed but some steps are still incomplete. Click &quot;Continue Building&quot; to proceed.
                </p>
              </div>
            )}
            {isTimedOut && !isAutoRetrying && !shouldShowContinueButton && (
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300">
                  {autoRetryAttempted 
                    ? "⏱️ Process timed out. Auto-retry was attempted. You can try manual retry."
                    : "⏱️ Process timed out but progress was saved. Auto-retry will start in a moment."}
                </p>
              </div>
            )}
            {canResume && !isTimedOut && !isProcessing && !isAutoRetrying && !shouldShowContinueButton && (
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300">
                  ⚠️ Previous building process was interrupted. You can resume from where it left off.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {dynamicSteps.map((step) => {
              const status = getStepStatus(step.id);
              const message = getStepMessage(step.id);
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border",
                    {
                      'bg-green-500/20 border-green-500/40': status === 'complete',
                      'bg-green-400/10 border-green-400/30': status === 'processing',
                      'bg-red-500/20 border-red-500/40': status === 'error',
                      'bg-yellow-500/20 border-yellow-500/40': status === 'timeout',
                      'bg-zinc-800/50 border-zinc-700/50': status === 'pending'
                    }
                  )}>
                    {status === 'complete' ? (
                      <div className="size-3 bg-green-400 rounded-full shadow-sm shadow-green-400/50" />
                    ) : status === 'processing' ? (
                      <div className="size-3 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
                    ) : status === 'error' ? (
                      <div className="size-3 bg-red-400 rounded-full" />
                    ) : status === 'timeout' ? (
                      <div className="size-3 bg-yellow-400 rounded-full" />
                    ) : (
                      <div className="size-3 bg-zinc-600 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm transition-colors duration-300 font-mono",
                      {
                        'text-green-300': status === 'complete',
                        'text-green-200': status === 'processing',
                        'text-red-300': status === 'error',
                        'text-yellow-300': status === 'timeout',
                        'text-zinc-500': status === 'pending'
                      }
                    )}>
                      {message || step.label}
                    </span>
                    {status === 'processing' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="size-1.5 bg-green-400 rounded-full animate-bounce shadow-sm shadow-green-400/50" style={{ animationDelay: '0ms' }} />
                          <div className="size-1.5 bg-green-400 rounded-full animate-bounce shadow-sm shadow-green-400/50" style={{ animationDelay: '150ms' }} />
                          <div className="size-1.5 bg-green-400 rounded-full animate-bounce shadow-sm shadow-green-400/50" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-green-400/80 font-medium font-mono">PROCESSING...</span>
                      </div>
                    )}
                    {status === 'complete' && (
                      <div className="mt-1">
                        <span className="text-xs text-green-400 font-medium font-mono">✓ COMPLETE</span>
                      </div>
                    )}
                    {status === 'error' && (
                      <div className="mt-1">
                        <span className="text-xs text-red-400 font-medium font-mono">✗ ERROR</span>
                      </div>
                    )}
                    {status === 'timeout' && (
                      <div className="mt-1">
                        <span className="text-xs text-yellow-400 font-medium font-mono">⏱️ TIMEOUT</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
AgentBuilderLoading.displayName = 'AgentBuilderLoading';

// Agent Summary Component
const AgentSummary = memo(({ result, isReadonly, chatId }: { result: any; isReadonly: boolean; chatId: string }) => {
  const { setArtifact, setMetadata } = useArtifact();
  
  // Fetch the document to get the latest agent data
  const { data: documents, isLoading: isDocumentsFetching, error } = useSWR<Array<Document>>(
    result?.id ? `/api/document?id=${result.id}` : null,
    fetcher
  );

  // Parse agent data from document content
  const agentData = useMemo(() => {
    const content = documents?.[0]?.content;
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      
      // Check if this is a timeout state document
      if (parsed.status === 'timeout' || parsed._timeout) {
        console.log('🔄 Detected timeout state in document:', {
          status: parsed.status,
          hasTimeoutMeta: !!parsed._timeout,
          canResume: parsed.canResume || parsed._timeout?.canResume
        });
        
        // If it has partial agent data, use that
        if (parsed.partialData) {
          return {
            ...parsed.partialData,
            _timeout: parsed._timeout || {
              status: 'timeout',
              canResume: parsed.canResume,
              timeoutTimestamp: parsed.timeoutTimestamp,
              originalCommand: parsed.originalCommand
            }
          };
        }
        
        // If it's already a valid agent structure with timeout metadata
        if (parsed.name && (parsed.models || parsed.actions)) {
          return parsed;
        }
        
        // Otherwise, it's just timeout metadata
        return null;
      }
      
      return parsed;
    } catch (e) {
      console.error('Failed to parse agent data:', e);
      return null;
    }
  }, [documents]);
  
  const openAgentBuilder = () => {
    if (agentData && result?.id) {
      setArtifact({
        documentId: result.id,
        title: agentData.name || result.title || 'Agent',
        kind: 'agent',
        content: documents?.[0]?.content || '',
        isVisible: true,
        status: 'idle',
        boundingBox: {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        },
      });
    }
  };

  if (isDocumentsFetching) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <LoaderIcon size={16} />
        Loading agent data...
      </div>
    );
  }

  if (error || !agentData) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <WarningIcon size={16} />
        Failed to load agent data
      </div>
    );
  }

  const isSuccess = !!agentData; // Consider it success if we have valid agent data
  const isTimeoutState = agentData?._timeout || agentData?.status === 'timeout';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-black border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-6 border-b border-green-500/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="size-12 bg-green-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-green-500/20">
                <span className="text-green-400 text-xl">
                  {isTimeoutState ? '⏱️' : '🤖'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-green-100">
                  {agentData.name}
                  {isTimeoutState && <span className="text-yellow-400 ml-2">(Timeout)</span>}
                </h3>
                <p className="text-green-300/70 text-sm">
                  {isTimeoutState ? 'Building process timed out - can be resumed' : (agentData.domain || 'AI Agent System')}
                </p>
              </div>
            </div>
            {isSuccess && !isTimeoutState && (
              <div className="bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full shrink-0 border border-green-500/30">
                <span className="text-green-200 text-xs font-medium font-mono">✅ READY</span>
              </div>
            )}
            {isTimeoutState && (
              <div className="bg-yellow-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full shrink-0 border border-yellow-500/30">
                <span className="text-yellow-200 text-xs font-medium font-mono">⏱️ TIMEOUT</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-black">
          {/* Timeout Warning */}
          {isTimeoutState && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-yellow-400 text-lg">⏱️</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-100 text-sm mb-2">Building Process Timed Out</h4>
                  <p className="text-yellow-300/80 text-sm mb-2">
                    The agent building process was interrupted but your progress has been saved.
                  </p>
                  {agentData._timeout?.originalCommand && (
                    <p className="text-yellow-300/60 text-xs">
                      <strong>Original request:</strong> {agentData._timeout.originalCommand}
                    </p>
                  )}
                  {agentData._timeout?.timeoutTimestamp && (
                    <p className="text-yellow-300/60 text-xs mt-1">
                      <strong>Timeout occurred:</strong> {new Date(agentData._timeout.timeoutTimestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {agentData.description && (
            <div className="bg-zinc-900/50 border border-green-500/10 rounded-xl p-4">
              <p className="text-green-200/80 text-sm leading-relaxed">{agentData.description}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="size-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center border border-green-500/30">
                <div className="text-green-400">
                  <BoxIcon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{agentData.models?.length || 0}</div>
              <div className="text-xs text-green-300 font-mono">MODELS</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="size-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center border border-green-500/30">
                <div className="text-green-400">
                  <PlayIcon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{agentData.actions?.length || 0}</div>
              <div className="text-xs text-green-300 font-mono">ACTIONS</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="size-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center border border-green-500/30">
                <div className="text-green-400">
                  <RouteIcon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{agentData.schedules?.length || 0}</div>
              <div className="text-xs text-green-300 font-mono">SCHEDULES</div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <h4 className="font-semibold text-green-100 text-sm font-mono">🚀 CAPABILITIES</h4>
            <div className="space-y-2">
              {agentData.models?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="size-2 bg-green-400 rounded-full shrink-0 shadow-sm shadow-green-400/50" />
                  <span className="text-green-200/80 font-mono">
                    <strong className="text-green-100">{agentData.models.length}</strong> data models
                  </span>
                </div>
              )}
              {agentData.actions?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="size-2 bg-green-400 rounded-full shrink-0 shadow-sm shadow-green-400/50" />
                  <span className="text-green-200/80 font-mono">
                    <strong className="text-green-100">{agentData.actions.length}</strong> automated workflows
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <div className="size-2 bg-green-400 rounded-full shrink-0 shadow-sm shadow-green-400/50" />
                <span className="text-green-200/80 font-mono">Enterprise-grade architecture</span>
              </div>
            </div>
          </div>

          {/* Quick Preview */}
          {(agentData.models?.length > 0 || agentData.actions?.length > 0) && (
            <div className="space-y-4">
              {/* Models Preview */}
              {agentData.models?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-100 text-sm font-mono">📊 MODELS</h4>
                  <div className="flex flex-wrap gap-2">
                    {agentData.models.slice(0, 4).map((model: any, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 text-xs rounded-lg font-mono"
                      >
                        {model.name}
                      </span>
                    ))}
                    {agentData.models.length > 4 && (
                      <span className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs rounded-lg font-mono">
                        +{agentData.models.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Preview */}
              {agentData.actions?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-100 text-sm font-mono">⚡ ACTIONS</h4>
                  <div className="space-y-2">
                    {agentData.actions.slice(0, 2).map((action: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-green-500/10 rounded-xl">
                        <div className="size-6 bg-green-500/20 rounded-md flex items-center justify-center shrink-0 border border-green-500/30">
                          <div className="text-green-400">
                            <PlayIcon size={12} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-green-100 truncate font-mono">{action.name}</div>
                          <div className="text-xs text-green-300/70 truncate font-mono">{action.description}</div>
                        </div>
                      </div>
                    ))}
                    {agentData.actions.length > 2 && (
                      <div className="text-xs text-zinc-500 text-center py-1 font-mono">
                        +{agentData.actions.length - 2} more workflows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && result.content && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-300 text-sm font-mono">{result.content}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isTimeoutState ? (
              <>
                <Button
                  onClick={() => {
                    // Trigger resume by sending a continue message
                    const retryEvent = new CustomEvent('agent-builder-auto-retry', {
                      detail: { 
                        documentId: result.id,
                        command: agentData._timeout?.originalCommand || 'Resume agent building',
                        operation: 'resume'
                      }
                    });
                    window.dispatchEvent(retryEvent);
                    console.log('Manual resume agent building clicked from AgentSummary');
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black border-0 rounded-xl h-11 shadow-lg shadow-yellow-500/20 font-mono font-medium"
                  disabled={isReadonly}
                >
                  <span className="mr-2">⏯️</span>
                  <span>RESUME BUILDING</span>
                </Button>
                <Button
                  onClick={openAgentBuilder}
                  variant="outline"
                  className="sm:w-auto border-green-500/30 text-green-300 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/50 rounded-xl h-11 font-mono"
                  disabled={isReadonly}
                >
                  <CodeIcon size={16} />
                  <span className="ml-2">VIEW PROGRESS</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={openAgentBuilder}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black border-0 rounded-xl h-11 shadow-lg shadow-green-500/20 font-mono font-medium"
                  disabled={isReadonly}
                >
                  <CodeIcon size={16} />
                  <span className="ml-2">OPEN BUILDER</span>
                </Button>
                <Button
                  variant="outline"
                  className="sm:w-auto border-green-500/30 text-green-300 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/50 rounded-xl h-11 font-mono"
                  onClick={() => {
                    const agentJson = JSON.stringify(agentData, null, 2);
                    navigator.clipboard.writeText(agentJson);
                  }}
                >
                  📋 COPY CONFIG
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-green-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-green-400/70 font-mono">
              <span>CREATED: {new Date(agentData.createdAt).toLocaleDateString()}</span>
              <span className="text-green-400">READY FOR DEPLOYMENT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
AgentSummary.displayName = 'AgentSummary';

// Agent Builder with Streaming Summary Component
const AgentBuilderWithStreamingSummary = memo(({ args, message, isReadonly, chatId, isLoading }: { 
  args: any; 
  message?: UIMessage; 
  isReadonly: boolean; 
  chatId: string; 
  isLoading?: boolean;
}) => {
  const { artifact } = useArtifact();
  
  // Check if the message has a completed agentBuilder tool result
  const hasCompletedResult = message?.parts?.some(part => 
    part.type === 'tool-invocation' && 
    part.toolInvocation?.toolName === 'agentBuilder' && 
    part.toolInvocation?.state === 'result'
  );
  
  // Don't show partial summary if we have a completed result
  if (hasCompletedResult) {
    return <AgentBuilderLoading args={args} message={message} isLoading={false} />;
  }
  
  // Show partial agent summary during streaming if we have agent data
  const showPartialSummary = artifact?.kind === 'agent' && 
                             artifact?.content && 
                             artifact?.status === 'streaming';
  
  let partialResult = null;
  if (showPartialSummary) {
    try {
      const agentData = JSON.parse(artifact.content);
      // Only show if we have some meaningful data (not just defaults)
      if (agentData && (
        (agentData.name && agentData.name !== 'New Agent' && agentData.name !== 'AI Agent System') ||
        (agentData.models && agentData.models.length > 0) ||
        (agentData.actions && agentData.actions.length > 0)
      )) {
        // Create a partial result object for the AgentSummary component
        partialResult = {
          id: artifact.documentId,
          title: agentData.name || 'AI Agent System',
          kind: 'agent',
          content: `Building in progress: ${agentData.name || 'AI Agent System'}`
        };
      }
    } catch (e) {
      // Ignore parsing errors during streaming
    }
  }
  
  return (
    <div>
      <AgentBuilderLoading args={args} message={message} isLoading={isLoading} />
      {partialResult && (
        <div className="mt-4">
          <AgentSummary result={partialResult} isReadonly={isReadonly} chatId={chatId} />
        </div>
      )}
    </div>
  );
});
AgentBuilderWithStreamingSummary.displayName = 'AgentBuilderWithStreamingSummary';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'agentBuilder' ? (
                        <AgentBuilderWithStreamingSummary 
                          args={args} 
                          message={message} 
                          isReadonly={isReadonly} 
                          chatId={chatId} 
                          isLoading={isLoading}
                        />
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'agentBuilder' ? (
                        <AgentSummary result={result} isReadonly={isReadonly} chatId={chatId} />
                      ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      )}
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
