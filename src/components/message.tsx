'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import type { Vote } from '@/lib/db/schema';
import type { Document } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon, PlayIcon, CodeIcon, BoxIcon, RouteIcon, WarningIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText, fetcher } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useArtifact } from '@/hooks/use-artifact';
import useSWR from 'swr';
import { LoaderIcon } from './icons';
import { MobileAppDemo } from '@/artifacts/agent/components/MobileAppDemo';

// Agent Builder Loading Component
const AgentBuilderLoading = memo(({ args, message, isLoading, metadata, persistedMetadata }: { 
  args: any; 
  message?: UIMessage; 
  isLoading?: boolean;
  metadata: any;
  persistedMetadata: any;
}) => {
  const { artifact, setArtifact } = useArtifact();
  
  // Fetch the document to get persisted metadata
  const { data: documents } = useSWR<Array<Document>>(
    args?.documentId ? `/api/document?id=${args.documentId}` : null,
    fetcher
  );

  // Get persisted metadata from document
  const persistedMetadataFromDoc = useMemo(() => {
    const document = documents?.[0];
    if (document?.metadata && typeof document.metadata === 'object') {
      return document.metadata as any;
    }
    return null;
  }, [documents]);
  
  const steps = [
    { id: 'step0', label: 'Comprehensive Analysis' },
    { id: 'step1', label: 'Database Generation' },
    { id: 'step2', label: 'Action Generation' },
    { id: 'step3', label: 'Schedule Generation' },
    { id: 'step4', label: 'Deployment' },
    { id: 'complete', label: 'Complete' }
  ];

  // Check if we have existing agent context
  const existingAgentInfo = useMemo(() => {
    console.log('🔍 Checking for existing agent context...', {
      metadata: metadata ? Object.keys(metadata) : 'none',
      persistedMetadata: persistedMetadata ? Object.keys(persistedMetadata) : 'none',
      args: args ? Object.keys(args) : 'none'
    });

    // First check if this is an update operation by looking at the tool invocation in the message
    if (message?.parts) {
      for (const part of message.parts) {
        if (part.type === 'tool-invocation' && part.toolInvocation?.toolName === 'agentBuilder') {
          const toolArgs = part.toolInvocation.args;
          if (toolArgs?.operation === 'update' || toolArgs?.operation === 'extend') {
            console.log('✅ Found update operation in tool invocation');
            return {
              isUpdate: true,
              operation: toolArgs.operation,
              documentId: args?.documentId || 'Unknown',
              title: 'Existing Agent Document',
              source: 'tool-invocation'
            };
          }
        }
      }
    }
    
    // Check metadata for existing agent info (real-time streaming state)
    if (metadata?.existingAgentId || persistedMetadata?.existingAgentId) {
      const documentId = metadata?.existingAgentId || persistedMetadata?.existingAgentId;
      const title = metadata?.existingAgentTitle || persistedMetadata?.existingAgentTitle || 'Existing Agent Document';
      const source = metadata?.existingAgentId ? 'real-time-metadata' : 'persisted-metadata';
      
      console.log(`✅ Found existing agent in ${source}:`, { documentId, title });
      return {
        isUpdate: true,
        operation: 'update',
        documentId,
        title,
        source
      };
    }
    
    // Check args for existing agent context
    if (args?.existingAgentId || args?.operation === 'update') {
      console.log('✅ Found existing agent in args');
      return {
        isUpdate: true,
        operation: args.operation || 'update',
        documentId: args.existingAgentId || args.documentId || 'Unknown',
        title: args.existingAgentTitle || 'Existing Agent Document',
        source: 'args'
      };
    }
    
    // Check if we have a document ID which indicates existing document
    if (args?.documentId && args?.operation !== 'create') {
      console.log('✅ Found document ID in args (not create operation)');
      return {
        isUpdate: true,
        operation: 'update',
        documentId: args.documentId,
        title: 'Agent Document',
        source: 'document-id'
      };
    }
    
    console.log('ℹ️ No existing agent context found - creating new agent');
    return null;
  }, [metadata, persistedMetadata, args, message]);

  // Get step status from metadata or tool call parts or persisted metadata
  const getStepStatus = useCallback((stepId: string) => {
    console.log(`🔍 Getting step status for: ${stepId}`);
    
    // Define step order for position-based status determination
    const stepOrder = ['step0', 'step1', 'step2', 'step3', 'step4', 'complete'];
    
    // Check for step data in message parts (for streaming state)
    if (message?.parts) {
      for (const part of message.parts) {
        if (part.type === 'tool-invocation' && part.toolInvocation?.toolName === 'agentBuilder') {
          // Check if this part has step data
          const content = part.toolInvocation.state === 'call' ? part.toolInvocation.args : 
                          part.toolInvocation.state === 'result' ? part.toolInvocation.result : null;
          
          if (content && typeof content === 'object') {
            // Check for step progress in the content
            if (content.stepProgress?.[stepId]) {
              console.log(`✅ Found step status in tool invocation content: ${stepId} = ${content.stepProgress[stepId]}`);
              return content.stepProgress[stepId];
            }
            if (content.currentStep === stepId) {
              console.log(`✅ Found current step in tool invocation: ${stepId} = processing`);
              return 'processing';
            }
          }
        }
      }
    }
    
    // Check real-time metadata first (active streaming state)
    if (metadata?.stepProgress?.[stepId]) {
      console.log(`✅ Found step status in real-time metadata: ${stepId} = ${metadata.stepProgress[stepId]}`);
      return metadata.stepProgress[stepId];
    }
    
    if (metadata?.currentStep === stepId) {
      console.log(`✅ Found current step in real-time metadata: ${stepId} = processing`);
      return 'processing';
    }
    
    // Fallback to persisted metadata (recovery state)
    if (persistedMetadata?.stepProgress?.[stepId]) {
      console.log(`✅ Found step status in persisted metadata: ${stepId} = ${persistedMetadata.stepProgress[stepId]}`);
      return persistedMetadata.stepProgress[stepId];
    }

    if (persistedMetadata?.currentStep === stepId) {
      console.log(`✅ Found current step in persisted metadata: ${stepId} = processing`);
      return 'processing';
    }

    // Check document metadata from database
    if (persistedMetadataFromDoc?.stepProgress?.[stepId]) {
      console.log(`✅ Found step status in document metadata: ${stepId} = ${persistedMetadataFromDoc.stepProgress[stepId]}`);
      return persistedMetadataFromDoc.stepProgress[stepId];
    }

    if (persistedMetadataFromDoc?.currentStep === stepId) {
      console.log(`✅ Found current step in document metadata: ${stepId} = processing`);
      return 'processing';
    }

    // Check if all steps are complete (for completed agents)
    const allMainStepsComplete = ['step0', 'step1', 'step2', 'step3', 'step4'].every(step => {
      return (metadata?.stepProgress && metadata.stepProgress[step] === 'complete') ||
             (persistedMetadata?.stepProgress && persistedMetadata.stepProgress[step] === 'complete') ||
             (persistedMetadataFromDoc?.stepProgress && persistedMetadataFromDoc.stepProgress[step] === 'complete');
    });

    if (allMainStepsComplete && stepId === 'complete') {
      console.log(`✅ All main steps complete - marking ${stepId} as complete`);
      return 'complete';
    }

    // Determine status based on current step position
    const currentStepIndex = (metadata?.currentStep || persistedMetadata?.currentStep || persistedMetadataFromDoc?.currentStep) ?
      stepOrder.indexOf(metadata?.currentStep || persistedMetadata?.currentStep || persistedMetadataFromDoc?.currentStep) : -1;
    const stepIndex = stepOrder.indexOf(stepId);
    
    // If we have explicit metadata or are actively streaming or have persisted state
    if (metadata?.currentStep || metadata?.stepProgress || 
        persistedMetadata?.currentStep || persistedMetadata?.stepProgress ||
        persistedMetadataFromDoc?.currentStep || persistedMetadataFromDoc?.stepProgress) {
      if (stepIndex < currentStepIndex) {
        console.log(`✅ Step ${stepId} is before current step - marking as complete`);
        return 'complete';
      } else if (stepIndex === currentStepIndex) {
        console.log(`✅ Step ${stepId} is current step - marking as processing`);
        return 'processing';
      }
    }
    
    console.log(`ℹ️ No status found for step ${stepId} - marking as pending`);
    return 'pending';
  }, [message, metadata, persistedMetadata, persistedMetadataFromDoc]);

  // Get step message from metadata or tool call data or persisted metadata
  const getStepMessage = (stepId: string) => {
    // Check metadata first (real-time)
    if (metadata?.stepMessages?.[stepId]) {
      return metadata.stepMessages[stepId];
    }
    
    // Check persisted metadata
    if (persistedMetadata?.stepMessages?.[stepId]) {
      return persistedMetadata.stepMessages[stepId];
    }
    
    // Check document metadata from database
    if (persistedMetadataFromDoc?.stepMessages?.[stepId]) {
      return persistedMetadataFromDoc.stepMessages[stepId];
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
    const hasProcessingStep = steps.some(step => {
      const status = getStepStatus(step.id);
      return status === 'processing';
    });
    
    const allStepsComplete = steps.every(step => {
      const status = getStepStatus(step.id);
      return status === 'complete';
    });
    
    return !allStepsComplete && (hasProcessingStep || persistedMetadata.currentStep);
  }, [persistedMetadata, steps, getStepStatus]);

  // Determine if we're actively processing - check if any step is processing or if we're loading
  const isProcessing = useMemo(() => {
    if (isLoading) return true;
    
    // Check if any step is currently processing
    const hasProcessingStep = steps.some(step => {
      const status = getStepStatus(step.id);
      return status === 'processing';
    });
    
    // Check if we have an active current step that's not complete
    const currentStep = metadata?.currentStep || persistedMetadata?.currentStep || persistedMetadataFromDoc?.currentStep;
    if (currentStep && currentStep !== 'complete') {
      const currentStepStatus = getStepStatus(currentStep);
      if (currentStepStatus === 'processing') {
        return true;
      }
    }
    
    return hasProcessingStep;
  }, [isLoading, steps, metadata, persistedMetadata, persistedMetadataFromDoc, getStepStatus]);

  // Check if all steps are complete and update artifact status
  const allStepsComplete = useMemo(() => {
    const stepOrder = ['step0', 'step1', 'step2', 'step3', 'step4'];
    
    const isComplete = stepOrder.every(step => {
      return (metadata?.stepProgress && metadata.stepProgress[step] === 'complete') ||
             (persistedMetadata?.stepProgress && persistedMetadata.stepProgress[step] === 'complete') ||
             (persistedMetadataFromDoc?.stepProgress && persistedMetadataFromDoc.stepProgress[step] === 'complete');
    });
    
    console.log('🔍 Checking if all steps are complete:', {
      isComplete,
      stepProgress: {
        metadata: metadata?.stepProgress,
        persistedMetadata: persistedMetadata?.stepProgress,
        persistedMetadataFromDoc: persistedMetadataFromDoc?.stepProgress
      }
    });
    
    return isComplete;
  }, [metadata?.stepProgress, persistedMetadata?.stepProgress, persistedMetadataFromDoc?.stepProgress]);

  // Update artifact status when all steps are complete
  useEffect(() => {
    if (allStepsComplete && artifact?.status === 'streaming') {
      console.log('🎉 All steps completed - updating artifact status to idle from message component');
      console.log('🔍 Current metadata before completion:', {
        metadata: metadata?.stepProgress,
        persistedMetadata: persistedMetadata?.stepProgress,
        persistedMetadataFromDoc: persistedMetadataFromDoc?.stepProgress
      });
      
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: 'idle',
        isVisible: true,
      }));
      
      // Note: Step progress persistence is handled by the backend when it sends the final 'complete' step
      // The agent builder saves the final stepMetadata to the database via saveDocumentWithContent
      // This ensures step progress survives artifact status changes and page reloads
      console.log('✅ Artifact status updated to idle - step progress is persisted by backend');
    }
  }, [allStepsComplete, artifact?.status, setArtifact]);

  // Log step progress changes for debugging
  useEffect(() => {
    console.log('📊 Step progress update:', {
      metadata: metadata?.stepProgress,
      persistedMetadata: persistedMetadata?.stepProgress,
      persistedMetadataFromDoc: persistedMetadataFromDoc?.stepProgress,
      allStepsComplete
    });
  }, [metadata?.stepProgress, persistedMetadata?.stepProgress, persistedMetadataFromDoc?.stepProgress, allStepsComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-black border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-6 border-b border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-green-500/20">
              {isProcessing ? (
                <div className="animate-spin">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full" />
                </div>
              ) : (
                <span className="text-green-400 text-xl">🤖</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-green-100">
                {isProcessing ? 'Building AI Agent' : canResume ? 'Resume Agent Building' : 'AI Agent Builder'}
              </h3>
              <p className="text-green-300/70 text-sm">
                {isProcessing ? 'Creating your intelligent automation system...' : 
                 canResume ? 'Continue building your interrupted agent system' : 
                 'Ready to build your agent system'}
              </p>
            </div>
            {canResume && !isProcessing && (
              <button 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  // Trigger resume by sending a continue message
                  // This would need to be implemented in the parent component
                  console.log('Resume agent building clicked');
                }}
              >
                Resume Building
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
            {existingAgentInfo && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 text-sm">📝</span>
                  <span className="text-blue-300 text-sm font-medium">
                    {existingAgentInfo.operation === 'update' ? 'Updating Existing Agent' :
                     existingAgentInfo.operation === 'extend' ? 'Extending Existing Agent' :
                     existingAgentInfo.operation === 'resume' ? 'Resuming Agent Build' :
                     'Modifying Existing Agent'}
                  </span>
                </div>
                <p className="text-xs text-blue-200/80">
                  <span className="font-medium">Document:</span> {existingAgentInfo.title}
                </p>
                <p className="text-xs text-blue-200/60 font-mono">
                  ID: {existingAgentInfo.documentId}
                </p>
                <p className="text-xs text-blue-200/70 mt-1">
                  ✅ Found existing document - will merge changes intelligently
                </p>
              </div>
            )}
            {!existingAgentInfo && (
              <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 text-sm">✨</span>
                  <span className="text-green-300 text-sm font-medium">Creating New Agent</span>
                </div>
                <p className="text-xs text-green-200/70">
                  🆕 Building a brand new agent system from scratch
                </p>
              </div>
            )}
            {canResume && !isProcessing && (
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300">
                  ⚠️ Previous building process was interrupted. You can resume from where it left off.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              const message = getStepMessage(step.id);
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border",
                    {
                      'bg-green-500/20 border-green-500/40': status === 'complete',
                      'bg-green-400/10 border-green-400/30': status === 'processing',
                      'bg-red-500/20 border-red-500/40': status === 'error',
                      'bg-zinc-800/50 border-zinc-700/50': status === 'pending'
                    }
                  )}>
                    {status === 'complete' ? (
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm shadow-green-400/50" />
                    ) : status === 'processing' ? (
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
                    ) : status === 'error' ? (
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                    ) : (
                      <div className="w-3 h-3 bg-zinc-600 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm transition-colors duration-300 font-mono",
                      {
                        'text-green-300': status === 'complete',
                        'text-green-200': status === 'processing',
                        'text-red-300': status === 'error',
                        'text-zinc-500': status === 'pending'
                      }
                    )}>
                      {message || step.label}
                    </span>
                    {status === 'processing' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce shadow-sm shadow-green-400/50" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce shadow-sm shadow-green-400/50" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce shadow-sm shadow-green-400/50" style={{ animationDelay: '300ms' }} />
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
  const { setArtifact: setSummaryArtifact } = useArtifact();
  
  // Fetch the document to get the latest agent data
  const { data: documents, isLoading: isDocumentsFetching, error } = useSWR<Array<Document>>(
    result?.id ? `/api/document?id=${result.id}` : null,
    fetcher
  );

  // Helper function to check if a string looks like JSON
  const isValidJSON = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  };

  // Parse agent data from document content or fallback to result content
  const agentData = useMemo(() => {
    // First try to use document content (most up-to-date)
    const documentContent = documents?.[0]?.content;
    if (documentContent) {
      try {
        return JSON.parse(documentContent);
      } catch (e) {
        console.error('Failed to parse document content:', e);
      }
    }
    
    // Fallback to result content if document doesn't exist yet or parsing failed
    if (result?.content) {
      try {
        // If result.content is already an object, use it directly
        if (typeof result.content === 'object') {
          return result.content;
        }
        // If it's a string, check if it looks like JSON before parsing
        if (typeof result.content === 'string') {
          if (isValidJSON(result.content)) {
            return JSON.parse(result.content);
          } else {
            console.warn('Result content does not appear to be valid JSON, skipping parse:', result.content.substring(0, 100) + '...');
          }
        }
      } catch (e) {
        console.error('Failed to parse result content:', e);
      }
    }
    
    return null;
  }, [documents, result?.content]);

  // Note: Avatar and theme data is now stored directly in document content
  // No need to fetch separate mindmap state for UI preferences

  // Extract UI preferences from agent data and document content
  const uiPreferences = useMemo(() => {
    const document = documents?.[0];
    
    // Extract data directly from agent data (which comes from document content)
    console.log('agentData: ', agentData, document);
    
    // Extract name - priority: agentData.name > document.title > result.title > 'AI Agent System'
    const name = agentData?.avatar?.name || 
                 document?.title || 
                 result?.title || 
                 'AI Agent System';
    
    // Extract avatar info directly from agentData
    const avatar = agentData?.avatar || null;
    
    // Extract theme - priority: agentData.theme > 'green'
    const theme = agentData?.theme || 'green';
    
    // Extract domain - fallback to document title or default
    const domain = agentData?.domain || document?.title || 'AI Agent System';

    console.log('🎨 Extracted UI preferences from document content:', {
      name,
      theme,
      avatar: avatar ? {
        type: avatar.type,
        customType: avatar.customType,
        hasUnicornParts: !!avatar.unicornParts,
        personality: avatar.personality
      } : 'None',
      domain,
      sources: {
        agentDataName: agentData?.name,
        documentTitle: document?.title,
        resultTitle: result?.title,
        agentDataTheme: agentData?.theme,
        hasAgentData: !!agentData,
        hasAvatar: !!avatar
      }
    });

    return {
      name,
      theme,
      avatar,
      domain
    };
  }, [agentData, documents, result]);
  
  const openAgentBuilder = () => {
    if (agentData && result?.id) {
      setSummaryArtifact({
        documentId: result.id,
        title: uiPreferences.name,
        kind: 'agent',
        content: documents?.[0]?.content || result?.content || '',
        isVisible: true,
        status: 'idle',
        boundingBox: {
          top: 0,
          left: 0,
          width: typeof window !== 'undefined' ? window.innerWidth : 1920,
          height: typeof window !== 'undefined' ? window.innerHeight : 1080,
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

  // Only show error if both document fetch failed AND we don't have result content
  if (error && !result?.content) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <WarningIcon size={16} />
        Failed to load agent data
      </div>
    );
  }

  // If we don't have agent data from either source, show error
  if (!agentData) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <WarningIcon size={16} />
        No agent data available
      </div>
    );
  }

  const isSuccess = !!agentData; // Consider it success if we have valid agent data

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-black border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-6 border-b border-green-500/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-green-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border border-green-500/20">
                <span className="text-green-400 text-xl">🤖</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-green-100">{uiPreferences.name}</h3>
                <p className="text-green-300/70 text-sm">{uiPreferences.domain}</p>
                {!documents?.[0] && (
                  <p className="text-yellow-400/70 text-xs mt-1">⚡ Live preview - building in progress</p>
                )}
              </div>
            </div>
            {isSuccess && (
              <div className="bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex-shrink-0 border border-green-500/30">
                <span className="text-green-200 text-xs font-medium font-mono">
                  {documents?.[0] ? '✅ READY' : '🔄 BUILDING'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-black">
          {/* Description */}
          {agentData.description && (
            <div className="bg-zinc-900/50 border border-green-500/10 rounded-xl p-4">
              <p className="text-green-200/80 text-sm leading-relaxed">{agentData.description}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center border border-green-500/30">
                <div className="text-green-400">
                  <BoxIcon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{agentData.models?.length || 0}</div>
              <div className="text-xs text-green-300 font-mono">MODELS</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center border border-green-500/30">
                <div className="text-green-400">
                  <PlayIcon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{agentData.actions?.length || 0}</div>
              <div className="text-xs text-green-300 font-mono">ACTIONS</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center border border-green-500/30">
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
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 shadow-sm shadow-green-400/50" />
                  <span className="text-green-200/80 font-mono">
                    <strong className="text-green-100">{agentData.models.length}</strong> data models
                  </span>
                </div>
              )}
              {agentData.actions?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 shadow-sm shadow-green-400/50" />
                  <span className="text-green-200/80 font-mono">
                    <strong className="text-green-100">{agentData.actions.length}</strong> automated workflows
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 shadow-sm shadow-green-400/50" />
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
                        <div className="w-6 h-6 bg-green-500/20 rounded-md flex items-center justify-center flex-shrink-0 border border-green-500/30">
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

          {/* App Preview */}
          <div className="space-y-3">
            <h4 className="font-semibold text-green-100 text-sm font-mono">📱 APP PREVIEW</h4>
            <div className="bg-zinc-900/30 border border-green-500/10 rounded-xl p-4">
              <p className="text-green-200/70 text-xs font-mono mb-4 text-center">
                Interactive preview of your deployed application
              </p>
              <div className="flex justify-center">
                <MobileAppDemo 
                  agentData={{
                    ...agentData,
                    name: uiPreferences.name,
                    theme: uiPreferences.theme,
                    avatar: uiPreferences.avatar
                  }} 
                  currentTheme={uiPreferences.theme as any || 'green'}
                  viewMode="mobile"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
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
                const agentJson = JSON.stringify({
                  ...agentData,
                  name: uiPreferences.name,
                  theme: uiPreferences.theme,
                  avatar: uiPreferences.avatar
                }, null, 2);
                navigator.clipboard.writeText(agentJson);
              }}
            >
              📋 COPY CONFIG
            </Button>
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
const AgentBuilderWithStreamingSummary = memo(({ args, message, isLoading, isReadonly, chatId }: {
  args: any;
  message: UIMessage;
  isLoading: boolean;
  isReadonly: boolean;
  chatId: string;
}) => {
  const { artifact, metadata, setMetadata } = useArtifact();
  
  // Check if this is a new agent building request
  const isNewRequest = useMemo(() => {
    // If we have a new documentId or the artifact status is idle (not streaming), it's likely a new request
    const hasNewDocumentId = args?.documentId && args.documentId !== artifact?.documentId;
    const isArtifactIdle = artifact?.status === 'idle';
    const isStartingNewBuild = isLoading && !metadata?.currentStep;
    
    console.log('🔍 Checking if this is a new agent building request:', {
      hasNewDocumentId,
      isArtifactIdle,
      isStartingNewBuild,
      argsDocumentId: args?.documentId,
      artifactDocumentId: artifact?.documentId,
      artifactStatus: artifact?.status,
      hasCurrentStep: !!metadata?.currentStep
    });
    
    return hasNewDocumentId || (isArtifactIdle && isStartingNewBuild);
  }, [args?.documentId, artifact?.documentId, artifact?.status, isLoading, metadata?.currentStep]);
  
  // Clear metadata when starting a new request
  useEffect(() => {
    if (isNewRequest && metadata?.stepProgress) {
      console.log('🔄 Clearing previous step progress for new agent building request');
      setMetadata(null);
    }
  }, [isNewRequest, metadata?.stepProgress, setMetadata]);
  
  // Use current metadata as persistedMetadata to preserve step progress
  const persistedMetadata = useMemo(() => {
    // If we have step progress in metadata, use it as persisted data
    if (metadata?.stepProgress || metadata?.currentStep) {
      console.log('✅ Using current metadata as persistedMetadata:', {
        stepProgress: metadata.stepProgress,
        currentStep: metadata.currentStep
      });
      return metadata;
    }
    return null;
  }, [metadata]);
  
  // Check if the message has a completed agentBuilder tool result
  const hasCompletedResult = message?.parts?.some(part => 
    part.type === 'tool-invocation' && 
    part.toolInvocation?.toolName === 'agentBuilder' && 
    part.toolInvocation?.state === 'result'
  );
  
  // Check if we should show the agent summary after completion
  // This handles both initial builds and secondary edits
  const shouldShowCompletedSummary = hasCompletedResult && 
    artifact?.kind === 'agent' && 
    artifact?.content;
  
  // Don't show streaming summary if we have a completed result, but do show completed summary
  if (hasCompletedResult && !shouldShowCompletedSummary) {
    return <AgentBuilderLoading args={args} message={message} isLoading={false} metadata={metadata} persistedMetadata={persistedMetadata} />;
  }
  
  // Show completed agent summary if we have a finished result with agent data
  if (shouldShowCompletedSummary) {
    try {
      const agentData = JSON.parse(artifact.content);
      if (agentData && (agentData.models || agentData.actions || agentData.schedules)) {
        const completedResult = {
          id: artifact.documentId,
          title: agentData.name || 'AI Agent System',
          kind: 'agent',
          content: artifact.content
        };
        
        return (
          <div>
            <AgentBuilderLoading args={args} message={message} isLoading={false} metadata={metadata} persistedMetadata={persistedMetadata} />
            <div className="mt-4">
              <AgentSummary result={completedResult} isReadonly={isReadonly} chatId={chatId} />
            </div>
          </div>
        );
      }
    } catch (e) {
      console.error('Failed to parse completed agent data:', e);
    }
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
          content: artifact.content // Pass the actual agent JSON, not a status message
        };
      }
    } catch (e) {
      // Ignore parsing errors during streaming
    }
  }
  
  return (
    <div>
      <AgentBuilderLoading args={args} message={message} isLoading={isLoading} metadata={metadata} persistedMetadata={persistedMetadata} />
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