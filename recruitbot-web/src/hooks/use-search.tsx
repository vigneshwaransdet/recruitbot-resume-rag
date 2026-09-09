import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { searchApi } from '@/lib/api/search.api';
import { useSearchStore } from '@/lib/stores/search.store';
import { useChatStore } from '@/lib/stores/chat.store';
import { ResultsList } from '@/components/features/results/ResultsList';
import { SearchError } from '@/components/features/results/SearchError';

/** Map a failure into a friendly title + message for the UI. */
function describeError(err: unknown): { title: string; message: string } {
  if (err instanceof AxiosError) {
    if (!err.response) {
      if (err.code === 'ECONNABORTED') {
        return {
          title: 'Search timed out',
          message:
            'The search took too long to respond. The AI service may be busy — please try again.',
        };
      }
      return {
        title: "Can't reach the server",
        message:
          'RecruitBot could not connect to the search service. Please check your connection and try again.',
      };
    }
    const status = err.response.status;
    if (status === 503) {
      return {
        title: 'Search temporarily unavailable',
        message: 'The search service is not ready right now. Please try again in a moment.',
      };
    }
    if (status >= 500) {
      return {
        title: 'Something went wrong',
        message: 'The server hit an error while searching. Please try again.',
      };
    }
    return {
      title: 'Search could not be completed',
      message: 'Please adjust your query and try again.',
    };
  }
  return {
    title: 'Search failed',
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * use-search
 *
 * Orchestrates a search: pushes the user query into the chat, flips the
 * searching flag (drives the typing indicator), calls the search API, and
 * renders the results (or a friendly, retryable error) as a bot message.
 */
export function useSearch() {
  const {
    searchType,
    topK,
    bm25Weight,
    vectorWeight,
    rerankEnabled,
    summarizeEnabled,
    setResults,
    setSearching,
  } = useSearchStore();
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addBotMessage = useChatStore((s) => s.addBotMessage);

  const runSearch = useCallback(
    async (query: string, pushUserMessage: boolean) => {
      if (pushUserMessage) addUserMessage(query);
      setSearching(true);

      try {
        const data = await searchApi.search({
          query,
          mode: searchType,
          topK,
          bm25Weight: bm25Weight / 100,
          vectorWeight: vectorWeight / 100,
          summarize: summarizeEnabled,
        });

        setResults(data.results, query);
        addBotMessage(
          <ResultsList
            results={data.results}
            searchType={data.mode}
            durationMs={data.durationMs}
            degraded={data.degraded}
            warnings={data.warnings}
            showRerank={rerankEnabled}
            showSummary={summarizeEnabled}
          />
        );
      } catch (err) {
        const { title, message } = describeError(err);
        addBotMessage(
          <SearchError
            title={title}
            message={message}
            onRetry={() => void runSearch(query, false)}
          />
        );
      } finally {
        setSearching(false);
      }
    },
    [
      searchType,
      topK,
      bm25Weight,
      vectorWeight,
      rerankEnabled,
      summarizeEnabled,
      setResults,
      setSearching,
      addUserMessage,
      addBotMessage,
    ]
  );

  const submitQuery = useCallback(
    (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;
      void runSearch(query, true);
    },
    [runSearch]
  );

  return { submitQuery };
}
