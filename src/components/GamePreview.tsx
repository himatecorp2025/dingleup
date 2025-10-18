import { useState, useEffect, useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Heart, Coins, Gift, Home, RotateCcw, ChevronDown, SkipForward, LogOut } from "lucide-react";
import gameBackground from "@/assets/game-background.jpg";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useDailyGift } from "@/hooks/useDailyGift";
import { supabase } from "@/integrations/supabase/client";
import { GameCategory, Question, getCoinsForQuestion, SKIP_COSTS, CONTINUE_AFTER_WRONG_COST, TIMEOUT_CONTINUE_COST } from "@/types/game";
import CategorySelector from "./CategorySelector";
import { HexagonButton } from "./HexagonButton";
import { TimerCircle } from "./TimerCircle";
import { GameStateScreen } from "./GameStateScreen";
import { MillionaireQuestion } from "./MillionaireQuestion";
import { MillionaireAnswer } from "./MillionaireAnswer";

import healthQuestions from "@/data/questions-health.json";
import historyQuestions from "@/data/questions-history.json";
import cultureQuestions from "@/data/questions-culture.json";
import financeQuestions from "@/data/questions-finance.json";

type GameState = 'category-select' | 'playing' | 'finished' | 'out-of-lives';

const QUESTION_BANKS = {
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);

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
  const [firstAttempt, setFirstAttempt] = useState<string | null>(null);
  const [removedAnswer, setRemovedAnswer] = useState<string | null>(null);
  const [audienceVotes, setAudienceVotes] = useState<Record<string, number>>({});

  // Flash effect for correct/wrong answers
  const [answerFlash, setAnswerFlash] = useState<'correct' | 'wrong' | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showSkipPanel, setShowSkipPanel] = useState(false);
  const [showContinuePanel, setShowContinuePanel] = useState(false);
  const [continueType, setContinueType] = useState<'wrong' | 'timeout'>('wrong');
  const [showExitDialog, setShowExitDialog] = useState(false);

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

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !selectedAnswer) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !selectedAnswer && gameState === 'playing') {
      handleTimeout();
    }
  }, [timeLeft, gameState, selectedAnswer]);

  const handleTimeout = () => {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer('__timeout__');
    setAnswerFlash('wrong');
    setShowSkipPanel(false);
    setContinueType('timeout');
    setShowContinuePanel(true);
  };

  const shuffleAnswers = (questionSet: Question[]): Question[] => {
    let lastCorrectIndex = -1;
    let lastCorrectCount = 0;
    
    return questionSet.map((q) => {
      const answers = [...q.answers];
      const correctIdx = answers.findIndex(a => a.correct);
      
      // Prevent same position more than 2 times in a row
      let newCorrectIdx = correctIdx;
      let attempts = 0;
      while ((newCorrectIdx === lastCorrectIndex && lastCorrectCount >= 2) && attempts < 10) {
        // Shuffle answers
        for (let i = answers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [answers[i], answers[j]] = [answers[j], answers[i]];
        }
        newCorrectIdx = answers.findIndex(a => a.correct);
        attempts++;
      }
      
      // Update tracking
      if (newCorrectIdx === lastCorrectIndex) {
        lastCorrectCount++;
      } else {
        lastCorrectIndex = newCorrectIdx;
        lastCorrectCount = 1;
      }
      
      return { ...q, answers };
    });
  };

  const startGameWithCategory = async (category: GameCategory) => {
    if (!profile) return;

    const g = (window as any).__bgm as HTMLAudioElement | undefined;
    if (g) {
      g.volume = 0.1;
      try { await g.play(); } catch {}
    }
    
    // Spend one life at game start ONLY
    const canPlay = await spendLife();
    if (!canPlay) {
      toast.error("Nincs elég életed a játékhoz!");
      setGameState('category-select');
      return;
    }
    
    // Give 1 gold coin as welcome gift using RPC
    try {
      await supabase.rpc('award_coins', { amount: 1 });
      setCoinsEarned(1);
    } catch (error) {
      console.error('Error awarding welcome coin:', error);
    }

    // Refresh profile to show all updates
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
    setFirstAttempt(null);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setShowSkipPanel(false);
    setShowContinuePanel(false);
    setQuestionStartTime(Date.now());
  };

  const handleAnswer = (answerKey: string) => {
    if (selectedAnswer) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerObj = currentQuestion.answers.find(a => a.key === answerKey);
    const isCorrect = selectedAnswerObj?.correct || false;

    // 2x answer logic
    if (usedHelp2xAnswer && !firstAttempt) {
      setFirstAttempt(answerKey);
      if (isCorrect) {
        handleCorrectAnswer(responseTime, answerKey);
      }
      return;
    }

    if (usedHelp2xAnswer && firstAttempt && answerKey !== firstAttempt) {
      const firstAnswerObj = currentQuestion.answers.find(a => a.key === firstAttempt);
      if (isCorrect || firstAnswerObj?.correct) {
        handleCorrectAnswer(responseTime, answerKey);
      } else {
        handleWrongAnswer(responseTime, answerKey);
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
    setAnswerFlash('correct');
    setShowSkipPanel(false);
    
    // New progressive gold reward system
    let reward = 0;
    if (currentQuestionIndex >= 0 && currentQuestionIndex <= 3) {
      reward = 1; // Questions 1-4: 1 coin each
    } else if (currentQuestionIndex >= 4 && currentQuestionIndex <= 8) {
      reward = 3; // Questions 5-9: 3 coins each
    } else if (currentQuestionIndex >= 9 && currentQuestionIndex <= 13) {
      reward = 5; // Questions 10-14: 5 coins each
    } else if (currentQuestionIndex === 14) {
      reward = 55; // Question 15: 55 coins
    }
    
    setCoinsEarned(coinsEarned + reward);
    
    // Award coins using RPC function
    if (profile) {
      try {
        await supabase.rpc('award_coins', { amount: reward });
      } catch (error) {
        console.error('Error awarding coins:', error);
      }
    }
    
    // Show scroll hint for next question
    setTimeout(() => {
      setShowScrollHint(true);
    }, 500);
  };

  const handleWrongAnswer = (responseTime: number, answerKey: string) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(answerKey);
    setAnswerFlash('wrong');
    setShowSkipPanel(false);
    setContinueType('wrong');
    setShowContinuePanel(true);
  };

  const handleNextQuestion = () => {
    setShowScrollHint(false);
    setShowContinuePanel(false);
    
    if (currentQuestionIndex >= questions.length - 1) {
      finishGame();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setFirstAttempt(null);
      setRemovedAnswer(null);
      setAudienceVotes({});
      setShowSkipPanel(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSkipQuestion = async () => {
    if (!profile) return;
    
    // Calculate skip cost
    let cost = 10;
    if (currentQuestionIndex >= 5 && currentQuestionIndex <= 9) cost = 20;
    if (currentQuestionIndex >= 10) cost = 30;
    
    if (profile.coins < cost) {
      toast.error(`Nincs elég aranyérme! ${cost} 🪙 szükséges.`);
      return;
    }
    
    // Spend coins using RPC
    const success = await supabase.rpc('spend_coins', { amount: cost });
    if (success.data) {
      await refreshProfile();
      handleNextQuestion();
    }
  };

  const handleContinueAfterMistake = async () => {
    if (!profile) return;
    
    const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
    
    if (profile.coins < cost) {
      toast.error(`Nincs elég aranyérme! ${cost} 🪙 szükséses.`);
      finishGame();
      return;
    }
    
    // Spend coins using RPC
    const success = await supabase.rpc('spend_coins', { amount: cost });
    if (success.data) {
      await refreshProfile();
      handleNextQuestion();
    } else {
      finishGame();
    }
  };

  const handleRejectContinue = () => {
    // Exit game and finish
    finishGame();
  };

  const finishGame = async () => {
    if (!profile || !selectedCategory) return;

    setGameState('finished');

    // Award coins using RPC (already awarded during game, just refresh)
    await refreshProfile();

    // Calculate average response time
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Save game result
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

    // Update total correct answers in profile
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

  const useHelp5050 = async () => {
    if (usedHelp5050 || !profile?.help_50_50_active || selectedAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const thirdAnswerKey = currentQuestion.third;
    
    setRemovedAnswer(thirdAnswerKey);
    setUsedHelp5050(true);
    
    // Use RPC to deactivate help
    await supabase.rpc('use_help', { p_help_type: '50_50' });
    await refreshProfile();
    
    toast.info('Harmadoló segítség használva - 1 hibás válasz eltávolítva');
  };

  const useHelp2xAnswer = async () => {
    if (usedHelp2xAnswer || !profile?.help_2x_answer_active || selectedAnswer) return;
    
    setUsedHelp2xAnswer(true);
    
    // Use RPC to deactivate help
    await supabase.rpc('use_help', { p_help_type: '2x_answer' });
    await refreshProfile();
    
    toast.info('2× válasz segítség használva - 2 próbálkozásod van');
  };

  const useHelpAudience = async () => {
    if (usedHelpAudience || !profile?.help_audience_active || selectedAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const votes = currentQuestion.audience;
    
    setAudienceVotes(votes);
    setUsedHelpAudience(true);
    
    // Use RPC to deactivate help
    await supabase.rpc('use_help', { p_help_type: 'audience' });
    await refreshProfile();
    
    toast.info('Közönség segítség használva');
  };

  const useQuestionSwap = async () => {
    if (usedQuestionSwap || selectedAnswer || !profile?.question_swaps_available || profile.question_swaps_available === 0) return;
    
    // Get a new random question from the same category
    const questionBank = QUESTION_BANKS[selectedCategory!];
    const currentIds = questions.map(q => q.id);
    const availableQuestions = questionBank.filter(q => !currentIds.includes(q.id));
    
    if (availableQuestions.length === 0) {
      toast.error('Nincs több kérdés ebben a kategóriában');
      return;
    }
    
    const newQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = newQuestion;
    setQuestions(updatedQuestions);
    
    // Reset states
    setTimeLeft(10);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setFirstAttempt(null);
    setQuestionStartTime(Date.now());
    setUsedQuestionSwap(true);
    
    // Note: question_swaps_available is managed server-side, just refresh
    await refreshProfile();
    toast.info('Kérdés kicserélve! Timer visszaállítva.');
  };

  // Scroll handler for TikTok-style navigation
  useEffect(() => {
    let touchStartY = 0;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      
      if (showContinuePanel && delta < -50) {
        // Scroll up = Continue and pay
        handleContinueAfterMistake();
      } else if (showContinuePanel && delta > 50) {
        // Scroll down = Exit game
        handleRejectContinue();
      } else if (showScrollHint && delta < -50) {
        // Scroll up to go next after correct answer
        handleNextQuestion();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;
      
      const touchEndY = e.touches[0].clientY;
      const delta = touchStartY - touchEndY;
      
      if (Math.abs(delta) < 100) return;
      
      e.preventDefault();
      
      if (showContinuePanel && delta > 0) {
        // Swipe up (ujjával lentről felfelé) = Continue and pay
        handleContinueAfterMistake();
        touchStartY = 0;
      } else if (showContinuePanel && delta < 0) {
        // Swipe down (fentről lefelé) = Exit game
        handleRejectContinue();
        touchStartY = 0;
      } else if (showScrollHint && delta > 0) {
        handleNextQuestion();
        touchStartY = 0;
      }
    };

    const container = document.body;
    if (gameState === 'playing' && (showScrollHint || showContinuePanel)) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [showScrollHint, showContinuePanel, gameState]);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        <div className="relative z-10 text-white">Hiba a profil betöltésekor</div>
      </div>
    );
  }

  if (gameState === 'category-select') {
    return (
        <>
        
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
      </>
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
        <div className="h-screen w-screen overflow-hidden fixed inset-0 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${gameBackground})` }}
        />
        <div className="h-full w-full flex flex-col p-4 relative z-10">
        <button
          onClick={() => setShowExitDialog(true)}
          className="absolute top-4 left-4 z-50 p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
          title="Kilépés"
        >
          <LogOut className="w-6 h-6 -scale-x-100" />
        </button>

        {/* Header */}
        <div className="flex-none w-full mb-4 mt-0">
          <div className="flex items-center justify-between mb-3">
            {/* Left spacer (exit button is absolute) */}
            <div className="w-16 h-16" />

            {/* Timer */}
            <div className="flex-shrink-0">
              <TimerCircle timeLeft={timeLeft} />
            </div>

            {/* Lives and coins - showing profile data */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-red-500/50">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-bold text-sm text-white">{profile.lives}</span>
              </div>
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-yellow-500/50">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-sm text-white">{profile.coins}</span>
              </div>
            </div>
          </div>

            {/* Notification panel - below timer, compact horizontal bar */}
            {(showContinuePanel || showScrollHint) && (
              <div className="w-full h-16 flex items-center justify-center animate-fade-in">
                {/* Continue panel */}
                {showContinuePanel && (
                  <div className="relative w-full bg-gradient-to-r from-red-600/95 to-red-700/95 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-red-400 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-sm">
                          {continueType === 'timeout' ? '⏰ Lejárt!' : '❌ Rossz!'}
                        </span>
                        {/* Cost badge - bal oldal, a "Lejárt!" vagy "Rossz!" szó mellett */}
                        <div className="bg-yellow-500 text-black font-black text-xs px-2.5 py-1 rounded-full border-2 border-yellow-600 shadow-lg">
                          {continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST} 🪙
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-green-300">
                          <ChevronDown className="w-4 h-4 animate-bounce" />
                          <span className="text-white">Le=Fizet</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-300">
                          <div className="rotate-180"><ChevronDown className="w-4 h-4" /></div>
                          <span className="text-white/70">Fel=Kilép</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll hint for correct answer */}
                {showScrollHint && !showContinuePanel && selectedAnswer && answerFlash === 'correct' && (
                  <div className="w-full bg-gradient-to-r from-green-600/95 to-green-500/95 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-green-400 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <span className="text-white font-bold text-sm">Helyes válasz!</span>
                          <span className="text-green-200 text-xs ml-2">
                            +{currentQuestionIndex >= 0 && currentQuestionIndex <= 3 ? 1 : 
                              currentQuestionIndex >= 4 && currentQuestionIndex <= 8 ? 3 : 
                              currentQuestionIndex >= 9 && currentQuestionIndex <= 13 ? 5 : 55} 🪙
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <ChevronDown className="w-4 h-4 animate-bounce" />
                        <span>Következő</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question and answers - NO flash effect overlay */}
          <div className={`flex-1 flex flex-col overflow-y-auto px-2 relative transition-all duration-300 ${answerFlash === 'correct' ? 'scale-105' : answerFlash === 'wrong' ? 'animate-shake' : ''}`}>
            
            <MillionaireQuestion questionNumber={currentQuestionIndex + 1}>{currentQuestion.question}</MillionaireQuestion>

            {/* Answers */}
            <div className="space-y-3 mb-4">
              {currentQuestion.answers.map((answer) => {
                const isRemoved = removedAnswer === answer.key;
                const isSelected = selectedAnswer === answer.key;
                const showResult = selectedAnswer !== null;
                const isCorrect = answer.correct && showResult;
                const isWrong = showResult && isSelected && !answer.correct;

                return (
                  <MillionaireAnswer
                    key={answer.key}
                    letter={answer.key as 'A' | 'B' | 'C'}
                    onClick={() => handleAnswer(answer.key)}
                    isSelected={isSelected && !showResult}
                    isCorrect={isCorrect}
                    isWrong={isWrong}
                    disabled={selectedAnswer !== null}
                    isRemoved={isRemoved}
                  >
                    {answer.text}
                    {audienceVotes[answer.key] && (
                      <span className="ml-2 text-xs">
                        <Users className="w-3 h-3 inline mr-1" />
                        {audienceVotes[answer.key]}%
                      </span>
                    )}
                  </MillionaireAnswer>
                );
              })}
            </div>


            {/* Lifelines with enhanced styling - ROTATED to flat side */}
            <div className="flex justify-center gap-3 mb-4 relative">
              <button
                onClick={useHelp5050}
                disabled={usedHelp5050 || !profile.help_50_50_active || selectedAnswer !== null}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  ${!usedHelp5050 && profile.help_50_50_active && !selectedAnswer ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
                `}
                style={{ clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)', transform: 'rotate(90deg)' }}
                title="Harmadoló"
              >
                <span className="text-white font-black text-lg" style={{ transform: 'rotate(-90deg)' }}>1/3</span>
              </button>
              <button
                onClick={useHelp2xAnswer}
                disabled={usedHelp2xAnswer || !profile.help_2x_answer_active || selectedAnswer !== null}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  ${!usedHelp2xAnswer && profile.help_2x_answer_active && !selectedAnswer ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
                `}
                style={{ clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)', transform: 'rotate(90deg)' }}
                title="2× válasz"
              >
                <span className="text-white font-black text-lg" style={{ transform: 'rotate(-90deg)' }}>2×</span>
              </button>
              <button
                onClick={useHelpAudience}
                disabled={usedHelpAudience || !profile.help_audience_active || selectedAnswer !== null}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  ${!usedHelpAudience && profile.help_audience_active && !selectedAnswer ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
                `}
                style={{ clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)', transform: 'rotate(90deg)' }}
                title="Közönség"
              >
                <Users className="w-6 h-6 text-white" style={{ transform: 'rotate(-90deg)' }} />
              </button>
              <button
                onClick={handleSkipQuestion}
                disabled={selectedAnswer !== null || !profile || profile.coins < (currentQuestionIndex < 5 ? 10 : currentQuestionIndex < 10 ? 20 : 30)}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 border-2 border-yellow-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  shadow-lg shadow-yellow-500/40
                `}
                style={{ clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)', transform: 'rotate(90deg)' }}
                title="Kérdés átugrás"
              >
                <SkipForward className="w-6 h-6 text-white" style={{ transform: 'rotate(-90deg)' }} />
              </button>
              {/* Skip cost badge - jobb felső sarokban, KÍVÜL a gombon */}
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-extrabold rounded-full px-2.5 py-1 border-2 border-yellow-600 shadow-lg pointer-events-none">
                {currentQuestionIndex < 5 ? '10' : currentQuestionIndex < 10 ? '20' : '30'} 🪙
              </div>
            </div>
          </div>

        </div>

        {/* Exit confirmation dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl text-white">Kilépés a játékból?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/80 text-base">
                Ha most kilépsz, az eddigi eredményeidet elveszíted és nem kapsz pontokat!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Mégsem
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setGameState('category-select');
                  setShowExitDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Kilépés
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="fixed inset-0 md:relative md:min-h-screen flex items-center justify-center p-4 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
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
