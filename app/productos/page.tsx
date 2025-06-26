'use client';
import ProductGridWithSidebar from '@/app/componentes/productos/ProductGridWithSidebar';

export default function ProductosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Catálogo de Productos
        </h1>
        <p className="text-gray-600">
          Explora nuestro catálogo completo de productos por categorías
        </p>
      </div>

      <ProductGridWithSidebar 
        defaultCategoryId={null} // Usará automáticamente la primera categoría disponible
        limit={24}
        showAddToCart={true}
      />
    </div>
  );
}
