import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('user_token');
  return token ? <Navigate to="/dashboard" replace /> : children;
};

export default PublicRoute;