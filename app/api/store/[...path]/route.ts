import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const { path } = params;
    const pathStr = path.join('/');
    const search = request.nextUrl.search || '';
    const targetUrl = `https://tienddi.co/${pathStr}${search}`;
    
    console.log(`[Proxy] Redirigiendo a: ${targetUrl}`);
    
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
      return new NextResponse(`Error proxy: ${response.status} ${response.statusText}`, { 
        status: response.status 
      });
    }

    // Obtener el tipo de contenido para devolver el mismo tipo
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Si es una imagen o recurso binario, devolver como ArrayBuffer
    if (contentType.includes('image/') || 
        contentType.includes('font/') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/octet-stream')) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: { 'Content-Type': contentType }
      });
    }
    
    // Si es CSS, JavaScript u otro texto, procesar como texto
    const content = await response.text();
    
    // Si es HTML, podríamos procesar los links para que apunten a nuestro dominio
    if (contentType.includes('text/html')) {
      // Aquí podríamos modificar el HTML para cambiar URLs, pero por ahora lo dejamos tal cual
      console.log(`[Proxy] Devolviendo HTML (longitud: ${content.length} caracteres)`);
    }
    
    return new NextResponse(content, {
      status: 200,
      headers: { 'Content-Type': contentType }
    });
  } catch (error: any) {
    console.error(`[Proxy] Error interno: ${error.message}`);
    return new NextResponse(`Proxy error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} 