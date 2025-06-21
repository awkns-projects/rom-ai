'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie, saveProviderAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels, supportsStructuredOutput } from '@/lib/ai/models';
import { AVAILABLE_PROVIDERS } from '@/lib/ai/providers-config';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

export function ModelSelector({
  session,
  selectedModelId,
  selectedProviderId = 'openai',
  className,
}: {
  session: Session;
  selectedModelId: string;
  selectedProviderId?: 'xai' | 'openai';
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModelId);
  const [optimisticProviderId, setOptimisticProviderId] = useOptimistic(selectedProviderId);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  // Filter available models based on user entitlements AND exclude disabled models
  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id) && !chatModel.disabled,
  );

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped = availableChatModels.reduce((acc, model) => {
      if (!acc[model.providerId]) {
        acc[model.providerId] = [];
      }
      acc[model.providerId].push(model);
      return acc;
    }, {} as Record<'xai' | 'openai', typeof availableChatModels>);
    
    return grouped;
  }, [availableChatModels]);

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  const currentProviderInfo = AVAILABLE_PROVIDERS[optimisticProviderId];

  const handleModelSelect = (modelId: string, providerId: 'xai' | 'openai') => {
    setOptimisticModelId(modelId);
    setOptimisticProviderId(providerId);

    startTransition(() => {
      saveChatModelAsCookie(modelId);
      saveProviderAsCookie(providerId);
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit justify-start border border-zinc-200 px-3 py-2 text-left text-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {currentProviderInfo.name}
            </div>
            <div className="text-sm font-medium">
              {selectedChatModel?.name}
            </div>
          </div>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        <div className="px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
          Select Provider & Model
        </div>
        
        {/* Show warning if no models available */}
        {availableChatModels.length === 0 && (
          <div className="px-2 py-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md mx-2 my-2">
            <div className="font-medium">⚠️ No compatible models available</div>
            <div className="text-xs mt-1">
              All xAI models are currently disabled due to agent builder system requirements.
              Please ensure OpenAI models are enabled in your entitlements.
            </div>
          </div>
        )}
        
        {/* xAI (Grok) Models */}
        {modelsByProvider.xai && modelsByProvider.xai.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/50">
              {AVAILABLE_PROVIDERS.xai.name} - {AVAILABLE_PROVIDERS.xai.description}
            </div>
            {modelsByProvider.xai.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => handleModelSelect(model.id, 'xai')}
                className="gap-4 group/item flex cursor-pointer justify-between"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="text-sm font-medium">{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {model.description}
                    </div>
                  )}
                  {/* Show compatibility information */}
                  {/* <div className="flex flex-wrap gap-1 mt-1">
                    {model.compatibility.streamText && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        Chat
                      </span>
                    )}
                    {model.compatibility.toolCalling && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                        Tools
                      </span>
                    )}
                    {supportsStructuredOutput(model.id) && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        Structured
                      </span>
                    )}
                    {model.compatibility.reasoning && (
                      <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                        Reasoning
                      </span>
                    )}
                  </div> */}
                  {/* Show warning if model doesn't support structured output */}
                  {!supportsStructuredOutput(model.id) && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Limited agent builder support
                    </div>
                  )}
                </div>
                {model.id === optimisticModelId && optimisticProviderId === 'xai' && (
                  <div className="text-blue-500 dark:text-blue-400">
                    <CheckCircleFillIcon />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Separator between providers */}
        {modelsByProvider.xai && modelsByProvider.xai.length > 0 && 
         modelsByProvider.openai && modelsByProvider.openai.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {/* OpenAI Models */}
        {modelsByProvider.openai && modelsByProvider.openai.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/50">
              {AVAILABLE_PROVIDERS.openai.name} - {AVAILABLE_PROVIDERS.openai.description}
            </div>
            {modelsByProvider.openai.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => handleModelSelect(model.id, 'openai')}
                className="gap-4 group/item flex cursor-pointer justify-between"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="text-sm font-medium">{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {model.description}
                    </div>
                  )}
                  {/* Show compatibility information */}
                  {/* <div className="flex flex-wrap gap-1 mt-1">
                    {model.compatibility.streamText && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        Chat
                      </span>
                    )}
                    {model.compatibility.toolCalling && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                        Tools
                      </span>
                    )}
                    {supportsStructuredOutput(model.id) && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        Structured
                      </span>
                    )}
                    {model.compatibility.reasoning && (
                      <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                        Reasoning
                      </span>
                    )}
                  </div> */}
                  {/* Show success indicator for full compatibility */}
                  {/* {supportsStructuredOutput(model.id) && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✅ Full agent builder support
                    </div>
                  )} */}
                </div>
                {model.id === optimisticModelId && optimisticProviderId === 'openai' && (
                  <div className="text-blue-500 dark:text-blue-400">
                    <CheckCircleFillIcon />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
