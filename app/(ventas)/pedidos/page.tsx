'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useClientSession } from '@/hooks/useClientSession';
import OrderManager from '../../componentes/carrito/OrderManagerclient';
import { supabase } from '@/lib/supabase';

interface Pedido {
  id: string;
  estado: string;
  total: number;
  realizadoEn: string;
  productos: Producto[];
  subtotal: number;
  domicilio: number;
  medioPago?: string;
  cliente: {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    valordomicilio: number;
  } | null;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface PedidoAdaptado {
  id: number;
  cliente: string;
  estado: string;
  total: number;
  fecha: string;
  productos?: Producto[];
  direccion?: string;
  telefono?: string;
  subtotal?: number;
  domicilio?: number;
  medioPago?: string;
}

export default function PedidosPage() {
  const { session } = useClientSession();
  
  // Estados para pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [activeTab, setActiveTab] = useState<'en_curso' | 'historial'>('en_curso');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar pedidos del cliente
  useEffect(() => {
    if (!session?.id) return;
    setLoadingPedidos(true);
    fetch(`/api/pedidos?clienteId=${session.id}`)
      .then(res => res.json())
      .then(data => setPedidos(data))
      .catch(() => setPedidos([]))
      .finally(() => setLoadingPedidos(false));
  }, [session?.id]);

  // Suscripción en tiempo real a cambios en la tabla Pedido
  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase
      .channel('pedidos_changes_cliente')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Pedido'
      }, async () => {
        // Siempre recargar los pedidos del cliente actual ante cualquier cambio
        const res = await fetch(`/api/pedidos?clienteId=${session.id}`);
        const data = await res.json();
        setPedidos(data);
      });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session?.id]);

  const pedidosAdaptados: PedidoAdaptado[] = pedidos.map((pedido: Pedido) => ({
    id: parseInt(pedido.id) || 0,
    cliente: session?.nombre || '-',
    estado: pedido.estado,
    total: pedido.total,
    fecha: new Date(pedido.realizadoEn).toLocaleString('es-CO'),
    productos: pedido.productos,
    direccion: pedido.cliente?.direccion,
    telefono: pedido.cliente?.telefono,
    subtotal: pedido.subtotal,
    domicilio: pedido.domicilio,
    medioPago: pedido.medioPago,
  }));

  // Función para filtrar pedidos por término de búsqueda
  const filterPedidosBySearch = (pedidos: PedidoAdaptado[]) => {
    if (!searchTerm.trim()) return pedidos;
    
    const term = searchTerm.toLowerCase();
    return pedidos.filter(pedido => 
      pedido.id.toString().includes(term) ||
      pedido.estado.toLowerCase().includes(term) ||
      pedido.fecha.toLowerCase().includes(term) ||
      pedido.total.toString().includes(term) ||
      pedido.productos?.some(producto => 
        producto.nombre.toLowerCase().includes(term)
      ) ||
      false
    );
  };

  // Filtrar pedidos según la pestaña activa
  const pedidosEnCurso = filterPedidosBySearch(pedidosAdaptados.filter(pedido => {
    const estado = pedido.estado.toLowerCase();
    return !['completado', 'completed', 'finalizado', 'cancelado', 'canceled'].includes(estado);
  }));
  
  const pedidosHistorial = filterPedidosBySearch(pedidosAdaptados.filter(pedido => {
    const estado = pedido.estado.toLowerCase();
    return ['completado', 'completed', 'finalizado', 'cancelado', 'canceled'].includes(estado);
  }));

  const handleCancelOrder = (orderId: number) => {
    setPedidos(prevPedidos => 
      prevPedidos.map(pedido => 
        pedido.id === orderId.toString() 
          ? { ...pedido, estado: 'cancelado' }
          : pedido
      )
    );
  };

  if (!session) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100">
        <div className="w-full bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6 overflow-y-auto min-h-[90vh] flex flex-col mx-4 mt-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Mis Pedidos</h2>
          <div className="text-center text-gray-500">
            Debes iniciar sesión para ver tus pedidos.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100">
      <main className="w-full flex flex-col gap-4 px-4 pt-2 pb-8">
        {/* Sección de pedidos realizados */}
        <section className="bg-white rounded-2xl shadow-sm p-3 flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-gray-800 my-0">Mis Pedidos</h3>
          
          {/* Campo de búsqueda */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Buscar por ID, estado, fecha, total o productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Pestañas */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-2">
            <button
              onClick={() => setActiveTab('en_curso')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'en_curso'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Pedidos en curso ({pedidosEnCurso.length})
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'historial'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Historial ({pedidosHistorial.length})
            </button>
          </div>

          {/* Contenido de las pestañas */}
          {loadingPedidos ? (
            <div className="text-sm text-gray-500">Cargando pedidos...</div>
          ) : activeTab === 'en_curso' ? (
            pedidosEnCurso.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">No tienes pedidos en curso.</div>
            ) : (
              <OrderManager orders={pedidosEnCurso} onCancelOrder={handleCancelOrder} />
            )
          ) : (
            pedidosHistorial.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">No tienes pedidos en el historial.</div>
            ) : (
              <OrderManager orders={pedidosHistorial} onCancelOrder={handleCancelOrder} />
            )
          )}
        </section>
      </main>
    </div>
  );
}
