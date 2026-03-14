import { useCallback, useEffect, useState } from 'react';
import { getToken, removeToken, storeToken } from '@/lib/api';

const AUTH_CHANGE_EVENT = 'chainlink-auth-change';

export const emitAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()));

  const syncAuth = useCallback(() => {
    setIsAuthenticated(Boolean(getToken()));
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

  const login = useCallback((token: string) => {
    storeToken(token);
    emitAuthChange();
  }, []);

  const logout = useCallback(() => {
    removeToken();
    emitAuthChange();
  }, []);

  return { isAuthenticated, login, logout };
}
