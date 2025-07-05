import { useState, useCallback } from 'react';
import { DireccionesGuardadas } from '../types/direcciones';

interface Cliente {
  id: number;
  telefono: string;
  nombre: string;
  direccion: string;
  valordomicilio: number;
  direccionesGuardadas?: DireccionesGuardadas;
  createdAt: string;
  updatedAt: string;
}

interface CreateClienteData {
  telefono: string;
  nombre: string;
  direccion: string;
  valordomicilio?: number;
  direccionesGuardadas?: DireccionesGuardadas;
}

interface UpdateClienteData {
  telefono?: string;
  nombre?: string;
  direccion?: string;
  valordomicilio?: number;
  direccionesGuardadas?: DireccionesGuardadas;
}

export function useClientesApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear cliente
  const createCliente = useCallback(async (data: CreateClienteData): Promise<Cliente | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear cliente');
      }

      const cliente = await response.json();
      return cliente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener cliente por ID
  const getCliente = useCallback(async (id: number): Promise<Cliente | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener cliente');
      }

      const cliente = await response.json();
      return cliente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener cliente por teléfono
  const getClienteByTelefono = useCallback(async (telefono: string): Promise<Cliente | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes?telefono=${telefono}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al buscar cliente');
      }

      const clientes = await response.json();
      return clientes.length > 0 ? clientes[0] : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar cliente
  const updateCliente = useCallback(async (id: number, data: UpdateClienteData): Promise<Cliente | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar cliente');
      }

      const cliente = await response.json();
      return cliente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar cliente
  const deleteCliente = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar cliente');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear o actualizar cliente (útil para el flujo de carrito)
  const createOrUpdateCliente = useCallback(async (data: CreateClienteData): Promise<Cliente | null> => {
    // Primero buscar si ya existe un cliente con ese teléfono
    const existingCliente = await getClienteByTelefono(data.telefono);
    
    if (existingCliente) {
      // Si existe, actualizar con los nuevos datos
      return await updateCliente(existingCliente.id, data);
    } else {
      // Si no existe, crear nuevo
      return await createCliente(data);
    }
  }, [createCliente, getClienteByTelefono, updateCliente]);

  // Agregar dirección guardada
  const agregarDireccionGuardada = useCallback(async (clienteId: number, direccion: {
    direccion: string;
    valordomicilio: number;
    lat?: number;
    lng?: number;
    nombre?: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${clienteId}/direcciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(direccion),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar dirección');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener direcciones guardadas
  const obtenerDireccionesGuardadas = useCallback(async (clienteId: number): Promise<DireccionesGuardadas | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${clienteId}/direcciones`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener direcciones');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar dirección guardada
  const eliminarDireccionGuardada = useCallback(async (clienteId: number, direccionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${clienteId}/direcciones/${direccionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar dirección');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCliente,
    getCliente,
    getClienteByTelefono,
    updateCliente,
    deleteCliente,
    createOrUpdateCliente,
    agregarDireccionGuardada,
    obtenerDireccionesGuardadas,
    eliminarDireccionGuardada,
  };
} 