import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatMain } from '@/components/layout/ChatMain';
import { CandidateModal } from '@/components/features/candidate/CandidateModal';

/**
 * ChatPage
 *
 * Single-page chat interface: sidebar + main chat column, with the
 * candidate profile modal mounted at the top level so it overlays the app.
 */
export function ChatPage() {
  return (
    <AppShell>
      <Sidebar />
      <ChatMain />
      <CandidateModal />
    </AppShell>
  );
}
