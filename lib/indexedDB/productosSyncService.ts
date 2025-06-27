import { indexedDBService } from './database';

// Configuración de sincronización
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
const LAST_PRODUCTOS_SYNC_KEY = 'lastProductosSync';
const PRODUCTOS_VERSION_KEY = 'productosVersion';
const MAX_CONCURRENT_REQUESTS = 3; // Máximo 3 peticiones simultáneas

interface Producto {
  id_producto: number;
  nombre: string;
  alias: string;
  precio_venta: number;
  precio_venta_online: number | null;
  precio_promocion_online: number;
  existencias: number;
  vende_sin_existencia: number;
  id_categoria: number;
  nombre_categoria: string;
  id_marca: number;
  nombre_marca: string;
  id_imagen: number | null;
  ext1: string | null;
  ext2: string | null;
  mostrar_tienda_linea: number;
  mostrar_catalogo_linea: number;
  es_servicio: number;
  fecha_Ini_promocion_online: number | null;
  fecha_fin_promocion_online: number | null;
  // Campos adicionales del API
  dias_aplica_promocion_online: string | null;
  controla_inventario_tienda_linea: number;
  id_cocina: number | null;
  tiempo_preparacion: number;
  tipo_promocion_online: number;
  id_padre: number | null;
  sku: string;
  total_estampilla: number;
  total_impoconsumo: number;
  cups: string | null;
  configuracion_dinamica: string | null;
  id_sucursal: number;
  vender_solo_presentacion: number;
  presentaciones: string | null;
  id_tipo_medida: number;
  id_tipo_producto: number;
  tipo_impuesto: number;
  id_impuesto: number;
  valor_impuesto: number;
  invima: string;
  cum: string;
  nota: string;
  unidad_medida: string;
  nombre_impuesto: string;
  dias_aplica_venta_online: string;
  hora_aplica_venta_online: string;
  hora_aplica_venta_fin_online: string;
  hora_Ini_promocion_online: string | null;
  hora_fecha_fin_promocion_online: string | null;
  [key: string]: unknown; // Para campos adicionales
}

interface SyncResult {
  success: boolean;
  data?: Producto[];
  error?: string;
  categoriaId?: number;
}

interface SyncProgress {
  totalCategorias: number;
  categoriasCompletadas: number;
  categoriasConError: number;
  productosDescargados: number;
  isComplete: boolean;
}

export class ProductosSyncService {
  private isSyncing = false;
  private syncProgress: SyncProgress = {
    totalCategorias: 0,
    categoriasCompletadas: 0,
    categoriasConError: 0,
    productosDescargados: 0,
    isComplete: true
  };

  // Verificar si necesita sincronización para una categoría específica
  async needsSync(categoriaId: number): Promise<boolean> {
    try {
      const lastSync = await indexedDBService.getMetadata(`${LAST_PRODUCTOS_SYNC_KEY}_${categoriaId}`);
      
      if (!lastSync) {
        return true; // Primera vez, necesita sincronizar
      }

      const timestamp = (lastSync as { timestamp: number }).timestamp;
      const timeSinceLastSync = Date.now() - timestamp;
      return timeSinceLastSync >= SYNC_INTERVAL;
    } catch (error: unknown) {
      console.error('Error verificando sincronización de productos:', error);
      return true; // En caso de error, sincronizar
    }
  }

  // Obtener timestamp de última sincronización para una categoría
  async getLastSyncTime(categoriaId: number): Promise<Date | null> {
    try {
      const lastSync = await indexedDBService.getMetadata(`${LAST_PRODUCTOS_SYNC_KEY}_${categoriaId}`);
      if (!lastSync) return null;
      
      const timestamp = (lastSync as { timestamp: number }).timestamp;
      return new Date(timestamp);
    } catch (error: unknown) {
      console.error('Error obteniendo última sincronización de productos:', error);
      return null;
    }
  }

  // Sincronizar productos de una categoría específica
  async syncProductosByCategoria(categoriaId: number): Promise<SyncResult> {
    try {
      console.log(`🔄 Sincronizando productos de categoría ${categoriaId}...`);
      
      const response = await fetch(`/api/extract/products?id_categoria=${categoriaId}`);
      
      if (!response.ok) {
        throw new Error(`Error del API: ${response.status}`);
      }

      const result = await response.json();
      
      // Verificar si es un array directo o tiene la propiedad respuesta
      let productos: Producto[];
      
      if (Array.isArray(result)) {
        // El API devuelve directamente un array de productos
        productos = result as Producto[];
      } else if (result.respuesta && Array.isArray(result.respuesta)) {
        // El API devuelve un objeto con propiedad respuesta
        productos = result.respuesta as Producto[];
      } else {
        console.error('❌ Formato de respuesta inesperado:', result);
        throw new Error('Formato de respuesta inesperado del API');
      }
      
      if (productos.length === 0) {
        console.log(`⚠️ No hay productos en la categoría ${categoriaId}`);
        return {
          success: true,
          data: [],
          categoriaId
        };
      }

      console.log(`📦 Descargados ${productos.length} productos de categoría ${categoriaId}`);
      console.log(`📋 Ejemplo de producto:`, JSON.stringify(productos[0], null, 2));
      
      // Guardar productos en IndexedDB
      await indexedDBService.saveProductosByCategoria(categoriaId, productos);
      
      // Actualizar metadata
      const now = Date.now();
      await indexedDBService.saveMetadata(`${LAST_PRODUCTOS_SYNC_KEY}_${categoriaId}`, { timestamp: now });

      console.log(`✅ Productos de categoría ${categoriaId} sincronizados correctamente`);
      
      return {
        success: true,
        data: productos,
        categoriaId
      };

    } catch (error: unknown) {
      console.error(`❌ Error sincronizando productos de categoría ${categoriaId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        categoriaId
      };
    }
  }

  // Sincronización masiva de productos (descarga silenciosa)
  async syncAllProductos(categorias: { id: number; nombre: string }[]): Promise<void> {
    if (this.isSyncing) {
      console.log('🔄 Sincronización ya en progreso...');
      return;
    }

    this.isSyncing = true;
    this.syncProgress = {
      totalCategorias: categorias.length,
      categoriasCompletadas: 0,
      categoriasConError: 0,
      productosDescargados: 0,
      isComplete: false
    };

    console.log(`🚀 Iniciando sincronización silenciosa de ${categorias.length} categorías...`);

    try {
      // Procesar categorías en chunks para no saturar el servidor
      const chunks = this.chunkArray(categorias, MAX_CONCURRENT_REQUESTS);
      
      for (const chunk of chunks) {
        const promises = chunk.map(async (categoria) => {
          try {
            const result = await this.syncProductosByCategoria(categoria.id);
            
            if (result.success) {
              this.syncProgress.categoriasCompletadas++;
              this.syncProgress.productosDescargados += result.data?.length || 0;
            } else {
              this.syncProgress.categoriasConError++;
            }
            
            return result;
          } catch (error: unknown) {
            this.syncProgress.categoriasConError++;
            console.error(`Error en categoría ${categoria.id}:`, error);
            return { success: false, error: String(error), categoriaId: categoria.id };
          }
        });

        // Esperar a que se completen todas las peticiones del chunk
        await Promise.all(promises);
        
        // Pequeña pausa entre chunks para no saturar
        await this.delay(100);
      }

      // Actualizar metadata general
      const now = Date.now();
      await indexedDBService.saveMetadata(LAST_PRODUCTOS_SYNC_KEY, { timestamp: now });
      await indexedDBService.saveMetadata(PRODUCTOS_VERSION_KEY, { 
        totalCategorias: categorias.length,
        fechaUltimaSincronizacion: now
      });

      this.syncProgress.isComplete = true;
      console.log(`✅ Sincronización masiva completada: ${this.syncProgress.categoriasCompletadas}/${this.syncProgress.totalCategorias} categorías, ${this.syncProgress.productosDescargados} productos`);

    } catch (error: unknown) {
      console.error('❌ Error en sincronización masiva:', error);
      this.syncProgress.isComplete = true;
    } finally {
      this.isSyncing = false;
    }
  }

  // Sincronización inteligente (solo categorías que necesitan sync)
  async syncProductosInteligente(categorias: { id: number; nombre: string }[]): Promise<void> {
    const categoriasNecesarias: { id: number; nombre: string }[] = [];

    // Verificar qué categorías necesitan sincronización
    for (const categoria of categorias) {
      const needsSync = await this.needsSync(categoria.id);
      if (needsSync) {
        categoriasNecesarias.push(categoria);
      }
    }

    if (categoriasNecesarias.length === 0) {
      console.log('✅ Todas las categorías están actualizadas');
      return;
    }

    console.log(`🔄 Sincronizando ${categoriasNecesarias.length} categorías que necesitan actualización...`);
    await this.syncAllProductos(categoriasNecesarias);
  }

  // Obtener progreso de sincronización
  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  // Verificar si está sincronizando
  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  // Obtener estadísticas de sincronización
  async getSyncStats(): Promise<{
    lastSync: Date | null;
    totalProductos: number;
    categoriasConProductos: number;
    productosTiendaOnline: number;
    isSyncing: boolean;
  }> {
    try {
      const lastSync = await indexedDBService.getMetadata(LAST_PRODUCTOS_SYNC_KEY);
      const stats = await indexedDBService.getProductosStats();
      
      return {
        lastSync: lastSync ? new Date((lastSync as { timestamp: number }).timestamp) : null,
        ...stats,
        isSyncing: this.isSyncing
      };
    } catch (error: unknown) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        lastSync: null,
        totalProductos: 0,
        categoriasConProductos: 0,
        productosTiendaOnline: 0,
        isSyncing: this.isSyncing
      };
    }
  }

  // Limpiar datos y forzar nueva sincronización
  async reset(): Promise<void> {
    try {
      this.isSyncing = false;
      await indexedDBService.clearProductos();
      console.log('🗑️ Datos de productos limpiados');
    } catch (error: unknown) {
      console.error('Error limpiando datos de productos:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verificar si el navegador soporta IndexedDB
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
}

// Instancia singleton
export const productosSyncService = new ProductosSyncService(); 