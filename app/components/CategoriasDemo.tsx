'use client';

import { useState } from 'react';
import CategoriasMenu from './productos/CategoriasMenu';

export default function CategoriasDemo() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<{
    id: number;
    nombre: string;
    esPadre: boolean;
  } | null>(null);

  const handleCategoriaClick = (categoriaId: number, esPadre: boolean) => {
    // Aquí puedes implementar la lógica para filtrar productos
    // o navegar a la página correspondiente
    console.log(`Categoría seleccionada: ${categoriaId}, Es padre: ${esPadre}`);
    
    // Por ahora solo actualizamos el estado para mostrar la selección
    setCategoriaSeleccionada({
      id: categoriaId,
      nombre: `Categoría ${categoriaId}`,
      esPadre
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demo: Sistema de Categorías
          </h1>
          <p className="text-gray-600">
            Este es un ejemplo de cómo usar el componente CategoriasMenu con IndexedDB
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de categorías */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CategoriasMenu 
                onCategoriaClick={handleCategoriaClick}
                className="h-full"
              />
            </div>
          </div>

          {/* Panel de información */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información de la Categoría
              </h2>
              
              {categoriaSeleccionada ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Categoría Seleccionada
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">ID:</span> {categoriaSeleccionada.id}
                      </div>
                      <div>
                        <span className="font-medium">Nombre:</span> {categoriaSeleccionada.nombre}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> 
                        <span className={`ml-1 px-2 py-1 text-xs rounded ${
                          categoriaSeleccionada.esPadre 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {categoriaSeleccionada.esPadre ? 'Categoría Padre' : 'Subcategoría'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Acciones Disponibles
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {categoriaSeleccionada.esPadre ? (
                        <div>
                          <p>• Mostrar productos de esta categoría y todas sus subcategorías</p>
                          <p>• Expandir/colapsar subcategorías</p>
                          <p>• Filtrar productos por categoría principal</p>
                        </div>
                      ) : (
                        <div>
                          <p>• Mostrar productos solo de esta subcategoría</p>
                          <p>• Filtrar productos específicos</p>
                          <p>• Navegar a productos de esta subcategoría</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Implementación Sugerida
                    </h4>
                    <p className="text-sm text-yellow-800">
                      Aquí puedes implementar la lógica para:
                    </p>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                      <li>• Filtrar productos por categoría</li>
                      <li>• Navegar a páginas de productos</li>
                      <li>• Actualizar el estado de la aplicación</li>
                      <li>• Mostrar breadcrumbs de navegación</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Selecciona una categoría
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Haz clic en cualquier categoría del menú para ver su información
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Características del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">⚡</div>
              <h3 className="font-medium text-gray-900 mt-2">Carga Rápida</h3>
              <p className="text-sm text-gray-600 mt-1">Datos desde IndexedDB</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">🔄</div>
              <h3 className="font-medium text-gray-900 mt-2">Sincronización</h3>
              <p className="text-sm text-gray-600 mt-1">Automática cada 24h</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">📱</div>
              <h3 className="font-medium text-gray-900 mt-2">Offline</h3>
              <p className="text-sm text-gray-600 mt-1">Funciona sin internet</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">🎯</div>
              <h3 className="font-medium text-gray-900 mt-2">Jerárquico</h3>
              <p className="text-sm text-gray-600 mt-1">Padre e hijas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 