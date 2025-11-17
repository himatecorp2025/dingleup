import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { X, ChevronRight, ChevronLeft, Play, Trophy, Share2, Gift } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  gradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Üdvözlünk a DingleUp-ban! 🎉',
    description: 'Ez egy kvízjáték, ahol aranyérméket szerezhetsz a helyes válaszokért! Haladj végig a lépéseken, hogy megismerd az alkalmazás funkcióit.',
    icon: Gift,
    gradient: 'from-yellow-500 via-orange-500 to-yellow-500'
  },
  {
    title: 'Kezdd el a játékot! 🎮',
    description: 'A PLAY NOW gombbal indíthatsz új játékot. Válassz kategóriát és válaszolj a kérdésekre! Minden helyes válaszért aranyérméket és pontokat kapsz.',
    icon: Play,
    gradient: 'from-green-500 via-green-400 to-green-500'
  },
  {
    title: 'Életek és újratöltés ❤️',
    description: 'Minden játékhoz szükséged van életre. Ha elfogy, ne aggódj - automatikusan újratöltődnek 12 percenként!',
    icon: Trophy,
    gradient: 'from-red-500 via-pink-500 to-red-500'
  },
  {
    title: 'Napi jutalmak 🎁',
    description: 'Jelentkezz be minden nap, és szerezz ingyenes aranyérméket! A sorozat folytatásával egyre több érmét kapsz. 7 nap után újraindul a ciklus.',
    icon: Gift,
    gradient: 'from-orange-500 via-red-500 to-orange-500'
  },
  {
    title: 'Ranglista és versenyek 🏆',
    description: 'Versenyezz másokkal a ranglistán! Heti és globális rangsorban is részt vehetsz. A legjobb játékosok különleges jutalmakat nyernek!',
    icon: Trophy,
    gradient: 'from-purple-600 via-purple-500 to-purple-600'
  },
  {
    title: 'Barátok meghívása 🤝',
    description: 'Hívd meg barátaidat és szerezz bónuszokat! Minden meghívott barát után extra aranyérméket és életeket kapsz. Oszd meg a meghívó kódodat!',
    icon: Share2,
    gradient: 'from-blue-500 via-blue-400 to-blue-500'
  }
];

interface OnboardingTutorialProps {
  userId: string;
}

export const OnboardingTutorial = ({ userId }: OnboardingTutorialProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, [userId]);

  const checkOnboarding = () => {
    const hasSeenOnboarding = localStorage.getItem(`onboarding_complete_${userId}`);
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(`onboarding_complete_${userId}`, 'true');
    setOpen(false);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  if (loading) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-md bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-600/80 hover:bg-red-700 transition-colors z-50"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-yellow-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          {/* Icon with gradient background */}
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} blur-2xl opacity-50 animate-pulse`}></div>
            <div className={`relative p-6 rounded-full bg-gradient-to-r ${step.gradient} shadow-2xl`}>
              <Icon className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-black bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-white/90 text-sm leading-relaxed px-4">
            {step.description}
          </p>

          {/* Step counter */}
          <p className="text-xs text-white/50">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {currentStep > 0 && (
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 hover:bg-white/20"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Vissza
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={`flex-1 bg-gradient-to-r ${step.gradient} text-white font-bold hover:opacity-90`}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Befejezés' : 'Következő'}
            {currentStep < ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {/* Skip button */}
        {currentStep < ONBOARDING_STEPS.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-xs text-white/50 hover:text-white/80 transition-colors mt-2"
          >
            Kihagyás
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};
