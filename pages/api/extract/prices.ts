import type { NextApiRequest, NextApiResponse } from 'next';

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

  console.log(`[prices] Obteniendo precios en tiempo real de: ${url}`);
  console.log(`[prices] Parámetros: id_categoria=${id_categoria}, id_sucursal=${id_sucursal}`);
  
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
      throw new Error(`Error al obtener precios: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`[prices] Respuesta del API externo recibida:`, {
      tipo: typeof data,
      tieneRespuesta: !!data.respuesta,
      esArray: Array.isArray(data.respuesta),
      longitud: data.respuesta?.length || 0,
      keys: data ? Object.keys(data) : []
    });
    
    // Extraer solo los campos de precios de los productos
    let productosConPrecios = [];
    
    if (data && typeof data === 'object') {
      // Verificar diferentes estructuras posibles de respuesta
      let productos = null;
      
      if (Array.isArray(data.respuesta)) {
        productos = data.respuesta;
        console.log(`[prices] Usando data.respuesta (array con ${productos.length} productos)`);
      } else if (Array.isArray(data)) {
        productos = data;
        console.log(`[prices] Usando data directamente (array con ${productos.length} productos)`);
      } else if (data.productos && Array.isArray(data.productos)) {
        productos = data.productos;
        console.log(`[prices] Usando data.productos (array con ${productos.length} productos)`);
      } else {
        console.log(`[prices] Estructura de respuesta no reconocida:`, {
          keys: Object.keys(data),
          tipos: Object.keys(data).map(key => ({ key, tipo: typeof data[key], esArray: Array.isArray(data[key]) }))
        });
      }
      
      if (productos && productos.length > 0) {
        productosConPrecios = productos.map((producto: any) => ({
          id_producto: producto.id_producto,
          precio_venta: producto.precio_venta,
          precio_venta_online: producto.precio_venta_online,
          precio_promocion_online: producto.precio_promocion_online,
          fecha_Ini_promocion_online: producto.fecha_Ini_promocion_online,
          fecha_fin_promocion_online: producto.fecha_fin_promocion_online,
          tipo_promocion_online: producto.tipo_promocion_online,
          timestamp: Date.now() // Marca de tiempo para saber cuándo se obtuvo
        }));
        
        console.log(`[prices] Productos con precios extraídos:`, {
          total: productosConPrecios.length,
          conPrecioVenta: productosConPrecios.filter((p: any) => p.precio_venta).length,
          conPrecioOnline: productosConPrecios.filter((p: any) => p.precio_venta_online).length,
          conPromocion: productosConPrecios.filter((p: any) => p.precio_promocion_online).length
        });
      }
    }
    
    // Si la solicitud fue exitosa, registrar detalles útiles
    console.log(`[prices] Solicitud exitosa: Obtenidos precios de ${productosConPrecios.length} productos`);
    
    return res.status(200).json({
      success: true,
      data: productosConPrecios,
      timestamp: Date.now(),
      categoria: id_categoria,
      debug: {
        url,
        responseType: typeof data,
        responseKeys: data ? Object.keys(data) : [],
        productosOriginales: data.respuesta?.length || 0,
        productosConPrecios: productosConPrecios.length
      }
    });
  } catch (error) {
    console.error('[prices] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener precios',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestUrl: url
    });
  }
} 