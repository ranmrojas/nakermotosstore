'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProductGrid from '../componentes/productos/ProductGrid';
import ProductSearch from '../componentes/productos/ProductSearch';
import { useProductos } from '../../hooks/useProductos';

// Usar la misma interfaz Producto que ProductGrid
interface Producto {
  id_producto: number;
  nombre: string;
  alias: string;
  // Campos de precios originales (pueden estar vacíos ya que se obtienen del API)
  precio_venta?: number;
  precio_venta_online?: number | null;
  precio_promocion_online?: number;
  // Campos de precios en tiempo real
  precio_venta_real?: number;
  precio_venta_online_real?: number | null;
  precio_promocion_online_real?: number;
  tiene_promocion_activa?: boolean;
  precio_final?: number;
  precio_formateado?: string;
  precios_actualizados?: boolean;
  // CAMPOS DE EXISTENCIAS EN TIEMPO REAL
  existencias_real?: number;
  vende_sin_existencia_real?: number;
  existencias_actualizadas?: boolean;
  // Campos de existencias locales (deprecados - usar los reales)
  existencias?: number;
  vende_sin_existencia?: number;
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

type VapeCategory = 'desechables' | 'baterias' | 'capsulas' | 'none';

export default function VapePage() {
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VapeCategory>('none');
  const [allVapeProducts, setAllVapeProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getProductosByCategoria } = useProductos();

  // Cargar todos los productos de vapeadores al iniciar
  useEffect(() => {
    const loadVapeProducts = async () => {
      setLoading(true);
      try {
        // Cargar productos de las categorías hijas: 61, 62, 63
        const vapeCategories = [61, 62, 63]; // Desechables, Cápsulas, Baterías
        const allProducts: Producto[] = [];
        
        for (const categoryId of vapeCategories) {
          const productos = await getProductosByCategoria(categoryId);
          allProducts.push(...productos);
        }
        
        setAllVapeProducts(allProducts);
      } catch (error) {
        console.error('Error cargando productos de vape:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadVapeProducts();
  }, [getProductosByCategoria]);

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

  // Función para manejar clic en tag de categoría
  const handleCategoryClick = (categoryType: VapeCategory) => {
    // Si el tag ya está seleccionado, deseleccionarlo
    if (selectedCategory === categoryType) {
      setSelectedCategory('none');
      setSearchResults([]);
      return;
    }
    
    setSelectedCategory(categoryType);
    
    // Determinar IDs de categoría según el tipo
    let categoryIds: number;
    switch (categoryType) {
      case 'desechables':
        categoryIds = 61;
        break;
      case 'baterias':
        categoryIds = 63;
        break;
      case 'capsulas':
        categoryIds = 62;
        break;
      default:
        categoryIds = 46; // Categoría padre
    }
    
    // Ejecutar submit con la categoría seleccionada
    handleCategorySelect(categoryIds);
  };

  // Determinar qué productos mostrar
  const mostrarResultadosBusqueda = searchResults.length > 0 || isSearching;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-800 dark:border-amber-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando productos de vape...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header fijo superior */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          {/* Componente de búsqueda */}
          <div className="mb-6">
            <ProductSearch
              onSearchResults={handleSearchResults}
              onSearchChange={handleSearchChange}
              onCategorySelect={handleCategorySelect}
              placeholder="Buscar vapeadores por nombre, marca, SKU, precio..."
              showSortOptions={false}
            />
          </div>

          {/* Tags de categorías específicas de vape */}
          <div>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => handleCategoryClick('desechables')}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'desechables' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={selectedCategory === 'desechables' ? 'Clic para deseleccionar' : 'Clic para filtrar por Dispositivos Desechables'}
              >
                Dispositivos Desechables
              </button>
              <button
                onClick={() => handleCategoryClick('capsulas')}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'capsulas' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={selectedCategory === 'capsulas' ? 'Clic para deseleccionar' : 'Clic para filtrar por Cápsulas'}
              >
                Cápsulas
              </button>
              <button
                onClick={() => handleCategoryClick('baterias')}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'baterias' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={selectedCategory === 'baterias' ? 'Clic para deseleccionar' : 'Clic para filtrar por Baterías'}
              >
                Baterías
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Espaciador para evitar que el contenido se oculte detrás del header fijo */}
      <div className="h-28" />

      {/* Contenido principal */}
      <div className="pb-0 mb-0">
        {/* Contenido según el estado */}
        {mostrarResultadosBusqueda ? (
          <div>
            {/* Resultados de búsqueda */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isSearching ? 'Buscando...' : `Resultados de búsqueda`}
              </h2>
            </div>
            <ProductGrid productos={searchResults} />
          </div>
        ) : (
          <div>
            {/* Mostrar todos los productos de vape por defecto */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Productos de Vape
              </h2>
            </div>
            <ProductGrid 
              productos={allVapeProducts}
              showAddToCart={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}