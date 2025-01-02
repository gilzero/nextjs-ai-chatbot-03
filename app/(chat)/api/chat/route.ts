/**
 * @fileoverview This file defines the API routes for handling chat interactions,
 * including initiating new chats, continuing existing conversations, and deleting chats.
 * It integrates with various AI models, provides tooling capabilities, and uses server-sent
 * events (SSE) for real-time streaming of responses.
 *
 * The API supports the following functionalities:
 *   - POST /api/chat: Creates a new chat or continues an existing one, processing user messages
 *     and generating AI responses. It also supports tool execution for tasks like document
 *     creation, updates, and suggestion requests.
 *   - DELETE /api/chat?id={chatId}: Deletes a chat by its ID, ensuring the user is authorized
 *     to delete the chat.
 *
 * The API uses the following technologies:
 *   - Next.js API routes for handling HTTP requests.
 *   - `ai` library for interacting with AI models and managing message streams.
 *   - `zod` for schema validation of tool parameters.
 *   - Custom modules for authentication, AI model selection, prompts, database queries, and
 *     utility functions.
 *   - Server-sent events (SSE) for streaming AI responses to the client.
 *
 * The API supports the following tools:
 *   - `getWeather`: Fetches weather data from an external API.
 *   - `createDocument`: Creates a new document with a given title and kind (text or code).
 *   - `updateDocument`: Updates an existing document with a given description.
 *   - `requestSuggestions`: Requests suggestions for improving a document.
 *
 * The API uses a data stream to send the following types of data to the client:
 *   - `user-message-id`: The ID of the user's message.
 *   - `id`: The ID of a created document.
 *   - `title`: The title of a created document.
 *   - `kind`: The kind of a created document (text or code).
 *   - `clear`: A signal to clear the content of a document.
 *   - `text-delta`: A text delta for streaming text content.
 *   - `code-delta`: A code delta for streaming code content.
 *   - `finish`: A signal that the document creation/update is finished.
 *   - `suggestion`: A suggestion for improving a document.
 *
 * @module app/(chat)/api/chat/route
 */

import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamObject,
  streamText,
  type CoreAssistantMessage,
  type CoreToolMessage,
  type CoreUserMessage,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel, anthropicModel, googleModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
} from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const BLOCKS_TOOLS: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const WEATHER_TOOLS: AllowedTools[] = ['getWeather'];

const ALL_TOOLS: AllowedTools[] = [...BLOCKS_TOOLS, ...WEATHER_TOOLS];

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

const TOOL_DESCRIPTIONS = {
  getWeather: 'Get the current weather at a location',
  createDocument:
    'Create a document for a writing activity. This tool will call other functions that will generate the contents of the document based on the title and kind.',
  updateDocument: 'Update a document with the given description.',
  requestSuggestions: 'Request suggestions for a document',
};

const DATA_STREAM_TYPES = {
  USER_MESSAGE_ID: 'user-message-id',
  ID: 'id',
  TITLE: 'title',
  KIND: 'kind',
  CLEAR: 'clear',
  TEXT_DELTA: 'text-delta',
  CODE_DELTA: 'code-delta',
  FINISH: 'finish',
  SUGGESTION: 'suggestion',
};

type ChatRequest = {
  id: string;
  messages: Message[];
  modelId: string;
};

type ToolExecutionParams<T extends AllowedTools> =
  T extends 'getWeather'
    ? { latitude: number; longitude: number }
    : T extends 'createDocument'
      ? { title: string; kind: 'text' | 'code' }
      : T extends 'updateDocument'
        ? { id: string; description: string }
        : T extends 'requestSuggestions'
          ? { documentId: string }
          : never;

const TELEMETRY_ENABLED = true;
const TELEMETRY_FUNCTION_ID = 'stream-text';

type DataStreamType = {
  writeData: (data: { type: string; content: any }) => void;
  writeMessageAnnotation?: (annotation: { messageIdFromServer: string }) => void;
  // Add other methods or properties as needed
};

function writeDataToStream(
  dataStream: DataStreamType,
  type: string,
  content: any,
) {
  dataStream.writeData({ type, content });
}

async function authenticateUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

async function validateModel(modelId: string) {
  const model = models.find((model) => model.id === modelId);
  if (!model) {
    throw new Error('Model not found');
  }
  return model;
}

async function getOrCreateChat(id: string, userId: string, userMessage: CoreUserMessage) {
  const chat = await getChatById({ id });
  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId, title });
  }
}

async function saveUserMessage(id: string, userMessage: CoreUserMessage) {
  const userMessageId = generateUUID();
  await saveMessages({
    messages: [{ ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id }],
  });
  return userMessageId;
}

function selectModel(modelId: string) {
  if (modelId.startsWith('claude')) {
    return anthropicModel(modelId);
  } else if (modelId.startsWith('gemini')) {
    return googleModel(modelId);
  } else {
    return customModel(modelId);
  }
}

async function handleGetWeather(
  dataStream: DataStreamType,
  { latitude, longitude }: ToolExecutionParams<'getWeather'>,
) {
  const response = await fetch(
    `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}¤t=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
  );
  const weatherData = await response.json();
  return weatherData;
}

async function streamDocumentContent(
  dataStream: DataStreamType,
  model: { apiIdentifier: string },
  systemPrompt: string,
  prompt: string,
  schema?: z.ZodObject<any>,
  kind: 'text' | 'code' = 'text',
) {
  let draftText = '';
  if (kind === 'text') {
    const { fullStream } = streamText({
      model: customModel(model.apiIdentifier),
      system: systemPrompt,
      prompt: prompt,
    });

    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        draftText += delta.textDelta;
        writeDataToStream(
          dataStream,
          DATA_STREAM_TYPES.TEXT_DELTA,
          delta.textDelta,
        );
      }
    }
  } else if (kind === 'code' && schema) {
    const { fullStream } = streamObject({
      model: customModel(model.apiIdentifier),
      system: systemPrompt,
      prompt: prompt,
      schema: schema,
    });

    for await (const delta of fullStream) {
      if (delta.type === 'object' && delta.object.code) {
        draftText = delta.object.code;
        writeDataToStream(
          dataStream,
          DATA_STREAM_TYPES.CODE_DELTA,
          delta.object.code,
        );
      }
    }
  }
  return draftText;
}

async function handleCreateDocument(
  dataStream: DataStreamType,
  model: { apiIdentifier: string },
  userId: string,
  { title, kind }: ToolExecutionParams<'createDocument'>,
) {
  const id = generateUUID();
  writeDataToStream(dataStream, DATA_STREAM_TYPES.ID, id);
  writeDataToStream(dataStream, DATA_STREAM_TYPES.TITLE, title);
  writeDataToStream(dataStream, DATA_STREAM_TYPES.KIND, kind);
  writeDataToStream(dataStream, DATA_STREAM_TYPES.CLEAR, '');

  const draftText = await streamDocumentContent(
    dataStream,
    model,
    kind === 'text'
      ? 'Write about the given topic. Markdown is supported. Use headings wherever appropriate.'
      : codePrompt,
    title,
    kind === 'code' ? z.object({ code: z.string() }) : undefined,
    kind,
  );

  writeDataToStream(dataStream, DATA_STREAM_TYPES.FINISH, '');

  await saveDocument({ id, title, kind, content: draftText, userId });

  return {
    id,
    title,
    kind,
    content: 'A document was created and is now visible to the user.',
  };
}

async function handleUpdateDocument(
  dataStream: DataStreamType,
  model: { apiIdentifier: string },
  userId: string,
  { id, description }: ToolExecutionParams<'updateDocument'>,
) {
  const document = await getDocumentById({ id });
  if (!document) {
    return { error: 'Document not found' };
  }

  writeDataToStream(dataStream, DATA_STREAM_TYPES.CLEAR, document.title);

  const draftText = await streamDocumentContent(
    dataStream,
    model,
    updateDocumentPrompt(document.content),
    description,
    document.kind === 'code' ? z.object({ code: z.string() }) : undefined,
    document.kind,
  );

  writeDataToStream(dataStream, DATA_STREAM_TYPES.FINISH, '');

  await saveDocument({
    id,
    title: document.title,
    content: draftText,
    kind: document.kind,
    userId,
  });

  return {
    id,
    title: document.title,
    kind: document.kind,
    content: 'The document has been updated successfully.',
  };
}

async function handleRequestSuggestions(
  dataStream: DataStreamType,
  model: { apiIdentifier: string },
  userId: string,
  { documentId }: ToolExecutionParams<'requestSuggestions'>,
) {
  const document = await getDocumentById({ id: documentId });
  if (!document?.content) {
    return { error: 'Document not found' };
  }

  const suggestions: Array<
    Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
  > = [];

  const { elementStream } = streamObject({
    model: customModel(model.apiIdentifier),
    system:
      'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
    prompt: document.content,
    output: 'array',
    schema: z.object({
      originalSentence: z.string().describe('The original sentence'),
      suggestedSentence: z.string().describe('The suggested sentence'),
      description: z.string().describe('The description of the suggestion'),
    }),
  });

  for await (const element of elementStream) {
    const suggestion = {
      originalText: element.originalSentence,
      suggestedText: element.suggestedSentence,
      description: element.description,
      id: generateUUID(),
      documentId: documentId,
      isResolved: false,
    };

    writeDataToStream(dataStream, DATA_STREAM_TYPES.SUGGESTION, suggestion);
    suggestions.push(suggestion);
  }

  await saveSuggestions({
    suggestions: suggestions.map((suggestion) => ({
      ...suggestion,
      userId,
      createdAt: new Date(),
      documentCreatedAt: document.createdAt,
    })),
  });

  return {
    id: documentId,
    title: document.title,
    kind: document.kind,
    message: 'Suggestions have been added to the document',
  };
}

async function saveResponseMessages(
  dataStream: DataStreamType,
  chatId: string,
  responseMessages: (CoreAssistantMessage | CoreToolMessage)[],
) {
  try {
    const sanitizedMessages = sanitizeResponseMessages(responseMessages);
    await saveMessages({
      messages: sanitizedMessages.map((message) => {
        const messageId = generateUUID();
        if (message.role === 'assistant' && dataStream.writeMessageAnnotation) {
          dataStream.writeMessageAnnotation({ messageIdFromServer: messageId });
        }
        return {
          id: messageId,
          chatId,
          role: message.role,
          content: message.content,
          createdAt: new Date(),
        };
      }),
    });
  } catch (error: any) {
    console.error('Failed to save chat messages:', error);
    throw new Error(`Failed to save chat messages: ${error.message}`);
  }
}

/**
 * Centralized error handling function.
 * @param {Error} error - The error object.
 * @param {number} status - The HTTP status code.
 * @returns {Response} - A formatted Response object.
 */
function handleApiError(error: any, status: number): Response {
  const errorMessage = error.message || 'Internal Server Error';
  const errorStack = error.stack || 'No stack trace available';

  console.error(`API Error: ${errorMessage}`, {
    error: error,
    stack: errorStack,
  });

  let emoji = '⚠️';
  if (status === 401) {
    emoji = '🔒';
  } else if (status === 404) {
    emoji = '🔍';
  } else if (status >= 500) {
    emoji = '🔥';
  }

  return new Response(`${emoji} ${errorMessage}`, {
    status,
  });
}

/**
 * Handles the POST request for the chat API.
 *
 * @param {Request} request - The incoming request object.
 * @returns {Promise<Response>} - The response object.
 */
export async function POST(request: Request) {
  try {
    const { id, messages, modelId }: ChatRequest = await request.json();
    console.log('API Request Body:', { id, messages, modelId });

    const userId = await authenticateUser();
    const model = await validateModel(modelId);

    const coreMessages = convertToCoreMessages(messages);
    const userMessage = getMostRecentUserMessage(coreMessages);
    if (!userMessage) {
      return handleApiError(new Error('No user message found'), 400);
    }

    await getOrCreateChat(id, userId, userMessage);
    const userMessageId = await saveUserMessage(id, userMessage);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        writeDataToStream(
          dataStream,
          DATA_STREAM_TYPES.USER_MESSAGE_ID,
          userMessageId,
        );

        const selectedModel = selectModel(modelId);
        console.log('Selected Model for streamText:', selectedModel);

        const result = streamText({
          model: selectedModel,
          system: systemPrompt,
          messages: coreMessages,
          maxSteps: 5,
          experimental_activeTools: ALL_TOOLS,
          tools: {
            getWeather: {
              description: TOOL_DESCRIPTIONS.getWeather,
              parameters: z.object({
                latitude: z.number(),
                longitude: z.number(),
              }),
              execute: (params) => handleGetWeather(dataStream, params),
            },
            createDocument: {
              description: TOOL_DESCRIPTIONS.createDocument,
              parameters: z.object({
                title: z.string(),
                kind: z.enum(['text', 'code']),
              }),
              execute: (params) =>
                handleCreateDocument(dataStream, model, userId, params),
            },
            updateDocument: {
              description: TOOL_DESCRIPTIONS.updateDocument,
              parameters: z.object({
                id: z.string().describe('The ID of the document to update'),
                description: z
                  .string()
                  .describe('The description of changes that need to be made'),
              }),
              execute: (params) =>
                handleUpdateDocument(dataStream, model, userId, params),
            },
            requestSuggestions: {
              description: TOOL_DESCRIPTIONS.requestSuggestions,
              parameters: z.object({
                documentId: z
                  .string()
                  .describe('The ID of the document to request edits'),
              }),
              execute: (params) =>
                handleRequestSuggestions(dataStream, model, userId, params),
            },
          },
          onFinish: async ({ response }) => {
            await saveResponseMessages(dataStream, id, response.messages);
          },
          experimental_telemetry: {
            isEnabled: TELEMETRY_ENABLED,
            functionId: TELEMETRY_FUNCTION_ID,
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error: any) {
    console.error('Error processing chat request:', error);
    const status =
      error.message === 'Unauthorized'
        ? 401
        : error.message === 'Model not found'
          ? 404
          : 500;
    return handleApiError(error, status);
  }
}

/**
 * Handles the DELETE request to delete a chat by its ID.
 *
 * @param {Request} request - The incoming DELETE request.
 * @returns {Promise<Response>} - A promise that resolves to a Response object.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return handleApiError(new Error('Chat ID not provided'), 404);
  }

  try {
    const userId = await authenticateUser();
    const chat = await getChatById({ id });

    if (chat.userId !== userId) {
      return handleApiError(new Error('Unauthorized to delete this chat'), 401);
    }

    await deleteChatById({ id });
    return new Response('Chat deleted', { status: 200 });
  } catch (error: any) {
    console.error('Error deleting chat:', error);
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return handleApiError(error, status);
  }
}