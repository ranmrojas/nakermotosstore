import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';
import { AuditoriaService } from '../../../lib/auditoriaService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'GET') {
    // Obtener pedido por ID (incluyendo datos del cliente)
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: { 
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            direccion: true,
            valordomicilio: true
          }
        } 
      },
    });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    return res.status(200).json(pedido);
  }

  if (req.method === 'PATCH') {
    // Actualizar datos del pedido
    const { estado, productos, subtotal, domicilio, total, clienteId, medioPago, usuario, enviadoAt } = req.body;
    
    try {
      // Obtener el estado anterior para la auditoría
      const pedidoAnterior = await prisma.pedido.findUnique({
        where: { id: Number(id) },
        select: { estado: true }
      });

      const pedido = await prisma.pedido.update({
        where: { id: Number(id) },
        data: { 
          estado, 
          productos, 
          subtotal, 
          domicilio, 
          total, 
          clienteId,
          medioPago: medioPago || undefined,
          enviadoAt: enviadoAt ? new Date(enviadoAt) : undefined
        },
      });

      // Registrar cambio de estado en auditoría si cambió
      if (pedidoAnterior && pedidoAnterior.estado !== estado) {
        await AuditoriaService.registrarCambioEstado(
          Number(id),
          pedidoAnterior.estado,
          estado,
          usuario
        );
      }

      return res.status(200).json(pedido);
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      return res.status(500).json({ error: 'Error al actualizar pedido' });
    }
  }

  if (req.method === 'DELETE') {
    // Eliminar pedido
    try {
      await prisma.pedido.delete({ where: { id: Number(id) } });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: 'Error al eliminar pedido' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 