import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL, chatModels, migrateToEnabledModel } from '@/lib/ai/models';
import type { Message } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    return messages.map((message) => {
      // Extract text content from parts for backward compatibility
      const textContent = (message.parts as UIMessage['parts'])
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n') || '';

      return {
        id: message.id,
        parts: message.parts as UIMessage['parts'],
        role: message.role as UIMessage['role'],
        // Note: content will soon be deprecated in @ai-sdk/react
        content: textContent,
        createdAt: message.createdAt,
        experimental_attachments:
          (message.attachments as Array<Attachment>) ?? [],
      };
    });
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  const providerFromCookie = cookieStore.get('ai-provider');

  // Determine the initial model and provider
  let initialChatModel = DEFAULT_CHAT_MODEL;
  let initialProvider: 'xai' | 'openai' = 'openai'; // Default to OpenAI (xAI models re-enabled for testing)

  if (chatModelFromCookie?.value) {
    // Migrate potentially disabled models to enabled alternatives
    initialChatModel = migrateToEnabledModel(chatModelFromCookie.value);
    // Find the provider for this model
    const model = chatModels.find(m => m.id === initialChatModel);
    if (model) {
      initialProvider = model.providerId;
    }
  }

  if (providerFromCookie?.value && ['xai', 'openai'].includes(providerFromCookie.value)) {
    initialProvider = providerFromCookie.value as 'xai' | 'openai';
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        initialChatModel={initialChatModel}
        initialProvider={initialProvider}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
