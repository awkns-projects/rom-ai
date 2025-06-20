'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { getProviderInfo } from '@/lib/ai/providers';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  const providerInfo = getProviderInfo();

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
              {providerInfo.name}
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
          Current Provider: {providerInfo.name} - {providerInfo.description}
        </div>
        {availableChatModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onSelect={() => {
              setOptimisticModelId(model.id);

              startTransition(() => {
                saveChatModelAsCookie(model.id);
              });
            }}
            className="gap-4 group/item flex cursor-pointer justify-between"
          >
            <div className="flex flex-col gap-1 items-start">
              <div className="text-sm font-medium">{model.name}</div>
              {model.description && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {model.description}
                </div>
              )}
            </div>
            {model.id === optimisticModelId && (
              <div className="text-blue-500 dark:text-blue-400">
                <CheckCircleFillIcon />
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
