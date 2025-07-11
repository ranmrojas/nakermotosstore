import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { telefono, code } = req.body;
  if (!telefono || !code) return res.status(400).json({ error: 'Datos requeridos' });

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({ to: telefono, code });

    if (verification.status === 'approved') {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: 'Código incorrecto' });
    }
  } catch {
    res.status(500).json({ error: 'Error validando código' });
  }
} 