import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id_sucursal = '1' } = req.query;

  // Tokens desde headers o valores por defecto
  const x_auth_token = req.headers['x-auth-token'] || 'TU_TOKEN_AQUI';
  const x_auth_token_api = req.headers['x-auth-token-api'] || 'TU_TOKEN_API_AQUI';
  const x_auth_token_empresa = req.headers['x-auth-token-empresa'] || '5083';
  const x_auth_token_es_online = req.headers['x-auth-token-es-online'] || '1';
  const x_gtm = req.headers['x-gtm'] || 'GMT-0500';

  const url = `https://api.cuenti.co/jServerj4ErpPro/servicios_tienda_online2/api/consultarCategoriasEnLinea?id_sucursal=${id_sucursal}`;

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
        'x-gtm': String(x_gtm)
      }
    });
    if (!response.ok) {
      throw new Error(`Error al obtener categorías: ${response.status}`);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
} 