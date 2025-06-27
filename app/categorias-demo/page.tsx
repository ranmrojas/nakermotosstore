'use client';

import CategoriesManagement from '../componentes/productos/Categoriesmanagement';

export default function CategoriasDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Categorías - Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema completo de gestión CRUD para categorías con sincronización entre IndexedDB y base de datos remota.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestión de Categorías
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema CRUD completo para categorías con sincronización automática entre IndexedDB y base de datos remota.
              </p>
            </div>
            <CategoriesManagement />
          </div>
        </div>
      </div>
    </div>
  );
} 