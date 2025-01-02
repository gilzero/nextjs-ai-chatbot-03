/**
 * Server Actions Module
 *
 * Provides Next.js server actions for chat management, including model selection,
 * title generation, message management, and visibility controls. These functions
 * are designed to run exclusively on the server side.
 *
 * Filepath: app/(chat)/actions.ts
 */

'use server';

import { type CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';
import { customModel } from '@/lib/ai';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';
import { logError } from '@/lib/utils'; // Import the logging utility

/**
 * Saves the selected AI model identifier to cookies
 * Used for persisting model preference across sessions
 *
 * @param model - The identifier of the selected AI model
 */
export async function saveModelId(model: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('model-id', model);
  } catch (error) {
    logError('Error saving model ID to cookies', error);
    throw new Error('Failed to save model ID.');
  }
}

/**
 * Generates a chat title based on the initial user message
 * Uses a specialized model prompt to create concise, relevant titles
 *
 * @param params.message - The initial user message to base the title on
 * @returns Promise resolving to the generated title string
 *
 * Constraints:
 * - Maximum 80 characters
 * - No quotes or colons
 * - Summarizes message content
 */
export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  try {
    const { text: title } = await generateText({
      model: customModel('gpt-4o-mini'),
      system: `
        - you will generate a short title based on the first message a user begins a conversation with
        - ensure it is not more than 80 characters long
        - the title should be a summary of the user's message
        - do not use quotes or colons`,
      prompt: JSON.stringify(message),
    });
    return title;
  } catch (error) {
    logError('Error generating title from user message', error);
    throw new Error('Failed to generate title.');
  }
}

/**
 * Deletes messages in a chat that occur after a specified message
 * Useful for rolling back conversation state or removing unwanted messages
 *
 * @param params.id - ID of the message to delete from (inclusive)
 * @throws Error if message retrieval or deletion fails
 */
export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const [message] = await getMessageById({ id });
    if (!message) {
      throw new Error(`Message with id ${id} not found.`);
    }
    await deleteMessagesByChatIdAfterTimestamp({
      chatId: message.chatId,
      timestamp: message.createdAt,
    });
  } catch (error) {
    logError('Error deleting trailing messages', error);
    throw new Error('Failed to delete trailing messages.');
  }
}

/**
 * Updates the visibility settings for a chat
 * Controls whether a chat is public or private
 *
 * @param params.chatId - ID of the chat to update
 * @param params.visibility - New visibility setting to apply
 * @throws Error if visibility update fails
 */
export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  try {
    await updateChatVisiblityById({ chatId, visibility });
  } catch (error) {
    logError('Error updating chat visibility', error);
    throw new Error('Failed to update chat visibility.');
  }
}