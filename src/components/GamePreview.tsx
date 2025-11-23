import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import gameBackground from "@/assets/game-background.png";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useWallet } from "@/hooks/useWallet";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { supabase } from "@/integrations/supabase/client";
import { Question, Answer, getSkipCost, CONTINUE_AFTER_WRONG_COST, TIMEOUT_CONTINUE_COST } from "@/types/game";
import { GameStateScreen } from "./GameStateScreen";
import { QuestionCard } from "./QuestionCard";
import { ExitGameDialog } from "./ExitGameDialog";
import { InGameRescuePopup } from "./InGameRescuePopup";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { GameLoadingScreen } from "./GameLoadingScreen";
import { useI18n } from "@/i18n";
import { useGameState } from "@/hooks/useGameState";
import { useGameHelpers } from "@/hooks/useGameHelpers";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useGameRewards } from "./game/GameRewardSystem";
import { GameSwipeHandler } from "./game/GameSwipeHandler";
import { trackGameMilestone } from "@/lib/analytics";
import { useGameLifecycle } from "@/hooks/useGameLifecycle";
import { useGameHelperActions } from "@/hooks/useGameHelperActions";

import healthQuestions from "@/data/questions-health.json";
import historyQuestions from "@/data/questions-history.json";
import cultureQuestions from "@/data/questions-culture.json";
import financeQuestions from "@/data/questions-finance.json";

type GameState = 'playing' | 'finished' | 'out-of-lives';

// All questions from all categories combined
const ALL_QUESTIONS: Question[] = [
  ...(healthQuestions as Question[]),
  ...(historyQuestions as Question[]),
  ...(cultureQuestions as Question[]),
  ...(financeQuestions as Question[])
];

const GamePreview = memo(() => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading: profileLoading, spendLife, refreshProfile } = useGameProfile(userId);
  const { walletData, refetchWallet } = useWallet(userId);
  const { triggerHaptic } = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { broadcast } = useBroadcastChannel({ channelName: 'wallet', onMessage: () => {}, enabled: true });
  
  const {
    gameState,
    setGameState,
    questions,
    setQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    correctAnswers,
    incrementCorrectAnswers,
    responseTimes,
    addResponseTime,
    nextQuestion,
    resetGameState: resetGameStateHook
  } = useGameState();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [gameInstanceId] = useState(() => crypto.randomUUID());

  const {
    help5050UsageCount,
    setHelp5050UsageCount,
    help2xAnswerUsageCount,
    setHelp2xAnswerUsageCount,
    helpAudienceUsageCount,
    setHelpAudienceUsageCount,
    isHelp5050ActiveThisQuestion,
    setIsHelp5050ActiveThisQuestion,
    isDoubleAnswerActiveThisQuestion,
    setIsDoubleAnswerActiveThisQuestion,
    isAudienceActiveThisQuestion,
    setIsAudienceActiveThisQuestion,
    usedQuestionSwap,
    setUsedQuestionSwap,
    removedAnswer,
    setRemovedAnswer,
    audienceVotes,
    setAudienceVotes,
    logHelpUsage,
    resetQuestionHelpers
  } = useGameHelpers(userId, currentQuestionIndex);
  
  const [firstAttempt, setFirstAttempt] = useState<string | null>(null);
  const [secondAttempt, setSecondAttempt] = useState<string | null>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [canSwipe, setCanSwipe] = useState(true);
  const [translateY, setTranslateY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const swipeThreshold = 80;

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [continueType, setContinueType] = useState<'timeout' | 'wrong' | 'out-of-lives'>('wrong');
  const [errorBannerVisible, setErrorBannerVisible] = useState(false);
  const [errorBannerMessage, setErrorBannerMessage] = useState('');
  const [questionVisible, setQuestionVisible] = useState(true);
  
  const [showRescuePopup, setShowRescuePopup] = useState(false);
  const [rescueReason, setRescueReason] = useState<'NO_LIFE' | 'NO_GOLD'>('NO_GOLD');
  
  const {
    coinsEarned,
    coinRewardAmount,
    coinRewardTrigger,
    creditStartReward,
    creditCorrectAnswer,
    resetRewardAnimation,
    setCoinsEarned
  } = useGameRewards({
    userId,
    gameInstanceId,
    currentQuestionIndex,
    coinsEarned: 0,
    broadcast
  });

  const {
    showLoadingVideo,
    videoEnded,
    isGameReady,
    hasAutoStarted,
    setHasAutoStarted,
    isStarting: isStartingGame,
    startGame,
    handleVideoEnd,
    restartGameImmediately,
    finishGame,
    resetGameState,
  } = useGameLifecycle({
    userId,
    profile,
    spendLife,
    refreshProfile,
    refetchWallet,
    broadcast,
    creditStartReward,
    setQuestions,
    resetGameStateHook,
    resetTimer: (time: number) => resetTimer(time),
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
  });

  const {
    useHelp5050,
    useHelp2xAnswer,
    useHelpAudience,
    useQuestionSwap,
  } = useGameHelperActions({
    profile,
    refreshProfile,
    logHelpUsage,
    questions,
    currentQuestionIndex,
    selectedAnswer,
    help5050UsageCount,
    help2xAnswerUsageCount,
    helpAudienceUsageCount,
    isHelp5050ActiveThisQuestion,
    isDoubleAnswerActiveThisQuestion,
    isAudienceActiveThisQuestion,
    usedQuestionSwap,
    setRemovedAnswer,
    setIsHelp5050ActiveThisQuestion,
    setHelp5050UsageCount,
    setIsDoubleAnswerActiveThisQuestion,
    setHelp2xAnswerUsageCount,
    setFirstAttempt,
    setSecondAttempt,
    setAudienceVotes,
    setIsAudienceActiveThisQuestion,
    setHelpAudienceUsageCount,
    setQuestions,
    resetTimer: (time: number) => resetTimer(time),
    setQuestionStartTime,
    setUsedQuestionSwap,
    ALL_QUESTIONS,
  });

  const handleTimeout = useCallback(() => {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    addResponseTime(responseTime);
    setSelectedAnswer('__timeout__');
    setContinueType('timeout');
    triggerHaptic('warning');
    setErrorBannerVisible(true);
    setErrorBannerMessage(`Lejárt az idő! Folytatáshoz ${TIMEOUT_CONTINUE_COST} aranyérme szükséges.`);
  }, [questionStartTime, addResponseTime, triggerHaptic]);

  const { timeLeft, resetTimer } = useGameTimer({
    initialTime: 10,
    onTimeout: handleTimeout,
    enabled: gameState === 'playing' && isGameReady && !selectedAnswer && !isAnimating
  });
  
  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/auth/login');
      }
    });
  }, [navigate]);

  // Auto-start game when profile is ready - ONCE only
  useEffect(() => {
    if (profile && !profileLoading && questions.length === 0 && gameState === 'playing' && !hasAutoStarted && !isStartingGame) {
      setHasAutoStarted(true);
      startGame();
    }
  }, [profile, profileLoading, hasAutoStarted, isStartingGame, questions.length, gameState, startGame]);

  // Track game funnel milestones (5th, 10th, 15th question reached)
  useEffect(() => {
    const trackMilestone = async () => {
      if (!userId || !isGameReady || currentQuestionIndex < 0) return;

      // Track milestones: 5th question (index 4), 10th question (index 9), 15th question/completion (index 14)
      if (currentQuestionIndex === 4) {
        await trackGameMilestone(userId, 'question_5_reached', {
          category: 'mixed',
          question_index: 5,
          correct_answers: correctAnswers,
        });
      } else if (currentQuestionIndex === 9) {
        await trackGameMilestone(userId, 'question_10_reached', {
          category: 'mixed',
          question_index: 10,
          correct_answers: correctAnswers,
        });
      }
    };

    trackMilestone();
  }, [currentQuestionIndex, userId, isGameReady, correctAnswers]);

  // Background detection - exit game if app goes to background (only after video ended)
  useEffect(() => {
    // Do not activate background detection while the intro/loading video is playing
    if (gameState !== 'playing' || !videoEnded) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error('A játék megszakadt!');
        navigate('/dashboard');
      }
    };

    const handleBlur = () => {
      toast.error('A játék megszakadt!');
      navigate('/dashboard');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, navigate, videoEnded]);

  // Check for in-game payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    const verifyInGamePayment = async () => {
      if (paymentStatus === 'success' && sessionId && userId) {
        try {
          const { data: { session: paymentSession } } = await supabase.auth.getSession();
          if (!paymentSession) return;
          
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId },
            headers: { Authorization: `Bearer ${paymentSession.access_token}` }
          });

          if (error) throw error;

          if (data.success) {
            // Nincs toast - a felhasználó látja az eredményt
            await refreshProfile();
            
            // Continue game automatically
            if (gameState === 'playing') {
              setTimeout(() => {
                handleNextQuestion();
              }, 1500);
            }
          }
        } catch (error: any) {
          console.error('Error verifying in-game payment:', error);
          // Nincs toast - a felhasználó látja az eredményt
        }
        
        // Clean URL
        window.history.replaceState({}, '', '/game');
      } else if (paymentStatus === 'cancelled') {
        // Nincs toast - a felhasználó tudja, hogy megszakította
        window.history.replaceState({}, '', '/game');
      }
    };

    if (userId) {
      verifyInGamePayment();
    }
  }, [userId, gameState, refreshProfile]);

  const handleSwipeUp = async () => {
    // If game completed, restart new game
    if (gameCompleted) {
      await restartGameImmediately();
      return;
    }
    
    // If error banner visible and user wants to continue
    if (errorBannerVisible && profile) {
      const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
      
      // Check if user has enough coins NOW (when they try to continue)
      if (profile.coins < cost) {
        // Not enough coins - show rescue popup
        setErrorBannerVisible(false);
        setRescueReason('NO_GOLD');
        setShowRescuePopup(true);
        return;
      }
      
      // Has enough coins - continue
      await handleContinueAfterMistake();
      return;
    }

    // If question answered correctly, go to next
    if (selectedAnswer && !isAnimating) {
      const currentQuestion = questions[currentQuestionIndex];
      const selectedAnswerObj = currentQuestion.answers.find(a => a.key === selectedAnswer);
      if (selectedAnswerObj?.correct) {
        await handleNextQuestion();
      }
    }
  };

  const handleSwipeDown = async () => {
    toast.dismiss();
    
    if (errorBannerVisible) {
      setErrorBannerVisible(false);
    }
    await restartGameImmediately();
  };

  const handleAnswer = (answerKey: string) => {
    if (selectedAnswer || isAnimating) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerObj = currentQuestion.answers.find(a => a.key === answerKey);
    const isCorrect = selectedAnswerObj?.correct || false;

    // 2x answer logic - only if active for this question
    if (isDoubleAnswerActiveThisQuestion && !firstAttempt) {
      setFirstAttempt(answerKey);
      
      if (isCorrect) {
        // After 200ms, show correct answer in green - NO cleanup needed, runs before component unmount
        setTimeout(() => {
          handleCorrectAnswer(responseTime, answerKey);
        }, 200);
      }
      return;
    }

    if (isDoubleAnswerActiveThisQuestion && firstAttempt && answerKey !== firstAttempt) {
      setSecondAttempt(answerKey);
      const firstAnswerObj = currentQuestion.answers.find(a => a.key === firstAttempt);
      
      if (isCorrect || firstAnswerObj?.correct) {
        // After 200ms, show correct answer in green - NO cleanup needed, runs before component unmount
        setTimeout(() => {
          handleCorrectAnswer(responseTime, isCorrect ? answerKey : firstAttempt!);
        }, 200);
      } else {
        // After 200ms, show wrong answer - NO cleanup needed, runs before component unmount
        setTimeout(() => {
          handleWrongAnswer(responseTime, answerKey);
        }, 200);
      }
      return;
    }

    if (isCorrect) {
      handleCorrectAnswer(responseTime, answerKey);
    } else {
      handleWrongAnswer(responseTime, answerKey);
    }
  };

  const handleCorrectAnswer = useCallback(async (responseTime: number, answerKey: string) => {
    addResponseTime(responseTime);
    setSelectedAnswer(answerKey);
    incrementCorrectAnswers();
    triggerHaptic('success');
    await creditCorrectAnswer();
  }, [addResponseTime, incrementCorrectAnswers, triggerHaptic, creditCorrectAnswer]);

  const handleWrongAnswer = useCallback((responseTime: number, answerKey: string) => {
    addResponseTime(responseTime);
    setSelectedAnswer(answerKey);
    setContinueType('wrong');
    triggerHaptic('error');
    
    setTimeout(() => {
      setErrorBannerVisible(true);
      setErrorBannerMessage(`Rossz válasz! Folytatáshoz ${CONTINUE_AFTER_WRONG_COST} aranyérme szükséges.`);
    }, 500);
  }, [addResponseTime, triggerHaptic]);

  const handleNextQuestion = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCanSwipe(false);
    setErrorBannerVisible(false);
    setQuestionVisible(false);
    resetRewardAnimation();
    
    if (currentQuestionIndex >= questions.length - 1) {
      // Game completed - show results toast and wait for swipe up to restart
      setIsAnimating(false);
      setCanSwipe(true);
      setQuestionVisible(true);
      
      // Haptic feedback based on performance
      if (correctAnswers >= 10) {
        triggerHaptic('success'); // Good performance
      } else {
        triggerHaptic('warning'); // Could be better
      }
      
      // Calculate final results
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
        : '0.0';
      
      // Show beautiful results toast with casino aesthetic
      toast.success(
        <div className="flex flex-col gap-2 p-1.5">
          <div className="text-center text-base font-black mb-1 bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
            Játék vége!
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col items-center bg-black/30 rounded-lg p-2 border border-yellow-500/20">
              <div className="text-lg mb-0.5">✅</div>
              <div className="font-bold text-green-400">{correctAnswers}/15</div>
              <div className="text-[10px] opacity-70">Helyes</div>
            </div>
            <div className="flex flex-col items-center bg-black/30 rounded-lg p-2 border border-yellow-500/20">
              <div className="text-lg mb-0.5">💰</div>
              <div className="font-bold text-yellow-400">{coinsEarned}</div>
              <div className="text-[10px] opacity-70">Arany</div>
            </div>
            <div className="flex flex-col items-center bg-black/30 rounded-lg p-2 border border-yellow-500/20">
              <div className="text-lg mb-0.5">⚡</div>
              <div className="font-bold text-blue-400">{avgResponseTime}s</div>
              <div className="text-[10px] opacity-70">Idő</div>
            </div>
          </div>
          <div className="text-center mt-1 text-xs font-bold animate-pulse text-white/90">
            Görgess felfelé új játékhoz
          </div>
        </div>,
        {
          duration: Infinity, // Never auto-close
          style: {
            background: 'linear-gradient(135deg, rgb(88, 28, 135) 0%, rgb(124, 58, 237) 50%, rgb(88, 28, 135) 100%)',
            color: 'white',
            border: '2px solid rgba(234, 179, 8, 0.5)',
            boxShadow: '0 8px 32px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            maxWidth: '85vw',
            width: '320px',
            backdropFilter: 'blur(8px)',
          }
        }
      );
      
      // Mark game as completed and save results to backend
      setGameCompleted(true);
      await finishGame();
      return;
    }
    
    setTimeout(() => {
      nextQuestion();
      resetTimer(10);
      setSelectedAnswer(null);
      setFirstAttempt(null);
      setSecondAttempt(null);
      resetQuestionHelpers();
      setQuestionStartTime(Date.now());
      
      setTimeout(() => {
        setQuestionVisible(true);
        setIsAnimating(false);
        setCanSwipe(true);
      }, 100);
    }, 400);
  };

  const handleSkipQuestion = async () => {
    if (!profile) return;
    
    let cost = 10;
    if (currentQuestionIndex >= 5 && currentQuestionIndex <= 9) cost = 20;
    if (currentQuestionIndex >= 10) cost = 30;
    
    if (profile.coins < cost) {
      toast.error(`Nincs elég aranyérméd! ${cost} aranyérme szükséges.`);
      return;
    }
    
    const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
    if (success) {
      await refreshProfile();
      await logHelpUsage('skip');
      // Nincs toast - a felhasználó látja a kérdésváltást
      await handleNextQuestion();
    }
  };

  const handleContinueAfterMistake = async () => {
    if (!profile) return;
    
    const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
    
    // This function is now only called when user has enough coins
    const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
    if (success) {
      await refreshProfile();
      // Nincs toast - a felhasználó látja a következő kérdést
      await handleNextQuestion();
    } else {
      await finishGame();
    }
  };

  const handleRejectContinue = () => {
    finishGame();
  };

  if (profileLoading || !userId) {
    return (
      <div className="min-h-dvh min-h-svh flex items-center justify-center relative">
        <div className="relative z-10 text-white">Betöltés...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-dvh min-h-svh flex items-center justify-center relative">
        <div className="relative z-10 text-white flex flex-col items-center gap-4">
          <p>Hiba történt a profil betöltésekor!</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Vissza
          </Button>
        </div>
      </div>
    );
  }


  if (gameState === 'out-of-lives') {
    return (
      <GameStateScreen 
        type="out-of-lives"
        onContinue={() => {
          finishGame();
        }}
        onSkip={() => {
          navigate('/');
        }}
      />
    );
  }

  // Show loading video IMMEDIATELY when game start begins (even before backend completes)
  // Keep video visible until BOTH video ends AND questions are ready
  // For seamless restart: never show any loading screen
  if (showLoadingVideo && (isStartingGame || !videoEnded)) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black z-[9999]">
        <GameLoadingScreen onVideoEnd={handleVideoEnd} />
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) {
      return (
        <div 
          ref={containerRef}
          className="fixed inset-0 w-full h-full overflow-hidden"
          style={{
            backgroundImage: `url(${gameBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      );
    }
    
    return (
      <GameSwipeHandler
        enabled={gameState === 'playing' && canSwipe}
        isAnimating={isAnimating}
        showExitDialog={showExitDialog}
        swipeThreshold={swipeThreshold}
        translateY={translateY}
        onTranslateYChange={setTranslateY}
        onTouchStartYChange={setTouchStartY}
        onSwipeUp={handleSwipeUp}
        onSwipeDown={handleSwipeDown}
      >
        {/* Scrollable question container - background is now in parent Game.tsx as fixed layer */}
        <div 
          ref={containerRef}
          className="fixed inset-0 z-10 overflow-hidden pb-16"
        >
          {/* Error banner with deep 3D effect */}
          {errorBannerVisible && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-xs" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-400 via-red-500 to-red-600 opacity-95 border-4 border-red-300/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[6px] rounded-xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[8px] rounded-xl bg-gradient-to-br from-red-400/90 to-red-500/90" style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)', transform: 'translateZ(30px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[8px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)', transform: 'translateZ(45px)' }} aria-hidden />
              
              <div className="relative text-white px-6 py-3 font-bold text-xs text-center animate-fade-in" style={{ transform: 'translateZ(60px)', textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6), 1px 1px 0 rgba(0,0,0,1), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1)' }}>
                <div className="mb-1">{errorBannerMessage}</div>
                <div className="text-[10px] opacity-90">
                  Görgess felfelé a folytatáshoz ({continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST} aranyérme)
                </div>
                <div className="text-[10px] opacity-90">
                  Görgess lefelé a kilépéshez
                </div>
              </div>
            </div>
          )}

          {/* Question module with OPTIMIZED TikTok-style smooth animation */}
          <div 
            className={`absolute inset-0 w-full h-full`}
            style={{ 
              transform: isAnimating 
                ? 'translate3d(0, -100%, 0)' // GPU-accelerated
                : `translate3d(0, ${translateY}px, 0)`, // GPU-accelerated
              transition: isAnimating 
                ? 'transform 350ms cubic-bezier(0.4, 0.0, 0.2, 1)' // Smooth ease-out
                : 'transform 0ms',
              willChange: isAnimating || translateY !== 0 ? 'transform' : 'auto',
              backfaceVisibility: 'hidden', // Prevent flickering
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div 
              className="w-full h-full"
              style={{ 
                opacity: questionVisible ? 1 : 0,
                transition: 'opacity 200ms ease-in-out',
              }}
            >
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                timeLeft={timeLeft}
                selectedAnswer={selectedAnswer}
                firstAttempt={firstAttempt}
                secondAttempt={secondAttempt}
                removedAnswer={removedAnswer}
                audienceVotes={audienceVotes}
                help5050UsageCount={help5050UsageCount}
                help2xAnswerUsageCount={help2xAnswerUsageCount}
                helpAudienceUsageCount={helpAudienceUsageCount}
                isHelp5050ActiveThisQuestion={isHelp5050ActiveThisQuestion}
                isDoubleAnswerActiveThisQuestion={isDoubleAnswerActiveThisQuestion}
                isAudienceActiveThisQuestion={isAudienceActiveThisQuestion}
                usedQuestionSwap={usedQuestionSwap}
                lives={profile.lives}
                maxLives={profile.max_lives}
                coins={profile.coins}
                coinRewardAmount={coinRewardAmount}
                coinRewardTrigger={coinRewardTrigger}
                onAnswerSelect={handleAnswer}
                onUseHelp5050={useHelp5050}
                onUseHelp2xAnswer={useHelp2xAnswer}
                onUseHelpAudience={useHelpAudience}
                onUseQuestionSwap={useQuestionSwap}
                onExit={() => setShowExitDialog(true)}
                disabled={selectedAnswer !== null || isAnimating}
              />
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <ExitGameDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          gameCompleted={gameCompleted}
          onConfirmExit={() => {
            resetGameState();
          }}
        />
        
        {/* In-Game Rescue Popup */}
        <InGameRescuePopup
          isOpen={showRescuePopup}
          onClose={() => {
            setShowRescuePopup(false);
            // Exit game when user closes without purchasing
            resetGameState();
          }}
          triggerReason={rescueReason}
          currentLives={walletData?.livesCurrent || 0}
          currentGold={profile?.coins || 0}
          onStateRefresh={async () => {
            // Refresh wallet and profile after booster purchase
            await Promise.all([
              refreshProfile(),
              refetchWallet()
            ]);
            // Close popup
            setShowRescuePopup(false);
            // Continue game automatically after purchase
            setErrorBannerVisible(false);
            await handleNextQuestion();
          }}
        />
      </GameSwipeHandler>
    );
  }

  return null;
});

GamePreview.displayName = 'GamePreview';

export default GamePreview;
