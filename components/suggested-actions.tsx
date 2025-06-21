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
      title: 'Analyze my spending patterns',
      label: 'and create a budget optimization plan',
      action: 'Analyze my spending patterns across multiple accounts and create a personalized budget optimization plan with investment recommendations',
    },
    {
      title: 'Monitor news and trends',
      label: 'for my industry and competitors',
      action: 'Monitor news, market trends, and competitor activities in my industry, then provide weekly strategic insights and recommendations',
    },
    {
      title: 'Automate my content pipeline',
      label: 'from research to publication',
      action: 'Create an automated content pipeline that researches topics, generates drafts, fact-checks information, and schedules publication across platforms',
    },
    {
      title: 'Optimize my learning path',
      label: 'based on career goals and progress',
      action: 'Analyze my current skills, career goals, and learning progress to create a personalized curriculum with adaptive scheduling and progress tracking',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full max-w-full overflow-hidden"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={`${index > 1 ? 'hidden sm:block' : 'block'} min-w-0 w-full`}
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
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start min-w-0 overflow-hidden"
          >
            <span className="font-medium break-words line-clamp-2 w-full">{suggestedAction.title}</span>
            <span className="text-muted-foreground break-words line-clamp-2 w-full">
              {suggestedAction.label}
            </span>
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
