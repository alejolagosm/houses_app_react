import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStatus } from '../hooks/useAuthStatus';

import Spinner from './Spinner';
// Private Route component to redirect a logged in user to the profile, and any other user to the sign-in page
const PrivateRoute = () => {
  // Set State Variables
  const { loggedIn, loading } = useAuthStatus();

  // Show Loading Component
  if (loading) {
    return (
      <div>
        <h3>Loading User Details...</h3>
        <Spinner />
      </div>
    );
  }

  // jsx return
  return loggedIn ? <Outlet /> : <Navigate to="/sign-in" />;
};

export default PrivateRoute;
