import { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TutorialStep } from '@/data/tutorialSteps';
import { useI18n } from '@/i18n';

interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStep: number;
  isVisible: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const TutorialOverlay = ({
  steps,
  currentStep,
  isVisible,
  onNext,
  onPrev,
  onClose
}: TutorialOverlayProps) => {
  const { t, lang } = useI18n();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const updateHighlight = () => {
      const step = steps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        calculateTooltipPosition(rect, step.position || 'bottom');
      }
    };

    // Initial update
    updateHighlight();

    // Update on resize or scroll
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [currentStep, isVisible, steps]);

  const calculateTooltipPosition = (rect: DOMRect, position: string) => {
    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPosition({ top, left });
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const currentLang = lang === 'hu' ? 'hu' : 'en';

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with spotlight cutout */}
      <div 
        className="absolute inset-0 bg-black/65 pointer-events-auto"
        onClick={onClose}
        style={{
          clipPath: highlightRect
            ? `polygon(
                0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                ${highlightRect.left - 8}px ${highlightRect.top - 8}px,
                ${highlightRect.left - 8}px ${highlightRect.bottom + 8}px,
                ${highlightRect.right + 8}px ${highlightRect.bottom + 8}px,
                ${highlightRect.right + 8}px ${highlightRect.top - 8}px,
                ${highlightRect.left - 8}px ${highlightRect.top - 8}px
              )`
            : undefined
        }}
      />

      {/* Highlight border */}
      {highlightRect && (
        <div
          className="absolute pointer-events-none animate-pulse"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            border: '3px solid #D4AF37',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), inset 0 0 20px rgba(212, 175, 55, 0.3)'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto animate-fade-in"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          maxWidth: '320px'
        }}
      >
        <div className="bg-gradient-to-br from-accent-dark/95 to-accent-darker/95 backdrop-blur-sm border-2 border-accent rounded-2xl shadow-2xl p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-destructive/80 hover:bg-destructive transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white pr-8">
              {step.title[currentLang]}
            </h3>
            <p className="text-sm text-white/90 leading-relaxed">
              {step.description[currentLang]}
            </p>

            {/* Progress indicator */}
            <div className="flex gap-1 pt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-accent' : 'bg-foreground/30'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2 pt-2">
              {currentStep > 0 && (
                <Button
                  onClick={onPrev}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-foreground/10 border-foreground/30 hover:bg-foreground/20 text-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t('tutorial.prev')}
                </Button>
              )}
              <Button
                onClick={onNext}
                size="sm"
                className="flex-1 bg-[#138F5E] hover:bg-[#1AA56B] text-white font-bold"
              >
                {currentStep === steps.length - 1 ? t('tutorial.finish') : t('tutorial.next')}
                {currentStep < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>

            {/* Step counter */}
            <p className="text-xs text-white/60 text-center pt-1">
              {currentStep + 1} / {steps.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
