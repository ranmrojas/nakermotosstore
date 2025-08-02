import type { NextApiRequest, NextApiResponse } from 'next';

interface HablameMessage {
  to: string;
  text: string;
  costCenter: null;
  reference01: null;
  reference02: null;
  reference03: null;
}

interface HablameRequest {
  flash: boolean;
  priority: boolean;
  shortenUrls: boolean;
  deliveryReceiptUrl: null;
  messages: HablameMessage[];
}

interface HablameResponse {
  payLoad: {
    accountId: number;
    billingAccount: number;
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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { numero, mensaje }: { numero: string; mensaje: string } = req.body;

      if (!numero || !mensaje) {
        return res.status(400).json({
          error: 'Número y mensaje son requeridos'
        });
      }

      const apiKey = process.env.HABLAME_API_KEY;
      const apiUrl = process.env.HABLAME_API_URL;

      if (!apiKey || !apiUrl) {
        return res.status(500).json({
          error: 'Configuración de SMS no disponible'
        });
      }

      const hablameData: HablameRequest = {
        flash: false,
        priority: false,
        shortenUrls: false,
        deliveryReceiptUrl: null,
        messages: [
          {
            to: numero,
            text: mensaje,
            costCenter: null,
            reference01: null,
            reference02: null,
            reference03: null
          }
        ]
      };

      const response = await fetch(`${apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hablame-Key': apiKey,
        },
        body: JSON.stringify(hablameData),
      });

      const result: HablameResponse = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Error al enviar SMS',
          details: result
        });
      }

      return res.status(200).json({
        success: true,
        message: 'SMS enviado correctamente',
        data: result
      });

    } catch {
      return res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  } else if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Hablame SMS API',
      status: 'active',
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(405).json({
      error: 'Método no permitido'
    });
  }
}
