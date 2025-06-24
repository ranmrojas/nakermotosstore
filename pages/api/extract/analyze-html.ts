import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { url } = req.query;
    const targetUrl = url ? String(url) : 'https://tienddi.co/tienda/pedidos/agua';
    
    console.log(`[Analyze] Analizando HTML de: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
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
    
    // Buscar diferentes patrones que podrían contener productos
    const analysis: {
      priceElements: Array<{ text: string; content: string; position: number }>;
      imageElements: Array<{ element: string; src: string; position: number }>;
      nameElements: Array<{ text: string; content: string; position: number }>;
      classElements: Array<{ element: string; position: number }>;
      idElements: Array<{ element: string; position: number }>;
      attributeElements: Array<{ element: string; position: number }>;
    } = {
      priceElements: [],
      imageElements: [],
      nameElements: [],
      classElements: [],
      idElements: [],
      attributeElements: []
    };
    
    // Buscar elementos con precios
    const priceRegex = /<[^>]*>([^<]*\$[\d,]+(?:\.\d{2})?[^<]*)<\/[^>]*>/gi;
    let match;
    while ((match = priceRegex.exec(html)) !== null) {
      analysis.priceElements.push({
        text: match[0],
        content: match[1],
        position: match.index
      });
    }
    
    // Buscar elementos con imágenes
    const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
    while ((match = imageRegex.exec(html)) !== null) {
      analysis.imageElements.push({
        element: match[0],
        src: match[1],
        position: match.index
      });
    }
    
    // Buscar elementos con nombres de productos
    const nameRegex = /<[^>]*>([^<]*(?:producto|product|item|articulo|mercancia)[^<]*)<\/[^>]*>/gi;
    while ((match = nameRegex.exec(html)) !== null) {
      analysis.nameElements.push({
        text: match[0],
        content: match[1],
        position: match.index
      });
    }
    
    // Buscar elementos con clases específicas
    const classRegex = /<[^>]*class="[^"]*(?:product|item|card|producto|articulo)[^"]*"[^>]*>/gi;
    while ((match = classRegex.exec(html)) !== null) {
      analysis.classElements.push({
        element: match[0],
        position: match.index
      });
    }
    
    // Buscar elementos con IDs específicos
    const idRegex = /<[^>]*id="[^"]*(?:product|item|card|producto|articulo)[^"]*"[^>]*>/gi;
    while ((match = idRegex.exec(html)) !== null) {
      analysis.idElements.push({
        element: match[0],
        position: match.index
      });
    }
    
    // Buscar elementos con atributos específicos
    const attributeRegex = /<[^>]*(?:data-product|data-item|data-id)[^>]*>/gi;
    while ((match = attributeRegex.exec(html)) !== null) {
      analysis.attributeElements.push({
        element: match[0],
        position: match.index
      });
    }
    
    // Buscar secciones que podrían contener productos
    const sections: Array<{
      element: string;
      hasPrice: boolean;
      hasImage: boolean;
      hasName: boolean;
      content: string;
      position: number;
    }> = [];
    const sectionRegex = /<div[^>]*class="[^"]*(?:container|row|col|grid|list)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    while ((match = sectionRegex.exec(html)) !== null) {
      const sectionHtml = match[1];
      const hasPrice = /\$[\d,]+(?:\.\d{2})?/.test(sectionHtml);
      const hasImage = /<img[^>]*src="[^"]*"[^>]*>/.test(sectionHtml);
      const hasName = /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/.test(sectionHtml);
      
      if (hasPrice || hasImage || hasName) {
        sections.push({
          element: match[0].substring(0, 200) + '...',
          hasPrice,
          hasImage,
          hasName,
          content: sectionHtml.substring(0, 500) + '...',
          position: match.index
        });
      }
    }
    
    return res.json({
      success: true,
      targetUrl,
      htmlLength: html.length,
      analysis,
      sections,
      htmlSample: html.substring(0, 3000), // Primeros 3000 caracteres
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Analyze] Error:', error);
    return res.status(500).json({ 
      error: 'Error al analizar HTML',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 