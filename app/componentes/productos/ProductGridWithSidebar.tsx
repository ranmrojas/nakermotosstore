'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SidebarCategories from './SidebarCategories';
import ProductGrid from './ProductGrid';
import ProductSearch from './ProductSearch';
import ProductSkeleton from './ProductSkeleton';
import { useCategorias } from '../../../hooks/useCategorias';
import { useProductos } from '../../../hooks/useProductos';
import { XMarkIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { analyticsEvents } from '../../../hooks/useAnalytics';

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
  
  // Nuevos estados para el sistema de tags
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Array<{id: number, nombre: string}>>([]);
  const [categoriasOrdenadas, setCategoriasOrdenadas] = useState<Categoria[]>([]);
  
  // Referencias para las animaciones de scroll
  const categoriasScrollRef = useRef<HTMLDivElement>(null);
  const firstCategoryTagRef = useRef<HTMLButtonElement | null>(null);
  const [autoClicked, setAutoClicked] = useState(false);
  // Estado para saber si ya se limpió la URL
  const [urlCleaned, setUrlCleaned] = useState(false);

  // Hook de router de Next.js
  const router = useRouter();

  // Obtener categorías usando el hook
  const { categorias, loading: categoriasLoading } = useCategorias();
  const { getProductosByCategoria, searchProductos } = useProductos();

  // Exponer funciones para controlar el sidebar desde el ButtonNav
  useImperativeHandle(ref, () => ({
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false)
  }), [sidebarOpen]);

  // Función para ordenar categorías (primeras 4 específicas, resto alfabético)
  const getOrderedCategorias = useCallback(() => {
    if (!Array.isArray(categorias)) return [];

    // Filtrar solo categorías activas
    const categoriasActivas = categorias.filter(cat => cat.activa);

    // IDs de las primeras 4 categorías en orden específico
    const firstFourIds = [15, 33, 46, 61, 62, 63, 17,]; // Cerveza, Cigarrillos, Vapeadores Aguardiente

    // Separar las primeras 4 del resto
    const firstFour = firstFourIds
      .map(id => categoriasActivas.find(cat => cat.id === id))
      .filter((cat): cat is Categoria => cat !== undefined);

    const rest = categoriasActivas.filter(cat => !firstFourIds.includes(cat.id));

    // Ordenar el resto alfabéticamente por nombre
    const sortedRest = rest.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return [...firstFour, ...sortedRest];
  }, [categorias]);

  // Efecto para limpiar el parámetro 'id' de la URL una vez aplicado el filtro
  useEffect(() => {
    // Solo limpiar si defaultCategoryId existe, selectedCategoryId ya está seteado, y no se ha limpiado antes
    if (
      defaultCategoryId !== null &&
      defaultCategoryId !== undefined &&
      selectedCategoryId === defaultCategoryId &&
      !urlCleaned
    ) {
      // Limpiar el parámetro 'id' de la URL manteniendo la ruta actual
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        router.replace(url.pathname + url.search, { scroll: false });
        setUrlCleaned(true);
      }
    }
  }, [defaultCategoryId, selectedCategoryId, urlCleaned, router]);

  // Efecto para establecer el orden de categorías una sola vez
  useEffect(() => {
    if (Array.isArray(categorias) && categorias.length > 0) {
      const ordenadas = getOrderedCategorias();
      setCategoriasOrdenadas(ordenadas);
    }
  }, [categorias, getOrderedCategorias]);
  
  // Efecto para hacer scroll a la categoría seleccionada cuando se carga la página
  useEffect(() => {
    // Solo hacer scroll si hay un defaultCategoryId establecido y categorías cargadas
    if (
      defaultCategoryId !== null && 
      defaultCategoryId !== undefined && 
      Array.isArray(categoriasOrdenadas) && 
      categoriasOrdenadas.length > 0 &&
      categoriasScrollRef.current
    ) {
      // Buscar el botón de la categoría seleccionada
      const categoryButtons = categoriasScrollRef.current.querySelectorAll('button');
      const categoryIndex = categoriasOrdenadas.findIndex(cat => cat.id === defaultCategoryId);
      
      if (categoryIndex >= 0 && categoryButtons[categoryIndex]) {
        // Usar setTimeout para asegurar que el DOM esté actualizado
        setTimeout(() => {
          // Hacer scroll para mostrar el botón seleccionado
          categoryButtons[categoryIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }, 300);
      }
    }
  }, [defaultCategoryId, categoriasOrdenadas]);

  // Scroll sincronizado de tags de categorías con el scroll de productos
  useEffect(() => {
    const el = categoriasScrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    let lastScrollTop = 0;
    let accumulatedScroll = 0;
    let isMovingLeft = false;
    let returnTimeout: NodeJS.Timeout;

    const handleProductsScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const currentScrollTop = target.scrollTop;
      const scrollDelta = currentScrollTop - lastScrollTop;
      
      // Solo procesar scroll hacia abajo
      if (scrollDelta > 0) {
        // Acumular el scroll
        accumulatedScroll += scrollDelta;
        
        // Calcular el scroll horizontal proporcional (de derecha a izquierda)
        const maxHorizontalScroll = el.scrollWidth - el.clientWidth;
        const scrollRatio = Math.min(accumulatedScroll / 100, 1); // Normalizar a 100px de scroll vertical
        const targetScrollLeft = maxHorizontalScroll - (scrollRatio * maxHorizontalScroll); // Invertir la dirección
        
        // Mover los tags hacia la izquierda (de derecha a izquierda)
        if (!isMovingLeft) {
          isMovingLeft = true;
          console.log('Moviendo tags hacia la izquierda:', { accumulatedScroll, targetScrollLeft });
        }
        
        el.scrollTo({ 
          left: targetScrollLeft, 
          behavior: 'auto' // Sin animación para que sea instantáneo
        });
        
        // Limpiar timeout de retorno si existe
        if (returnTimeout) {
          clearTimeout(returnTimeout);
        }
        
        // Programar retorno al inicio si no hay más scroll
        returnTimeout = setTimeout(() => {
          console.log('Retornando tags al inicio');
          el.scrollTo({ 
            left: 0, 
            behavior: 'smooth' 
          });
          isMovingLeft = false;
          accumulatedScroll = 0;
        }, 500); // 500ms después del último scroll
      }
      
      lastScrollTop = currentScrollTop;
    };

    // Buscar el contenedor de productos (el área scrollable)
    const productsContainer = document.querySelector('.flex-1.overflow-y-auto');
    
    if (productsContainer) {
      // Agregar event listener para scroll del contenedor de productos
      productsContainer.addEventListener('scroll', handleProductsScroll, { passive: true });
      
      return () => {
        productsContainer.removeEventListener('scroll', handleProductsScroll);
        if (returnTimeout) {
          clearTimeout(returnTimeout);
        }
      };
    }
  }, [categoriasOrdenadas]);

  // Efecto para simular el clic en el primer tag de categoría cuando estén visibles
useEffect(() => {
    // Solo simular el clic si NO hay categoría seleccionada
    if (
      !autoClicked &&
      firstCategoryTagRef.current &&
      (selectedCategoryId === null || selectedCategoryId === undefined)
    ) {
      firstCategoryTagRef.current.click();
      setAutoClicked(true);
    }
    // Si hay un selectedCategoryId pero no se ha hecho autoclick, hacer scroll al botón correspondiente
    else if (
      selectedCategoryId !== null && 
      selectedCategoryId !== undefined && 
      categoriasOrdenadas.length > 0 &&
      categoriasScrollRef.current
    ) {
      // Buscar el botón de la categoría seleccionada
      const categoryIndex = categoriasOrdenadas.findIndex(cat => cat.id === selectedCategoryId);
      const categoryButtons = categoriasScrollRef.current.querySelectorAll('button');
      
      if (categoryIndex >= 0 && categoryButtons[categoryIndex]) {
        // Usar setTimeout para asegurar que el DOM esté actualizado
        setTimeout(() => {
          categoryButtons[categoryIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }, 200);
      }
    }
  }, [categoriasOrdenadas, autoClicked, selectedCategoryId]);

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

  // Efecto para seleccionar una categoría por defecto si no hay ninguna seleccionada
useEffect(() => {
    // Solo asignar 15 si NO hay defaultCategoryId y tampoco selectedCategoryId
    if (
      selectedCategoryId === null &&
      !categoriasLoading &&
      categorias.length > 0 &&
      (defaultCategoryId === null || defaultCategoryId === undefined)
    ) {
      setSelectedCategoryId(15);
    }
  }, [categorias, categoriasLoading, selectedCategoryId, defaultCategoryId]);

  // Efecto para cargar marcas cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategoryId) {
      loadMarcasByCategory(selectedCategoryId);
    }
  }, [selectedCategoryId, loadMarcasByCategory]);

  // Manejador para cuando se selecciona una categoría en el sidebar
  const handleSidebarCategorySelect = (categoryId: number | null) => {
    if (categoryId !== null) {
      setSelectedCategoryId(categoryId);
      setSelectedMarca(null); // Siempre limpiamos la marca al cambiar de categoría
      setSidebarOpen(false);
      // Limpiar resultados de búsqueda al cambiar de categoría
      setSearchResults([]);
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
    } else {
      // Rastrear uso del input de búsqueda
      analyticsEvents.searchInputUsed(query, 'productos');
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
        analyticsEvents.searchPerformed(`categorías: ${categoryIds.join(', ')}`, allProductos.length, 'productos');
      } else {
        // Si es un solo ID, obtener productos de esa categoría
        const productos = await getProductosByCategoria(categoryIds);
        setSearchResults(productos);
        
        // Rastrear búsqueda por categoría única
        analyticsEvents.searchPerformed(`categoría: ${categoryIds}`, productos.length, 'productos');
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
          'productos'
        );
        
        // Hacer scroll para mostrar el botón de la categoría seleccionada
        if (categoriasScrollRef.current) {
          // Buscar el botón correspondiente a esta categoría
          const categoryIndex = categoriasOrdenadas.findIndex(cat => cat.id === categoryId);
          const categoryButtons = categoriasScrollRef.current.querySelectorAll('button');
          
          if (categoryIndex >= 0 && categoryButtons[categoryIndex]) {
            // Usar timeout para asegurar que el DOM está listo
            setTimeout(() => {
              categoryButtons[categoryIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
              });
            }, 100);
          }
        }
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
      // No reseteamos la categoría seleccionada para mantener el focus
      // setSelectedCategoryId(null);
      
      // Rastrear clic en tag de marca del filtro
      analyticsEvents.filterBrandTagClick(marcaName, 'productos');
      
      let resultados;
      
      // Si hay una categoría seleccionada, filtramos por categoría y marca
      if (selectedCategoryId) {
        // Primero obtenemos los productos de la categoría
        const productosPorCategoria = await getProductosByCategoria(selectedCategoryId);
        // Luego filtramos por la marca seleccionada
        resultados = productosPorCategoria.filter(producto => 
          producto.nombre_marca === marcaName
        );
      } else {
        // Si no hay categoría seleccionada, buscamos por marca y filtramos
        resultados = await searchProductos(marcaName);
        resultados = resultados.filter(producto => 
          producto.nombre_marca === marcaName
        );
      }
      
      setSearchResults(resultados);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error buscando productos por marca:', error);
      setIsSearching(false);
    }
  }, [searchProductos, selectedCategoryId, getProductosByCategoria]);

  // Obtener el nombre y cantidad de productos de la categoría seleccionada
  const selectedCategory = categorias.find(cat => cat.id === selectedCategoryId);

  // Determinar si mostrar resultados de búsqueda
  const mostrarResultadosBusqueda = searchResults.length > 0 || isSearching;

  return (
    <div className="flex h-screen" data-testid="product-container">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Overlay para cerrar el sidebar al hacer clic fuera (solo mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú de categorías"
        />
      )}
      {/* Sidebar flotante */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64 lg:w-72 md:shadow-none md:z-auto md:flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Categorías
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
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
      <div className="flex-1 flex flex-col md:ml-0 overflow-hidden">
        {/* Componente de búsqueda */}
        {showSearch && (
          <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Abrir categorías"
              >
                <QueueListIcon className="h-5 w-5 text-gray-600" />
                <span className="text-[10px] text-gray-600 mt-0.5">Categorías</span>
              </button>
              <div className="flex-1">
                <ProductSearch
                  onSearchResults={handleSearchResults}
                  onSearchChange={handleSearchChange}
                  onCategorySelect={handleCategorySelect}
                  placeholder={searchPlaceholder}
                  showSortOptions={false}
                  className="!py-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sistema de tags de categorías y marcas */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="container mx-auto px-2 py-2">
            {/* Línea de categorías con scroll horizontal */}
            <div className="mb-2">
              <div ref={categoriasScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {Array.isArray(categoriasOrdenadas) && categoriasOrdenadas.map((categoria, idx) => 
                  categoria ? (
                    <button
                      key={categoria.id}
                      ref={idx === 0 ? firstCategoryTagRef : undefined}
                      onClick={() => handleCategoryScrollClick(categoria.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border focus:outline-none focus:ring-2 focus:ring-[#8a1a00] focus:ring-opacity-50 shadow-sm ${
                        selectedCategoryId === categoria.id
                          ? 'bg-[#8a1a00] text-white border-[#8a1a00]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-400 border-opacity-3'
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
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border focus:outline-none shadow-sm ${
                      selectedMarca === marca.nombre
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-400 border-opacity-3'
                    }`}
                    style={{fontSize:'0.85rem'}}
                    title={`Filtrar productos de ${marca.nombre}${selectedCategoryId ? ' en esta categoría' : ''}`}
                  >
                    {marca.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido según el estado */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {mostrarResultadosBusqueda ? (
            <div data-testid="search-results">
              {/* Resultados de búsqueda */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isSearching ? 'Buscando...' : ''}
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
                  className="border border-gray-200 rounded-lg"
                >
                  <div className="p-4">
                    <ProductGrid 
                      productos={searchResults}
                      showAddToCart={showAddToCart}
                      targetProductId={targetProductId}
                      isSearchResults={true}
                      onCategoryTagClick={handleCategoryTagClick}
                      onBrandTagClick={handleBrandTagClick}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-lg text-center">
                  <div className="text-gray-600 mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-gray-600">
                    Intenta con otros términos de búsqueda o ajusta los filtros
                  </p>
                </div>
              )}
            </div>
          ) : selectedCategoryId !== null ? (
            <div>
              {/* Título sutil con nombre de la categoría y cantidad de productos */}
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-gray-900 leading-tight">
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
                onCategoryTagClick={handleCategoryTagClick}
                onBrandTagClick={handleBrandTagClick}
              />
            </div>
          ) : (
            <div>
              {/* Mostrar skeleton mientras no hay categoría seleccionada */}
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                  Productos
                </h2>
                <span className="text-xs text-gray-400 font-normal">
                  Cargando productos...
                </span>
              </div>
              <ProductSkeleton count={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductGridWithSidebar.displayName = 'ProductGridWithSidebar';

export default ProductGridWithSidebar;
