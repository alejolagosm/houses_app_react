import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { db } from '../firebase.config';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

import OAuth from '../components/OAuth';

import { ReactComponent as ArrowRightIcon } from '../assets/svg/keyboardArrowRightIcon.svg';
import visibilityIcon from '../assets/svg/visibilityIcon.svg';

function SignUp() {
  // Set State variables for the component
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  // Destructure variables to use them in the form
  const { name, email, password } = formData;
  // Start navigate hook to redirect
  const navigate = useNavigate();
  // Function to change the form data according to the input from the user
  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Function to submit the form data
  const onSubmit = async e => {
    e.preventDefault();
    // Create new user on the database. This should be improved to verify the email, set a minimum strength for the password, verify that the email doesn´t already exist in the database.
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      updateProfile(auth.currentUser, {
        displayName: name,
      });
      const formDataCopy = { ...formData };
      delete formDataCopy.password;
      formDataCopy.timestamp = serverTimestamp();
      await setDoc(doc(db, 'users', user.uid), formDataCopy);
      navigate('/');
    } catch (err) {
      toast.error('Incorrect user credentials');
    }
  };
  // jsx return
  return (
    <>
      <div className="pageContainer">
        <header>
          <p className="pageHeader">Welcome Back!</p>
        </header>
        <main>
          <form onSubmit={onSubmit}>
            <input
              type="text"
              id="name"
              className="nameInput"
              placeholder="Name"
              value={name}
              onChange={onChange}
            />
            <input
              type="email"
              id="email"
              className="emailInput"
              placeholder="Email"
              value={email}
              onChange={onChange}
            />
            <div className="passwordInputDiv">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="passwordInput"
                placeholder="Password"
                value={password}
                onChange={onChange}
              />
              <img
                src={visibilityIcon}
                alt="ShowPassword"
                className="showPassword"
                onClick={() => setShowPassword(prevState => !prevState)}
              />
            </div>
            <div className="signInBar">
              <p className="signInText">Sign Up</p>
              <button className="signInButton">
                <ArrowRightIcon fill="#ffffff" width="35px" height="35px" />
              </button>
            </div>
          </form>
          <OAuth />
          <Link to="/sign-in" className="registerLink">
            Or, Sign in
            <ArrowRightIcon fill="currentColor" width="35px" height="35px" />
          </Link>
        </main>
      </div>
    </>
  );
}

export default SignUp;
