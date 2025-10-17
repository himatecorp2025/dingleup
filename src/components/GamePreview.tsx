import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Heart, Coins, Gift, Home, RotateCcw, ChevronDown, Zap, SkipForward } from "lucide-react";
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

const GamePreview = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading: profileLoading, updateProfile, spendLife } = useGameProfile(userId);
  const { canClaim, claimDailyGift } = useDailyGift(userId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const stopMusic = () => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

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

  // 3 mistakes allowed per game (separate from profile lives)
  const [mistakesInGame, setMistakesInGame] = useState(0);

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

  const startGameWithCategory = async (category: GameCategory) => {
    if (!profile) return;
    
    // Spend one life at game start ONLY
    const canPlay = await spendLife();
    if (!canPlay) {
      toast.error("Nincs elég életed a játékhoz!");
      setGameState('category-select');
      return;
    }

    // Reactivate all lifelines for new game
    await updateProfile({
      help_50_50_active: true,
      help_2x_answer_active: true,
      help_audience_active: true
    });

    setSelectedCategory(category);
    const questionBank = QUESTION_BANKS[category];
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5).slice(0, 15);
    setQuestions(shuffled);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setTimeLeft(10);
    setMistakesInGame(0);
    setCorrectAnswers(0);
    setCoinsEarned(0);
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
    
    // Progressive gold reward
    const reward = getCoinsForQuestion(currentQuestionIndex);
    setCoinsEarned(coinsEarned + reward);
    
    // Update coins immediately in profile
    if (profile) {
      await updateProfile({ coins: profile.coins + reward });
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
    
    // Deduct coins
    await updateProfile({ coins: profile.coins - cost });
    handleNextQuestion();
  };

  const handleContinueAfterMistake = async () => {
    if (!profile) return;
    
    const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
    
    if (profile.coins < cost) {
      toast.error(`Nincs elég aranyérme! ${cost} 🪙 szükséges.`);
      // Force next question without payment
      setMistakesInGame(prev => prev + 1);
      if (mistakesInGame + 1 >= 3) {
        setGameState('out-of-lives');
      } else {
        handleNextQuestion();
      }
      return;
    }
    
    // Pay and continue
    await updateProfile({ coins: profile.coins - cost });
    handleNextQuestion();
  };

  const handleRejectContinue = () => {
    setMistakesInGame(prev => prev + 1);
    
    if (mistakesInGame + 1 >= 3) {
      setGameState('out-of-lives');
    } else {
      handleNextQuestion();
    }
  };

  const finishGame = async () => {
    if (!profile || !selectedCategory) return;

    setGameState('finished');

    // Award coins and update profile immediately
    if (coinsEarned > 0) {
      const { error } = await supabase
        .from('profiles')
        .update({ coins: profile.coins + coinsEarned })
        .eq('id', userId!);
      
      if (!error) {
        // Force refetch profile to sync data
        await updateProfile({ coins: profile.coins + coinsEarned });
      }
    }

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

    toast.success(`Játék vége! ${correctAnswers}/${questions.length} helyes válasz`);
  };

  const useHelp5050 = () => {
    if (usedHelp5050 || !profile?.help_50_50_active || selectedAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const thirdAnswerKey = currentQuestion.third; // Use JSON field
    
    setRemovedAnswer(thirdAnswerKey);
    setUsedHelp5050(true);
    updateProfile({ help_50_50_active: false });
    toast.info('Harmadoló segítség használva - 1 hibás válasz eltávolítva');
  };

  const useHelp2xAnswer = () => {
    if (usedHelp2xAnswer || !profile?.help_2x_answer_active || selectedAnswer) return;
    
    setUsedHelp2xAnswer(true);
    updateProfile({ help_2x_answer_active: false });
    toast.info('2× válasz segítség használva - 2 próbálkozásod van');
  };

  const useHelpAudience = () => {
    if (usedHelpAudience || !profile?.help_audience_active || selectedAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const votes = currentQuestion.audience; // Use JSON field directly
    
    setAudienceVotes(votes);
    setUsedHelpAudience(true);
    updateProfile({ help_audience_active: false });
    toast.info('Közönség segítség használva');
  };

  const useQuestionSwap = () => {
    if (usedQuestionSwap || selectedAnswer || !profile?.question_swaps_available || profile.question_swaps_available === 0) return;
    
    // Get a new random question from the same category that's not in current 15
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
    
    // Reset timer and states
    setTimeLeft(10);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setFirstAttempt(null);
    setQuestionStartTime(Date.now());
    
    setUsedQuestionSwap(true);
    updateProfile({ question_swaps_available: profile.question_swaps_available - 1 });
    toast.info('Kérdés kicserélve! Timer visszaállítva.');
  };

  // Scroll handler for TikTok-style navigation
  useEffect(() => {
    let touchStartY = 0;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      
      if (showSkipPanel && delta > 50) {
        handleSkipQuestion();
      } else if (showContinuePanel && delta > 50) {
        handleContinueAfterMistake();
      } else if (showContinuePanel && delta < -50) {
        handleRejectContinue();
      } else if (showScrollHint && delta > 50) {
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
      
      if (showSkipPanel && delta > 0) {
        handleSkipQuestion();
        touchStartY = 0;
      } else if (showContinuePanel && delta > 0) {
        handleContinueAfterMistake();
        touchStartY = 0;
      } else if (showContinuePanel && delta < 0) {
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
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0532] via-[#160a4a] to-[#0c0532]">Betöltés...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0532] via-[#160a4a] to-[#0c0532]">Hiba a profil betöltésekor</div>;
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

        <Button
          onClick={() => {
            stopMusic();
            navigate('/dashboard');
          }}
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 text-xs md:text-sm"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Vissza
        </Button>
      </div>
    );
  }

  if (gameState === 'out-of-lives') {
    return (
      <GameStateScreen 
        type="out-of-lives"
        onContinue={() => {
          stopMusic();
          finishGame();
        }}
        onSkip={() => {
          stopMusic();
          navigate('/');
        }}
      />
    );
  }

  if (gameState === 'playing') {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-[#0c0532] via-[#160a4a] to-[#0c0532] overflow-hidden fixed inset-0">
      <div className="h-full w-full flex flex-col p-4">
        {/* Exit button */}
        <Button
          onClick={() => setShowExitDialog(true)}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-50 text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Kilépés
        </Button>

        {/* Header */}
        <div className="flex-none w-full mb-4">
          <div className="flex items-center justify-between mb-3">
            {/* Level hexagon */}
            <div
                className="bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-blue-400 w-16 h-16 flex items-center justify-center"
                style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
              >
                <div className="text-center">
                  <div className="text-xs font-bold text-white">Szint</div>
                  <div className="text-lg font-black text-yellow-400">{currentQuestionIndex + 1}</div>
                </div>
              </div>

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
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-orange-500/50">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-sm text-white">{3 - mistakesInGame}</span>
                </div>
              </div>
            </div>

            {/* Notification panel - below timer, compact horizontal bar */}
            {(showContinuePanel || showScrollHint) && (
              <div className="w-full h-16 flex items-center justify-center animate-fade-in">
                {/* Continue panel */}
                {showContinuePanel && (
                  <div className="w-full bg-gradient-to-r from-red-600/95 to-red-700/95 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-red-400 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-sm">
                          {continueType === 'timeout' ? '⏰ Lejárt!' : '❌ Rossz!'}
                        </span>
                        <span className="text-yellow-400 font-black text-xl">
                          {continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST} 🪙
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-green-300">
                          <ChevronDown className="w-4 h-4 animate-bounce" />
                          <span className="text-white">Le=Fizet</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-300">
                          <div className="rotate-180"><ChevronDown className="w-4 h-4" /></div>
                          <span className="text-white/70">Fel=Hiba</span>
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
                          <span className="text-green-200 text-xs ml-2">+{getCoinsForQuestion(currentQuestionIndex)} 🪙</span>
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

          {/* Question and answers - with flash effect overlay */}
          <div className={`flex-1 flex flex-col overflow-y-auto px-2 relative transition-all duration-300 ${answerFlash === 'correct' ? 'scale-105' : answerFlash === 'wrong' ? 'animate-shake' : ''}`}>
            {answerFlash && (
              <div className={`absolute inset-0 ${answerFlash === 'correct' ? 'bg-green-500/30 animate-pulse' : 'bg-red-500/30 animate-pulse'} pointer-events-none z-10 rounded-2xl`} />
            )}
            
            <MillionaireQuestion>{currentQuestion.question}</MillionaireQuestion>

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


            {/* Lifelines with enhanced styling */}
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={useHelp5050}
                disabled={usedHelp5050 || !profile.help_50_50_active || selectedAnswer !== null}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  ${!usedHelp5050 && profile.help_50_50_active && !selectedAnswer ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
                `}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="Harmadoló"
              >
                <span className="text-white font-black text-lg">1/3</span>
              </button>
              <button
                onClick={useHelp2xAnswer}
                disabled={usedHelp2xAnswer || !profile.help_2x_answer_active || selectedAnswer !== null}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  ${!usedHelp2xAnswer && profile.help_2x_answer_active && !selectedAnswer ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
                `}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="2× válasz"
              >
                <span className="text-white font-black text-lg">2×</span>
              </button>
              <button
                onClick={useHelpAudience}
                disabled={usedHelpAudience || !profile.help_audience_active || selectedAnswer !== null}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  ${!usedHelpAudience && profile.help_audience_active && !selectedAnswer ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
                `}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="Közönség"
              >
                <Users className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleSkipQuestion}
                disabled={selectedAnswer !== null || !profile || profile.coins < (currentQuestionIndex < 5 ? 10 : currentQuestionIndex < 10 ? 20 : 30)}
                className={`
                  relative w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 border-2 border-yellow-400 
                  disabled:opacity-40 hover:scale-110 transition-all flex items-center justify-center
                  shadow-lg shadow-yellow-500/40
                `}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="Kérdés átugrás"
              >
                <SkipForward className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                  {currentQuestionIndex < 5 ? '10' : currentQuestionIndex < 10 ? '20' : '30'}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom menu (simple, no overlays) */}
          <div className="flex-none flex justify-center gap-4 pb-2">
            <Button
              onClick={() => {
                stopMusic();
                navigate('/');
              }}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
            >
              <Home className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                stopMusic();
                setGameState('category-select');
              }}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
                  stopMusic();
                  navigate('/dashboard');
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Kilépés
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="fixed inset-0 md:relative md:min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0c0532] via-[#160a4a] to-[#0c0532]">
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
              stopMusic();
              setGameState('category-select');
            }}
            className="w-full max-w-sm mx-auto mb-3"
          >
            Új játék
          </HexagonButton>
          
          <button 
            onClick={() => {
              stopMusic();
              navigate('/');
            }}
            className="text-white text-sm hover:underline"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GamePreview;
