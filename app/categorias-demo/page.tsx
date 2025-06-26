import CategoriesManagement from '../componentes/productos/Categoriesmanagement';

export default function CategoriasDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Categorías - Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema completo de gestión CRUD para categorías con sincronización entre IndexedDB y base de datos remota.
          </p>
        </div>
        
        <CategoriesManagement />
      </div>
    </div>
  );
} 