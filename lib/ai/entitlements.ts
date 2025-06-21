import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   * NOTE: xAI models disabled due to agent builder incompatibility - prioritizing OpenAI models
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      // OpenAI models (compatible with all features)
      'gpt-4o-mini',
      'gpt-4o',
      // Legacy models (disabled but kept for backward compatibility)
      'chat-model', 
      'chat-model-reasoning',
      // xAI models (disabled)
      'grok-2-vision-1212',
      'grok-2-1212',
    ],
  },

  /*
   * For users with an account
   * NOTE: xAI models disabled due to agent builder incompatibility - prioritizing OpenAI models
   */
  regular: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: [
      // OpenAI models (compatible with all features) - listed first as primary options
      'gpt-4o',
      'gpt-4o-mini',
      // Legacy models (disabled but kept for backward compatibility)
      'chat-model', 
      'chat-model-reasoning',
      // xAI models (disabled)
      'grok-2-vision-1212',
      'grok-3-mini-beta',
      'grok-2-1212',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
