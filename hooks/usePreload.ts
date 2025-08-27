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
  const [isClient, setIsClient] = useState(false);

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Verificar estado inicial del preload
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (!isClient) return;

    const checkPreloadStatus = () => {
      try {
        const status = preloadService.getStatus();
        setIsPreloadComplete(status.isCompleted);
        setIsPreloading(status.isPreloading);
      } catch (error) {
        console.error('Error checking preload status:', error);
      }
    };

    // Verificar estado inicial después de un delay más largo para móviles
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const initialDelay = isMobile ? 2000 : 500;
    
    const initialCheck = setTimeout(() => {
      checkPreloadStatus();
    }, initialDelay);

    // Verificar estado cada 5 segundos (menos frecuente para móviles)
    const interval = setInterval(() => {
      checkPreloadStatus();
    }, 5000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [isClient]); // Dependencia en isClient

  // Función para iniciar preload manualmente
  const startPreload = async (): Promise<void> => {
    if (!isClient || isPreloadComplete || isPreloading) {
      return;
    }

    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      // Simular progreso más lento para móviles
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const progressInterval = setInterval(() => {
        setPreloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + (isMobile ? 5 : 10);
        });
      }, isMobile ? 1000 : 500);

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