// Configuración de la base de datos IndexedDB
const DB_NAME = 'lzfDB';
const DB_VERSION = 3; // Incrementamos versión para eliminar campos de precios
const CATEGORIAS_STORE = 'categorias';
const PRODUCTOS_STORE = 'productos';
const METADATA_STORE = 'metadata';

interface Categoria {
  id: number;
  nombre: string;
  categoriaPadreId?: number;
  activa: boolean;
  [key: string]: unknown;
}

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
  [key: string]: unknown; // Para campos adicionales
}

interface MetadataValue {
  [key: string]: unknown;
}

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  // Inicializar la base de datos
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear store de categorías
        if (!db.objectStoreNames.contains(CATEGORIAS_STORE)) {
          const categoriasStore = db.createObjectStore(CATEGORIAS_STORE, { keyPath: 'id' });
          categoriasStore.createIndex('nombre', 'nombre', { unique: true });
          categoriasStore.createIndex('categoriaPadreId', 'categoriaPadreId', { unique: false });
          categoriasStore.createIndex('activa', 'activa', { unique: false });
        }

        // Crear store de productos
        if (!db.objectStoreNames.contains(PRODUCTOS_STORE)) {
          const productosStore = db.createObjectStore(PRODUCTOS_STORE, { keyPath: 'id_producto' });
          
          // Índices para búsquedas eficientes
          productosStore.createIndex('id_categoria', 'id_categoria', { unique: false });
          productosStore.createIndex('nombre', 'nombre', { unique: false });
          productosStore.createIndex('alias', 'alias', { unique: false });
          productosStore.createIndex('mostrar_tienda_linea', 'mostrar_tienda_linea', { unique: false });
          productosStore.createIndex('es_servicio', 'es_servicio', { unique: false });
          productosStore.createIndex('id_marca', 'id_marca', { unique: false });
        }

        // Crear store de metadata
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  // Verificar si la base de datos está inicializada
  private ensureDB(): void {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a init() primero.');
    }
  }

  // Obtener todas las categorías
  async getCategorias(): Promise<Categoria[]> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIAS_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORIAS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Guardar categorías
  async saveCategorias(categorias: Categoria[]): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIAS_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIAS_STORE);

      // Limpiar datos existentes
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        console.log('🧹 Base de datos limpiada correctamente');
        
        // Insertar nuevas categorías
        let completed = 0;
        let errors = 0;
        const total = categorias.length;

        if (total === 0) {
          console.log('⚠️ No hay categorías para guardar');
          resolve();
          return;
        }
        
        console.log(`📥 Guardando ${total} categorías en IndexedDB...`);

        categorias.forEach((categoria, index) => {
          // Guardar el objeto completo de categoría tal como viene del API
          try {
            // Clonar el objeto para evitar referencias
            const categoriaToSave = JSON.parse(JSON.stringify(categoria));
            
            // Log para depuración
            if (index === 0 || index === total - 1) {
              console.log(`📋 Guardando categoría ${index+1}/${total}:`, JSON.stringify(categoriaToSave, null, 2));
            }
            
            const request = store.add(categoriaToSave);
            
            request.onerror = () => {
              errors++;
              console.error(`❌ Error al guardar categoría ${categoriaToSave.id}:`, request.error);
              completed++;
              if (completed === total) {
                if (errors > 0) {
                  reject(new Error(`Ocurrieron ${errors} errores al guardar categorías`));
                } else {
                  resolve();
                }
              }
            };
            
            request.onsuccess = () => {
              completed++;
              if (completed === total) {
                console.log(`✅ Guardadas ${total - errors} categorías correctamente`);
                if (errors > 0) {
                  reject(new Error(`Ocurrieron ${errors} errores al guardar categorías`));
                } else {
                  resolve();
                }
              }
            };
          } catch (error) {
            console.error(`❌ Error procesando categoría ${index}:`, error);
            errors++;
            completed++;
            if (completed === total) {
              if (errors > 0) {
                reject(new Error(`Ocurrieron ${errors} errores al guardar categorías`));
              } else {
                resolve();
              }
            }
          }
        });
      };
      
      clearRequest.onerror = () => {
        console.error('❌ Error al limpiar la base de datos:', clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }

  // Obtener metadata
  async getMetadata(key: string): Promise<MetadataValue | undefined> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }

  // Guardar metadata
  async saveMetadata(key: string, value: MetadataValue): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Limpiar toda la base de datos
  async clear(): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIAS_STORE, METADATA_STORE], 'readwrite');
      
      const categoriasStore = transaction.objectStore(CATEGORIAS_STORE);
      const metadataStore = transaction.objectStore(METADATA_STORE);

      categoriasStore.clear();
      metadataStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Verificar si la base de datos está vacía
  async isEmpty(): Promise<boolean> {
    const categorias = await this.getCategorias();
    return categorias.length === 0;
  }

  // ===== MÉTODOS PARA PRODUCTOS =====

  // Obtener todos los productos
  async getProductos(): Promise<Producto[]> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTOS_STORE], 'readonly');
      const store = transaction.objectStore(PRODUCTOS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Obtener productos por categoría
  async getProductosByCategoria(categoriaId: number): Promise<Producto[]> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTOS_STORE], 'readonly');
      const store = transaction.objectStore(PRODUCTOS_STORE);
      const index = store.index('id_categoria');
      const request = index.getAll(categoriaId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Obtener productos activos para tienda online
  async getProductosTiendaOnline(): Promise<Producto[]> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTOS_STORE], 'readonly');
      const store = transaction.objectStore(PRODUCTOS_STORE);
      const index = store.index('mostrar_tienda_linea');
      const request = index.getAll(1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Búsqueda de productos
  async searchProductos(query: string): Promise<Producto[]> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTOS_STORE], 'readonly');
      const store = transaction.objectStore(PRODUCTOS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const productos = request.result;
        const searchTerm = query.toLowerCase();

        const resultados = productos.filter(producto => {
          // Búsqueda en nombre
          const nombreMatch = producto.nombre.toLowerCase().includes(searchTerm);
          
          // Búsqueda en alias
          const aliasMatch = producto.alias.toLowerCase().includes(searchTerm);
          
          // Búsqueda en marca
          const marcaMatch = producto.nombre_marca.toLowerCase().includes(searchTerm);
          
          // Búsqueda en SKU
          const skuMatch = producto.sku.toLowerCase().includes(searchTerm);
          
          // Búsqueda en nota/descripción
          const notaMatch = producto.nota.toLowerCase().includes(searchTerm);
          
          // Búsqueda en categoría
          const categoriaMatch = producto.nombre_categoria.toLowerCase().includes(searchTerm);
          
          return nombreMatch || 
                 aliasMatch || 
                 marcaMatch || 
                 skuMatch || 
                 notaMatch || 
                 categoriaMatch;
        });

        resolve(resultados);
      };
    });
  }

  // Guardar productos de una categoría específica
  async saveProductosByCategoria(categoriaId: number, productos: Producto[]): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔄 Guardando ${productos.length} productos para categoría ${categoriaId}...`);
        
        const transaction = this.db!.transaction([PRODUCTOS_STORE], 'readwrite');
        const store = transaction.objectStore(PRODUCTOS_STORE);

        // Eliminar productos existentes de esta categoría
        const index = store.index('id_categoria');
        const clearRequest = index.openCursor(categoriaId);
        
        const productosToDelete: number[] = [];
        
        clearRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            productosToDelete.push(cursor.primaryKey as number);
            cursor.continue();
          } else {
            console.log(`🗑️ Eliminando ${productosToDelete.length} productos existentes de la categoría ${categoriaId}`);
            
            // Eliminar productos existentes
            let deleted = 0;
            const totalToDelete = productosToDelete.length;
            
            if (totalToDelete === 0) {
              // Insertar nuevos productos directamente
              this.insertProductos(store, productos, resolve, reject);
              return;
            }
            
            productosToDelete.forEach(id => {
              const deleteRequest = store.delete(id);
              deleteRequest.onsuccess = () => {
                deleted++;
                if (deleted === totalToDelete) {
                  console.log(`✅ Eliminados ${deleted} productos existentes`);
                  // Insertar nuevos productos
                  this.insertProductos(store, productos, resolve, reject);
                }
              };
              deleteRequest.onerror = () => {
                console.error(`❌ Error eliminando producto ${id}:`, deleteRequest.error);
                reject(deleteRequest.error);
              };
            });
          }
        };
        
        clearRequest.onerror = () => {
          console.error('❌ Error al buscar productos existentes:', clearRequest.error);
          reject(clearRequest.error);
        };
        
        transaction.onerror = () => {
          console.error('❌ Error en la transacción:', transaction.error);
          reject(transaction.error);
        };
        
      } catch (error) {
        console.error('❌ Error iniciando guardado de productos:', error);
        reject(error);
      }
    });
  }

  // Método auxiliar para limpiar y validar datos de productos
  private cleanProductoData(producto: unknown): Producto {
    const p = producto as Record<string, unknown>;
    return {
      id_producto: Number(p.id_producto) || 0,
      nombre: String(p.nombre || ''),
      alias: String(p.alias || ''),
      existencias: Number(p.existencias) || 0,
      vende_sin_existencia: Number(p.vende_sin_existencia) || 0,
      id_categoria: Number(p.id_categoria) || 0,
      nombre_categoria: String(p.nombre_categoria || ''),
      id_marca: Number(p.id_marca) || 0,
      nombre_marca: String(p.nombre_marca || ''),
      id_imagen: p.id_imagen !== null ? Number(p.id_imagen) : null,
      ext1: p.ext1 as string | null ?? null,
      ext2: p.ext2 as string | null ?? null,
      mostrar_tienda_linea: Number(p.mostrar_tienda_linea) || 0,
      mostrar_catalogo_linea: Number(p.mostrar_catalogo_linea) || 0,
      es_servicio: Number(p.es_servicio) || 0,
      fecha_Ini_promocion_online: p.fecha_Ini_promocion_online !== null ? Number(p.fecha_Ini_promocion_online) : null,
      fecha_fin_promocion_online: p.fecha_fin_promocion_online !== null ? Number(p.fecha_fin_promocion_online) : null,
      dias_aplica_promocion_online: p.dias_aplica_promocion_online as string | null ?? null,
      controla_inventario_tienda_linea: Number(p.controla_inventario_tienda_linea) || 0,
      id_cocina: p.id_cocina !== null ? Number(p.id_cocina) : null,
      tiempo_preparacion: Number(p.tiempo_preparacion) || 0,
      tipo_promocion_online: Number(p.tipo_promocion_online) || 0,
      id_padre: p.id_padre !== null ? Number(p.id_padre) : null,
      sku: String(p.sku || ''),
      total_estampilla: Number(p.total_estampilla) || 0,
      total_impoconsumo: Number(p.total_impoconsumo) || 0,
      cups: p.cups as string | null ?? null,
      configuracion_dinamica: p.configuracion_dinamica as string | null ?? null,
      id_sucursal: Number(p.id_sucursal) || 0,
      vender_solo_presentacion: Number(p.vender_solo_presentacion) || 0,
      presentaciones: p.presentaciones as string | null ?? null,
      id_tipo_medida: Number(p.id_tipo_medida) || 0,
      id_tipo_producto: Number(p.id_tipo_producto) || 0,
      tipo_impuesto: Number(p.tipo_impuesto) || 0,
      id_impuesto: Number(p.id_impuesto) || 0,
      valor_impuesto: Number(p.valor_impuesto) || 0,
      invima: String(p.invima || ''),
      cum: String(p.cum || ''),
      nota: String(p.nota || ''),
      unidad_medida: String(p.unidad_medida || ''),
      nombre_impuesto: String(p.nombre_impuesto || ''),
      dias_aplica_venta_online: String(p.dias_aplica_venta_online || ''),
      hora_aplica_venta_online: String(p.hora_aplica_venta_online || ''),
      hora_aplica_venta_fin_online: String(p.hora_aplica_venta_fin_online || ''),
      hora_Ini_promocion_online: p.hora_Ini_promocion_online as string | null ?? null,
      hora_fecha_fin_promocion_online: p.hora_fecha_fin_promocion_online as string | null ?? null,
    };
  }

  // Método auxiliar para insertar productos
  private insertProductos(
    store: IDBObjectStore, 
    productos: Producto[], 
    resolve: () => void, 
    reject: (error: unknown) => void
  ): void {
    if (productos.length === 0) {
      resolve();
      return;
    }

    let completed = 0;
    let errors = 0;
    const total = productos.length;

    console.log(`📥 Insertando ${total} productos en IndexedDB...`);

    productos.forEach((producto, index) => {
      try {
        // Limpiar y validar datos antes de guardar
        const cleanProducto = this.cleanProductoData(producto);
        
        // Usar put en lugar de add para manejar productos existentes
        const request = store.put(cleanProducto);
        
        request.onerror = () => {
          errors++;
          console.error(`❌ Error guardando producto ${cleanProducto.id_producto}:`, request.error);
          console.error(`📋 Datos del producto:`, JSON.stringify(cleanProducto, null, 2));
          completed++;
          if (completed === total) {
            if (errors > 0) {
              reject(new Error(`Ocurrieron ${errors} errores al guardar productos`));
            } else {
              resolve();
            }
          }
        };
        
        request.onsuccess = () => {
          completed++;
          if (index === 0 || index === total - 1) {
            console.log(`✅ Producto ${index + 1}/${total} guardado: ${cleanProducto.nombre} (ID: ${cleanProducto.id_producto})`);
          }
          if (completed === total) {
            console.log(`✅ Guardados ${total - errors} productos correctamente`);
            if (errors > 0) {
              reject(new Error(`Ocurrieron ${errors} errores al guardar productos`));
            } else {
              resolve();
            }
          }
        };
      } catch (error) {
        errors++;
        console.error(`❌ Error procesando producto ${producto.id_producto}:`, error);
        completed++;
        if (completed === total) {
          if (errors > 0) {
            reject(new Error(`Ocurrieron ${errors} errores al guardar productos`));
          } else {
            resolve();
          }
        }
      }
    });
  }

  // Verificar si hay productos de una categoría
  async hasProductosByCategoria(categoriaId: number): Promise<boolean> {
    const productos = await this.getProductosByCategoria(categoriaId);
    return productos.length > 0;
  }

  // Obtener estadísticas de productos
  async getProductosStats(): Promise<{
    totalProductos: number;
    categoriasConProductos: number;
    productosTiendaOnline: number;
  }> {
    const productos = await this.getProductos();
    const categoriasUnicas = new Set(productos.map(p => p.id_categoria));
    const productosTiendaOnline = productos.filter(p => p.mostrar_tienda_linea === 1).length;

    return {
      totalProductos: productos.length,
      categoriasConProductos: categoriasUnicas.size,
      productosTiendaOnline
    };
  }

  // Limpiar todos los productos
  async clearProductos(): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTOS_STORE], 'readwrite');
      const store = transaction.objectStore(PRODUCTOS_STORE);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Limpiar toda la base de datos (incluyendo productos)
  async clearAll(): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIAS_STORE, PRODUCTOS_STORE, METADATA_STORE], 'readwrite');
      
      const categoriasStore = transaction.objectStore(CATEGORIAS_STORE);
      const productosStore = transaction.objectStore(PRODUCTOS_STORE);
      const metadataStore = transaction.objectStore(METADATA_STORE);

      categoriasStore.clear();
      productosStore.clear();
      metadataStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Instancia singleton
export const indexedDBService = new IndexedDBService(); 