/**
 * Suggested Actions Component
 * 
 * A client-side component that displays a grid of suggested anesthesiology-related
 * actions for users to quickly select common queries. It shows 4 randomly selected
 * actions from a predefined list, with responsive layout for different screen sizes.
 * 
 * Filepath: components/suggested-actions.tsx
 */
'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo, useMemo } from 'react';

/**
 * Interface for the suggested actions component
 * Defines the props required for the component to function
 */
interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

/**
 * Comprehensive list of all possible suggested actions
 * Each action contains a title, descriptive label, and the actual query text
 */
const ALL_SUGGESTED_ACTIONS = [
  {
    title: '计算剂量',
    label: '用于儿童患者的罗库溴铵',
    action: '罗库溴铵在儿童患者中的剂量是多少？',
  },
  {
    title: '处理方案',
    label: '针对疑似局部麻醉药毒性',
    action: '疑似局部麻醉药毒性的处理方案是什么？',
  },
  {
    title: '解释准备步骤',
    label: '用于快速序贯诱导',
    action: '快速序贯诱导的准备步骤是什么？',
  },
  {
    title: '禁忌症',
    label: '在产科患者中使用硬膜外麻醉',
    action: '硬膜外麻醉在产科患者中的禁忌症是什么？',
  },
  {
    title: '麻醉深度',
    label: '监测BIS指数的临床意义',
    action: 'BIS指数在衡量麻醉深度中的临床应用和解释是什么？',
  },
  {
    title: '并发症预防',
    label: '全麻术后恶心呕吐',
    action: '如何预防和处理全麻术后恶心呕吐？',
  },
  {
    title: '药物相互作用',
    label: '肌松药与抗生素',
    action: '肌松药与抗生素之间有哪些重要的相互作用？',
  },
  {
    title: '麻醉方案',
    label: '老年髋部骨折手术',
    action: '老年髋部骨折手术病人的麻醉方案选择考虑？',
  },
  {
    title: '术中监测',
    label: '神经外科手术体位',
    action: '神经外科手术特殊体位的血流动力学监测重点是什么？',
  },
  {
    title: '急救流程',
    label: '气管插管困难',
    action: '遇到困难气道时的应急处理流程是什么？',
  },
  {
    title: '用药指导',
    label: '术中镇痛药物选择',
    action: '不同类型手术的术中镇痛药物如何选择？',
  },
  {
    title: '特殊情况',
    label: '孕妇急诊手术',
    action: '孕妇急诊手术的麻醉注意事项有哪些？',
  },
  {
    title: '并发症处理',
    label: '椎管内麻醉后头痛',
    action: '如何处理椎管内麻醉后的头痛？',
  },
  {
    title: '设备使用',
    label: '麻醉深度监测仪器',
    action: '麻醉深度监测仪器的正确使用方法和注意事项？',
  },
  {
    title: '术后护理',
    label: '日间手术麻醉',
    action: '日间手术病人的术后观察和出院标准是什么？',
  },
  {
    title: '特殊人群',
    label: '高龄患者麻醉',
    action: '高龄患者麻醉的特殊注意事项有哪些？',
  },
];

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * 
 * @template T - The type of elements in the array
 * @param array - The array to shuffle
 * @returns A new array with the same elements in a random order
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pure component for displaying suggested actions
 * 
 * @param chatId - The ID of the chat session
 * @param append - The function to append a new message to the chat
 * @returns A React component that displays 4 suggested actions
 */
function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  // Use useMemo to keep the same 4 actions until component remount
  const suggestedActions = useMemo(() => {
    return shuffleArray(ALL_SUGGESTED_ACTIONS).slice(0, 4);
  }, []);

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

/**
 * Memoized version of the SuggestedActions component
 * 
 * @param props - The props for the component
 * @returns A memoized version of the PureSuggestedActions component
 */
export const SuggestedActions = memo(PureSuggestedActions, () => true);