// Available providers configuration - client-safe constants
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
export const getProviderInfo = (providerId?: string) => AVAILABLE_PROVIDERS[providerId as keyof typeof AVAILABLE_PROVIDERS];
export const getAvailableProviders = () => Object.keys(AVAILABLE_PROVIDERS); 