'use client'

import { usePedidosRealtime } from '../../../hooks/usePedidosRealtime'
import { useState } from 'react'

export const PedidosRealtime = () => {
  const { pedidos, loading, error, updatePedido, createPedido, deletePedido } = usePedidosRealtime()
  const [newPedido, setNewPedido] = useState({
    estado: 'Pendiente',
    productos: [],
    subtotal: 0,
    domicilio: 0,
    total: 0,
    clienteId: 1
  })

  const handleCreatePedido = async () => {
    try {
      await createPedido(newPedido)
      setNewPedido({
        estado: 'Pendiente',
        productos: [],
        subtotal: 0,
        domicilio: 0,
        total: 0,
        clienteId: 1
      })
    } catch (error) {
      console.error('Error al crear pedido:', error)
    }
  }

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    try {
      await updatePedido(id, { estado: nuevoEstado })
    } catch (error) {
      console.error('Error al actualizar pedido:', error)
    }
  }

  const handleDeletePedido = async (id: number) => {
    try {
      await deletePedido(id)
    } catch (error) {
      console.error('Error al eliminar pedido:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Pedidos en Tiempo Real</h2>
      
      {/* Formulario para crear nuevo pedido */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Crear Nuevo Pedido</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Cliente ID"
            value={newPedido.clienteId}
            onChange={(e) => setNewPedido(prev => ({ ...prev, clienteId: parseInt(e.target.value) || 1 }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Subtotal"
            value={newPedido.subtotal}
            onChange={(e) => setNewPedido(prev => ({ ...prev, subtotal: parseInt(e.target.value) || 0 }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Domicilio"
            value={newPedido.domicilio}
            onChange={(e) => setNewPedido(prev => ({ ...prev, domicilio: parseInt(e.target.value) || 0 }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Total"
            value={newPedido.total}
            onChange={(e) => setNewPedido(prev => ({ ...prev, total: parseInt(e.target.value) || 0 }))}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={handleCreatePedido}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Crear Pedido
        </button>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">Pedido #{pedido.id}</h4>
                <p className="text-sm text-gray-600">
                  Cliente: {pedido.cliente?.nombre || `ID: ${pedido.clienteId}`}
                </p>
                <p className="text-sm text-gray-600">
                  Fecha: {new Date(pedido.realizadoEn).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  pedido.estado === 'Enviado' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pedido.estado}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium">Subtotal:</span> ${pedido.subtotal}
              </div>
              <div>
                <span className="font-medium">Domicilio:</span> ${pedido.domicilio}
              </div>
              <div>
                <span className="font-medium">Total:</span> ${pedido.total}
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={pedido.estado}
                onChange={(e) => handleUpdateEstado(pedido.id, e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              
              <button
                onClick={() => handleDeletePedido(pedido.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {pedidos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay pedidos disponibles
        </div>
      )}
    </div>
  )
} 