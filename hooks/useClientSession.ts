'use client';
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Tiempo de expiración: 6 meses en milisegundos
const SESSION_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 30 * 6;
const SESSION_KEY = 'client_session';

import { DireccionesGuardadas } from '../types/direcciones';

export interface ClientSession {
  id: number;
  telefono: string;
  nombre: string;
  direccion: string;
  valordomicilio: number;
  direccionesGuardadas?: DireccionesGuardadas;
  createdAt: number;
}

interface UseClientSessionReturn {
  session: ClientSession | null;
  saveSession: (client: Omit<ClientSession, 'createdAt'>) => void;
  clearSession: () => void;
}

const ClientSessionContext = createContext<UseClientSessionReturn | undefined>(undefined);

export function useClientSession(): UseClientSessionReturn {
  const context = useContext(ClientSessionContext);
  if (context === undefined) {
    throw new Error('useClientSession debe ser usado dentro de un ClientSessionProvider');
  }
  return context;
}

export function ClientSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ClientSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      const parsed: ClientSession = JSON.parse(stored);
      // Validar expiración
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

  // Guardar sesión
  const saveSession = (client: Omit<ClientSession, 'createdAt'>) => {
    const sessionData: ClientSession = {
      ...client,
      createdAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSession(sessionData);
  };

  // Eliminar sesión
  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const value: UseClientSessionReturn = {
    session,
    saveSession,
    clearSession,
  };

  return React.createElement(ClientSessionContext.Provider, { value }, children);
} 