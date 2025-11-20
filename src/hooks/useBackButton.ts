import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useBackButton = () => {
  const location = useLocation();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Prevent going back to empty state or outside app
      if (location.pathname === '/') {
        e.preventDefault();
        // On root, prevent back - stay on page
        window.history.pushState(null, '', '/');
      }
    };

    const handleBackButton = (e: PopStateEvent) => {
      // If on root, prevent back (would exit app)
      if (location.pathname === '/') {
        e.preventDefault();
        window.history.pushState(null, '', '/');
      }
      // Otherwise, browser handles navigation naturally
    };

    // Android back button
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handleBackButton);
    
    // Push initial state to prevent immediate exit
    if (location.pathname === '/') {
      window.history.pushState(null, '', '/');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [location]);
};
