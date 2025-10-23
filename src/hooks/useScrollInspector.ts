import { useState, useEffect, useRef } from 'react';

interface ScrollMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  atBottom: boolean;
  lastScrollToBottomSource: string;
  lastScrollToBottomTime: number;
  activeScrollRoot: string;
}

let globalLastScrollSource = 'init';
let globalLastScrollTime = Date.now();

export const recordScrollToBottom = (source: string) => {
  globalLastScrollSource = source;
  globalLastScrollTime = Date.now();
  console.log(`[SCROLL_EVT] scrollToBottom called from: ${source}`);
};

export const useScrollInspector = (enabled: boolean) => {
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    scrollTop: 0,
    clientHeight: 0,
    scrollHeight: 0,
    atBottom: false,
    lastScrollToBottomSource: globalLastScrollSource,
    lastScrollToBottomTime: globalLastScrollTime,
    activeScrollRoot: 'none'
  });

  const updateMetrics = () => {
    const scrollRoot = document.querySelector('[data-scroll-root="thread"]') as HTMLElement;
    if (scrollRoot) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= 120;

      setMetrics({
        scrollTop,
        clientHeight,
        scrollHeight,
        atBottom,
        lastScrollToBottomSource: globalLastScrollSource,
        lastScrollToBottomTime: globalLastScrollTime,
        activeScrollRoot: '[data-scroll-root="thread"]'
      });
    }
  };

  useEffect(() => {
    if (!enabled) return;

    updateMetrics();
    const interval = setInterval(updateMetrics, 500);

    return () => clearInterval(interval);
  }, [enabled]);

  return metrics;
};
