import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
} from './schema';
import { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Retrieves a user from the database by their email address.
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<Array<User>>} A promise that resolves to an array of users matching the email (should be only one).
 * @throws {Error} If there is an error retrieving the user from the database.
 */
export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

/**
 * Creates a new user in the database.
 * @param {string} email - The email address of the new user.
 * @param {string} password - The password of the new user.
 * @returns {Promise<void>} A promise that resolves when the user is created.
 * @throws {Error} If there is an error creating the user in the database.
 */
export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

/**
 * Saves a new chat to the database.
 * @param {object} params - An object containing the chat details.
 * @param {string} params.id - The unique ID of the chat.
 * @param {string} params.userId - The ID of the user who created the chat.
 * @param {string} params.title - The title of the chat.
 * @returns {Promise<void>} A promise that resolves when the chat is saved.
 * @throws {Error} If there is an error saving the chat to the database.
 */
export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

/**
 * Deletes a chat from the database by its ID.
 * Also deletes associated votes and messages.
 * @param {object} params - An object containing the chat ID.
 * @param {string} params.id - The ID of the chat to delete.
 * @returns {Promise<void>} A promise that resolves when the chat is deleted.
 * @throws {Error} If there is an error deleting the chat from the database.
 */
export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

/**
 * Retrieves all chats for a given user ID.
 * @param {object} params - An object containing the user ID.
 * @param {string} params.id - The ID of the user whose chats to retrieve.
 * @returns {Promise<Array<Chat>>} A promise that resolves to an array of chats for the user.
 * @throws {Error} If there is an error retrieving the chats from the database.
 */
export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

/**
 * Retrieves a chat from the database by its ID.
 * @param {object} params - An object containing the chat ID.
 * @param {string} params.id - The ID of the chat to retrieve.
 * @returns {Promise<Chat | undefined>} A promise that resolves to the chat object, or undefined if not found.
 * @throws {Error} If there is an error retrieving the chat from the database.
 */
export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

/**
 * Saves multiple messages to the database.
 * @param {object} params - An object containing the array of messages.
 * @param {Array<Message>} params.messages - The array of messages to save.
 * @returns {Promise<void>} A promise that resolves when the messages are saved.
 * @throws {Error} If there is an error saving the messages to the database.
 */
export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

/**
 * Retrieves all messages for a given chat ID.
 * @param {object} params - An object containing the chat ID.
 * @param {string} params.id - The ID of the chat whose messages to retrieve.
 * @returns {Promise<Array<Message>>} A promise that resolves to an array of messages for the chat.
 * @throws {Error} If there is an error retrieving the messages from the database.
 */
export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

/**
 * Records a vote for a message in a chat.
 * If a vote already exists for the message, it updates the existing vote.
 * @param {object} params - An object containing the vote details.
 * @param {string} params.chatId - The ID of the chat the message belongs to.
 * @param {string} params.messageId - The ID of the message being voted on.
 * @param {'up' | 'down'} params.type - The type of vote ('up' or 'down').
 * @returns {Promise<void>} A promise that resolves when the vote is recorded.
 * @throws {Error} If there is an error recording the vote in the database.
 */
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

/**
 * Retrieves all votes for a given chat ID.
 * @param {object} params - An object containing the chat ID.
 * @param {string} params.id - The ID of the chat whose votes to retrieve.
 * @returns {Promise<Array<Vote>>} A promise that resolves to an array of votes for the chat.
 * @throws {Error} If there is an error retrieving the votes from the database.
 */
export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

/**
 * Saves a new document to the database.
 * @param {object} params - An object containing the document details.
 * @param {string} params.id - The unique ID of the document.
 * @param {string} params.title - The title of the document.
 * @param {BlockKind} params.kind - The kind of the document.
 * @param {string} params.content - The content of the document.
 * @param {string} params.userId - The ID of the user who created the document.
 * @returns {Promise<void>} A promise that resolves when the document is saved.
 * @throws {Error} If there is an error saving the document to the database.
 */
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

/**
 * Retrieves all documents with a given ID.
 * @param {object} params - An object containing the document ID.
 * @param {string} params.id - The ID of the document to retrieve.
 * @returns {Promise<Array<Document>>} A promise that resolves to an array of documents with the given ID.
 * @throws {Error} If there is an error retrieving the documents from the database.
 */
export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

/**
 * Retrieves a single document from the database by its ID.
 * @param {object} params - An object containing the document ID.
 * @param {string} params.id - The ID of the document to retrieve.
 * @returns {Promise<Document | undefined>} A promise that resolves to the document object, or undefined if not found.
 * @throws {Error} If there is an error retrieving the document from the database.
 */
export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

/**
 * Deletes documents with a given ID that were created after a specific timestamp.
 * Also deletes associated suggestions.
 * @param {object} params - An object containing the document ID and timestamp.
 * @param {string} params.id - The ID of the document to delete.
 * @param {Date} params.timestamp - The timestamp to compare against.
 * @returns {Promise<void>} A promise that resolves when the documents are deleted.
 * @throws {Error} If there is an error deleting the documents from the database.
 */
export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

/**
 * Saves multiple suggestions to the database.
 * @param {object} params - An object containing the array of suggestions.
 * @param {Array<Suggestion>} params.suggestions - The array of suggestions to save.
 * @returns {Promise<void>} A promise that resolves when the suggestions are saved.
 * @throws {Error} If there is an error saving the suggestions to the database.
 */
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

/**
 * Retrieves all suggestions for a given document ID.
 * @param {object} params - An object containing the document ID.
 * @param {string} params.documentId - The ID of the document whose suggestions to retrieve.
 * @returns {Promise<Array<Suggestion>>} A promise that resolves to an array of suggestions for the document.
 * @throws {Error} If there is an error retrieving the suggestions from the database.
 */
export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

/**
 * Retrieves a message from the database by its ID.
 * @param {object} params - An object containing the message ID.
 * @param {string} params.id - The ID of the message to retrieve.
 * @returns {Promise<Array<Message>>} A promise that resolves to an array containing the message, or an empty array if not found.
 * @throws {Error} If there is an error retrieving the message from the database.
 */
export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

/**
 * Deletes messages with a given chat ID that were created on or after a specific timestamp.
 * @param {object} params - An object containing the chat ID and timestamp.
 * @param {string} params.chatId - The ID of the chat whose messages to delete.
 * @param {Date} params.timestamp - The timestamp to compare against.
 * @returns {Promise<void>} A promise that resolves when the messages are deleted.
 * @throws {Error} If there is an error deleting the messages from the database.
 */
export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

/**
 * Updates the visibility of a chat by its ID.
 * @param {object} params - An object containing the chat ID and visibility.
 * @param {string} params.chatId - The ID of the chat to update.
 * @param {'private' | 'public'} params.visibility - The new visibility of the chat.
 * @returns {Promise<void>} A promise that resolves when the chat visibility is updated.
 * @throws {Error} If there is an error updating the chat visibility in the database.
 */
export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}