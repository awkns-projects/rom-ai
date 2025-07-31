'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector, useArtifact } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { RateLimitModal } from './rate-limit-modal';
import type { ModelSelectorRef } from './model-selector';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialProvider = 'openai',
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialProvider?: 'xai' | 'openai';
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();
  const modelSelectorRef = useRef<ModelSelectorRef>(null);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const [currentChatModel, setCurrentChatModel] = useState(initialChatModel);
  const [currentProvider, setCurrentProvider] = useState(initialProvider);

  useEffect(() => {
    const checkCookies = () => {
      const chatModelCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('chat-model='));
      const providerCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('ai-provider='));

      if (chatModelCookie) {
        const modelValue = chatModelCookie.split('=')[1];
        if (modelValue && modelValue !== currentChatModel) {
          setCurrentChatModel(modelValue);
        }
      }

      if (providerCookie) {
        const providerValue = providerCookie.split('=')[1] as 'xai' | 'openai';
        if (providerValue && ['xai', 'openai'].includes(providerValue) && providerValue !== currentProvider) {
          setCurrentProvider(providerValue);
        }
      }
    };

    checkCookies();

    const interval = setInterval(checkCookies, 1000);

    return () => clearInterval(interval);
  }, [currentChatModel, currentProvider]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: currentChatModel,
      selectedVisibilityType: visibilityType,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if this is a rate limit error
        if (error.type === 'rate_limit' && error.surface === 'chat') {
          setShowRateLimitModal(true);
        } else {
          toast({
            type: 'error',
            description: error.message,
          });
        }
      }
    },
  });

  const { setArtifact } = useArtifact();
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const openAgentBuilder = searchParams.get('open_agent_builder');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [hasOpenedAgentBuilder, setHasOpenedAgentBuilder] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  // Handle opening agent builder from URL parameter
  useEffect(() => {
    if (openAgentBuilder && !hasOpenedAgentBuilder) {
      // Set the artifact to open agent builder
      setArtifact({
        documentId: openAgentBuilder,
        title: 'Agent Builder',
        kind: 'agent',
        content: '',
        isVisible: true,
        status: 'idle',
        boundingBox: {
          top: 0,
          left: 0,
          width: typeof window !== 'undefined' ? window.innerWidth : 1920,
          height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        },
      });
      
      setHasOpenedAgentBuilder(true);
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('open_agent_builder');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [openAgentBuilder, hasOpenedAgentBuilder, setArtifact]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  const handleAddApiKey = () => {
    // Open the model selector dropdown which contains the API key management
    modelSelectorRef.current?.openDropdown();
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          ref={modelSelectorRef}
          chatId={id}
          selectedModelId={currentChatModel}
          selectedProviderId={currentProvider}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />

      <RateLimitModal
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        onAddApiKey={handleAddApiKey}
      />
    </>
  );
}