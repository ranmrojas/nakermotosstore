'use client';
import ProductManagerList from '@/app/components/ProductManagerList';
import { useState } from 'react';

export default function ProductManagerPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('46');
  const [limit, setLimit] = useState<number>(40);

  const categories = [
    { id: '23', name: 'Todos los Dispositivos' },
    { id: '61', name: 'Dispositivos Desechables' },
    { id: '62', name: 'Capsulas' },
    { id: '63', name: 'Dispositivos Recargables' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Panel de Administración de Productos</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              id="category"
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              Límite de productos
            </label>
            <select
              id="limit"
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10 productos</option>
              <option value={20}>20 productos</option>
              <option value={40}>40 productos</option>
              <option value={100}>100 productos</option>
            </select>
          </div>
        </div>
      </div>
      
      <ProductManagerList 
        categoryId={selectedCategory}
        limit={limit}
      />
    </div>
  );
}
