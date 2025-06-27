import { useState, useEffect, useCallback } from 'react';
import { indexedDBService } from '../lib/indexedDB/database';
import { productosSyncService, ProductosSyncService } from '../lib/indexedDB/productosSyncService';

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
  [key: string]: any;
}

interface UseProductosReturn {
  // Estados
  productos: Producto[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  
  // Funciones
  getProductosByCategoria: (categoriaId: number) => Promise<Producto[]>;
  searchProductos: (query: string) => Promise<Producto[]>;
  getProductosTiendaOnline: () => Promise<Producto[]>;
  forceSyncCategoria: (categoriaId: number) => Promise<void>;
  forceSyncAll: () => Promise<void>;
  reset: () => Promise<void>;
  
  // Utilidades
  getProductoById: (id: number) => Producto | undefined;
  getProductosConPromocion: () => Producto[];
  getProductosDisponibles: () => Producto[];
  
  // Estadísticas
  stats: {
    totalProductos: number;
    categoriasConProductos: number;
    productosTiendaOnline: number;
    lastSync: Date | null;
    isSyncing: boolean;
  };
}

export const useProductos = (): UseProductosReturn => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalProductos: 0,
    categoriasConProductos: 0,
    productosTiendaOnline: 0,
    lastSync: null as Date | null,
    isSyncing: false
  });

  // Cargar productos desde IndexedDB
  const loadFromIndexedDB = useCallback(async () => {
    try {
      const data = await indexedDBService.getProductos();
      setProductos(data);
      
      // Actualizar estadísticas
      const stats = await indexedDBService.getProductosStats();
      const syncStats = await productosSyncService.getSyncStats();
      
      setStats(prev => ({
        ...prev,
        ...stats,
        lastSync: syncStats.lastSync,
        isSyncing: syncStats.isSyncing
      }));
      
    } catch (err) {
      console.error('Error cargando productos desde IndexedDB:', err);
      setError('Error cargando productos locales');
    }
  }, []);

  // Inicializar y cargar datos
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar si IndexedDB está soportado
      if (!ProductosSyncService.isSupported()) {
        setError('IndexedDB no está soportado en este navegador');
        setLoading(false);
        return;
      }

      // Inicializar IndexedDB (si no está inicializada)
      await indexedDBService.init();

      // Cargar datos locales
      await loadFromIndexedDB();

    } catch (err) {
      console.error('Error inicializando productos:', err);
      setError('Error inicializando productos');
    } finally {
      setLoading(false);
    }
  }, [loadFromIndexedDB]);

  // Obtener productos de una categoría específica
  const getProductosByCategoria = useCallback(async (categoriaId: number): Promise<Producto[]> => {
    try {
      // Primero intentar obtener desde IndexedDB
      const productosLocales = await indexedDBService.getProductosByCategoria(categoriaId);
      
      if (productosLocales.length > 0) {
        console.log(`📦 Productos de categoría ${categoriaId} cargados desde IndexedDB (${productosLocales.length} productos)`);
        return productosLocales;
      }

      // Si no hay productos locales, sincronizar
      console.log(`🔄 No hay productos locales para categoría ${categoriaId}, sincronizando...`);
      setSyncing(true);
      
      const result = await productosSyncService.syncProductosByCategoria(categoriaId);
      
      if (result.success && result.data) {
        console.log(`✅ Productos de categoría ${categoriaId} sincronizados (${result.data.length} productos)`);
        await loadFromIndexedDB(); // Recargar todos los productos
        return result.data;
      } else {
        throw new Error(result.error || 'Error sincronizando productos');
      }
      
    } catch (err) {
      console.error(`Error obteniendo productos de categoría ${categoriaId}:`, err);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [loadFromIndexedDB]);

  // Búsqueda de productos
  const searchProductos = useCallback(async (query: string): Promise<Producto[]> => {
    try {
      const resultados = await indexedDBService.searchProductos(query);
      return resultados.filter(p => p.mostrar_tienda_linea === 1);
    } catch (err) {
      console.error('Error buscando productos:', err);
      return [];
    }
  }, []);

  // Obtener productos para tienda online
  const getProductosTiendaOnline = useCallback(async (): Promise<Producto[]> => {
    try {
      return await indexedDBService.getProductosTiendaOnline();
    } catch (err) {
      console.error('Error obteniendo productos de tienda online:', err);
      return [];
    }
  }, []);

  // Sincronización forzada de una categoría
  const forceSyncCategoria = useCallback(async (categoriaId: number): Promise<void> => {
    try {
      setSyncing(true);
      setError(null);
      
      const result = await productosSyncService.syncProductosByCategoria(categoriaId);
      
      if (result.success) {
        await loadFromIndexedDB(); // Recargar datos
      } else {
        setError(result.error || 'Error en sincronización');
      }
      
    } catch (err) {
      console.error('Error en sincronización forzada:', err);
      setError('Error sincronizando productos');
    } finally {
      setSyncing(false);
    }
  }, [loadFromIndexedDB]);

  // Sincronización forzada de todas las categorías
  const forceSyncAll = useCallback(async (): Promise<void> => {
    try {
      setSyncing(true);
      setError(null);
      
      // Obtener categorías desde IndexedDB
      const categorias = await indexedDBService.getCategorias();
      const categoriasFormateadas = categorias.map(cat => ({ id: cat.id, nombre: cat.nombre }));
      
      await productosSyncService.syncAllProductos(categoriasFormateadas);
      await loadFromIndexedDB(); // Recargar datos
      
    } catch (err) {
      console.error('Error en sincronización masiva:', err);
      setError('Error sincronizando productos');
    } finally {
      setSyncing(false);
    }
  }, [loadFromIndexedDB]);

  // Reset completo
  const reset = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await productosSyncService.reset();
      await initialize();
    } catch (err) {
      console.error('Error en reset:', err);
      setError('Error reiniciando productos');
    } finally {
      setLoading(false);
    }
  }, [initialize]);

  // Funciones de utilidad
  const getProductoById = useCallback((id: number): Producto | undefined => {
    return productos.find(p => p.id_producto === id);
  }, [productos]);

  const getProductosConPromocion = useCallback((): Producto[] => {
    const now = Date.now();
    return productos.filter(p => 
      p.precio_promocion_online > 0 &&
      p.fecha_Ini_promocion_online !== null &&
      p.fecha_fin_promocion_online !== null &&
      p.fecha_Ini_promocion_online <= now &&
      p.fecha_fin_promocion_online >= now &&
      p.mostrar_tienda_linea === 1
    );
  }, [productos]);

  const getProductosDisponibles = useCallback((): Producto[] => {
    return productos.filter(p => 
      (p.existencias > 0 || p.vende_sin_existencia === 1) &&
      p.mostrar_tienda_linea === 1
    );
  }, [productos]);

  // Efecto de inicialización
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Efecto para actualizar estadísticas cuando cambian los productos
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await indexedDBService.getProductosStats();
        const syncStats = await productosSyncService.getSyncStats();
        
        setStats(prev => ({
          ...prev,
          ...stats,
          lastSync: syncStats.lastSync,
          isSyncing: syncStats.isSyncing
        }));
      } catch (err) {
        console.error('Error actualizando estadísticas:', err);
      }
    };

    updateStats();
  }, [productos]);

  return {
    // Estados
    productos,
    loading,
    error,
    syncing,
    
    // Funciones
    getProductosByCategoria,
    searchProductos,
    getProductosTiendaOnline,
    forceSyncCategoria,
    forceSyncAll,
    reset,
    
    // Utilidades
    getProductoById,
    getProductosConPromocion,
    getProductosDisponibles,
    
    // Estadísticas
    stats
  };
}; 