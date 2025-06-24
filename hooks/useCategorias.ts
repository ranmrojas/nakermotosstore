import { useState, useEffect, useCallback } from 'react';
import { indexedDBService } from '../lib/indexedDB/database';
import { syncService, SyncService } from '../lib/indexedDB/syncService';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  esPadre: boolean;
  tieneSubcategorias: boolean;
  categoriaPadreId?: number;
  subcategorias: Categoria[];
}

interface UseCategoriasReturn {
  // Estados
  categorias: Categoria[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  
  // Funciones
  refetch: () => Promise<void>;
  forceSync: () => Promise<void>;
  reset: () => Promise<void>;
  
  // Utilidades
  getCategoriaById: (id: number) => Categoria | undefined;
  getCategoriasPadre: () => Categoria[];
  getSubcategorias: (categoriaPadreId: number) => Categoria[];
  
  // Estadísticas
  stats: {
    totalCategorias: number;
    totalSubcategorias: number;
    categoriasActivas: number;
    lastSync: Date | null;
    needsSync: boolean;
  };
}

export const useCategorias = (): UseCategoriasReturn => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalCategorias: 0,
    totalSubcategorias: 0,
    categoriasActivas: 0,
    lastSync: null as Date | null,
    needsSync: false
  });

  // Cargar categorías desde IndexedDB
  const loadFromIndexedDB = useCallback(async () => {
    try {
      const data = await indexedDBService.getCategorias();
      setCategorias(data);
      
      // Calcular estadísticas
      const categoriasPadre = data.filter(cat => cat.esPadre);
      const subcategorias = data.filter(cat => !cat.esPadre);
      const activas = data.filter(cat => cat.activa);
      
      setStats(prev => ({
        ...prev,
        totalCategorias: categoriasPadre.length,
        totalSubcategorias: subcategorias.length,
        categoriasActivas: activas.length
      }));
      
    } catch (err) {
      console.error('Error cargando desde IndexedDB:', err);
      setError('Error cargando categorías locales');
    }
  }, []);

  // Sincronizar con el API
  const syncWithAPI = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const result = await syncService.syncCategorias();
      
      if (result.success && result.data) {
        setCategorias(result.data);
        
        // Actualizar estadísticas
        const categoriasPadre = result.data.filter((cat: Categoria) => cat.esPadre);
        const subcategorias = result.data.filter((cat: Categoria) => !cat.esPadre);
        const activas = result.data.filter((cat: Categoria) => cat.activa);
        
        setStats(prev => ({
          ...prev,
          totalCategorias: categoriasPadre.length,
          totalSubcategorias: subcategorias.length,
          categoriasActivas: activas.length
        }));
        
      } else {
        setError(result.error || 'Error en sincronización');
      }
      
    } catch (err) {
      console.error('Error en sincronización:', err);
      setError('Error conectando con el servidor');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Inicializar y cargar datos
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar si IndexedDB está soportado
      if (!SyncService.isSupported()) {
        setError('IndexedDB no está soportado en este navegador');
        setLoading(false);
        return;
      }

      // Inicializar IndexedDB
      await indexedDBService.init();

      // Cargar datos locales
      await loadFromIndexedDB();

      // Verificar si necesita sincronización
      const needsSync = await syncService.needsSync();
      const lastSync = await syncService.getLastSyncTime();
      
      setStats(prev => ({
        ...prev,
        lastSync,
        needsSync
      }));

      // Si necesita sincronización, hacerlo en background
      if (needsSync) {
        console.log('🔄 Sincronización automática necesaria...');
        syncWithAPI();
      }

    } catch (err) {
      console.error('Error inicializando:', err);
      setError('Error inicializando la aplicación');
    } finally {
      setLoading(false);
    }
  }, [loadFromIndexedDB, syncWithAPI]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await loadFromIndexedDB();
  }, [loadFromIndexedDB]);

  // Sincronización forzada
  const forceSync = useCallback(async () => {
    await syncWithAPI();
  }, [syncWithAPI]);

  // Reset completo
  const reset = useCallback(async () => {
    try {
      setLoading(true);
      await syncService.reset();
      await initialize();
    } catch (err) {
      console.error('Error en reset:', err);
      setError('Error reiniciando datos');
    } finally {
      setLoading(false);
    }
  }, [initialize]);

  // Funciones de utilidad
  const getCategoriaById = useCallback((id: number): Categoria | undefined => {
    return categorias.find(cat => cat.id === id);
  }, [categorias]);

  const getCategoriasPadre = useCallback((): Categoria[] => {
    return categorias.filter(cat => cat.esPadre);
  }, [categorias]);

  const getSubcategorias = useCallback((categoriaPadreId: number): Categoria[] => {
    return categorias.filter(cat => cat.categoriaPadreId === categoriaPadreId);
  }, [categorias]);

  // Efecto de inicialización
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // Estados
    categorias,
    loading,
    error,
    syncing,
    
    // Funciones
    refetch,
    forceSync,
    reset,
    
    // Utilidades
    getCategoriaById,
    getCategoriasPadre,
    getSubcategorias,
    
    // Estadísticas
    stats
  };
}; 