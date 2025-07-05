'use client'

import { usePedidosRealtime } from '../../../hooks/usePedidosRealtime'
import { useState } from 'react'

interface PedidosRealtimeWidgetProps {
  showCreateForm?: boolean
  maxPedidos?: number
  className?: string
}

export const PedidosRealtimeWidget = ({ 
  showCreateForm = false, 
  maxPedidos = 5,
  className = ""
}: PedidosRealtimeWidgetProps) => {
  const { pedidos, loading, error, updatePedido } = usePedidosRealtime()
  const [newPedido, setNewPedido] = useState({
    estado: 'Pendiente',
    productos: [],
    subtotal: 0,
    domicilio: 0,
    total: 0,
    clienteId: 1
  })

  // Filtrar solo los pedidos más recientes
  const pedidosRecientes = pedidos.slice(0, maxPedidos)

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    try {
      await updatePedido(id, { estado: nuevoEstado })
    } catch (error) {
      console.error('Error al actualizar pedido:', error)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-700 text-sm">
          Error de conexión: {error}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Pedidos Realtime
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">En vivo</span>
        </div>
      </div>

      {/* Formulario compacto para crear pedido */}
      {showCreateForm && (
        <div className="bg-gray-50 p-3 rounded mb-4">
          <h4 className="text-sm font-medium mb-2">Crear Pedido Rápido</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Cliente ID"
              value={newPedido.clienteId}
              onChange={(e) => setNewPedido(prev => ({ 
                ...prev, 
                clienteId: parseInt(e.target.value) || 1 
              }))}
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Total"
              value={newPedido.total}
              onChange={(e) => setNewPedido(prev => ({ 
                ...prev, 
                total: parseInt(e.target.value) || 0 
              }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      <div className="space-y-3">
        {pedidosRecientes.map((pedido) => (
          <div key={pedido.id} className="border rounded p-3 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-sm">#{pedido.id}</h4>
                <p className="text-xs text-gray-600">
                  {pedido.cliente?.nombre || `Cliente ${pedido.clienteId}`}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(pedido.realizadoEn).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  pedido.estado === 'Enviado' ? 'bg-green-100 text-green-800' :
                  pedido.estado === 'Entregado' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pedido.estado}
                </span>
                <div className="text-sm font-medium mt-1">
                  ${pedido.total}
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              <select
                value={pedido.estado}
                onChange={(e) => handleUpdateEstado(pedido.id, e.target.value)}
                className="border rounded px-2 py-1 text-xs flex-1"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {pedidosRecientes.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No hay pedidos recientes
        </div>
      )}

      {pedidos.length > maxPedidos && (
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500">
            Mostrando {maxPedidos} de {pedidos.length} pedidos
          </span>
        </div>
      )}
    </div>
  )
} 