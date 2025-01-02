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
      title: '计算剂量',
      label: '用于儿童患者的罗库溴铵。',
      action: '罗库溴铵在儿童患者中的剂量是多少？',
    },
    {
      title: '处理方案',
      label: '针对疑似局部麻醉药毒性。',
      action: '疑似局部麻醉药毒性的处理方案是什么？',
    },
    {
      title: '解释准备步骤',
      label: '用于快速序贯诱导。',
      action: '快速序贯诱导的准备步骤是什么？',
    },
    {
      title: '禁忌症',
      label: '在产科患者中使用硬膜外麻醉。',
      action: '硬膜外麻醉在产科患者中的禁忌症是什么？',
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