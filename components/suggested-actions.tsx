// Filepath: components/suggested-actions.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
      message: Message | CreateMessage,
      chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'What is the dosage',
      label: 'for propofol?',
      action: 'What is the dosage for propofol?',
    },
    {
      title: 'Explain the steps',
      label: 'for intubation',
      action: 'Explain the steps for intubation',
    },
    {
      title: 'What are the contraindications',
      label: 'for spinal anesthesia?',
      action: 'What are the contraindications for spinal anesthesia?',
    },
    {
      title: 'What are the emergency protocols',
      label: 'for malignant hyperthermia?',
      action: 'What are the emergency protocols for malignant hyperthermia?',
    },
  ];

  return (
      <div className="grid sm:grid-cols-2 gap-2 w-full">
        {suggestedActions.map((suggestedAction, index) => (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * index }}
                key={`suggested-action-${suggestedAction.title}-${index}`}
                className={index > 1 ? 'hidden sm:block' : 'block'}
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
                  className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
              >
                <span className="font-medium">{suggestedAction.title}</span>
                <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
              </Button>
            </motion.div>
        ))}
      </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);