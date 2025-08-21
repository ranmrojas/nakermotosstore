'use client';

import { useEffect } from 'react';
import { usePreload } from '../../../hooks/usePreload';
import { preloadService } from '../../../lib/preloadService';
import { usePathname } from 'next/navigation';

interface PreloadOptimizerProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

export default function PreloadOptimizer({ 
  children, 
  autoStart = true 
}: PreloadOptimizerProps) {
  const { isPreloadComplete, isPreloading, startPreload } = usePreload();
  const pathname = usePathname();

  useEffect(() => {
    const shouldStartPreload = autoStart && !isPreloadComplete && !isPreloading;
    
    if (shouldStartPreload) {
      console.log('🚀 PreloadOptimizer: Iniciando preload automático...');
      
      // Iniciar preload en segundo plano
      startPreload().catch(error => {
        console.error('Error en preload automático:', error);
      });
    }
  }, [autoStart, isPreloadComplete, isPreloading, startPreload, pathname]);

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