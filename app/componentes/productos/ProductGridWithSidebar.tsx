'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import SidebarCategories from './SidebarCategories';
import ProductGrid from './ProductGrid';
import ProductSearch from './ProductSearch';
import { useCategorias } from '../../../hooks/useCategorias';
import { useProductos } from '../../../hooks/useProductos';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Usar la misma interfaz Producto que ProductGrid
interface Producto {
  id_producto: number;
  nombre: string;
  alias: string;
  precio_venta: number;
  precio_venta_online: number | null;
  precio_promocion_online: number;
  existencias: number;
  vende_sin_existencia: number;
  id_categoria: number;
  nombre_categoria: string;
  id_marca: number;
  nombre_marca: string;
  id_imagen: number | null;
  ext1: string | null;
  ext2: string | null;
  mostrar_tienda_linea: number;
  mostrar_catalogo_linea: number;
  es_servicio: number;
  fecha_Ini_promocion_online: number | null;
  fecha_fin_promocion_online: number | null;
  dias_aplica_promocion_online: string | null;
  controla_inventario_tienda_linea: number;
  id_cocina: number | null;
  tiempo_preparacion: number;
  tipo_promocion_online: number;
  id_padre: number | null;
  sku: string;
  total_estampilla: number;
  total_impoconsumo: number;
  cups: string | null;
  configuracion_dinamica: string | null;
  id_sucursal: number;
  vender_solo_presentacion: number;
  presentaciones: string | null;
  id_tipo_medida: number;
  id_tipo_producto: number;
  tipo_impuesto: number;
  id_impuesto: number;
  valor_impuesto: number;
  invima: string;
  cum: string;
  nota: string;
  unidad_medida: string;
  nombre_impuesto: string;
  dias_aplica_venta_online: string;
  hora_aplica_venta_online: string;
  hora_aplica_venta_fin_online: string;
  hora_Ini_promocion_online: string | null;
  hora_fecha_fin_promocion_online: string | null;
  [key: string]: unknown;
}

interface ProductGridWithSidebarProps {
  defaultCategoryId?: number | null;
  targetProductId?: number | null;
  showAddToCart?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export interface ProductGridWithSidebarRef {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const ProductGridWithSidebar = forwardRef<ProductGridWithSidebarRef, ProductGridWithSidebarProps>(({ 
  defaultCategoryId = null,
  targetProductId = null,
  showAddToCart = true,
  showSearch = true,
  searchPlaceholder = "Buscar por nombre, marca, SKU, precio..."
}, ref) => {
  // Estado para manejar la categoría seleccionada
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(defaultCategoryId);
  // Estado para controlar si el sidebar está abierto
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Estado para manejar los resultados de búsqueda
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Obtener categorías usando el hook
  const { categorias, loading: categoriasLoading } = useCategorias();
  const { getProductosByCategoria } = useProductos();

  // Exponer funciones para controlar el sidebar desde el ButtonNav
  useImperativeHandle(ref, () => ({
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false)
  }), [sidebarOpen]);

  // Efecto para seleccionar una categoría por defecto si no hay ninguna seleccionada
  useEffect(() => {
    if (selectedCategoryId === null && !categoriasLoading && categorias.length > 0) {
      // Seleccionar categoría 15 (Cerveza) por defecto
      setSelectedCategoryId(15);
    }
  }, [categorias, categoriasLoading, selectedCategoryId]);

  // Manejador para cuando se selecciona una categoría en el sidebar
  const handleSidebarCategorySelect = (categoryId: number | null) => {
    if (categoryId !== null) {
      setSelectedCategoryId(categoryId);
      setSidebarOpen(false);
      // Limpiar resultados de búsqueda al cambiar de categoría
      setSearchResults([]);
    }
  };

  // Manejador para los resultados de búsqueda
  const handleSearchResults = useCallback((productos: Producto[]) => {
    setSearchResults(productos);
    setIsSearching(false);
  }, []);

  // Manejador para cambios en la búsqueda
  const handleSearchChange = useCallback((query: string) => {
    setIsSearching(query.length > 0);
    if (!query.trim()) {
      setSearchResults([]);
    }
  }, []);

  // Manejador para selección de categoría desde los tags
  const handleCategorySelect = useCallback(async (categoryIds: number | number[]) => {
    try {
      setIsSearching(true);
      
      // Si es un array, obtener productos de múltiples categorías
      if (Array.isArray(categoryIds)) {
        const allProductos: Producto[] = [];
        for (const categoryId of categoryIds) {
          const productos = await getProductosByCategoria(categoryId);
          allProductos.push(...productos);
        }
        setSearchResults(allProductos);
      } else {
        // Si es un solo ID, obtener productos de esa categoría
        const productos = await getProductosByCategoria(categoryIds);
        setSearchResults(productos);
      }
      
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error cargando productos de categoría:', error);
      setIsSearching(false);
    }
  }, [getProductosByCategoria]);

  // Obtener el nombre y cantidad de productos de la categoría seleccionada
  const selectedCategory = categorias.find(cat => cat.id === selectedCategoryId);

  // Determinar si mostrar resultados de búsqueda
  const mostrarResultadosBusqueda = searchResults.length > 0 || isSearching;

  return (
    <div className="relative" data-testid="product-container">
      {/* Sidebar flotante */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64 lg:w-72 md:shadow-none md:z-auto md:mr-6
      `}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
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
          {/* Contenedor scrollable del sidebar */}
          <div 
            className="flex-1 overflow-y-auto min-h-0"
            style={{ 
              height: 'calc(100vh - 80px)',
              overflow: 'auto'
            }}
          >
            <SidebarCategories 
              onCategorySelect={handleSidebarCategorySelect}
              selectedCategoryId={selectedCategoryId}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="md:ml-0">
        {/* Componente de búsqueda */}
        {showSearch && (
          <div className="mb-6">
            <ProductSearch
              onSearchResults={handleSearchResults}
              onSearchChange={handleSearchChange}
              onCategorySelect={handleCategorySelect}
              placeholder={searchPlaceholder}
              showSortOptions={true}
            />
          </div>
        )}

        {/* Contenido según el estado */}
        {mostrarResultadosBusqueda ? (
          <div data-testid="search-results">
            {/* Resultados de búsqueda */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isSearching ? 'Buscando...' : `Resultados de búsqueda (${searchResults.length})`}
              </h2>
            </div>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Buscando productos...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div 
                data-testid="product-grid-results"
                className="border border-gray-200 dark:border-gray-700 rounded-lg"
                style={{ 
                  height: 'calc(100vh - 300px)',
                  overflow: 'auto'
                }}
              >
                <div className="p-4">
                  <ProductGrid 
                    productos={searchResults}
                    showAddToCart={showAddToCart}
                    targetProductId={targetProductId}
                    isSearchResults={true}
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Intenta con otros términos de búsqueda o ajusta los filtros
                </p>
              </div>
            )}
          </div>
        ) : selectedCategoryId !== null ? (
          <div>
            {/* Título sutil con nombre de la categoría y cantidad de productos */}
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {selectedCategoryId === 15 
                  ? 'Todos los Productos' 
                  : selectedCategory ? selectedCategory.nombre : 'Productos'
                }
              </h2>
              {/* Aquí puedes pasar la cantidad real de productos si la tienes, por ahora solo ejemplo */}
              <span className="text-xs text-gray-400 font-normal">
                {selectedCategoryId === 15 && (
                  <span>Cerveza, Vapeadores, Licores y más categorías</span>
                )}
                {/* Puedes reemplazar 0 por la cantidad real si la tienes */}
                {/* Ejemplo: `${products.length} productos disponibles` */}
                {/* Si no tienes el dato, puedes dejarlo vacío o mostrar un guion */}
                {/* 13 productos disponibles */}
              </span>
            </div>
            <ProductGrid 
              categoryId={selectedCategoryId}
              showAddToCart={showAddToCart}
              targetProductId={targetProductId}
              loadAllCategories={selectedCategoryId === 15}
              productsPerCategory={30}
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
