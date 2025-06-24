import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('[Test URLs] Probando diferentes URLs...');
    
    // URLs a probar
    const urlsToTest = [
      'https://tienddi.co/tienda/pedidos',
      'https://tienddi.co/tienda',
      'https://tienddi.co/tienda/productos',
      'https://tienddi.co/tienda/categorias',
      'https://tienddi.co/tienda/pedidos/categorias',
      'https://tienddi.co/tienda/pedidos/productos',
      'https://tienddi.co/tienda/pedidos/agua', // Esta URL apareció en los logs
      'https://tienddi.co/tienda/pedidos/cerveza',
      'https://tienddi.co/tienda/pedidos/licores'
    ];
    
    const results = [];
    
    for (const url of urlsToTest) {
      try {
        console.log(`[Test URLs] Probando: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          }
        });

        if (response.ok) {
          const html = await response.text();
          
          // Buscar indicadores de productos
          const priceCount = (html.match(/\$[\d,]+(?:\.\d{2})?/g) || []).length;
          const imageCount = (html.match(/<img[^>]*src="[^"]*"[^>]*>/gi) || []).length;
          const productIndicators = [
            'producto', 'product', 'item', 'card', 'articulo', 'mercancia',
            'precio', 'price', 'valor', 'costo', 'compra', 'venta'
          ];
          
          const hasProductTerms = productIndicators.some(term => 
            html.toLowerCase().includes(term)
          );
          
          results.push({
            url,
            status: response.status,
            htmlLength: html.length,
            priceCount,
            imageCount,
            hasProductTerms,
            sample: html.substring(0, 500), // Primeros 500 caracteres
            success: true
          });
        } else {
          results.push({
            url,
            status: response.status,
            success: false,
            error: `${response.status} ${response.statusText}`
          });
        }
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test URLs] Error:', error);
    return res.status(500).json({ 
      error: 'Error al probar URLs',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 