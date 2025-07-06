import bcrypt from 'bcryptjs';

// Configuración para el hash
const SALT_ROUNDS = 12;

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Promise<string> - Contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Contraseña hasheada
 * @returns Promise<boolean> - true si coinciden, false si no
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Genera un salt aleatorio
 * @returns Promise<string> - Salt generado
 */
export async function generateSalt(): Promise<string> {
  return await bcrypt.genSalt(SALT_ROUNDS);
} 