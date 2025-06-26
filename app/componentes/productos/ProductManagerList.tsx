'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getProducts, Product, getProductImageUrl } from '@/app/services/productService';
import { useCategorias } from '../../../hooks/useCategorias';

interface ProductManagerListProps {
  categoryId?: string | number;
  limit?: number;
  showCategorySelector?: boolean;
  defaultCategoryId?: number;
}

export default function ProductManagerList({ 
  categoryId = '46', 
  limit = 50,
  showCategorySelector = false,
  defaultCategoryId = 46
}: ProductManagerListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    typeof categoryId === 'string' ? parseInt(categoryId) : categoryId
  );

  // Hook de categorías
  const { categorias, getCategoriaById, loading: categoriasLoading } = useCategorias();

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };

  // Obtener categoría seleccionada
  const selectedCategoria = getCategoriaById(selectedCategoryId);

  // Función para cargar productos
  const loadProducts = async (catId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getProducts(catId.toString(), limit);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos cuando cambie la categoría seleccionada
  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId);
    }
  }, [selectedCategoryId, limit]);

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
          onClick={() => loadProducts(selectedCategoryId)}
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
              {products.length} productos totales
            </div>
          </div>
          
          {/* Selector de categorías - Menú desplegable */}
          <div className="flex items-center space-x-4">
            <label htmlFor="category-select-admin" className="text-sm font-medium text-gray-700">
              Filtrar por categoría:
            </label>
            <div className="relative">
              <select
                id="category-select-admin"
                value={selectedCategoryId}
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

      {/* Lista de productos */}
      {products.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">
            {selectedCategoria 
              ? `No hay productos en ${selectedCategoria.nombre}`
              : 'No hay productos en esta categoría'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Existencias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id_producto} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.id_imagen ? (
                            <Image
                              src={getImageUrl(product.id_imagen, product.ext1)}
                              alt={product.nombre}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover"
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
                            <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Image
                                src="/file.svg"
                                alt="No imagen"
                                width={20}
                                height={20}
                                className="opacity-30"
                              />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product.id_producto}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.nombre_categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.nombre_marca}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.precio_venta_online || product.precio_venta}
                      </div>
                      {product.precio_venta_online !== null && 
                       product.precio_venta_online !== product.precio_venta && (
                        <div className="text-sm text-gray-500 line-through">
                          ${product.precio_venta}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.existencias}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.existencias > 0 || product.vende_sin_existencia === 1
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.existencias > 0 || product.vende_sin_existencia === 1 ? 'Disponible' : 'Agotado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-amber-600 hover:text-amber-900 mr-3">
                        Editar
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
