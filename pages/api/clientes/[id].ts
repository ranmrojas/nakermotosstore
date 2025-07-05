import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'GET') {
    // Obtener cliente por ID
    const cliente = await prisma.cliente.findUnique({ where: { id: Number(id) } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    return res.status(200).json(cliente);
  }

  if (req.method === 'PATCH') {
    // Actualizar datos del cliente (nombre, telefono, direccion, valordomicilio, direccionesGuardadas)
    const { nombre, telefono, direccion, valordomicilio, direccionesGuardadas } = req.body;
    try {
      const cliente = await prisma.cliente.update({
        where: { id: Number(id) },
        data: { 
          nombre, 
          telefono, 
          direccion, 
          valordomicilio,
          direccionesGuardadas 
        },
      });
      return res.status(200).json(cliente);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      return res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  }

  if (req.method === 'DELETE') {
    // Eliminar cliente
    try {
      await prisma.cliente.delete({ where: { id: Number(id) } });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 