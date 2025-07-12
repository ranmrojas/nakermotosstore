'use client';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useClientSession } from '@/hooks/useClientSession';
import { useClientesApi } from '@/hooks/useClientesApi';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { DireccionGuardada } from '@/types/direcciones';



export default function PerfilCliente() {
  const { session, saveSession } = useClientSession();
  const { obtenerDireccionesGuardadas, eliminarDireccionGuardada, getClienteByTelefono, createCliente } = useClientesApi();
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();
  
  // Estados faltantes
  const [direcciones, setDirecciones] = useState<{ direcciones: DireccionGuardada[] } | null>(null);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [showAddDireccionInput, setShowAddDireccionInput] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [direccionModal, setDireccionModal] = useState('');
  const [shippingCostModal, setShippingCostModal] = useState(0);
  const [selectedAddressModal, setSelectedAddressModal] = useState<{ lat: number; lng: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNombre, setEditNombre] = useState(session?.nombre || '');
  const [editTelefono, setEditTelefono] = useState(session?.telefono || '');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Estados para 2FA
  const [step, setStep] = useState<1 | 2>(1);
  const [codigo, setCodigo] = useState('');
  const [codigoError, setCodigoError] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);
  
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

  const handleShowAddDireccionInput = async () => {
    setShowAddDireccionInput(true);
    if (!isLoaded && !isLoading) {
      await loadGoogleMaps();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100 flex items-center justify-center py-0">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-4 sm:p-6 mx-auto overflow-y-auto min-h-[90vh] flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Mi cuenta</h2>
          <div className="text-center text-gray-500 mb-4">
            Inicia sesión para ver tu información
          </div>
          {/* Modal para ingresar número de celular (idéntico al del carrito) */}
          {showPhoneModal && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
                {step === 1 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Ingrese su número de celular</h3>
                    <input
                      type="tel"
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                        setLoading2FA(true);
                        setTelefonoError('');
                        try {
                          // Llamar al endpoint de verificación SMS
                          const resp = await fetch('/api/auth/send-verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ telefono: `+57${telefono}` })
                          });
                          const data = await resp.json();
                          if (resp.ok && data.success) {
                            setStep(2);
                          } else {
                            setTelefonoError('No se pudo enviar el código. Intente nuevamente.');
                          }
                        } catch {
                          setTelefonoError('Error al enviar el código. Intente nuevamente.');
                        } finally {
                          setLoading2FA(false);
                        }
                      }}
                      disabled={loading2FA}
                    >
                      {loading2FA ? 'Enviando...' : 'Confirmar'}
                    </button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h3 className="text-md font-semibold mb-4 text-center text-gray-800">Ingrese el código SMS enviado a su número de celular</h3>
                    <input
                      type="text"
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                      value={codigo}
                      onChange={e => {
                        setCodigo(e.target.value);
                        if (codigoError) setCodigoError('');
                      }}
                      placeholder="Código de verificación"
                      maxLength={6}
                    />
                    {codigoError && <div className="text-red-500 text-xs mb-2">{codigoError}</div>}
                    <button
                      className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition-colors"
                      onClick={async () => {
                        if (!/^[0-9]{4,8}$/.test(codigo)) {
                          setCodigoError('Ingrese un código válido');
                          return;
                        }
                        setLoading2FA(true);
                        setCodigoError('');
                        try {
                          // Llamar al endpoint de verificación de código
                          const resp = await fetch('/api/auth/check-verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ telefono: `+57${telefono}`, code: codigo })
                          });
                          const data = await resp.json();
                          if (resp.ok && data.success) {
                            // Flujo original: buscar/crear cliente y guardar sesión
                            try {
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
                                  setCodigoError('Error al crear el cliente. Intente nuevamente.');
                                }
                              }
                            } catch {
                              setCodigoError('Error al procesar el teléfono. Intente nuevamente.');
                            }
                          } else {
                            setCodigoError('Código incorrecto o expirado. Intente nuevamente.');
                          }
                        } catch {
                          setCodigoError('Error al verificar el código. Intente nuevamente.');
                        } finally {
                          setLoading2FA(false);
                        }
                      }}
                      disabled={loading2FA}
                    >
                      {loading2FA ? 'Verificando...' : 'Verificar'}
                    </button>
                    <button
                      className="w-full mt-2 bg-gray-200 text-gray-700 font-semibold py-2 rounded hover:bg-gray-300 transition-colors"
                      onClick={() => { setStep(1); setCodigo(''); setCodigoError(''); }}
                      disabled={loading2FA}
                    >
                      Cambiar número
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-white to-blue-100 flex items-start justify-center py-0">
      <main className="w-full max-w-md mx-auto flex flex-col gap-4 px-0 pt-2 pb-8">
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
        </section>

        {/* Botón para ir a pedidos */}
        <section className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-gray-800 my-0">Mis Pedidos</h3>
          <p className="text-sm text-gray-600 mb-3">Gestiona tus pedidos en curso y revisa tu historial</p>
          <Link
            href="/pedidos"
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Ver mis pedidos
          </Link>
        </section>

        {/* Botón de cerrar sesión */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <button
            onClick={() => {
              // Eliminar la sesión del cliente
              localStorage.removeItem('clienteSession');
              localStorage.removeItem('client_session');
              window.location.reload();
            }}
            className="w-full py-3 px-4 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition border border-red-200"
          >
            Cerrar sesión
          </button>
        </section>

        {/* Modal para agregar dirección */}
        {showModalAgregar && (
          <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40">
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
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Editar datos</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                placeholder="Nombre completo"
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editTelefono}
                onChange={e => setEditTelefono(e.target.value)}
                placeholder="Ej: 3001234567"
                maxLength={10}
              />
              {editError && <div className="text-red-500 text-xs mb-2">{editError}</div>}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition"
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
