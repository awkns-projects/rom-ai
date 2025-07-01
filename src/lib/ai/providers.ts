import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai, createXai } from '@ai-sdk/xai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { cookies } from 'next/headers';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { AVAILABLE_PROVIDERS, getProviderInfo, getAvailableProviders } from './providers-config';
import { auth } from '@/app/(auth)/auth';
import { getUserApiKeys } from '@/lib/db/api-keys';

// Get AI provider from cookies first, then environment variable, default to 'openai' 
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
  
  return 'openai'; // Default to OpenAI
}

// Enhanced logging for debugging
console.log('🔍 Environment Variables Debug:');
console.log(`  - AI_PROVIDER raw: "${process.env.AI_PROVIDER}"`);
console.log(`  - XAI_API_KEY exists: ${!!process.env.XAI_API_KEY}`);
console.log(`  - OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
console.log(`  - isTestEnvironment: ${isTestEnvironment}`);

// Re-export the imported constants and functions
export { AVAILABLE_PROVIDERS, getProviderInfo, getAvailableProviders };

// Model to provider mapping - ensures each model uses the correct provider
const modelProviderMap: Record<string, 'openai' | 'xai'> = {
  // OpenAI models
  'gpt-4o-mini': 'openai',
  'gpt-4o': 'openai',
  'o1-mini': 'openai',
  'o1-preview': 'openai',
  
  // xAI models - Using grok-3
  'grok-3': 'xai',
};

// Helper function to get OpenAI provider with user API key if available
async function getOpenAIProvider() {
  let apiKey = process.env.OPENAI_API_KEY;
  
  try {
    const session = await auth();
    if (session?.user?.id) {
      const userApiKeys = await getUserApiKeys(session.user.id);
      if (userApiKeys.openaiApiKey) {
        apiKey = userApiKeys.openaiApiKey;
      }
    }
  } catch (error) {
    console.warn('Failed to get user OpenAI API key:', error);
  }
  
  return createOpenAI({
    apiKey,
  });
}

// Helper function to get xAI provider with user API key if available
async function getXAIProvider() {
  let apiKey = process.env.XAI_API_KEY;
  
  try {
    const session = await auth();
    if (session?.user?.id) {
      const userApiKeys = await getUserApiKeys(session.user.id);
      if (userApiKeys.xaiApiKey) {
        apiKey = userApiKeys.xaiApiKey;
      }
    }
  } catch (error) {
    console.warn('Failed to get user xAI API key:', error);
  }
  
  return createXai({
    apiKey,
  });
}

export async function getProvider(modelId: string) {
  const providerType = modelProviderMap[modelId];
  
  if (!providerType) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (providerType === 'openai') {
    return await getOpenAIProvider();
  }

  if (providerType === 'xai') {
    return await getXAIProvider();
  }

  throw new Error(`Unsupported provider: ${providerType}`);
}

// Legacy function for backward compatibility
export async function getProviderForSelectedModel() {
  const cookieStore = await cookies();
  const selectedModel = cookieStore.get('selectedChatModel')?.value || 'gpt-4o-mini';
  
  return getProvider(selectedModel);
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
        // Legacy models - kept for backward compatibility (but hidden from UI)
        'chat-model': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o'),
        
        // Specific model mappings - each model uses its correct provider
        'grok-3': xai('grok-3'),
        'gpt-4o': openai('gpt-4o'),
        'gpt-4o-mini': openai('gpt-4o-mini'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'), // Default to OpenAI for images
      },
    });

console.log('✅ Provider configuration loaded:');
console.log('   - xAI models: grok-3');
console.log('   - OpenAI models: gpt-4o, gpt-4o-mini');
console.log('   - Each model uses its specific provider regardless of environment variables');
