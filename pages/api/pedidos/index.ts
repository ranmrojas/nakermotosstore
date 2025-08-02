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

        // Calcular el total de unidades para la notificación
        let totalUnidades = 0;
        if (Array.isArray(productos)) {
          productos.forEach((p: { cantidad: number }) => {
            totalUnidades += p.cantidad;
          });
        }

        // Capitalizar medio de pago
        const medioPagoFormateado = pedido.medioPago ? pedido.medioPago.charAt(0).toUpperCase() + pedido.medioPago.slice(1).toLowerCase() : 'No especificado';

        // Enviar notificación por WhatsApp
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID!;
          const authToken = process.env.TWILIO_AUTH_TOKEN!;
          const from = process.env.TWILIO_WHATSAPP_FROM!;
          const adminTo = process.env.ADMIN_WHATSAPP!;

          const client = twilio(accountSid, authToken);

          // Usar la plantilla aprobada por WhatsApp
          const contentSid = "HX695357d002a3da8b53ca7f5437a98b26"; // ID de tu plantilla aprobada
          
          // Preparar variables para la plantilla según la documentación oficial de Twilio
          // https://www.twilio.com/docs/messaging/channels/whatsapp/content-templates/use-content-templates
          
          // Crear las variables para la plantilla
          await client.messages.create({
            to: adminTo,
            from,
            contentSid: contentSid,
            contentVariables: JSON.stringify({
              1: pedido.id.toString(),             // Número de pedido
              2: cliente.nombre,                   // Nombre del cliente 
              3: cliente.telefono,                 // Teléfono del cliente
              4: direccionCorta,                   // Dirección corta
              5: totalUnidades.toString(),         // Total de productos
              6: pedido.total.toLocaleString('es-CO'), // Total del pedido
              7: medioPagoFormateado               // Método de pago
            })
          });
        } catch (twilioError: unknown) {
          // Convertir a un tipo con propiedad code para manejo de errores específicos
          const error = twilioError as { code?: number, message?: string };
          // Manejar errores específicos de plantillas de WhatsApp
          if (error.code === 63016) {
            console.error('Error 63016: Fuera de la ventana de mensajería de 24 horas. Usando plantilla pero puede haber un problema con el formato.');
          } else if (error.code === 63024) {
            console.error('Error 63024: Plantilla no aprobada o rechazada por WhatsApp. Verifica el estado de la plantilla en la consola de Twilio.');
          } else if (error.code === 63026) {
            console.error('Error 63026: Las variables de la plantilla no coinciden con lo esperado por WhatsApp.');
          } else {
            console.error('Error enviando notificación por WhatsApp:', error.message || 'Error desconocido');
          }
          
          // No interrumpir el flujo principal si falla la notificación
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