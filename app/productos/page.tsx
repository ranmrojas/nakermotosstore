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
