'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import SidebarCategories from './SidebarCategories';
import ProductGrid from './ProductGrid';
import { useCategorias } from '../../../hooks/useCategorias';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductGridWithSidebarProps {
  defaultCategoryId?: number | null;
  showAddToCart?: boolean;
}

export interface ProductGridWithSidebarRef {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const ProductGridWithSidebar = forwardRef<ProductGridWithSidebarRef, ProductGridWithSidebarProps>(({ 
  defaultCategoryId = null,
  showAddToCart = true
}, ref) => {
  // Estado para manejar la categoría seleccionada
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(defaultCategoryId);
  // Estado para controlar si el sidebar está abierto
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Obtener categorías usando el hook
  const { categorias, loading: categoriasLoading } = useCategorias();

  // Exponer funciones para controlar el sidebar desde el ButtonNav
  useImperativeHandle(ref, () => ({
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false)
  }), [sidebarOpen]);

  // Efecto para seleccionar una categoría por defecto si no hay ninguna seleccionada
  useEffect(() => {
    if (selectedCategoryId === null && !categoriasLoading && categorias.length > 0) {
      const categoriasPrincipales = categorias.filter(cat => 
        cat.activa && (cat.categoriaPadreId === null || cat.categoriaPadreId === undefined)
      );
      if (categoriasPrincipales.length > 0) {
        setSelectedCategoryId(categoriasPrincipales[0].id);
      } else {
        const categoriasActivas = categorias.filter(cat => cat.activa);
        if (categoriasActivas.length > 0) {
          setSelectedCategoryId(categoriasActivas[0].id);
        }
      }
    }
  }, [categorias, categoriasLoading, selectedCategoryId]);

  // Manejador para cuando se selecciona una categoría en el sidebar
  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId !== null) {
      setSelectedCategoryId(categoryId);
      setSidebarOpen(false);
    }
  };

  // Obtener el nombre y cantidad de productos de la categoría seleccionada
  const selectedCategory = categorias.find(cat => cat.id === selectedCategoryId);

  // Para mostrar la cantidad de productos, se puede pasar como prop o calcular desde el grid si se requiere precisión.

  return (
    <div className="relative">
      {/* Sidebar flotante */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64 lg:w-72 md:shadow-none md:z-auto md:mr-6
      `}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Categorías
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarCategories 
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategoryId}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="md:ml-0">
        {selectedCategoryId !== null ? (
          <div>
            {/* Título sutil con nombre de la categoría y cantidad de productos */}
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {selectedCategory ? selectedCategory.nombre : 'Productos'}
              </h2>
              {/* Aquí puedes pasar la cantidad real de productos si la tienes, por ahora solo ejemplo */}
              <span className="text-xs text-gray-400 font-normal">
                {/* Puedes reemplazar 0 por la cantidad real si la tienes */}
                {/* Ejemplo: `${products.length} productos disponibles` */}
                {/* Si no tienes el dato, puedes dejarlo vacío o mostrar un guion */}
                {/* 13 productos disponibles */}
              </span>
            </div>
            <ProductGrid 
              categoryId={selectedCategoryId}
              limit={1000}
              showAddToCart={showAddToCart}
            />
          </div>
        ) : (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Selecciona una categoría
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Elige una categoría del menú lateral para ver los productos disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

ProductGridWithSidebar.displayName = 'ProductGridWithSidebar';

export default ProductGridWithSidebar;
