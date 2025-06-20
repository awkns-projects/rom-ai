import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Get AI provider from environment variable, default to 'openai'
const aiProvider = process.env.AI_PROVIDER?.toLowerCase() || 'openai';

// Enhanced logging for debugging
console.log('🔍 Environment Variables Debug:');
console.log(`  - AI_PROVIDER raw: "${process.env.AI_PROVIDER}"`);
console.log(`  - AI_PROVIDER processed: "${aiProvider}"`);
console.log(`  - XAI_API_KEY exists: ${!!process.env.XAI_API_KEY}`);
console.log(`  - OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
console.log(`  - isTestEnvironment: ${isTestEnvironment}`);

// Log the current provider configuration
if (!isTestEnvironment) {
  console.log(`🤖 AI Provider: ${aiProvider} (${aiProvider === 'openai' ? 'OpenAI GPT models' : 'xAI Grok models'})`);
}

// Available providers configuration
export const AVAILABLE_PROVIDERS = {
  xai: {
    name: 'xAI',
    description: 'Grok models by xAI',
    models: {
      chat: 'grok-2-vision-1212',
      reasoning: 'grok-3-mini-beta', 
      title: 'grok-2-1212',
      artifact: 'grok-2-1212',
      image: 'grok-2-image'
    }
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models by OpenAI',
    models: {
      chat: 'gpt-4o',
      reasoning: 'gpt-4o',
      title: 'gpt-4o-mini',
      artifact: 'gpt-4o',
      image: 'dall-e-3'
    }
  }
} as const;

// Utility functions
export const getCurrentProvider = () => aiProvider;
export const getProviderInfo = (providerId?: string) => AVAILABLE_PROVIDERS[providerId as keyof typeof AVAILABLE_PROVIDERS] || AVAILABLE_PROVIDERS[aiProvider as keyof typeof AVAILABLE_PROVIDERS];
export const getAvailableProviders = () => Object.keys(AVAILABLE_PROVIDERS);

// Log which models will be used
console.log('🎯 Model Configuration:');
if (!isTestEnvironment) {
  if (aiProvider === 'openai') {
    console.log('  - Chat: gpt-4o (OpenAI)');
    console.log('  - Reasoning: gpt-4o (OpenAI)');
    console.log('  - Title: gpt-4o-mini (OpenAI)');
    console.log('  - Artifact: gpt-4o (OpenAI)');
    console.log('  - Image: dall-e-3 (OpenAI)');
  } else {
    console.log('  - Chat: grok-2-vision-1212 (xAI)');
    console.log('  - Reasoning: grok-3-mini-beta (xAI)');
    console.log('  - Title: grok-2-1212 (xAI)');
    console.log('  - Artifact: grok-2-1212 (xAI)');
    console.log('  - Image: grok-2-image (xAI)');
  }
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': aiProvider === 'openai' 
          ? openai('gpt-4o') 
          : xai('grok-2-vision-1212'),
        'chat-model-reasoning': aiProvider === 'openai'
          ? wrapLanguageModel({
              model: openai('gpt-4o'),
              middleware: extractReasoningMiddleware({ tagName: 'think' }),
            })
          : wrapLanguageModel({
              model: xai('grok-3-mini-beta'),
              middleware: extractReasoningMiddleware({ tagName: 'think' }),
            }),
        'title-model': aiProvider === 'openai'
          ? openai('gpt-4o-mini')
          : xai('grok-2-1212'),
        'artifact-model': aiProvider === 'openai'
          ? openai('gpt-4o')
          : xai('grok-2-1212'),
      },
      imageModels: {
        'small-model': aiProvider === 'openai'
          ? openai.image('dall-e-3')
          : xai.image('grok-2-image'),
      },
    });
