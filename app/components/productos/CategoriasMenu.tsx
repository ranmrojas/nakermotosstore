'use client';

import { useState } from 'react';
import { useCategorias } from '../../../hooks/useCategorias';

interface CategoriasMenuProps {
  onCategoriaClick?: (categoriaId: number, esPadre: boolean) => void;
  className?: string;
}

export default function CategoriasMenu({ onCategoriaClick, className = '' }: CategoriasMenuProps) {
  const { 
    categorias, 
    loading, 
    error, 
    syncing, 
    forceSync, 
    stats 
  } = useCategorias();

  const [expandedCategorias, setExpandedCategorias] = useState<Set<number>>(new Set());

  // Manejar expansión/colapso de categorías
  const toggleCategoria = (categoriaId: number) => {
    const newExpanded = new Set(expandedCategorias);
    if (newExpanded.has(categoriaId)) {
      newExpanded.delete(categoriaId);
    } else {
      newExpanded.add(categoriaId);
    }
    setExpandedCategorias(newExpanded);
  };

  // Manejar clic en categoría
  const handleCategoriaClick = (categoriaId: number, esPadre: boolean) => {
    if (onCategoriaClick) {
      onCategoriaClick(categoriaId, esPadre);
    }
  };

  // Formatear tiempo desde última sincronización
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace menos de 1 hora';
    if (hours === 1) return 'Hace 1 hora';
    if (hours < 24) return `Hace ${hours} horas`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">Error al cargar categorías</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={forceSync}
            disabled={syncing}
            className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            {syncing ? 'Reintentando...' : 'Reintentar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header con estadísticas y sincronización */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Categorías ({stats.totalCategorias})
          </h2>
          <button
            onClick={forceSync}
            disabled={syncing}
            className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sincronizando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </>
            )}
          </button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <div>Subcategorías: {stats.totalSubcategorias}</div>
          <div>Activas: {stats.categoriasActivas}</div>
          <div>Última actualización: {formatLastSync(stats.lastSync)}</div>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="max-h-96 overflow-y-auto">
        {categorias.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay categorías disponibles
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categorias.map((categoria) => (
              <li key={categoria.id} className="relative">
                {/* Categoría padre */}
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
                  <div 
                    className="flex items-center flex-1"
                    onClick={() => handleCategoriaClick(categoria.id, true)}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {categoria.nombre}
                    </span>
                    {!categoria.activa && (
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactiva
                      </span>
                    )}
                  </div>
                  
                  {/* Botón expandir/colapsar */}
                  {categoria.tieneSubcategorias && (
                    <button
                      onClick={() => toggleCategoria(categoria.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedCategorias.has(categoria.id) ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Subcategorías */}
                {categoria.tieneSubcategorias && expandedCategorias.has(categoria.id) && (
                  <ul className="bg-gray-50 border-l-2 border-blue-200">
                    {categoria.subcategorias.map((subcategoria) => (
                      <li key={subcategoria.id}>
                        <div 
                          className="flex items-center p-3 pl-6 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleCategoriaClick(subcategoria.id, false)}
                        >
                          <span className="text-sm text-gray-700">
                            {subcategoria.nombre}
                          </span>
                          {!subcategoria.activa && (
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 