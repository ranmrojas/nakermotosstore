'use client';
import { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGridWithSidebar, { ProductGridWithSidebarRef } from '@/app/componentes/productos/ProductGridWithSidebar';
import ButtonNav from '@/app/componentes/ui/ButtonNav';

export default function ProductosPage() {
  const sidebarRef = useRef<ProductGridWithSidebarRef>(null);
  const searchParams = useSearchParams();
  const [initialCategoryId, setInitialCategoryId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);

  // Obtener los parámetros de la URL al cargar
  useEffect(() => {
    if (searchParams) {
      const categoriaParam = searchParams.get('categoria');
      const productoParam = searchParams.get('producto');
      
      if (categoriaParam) {
        const categoryId = parseInt(categoriaParam);
        setInitialCategoryId(!isNaN(categoryId) ? categoryId : null);
      }
      
      if (productoParam) {
        const product = parseInt(productoParam);
        setProductId(!isNaN(product) ? product : null);
      }
    }
  }, [searchParams]);

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
        defaultCategoryId={initialCategoryId}
        targetProductId={productId}
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
