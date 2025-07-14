import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ 
  children, 
  allowedUserTypes = [], 
  fallbackPath = '/' 
}) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const user = isAuthenticated ? JSON.parse(localStorage.getItem('user')) : null;
  const userType = user?.userType;

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user type is allowed
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
    // Redirect to appropriate default page based on user type
    const defaultPath = userType === 'employee' ? '/onboarding' : '/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute; 