import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useBackButton = () => {
  const navigate = useNavigate();
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

    const handleBackButton = (e: Event) => {
      e.preventDefault();
      
      // If on root, don't go back (would exit app)
      if (location.pathname === '/') {
        return;
      }

      // Otherwise, navigate back within app
      navigate(-1);
    };

    // Android back button
    window.addEventListener('popstate', handlePopState);
    
    // Push initial state to prevent immediate exit
    if (location.pathname === '/') {
      window.history.pushState(null, '', '/');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location, navigate]);
};
