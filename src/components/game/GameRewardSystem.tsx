import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCoinsForQuestion, START_GAME_REWARD } from '@/types/game';

interface UseGameRewardsOptions {
  userId: string | undefined;
  gameInstanceId: string;
  currentQuestionIndex: number;
  coinsEarned: number;
  broadcast: (event: string, data: any) => Promise<void>;
}

export const useGameRewards = ({
  userId,
  gameInstanceId,
  currentQuestionIndex,
  coinsEarned,
  broadcast
}: UseGameRewardsOptions) => {
  const [localCoinsEarned, setLocalCoinsEarned] = useState(coinsEarned);
  const [coinRewardAmount, setCoinRewardAmount] = useState(0);
  const [coinRewardTrigger, setCoinRewardTrigger] = useState(0);

  const creditStartReward = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const startSourceId = `${Date.now()}-start`;
      await supabase.functions.invoke('credit-gameplay-reward', {
        body: { amount: START_GAME_REWARD, sourceId: startSourceId, reason: 'game_start' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      setLocalCoinsEarned(START_GAME_REWARD);
      setCoinRewardAmount(START_GAME_REWARD);
      setCoinRewardTrigger(prev => prev + 1);
      await broadcast('wallet:update', { source: 'game_start', coinsDelta: START_GAME_REWARD });
    } catch (err) {
      console.error('[GameStart] Start reward credit failed:', err);
    }
  }, [broadcast]);

  const creditCorrectAnswer = useCallback(async () => {
    const reward = getCoinsForQuestion(currentQuestionIndex);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('A munkameneted lejárt. Kérlek, jelentkezz be újra!');
        return;
      }
      
      const sourceId = `${gameInstanceId}-q${currentQuestionIndex}`;
      const { error } = await supabase.functions.invoke('credit-gameplay-reward', {
        body: { amount: reward, sourceId, reason: 'correct_answer' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      if (error) throw error;
      
      setLocalCoinsEarned(prev => prev + reward);
      setCoinRewardAmount(reward);
      setCoinRewardTrigger(prev => prev + 1);
      await broadcast('wallet:update', { source: 'correct_answer', coinsDelta: reward });
    } catch (err) {
      toast.error('Hiba történt a jutalom jóváírásakor!');
    }
  }, [gameInstanceId, currentQuestionIndex, broadcast]);

  const resetRewardAnimation = useCallback(() => {
    setCoinRewardTrigger(0);
  }, []);

  return {
    coinsEarned: localCoinsEarned,
    coinRewardAmount,
    coinRewardTrigger,
    creditStartReward,
    creditCorrectAnswer,
    resetRewardAnimation,
    setCoinsEarned: setLocalCoinsEarned
  };
};
