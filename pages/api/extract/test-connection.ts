import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tokens desde headers con valores por defecto
  const x_auth_token = req.headers['x-auth-token'] || 
  process.env.NEXT_PUBLIC_X_AUTH_TOKEN;
  const x_auth_token_api = req.headers['x-auth-token-api'] || 
  process.env.NEXT_PUBLIC_X_AUTH_TOKEN_API;
  const x_auth_token_empresa = req.headers['x-auth-token-empresa'] || '20598';
  const x_auth_token_es_online = req.headers['x-auth-token-es-online'] || '1';
  const x_gtm = req.headers['x-gtm'] || 'GMT-0500';

  // URL para probar la conexión - categorías es más simple que productos
  const testUrl = 'https://api.cuenti.co/jServerj4ErpPro/servicios_tienda_online2/api/consultarCategoriasEnLinea?id_sucursal=1';

  console.log(`[test-connection] Probando conexión a: ${testUrl}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(testUrl, {
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
    
    const responseTime = Date.now() - startTime;
    
    // Obtener headers de respuesta importantes
    const responseHeaders = {
      'content-type': response.headers.get('content-type'),
      'x-auth-token-valido': response.headers.get('x-auth-token-valido'),
      'x-auth-token-es-online': response.headers.get('x-auth-token-es-online'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin')
    };
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        responseHeaders,
        message: 'Error al conectar con la API',
        tokensUsados: {
          x_auth_token: typeof x_auth_token === 'string' ? x_auth_token.substring(0, 10) + '...' : String(x_auth_token),
          x_auth_token_api: typeof x_auth_token_api === 'string' ? x_auth_token_api.substring(0, 10) + '...' : String(x_auth_token_api),
          x_auth_token_empresa,
          x_auth_token_es_online,
        }
      });
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      responseTime,
      responseHeaders,
      message: 'Conexión exitosa con la API',
      respuesta: data.respuesta ? 
        `Se encontraron ${data.respuesta.length} categorías` : 
        'No se obtuvieron datos',
      tokensStatus: 'Válidos',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[test-connection] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al probar conexión',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      tokensUsados: {
        x_auth_token: typeof x_auth_token === 'string' ? x_auth_token.substring(0, 10) + '...' : String(x_auth_token),
        x_auth_token_api: typeof x_auth_token_api === 'string' ? x_auth_token_api.substring(0, 10) + '...' : String(x_auth_token_api),
        x_auth_token_empresa,
        x_auth_token_es_online,
      }
    });
  }
}
