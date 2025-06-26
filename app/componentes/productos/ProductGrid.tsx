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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };
  
  // Verificar disponibilidad
  const isAvailable = (existencias: number, vende_sin_existencia: number) => {
    return existencias > 0 || vende_sin_existencia === 1;
  };

  // Función para abrir el modal
  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
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
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center p-1 sm:p-2 h-full min-h-[180px] hover:shadow-md transition-shadow cursor-pointer"
              style={{ paddingBottom: 0 }}
              onClick={() => openModal(product)}
            >
              <div className="flex flex-col items-center w-full h-full">
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
                  {/* Tag de OFERTA cuando hay descuento */}
                  {product.precio_venta_online !== null && product.precio_venta_online < product.precio_venta && (
                    <div className="absolute top-1 left-1 z-10 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                      OFERTA
                    </div>
                  )}
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
                <div className="flex-1 w-full flex flex-col justify-between items-center p-2 pb-1">
                  <h3 className="text-xs font-medium text-center text-gray-900 dark:text-white line-clamp-2 w-full mb-1 min-h-[2.2em]">
                    {product.nombre}
                  </h3>
                  <div className="flex items-center justify-between w-full mt-auto mb-0">
                    <div className="flex flex-col mb-0 pb-0">
                      <span className={`${product.precio_venta_online !== null && product.precio_venta_online < product.precio_venta ? 'text-green-600 dark:text-green-400 text-base font-bold' : 'text-amber-700 dark:text-amber-400 font-bold text-sm'}`}>
                        ${(product.precio_venta_online !== null 
                          ? product.precio_venta_online 
                          : product.precio_venta)?.toLocaleString('es-CO')}
                      </span>
                      {product.precio_venta_online !== null && product.precio_venta_online < product.precio_venta && (
                        <span className="text-red-400 dark:text-red-300 text-xs line-through font-medium" style={{ fontSize: '0.8rem', marginTop: '-2px' }}>
                          ${product.precio_venta?.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                    {showAddToCart && product.existencias > 0 ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const message = `Hola, quiero pedir:
1 ${product.nombre}
Valor: $${(product.precio_venta_online !== null 
            ? product.precio_venta_online 
            : product.precio_venta)?.toLocaleString('es-CO')}
sku: ${product.sku || '000'}

¿Cuál sería el valor del domicilio?`;
                          window.open(`https://wa.me/573043668910?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="ml-2 w-8 h-8 flex items-center justify-center bg-amber-600 dark:bg-amber-500 text-white rounded-full hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
                        aria-label={`Pedir ${product.nombre} por WhatsApp`}
                      >
                        {/* Icono de suma moderno */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="currentColor" className="text-amber-600 dark:bg-amber-500" />
                          <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    ) : product.existencias <= 0 ? (
                      <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-full font-medium">
                        Agotado
                      </span>
                    ) : null}
                  </div>
                  {product.sku && (
                    <div className="w-full text-right text-gray-400 dark:text-gray-500 text-xs leading-none" style={{marginTop: "2px", marginBottom: 0, paddingBottom: 0}}>
                      sku: {product.sku}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal del producto */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-white/70 dark:bg-gray-800/70 flex items-start justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mt-12 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header del modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalles del producto
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-4">
              {/* Imagen del producto */}
              <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden" style={{ maxHeight: '220px' }}>
                <Image
                  src={selectedProduct.id_imagen ? getImageUrl(selectedProduct.id_imagen, selectedProduct.ext1) : '/file.svg'}
                  alt={selectedProduct.nombre}
                  fill
                  className="object-contain"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (selectedProduct.ext2 && selectedProduct.ext2 !== selectedProduct.ext1) {
                      target.src = getImageUrl(selectedProduct.id_imagen, selectedProduct.ext2);
                      target.onerror = () => {
                        target.src = '/file.svg';
                        target.onerror = null;
                      };
                    } else {
                      target.src = '/file.svg';
                    }
                  }}
                />
                {/* Icono flotante de compartir */}
                <button
                  className="absolute top-2 right-2 z-10 p-1 bg-white/80 dark:bg-gray-900/80 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
                  title="Compartir"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/tienda/producto/${selectedProduct.id_producto}`);
                    alert('¡Enlace copiado al portapapeles!');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="18" cy="5" r="2" />
                    <circle cx="6" cy="12" r="2" />
                    <circle cx="18" cy="19" r="2" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                {/* Tag de OFERTA en el modal cuando hay descuento */}
                {selectedProduct.precio_venta_online !== null && selectedProduct.precio_venta_online < selectedProduct.precio_venta && (
                  <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded shadow-sm">
                    OFERTA
                  </div>
                )}
              </div>
              
              {/* Información del producto */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedProduct.nombre}
                </h3>
                {selectedProduct.nota && (
                  <div className="mt-1 mb-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-200 text-sm font-medium">
                    {selectedProduct.nota}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className={`text-2xl font-bold ${selectedProduct.precio_venta_online !== null && selectedProduct.precio_venta_online < selectedProduct.precio_venta ? 'text-green-600 dark:text-green-400 text-3xl' : ''}`} style={{ color: selectedProduct.precio_venta_online !== null && selectedProduct.precio_venta_online < selectedProduct.precio_venta ? '' : '#ff8c00' }}>
                    ${(selectedProduct.precio_venta_online !== null 
                      ? selectedProduct.precio_venta_online 
                      : selectedProduct.precio_venta)?.toLocaleString('es-CO')}
                  </span>
                  {selectedProduct.precio_venta_online !== null && selectedProduct.precio_venta_online < selectedProduct.precio_venta && (
                    <span className="text-red-400 dark:text-red-300 text-base line-through font-medium ml-2">
                      ${selectedProduct.precio_venta?.toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
                
                {/* Información adicional en una sola línea, bien distribuida */}
                <div className="flex flex-row items-center justify-between gap-2 mt-2 w-full flex-wrap">
                  {selectedProduct.sku && (
                    <span className="text-gray-600 dark:text-gray-400 text-xs font-medium whitespace-nowrap">
                      SKU: <span className="text-gray-900 dark:text-white">{selectedProduct.sku}</span>
                    </span>
                  )}
                  <div className="flex flex-row gap-2 ml-auto">
                    {selectedProduct.nombre_categoria && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs rounded-full font-semibold whitespace-nowrap">
                        {selectedProduct.nombre_categoria}
                      </span>
                    )}
                    {selectedProduct.nombre_marca && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full font-semibold whitespace-nowrap">
                        {selectedProduct.nombre_marca}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
