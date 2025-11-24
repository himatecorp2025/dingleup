import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/game';
import { trackFeatureUsage, trackGameMilestone } from '@/lib/analytics';

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
}

export const useGameLifecycle = (options: UseGameLifecycleOptions) => {
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
  } = options;

  const navigate = useNavigate();
  const [showLoadingVideo, setShowLoadingVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
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

  const startGame = useCallback(async (skipLoadingVideo: boolean = false) => {
    if (!profile || isStarting) return;
    
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
    if (!skipLoadingVideo) {
      setShowLoadingVideo(true);
      setVideoEnded(false);
      setIsGameReady(false);
    } else {
      setShowLoadingVideo(false);
      setVideoEnded(true);
      setIsGameReady(true);
    }
    
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
        toast.error('Nincs elég életed a játék indításához!');
        setIsStarting(false);
        navigate('/dashboard');
        throw new Error('Insufficient lives');
      }
      
      await refetchWallet();
      await broadcast('wallet:update', { source: 'game_start', livesDelta: -1 });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('[useGameLifecycle] Session error:', sessionError);
        toast.error('A munkameneted lejárt. Kérlek, jelentkezz be újra!');
        navigate('/auth/login');
        throw new Error('Session error');
      }
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        toast.error('Nincs bejelentkezve! Kérlek, jelentkezz be!');
        navigate('/auth/login');
        throw new Error('Not authenticated');
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

            let questionsToUse = data.questions;
            
            // CRITICAL: Apply translations based on user's preferred language
            const userLang = profile.preferred_language || 'en';
            console.log('[useGameLifecycle] User language:', userLang);
            
            if (userLang !== 'hu' && questionsToUse.length > 0) {
              const questionIds = questionsToUse.map((q: any) => q.id);
              
              const { data: translations, error: translationsError } = await supabase
                .from('question_translations')
                .select('question_id, question_text, answer_a, answer_b, answer_c')
                .eq('lang', userLang)
                .in('question_id', questionIds);

              if (!translationsError && translations && translations.length > 0) {
                console.log(`[useGameLifecycle] Translations fetched: ${translations.length} for language: ${userLang}`);
                
                // Apply translations to questions
                questionsToUse = questionsToUse.map((question: any) => {
                  const translation = translations.find((t: any) => t.question_id === question.id);
                  
                  if (translation) {
                    return {
                      ...question,
                      question: translation.question_text || question.question,
                      answers: question.answers.map((answer: any, index: number) => ({
                        ...answer,
                        text: index === 0 ? (translation.answer_a || answer.text) :
                              index === 1 ? (translation.answer_b || answer.text) :
                              (translation.answer_c || answer.text)
                      }))
                    };
                  }
                  
                  // No translation - keep original Hungarian
                  return question;
                });
              } else {
                console.log('[useGameLifecycle] No translations found or error:', translationsError);
              }
            }

            const shuffledWithVariety = shuffleAnswers(questionsToUse);
            setQuestions(shuffledWithVariety);
          } catch (error) {
            console.error('[useGameLifecycle] Failed to load questions:', error);
            toast.error('Hiba történt a kérdések betöltésekor!');
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
      
      setIsStarting(false);
      gameInitPromiseRef.current = null;
      
      const backendEndTime = performance.now();
      const backendDuration = backendEndTime - backendStartTime;
      console.log(`[useGameLifecycle] Backend loading completed in ${backendDuration.toFixed(0)}ms`);
    })();
  }, [
    profile, isStarting, userId, spendLife, navigate, refetchWallet, broadcast,
    creditStartReward, setQuestions, resetGameStateHook, resetTimer,
    setHelp5050UsageCount, setHelp2xAnswerUsageCount, setHelpAudienceUsageCount,
    resetQuestionHelpers, setFirstAttempt, setSecondAttempt, setQuestionStartTime,
    setCanSwipe, setIsAnimating, refreshProfile
  ]);

  const handleVideoEnd = useCallback(async () => {
    if (gameInitPromiseRef.current) {
      try {
        await gameInitPromiseRef.current;
      } catch (error) {
        return;
      }
    }
    
    setIsGameReady(true);
    setVideoEnded(true);
    setIsStarting(false);
  }, []);

  const restartGameImmediately = useCallback(async () => {
    if (!profile || isStarting) return;

    console.log('[useGameLifecycle] Restart initiated - clearing all state');
    toast.dismiss();
    
    // Complete state reset BEFORE starting new game
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
    setQuestionVisible(false);
    setIsAnimating(true);
    setCanSwipe(false);
    
    // Short delay to ensure UI state is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!gameCompleted) {
      toast.error('Újraindítva! Elvesztetted az összegyűjtött aranyérméidet.', {
        duration: 2000,
        style: {
          background: 'hsl(var(--destructive))',
          color: 'hsl(var(--destructive-foreground))',
          border: '1px solid hsl(var(--destructive))',
        }
      });
    }
    
    // Start new game with clean slate
    await startGame(true);
    
    // Smooth transition to new game
    setTimeout(() => {
      resetTimer(10);
      setQuestionVisible(true);
      setIsAnimating(false);
      setCanSwipe(true);
      console.log('[useGameLifecycle] Restart complete - game ready');
    }, 300);
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
        toast.error('A munkameneted lejárt. Kérlek, jelentkezz be újra!');
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
      toast.error('Kilépés... Elvesztetted az összegyűjtött aranyérméidet!', {
        duration: 3000,
        style: {
          background: 'hsl(var(--destructive))',
          color: 'hsl(var(--destructive-foreground))',
        }
      });
    }
    
    navigate('/dashboard');
  }, [gameCompleted, navigate]);

  return {
    showLoadingVideo,
    videoEnded,
    isGameReady,
    hasAutoStarted,
    setHasAutoStarted,
    isStarting,
    startGame,
    handleVideoEnd,
    restartGameImmediately,
    finishGame,
    resetGameState,
  };
};
