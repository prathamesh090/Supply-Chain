import { useCallback, useEffect, useState } from 'react';
import { getAuthSession, getToken, removeToken, storeAuthSession, storeToken, type AuthSession } from '@/lib/api';

const AUTH_CHANGE_EVENT = 'chainlink-auth-change';

export const emitAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()));

  const syncAuth = useCallback(() => {
    setIsAuthenticated(Boolean(getToken()));
    setSession(getAuthSession());
  }, []);

  useEffect(() => {
    syncAuth();
    const onStorage = () => syncAuth();
    const onCustom = () => syncAuth();

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_CHANGE_EVENT, onCustom);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_CHANGE_EVENT, onCustom);
    };
  }, [syncAuth]);

  const login = useCallback((token: string, payload?: Omit<AuthSession, 'token'>) => {
    if (payload) {
      storeAuthSession({ token, ...payload });
    } else {
      storeToken(token);
    }
    emitAuthChange();
  }, []);

  const logout = useCallback(() => {
    removeToken();
    emitAuthChange();
  }, []);

  return { isAuthenticated, session, role: session?.role, login, logout };
}
