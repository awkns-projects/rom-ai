// Available providers configuration - client-safe constants
export const AVAILABLE_PROVIDERS = {
  xai: {
    name: 'xAI',
    description: 'Grok models by xAI',
    models: {
      chat: 'grok-3',
      reasoning: 'grok-3', 
      title: 'grok-3',
      artifact: 'grok-3',
      image: 'grok-3-image'
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