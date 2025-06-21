'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyIcon, EyeIcon, EyeOffIcon, TrashIcon } from './icons';

interface ApiKeyStatus {
  hasOpenaiKey: boolean;
  hasXaiKey: boolean;
}

export function ApiKeyManager() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>({ hasOpenaiKey: false, hasXaiKey: false });
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showXaiKey, setShowXaiKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [xaiKey, setXaiKey] = useState('');

  // Fetch API key status when component mounts
  useEffect(() => {
    fetchKeyStatus();
  }, []);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyIcon size={16} />
          API Keys
          {(keyStatus.hasOpenaiKey || keyStatus.hasXaiKey) && (
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage API Keys</DialogTitle>
          <DialogDescription>
            Add your own API keys to use your credits and access different models.
            Your keys are encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* OpenAI API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              {keyStatus.hasOpenaiKey && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400">✓ Active</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApiKeys(['openai'])}
                    disabled={loading}
                  >
                    <TrashIcon size={16} />
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                >
                  {showOpenaiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </Button>
              </div>
              <Button onClick={handleOpenaiSave} disabled={loading}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* xAI API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="xai-key">xAI API Key</Label>
              {keyStatus.hasXaiKey && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400">✓ Active</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApiKeys(['xai'])}
                    disabled={loading}
                  >
                    <TrashIcon size={16} />
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowXaiKey(!showXaiKey)}
                >
                  {showXaiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </Button>
              </div>
              <Button onClick={handleXaiSave} disabled={loading}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="underline">
                xAI Console
              </a>
            </p>
          </div>

          {/* Clear All */}
          {(keyStatus.hasOpenaiKey || keyStatus.hasXaiKey) && (
            <div className="pt-4 border-t">
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
              >
                Clear All API Keys
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 