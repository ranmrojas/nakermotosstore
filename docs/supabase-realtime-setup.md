# Configuración de Supabase Realtime para Pedidos

## Requisitos Previos

1. Tener una cuenta en Supabase
2. Tener un proyecto creado en Supabase
3. Tener la tabla `Pedido` configurada con realtime habilitado

## Configuración de Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## Habilitar Realtime en Supabase

1. Ve a tu dashboard de Supabase
2. Navega a **Database** > **Replication**
3. En la sección **Realtime**, habilita la tabla `Pedido`
4. Asegúrate de que esté configurado como `ON`

## Archivos Creados

### 1. `lib/supabase.ts`
Configuración del cliente de Supabase y tipos TypeScript para los datos.

### 2. `hooks/usePedidosRealtime.ts`
Hook personalizado que maneja:
- Carga inicial de pedidos
- Suscripción a cambios en tiempo real
- Funciones CRUD para pedidos
- Manejo de estados de carga y errores

### 3. `app/componentes/pedidos/PedidosRealtime.tsx`
Componente de ejemplo que demuestra cómo usar el hook.

## Uso del Hook

```tsx
import { usePedidosRealtime } from '../hooks/usePedidosRealtime'

const MiComponente = () => {
  const { 
    pedidos, 
    loading, 
    error, 
    updatePedido, 
    createPedido, 
    deletePedido 
  } = usePedidosRealtime()

  // Los pedidos se actualizan automáticamente en tiempo real
  // cuando hay cambios en la base de datos
}
```

## Funcionalidades Disponibles

### Estados
- `pedidos`: Array de pedidos actualizado en tiempo real
- `loading`: Estado de carga inicial
- `error`: Mensaje de error si ocurre alguno

### Funciones
- `updatePedido(id, updates)`: Actualiza un pedido específico
- `createPedido(pedidoData)`: Crea un nuevo pedido
- `deletePedido(id)`: Elimina un pedido
- `refreshPedidos()`: Recarga manualmente los pedidos

## Eventos de Realtime

El hook maneja automáticamente:
- **INSERT**: Nuevos pedidos se agregan al inicio de la lista
- **UPDATE**: Los pedidos existentes se actualizan en la lista
- **DELETE**: Los pedidos eliminados se remueven de la lista

## Ejemplo de Uso Completo

```tsx
'use client'

import { usePedidosRealtime } from '../hooks/usePedidosRealtime'

export const PedidosDashboard = () => {
  const { pedidos, loading, error, updatePedido } = usePedidosRealtime()

  const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    try {
      await updatePedido(pedidoId, { estado: nuevoEstado })
    } catch (error) {
      console.error('Error al actualizar:', error)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Pedidos en Tiempo Real</h1>
      {pedidos.map(pedido => (
        <div key={pedido.id}>
          <h3>Pedido #{pedido.id}</h3>
          <p>Estado: {pedido.estado}</p>
          <p>Total: ${pedido.total}</p>
          <button onClick={() => cambiarEstado(pedido.id, 'Enviado')}>
            Marcar como Enviado
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Consideraciones Importantes

1. **Conexión**: Asegúrate de que las variables de entorno estén correctamente configuradas
2. **Permisos**: Verifica que tu clave anónima tenga permisos para leer/escribir en la tabla Pedido
3. **RLS (Row Level Security)**: Si tienes RLS habilitado, asegúrate de configurar las políticas correctamente
4. **Performance**: El hook se suscribe automáticamente y se desuscribe cuando el componente se desmonta

## Solución de Problemas

### Error de Conexión
- Verifica que las variables de entorno sean correctas
- Asegúrate de que la URL de Supabase sea válida

### No se Reciben Actualizaciones
- Verifica que realtime esté habilitado en la tabla Pedido
- Revisa la consola del navegador para errores de conexión

### Errores de Permisos
- Verifica las políticas RLS en Supabase
- Asegúrate de que la clave anónima tenga los permisos necesarios 