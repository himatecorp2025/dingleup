import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useAutoLogout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHandheldRef = useRef(false);

  const checkIfHandheld = () => {
    // Check if device is mobile/tablet (not desktop/laptop)
    const isNarrowViewport = window.matchMedia('(max-width: 1024px)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    isHandheldRef.current = isNarrowViewport && hasCoarsePointer;
    return isHandheldRef.current;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.info('Biztonsági okokból kijelentkeztettünk 10 perc inaktivitás miatt');
      navigate('/login');
    }
  };

  const resetTimer = () => {
    // Only apply auto-logout on handheld devices
    if (!checkIfHandheld()) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Check initial device type
    checkIfHandheld();

    // Only set up listeners if on handheld device
    if (!isHandheldRef.current) {
      return;
    }

    // Activity events
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    // Listen for device changes
    const viewportMedia = window.matchMedia('(max-width: 1024px)');
    const pointerMedia = window.matchMedia('(pointer: coarse)');
    
    const handleMediaChange = () => {
      const wasHandheld = isHandheldRef.current;
      checkIfHandheld();
      
      // If switched from handheld to desktop, clear timer
      if (wasHandheld && !isHandheldRef.current && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // If switched from desktop to handheld, start timer
      else if (!wasHandheld && isHandheldRef.current) {
        resetTimer();
      }
    };

    viewportMedia.addEventListener('change', handleMediaChange);
    pointerMedia.addEventListener('change', handleMediaChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
      viewportMedia.removeEventListener('change', handleMediaChange);
      pointerMedia.removeEventListener('change', handleMediaChange);
    };
  }, [navigate]);
};
