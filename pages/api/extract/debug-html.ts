import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('[Debug] Obteniendo HTML raw...');
    
    // Obtener HTML del sitio original
    const response = await fetch('https://tienddi.co/tienda/pedidos', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener HTML: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[Debug] HTML obtenido (${html.length} caracteres)`);
    
    // Buscar patrones que podrían ser productos
    const productPatterns = [
      /<div[^>]*class="[^"]*product[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*item[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*card[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*producto[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*articulo[^"]*"[^>]*>/gi
    ];
    
    const foundPatterns = productPatterns.map((pattern) => {
      const matches = html.match(pattern);
      return {
        pattern: pattern.source,
        matches: matches ? matches.length : 0,
        sample: matches ? matches[0] : null
      };
    });
    
    // Buscar precios
    const priceMatches = html.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    
    // Buscar imágenes
    const imageMatches = html.match(/<img[^>]*src="([^"]*)"[^>]*>/gi) || [];
    
    return res.json({
      success: true,
      htmlLength: html.length,
      foundPatterns,
      priceCount: priceMatches.length,
      priceSamples: priceMatches.slice(0, 5),
      imageCount: imageMatches.length,
      imageSamples: imageMatches.slice(0, 5),
      htmlSample: html.substring(0, 2000), // Primeros 2000 caracteres para análisis
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Debug] Error:', error);
    return res.status(500).json({ 
      error: 'Error al obtener HTML',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 