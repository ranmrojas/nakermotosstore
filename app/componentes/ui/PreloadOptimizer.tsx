'use client';

import { useEffect, useState } from 'react';
import { usePreload } from '../../../hooks/usePreload';
import { preloadService } from '../../../lib/preloadService';
import { usePathname } from 'next/navigation';

interface PreloadOptimizerProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

export default function PreloadOptimizer({ 
  children, 
  autoStart = false 
}: PreloadOptimizerProps) {
  const { isPreloadComplete, isPreloading, startPreload } = usePreload();
  const pathname = usePathname();
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // Detectar si es un dispositivo móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Para móviles, esperar más tiempo antes de iniciar el preload
    const delay = isMobile ? 3000 : 1000;
    
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const shouldStartPreload = autoStart && 
                              isPageReady && 
                              !isPreloadComplete && 
                              !isPreloading;
    
    if (shouldStartPreload) {
      console.log('🚀 PreloadOptimizer: Iniciando preload automático...');
      
      // Iniciar preload en segundo plano con manejo de errores mejorado
      startPreload().catch(error => {
        console.error('Error en preload automático:', error);
        // No reintentar automáticamente para evitar bucles infinitos
      });
    }
  }, [autoStart, isPreloadComplete, isPreloading, startPreload, pathname, isPageReady]);

  // Este componente no renderiza nada visible, solo optimiza el preload
  return <>{children}</>;
}

// Hook para usar en componentes que necesiten saber el estado del preload
export const usePreloadStatus = () => {
  const { isPreloadComplete, isPreloading, preloadProgress } = usePreload();
  
  return {
    isPreloadComplete,
    isPreloading,
    preloadProgress,
    // Función para verificar si los datos están listos para una página específica
    isDataReady: () => {
      if (isPreloadComplete) return true;
      
      // Si no está completo, verificar si al menos las categorías están cargadas
      const status = preloadService.getStatus();
      return status.isCompleted || !status.isPreloading;
    }
  };
}; 