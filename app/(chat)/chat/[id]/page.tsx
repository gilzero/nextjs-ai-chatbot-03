/**
 * Chat Page Component
 * 
 * Server-side rendered page component that handles chat display, authentication,
 * and data fetching. Manages visibility permissions and model selection while
 * providing real-time data streaming capabilities.
 */

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

/**
 * Chat page component with server-side data fetching and auth checks
 * 
 * @param props.params - Route parameters containing chat ID
 * @returns JSX element containing chat interface or 404 page
 * 
 * Flow:
 * 1. Fetches chat data using ID from route params
 * 2. Performs visibility and authentication checks
 * 3. Retrieves chat messages and user preferences
 * 4. Renders chat interface with appropriate permissions
 */
export default async function Page(props: { params: Promise<{ id: string }> }) {
  // Extract chat ID from route parameters
  const params = await props.params;
  const { id } = params;

  // Fetch chat data and handle non-existent chats
  const chat = await getChatById({ id });
  if (!chat) {
    notFound();
  }

  // Handle authentication and visibility permissions
  const session = await auth();
  if (chat.visibility === 'private') {
    // Enforce private chat access rules
    if (!session || !session.user) {
      return notFound();
    }
    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  // Fetch chat messages from database
  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  // Get user's model preference from cookies
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  // Determine which model to use (cookie preference or default)
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      {/* Main chat interface */}
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedModelId={selectedModelId}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      {/* Real-time data stream handler */}
      <DataStreamHandler id={id} />
    </>
  );
}