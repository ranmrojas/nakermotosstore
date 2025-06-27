'use client';
import { useRef, useEffect } from 'react';
import ProductGridWithSidebar, { ProductGridWithSidebarRef } from '@/app/componentes/productos/ProductGridWithSidebar';
import ButtonNav from '@/app/componentes/ui/ButtonNav';
import { useCategorias } from '../../hooks/useCategorias';
import { productosSyncService } from '../../lib/indexedDB/productosSyncService';

export default function ProductosPage() {
  const sidebarRef = useRef<ProductGridWithSidebarRef>(null);
  const { categorias } = useCategorias();

  // Función para controlar el sidebar desde el ButtonNav
  const handleToggleSidebar = () => {
    if (sidebarRef.current) {
      sidebarRef.current.toggleSidebar();
    }
  };

  // Efecto para iniciar descarga silenciosa de todos los productos
  useEffect(() => {
    if (categorias.length > 0) {
      console.log('🚀 Iniciando descarga silenciosa de todos los productos...');
      
      const iniciarDescargaSilenciosa = async () => {
        try {
          const categoriasFormateadas = categorias.map(cat => ({ 
            id: cat.id, 
            nombre: cat.nombre 
          }));
          
          console.log(`📋 Descargando productos de ${categoriasFormateadas.length} categorías...`);
          
          // Usar sincronización inteligente (solo categorías que necesitan actualización)
          await productosSyncService.syncProductosInteligente(categoriasFormateadas);
          
          console.log('✅ Descarga silenciosa de productos completada');
        } catch (error) {
          console.error('❌ Error en descarga silenciosa de productos:', error);
        }
      };

      // Ejecutar descarga silenciosa siempre que haya categorías
      // El servicio maneja internamente si necesita sincronizar o no
      iniciarDescargaSilenciosa();
    }
  }, [categorias]);

  return (
    <div className="h-screen">
      <ProductGridWithSidebar 
        ref={sidebarRef}
        showAddToCart={true}
        showSearch={true}
        searchPlaceholder="Buscar por nombre, marca, SKU, precio..."
      />

      {/* ButtonNav con callback para controlar el sidebar */}
      <ButtonNav 
        accentColor="amber" 
        onToggleSidebar={handleToggleSidebar}
      />
    </div>
  );
}
