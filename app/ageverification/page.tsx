'use client';

import { useEffect } from 'react';
import AgeVerification from '../componentes/ui/AgeVerification';
import { preloadService } from '../../lib/preloadService';
import { syncService } from '../../lib/indexedDB/syncService';
import { indexedDBService } from '../../lib/indexedDB/database';

export default function AgeVerificationPage() {
  // Efecto para ejecutar preload silencioso cuando se carga la página
  useEffect(() => {
    const executePreload = async () => {
      try {
        console.log('🚀 Iniciando preload silencioso desde age verification...');
        
        // 1. Inicializar IndexedDB
        await indexedDBService.init();
        console.log('✅ IndexedDB inicializado');
        
        // 2. Sincronizar categorías
        const result = await syncService.syncCategorias();
        if (result.success) {
          console.log(`✅ Categorías sincronizadas: ${result.data?.length} categorías`);
        } else {
          console.warn(`⚠️ Error en sincronización de categorías: ${result.error}`);
        }
        
        // 3. Ejecutar preload completo de productos
        await preloadService.startSilentPreload();
        console.log('✅ Preload completado desde age verification');
        
      } catch (error) {
        console.error('❌ Error en preload desde age verification:', error);
      }
    };

    // Ejecutar preload solo si no se ha completado antes
    if (!preloadService.isCompleted()) {
      executePreload();
    } else {
      console.log('✅ Preload ya completado anteriormente');
    }
  }, []);

  return <AgeVerification />;
}
