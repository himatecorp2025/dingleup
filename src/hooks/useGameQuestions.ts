import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question: string;
  answers: any[];
  audience: number[];
  third: string;
  topic_id: number;
  source_category: string;
  correct_answer: string;
}

interface GameQuestionsResponse {
  questions: Question[];
  used_pool_order: number | null;
  fallback: boolean;
}

// Local storage key for global last pool order
const POOL_STORAGE_KEY = 'dingleup_global_last_pool';

export function useGameQuestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefetchedQuestions, setPrefetchedQuestions] = useState<Question[] | null>(null);
  const [prefetchedPoolOrder, setPrefetchedPoolOrder] = useState<number | null>(null);
  const isPrefetchingRef = useRef(false);

  // Get global last pool order
  const getLastPoolOrder = useCallback((): number | null => {
    try {
      const stored = localStorage.getItem(POOL_STORAGE_KEY);
      if (!stored) return null;
      
      const poolOrder = parseInt(stored, 10);
      return isNaN(poolOrder) ? null : poolOrder;
    } catch (err) {
      console.error('[useGameQuestions] Error reading last pool order:', err);
      return null;
    }
  }, []);

  // Save global last pool order
  const saveLastPoolOrder = useCallback((poolOrder: number | null) => {
    try {
      if (poolOrder === null) {
        localStorage.removeItem(POOL_STORAGE_KEY);
      } else {
        localStorage.setItem(POOL_STORAGE_KEY, poolOrder.toString());
      }
    } catch (err) {
      console.error('[useGameQuestions] Error saving last pool order:', err);
    }
  }, []);

  // Prefetch next game questions (background operation)
  const prefetchNextGameQuestions = useCallback(async (currentPoolOrder: number | null) => {
    if (isPrefetchingRef.current) {
      console.log('[useGameQuestions] Prefetch already in progress, skipping');
      return;
    }

    isPrefetchingRef.current = true;

    try {
      console.log('[useGameQuestions] Prefetching next game questions (background)...');

      const { data, error: funcError } = await supabase.functions.invoke('get-game-questions', {
        body: {
          last_pool_order: currentPoolOrder,
        },
      });

      if (funcError) {
        console.error('[useGameQuestions] Prefetch error:', funcError);
        return;
      }

      const response = data as GameQuestionsResponse;

      if (response && response.questions && response.questions.length > 0) {
        setPrefetchedQuestions(response.questions);
        setPrefetchedPoolOrder(response.used_pool_order);
        console.log(`[useGameQuestions] ✓ Prefetched ${response.questions.length} questions from pool ${response.used_pool_order || 'fallback'}`);
      }
    } catch (err) {
      console.error('[useGameQuestions] Prefetch exception:', err);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, []);

  // Get next game questions using global pool rotation
  const getNextGameQuestions = useCallback(async (): Promise<Question[]> => {
    setLoading(true);
    setError(null);

    try {
      // Check if we have prefetched questions
      if (prefetchedQuestions && prefetchedQuestions.length > 0) {
        console.log('[useGameQuestions] ✓ Using prefetched questions');
        const questions = prefetchedQuestions;
        const poolOrder = prefetchedPoolOrder;

        // Clear prefetched data
        setPrefetchedQuestions(null);
        setPrefetchedPoolOrder(null);

        // Save the pool order
        if (poolOrder !== null) {
          saveLastPoolOrder(poolOrder);
          console.log(`[useGameQuestions] Saved pool order ${poolOrder}`);
        }

        // Start prefetching next questions in background
        prefetchNextGameQuestions(poolOrder);

        setLoading(false);
        return questions;
      }

      // No prefetched questions - fetch synchronously
      const lastPoolOrder = getLastPoolOrder();

      console.log(`[useGameQuestions] Fetching questions (last pool: ${lastPoolOrder})`);

      const { data, error: funcError } = await supabase.functions.invoke('get-game-questions', {
        body: {
          last_pool_order: lastPoolOrder,
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      const response = data as GameQuestionsResponse;

      if (!response || !response.questions || response.questions.length === 0) {
        throw new Error('No questions returned from server');
      }

      // Save the pool order for next time
      if (response.used_pool_order !== null) {
        saveLastPoolOrder(response.used_pool_order);
        console.log(`[useGameQuestions] Saved pool order ${response.used_pool_order}`);
      }

      if (response.fallback) {
        console.warn('[useGameQuestions] Using fallback random selection (no pools available)');
      }

      // Start prefetching next questions in background
      prefetchNextGameQuestions(response.used_pool_order);

      setLoading(false);
      return response.questions;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questions';
      console.error('[useGameQuestions] Error loading game questions:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [getLastPoolOrder, saveLastPoolOrder, prefetchedQuestions, prefetchedPoolOrder, prefetchNextGameQuestions]);

  // Clear pool history (reset rotation)
  const clearPoolHistory = useCallback(() => {
    localStorage.removeItem(POOL_STORAGE_KEY);
    setPrefetchedQuestions(null);
    setPrefetchedPoolOrder(null);
  }, []);

  return {
    getNextGameQuestions,
    clearPoolHistory,
    prefetchNextGameQuestions,
    loading,
    error,
  };
}
