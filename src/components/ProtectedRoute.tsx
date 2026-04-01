import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession, getToken, type UserRole } from '@/lib/api';

export function ProtectedRoute({ children, roles }: { children: React.ReactElement; roles?: UserRole[] }) {
  const location = useLocation();
  const token = getToken();
  const session = getAuthSession();

  if (!token) {
    const supplierPath = location.pathname.startsWith('/supplier');
    return <Navigate to={supplierPath ? '/signin/supplier' : '/signin/manufacturer'} replace state={{ from: location.pathname }} />;
  }
  if (!session) {
    return <Navigate to="/auth/select?mode=signin" replace />;
  }

  if (roles && !roles.includes(session.role)) {
    return <Navigate to={session.role === 'supplier' ? '/supplier-dashboard' : '/dashboard'} replace />;
  }

  return children;
}
