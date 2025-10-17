import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Heart, Coins, Gift, Home, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useDailyGift } from "@/hooks/useDailyGift";
import { supabase } from "@/integrations/supabase/client";
import { GameCategory, Question, COIN_REWARDS } from "@/types/game";
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

  // Fix 3 lives per game (separate from profile lives)
  const [livesInGame, setLivesInGame] = useState(3);

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

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !selectedAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
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
    
    // Auto-progress after 1 second flash
    setTimeout(() => {
      setAnswerFlash(null);
      setLivesInGame(prev => prev - 1);
      
      if (livesInGame - 1 === 0) {
        setGameState('out-of-lives');
      } else {
        handleNextQuestion();
      }
    }, 1000);
  };

  const startGameWithCategory = async (category: GameCategory) => {
    if (!profile) return;
    
    const canPlay = await spendLife();
    if (!canPlay) {
      toast.error("Nincs elég életed a játékhoz!");
      return;
    }

    setSelectedCategory(category);
    const questionBank = QUESTION_BANKS[category];
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5).slice(0, 15);
    setQuestions(shuffled);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setTimeLeft(10);
    setLivesInGame(3);
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

  const handleCorrectAnswer = (responseTime: number, answerKey: string) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(answerKey);
    setCorrectAnswers(correctAnswers + 1);
    setAnswerFlash('correct');
    
    // +50 gold per correct answer
    const reward = COIN_REWARDS.per_correct_answer;
    setCoinsEarned(coinsEarned + reward);
    
    // Auto-progress after 1 second flash
    setTimeout(() => {
      setAnswerFlash(null);
      handleNextQuestion();
    }, 1000);
  };

  const handleWrongAnswer = (responseTime: number, answerKey: string) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(answerKey);
    setAnswerFlash('wrong');
    
    // Auto-progress after 1 second flash
    setTimeout(() => {
      setAnswerFlash(null);
      setLivesInGame(prev => prev - 1);
      
      if (livesInGame - 1 === 0) {
        setGameState('out-of-lives');
      } else {
        handleNextQuestion();
      }
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      finishGame();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setFirstAttempt(null);
      setRemovedAnswer(null);
      setAudienceVotes({});
      setQuestionStartTime(Date.now());
    }
  };

  const finishGame = async () => {
    if (!profile || !selectedCategory) return;

    setGameState('finished');

    // Award coins
    if (coinsEarned > 0) {
      await updateProfile({ coins: profile.coins + coinsEarned });
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
            navigate('/');
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
          {/* Header */}
          <div className="flex-none w-full mb-6">
            <div className="flex items-center justify-between">
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

              {/* Lives and coins */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-red-500/50">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-sm text-white">{livesInGame}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-yellow-500/50">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-sm text-white">{profile.coins + coinsEarned}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question and answers - with flash effect overlay */}
          <div className={`flex-1 flex flex-col overflow-y-auto px-2 relative ${answerFlash === 'correct' ? 'animate-pulse' : answerFlash === 'wrong' ? 'animate-shake' : ''}`}>
            {answerFlash && (
              <div className={`absolute inset-0 ${answerFlash === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'} pointer-events-none z-10`} />
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

            {/* Lifelines */}
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={useHelp5050}
                disabled={usedHelp5050 || !profile.help_50_50_active || selectedAnswer !== null}
                className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 disabled:opacity-40 hover:scale-110 transition-transform flex items-center justify-center"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="Harmadoló"
              >
                <span className="text-white font-black text-lg">1/3</span>
              </button>
              <button
                onClick={useHelp2xAnswer}
                disabled={usedHelp2xAnswer || !profile.help_2x_answer_active || selectedAnswer !== null}
                className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 disabled:opacity-40 hover:scale-110 transition-transform flex items-center justify-center"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="2× válasz"
              >
                <span className="text-white font-black text-lg">2×</span>
              </button>
              <button
                onClick={useHelpAudience}
                disabled={usedHelpAudience || !profile.help_audience_active || selectedAnswer !== null}
                className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 disabled:opacity-40 hover:scale-110 transition-transform flex items-center justify-center"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="Közönség"
              >
                <Users className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={useQuestionSwap}
                disabled={usedQuestionSwap || !profile.question_swaps_available || profile.question_swaps_available === 0 || selectedAnswer !== null}
                className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 disabled:opacity-40 hover:scale-110 transition-transform flex items-center justify-center"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                title="Kérdéscsere"
              >
                <RotateCcw className="w-6 h-6 text-white" />
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
