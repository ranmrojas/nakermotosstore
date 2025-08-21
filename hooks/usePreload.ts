import { useState, useEffect } from 'react';
import { preloadService } from '../lib/preloadService';

interface UsePreloadReturn {
  isPreloadComplete: boolean;
  isPreloading: boolean;
  preloadProgress: number;
  startPreload: () => Promise<void>;
  getPreloadStatus: () => {
    isPreloading: boolean;
    isCompleted: boolean;
    config: any;
  };
}

export const usePreload = (): UsePreloadReturn => {
  const [isPreloadComplete, setIsPreloadComplete] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Verificar estado inicial del preload
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    const checkPreloadStatus = () => {
      try {
        const status = preloadService.getStatus();
        setIsPreloadComplete(status.isCompleted);
        setIsPreloading(status.isPreloading);
      } catch (error) {
        console.error('Error checking preload status:', error);
      }
    };

    // Verificar estado inicial después de un pequeño delay
    const initialCheck = setTimeout(() => {
      checkPreloadStatus();
    }, 100);

    // Verificar estado cada 3 segundos (menos frecuente)
    const interval = setInterval(() => {
      checkPreloadStatus();
    }, 3000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, []); // Sin dependencias para evitar bucle infinito

  // Función para iniciar preload manualmente
  const startPreload = async (): Promise<void> => {
    if (isPreloadComplete || isPreloading) {
      return;
    }

    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setPreloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      await preloadService.startSilentPreload();
      
      clearInterval(progressInterval);
      setPreloadProgress(100);
      setIsPreloadComplete(true);
      
    } catch (error) {
      console.error('Error iniciando preload:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  // Función para obtener estado del preload
  const getPreloadStatus = () => {
    return preloadService.getStatus();
  };

  return {
    isPreloadComplete,
    isPreloading,
    preloadProgress,
    startPreload,
    getPreloadStatus
  };
}; 