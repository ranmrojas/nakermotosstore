'use client';

import React, { useState, useEffect } from 'react';
import SidebarCategories from './SidebarCategories';
import ProductGrid from './ProductGrid';
import { useCategorias } from '../../../hooks/useCategorias';

interface ProductGridWithSidebarProps {
  defaultCategoryId?: number | null;
  showAddToCart?: boolean;
}

export default function ProductGridWithSidebar({ 
  defaultCategoryId = null,
  showAddToCart = true
}: ProductGridWithSidebarProps) {
  // Estado para manejar la categoría seleccionada
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(defaultCategoryId);
  
  // Obtener categorías usando el hook
  const { categorias, loading: categoriasLoading } = useCategorias();

  // Efecto para seleccionar una categoría por defecto si no hay ninguna seleccionada
  useEffect(() => {
    // Solo intentar seleccionar una categoría si:
    // 1. No hay una categoría seleccionada actualmente
    // 2. Las categorías ya se han cargado
    // 3. Hay al menos una categoría disponible
    if (selectedCategoryId === null && !categoriasLoading && categorias.length > 0) {
      // Buscar categorías principales (sin categoriaPadreId)
      const categoriasPrincipales = categorias.filter(cat => 
        cat.activa && (cat.categoriaPadreId === null || cat.categoriaPadreId === undefined)
      );
      
      // Si hay categorías principales, seleccionar la primera
      if (categoriasPrincipales.length > 0) {
        console.log('Seleccionando categoría por defecto:', categoriasPrincipales[0].nombre);
        setSelectedCategoryId(categoriasPrincipales[0].id);
      } 
      // Si no hay categorías principales, seleccionar la primera categoría activa
      else {
        const categoriasActivas = categorias.filter(cat => cat.activa);
        if (categoriasActivas.length > 0) {
          console.log('Seleccionando primera categoría activa:', categoriasActivas[0].nombre);
          setSelectedCategoryId(categoriasActivas[0].id);
        }
      }
    }
  }, [categorias, categoriasLoading, selectedCategoryId]);

  // Manejador para cuando se selecciona una categoría en el sidebar
  const handleCategorySelect = (categoryId: number | null) => {
    console.log('Categoría seleccionada en ProductGridWithSidebar:', categoryId);
    // Asegurarse de que categoryId sea un número válido antes de actualizar el estado
    if (categoryId !== null) {
      setSelectedCategoryId(categoryId);
    } else {
      console.warn('Se intentó seleccionar una categoría nula');
    }
  };

  // Depuración para verificar el estado actual
  console.log('Estado actual en ProductGridWithSidebar:', {
    selectedCategoryId,
    defaultCategoryId
  });

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
        {selectedCategoryId !== null ? (
          <>
            <div className="mb-2 text-sm text-gray-500">
              Mostrando productos de la categoría ID: {selectedCategoryId}
            </div>
            <ProductGrid 
              categoryId={selectedCategoryId}
              limit={1000} /* Valor alto para asegurar que se muestren todos los productos */
              showAddToCart={showAddToCart}
              showCategorySelector={false}
            />
          </>
        ) : (
          <div className="p-4 bg-gray-50 rounded text-center">
            Selecciona una categoría para ver los productos
          </div>
        )}
      </div>
    </div>
  );
}
