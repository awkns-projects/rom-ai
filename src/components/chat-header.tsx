'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import type { Session } from 'next-auth';
import Link from 'next/link';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedProviderId = 'openai',
  selectedVisibilityType,
  isReadonly,
  session,
}: {
  chatId: string;
  selectedModelId: string;
  selectedProviderId?: 'xai' | 'openai';
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-black border-b border-green-500/20 py-1.5 items-center px-2 md:px-2 gap-2 backdrop-blur-xl z-50">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0 font-mono"
              onClick={() => {
                router.push('/chat');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">NEW CHAT</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-black border-green-500/30 text-green-200 font-mono">NEW CHAT</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
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

      <Button
        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black border border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto font-mono font-medium"
        asChild
      >
        <Link
          href={`/deployment`}
        >
          My Agents
        </Link>
      </Button> 
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId && 
         prevProps.selectedProviderId === nextProps.selectedProviderId;
});
