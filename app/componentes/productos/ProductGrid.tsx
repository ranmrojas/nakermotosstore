'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getProducts, Product, getProductImageUrl } from '@/app/services/productService';
import Link from 'next/link';

interface ProductGridProps {
  categoryId?: string | number | null;
  limit?: number;
  showAddToCart?: boolean;
}

export default function ProductGrid({ 
  categoryId = null, 
  limit = 1000,
  showAddToCart = true
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };
  
  // Verificar disponibilidad
  const isAvailable = (existencias: number, vende_sin_existencia: number) => {
    return existencias > 0 || vende_sin_existencia === 1;
  };

  // Función para cargar productos
  const loadProducts = useCallback(async (catId: number | null) => {
    if (catId === null) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const categoryIdStr = catId.toString();
      const data = await getProducts(categoryIdStr, limit);
      const availableProducts = data.filter(
        product => isAvailable(product.existencias, product.vende_sin_existencia)
      );
      setProducts(availableProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Cargar productos cuando cambie la categoría
  useEffect(() => {
    if (categoryId !== null && categoryId !== undefined) {
      loadProducts(typeof categoryId === 'string' ? parseInt(categoryId) : categoryId as number);
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [categoryId, loadProducts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-800 dark:border-amber-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => {
            if (categoryId !== null) {
              loadProducts(typeof categoryId === 'string' ? parseInt(categoryId) : categoryId as number);
            }
          }}
          className="px-4 py-2 bg-amber-800 dark:bg-amber-600 text-white rounded-lg hover:bg-amber-900 dark:hover:bg-amber-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Grid de productos */}
      {products.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No hay productos disponibles en esta categoría
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Intenta seleccionar otra categoría
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
          {products.map((product) => (
            <div
              key={product.id_producto}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center p-1 sm:p-2 h-full min-h-[180px] hover:shadow-md transition-shadow"
            >
              <Link href={`/tienda/producto/${product.id_producto}`} className="flex flex-col items-center w-full h-full">
                <div className="relative w-full aspect-square">
                  <Image
                    src={product.id_imagen ? getImageUrl(product.id_imagen, product.ext1) : '/file.svg'}
                    alt={product.nombre}
                    fill
                    className="object-cover w-full h-full rounded-t-lg"
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (product.ext2 && product.ext2 !== product.ext1) {
                        target.src = getImageUrl(product.id_imagen, product.ext2);
                        target.onerror = () => {
                          target.src = '/file.svg';
                          target.onerror = null;
                        };
                      } else {
                        target.src = '/file.svg';
                      }
                    }}
                  />
                  {/* Icono de compartir sobre la imagen */}
                  <button
                    className="absolute top-1 right-1 z-10 p-1 bg-white/80 dark:bg-gray-900/80 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
                    title="Compartir"
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(`${window.location.origin}/tienda/producto/${product.id_producto}`);
                      setCopiedId(product.id_producto);
                      setTimeout(() => setCopiedId(null), 1200);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="18" cy="5" r="2" />
                      <circle cx="6" cy="12" r="2" />
                      <circle cx="18" cy="19" r="2" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                  {copiedId === product.id_producto && (
                    <span className="absolute top-2 right-8 z-20 text-xs text-amber-600 dark:text-amber-400 bg-white/90 dark:bg-gray-900/90 px-2 py-0.5 rounded shadow">¡Copiado!</span>
                  )}
                </div>
                <div className="flex-1 w-full flex flex-col justify-between items-center p-2">
                  <h3 className="text-xs font-medium text-center text-gray-900 dark:text-white line-clamp-2 w-full mb-1 min-h-[2.2em]">
                    {product.nombre}
                  </h3>
                  <div className="flex items-center justify-between w-full mt-auto">
                    <span className="text-amber-700 dark:text-amber-400 font-bold text-sm">
                      ${((product.precio_venta_online || product.precio_venta) ?? 0).toLocaleString('es-CO')}
                    </span>
                    {showAddToCart && (
                      <button
                        className="ml-2 w-6 h-6 flex items-center justify-center bg-amber-600 dark:bg-amber-500 text-white rounded hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
                        aria-label={`Añadir ${product.nombre} al carrito`}
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Producto ${product.nombre} añadido al carrito`);
                        }}
                      >
                        {/* Icono de carrito moderno */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {product.precio_venta_online !== null && product.precio_venta_online !== product.precio_venta && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs line-through mt-1">
                      ${product.precio_venta?.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
