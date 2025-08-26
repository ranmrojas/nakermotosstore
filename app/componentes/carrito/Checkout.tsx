'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '../../../hooks/useCart';
import { analyticsEvents } from '../../../hooks/useAnalytics';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';
import { useClientSession } from '@/hooks/useClientSession';
import { useClientesApi } from '@/hooks/useClientesApi';
import { DireccionGuardada } from '@/types/direcciones';
import { useRouter } from 'next/navigation';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Checkout({ isOpen, onClose }: CheckoutProps) {
  const router = useRouter();
  const { cart, clearCart, totalPrice, medioPago } = useCart();
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();
  const { session, saveSession } = useClientSession();
  const { createOrUpdateCliente } = useClientesApi();
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [nombreError, setNombreError] = useState('');
  const [direccionError, setDireccionError] = useState('');
  // Estado para la nota del pedido
  const [nota, setNota] = useState('');
  // Estados para el manejo del pedido
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  
  // Nuevo estado para modo edición
  const [editando, setEditando] = useState(false);
  
  // Estados para el dropdown de direcciones guardadas
  const [showDireccionesDropdown, setShowDireccionesDropdown] = useState(false);
  const [direccionesGuardadas, setDireccionesGuardadas] = useState<DireccionGuardada[]>([]);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);

  // Variables para la gestión de direcciones y ubicación
  const [selectedAddress, setSelectedAddress] = useState<{
    display_name: string;
    lat: string;
    lon: string;
  } | null>(null);

  // Coordenadas de la tienda en Villavicencio
  const STORE_LOCATION = {
  lat: 4.135742171365671,
  lon: -73.61871169545259
};

  // Rangos de distancia y costos de envío - memoizado para evitar recreaciones
  const SHIPPING_ZONES = useCallback(() => [
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

  // Calcular distancia usando la fórmula de Haversine - memoizada para evitar recreaciones
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

  // Calcular costo de envío basado en la distancia - memoizado para evitar recreaciones
  const calculateShippingCost = useCallback((distance: number): number => {
    const zones = SHIPPING_ZONES();
    const zone = zones.find(z => distance >= z.min && distance <= z.max);
    
    if (zone) {
      return zone.cost;
    }
    
    if (distance > 8) {
      return zones[zones.length - 1].cost;
    }
    
    return zones[0].cost;
  }, [SHIPPING_ZONES]);

  // Inicializar autocompletado de direcciones
  const initializeAutocomplete = useCallback(() => {
    if (!window.google || !addressInputRef.current) return;

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: 'co' },
      fields: ['formatted_address', 'geometry', 'place_id', 'name'],
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(4.0, -73.7), // Suroeste de Villavicencio
        new window.google.maps.LatLng(4.3, -73.5)  // Noreste de Villavicencio
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
        
        setDireccion(place.formatted_address);
        setSelectedAddress({
          display_name: place.formatted_address,
          lat: location.lat.toString(),
          lon: location.lng.toString()
        });
        
        // Calcular envío
        const distance = calculateDistance(
          STORE_LOCATION.lat,
          STORE_LOCATION.lon,
          location.lat,
          location.lng
        );
        const cost = calculateShippingCost(distance);
        setShippingCost(cost);
        
        analyticsEvents.addressSelected(place.formatted_address, distance, cost);
      }
    });
  }, [calculateDistance, calculateShippingCost, STORE_LOCATION.lat, STORE_LOCATION.lon]);

  // Determinar si hay datos guardados (nombre y dirección no vacíos) - mover antes de los useEffect
  const datosGuardados = Boolean(session?.nombre && session?.direccion);

  // Cargar Google Maps API
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGoogleMaps().then(() => {
        if (isOpen && !datosGuardados) {
          initializeAutocomplete();
        }
      }).catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
    } else if (isLoaded && isOpen && !datosGuardados) {
      initializeAutocomplete();
    }
  }, [isLoaded, isLoading, loadGoogleMaps, isOpen, initializeAutocomplete, datosGuardados]);

  // Agregar un useEffect para inicializar el autocompletado cuando se cambie a modo editable
  useEffect(() => {
    if (isLoaded && editando && addressInputRef.current) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        initializeAutocomplete();
      }, 100);
    }
  }, [editando, isLoaded, initializeAutocomplete]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.direcciones-dropdown')) {
        setShowDireccionesDropdown(false);
      }
    };

    if (showDireccionesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDireccionesDropdown]);

  // Manejar cambios en el input de dirección
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDireccion(e.target.value);
    setSelectedAddress(null);
  };

  // Función para seleccionar una dirección guardada
  const handleSelectDireccionGuardada = (direccionGuardada: DireccionGuardada) => {
    setDireccion(direccionGuardada.direccion);
    setShippingCost(direccionGuardada.valordomicilio || 0);
    setShowDireccionesDropdown(false);
    if (direccionGuardada.lat && direccionGuardada.lng) {
      const distance = calculateDistance(
        STORE_LOCATION.lat,
        STORE_LOCATION.lon,
        direccionGuardada.lat,
        direccionGuardada.lng
      );
      const cost = calculateShippingCost(distance);
      setShippingCost(cost);
    }
  };

  // Función para guardar dirección actual antes de editar
  const handleSaveCurrentAddressAndEdit = async () => {
    console.log('Iniciando guardado de dirección...', { session, direccion, shippingCost });
    
    if (session && direccion.trim() && shippingCost > 0) {
      try {
        // Obtener las direcciones guardadas actuales
        const direccionesActuales = session.direccionesGuardadas?.direcciones || [];
        console.log('Direcciones actuales:', direccionesActuales);
        
        // Verificar si la dirección actual ya existe en las guardadas
        const direccionYaExiste = direccionesActuales.some(
          (dir: DireccionGuardada) => dir.direccion === direccion.trim()
        );
        console.log('¿Dirección ya existe?', direccionYaExiste);
        
        // Solo guardar si no existe ya
        if (!direccionYaExiste) {
          const nuevaDireccionGuardada = {
            id: Date.now().toString(),
            direccion: direccion.trim(),
            valordomicilio: shippingCost,
            lat: selectedAddress?.lat ? parseFloat(selectedAddress.lat) : undefined,
            lng: selectedAddress?.lon ? parseFloat(selectedAddress.lon) : undefined,
            nombre: 'Dirección guardada',
            esPrincipal: false,
            fechaCreacion: new Date().toISOString()
          };
          
          console.log('Nueva dirección a guardar:', nuevaDireccionGuardada);
          
          // Actualizar cliente con la nueva dirección guardada
          const clienteData: {
            telefono: string;
            nombre: string;
            direccion: string;
            valordomicilio: number;
            direccionesGuardadas?: {
              direcciones: DireccionGuardada[];
              direccionPrincipal: string;
            };
          } = {
            telefono: session.telefono,
            nombre: session.nombre,
            direccion: session.direccion,
            valordomicilio: session.valordomicilio,
          };
          
          console.log('Datos del cliente a actualizar:', clienteData);
          
          const clienteActualizado = await createOrUpdateCliente(clienteData);
          console.log('Cliente actualizado:', clienteActualizado);
          
          if (clienteActualizado) {
            // Actualizar la sesión
            saveSession({
              id: clienteActualizado.id,
              telefono: clienteActualizado.telefono,
              nombre: clienteActualizado.nombre,
              direccion: clienteActualizado.direccion,
              valordomicilio: clienteActualizado.valordomicilio,
              direccionesGuardadas: clienteActualizado.direccionesGuardadas
            });
            console.log('Sesión actualizada con nuevas direcciones guardadas');
          }
        } else {
          console.log('La dirección ya existe, no se guarda');
        }
      } catch (error) {
        console.error('Error al guardar dirección:', error);
        // Continuar con la edición aunque falle el guardado
      }
    } else {
      console.log('No se cumplen las condiciones para guardar:', { 
        tieneSession: !!session, 
        direccionValida: !!direccion.trim(), 
        shippingCostValido: shippingCost > 0 
      });
    }
    
    // Cambiar a modo editable
    setEditando(true);
  };

  // Función para obtener direcciones guardadas del cliente
  const obtenerDireccionesGuardadas = useCallback(async () => {
    if (!session?.id) return;
    setLoadingDirecciones(true);
    try {
      const response = await fetch(`/api/clientes/${session.id}`);
      if (response.ok) {
        const cliente = await response.json();
        const direcciones: DireccionGuardada[] = cliente.direccionesGuardadas?.direcciones || [];
        setDireccionesGuardadas(direcciones);
        console.log('Direcciones guardadas obtenidas:', direcciones);
      }
    } catch (error) {
      console.error('Error al obtener direcciones guardadas:', error);
    } finally {
      setLoadingDirecciones(false);
    }
  }, [session?.id]);

  // Verificar si hay direcciones guardadas disponibles
  const direccionesGuardadasDisponibles = direccionesGuardadas.filter(
    (dir) => dir.direccion !== direccion
  );
  
  // Debug: Log de direcciones guardadas
  console.log('Direcciones guardadas del estado:', direccionesGuardadas);
  console.log('Direcciones guardadas disponibles:', direccionesGuardadasDisponibles);
  console.log('Dirección actual:', direccion);

  // Sincronizar nombre y dirección con la sesión si existen
  useEffect(() => {
    if (session) {
      if (session.nombre) setNombre(session.nombre);
      if (session.direccion) setDireccion(session.direccion);
      if (session.valordomicilio && session.valordomicilio > 0) {
        setShippingCost(session.valordomicilio);
      }
    }
  }, [session, isOpen]);

  // Cargar direcciones guardadas cuando se abre el modal
  useEffect(() => {
    if (isOpen && session?.id) {
      obtenerDireccionesGuardadas();
    }
  }, [isOpen, session?.id, obtenerDireccionesGuardadas]);

  // Función para manejar el cierre del checkout
  const handleClose = () => {
    onClose();
    // Limpiar estados
    setNombre('');
    setDireccion('');
    setShippingCost(0);
    setSelectedAddress(null);
    setNombreError('');
    setDireccionError('');
    setError('');
  };

  // Función para confirmar pedido
  const handleConfirmOrder = async () => {
    let hasError = false;
    if (!nombre.trim()) {
      setNombreError('Este campo es obligatorio');
      hasError = true;
    } else {
      setNombreError('');
    }
    if (!direccion.trim()) {
      setDireccionError('Este campo es obligatorio');
      hasError = true;
    } else {
      setDireccionError('');
    }
    if (hasError) return;
    setError('');
    
    // Inhabilitar el botón y mostrar estado de carga
    setIsSubmitting(true);
    
    // Actualizar cliente en la base de datos y sesión
    if (session) {
      try {
        // Preparar los datos del cliente
        const clienteData: {
          telefono: string;
          nombre: string;
          direccion: string;
          valordomicilio: number;
          direccionesGuardadas?: {
            direcciones: DireccionGuardada[];
            direccionPrincipal: string;
          };
        } = {
          telefono: session.telefono,
          nombre: nombre.trim(),
          direccion: direccion.trim(),
          valordomicilio: shippingCost,
        };

        // Si el cliente ya tiene una dirección principal, moverla a direccionesGuardadas
        if (session.direccion && session.direccion !== direccion.trim()) {
          // Obtener las direcciones guardadas actuales
          const direccionesActuales = session.direccionesGuardadas?.direcciones || [];
          
          // Agregar la dirección actual como guardada
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
          
          clienteData.direccionesGuardadas = {
            direcciones: [...direccionesActuales, nuevaDireccionGuardada],
            direccionPrincipal: nuevaDireccionGuardada.id
          };
        }

        const clienteActualizado = await createOrUpdateCliente(clienteData);
        
        if (clienteActualizado) {
          saveSession({
            id: clienteActualizado.id,
            telefono: clienteActualizado.telefono,
            nombre: clienteActualizado.nombre,
            direccion: clienteActualizado.direccion,
            valordomicilio: clienteActualizado.valordomicilio,
            direccionesGuardadas: clienteActualizado.direccionesGuardadas
          });
        }
      } catch (error) {
        console.error('Error al actualizar cliente:', error);
      }
    }
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Pendiente',
          productos: cart,
          subtotal: totalPrice,
          domicilio: shippingCost,
          total: totalPrice + shippingCost,
          clienteId: session?.id,
          medioPago: medioPago,
          nota: nota?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        setError('No se pudo registrar el pedido. Intenta de nuevo.');
        return;
      }

      await response.json(); // Solo para consumir la respuesta
      clearCart();
      
      // Mostrar modal de éxito
      setShowOrderSuccess(true);

    } catch {
      setError('Ocurrió un error al registrar el pedido.');
      setIsSubmitting(false);
    }
  };

  // Justo después de los otros estados y hooks:
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen && !showOrderSuccess) return null;

  return (
    <>
      {/* Modal principal de checkout */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-100/70 via-white/80 to-amber-100/70">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Completa tu pedido</h3>
            
            {/* Input para nombre */}
            {datosGuardados && !editando ? (
              <div className="flex items-center mb-3">
                <span className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900">{nombre}</span>
                <button
                  type="button"
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => setEditando(true)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            ) : (
              <input
                type="text"
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={nombre}
                onChange={e => {
                  setNombre(e.target.value);
                  if (e.target.value.trim()) setNombreError('');
                }}
                placeholder="Nombre"
                readOnly={datosGuardados && !editando}
              />
            )}
            {nombreError && <div className="text-red-500 text-xs mb-2">{nombreError}</div>}
            
            {/* Input para dirección */}
            {datosGuardados && !editando ? (
              <div className="relative w-full mb-1 flex items-start">
                <span className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900 max-h-12 overflow-hidden text-sm leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{direccion}</span>
                <button
                  type="button"
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 mt-1"
                  onClick={handleSaveCurrentAddressAndEdit}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative w-full mb-1">
                <input
                  ref={addressInputRef}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10"
                  value={direccion}
                  onChange={e => {
                    handleAddressChange(e);
                    if (e.target.value.trim()) setDireccionError('');
                  }}
                  placeholder="Escribe tu dirección en Villavicencio..."
                  readOnly={datosGuardados && !editando}
                />
                {direccion && editando && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg focus:outline-none"
                    style={{ zIndex: 2 }}
                    onClick={() => setDireccion('')}
                    tabIndex={-1}
                    aria-label="Limpiar dirección"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            {direccionError && <div className="text-red-500 text-xs mb-2">{direccionError}</div>}
            
            {/* Tag de ciudad/departamento y dropdown de direcciones guardadas */}
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-300">
                Villavicencio
              </span>
              
              {/* Botón para mostrar direcciones guardadas */}
              <div className="relative direcciones-dropdown">
                  <button
                    type="button"
                    onClick={async () => {
                      console.log('Clic en botón Otra dirección');
                      console.log('Estado actual del dropdown:', showDireccionesDropdown);
                      
                      // Recargar direcciones guardadas antes de abrir el dropdown
                      await obtenerDireccionesGuardadas();
                      
                      console.log('Direcciones disponibles después de recargar:', direccionesGuardadasDisponibles);
                      setShowDireccionesDropdown(!showDireccionesDropdown);
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Otra dirección
                  </button>
                  
                  {/* Dropdown de direcciones guardadas */}
                  {showDireccionesDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-700 mb-2 px-2">
                          Direcciones guardadas:
                        </div>
                        {loadingDirecciones ? (
                          <div className="text-xs text-gray-500 px-2 py-2">
                            Cargando direcciones...
                          </div>
                        ) : direccionesGuardadasDisponibles.length > 0 ? (
                          direccionesGuardadasDisponibles.map((direccionGuardada: DireccionGuardada) => (
                          <button
                            key={direccionGuardada.id}
                            type="button"
                            onClick={() => handleSelectDireccionGuardada(direccionGuardada)}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs text-gray-700 transition-colors"
                          >
                            <div className="font-medium truncate">
                              {direccionGuardada.nombre || 'Dirección guardada'}
                            </div>
                            <div className="text-gray-500 truncate">
                              {direccionGuardada.direccion}
                            </div>
                            <div className="text-amber-600 font-medium">
                              Costo domicilio: ${direccionGuardada.valordomicilio?.toLocaleString('es-CO') || 'Por calcular'}
                            </div>
                          </button>
                        ))
                        ) : (
                          <div className="text-xs text-gray-500 px-2 py-2">
                            No hay direcciones guardadas
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
            </div>
            
            {/* Resumen clásico debajo del campo de dirección */}
            <div className="flex items-center justify-between gap-2 mb-3 mt-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs text-gray-600">
                  Total productos: <span className="font-bold text-gray-900">{`$${totalPrice.toLocaleString('es-CO')}`}</span>
                </span>
                <span className="text-xs text-gray-600">
                  Valor domicilio: <span className="font-bold text-gray-900">{shippingCost > 0 ? `$${shippingCost.toLocaleString('es-CO')}` : 'Por calcular'}</span>
                </span>
              </div>
            </div>
            
            {/* Total a pagar destacado */}
            <div className="mb-3">
              <span className="text-lg font-bold text-gray-900">
                Total a pagar: {shippingCost > 0 ? `$${(totalPrice + shippingCost).toLocaleString('es-CO')}` : `$${totalPrice.toLocaleString('es-CO')}`}
              </span>
            </div>
            {/* Campo de nota para el pedido */}
            <div className="mb-3">
              <label htmlFor="nota" className="block text-xs font-medium text-gray-700 mb-1">
                Nota para el pedido (opcional)
              </label>
              <input
                id="nota"
                type="text"
                className="w-full border-b border-gray-300 px-0 py-2 text-sm focus:outline-none focus:border-amber-400 bg-transparent"
                placeholder="Nota, conjunto, casa, apto, barrio, etc..."
                value={nota}
                onChange={e => setNota(e.target.value)}
              />
            </div>
            
            {/* Mostrar error general */}
            {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
            
            {/* Botón para confirmar pedido */}
            {!isSubmitting && (
              <button
                type="button"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
                onClick={handleConfirmOrder}
              >
                Confirmar pedido
              </button>
            )}
            
            {/* Estado de carga */}
            {isSubmitting && (
              <div className="w-full bg-gray-100 text-gray-600 font-semibold py-2 px-4 rounded flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando pedido...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de éxito del pedido */}
      {showOrderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Su pedido fue realizado!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Su pedido ha sido registrado exitosamente. Pronto recibirá una confirmación.
            </p>
            <button
              onClick={() => {
                setShowOrderSuccess(false);
                onClose();
                router.push('/pedidos');
              }}
              className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}