import { useState, useEffect } from 'react';

export type TutorialRoute = 
  | 'dashboard' 
  | 'chat' 
  | 'profile' 
  | 'play' 
  | 'landing'
  | 'topics';

interface TutorialState {
  [key: string]: boolean;
}

const TUTORIAL_STORAGE_KEY = 'dingleup_tutorial_seen';

export const useTutorial = (route: TutorialRoute) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkTutorialStatus();
  }, [route]);

  const checkTutorialStatus = () => {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    const tutorialState: TutorialState = stored ? JSON.parse(stored) : {};
    
    if (!tutorialState[route]) {
      // Add a small delay to ensure the page has fully rendered
      setTimeout(() => {
        setIsVisible(true);
      }, 500);
    }
  };

  const nextStep = (totalSteps: number) => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTutorial = () => {
    setIsVisible(false);
    setCurrentStep(0);
    markTutorialAsSeen();
  };

  const markTutorialAsSeen = () => {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    const tutorialState: TutorialState = stored ? JSON.parse(stored) : {};
    tutorialState[route] = true;
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(tutorialState));
  };

  const resetTutorial = () => {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    const tutorialState: TutorialState = stored ? JSON.parse(stored) : {};
    tutorialState[route] = false;
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(tutorialState));
    setCurrentStep(0);
    setIsVisible(true);
  };

  return {
    isVisible,
    currentStep,
    nextStep,
    prevStep,
    closeTutorial,
    resetTutorial,
    setCurrentStep
  };
};
