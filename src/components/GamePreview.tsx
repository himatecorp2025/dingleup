import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Coins } from "lucide-react";
import gameBackground from "@/assets/game-background.jpg";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGameProfile } from "@/hooks/useGameProfile";
import { supabase } from "@/integrations/supabase/client";
import { GameCategory, Question, Answer, getSkipCost, CONTINUE_AFTER_WRONG_COST, TIMEOUT_CONTINUE_COST } from "@/types/game";
import CategorySelector from "./CategorySelector";
import { HexagonButton } from "./HexagonButton";
import { GameStateScreen } from "./GameStateScreen";
import { QuestionCard } from "./QuestionCard";
import { InsufficientResourcesDialog } from "./InsufficientResourcesDialog";
import { ExitGameDialog } from "./ExitGameDialog";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { Trophy3D } from "./Trophy3D";

import healthQuestions from "@/data/questions-health.json";
import historyQuestions from "@/data/questions-history.json";
import cultureQuestions from "@/data/questions-culture.json";
import financeQuestions from "@/data/questions-finance.json";

type GameState = 'category-select' | 'playing' | 'finished' | 'out-of-lives';

const QUESTION_BANKS: Record<GameCategory, Question[]> = {
  health: healthQuestions as Question[],
  history: historyQuestions as Question[],
  culture: cultureQuestions as Question[],
  finance: financeQuestions as Question[]
};

const GamePreview = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading: profileLoading, updateProfile, spendLife, refreshProfile } = useGameProfile(userId);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { broadcast } = useBroadcastChannel({ channelName: 'wallet', onMessage: () => {}, enabled: true });
  
  const [gameState, setGameState] = useState<GameState>('category-select');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Lifelines - GAME-LEVEL usage counters (not per-question)
  
  // Helper function to log help usage
  const logHelpUsage = async (helpType: 'third' | 'skip' | 'audience' | '2x_answer') => {
    if (!userId || !selectedCategory) return;
    
    try {
      await supabase.from('game_help_usage').insert({
        user_id: userId,
        category: selectedCategory,
        help_type: helpType,
        question_index: currentQuestionIndex
      });
    } catch (error) {
      console.error('Error logging help usage:', error);
    }
  };
  const [help5050UsageCount, setHelp5050UsageCount] = useState(0); // 0=first free, 1=second paid, 2=disabled
  const [help2xAnswerUsageCount, setHelp2xAnswerUsageCount] = useState(0);
  const [helpAudienceUsageCount, setHelpAudienceUsageCount] = useState(0);
  const [isHelp5050ActiveThisQuestion, setIsHelp5050ActiveThisQuestion] = useState(false);
  const [isDoubleAnswerActiveThisQuestion, setIsDoubleAnswerActiveThisQuestion] = useState(false);
  const [isAudienceActiveThisQuestion, setIsAudienceActiveThisQuestion] = useState(false);
  const [usedQuestionSwap, setUsedQuestionSwap] = useState(false);
  const [firstAttempt, setFirstAttempt] = useState<string | null>(null);
  const [secondAttempt, setSecondAttempt] = useState<string | null>(null);
  const [removedAnswer, setRemovedAnswer] = useState<string | null>(null);
  const [audienceVotes, setAudienceVotes] = useState<Record<string, number>>({});

  // Scroll states
  const [isAnimating, setIsAnimating] = useState(false);
  const [canSwipe, setCanSwipe] = useState(true);
  const [translateY, setTranslateY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const swipeThreshold = 80;

  // UI states
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [continueType, setContinueType] = useState<'timeout' | 'wrong' | 'out-of-lives'>('wrong');
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [insufficientType, setInsufficientType] = useState<'coins' | 'lives'>('coins');
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [errorBannerVisible, setErrorBannerVisible] = useState(false);
  const [errorBannerMessage, setErrorBannerMessage] = useState('');
  const [questionVisible, setQuestionVisible] = useState(true);


  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  // Background detection - exit game if app goes to background
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[GameSecurity] App went to background - exiting game');
        toast.error('A játék megszakadt, mert elhagytad az alkalmazást');
        navigate('/dashboard');
      }
    };

    const handleBlur = () => {
      console.log('[GameSecurity] Window lost focus - exiting game');
      toast.error('A játék megszakadt, mert elhagytad az alkalmazást');
      navigate('/dashboard');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, navigate]);

  // Check for in-game payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    const verifyInGamePayment = async () => {
      if (paymentStatus === 'success' && sessionId && userId) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId }
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
  }, [userId, gameState]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !selectedAnswer && !isAnimating) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !selectedAnswer && gameState === 'playing' && !isAnimating) {
      handleTimeout();
    }
  }, [timeLeft, gameState, selectedAnswer, isAnimating]);

  // Touch gesture handler
  useEffect(() => {
    if (gameState !== 'playing' || !canSwipe) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isAnimating || showExitDialog) return;
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating || showExitDialog) return;
      
      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStartY;
      
      // Smooth scroll - always allow swiping
      setTranslateY(delta * 0.3); // Damped movement for smooth feel
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (isAnimating || showExitDialog) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartY - touchEndY;

      if (Math.abs(delta) < swipeThreshold) {
        // Smooth reset with transition
        setTranslateY(0);
        return;
      }

      if (delta > 0) {
        // Swipe up
        await handleSwipeUp();
      } else {
        // Swipe down
        await handleSwipeDown();
      }
      
      setTranslateY(0);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, canSwipe, isAnimating, selectedAnswer, showExitDialog, touchStartY]);

  const handleSwipeUp = async () => {
    // If error banner visible and user wants to continue
    if (errorBannerVisible && profile) {
      const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
      
      // Check if user has enough coins NOW (when they try to continue)
      if (profile.coins < cost) {
        // Not enough coins - show insufficient dialog with delay for dramatic effect
        setInsufficientType('coins');
        setRequiredAmount(cost);
        setErrorBannerVisible(false);
        
        // Delay before showing dialog (dramatic reveal)
        setTimeout(() => {
          setShowInsufficientDialog(true);
        }, 2000); // 2 seconds delay
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
    // If error banner visible, finish game
    if (errorBannerVisible) {
      setErrorBannerVisible(false);
      await finishGame();
      return;
    }

    // Normal state - show exit confirmation
    if (!selectedAnswer && !showExitDialog) {
      setShowExitDialog(true);
    }
  };

  const handleTimeout = () => {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer('__timeout__');
    setContinueType('timeout');
    
    // Always show banner first - DO NOT check for insufficient coins here
    setErrorBannerVisible(true);
    setErrorBannerMessage(`⏰ Lejárt az idő - ${TIMEOUT_CONTINUE_COST} aranyérme`);
  };

  const shuffleAnswers = (questionSet: any[]): Question[] => {
    let lastCorrectIndex = -1;
    let lastCorrectCount = 0;
    
    return questionSet.map((q) => {
      // JSON files already have answers as Answer[] objects
      const existingAnswers = q.answers as Answer[];
      
      // Extract just the Answer objects and shuffle them
      const shuffledAnswers = [...existingAnswers].sort(() => Math.random() - 0.5);
      
      // Always assign to A, B, C in order (fixed keys, shuffled content)
      const newAnswers: Answer[] = [
        { key: 'A', text: shuffledAnswers[0].text, correct: shuffledAnswers[0].correct },
        { key: 'B', text: shuffledAnswers[1].text, correct: shuffledAnswers[1].correct },
        { key: 'C', text: shuffledAnswers[2].text, correct: shuffledAnswers[2].correct }
      ];
      
      const newCorrectIdx = newAnswers.findIndex(a => a.correct);
      
      // Check if we need to reshuffle to avoid patterns
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
      
      return {
        ...q,
        answers: newAnswers
      } as Question;
    });
  };

  const startGameWithCategory = async (category: GameCategory) => {
    if (!profile) return;

    // Ensure any previous dialogs are closed
    setShowInsufficientDialog(false);

    // Quick client-side lives check for a smoother UX
    if (profile.lives < 1) {
      setInsufficientType('lives');
      setRequiredAmount(1);
      setShowInsufficientDialog(true);
      setGameState('category-select');
      return;
    }

    // Audio is managed by AudioManager singleton - no manual play() needed
    
    try {
      await supabase.rpc('reset_game_helps');
    } catch (error) {
      console.error('Error resetting helps:', error);
    }
    
    const canPlay = await spendLife();
    if (!canPlay) {
      // Show insufficient lives dialog (fallback if RPC failed)
      setInsufficientType('lives');
      setRequiredAmount(1);
      setShowInsufficientDialog(true);
      setGameState('category-select');
      return;
    }
    
    // Azonnali wallet frissítés jelzés a Dashboard felé
    await broadcast('wallet:update', { source: 'game_start', livesDelta: -1 });
    
    // SECURITY: Removed client-side award_coins - handled by complete-game edge function
    await refreshProfile();

    setSelectedCategory(category);
    const questionBank = QUESTION_BANKS[category];
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5).slice(0, 15);
    const shuffledWithVariety = shuffleAnswers(shuffled);
    setQuestions(shuffledWithVariety);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setTimeLeft(10);
    
    setCorrectAnswers(0);
    setResponseTimes([]);
    setSelectedAnswer(null);
    // Reset ALL game-level usage counters on new game
    setHelp5050UsageCount(0);
    setHelp2xAnswerUsageCount(0);
    setHelpAudienceUsageCount(0);
    setIsHelp5050ActiveThisQuestion(false);
    setIsDoubleAnswerActiveThisQuestion(false);
    setIsAudienceActiveThisQuestion(false);
    setUsedQuestionSwap(false);
    setFirstAttempt(null);
    setSecondAttempt(null);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setQuestionStartTime(Date.now());
    setCanSwipe(true);
    setIsAnimating(false);
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

  const handleCorrectAnswer = (responseTime: number, answerKey: string) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(answerKey);
    setCorrectAnswers(correctAnswers + 1);
    
    let reward = 0;
    if (currentQuestionIndex >= 0 && currentQuestionIndex <= 3) {
      reward = 1;
    } else if (currentQuestionIndex >= 4 && currentQuestionIndex <= 8) {
      reward = 3;
    } else if (currentQuestionIndex >= 9 && currentQuestionIndex <= 13) {
      reward = 5;
    } else if (currentQuestionIndex === 14) {
      reward = 55;
    }
    
    // SECURITY: Local counter only - actual coins awarded by complete-game edge function
    setCoinsEarned(coinsEarned + reward);
    
    // Nincs toast - a felhasználó látja a zöld választ
  };

  const handleWrongAnswer = (responseTime: number, answerKey: string) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(answerKey);
    setContinueType('wrong');
    
    // Always show banner first - let user see the red highlight
    // DO NOT check for insufficient coins here - only when they try to continue
    setTimeout(() => {
      setErrorBannerVisible(true);
      setErrorBannerMessage(`❌ Rossz válasz - ${CONTINUE_AFTER_WRONG_COST} aranyérme`);
    }, 500);
  };

  const handleNextQuestion = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCanSwipe(false);
    setErrorBannerVisible(false);
    setQuestionVisible(false);
    
    if (currentQuestionIndex >= questions.length - 1) {
      setIsAnimating(false);
      setCanSwipe(true);
      setQuestionVisible(true);
      await finishGame();
      return;
    }
    
    // Animate current module out
    setTimeout(() => {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setFirstAttempt(null);
      setSecondAttempt(null);
      setRemovedAnswer(null);
      setAudienceVotes({});
      // Reset per-question activation states (not usage counts!)
      setIsHelp5050ActiveThisQuestion(false);
      setIsDoubleAnswerActiveThisQuestion(false);
      setIsAudienceActiveThisQuestion(false);
      setUsedQuestionSwap(false);
      setQuestionStartTime(Date.now());
      
      // End animation and show question content
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
      setInsufficientType('coins');
      setRequiredAmount(cost);
      setShowInsufficientDialog(true);
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
      // Nincs toast - error banner látható
      await finishGame();
    }
  };

  const handleRejectContinue = () => {
    finishGame();
  };

  const resetGameState = () => {
    // Reset ALL game states to initial values
    setGameState('category-select');
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setCoinsEarned(0);
    setResponseTimes([]);
    setQuestionStartTime(Date.now());
    
    // Reset help counters
    setHelp5050UsageCount(0);
    setHelp2xAnswerUsageCount(0);
    setHelpAudienceUsageCount(0);
    setIsHelp5050ActiveThisQuestion(false);
    setIsDoubleAnswerActiveThisQuestion(false);
    setIsAudienceActiveThisQuestion(false);
    setUsedQuestionSwap(false);
    setFirstAttempt(null);
    setSecondAttempt(null);
    setRemovedAnswer(null);
    setAudienceVotes({});
    
    // Reset UI states
    setShowExitDialog(false);
    setErrorBannerVisible(false);
    setErrorBannerMessage('');
    setQuestionVisible(true);
    setCanSwipe(true);
    setIsAnimating(false);
    setTranslateY(0);
  };

  const finishGame = async () => {
    if (!profile || !selectedCategory) return;

    setGameState('finished');

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    try {
      // SECURITY: Use secure edge function for game completion
      // Server calculates and validates all rewards
      const { data, error } = await supabase.functions.invoke('complete-game', {
        body: {
          category: selectedCategory,
          correctAnswers: correctAnswers,
          totalQuestions: questions.length,
          averageResponseTime: avgResponseTime
        }
      });

      if (error) throw error;

      // Server returns the validated coins earned
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

      // Nincs toast - a result screen mutatja az eredményt
    } catch (error) {
      console.error('Error finishing game:', error);
      // Nincs toast - error esetén is látszik a result
      await refreshProfile();
    }
  };

  // UseHelp functions - NEW LOGIC
  const useHelp5050 = async () => {
    if (selectedAnswer || isHelp5050ActiveThisQuestion) return;
    
    // Check usage count
    if (help5050UsageCount >= 2) {
      // Nincs toast - UI mutatja hogy disabled
      return;
    }
    
    const cost = help5050UsageCount === 0 ? 0 : 15; // First free, second costs 15 coins
    
    // First usage - free
    if (help5050UsageCount === 0 && profile?.help_third_active) {
      const currentQuestion = questions[currentQuestionIndex];
      const thirdAnswerKey = currentQuestion.third;
      
      setRemovedAnswer(thirdAnswerKey);
      setIsHelp5050ActiveThisQuestion(true);
      setHelp5050UsageCount(1);
      
      await supabase.rpc('use_help', { p_help_type: 'third' });
      await refreshProfile();
      await logHelpUsage('third');
      
      // Nincs toast - a felhasználó látja a segítség aktiválódását
      return;
    }
    
    // Second usage - costs 15 coins
    if (help5050UsageCount === 1) {
      if (!profile || profile.coins < cost) {
        // Nincs toast - insufficient dialog fog megjelenni
        setInsufficientType('coins');
        setRequiredAmount(cost);
        setShowInsufficientDialog(true);
        return;
      }
      
      const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
      if (success) {
        await refreshProfile();
        const currentQuestion = questions[currentQuestionIndex];
        const thirdAnswerKey = currentQuestion.third;
        
        setRemovedAnswer(thirdAnswerKey);
        setIsHelp5050ActiveThisQuestion(true);
        setHelp5050UsageCount(2);
        await logHelpUsage('third');
        // Nincs toast - a felhasználó látja a segítséget aktiválódni
      }
    }
  };

  const useHelp2xAnswer = async () => {
    if (selectedAnswer || isDoubleAnswerActiveThisQuestion) return;
    
    // Check usage count
    if (help2xAnswerUsageCount >= 2) {
      // Nincs toast - UI mutatja hogy disabled
      return;
    }
    
    const cost = help2xAnswerUsageCount === 0 ? 0 : 20; // First free, second costs 20 coins
    
    // First usage - free
    if (help2xAnswerUsageCount === 0 && profile?.help_2x_answer_active) {
      setIsDoubleAnswerActiveThisQuestion(true);
      setHelp2xAnswerUsageCount(1);
      setFirstAttempt(null);
      setSecondAttempt(null);
      
      await supabase.rpc('use_help', { p_help_type: '2x_answer' });
      await refreshProfile();
      await logHelpUsage('2x_answer');
      
      // Nincs toast - a felhasználó látja a segítség aktiválódását
      return;
    }
    
    // Second usage - costs 20 coins
    if (help2xAnswerUsageCount === 1) {
      if (!profile || profile.coins < cost) {
        // Nincs toast - insufficient dialog fog megjelenni
        setInsufficientType('coins');
        setRequiredAmount(cost);
        setShowInsufficientDialog(true);
        return;
      }
      
      const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
      if (success) {
        await refreshProfile();
        setIsDoubleAnswerActiveThisQuestion(true);
        setHelp2xAnswerUsageCount(2);
        setFirstAttempt(null);
        setSecondAttempt(null);
        await logHelpUsage('2x_answer');
        // Nincs toast - a felhasználó látja a segítséget aktiválódni
      }
    }
  };

  const useHelpAudience = async () => {
    if (selectedAnswer || isAudienceActiveThisQuestion) return;
    
    // Check usage count
    if (helpAudienceUsageCount >= 2) {
      // Nincs toast - UI mutatja hogy disabled
      return;
    }
    
    const cost = helpAudienceUsageCount === 0 ? 0 : 30; // First free, second costs 30 coins
    
    // Generate audience votes with correct answer >= 65% and highest
    const currentQuestion = questions[currentQuestionIndex];
    const correctKey = currentQuestion.answers.find(a => a.correct)?.key || 'A';
    
    // Generate votes ensuring correct answer has >= 65% and is highest
    const correctVote = 65 + Math.floor(Math.random() * 20); // 65-84%
    const remaining = 100 - correctVote;
    
    // Distribute remaining votes between wrong answers
    const wrongKeys = currentQuestion.answers.filter(a => !a.correct).map(a => a.key);
    const votes: Record<string, number> = {};
    
    if (wrongKeys.length === 2) {
      const first = Math.floor(Math.random() * (remaining - 1)) + 1;
      const second = remaining - first;
      votes[wrongKeys[0]] = Math.min(first, second);
      votes[wrongKeys[1]] = Math.max(first, second);
    }
    votes[correctKey] = correctVote;
    
    // First usage - free
    if (helpAudienceUsageCount === 0 && profile?.help_audience_active) {
      setAudienceVotes(votes);
      setIsAudienceActiveThisQuestion(true);
      setHelpAudienceUsageCount(1);
      
      await supabase.rpc('use_help', { p_help_type: 'audience' });
      await refreshProfile();
      await logHelpUsage('audience');
      
      // Nincs toast - a felhasználó látja a segítség aktiválódását
      return;
    }
    
    // Second usage - costs 30 coins
    if (helpAudienceUsageCount === 1) {
      if (!profile || profile.coins < cost) {
        // Nincs toast - insufficient dialog fog megjelenni
        setInsufficientType('coins');
        setRequiredAmount(cost);
        setShowInsufficientDialog(true);
        return;
      }
      
      const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
      if (success) {
        await refreshProfile();
        setAudienceVotes(votes);
        setIsAudienceActiveThisQuestion(true);
        setHelpAudienceUsageCount(2);
        await logHelpUsage('audience');
        // Nincs toast - a felhasználó látja a segítséget aktiválódni
      }
    }
  };

  const useQuestionSwap = async () => {
    if (usedQuestionSwap || selectedAnswer) return;
    
    const skipCost = getSkipCost(currentQuestionIndex);
    
    // Check if user has enough coins
    if (!profile || profile.coins < skipCost) {
      // Nincs toast - insufficient dialog fog megjelenni
      setInsufficientType('coins');
      setRequiredAmount(skipCost);
      setShowInsufficientDialog(true);
      return;
    }
    
    // Spend coins
    const success = await supabase.rpc('spend_coins', { amount: skipCost });
    if (!success.data) {
      // Nincs toast - error látható a UI-ban
      return;
    }
    
    const questionBank = QUESTION_BANKS[selectedCategory!];
    const currentIds = questions.map(q => q.id);
    const availableQuestions = questionBank.filter(q => !currentIds.includes(q.id));
    
    if (availableQuestions.length === 0) {
      // Nincs toast - nincs több kérdés
      return;
    }
    
    const newQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = newQuestion;
    setQuestions(updatedQuestions);
    
    // Log skip usage
    await logHelpUsage('skip');
    
    setTimeLeft(10);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setFirstAttempt(null);
    setQuestionStartTime(Date.now());
    setUsedQuestionSwap(true);
    
    await refreshProfile();
    // Nincs toast - a felhasználó látja az új kérdést
  };

  if (profileLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        <div className="relative z-10 text-white">Betöltés...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        <div className="relative z-10 text-white flex flex-col items-center gap-4">
          <p>Hiba a profil betöltésekor</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Vissza
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === 'category-select') {
    return (
      <div className="fixed inset-0 md:relative md:min-h-auto overflow-y-auto">
        <CategorySelector onSelect={startGameWithCategory} />
        
        {/* Insufficient Resources Dialog for category selection */}
        <InsufficientResourcesDialog
          open={showInsufficientDialog}
          onOpenChange={setShowInsufficientDialog}
          type={insufficientType}
          requiredAmount={requiredAmount}
          currentAmount={insufficientType === 'coins' ? profile.coins : profile.lives}
          onGoToShop={() => {
            // Keep modal open for in-game purchase
          }}
          userId={userId}
          onPurchaseComplete={async () => {
            await refreshProfile();
            setShowInsufficientDialog(false);
          }}
        />
        
        {/* Lives & Coins Display - 3D Design - Smaller & Responsive */}
        <div className="fixed top-4 right-4 z-50">
          <div className="relative rounded-lg p-2 md:p-2.5" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60 rounded-lg" style={{ transform: 'translate(3px, 3px)', filter: 'blur(5px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-700/80 via-purple-600/70 to-purple-900/80 border-2 border-purple-500/50 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[2px] rounded-lg bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.3), inset 0 -1.5px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[4px] rounded-lg bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm" style={{ boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.2), inset 0 -6px 12px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[4px] rounded-lg pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            <div className="relative z-10 flex flex-col gap-1.5" style={{ transform: 'translateZ(40px)' }}>
              {/* Lives */}
              <div className="flex items-center gap-1.5">
                <div className="relative p-1 rounded">
                  {/* Heart icon base shadow */}
                  <div className="absolute inset-0 bg-black/40 rounded" style={{ transform: 'translate(1px, 1px)', filter: 'blur(2px)' }} aria-hidden />
                  
                  {/* Heart icon outer frame */}
                  <div className="absolute inset-0 rounded bg-gradient-to-br from-red-400 via-red-500 to-red-600 border border-red-300/50" aria-hidden />
                  
                  {/* Heart icon inner layer */}
                  <div className="absolute inset-[1.5px] rounded bg-gradient-to-b from-red-400 via-red-500 to-red-600" style={{ boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.2), inset 0 -1.5px 3px rgba(0,0,0,0.3)' }} aria-hidden />
                  
                  <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-white relative z-10 drop-shadow-lg" />
                </div>
                <span className="font-black text-xs md:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {profile.lives}/{profile.max_lives}
                </span>
              </div>
              
              {/* Coins */}
              <div className="flex items-center gap-1.5">
                <div className="relative p-1 rounded">
                  {/* Coins icon base shadow */}
                  <div className="absolute inset-0 bg-black/40 rounded" style={{ transform: 'translate(1px, 1px)', filter: 'blur(2px)' }} aria-hidden />
                  
                  {/* Coins icon outer frame */}
                  <div className="absolute inset-0 rounded bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border border-yellow-300/50" aria-hidden />
                  
                  {/* Coins icon inner layer */}
                  <div className="absolute inset-[1.5px] rounded bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600" style={{ boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.2), inset 0 -1.5px 3px rgba(0,0,0,0.3)' }} aria-hidden />
                  
                  <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-white relative z-10 drop-shadow-lg" />
                </div>
                <span className="font-black text-xs md:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {profile.coins}
                </span>
              </div>
            </div>
          </div>
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

  if (gameState === 'playing') {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <>
        {/* Fixed background */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        
        {/* Scrollable question container */}
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
                  ⬆️ Felfelé: tovább ({continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST} 🪙 levonva)
                </div>
                <div className="text-[10px] opacity-90">
                  ⬇️ Lefelé: kilépés (nyeremény megőrzése)
                </div>
              </div>
            </div>
          )}

          {/* Question module with TikTok-style animation */}
          <div 
            className={`absolute inset-0 w-full h-full transition-transform ease-in-out`}
            style={{ 
              transform: isAnimating 
                ? 'translateY(-100%)' 
                : `translateY(${translateY}px)`,
              transitionDuration: isAnimating ? '400ms' : '0ms'
            }}
          >
            <div 
              className="w-full h-full transition-opacity duration-200"
              style={{ opacity: questionVisible ? 1 : 0 }}
            >
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                timeLeft={timeLeft}
                selectedAnswer={selectedAnswer}
                firstAttempt={firstAttempt}
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
          onConfirmExit={() => {
            resetGameState();
          }}
        />

        <InsufficientResourcesDialog
          open={showInsufficientDialog}
          onOpenChange={setShowInsufficientDialog}
          type={insufficientType}
          requiredAmount={requiredAmount}
          currentAmount={insufficientType === 'coins' ? profile.coins : profile.lives}
          onGoToShop={() => {
            // Keep modal open for in-game purchase
          }}
          userId={userId}
          onPurchaseComplete={async () => {
            await refreshProfile();
            setShowInsufficientDialog(false);
          }}
        />
      </>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden">
        {/* Background with blur */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        <div className="absolute inset-0 w-full h-full backdrop-blur-[10px] bg-black/10" />
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-yellow-400/30 animate-pulse"
              style={{
                width: `${Math.random() * 8 + 3}px`,
                height: `${Math.random() * 8 + 3}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>

        {/* Main content - Perfectly centered vertically and horizontally */}
        <div className="relative z-10 w-full max-w-[95%] sm:max-w-2xl max-h-[95vh] flex flex-col items-center justify-center overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          {/* 3D Trophy - Double the size with enhanced glow */}
          <div className="relative flex items-center justify-center mb-4 sm:mb-6 flex-shrink-0">
            {/* Multiple glow layers for maximum emphasis */}
            <div className="absolute inset-0 bg-yellow-400/50 rounded-full blur-[100px] scale-[2] animate-pulse" />
            <div className="absolute inset-0 bg-orange-500/40 rounded-full blur-[80px] scale-[1.8] animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-[60px] scale-[1.5] animate-pulse" style={{ animationDelay: '1s' }} />
            <Trophy3D 
              className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem]" 
              animate={true} 
            />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 relative text-center px-4 flex-shrink-0">
            <span 
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #00ff87, #60efff, #00ff87)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(0,255,135,0.5)',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              Gratulálunk!
            </span>
          </h1>

          {/* Stats cards with 3D effect - Fully responsive and compact */}
          <div className="w-full space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-shrink-0">
            {/* Correct answers */}
            <div className="relative group" style={{ perspective: '1000px' }}>
              <div 
                className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl"
                style={{ 
                  transform: 'translateZ(-8px)',
                  filter: 'blur(8px)',
                  opacity: 0.6
                }}
              />
              <div 
                className="relative bg-gradient-to-br from-green-500/30 to-green-700/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-green-400/50 transition-transform hover:scale-105"
                style={{
                  transform: 'translateZ(0)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 8px 32px rgba(0,255,0,0.3)'
                }}
              >
                <p className="text-xs sm:text-sm md:text-base text-white/80 font-semibold mb-0.5 sm:mb-1">Helyes válaszok</p>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{correctAnswers}/15</p>
              </div>
            </div>

            {/* Coins earned */}
            <div className="relative group" style={{ perspective: '1000px' }}>
              <div 
                className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl"
                style={{ 
                  transform: 'translateZ(-8px)',
                  filter: 'blur(8px)',
                  opacity: 0.6
                }}
              />
              <div 
                className="relative bg-gradient-to-br from-yellow-500/30 to-orange-600/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-yellow-400/50 transition-transform hover:scale-105"
                style={{
                  transform: 'translateZ(0)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 8px 32px rgba(255,215,0,0.3)'
                }}
              >
                <p className="text-xs sm:text-sm md:text-base text-white/80 font-semibold mb-0.5 sm:mb-1">Szerzett aranyérme</p>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg flex items-center justify-center gap-2">
                  +{coinsEarned} <span className="text-xl sm:text-2xl md:text-3xl">🪙</span>
                </p>
              </div>
            </div>

            {/* Average response time */}
            {responseTimes.length > 0 && (
              <div className="relative group" style={{ perspective: '1000px' }}>
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl"
                  style={{ 
                    transform: 'translateZ(-8px)',
                    filter: 'blur(8px)',
                    opacity: 0.6
                  }}
                />
                <div 
                  className="relative bg-gradient-to-br from-blue-500/30 to-purple-600/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-blue-400/50 transition-transform hover:scale-105"
                  style={{
                    transform: 'translateZ(0)',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 8px 32px rgba(96,165,250,0.3)'
                  }}
                >
                  <p className="text-xs sm:text-sm md:text-base text-white/80 font-semibold mb-0.5 sm:mb-1">Átlagos válaszidő</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg">
                    {(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)}s
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons - Fully responsive and compact */}
          <div className="w-full space-y-2 sm:space-y-2.5 flex-shrink-0">
            <HexagonButton 
              variant="yellow" 
              size="lg" 
              onClick={() => {
                setGameState('category-select');
              }}
              className="w-full transform hover:scale-105 transition-all shadow-[0_8px_32px_rgba(255,215,0,0.4)] text-xs sm:text-sm md:text-base"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              }}
            >
              Új játék
            </HexagonButton>
            
            <button 
              onClick={() => {
                navigate('/dashboard');
              }}
              className="w-full text-white text-xs sm:text-sm md:text-base font-semibold py-2 sm:py-2.5 hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm border border-white/20"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GamePreview;
