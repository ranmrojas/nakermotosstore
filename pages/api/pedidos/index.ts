import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';
import { AuditoriaService } from '../../../lib/auditoriaService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Filtrar por clienteId si se proporciona
    const { clienteId } = req.query;
    let where = {};
    if (clienteId) {
      where = { clienteId: Number(clienteId) };
    }
    // Listar pedidos con datos del cliente
    const pedidos = await prisma.pedido.findMany({
      where,
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
    return res.status(200).json(pedidos);
  }
  if (req.method === 'POST') {
    // Crear pedido
    const { estado, productos, subtotal, domicilio, total, clienteId, medioPago, usuario, nota } = req.body;
    if (!estado || !productos || !subtotal || !domicilio || !total || !clienteId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const pedido = await prisma.pedido.create({
        data: { 
          estado, 
          productos, 
          subtotal, 
          domicilio, 
          total, 
          clienteId,
          medioPago: medioPago || null,
          nota: typeof nota === 'string' ? nota.trim() : (nota || null)
        },
      });

      // Inicializar auditoría del pedido
      await AuditoriaService.inicializarAuditoria(pedido.id, usuario);

      return res.status(201).json(pedido);
    } catch (error) {
      console.error('Error al crear pedido:', error);
      return res.status(500).json({ error: 'Error al crear pedido' });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
} 