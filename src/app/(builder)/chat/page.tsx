import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels, migrateToEnabledModel } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../../(auth)/auth';

export default async function Page() {
  const session = await auth();
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
      {session ? (
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
      ) : (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-green-950/20 border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-green-400 text-2xl">💬</span>
            </div>
            <h1 className="text-2xl font-bold text-green-100 mb-4 font-mono">
              Sign In to Chat
            </h1>
            <p className="text-green-300/80 font-mono text-sm mb-6 leading-relaxed">
              Sign in to start chatting with AI agents and access your conversation history.
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
      )}
    </>
  );
}
