import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Heart, Coins, Gift, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useDailyGift } from "@/hooks/useDailyGift";
import { supabase } from "@/integrations/supabase/client";
import { GameCategory, Question } from "@/types/game";
import CategorySelector from "./CategorySelector";
import { HexagonButton } from "./HexagonButton";
import { TimerCircle } from "./TimerCircle";
import { GameStateScreen } from "./GameStateScreen";

import healthQuestions from "@/data/questions-health.json";
import historyQuestions from "@/data/questions-history.json";
import cultureQuestions from "@/data/questions-culture.json";
import financeQuestions from "@/data/questions-finance.json";

type GameState = 'category-select' | 'playing' | 'paused' | 'finished' | 'timeout' | 'lose' | 'out-of-lives';

const QUESTION_BANKS = {
  health: healthQuestions,
  history: historyQuestions,
  culture: cultureQuestions,
  finance: financeQuestions
};

const GamePreview = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading: profileLoading, updateProfile, spendCoins, spendLife } = useGameProfile(userId);
  const { canClaim, claimDailyGift } = useDailyGift(userId);

  // Music control
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

  // Segítségek
  const [usedHelp5050, setUsedHelp5050] = useState(false);
  const [usedHelp2xAnswer, setUsedHelp2xAnswer] = useState(false);
  const [usedHelpAudience, setUsedHelpAudience] = useState(false);
  const [firstAttempt, setFirstAttempt] = useState<string | null>(null);
  const [removedAnswers, setRemovedAnswers] = useState<string[]>([]);
  const [audienceVotes, setAudienceVotes] = useState<Record<string, number>>({});

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
    setGameState('timeout');
  };

  const startGameWithCategory = async (category: GameCategory) => {
    if (!profile) return;
    
    // Check if can spend life
    const canPlay = await spendLife();
    if (!canPlay) return;

    // Award 1 coin for starting the game
    await updateProfile({ coins: profile.coins + 1 });

    setSelectedCategory(category);
    const questionBank = QUESTION_BANKS[category];
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5).slice(0, 15);
    setQuestions(shuffled);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setTimeLeft(10);
    setCorrectAnswers(0);
    setCoinsEarned(1); // Start with 1 coin
    setResponseTimes([]);
    setSelectedAnswer(null);
    setUsedHelp5050(false);
    setUsedHelp2xAnswer(false);
    setUsedHelpAudience(false);
    setFirstAttempt(null);
    setRemovedAnswers([]);
    setAudienceVotes({});
    setQuestionStartTime(Date.now());
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct;

    // 2x válasz logika
    if (usedHelp2xAnswer && !firstAttempt) {
      setFirstAttempt(answer);
      if (isCorrect) {
        handleCorrectAnswer(responseTime);
      }
      return;
    }

    if (usedHelp2xAnswer && firstAttempt && answer !== firstAttempt) {
      if (isCorrect || firstAttempt === currentQuestion.correct) {
        handleCorrectAnswer(responseTime);
      } else {
        handleWrongAnswer(responseTime);
      }
      return;
    }

    if (isCorrect) {
      handleCorrectAnswer(responseTime);
    } else {
      handleWrongAnswer(responseTime);
    }
  };

  const handleCorrectAnswer = (responseTime: number) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer(questions[currentQuestionIndex].correct);
    setCorrectAnswers(correctAnswers + 1);
    
    // Calculate reward
    const reward = calculateReward(currentQuestionIndex);
    setCoinsEarned(coinsEarned + reward);
    
    // Auto continue after showing green result
    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  };

  const handleWrongAnswer = (responseTime: number) => {
    setResponseTimes([...responseTimes, responseTime]);
    setSelectedAnswer('__wrong__');
    setGameState('lose');
  };

  const calculateReward = (questionIndex: number): number => {
    if (questionIndex < 4) return 1;
    if (questionIndex < 9) return 3;
    if (questionIndex < 14) return 5;
    return 55;
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      finishGame();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setFirstAttempt(null);
      setRemovedAnswers([]);
      setAudienceVotes({});
      setQuestionStartTime(Date.now());
      setGameState('playing');
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
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

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
    if (usedHelp5050 || !profile?.help_50_50_active) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const wrongAnswers = currentQuestion.answers.filter(a => a !== currentQuestion.correct);
    // Harmadoló - csak 1 hibás választ távolít el
    const toRemove = wrongAnswers.slice(0, 1);
    
    setRemovedAnswers(toRemove);
    setUsedHelp5050(true);
    updateProfile({ help_50_50_active: false });
    toast.info('Harmadoló segítség használva - 1 hibás válasz eltávolítva');
  };

  const useHelp2xAnswer = () => {
    if (usedHelp2xAnswer || !profile?.help_2x_answer_active) return;
    
    setUsedHelp2xAnswer(true);
    updateProfile({ help_2x_answer_active: false });
    toast.info('2x válasz segítség használva');
  };

  const useHelpAudience = () => {
    if (usedHelpAudience || !profile?.help_audience_active) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const votes: Record<string, number> = {};
    
    // Generate weighted random votes (correct answer gets more)
    currentQuestion.answers.forEach(answer => {
      const isCorrect = answer === currentQuestion.correct;
      votes[answer] = Math.floor(Math.random() * (isCorrect ? 60 : 30)) + (isCorrect ? 30 : 5);
    });
    
    setAudienceVotes(votes);
    setUsedHelpAudience(true);
    updateProfile({ help_audience_active: false });
    toast.info('Közönség segítség használva');
  };

  const skipQuestion = async () => {
    if (!profile) return;
    
    // Calculate skip cost based on question index
    let skipCost = 10;
    if (currentQuestionIndex >= 5 && currentQuestionIndex < 10) {
      skipCost = 20;
    } else if (currentQuestionIndex >= 10) {
      skipCost = 30;
    }
    
    if (profile.coins < skipCost) {
      toast.error(`Nincs elég aranyérmed! (${skipCost} szükséges)`);
      return;
    }
    
    const success = await spendCoins(skipCost);
    if (success) {
      toast.info(`Kérdés átugorva -${skipCost} aranyérme`);
      handleNextQuestion();
    }
  };

  const continueAfterTimeout = async () => {
    if (!profile || profile.coins < 150) {
      toast.error('Nincs elég aranyérmed! (150 szükséges)');
      return;
    }
    
    const success = await spendCoins(150);
    if (success) {
      toast.info('Továbbjutás -150 aranyérme');
      handleNextQuestion();
    }
  };

  const continueAfterWrong = async () => {
    if (!profile || profile.coins < 50) {
      toast.error('Nincs elég aranyérmed! (50 szükséges)');
      return;
    }
    
    const success = await spendCoins(50);
    if (success) {
      toast.info('Továbbjutás -50 aranyérme');
      handleNextQuestion();
    }
  };

  const reactivateHelp5050 = async () => {
    if (!profile || profile.coins < 15) {
      toast.error('Nincs elég aranyérmed! (15 szükséges)');
      return;
    }
    
    const success = await spendCoins(15);
    if (success) {
      await updateProfile({ help_50_50_active: true });
      toast.success('Harmadoló újraaktiválva!');
    }
  };

  const reactivateHelp2xAnswer = async () => {
    if (!profile || profile.coins < 20) {
      toast.error('Nincs elég aranyérmed! (20 szükséges)');
      return;
    }
    
    const success = await spendCoins(20);
    if (success) {
      await updateProfile({ help_2x_answer_active: true });
      toast.success('2× válasz újraaktiválva!');
    }
  };

  const reactivateHelpAudience = async () => {
    if (!profile || profile.coins < 30) {
      toast.error('Nincs elég aranyérmed! (30 szükséges)');
      return;
    }
    
    const success = await spendCoins(30);
    if (success) {
      await updateProfile({ help_audience_active: true });
      toast.success('Közönség segítség újraaktiválva!');
    }
  };

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Betöltés...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Hiba a profil betöltésekor</div>;
  }

  if (gameState === 'category-select') {
    return (
      <div className="fixed inset-0 md:relative md:min-h-auto overflow-y-auto">
        <CategorySelector onSelect={startGameWithCategory} />
        
        {/* Stats overlay */}
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
          onClick={() => navigate('/')}
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

  // Game state overlays
  if (gameState === 'timeout') {
    return (
      <GameStateScreen 
        type="timeout"
        onContinue={continueAfterTimeout}
        onSkip={() => {
          setGameState('finished');
          finishGame();
        }}
      />
    );
  }

  if (gameState === 'lose') {
    return (
      <GameStateScreen 
        type="lose"
        onContinue={continueAfterWrong}
        onSkip={() => {
          setGameState('finished');
          finishGame();
        }}
      />
    );
  }

  if (gameState === 'out-of-lives') {
    return (
      <GameStateScreen 
        type="out-of-lives"
        onContinue={handleNextQuestion}
        onSkip={() => navigate('/')}
      />
    );
  }

  if (gameState === 'playing') {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Calculate skip cost
    let skipCost = 10;
    if (currentQuestionIndex >= 5 && currentQuestionIndex < 10) {
      skipCost = 20;
    } else if (currentQuestionIndex >= 10) {
      skipCost = 30;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] overflow-auto">
        <div className="w-full md:max-w-4xl md:mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex-none w-full">
            <div className="flex items-center justify-between p-4 md:mb-6">
              <Button onClick={() => {
                stopMusic();
                setGameState('category-select');
              }} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kilépés
              </Button>
              
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-white/20">
                  <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                  <span className="font-bold text-sm md:text-base">{profile.lives}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-white/20">
                  <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  <span className="font-bold text-sm md:text-base">{profile.coins + coinsEarned}</span>
                </div>
              </div>
            </div>

            {/* Timer Circle - Centered */}
            <div className="flex justify-center mb-6">
              <TimerCircle timeLeft={timeLeft} />
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 w-full px-2 pb-20 md:px-0">
            <div className="w-full md:max-w-4xl md:mx-auto space-y-3 md:space-y-4 pb-8">
              {/* Question - wider box */}
              <div className="clip-hexagon-box">
                <h2 className="text-base md:text-lg font-bold text-white text-center leading-tight">{currentQuestion.question}</h2>
              </div>

              {/* Skip button - visible from 5 seconds */}
              {timeLeft <= 5 && !selectedAnswer && (
                <div className="flex justify-center">
                  <Button
                    onClick={skipQuestion}
                    variant="outline"
                    size="sm"
                    className="bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-600"
                  >
                    Kérdés átugrása ({skipCost} 🪙)
                  </Button>
                </div>
              )}

              {/* Answers */}
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {currentQuestion.answers.map((answer, index) => {
                  const isRemoved = removedAnswers.includes(answer);
                  const isSelected = selectedAnswer === answer;
                  const isCorrect = answer === currentQuestion.correct;
                  const showResult = selectedAnswer !== null;
                  const isFirstAttempt = firstAttempt === answer;
                  const prefix = ['A:', 'B:', 'C:', 'D:'][index];

                  if (isRemoved) return null;

                  return (
                    <button
                      key={answer}
                      onClick={() => handleAnswer(answer)}
                      disabled={selectedAnswer !== null && !usedHelp2xAnswer}
                      className={`
                        clip-hexagon-answer transition-all touch-manipulation
                        ${isFirstAttempt ? 'border-orange-500 bg-orange-500/10' : 'border-blue-500/60'}
                        ${showResult && isCorrect ? 'border-green-500 bg-green-600' : ''}
                        ${showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-600' : ''}
                        ${showResult && !isCorrect && !isSelected ? 'bg-black border-blue-500/60' : ''}
                        ${!showResult ? 'bg-black hover:border-blue-400 hover:bg-blue-500/10 active:scale-98' : ''}
                        disabled:opacity-50
                      `}
                    >
                      <div className="flex items-center justify-center gap-3 w-full">
                        <span className="font-bold text-white text-base md:text-lg">{prefix}</span>
                        <span className="font-medium text-white text-base md:text-lg">{answer}</span>
                      </div>
                      {audienceVotes[answer] && (
                        <div className="mt-2 text-xs md:text-sm text-white/70">
                          <Users className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                          {audienceVotes[answer]}%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Helps - Hexagon buttons - closer to answers */}
              <div className="flex justify-center gap-3 md:gap-4 mt-4 pb-safe md:pb-0 flex-wrap">
                <button
                  onClick={useHelp5050}
                  disabled={usedHelp5050 || !profile.help_50_50_active || selectedAnswer !== null}
                  className="hexagon-button"
                  title="Harmadoló - 1 hibás válasz eltávolítása"
                >
                  <div className="hexagon-content">
                    <span className="text-lg font-bold">1/3</span>
                  </div>
                </button>
                <button
                  onClick={useHelp2xAnswer}
                  disabled={usedHelp2xAnswer || !profile.help_2x_answer_active || selectedAnswer !== null}
                  className="hexagon-button"
                  title="2× válasz - Két választ jelölhetsz meg"
                >
                  <div className="hexagon-content">
                    <Phone className="w-5 h-5" />
                  </div>
                </button>
                <button
                  onClick={useHelpAudience}
                  disabled={usedHelpAudience || !profile.help_audience_active || selectedAnswer !== null}
                  className="hexagon-button"
                  title="Közönség segítsége - Százalékos szavazatok"
                >
                  <div className="hexagon-content">
                    <Users className="w-5 h-5" />
                  </div>
                </button>
              </div>

              {/* Help shop - reactivate used helps */}
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {!profile.help_50_50_active && (
                  <Button onClick={reactivateHelp5050} size="sm" variant="outline" className="text-xs">
                    Harmadoló (15 🪙)
                  </Button>
                )}
                {!profile.help_2x_answer_active && (
                  <Button onClick={reactivateHelp2xAnswer} size="sm" variant="outline" className="text-xs">
                    2× válasz (20 🪙)
                  </Button>
                )}
                {!profile.help_audience_active && (
                  <Button onClick={reactivateHelpAudience} size="sm" variant="outline" className="text-xs">
                    Közönség (30 🪙)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="fixed inset-0 md:relative md:min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
        <div className="max-w-md w-full bg-black/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border-2 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">🏆</div>
          <h1 className="text-3xl md:text-4xl font-black text-green-500 mb-6">Gratulálunk, nyertél!</h1>
          
          <div className="space-y-3 mb-6">
            <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
              <p className="text-sm text-white/70">Helyes válaszok</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{correctAnswers}/15</p>
            </div>
            <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-500/30">
              <p className="text-sm text-white/70">Szerzett aranyérme</p>
              <p className="text-2xl md:text-3xl font-bold text-white">+{coinsEarned} 🪙</p>
            </div>
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
            Ha még játszanál, görgess le!
          </HexagonButton>
          
          <button 
            onClick={() => {
              stopMusic();
              navigate('/');
            }}
            className="text-white text-sm hover:underline"
          >
            Pihenésre, vissza a főoldalra!
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GamePreview;
