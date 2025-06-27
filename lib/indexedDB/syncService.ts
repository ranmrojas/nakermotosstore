import { indexedDBService } from './database';

// Configuración de sincronización
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
const LAST_SYNC_KEY = 'lastCategoriasSync';
const CATEGORIAS_VERSION_KEY = 'categoriasVersion';

interface Categoria {
  id: number;
  nombre: string;
  categoriaPadreId?: number;
  activa: boolean;
  [key: string]: unknown;
}

interface SyncResult {
  success: boolean;
  data?: Categoria[];
  error?: string;
}

interface SyncStats {
  lastSync: Date | null;
  needsSync: boolean;
  timeUntilNextSync: number | null;
  categoriasCount: number;
}

export class SyncService {
  // Verificar si necesita sincronización
  async needsSync(): Promise<boolean> {
    try {
      const lastSync = await indexedDBService.getMetadata(LAST_SYNC_KEY);
      
      if (!lastSync) {
        return true; // Primera vez, necesita sincronizar
      }

      const timestamp = (lastSync as { timestamp: number }).timestamp;
      const timeSinceLastSync = Date.now() - timestamp;
      return timeSinceLastSync >= SYNC_INTERVAL;
    } catch (error) {
      console.error('Error verificando sincronización:', error);
      return true; // En caso de error, sincronizar
    }
  }

  // Obtener timestamp de última sincronización
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSync = await indexedDBService.getMetadata(LAST_SYNC_KEY);
      if (!lastSync) return null;
      
      const timestamp = (lastSync as { timestamp: number }).timestamp;
      return new Date(timestamp);
    } catch (error) {
      console.error('Error obteniendo última sincronización:', error);
      return null;
    }
  }

  // Sincronizar categorías desde el API
  async syncCategorias(): Promise<SyncResult> {
    try {
      console.log('🔄 Iniciando sincronización de categorías...');
      
      // Obtener datos del API - usamos el parámetro correcto 'activa' en lugar de 'soloActivas'
      const response = await fetch('/api/categorias?activa=true');
      
      if (!response.ok) {
        throw new Error(`Error del API: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📡 Respuesta del API:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la respuesta del API');
      }

      // Verificar que tenemos datos
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        console.error('❌ Datos inválidos recibidos del API:', result);
        throw new Error('No se recibieron datos de categorías del API');
      }

      console.log(`📊 Recibidas ${result.data.length} categorías del API`);
      console.log(`📋 Ejemplo de categoría recibida:`, JSON.stringify(result.data[0], null, 2));
      
      // Guardar categorías en IndexedDB
      await indexedDBService.saveCategorias(result.data as Categoria[]);
      
      // Verificar que se guardaron correctamente
      const categoriasGuardadas = await indexedDBService.getCategorias();
      console.log(`💾 Guardadas ${categoriasGuardadas.length} categorías en IndexedDB`);
      
      // Actualizar metadata
      const now = Date.now();
      await indexedDBService.saveMetadata(LAST_SYNC_KEY, { timestamp: now });
      await indexedDBService.saveMetadata(CATEGORIAS_VERSION_KEY, { count: result.data.length });

      console.log('✅ Sincronización completada exitosamente');
      
      return {
        success: true,
        data: result.data as Categoria[]
      };

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Sincronización forzada (manual)
  async forceSync(): Promise<SyncResult> {
    console.log('🔄 Sincronización forzada...');
    return await this.syncCategorias();
  }

  // Obtener estadísticas de sincronización
  async getSyncStats(): Promise<SyncStats> {
    try {
      const lastSync = await this.getLastSyncTime();
      const needsSync = await this.needsSync();
      const categorias = await indexedDBService.getCategorias();
      
      let timeUntilNextSync = null;
      if (lastSync) {
        const timeSinceLastSync = Date.now() - lastSync.getTime();
        timeUntilNextSync = Math.max(0, SYNC_INTERVAL - timeSinceLastSync);
      }

      return {
        lastSync,
        needsSync,
        timeUntilNextSync,
        categoriasCount: categorias.length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        lastSync: null,
        needsSync: true,
        timeUntilNextSync: null,
        categoriasCount: 0
      };
    }
  }

  // Limpiar datos y forzar nueva sincronización
  async reset(): Promise<void> {
    try {
      await indexedDBService.clear();
      console.log('🗑️ Datos de IndexedDB limpiados');
    } catch (error) {
      console.error('Error limpiando datos:', error);
      throw error;
    }
  }

  // Verificar si el navegador soporta IndexedDB
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
}

// Instancia singleton
export const syncService = new SyncService(); 