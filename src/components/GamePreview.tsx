import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && gameState === 'playing') {
      handleTimeOut();
    }
  }, [timeLeft, gameState, selectedAnswer]);

  const handleTimeOut = () => {
    console.log('timeout', { id: questions[currentQuestion].id });
    if (coins >= 50) {
      setGameState('timeout');
    } else {
      handleWrongAnswer();
    }
  };

  const startGame = (restartWithOneLive = false) => {
    const newQuestions = getRandomQuestions();
    setQuestions(newQuestions);
    setGameState('playing');
    setCurrentQuestion(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setLives(restartWithOneLive ? 1 : 5);
    setCoins(200);
    setUsedHelpers({ halve: false, doubleAnswer: false, audience: false });
    setRemovedOption(null);
    setHasDoubleAnswer(false);
    setFirstAttemptIndex(null);
    setSecondAttemptIndex(null);
    console.log('round_start', { questions: 15, lives: restartWithOneLive ? 1 : 5 });
  };

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
        
        if (!isCorrect) {
          toast.error("Rossz válasz! Még egy próbálkozásod van.");
        }
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
          toast.success("Helyes válasz!", { description: "Nagyszerű munka!" });

          setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
              nextQuestion();
            } else {
              setGameState('won');
              console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
            }
          }, 1500);
        } else {
          setSelectedAnswer(questions[currentQuestion].correctIndex);
          handleWrongAnswer();
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
      toast.success("Helyes válasz!", { description: "Nagyszerű munka!" });

      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          nextQuestion();
        } else {
          setGameState('won');
          console.log('round_end', { result: 'won', correctCount: currentQuestion + 1 });
        }
      }, 1500);
    } else {
      handleWrongAnswer();
    }
  };

  const handleWrongAnswer = () => {
    const newLives = lives - 1;
    setLives(newLives);
    toast.error("Helytelen válasz!", { description: `-1 élet (${newLives} maradt)` });

    setTimeout(() => {
      if (newLives <= 0) {
        setGameState('out-of-lives');
        console.log('round_end', { result: 'out-of-lives', correctCount: currentQuestion });
      } else if (currentQuestion < questions.length - 1) {
        nextQuestion();
      } else {
        setGameState('lost');
        console.log('round_end', { result: 'lost', correctCount: currentQuestion });
      }
    }, 1500);
  };

  const nextQuestion = () => {
    setCurrentQuestion(prev => prev + 1);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setRemovedOption(null);
    setHasDoubleAnswer(false);
    setFirstAttemptIndex(null);
    setSecondAttemptIndex(null);
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
    const percentage = 60 + Math.floor(Math.random() * 30);
    toast.info("Közönség használva", { 
      description: `–30 🪙 (${newCoins} maradt). ${percentage}% szerint: ${String.fromCharCode(65 + correct)}` 
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
    
    // Ha van végleges válasz, mutassuk a helyes választ zölden
    if (selectedAnswer !== null) {
      if (isCorrect) return "!bg-success !border-success";
      if (isFirstAttempt || isSecondAttempt) return "!bg-destructive !border-destructive animate-shake";
      return "";
    }
    
    // Dupla válasz esetén az első hibás próbálkozás
    if (isFirstAttempt && !isCorrect) return "!bg-destructive !border-destructive animate-shake";
    
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
              <br />5 életed van. Jó szerencsét!
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

  // OVERLAY Screens
  if (gameState === 'timeout') {
    const continueWithCoins = () => {
      if (coins >= 50) {
        const newCoins = coins - 50;
        setCoins(newCoins);
        toast.info("Folytatás aranyérméért", { description: `–50 🪙 (${newCoins} maradt)` });
        console.log('continue_with_coins', { cost: 50, remaining: newCoins });
        nextQuestion();
        setGameState('playing');
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in max-w-md px-4">
          <div className="text-8xl">⏰</div>
          <h2 className="text-4xl md:text-5xl font-bold text-destructive">Lejárt az idő!</h2>
          <p className="text-foreground text-lg md:text-xl font-semibold bg-gradient-gold px-6 md:px-8 py-4 rounded-xl clip-hexagon">
            Folytathatod 50 🪙 aranyérme felhasználásával.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={continueWithCoins}
              disabled={coins < 50}
              className="bg-gradient-gold text-black font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg disabled:opacity-30 w-full sm:w-auto min-h-[44px]"
            >
              Folytatom (50 🪙)
            </Button>
            <Button 
              onClick={() => setGameState('idle')}
              variant="outline"
              className="font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto min-h-[44px]"
            >
              Kilépek
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="text-center space-y-6 animate-fade-in max-w-md">
          <div className="text-8xl animate-float">🎉</div>
          <h2 className="text-5xl font-bold text-success">Gratulálunk!</h2>
          <p className="text-foreground text-2xl font-semibold mb-4">
            A játék véget ért.
          </p>
          <p className="text-accent text-3xl font-bold bg-gradient-gold px-8 py-6 rounded-xl clip-hexagon">
            Ennyi aranyérmét gyűjtöttél:<br />
            {coins} 🪙
          </p>
          <Button 
            onClick={() => setGameState('idle')}
            className="bg-gradient-gold text-black font-bold px-8 py-4 text-lg mt-6 min-h-[44px]"
          >
            Vissza a főoldalra
          </Button>
        </div>
      </div>
    );
  }

  // PLAYING Screen
  const currentQ = questions[currentQuestion];

  return (
    <section id="game" className="min-h-screen py-8 px-4 bg-gradient-to-b from-background via-muted to-background">
      <div className="container max-w-md mx-auto">
        {/* Phone Frame */}
        <div className="relative mx-auto" style={{ maxWidth: '430px' }}>
          <div className="bg-gradient-card rounded-[2.5rem] p-6 shadow-card border-2 border-border/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setGameState('idle')}
                className="text-foreground hover:bg-muted"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              
              <div className={`text-6xl font-bold ${getTimerColor()} transition-colors`}>
                {timeLeft}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-accent font-bold">🪙 {coins}</span>
              </div>
            </div>

            {/* Question Box - Hexagon Style */}
            <div className="mb-8 relative">
              <div className="bg-gradient-card border-2 border-accent/20 rounded-2xl p-4 sm:p-6 clip-hexagon-box shadow-hexagon">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-accent text-black rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm sm:text-base">
                    ?
                  </div>
                  <p className="text-foreground text-base sm:text-lg font-semibold leading-tight break-words">
                    {currentQ.question}
                  </p>
                </div>
              </div>
            </div>

            {/* Answer Buttons - Hexagon Style */}
            <div className="space-y-3 sm:space-y-4 mb-8">
              {currentQ.shuffledAnswers.map((answer, index) => {
                if (removedOption === index) return null;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null && !hasDoubleAnswer}
                    className={`w-full bg-black border-2 border-primary/50 rounded-2xl p-3 sm:p-4 text-left transition-all hover:border-accent/70 disabled:opacity-50 clip-hexagon-answer shadow-hexagon min-h-[60px] ${getButtonClasses(index)}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-accent font-bold text-base sm:text-lg flex-shrink-0">
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

            {/* Helper Buttons - Hexagon Style */}
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={useHalve}
                disabled={usedHelpers.halve || selectedAnswer !== null || coins < 15}
                className="hexagon-button disabled:opacity-30"
                title="Harmadoló"
              >
                <div className="hexagon-content">
                  <span className="text-base sm:text-lg font-bold">½</span>
                  <span className="text-[0.6rem] sm:text-xs leading-tight">Harmadoló<br />(15)</span>
                </div>
              </button>

              <button
                onClick={useDoubleAnswer}
                disabled={usedHelpers.doubleAnswer || selectedAnswer !== null || coins < 20}
                className="hexagon-button disabled:opacity-30"
                title="2× Válasz"
              >
                <div className="hexagon-content">
                  <span className="text-xl sm:text-2xl font-bold">2</span>
                  <span className="text-[0.6rem] sm:text-xs leading-tight">2× Válasz<br />(20)</span>
                </div>
              </button>

              <button
                onClick={useAudience}
                disabled={usedHelpers.audience || selectedAnswer !== null || coins < 30}
                className="hexagon-button disabled:opacity-30"
                title="Közönség"
              >
                <div className="hexagon-content">
                  <span className="text-lg sm:text-xl">👥</span>
                  <span className="text-[0.6rem] sm:text-xs leading-tight">Közönség<br />(30)</span>
                </div>
              </button>
            </div>

            {/* Progress & Lives */}
            <div className="mt-6 flex justify-between items-center text-muted-foreground text-sm">
              <span>Kérdés: {currentQuestion + 1}/15</span>
              <span className="text-destructive font-bold">❤️ × {lives}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamePreview;
