// Configuración de la base de datos IndexedDB
const DB_NAME = 'proxylzfDB';
const DB_VERSION = 1;
const CATEGORIAS_STORE = 'categorias';
const METADATA_STORE = 'metadata';

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

        // Crear store de metadata
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
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
  async getCategorias(): Promise<any[]> {
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
  async saveCategorias(categorias: any[]): Promise<void> {
    this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIAS_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIAS_STORE);

      // Limpiar datos existentes
      store.clear();

      // Insertar nuevas categorías
      let completed = 0;
      const total = categorias.length;

      if (total === 0) {
        resolve();
        return;
      }

      categorias.forEach(categoria => {
        const request = store.add(categoria);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });
    });
  }

  // Obtener metadata
  async getMetadata(key: string): Promise<any> {
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
  async saveMetadata(key: string, value: any): Promise<void> {
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
}

// Instancia singleton
export const indexedDBService = new IndexedDBService(); 