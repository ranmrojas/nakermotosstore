"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import AdminOrderManager from "../../componentes/carrito/AdminOrderManager";
import AdminProtected from "../../componentes/admin/AdminProtected";
import { supabase, Database } from "../../../lib/supabase";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Pedido = Database['public']['Tables']['Pedido']['Row'] & { nota?: string };
type Producto = Database['public']['Tables']['Pedido']['Row']['productos'][number];

interface PedidoAdaptado {
  id: number;
  cliente: string;
  estado: string;
  total: number;
  fecha: string;
  fechaOriginal: string;
  productos?: Producto[];
  direccion?: string;
  telefono?: string;
  subtotal?: number;
  domicilio?: number;
  medioPago?: string;
  enviadoAt?: string;
  nota?: string;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Pedido[]>([]);

  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);





  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('pedidos_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'Pedido' 
      }, async (payload: RealtimePostgresChangesPayload<Pedido>) => {
        console.log('🔄 Cambio detectado en pedidos:', payload);
        
        // Actualizar lista de pedidos
        const res = await fetch("/api/pedidos");
        const newOrders = await res.json();
        
        // Actualizar estado
        setOrders(newOrders);
      });

    channel.subscribe(async (status) => {
      console.log('📡 Estado de suscripción:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Suscripción a cambios en tiempo real activa');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await fetch("/api/pedidos");
        const data = await res.json();
        console.log('📥 Datos recibidos del API:', data.length, 'pedidos');
        setOrders(data);
      } catch {
        setOrders([]);
      }
    };
    
    // Cargar datos iniciales una sola vez
    fetchPedidos();
  }, []); // Solo se ejecuta al montar el componente

  // Adaptar los datos para AdminOrderManager
  const pedidosAdaptados: PedidoAdaptado[] = useMemo(() => 
    orders.map((pedido) => {
      const pedidoAdaptado = {
        id: pedido.id,
        cliente: pedido.cliente?.nombre || "-",
        estado: pedido.estado,
        total: pedido.total,
        fecha: new Date(pedido.realizadoEn).toLocaleString("es-CO"),
        fechaOriginal: pedido.realizadoEn,
        productos: pedido.productos,
        direccion: pedido.cliente?.direccion,
        telefono: pedido.cliente?.telefono,
        subtotal: pedido.subtotal,
        domicilio: pedido.domicilio,
        medioPago: pedido.medioPago,
        enviadoAt: pedido.enviadoAt,
        nota: pedido.nota
      };
      
      // Debug: verificar si hay notas
      if (pedido.nota) {
        console.log(`📝 Pedido ${pedido.id} tiene nota:`, pedido.nota);
      }
      
      return pedidoAdaptado;
    }), [orders]
  );

  // Filtrar pedidos
  const filteredOrders = pedidosAdaptados.filter((pedido) => {
    const matchesStatus = filterStatus === "todos" || pedido.estado === filterStatus;
    
    if (!searchTerm.trim()) {
      return matchesStatus;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Búsqueda en múltiples campos
    const matchesSearch = 
      // Cliente y ID
      pedido.cliente.toLowerCase().includes(searchLower) ||
      pedido.id.toString().includes(searchTerm) ||
      
      // Teléfono
      (pedido.telefono && pedido.telefono.includes(searchTerm)) ||
      
      // Dirección
      (pedido.direccion && pedido.direccion.toLowerCase().includes(searchLower)) ||
      
      // Estado
      pedido.estado.toLowerCase().includes(searchLower) ||
      
      // Medio de pago
      (pedido.medioPago && pedido.medioPago.toLowerCase().includes(searchLower)) ||
      
      // Productos (nombres y SKU)
      (pedido.productos && pedido.productos.some(producto => 
        producto.nombre.toLowerCase().includes(searchLower) ||
        (producto.sku && producto.sku.toLowerCase().includes(searchLower))
      )) ||
      
      // Total (búsqueda numérica)
      (pedido.total && pedido.total.toString().includes(searchTerm));
    
    return matchesStatus && matchesSearch;
  });

  // Estadísticas
  const stats = useMemo(() => ({
    total: orders.length,
    sinAceptar: orders.filter(p => p.estado === 'Pendiente').length,
    aceptados: orders.filter(p => p.estado === 'Aceptado').length,
    procesando: orders.filter(p => p.estado === 'Procesando').length,
    completados: orders.filter(p => p.estado === 'Completado').length,
    enviados: orders.filter(p => p.estado === 'Enviado').length,
    cancelados: orders.filter(p => p.estado === 'Cancelado').length,
    totalVentas: orders.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Sin_aceptar').reduce((sum, p) => sum + p.total, 0)
  }), [orders]);

  // Estadísticas del historial simplificadas
  const getHistoryStats = useCallback(() => {
    const ahora = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 1); // Último mes

    // Filtrar pedidos por período
    const pedidosFiltrados = orders.filter(p => {
      const fechaPedido = new Date(p.realizadoEn);
      return fechaPedido >= fechaInicio && fechaPedido <= ahora && p.estado !== 'Cancelado';
    });

    // Obtener pedidos completados y cancelados
    const pedidosCompletados = orders.filter(p => {
      const fechaPedido = new Date(p.realizadoEn);
      return fechaPedido >= fechaInicio && fechaPedido <= ahora && p.estado === 'Completado';
    }).map(p => ({
      id: p.id,
      cliente: p.cliente?.nombre || 'Cliente Anónimo',
      fecha: new Date(p.realizadoEn).toLocaleDateString('es-CO'),
      total: p.total,
      productos: p.productos.length,
      medioPago: p.medioPago || 'No especificado'
    }));

    const pedidosCancelados = orders.filter(p => {
      const fechaPedido = new Date(p.realizadoEn);
      return fechaPedido >= fechaInicio && fechaPedido <= ahora && p.estado === 'Cancelado';
    }).map(p => ({
      id: p.id,
      cliente: p.cliente?.nombre || 'Cliente Anónimo',
      fecha: new Date(p.realizadoEn).toLocaleDateString('es-CO'),
      total: p.total,
      productos: p.productos.length,
      medioPago: p.medioPago || 'No especificado'
    }));

    return {
      totalPedidos: pedidosFiltrados.length,
      totalVentas: pedidosFiltrados.reduce((sum, p) => sum + p.total, 0),
      promedioTicket: pedidosFiltrados.length > 0 ? pedidosFiltrados.reduce((sum, p) => sum + p.total, 0) / pedidosFiltrados.length : 0,
      pedidosCompletados,
      pedidosCancelados
    };
  }, [orders]);

  const historyStats = useMemo(() => getHistoryStats(), [getHistoryStats]);

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, estado: newStatus }
          : order
      )
    );
  };

  return (
    <AdminProtected>
      <main className="w-full px-4 py-6">
        {/* Header con búsqueda y filtro */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:items-center md:justify-end">
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Buscar por cliente, ID, teléfono, dirección, estado, productos, SKU..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  if (value.trim()) {
                    setShowSearchResults(true);
                  } else {
                    setShowSearchResults(false);
                  }
                }}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowSearchResults(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-56 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            >
              <option value="todos">Todos los estados</option>
              <option value="sin_aceptar">Sin Aceptar</option>
              <option value="pendiente">Pendientes</option>
              <option value="Aceptado">Aceptados</option>
              <option value="Procesando">Procesando</option>
              <option value="Enviado">Enviados</option>
              <option value="Completado">Completados</option>
              <option value="Cancelado">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('sin_aceptar');
              setShowSearchResults(false);
            }} 
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Aceptar</p>
                <p className="text-2xl font-bold text-amber-600">{stats.sinAceptar}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('Aceptado');
              setShowSearchResults(false);
            }} 
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aceptados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.aceptados}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('Procesando');
              setShowSearchResults(false);
            }} 
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Procesando</p>
                <p className="text-2xl font-bold text-purple-600">{stats.procesando}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('Enviado');
              setShowSearchResults(false);
            }} 
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enviados</p>
                <p className="text-2xl font-bold text-green-600">{stats.enviados}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('Completado');
              setShowSearchResults(false);
              // Asegurar que se muestre la sección de pedidos completados
              const completadosSection = document.querySelector('[data-section="pedidos-completados"]');
              if (completadosSection) {
                completadosSection.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-teal-600">{stats.completados}</p>
              </div>
              <div className="p-2 bg-teal-50 rounded-lg">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('Cancelado');
              setShowSearchResults(false);
              // Asegurar que se muestre la sección de pedidos cancelados
              const canceladosSection = document.querySelector('[data-section="pedidos-cancelados"]');
              if (canceladosSection) {
                canceladosSection.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelados}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </button>

          <button type="button" onClick={() => {
            setFilterStatus('todos');
          }} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-blue-600">${stats.totalVentas.toLocaleString('es-CO')}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        
        {/* Resultados de búsqueda */}
        {showSearchResults && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Resultados de Búsqueda
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Búsqueda: &quot;{searchTerm}&quot;</span>
                <span>•</span>
                <span>{filteredOrders.length} resultado{filteredOrders.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowSearchResults(false);
                  }}
                  className="ml-2 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                <AdminOrderManager 
                  orders={filteredOrders} 
                  onStatusChange={handleStatusChange}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500">No hay pedidos que coincidan con &quot;{searchTerm}&quot;</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowSearchResults(false);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}

        <section className="w-full px-2 md:px-0 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div data-section="pedidos-completados" className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Órdenes Completadas</span>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {historyStats.pedidosCompletados.length} órdenes
                </span>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                {historyStats.pedidosCompletados.length > 0 ? (
                  <table className="min-w-full text-sm text-left">
                    <thead className="sticky top-0 bg-white">
                      <tr>
                        <th className="px-2 py-1 text-gray-500 font-semibold">#Orden</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold">Cliente</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold">Fecha</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold text-center">Productos</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyStats.pedidosCompletados.map((pedido, idx) => (
                        <tr key={pedido.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-2 py-1 text-gray-700">#{pedido.id}</td>
                          <td className="px-2 py-1 text-gray-700">{pedido.cliente}</td>
                          <td className="px-2 py-1 text-gray-600">{pedido.fecha}</td>
                          <td className="px-2 py-1 text-gray-600 text-center">{pedido.productos}</td>
                          <td className="px-2 py-1 font-bold text-green-600 text-right">
                            ${pedido.total.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-white border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="px-2 py-2 font-semibold text-gray-700">Total</td>
                        <td className="px-2 py-2 font-bold text-green-700 text-right">
                          ${historyStats.pedidosCompletados.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-gray-400">No hay órdenes completadas en este período</span>
                  </div>
                )}
              </div>
            </div>

            {/* Órdenes Canceladas */}
            <div data-section="pedidos-cancelados" className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Órdenes Canceladas</span>
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  {historyStats.pedidosCancelados.length} órdenes
                </span>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                {historyStats.pedidosCancelados.length > 0 ? (
                  <table className="min-w-full text-sm text-left">
                    <thead className="sticky top-0 bg-white">
                      <tr>
                        <th className="px-2 py-1 text-gray-500 font-semibold">#Orden</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold">Cliente</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold">Fecha</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold text-center">Productos</th>
                        <th className="px-2 py-1 text-gray-500 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyStats.pedidosCancelados.map((pedido, idx) => (
                        <tr key={pedido.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-2 py-1 text-gray-700">#{pedido.id}</td>
                          <td className="px-2 py-1 text-gray-700">{pedido.cliente}</td>
                          <td className="px-2 py-1 text-gray-600">{pedido.fecha}</td>
                          <td className="px-2 py-1 text-gray-600 text-center">{pedido.productos}</td>
                          <td className="px-2 py-1 font-bold text-red-600 text-right">
                            ${pedido.total.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-white border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="px-2 py-2 font-semibold text-gray-700">Total</td>
                        <td className="px-2 py-2 font-bold text-red-700 text-right">
                          ${historyStats.pedidosCancelados.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-gray-400">No hay órdenes canceladas en este período</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </AdminProtected>
  );
}