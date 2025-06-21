import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   * NOTE: Using grok-3 model
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      // OpenAI models (fully compatible with all features)
      'gpt-4o-mini',
      'gpt-4o',
      // xAI models
      'grok-3',
    ],
  },

  /*
   * For users with an account
   * NOTE: Using grok-3 model
   */
  regular: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: [
      // OpenAI models (fully compatible with all features)
      'gpt-4o',
      'gpt-4o-mini',
      // xAI models
      'grok-3',
      // Legacy models (for backward compatibility)
      'chat-model', 
      'chat-model-reasoning',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
