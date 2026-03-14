import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '@/lib/api';

export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return children;
}
