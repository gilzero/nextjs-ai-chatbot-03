/**
 * Core utility functions for message handling, data transformation, and common operations.
 * This module provides essential utilities used throughout the application.
 */

import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  Message,
  ToolInvocation,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@/lib/db/schema';

/**
 * Combines Tailwind CSS classes with custom class values.
 * Merges multiple class values into a single string using clsx and tailwind-merge.
 * 
 * @param inputs - Array of class values to be merged
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extended Error interface for application-specific error handling
 */
interface ApplicationError extends Error {
  info: string;
  status: number;
}

/**
 * Generic data fetcher with error handling
 * Performs a fetch request and handles common error cases
 * 
 * @param url - The URL to fetch data from
 * @throws {ApplicationError} When the fetch request fails
 * @returns Parsed JSON response
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

/**
 * Retrieves data from localStorage with browser environment check
 * 
 * @param key - The localStorage key to retrieve
 * @returns Parsed data from localStorage or empty array if not found/available
 */
export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

/**
 * Generates a RFC4122 version 4 compliant UUID
 * Uses a combination of random and reserved bits as specified in the RFC
 * 
 * @returns A randomly generated UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Adds tool message results to existing chat messages
 * Updates tool invocations with their corresponding results
 * 
 * @param toolMessage - The tool message containing results
 * @param messages - Array of existing chat messages
 * @returns Updated array of messages with tool results
 */
function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          // Find matching tool result for the invocation
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

/**
 * Converts database messages to UI-friendly message format
 * Handles different message types and content structures
 * 
 * @param messages - Array of database messages
 * @returns Converted array of UI messages
 */
export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    // Handle tool messages separately
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = '';
    const toolInvocations: Array<ToolInvocation> = [];

    // Process different content types
    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'tool-call') {
          toolInvocations.push({
            state: 'call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

/**
 * Sanitizes response messages by removing invalid or incomplete tool calls
 * 
 * @param messages - Array of tool or assistant messages
 * @returns Sanitized array of messages
 */
export function sanitizeResponseMessages(
  messages: Array<CoreToolMessage | CoreAssistantMessage>,
): Array<CoreToolMessage | CoreAssistantMessage> {
  // Collect all valid tool result IDs
  const toolResultIds: Array<string> = [];
  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  // Filter and sanitize messages
  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;
    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

/**
 * Sanitizes UI messages by removing invalid or incomplete tool invocations
 * 
 * @param messages - Array of UI messages
 * @returns Sanitized array of UI messages
 */
export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;
    if (!message.toolInvocations) return message;

    // Collect valid tool result IDs
    const toolResultIds: Array<string> = [];
    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    // Filter valid tool invocations
    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

/**
 * Retrieves the most recent user message from a message array
 * 
 * @param messages - Array of core messages
 * @returns The most recent user message or undefined
 */
export function getMostRecentUserMessage(messages: Array<CoreMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

/**
 * Gets the timestamp for a document at a specific index
 * 
 * @param documents - Array of documents
 * @param index - Index of the desired document
 * @returns Document timestamp or current date if not found
 */
export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

/**
 * Extracts message ID from annotations or returns original ID
 * 
 * @param message - Message object
 * @returns Message ID from annotations or original message ID
 */
export function getMessageIdFromAnnotations(message: Message) {
  if (!message.annotations) return message.id;

  const [annotation] = message.annotations;
  if (!annotation) return message.id;

  // @ts-expect-error messageIdFromServer is not defined in MessageAnnotation
  return annotation.messageIdFromServer;
}