'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import { createXai } from '@ai-sdk/xai';
import { createOpenAI } from '@ai-sdk/openai';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function saveProviderAsCookie(providerId: string) {
  const cookieStore = await cookies();
  cookieStore.set('ai-provider', providerId);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // Debug logging to see what provider is being used
  console.log('🔍 Title Generation Debug:');
  console.log('  - AI_PROVIDER env var:', process.env.AI_PROVIDER);
  console.log('  - myProvider details:', typeof myProvider);
  
  // Use dynamic provider selection based on current environment variable
  const envProvider = process.env.AI_PROVIDER?.toLowerCase();
  let titleModel;
  
  if (envProvider === 'xai') {
    console.log('✅ Title generation using xAI grok-3');
    const xaiProvider = createXai({
      apiKey: process.env.XAI_API_KEY,
    });
    titleModel = xaiProvider('grok-3');
  } else {
    console.log('⚠️ Title generation using OpenAI gpt-4o-mini (default)');
    const openaiProvider = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    titleModel = openaiProvider('gpt-4o-mini');
  }
  
  const { text: title } = await generateText({
    model: titleModel,
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
