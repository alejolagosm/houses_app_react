import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import Spinner from './Spinner';

import { useAuthStatus } from '../hooks/useAuthStatus';

const PrivateRoute = () => {
  const { loggedIn, loading } = useAuthStatus();

  if (loading) {
    return (
      <div>
        <h3>Loading User Details...</h3>
        <Spinner />
      </div>
    );
  }

  return loggedIn ? <Outlet /> : <Navigate to="/sign-in" />;
};

export default PrivateRoute;
