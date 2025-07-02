'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '../../../hooks/useCart';
import { getProductImageUrl } from '@/app/services/productService';
import { analyticsEvents } from '../../../hooks/useAnalytics';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CartManagerProps {
  showCheckoutButton?: boolean;
}

export default function CartManager({ showCheckoutButton = true }: CartManagerProps) {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Efecto para cerrar el carrito al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.cart-container') && !target.closest('.cart-button')) {
        closeCart();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Función para abrir el carrito
  const openCart = () => {
    setIsOpen(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Rastrear evento de apertura del carrito
    analyticsEvents.cartOpened(totalItems, totalPrice);
  };

  // Función para cerrar el carrito
  const closeCart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 300);
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

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number | null, ext: string | null) => {
    if (!id || !ext) return '/file.svg';
    return getProductImageUrl(id, ext);
  };

  return (
    <>
      {/* Botón del carrito */}
      <button
        onClick={openCart}
        className="cart-button fixed bottom-4 right-4 z-40 flex items-center justify-center bg-amber-600 text-white rounded-full p-3 shadow-lg hover:bg-amber-700 transition-all duration-200"
        aria-label="Ver carrito"
      >
        <div className="relative">
          <ShoppingBagIcon className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      {/* Panel del carrito */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div 
            className={`cart-container bg-white w-full max-w-md h-full overflow-y-auto shadow-xl transform transition-transform duration-300 ease-in-out ${
              isAnimating ? 'translate-x-0' : ''
            }`}
            style={{ transform: isAnimating ? 'translateX(100%)' : 'translateX(0)' }}
          >
            {/* Encabezado del carrito */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex justify-between items-center p-4">
                <h2 className="text-lg font-bold text-gray-900">Tu Carrito</h2>
                <button
                  onClick={closeCart}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Cerrar carrito"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {totalItems > 0 && (
                <div className="px-4 py-2 bg-amber-50 text-amber-800 text-sm">
                  <span className="font-medium">{totalItems} producto{totalItems !== 1 ? 's' : ''}</span> en tu carrito
                </div>
              )}
            </div>

            {/* Contenido del carrito */}
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-gray-400 mb-4">
                    <ShoppingBagIcon className="mx-auto h-16 w-16" />
                  </div>
                  <p className="text-gray-600 text-lg mb-4">Tu carrito está vacío</p>
                  <button
                    onClick={closeCart}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                <>
                  {/* Lista de productos */}
                  <ul className="divide-y divide-gray-200">
                    {cart.map((item) => (
                      <li key={item.id} className="py-4">
                        <div className="flex items-start space-x-3">
                          {/* Imagen del producto */}
                          <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
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
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.nombre}
                            </p>
                            <p className="text-sm text-gray-500">
                              ${item.precio.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} c/u
                            </p>
                            {item.sku && (
                              <p className="text-xs text-gray-400">
                                SKU: {item.sku}
                              </p>
                            )}
                            
                            {/* Controles de cantidad */}
                            <div className="flex items-center mt-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-l-md hover:bg-gray-300"
                                aria-label="Disminuir cantidad"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-10 h-8 flex items-center justify-center bg-gray-100 text-gray-800 text-sm">
                                {item.cantidad}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-r-md hover:bg-gray-300"
                                aria-label="Aumentar cantidad"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Precio total y botón eliminar */}
                          <div className="flex flex-col items-end space-y-2">
                            <span className="text-sm font-bold text-gray-900">
                              ${(item.precio * item.cantidad).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                              aria-label="Eliminar producto"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Resumen del carrito */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900 font-medium">
                        ${totalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      El envío y los impuestos se calcularán en el checkout
                    </p>
                    
                    {/* Botones de acción */}
                    <div className="space-y-3">
                      {showCheckoutButton && (
                        <Link
                          href="/checkout"
                          className="w-full flex items-center justify-center px-4 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
                          onClick={() => {
                            // Rastrear evento de inicio de checkout
                            analyticsEvents.beginCheckout(totalItems, totalPrice);
                            closeCart();
                          }}
                        >
                          Proceder al pago
                        </Link>
                      )}
                      <button
                        onClick={clearCart}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Vaciar carrito
                      </button>
                      <button
                        onClick={closeCart}
                        className="w-full flex items-center justify-center px-4 py-2 text-amber-600 font-medium hover:text-amber-700 transition-colors"
                      >
                        Seguir comprando
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
