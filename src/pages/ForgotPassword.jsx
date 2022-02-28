import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { ReactComponent as ArrowRightIcon } from '../assets/svg/keyboardArrowRightIcon.svg';

import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

function ForgotPassword() {
  // Set State variables
  const [email, setEmail] = useState('');

  // Function to update the email according to the user input
  const onChange = e => {
    setEmail(e.target.value);
  };

  // Function to submit the form
  const onSubmit = async e => {
    e.preventDefault();
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      toast.success('Email was sent');
    } catch (error) {
      toast.error('Unable to send reset email');
    }
  };
  // jsx return to render the component
  return (
    <div className="pageContainer">
      <header>
        <p className="pageHeader">Forgot your Password?</p>
      </header>
      <main>
        <form onSubmit={onSubmit}>
          <input
            type="email"
            id="email"
            className="emailInput"
            placeholder="Email"
            value={email}
            onChange={onChange}
          />
          <div className="signInBar">
            <h2 className="signInText">Send Reset Link</h2>
            <button className="signInButton">
              <ArrowRightIcon fill="#ffffff" width="35px" height="35px" />
            </button>
          </div>
        </form>
        <Link className="forgotPasswordLink" to="/sign-in">
          Sign in
        </Link>
      </main>
    </div>
  );
}

export default ForgotPassword;
