import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Eliminar cookie de sesión
    res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    return res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' });

  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 