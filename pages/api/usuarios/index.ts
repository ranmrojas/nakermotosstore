import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Listar usuarios
    const usuarios = await prisma.usuario.findMany();
    return res.status(200).json(usuarios);
  }
  if (req.method === 'POST') {
    // Crear usuario
    const { username, password, nombre, rol } = req.body;
    if (!username || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const usuario = await prisma.usuario.create({
        data: { username, password, nombre, rol },
      });
      return res.status(201).json(usuario);
    } catch {
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
} 