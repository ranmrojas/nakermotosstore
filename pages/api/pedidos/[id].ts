import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';
import { AuditoriaService } from '../../../lib/auditoriaService';
import twilio from 'twilio';
import { config } from 'dotenv';
config();

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
        select: { estado: true, clienteId: true }
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

      // Enviar notificación de cancelación si el estado es 'Cancelado'
      if (estado && typeof estado === 'string' && estado.toLowerCase() === 'cancelado') {
        // Obtener datos del cliente
        let cliente = null;
        if (clienteId) {
          cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
        } else if (pedidoAnterior?.clienteId) {
          cliente = await prisma.cliente.findUnique({ where: { id: Number(pedidoAnterior.clienteId) } });
        }
        if (cliente) {
          // Preparar lista de productos con formato
          let productosFormateados = '';
          if (pedido.productos && Array.isArray(pedido.productos)) {
            productosFormateados = pedido.productos.map((p) => {
              if (typeof p === 'object' && p !== null && 'nombre' in p && 'cantidad' in p) {
                const producto = p as { nombre: string; cantidad: number; precioUnitario?: number; sku?: string };
                const linea = `- ${producto.cantidad}x ${producto.nombre}`;
                let detalles = '';
                let totalProducto = '';
                if (typeof producto.precioUnitario === 'number') {
                  totalProducto = `T: $${(producto.cantidad * producto.precioUnitario).toLocaleString('es-CO')}`;
                }
                if (totalProducto && producto.sku) {
                  detalles = `${totalProducto}  sku: ${producto.sku}`;
                } else if (totalProducto) {
                  detalles = totalProducto;
                } else if (producto.sku) {
                  detalles = `sku: ${producto.sku}`;
                }
                return detalles ? `${linea}\n  ${detalles}` : linea;
              }
              return '';
            }).filter(linea => linea !== '').join('\n');
            // Ya no agregamos la línea de unidades aquí
          } else if (typeof pedido.productos === 'string') {
            productosFormateados = pedido.productos;
          }

          // Capitalizar medio de pago
          const medioPagoFormateado = pedido.medioPago ? pedido.medioPago.charAt(0).toUpperCase() + pedido.medioPago.slice(1).toLowerCase() : 'No especificado';

          // Enviar usando plantilla de WhatsApp (usando contentSid y contentVariables)
          try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID!;
            const authToken = process.env.TWILIO_AUTH_TOKEN!;
            const from = process.env.TWILIO_WHATSAPP_FROM!;
            const adminTo = process.env.ADMIN_WHATSAPP!;

            const client = twilio(accountSid, authToken);

            await client.messages.create({
              to: adminTo,
              from,
              contentSid: 'HXe02e87093e81a456c1bcfb12a5b21f64',
              contentVariables: JSON.stringify({
                '1': pedido.id.toString(),
                '2': cliente.nombre,
                '3': cliente.telefono || '',
                '4': cliente.direccion || '',
                '5': productosFormateados,
                '6': (pedido.subtotal || 0).toLocaleString('es-CO'),
                '7': (pedido.domicilio || 0).toLocaleString('es-CO'),
                '8': (pedido.total || 0).toLocaleString('es-CO'),
                '9': medioPagoFormateado,
                '10': pedido.nota ? `Nota: ${pedido.nota}` : '',
                '11': usuario ? `Pedido Cancelado por: ${usuario}` : ''
              })
            });
          } catch (twilioError) {
            console.error('Error enviando notificación de cancelación por WhatsApp:', twilioError);
          }
        }
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