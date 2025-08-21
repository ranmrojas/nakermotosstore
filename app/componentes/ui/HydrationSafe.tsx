"use client";

import { useEffect, useState } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Durante SSR o antes de la hidratación, mostrar fallback
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  // Después de la hidratación, mostrar el contenido real
  return <>{children}</>;
}
