"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { gsap } from "gsap";
import AdminOrderManager from "../componentes/carrito/AdminOrderManager";
import { Bar } from 'react-chartjs-2';
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
import { notificationService } from "../../lib/notificationServiceAdmin";
import { supabase, Database } from "../../lib/supabase";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

type Pedido = Database['public']['Tables']['Pedido']['Row'];
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
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTracking, setShowTracking] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPeriod] = useState<string>("mes");
  const [customStartDate] = useState<string>("");
  const [customEndDate] = useState<string>("");
  const [newPendingAlert, setNewPendingAlert] = useState(false);
  const [pendingOrderTimers, setPendingOrderTimers] = useState<Map<number, { firstAlert: number, reminders: number[] }>>(new Map());
  
  // Referencias para las animaciones
  const sinAceptarRef = useRef<HTMLButtonElement>(null);
  const aceptadosRef = useRef<HTMLButtonElement>(null);
  const procesandoRef = useRef<HTMLButtonElement>(null);

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
            await notificationService.showReminder(
              `El pedido #${orderId} lleva ${times[index]} en estado pendiente`
            );
            
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
    const initNotifications = async () => {
      try {
        console.log('🎵 Inicializando servicio de notificaciones...');
        
        // Solicitar permisos de notificación si no están concedidos
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          console.log('🔔 Estado de permisos de notificación:', permission);
          
          if (permission !== 'granted') {
            console.warn('⚠️ Permisos de notificación no concedidos');
            alert('Por favor, permite las notificaciones para recibir alertas de nuevos pedidos.');
            return;
          }
        }

        // Inicializar el servicio de notificaciones
        await notificationService.initialize();
        
        // Probar el sistema de notificaciones
        console.log('🧪 Probando sistema de notificaciones...');
        await notificationService.simulateNewOrder();
      } catch (error) {
        console.error('❌ Error inicializando notificaciones:', error);
      }
    };

    initNotifications();

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
            // Asegurarse de que el servicio esté inicializado antes de notificar
            if (!notificationService.isInitialized()) {
              console.log('⚠️ Servicio de notificaciones no inicializado, reinicializando...');
              await notificationService.initialize();
            }
            
            // Mostrar notificación con sonido
            const mensaje = `Nuevo pedido #${payload.new.id} - ${payload.new.cliente?.nombre || 'Cliente'} - $${payload.new.total.toLocaleString('es-CO')}`;
            console.log('📢 Mostrando notificación:', mensaje);
            
            await notificationService.notifyNewOrder(mensaje, 'nuevo');
            
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
      setLoading(true);
      try {
        const res = await fetch("/api/pedidos");
        const data = await res.json();
        console.log('📥 Datos recibidos del API:', data.length, 'pedidos');
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Cargar datos iniciales una sola vez
    fetchPedidos();
  }, []); // Solo se ejecuta al montar el componente

  // Adaptar los datos para AdminOrderManager
  const pedidosAdaptados: PedidoAdaptado[] = useMemo(() => 
    orders.map((pedido) => ({
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
      enviadoAt: pedido.enviadoAt
    })), [orders]
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

  // Estadísticas del historial con período seleccionable
  const getHistoryStats = useCallback(() => {
    const ahora = new Date();
    let fechaInicio: Date;
    let fechaFin: Date = ahora;

    // Calcular fecha de inicio según el período seleccionado
    switch (selectedPeriod) {
      case "hora":
        fechaInicio = new Date(ahora.getTime() - 60 * 60 * 1000); // Última hora
        break;
      case "dia":
        fechaInicio = new Date(ahora.getTime() - 24 * 60 * 60 * 1000); // Último día
        break;
      case "semana":
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000); // Última semana
        break;
      case "mes":
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1); // Último mes
        break;
      case "personalizado":
        if (customStartDate && customEndDate) {
          fechaInicio = new Date(customStartDate);
          fechaFin = new Date(customEndDate);
        } else {
          // Si no hay fechas personalizadas, usar último mes por defecto
          fechaInicio = new Date();
          fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        }
        break;
      default:
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    }

    // Filtrar pedidos por período
    const pedidosFiltrados = orders.filter(p => {
      const fechaPedido = new Date(p.realizadoEn);
      return fechaPedido >= fechaInicio && fechaPedido <= fechaFin && p.estado !== 'Cancelado';
    });

    // Obtener pedidos completados y cancelados
    const pedidosCompletados = orders.filter(p => {
      const fechaPedido = new Date(p.realizadoEn);
      return fechaPedido >= fechaInicio && fechaPedido <= fechaFin && p.estado === 'Completado';
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
      return fechaPedido >= fechaInicio && fechaPedido <= fechaFin && p.estado === 'Cancelado';
    }).map(p => ({
      id: p.id,
      cliente: p.cliente?.nombre || 'Cliente Anónimo',
      fecha: new Date(p.realizadoEn).toLocaleDateString('es-CO'),
      total: p.total,
      productos: p.productos.length,
      medioPago: p.medioPago || 'No especificado'
    }));

    // Productos más comprados
    const productosCount: { [key: string]: { cantidad: number; valor: number } } = {};
    pedidosFiltrados.forEach(pedido => {
      pedido.productos.forEach(producto => {
        const key = producto.nombre;
        if (!productosCount[key]) {
          productosCount[key] = { cantidad: 0, valor: 0 };
        }
        productosCount[key].cantidad += producto.cantidad;
        productosCount[key].valor += producto.precio * producto.cantidad;
      });
    });

    const productosMasComprados = Object.entries(productosCount)
      .sort(([,a], [,b]) => b.valor - a.valor)
      .slice(0, 5)
      .map(([nombre, datos]) => ({ 
        nombre, 
        cantidad: datos.cantidad,
        valor: datos.valor
      }));

    // Horas más activas
    const horasCount: { [key: number]: number } = {};
    pedidosFiltrados.forEach(pedido => {
      const fecha = new Date(pedido.realizadoEn);
      const hora = fecha.getHours();
      horasCount[hora] = (horasCount[hora] || 0) + 1;
    });

    const horasMasActivas = Object.entries(horasCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hora, cantidad]) => ({ 
        hora: parseInt(hora), 
        cantidad,
        horaFormateada: `${hora}:00`
      }));

    // Días más activos
    const diasCount: { [key: string]: number } = {};
    pedidosFiltrados.forEach(pedido => {
      const fecha = new Date(pedido.realizadoEn);
      const dia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      diasCount[dia] = (diasCount[dia] || 0) + 1;
    });

    const diasMasActivos = Object.entries(diasCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 7)
      .map(([dia, cantidad]) => ({ dia, cantidad }));

    // Análisis de clientes recurrentes vs nuevos
    const clientesCount: { [key: string]: { pedidos: number; totalGastado: number; primerPedido: Date; ultimoPedido: Date } } = {};
    
    pedidosFiltrados.forEach(pedido => {
      const nombreCliente = pedido.cliente?.nombre || 'Cliente Anónimo';
      const fechaPedido = new Date(pedido.realizadoEn);
      
      if (!clientesCount[nombreCliente]) {
        clientesCount[nombreCliente] = {
          pedidos: 0,
          totalGastado: 0,
          primerPedido: fechaPedido,
          ultimoPedido: fechaPedido
        };
      }
      
      clientesCount[nombreCliente].pedidos += 1;
      clientesCount[nombreCliente].totalGastado += pedido.total;
      clientesCount[nombreCliente].ultimoPedido = fechaPedido;
      
      if (fechaPedido < clientesCount[nombreCliente].primerPedido) {
        clientesCount[nombreCliente].primerPedido = fechaPedido;
      }
    });

    // Clasificar clientes como nuevos o recurrentes
    const clientesNuevos = Object.entries(clientesCount)
      .filter(([, datos]) => datos.pedidos === 1)
      .map(([nombre, datos]) => ({ nombre, totalGastado: datos.totalGastado }))
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .slice(0, 5);

    const clientesRecurrentes = Object.entries(clientesCount)
      .filter(([, datos]) => datos.pedidos > 1)
      .map(([nombre, datos]) => ({ 
        nombre, 
        pedidos: datos.pedidos, 
        totalGastado: datos.totalGastado,
        promedioTicket: datos.totalGastado / datos.pedidos
      }))
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .slice(0, 5);

    // Análisis por categorías (si están disponibles)
    const categoriasCount: { [key: string]: { cantidad: number; valor: number } } = {};
    pedidosFiltrados.forEach(pedido => {
      pedido.productos.forEach(producto => {
        const categoria = producto.categoria || 'Sin Categoría';
        if (!categoriasCount[categoria]) {
          categoriasCount[categoria] = { cantidad: 0, valor: 0 };
        }
        categoriasCount[categoria].cantidad += producto.cantidad;
        categoriasCount[categoria].valor += producto.precio * producto.cantidad;
      });
    });

    const categoriasMasVendidas = Object.entries(categoriasCount)
      .sort(([,a], [,b]) => b.cantidad - a.cantidad)
      .slice(0, 5)
      .map(([categoria, datos]) => ({ 
        categoria, 
        cantidad: datos.cantidad, 
        valor: datos.valor 
      }));

    // Solo mostrar categorías si hay datos reales (no solo "Sin Categoría")
    const categoriasConDatos = categoriasMasVendidas.filter(cat => cat.categoria !== 'Sin Categoría');

    // Métodos de pago más usados
    const metodosPagoCount: { [key: string]: { pedidos: number; total: number } } = {};
    pedidosFiltrados.forEach(pedido => {
      const metodo = pedido.medioPago || 'No especificado';
      if (!metodosPagoCount[metodo]) {
        metodosPagoCount[metodo] = { pedidos: 0, total: 0 };
      }
      metodosPagoCount[metodo].pedidos += 1;
      metodosPagoCount[metodo].total += pedido.total;
    });

    const metodosPagoMasUsados = Object.entries(metodosPagoCount)
      .sort(([,a], [,b]) => b.pedidos - a.pedidos)
      .slice(0, 5)
      .map(([metodo, datos]) => ({ 
        metodo, 
        pedidos: datos.pedidos, 
        total: datos.total 
      }));

    // Debug: mostrar información de los pedidos
    console.log('Total pedidos en orders:', orders.length);
    console.log('Pedidos filtrados:', pedidosFiltrados.length);
    console.log('Período seleccionado:', selectedPeriod);
    console.log('Estados disponibles:', [...new Set(orders.map(p => p.estado))]);

    // Calcular ventas por día para la gráfica de líneas
    const ventasPorDia = (() => {
      const map: { [fecha: string]: number } = {};
      pedidosFiltrados.forEach(p => {
        const fecha = new Date(p.realizadoEn).toLocaleDateString('es-CO');
        if (!map[fecha]) map[fecha] = 0;
        map[fecha] += p.total;
      });
      // Ordenar por fecha ascendente
      return Object.entries(map)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([fecha, total]) => ({ fecha, total }));
    })();

    return {
      totalPedidos: pedidosFiltrados.length,
      totalVentas: pedidosFiltrados.reduce((sum, p) => sum + p.total, 0),
      promedioTicket: pedidosFiltrados.length > 0 ? pedidosFiltrados.reduce((sum, p) => sum + p.total, 0) / pedidosFiltrados.length : 0,
      productosMasComprados,
      horasMasActivas,
      diasMasActivos,
      clientesNuevos,
      clientesRecurrentes,
      categoriasMasVendidas,
      categoriasConDatos,
      metodosPagoMasUsados,
      totalClientesNuevos: clientesNuevos.length,
      totalClientesRecurrentes: clientesRecurrentes.length,
      ventasPorDia,
      pedidosCompletados,
      pedidosCancelados
    };
  }, [customEndDate, customStartDate, orders, selectedPeriod]);

  const historyStats = useMemo(() => getHistoryStats(), [getHistoryStats]);

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

  // Animaciones GSAP para recordar acciones pendientes
  useEffect(() => {
    if (!loading) {
      // Limpiar todas las animaciones anteriores
      gsap.killTweensOf([sinAceptarRef.current, aceptadosRef.current, procesandoRef.current]);
      
      // Resetear estilos de todas las tarjetas
      if (sinAceptarRef.current) {
        gsap.set(sinAceptarRef.current, {
          boxShadow: "",
          backgroundColor: "",
          x: 0,
          y: 0
        });
      }
      if (aceptadosRef.current) {
        gsap.set(aceptadosRef.current, {
          boxShadow: "",
          backgroundColor: "",
          x: 0,
          y: 0
        });
      }
      if (procesandoRef.current) {
        gsap.set(procesandoRef.current, {
          boxShadow: "",
          backgroundColor: "",
          x: 0,
          y: 0
        });
      }

              // Aplicar animaciones solo si hay pedidos pendientes
        if (stats.sinAceptar > 0 && sinAceptarRef.current) {
          // Animación de vibración
          gsap.to(sinAceptarRef.current, {
            x: 2,
            y: 1,
            duration: 0.1,
            ease: "none",
            yoyo: true,
            repeat: -1,
            delay: 0
          });

          // Outline neón fijo y fondo de color
          gsap.set(sinAceptarRef.current, {
            boxShadow: "0 0 25px rgba(239, 68, 68, 0.8), 0 0 50px rgba(239, 68, 68, 0.5)",
            backgroundColor: "rgba(239, 68, 68, 0.15)"
          });
        }

              if (stats.aceptados > 0 && aceptadosRef.current) {
          // Animación de vibración
          gsap.to(aceptadosRef.current, {
            x: 2,
            y: 1,
            duration: 0.1,
            ease: "none",
            yoyo: true,
            repeat: -1,
            delay: 0.5
          });

          // Outline neón fijo y fondo de color
          gsap.set(aceptadosRef.current, {
            boxShadow: "0 0 25px rgba(249, 115, 22, 0.8), 0 0 50px rgba(249, 115, 22, 0.5)",
            backgroundColor: "rgba(249, 115, 22, 0.15)"
          });
        }

              if (stats.procesando > 0 && procesandoRef.current) {
          // Animación de vibración
          gsap.to(procesandoRef.current, {
            x: 2,
            y: 1,
            duration: 0.1,
            ease: "none",
            yoyo: true,
            repeat: -1,
            delay: 1
          });

          // Outline neón fijo y fondo de color
          gsap.set(procesandoRef.current, {
            boxShadow: "0 0 25px rgba(245, 158, 11, 0.8), 0 0 50px rgba(245, 158, 11, 0.5)",
            backgroundColor: "rgba(245, 158, 11, 0.15)"
          });
        }
    }
  }, [loading, stats.sinAceptar, stats.aceptados, stats.procesando]);

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

  // Función para actualizar manualmente los datos
  const refreshData = useCallback(async () => {
    console.log('🔄 Actualización manual de datos...');
    setLoading(true);
    try {
      const res = await fetch("/api/pedidos");
      const data = await res.json();
      
      setOrders(prevOrders => {
        if (prevOrders.length > 0) {
          checkNewPendingOrders(data, prevOrders);
        }
        return data;
      });
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [checkNewPendingOrders]);



  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100">
      <main className="w-full px-4 py-6">
        {/* Header con búsqueda y filtro */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 md:mb-0">Dashboard Administrativo</h1>
            <p className="text-gray-600">Gestión completa de pedidos y análisis de ventas</p>
            <div className="flex items-center gap-2 mt-2">

              <button
                onClick={refreshData}
                disabled={loading}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>

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
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {/* <span>Última: {new Date().toLocaleTimeString('es-CO')} | Próxima: {new Date(Date.now() + 1 * 60 * 1000).toLocaleTimeString('es-CO')}</span> */}
              </div>
              
              {/* Indicador de estado de notificaciones */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  notificationService.getPageStatus().shouldShowNotifications 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    notificationService.getPageStatus().shouldShowNotifications ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>
                    {notificationService.getPageStatus().shouldShowNotifications 
                      ? 'Notificaciones activas' 
                      : 'Notificaciones pausadas'
                    }
                  </span>
                </div>
                
                <button
                  onClick={() => notificationService.testSound()}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  🔊 Probar sonido
                </button>
                
                <button
                  onClick={() => notificationService.simulateNewOrder()}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  🧪 Simular pedido
                </button>
              </div>

            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:items-center md:justify-end">
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
              className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            />
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
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowTracking(false);
                setShowSearchResults(false);
                if (searchTerm.trim()) {
                  setSearchTerm("");
                }
              }}
              className={`w-full md:w-auto px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 flex items-center justify-center gap-2 ${
                showHistory 
                  ? 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-400' 
                  : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
          <button 
            type="button" 
            onClick={() => {
              setFilterStatus('sin_aceptar');
              setShowHistory(false);
              setShowTracking(true);
              setShowSearchResults(false);
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
              setShowHistory(false);
              setShowTracking(true);
              setShowSearchResults(false);
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
              setShowHistory(false);
              setShowTracking(true);
              setShowSearchResults(false);
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
              setShowHistory(false);
              setShowTracking(true);
              setShowSearchResults(false);
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
              setShowHistory(true);
              setShowTracking(false);
              setShowSearchResults(false);
              setNewPendingAlert(false);
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
              setShowHistory(true);
              setShowTracking(false);
              setShowSearchResults(false);
              setNewPendingAlert(false);
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

        {/* Lista de pedidos en 3 columnas */}
        {showTracking && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Tracking de Pedidos
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Total: {orders.length}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    {stats.completados}
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

        {/* NUEVO DASHBOARD ANALÍTICO */}
        {showHistory && (
          <section className="w-full px-2 md:px-0 mt-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center border-t-4 border-blue-500">
                <span className="text-xs text-gray-500">Total Ventas</span>
                <span className="text-2xl font-bold text-blue-600">${historyStats.totalVentas.toLocaleString('es-CO')}</span>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center border-t-4 border-green-500">
                <span className="text-xs text-gray-500">Total Pedidos</span>
                <span className="text-2xl font-bold text-green-600">{historyStats.totalPedidos}</span>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center border-t-4 border-orange-500">
                <span className="text-xs text-gray-500">Clientes Nuevos</span>
                <span className="text-2xl font-bold text-orange-600">{historyStats.totalClientesNuevos}</span>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center border-t-4 border-purple-500">
                <span className="text-xs text-gray-500">Clientes Recurrentes</span>
                <span className="text-2xl font-bold text-purple-600">{historyStats.totalClientesRecurrentes}</span>
              </div>
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center border-t-4 border-cyan-500">
                <span className="text-xs text-gray-500">Ticket Promedio</span>
                <span className="text-2xl font-bold text-cyan-600">${historyStats.promedioTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Gráficas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {/* Días más activos - Barras */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <span className="text-sm font-semibold text-gray-700 mb-2">Pedidos por Día de la Semana</span>
                <div className="flex-1 flex items-center justify-center min-h-[180px]">
                  {historyStats.diasMasActivos && historyStats.diasMasActivos.length > 0 ? (
                    <Bar
                      data={{
                        labels: historyStats.diasMasActivos.map((d) => d.dia.charAt(0).toUpperCase() + d.dia.slice(1)),
                        datasets: [
                          {
                            label: 'Pedidos',
                            data: historyStats.diasMasActivos.map((d) => d.cantidad),
                            backgroundColor: '#06b6d4',
                            borderRadius: 8,
                            maxBarThickness: 32,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          title: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `Pedidos: ${context.parsed.y}`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: { color: '#64748b', font: { size: 13 } },
                          },
                          y: {
                            beginAtZero: true,
                            grid: { color: '#e0e7ef' },
                            ticks: { color: '#64748b', font: { size: 13 } },
                            suggestedMax: Math.max(...historyStats.diasMasActivos.map((d) => d.cantidad), 5) + 1,
                          },
                        },
                      }}
                      height={180}
                    />
                  ) : (
                    <span className="text-gray-400">No hay datos</span>
                  )}
                </div>
              </div>
              {/* Categorías más vendidas - Tabla */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <span className="text-sm font-semibold text-gray-700 mb-2">Categorías Más Vendidas</span>
                <div className="flex-1 flex items-center justify-center min-h-[180px]">
                  {historyStats.categoriasConDatos && historyStats.categoriasConDatos.length > 0 ? (
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-gray-500 font-semibold">Categoría</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-center">Unidades</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-right">Total Ventas</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-right">% del Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyStats.categoriasConDatos.map((cat, idx) => {
                          const porcentaje = (cat.valor / historyStats.totalVentas * 100).toFixed(1);
                          return (
                            <tr key={cat.categoria} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                              <td className="px-2 py-1 text-gray-700">{cat.categoria}</td>
                              <td className="px-2 py-1 font-bold text-green-600 text-center">{cat.cantidad}</td>
                              <td className="px-2 py-1 font-bold text-blue-600 text-right">
                                ${cat.valor.toLocaleString('es-CO')}
                              </td>
                              <td className="px-2 py-1 font-medium text-gray-600 text-right">
                                {porcentaje}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t border-gray-200">
                        <tr>
                          <td className="px-2 py-2 font-semibold text-gray-700">Total</td>
                          <td className="px-2 py-2 font-bold text-green-700 text-center">
                            {historyStats.categoriasConDatos.reduce((sum, cat) => sum + cat.cantidad, 0)}
                          </td>
                          <td className="px-2 py-2 font-bold text-blue-700 text-right">
                            ${historyStats.categoriasConDatos.reduce((sum, cat) => sum + cat.valor, 0).toLocaleString('es-CO')}
                          </td>
                          <td className="px-2 py-2 font-bold text-gray-700 text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <span className="text-gray-400">No hay datos</span>
                  )}
                </div>
              </div>
              {/* Top productos más vendidos */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <span className="text-sm font-semibold text-gray-700 mb-2">Top Productos Más Vendidos</span>
                <div className="flex-1 flex items-center justify-center min-h-[180px]">
                  {historyStats.productosMasComprados && historyStats.productosMasComprados.length > 0 ? (
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-gray-500 font-semibold">Producto</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-center">Cantidad</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyStats.productosMasComprados.map((prod, idx) => (
                          <tr key={prod.nombre} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="px-2 py-1 text-gray-700 truncate max-w-[120px]">{prod.nombre}</td>
                            <td className="px-2 py-1 font-bold text-green-600 text-center">{prod.cantidad}</td>
                            <td className="px-2 py-1 font-bold text-blue-600 text-right">${prod.valor.toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <span className="text-gray-400">No hay datos</span>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfica de líneas y tabla de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ventas por día - Tabla */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <span className="text-sm font-semibold text-gray-700 mb-2">Ventas por Día</span>
                <div className="flex-1 flex items-center justify-center min-h-[180px] overflow-auto max-h-[300px]">
                  {historyStats.ventasPorDia.length > 0 ? (
                    <table className="min-w-full text-sm text-left">
                      <thead className="sticky top-0 bg-white">
                        <tr>
                          <th className="px-2 py-1 text-gray-500 font-semibold">Fecha</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyStats.ventasPorDia.map((venta, idx) => (
                          <tr key={venta.fecha} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="px-2 py-1 text-gray-700">{venta.fecha}</td>
                            <td className="px-2 py-1 font-bold text-blue-600 text-right">
                              ${venta.total.toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="sticky bottom-0 bg-white border-t border-gray-200">
                        <tr>
                          <td className="px-2 py-2 font-semibold text-gray-700">Total General</td>
                          <td className="px-2 py-2 font-bold text-blue-700 text-right">
                            ${historyStats.ventasPorDia.reduce((sum, venta) => sum + venta.total, 0).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <span className="text-gray-400">No hay datos</span>
                  )}
                </div>
              </div>
              {/* Top productos más vendidos */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col">
                <span className="text-sm font-semibold text-gray-700 mb-2">Top Productos Más Vendidos</span>
                <div className="flex-1 flex items-center justify-center min-h-[180px]">
                  {historyStats.productosMasComprados && historyStats.productosMasComprados.length > 0 ? (
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-gray-500 font-semibold">Producto</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-center">Cantidad</th>
                          <th className="px-2 py-1 text-gray-500 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyStats.productosMasComprados.map((prod, idx) => (
                          <tr key={prod.nombre} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="px-2 py-1 text-gray-700 truncate max-w-[120px]">{prod.nombre}</td>
                            <td className="px-2 py-1 font-bold text-green-600 text-center">{prod.cantidad}</td>
                            <td className="px-2 py-1 font-bold text-blue-600 text-right">${prod.valor.toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <span className="text-gray-400">No hay datos</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Órdenes Completadas y Canceladas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Órdenes Completadas */}
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
        )}
      </main>
    </div>
  );
}