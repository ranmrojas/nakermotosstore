'use client';
import { useRef, useEffect, Suspense } from 'react';
import ProductGridWithSidebar, { ProductGridWithSidebarRef } from '@/app/componentes/productos/ProductGridWithSidebar';
import ButtonNav from '@/app/componentes/ui/ButtonNav';
import { useCategorias } from '../../hooks/useCategorias';
import { usePreload } from '../../hooks/usePreload';
import { productosSyncService } from '../../lib/indexedDB/productosSyncService';
import ProductSkeleton from '../componentes/productos/ProductSkeleton';

export default function ProductosPage() {
  const sidebarRef = useRef<ProductGridWithSidebarRef>(null);
  const { categorias } = useCategorias();
  const { isPreloadComplete } = usePreload();

  // Efecto optimizado para descarga silenciosa
  useEffect(() => {
    // Solo ejecutar si el preload no está completo y hay categorías
    if (!isPreloadComplete && categorias.length > 0) {
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

      // Ejecutar descarga silenciosa solo si no se hizo preload
      iniciarDescargaSilenciosa();
    } else if (isPreloadComplete) {
      console.log('✅ Datos ya precargados, saltando descarga silenciosa');
    }
  }, [categorias, isPreloadComplete]);

  return (
    <Suspense fallback={<ProductSkeleton count={20} />}>
      <div className="h-screen">
        <ProductGridWithSidebar 
          ref={sidebarRef}
          showAddToCart={true}
          showSearch={true}
          searchPlaceholder="Buscar por nombre, marca, SKU, precio..."
        />

        {/* ButtonNav */}
        <ButtonNav 
          accentColor="amber" 
        />
      </div>
    </Suspense>
  );
}
