import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir peticiones GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener el path de la URL desde req.query
    const { path = [] } = req.query;
    const pathStr = Array.isArray(path) ? path.join('/') : path;
    
    // Obtener parámetros de búsqueda
    const search = req.url?.split('?')[1] ? `?${req.url.split('?')[1]}` : '';
    
    // Construir URL destino
    const targetUrl = `https://tienddi.co/${pathStr}${search}`;
    
    console.log(`[Proxy] Redirigiendo a: ${targetUrl}`);
    
    // Realizar la petición al destino
    const response = await fetch(targetUrl, { 
      method: 'GET',
      headers: {
        // Enviar algunos headers para simular un navegador real
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      }
    });

    // Registrar información de la respuesta para depuración
    console.log(`[Proxy] Respuesta: ${response.status} ${response.statusText}`);
    console.log(`[Proxy] Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Error ${response.status}: ${errorText.substring(0, 200)}...`);
      return res.status(response.status).json({ 
        error: `Error proxy: ${response.status} ${response.statusText}` 
      });
    }

    // Obtener el tipo de contenido para devolver el mismo tipo
    const contentType = response.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);
    
    // Si es una imagen o recurso binario, devolver como Buffer
    if (contentType.includes('image/') || 
        contentType.includes('font/') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/octet-stream')) {
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
    
    // Si es CSS, JavaScript u otro texto, procesar como texto
    const content = await response.text();
    
    // Si es HTML, podríamos procesar los links para que apunten a nuestro dominio
    if (contentType.includes('text/html')) {
      console.log(`[Proxy] Devolviendo HTML (longitud: ${content.length} caracteres)`);
    }
    
    // Enviar la respuesta
    return res.send(content);
  } catch (error) {
    console.error(`[Proxy] Error interno: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ 
      error: `Proxy error: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
}