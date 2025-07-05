import { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminUser {
  id: number;
  username: string;
  nombre: string;
  rol: 'admin' | 'operador';
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const checkAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await axios.get('/api/auth/verify');
      
      if (response.data.authenticated) {
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'No autenticado'
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await axios.post('/api/auth/login', { username, password });
      
      if (response.data.success) {
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, error: 'Error en el login' }));
        return { success: false, error: 'Error en el login' };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error en el login';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: 'Error al cerrar sesión' };
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth
  };
} 