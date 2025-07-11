'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyIcon } from './icons';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApiKey: () => void;
}

export function RateLimitModal({ isOpen, onClose, onAddApiKey }: RateLimitModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddApiKey = async () => {
    setIsLoading(true);
    try {
      onAddApiKey();
      onClose();
    } catch (error) {
      console.error('Error opening API key modal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-black/95 border-green-500/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-green-200 font-mono text-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-center">
              <span className="text-black text-lg">⚠️</span>
            </div>
            Daily Message Limit Reached
          </DialogTitle>
          <DialogDescription className="text-green-400 font-mono">
            You've reached your daily message limit. To continue chatting, you can add your own API keys to use your credits instead of our shared resources.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3 mb-3">
              <KeyIcon size={20} />
              <span className="text-green-200 font-medium font-mono">Benefits of Adding Your API Keys</span>
            </div>
            <ul className="text-sm text-green-400 font-mono space-y-2">
              <li>• <strong>Unlimited messaging</strong> - Use your own credits</li>
              <li>• <strong>Access to all models</strong> - OpenAI GPT-4o, Grok, etc.</li>
              <li>• <strong>Faster responses</strong> - No shared rate limits</li>
              <li>• <strong>Secure storage</strong> - Your keys are encrypted</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-sm text-blue-400 font-mono">
              <strong>Supported Providers:</strong>
              <div className="mt-2 space-y-1">
                <div>🤖 <strong>OpenAI</strong> - GPT-4o, GPT-4o Mini</div>
                <div>🚀 <strong>xAI (Grok)</strong> - Grok 3</div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="btn-matrix border-green-500/30 hover:border-green-500/50 text-white hover:text-green-200 bg-transparent hover:bg-green-500/10"
          >
            <span className="font-mono">Maybe Later</span>
          </Button>
          <Button
            onClick={handleAddApiKey}
            disabled={isLoading}
            className="btn-matrix bg-green-600 hover:bg-green-700 text-black font-bold"
          >
            <div className="flex items-center gap-2">
              <KeyIcon size={16} />
              <span className="font-mono">Add API Keys</span>
            </div>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 