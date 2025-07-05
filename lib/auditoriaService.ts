import { PrismaClient, Prisma } from './generated/prisma';

const prisma = new PrismaClient();

export interface EventoAuditoria {
  fecha: string;
  accion: string;
  usuario?: string;
  detalles?: string;
}

export class AuditoriaService {
  /**
   * Agrega un evento de auditoría a un pedido
   */
  static async agregarEvento(
    pedidoId: number, 
    accion: string, 
    usuario?: string, 
    detalles?: string
  ): Promise<void> {
    try {
      // Obtener el pedido actual
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { auditoria: true }
      });

      if (!pedido) {
        throw new Error(`Pedido con ID ${pedidoId} no encontrado`);
      }

      // Crear el nuevo evento
      const nuevoEvento: EventoAuditoria = {
        fecha: new Date().toISOString(),
        accion,
        usuario,
        detalles
      };

      // Obtener la auditoría existente o crear un array vacío
      const auditoriaExistente = (pedido.auditoria as unknown as EventoAuditoria[]) || [];

      // Agregar el nuevo evento al array
      const nuevaAuditoria = [...auditoriaExistente, nuevoEvento];

      // Actualizar el pedido con la nueva auditoría
      await prisma.pedido.update({
        where: { id: pedidoId },
        data: { auditoria: nuevaAuditoria as unknown as Prisma.JsonArray }
      });

      console.log(`Evento de auditoría agregado al pedido ${pedidoId}: ${accion}`);
    } catch (error) {
      console.error('Error al agregar evento de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene la auditoría completa de un pedido
   */
  static async obtenerAuditoria(pedidoId: number): Promise<EventoAuditoria[]> {
    try {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { auditoria: true }
      });

      if (!pedido) {
        throw new Error(`Pedido con ID ${pedidoId} no encontrado`);
      }

      return (pedido.auditoria as unknown as EventoAuditoria[]) || [];
    } catch (error) {
      console.error('Error al obtener auditoría:', error);
      throw error;
    }
  }

  /**
   * Inicializa la auditoría de un pedido (se llama cuando se crea un nuevo pedido)
   */
  static async inicializarAuditoria(
    pedidoId: number, 
    usuario?: string
  ): Promise<void> {
    await this.agregarEvento(
      pedidoId, 
      'Pedido creado', 
      usuario, 
      'Pedido registrado en el sistema'
    );
  }

  /**
   * Registra un cambio de estado
   */
  static async registrarCambioEstado(
    pedidoId: number, 
    estadoAnterior: string, 
    estadoNuevo: string, 
    usuario?: string
  ): Promise<void> {
    await this.agregarEvento(
      pedidoId, 
      'Cambio de estado', 
      usuario, 
      `Estado cambiado de "${estadoAnterior}" a "${estadoNuevo}"`
    );
  }

  /**
   * Registra una acción del admin
   */
  static async registrarAccionAdmin(
    pedidoId: number, 
    accion: string, 
    usuario?: string, 
    detalles?: string
  ): Promise<void> {
    await this.agregarEvento(
      pedidoId, 
      `Admin: ${accion}`, 
      usuario, 
      detalles
    );
  }
} 