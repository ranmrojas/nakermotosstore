// Definición de tipos para los productos
export interface Product {
  id_producto: number;
  nombre: string;
  precio_venta: number;
  precio_venta_online: number | null;
  // CAMPOS DE EXISTENCIAS EN TIEMPO REAL
  existencias_real?: number;
  vende_sin_existencia_real?: number;
  existencias_actualizadas?: boolean;
  // Campos de existencias locales (deprecados - usar los reales)
  existencias: number;
  nombre_marca: string;
  nombre_categoria: string;
  nota: string;
  id_imagen: number;
  ext1: string;
  ext2: string;
  vende_sin_existencia: number;
  sku: string;
  alias: string;
}

export interface Category {
  id_categoria: number;
  nombre: string;
  id_padre: number | null;
  imagen: string;
  mostrar_tienda_linea: number;
}

/**
 * Obtiene los productos de una categoría específica
 */
export async function getProducts(categoryId: string | number = '23', limit: number = 40): Promise<Product[]> {
  try {
    const response = await fetch(`/api/extract/products?id_categoria=${categoryId}&limite=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Error al cargar productos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar si tenemos datos válidos
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.respuesta)) {
      return data.respuesta;
    } 
    
    return [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
}

/**
 * Obtiene las categorías disponibles
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/extract/categories');
    
    if (!response.ok) {
      throw new Error(`Error al cargar categorías: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar si tenemos datos válidos
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.respuesta)) {
      return data.respuesta;
    } 
    
    return [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
}

/**
 * Comprueba la conexión a la API
 */
export async function testApiConnection(): Promise<{success: boolean, message: string}> {
  try {
    const response = await fetch('/api/extract/test-connection');
    
    if (!response.ok) {
      throw new Error(`Error en la conexión: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'Conexión exitosa'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene información de producto por ID
 */
export async function getProductById(productId: number | string): Promise<Product | null> {
  try {
    // Esta es una implementación básica que obtiene todos los productos y filtra
    // en una implementación real, deberías tener un endpoint específico para obtener un producto por ID
    const allProducts = await getProducts();
    const product = allProducts.find(p => p.id_producto === Number(productId));
    return product || null;
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    return null;
  }
}

/**
 * Genera la URL de la imagen del producto
 * @param imageId ID de la imagen
 * @param extension Extensión del archivo (ej: jpeg, png)
 * @param usePlaceholder Indica si se debe usar un placeholder en caso de que no haya ID de imagen
 * @returns URL completa de la imagen
 */
export function getProductImageUrl(imageId: number | null | undefined, extension: string = 'jpeg', usePlaceholder: boolean = false): string {
  // Si no hay ID de imagen y se solicita un placeholder, devolver la imagen por defecto
  if ((!imageId || imageId <= 0) && usePlaceholder) {
    return '/file.svg'; // Imagen por defecto
  }
  
  // Si no hay ID de imagen y no se solicita placeholder, devolver imagen vacía
  if (!imageId || imageId <= 0) {
    return '/file.svg';
  }
  
  const EMPRESA_ID = '5083'; // ID de empresa encontrado en el análisis
  return `https://tienddi.co/s3_imagenes/${EMPRESA_ID}/imagenes/${imageId}.${extension}`;
}

/**
 * Obtiene URLs alternativas de imagen para un producto
 * @param product Objeto de producto completo
 * @returns Array con URLs de imágenes disponibles
 */
export function getProductImageUrls(product: Product): string[] {
  const urls: string[] = [];
  
  // Imagen principal
  if (product.id_imagen) {
    urls.push(getProductImageUrl(product.id_imagen, product.ext1));
  }
  
  // Si existe una segunda extensión, intentar generar otra URL
  if (product.id_imagen && product.ext2 && product.ext2 !== product.ext1) {
    urls.push(getProductImageUrl(product.id_imagen, product.ext2));
  }
  
  // Si no hay imágenes, agregar un placeholder
  if (urls.length === 0) {
    urls.push('/file.svg'); // Imagen por defecto
  }
  
  return urls;
}
