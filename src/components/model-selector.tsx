'use client';

import { startTransition, useMemo, useOptimistic, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import { saveChatModelAsCookie, saveProviderAsCookie } from '@/app/(builder)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { chatModels, supportsStructuredOutput } from '@/lib/ai/models';
import { AVAILABLE_PROVIDERS } from '@/lib/ai/providers-config';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { CheckCircleFillIcon, ChevronDownIcon, KeyIcon, EyeIcon, EyeOffIcon, TrashIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

interface ApiKeyStatus {
  hasOpenaiKey: boolean;
  hasXaiKey: boolean;
}

export interface ModelSelectorRef {
  openDropdown: () => void;
}

export const ModelSelector = forwardRef<ModelSelectorRef, {
  session: Session;
  selectedModelId: string;
  selectedProviderId?: 'xai' | 'openai';
} & React.ComponentProps<typeof Button>>(({
  session,
  selectedModelId,
  selectedProviderId = 'openai',
  className,
  ...props
}, ref) => {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModelId);
  const [optimisticProviderId, setOptimisticProviderId] = useOptimistic(selectedProviderId);
  
  // API Key management state
  const [loading, setLoading] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>({ hasOpenaiKey: false, hasXaiKey: false });
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showXaiKey, setShowXaiKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [xaiKey, setXaiKey] = useState('');

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openDropdown: () => setOpen(true),
  }));

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  // Filter available models based on user entitlements AND exclude disabled models
  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id) && !chatModel.disabled,
  );

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped = availableChatModels.reduce((acc, model) => {
      if (!acc[model.providerId]) {
        acc[model.providerId] = [];
      }
      acc[model.providerId].push(model);
      return acc;
    }, {} as Record<'xai' | 'openai', typeof availableChatModels>);
    
    return grouped;
  }, [availableChatModels]);

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  const currentProviderInfo = AVAILABLE_PROVIDERS[optimisticProviderId];

  // Fetch API key status when component mounts
  useEffect(() => {
    if (session.user.type === 'regular') {
      fetchKeyStatus();
    }
  }, [session.user.type]);

  const fetchKeyStatus = async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const status = await response.json();
        setKeyStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch API key status:', error);
    }
  };

  const saveApiKey = async (provider: 'openai' | 'xai', apiKey: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (response.ok) {
        toast.success(`${provider === 'openai' ? 'OpenAI' : 'xAI'} API key saved successfully`);
        await fetchKeyStatus();
        if (provider === 'openai') setOpenaiKey('');
        if (provider === 'xai') setXaiKey('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save API key');
      }
    } catch (error) {
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKeys = async (providers: ('openai' | 'xai')[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers }),
      });

      if (response.ok) {
        toast.success('API keys deleted successfully');
        await fetchKeyStatus();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete API keys');
      }
    } catch (error) {
      toast.error('Failed to delete API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenaiSave = () => {
    if (!openaiKey.trim()) {
      toast.error('Please enter an OpenAI API key');
      return;
    }
    if (!openaiKey.startsWith('sk-')) {
      toast.error('OpenAI API keys should start with "sk-"');
      return;
    }
    saveApiKey('openai', openaiKey);
  };

  const handleXaiSave = () => {
    if (!xaiKey.trim()) {
      toast.error('Please enter an xAI API key');
      return;
    }
    if (!xaiKey.startsWith('xai-')) {
      toast.error('xAI API keys should start with "xai-"');
      return;
    }
    saveApiKey('xai', xaiKey);
  };

  const handleModelSelect = (modelId: string, providerId: 'xai' | 'openai') => {
    startTransition(() => {
      setOptimisticModelId(modelId);
      setOptimisticProviderId(providerId);
      saveChatModelAsCookie(modelId);
      saveProviderAsCookie(providerId);
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit justify-start border border-zinc-200 px-3 py-2 text-left text-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {currentProviderInfo.name}
            </div>
            <div className="text-sm font-medium">
              {selectedChatModel?.name}
            </div>
            {session.user.type === 'regular' && (keyStatus.hasOpenaiKey || keyStatus.hasXaiKey) && (
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[400px]">
        <div className="px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
          Select Provider & Model
        </div>
        
        {/* Show warning if no models available */}
        {availableChatModels.length === 0 && (
          <div className="px-2 py-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md mx-2 my-2">
            <div className="font-medium">⚠️ No compatible models available</div>
            <div className="text-xs mt-1">
              No models are available for your current entitlements.
              Please check your model access permissions.
            </div>
          </div>
        )}
        
        {/* xAI (Grok) Models */}
        {modelsByProvider.xai && modelsByProvider.xai.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/50">
              {AVAILABLE_PROVIDERS.xai.name} - {AVAILABLE_PROVIDERS.xai.description}
            </div>
            {modelsByProvider.xai.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => handleModelSelect(model.id, 'xai')}
                className="gap-4 group/item flex cursor-pointer justify-between"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="text-sm font-medium">{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {model.description}
                    </div>
                  )}
                  {/* Show warning if model doesn't support structured output */}
                  {!supportsStructuredOutput(model.id) && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      🧪 Testing agent builder compatibility
                    </div>
                  )}
                </div>
                {model.id === optimisticModelId && optimisticProviderId === 'xai' && (
                  <div className="text-blue-500 dark:text-blue-400">
                    <CheckCircleFillIcon />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Separator between providers */}
        {modelsByProvider.xai && modelsByProvider.xai.length > 0 && 
         modelsByProvider.openai && modelsByProvider.openai.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {/* OpenAI Models */}
        {modelsByProvider.openai && modelsByProvider.openai.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/50">
              {AVAILABLE_PROVIDERS.openai.name} - {AVAILABLE_PROVIDERS.openai.description}
            </div>
            {modelsByProvider.openai.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => handleModelSelect(model.id, 'openai')}
                className="gap-4 group/item flex cursor-pointer justify-between"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="text-sm font-medium">{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {model.description}
                    </div>
                  )}
                </div>
                {model.id === optimisticModelId && optimisticProviderId === 'openai' && (
                  <div className="text-blue-500 dark:text-blue-400">
                    <CheckCircleFillIcon />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* API Key Management Section - Only for regular users */}
        {session.user.type === 'regular' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyIcon size={14} />
                API Keys
              </div>
            </div>
            
            {/* Explanation */}
            <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="font-medium mb-1">💡 API Key Options</div>
              <div className="space-y-1">
                <div>• Use <strong>your own API keys</strong> to access models with your credits</div>
                <div>• Or use <strong>our provided keys</strong> (default) with usage limits</div>
                <div>• Your keys are encrypted and stored securely</div>
              </div>
            </div>

            {/* OpenAI API Key */}
            <div className="px-3 py-3 space-y-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <Label htmlFor="openai-key" className="text-xs font-medium">OpenAI API Key</Label>
                {keyStatus.hasOpenaiKey && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400">✓ Active</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKeys(['openai'])}
                      disabled={loading}
                      className="h-6 w-6 p-0"
                    >
                      <TrashIcon size={12} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="openai-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    disabled={loading}
                    className="text-xs h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                  </Button>
                </div>
                <Button onClick={handleOpenaiSave} disabled={loading} size="sm" className="h-8 text-xs">
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your key from{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                  OpenAI Platform
                </a>
              </p>
            </div>

            {/* xAI API Key */}
            <div className="px-3 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="xai-key" className="text-xs font-medium">xAI API Key</Label>
                {keyStatus.hasXaiKey && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400">✓ Active</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKeys(['xai'])}
                      disabled={loading}
                      className="h-6 w-6 p-0"
                    >
                      <TrashIcon size={12} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="xai-key"
                    type={showXaiKey ? 'text' : 'password'}
                    placeholder="xai-..."
                    value={xaiKey}
                    onChange={(e) => setXaiKey(e.target.value)}
                    disabled={loading}
                    className="text-xs h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowXaiKey(!showXaiKey)}
                  >
                    {showXaiKey ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                  </Button>
                </div>
                <Button onClick={handleXaiSave} disabled={loading} size="sm" className="h-8 text-xs">
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your key from{' '}
                <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="underline">
                  xAI Console
                </a>
              </p>
            </div>

            {/* Clear All */}
            {(keyStatus.hasOpenaiKey || keyStatus.hasXaiKey) && (
              <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const providers: ('openai' | 'xai')[] = [];
                    if (keyStatus.hasOpenaiKey) providers.push('openai');
                    if (keyStatus.hasXaiKey) providers.push('xai');
                    deleteApiKeys(providers);
                  }}
                  disabled={loading}
                  className="h-7 text-xs"
                >
                  Clear All API Keys
                </Button>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
