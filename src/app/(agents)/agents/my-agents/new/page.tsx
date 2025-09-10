'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleAgentCreator } from '@/components/simple-agent-creator';
import { generateUUID } from '@/lib/utils';

export default function NewAgentPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [documentId] = useState(() => generateUUID());

  const handleAgentComplete = async (agentData: any) => {
    try {
      setIsCreating(true);
      
      // Create a new chat and redirect to it so user can start building their agent
      const chatId = generateUUID();
      
      // Store the avatar/theme preferences in localStorage temporarily
      // so the agentBuilder can pick them up when building the actual agent
      localStorage.setItem('pendingAgentPreferences', JSON.stringify({
        avatar: agentData.avatar,
        theme: agentData.theme,
        name: agentData.name || 'My AI Agent',
        domain: agentData.domain || 'General'
      }));
      
      router.push(`/chat/${chatId}`);
      
    } catch (error) {
      console.error('Failed to create agent:', error);
      setIsCreating(false);
      // TODO: Show error toast/notification
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-green-100 font-mono">Creating Your Agent...</h2>
            <p className="text-green-300/80 font-mono text-sm">Setting up your AI assistant</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SimpleAgentCreator 
          onComplete={handleAgentComplete}
          documentId={documentId}
        />
      </div>
    </div>
  );
}
