import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, AUTH_CONFIG } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const path = requestUrl.pathname.replace('/api/proxy/', '');
    const numeroCategoria = requestUrl.searchParams.get('numeroCategoria') || '';

    // Obtener la fecha y hora actual
    const now = new Date();
    const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const diaActual = dias[now.getDay()];
    const horaActual = now.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });

    // Parámetros base que siempre deben estar presentes
    const baseParams = {
      traerDetalle: '0',
      id_sucursal: '1', // Este es fijo
      id_categoria: numeroCategoria, // Usamos el ID de categoría proporcionado
      dia_actual: diaActual,
      hora_actual: horaActual,
      numeroCategoria: numeroCategoria,
      validar_inventario: '1',
      limite: '60'
    };

    // Obtener los parámetros actuales de la URL
    const currentParams = Object.fromEntries(requestUrl.searchParams);

    // Combinar los parámetros base con los actuales
    const finalParams = { ...baseParams, ...currentParams };
    
    // Construir la URL final
    const searchParams = new URLSearchParams(finalParams);
    const apiUrl = `${API_CONFIG.BASE_URL}/${path}?${searchParams}`;

    console.log('URL de la petición:', apiUrl);
    console.log('Parámetros enviados:', finalParams);

    // Configurar los headers usando los valores predefinidos
    const headers = {
      ...AUTH_CONFIG.HEADERS,
      'Authorization': `Bearer ${AUTH_CONFIG.API_TOKEN}`
    };

    // Realizar la petición
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      console.error('Error en la respuesta:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Obtener los datos
    const data = await response.json();

    // Devolver la respuesta
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en el proxy:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/proxy/', '');
  const url = `${API_CONFIG.BASE_URL}/${path}`;

  console.log('URL de la petición POST:', url);

  try {
    const body = await request.json();
    console.log('Body de la petición:', body);
    console.log('Headers:', {
      ...AUTH_CONFIG.HEADERS,
      'X-Auth-Token': AUTH_CONFIG.API_TOKEN,
      'X-Auth-Token-api': AUTH_CONFIG.API_TOKEN,
      'Authorization': `Bearer ${AUTH_CONFIG.API_TOKEN}`
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...AUTH_CONFIG.HEADERS,
        'X-Auth-Token': AUTH_CONFIG.API_TOKEN,
        'X-Auth-Token-api': AUTH_CONFIG.API_TOKEN,
        'Authorization': `Bearer ${AUTH_CONFIG.API_TOKEN}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('Error en la respuesta POST:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      const text = await response.text();
      console.log('Contenido de la respuesta POST:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log('Respuesta del servidor POST:', text);
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError);
      return NextResponse.json(
        { error: 'Error parseando la respuesta del servidor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en el proxy:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 