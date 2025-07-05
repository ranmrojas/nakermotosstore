import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const adminSession = req.cookies.admin_session;

    if (!adminSession) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(adminSession);
    } catch {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    if (!sessionData.loggedIn) {
      return res.status(401).json({ error: 'Sesión expirada' });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: sessionData.id,
        username: sessionData.username,
        nombre: sessionData.nombre,
        rol: sessionData.rol
      }
    });

  } catch (error) {
    console.error('Error verificando sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 