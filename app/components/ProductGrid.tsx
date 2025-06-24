'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getProducts, Product, getProductImageUrl } from '@/app/services/productService';
import Link from 'next/link';

interface ProductGridProps {
  categoryId?: string | number;
  limit?: number;
  showAddToCart?: boolean;
}

export default function ProductGrid({ 
  categoryId = '46', 
  limit = 20,
  showAddToCart = true
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };
  
  // Verificar disponibilidad
  const isAvailable = (existencias: number, vende_sin_existencia: number) => {
    return existencias > 0 || vende_sin_existencia === 1;
  };
  
  // Función para cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await getProducts(categoryId, limit);
        
        // Filtrar solo productos disponibles para mostrar en la tienda
        const availableProducts = data.filter(
          product => isAvailable(product.existencias, product.vende_sin_existencia)
        );
        
        setProducts(availableProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [categoryId, limit]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">No hay productos disponibles en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div 
          key={product.id_producto}
          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <Link href={`/tienda/producto/${product.id_producto}`}>
            <div className="h-48 overflow-hidden relative flex items-center justify-center bg-gray-100">
              {product.id_imagen ? (
                <Image
                  src={getImageUrl(product.id_imagen, product.ext1)}
                  alt={product.nombre}
                  width={200}
                  height={200}
                  className="object-contain"
                  unoptimized={true} // Evita que Next.js optimice la imagen externa
                  onError={(e) => {
                    // Fallback cuando la imagen no carga
                    const target = e.target as HTMLImageElement;
                    
                    // Si hay ext2, intentamos con esa extensión alternativa
                    if (product.ext2 && product.ext2 !== product.ext1) {
                      target.src = getImageUrl(product.id_imagen, product.ext2);
                      
                      // Añadimos otro manejador de error para el segundo intento
                      target.onerror = () => {
                        target.src = '/file.svg';
                        target.onerror = null; // Evitar bucle infinito
                      };
                    } else {
                      // Si no hay ext2, usamos imagen por defecto
                      target.src = '/file.svg';
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Image
                    src="/file.svg"
                    alt="No imagen"
                    width={50}
                    height={50}
                    className="opacity-30"
                  />
                </div>
              )}
              
              {/* Etiqueta de marca */}
              <span className="absolute top-2 left-2 bg-amber-800 text-white text-xs px-2 py-1 rounded">
                {product.nombre_marca}
              </span>
              
              {/* Etiqueta de categoría */}
              <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                {product.nombre_categoria}
              </span>
            </div>
          </Link>

          <div className="p-4">
            <Link href={`/tienda/producto/${product.id_producto}`} className="block">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-14">
                {product.nombre}
              </h3>
            </Link>
            
            <div className="flex justify-between items-center mt-4">
              <div>
                <p className="text-amber-800 font-bold text-xl">
                  ${product.precio_venta_online || product.precio_venta}
                </p>
                {product.precio_venta_online !== null && 
                 product.precio_venta_online !== product.precio_venta && (
                  <p className="text-gray-500 text-sm line-through">
                    ${product.precio_venta}
                  </p>
                )}
              </div>
              
              {showAddToCart && (
                <button 
                  className="px-3 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900 transition-colors"
                  aria-label={`Añadir ${product.nombre} al carrito`}
                  onClick={(e) => {
                    e.preventDefault();
                    // Aquí implementarías la lógica para añadir al carrito
                    alert(`Producto ${product.nombre} añadido al carrito`);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
