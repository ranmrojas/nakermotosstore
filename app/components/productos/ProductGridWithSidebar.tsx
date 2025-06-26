'use client';

import React, { useState } from 'react';
import SidebarCategories from './SidebarCategories';
import ProductGrid from './ProductGrid';

interface ProductGridWithSidebarProps {
  defaultCategoryId?: number | null;
  limit?: number;
  showAddToCart?: boolean;
}

export default function ProductGridWithSidebar({ 
  defaultCategoryId = null,
  limit = 24,
  showAddToCart = true
}: ProductGridWithSidebarProps) {
  // Estado para manejar la categoría seleccionada
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(defaultCategoryId);

  // Manejador para cuando se selecciona una categoría en el sidebar
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Columna de sidebar - más estrecha y compacta */}
      <div className="w-full md:w-56 lg:w-60 flex-shrink-0">
        <SidebarCategories 
          onCategorySelect={handleCategorySelect}
          selectedCategoryId={selectedCategoryId}
        />
      </div>
      
      {/* Columna de productos - con más espacio */}
      <div className="flex-1">
        <ProductGrid 
          categoryId={selectedCategoryId}
          defaultCategoryId={defaultCategoryId}
          limit={limit}
          showAddToCart={showAddToCart}
          showCategorySelector={false} // No necesitamos selector, ya tenemos el sidebar
        />
      </div>
    </div>
  );
}
