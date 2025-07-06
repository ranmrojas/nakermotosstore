"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";

import AdminOrderManager from "../componentes/carrito/AdminOrderManager";
import AdminProtected from "../componentes/admin/AdminProtected";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

import { supabase, Database } from "../../lib/supabase";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
  const [showTracking, setShowTracking] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [newPendingAlert, setNewPendingAlert] = useState(false);
  const [pendingOrderTimers, setPendingOrderTimers] = useState<Map<number, { firstAlert: number, reminders: number[] }>>(new Map());
  


  // Referencias para mantener los timers persistentes
  const activeTimersRef = useRef<Map<number, NodeJS.Timeout[]>>(new Map());
  const pendingOrdersRef = useRef<Set<number>>(new Set());

  // Limpiar alerta automáticamente después de 30 segundos
  useEffect(() => {
    if (newPendingAlert) {
      const timer = setTimeout(() => {
        setNewPendingAlert(false);
      }, 30000); // 30 segundos
      
      return () => clearTimeout(timer);
    }
  }, [newPendingAlert]);

  // Inicializar servicio de notificaciones admin y suscribirse a cambios
  const handlePendingOrderReminders = useCallback(async (orderId: number, isNewOrder: boolean = false) => {
    const now = Date.now();
    
    if (isNewOrder) {
      // Verificar si ya tenemos timers para este pedido
      if (activeTimersRef.current.has(orderId)) {
        console.log(`⏰ Pedido ${orderId} ya tiene timers activos, saltando...`);
        return;
      }
      
      // Nueva orden pendiente - programar recordatorios
      const reminders = [
        now + 1 * 60 * 1000,  // 1 minuto
        now + 5 * 60 * 1000,  // 5 minutos
        now + 10 * 60 * 1000  // 10 minutos
      ];
      
      // Actualizar estado para UI
      setPendingOrderTimers(prevTimers => {
        const newTimers = new Map(prevTimers);
        newTimers.set(orderId, {
          firstAlert: now,
          reminders: reminders
        });
        return newTimers;
      });
      
      // Agregar a la referencia de pedidos pendientes
      pendingOrdersRef.current.add(orderId);
      
      // Crear y almacenar los timers
      const timers: NodeJS.Timeout[] = [];
      
      reminders.forEach((reminderTime, index) => {
        const delay = reminderTime - now;
        const timer = setTimeout(async () => {
          // Verificar si el pedido sigue pendiente usando la referencia
          if (pendingOrdersRef.current.has(orderId)) {
            const times = ['1 minuto', '5 minutos', '10 minutos'];
            console.log(`🔔 Recordatorio ${times[index]} para pedido ${orderId} - aún pendiente`);
            
            // Usar el nuevo servicio de notificaciones para recordatorios

            
            // Hacer vibrar
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
        }, delay);
        
        timers.push(timer);
      });
      
      // Almacenar los timers en la referencia
      activeTimersRef.current.set(orderId, timers);
      
      console.log(`⏰ Programados recordatorios para pedido ${orderId}: 1min, 5min, 10min`);
      
    } else {
      // Pedido ya no está pendiente - limpiar recordatorios
      if (activeTimersRef.current.has(orderId)) {
        // Cancelar todos los timers
        const timers = activeTimersRef.current.get(orderId);
        if (timers) {
          timers.forEach(timer => clearTimeout(timer));
        }
        activeTimersRef.current.delete(orderId);
        
        // Remover de la referencia de pedidos pendientes
        pendingOrdersRef.current.delete(orderId);
        
        // Actualizar estado para UI
        setPendingOrderTimers(prevTimers => {
          const newTimers = new Map(prevTimers);
          newTimers.delete(orderId);
          return newTimers;
        });
        
        console.log(`✅ Limpiados recordatorios para pedido ${orderId} - ya no está pendiente`);
      }
    }
  }, []);

  // Función para detectar nuevos pedidos pendientes
  const checkNewPendingOrders = useCallback(async (newOrders: Pedido[], oldOrders: Pedido[]) => {
    const newPendingOrders = newOrders.filter(p => p.estado === 'Pendiente');
    const oldPendingOrders = oldOrders.filter(p => p.estado === 'Pendiente');
    
    const newPendingCount = newPendingOrders.length;
    const oldPendingCount = oldPendingOrders.length;
    
    console.log(`🔍 Verificando pedidos pendientes: ${oldPendingCount} → ${newPendingCount}`);
  }, []);

  // Función para sincronizar el estado de pedidos pendientes
  const syncPendingOrders = useCallback((currentOrders: Pedido[]) => {
    const currentPendingIds = new Set(
      currentOrders
        .filter(p => p.estado === 'Pendiente')
        .map(p => p.id)
    );
    
    // Agregar nuevos pedidos pendientes
    currentPendingIds.forEach(orderId => {
      if (!pendingOrdersRef.current.has(orderId)) {
        handlePendingOrderReminders(orderId, true);
      }
    });
    
    // Remover pedidos que ya no están pendientes
    pendingOrdersRef.current.forEach(orderId => {
      if (!currentPendingIds.has(orderId)) {
        handlePendingOrderReminders(orderId, false);
      }
    });
  }, [handlePendingOrderReminders]);

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
        
        // Si es un nuevo pedido pendiente
        if (payload.eventType === 'INSERT' && payload.new.estado === 'Pendiente') {
          console.log('🆕 Nuevo pedido pendiente detectado:', payload.new.id);
          
          try {

            
            // Activar alerta visual y vibración
            setNewPendingAlert(true);
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            
            handlePendingOrderReminders(payload.new.id, true);
          } catch (error) {
            console.error('❌ Error mostrando notificación:', error);
          }
        }
        
        // Actualizar estado y verificar cambios
        setOrders(prevOrders => {
          checkNewPendingOrders(newOrders, prevOrders);
          return newOrders;
        });
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
  }, [handlePendingOrderReminders, checkNewPendingOrders]);

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

  // Estadísticas filtradas por última hora
  const stats = useMemo(() => {
    const ahora = new Date();
    const fechaInicio = new Date(ahora.getTime() - 16 * 60 * 60 * 1000); // Últimas 16 horas
    
    // Filtrar pedidos de la última hora
    const pedidosUltimaHora = orders.filter(p => {
      const fechaPedido = new Date(p.realizadoEn);
      return fechaPedido >= fechaInicio && fechaPedido <= ahora;
    });
    
    return {
      total: pedidosUltimaHora.length,
      sinAceptar: pedidosUltimaHora.filter(p => p.estado === 'Pendiente').length,
      aceptados: pedidosUltimaHora.filter(p => p.estado === 'Aceptado').length,
      procesando: pedidosUltimaHora.filter(p => p.estado === 'Procesando').length,
      completados: pedidosUltimaHora.filter(p => p.estado === 'Completado').length,
      enviados: pedidosUltimaHora.filter(p => p.estado === 'Enviado').length,
      cancelados: pedidosUltimaHora.filter(p => p.estado === 'Cancelado').length,
      totalVentas: pedidosUltimaHora.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Sin_aceptar').reduce((sum, p) => sum + p.total, 0)
    };
  }, [orders]);

  const handleStatusChange = (orderId: number, newStatus: string) => {
    // Si el pedido ya no está pendiente, eliminar sus recordatorios
    if (newStatus !== 'Pendiente') {
      handlePendingOrderReminders(orderId, false);
      console.log(`✅ Recordatorios eliminados para pedido ${orderId} - estado cambiado a ${newStatus}`);
    }
    
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, estado: newStatus }
          : order
      )
    );
  };



  // Sincronizar pedidos pendientes cuando cambien las órdenes
  useEffect(() => {
    if (orders.length > 0) {
      syncPendingOrders(orders);
    }
  }, [orders, syncPendingOrders]);

  // Limpiar timers al desmontar el componente
  useEffect(() => {
    const timersRef = activeTimersRef.current;
    const pOrdersRef = pendingOrdersRef.current;
    return () => {
      // Limpiar todos los timers pendientes
      timersRef.forEach((timers) => {
        timers.forEach(timer => clearTimeout(timer));
      });
      timersRef.clear();
      pOrdersRef.clear();
      setPendingOrderTimers(new Map());
      console.log('🧹 Timers de recordatorios limpiados');
    };
  }, []);





  return (
    <AdminProtected>
      {/* Eliminar el header propio, dejar solo el contenido principal */}
      <main className="w-full px-3 py-2">
        {/* Header con búsqueda y filtro */}
        <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mt-0">
                {newPendingAlert && (
                <div className="flex items-center gap-1 text-sm text-red-600 animate-pulse">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>¡Nuevos pedidos pendientes!</span>
                </div>
              )}
              {pendingOrderTimers.size > 0 && (
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{pendingOrderTimers.size} recordatorio{pendingOrderTimers.size !== 1 ? 's' : ''} activo{pendingOrderTimers.size !== 1 ? 's' : ''}</span>
                </div>
              )}

              <h2 className="text-xl font-semibold text-gray-900">
                Tracking de Pedidos
              </h2>
            </div>
          </div>
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
                    setShowTracking(false);
                  } else {
                    setShowSearchResults(false);
                    setShowTracking(true);
                  }
                }}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowSearchResults(false);
                    setShowTracking(true);
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
              setNewPendingAlert(false);
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
              setNewPendingAlert(false);
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
              setNewPendingAlert(false);
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
              setNewPendingAlert(false);
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
              setNewPendingAlert(false);
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
              setNewPendingAlert(false);
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
            setNewPendingAlert(false);
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

        {/* Lista de pedidos en 4 columnas */}
        {showTracking && (
          <div className="bg-white rounded-xl shadow-sm w-full min-h-[80vh] p-2 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Pendientes por aceptar */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 text-center md:text-left">
                  Pendientes por aceptar 
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {stats.sinAceptar}
                  </span>
                </h3>
                <AdminOrderManager 
                  orders={pedidosAdaptados.filter(p => p.estado === 'Pendiente')} 
                  onStatusChange={handleStatusChange}
                />
              </div>
              {/* Aceptados */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 text-center md:text-left">
                  Aceptados
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    {stats.aceptados}
                  </span>
                </h3>
                <AdminOrderManager 
                  orders={pedidosAdaptados.filter(p => p.estado === 'Aceptado')} 
                  onStatusChange={handleStatusChange}
                />
              </div>
              {/* Procesando */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 text-center md:text-left">
                  Procesando
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {stats.procesando}
                  </span>
                </h3>
                <AdminOrderManager 
                  orders={pedidosAdaptados.filter(p => p.estado === 'Procesando')} 
                  onStatusChange={handleStatusChange}
                />
              </div>
              {/* Enviados */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 text-center md:text-left">
                  Enviados
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {stats.enviados}
                  </span>
                </h3>
                <AdminOrderManager 
                  orders={pedidosAdaptados.filter(p => p.estado === 'Enviado')} 
                  onStatusChange={handleStatusChange}
                />
              </div>
            </div>
          </div>
        )}

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
                    setShowTracking(true);
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
                    setShowTracking(true);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Volver al tracking
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </AdminProtected>
  );
}