import { useEffect, useState, useCallback } from 'react'
import { supabase, Pedido, Database } from '../lib/supabase'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export const usePedidosRealtime = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar pedidos iniciales
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('Pedido')
        .select(`
          *,
          cliente:Cliente(*)
        `)
        .order('realizadoEn', { ascending: false })

      if (error) {
        throw error
      }

      setPedidos(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para manejar cambios en tiempo real
  const handlePedidoChange = useCallback(async (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['Pedido']['Row']>) => {
    const { eventType, new: newPedido, old: oldPedido } = payload

    setPedidos(prevPedidos => {
      switch (eventType) {
        case 'INSERT':
          if (newPedido) {
            return [newPedido, ...prevPedidos]
          }
          break

        case 'UPDATE':
          if (newPedido) {
            return prevPedidos.map(pedido => 
              pedido.id === newPedido.id ? newPedido : pedido
            )
          }
          break

        case 'DELETE':
          if (oldPedido) {
            return prevPedidos.filter(pedido => pedido.id !== oldPedido.id)
          }
          break
      }
      return prevPedidos
    })
  }, [])

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    // Cargar datos iniciales
    loadPedidos()

    // Configurar suscripción de realtime
    const channel = supabase
      .channel('realtime-pedidos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Pedido'
        },
        handlePedidoChange
      )
      .subscribe()

    // Limpiar suscripción al desmontar
    return () => {
      channel.unsubscribe()
    }
  }, [loadPedidos, handlePedidoChange])

  // Función para actualizar un pedido
  const updatePedido = useCallback(async (id: number, updates: Partial<Pedido>) => {
    try {
      const { error } = await supabase
        .from('Pedido')
        .update(updates)
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar pedido')
      throw err
    }
  }, [])

  // Función para crear un nuevo pedido
  const createPedido = useCallback(async (pedidoData: Omit<Pedido, 'id' | 'realizadoEn'>) => {
    try {
      const { error } = await supabase
        .from('Pedido')
        .insert(pedidoData)

      if (error) {
        throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pedido')
      throw err
    }
  }, [])

  // Función para eliminar un pedido
  const deletePedido = useCallback(async (id: number) => {
    try {
      const { error } = await supabase
        .from('Pedido')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pedido')
      throw err
    }
  }, [])

  return {
    pedidos,
    loading,
    error,
    updatePedido,
    createPedido,
    deletePedido,
    refreshPedidos: loadPedidos
  }
} 