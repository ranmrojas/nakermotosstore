# Integración de Realtime en la Página de Admin

## Opción 1: Usar el Widget Compacto

El widget `PedidosRealtimeWidget` es perfecto para integrar en páginas existentes sin modificar mucho el código actual.

### Importar el Widget

```tsx
import { PedidosRealtimeWidget } from '../componentes/pedidos/PedidosRealtimeWidget'
```

### Agregar a la Página de Admin

En tu página de admin (`app/admin/page.tsx`), puedes agregar el widget en cualquier sección:

```tsx
// En la sección de estadísticas o sidebar
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Tus componentes existentes */}
  <div className="bg-white rounded-lg shadow p-6">
    {/* Contenido existente */}
  </div>
  
  {/* Widget de Realtime */}
  <PedidosRealtimeWidget 
    maxPedidos={5}
    showCreateForm={false}
    className="md:col-span-1"
  />
</div>
```

### Opciones del Widget

- `maxPedidos`: Número máximo de pedidos a mostrar (default: 5)
- `showCreateForm`: Mostrar formulario para crear pedidos (default: false)
- `className`: Clases CSS adicionales

## Opción 2: Integración Completa con Hook

Si quieres más control, puedes usar directamente el hook `usePedidosRealtime`:

```tsx
import { usePedidosRealtime } from '../../hooks/usePedidosRealtime'

export default function AdminDashboardPage() {
  const { pedidos, loading, error, updatePedido } = usePedidosRealtime()
  
  // Tu lógica existente...
  
  // Los pedidos se actualizarán automáticamente en tiempo real
  useEffect(() => {
    if (pedidos.length > 0) {
      // Actualizar tu estado local si es necesario
      setOrders(pedidos)
    }
  }, [pedidos])
  
  // Resto de tu código...
}
```

## Opción 3: Reemplazar el Sistema Actual

Si quieres migrar completamente al sistema de realtime:

### 1. Reemplazar la función fetchPedidos

```tsx
// En lugar de fetchPedidos manual
const { pedidos, loading, error, updatePedido } = usePedidosRealtime()

// Los pedidos se cargan automáticamente y se actualizan en tiempo real
```

### 2. Actualizar el manejo de cambios de estado

```tsx
const handleStatusChange = async (orderId: number, newStatus: string) => {
  try {
    await updatePedido(orderId, { estado: newStatus })
    // No necesitas recargar manualmente - se actualiza automáticamente
  } catch (error) {
    console.error('Error al actualizar estado:', error)
  }
}
```

## Ejemplo de Integración Completa

```tsx
"use client"
import React, { useEffect, useState } from "react"
import { usePedidosRealtime } from '../../hooks/usePedidosRealtime'
import { PedidosRealtimeWidget } from '../componentes/pedidos/PedidosRealtimeWidget'

export default function AdminDashboardPage() {
  const { pedidos, loading, error, updatePedido } = usePedidosRealtime()
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar pedidos según el estado
  const filteredPedidos = pedidos.filter(pedido => {
    if (filterStatus !== "todos" && pedido.estado !== filterStatus) {
      return false
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        pedido.cliente?.nombre.toLowerCase().includes(searchLower) ||
        pedido.id.toString().includes(searchTerm)
      )
    }
    return true
  })

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updatePedido(orderId, { estado: newStatus })
    } catch (error) {
      console.error('Error al actualizar estado:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard de Pedidos</h1>
            
            {/* Filtros */}
            <div className="flex gap-4 mb-6">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="todos">Todos</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Enviado">Enviados</option>
                <option value="Entregado">Entregados</option>
              </select>
              
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
            </div>

            {/* Lista de pedidos */}
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPedidos.map((pedido) => (
                  <div key={pedido.id} className="border rounded p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Pedido #{pedido.id}</h3>
                        <p className="text-gray-600">
                          {pedido.cliente?.nombre} - ${pedido.total}
                        </p>
                      </div>
                      <select
                        value={pedido.estado}
                        onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                        className="border rounded px-3 py-1"
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
            )}
          </div>
        </div>

        {/* Sidebar con widget de realtime */}
        <div className="lg:col-span-1">
          <PedidosRealtimeWidget 
            maxPedidos={10}
            showCreateForm={true}
          />
        </div>
      </div>
    </div>
  )
}
```

## Ventajas de la Integración

1. **Actualizaciones automáticas**: Los pedidos se actualizan en tiempo real sin necesidad de refrescar
2. **Mejor UX**: Los usuarios ven cambios inmediatamente
3. **Menos código**: No necesitas manejar polling o websockets manualmente
4. **Escalable**: Supabase maneja la infraestructura de realtime
5. **Consistente**: Todos los clientes ven los mismos datos en tiempo real

## Consideraciones

- Asegúrate de que las variables de entorno estén configuradas
- El realtime funciona mejor con conexiones estables
- Considera implementar reconexión automática para casos de pérdida de conexión 