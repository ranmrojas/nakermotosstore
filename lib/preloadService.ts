import { productosSyncService } from './indexedDB/productosSyncService';
import { indexedDBService } from './indexedDB/database';

interface PreloadConfig {
  enabled: boolean;
  silent: boolean;
  priority: 'high' | 'medium' | 'low';
}

class PreloadService {
  private isPreloading = false;
  private preloadCompleted = false;
  private config: PreloadConfig = {
    enabled: true,
    silent: true,
    priority: 'medium'
  };

  // Verificar si el preload ya se completó
  isCompleted(): boolean {
    return this.preloadCompleted;
  }

  // Verificar si está en proceso
  isInProgress(): boolean {
    return this.isPreloading;
  }

  // Iniciar preload silencioso
  async startSilentPreload(): Promise<void> {
    if (this.isPreloading || this.preloadCompleted) {
      return;
    }

    this.isPreloading = true;

    try {
      if (this.config.silent) {
        console.log('🚀 Iniciando preload silencioso de datos...');
      }

      // 1. Inicializar IndexedDB
      await indexedDBService.init();

      // 2. Obtener categorías (esto activará el hook useCategorias)
      await this.preloadCategorias();

      // 3. Preload de productos principales
      await this.preloadProductosPrincipales();

      // 4. Preload de productos de vape
      await this.preloadProductosVape();

      // 5. Preload de productos de búsqueda
      await this.preloadProductosBusqueda();

      this.preloadCompleted = true;
      
      if (this.config.silent) {
        console.log('✅ Preload silencioso completado');
      }

    } catch (error) {
      console.error('❌ Error en preload silencioso:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  // Preload de categorías
  private async preloadCategorias(): Promise<void> {
    try {
      // Simular la activación del hook useCategorias
      // Esto cargará las categorías en IndexedDB
      const response = await fetch('/api/categorias');
      if (response.ok) {
        const result = await response.json();
        
        // Verificar que la respuesta sea exitosa y contenga datos
        if (result.success && result.data && Array.isArray(result.data)) {
          // Guardar categorías en IndexedDB
          await indexedDBService.saveCategorias(result.data);
          
          if (this.config.silent) {
            console.log(`📋 Preload: ${result.data.length} categorías cargadas`);
          }
        } else {
          console.error('❌ Error en preload categorías: respuesta inválida del API', result);
        }
      } else {
        console.error('❌ Error en preload categorías: respuesta no exitosa', response.status);
      }
    } catch (error) {
      console.error('Error preload categorías:', error);
    }
  }

  // Preload de productos principales (para /productos)
  private async preloadProductosPrincipales(): Promise<void> {
    try {
      // Categorías principales que se usan en /productos
      const categoriasPrincipales = [
        { id: 15, nombre: 'Cerveza' },
        { id: 7, nombre: 'Aguardiente' },
        { id: 8, nombre: 'Gaseosa' },
        { id: 33, nombre: 'Whisky' },
        { id: 51, nombre: 'Gomitas' }
      ];

      // Usar sincronización inteligente para estas categorías
      await productosSyncService.syncProductosInteligente(categoriasPrincipales);
      
      if (this.config.silent) {
        console.log('📦 Preload: Productos principales sincronizados');
      }
    } catch (error) {
      console.error('Error preload productos principales:', error);
    }
  }

  // Preload de productos de vape (para /vape)
  private async preloadProductosVape(): Promise<void> {
    try {
      // Categorías específicas de vape
      const categoriasVape = [
        { id: 61, nombre: 'Desechables' },
        { id: 62, nombre: 'Cápsulas' },
        { id: 63, nombre: 'Baterías' }
      ];

      await productosSyncService.syncProductosInteligente(categoriasVape);
      
      if (this.config.silent) {
        console.log('💨 Preload: Productos de vape sincronizados');
      }
    } catch (error) {
      console.error('Error preload productos vape:', error);
    }
  }

  // Preload de productos de búsqueda (para /busqueda)
  private async preloadProductosBusqueda(): Promise<void> {
    try {
      // Categorías para la página de búsqueda
      const categoriasBusqueda = [
        { id: 15, nombre: 'Cerveza' },
        { id: 7, nombre: 'Aguardiente' },
        { id: 8, nombre: 'Gaseosa' },
        { id: 51, nombre: 'Gomitas' },
        { id: 33, nombre: 'Whisky' }
      ];

      await productosSyncService.syncProductosInteligente(categoriasBusqueda);
      
      if (this.config.silent) {
        console.log('🔍 Preload: Productos de búsqueda sincronizados');
      }
    } catch (error) {
      console.error('Error preload productos búsqueda:', error);
    }
  }

  // Configurar el servicio
  configure(config: Partial<PreloadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Obtener estado del preload
  getStatus(): {
    isPreloading: boolean;
    isCompleted: boolean;
    config: PreloadConfig;
  } {
    return {
      isPreloading: this.isPreloading,
      isCompleted: this.preloadCompleted,
      config: this.config
    };
  }

  // Resetear estado (útil para testing)
  reset(): void {
    this.isPreloading = false;
    this.preloadCompleted = false;
  }
}

// Instancia singleton
export const preloadService = new PreloadService(); 