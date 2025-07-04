'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '../../hooks/useCart';
import { analyticsEvents } from '../../hooks/useAnalytics';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import Image from 'next/image';
import { getProductImageUrl } from '@/app/services/productService';
import Link from 'next/link';

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [nota, setNota] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  
  // Variables para la gestión de direcciones y ubicación
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [selectedAddress, setSelectedAddress] = useState<{
    display_name: string;
    lat: string;
    lon: string;
  } | null>(null);
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Coordenadas de la tienda en Villavicencio
  const STORE_LOCATION = {
    lat: 4.126551,
    lon: -73.632540
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

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number | null, ext: string | null) => {
    if (!id || !ext) return '/file.svg';
    return getProductImageUrl(id, ext);
  };

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

  // Calcular costo de envío basado en la distancia - memoizada para evitar recreaciones
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

  // Función para eliminar un producto del carrito
  const handleRemoveItem = (id: number) => {
    removeFromCart(id);
    
    // Rastrear evento de eliminación de producto
    analyticsEvents.removeFromCart(id.toString());
  };

  // Función para actualizar la cantidad de un producto
  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
      
      // Rastrear evento de actualización de cantidad
      analyticsEvents.updateCartQuantity(id.toString(), newQuantity);
    }
  };

  // Inicializar autocompletado de direcciones
  const initializeAutocomplete = useCallback(() => {
    if (!window.google || !addressInputRef.current) return;

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: 'co' },
      types: ['address'],
      fields: ['formatted_address', 'geometry', 'place_id'],
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
        setHasSelectedSuggestion(true);
        
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

  // Cargar Google Maps API
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGoogleMaps().then(() => {
        if (showModal) {
          initializeAutocomplete();
        }
      }).catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
    } else if (isLoaded && showModal) {
      initializeAutocomplete();
    }
  }, [isLoaded, isLoading, loadGoogleMaps, showModal, initializeAutocomplete]);

  // Manejar cambios en el input de dirección
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDireccion(e.target.value);
    setHasSelectedSuggestion(false);
    setShippingCost(0);
    setSelectedAddress(null);
  };

  // Rastrear vista de la página del carrito (solo una vez al montar)
  React.useEffect(() => {
    analyticsEvents.cartOpened(totalItems, totalPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias para que solo se ejecute una vez

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tu Carrito</h1>
          <p className="text-gray-600 mt-2">
            {totalItems > 0 
              ? `${totalItems} producto${totalItems !== 1 ? 's' : ''} en tu carrito`
              : 'Tu carrito está vacío'
            }
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-6">
              <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-8">Agrega algunos productos para comenzar a comprar</p>
            <Link
              href="/productos"
              className="inline-block px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Productos ({totalItems})</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 sm:p-6">
                      <div className="flex flex-row items-start sm:items-center gap-3 sm:gap-4">
                        {/* Info principal */}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center w-full">
                            <div className="flex-1">
                              <h3 className="text-base font-medium text-gray-900 mb-0.5 break-words whitespace-normal">
                                {item.nombre}
                              </h3>
                              <p className="text-xs text-gray-500 mb-0.5">
                                {item.categoria} • {item.marca}
                              </p>
                              {item.sku && (
                                <p className="text-[11px] text-gray-400 mb-1">
                                  SKU: {item.sku}
                                </p>
                              )}
                              {/* Precios */}
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">
                                  ${item.precio.toLocaleString('es-CO')} c/u
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Imagen y controles debajo en móvil, a la derecha en desktop */}
                        <div className="flex flex-col items-center w-24">
                          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden mb-2">
                            <Image
                              src={getImageUrl(item.imagen, item.extension)}
                              alt={item.nombre}
                              fill
                              className="object-cover"
                              unoptimized={true}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/file.svg';
                              }}
                            />
                          </div>
                          {/* Controles de cantidad y eliminar */}
                          <div className="flex items-center justify-center mt-1 pr-6">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors mr-2"
                              aria-label="Eliminar producto"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-l-md hover:bg-gray-300 transition-colors"
                              aria-label="Disminuir cantidad"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 h-8 flex items-center justify-center bg-gray-100 text-gray-800 text-sm font-medium">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-r-md hover:bg-gray-300 transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Resumen del carrito */}
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                    <span className="text-gray-900 font-medium">
                      ${totalPrice.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-gray-900 font-medium">
                      Por calcular
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-base">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900">
                        ${totalPrice.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-6">
                  El costo del envio se calculará de acuerdo a la dirección de entrega.
                </p>
                
                {/* Botones de acción */}
                <div className="space-y-3">
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      Medio de pago <span className="text-red-500">*</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('contraentrega')}
                        className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold transition-colors
                          ${selectedPayment === 'contraentrega'
                            ? 'bg-blue-600 text-white border-blue-700 shadow'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                        `}
                      >
                        Contra entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('qr')}
                        className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold transition-colors
                          ${selectedPayment === 'qr'
                            ? 'bg-blue-600 text-white border-blue-700 shadow'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                        `}
                      >
                        QR o Transferencia
                      </button>
                    </div>
                  </div>

                  {/* Botón de realizar pedido por WhatsApp */}
                  <button
                    type="button"
                    disabled={!selectedPayment || cart.length === 0}
                    onClick={() => {
                      if (!selectedPayment || cart.length === 0) return;
                      setShowModal(true);
                    }}
                    className={`w-full flex items-center justify-center px-4 py-3 font-medium rounded-lg transition-colors mb-3
                      ${!selectedPayment || cart.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'}
                    `}
                  >
                    Realizar pedido
                  </button>

                  {/* Modal para nombre y dirección */}
                  {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-100/70 via-white/80 to-amber-100/70">
                      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
                        <button
                          className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
                          onClick={() => setShowModal(false)}
                          aria-label="Cerrar"
                        >
                          ×
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Completa tu pedido</h3>
                        {/* Input para nombre */}
                        <input
                          type="text"
                          className="w-full mb-3 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
                          value={nombre}
                          onChange={e => setNombre(e.target.value)}
                          placeholder="Nombre"
                        />
                        {/* Input para dirección */}
                        <input
                          ref={addressInputRef}
                          type="text"
                          className="w-full mb-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
                          value={direccion}
                          onChange={handleAddressChange}
                          placeholder="Escribe tu dirección en Villavicencio..."
                        />
                        {/* Tag de ciudad/departamento */}
                        <div className="mb-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:border-neutral-600">
                            Villavicencio-Meta
                          </span>
                        </div>
                        {/* Resumen clásico debajo del campo de dirección */}
                        <div className="flex items-center justify-between gap-2 mb-3 mt-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              Total productos: <span className="font-bold text-gray-900 dark:text-gray-100">{`$${totalPrice.toLocaleString('es-CO')}`}</span>
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              Valor domicilio: <span className="font-bold text-gray-900 dark:text-gray-100">{shippingCost > 0 ? `$${shippingCost.toLocaleString('es-CO')}` : 'Por calcular'}</span>
                            </span>
                          </div>
                        </div>
                        {/* Total a pagar destacado */}
                        <div className="mb-3">
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Total a pagar: {shippingCost > 0 ? `$${(totalPrice + shippingCost).toLocaleString('es-CO')}` : `$${totalPrice.toLocaleString('es-CO')}`}
                          </span>
                        </div>
                        {/* Input para nota opcional (movido aquí) */}
                        <input
                          type="text"
                          className="w-full mb-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
                          value={nota}
                          onChange={e => setNota(e.target.value)}
                          placeholder="Nota..."
                        />
                        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
                        <button
                          className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition-colors"
                          onClick={() => {
                            if (!nombre.trim() || !direccion.trim()) {
                              setError('Por favor ingresa tu nombre y dirección.');
                              return;
                            }
                            setError('');
                            setShowModal(false);
                            const metodo = selectedPayment === 'contraentrega' ? 'Contra entrega' : 'QR o Transferencia';
                            const productos = cart.map(item => `${item.cantidad} ${item.nombre} = $${(item.precio * item.cantidad).toLocaleString('es-CO')}
sku: ${item.sku}`).join('\n');
                            const total = `$${totalPrice.toLocaleString('es-CO')}`;
                            const totalConEnvio = totalPrice + shippingCost;
                            const valorDomicilio = shippingCost > 0 ? `$${shippingCost.toLocaleString('es-CO')}` : 'Por calcular';
                            // Procesar la dirección para asegurar que se incluya correctamente
                            const direccionProcesada = direccion.includes(',') 
                              ? direccion.split(',')[0].trim() // Tomar solo la parte antes de la primera coma
                              : direccion;
                              
                            const mensaje = `¡Hola! Realice este pedido:\n${productos}\n\nSubtotal: ${total}\nValor domicilio: ${valorDomicilio}\nTotal a Pagar: $${totalConEnvio.toLocaleString('es-CO')}\nMedio de Pago: ${metodo}\nNombre: ${nombre}\nDirección: ${direccionProcesada}${nota ? `\nNota: ${nota}` : ''}`;
                            
                            // Codificar el mensaje para asegurar que se transmita correctamente
                            const url = `https://wa.me/573043668910?text=${encodeURIComponent(mensaje)}`;
                            window.open(url, '_blank');
                            clearCart();
                            setNombre('');
                            setDireccion('');
                            setNota('');
                            setShippingCost(0);
                            setSelectedAddress(null);
                            setHasSelectedSuggestion(false);
                          }}
                        >
                          Confirmar pedido
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={clearCart}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Vaciar carrito
                  </button>
                  <Link
                    href="/productos"
                    className="w-full flex items-center justify-center px-4 py-2 text-amber-600 font-medium hover:text-amber-700 transition-colors"
                  >
                    Seguir comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}