import { useState, useCallback } from 'react';
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

// Local storage key for last pool orders per topic
const POOL_STORAGE_KEY = 'dingleup_last_pool_orders';

export function useGameQuestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get last pool order for a topic
  const getLastPoolOrder = useCallback((topicId: number): number | null => {
    try {
      const stored = localStorage.getItem(POOL_STORAGE_KEY);
      if (!stored) return null;
      
      const poolOrders = JSON.parse(stored);
      return poolOrders[topicId] ?? null;
    } catch (err) {
      console.error('Error reading last pool order:', err);
      return null;
    }
  }, []);

  // Save last pool order for a topic
  const saveLastPoolOrder = useCallback((topicId: number, poolOrder: number | null) => {
    try {
      const stored = localStorage.getItem(POOL_STORAGE_KEY);
      const poolOrders = stored ? JSON.parse(stored) : {};
      
      if (poolOrder === null) {
        delete poolOrders[topicId];
      } else {
        poolOrders[topicId] = poolOrder;
      }
      
      localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(poolOrders));
    } catch (err) {
      console.error('Error saving last pool order:', err);
    }
  }, []);

  // Get next game questions using pool rotation
  const getNextGameQuestions = useCallback(async (topicId: number): Promise<Question[]> => {
    setLoading(true);
    setError(null);

    try {
      const lastPoolOrder = getLastPoolOrder(topicId);

      console.log(`Requesting questions for topic ${topicId}, last pool: ${lastPoolOrder}`);

      const { data, error: funcError } = await supabase.functions.invoke('get-game-questions', {
        body: {
          topic_id: topicId,
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
        saveLastPoolOrder(topicId, response.used_pool_order);
        console.log(`Saved pool order ${response.used_pool_order} for topic ${topicId}`);
      }

      if (response.fallback) {
        console.warn('Using fallback random selection (no pools available)');
      }

      setLoading(false);
      return response.questions;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questions';
      console.error('Error loading game questions:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [getLastPoolOrder, saveLastPoolOrder]);

  // Clear pool history (reset rotation)
  const clearPoolHistory = useCallback(() => {
    localStorage.removeItem(POOL_STORAGE_KEY);
  }, []);

  return {
    getNextGameQuestions,
    clearPoolHistory,
    loading,
    error,
  };
}
