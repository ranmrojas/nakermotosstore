'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getProducts, Product, getProductImageUrl } from '@/app/services/productService';

interface ProductManagerListProps {
  categoryId?: string | number;
  limit?: number;
}

export default function ProductManagerList({ categoryId = '46', limit = 40 }: ProductManagerListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const productsPerPage = 10;

  // Función para cargar productos
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getProducts(categoryId, limit);
      
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts([]);
        setError("No se encontraron productos");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, [categoryId, limit]);

  // Filtrar productos por término de búsqueda
  const filteredProducts = products.filter(product => 
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.nombre_marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.nombre_categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular productos para la página actual
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  
  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calcular páginas totales
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  // URL base para imágenes - ahora usando la función del servicio
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };

  // Verificar disponibilidad
  const isAvailable = (existencias: number, vende_sin_existencia: number) => {
    return existencias > 0 || vende_sin_existencia === 1;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
          Administrador de Productos
        </h1>
        
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetear a la primera página cuando busca
            }}
          />
          <svg 
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-800"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            <p>{error}</p>
            <button 
              onClick={loadProducts}
              className="mt-4 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-800 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Marca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentProducts.length > 0 ? (
                    currentProducts.map((product) => (
                      <tr 
                        key={product.id_producto} 
                        className={`hover:bg-gray-50 ${!isAvailable(product.existencias, product.vende_sin_existencia) ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              {/* Se puede reemplazar con imagen real cuando esté disponible */}
                              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                {product.id_imagen ? (
                                  <Image
                                    src={getImageUrl(product.id_imagen, product.ext1)}
                                    alt={product.nombre}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
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
                                  <span className="text-amber-800 text-xs">{product.nombre.substring(0, 2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {product.id_producto}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${product.precio_venta_online || product.precio_venta}
                          </div>
                          {product.precio_venta_online !== null && product.precio_venta_online !== product.precio_venta && (
                            <div className="text-xs text-gray-500">
                              Normal: ${product.precio_venta}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${isAvailable(product.existencias, product.vende_sin_existencia) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}`}
                          >
                            {product.existencias} {product.vende_sin_existencia === 1 ? '(Siempre disponible)' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.nombre_categoria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.nombre_marca}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No se encontraron productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {filteredProducts.length > productsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstProduct + 1}</span> a <span className="font-medium">
                        {Math.min(indexOfLastProduct, filteredProducts.length)}
                      </span> de <span className="font-medium">{filteredProducts.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50
                          ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* Números de página */}
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => paginate(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${currentPage === i + 1
                              ? 'z-10 bg-amber-800 border-amber-800 text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50
                          ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="sr-only">Siguiente</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resumen */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Total de productos: <span className="font-medium">{filteredProducts.length}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
