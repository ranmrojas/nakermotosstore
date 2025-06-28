'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import ProductGrid from '../componentes/productos/ProductGrid';
import ProductSearch from '../componentes/productos/ProductSearch';
import ProductSkeleton from '../componentes/productos/ProductSkeleton';
import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import { usePreload } from '../../hooks/usePreload';
import { analyticsEvents } from '../../hooks/useAnalytics';

// Importar el tipo Categoria del hook
type Categoria = {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  categoriaPadreId?: number;
  esPadre?: boolean;
  tieneSubcategorias?: boolean;
  subcategorias?: Categoria[];
};

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

export default function BusquedaPage() {
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [defaultProducts, setDefaultProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcas, setMarcas] = useState<Array<{id: number, nombre: string}>>([]);
  const [categoriasOrdenadas, setCategoriasOrdenadas] = useState<Categoria[]>([]);
  
  const { getProductosByCategoria, searchProductos } = useProductos();
  const { categorias, loading: categoriasLoading } = useCategorias();
  const { isPreloadComplete } = usePreload();

  const categoriasScrollRef = useRef<HTMLDivElement>(null);

  // Función para ordenar categorías (primeras 4 específicas, resto alfabético)
  const getOrderedCategorias = useCallback(() => {
    if (!Array.isArray(categorias)) return [];

    // Filtrar solo categorías activas
    const categoriasActivas = categorias.filter(cat => cat.activa);

    // IDs de las primeras 4 categorías en orden específico
    const firstFourIds = [15, 63, 17, 33]; // Cerveza, Baterías, Cigarrillos, Aguardiente

    // Separar las primeras 4 del resto
    const firstFour = firstFourIds
      .map(id => categoriasActivas.find(cat => cat.id === id))
      .filter((cat): cat is Categoria => cat !== undefined);

    const rest = categoriasActivas.filter(cat => !firstFourIds.includes(cat.id));

    // Ordenar el resto alfabéticamente por nombre
    const sortedRest = rest.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return [...firstFour, ...sortedRest];
  }, [categorias]);

  // Efecto para establecer el orden de categorías una sola vez
  useEffect(() => {
    if (Array.isArray(categorias) && categorias.length > 0) {
      const ordenadas = getOrderedCategorias();
      setCategoriasOrdenadas(ordenadas);
    }
  }, [categorias, getOrderedCategorias]);

  // Animación de scroll automático en la fila de categorías
  useEffect(() => {
    const el = categoriasScrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    // Función para animar el scroll
    const animateScroll = () => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      setTimeout(() => {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }, 400); // 400ms para volver (más rápido)
    };

    // Primer scroll inmediato
    animateScroll();
    // Segundo scroll a los 5s
    const timeout1 = setTimeout(animateScroll, 5000);
    // Tercer scroll a los 20s
    const timeout2 = setTimeout(animateScroll, 20000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [categoriasOrdenadas]);

  // Cargar marcas de la categoría seleccionada
  const loadMarcasByCategory = useCallback(async (categoryId: number | null) => {
    if (!categoryId) {
      setMarcas([]);
      return;
    }

    try {
      const productos = await getProductosByCategoria(categoryId);
      const marcasSet = new Set<string>();
      const marcasArray: Array<{id: number, nombre: string}> = [];
      
      productos.forEach(producto => {
        if (producto.nombre_marca && !marcasSet.has(producto.nombre_marca)) {
          marcasSet.add(producto.nombre_marca);
          marcasArray.push({
            id: producto.id_marca,
            nombre: producto.nombre_marca
          });
        }
      });
      
      setMarcas(marcasArray);
    } catch (error) {
      console.error(`Error cargando marcas de categoría ${categoryId}:`, error);
      setMarcas([]);
    }
  }, [getProductosByCategoria]);

  // Cargar productos por defecto al iniciar (optimizado)
  useEffect(() => {
    const loadDefaultProducts = async () => {
      setLoading(true);
      try {
        // Si el preload está completo, los datos ya están disponibles
        if (isPreloadComplete) {
          console.log('✅ Datos de búsqueda precargados, cargando desde caché...');
        } else {
          console.log('🔄 Cargando productos por defecto...');
        }

        // Categorías para productos por defecto: Cerveza, Aguardiente, Gaseosa, Gomitas, Whisky
        const defaultCategories = [
          { id: 15, name: 'cerveza' },      // Cerveza
          { id: 7, name: 'aguardiente' },   // Aguardiente
          { id: 8, name: 'gaseosa' },       // Gaseosa
          { id: 51, name: 'gomitas' },      // Gomitas
          { id: 33, name: 'whisky' }        // Whisky (usando ID 33 para evitar duplicado)
        ];
        
        const allProducts: Producto[] = [];
        
        for (const category of defaultCategories) {
          try {
            const productos = await getProductosByCategoria(category.id);
            // Tomar solo los primeros 4 productos de cada categoría para tener 20 total
            const productosLimitados = productos.slice(0, 4);
            allProducts.push(...productosLimitados);
          } catch (error) {
            console.error(`Error cargando productos de ${category.name}:`, error);
          }
        }
        
        setDefaultProducts(allProducts);
      } catch (error) {
        console.error('Error cargando productos por defecto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultProducts();
  }, [getProductosByCategoria, isPreloadComplete]);

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
    } else {
      // Rastrear uso del input de búsqueda
      analyticsEvents.searchInputUsed(query, 'busqueda');
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
        
        // Rastrear búsqueda por categorías múltiples
        analyticsEvents.searchPerformed(`categorías: ${categoryIds.join(', ')}`, allProductos.length, 'busqueda');
      } else {
        // Si es un solo ID, obtener productos de esa categoría
        const productos = await getProductosByCategoria(categoryIds);
        setSearchResults(productos);
        
        // Rastrear búsqueda por categoría única
        analyticsEvents.searchPerformed(`categoría: ${categoryIds}`, productos.length, 'busqueda');
      }
      
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error cargando productos de categoría:', error);
      setIsSearching(false);
    }
  }, [getProductosByCategoria]);

  // Handler personalizado para clic en tag de categoría en el modal
  const handleCategoryTagClick = useCallback(async (categoryId: number) => {
    try {
      setIsSearching(true);
      
      // Obtener productos de la categoría seleccionada
      const productos = await getProductosByCategoria(categoryId);
      setSearchResults(productos);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error cargando productos de categoría:', error);
      setIsSearching(false);
    }
  }, [getProductosByCategoria]);

  // Handler personalizado para clic en tag de marca en el modal
  const handleBrandTagClick = useCallback(async (brandName: string) => {
    try {
      setIsSearching(true);
      
      // Usar el hook de productos para buscar por marca
      const resultados = await searchProductos(brandName);
      
      // Filtrar solo productos que coincidan exactamente con la marca
      const productosFiltrados = resultados.filter(producto => 
        producto.nombre_marca === brandName
      );
      
      setSearchResults(productosFiltrados);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error buscando productos por marca:', error);
      setIsSearching(false);
    }
  }, [searchProductos]);

  // Handler para clic en categoría de la línea de scroll
  const handleCategoryScrollClick = useCallback(async (categoryId: number) => {
    try {
      setIsSearching(true);
      setSelectedCategoryId(categoryId);
      setSelectedMarca(null);
      
      // Rastrear clic en tag de categoría del filtro
      const categoria = categoriasOrdenadas.find(cat => cat.id === categoryId);
      if (categoria) {
        analyticsEvents.filterCategoryTagClick(
          categoryId.toString(),
          categoria.nombre,
          'busqueda'
        );
      }
      
      // Cargar productos de la categoría
      const productos = await getProductosByCategoria(categoryId);
      setSearchResults(productos);
      
      // Cargar marcas de esta categoría
      await loadMarcasByCategory(categoryId);
      
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error cargando productos de categoría:', error);
      setIsSearching(false);
    }
  }, [getProductosByCategoria, loadMarcasByCategory, categoriasOrdenadas]);

  // Handler para clic en marca de la línea de scroll
  const handleMarcaScrollClick = useCallback(async (marcaName: string) => {
    try {
      setIsSearching(true);
      setSelectedMarca(marcaName);
      setSelectedCategoryId(null);
      
      // Rastrear clic en tag de marca del filtro
      analyticsEvents.filterBrandTagClick(marcaName, 'busqueda');
      
      const resultados = await searchProductos(marcaName);
      const productosFiltrados = resultados.filter(producto => 
        producto.nombre_marca === marcaName
      );
      
      setSearchResults(productosFiltrados);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error buscando productos por marca:', error);
      setIsSearching(false);
    }
  }, [searchProductos]);

  // Determinar qué productos mostrar
  const mostrarResultadosBusqueda = searchResults.length > 0 || isSearching;

  if (loading || categoriasLoading) {
    return (
      <div className="min-h-screen bg-white">
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {/* Header fijo superior */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
          <div className="container mx-auto px-2 py-2">
            {/* Componente de búsqueda */}
            <div className="mb-2">
              <Suspense fallback={<div className="h-10 bg-gray-700 rounded animate-pulse" />}>
                <ProductSearch
                  onSearchResults={handleSearchResults}
                  onSearchChange={handleSearchChange}
                  onCategorySelect={handleCategorySelect}
                  placeholder="Buscar por nombre, marca, SKU, precio..."
                  showSortOptions={true}
                  className="!py-1"
                />
              </Suspense>
            </div>
            {/* Tags de categorías */}
            <div>
              <div className="flex items-center gap-1 justify-center">
                <button className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  Cerveza
                </button>
                <button className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  Aguardiente
                </button>
                <button className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  Gaseosa
                </button>
                <button className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  Gomitas
                </button>
                <button className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  Whisky
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenido principal con skeletons */}
        <div className="pt-20">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              Búsqueda de Productos
            </h2>
            <span className="text-xs text-gray-400 font-normal">
              Cargando productos...
            </span>
          </div>
          <ProductSkeleton count={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="container mx-auto px-2 py-2">
        {/* Header fijo superior */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-2 py-2">
            {/* Componente de búsqueda */}
            <div className="mb-2">
              <ProductSearch
                onSearchResults={handleSearchResults}
                onSearchChange={handleSearchChange}
                onCategorySelect={handleCategorySelect}
                placeholder="Buscar productos por nombre, marca, ..."
                showSortOptions={false}
                className="!py-1"
              />
            </div>
            {/* Línea de categorías con scroll horizontal */}
            <div className="mb-2">
              <div ref={categoriasScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {Array.isArray(categoriasOrdenadas) && categoriasOrdenadas.map((categoria) => 
                  categoria ? (
                    <button
                      key={categoria.id}
                      onClick={() => handleCategoryScrollClick(categoria.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                        selectedCategoryId === categoria.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      style={{fontSize:'0.85rem'}}
                      title={`Filtrar por ${categoria.nombre}`}
                    >
                      {categoria.nombre}
                    </button>
                  ) : null
                )}
              </div>
            </div>
            {/* Línea de marcas con scroll horizontal */}
            <div className="mb-1">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {Array.isArray(marcas) && marcas.map((marca) => (
                  <button
                    key={marca.id}
                    onClick={() => handleMarcaScrollClick(marca.nombre)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      selectedMarca === marca.nombre
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{fontSize:'0.85rem'}}
                    title={`Buscar productos de ${marca.nombre}`}
                  >
                    {marca.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Espaciador para evitar que el contenido se oculte detrás del header fijo */}
        {/* <div className="h-32" /> */}
        {/* Contenido principal */}
        <div className="pb-0 mb-0 bg-white">
          {/* Contenido según el estado */}
          {mostrarResultadosBusqueda ? (
            <div>
              {/* Resultados de búsqueda */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isSearching ? 'Buscando...' : `Resultados de búsqueda`}
                </h2>
              </div>
              <ProductGrid 
                productos={searchResults}
                onCategoryTagClick={handleCategoryTagClick}
                onBrandTagClick={handleBrandTagClick}
              />
            </div>
          ) : (
            <div>
              {/* Mostrar productos por defecto */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Productos Destacados
                </h2>
              </div>
              <ProductGrid 
                productos={defaultProducts}
                showAddToCart={true}
                onCategoryTagClick={handleCategoryTagClick}
                onBrandTagClick={handleBrandTagClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
