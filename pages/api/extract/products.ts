import type { NextApiRequest, NextApiResponse } from 'next';

// Función para extraer productos del HTML
function extractProductsFromHTML(html: string) {
  const products = [];
  
  try {
    // Buscar diferentes patrones de productos
    const productPatterns = [
      // Patrones más genéricos para productos
      /<div[^>]*class="[^"]*(?:product|item|card|producto|articulo)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      // Buscar elementos con precios
      /<div[^>]*>([\s\S]*?\$[\d,]+(?:\.\d{2})?[\s\S]*?)<\/div>/gi,
      // Buscar elementos con imágenes de productos
      /<div[^>]*>([\s\S]*?<img[^>]*src="[^"]*"[^>]*>[\s\S]*?)<\/div>/gi,
      // Buscar elementos con nombres de productos
      /<div[^>]*>([\s\S]*?<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>[\s\S]*?)<\/div>/gi
    ];
    
    let match;
    
    // Probar cada patrón
    for (const pattern of productPatterns) {
      while ((match = pattern.exec(html)) !== null) {
        const productHtml = match[1];
        
        // Extraer nombre del producto
        const nameMatch = productHtml.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i) || 
                         productHtml.match(/<span[^>]*class="[^"]*nombre[^"]*"[^>]*>(.*?)<\/span>/i) ||
                         productHtml.match(/<div[^>]*class="[^"]*nombre[^"]*"[^>]*>(.*?)<\/div>/i);
        const name = nameMatch ? nameMatch[1].trim() : 'Producto sin nombre';
        
        // Extraer precio
        const priceMatch = productHtml.match(/\$[\d,]+(?:\.\d{2})?/) ||
                          productHtml.match(/[\d,]+(?:\.\d{2})?\s*(?:pesos|COP)/i);
        const price = priceMatch ? priceMatch[0] : 'Precio no disponible';
        
        // Extraer imagen
        const imageMatch = productHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
        const image = imageMatch ? imageMatch[1] : '';
        
        // Extraer stock (buscar indicadores de disponibilidad)
        const stockMatch = productHtml.match(/stock|disponible|agotado|sin\s+stock/i);
        const stock = stockMatch ? 'Disponible' : 'Stock no especificado';
        
        // Solo agregar si tiene al menos nombre o precio
        if (name !== 'Producto sin nombre' || price !== 'Precio no disponible') {
          products.push({
            id: `product-${products.length + 1}`,
            name,
            price,
            image,
            stock,
            pattern: pattern.source,
            rawHtml: productHtml.substring(0, 300) // Para debugging
          });
        }
      }
    }
    
    // Eliminar duplicados basándose en el nombre
    const uniqueProducts = products.filter((product, index, self) => 
      index === self.findIndex(p => p.name === product.name)
    );
    
    return uniqueProducts;
  } catch (error) {
    console.error('Error extrayendo productos:', error);
  }
  
  return products;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Parámetros por query string
  const {
    endpoint = 'consultarProuctosCategoriaCombinadaTiendaOnline',
    id_sucursal = '1',
    id_categoria = req.query.id_categoria || '46',
    dia_actual = 'M',
    traerDetalle = '0',
    numeroCategoria = '15',
    validar_inventario = '1',
    limite = '40',
    url: customUrl,
  } = req.query;

  // Obtener la hora actual en formato HH:MM:SS
  const now = new Date();
  const hora_actual = req.query.hora_actual || 
    `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  
  // Fecha actual por defecto (YYYY-MM-DD)
  const fechaHoy = now.toISOString().slice(0, 10);
  const fecha_actual = req.query.fecha_actual || fechaHoy;

  // Tokens desde headers con valores por defecto actualizados
  const x_auth_token = req.headers['x-auth-token'] || 
    '1750743428309-3850-1-5b0fad04b53c47ee72ca160ebaa35d0e';
  const x_auth_token_api = req.headers['x-auth-token-api'] || 
    '1750743428309-1206-1-5b0fad04b53c47ee72ca160ebaa35d0e';
  const x_auth_token_empresa = req.headers['x-auth-token-empresa'] || '5083';
  const x_auth_token_es_online = req.headers['x-auth-token-es-online'] || '1';
  const x_gtm = req.headers['x-gtm'] || 'GMT-0500';

  // Construir la URL, permitiendo pasar la URL completa o usando los parámetros individuales
  const url = customUrl 
    ? String(customUrl)
    : `https://api.cuenti.co/jServerj4ErpPro/servicios_tienda_online2/api/${endpoint}?traerDetalle=${traerDetalle}&id_sucursal=${id_sucursal}&id_categoria=${id_categoria}&dia_actual=${dia_actual}&hora_actual=${hora_actual}&fecha_actual=${fecha_actual}&numeroCategoria=${numeroCategoria}&validar_inventario=${validar_inventario}&limite=${limite}`;

  console.log(`[products] Obteniendo productos de: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Origin': 'https://tienddi.co',
        'Referer': 'https://tienddi.co/',
        'x-auth-token': String(x_auth_token),
        'x-auth-token-api': String(x_auth_token_api),
        'x-auth-token-empresa': String(x_auth_token_empresa),
        'x-auth-token-es-online': String(x_auth_token_es_online),
        'x-gtm': String(x_gtm),
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener productos: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Si la solicitud fue exitosa, registrar detalles útiles
    console.log(`[products] Solicitud exitosa: ${data && typeof data === 'object' && Array.isArray(data.respuesta) ? 
      `Obtenidos ${data.respuesta.length} productos` : 
      'Formato de respuesta inesperado'}`);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('[products] Error:', error);
    return res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestUrl: url
    });
  }
} 