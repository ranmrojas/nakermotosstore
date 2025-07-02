'use client';

import React, { useState } from 'react';
import { useCart } from '../../../hooks/useCart';
import { analyticsEvents } from '../../../hooks/useAnalytics';
import Image from 'next/image';
import { getProductImageUrl } from '@/app/services/productService';
import Link from 'next/link';

export default function Checkout() {
  const { cart, clearCart, totalItems, totalPrice } = useCart();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: 'Barranquilla',
    departamento: 'Atlántico',
    codigoPostal: '',
    metodoPago: 'efectivo',
    notasAdicionales: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number | null, ext: string | null) => {
    if (!id || !ext) return '/file.svg';
    return getProductImageUrl(id, ext);
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generar mensaje de WhatsApp con el pedido
  const generateWhatsAppMessage = () => {
    const itemsList = cart.map(item => 
      `${item.cantidad} ${item.nombre} - $${item.precio.toLocaleString('es-CO')} c/u = $${(item.precio * item.cantidad).toLocaleString('es-CO')}`
    ).join('\n');

    const customerInfo = `*DATOS DEL CLIENTE:*
Nombre: ${formData.nombre} ${formData.apellido}
Email: ${formData.email}
Teléfono: ${formData.telefono}
Dirección: ${formData.direccion}
Ciudad: ${formData.ciudad}
Departamento: ${formData.departamento}
${formData.codigoPostal ? `Código Postal: ${formData.codigoPostal}` : ''}

*MÉTODO DE PAGO:* ${formData.metodoPago.toUpperCase()}

${formData.notasAdicionales ? `*NOTAS ADICIONALES:*
${formData.notasAdicionales}

` : ''}*PEDIDO:*
${itemsList}

*TOTAL A PAGAR: $${totalPrice.toLocaleString('es-CO')}*

¿Cuál sería el valor del domicilio y en cuánto tiempo puedo recibir mi pedido?`;

    return customerInfo;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      setError('Tu carrito está vacío. Agrega productos antes de realizar el pedido.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Rastrear evento de checkout
      analyticsEvents.checkout(
        totalItems,
        totalPrice,
        formData.metodoPago
      );
      
      // Generar mensaje de WhatsApp
      const whatsappMessage = generateWhatsAppMessage();
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/573043668910?text=${encodedMessage}`;
      
      // Rastrear evento de compra completada
      analyticsEvents.purchase(
        'WHATSAPP_ORDER',
        totalItems,
        totalPrice,
        formData.metodoPago
      );
      
      // Abrir WhatsApp en nueva pestaña
      window.open(whatsappUrl, '_blank');
      
      // Limpiar carrito y mostrar confirmación
      clearCart();
      setOrderComplete(true);
    } catch (err) {
      setError('Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.');
      console.error('Error al procesar el pedido:', err);
    } finally {
      setLoading(false);
    }
  };

  // Si el pedido está completo, mostrar confirmación
  if (orderComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mb-4 text-green-600">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido enviado por WhatsApp!</h2>
          <p className="text-gray-600 mb-4">
            Tu pedido ha sido enviado a nuestro WhatsApp. Te contactaremos pronto para confirmar los detalles y coordinar la entrega.
          </p>
          <p className="text-gray-600 mb-6">
            Si no se abrió WhatsApp automáticamente, puedes contactarnos directamente al <strong>+57 304 366 8910</strong>
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Volver a la tienda
            </Link>
            <button
              onClick={() => {
                const whatsappMessage = generateWhatsAppMessage();
                const encodedMessage = encodeURIComponent(whatsappMessage);
                const whatsappUrl = `https://wa.me/573043668910?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="block mx-auto px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Abrir WhatsApp nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de checkout */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de contacto</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección de envío</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      id="departamento"
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      id="codigoPostal"
                      name="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de pago</h2>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="efectivo"
                    name="metodoPago"
                    value="efectivo"
                    checked={formData.metodoPago === 'efectivo'}
                    onChange={handleChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="efectivo" className="ml-2 text-sm text-gray-700">
                    Efectivo contra entrega
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="transferencia"
                    name="metodoPago"
                    value="transferencia"
                    checked={formData.metodoPago === 'transferencia'}
                    onChange={handleChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="transferencia" className="ml-2 text-sm text-gray-700">
                    Transferencia bancaria
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="nequi"
                    name="metodoPago"
                    value="nequi"
                    checked={formData.metodoPago === 'nequi'}
                    onChange={handleChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="nequi" className="ml-2 text-sm text-gray-700">
                    Nequi
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas adicionales</h2>
              
              <textarea
                id="notasAdicionales"
                name="notasAdicionales"
                value={formData.notasAdicionales}
                onChange={handleChange}
                rows={3}
                placeholder="Instrucciones especiales para la entrega, referencias, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                loading || cart.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } transition-colors flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Enviar pedido por WhatsApp
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Resumen del pedido */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Tu carrito está vacío</p>
                <Link
                  href="/productos"
                  className="mt-4 inline-block text-amber-600 hover:text-amber-700"
                >
                  Continuar comprando
                </Link>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200 mb-4">
                  {cart.map((item) => (
                    <li key={item.id} className="py-3 flex items-center space-x-3">
                      <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.cantidad} x ${item.precio.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
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
                  <div className="flex justify-between text-base pt-2 border-t border-gray-200 mt-2">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">
                      ${totalPrice.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
