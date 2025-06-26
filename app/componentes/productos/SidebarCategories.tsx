"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useCategorias } from "../../../hooks/useCategorias";
import { HomeIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface SidebarCategoriesProps {
  onCategorySelect?: (categoryId: number | null) => void;
  selectedCategoryId?: number | null;
}

export default function SidebarCategories({
  onCategorySelect,
  selectedCategoryId = null,
}: SidebarCategoriesProps) {
  const { categorias, loading } = useCategorias();
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  // Filtrar solo categorías activas
  const categoriasActivas = useMemo(() => {
    console.log("Total categorías recibidas:", categorias.length);
    const activas = categorias.filter((cat) => cat.activa);
    console.log("Categorías activas:", activas.length);
    
    // Revisar si tenemos categorías con padres
    const conPadres = activas.filter(cat => cat.categoriaPadreId !== null && cat.categoriaPadreId !== undefined);
    console.log("Categorías con padre:", conPadres.length);
    
    return activas;
  }, [categorias]);

  // Definir el tipo para nuestra estructura de nodos.
  type CategoriaNode = (typeof categorias)[0] & { subcategorias: CategoriaNode[] };

  // Construir la estructura jerárquica de categorías
  const categoriasPorJerarquia: CategoriaNode[] = useMemo(() => {
    const map = new Map<number, CategoriaNode>();
    const roots: CategoriaNode[] = [];
    
    console.log("Total categorías activas:", categoriasActivas.length);

    // 1. Crear una copia de cada categoría activa con array de subcategorías vacío
    categoriasActivas.forEach(cat => {
        map.set(cat.id, { ...cat, subcategorias: [] });
    });
    
    // 2. Asignar subcategorías a sus padres y determinar cuáles son categorías raíz
    categoriasActivas.forEach(cat => {
        // Si tiene un ID de padre...
        if (cat.categoriaPadreId !== null && cat.categoriaPadreId !== undefined) {
            const parent = map.get(cat.categoriaPadreId);
            
            if (parent) {
                // Obtener la versión del mapa que ya incluye la propiedad subcategorias
                const childNode = map.get(cat.id);
                if (childNode) {
                    // Añadir como subcategoría de su padre
                    parent.subcategorias.push(childNode);
                    console.log(`Añadiendo ${childNode.nombre} como subcategoría de ${parent.nombre}`);
                }
            } else {
                // Si el padre no existe, tratarla como categoría raíz
                const node = map.get(cat.id);
                if (node) {
                    roots.push(node);
                    console.log(`Categoría ${cat.nombre} tiene padre ID ${cat.categoriaPadreId} que no existe - tratando como raíz`);
                }
            }
        } else {
            // Si no tiene padre, es categoría raíz
            const node = map.get(cat.id);
            if (node) {
                roots.push(node);
                console.log(`Categoría raíz: ${node.nombre} (ID: ${node.id})`);
            }
        }
    });

    // 3. Ordenar alfabéticamente
    const sortByName = (a: CategoriaNode, b: CategoriaNode) => a.nombre.localeCompare(b.nombre);
    
    roots.sort(sortByName);
    roots.forEach(root => {
        if (root.subcategorias.length > 0) {
            root.subcategorias.sort(sortByName);
            console.log(`${root.nombre} tiene ${root.subcategorias.length} subcategorías`);
        }
    });
    
    console.log("Total categorías raíz:", roots.length);
    console.log("Categorías con subcategorías:", roots.filter(r => r.subcategorias.length > 0).length);

    return roots;
  }, [categoriasActivas]);

  // Efecto para auto-expandir categorías con subcategorías cuando se carguen
  useEffect(() => {
    if (categoriasPorJerarquia.length > 0) {
      const categoriasConSubcategorias = categoriasPorJerarquia
        .filter(cat => cat.subcategorias && cat.subcategorias.length > 0)
        .map(cat => cat.id);
        
      if (categoriasConSubcategorias.length > 0) {
        console.log("Auto-expandiendo categorías:", categoriasConSubcategorias);
        setExpandedCategories(categoriasConSubcategorias);
      }
    }
  }, [categoriasPorJerarquia]);

  // Manejar selección de categoría
  const handleSelect = (id: number | null) => {
    console.log('Categoría seleccionada en SidebarCategories:', id);
    // Asegurarse de que el ID sea válido antes de enviarlo al componente padre
    if (id !== null) {
      // Llamar a la función del componente padre con el ID de la categoría
      onCategorySelect?.(id);
    } else {
      console.warn('Se intentó seleccionar una categoría con ID nulo');
    }
  };

  // Manejar expansión/colapso de una categoría
  const handleToggleExpand = (id: number) => {
    setExpandedCategories(current => 
      current.includes(id) 
        ? current.filter(catId => catId !== id) 
        : [...current, id]
    );
  };

  // Verificar si una categoría está expandida
  const isCategoryExpanded = (id: number) => expandedCategories.includes(id);

  return (
    <aside className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <h2 className="text-md font-bold text-blue-900 dark:text-blue-400 mb-2">Categorías</h2>
      <ul className="space-y-1 overflow-y-auto max-h-[70vh]">
        {/* Opción Todos */}
        <li>
          <button
            className={`flex items-center w-full px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left font-medium ${
              selectedCategoryId === null ? "text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/30" : "text-gray-900 dark:text-white"
            }`}
            onClick={() => handleSelect(null)}
          >
            <HomeIcon className="h-4 w-4 mr-1 text-blue-700 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">Todos los productos</span>
          </button>
        </li>

        <li className="border-t border-gray-100 dark:border-gray-700 pt-1 mt-1">
          {/* Lista de todas las categorías */}
          <ul className="space-y-0.5">
            {categoriasPorJerarquia.length > 0 ? (
              // Si tenemos estructura jerárquica, la mostramos
              categoriasPorJerarquia.map((categoria) => (
                <li key={categoria.id}>
                  {/* Categoría padre */}
                  <div className="flex flex-col">
                    <div className="flex items-center group">
                      <button
                        className={`flex-1 flex items-center px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left text-sm ${
                          selectedCategoryId === categoria.id ? "text-blue-700 dark:text-blue-400 font-medium bg-blue-50/60 dark:bg-blue-900/30" : "text-gray-900 dark:text-white"
                        }`}
                        onClick={() => handleSelect(categoria.id)}
                      >
                        <span className="truncate">{categoria.nombre}</span>
                      </button>
                      
                      {/* Botón de expansión si tiene subcategorías */}
                      {categoria.subcategorias && categoria.subcategorias.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpand(categoria.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 group-hover:text-blue-700 dark:group-hover:text-blue-400 text-gray-400 dark:text-gray-500"
                        >
                          <ChevronRightIcon
                            className={`h-3.5 w-3.5 transition-transform ${
                              isCategoryExpanded(categoria.id) ? "transform rotate-90" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    
                    {/* Subcategorías expandibles */}
                    {categoria.subcategorias && 
                     categoria.subcategorias.length > 0 && 
                     isCategoryExpanded(categoria.id) && (
                      <ul className="pl-4 mt-0.5 space-y-0.5 border-l border-gray-100 dark:border-gray-700">
                        {categoria.subcategorias.map(subcategoria => (
                          <li key={subcategoria.id}>
                            <button
                              className={`flex items-center w-full px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left text-xs ${
                                selectedCategoryId === subcategoria.id ? "text-blue-700 dark:text-blue-400 font-medium bg-blue-50/60 dark:bg-blue-900/30" : "text-gray-700 dark:text-gray-300"
                              }`}
                              onClick={() => handleSelect(subcategoria.id)}
                            >
                              <span className="truncate">{subcategoria.nombre}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))
            ) : (
              // Si no tenemos estructura jerárquica, mostramos todas las categorías en una lista plana
              categoriasActivas.map((categoria) => (
                <li key={categoria.id}>
                  <button
                    className={`flex items-center w-full px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left text-sm ${
                      selectedCategoryId === categoria.id ? "text-blue-700 dark:text-blue-400 font-medium bg-blue-50/60 dark:bg-blue-900/30" : "text-gray-900 dark:text-white"
                    }`}
                    onClick={() => handleSelect(categoria.id)}
                  >
                    <span className="truncate">{categoria.nombre}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </li>
      </ul>
      
      {/* Estado de carga */}
      {loading && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2 py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
          <svg className="animate-spin h-3 w-3 text-blue-700 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          <span>Cargando categorías...</span>
        </div>
      )}
      
      {/* Mensaje si no hay categorías */}
      {!loading && categoriasPorJerarquia && categoriasPorJerarquia.length === 0 && categoriasActivas.length === 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 py-2 px-2 text-center">
          No hay categorías disponibles
        </div>
      )}
    </aside>
  );
}
