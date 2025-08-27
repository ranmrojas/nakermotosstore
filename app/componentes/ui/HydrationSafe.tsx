"use client";

import { useEffect, useState } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marcar que estamos en el cliente
    setIsClient(true);
    
    // Para dispositivos móviles, esperar un poco más antes de marcar como hidratado
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const delay = isMobile ? 100 : 0;
    
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  // Durante SSR o antes de la hidratación, mostrar fallback
  if (!isClient || !isHydrated) {
    return <>{fallback}</>;
  }

  // Después de la hidratación, mostrar el contenido real
  return <>{children}</>;
}
