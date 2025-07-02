'use client';

import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { analyticsEvents } from '../../hooks/useAnalytics';
import Image from 'next/image';
import { getProductImageUrl } from '@/app/services/productService';
import Link from 'next/link';



export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [barrio, setBarrio] = useState('');
  const [nota, setNota] = useState('');

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number | null, ext: string | null) => {
    if (!id || !ext) return '/file.svg';
    return getProductImageUrl(id, ext);
  };

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
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Imagen del producto */}
                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
                        
                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {item.nombre}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.categoria} • {item.marca}
                          </p>
                          {item.sku && (
                            <p className="text-xs text-gray-400 mt-1">
                              SKU: {item.sku}
                            </p>
                          )}
                          
                          {/* Controles de cantidad */}
                          <div className="flex items-center mt-4">
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
                        
                        {/* Precio y botón eliminar */}
                        <div className="flex flex-col items-end space-y-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              ${item.precio.toLocaleString('es-CO')} c/u
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
                  El envío y los impuestos se calcularán en el checkout
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
                          type="text"
                          className="w-full mb-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
                          value={direccion}
                          onChange={e => setDireccion(e.target.value)}
                          placeholder="Dirección de entrega"
                        />
                        {/* Input para barrio/conjunto opcional */}
                        <input
                          type="text"
                          className="w-full mb-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-neutral-800 dark:text-gray-100"
                          value={barrio}
                          onChange={e => setBarrio(e.target.value)}
                          placeholder="Barrio o conjunto (opcional)"
                        />
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-300">
                            Villavicencio-Meta
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Total pedido <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shadow-sm shadow-emerald-200 align-middle" style={{marginTop: 0, marginBottom: 0}}>{`$${totalPrice.toLocaleString('es-CO')}`}</span> más el valor del domicilio de entre <span className="font-bold">$5.000 a $12.000</span> o más si es Vereda, que se confirmará vía WhatsApp de acuerdo a la dirección suministrada.
                        </p>
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
sku: ${item.sku}`).join('%0A');
                            const total = `$${totalPrice.toLocaleString('es-CO')}`;
                            const mensaje = `¡Hola! Realice este pedido:%0A${productos}%0A%0ATotal: ${total}%0AMétodo de pago: ${metodo}%0ANombre: ${nombre}%0ADirección: ${direccion}${barrio ? `%0ABarrio o conjunto: ${barrio}` : ''}${nota ? `%0ANota: ${nota}` : ''}%0AValor del domicilio por Confirmar....`;
                            const url = `https://wa.me/573043668910?text=${mensaje}`;
                            window.open(url, '_blank');
                            clearCart();
                            setNombre('');
                            setDireccion('');
                            setBarrio('');
                            setNota('');
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