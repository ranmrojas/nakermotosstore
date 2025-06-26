'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getProducts, Product, getProductImageUrl } from '@/app/services/productService';
import { useCategorias } from '../../../hooks/useCategorias';
import Link from 'next/link';

interface ProductGridProps {
  categoryId?: string | number | null;
  limit?: number;
  showAddToCart?: boolean;
  showCategorySelector?: boolean;
  defaultCategoryId?: number | null;
}

export default function ProductGrid({ 
  categoryId = null, 
  limit = 20,
  showAddToCart = true,
  showCategorySelector = false,
  defaultCategoryId = null
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Hook de categorías
  const { categorias, getCategoriaById, loading: categoriasLoading } = useCategorias();

  // Cuando las categorías se cargan, seleccionar la primera si no hay una seleccionada
  useEffect(() => {
    if (!categoriasLoading && categorias.length > 0 && selectedCategoryId === null) {
      // Si hay una categoría especificada como prop, usarla
      if (categoryId !== null) {
        setSelectedCategoryId(typeof categoryId === 'string' ? parseInt(categoryId) : categoryId as number);
      } 
      // Si hay un defaultCategoryId, usarlo
      else if (defaultCategoryId !== null) {
        setSelectedCategoryId(defaultCategoryId);
      }
      // Si no, usar la primera categoría disponible
      else {
        setSelectedCategoryId(categorias[0].id);
      }
    }
  }, [categorias, categoriasLoading, categoryId, defaultCategoryId, selectedCategoryId]);

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };
  
  // Verificar disponibilidad
  const isAvailable = (existencias: number, vende_sin_existencia: number) => {
    return existencias > 0 || vende_sin_existencia === 1;
  };

  // Obtener categoría seleccionada
  const selectedCategoria = selectedCategoryId !== null ? getCategoriaById(selectedCategoryId) : undefined;
  
  // Función para cargar productos
  const loadProducts = async (catId: number | null) => {
    if (catId === null) {
      console.log('ProductGrid - loadProducts: catId es null, no se cargarán productos');
      return;
    }
    
    console.log(`ProductGrid - Cargando productos para categoría ID: ${catId}`);
    setLoading(true);
    setError(null);
    
    try {
      // Asegurarse de que catId sea un string para la URL
      const categoryIdStr = catId.toString();
      console.log(`ProductGrid - URL API: /api/extract/products?id_categoria=${categoryIdStr}&limite=${limit}`);
      
      const data = await getProducts(categoryIdStr, limit);
      console.log(`ProductGrid - Productos recibidos: ${data.length}`);
      
      // Filtrar solo productos disponibles para mostrar en la tienda
      const availableProducts = data.filter(
        product => isAvailable(product.existencias, product.vende_sin_existencia)
      );
      
      console.log(`ProductGrid - Productos disponibles: ${availableProducts.length}`);
      setProducts(availableProducts);
    } catch (err) {
      console.error('ProductGrid - Error al cargar productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos cuando cambie la categoría seleccionada
  useEffect(() => {
    console.log('ProductGrid - Categoría seleccionada cambió a:', selectedCategoryId);
    
    // Si tenemos un categoryId directo como prop, usarlo primero
    if (categoryId !== null && categoryId !== undefined) {
      console.log('ProductGrid - Usando categoryId de props:', categoryId);
      loadProducts(typeof categoryId === 'string' ? parseInt(categoryId) : categoryId as number);
    }
    // Si no, usar el selectedCategoryId del estado interno
    else if (selectedCategoryId !== null) {
      console.log('ProductGrid - Usando selectedCategoryId del estado:', selectedCategoryId);
      loadProducts(selectedCategoryId);
    }
    // Si no hay ninguna categoría seleccionada, mostrar mensaje
    else {
      console.log('ProductGrid - No hay categoría seleccionada');
      setLoading(false);
      setProducts([]);
    }
  }, [categoryId, selectedCategoryId, limit]);

  // Manejar cambio de categoría
  const handleCategoryChange = (newCategoryId: number) => {
    setSelectedCategoryId(newCategoryId);
  };

  if (categoriasLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-800"></div>
      </div>
    );
  }

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
          onClick={() => {
            if (selectedCategoryId !== null) {
              loadProducts(selectedCategoryId);
            } else if (categorias.length > 0) {
              // Si no hay categoría seleccionada, usar la primera disponible
              const firstCategoryId = categorias[0].id;
              setSelectedCategoryId(firstCategoryId);
              loadProducts(firstCategoryId);
            }
          }}
          className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Selector de categorías (opcional) */}
      {showCategorySelector && categorias.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCategoria ? selectedCategoria.nombre : 'Productos'}
            </h2>
            <div className="text-sm text-gray-500">
              {products.length} productos disponibles
            </div>
          </div>
          
          {/* Selector de categorías - Menú desplegable */}
          <div className="flex items-center space-x-4">
            <label htmlFor="category-select" className="text-sm font-medium text-gray-700">
              Filtrar por categoría:
            </label>
            <div className="relative">
              <select
                id="category-select"
                value={selectedCategoryId !== null ? selectedCategoryId : ''}
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
                className="block w-64 px-4 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de productos */}
      {products.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">
            {selectedCategoria 
              ? `No hay productos disponibles en ${selectedCategoria.nombre}`
              : 'No hay productos disponibles en esta categoría'
            }
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
