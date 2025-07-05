import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../../../lib/generated/prisma';
import { DireccionesGuardadas, DireccionGuardada } from '../../../../../types/direcciones';
import type { InputJsonValue } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const clienteId = Number(id);

  if (req.method === 'GET') {
    // Obtener direcciones guardadas del cliente
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { direccionesGuardadas: true }
      });

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const direccionesGuardadas = cliente.direccionesGuardadas as DireccionesGuardadas | null;
      return res.status(200).json(direccionesGuardadas || { direcciones: [] });
    } catch (error) {
      console.error('Error al obtener direcciones guardadas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  if (req.method === 'POST') {
    // Agregar nueva dirección guardada
    try {
      const { direccion, valordomicilio, lat, lng, nombre } = req.body;

      if (!direccion || valordomicilio === undefined) {
        return res.status(400).json({ error: 'Dirección y valor de domicilio son obligatorios' });
      }

      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { direccionesGuardadas: true }
      });

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const direccionesActuales = cliente.direccionesGuardadas as DireccionesGuardadas | null || { direcciones: [] };

      // Validar si ya existe una dirección igual (ignorando mayúsculas/minúsculas y espacios)
      const direccionNormalizada = direccion.trim().toLowerCase();
      const yaExiste = direccionesActuales.direcciones.some(
        (dir) => dir.direccion.trim().toLowerCase() === direccionNormalizada
      );
      if (yaExiste) {
        return res.status(200).json({ message: 'La dirección ya existe, no se agregó de nuevo.' });
      }
      
      // Crear nueva dirección
      const nuevaDireccion: DireccionGuardada = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        direccion: direccion.trim(),
        valordomicilio,
        lat,
        lng,
        nombre: nombre?.trim(),
        esPrincipal: direccionesActuales.direcciones.length === 0, // Primera dirección es principal
        fechaCreacion: new Date().toISOString()
      };

      // Agregar a la lista
      direccionesActuales.direcciones.push(nuevaDireccion);

      // Si es la primera dirección, establecerla como principal
      if (direccionesActuales.direcciones.length === 1) {
        direccionesActuales.direccionPrincipal = nuevaDireccion.id;
      }

      // Actualizar en la base de datos
      await prisma.cliente.update({
        where: { id: clienteId },
        data: { direccionesGuardadas: direccionesActuales as unknown as InputJsonValue }
      });

      return res.status(201).json(nuevaDireccion);
    } catch (error) {
      console.error('Error al agregar dirección guardada:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 