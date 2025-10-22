import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Coins, Gift } from "lucide-react";
import gameBackground from "@/assets/game-background.jpg";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useDailyGift } from "@/hooks/useDailyGift";
import { supabase } from "@/integrations/supabase/client";
import { GameCategory, Question, Answer, getSkipCost, CONTINUE_AFTER_WRONG_COST, TIMEOUT_CONTINUE_COST } from "@/types/game";
import CategorySelector from "./CategorySelector";
import { HexagonButton } from "./HexagonButton";
import { GameStateScreen } from "./GameStateScreen";
import { QuestionCard } from "./QuestionCard";
import { InsufficientResourcesDialog } from "./InsufficientResourcesDialog";
import { ContinueGameDialog } from "./ContinueGameDialog";
import { ExitGameDialog } from "./ExitGameDialog";
import BottomNav from "./BottomNav";

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

const GamePreview = ({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement> }) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading: profileLoading, updateProfile, spendLife, refreshProfile } = useGameProfile(userId);
  const { canClaim, claimDailyGift } = useDailyGift(userId);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Lifelines
  const [usedHelp5050, setUsedHelp5050] = useState(false);
  const [usedHelp2xAnswer, setUsedHelp2xAnswer] = useState(false);
  const [usedHelpAudience, setUsedHelpAudience] = useState(false);
  const [usedQuestionSwap, setUsedQuestionSwap] = useState(false);
  const [reactivatedHelp5050, setReactivatedHelp5050] = useState(false);
  const [reactivatedHelp2xAnswer, setReactivatedHelp2xAnswer] = useState(false);
  const [reactivatedHelpAudience, setReactivatedHelpAudience] = useState(false);
  const [help5050ReactivationCount, setHelp5050ReactivationCount] = useState(0);
  const [help2xReactivationCount, setHelp2xReactivationCount] = useState(0);
  const [helpAudienceReactivationCount, setHelpAudienceReactivationCount] = useState(0);
  const [firstAttempt, setFirstAttempt] = useState<string | null>(null);
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
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [continueType, setContinueType] = useState<'timeout' | 'wrong' | 'out-of-lives'>('wrong');
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [insufficientType, setInsufficientType] = useState<'coins' | 'lives'>('coins');
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [errorBannerVisible, setErrorBannerVisible] = useState(false);
  const [errorBannerMessage, setErrorBannerMessage] = useState('');
  const [questionVisible, setQuestionVisible] = useState(true);

  const stopMusic = () => {
    try {
      const g = (window as any).__bgm as HTMLAudioElement | undefined;
      if (g) {
        g.pause();
        g.currentTime = 0;
        (window as any).__bgm = undefined;
      }
    } catch (error) {
      console.error('Error stopping music:', error);
    }
  };

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
            toast.success(`${data.coins} arany és ${data.lives} élet hozzáadva!`);
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
          toast.error('Fizetés ellenőrzése sikertelen');
        }
        
        // Clean URL
        window.history.replaceState({}, '', '/game');
      } else if (paymentStatus === 'cancelled') {
        toast.info('Fizetés megszakítva');
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
      if (isAnimating || showContinueDialog || showExitDialog) return;
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating || showContinueDialog || showExitDialog) return;
      
      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStartY;
      
      // Smooth scroll - always allow swiping
      setTranslateY(delta * 0.3); // Damped movement for smooth feel
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (isAnimating || showContinueDialog || showExitDialog) return;
      
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
  }, [gameState, canSwipe, isAnimating, selectedAnswer, showContinueDialog, showExitDialog, touchStartY]);

  const handleSwipeUp = async () => {
    // Auto-deduct and continue if there's an error (timeout or wrong answer)
    if (errorBannerVisible && !showContinueDialog) {
      const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
      
      if (profile && profile.coins >= cost) {
        const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
        if (success) {
          await refreshProfile();
          setErrorBannerVisible(false);
          toast.success(`${cost} aranyérme levonva - Tovább!`);
          await handleNextQuestion();
        }
      } else {
        setShowContinueDialog(true);
        setErrorBannerVisible(false);
      }
      return;
    }

    // If continue dialog is shown, handle payment
    if (showContinueDialog) {
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

    // If continue dialog, exit game
    if (showContinueDialog) {
      handleRejectContinue();
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

    const g = (window as any).__bgm as HTMLAudioElement | undefined;
    if (g) {
      g.volume = 0.1;
      try { await g.play(); } catch {}
    }
    
    try {
      await supabase.rpc('reset_game_helps');
    } catch (error) {
      console.error('Error resetting helps:', error);
    }
    
    const canPlay = await spendLife();
    if (!canPlay) {
      toast.error("Nincs elég életed a játékhoz!");
      setGameState('category-select');
      return;
    }
    
    try {
      await supabase.rpc('award_coins', { amount: 1 });
      setCoinsEarned(1);
    } catch (error) {
      console.error('Error awarding welcome coin:', error);
    }

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
    setUsedHelp5050(false);
    setUsedHelp2xAnswer(false);
    setUsedHelpAudience(false);
    setUsedQuestionSwap(false);
    setReactivatedHelp5050(false);
    setReactivatedHelp2xAnswer(false);
    setReactivatedHelpAudience(false);
    setHelp5050ReactivationCount(0);
    setHelp2xReactivationCount(0);
    setHelpAudienceReactivationCount(0);
    setFirstAttempt(null);
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

    // 2x answer logic
    if (usedHelp2xAnswer && !firstAttempt) {
      setFirstAttempt(answerKey);
      
      if (isCorrect) {
        setTimeout(() => {
          handleCorrectAnswer(responseTime, answerKey);
        }, 500);
      }
      return;
    }

    if (usedHelp2xAnswer && firstAttempt && answerKey !== firstAttempt) {
      const firstAnswerObj = currentQuestion.answers.find(a => a.key === firstAttempt);
      
      if (isCorrect || firstAnswerObj?.correct) {
        setTimeout(() => {
          handleCorrectAnswer(responseTime, answerKey);
        }, 500);
      } else {
        setTimeout(() => {
          handleWrongAnswer(responseTime, answerKey);
        }, 500);
      }
      return;
    }

    if (isCorrect) {
      handleCorrectAnswer(responseTime, answerKey);
    } else {
      handleWrongAnswer(responseTime, answerKey);
    }
  };

  const handleCorrectAnswer = async (responseTime: number, answerKey: string) => {
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
    
    setCoinsEarned(coinsEarned + reward);
    
    if (profile) {
      try {
        await supabase.rpc('award_coins', { amount: reward });
        await refreshProfile();
      } catch (error) {
        console.error('Error awarding coins:', error);
      }
    }

    toast.success(`Helyes! +${reward} 🪙`);
  };

  const handleWrongAnswer = (responseTime: number, answerKey: string) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(answerKey);
    setContinueType('wrong');
    setErrorBannerVisible(true);
    setErrorBannerMessage(`❌ Rossz válasz - ${CONTINUE_AFTER_WRONG_COST} aranyérme`);
  };

  const handleNextQuestion = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCanSwipe(false);
    setShowContinueDialog(false);
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
      setRemovedAnswer(null);
      setAudienceVotes({});
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
      toast.success(`Kérdés átugorva ${cost} aranyért`);
      await handleNextQuestion();
    }
  };

  const handleContinueAfterMistake = async () => {
    if (!profile) return;
    
    const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
    
    if (profile.coins < cost) {
      setShowContinueDialog(false);
      setInsufficientType('coins');
      setRequiredAmount(cost);
      setShowInsufficientDialog(true);
      return;
    }
    
    const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
    if (success) {
      await refreshProfile();
      toast.success(`${cost} aranyérme levonva - Tovább!`);
      await handleNextQuestion();
    } else {
      toast.error('Hiba a fizetés során');
      await finishGame();
    }
  };

  const handleRejectContinue = () => {
    setShowContinueDialog(false);
    finishGame();
  };

  const finishGame = async () => {
    if (!profile || !selectedCategory) return;

    setGameState('finished');
    await refreshProfile();

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    await supabase.from('game_results').insert({
      user_id: userId!,
      category: selectedCategory,
      correct_answers: correctAnswers,
      total_questions: questions.length,
      coins_earned: coinsEarned,
      average_response_time: avgResponseTime,
      completed: true,
      completed_at: new Date().toISOString()
    });

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

    toast.success(`Játék vége! ${correctAnswers}/${questions.length} helyes válasz`);
  };

  // UseHelp functions
  const useHelp5050 = async () => {
    if (selectedAnswer) return;
    
    if (!usedHelp5050 && profile?.help_50_50_active) {
      const currentQuestion = questions[currentQuestionIndex];
      const thirdAnswerKey = currentQuestion.third;
      
      setRemovedAnswer(thirdAnswerKey);
      setUsedHelp5050(true);
      
      await supabase.rpc('use_help', { p_help_type: '50_50' });
      await refreshProfile();
      
      toast.info('Harmadoló segítség használva');
      return;
    }
    
    if (usedHelp5050 && !reactivatedHelp5050 && help5050ReactivationCount < 1) {
      if (!profile || profile.coins < 15) {
        toast.error('Nincs elég aranyérme! 15 🪙 szükséges.');
        setInsufficientType('coins');
        setRequiredAmount(15);
        setShowInsufficientDialog(true);
        return;
      }
      
      const { data: success } = await supabase.rpc('spend_coins', { amount: 15 });
      if (success) {
        await refreshProfile();
        setReactivatedHelp5050(true);
        setHelp5050ReactivationCount(prev => prev + 1);
        const currentQuestion = questions[currentQuestionIndex];
        const thirdAnswerKey = currentQuestion.third;
        setRemovedAnswer(thirdAnswerKey);
        toast.success('Harmadoló újraaktiválva!');
      }
    } else if (help5050ReactivationCount >= 1) {
      toast.error('Ezt a segítséget már kétszer használtad!');
    }
  };

  const useHelp2xAnswer = async () => {
    if (selectedAnswer) return;
    
    if (!usedHelp2xAnswer && profile?.help_2x_answer_active) {
      setUsedHelp2xAnswer(true);
      
      await supabase.rpc('use_help', { p_help_type: '2x_answer' });
      await refreshProfile();
      
      toast.info('2× válasz használva');
      return;
    }
    
    if (usedHelp2xAnswer && !reactivatedHelp2xAnswer && help2xReactivationCount < 1) {
      if (!profile || profile.coins < 20) {
        toast.error('Nincs elég aranyérme! 20 🪙 szükséges.');
        setInsufficientType('coins');
        setRequiredAmount(20);
        setShowInsufficientDialog(true);
        return;
      }
      
      const { data: success } = await supabase.rpc('spend_coins', { amount: 20 });
      if (success) {
        await refreshProfile();
        setReactivatedHelp2xAnswer(true);
        setHelp2xReactivationCount(prev => prev + 1);
        setFirstAttempt(null);
        toast.success('2× válasz újraaktiválva!');
      }
    } else if (help2xReactivationCount >= 1) {
      toast.error('Ezt a segítséget már kétszer használtad!');
    }
  };

  const useHelpAudience = async () => {
    if (selectedAnswer) return;
    
    if (!usedHelpAudience && profile?.help_audience_active) {
      const currentQuestion = questions[currentQuestionIndex];
      const votes = currentQuestion.audience;
      
      setAudienceVotes(votes);
      setUsedHelpAudience(true);
      
      await supabase.rpc('use_help', { p_help_type: 'audience' });
      await refreshProfile();
      
      toast.info('Közönség segítség használva');
      return;
    }
    
    if (usedHelpAudience && !reactivatedHelpAudience && helpAudienceReactivationCount < 1) {
      if (!profile || profile.coins < 30) {
        toast.error('Nincs elég aranyérme! 30 🪙 szükséges.');
        setInsufficientType('coins');
        setRequiredAmount(30);
        setShowInsufficientDialog(true);
        return;
      }
      
      const { data: success } = await supabase.rpc('spend_coins', { amount: 30 });
      if (success) {
        await refreshProfile();
        setReactivatedHelpAudience(true);
        setHelpAudienceReactivationCount(prev => prev + 1);
        const currentQuestion = questions[currentQuestionIndex];
        const votes = currentQuestion.audience;
        setAudienceVotes(votes);
        toast.success('Közönség segítség újraaktiválva!');
      }
    } else if (helpAudienceReactivationCount >= 1) {
      toast.error('Ezt a segítséget már kétszer használtad!');
    }
  };

  const useQuestionSwap = async () => {
    if (usedQuestionSwap || selectedAnswer) return;
    
    const skipCost = getSkipCost(currentQuestionIndex);
    
    // Check if user has enough coins
    if (!profile || profile.coins < skipCost) {
      toast.error(`Nincs elég aranyérme! ${skipCost} 🪙 szükséges.`);
      setInsufficientType('coins');
      setRequiredAmount(skipCost);
      setShowInsufficientDialog(true);
      return;
    }
    
    // Spend coins
    const success = await supabase.rpc('spend_coins', { amount: skipCost });
    if (!success.data) {
      toast.error('Hiba az arany levonásakor');
      return;
    }
    
    const questionBank = QUESTION_BANKS[selectedCategory!];
    const currentIds = questions.map(q => q.id);
    const availableQuestions = questionBank.filter(q => !currentIds.includes(q.id));
    
    if (availableQuestions.length === 0) {
      toast.error('Nincs több kérdés');
      return;
    }
    
    const newQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = newQuestion;
    setQuestions(updatedQuestions);
    
    setTimeLeft(10);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setFirstAttempt(null);
    setQuestionStartTime(Date.now());
    setUsedQuestionSwap(true);
    
    await refreshProfile();
    toast.info(`Kérdés kicserélve! (${skipCost} 🪙 levonva)`);
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
        
        <div className="fixed top-4 right-4 bg-card/90 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-border/50 shadow-lg z-50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              <span className="font-bold text-sm md:text-base">{profile.lives}/{profile.max_lives}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
              <span className="font-bold text-sm md:text-base">{profile.coins}</span>
            </div>
            {canClaim && (
              <Button size="sm" onClick={claimDailyGift} className="mt-2 text-xs md:text-sm">
                <Gift className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                Napi ajándék
              </Button>
            )}
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
          {/* Error banner (red bar) */}
          {errorBannerVisible && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg animate-fade-in max-w-xs text-center">
              <div className="mb-1">{errorBannerMessage}</div>
              <div className="text-[10px] opacity-90">
                ⬆️ Felfelé: tovább ({continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST} 🪙 levonva)
              </div>
              <div className="text-[10px] opacity-90">
                ⬇️ Lefelé: kilépés (nyeremény megőrzése)
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
                usedHelp5050={usedHelp5050}
                usedHelp2xAnswer={usedHelp2xAnswer}
                usedHelpAudience={usedHelpAudience}
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

        {/* Bottom Nav */}
        <BottomNav />

        {/* Dialogs */}
        <ExitGameDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onConfirmExit={() => {
            setGameState('category-select');
            setShowExitDialog(false);
          }}
        />

        <ContinueGameDialog
          open={showContinueDialog}
          onOpenChange={setShowContinueDialog}
          type={continueType}
          cost={continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST}
          currentCoins={profile.coins}
          onContinue={handleContinueAfterMistake}
          onExit={handleRejectContinue}
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
      <div className="fixed inset-0 md:relative md:min-h-screen flex items-center justify-center p-4 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        <div className="relative z-10 w-full flex items-center justify-center">
          <div className="max-w-md w-full bg-black/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border-2 border-green-500/50">
            <div className="text-8xl mb-6 animate-bounce">🏆</div>
            <h1 className="text-3xl md:text-4xl font-black text-green-500 mb-6">Gratulálunk!</h1>
            
            <div className="space-y-3 mb-6">
              <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                <p className="text-sm text-white/70">Helyes válaszok</p>
                <p className="text-2xl md:text-3xl font-bold text-white">{correctAnswers}/15</p>
              </div>
              <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-500/30">
                <p className="text-sm text-white/70">Szerzett aranyérme</p>
                <p className="text-2xl md:text-3xl font-bold text-white">+{coinsEarned} 🪙</p>
              </div>
              {responseTimes.length > 0 && (
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-sm text-white/70">Átlagos válaszidő</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    {(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)}s
                  </p>
                </div>
              )}
            </div>

            <HexagonButton 
              variant="yellow" 
              size="lg" 
              onClick={() => {
                setGameState('category-select');
              }}
              className="w-full max-w-sm mx-auto mb-3"
            >
              Új játék
            </HexagonButton>
            
            <button 
              onClick={() => {
                stopMusic();
                navigate('/dashboard');
              }}
              className="text-white text-sm hover:underline"
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
