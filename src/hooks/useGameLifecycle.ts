import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/game';
import { trackFeatureUsage, trackGameMilestone } from '@/lib/analytics';
import { useI18n } from '@/i18n';
import { useLootboxActivityTracker } from './useLootboxActivityTracker';

interface UseGameLifecycleOptions {
  userId: string | undefined;
  profile: any;
  spendLife: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refetchWallet: () => Promise<void>;
  broadcast: (channel: string, data: any) => void;
  creditStartReward: () => Promise<void>;
  setQuestions: (questions: Question[]) => void;
  resetGameStateHook: () => void;
  resetTimer: (time: number) => void;
  setHelp5050UsageCount: (count: number) => void;
  setHelp2xAnswerUsageCount: (count: number) => void;
  setHelpAudienceUsageCount: (count: number) => void;
  resetQuestionHelpers: () => void;
  setQuestionStartTime: (time: number) => void;
  setCanSwipe: (canSwipe: boolean) => void;
  setIsAnimating: (isAnimating: boolean) => void;
  setCoinsEarned: (coins: number) => void;
  resetRewardAnimation: () => void;
  setFirstAttempt: (attempt: string | null) => void;
  setSecondAttempt: (attempt: string | null) => void;
  setErrorBannerVisible: (visible: boolean) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setQuestionVisible: (visible: boolean) => void;
  correctAnswers: number;
  responseTimes: number[];
  coinsEarned: number;
  questions: Question[];
  questionStartTime: number;
  gameCompleted: boolean;
  prefetchedQuestions: Question[] | null;
  onPrefetchComplete: (questions: Question[]) => void;
}

export const useGameLifecycle = (options: UseGameLifecycleOptions) => {
  const { t } = useI18n();
  const { trackActivity } = useLootboxActivityTracker();
  const {
    userId,
    profile,
    spendLife,
    refreshProfile,
    refetchWallet,
    broadcast,
    creditStartReward,
    setQuestions,
    resetGameStateHook,
    resetTimer,
    setHelp5050UsageCount,
    setHelp2xAnswerUsageCount,
    setHelpAudienceUsageCount,
    resetQuestionHelpers,
    setQuestionStartTime,
    setCanSwipe,
    setIsAnimating,
    setCoinsEarned,
    resetRewardAnimation,
    setFirstAttempt,
    setSecondAttempt,
    setErrorBannerVisible,
    setCurrentQuestionIndex,
    setQuestionVisible,
    correctAnswers,
    responseTimes,
    coinsEarned,
    questions,
    questionStartTime,
    gameCompleted,
    prefetchedQuestions,
    onPrefetchComplete,
  } = options;

  const navigate = useNavigate();
  // REMOVED: showLoadingVideo, videoEnded states - instant game start
  const [isGameReady, setIsGameReady] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const gameInitPromiseRef = useRef<Promise<void> | null>(null);

  const shuffleAnswers = (questionSet: any[]): Question[] => {
    let lastCorrectIndex = -1;
    let lastCorrectCount = 0;
    
    return questionSet.map((q) => {
      const existingAnswers = q.answers;
      const shuffledAnswers = [...existingAnswers].sort(() => Math.random() - 0.5);
      
      const newAnswers = [
        { key: 'A', text: shuffledAnswers[0].text, correct: shuffledAnswers[0].correct },
        { key: 'B', text: shuffledAnswers[1].text, correct: shuffledAnswers[1].correct },
        { key: 'C', text: shuffledAnswers[2].text, correct: shuffledAnswers[2].correct }
      ];
      
      const newCorrectIdx = newAnswers.findIndex(a => a.correct);
      
      let attempts = 0;
      while ((newCorrectIdx === lastCorrectIndex && lastCorrectCount >= 2) && attempts < 10) {
        const reshuffled = [...existingAnswers].sort(() => Math.random() - 0.5);
        newAnswers[0] = { key: 'A', text: reshuffled[0].text, correct: reshuffled[0].correct };
        newAnswers[1] = { key: 'B', text: reshuffled[1].text, correct: reshuffled[1].correct };
        newAnswers[2] = { key: 'C', text: reshuffled[2].text, correct: reshuffled[2].correct };
        attempts++;
      }
      
      const finalCorrectIdx = newAnswers.findIndex(a => a.correct);
      if (finalCorrectIdx === lastCorrectIndex) {
        lastCorrectCount++;
      } else {
        lastCorrectIndex = finalCorrectIdx;
        lastCorrectCount = 1;
      }
      
      return { ...q, answers: newAnswers } as Question;
    });
  };

  const startGame = useCallback(async (skipLoadingVideo: boolean = false, usePrefetched: boolean = false) => {
    if (!profile || isStarting) return;
    
    // INSTANT MODE: Use prefetched questions if available
    if (usePrefetched && prefetchedQuestions && prefetchedQuestions.length > 0) {
      console.log('[useGameLifecycle] ⚡ INSTANT RESTART - Using prefetched questions (<5ms)');
      
      setIsStarting(true);
      
      try {
        // Backend operations in parallel (non-blocking)
        const backendOps = (async () => {
          try {
            await supabase.rpc('reset_game_helps');
          } catch (error) {
            console.error('Error resetting helps:', error);
          }
          
          const canPlay = await spendLife();
          if (!canPlay) {
            toast.error(t('game.insufficient_lives'));
            navigate('/dashboard');
            throw new Error('Insufficient lives');
          }
          
          await refetchWallet();
          await broadcast('wallet:update', { source: 'game_start', livesDelta: -1 });
          await creditStartReward();
          await refreshProfile();
        })();

        // Immediately set questions and reset state (ATOMIC)
        const shuffledWithVariety = shuffleAnswers(prefetchedQuestions);
        setQuestions(shuffledWithVariety);
        
        resetGameStateHook();
        resetTimer(10);
        setHelp5050UsageCount(0);
        setHelp2xAnswerUsageCount(0);
        setHelpAudienceUsageCount(0);
        resetQuestionHelpers();
        setFirstAttempt(null);
        setSecondAttempt(null);
        setQuestionStartTime(Date.now());
        setCanSwipe(true);
        setIsAnimating(false);
        
        // CRITICAL: Set game ready AFTER questions are loaded
        setIsGameReady(true);
        setIsStarting(false);
        
        // Wait for backend ops to complete
        await backendOps;
        
        console.log('[useGameLifecycle] ✓ Instant restart complete');
        return;
      } catch (error) {
        console.error('[useGameLifecycle] Instant restart error:', error);
        setIsStarting(false);
        return;
      }
    }
    
    // NORMAL MODE: Full backend loading - INSTANT, no video
    if (userId) {
      await trackFeatureUsage(userId, 'game_action', 'game', 'start', {
        skipLoadingVideo,
        category: 'mixed'
      });

      await trackGameMilestone(userId, 'game_start', {
        category: 'mixed',
        question_index: 0,
        correct_answers: 0,
      });
    }
    
    setIsStarting(true);
    
    const backendStartTime = performance.now();
    console.log('[useGameLifecycle] Backend loading started');
    
    gameInitPromiseRef.current = (async () => {
      try {
        await supabase.rpc('reset_game_helps');
      } catch (error) {
        console.error('Error resetting helps:', error);
      }
      
      const canPlay = await spendLife();
      if (!canPlay) {
        toast.error(t('game.insufficient_lives'));
        setIsStarting(false);
        navigate('/dashboard');
        throw new Error('Insufficient lives');
      }
      
      await refetchWallet();
      await broadcast('wallet:update', { source: 'game_start', livesDelta: -1 });
      
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !authSession) {
        console.error('[useGameLifecycle] Session error:', sessionError);
        toast.error(t('game.session_expired'));
        navigate('/auth/login');
        throw new Error('Session error');
      }
      
      await Promise.all([
        creditStartReward(),
        (async () => {
          try {
            const { data, error } = await supabase.functions.invoke('start-game-session', {
              headers: { Authorization: `Bearer ${authSession.access_token}` }
            });

            if (error) throw error;
            
            if (!data?.questions || data.questions.length === 0) {
              throw new Error('No questions received from backend');
            }

            // CRITICAL: Questions are already translated by backend based on user's preferred_language
            // No need for additional translation logic here
            const userLang = profile.preferred_language || 'en';
            console.log(`[useGameLifecycle] Questions received in language: ${userLang}`);

            const shuffledWithVariety = shuffleAnswers(data.questions);
            setQuestions(shuffledWithVariety);
            
            // Trigger prefetch for NEXT game (store in parent)
            onPrefetchComplete(shuffledWithVariety);
          } catch (error) {
            console.error('[useGameLifecycle] Failed to load questions:', error);
            toast.error(t('game.error_loading_questions'));
            setIsStarting(false);
            navigate('/dashboard');
            throw error;
          }
        })(),
        refreshProfile()
      ]);

      resetGameStateHook();
      resetTimer(10);
      setHelp5050UsageCount(0);
      setHelp2xAnswerUsageCount(0);
      setHelpAudienceUsageCount(0);
      resetQuestionHelpers();
      setFirstAttempt(null);
      setSecondAttempt(null);
      setQuestionStartTime(Date.now());
      setCanSwipe(true);
      setIsAnimating(false);
      
      // CRITICAL: Set game ready AFTER questions are loaded
      setIsGameReady(true);
      setIsStarting(false);
      gameInitPromiseRef.current = null;
      
      const backendEndTime = performance.now();
      const backendDuration = backendEndTime - backendStartTime;
      console.log(`[useGameLifecycle] Backend loading completed in ${backendDuration.toFixed(0)}ms`);
      
      // Track quiz started activity for lootbox drop (non-blocking)
      trackActivity('quiz_started', {
        category: 'mixed',
        timestamp: new Date().toISOString()
      }).catch(err => console.error('[useGameLifecycle] Error tracking quiz_started:', err));
    })();
    
    // CRITICAL: Await the promise to ensure questions are loaded before returning
    try {
      await gameInitPromiseRef.current;
    } catch (error) {
      console.error('[useGameLifecycle] Game init error:', error);
      throw error;
    }
  }, [
    profile, isStarting, userId, spendLife, navigate, refetchWallet, broadcast,
    creditStartReward, setQuestions, resetGameStateHook, resetTimer,
    setHelp5050UsageCount, setHelp2xAnswerUsageCount, setHelpAudienceUsageCount,
    resetQuestionHelpers, setFirstAttempt, setSecondAttempt, setQuestionStartTime,
    setCanSwipe, setIsAnimating, refreshProfile, prefetchedQuestions, onPrefetchComplete
  ]);

  // REMOVED: handleVideoEnd - no video delay, instant game start

  const restartGameImmediately = useCallback(async () => {
    if (!profile || isStarting) return;

    console.log('[useGameLifecycle] ⚡ INSTANT RESTART initiated');
    toast.dismiss();
    
    // ATOMIC STATE RESET + PREFETCH MODE
    // All state changes in batch to prevent flickering
    resetGameStateHook();
    setCoinsEarned(0);
    setHelp5050UsageCount(0);
    setHelp2xAnswerUsageCount(0);
    setHelpAudienceUsageCount(0);
    resetQuestionHelpers();
    setFirstAttempt(null);
    setSecondAttempt(null);
    setErrorBannerVisible(false);
    resetRewardAnimation();
    setCurrentQuestionIndex(0);
    
    // CRITICAL: Clear old questions IMMEDIATELY to prevent old question flash
    setQuestions([]);
    setQuestionVisible(false);
    
    // NO animation during restart for instant feel
    setIsAnimating(false);
    setCanSwipe(false);
    
    if (!gameCompleted) {
      toast.error(t('game.restart_lost_gold'), {
        duration: 2000,
        style: {
          background: 'hsl(var(--destructive))',
          color: 'hsl(var(--destructive-foreground))',
          border: '1px solid hsl(var(--destructive))',
        }
      });
    }
    
    // Start new game with PREFETCH MODE (uses prefetched questions if available)
    // CRITICAL: Await startGame completion BEFORE resetting timer/visibility
    await startGame(true, true);
    
    // INSTANT transition - AFTER game is fully ready
    resetTimer(10);
    setQuestionVisible(true);
    setCanSwipe(true);
    console.log('[useGameLifecycle] ✓ Instant restart complete');
  }, [
    profile, isStarting, gameCompleted, resetGameStateHook, setCoinsEarned,
    setHelp5050UsageCount, setHelp2xAnswerUsageCount, setHelpAudienceUsageCount,
    resetQuestionHelpers, setFirstAttempt, setSecondAttempt, setErrorBannerVisible,
    resetRewardAnimation, startGame, setIsAnimating, setCanSwipe, setQuestionVisible,
    setCurrentQuestionIndex, resetTimer
  ]);

  const finishGame = useCallback(async () => {
    if (!profile) return;

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    try {
      if (userId && correctAnswers > 0) {
        await trackGameMilestone(userId, 'game_complete', {
          category: 'mixed',
          question_index: 15,
          correct_answers: correctAnswers,
          time_played_seconds: Math.floor((Date.now() - questionStartTime) / 1000),
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(t('errors.session_expired'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('complete-game', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          category: 'mixed',
          correctAnswers: correctAnswers,
          totalQuestions: questions.length,
          averageResponseTime: avgResponseTime
        }
      });

      if (error) throw error;

      const serverCoinsEarned = data?.coinsEarned || 0;
      setCoinsEarned(serverCoinsEarned);

      await refreshProfile();

      if (correctAnswers > 0) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('total_correct_answers')
          .eq('id', userId!)
          .single();

        if (currentProfile) {
          await supabase
            .from('profiles')
            .update({ 
              total_correct_answers: (currentProfile.total_correct_answers || 0) + correctAnswers 
            })
            .eq('id', userId!);
        }
      }
      
      // Track quiz completed activity for lootbox drop (non-blocking)
      trackActivity('quiz_completed', {
        category: 'mixed',
        correct_answers: correctAnswers,
        total_questions: questions.length,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('[useGameLifecycle] Error tracking quiz_completed:', err));
      
    } catch (error) {
      console.error('Error finishing game:', error);
      await refreshProfile();
    }
  }, [
    profile, responseTimes, userId, correctAnswers, questionStartTime,
    questions.length, setCoinsEarned, refreshProfile
  ]);

  const resetGameState = useCallback(() => {
    if (!gameCompleted) {
      toast.error(t('game.exit_lost_gold'), {
        duration: 3000,
        style: {
          background: 'hsl(var(--destructive))',
          color: 'hsl(var(--destructive-foreground))',
        }
      });
    }
    
    navigate('/dashboard');
  }, [gameCompleted, navigate, t]);

  return {
    // REMOVED: showLoadingVideo, videoEnded - instant game start
    isGameReady,
    hasAutoStarted,
    setHasAutoStarted,
    isStarting,
    startGame,
    restartGameImmediately,
    finishGame,
    resetGameState,
  };
};
