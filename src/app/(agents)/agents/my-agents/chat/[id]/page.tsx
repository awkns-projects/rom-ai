import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

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
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-green-950/20 border border-green-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-green-400 text-2xl">💬</span>
          </div>
          <h1 className="text-2xl font-bold text-green-100 mb-4 font-mono">
            Sign In to View Chat
          </h1>
          <p className="text-green-300/80 font-mono text-sm mb-6 leading-relaxed">
            Sign in to view this conversation and access your chat history.
          </p>
          <div className="space-y-3">
            <a 
              href="/login" 
              className="block w-full bg-green-600/20 border border-green-500/30 text-green-200 hover:bg-green-600/30 hover:border-green-500/50 px-6 py-3 rounded-xl font-mono transition-all duration-200"
            >
              Sign In
            </a>
            <a 
              href="/" 
              className="block w-full bg-gray-600/20 border border-gray-500/30 text-gray-200 hover:bg-gray-600/30 hover:border-gray-500/50 px-6 py-3 rounded-xl font-mono transition-all duration-200"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
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
