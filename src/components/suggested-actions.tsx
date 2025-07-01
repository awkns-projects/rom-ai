'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      emoji: '🛒',
      title: 'Build a Shopify inventory optimizer',
      label: 'using Shopify API + Google Sheets integration',
      action: 'Create an app that connects to Shopify API to track inventory levels, automatically updates Google Sheets with low-stock alerts, and sends Gmail notifications when items need restocking',
    },
    {
      emoji: '📸',
      title: 'Launch an Instagram engagement tracker',
      label: 'with Instagram API + automated DM responses',
      action: 'Build a tool using Instagram Basic Display API to track follower engagement, analyze post performance, and automatically respond to DMs with customized messages based on user interactions',
    },
    {
      emoji: '📧',
      title: 'Create a Gmail-powered lead manager',
      label: 'that extracts contacts and schedules follow-ups',
      action: 'Develop an app using Gmail API to automatically extract leads from emails, organize them in a CRM dashboard, and schedule follow-up emails with personalized templates and tracking',
    },
    {
      emoji: '📦',
      title: 'Design a multi-platform order tracker',
      label: 'connecting Shopify + PayPal + Gmail notifications',
      action: 'Build a unified dashboard that uses Shopify API and PayPal API to track orders across platforms, automatically sends status updates via Gmail API, and provides customer analytics',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className="w-full"
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-4 text-sm flex gap-3 w-full h-auto justify-start items-start hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-muted/30 rounded-lg text-lg sm:text-xl">
              {suggestedAction.emoji}
            </div>
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <span className="font-medium text-foreground w-full text-wrap">{suggestedAction.title}</span>
              <span className="text-muted-foreground w-full text-wrap text-xs leading-relaxed">
                {suggestedAction.label}
              </span>
            </div>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
