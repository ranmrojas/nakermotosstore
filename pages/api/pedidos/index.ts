import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';
import { AuditoriaService } from '../../../lib/auditoriaService';
import twilio from 'twilio';
import { config } from 'dotenv';
config();

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

      // Obtener datos del cliente para la notificación
      const cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
      if (cliente) {
        // Recortar la dirección hasta la segunda coma
        let direccionCorta = cliente.direccion;
        if (typeof direccionCorta === 'string') {
          const partes = direccionCorta.split(',');
          if (partes.length >= 2) {
            direccionCorta = partes.slice(0, 2).join(',').trim();
          } else {
            direccionCorta = direccionCorta.trim();
          }
        }

        // Construir el cuerpo del mensaje reemplazando los placeholders de la plantilla
        let plantilla =
          '👉🏻 Nuevo pedido recibido:\n\n' +
          'Número de pedido: #{{1}}\n' +
          'Cliente: *{{2}}*\n' +
          'Dirección: {{3}}\n' +
          'Celular: {{11}}\n';
        if (pedido.nota && pedido.nota.trim() !== '') {
          plantilla += 'Nota del pedido: {{4}}\n\n';
        } else {
          plantilla += '\n';
        }
        plantilla +=
          'Productos:\n{{5}}\n' +
          'Subtotal: {{6}}\n' +
          'Valor del domicilio: {{7}}\n' +
          '*Total a pagar: {{8}}*\n' +
          'Medio de pago: *{{9}}*\n' +
          '*** ----------------Fin---------------- ***';

        // Preparar lista de productos como texto (formato detallado con total por producto y total de unidades)
        let productosComoTexto = '';
        let totalUnidades = 0;
        if (Array.isArray(productos)) {
          productosComoTexto = productos.map((p: { nombre: string; cantidad: number; precioUnitario?: number; sku?: string }) => {
            totalUnidades += p.cantidad;
            const linea = `- ${p.cantidad}x ${p.nombre}`;
            let detalles = '';
            let totalProducto = '';
            if (typeof p.precioUnitario === 'number') {
              totalProducto = `T: $${(p.cantidad * p.precioUnitario).toLocaleString('es-CO')}`;
            }
            if (totalProducto && p.sku) {
              detalles = `${totalProducto}  sku: ${p.sku}`;
            } else if (totalProducto) {
              detalles = totalProducto;
            } else if (p.sku) {
              detalles = `sku: ${p.sku}`;
            }
            return detalles ? `${linea}\n  ${detalles}` : linea;
          }).join('\n');
          productosComoTexto += `\n\nUNIDADES: *${totalUnidades}*\n`;
        } else if (typeof productos === 'string') {
          productosComoTexto = productos;
        }

        // Capitalizar medio de pago
        const medioPagoFormateado = pedido.medioPago ? pedido.medioPago.charAt(0).toUpperCase() + pedido.medioPago.slice(1).toLowerCase() : 'No especificado';

        const body = plantilla
          .replace('{{1}}', pedido.id.toString())
          .replace('{{2}}', cliente.nombre)
          .replace('{{3}}', direccionCorta)
          .replace('{{4}}', pedido.nota ? pedido.nota : '')
          .replace('{{5}}', productosComoTexto)
          .replace('{{6}}', pedido.subtotal.toLocaleString('es-CO'))
          .replace('{{7}}', pedido.domicilio.toLocaleString('es-CO'))
          .replace('{{8}}', pedido.total.toLocaleString('es-CO'))
          .replace('{{9}}', medioPagoFormateado)
          .replace('{{11}}', cliente.telefono || '');

        // Enviar notificación por WhatsApp usando Twilio
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID!;
          const authToken = process.env.TWILIO_AUTH_TOKEN!;
          const from = process.env.TWILIO_WHATSAPP_FROM!;
          const adminTo = process.env.ADMIN_WHATSAPP!;

          const client = twilio(accountSid, authToken);

          await client.messages.create({
            to: adminTo,
            from,
            body
          });
        } catch (twilioError) {
          console.error('Error enviando notificación por WhatsApp:', twilioError);
          // No interrumpir el flujo si falla Twilio
        }
      }

      return res.status(201).json(pedido);
    } catch (error) {
      console.error('Error al crear pedido:', error);
      return res.status(500).json({ error: 'Error al crear pedido' });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
} 