"use client";

import { useEffect, useState } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationSafe({ children, fallback }: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Mantener el contenido visible durante la hidratación para evitar pantalla en blanco en móviles.
  if (!isHydrated && fallback !== undefined) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
