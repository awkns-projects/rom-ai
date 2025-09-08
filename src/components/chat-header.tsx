'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { forwardRef } from 'react';

import { ModelSelector, type ModelSelectorRef } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import type { Session } from 'next-auth';
import Link from 'next/link';

const PureChatHeader = forwardRef<ModelSelectorRef, {
  chatId: string;
  selectedModelId: string;
  selectedProviderId?: 'xai' | 'openai';
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
}>(({
  chatId,
  selectedModelId,
  selectedProviderId = 'openai',
  selectedVisibilityType,
  isReadonly,
  session,
}, ref) => {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-black py-1.5 items-center px-2 md:px-2 gap-2 backdrop-blur-xl z-50">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0 font-mono"
              onClick={() => {
                window.location.href = '/chat';
                // router.push('/chat');
                // router.refresh();
              }}
            >
              <PlusIcon />
              <span className="hidden md:inline">NEW AGENT</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-black border-green-500/30 text-green-200 font-mono">NEW AGENT</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          ref={ref}
          session={session}
          selectedModelId={selectedModelId}
          selectedProviderId={selectedProviderId}
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}


    </header>
  );
});

PureChatHeader.displayName = 'PureChatHeader';

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId && 
         prevProps.selectedProviderId === nextProps.selectedProviderId;
});
