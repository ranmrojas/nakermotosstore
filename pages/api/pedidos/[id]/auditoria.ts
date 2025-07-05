import type { NextApiRequest, NextApiResponse } from 'next';
import { AuditoriaService } from '../../../../lib/auditoriaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'GET') {
    try {
      const auditoria = await AuditoriaService.obtenerAuditoria(Number(id));
      return res.status(200).json(auditoria);
    } catch (error) {
      console.error('Error al obtener auditoría:', error);
      return res.status(500).json({ error: 'Error al obtener auditoría' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 