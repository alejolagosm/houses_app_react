import React from 'react';
import { useEffect, useState, useRef } from 'react';

import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Personalized hook to get the Auth Status from the user to show the private "Profile" route only when the user is logged in
export const useAuthStatus = () => {
  // Create State Variables
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  //   This avoids memory leaks when loading the component
  const isMounted = useRef(true);
  // Keep the user logged in when the auth credentials match the existing database
  useEffect(() => {
    if (isMounted) {
      const auth = getAuth();
      onAuthStateChanged(auth, user => {
        if (user) {
          setLoggedIn(true);
        }
        setLoading(false);
      });
    }
    return () => {
      isMounted.current = false;
    };
  }, [isMounted]);

  // Return for the hook
  return { loggedIn, loading };
};
