'use client';
import { useState, useEffect } from 'react';
import { useProductos } from '../../../hooks/useProductos';

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

interface ProductSearchProps {
  onSearchResults: (productos: Producto[]) => void;
  onSearchChange?: (query: string) => void;
  onCategorySelect?: (categoryId: number | number[]) => void;
  placeholder?: string;
  className?: string;
  showSortOptions?: boolean;
}

type SortOption = 'licores' | 'vapeadores' | 'gaseosa' | 'cerveza' | 'none';

export default function ProductSearch({
  onSearchResults,
  onSearchChange,
  onCategorySelect,
  placeholder = "Buscar por nombre, marca, SKU, precio...",
  className = "",
  showSortOptions = true
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const { searchProductos } = useProductos();

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Efecto único para manejar búsqueda
  useEffect(() => {
    const executeSearch = async () => {
      if (!debouncedQuery.trim()) {
        onSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const resultados = await searchProductos(debouncedQuery);
        let productosFiltrados = resultados;

        // Aplicar filtro por categoría
        productosFiltrados = productosFiltrados.filter(producto => {
          switch (sortBy) {
            case 'licores':
              return producto.id_categoria === 7 || producto.id_categoria === 33; // IDs para licores
            case 'vapeadores':
              return producto.id_categoria === 46; // ID para vapeadores
            case 'gaseosa':
              return producto.id_categoria === 8; // ID para gaseosas
            case 'cerveza':
              return producto.id_categoria === 15; // ID para cervezas
            case 'none':
            default:
              return true; // Mostrar todos los productos cuando no hay tag seleccionado
          }
        });

        // Ordenar por nombre por defecto
        productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

        onSearchResults(productosFiltrados);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        onSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    executeSearch();
  }, [debouncedQuery, sortBy, searchProductos, onSearchResults]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
    
    // Deseleccionar tag si se está escribiendo en el buscador
    if (value.trim() && sortBy !== 'none') {
      setSortBy('none');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearchChange?.('');
    onSearchResults([]);
    // Deseleccionar tag al limpiar búsqueda
    setSortBy('none');
  };

  // Función para manejar clic en tag de categoría
  const handleCategoryClick = (categoryType: SortOption) => {
    // Si el tag ya está seleccionado, deseleccionarlo
    if (sortBy === categoryType) {
      setSortBy('none');
      // Limpiar resultados de categoría específica
      onSearchResults([]);
      return;
    }
    
    setSortBy(categoryType);
    
    // Determinar IDs de categoría según el tipo
    let categoryIds: number | number[];
    switch (categoryType) {
      case 'licores':
        categoryIds = [7, 33];
        break;
      case 'vapeadores':
        categoryIds = 46;
        break;
      case 'gaseosa':
        categoryIds = 8;
        break;
      case 'cerveza':
        categoryIds = 15;
        break;
      default:
        categoryIds = [];
    }
    
    // Ejecutar submit con la categoría seleccionada
    onCategorySelect?.(categoryIds);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        />
        
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
          </div>
        )}
        
        {searchQuery && !isSearching && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtros de categorías */}
      {showSortOptions && (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCategoryClick('licores')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'licores' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={sortBy === 'licores' ? 'Clic para deseleccionar' : 'Clic para filtrar por Licores'}
            >
              Licores
            </button>
            <button
              onClick={() => handleCategoryClick('vapeadores')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'vapeadores' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={sortBy === 'vapeadores' ? 'Clic para deseleccionar' : 'Clic para filtrar por Vapeadores'}
            >
              Vapeadores
            </button>
            <button
              onClick={() => handleCategoryClick('gaseosa')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'gaseosa' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={sortBy === 'gaseosa' ? 'Clic para deseleccionar' : 'Clic para filtrar por Gaseosa'}
            >
              Gaseosa
            </button>
            <button
              onClick={() => handleCategoryClick('cerveza')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'cerveza' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={sortBy === 'cerveza' ? 'Clic para deseleccionar' : 'Clic para filtrar por Cerveza'}
            >
              Cerveza
            </button>
          </div>
        </div>
      )}

      {/* Indicador de resultados */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          {isSearching ? (
            <span>🔍 Buscando...</span>
          ) : (
            <div className="space-y-1">
              <span>
                📋 Búsqueda: &quot;{searchQuery}&quot; 
                {sortBy !== 'none' && (
                  <span className="ml-2 text-amber-600">
                    • Filtro: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </span>
                )}
              </span>
              <div className="text-xs text-gray-500">
                💡 Busca en: nombre, marca, SKU, nota, precio, categoría
                {sortBy !== 'none' && (
                  <span className="block mt-1">
                    🏷️ Clic en el tag &quot;{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}&quot; para deseleccionar
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 