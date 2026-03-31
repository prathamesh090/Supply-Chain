import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession, getToken, type UserRole } from '@/lib/api';

export function ProtectedRoute({ children, roles }: { children: React.ReactElement; roles?: UserRole[] }) {
  const location = useLocation();
  const token = getToken();
  const session = getAuthSession();

  if (!token) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (roles && session && !roles.includes(session.role)) {
    return <Navigate to={session.role === 'supplier' ? '/supplier-dashboard' : '/dashboard'} replace />;
  }

  return children;
}
