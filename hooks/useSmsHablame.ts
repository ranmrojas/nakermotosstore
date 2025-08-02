import { useState } from 'react';

export interface SmsData {
  numero: string;
  mensaje: string;
}

export interface SmsResponse {
  success: boolean;
  message: string;
  data?: {
    payLoad: {
      accountId: number;
      messages: Array<{
        id: string;
        statusId: number;
        text: string;
        to: string;
        price: number;
      }>;
      sendDate: string;
      smsQty: number;
    };
    responseTime: number;
    statusCode: number;
    statusMessage: string;
    timeStamp: string;
  };
  error?: string;
}

export interface UseSmsHablame {
  enviando: boolean;
  error: string | null;
  enviarSms: (datos: SmsData) => Promise<SmsResponse>;
  limpiarError: () => void;
}

export const useSmsHablame = (): UseSmsHablame => {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarSms = async (datos: SmsData): Promise<SmsResponse> => {
    setEnviando(true);
    setError(null);

    try {
      if (!datos.numero || !datos.mensaje) {
        throw new Error('Número y mensaje son requeridos');
      }

      const numeroLimpio = datos.numero.replace(/\D/g, '');
      if (numeroLimpio.length < 10) {
        throw new Error('El número debe tener al menos 10 dígitos');
      }

      const response = await fetch('/api/sms/hablame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: numeroLimpio,
          mensaje: datos.mensaje,
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || 'Error al enviar SMS');
      }

      return {
        success: true,
        message: resultado.message || 'SMS enviado correctamente',
        data: resultado.data,
      };

    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensajeError);
      
      return {
        success: false,
        message: 'Error al enviar SMS',
        error: mensajeError,
      };
    } finally {
      setEnviando(false);
    }
  };

  const limpiarError = () => {
    setError(null);
  };

  return {
    enviando,
    error,
    enviarSms,
    limpiarError,
  };
};

export const usePlantillasSms = () => {
  const plantillas = {
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

  return { plantillas };
};
