export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  providerId: 'xai' | 'openai';
  disabled?: boolean;
  disabledReason?: string;
  // AI SDK function compatibility
  compatibility: {
    streamText: boolean;
    generateText: boolean;
    generateObject: boolean; // Structured output
    streamObject: boolean;   // Structured streaming
    toolCalling: boolean;
    reasoning: boolean; // Supports reasoning/thinking tags
  };
}

export const chatModels: Array<ChatModel> = [
  // xAI (Grok) models - Using grok-3
  {
    id: 'grok-3',
    name: 'Grok 3',
    description: 'Latest Grok 3 model with advanced capabilities',
    providerId: 'xai',
    disabled: false,
    compatibility: {
      streamText: true,
      generateText: true,
      generateObject: true,
      streamObject: true,
      toolCalling: true,
      reasoning: true,
    },
  },
  
  // OpenAI models - ENABLED (fully compatible)
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable GPT-4 model with multimodal abilities',
    providerId: 'openai',
    compatibility: {
      streamText: true,
      generateText: true,
      generateObject: true,
      streamObject: true,
      toolCalling: true,
      reasoning: true,
    },
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster and more affordable GPT-4 model',
    providerId: 'openai',
    compatibility: {
      streamText: true,
      generateText: true,
      generateObject: true,
      streamObject: true,
      toolCalling: true,
      reasoning: true,
    },
  },
  
  // Legacy generic models for backward compatibility
  {
    id: 'chat-model',
    name: 'Chat Model',
    description: 'Primary model for all-purpose chat',
    providerId: 'xai', // Default provider
    disabled: true, // Hidden from UI - users should select specific models
    disabledReason: 'Legacy model - please select a specific model like Grok 3 or GPT-4o',
    compatibility: {
      streamText: true,
      generateText: true,
      generateObject: true,
      streamObject: true,
      toolCalling: true,
      reasoning: true,
    },
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning Model',
    description: 'Uses advanced reasoning capabilities',
    providerId: 'xai', // Default provider
    disabled: true, // Hidden from UI - users should select specific models
    disabledReason: 'Legacy model - please select a specific model like Grok 3 or GPT-4o',
    compatibility: {
      streamText: true,
      generateText: true,
      generateObject: true,
      streamObject: true,
      toolCalling: true,
      reasoning: true,
    },
  },
];

/**
 * Get all enabled (non-disabled) chat models
 */
export const getEnabledChatModels = (): ChatModel[] => {
  return chatModels.filter(model => !model.disabled);
};

/**
 * Check if a model is compatible with the agent builder system
 */
export const isModelAgentBuilderCompatible = (modelId: string): boolean => {
  const model = chatModels.find(m => m.id === modelId);
  if (!model) return false;
  
  // Agent builder requires OpenAI models due to hard-coded generateObject calls
  return model.providerId === 'openai' && !model.disabled;
};

/**
 * Get the first available enabled model, preferring OpenAI models
 */
export const getDefaultEnabledModel = (): string => {
  const enabledModels = getEnabledChatModels();
  
  // Prefer OpenAI models for compatibility
  const openaiModel = enabledModels.find(m => m.providerId === 'openai');
  if (openaiModel) return openaiModel.id;
  
  // Fallback to any enabled model
  const anyEnabledModel = enabledModels[0];
  if (anyEnabledModel) return anyEnabledModel.id;
  
  // Ultimate fallback (should not happen)
  return DEFAULT_CHAT_MODEL;
};

/**
 * Migrate a potentially disabled model to an enabled alternative
 * This helps users who have disabled models saved in cookies/preferences
 */
export const migrateToEnabledModel = (modelId: string): string => {
  const model = chatModels.find(m => m.id === modelId);
  
  // If model doesn't exist or is disabled, return an enabled alternative
  if (!model || model.disabled) {
    return getDefaultEnabledModel();
  }
  
  // Model is valid and enabled
  return modelId;
};

/**
 * Check if a model supports a specific AI SDK function
 */
export const isModelCompatibleWith = (modelId: string, functionName: keyof ChatModel['compatibility']): boolean => {
  const model = chatModels.find(m => m.id === modelId);
  if (!model || model.disabled) return false;
  
  return model.compatibility[functionName];
};

/**
 * Get models that support a specific AI SDK function
 */
export const getModelsCompatibleWith = (functionName: keyof ChatModel['compatibility']): ChatModel[] => {
  return chatModels.filter(model => 
    !model.disabled && model.compatibility[functionName]
  );
};

/**
 * Check if a model supports structured output (generateObject/streamObject)
 */
export const supportsStructuredOutput = (modelId: string): boolean => {
  return isModelCompatibleWith(modelId, 'generateObject') && 
         isModelCompatibleWith(modelId, 'streamObject');
};

/**
 * Get the best model for a specific function, preferring enabled models
 */
export const getBestModelFor = (functionName: keyof ChatModel['compatibility']): string | null => {
  const compatibleModels = getModelsCompatibleWith(functionName);
  
  // Prefer OpenAI models for reliability
  const openaiModel = compatibleModels.find(m => m.providerId === 'openai');
  if (openaiModel) return openaiModel.id;
  
  // Fallback to any compatible model
  const anyCompatibleModel = compatibleModels[0];
  if (anyCompatibleModel) return anyCompatibleModel.id;
  
  return null;
};
