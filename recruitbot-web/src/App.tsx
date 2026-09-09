import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChatPage } from '@/pages/ChatPage';
import { IngestionPage } from '@/features/ingestion/pages/IngestionPage';

/**
 * App root: router + toast provider.
 *
 * Routes:
 *   /        -> ChatPage (candidate search)
 *   /ingest  -> IngestionPage (resume upload)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: '#1e1e28', color: '#f1f1f5' } }}
      />
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route
          path="/ingest"
          element={
            <div className="relative h-screen w-screen">
              <Link
                to="/"
                className="absolute left-4 top-4 z-10 rounded-lg border border-white/[0.12] bg-bg-card px-3 py-1.5 text-xs font-medium text-text-primary hover:border-primary/60"
              >
                ← Back to search
              </Link>
              <IngestionPage />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
