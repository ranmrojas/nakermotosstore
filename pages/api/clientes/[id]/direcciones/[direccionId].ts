import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../../../lib/generated/prisma';
import { DireccionesGuardadas, DireccionGuardada } from '../../../../../types/direcciones';
import type { InputJsonValue } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, direccionId } = req.query;
  
  if (typeof id !== 'string' || typeof direccionId !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const clienteId = Number(id);

  if (req.method === 'DELETE') {
    // Eliminar dirección guardada
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { direccionesGuardadas: true }
      });

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const direccionesActuales = cliente.direccionesGuardadas as DireccionesGuardadas | null;
      
      if (!direccionesActuales || !direccionesActuales.direcciones) {
        return res.status(404).json({ error: 'No se encontraron direcciones guardadas' });
      }

      // Filtrar la dirección a eliminar
      const direccionesFiltradas = direccionesActuales.direcciones.filter(
        (dir: DireccionGuardada) => dir.id !== direccionId
      );

      // Si se eliminó la dirección principal, establecer la primera como principal
      if (direccionesActuales.direccionPrincipal === direccionId) {
        direccionesActuales.direccionPrincipal = direccionesFiltradas.length > 0 
          ? direccionesFiltradas[0].id 
          : undefined;
      }

      // Actualizar la lista
      const direccionesActualizadas: DireccionesGuardadas = {
        direcciones: direccionesFiltradas,
        direccionPrincipal: direccionesActuales.direccionPrincipal
      };

      // Actualizar en la base de datos
      await prisma.cliente.update({
        where: { id: clienteId },
        data: { direccionesGuardadas: direccionesActualizadas as unknown as InputJsonValue }
      });

      return res.status(200).json({ message: 'Dirección eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar dirección guardada:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 