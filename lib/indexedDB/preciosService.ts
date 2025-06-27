// Servicio para manejar precios en tiempo real
interface PrecioProducto {
  id_producto: number;
  precio_venta: number;
  precio_venta_online: number | null;
  precio_promocion_online: number;
  fecha_Ini_promocion_online: number | null;
  fecha_fin_promocion_online: number | null;
  tipo_promocion_online: number;
  existencias: number;
  vende_sin_existencia: number;
  timestamp: number;
}

interface PreciosResponse {
  success: boolean;
  data?: PrecioProducto[];
  error?: string;
  timestamp?: number;
  categoria?: string;
}

class PreciosService {
  private preciosCache = new Map<number, PrecioProducto[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos de cache

  // Obtener precios en tiempo real para una categoría
  async getPreciosCategoria(categoriaId: number): Promise<PrecioProducto[]> {
    try {
      // Verificar cache primero
      const cached = this.preciosCache.get(categoriaId);
      if (cached && this.isCacheValid(cached[0]?.timestamp)) {
        console.log(`💰 Precios de categoría ${categoriaId} obtenidos desde cache`);
        return cached;
      }

      console.log(`🔄 Obteniendo precios en tiempo real para categoría ${categoriaId}...`);
      
      const response = await fetch(`/api/extract/prices?id_categoria=${categoriaId}`);
      
      if (!response.ok) {
        throw new Error(`Error del API: ${response.status}`);
      }

      const result: PreciosResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error obteniendo precios');
      }

      // Guardar en cache
      this.preciosCache.set(categoriaId, result.data);
      
      console.log(`✅ Precios obtenidos para ${result.data.length} productos de categoría ${categoriaId}`);
      
      return result.data;
    } catch (error) {
      console.error(`❌ Error obteniendo precios de categoría ${categoriaId}:`, error);
      throw error;
    }
  }

  // Obtener precios para múltiples categorías
  async getPreciosMultiplesCategorias(categoriaIds: number[]): Promise<Map<number, PrecioProducto[]>> {
    const preciosMap = new Map<number, PrecioProducto[]>();
    
    try {
      // Obtener precios en paralelo para todas las categorías
      const promises = categoriaIds.map(async (categoriaId) => {
        try {
          const precios = await this.getPreciosCategoria(categoriaId);
          return { categoriaId, precios };
        } catch (error) {
          console.error(`Error obteniendo precios de categoría ${categoriaId}:`, error);
          return { categoriaId, precios: [] };
        }
      });

      const results = await Promise.all(promises);
      
      results.forEach(({ categoriaId, precios }) => {
        preciosMap.set(categoriaId, precios);
      });

      console.log(`✅ Precios obtenidos para ${categoriaIds.length} categorías`);
      
      return preciosMap;
    } catch (error) {
      console.error('❌ Error obteniendo precios de múltiples categorías:', error);
      throw error;
    }
  }

  // Obtener precio específico de un producto
  async getPrecioProducto(productoId: number, categoriaId: number): Promise<PrecioProducto | null> {
    try {
      const precios = await this.getPreciosCategoria(categoriaId);
      return precios.find(p => p.id_producto === productoId) || null;
    } catch (error) {
      console.error(`Error obteniendo precio del producto ${productoId}:`, error);
      return null;
    }
  }

  // Verificar si el cache es válido
  private isCacheValid(timestamp?: number): boolean {
    if (!timestamp) return false;
    return Date.now() - timestamp < this.cacheTimeout;
  }

  // Limpiar cache
  clearCache(): void {
    this.preciosCache.clear();
    console.log('🗑️ Cache de precios limpiado');
  }

  // Limpiar cache de una categoría específica
  clearCacheCategoria(categoriaId: number): void {
    this.preciosCache.delete(categoriaId);
    console.log(`🗑️ Cache de precios de categoría ${categoriaId} limpiado`);
  }

  // Obtener estadísticas del cache
  getCacheStats(): {
    totalCategorias: number;
    categorias: number[];
    cacheSize: number;
  } {
    const categorias = Array.from(this.preciosCache.keys());
    return {
      totalCategorias: categorias.length,
      categorias,
      cacheSize: this.preciosCache.size
    };
  }

  // Verificar si un producto tiene promoción activa
  static tienePromocionActiva(precio: PrecioProducto): boolean {
    if (!precio.precio_promocion_online || precio.precio_promocion_online <= 0) {
      return false;
    }

    const now = Date.now();
    const inicioPromocion = precio.fecha_Ini_promocion_online;
    const finPromocion = precio.fecha_fin_promocion_online;

    if (!inicioPromocion || !finPromocion) {
      return false;
    }

    return now >= inicioPromocion && now <= finPromocion;
  }

  // Obtener precio final de un producto (considerando promociones)
  static getPrecioFinal(precio: PrecioProducto): number {
    if (this.tienePromocionActiva(precio)) {
      return precio.precio_promocion_online;
    }
    
    return precio.precio_venta_online || precio.precio_venta;
  }

  // Formatear precio para mostrar
  static formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }
}

// Instancia singleton
export const preciosService = new PreciosService();
export { PreciosService };
export type { PrecioProducto, PreciosResponse }; 