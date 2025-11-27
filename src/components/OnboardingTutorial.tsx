import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { X, ChevronRight, ChevronLeft, Play, Trophy, Share2, Gift } from 'lucide-react';
import { useI18n } from '@/i18n';

interface OnboardingStep {
  titleKey: string;
  descriptionKey: string;
  icon: any;
  gradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    titleKey: 'onboarding.step1_title',
    descriptionKey: 'onboarding.step1_desc',
    icon: Gift,
    gradient: 'from-accent via-accent-dark to-accent'
  },
  {
    titleKey: 'onboarding.step2_title',
    descriptionKey: 'onboarding.step2_desc',
    icon: Play,
    gradient: 'from-success via-success/80 to-success'
  },
  {
    titleKey: 'onboarding.step3_title',
    descriptionKey: 'onboarding.step3_desc',
    icon: Trophy,
    gradient: 'from-destructive via-destructive/80 to-destructive'
  },
  {
    titleKey: 'onboarding.step4_title',
    descriptionKey: 'onboarding.step4_desc',
    icon: Gift,
    gradient: 'from-accent-dark via-destructive to-accent-dark'
  },
  {
    titleKey: 'onboarding.step5_title',
    descriptionKey: 'onboarding.step5_desc',
    icon: Trophy,
    gradient: 'from-primary via-primary-glow to-primary'
  },
  {
    titleKey: 'onboarding.step6_title',
    descriptionKey: 'onboarding.step6_desc',
    icon: Share2,
    gradient: 'from-primary-glow via-primary to-primary-glow'
  }
];

interface OnboardingTutorialProps {
  userId: string;
}

export const OnboardingTutorial = ({ userId }: OnboardingTutorialProps) => {
  const { t } = useI18n();
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
      <DialogContent className="w-[95vw] max-w-md bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker border-2 border-primary/50 shadow-2xl shadow-primary/30">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full bg-destructive/80 hover:bg-destructive transition-colors z-50"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-accent' : 'bg-background/20'
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
              <Icon className="w-12 h-12 text-foreground" strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-black bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
            {t(step.titleKey)}
          </h2>

          {/* Description */}
          <p className="text-foreground/90 text-sm leading-relaxed px-4">
            {t(step.descriptionKey)}
          </p>

          {/* Step counter */}
          <p className="text-xs text-foreground/50">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {currentStep > 0 && (
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="flex-1 bg-background/10 border-border/20 hover:bg-background/20"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('onboarding.button_back')}
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={`flex-1 bg-gradient-to-r ${step.gradient} text-foreground font-bold hover:opacity-90`}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? t('onboarding.button_finish') : t('onboarding.button_next')}
            {currentStep < ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {/* Skip button */}
        {currentStep < ONBOARDING_STEPS.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-xs text-white/50 hover:text-white/80 transition-colors mt-2"
          >
            {t('onboarding.button_skip')}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};
