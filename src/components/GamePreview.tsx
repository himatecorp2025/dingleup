import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import questionData from "@/data/questions.json";

interface Question {
  id: string;
  question: string;
  answers: string[];
  correct: string;
  topic: string;
}

interface ShuffledQuestion extends Question {
  shuffledAnswers: string[];
  correctIndex: number;
}

type GameState = 'idle' | 'playing' | 'won' | 'lost' | 'timeout' | 'out-of-lives';

// Véletlenszerű 15 kérdés kiválasztása HELYES válasszal
// Biztosítja, hogy ne legyen három egymást követő kérdésnél ugyanazon pozícióban a helyes válasz
const getRandomQuestions = (): ShuffledQuestion[] => {
  const shuffled = [...questionData].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 15);
  
  const questions = selected.map(q => {
    const shuffledAnswers = [...q.answers].sort(() => Math.random() - 0.5);
    const correctIndex = shuffledAnswers.indexOf(q.correct);
    
    return {
      ...q,
      shuffledAnswers,
      correctIndex
    };
  });

  // Ellenőrizés: ne legyen három egymást követő helyes válasz ugyanazon pozícióban
  for (let i = 2; i < questions.length; i++) {
    if (
      questions[i].correctIndex === questions[i - 1].correctIndex &&
      questions[i].correctIndex === questions[i - 2].correctIndex
    ) {
      // Ha három egyforma, keverjük újra az i-edik kérdés válaszait
      const availablePositions = [0, 1, 2].filter(pos => pos !== questions[i].correctIndex);
      const newCorrectIndex = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      
      // Csere: mozgatjuk a helyes választ az új pozícióra
      const temp = questions[i].shuffledAnswers[newCorrectIndex];
      questions[i].shuffledAnswers[newCorrectIndex] = questions[i].shuffledAnswers[questions[i].correctIndex];
      questions[i].shuffledAnswers[questions[i].correctIndex] = temp;
      questions[i].correctIndex = newCorrectIndex;
    }
  }

  questions.forEach(q => {
    console.log('answer', { id: q.id, correct: q.correct, correctIndex: q.correctIndex });
  });
  
  return questions;
};

const GamePreview = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [lives, setLives] = useState(5);
  const [coins, setCoins] = useState(200);
  const [usedHelpers, setUsedHelpers] = useState({
    halve: false,
    doubleAnswer: false,
    audience: false
  });
  const [removedOption, setRemovedOption] = useState<number | null>(null);
  const [hasDoubleAnswer, setHasDoubleAnswer] = useState(false);
  const [firstAttemptIndex, setFirstAttemptIndex] = useState<number | null>(null);
  const [secondAttemptIndex, setSecondAttemptIndex] = useState<number | null>(null);
  const [showWrongAnswerPopup, setShowWrongAnswerPopup] = useState(false);
  const [showTimeoutPopup, setShowTimeoutPopup] = useState(false);
  const [showAudiencePanel, setShowAudiencePanel] = useState(false);
  const [audienceResults, setAudienceResults] = useState<number[]>([]);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // URL param handling
  const [searchParams] = useSearchParams();

  // Background music via Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      // @ts-ignore - webkit prefix for older iOS
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current!;
  };

  const startBackgroundMusic = () => {
    try {
      const ctx = ensureAudioContext();
      if (oscRef.current) return; // already playing
      const gain = ctx.createGain();
      gain.gain.value = 0.2; // 20%
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 110; // base tension tone
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gainRef.current = gain;
      oscRef.current = osc;
    } catch (e) {
      console.warn("Audio init failed", e);
    }
  };

  const stopBackgroundMusic = () => {
    try { oscRef.current?.stop(); } catch {}
    oscRef.current = null;
    gainRef.current = null;
  };

  // Start/stop music with game state
  useEffect(() => {
    if (gameState === 'playing') {
      try { audioCtxRef.current?.resume(); } catch {}
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [gameState]);

  // Increase intensity as you progress / when time is low
  useEffect(() => {
    if (gameState !== 'playing' || !gainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const base = 0.2;
    const progress = questions.length > 1 ? currentQuestion / (questions.length - 1) : 0;
    const urgency = timeLeft < 5 ? (5 - timeLeft) / 5 : 0;
    const target = Math.min(0.6, base + progress * 0.25 + urgency * 0.15);
    try {
      const now = ctx.currentTime;
      gainRef.current.gain.cancelScheduledValues(now);
      gainRef.current.gain.linearRampToValueAtTime(target, now + 0.3);
    } catch {}
  }, [currentQuestion, timeLeft, gameState, questions.length]);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && selectedAnswer === null && questions[currentQuestion]) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && gameState === 'playing' && questions[currentQuestion]) {
      handleTimeOut();
    }
  }, [timeLeft, gameState, selectedAnswer, currentQuestion, questions]);

  const handleTimeOut = () => {
    if (!questions[currentQuestion]) return;
    console.log('timeout', { id: questions[currentQuestion].id });
    setShowTimeoutPopup(true);
  };

  const startGame = (restartWithOneLive = false, deductLife = false) => {
    const newQuestions = getRandomQuestions();
    setQuestions(newQuestions);
    setGameState('playing');
    setCurrentQuestion(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
    
    // Élet kezelés
    if (restartWithOneLive) {
      setLives(1);
    } else if (deductLife && lives > 0) {
      const newLives = lives - 1;
      setLives(newLives);
      toast.info(`Élet levonva: ${newLives} élet maradt`, { description: "❤️" });
    } else {
      setLives(3);
    }
    
    setCoins(200);
    setUsedHelpers({ halve: false, doubleAnswer: false, audience: false });
    setRemovedOption(null);
    setHasDoubleAnswer(false);
    setFirstAttemptIndex(null);
    setSecondAttemptIndex(null);
    setShowWrongAnswerPopup(false);
    setShowTimeoutPopup(false);
    setShowAudiencePanel(false);
    setAudienceResults([]);
    console.log('round_start', { questions: 15, lives: restartWithOneLive ? 1 : (deductLife ? lives - 1 : 3) });
  };

useEffect(() => {
  const autostart = searchParams.get('autostart');
  if (autostart === 'true' && gameState === 'idle') {
    startGame(false);
  }
}, [searchParams, gameState]);

const handleAnswer = (answerIndex: number) => {
    // Ha már van végleges válasz és nincs dupla válasz, ne tegyen semmit
    if (selectedAnswer !== null) return;
    
    // Dupla válasz logika
    if (hasDoubleAnswer) {
      if (firstAttemptIndex === null) {
        // Első válasz dupla válasz esetén
        setFirstAttemptIndex(answerIndex);
        const isCorrect = answerIndex === questions[currentQuestion].correctIndex;
        console.log('answer', { 
          id: questions[currentQuestion].id, 
          selectedIndex: answerIndex,
          correctIndex: questions[currentQuestion].correctIndex,
          correct: isCorrect,
          attempt: 1
        });
        return;
      } else if (secondAttemptIndex === null && firstAttemptIndex !== answerIndex) {
        // Második válasz dupla válasz esetén
        setSecondAttemptIndex(answerIndex);
        const isCorrect = answerIndex === questions[currentQuestion].correctIndex;
        const firstWasCorrect = firstAttemptIndex === questions[currentQuestion].correctIndex;
        
        console.log('answer', { 
          id: questions[currentQuestion].id, 
          selectedIndex: answerIndex,
          correctIndex: questions[currentQuestion].correctIndex,
          correct: isCorrect,
          attempt: 2
        });

        if (isCorrect || firstWasCorrect) {
          setSelectedAnswer(questions[currentQuestion].correctIndex);
          const newCoins = coins + 5;
          setCoins(newCoins);
          toast.success("Helyes válasz! +5 🪙", { description: "Nagyszerű munka!" });

          // Swipe indikátor megjelenítése
          if (currentQuestion < questions.length - 1) {
            setShowSwipeIndicator(true);
          } else {
            setTimeout(() => {
              setGameState('won');
              console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
            }, 1000);
          }
        } else {
          setSelectedAnswer(questions[currentQuestion].correctIndex);
          setShowWrongAnswerPopup(true);
        }
        return;
      } else {
        return; // Ugyanazt a gombot nyomta meg kétszer
      }
    }

    // Normál válasz logika (nincs dupla válasz)
    const isCorrect = answerIndex === questions[currentQuestion].correctIndex;
    
    console.log('answer', { 
      id: questions[currentQuestion].id, 
      selectedIndex: answerIndex,
      correctIndex: questions[currentQuestion].correctIndex,
      correct: isCorrect 
    });

    setSelectedAnswer(answerIndex);

    if (isCorrect) {
      // +5 aranyérme jutalom
      const newCoins = coins + 5;
      setCoins(newCoins);
      toast.success("Helyes válasz! +5 🪙", { description: "Nagyszerű munka!" });

      // Swipe indikátor megjelenítése
      if (currentQuestion < questions.length - 1) {
        setShowSwipeIndicator(true);
      } else {
        setTimeout(() => {
          setGameState('won');
          console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
        }, 1000);
      }
    } else {
      // Rossz válasz - popup megjelenítése
      setShowWrongAnswerPopup(true);
    }
  };

  const handleWrongAnswer = () => {
    setGameState('idle');
    console.log('round_end', { result: 'wrong_answer', correctCount: currentQuestion });
  };

  const continueAfterWrongAnswer = () => {
    if (coins >= 50) {
      const newCoins = coins - 50;
      setCoins(newCoins);
      toast.info("Folytatás aranyérméért", { description: `–50 🪙 (${newCoins} maradt)` });
      console.log('continue_with_coins', { cost: 50, remaining: newCoins });
      setShowWrongAnswerPopup(false);
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          nextQuestion();
        } else {
          setGameState('won');
          console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
        }
      }, 500);
    }
  };

  const exitAfterWrongAnswer = () => {
    setShowWrongAnswerPopup(false);
    toast.info(`Összegyűjtött aranyérméd: ${coins} 🪙`);
    setTimeout(() => {
      setGameState('idle');
    }, 500);
  };

  const nextQuestion = () => {
    // Ellenőrizzük, hogy van-e még kérdés
    if (currentQuestion >= questions.length - 1) {
      // Ez volt az utolsó kérdés - játék vége
      setGameState('won');
      console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
      return;
    }

    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setRemovedOption(null);
      setHasDoubleAnswer(false);
      setFirstAttemptIndex(null);
      setSecondAttemptIndex(null);
      setShowAudiencePanel(false);
      setAudienceResults([]);
      setShowSwipeIndicator(false);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showSwipeIndicator) return;
    e.stopPropagation();
    setTouchStart(e.targetTouches[0].clientY);
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!showSwipeIndicator) return;
    e.preventDefault();
    e.stopPropagation();
    
    const currentTouch = e.targetTouches[0].clientY;
    setTouchEnd(currentTouch);
    
    const diff = touchStart - currentTouch;
    const maxSwipe = 500; // Teljes átmenet távolság
    
    // Csak felfelé engedjük a mozgást (pozitív diff)
    if (diff > 0) {
      const offset = Math.min(diff, maxSwipe);
      setSwipeOffset(offset);
      
      // Ha teljesen felhúzta, akkor válts következő kérdésre
      if (offset >= maxSwipe) {
        setIsTransitioning(true);
        setSwipeOffset(0);
        nextQuestion();
      }
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!showSwipeIndicator) return;
    e.stopPropagation();
    
    // Ha nem húzta teljesen végig, visszaugrik
    if (swipeOffset < 500) {
      setSwipeOffset(0);
    }
  };

  const useHalve = () => {
    if (usedHelpers.halve || selectedAnswer !== null || coins < 15) return;
    
    const newCoins = coins - 15;
    setCoins(newCoins);
    setUsedHelpers(prev => ({ ...prev, halve: true }));

    const correct = questions[currentQuestion].correctIndex;
    const wrongOptions = [0, 1, 2].filter(i => i !== correct);
    const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setRemovedOption(toRemove);

    console.log('lifeline_used', { type: '50:50', cost: 15 });
    toast.info("Harmadoló használva", { description: `–15 🪙 (${newCoins} maradt)` });
  };

  const useDoubleAnswer = () => {
    if (usedHelpers.doubleAnswer || selectedAnswer !== null || coins < 20) return;
    
    const newCoins = coins - 20;
    setCoins(newCoins);
    setUsedHelpers(prev => ({ ...prev, doubleAnswer: true }));
    setHasDoubleAnswer(true);

    console.log('lifeline_used', { type: '2x_answer', cost: 20 });
    toast.info("2× Válasz használva", { description: `–20 🪙 (${newCoins} maradt). Két próbálkozásod van!` });
  };

  const useAudience = () => {
    if (usedHelpers.audience || selectedAnswer !== null || coins < 30) return;
    
    const newCoins = coins - 30;
    setCoins(newCoins);
    setUsedHelpers(prev => ({ ...prev, audience: true }));

    const correct = questions[currentQuestion].correctIndex;
    const results = [0, 0, 0];
    
    // Generate realistic percentages
    const correctPercentage = 60 + Math.floor(Math.random() * 30); // 60-90%
    results[correct] = correctPercentage;
    
    // Distribute remaining percentage among wrong answers
    const remaining = 100 - correctPercentage;
    const wrongIndices = [0, 1, 2].filter(i => i !== correct);
    const firstWrong = Math.floor(Math.random() * (remaining - 5));
    results[wrongIndices[0]] = firstWrong;
    results[wrongIndices[1]] = remaining - firstWrong;
    
    setAudienceResults(results);
    setShowAudiencePanel(true);
    
    toast.info("Közönség használva", { 
      description: `–30 🪙 (${newCoins} maradt)` 
    });

    console.log('lifeline_used', { type: 'audience', cost: 30 });
  };

  const getTimerColor = () => {
    if (timeLeft > 6) return "text-success";
    if (timeLeft > 3) return "text-accent";
    return "text-destructive";
  };

  const getButtonClasses = (index: number) => {
    if (selectedAnswer === null && firstAttemptIndex === null && secondAttemptIndex === null) return "";
    
    const isCorrect = index === questions[currentQuestion].correctIndex;
    const isFirstAttempt = index === firstAttemptIndex;
    const isSecondAttempt = index === secondAttemptIndex;
    const isSelected = index === selectedAnswer;
    
    // Ha van végleges válasz, mutassuk a helyes választ zölden és a rosszat pirosan
    if (selectedAnswer !== null) {
      if (isCorrect) return "!bg-[#00FF66] !border-[#00FF66] !text-black animate-pulse-green";
      if (isSelected && !isCorrect) return "!bg-[#FF3040] !border-[#FF3040] !text-white animate-shake animate-pulse-red";
      return "";
    }
    
    // Dupla válasz esetén az első hibás próbálkozás
    if (isFirstAttempt && !isCorrect) return "!bg-[#FF3040] !border-[#FF3040] !text-white animate-shake";
    
    return "";
  };

  // IDLE Screen
  if (gameState === 'idle') {
    return (
      <section id="game" className="py-20 px-4 bg-gradient-to-b from-background via-muted to-background">
        <div className="container max-w-md mx-auto">
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground">DingleUP! Kvíz</h2>
            <p className="text-muted-foreground text-lg">
              15 kérdés, 3 válaszlehetőség, 10 másodperc időkorlát.
              <br />3 életed van. Jó szerencsét!
            </p>
            <Button 
              onClick={() => startGame(false)}
              size="lg"
              className="bg-gradient-gold text-black font-bold text-xl px-12 py-6 rounded-xl shadow-glow hover:scale-105 transition-transform"
            >
              Játék indítása
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // OVERLAY Screens - Removed, using popup instead

  if (gameState === 'out-of-lives') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in max-w-md">
          <div className="text-8xl">💔</div>
          <h2 className="text-5xl font-bold text-destructive">Sadly, you're out of lives!</h2>
          <p className="text-accent text-xl font-semibold bg-gradient-gold px-8 py-4 rounded-xl clip-hexagon">
            Get your +5 extra lives now!<br/>
            <span className="text-sm">0.99$</span>
          </p>
          <p className="text-foreground">Restarting with one life!</p>
          <Button 
            onClick={() => startGame(true)}
            className="bg-gradient-gold text-black font-bold px-8 py-4 text-lg min-h-[44px]"
          >
            Újraindítás (1 élettel)
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === 'lost') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in max-w-md">
          <div className="text-8xl">❓</div>
          <h2 className="text-5xl font-bold text-destructive">You lose!</h2>
          <p className="text-accent text-xl font-semibold bg-gradient-gold px-8 py-4 rounded-xl clip-hexagon">
            Keep going, you get 2 bonus lives!
          </p>
          <p className="text-foreground">Restarting with one life!</p>
          <Button 
            onClick={() => startGame(true)}
            className="bg-gradient-gold text-black font-bold px-8 py-4 text-lg min-h-[44px]"
          >
            Újraindítás (1 élettel)
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in max-w-md px-4">
          <div className="text-8xl animate-float">🏆</div>
          <h2 className="text-4xl md:text-5xl font-bold text-success">Gratulálunk!</h2>
          <p className="text-foreground text-lg md:text-xl font-semibold mb-4">
            Sikeresen teljesítetted a kvízt!
          </p>
          
          {/* Eredmény jelző */}
          <div className="bg-gradient-to-br from-card to-muted border-2 border-success/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Helyes válaszok:</span>
              <span className="text-success font-bold text-2xl">15/15</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-success to-accent w-full animate-fade-in"></div>
            </div>
            <div className="flex items-center justify-between text-lg pt-2 border-t border-border">
              <span className="text-muted-foreground">Megmaradt életek:</span>
              <span className="text-destructive font-bold text-2xl">{lives} ❤️</span>
            </div>
          </div>

          <p className="text-accent text-2xl md:text-3xl font-bold bg-[#0B1130] border-2 border-[#3A4260] px-6 md:px-8 py-4 md:py-6 rounded-xl">
            Összegyűjtött aranyérmék:<br />
            {coins} 🪙
          </p>
          <div className="flex flex-col gap-4 mt-6">
            <Button 
              onClick={() => startGame(false, true)}
              className="bg-gradient-to-r from-[#1C72FF] to-[#00FFCC] text-white font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg min-h-[44px] w-full"
            >
              Új játék indítása (-1 ❤️)
            </Button>
            <Button 
              onClick={() => setGameState('idle')}
              variant="outline"
              className="font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg min-h-[44px] w-full"
            >
              Vissza a főoldalra
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING Screen
  const currentQ = questions[currentQuestion];
  
  // Védőellenőrzés - ha nincs érvényes kérdés, ne rendereljünk semmit
  if (!currentQ) {
    return null;
  }

  return (
    <>
      {/* Wrong Answer Popup */}
      {showWrongAnswerPopup && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
          <div className="text-center space-y-6 animate-fade-in max-w-md px-4">
            <div className="text-8xl">❌</div>
            <h2 className="text-4xl md:text-5xl font-bold text-destructive">Rossz válasz!</h2>
            <p className="text-foreground text-lg md:text-xl font-semibold bg-[#0B1130] border-2 border-[#3A4260] px-6 md:px-8 py-4 rounded-xl">
              Folytathatod 50 🪙 aranyérme felhasználásával.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={continueAfterWrongAnswer}
                disabled={coins < 50}
                className="bg-gradient-to-r from-[#1C72FF] to-[#00FFCC] text-white font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg disabled:opacity-30 w-full sm:w-auto min-h-[44px]"
              >
                Folytatom (50 🪙)
              </Button>
              <Button 
                onClick={exitAfterWrongAnswer}
                variant="outline"
                className="font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto min-h-[44px]"
              >
                Kilépek
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeout Popup */}
      {showTimeoutPopup && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
          <div className="text-center space-y-6 animate-fade-in max-w-md px-4">
            <div className="text-8xl">⏰</div>
            <h2 className="text-4xl md:text-5xl font-bold text-destructive">Lejárt az idő!</h2>
            <p className="text-foreground text-lg md:text-xl font-semibold bg-[#0B1130] border-2 border-[#3A4260] px-6 md:px-8 py-4 rounded-xl">
              Folytathatod 50 🪙 aranyérme felhasználásával.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => {
                  if (coins >= 50) {
                    const newCoins = coins - 50;
                    setCoins(newCoins);
                    toast.info("Folytatás aranyérméért", { description: `–50 🪙 (${newCoins} maradt)` });
                    console.log('continue_with_coins', { cost: 50, remaining: newCoins });
                    setShowTimeoutPopup(false);
                    setTimeout(() => {
                      if (currentQuestion < questions.length - 1) {
                        nextQuestion();
                      } else {
                        setGameState('won');
                        console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
                      }
                    }, 500);
                  }
                }}
                disabled={coins < 50}
                className="bg-gradient-to-r from-[#1C72FF] to-[#00FFCC] text-white font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg disabled:opacity-30 w-full sm:w-auto min-h-[44px]"
              >
                Folytatom (50 🪙)
              </Button>
              <Button 
                onClick={() => {
                  setShowTimeoutPopup(false);
                  toast.info(`Összegyűjtött aranyérméd: ${coins} 🪙`);
                  setTimeout(() => {
                    setGameState('idle');
                  }, 500);
                }}
                variant="outline"
                className="font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto min-h-[44px]"
              >
                Kilépek
              </Button>
            </div>
          </div>
        </div>
      )}

      <section id="game" className="min-h-screen bg-gradient-to-b from-background via-muted to-background flex items-center justify-center">
        <div className="container max-w-md mx-auto px-4">
          {/* Phone Frame */}
          <div className="relative mx-auto" style={{ maxWidth: '430px' }}>
            <div 
              className="bg-gradient-card rounded-[2.5rem] p-6 shadow-card border-2 border-border/30 relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: showSwipeIndicator ? 'none' : 'auto' }}
            >
              
              {/* Swipe Indicator */}
              {showSwipeIndicator && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
                  <div className="bg-gradient-to-r from-[#1C72FF] to-[#00FFCC] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
                    <span className="text-sm font-bold">Húzd felfelé a következő kérdéshez</span>
                    <span className="text-xl">👆</span>
                  </div>
                </div>
              )}
              {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              
              <div className={`text-6xl font-bold ${getTimerColor()} transition-colors`}>
                {timeLeft}
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold text-lg">🪙 {coins}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive font-bold text-base">❤️ × {lives}</span>
                </div>
              </div>
            </div>

            {/* Question Box - Hexagon Style */}
            <div 
              className="mb-6 relative transition-all"
              style={{
                transform: isTransitioning 
                  ? 'translateY(-100%)' 
                  : `translateY(-${(swipeOffset / 500) * 100}%)`,
                opacity: isTransitioning 
                  ? 0 
                  : Math.max(0.2, 1 - (swipeOffset / 400)),
                filter: `blur(${Math.min(swipeOffset / 100, 6)}px)`,
                transitionDuration: swipeOffset > 0 ? '0ms' : '300ms'
              }}
            >
              <div className="bg-[#0B1130] border-2 border-[#3A4260] rounded-2xl p-4 sm:p-6 clip-hexagon-box shadow-hexagon">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-gradient-to-r from-[#1C72FF] to-[#00FFCC] text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm sm:text-base">
                    ?
                  </div>
                  <p className="text-foreground text-base sm:text-lg font-semibold leading-tight break-words">
                    {currentQ.question}
                  </p>
                </div>
              </div>
            </div>

            {/* Audience Result Panel */}
            {showAudiencePanel && audienceResults.length > 0 && (
              <div className="mb-4 bg-[#101630] border-2 border-[#3A4260] rounded-xl p-4 animate-fade-in">
                <h3 className="text-white font-bold text-center mb-3">Közönség szavazata:</h3>
                <div className="space-y-2">
                  {currentQ.shuffledAnswers.map((_, index) => {
                    if (removedOption === index) return null;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-white font-bold w-8">{String.fromCharCode(65 + index)}:</span>
                        <div className="flex-1 bg-[#0B1130] rounded-full h-6 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#1C72FF] to-[#00FFCC] transition-all duration-1000 flex items-center justify-end pr-2"
                            style={{ width: `${audienceResults[index]}%` }}
                          >
                            <span className="text-white text-xs font-bold">{audienceResults[index]}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Answer Buttons - Hexagon Style */}
            <div 
              className="space-y-3 sm:space-y-4 mb-6 transition-all"
              style={{
                transform: isTransitioning 
                  ? 'translateY(-100%)' 
                  : `translateY(-${(swipeOffset / 500) * 100}%)`,
                opacity: isTransitioning 
                  ? 0 
                  : Math.max(0.2, 1 - (swipeOffset / 400)),
                filter: `blur(${Math.min(swipeOffset / 100, 6)}px)`,
                transitionDuration: swipeOffset > 0 ? '0ms' : '300ms'
              }}
            >
              {currentQ.shuffledAnswers.map((answer, index) => {
                if (removedOption === index) return null;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null && !hasDoubleAnswer}
                    className={`w-full bg-[#0B1130] border-2 border-[#3A4260] rounded-2xl p-3 sm:p-4 text-left transition-all hover:border-[#00FFCC]/50 disabled:opacity-50 clip-hexagon-answer shadow-hexagon min-h-[60px] touch-manipulation ${getButtonClasses(index)}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-[#00FFCC] font-bold text-base sm:text-lg flex-shrink-0">
                        {String.fromCharCode(65 + index)}:
                      </span>
                      <span className="text-foreground font-medium text-sm sm:text-base break-words">
                        {answer}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Helper Buttons - Below Answers */}
            <div className="flex justify-center gap-4 sm:gap-6 mb-6">
              {/* Harmadoló - 1/3 */}
              <button
                onClick={useHalve}
                disabled={usedHelpers.halve || selectedAnswer !== null || coins < 15}
                className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all duration-300 ${
                  usedHelpers.halve 
                    ? 'bg-muted/30 cursor-not-allowed' 
                    : selectedAnswer === null && coins >= 15
                    ? 'bg-gradient-to-br from-success/20 to-success/5 hover:from-success/30 hover:to-success/10 hover:scale-110 hover:shadow-[0_0_30px_rgba(0,255,102,0.4)] border-2 border-success/30 hover:border-success/50'
                    : 'bg-muted/30 cursor-not-allowed'
                } ${usedHelpers.halve && selectedAnswer === null ? 'ring-2 ring-success animate-pulse' : ''}`}
                title="Harmadoló (1/3)"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-success group-hover:scale-110 transition-transform duration-300">⅓</span>
                  <span className="text-[0.65rem] sm:text-xs text-muted-foreground font-medium">15 🪙</span>
                </div>
                {!usedHelpers.halve && coins >= 15 && selectedAnswer === null && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-ping" />
                )}
              </button>

              {/* 2× Válasz */}
              <button
                onClick={useDoubleAnswer}
                disabled={usedHelpers.doubleAnswer || selectedAnswer !== null || coins < 20}
                className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all duration-300 ${
                  usedHelpers.doubleAnswer 
                    ? 'bg-muted/30 cursor-not-allowed'
                    : selectedAnswer === null && coins >= 20
                    ? 'bg-gradient-to-br from-accent/20 to-accent/5 hover:from-accent/30 hover:to-accent/10 hover:scale-110 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] border-2 border-accent/30 hover:border-accent/50'
                    : 'bg-muted/30 cursor-not-allowed'
                } ${usedHelpers.doubleAnswer && hasDoubleAnswer ? 'ring-2 ring-accent animate-pulse' : ''}`}
                title="2× Válasz"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-accent group-hover:scale-110 transition-transform duration-300">2×</span>
                  <span className="text-[0.65rem] sm:text-xs text-muted-foreground font-medium">20 🪙</span>
                </div>
                {usedHelpers.doubleAnswer && hasDoubleAnswer && (
                  <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg animate-bounce">
                    2
                  </div>
                )}
                {!usedHelpers.doubleAnswer && coins >= 20 && selectedAnswer === null && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />
                )}
              </button>

              {/* Közönség */}
              <button
                onClick={useAudience}
                disabled={usedHelpers.audience || selectedAnswer !== null || coins < 30}
                className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all duration-300 ${
                  usedHelpers.audience 
                    ? 'bg-muted/30 cursor-not-allowed' 
                    : selectedAnswer === null && coins >= 30
                    ? 'bg-gradient-to-br from-secondary/20 to-secondary/5 hover:from-secondary/30 hover:to-secondary/10 hover:scale-110 hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] border-2 border-secondary/30 hover:border-secondary/50'
                    : 'bg-muted/30 cursor-not-allowed'
                } ${usedHelpers.audience && showAudiencePanel ? 'ring-2 ring-secondary animate-pulse' : ''}`}
                title="Közönség"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">👥</span>
                  <span className="text-[0.65rem] sm:text-xs text-muted-foreground font-medium">30 🪙</span>
                </div>
                {!usedHelpers.audience && coins >= 30 && selectedAnswer === null && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Progress */}
            <div className="mt-6 flex justify-center items-center text-muted-foreground text-sm">
              <span>Kérdés: {currentQuestion + 1}/15</span>
            </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GamePreview;
