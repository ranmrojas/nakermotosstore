import { useState } from 'react';

// Tiempo de expiración: 18 horas en milisegundos
const SESSION_EXPIRATION_MS = 1000 * 60 * 60 * 18;
const SESSION_KEY = 'client_session';

export interface AdminSession {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  createdAt: number;
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      const parsed: AdminSession = JSON.parse(stored);
      if (Date.now() - parsed.createdAt > SESSION_EXPIRATION_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  });

  const saveSession = (admin: Omit<AdminSession, 'createdAt'>) => {
    const sessionData: AdminSession = {
      ...admin,
      createdAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSession(sessionData);
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return {
    session,
    saveSession,
    clearSession,
  };
} 