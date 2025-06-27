'use client';

import React from 'react';

interface SkeletonGridProps {
  count?: number;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

/**
 * Componente SkeletonGrid reutilizable para mostrar skeletons de productos
 * 
 * @example
 * // Uso básico - 20 productos con grid responsivo por defecto
 * <SkeletonGrid />
 * 
 * @example
 * // Personalizar cantidad y columnas
 * <SkeletonGrid 
 *   count={12} 
 *   columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
 * />
 * 
 * @example
 * // Para móviles - 1 columna, tablets - 2 columnas, desktop - 3 columnas
 * <SkeletonGrid 
 *   count={6} 
 *   columns={{ sm: 1, md: 2, lg: 3 }}
 *   className="mt-4"
 * />
 */
export default function SkeletonGrid({ 
  count = 20, 
  columns = { sm: 2, md: 3, lg: 4, xl: 6 },
  className = ""
}: SkeletonGridProps) {
  const gridClasses = `grid grid-cols-2 sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl} gap-2 sm:gap-4`;

  return (
    <div className={`${gridClasses} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center p-1 sm:p-2 h-full min-h-[180px]"
        >
          <div className="flex flex-col items-center w-full h-full">
            {/* Skeleton para la imagen */}
            <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-t-lg mb-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"></div>
              {/* Simular algunos detalles de la imagen */}
              <div className="absolute top-1 left-1 w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="absolute top-1 right-1 w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            </div>
            
            {/* Skeleton para el contenido */}
            <div className="flex-1 w-full flex flex-col justify-between items-center p-2 pb-1">
              {/* Skeleton para el título */}
              <div className="w-full mb-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>
              
              {/* Skeleton para la nota (opcional) */}
              <div className="w-full mb-1">
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-pulse"></div>
              </div>
              
              {/* Skeleton para precio y botón */}
              <div className="flex items-center justify-between w-full mt-auto mb-0">
                <div className="flex flex-col mb-0 pb-0">
                  {/* Skeleton para precio principal */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-pulse"></div>
                  {/* Skeleton para precio tachado (opcional) */}
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-12 animate-pulse"></div>
                </div>
                
                {/* Skeleton para botón */}
                <div className="ml-2 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>
              
              {/* Skeleton para SKU */}
              <div className="w-full text-right mt-1">
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-12 ml-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
