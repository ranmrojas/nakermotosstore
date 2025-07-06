import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';
import { hashPassword } from '../../../lib/authUtils';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { username, password, nombre, rol } = req.body;

    // Validaciones
    if (!username || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 5 caracteres' });
    }

    if (nombre.length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    if (!['admin', 'operador'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await hashPassword(password);

    // Crear el usuario con la contraseña hasheada
    const usuario = await prisma.usuario.create({
      data: {
        username,
        password: hashedPassword,
        nombre,
        rol
      }
    });

    // No retornar la contraseña en la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...usuarioSinPassword } = usuario;

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: usuarioSinPassword
    });

  } catch (error: unknown) {
    console.error('Error en registro:', error);
    
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }
    
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 