'use client';

import React from 'react';
import { useCategorias } from '../../../hooks/useCategorias';

interface CategoriasMenuProps {
  selectedCategoryId: number;
  onCategoryChange: (categoryId: number) => void;
  className?: string;
  showLabel?: boolean;
}

export default function CategoriasMenu({ 
  selectedCategoryId, 
  onCategoryChange, 
  className = '',
  showLabel = true
}: CategoriasMenuProps) {
  const { categorias, getCategoriaById, loading } = useCategorias();

  const selectedCategoria = getCategoriaById(selectedCategoryId);

  if (loading) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-amber-800"></div>
        <span className="text-sm text-gray-500">Cargando categorías...</span>
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No hay categorías disponibles
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {showLabel && (
        <label htmlFor="categorias-menu" className="text-sm font-medium text-gray-700">
          Categoría:
        </label>
      )}
      <div className="relative">
        <select
          id="categorias-menu"
          value={selectedCategoryId}
          onChange={(e) => onCategoryChange(Number(e.target.value))}
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
      {selectedCategoria && (
        <span className="text-sm text-gray-500">
          {selectedCategoria.nombre}
        </span>
      )}
    </div>
  );
} 