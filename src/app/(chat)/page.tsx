import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels, migrateToEnabledModel } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  const providerFromCookie = cookieStore.get('ai-provider');

  // Determine the initial model and provider
  let initialChatModel = DEFAULT_CHAT_MODEL;
  let initialProvider: 'xai' | 'openai' = 'openai'; // Default to OpenAI (xAI models re-enabled for testing)

  if (modelIdFromCookie?.value) {
    // Migrate potentially disabled models to enabled alternatives
    initialChatModel = migrateToEnabledModel(modelIdFromCookie.value);
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
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={initialChatModel}
        initialProvider={initialProvider}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
