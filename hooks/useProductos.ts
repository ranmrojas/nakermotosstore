import { useState, useEffect, useCallback } from 'react';
import { indexedDBService } from '../lib/indexedDB/database';
import { productosSyncService, ProductosSyncService } from '../lib/indexedDB/productosSyncService';
import { preciosService, PrecioProducto, PreciosService } from '../lib/indexedDB/preciosService';

interface Producto {
  id_producto: number;
  nombre: string;
  alias: string;
  // CAMPOS DE PRECIOS EXCLUIDOS - Se obtienen del API en tiempo real
  // precio_venta: number;
  // precio_venta_online: number | null;
  // precio_promocion_online: number;
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

// Producto con precios en tiempo real
interface ProductoConPreciosReales extends Producto {
  precio_venta_real?: number;
  precio_venta_online_real?: number | null;
  precio_promocion_online_real?: number;
  tiene_promocion_activa?: boolean;
  precio_final?: number;
  precio_formateado?: string;
  precios_actualizados?: boolean;
}

interface UseProductosReturn {
  // Estados
  productos: ProductoConPreciosReales[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  preciosLoading: boolean;
  
  // Funciones
  getProductosByCategoria: (categoriaId: number) => Promise<ProductoConPreciosReales[]>;
  searchProductos: (query: string) => Promise<ProductoConPreciosReales[]>;
  getProductosTiendaOnline: () => Promise<ProductoConPreciosReales[]>;
  forceSyncCategoria: (categoriaId: number) => Promise<void>;
  forceSyncAll: () => Promise<void>;
  reset: () => Promise<void>;
  
  // NUEVAS FUNCIONES PARA PRECIOS EN TIEMPO REAL
  actualizarPreciosCategoria: (categoriaId: number) => Promise<void>;
  actualizarPreciosProducto: (productoId: number, categoriaId: number) => Promise<void>;
  getPrecioProducto: (productoId: number, categoriaId: number) => Promise<PrecioProducto | null>;
  
  // NUEVAS FUNCIONES PARA SINCRONIZACIÓN AUTOMÁTICA
  startAutoSync: (categorias: { id: number; nombre: string }[]) => void;
  stopAutoSync: () => void;
  smartSync: (categorias: { id: number; nombre: string }[]) => Promise<void>;
  quickSyncCategoria: (categoriaId: number) => Promise<void>;
  
  // Utilidades
  getProductoById: (id: number) => ProductoConPreciosReales | undefined;
  getProductosConPromocion: () => ProductoConPreciosReales[];
  getProductosDisponibles: () => ProductoConPreciosReales[];
  
  // Estadísticas
  stats: {
    totalProductos: number;
    categoriasConProductos: number;
    productosTiendaOnline: number;
    lastSync: Date | null;
    isSyncing: boolean;
    isAutoSyncActive: boolean;
    preciosCacheStats: {
      totalCategorias: number;
      categorias: number[];
      cacheSize: number;
    };
    syncConfig: {
      syncInterval: number;
      quickSyncInterval: number;
      autoSyncInterval: number;
      autoSyncEnabled: boolean;
    };
  };
}

export const useProductos = (): UseProductosReturn => {
  const [productos, setProductos] = useState<ProductoConPreciosReales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [preciosLoading, setPreciosLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProductos: 0,
    categoriasConProductos: 0,
    productosTiendaOnline: 0,
    lastSync: null as Date | null,
    isSyncing: false,
    isAutoSyncActive: false,
    preciosCacheStats: {
      totalCategorias: 0,
      categorias: [] as number[],
      cacheSize: 0
    },
    syncConfig: {
      syncInterval: 0,
      quickSyncInterval: 0,
      autoSyncInterval: 0,
      autoSyncEnabled: false
    }
  });

  // Cargar productos desde IndexedDB
  const loadFromIndexedDB = useCallback(async () => {
    try {
      // Asegurar que la base de datos esté inicializada
      await indexedDBService.init();
      
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

      // Inicializar IndexedDB
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
  const getProductosByCategoria = useCallback(async (categoriaId: number): Promise<ProductoConPreciosReales[]> => {
    try {
      // Asegurar que la base de datos esté inicializada
      await indexedDBService.init();
      
      // Primero intentar obtener desde IndexedDB
      const productosLocales = await indexedDBService.getProductosByCategoria(categoriaId);
      
      if (productosLocales.length > 0) {
        console.log(`📦 Productos de categoría ${categoriaId} cargados desde IndexedDB (${productosLocales.length} productos)`);
        
        // Convertir a ProductoConPreciosReales
        const productosConPrecios: ProductoConPreciosReales[] = productosLocales.map(producto => ({
          ...producto,
          precios_actualizados: false
        }));
        
        // Obtener precios en tiempo real en background
        try {
          const precios = await preciosService.getPreciosCategoria(categoriaId);
          
          // Actualizar productos con precios reales
          const productosActualizados = productosConPrecios.map(producto => {
            const precioReal = precios.find(p => p.id_producto === producto.id_producto);
            if (precioReal) {
              return {
                ...producto,
                precio_venta_real: precioReal.precio_venta,
                precio_venta_online_real: precioReal.precio_venta_online,
                precio_promocion_online_real: precioReal.precio_promocion_online,
                tiene_promocion_activa: PreciosService.tienePromocionActiva(precioReal),
                precio_final: PreciosService.getPrecioFinal(precioReal),
                precio_formateado: PreciosService.formatearPrecio(PreciosService.getPrecioFinal(precioReal)),
                precios_actualizados: true
              };
            }
            return producto;
          });
          
          console.log(`💰 Precios en tiempo real obtenidos para ${productosActualizados.filter(p => p.precios_actualizados).length} productos`);
          return productosActualizados;
        } catch (error) {
          console.warn('⚠️ No se pudieron obtener precios en tiempo real, usando precios locales:', error);
          return productosConPrecios;
        }
      }

      // Si no hay productos locales, sincronizar
      console.log(`🔄 No hay productos locales para categoría ${categoriaId}, sincronizando...`);
      setSyncing(true);
      
      const result = await productosSyncService.syncProductosByCategoria(categoriaId);
      
      if (result.success && result.data) {
        console.log(`✅ Productos de categoría ${categoriaId} sincronizados (${result.data.length} productos)`);
        await loadFromIndexedDB(); // Recargar todos los productos
        
        // Obtener precios en tiempo real para los productos sincronizados
        try {
          const precios = await preciosService.getPreciosCategoria(categoriaId);
          
          const productosConPrecios: ProductoConPreciosReales[] = result.data.map(producto => {
            const precioReal = precios.find(p => p.id_producto === producto.id_producto);
            if (precioReal) {
              return {
                ...producto,
                precio_venta_real: precioReal.precio_venta,
                precio_venta_online_real: precioReal.precio_venta_online,
                precio_promocion_online_real: precioReal.precio_promocion_online,
                tiene_promocion_activa: PreciosService.tienePromocionActiva(precioReal),
                precio_final: PreciosService.getPrecioFinal(precioReal),
                precio_formateado: PreciosService.formatearPrecio(PreciosService.getPrecioFinal(precioReal)),
                precios_actualizados: true
              };
            }
            return {
              ...producto,
              precios_actualizados: false
            };
          });
          
          console.log(`💰 Precios en tiempo real obtenidos para productos sincronizados`);
          return productosConPrecios;
        } catch (error) {
          console.warn('⚠️ No se pudieron obtener precios en tiempo real para productos sincronizados:', error);
          return result.data.map(producto => ({
            ...producto,
            precios_actualizados: false
          }));
        }
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
  const searchProductos = useCallback(async (query: string): Promise<ProductoConPreciosReales[]> => {
    try {
      // Asegurar que la base de datos esté inicializada
      await indexedDBService.init();
      
      const resultados = await indexedDBService.searchProductos(query);
      return resultados.filter(p => p.mostrar_tienda_linea === 1);
    } catch (err) {
      console.error('Error buscando productos:', err);
      return [];
    }
  }, []);

  // Obtener productos para tienda online
  const getProductosTiendaOnline = useCallback(async (): Promise<ProductoConPreciosReales[]> => {
    try {
      // Asegurar que la base de datos esté inicializada
      await indexedDBService.init();
      
      return await indexedDBService.getProductosTiendaOnline();
    } catch (err) {
      console.error('Error obteniendo productos de tienda online:', err);
      return [];
    }
  }, []);

  // Sincronización forzada de una categoría
  const forceSyncCategoria = useCallback(async (categoriaId: number): Promise<void> => {
    try {
      // Asegurar que la base de datos esté inicializada
      await indexedDBService.init();
      
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
      // Asegurar que la base de datos esté inicializada
      await indexedDBService.init();
      
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
  const getProductoById = useCallback((id: number): ProductoConPreciosReales | undefined => {
    return productos.find(p => p.id_producto === id);
  }, [productos]);

  const getProductosConPromocion = useCallback((): ProductoConPreciosReales[] => {
    const now = Date.now();
    return productos.filter(p => 
      // Solo verificar fechas de promoción ya que los precios se obtienen del API
      p.fecha_Ini_promocion_online !== null &&
      p.fecha_fin_promocion_online !== null &&
      p.fecha_Ini_promocion_online <= now &&
      p.fecha_fin_promocion_online >= now &&
      p.mostrar_tienda_linea === 1 &&
      // Verificar si tiene precios reales con promoción activa
      (p.precio_promocion_online_real ? p.precio_promocion_online_real > 0 : false)
    );
  }, [productos]);

  const getProductosDisponibles = useCallback((): ProductoConPreciosReales[] => {
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
        // Asegurar que la base de datos esté inicializada
        await indexedDBService.init();
        
        const stats = await indexedDBService.getProductosStats();
        const syncStats = await productosSyncService.getSyncStats();
        const syncConfig = productosSyncService.getSyncConfig();
        const preciosCacheStats = preciosService.getCacheStats();
        
        setStats(prev => ({
          ...prev,
          ...stats,
          lastSync: syncStats.lastSync,
          isSyncing: syncStats.isSyncing,
          isAutoSyncActive: syncConfig.isAutoSyncActive,
          preciosCacheStats,
          syncConfig: {
            syncInterval: syncConfig.syncInterval,
            quickSyncInterval: syncConfig.quickSyncInterval,
            autoSyncInterval: syncConfig.autoSyncInterval,
            autoSyncEnabled: syncConfig.autoSyncEnabled
          }
        }));
      } catch (err) {
        console.error('Error actualizando estadísticas:', err);
      }
    };

    updateStats();
  }, [productos]);

  // ===== NUEVAS FUNCIONES PARA SINCRONIZACIÓN AUTOMÁTICA =====

  // Iniciar sincronización automática
  const startAutoSync = useCallback((categorias: { id: number; nombre: string }[]): void => {
    try {
      productosSyncService.startAutoSync(categorias);
      console.log('🚀 Sincronización automática iniciada');
    } catch (err) {
      console.error('Error iniciando sincronización automática:', err);
      setError('Error iniciando sincronización automática');
    }
  }, []);

  // Detener sincronización automática
  const stopAutoSync = useCallback((): void => {
    try {
      productosSyncService.stopAutoSync();
      console.log('⏹️ Sincronización automática detenida');
    } catch (err) {
      console.error('Error deteniendo sincronización automática:', err);
      setError('Error deteniendo sincronización automática');
    }
  }, []);

  // Sincronización inteligente mejorada
  const smartSync = useCallback(async (categorias: { id: number; nombre: string }[]): Promise<void> => {
    try {
      setSyncing(true);
      setError(null);
      
      await productosSyncService.smartSync(categorias);
      await loadFromIndexedDB(); // Recargar datos
      
      console.log('✅ Sincronización inteligente completada');
    } catch (err) {
      console.error('Error en sincronización inteligente:', err);
      setError('Error en sincronización inteligente');
    } finally {
      setSyncing(false);
    }
  }, [loadFromIndexedDB]);

  // Sincronización rápida de categoría
  const quickSyncCategoria = useCallback(async (categoriaId: number): Promise<void> => {
    try {
      setSyncing(true);
      setError(null);
      
      const result = await productosSyncService.quickSyncCategoria(categoriaId);
      
      if (result.success) {
        await loadFromIndexedDB(); // Recargar datos
        console.log(`⚡ Sincronización rápida de categoría ${categoriaId} completada`);
      } else {
        setError(result.error || 'Error en sincronización rápida');
      }
    } catch (err) {
      console.error('Error en sincronización rápida:', err);
      setError('Error en sincronización rápida');
    } finally {
      setSyncing(false);
    }
  }, [loadFromIndexedDB]);

  // NUEVAS FUNCIONES PARA PRECIOS EN TIEMPO REAL
  const actualizarPreciosCategoria = useCallback(async (categoriaId: number): Promise<void> => {
    try {
      setPreciosLoading(true);
      setError(null);
      
      // Obtener precios en tiempo real para la categoría
      const precios = await preciosService.getPreciosCategoria(categoriaId);
      
      // Actualizar productos con precios reales
      setProductos(prevProductos => {
        return prevProductos.map(producto => {
          if (producto.id_categoria === categoriaId) {
            const precioReal = precios.find(p => p.id_producto === producto.id_producto);
            if (precioReal) {
              return {
                ...producto,
                precio_venta_real: precioReal.precio_venta,
                precio_venta_online_real: precioReal.precio_venta_online,
                precio_promocion_online_real: precioReal.precio_promocion_online,
                tiene_promocion_activa: PreciosService.tienePromocionActiva(precioReal),
                precio_final: PreciosService.getPrecioFinal(precioReal),
                precio_formateado: PreciosService.formatearPrecio(PreciosService.getPrecioFinal(precioReal)),
                precios_actualizados: true
              };
            }
          }
          return producto;
        });
      });
      
      console.log(`✅ Precios actualizados para categoría ${categoriaId}`);
    } catch (err) {
      console.error('Error actualizando precios de categoría:', err);
      setError('Error actualizando precios de categoría');
    } finally {
      setPreciosLoading(false);
    }
  }, []);

  const actualizarPreciosProducto = useCallback(async (productoId: number, categoriaId: number): Promise<void> => {
    try {
      setPreciosLoading(true);
      setError(null);
      
      // Obtener precio específico del producto
      const precioReal = await preciosService.getPrecioProducto(productoId, categoriaId);
      
      if (precioReal) {
        // Actualizar producto específico con precio real
        setProductos(prevProductos => {
          return prevProductos.map(producto => {
            if (producto.id_producto === productoId) {
              return {
                ...producto,
                precio_venta_real: precioReal.precio_venta,
                precio_venta_online_real: precioReal.precio_venta_online,
                precio_promocion_online_real: precioReal.precio_promocion_online,
                tiene_promocion_activa: PreciosService.tienePromocionActiva(precioReal),
                precio_final: PreciosService.getPrecioFinal(precioReal),
                precio_formateado: PreciosService.formatearPrecio(PreciosService.getPrecioFinal(precioReal)),
                precios_actualizados: true
              };
            }
            return producto;
          });
        });
        
        console.log(`✅ Precio actualizado para producto ${productoId}`);
      }
    } catch (err) {
      console.error('Error actualizando precios del producto:', err);
      setError('Error actualizando precios del producto');
    } finally {
      setPreciosLoading(false);
    }
  }, []);

  const getPrecioProducto = useCallback(async (productoId: number, categoriaId: number): Promise<PrecioProducto | null> => {
    try {
      return await preciosService.getPrecioProducto(productoId, categoriaId);
    } catch (err) {
      console.error('Error obteniendo precio del producto:', err);
      return null;
    }
  }, []);

  return {
    // Estados
    productos,
    loading,
    error,
    syncing,
    preciosLoading,
    
    // Funciones
    getProductosByCategoria,
    searchProductos,
    getProductosTiendaOnline,
    forceSyncCategoria,
    forceSyncAll,
    reset,
    
    // NUEVAS FUNCIONES PARA PRECIOS EN TIEMPO REAL
    actualizarPreciosCategoria,
    actualizarPreciosProducto,
    getPrecioProducto,
    
    // NUEVAS FUNCIONES PARA SINCRONIZACIÓN AUTOMÁTICA
    startAutoSync,
    stopAutoSync,
    smartSync,
    quickSyncCategoria,
    
    // Utilidades
    getProductoById,
    getProductosConPromocion,
    getProductosDisponibles,
    
    // Estadísticas
    stats
  };
}; 