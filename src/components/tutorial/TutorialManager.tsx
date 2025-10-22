import { TutorialOverlay } from './TutorialOverlay';
import { useTutorial, TutorialRoute } from '@/hooks/useTutorial';
import { tutorialSteps } from '@/data/tutorialSteps';

interface TutorialManagerProps {
  route: TutorialRoute;
}

export const TutorialManager = ({ route }: TutorialManagerProps) => {
  const { isVisible, currentStep, nextStep, prevStep, closeTutorial } = useTutorial(route);
  
  const steps = tutorialSteps[route] || [];

  if (steps.length === 0) return null;

  return (
    <TutorialOverlay
      steps={steps}
      currentStep={currentStep}
      isVisible={isVisible}
      onNext={() => nextStep(steps.length)}
      onPrev={prevStep}
      onClose={closeTutorial}
    />
  );
};
