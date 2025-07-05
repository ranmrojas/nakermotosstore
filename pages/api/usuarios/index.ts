import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Listar usuarios (sin contraseñas)
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        nombre: true,
        rol: true
      }
    });
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
      
      // No retornar la contraseña en la respuesta
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...usuarioSinPassword } = usuario;
      return res.status(201).json(usuarioSinPassword);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
} 