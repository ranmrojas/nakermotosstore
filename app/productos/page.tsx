'use client';
import { useRef } from 'react';
import ProductGridWithSidebar, { ProductGridWithSidebarRef } from '@/app/componentes/productos/ProductGridWithSidebar';
import ButtonNav from '@/app/componentes/ui/ButtonNav';

export default function ProductosPage() {
  const sidebarRef = useRef<ProductGridWithSidebarRef>(null);

  // Función para controlar el sidebar desde el ButtonNav
  const handleToggleSidebar = () => {
    if (sidebarRef.current) {
      sidebarRef.current.toggleSidebar();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Catálogo de Productos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explora nuestro catálogo completo de productos por categorías
        </p>
      </div>

      <ProductGridWithSidebar 
        ref={sidebarRef}
        showAddToCart={true}
      />

      {/* ButtonNav con callback para controlar el sidebar */}
      <ButtonNav 
        accentColor="amber" 
        onToggleSidebar={handleToggleSidebar}
      />
    </div>
  );
}
