import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.config';

import googleIcon from '../assets/svg/googleIcon.svg';

// Arrow component for Google Autorization
function OAuth() {
  // Initialize hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Function to verify the google sign in
  const onGoogleClick = async () => {
    try {
      // Start required variables for firebase OAuth
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      //   Check if user already exists in the data base
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      // If the user doesn´t exist, create the user
      if (!docSnap.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
      }
      // Go to home page
      navigate('/');
    } catch (err) {
      toast.error('Sorry, something went wrong.');
    }
  };

  // jsx return for the component
  return (
    <div className="socialLogin">
      <p>Sign {location.pathname === '/sign-up' ? 'up' : 'in'} with</p>
      <button className="socialIcon socialIconDiv" onClick={onGoogleClick}>
        <img className="socialIconImg" src={googleIcon} alt="Google Icon" />
      </button>
    </div>
  );
}

export default OAuth;
