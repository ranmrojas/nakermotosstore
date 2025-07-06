'use client';

import CategoriesManagement from '../../componentes/productos/Categoriesmanagement';
import AdminProtected from '../../componentes/admin/AdminProtected';

export default function CategoriasDemoPage() {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <CategoriesManagement />
            </div>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
} 