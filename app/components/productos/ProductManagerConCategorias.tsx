'use client';

import React, { useState } from 'react';
import ProductManagerList from './ProductManagerList';
import CategoriasMenu from './CategoriasMenu';
import { useCategorias } from '../../../hooks/useCategorias';

interface ProductManagerConCategoriasProps {
  defaultCategoryId?: number;
  limit?: number;
}

export default function ProductManagerConCategorias({ 
  defaultCategoryId = 46,
  limit = 50
}: ProductManagerConCategoriasProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(defaultCategoryId);
  const { categorias, getCategoriaById } = useCategorias();

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  const selectedCategoria = getCategoriaById(selectedCategoryId);

  return (
    <div className="space-y-6">
      {/* Header con selector de categorías */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Administración de Productos por Categoría
          </h2>
        </div>
        
        <CategoriasMenu
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={handleCategoryChange}
          showLabel={true}
        />
      </div>

      {/* Lista de productos */}
      <ProductManagerList
        categoryId={selectedCategoryId.toString()}
        limit={limit}
        showCategorySelector={false} // No mostrar selector aquí porque ya tenemos el menú arriba
      />
    </div>
  );
} 