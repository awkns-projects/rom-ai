import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { cookies } from 'next/headers';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { AVAILABLE_PROVIDERS, getProviderInfo, getAvailableProviders } from './providers-config';

// Get AI provider from cookies first, then environment variable, default to 'openai' (since xAI models are disabled)
export async function getCurrentProvider(): Promise<'xai' | 'openai'> {
  try {
    const cookieStore = await cookies();
    const providerFromCookie = cookieStore.get('ai-provider')?.value;
    if (providerFromCookie && ['xai', 'openai'].includes(providerFromCookie)) {
      return providerFromCookie as 'xai' | 'openai';
    }
  } catch (error) {
    // Cookies might not be available in some contexts
  }
  
  // Fallback to environment variable, then default
  const envProvider = process.env.AI_PROVIDER?.toLowerCase();
  if (envProvider && ['xai', 'openai'].includes(envProvider)) {
    return envProvider as 'xai' | 'openai';
  }
  
  return 'openai'; // Default to OpenAI since xAI models are disabled due to agent builder incompatibility
}

// Get current provider synchronously (for backwards compatibility) - default to OpenAI
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
  
  // Warn if using xAI when models are disabled
  if (aiProvider === 'xai') {
    console.warn('⚠️  WARNING: xAI provider selected but xAI models are disabled due to agent builder incompatibility');
    console.warn('   Consider setting AI_PROVIDER=openai or removing the environment variable to use OpenAI models');
  }
}

// Re-export the imported constants and functions
export { AVAILABLE_PROVIDERS, getProviderInfo, getAvailableProviders };

// Create a provider factory function that can be called with a specific provider
export function createProviderForModel(modelId: string, providerOverride?: 'xai' | 'openai') {
  const provider = providerOverride || aiProvider;
  
  // Map specific model IDs to their provider models
  const modelMapping: Record<string, { provider: 'xai' | 'openai'; model: string }> = {
    // xAI models
    'grok-2-vision-1212': { provider: 'xai', model: 'grok-2-vision-1212' },
    'grok-3-mini-beta': { provider: 'xai', model: 'grok-3-mini-beta' },
    'grok-2-1212': { provider: 'xai', model: 'grok-2-1212' },
    
    // OpenAI models
    'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
    'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
    
    // Legacy models - use current provider
    'chat-model': { provider: provider as 'xai' | 'openai', model: provider === 'openai' ? 'gpt-4o' : 'grok-2-vision-1212' },
    'chat-model-reasoning': { provider: provider as 'xai' | 'openai', model: provider === 'openai' ? 'gpt-4o' : 'grok-3-mini-beta' },
  };

  const mapping = modelMapping[modelId];
  if (!mapping) {
    // Default fallback
    return provider === 'openai' ? openai('gpt-4o') : xai('grok-2-vision-1212');
  }

  return mapping.provider === 'openai' ? openai(mapping.model) : xai(mapping.model);
}

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
        
        // Add specific model mappings for the new models
        'grok-2-vision-1212': xai('grok-2-vision-1212'),
        'grok-3-mini-beta': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'grok-2-1212': xai('grok-2-1212'),
        'gpt-4o': openai('gpt-4o'),
        'gpt-4o-mini': openai('gpt-4o-mini'),
      },
      imageModels: {
        'small-model': aiProvider === 'openai'
          ? openai.image('dall-e-3')
          : xai.image('grok-2-image'),
      },
    });
