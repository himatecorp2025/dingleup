import { useState } from 'react';

export const useGameAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [canSwipe, setCanSwipe] = useState(true);
  const [translateY, setTranslateY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [questionVisible, setQuestionVisible] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const swipeThreshold = 80;

  return {
    isAnimating,
    setIsAnimating,
    canSwipe,
    setCanSwipe,
    translateY,
    setTranslateY,
    touchStartY,
    setTouchStartY,
    questionVisible,
    setQuestionVisible,
    showExitDialog,
    setShowExitDialog,
    swipeThreshold,
  };
};
