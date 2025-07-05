"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import axios from 'axios';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    rol: 'operador' as 'admin' | 'operador'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError('Usuario y contraseña son requeridos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(username, password);
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Error en el login');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error en el login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!registerData.username || !registerData.password || !registerData.nombre) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (registerData.password.length < 5) {
      setError('La contraseña debe tener al menos 5 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post('/api/auth/register', {
        username: registerData.username,
        password: registerData.password,
        nombre: registerData.nombre,
        rol: registerData.rol
      });

      setSuccess('Usuario registrado correctamente. Puedes iniciar sesión ahora.');
      
      // Limpiar formulario
      setRegisterData({
        username: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        rol: 'operador'
      });
      
      // Cambiar a login después de 2 segundos
      setTimeout(() => {
        setShowRegister(false);
      }, 2000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && error.response 
        ? (error.response as { data?: { error?: string } })?.data?.error || 'Error al registrar usuario'
        : 'Error al registrar usuario';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Ya redirigirá en el useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Panel Administrativo
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {showRegister ? 'Registra una nueva cuenta' : 'Ingresa tus credenciales para continuar'}
            </p>
          </div>

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
          
          {/* Formulario de Login */}
          {!showRegister && (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Usuario
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Ingresa tu usuario"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Ingresa tu contraseña"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !username || !password}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-sm text-purple-600 hover:text-purple-500 transition-colors"
                >
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              </div>
            </form>
          )}

          {/* Formulario de Registro */}
          {showRegister && (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700">
                    Usuario
                  </label>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Ingresa un nombre de usuario"
                  />
                </div>

                <div>
                  <label htmlFor="reg-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    id="reg-nombre"
                    name="nombre"
                    type="text"
                    required
                    value={registerData.nombre}
                    onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
                
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Mínimo 5 caracteres"
                  />
                </div>

                <div>
                  <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmar Contraseña
                  </label>
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Confirma tu contraseña"
                  />
                </div>

                <div>
                  <label htmlFor="reg-rol" className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    id="reg-rol"
                    name="rol"
                    value={registerData.rol}
                    onChange={(e) => setRegisterData({ ...registerData, rol: e.target.value as 'admin' | 'operador' })}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !registerData.username || !registerData.password || !registerData.nombre || !registerData.confirmPassword}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </div>
                  ) : (
                    'Registrarse'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-500 transition-colors"
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 