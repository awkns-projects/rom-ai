'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon, PlayIcon, CodeIcon, BoxIcon, RouteIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useArtifact } from '@/hooks/use-artifact';

// Agent Builder Loading Component
const AgentBuilderLoading = memo(({ args }: { args: any }) => {
  const { metadata } = useArtifact();
  
  // Define the steps that match the agent builder process
  const steps = [
    {
      id: 'overview',
      label: 'Analyzing requirements and planning architecture...',
      icon: '🎯',
      color: 'blue'
    },
    {
      id: 'models',
      label: 'Creating database models and relationships...',
      icon: '🗄️',
      color: 'green'
    },
    {
      id: 'enums',
      label: 'Defining enumerations and controlled vocabularies...',
      icon: '🔢',
      color: 'purple'
    },
    {
      id: 'actions',
      label: 'Building intelligent workflows and automation...',
      icon: '⚡',
      color: 'orange'
    },
    {
      id: 'integration',
      label: 'Integrating components and finalizing system...',
      icon: '🔧',
      color: 'indigo'
    }
  ];

  // Get step status from metadata
  const getStepStatus = (stepId: string) => {
    // If no metadata or stepProgress exists, show initial state
    if (!metadata?.stepProgress) {
      return 'pending';
    }
    
    const status = metadata.stepProgress[stepId as keyof typeof metadata.stepProgress];
    if (status === 'complete') return 'complete';
    if (status === 'processing') return 'processing';
    if (status === 'error') return 'error';
    
    // Check if this is the current step
    if (metadata.currentStep === stepId) return 'processing';
    
    return 'pending';
  };

  // Get step message from metadata
  const getStepMessage = (stepId: string) => {
    const customMessage = metadata?.stepMessages?.[stepId];
    if (customMessage) return customMessage;
    
    const step = steps.find(s => s.id === stepId);
    return step?.label || '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-black border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-6 border-b border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-green-500/20">
              <div className="animate-spin">
                <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-green-100">Building AI Agent</h3>
              <p className="text-green-300/70 text-sm">Creating your intelligent automation system...</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-black">
          <div className="bg-zinc-900/50 border border-green-500/10 rounded-xl p-4">
            <p className="text-sm text-green-200/80">
              <span className="font-medium text-green-100">Request:</span> {args.command}
            </p>
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
const AgentSummary = memo(({ result, isReadonly }: { result: any; isReadonly: boolean }) => {
  const { setArtifact, setMetadata } = useArtifact();
  
  const openAgentBuilder = () => {
    const agentData = result.data;
    
    console.log('🚀 Opening agent builder with data:', JSON.stringify(agentData, null, 2));
    
    // Ensure the agent data has all required fields with proper structure
    const normalizedAgentData = {
      name: agentData?.name || 'AI Agent',
      description: agentData?.description || '',
      domain: agentData?.domain || '',
      models: agentData?.models || [],
      enums: agentData?.enums || [],
      actions: agentData?.actions || [],
      createdAt: agentData?.createdAt || new Date().toISOString(),
    };
    
    console.log('📊 Normalized agent data:', JSON.stringify(normalizedAgentData, null, 2));
    console.log('📈 Data stats:', {
      modelsCount: normalizedAgentData.models.length,
      enumsCount: normalizedAgentData.enums.length,
      actionsCount: normalizedAgentData.actions.length,
      totalFields: normalizedAgentData.models.reduce((sum: number, model: any) => sum + (model.fields?.length || 0), 0)
    });
    
    const contentString = JSON.stringify(normalizedAgentData, null, 2);
    console.log('💾 Content string for artifact:', contentString);
    
    // Set artifact with proper data structure
    setArtifact({
      documentId: `agent-${Date.now()}`,
      content: contentString,
      kind: 'agent',
      title: normalizedAgentData.name,
      status: 'idle',
      isVisible: true,
      boundingBox: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
    });

    // Set metadata to sync with agent builder state
    setMetadata({
      selectedTab: 'models',
      editingModel: null,
      editingEnum: null,
      editingAction: null,
      currentStep: 'complete',
      stepProgress: {
        overview: 'complete',
        models: 'complete',
        enums: 'complete',
        actions: 'complete',
      },
      stepMessages: {
        overview: `System overview complete: ${normalizedAgentData.name}`,
        models: `Database models created: ${normalizedAgentData.models.length} entities`,
        enums: `Enumerations defined: ${normalizedAgentData.enums.length} vocabularies`,
        actions: `Automated actions created: ${normalizedAgentData.actions.length} workflows`,
      }
    });
    
    console.log('✅ Agent builder setup complete');
  };

  const agentData = result.data;
  const isSuccess = result.success;

  if (!agentData) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-black border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-500/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-500/30">
              <span className="text-red-400 text-lg">⚠️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-200 mb-2 font-mono">AGENT CREATION FAILED</h3>
              <p className="text-red-300/80 text-sm font-mono">
                {result.message || 'Failed to create the agent. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <h3 className="text-xl font-semibold text-green-100">{agentData.name}</h3>
                <p className="text-green-300/70 text-sm">{agentData.domain || 'AI Agent System'}</p>
              </div>
            </div>
            {isSuccess && (
              <div className="bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex-shrink-0 border border-green-500/30">
                <span className="text-green-200 text-xs font-medium font-mono">✅ READY</span>
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
                  <RouteIcon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{agentData.enums?.length || 0}</div>
              <div className="text-xs text-green-300 font-mono">ENUMS</div>
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
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <h4 className="font-semibold text-green-100 text-sm font-mono">🚀 CAPABILITIES</h4>
            <div className="space-y-2">
              {agentData.models?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 shadow-sm shadow-green-400/50" />
                  <span className="text-green-200/80 font-mono">
                    <strong className="text-green-100">{agentData.models.length}</strong> database models with relationships
                  </span>
                </div>
              )}
              {agentData.enums?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 shadow-sm shadow-green-400/50" />
                  <span className="text-green-200/80 font-mono">
                    <strong className="text-green-100">{agentData.enums.length}</strong> controlled vocabularies
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

          {/* Success Message */}
          {isSuccess && result.message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-300 text-sm font-mono">{result.message}</p>
            </div>
          )}

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
                const agentJson = JSON.stringify(agentData, null, 2);
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
                        <AgentBuilderLoading args={args} />
                      ) : toolName === 'databaseBuilder' ? (
                        <AgentBuilderLoading args={args} />
                      ) : toolName === 'actionBuilder' ? (
                        <AgentBuilderLoading args={args} />
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
                        <AgentSummary result={result} isReadonly={isReadonly} />
                      ) : toolName === 'databaseBuilder' ? (
                        <AgentSummary result={result} isReadonly={isReadonly} />
                      ) : toolName === 'actionBuilder' ? (
                        <AgentSummary result={result} isReadonly={isReadonly} />
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
