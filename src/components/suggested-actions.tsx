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
      emoji: '👋',
      title: 'Tell us about your work',
      label: 'Share your role, daily tasks, and biggest challenges',
      action: 'I work as a [your job title] and spend most of my time on [describe main activities]. My biggest challenge is [what takes too much time or is repetitive]. I use tools like [mention apps/platforms you use] and would love help with [specific area you want automated].',
    },
    {
      emoji: '💪',
      title: 'Share your wellness goals',
      label: 'Health, fitness, or personal tracking needs',
      action: 'I want to improve my [health/fitness/wellness] by tracking [specific metrics or habits]. I currently struggle with [consistency/motivation/organization] and use [current apps or methods]. I would love an agent that helps me [specific goal] by [how you want to be supported].',
    },
    {
      emoji: '🎯',
      title: 'Describe your creative projects',
      label: 'Content creation, marketing, or personal ventures',
      action: 'I create [type of content/run a business] focused on [your niche/audience]. I spend too much time on [repetitive tasks] and struggle with [specific challenge like scheduling, ideas, engagement]. I use [platforms/tools] and need help with [specific area] to grow my [business/following/impact].',
    },
    {
      emoji: '🏠',
      title: 'Share your personal life needs',
      label: 'Family, home management, or lifestyle automation',
      action: 'In my personal life, I manage [family responsibilities/household tasks/personal projects] and find it challenging to [organize/track/remember] everything. I want an agent that helps me [specific need] by [how you envision being helped] so I can [desired outcome].',
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
