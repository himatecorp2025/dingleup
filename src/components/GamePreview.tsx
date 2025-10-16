import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HelpCircle, X, Users, Repeat } from "lucide-react";
import { toast } from "sonner";
import trophyCharacter from "@/assets/trophy-character.png";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  {
    question: "Melyik magyar király beszélt hat nyelven?",
    options: ["Szent István", "Hunyadi Mátyás", "II. András"],
    correctAnswer: 1
  },
  {
    question: "Mennyi 16 − 12 ÷ 4 eredménye?",
    options: ["1", "13", "4"],
    correctAnswer: 1
  },
  {
    question: "Hány százalékban egyezik az ember DNS-e a csimpánzzal?",
    options: ["68%", "88%", "98%"],
    correctAnswer: 2
  },
  {
    question: "Melyik országban található a Stonehenge?",
    options: ["Írország", "Skócia", "Anglia"],
    correctAnswer: 2
  },
  {
    question: "Ki festette a Mona Lisát?",
    options: ["Michelangelo", "Leonardo da Vinci", "Raphael"],
    correctAnswer: 1
  },
  {
    question: "Melyik bolygó a legnagyobb a Naprendszerben?",
    options: ["Szaturnusz", "Jupiter", "Neptunusz"],
    correctAnswer: 1
  },
  {
    question: "Hány éves volt Mozart, amikor meghalt?",
    options: ["35", "40", "45"],
    correctAnswer: 0
  },
  {
    question: "Melyik évben fedezte fel Kolumbusz Amerikát?",
    options: ["1492", "1500", "1485"],
    correctAnswer: 0
  },
  {
    question: "Mi a fény sebessége?",
    options: ["300 000 km/s", "150 000 km/s", "450 000 km/s"],
    correctAnswer: 0
  },
  {
    question: "Hány csont van az emberi testben?",
    options: ["186", "206", "226"],
    correctAnswer: 1
  },
  {
    question: "Ki írta a Rómeó és Júliát?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen"],
    correctAnswer: 1
  },
  {
    question: "Melyik a legnagyobb óceán a Földön?",
    options: ["Atlanti-óceán", "Indiai-óceán", "Csendes-óceán"],
    correctAnswer: 2
  },
  {
    question: "Hány kontinens van a Földön?",
    options: ["5", "6", "7"],
    correctAnswer: 2
  },
  {
    question: "Ki volt az első ember az űrben?",
    options: ["Neil Armstrong", "Jurij Gagarin", "Buzz Aldrin"],
    correctAnswer: 1
  },
  {
    question: "Melyik elem vegyjele az Au?",
    options: ["Ezüst", "Arany", "Alumínium"],
    correctAnswer: 1
  }
];

const GamePreview = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished' | 'lost'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gold, setGold] = useState(50);
  const [lives, setLives] = useState(3);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [availableOptions, setAvailableOptions] = useState<number[]>([0, 1, 2]);
  const [usedHelpers, setUsedHelpers] = useState({
    halve: false,
    doubleAnswer: false,
    audience: false
  });

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && gameState === 'playing') {
      handleWrongAnswer();
    }
  }, [timeLeft, gameState, selectedAnswer]);

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setGold(50);
    setLives(3);
    setCorrectAnswers(0);
    setAvailableOptions([0, 1, 2]);
    setUsedHelpers({ halve: false, doubleAnswer: false, audience: false });
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setGold(prev => prev + 20);
      toast.success("Helyes válasz! +20 arany", {
        description: "Nagyszerű munka!"
      });

      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setTimeLeft(10);
          setSelectedAnswer(null);
          setAvailableOptions([0, 1, 2]);
        } else {
          setGameState('finished');
        }
      }, 1500);
    } else {
      handleWrongAnswer();
    }
  };

  const handleWrongAnswer = () => {
    setLives(prev => prev - 1);
    toast.error("Helytelen válasz!", {
      description: "-1 élet"
    });

    setTimeout(() => {
      if (lives - 1 <= 0) {
        setGameState('lost');
      } else if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(10);
        setSelectedAnswer(null);
        setAvailableOptions([0, 1, 2]);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  const useHalve = () => {
    if (usedHelpers.halve || selectedAnswer !== null) return;
    if (gold < 15) {
      toast.error("Nincs elég aranyad! A játék véget ért.");
      setTimeout(() => setGameState('lost'), 1500);
      return;
    }

    setGold(prev => prev - 15);
    setUsedHelpers(prev => ({ ...prev, halve: true }));

    const correct = questions[currentQuestion].correctAnswer;
    const wrongOptions = [0, 1, 2].filter(i => i !== correct);
    const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setAvailableOptions(prev => prev.filter(i => i !== toRemove));

    toast.info("Harmadoló használva", {
      description: "Egy rossz válasz eltávolítva! -15 arany"
    });
  };

  const useDoubleAnswer = () => {
    if (usedHelpers.doubleAnswer || selectedAnswer !== null) return;
    if (gold < 20) {
      toast.error("Nincs elég aranyad! A játék véget ért.");
      setTimeout(() => setGameState('lost'), 1500);
      return;
    }

    setGold(prev => prev - 20);
    setUsedHelpers(prev => ({ ...prev, doubleAnswer: true }));

    toast.info("2× Válasz használva", {
      description: "Két próbálkozásod van! -20 arany"
    });
  };

  const useAudience = () => {
    if (usedHelpers.audience || selectedAnswer !== null) return;
    if (gold < 30) {
      toast.error("Nincs elég aranyad! A játék véget ért.");
      setTimeout(() => setGameState('lost'), 1500);
      return;
    }

    setGold(prev => prev - 30);
    setUsedHelpers(prev => ({ ...prev, audience: true }));

    const correct = questions[currentQuestion].correctAnswer;
    const correctOption = questions[currentQuestion].options[correct];
    
    toast.info("Közönség segítsége", {
      description: `A közönség ${85 + Math.floor(Math.random() * 10)}%-a azt mondja: ${correctOption}. -30 arany`
    });
  };

  if (gameState === 'idle') {
    return (
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
              Hogyan <span className="text-transparent bg-clip-text bg-gradient-gold">Működik?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Próbáld ki a játékot! Válaszolj helyesen és gyűjts aranyat.
            </p>
            <Button 
              onClick={startGame}
              size="lg"
              className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow text-lg px-12 py-6"
            >
              Játék Indítása
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (gameState === 'lost') {
    return (
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <div className="w-64 h-64 mx-auto mb-8 flex items-center justify-center text-9xl animate-float">
              ❓
            </div>
            <h2 className="text-5xl font-bold mb-4 font-poppins text-destructive">
              Vesztettél!
            </h2>
            <p className="text-2xl text-foreground mb-8">
              {lives <= 0 ? "Elfogytak az életeid!" : "Elfogy az aranyad!"}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-card border-destructive/30 p-6">
                <div className="text-3xl font-bold text-destructive mb-2">{correctAnswers}/{questions.length}</div>
                <div className="text-sm text-muted-foreground">Helyes válasz</div>
              </Card>
              <Card className="bg-gradient-card border-destructive/30 p-6">
                <div className="text-3xl font-bold text-destructive mb-2">{gold}</div>
                <div className="text-sm text-muted-foreground">Összegyűjtött arany</div>
              </Card>
              <Card className="bg-gradient-card border-destructive/30 p-6">
                <div className="text-3xl font-bold text-destructive mb-2">{lives}</div>
                <div className="text-sm text-muted-foreground">Maradt élet</div>
              </Card>
            </div>

            <div className="bg-accent/20 border border-accent rounded-lg p-6 mb-6 max-w-md mx-auto">
              <p className="text-accent font-semibold mb-2">Folytasd a játékot!</p>
              <p className="text-sm text-muted-foreground">Szerezz bónusz életeket és próbáld újra!</p>
            </div>

            <Button 
              onClick={startGame}
              size="lg"
              className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow"
            >
              <Repeat className="mr-2 w-5 h-5" />
              Újraindítás 1 élettel
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (gameState === 'finished') {
    return (
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <img 
              src={trophyCharacter} 
              alt="Trophy" 
              className="w-64 h-64 mx-auto mb-8 animate-float"
            />
            <h2 className="text-5xl font-bold mb-4 font-poppins text-green-500">
              Gratulálunk, nyertél!
            </h2>
            <p className="text-2xl text-foreground mb-8">
              Teljesítetted a játékot!
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-card border-green-500/30 p-6">
                <div className="text-3xl font-bold text-green-500 mb-2">{correctAnswers}/{questions.length}</div>
                <div className="text-sm text-muted-foreground">Helyes válasz</div>
              </Card>
              <Card className="bg-gradient-card border-green-500/30 p-6">
                <div className="text-3xl font-bold text-green-500 mb-2">{gold}</div>
                <div className="text-sm text-muted-foreground">Összegyűjtött arany</div>
              </Card>
              <Card className="bg-gradient-card border-green-500/30 p-6">
                <div className="text-3xl font-bold text-green-500 mb-2">{lives}</div>
                <div className="text-sm text-muted-foreground">Maradt élet</div>
              </Card>
            </div>

            <div className="bg-accent/20 border border-accent rounded-lg p-6 mb-6 max-w-md mx-auto">
              <p className="text-accent font-semibold mb-2">Ha még játszani szeretnél, görgess lejjebb!</p>
              <p className="text-sm text-muted-foreground">Nyugalomban, vissza a főoldalra</p>
            </div>

            <Button 
              onClick={startGame}
              size="lg"
              className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow"
            >
              <Repeat className="mr-2 w-5 h-5" />
              Újra Játszom
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const question = questions[currentQuestion];
  const timerColor = timeLeft > 6 ? 'border-green-500 text-green-500' : timeLeft > 3 ? 'border-accent text-accent' : 'border-destructive text-destructive';

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header with stats */}
          <div className="flex justify-between items-center mb-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="bg-accent/20 border border-accent/30 rounded-lg px-4 py-2">
                <span className="text-accent font-bold">{gold}</span>
                <span className="text-sm text-muted-foreground ml-1">Arany</span>
              </div>
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg px-4 py-2">
                <span className="text-destructive font-bold">{lives}</span>
                <span className="text-sm text-muted-foreground ml-1">Élet</span>
              </div>
            </div>
            <div className="text-muted-foreground">
              Kérdés {currentQuestion + 1}/{questions.length}
            </div>
          </div>

          {/* Timer Circle */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className={`w-24 h-24 rounded-full border-4 ${timerColor} flex items-center justify-center relative`}>
              <div className="text-4xl font-bold">{timeLeft}</div>
              <svg className="absolute inset-0 w-24 h-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(timeLeft / 10) * 276.46} 276.46`}
                  className="transition-all duration-1000 ease-linear"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>

          {/* Question Card */}
          <Card className="bg-primary/10 border-primary/50 p-8 mb-6 animate-fade-in shadow-lg">
            <div className="bg-gradient-to-r from-primary/30 to-accent/30 border-2 border-primary/50 rounded-2xl p-6 mb-6 shadow-glow">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-7 h-7 text-accent flex-shrink-0 mt-1 animate-pulse" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  {question.question}
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {question.options.map((option, index) => {
                if (!availableOptions.includes(index)) {
                  return (
                    <div
                      key={index}
                      className="w-full text-left p-4 rounded-xl border-2 border-muted/30 bg-muted/10 opacity-40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="line-through">{String.fromCharCode(65 + index)}: {option}</span>
                        <X className="w-5 h-5" />
                      </div>
                    </div>
                  );
                }

                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctAnswer;
                const showResult = selectedAnswer !== null;

                let buttonClass = 'bg-gradient-to-r from-muted/40 to-muted/20 border-2 border-muted hover:border-accent/70 hover:from-accent/20 hover:to-accent/10 hover:scale-[1.02] shadow-md';
                if (showResult) {
                  if (isCorrect) {
                    buttonClass = 'bg-gradient-to-r from-green-500/30 to-green-600/20 border-2 border-green-500 text-green-400 font-bold shadow-lg shadow-green-500/50';
                  } else if (isSelected) {
                    buttonClass = 'bg-gradient-to-r from-destructive/30 to-destructive/20 border-2 border-destructive text-destructive font-bold shadow-lg shadow-destructive/50';
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-5 rounded-2xl transition-all duration-300 ${buttonClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        <span className="text-accent mr-3">{String.fromCharCode(65 + index)}:</span>
                        {option}
                      </span>
                      {showResult && isCorrect && <CheckCircle2 className="w-6 h-6 animate-bounce" />}
                      {showResult && !isCorrect && isSelected && <X className="w-6 h-6" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Helpers */}
          <div className="flex gap-3 justify-center flex-wrap animate-fade-in">
            <Button
              onClick={useHalve}
              disabled={usedHelpers.halve || selectedAnswer !== null}
              variant="outline"
              className={`border-secondary/50 hover:bg-secondary/20 ${usedHelpers.halve ? 'opacity-50' : ''}`}
            >
              <span className="text-2xl mr-2">⅓</span>
              Harmadoló (15)
            </Button>
            <Button
              onClick={useDoubleAnswer}
              disabled={usedHelpers.doubleAnswer || selectedAnswer !== null}
              variant="outline"
              className={`border-secondary/50 hover:bg-secondary/20 ${usedHelpers.doubleAnswer ? 'opacity-50' : ''}`}
            >
              <span className="text-2xl mr-2">2️⃣</span>
              2× Válasz (20)
            </Button>
            <Button
              onClick={useAudience}
              disabled={usedHelpers.audience || selectedAnswer !== null}
              variant="outline"
              className={`border-secondary/50 hover:bg-secondary/20 ${usedHelpers.audience ? 'opacity-50' : ''}`}
            >
              <Users className="mr-2 w-5 h-5" />
              Közönség (30)
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamePreview;
