import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

import OAuth from '../components/OAuth';

import { ReactComponent as ArrowRightIcon } from '../assets/svg/keyboardArrowRightIcon.svg';
import visibilityIcon from '../assets/svg/visibilityIcon.svg';

function SignIn() {
  // Set State variables for the component
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  // Destructure variables to use them in the form
  const { email, password } = formData;
  // Start navigate hook to redirect
  const navigate = useNavigate();
  // Function to change the form data according to the input from the user
  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      // get the correct input (either email or password)
      // This works as long as each field has an id with a name equal to a key of the formData object
      [e.target.id]: e.target.value,
    }));
  };

  // Function to submit the form data
  const onSubmit = async e => {
    e.preventDefault();
    // Confirm the user credentials from the database
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        navigate('/');
      }
    } catch (err) {
      toast.error('Incorrect user credentials');
    }
  };
  // jsx return to render the component
  return (
    <>
      <div className="pageContainer">
        <header>
          <p className="pageHeader">Welcome Back!</p>
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
            <Link to="/forgot-password" className="forgotPasswordLink">
              Forgot Password?
            </Link>
            <div className="signInBar">
              <p className="signInText">Sign In</p>
              <button className="signInButton">
                <ArrowRightIcon fill="#ffffff" width="35px" height="35px" />
              </button>
            </div>
          </form>

          <OAuth />

          <Link to="/sign-up" className="registerLink">
            Or, Sign Up
            <ArrowRightIcon fill="currentColor" width="35px" height="35px" />
          </Link>
        </main>
      </div>
    </>
  );
}

export default SignIn;
