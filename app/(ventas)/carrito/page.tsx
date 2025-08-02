'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../../hooks/useCart';
import Image from 'next/image';
import { getProductImageUrl } from '@/app/services/productService';
import Link from 'next/link';
import { useClientSession } from '@/hooks/useClientSession';
import { useClientesApi } from '@/hooks/useClientesApi';
import Checkout from '../../componentes/carrito/Checkout';
import { gsap } from 'gsap';

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { session, saveSession } = useClientSession();
  const { getClienteByTelefono, createCliente } = useClientesApi();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  
  // Estados para 2FA (igual que en /cuenta)
  const [step, setStep] = useState<1 | 2>(1);
  const [codigo, setCodigo] = useState('');
  const [codigoError, setCodigoError] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);

  // Referencias para los botones de medio de pago
  const efectivoButtonRef = useRef<HTMLButtonElement>(null);
  const qrButtonRef = useRef<HTMLButtonElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number | null, ext: string | null) => {
    if (!id || !ext) return '/file.svg';
    return getProductImageUrl(id, ext);
  };

  // Validar número de celular colombiano
  const validarTelefono = (num: string) => /^3\d{9}$/.test(num);

  // Resetear estado del modal cuando se cierre
  useEffect(() => {
    if (!showPhoneModal) {
      setStep(1);
      setTelefono('');
      setCodigo('');
      setTelefonoError('');
      setCodigoError('');
      setLoading2FA(false);
    }
  }, [showPhoneModal]);

  // Efecto para animar los botones cuando no hay medio de pago seleccionado
  useEffect(() => {
    // Verificar que los elementos existan en el DOM
    if (!efectivoButtonRef.current || !qrButtonRef.current) {
      return;
    }

    if (!selectedPayment) {
      // Crear timeline para animación sutil
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      // Animación sutil para ambos botones
      tl.to([efectivoButtonRef.current, qrButtonRef.current], {
        scale: 1.02,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      return () => {
        tl.kill();
      };
    } else {
      // Si hay medio de pago seleccionado, detener animaciones
      gsap.killTweensOf([efectivoButtonRef.current, qrButtonRef.current]);
      gsap.set([efectivoButtonRef.current, qrButtonRef.current], { scale: 1 });
    }
  }, [selectedPayment]);

  // Función para manejar el clic en realizar pedido
  const handleRealizarPedido = () => {
    if (cart.length === 0) return;
    
    if (!selectedPayment) {
      // Si no hay medio de pago seleccionado, hacer scroll a la sección
      if (paymentSectionRef.current) {
        paymentSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Mostrar alerta de campo obligatorio
        setShowPaymentAlert(true);
        
        // Agregar un pequeño delay para que el scroll termine antes del focus
        setTimeout(() => {
          if (efectivoButtonRef.current) {
            efectivoButtonRef.current.focus();
          }
        }, 500);
      }
      return;
    }
    
    if (!session || !session.telefono || !/^3\d{9}$/.test(session.telefono)) {
      setShowPhoneModal(true);
      return;
    }
    setShowCheckout(true);
  };

  return (
    <div className="bg-white min-h-screen w-full pb-24">
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
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors mr-2"
                              aria-label="Eliminar producto"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <button
                              onClick={() => updateQuantity(item.id, item.cantidad - 1)}
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
                              onClick={() => updateQuantity(item.id, item.cantidad + 1)}
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
                  
                  {/* Mostrar dirección guardada si existe */}
                  {session?.direccion && (
                    <div className="text-sm">
                      <span className="text-gray-600">Dirección de entrega:</span>
                      <div className="text-gray-900 font-medium mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                        {session.direccion}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-gray-900 font-medium">
                      {session?.valordomicilio && session.valordomicilio > 0 
                        ? `$${session.valordomicilio.toLocaleString('es-CO')}` 
                        : 'Por calcular'
                      }
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
                  <div className="mb-4" ref={paymentSectionRef}>
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      Medio de pago <span className="text-red-500">*</span>
                    </div>
                    <div className="flex justify-between">
                      <button
                        ref={efectivoButtonRef}
                        type="button"
                          onClick={() => {
                            setSelectedPayment('Efectivo');
                            setShowPaymentAlert(false);
                          }}
                        className={`inline-block px-3 py-1 rounded-lg border text-sm font-semibold transition-colors
                          ${selectedPayment === 'Efectivo'
                            ? 'bg-blue-600 text-white border-blue-700 shadow'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                        `}
                      >
                        Efectivo
                      </button>
                      <button
                        ref={qrButtonRef}
                        type="button"
                          onClick={() => {
                            setSelectedPayment('qr');
                            setShowPaymentAlert(false);
                          }}
                        className={`inline-block px-3 py-1 rounded-lg border text-sm font-semibold transition-colors
                          ${selectedPayment === 'qr'
                            ? 'bg-blue-600 text-white border-blue-700 shadow'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                        `}
                      >
                        QR o Transferencia
                      </button>
                    </div>
                      
                      {/* Alerta de campo obligatorio */}
                      {showPaymentAlert && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-red-700 font-medium">
                              Campo obligatorio
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex gap-2">
                    <Link
                      href="/productos"
                      className="flex-1 flex items-center justify-center px-4 py-2 font-medium transition-colors"
                      style={{ color: 'var(--primary-lighter)' }}
                    >
                      Seguir comprando
                    </Link>

                    <button
                      onClick={clearCart}
                      className="flex items-center justify-center px-2 py-1 border border-gray-300 text-gray-500 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
                    >
                      Vaciar carrito
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante para realizar pedido */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total ({totalItems} items):</span>
                  <span className="font-bold text-lg text-gray-900">
                    ${totalPrice.toLocaleString('es-CO')}
                  </span>
                </div>
                {session?.valordomicilio && session.valordomicilio > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    + ${session.valordomicilio.toLocaleString('es-CO')} envío
                  </div>
                )}
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleRealizarPedido}
                  className={`px-8 py-3 font-semibold rounded-lg transition-colors shadow-lg
                    ${cart.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : !selectedPayment
                      ? 'bg-gray-400 text-white hover:bg-gray-500 active:scale-95'
                      : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                    }
                  `}
                >
                  {!selectedPayment ? 'Realizar pedido' : 'Realizar pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Componente Checkout */}
      <Checkout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />

      {/* Modal para ingresar número de celular (idéntico al de /cuenta) */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
            {step === 1 && (
              <>
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
                <h3 className="text-md font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">Ingrese el código SMS enviado a su número de celular</h3>
                <input
                  type="text"
                  className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
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
                              valordomicilio: clienteExistente.valordomicilio
                            });
                            setShowPhoneModal(false);
                            setShowCheckout(true);
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
                                valordomicilio: nuevoCliente.valordomicilio
                              });
                              setShowPhoneModal(false);
                              setShowCheckout(true);
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
  );
}