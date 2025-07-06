import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';
import { hashPassword } from '../../../lib/authUtils';

const prisma = new PrismaClient();

interface UpdateUserData {
  username: string;
  nombre: string;
  rol: 'admin' | 'operador';
  password?: string;
}

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
      // Preparar datos para actualización
      const updateData: UpdateUserData = { username, nombre, rol };
      
      // Solo incluir password si se proporciona (para permitir actualizaciones sin cambiar contraseña)
      if (password && password.trim() !== '') {
        updateData.password = await hashPassword(password);
      }
      
      const usuario = await prisma.usuario.update({
        where: { id: Number(id) },
        data: updateData,
      });
      
      // No retornar la contraseña en la respuesta
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...usuarioSinPassword } = usuario;
      return res.status(200).json(usuarioSinPassword);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }
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