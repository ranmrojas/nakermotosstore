'use client';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useClientSession } from '@/hooks/useClientSession';
import { useClientesApi } from '@/hooks/useClientesApi';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import OrderManager from '../carrito/OrderManagerclient';
import { DireccionGuardada } from '@/types/direcciones';
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

export default function PerfilCliente() {
  const { session, saveSession } = useClientSession();
  const { obtenerDireccionesGuardadas, eliminarDireccionGuardada, getClienteByTelefono, createCliente } = useClientesApi();
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();
  
  // Estados faltantes
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [direcciones, setDirecciones] = useState<{ direcciones: DireccionGuardada[] } | null>(null);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [showAddDireccionInput, setShowAddDireccionInput] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [direccionModal, setDireccionModal] = useState('');
  const [shippingCostModal, setShippingCostModal] = useState(0);
  const [selectedAddressModal, setSelectedAddressModal] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'en_curso' | 'historial'>('en_curso');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNombre, setEditNombre] = useState(session?.nombre || '');
  const [editTelefono, setEditTelefono] = useState(session?.telefono || '');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Ref para el input de dirección
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const STORE_LOCATION = useMemo(() => ({ lat: 4.126551, lon: -73.632540 }), []);
  const SHIPPING_ZONES = useMemo(() => [
    { min: 0, max: 0.5, cost: 4500 },
    { min: 0.5, max: 0.750, cost: 5000 },
    { min: 0.750, max: 1.2, cost: 6000 },
    { min: 1.2, max: 1.8, cost: 7000 },
    { min: 1.8, max: 2.4, cost: 9000 },
    { min: 2.4, max: 3, cost: 10000 },
    { min: 3, max: 4, cost: 11000 },
    { min: 4, max: 6, cost: 12000 },
    { min: 7, max: 8, cost: 14000 },
    { min: 8, max: Infinity, cost: 15000 }
  ], []);
  
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);
  
  const calculateShippingCost = useCallback((distance: number): number => {
    const zone = SHIPPING_ZONES.find(z => distance >= z.min && distance <= z.max);
    if (zone) return zone.cost;
    if (distance > 8) return SHIPPING_ZONES[SHIPPING_ZONES.length - 1].cost;
    return SHIPPING_ZONES[0].cost;
  }, [SHIPPING_ZONES]);

  // Validar número de celular colombiano
  const validarTelefono = (num: string) => /^3\d{9}$/.test(num);

  useEffect(() => {
    if (!session) {
      setShowPhoneModal(true);
      return;
    }
    
    const fetchPedidos = async () => {
      setLoadingPedidos(true);
      try {
        const res = await fetch(`/api/pedidos?clienteId=${session.id}`);
        if (!res.ok) throw new Error('Error al obtener pedidos');
        const data = await res.json();
        setPedidos(data);
      } catch {
        setPedidos([]);
      } finally {
        setLoadingPedidos(false);
      }
    };

    const fetchDirecciones = async () => {
      setLoadingDirecciones(true);
      try {
        const data = await obtenerDireccionesGuardadas(session.id);
        setDirecciones(data);
      } catch {
        console.error('Error al cargar direcciones');
      } finally {
        setLoadingDirecciones(false);
      }
    };

    fetchPedidos();
    fetchDirecciones();
  }, [session, obtenerDireccionesGuardadas]);

  useEffect(() => {
    if (!session) setShowPhoneModal(true);
  }, [session]);

  useEffect(() => {
    if (showModalAgregar && showAddDireccionInput && isLoaded && addressInputRef.current) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'co' },
        fields: ['formatted_address', 'geometry', 'place_id', 'name'],
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(4.0, -73.7),
          new window.google.maps.LatLng(4.3, -73.5)
        ),
        strictBounds: true
      });
      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry && place.geometry.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address
          };
          setDireccionModal(place.formatted_address || '');
          setSelectedAddressModal({ lat: location.lat, lng: location.lng });
          const distance = calculateDistance(
            STORE_LOCATION.lat,
            STORE_LOCATION.lon,
            location.lat,
            location.lng
          );
          const cost = calculateShippingCost(distance);
          setShippingCostModal(cost);
        }
      });
    }
  }, [showModalAgregar, showAddDireccionInput, isLoaded, STORE_LOCATION, calculateDistance, calculateShippingCost]);

  const handleGuardarDireccionModal = async () => {
    if (!session?.id || !direccionModal.trim() || shippingCostModal <= 0) return;
    setLoadingDirecciones(true);
    try {
      // Normalizar la dirección nueva
      const nuevaDireccionNormalizada = direccionModal.trim().toLowerCase();
      // Verificar si la dirección principal actual ya está guardada
      const direccionesActuales = direcciones?.direcciones || [];
      const direccionPrincipalActual = session.direccion;
      const principalYaGuardada = direccionesActuales.some(
        (dir: DireccionGuardada) => dir.direccion.trim().toLowerCase() === direccionPrincipalActual.trim().toLowerCase()
      );
      // Si la dirección principal actual es diferente a la nueva y no está guardada, agregarla
      const nuevasDirecciones = [...direccionesActuales];
      if (
        direccionPrincipalActual &&
        direccionPrincipalActual.trim().toLowerCase() !== nuevaDireccionNormalizada &&
        !principalYaGuardada
      ) {
        nuevasDirecciones.push({
          id: Date.now().toString(),
          direccion: direccionPrincipalActual,
          valordomicilio: session.valordomicilio || 0,
          lat: undefined,
          lng: undefined,
          nombre: 'Dirección anterior',
          esPrincipal: false,
          fechaCreacion: new Date().toISOString()
        });
      }
      // Agregar la nueva dirección como principal
      const nuevaDireccion = {
        id: Date.now().toString(),
        direccion: direccionModal.trim(),
        valordomicilio: shippingCostModal,
        lat: selectedAddressModal?.lat,
        lng: selectedAddressModal?.lng,
        nombre: 'Dirección guardada',
        esPrincipal: true,
        fechaCreacion: new Date().toISOString()
      };
      // Actualizar cliente
      const response = await fetch(`/api/clientes/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion: direccionModal.trim(),
          valordomicilio: shippingCostModal,
          direccionesGuardadas: {
            direcciones: nuevasDirecciones,
            direccionPrincipal: nuevaDireccion.id
          }
        }),
      });
      if (response.ok) {
        const clienteActualizado = await response.json();
        setShowModalAgregar(false);
        setShowAddDireccionInput(false);
        setDireccionModal('');
        setShippingCostModal(0);
        setSelectedAddressModal(null);
        // Recargar direcciones
        const data = await obtenerDireccionesGuardadas(session.id);
        setDirecciones(data);
        // Actualizar sesión
        saveSession({
          id: clienteActualizado.id,
          telefono: clienteActualizado.telefono,
          nombre: clienteActualizado.nombre,
          direccion: clienteActualizado.direccion,
          valordomicilio: clienteActualizado.valordomicilio,
          direccionesGuardadas: clienteActualizado.direccionesGuardadas
        });
      }
    } catch {
      setTelefonoError('Error al procesar el teléfono. Intente nuevamente.');
    } finally {
      setLoadingDirecciones(false);
    }
  };

  const eliminarDireccion = async (direccionId: string) => {
    if (!session?.id) return;

    setLoadingDirecciones(true);
    try {
      const success = await eliminarDireccionGuardada(session.id, direccionId);
      if (success) {
        const data = await obtenerDireccionesGuardadas(session.id);
        setDirecciones(data);
      }
    } catch {
      console.error('Error al eliminar dirección:');
    } finally {
      setLoadingDirecciones(false);
    }
  };

  const establecerComoPrincipal = async (direccionId: string) => {
    if (!session?.id || !direcciones) return;

    setLoadingDirecciones(true);
    try {
      // Encontrar la dirección que se va a establecer como principal
      const direccionSeleccionada = direcciones.direcciones.find((dir: DireccionGuardada) => dir.id === direccionId);
      if (!direccionSeleccionada) return;

      // Verificar si la dirección actual principal ya existe en direccionesGuardadas
      const direccionActualExiste = direcciones.direcciones.some(
        (dir: DireccionGuardada) => dir.direccion === session.direccion
      );

      // Preparar las direcciones actualizadas
      let direccionesActualizadas = direcciones.direcciones.map((dir: DireccionGuardada) => ({
        ...dir,
        esPrincipal: dir.id === direccionId
      }));

      // Si la dirección actual principal no está guardada, agregarla (evitar duplicados)
      if (
        !direccionActualExiste &&
        session.direccion &&
        session.direccion !== direccionSeleccionada.direccion &&
        !direcciones.direcciones.some(
          (dir: DireccionGuardada) =>
            dir.direccion === session.direccion &&
            dir.valordomicilio === session.valordomicilio
        )
      ) {
        const nuevaDireccionGuardada = {
          id: Date.now().toString(),
          direccion: session.direccion,
          valordomicilio: session.valordomicilio || 0,
          lat: undefined,
          lng: undefined,
          nombre: 'Dirección anterior',
          esPrincipal: false,
          fechaCreacion: new Date().toISOString()
        };
        
        direccionesActualizadas = [...direccionesActualizadas, nuevaDireccionGuardada];
      }

      // Actualizar el cliente con la nueva dirección principal y las direcciones guardadas
      const response = await fetch(`/api/clientes/${session.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direccion: direccionSeleccionada.direccion,
          valordomicilio: direccionSeleccionada.valordomicilio,
          direccionesGuardadas: {
            direcciones: direccionesActualizadas,
            direccionPrincipal: direccionId
          }
        }),
      });

      if (response.ok) {
        const clienteActualizado = await response.json();
        
        // Actualizar la sesión en localStorage con los nuevos datos
        saveSession({
          id: clienteActualizado.id,
          telefono: clienteActualizado.telefono,
          nombre: clienteActualizado.nombre,
          direccion: clienteActualizado.direccion,
          valordomicilio: clienteActualizado.valordomicilio,
          direccionesGuardadas: clienteActualizado.direccionesGuardadas
        });
        
        // Recargar direcciones
        const data = await obtenerDireccionesGuardadas(session.id);
        setDirecciones(data);
      }
    } catch {
      console.error('Error al establecer dirección como principal:');
    } finally {
      setLoadingDirecciones(false);
    }
  };

  useEffect(() => {
    if (!session?.id) return;
    setLoadingPedidos(true);
    fetch(`/api/pedidos?clienteId=${session.id}`)
      .then(res => res.json())
      .then(data => setPedidos(data))
      .catch(() => setPedidos([]))
      .finally(() => setLoadingPedidos(false));
  }, [session?.id]);

  // Suscripción en tiempo real a cambios en la tabla Pedido (igual que tracking)
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

  // Filtrar pedidos según la pestaña activa
  const pedidosEnCurso = pedidosAdaptados.filter(pedido => {
    const estado = pedido.estado.toLowerCase();
    return !['completado', 'completed', 'finalizado', 'cancelado', 'canceled'].includes(estado);
  });
  
  const pedidosHistorial = pedidosAdaptados.filter(pedido => {
    const estado = pedido.estado.toLowerCase();
    return ['completado', 'completed', 'finalizado', 'cancelado', 'canceled'].includes(estado);
  });

  const handleShowAddDireccionInput = async () => {
    setShowAddDireccionInput(true);
    if (!isLoaded && !isLoading) {
      await loadGoogleMaps();
    }
  };

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
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100 flex items-center justify-center py-0">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6 mx-auto overflow-y-auto min-h-[90vh] flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Mi cuenta</h2>
          {/* Modal para ingresar número de celular (idéntico al del carrito) */}
          {showPhoneModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ingrese su número de celular</h3>
                <input
                  type="tel"
                  className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
                  value={telefono}
                  onChange={e => {
                    setTelefono(e.target.value);
                    if (telefonoError) setTelefonoError('');
                  }}
                  placeholder="Ej: 3001234567"
                  maxLength={10}
                />
                {telefonoError && <div className="text-red-500 text-xs mb-2">{telefonoError}</div>}
                <button
                  className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition-colors"
                  onClick={async () => {
                    if (!validarTelefono(telefono)) {
                      setTelefonoError('Ingrese un número de celular colombiano válido');
                      return;
                    }
                    try {
                      // Buscar si el cliente ya existe
                      const clienteExistente = await getClienteByTelefono(telefono);
                      if (clienteExistente) {
                        saveSession({
                          id: clienteExistente.id,
                          telefono: clienteExistente.telefono,
                          nombre: clienteExistente.nombre,
                          direccion: clienteExistente.direccion,
                          valordomicilio: clienteExistente.valordomicilio,
                          direccionesGuardadas: clienteExistente.direccionesGuardadas
                        });
                        setShowPhoneModal(false);
                      } else {
                        // Cliente no existe, crear uno nuevo
                        const nuevoCliente = await createCliente({
                          telefono,
                          nombre: '',
                          direccion: '',
                          valordomicilio: 0
                        });
                        if (nuevoCliente) {
                          saveSession({
                            id: nuevoCliente.id,
                            telefono,
                            nombre: nuevoCliente.nombre,
                            direccion: nuevoCliente.direccion,
                            valordomicilio: nuevoCliente.valordomicilio,
                            direccionesGuardadas: nuevoCliente.direccionesGuardadas
                          });
                          setShowPhoneModal(false);
                        } else {
                          setTelefonoError('Error al crear el cliente. Intente nuevamente.');
                        }
                      }
                    } catch {
                      setTelefonoError('Error al procesar el teléfono. Intente nuevamente.');
                    }
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100 flex items-center justify-center py-0">
      <main className="w-full max-w-md mx-auto flex flex-col gap-4 px-0 pt-2 pb-8">
        {/* Sección de pedidos realizados */}
        <section className="bg-white rounded-2xl shadow-sm p-3 flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-gray-800 my-0">Mis Pedidos</h3>
          
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

        {/* Datos del usuario */}
        <section className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-2 relative">
          {/* Ícono editar */}
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 transition-colors"
            title="Editar datos"
            onClick={() => {
              setEditNombre(session.nombre);
              setEditTelefono(session.telefono);
              setEditError('');
              setShowEditModal(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.788l-4 1 1-4 13.362-13.3z" />
            </svg>
          </button>
          <div className="text-base text-gray-500">Nombre</div>
          <div className="text-lg font-semibold text-gray-900 mb-2">{session.nombre}</div>
          <div className="text-base text-gray-500">Teléfono</div>
          <div className="text-lg font-semibold text-gray-900 mb-2">{session.telefono}</div>
          <div className="text-base text-gray-500">Dirección principal</div>
          <div className="text-base font-medium text-gray-800 mb-2">{session.direccion}</div>
          <button
            onClick={() => setShowModalAgregar(true)}
            className="w-full mt-2 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition border border-blue-200"
          >
            Ver direcciones guardadas
          </button>
          <div className="text-base text-gray-500">Valor domicilio</div>
          <div className="text-base font-medium text-gray-800 mb-2">${session.valordomicilio.toLocaleString('es-CO')}</div>
          <button
            onClick={() => {
              // Eliminar la sesión del cliente
              localStorage.removeItem('clienteSession');
              localStorage.removeItem('client_session');
              window.location.reload();
            }}
            className="w-full mt-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition border border-red-200"
          >
            Cerrar sesión
          </button>
        </section>

        {/* Modal para agregar dirección */}
        {showModalAgregar && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Direcciones guardadas</h3>
              {/* Lista de direcciones guardadas */}
              <div className="flex flex-col gap-3 mb-4">
                {Array.from(
                  new Map(
                    direcciones?.direcciones
                      ?.filter((direccion: DireccionGuardada) => direccion.direccion !== session.direccion)
                      .map((dir: DireccionGuardada) => [dir.direccion.trim().toLowerCase(), dir]) || []
                  ).values()
                ).map((direccion: DireccionGuardada) => (
                  <div
                    key={direccion.id}
                    className="p-4 border border-gray-100 rounded-xl relative bg-gray-50 flex flex-col gap-1"
                  >
                    <button
                      onClick={() => eliminarDireccion(direccion.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-base"
                      title="Eliminar dirección"
                    >
                      ×
                    </button>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {direccion.nombre}
                      {direccion.esPrincipal && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">Principal</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      {direccion.direccion}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Domicilio: ${direccion.valordomicilio.toLocaleString('es-CO')}
                    </div>
                    {!direccion.esPrincipal && (
                      <button
                        onClick={() => establecerComoPrincipal(direccion.id)}
                        disabled={loadingDirecciones}
                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                        title="Establecer como dirección principal"
                      >
                        {loadingDirecciones ? 'Guardando...' : 'Establecer como principal'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* Botón para mostrar el input de agregar dirección */}
              {!showAddDireccionInput ? (
                <button
                  onClick={handleShowAddDireccionInput}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base shadow hover:bg-blue-700 transition mb-2"
                >
                  Agregar nueva dirección
                </button>
              ) : (
                <>
                  <h4 className="text-base font-semibold mb-2 text-gray-800">Agregar nueva dirección</h4>
                  <input
                    ref={addressInputRef}
                    type="text"
                    className="w-full mb-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-base focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-gray-700"
                    value={direccionModal}
                    onChange={e => setDireccionModal(e.target.value)}
                    placeholder="Escribe tu dirección en Villavicencio..."
                  />
                  <div className="text-xs text-gray-500 mb-2">
                    {shippingCostModal > 0 ? `Valor domicilio estimado: $${shippingCostModal.toLocaleString('es-CO')}` : 'Selecciona una dirección para calcular el envío'}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { setShowAddDireccionInput(false); setDireccionModal(''); setShippingCostModal(0); setSelectedAddressModal(null); }}
                      className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarDireccionModal}
                      disabled={!direccionModal.trim() || shippingCostModal <= 0 || loadingDirecciones}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-base shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingDirecciones ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </>
              )}
              <button
                onClick={() => { setShowModalAgregar(false); setShowAddDireccionInput(false); setDireccionModal(''); setShippingCostModal(0); setSelectedAddressModal(null); }}
                className="w-full mt-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal editar datos */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Editar datos</h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
              <input
                type="text"
                className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100"
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                placeholder="Nombre completo"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Teléfono</label>
              <input
                type="tel"
                className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100"
                value={editTelefono}
                onChange={e => setEditTelefono(e.target.value)}
                placeholder="Ej: 3001234567"
                maxLength={10}
              />
              {editError && <div className="text-red-500 text-xs mb-2">{editError}</div>}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-100 font-semibold text-base hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                  disabled={editLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setEditError('');
                    if (!editNombre.trim()) {
                      setEditError('El nombre no puede estar vacío');
                      return;
                    }
                    if (!/^3\d{9}$/.test(editTelefono)) {
                      setEditError('Ingrese un número de celular colombiano válido');
                      return;
                    }
                    setEditLoading(true);
                    try {
                      const response = await fetch(`/api/clientes/${session.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: editNombre.trim(), telefono: editTelefono.trim() })
                      });
                      if (response.ok) {
                        const clienteActualizado = await response.json();
                        saveSession({
                          ...session,
                          nombre: clienteActualizado.nombre,
                          telefono: clienteActualizado.telefono
                        });
                        setShowEditModal(false);
                      } else {
                        setEditError('Error al guardar los cambios');
                      }
                    } catch {
                      setEditError('Error al guardar los cambios');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editLoading}
                >
                  {editLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
