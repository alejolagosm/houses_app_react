// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA9lH1lkSx2Vhf2FBYAdFqTLZ_L1tLYUjA',
  authDomain: 'inmovil-houses.firebaseapp.com',
  projectId: 'inmovil-houses',
  storageBucket: 'inmovil-houses.appspot.com',
  messagingSenderId: '728375253520',
  appId: '1:728375253520:web:ddefcec0b6308b15714895',
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
