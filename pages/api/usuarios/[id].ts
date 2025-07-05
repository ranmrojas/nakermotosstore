import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'GET') {
    // Obtener usuario por ID
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json(usuario);
  }

  if (req.method === 'PATCH') {
    // Actualizar datos del usuario
    const { username, password, nombre, rol } = req.body;
    try {
      const usuario = await prisma.usuario.update({
        where: { id: Number(id) },
        data: { username, password, nombre, rol },
      });
      return res.status(200).json(usuario);
    } catch {
      return res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }

  if (req.method === 'DELETE') {
    // Eliminar usuario
    try {
      await prisma.usuario.delete({ where: { id: Number(id) } });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 