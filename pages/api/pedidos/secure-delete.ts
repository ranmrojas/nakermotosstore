import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Cliente con clave de servicio (privada)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clave privada, nunca en NEXT_PUBLIC
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir método DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.body

    // Validar que se proporcionó un ID
    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'ID de pedido requerido' })
    }

    // Aquí puedes agregar verificación de permisos
    // Por ejemplo, verificar si el usuario es admin
    // const user = await verifyAdminUser(req)
    // if (!user) {
    //   return res.status(403).json({ error: 'No autorizado' })
    // }

    // Eliminar el pedido usando la clave de servicio
    const { error } = await supabase
      .from('Pedido')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error al eliminar pedido:', error)
      return res.status(500).json({ error: 'Error al eliminar pedido' })
    }

    res.status(200).json({ 
      message: 'Pedido eliminado exitosamente',
      deletedId: id 
    })

  } catch (error) {
    console.error('Error en API route:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
} 