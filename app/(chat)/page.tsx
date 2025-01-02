/**
 * Main Chat Page Component
 * 
 * Initializes a new chat session with unique ID and user preferences.
 * This is the entry point for starting new conversations in the application.
 */

import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

/**
 * Default page component for initiating new chat sessions
 * 
 * Creates a fresh chat instance with:
 * - Unique identifier
 * - User's preferred model (from cookies or default)
 * - Private visibility setting
 * - Empty message history
 * 
 * @returns JSX element containing the chat interface and data stream handler
 */
export default async function Page() {
  // Generate unique identifier for new chat session
  const id = generateUUID();

  // Retrieve user's model preference from cookies
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  // Select model based on cookie preference or fall back to default
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      {/* Initialize new chat interface */}
      <Chat
        key={id}  // Ensure fresh instance on navigation
        id={id}
        initialMessages={[]}  // Start with empty chat
        selectedModelId={selectedModelId}
        selectedVisibilityType="private"  // Default to private chat
        isReadonly={false}  // Enable full interaction
      />
      
      {/* Handle real-time data streaming */}
      <DataStreamHandler id={id} />
    </>
  );
}