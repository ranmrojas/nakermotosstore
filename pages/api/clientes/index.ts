import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Filtrar por teléfono si se proporciona
    const { telefono } = req.query;
    let where = {};
    if (telefono && typeof telefono === 'string') {
      where = { telefono };
    }
    
    // Listar clientes
    const clientes = await prisma.cliente.findMany({ where });
    return res.status(200).json(clientes);
  }
  if (req.method === 'POST') {
    // Crear cliente
    const { telefono, nombre, direccion, valordomicilio, direccionesGuardadas } = req.body;
    if (!telefono || telefono.trim() === '') {
      return res.status(400).json({ error: 'El teléfono es obligatorio' });
    }
    // nombre y direccion pueden estar vacíos inicialmente
    const clienteData = {
      telefono: telefono.trim(),
      nombre: nombre?.trim() || '',
      direccion: direccion?.trim() || '',
      valordomicilio: valordomicilio || 0,
      direccionesGuardadas: direccionesGuardadas || null
    };
    try {
      const cliente = await prisma.cliente.create({
        data: clienteData,
      });
      return res.status(201).json(cliente);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      return res.status(500).json({ error: 'Error al crear cliente' });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
} 