export interface NotificacionSms {
  clienteNumero: string;
  clienteNombre: string;
  tipo: 'confirmacion' | 'enviado' | 'entregado' | 'cancelado' | 'recordatorio';
  pedidoId?: string;
  monto?: string;
  codigo?: string;
  mensajePersonalizado?: string;
}

interface PlantillasSms {
  confirmacionPedido: (nombreCliente: string, numeroPedido: string) => string;
  pedidoEnviado: (nombreCliente: string, numeroPedido: string) => string;
  pedidoEntregado: (nombreCliente: string, numeroPedido: string) => string;
  codigoVerificacion: (codigo: string) => string;
  recordatorioPago: (nombreCliente: string, monto: string) => string;
}

const plantillas: PlantillasSms = {
  confirmacionPedido: (nombreCliente: string, numeroPedido: string) => 
    `Hola ${nombreCliente}, tu pedido #${numeroPedido} ha sido confirmado. Pronto nos pondremos en contacto contigo.`,
  
  pedidoEnviado: (nombreCliente: string, numeroPedido: string) => 
    `Hola ${nombreCliente}, tu pedido #${numeroPedido} está en camino. ¡Gracias por tu compra!`,
  
  pedidoEntregado: (nombreCliente: string, numeroPedido: string) => 
    `Hola ${nombreCliente}, tu pedido #${numeroPedido} ha sido entregado. ¡Esperamos que disfrutes tu compra!`,
  
  codigoVerificacion: (codigo: string) => 
    `Tu código de verificación es: ${codigo}. No lo compartas con nadie.`,
  
  recordatorioPago: (nombreCliente: string, monto: string) => 
    `Hola ${nombreCliente}, tienes un pago pendiente de $${monto}. Por favor, ponte en contacto con nosotros.`,
};

export class SmsNotificationService {
  private static instance: SmsNotificationService;

  static getInstance(): SmsNotificationService {
    if (!SmsNotificationService.instance) {
      SmsNotificationService.instance = new SmsNotificationService();
    }
    return SmsNotificationService.instance;
  }

  async enviarNotificacionPedido(notificacion: NotificacionSms): Promise<boolean> {
    try {
      let mensaje = '';

      switch (notificacion.tipo) {
        case 'confirmacion':
          mensaje = plantillas.confirmacionPedido(
            notificacion.clienteNombre,
            notificacion.pedidoId || ''
          );
          break;
        
        case 'enviado':
          mensaje = plantillas.pedidoEnviado(
            notificacion.clienteNombre,
            notificacion.pedidoId || ''
          );
          break;
        
        case 'entregado':
          mensaje = plantillas.pedidoEntregado(
            notificacion.clienteNombre,
            notificacion.pedidoId || ''
          );
          break;
        
        case 'recordatorio':
          mensaje = plantillas.recordatorioPago(
            notificacion.clienteNombre,
            notificacion.monto || '0'
          );
          break;
        
        case 'cancelado':
          mensaje = `Hola ${notificacion.clienteNombre}, lamentamos informarte que tu pedido #${notificacion.pedidoId} ha sido cancelado. Nos pondremos en contacto contigo.`;
          break;
        
        default:
          mensaje = notificacion.mensajePersonalizado || '';
      }

      if (!mensaje) {
        throw new Error('No se pudo generar el mensaje SMS');
      }

      const response = await fetch('/api/sms/hablame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: notificacion.clienteNumero,
          mensaje: mensaje,
        }),
      });

      return response.ok;

    } catch {
      return false;
    }
  }

  async enviarCodigoVerificacion(numero: string, codigo: string): Promise<boolean> {
    try {
      const mensaje = plantillas.codigoVerificacion(codigo);

      const response = await fetch('/api/sms/hablame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: numero,
          mensaje: mensaje,
        }),
      });

      return response.ok;

    } catch {
      return false;
    }
  }

  async enviarMensajePersonalizado(numero: string, mensaje: string): Promise<boolean> {
    try {
      const response = await fetch('/api/sms/hablame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: numero,
          mensaje: mensaje,
        }),
      });

      return response.ok;

    } catch {
      return false;
    }
  }
}

export const notificarEstadoPedido = async (
  pedidoId: string,
  clienteNumero: string,
  clienteNombre: string,
  estado: 'confirmado' | 'enviado' | 'entregado' | 'cancelado'
): Promise<boolean> => {
  const smsService = SmsNotificationService.getInstance();
  
  // Mensaje personalizado para confirmación de pedido
  if (estado === 'confirmado') {
    const mensaje = `Licorera Zona Frank le informa que su pedido ${pedidoId} fue recibido y ACEPTADO.\nSeguimiento en: https://licorerazonafrank.com/pedidos`;
    
    return await smsService.enviarMensajePersonalizado(clienteNumero, mensaje);
  }
  
  // Mensaje personalizado para pedido enviado
  if (estado === 'enviado') {
    const mensaje = `Su pedido ${pedidoId} ha sido enviado y se encuentra en ruta hacia su dirección. ¡Gracias por elegirnos!`;
    
    return await smsService.enviarMensajePersonalizado(clienteNumero, mensaje);
  }
  
  const tipoNotificacion = estado;
  
  return await smsService.enviarNotificacionPedido({
    clienteNumero,
    clienteNombre,
    tipo: tipoNotificacion,
    pedidoId,
  });
};

export const enviarCodigoVerificacion = async (numero: string): Promise<string | null> => {
  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    
    const smsService = SmsNotificationService.getInstance();
    const enviado = await smsService.enviarCodigoVerificacion(numero, codigo);
    
    return enviado ? codigo : null;
  } catch {
    return null;
  }
};
