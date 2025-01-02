/**
 * Chat Application Layout Component
 * 
 * Provides the main layout structure for the chat application, including sidebar,
 * authentication state management, and Pyodide Python runtime integration.
 * Uses experimental Partial Pre-Rendering (PPR) for improved performance.
 */

import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';

/**
 * Enable experimental Partial Pre-Rendering feature
 * This allows for incremental page generation and streaming
 */
export const experimental_ppr = true;

/**
 * Root layout component for the chat application
 * 
 * @param props.children - Child components to render within the layout
 * @returns JSX element containing the complete application layout
 * 
 * Features:
 * - Concurrent data fetching for auth and cookies
 * - Collapsible sidebar with persistent state
 * - Pyodide integration for Python runtime capabilities
 * - Server-side authentication state management
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch authentication state and cookie data concurrently
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  
  // Determine sidebar state from cookies
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      {/* Load Pyodide runtime for Python code execution */}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      
      {/* Sidebar context provider with persistent collapse state */}
      <SidebarProvider defaultOpen={!isCollapsed}>
        {/* Main application sidebar with user authentication state */}
        <AppSidebar user={session?.user} />
        
        {/* Content area for child components */}
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}