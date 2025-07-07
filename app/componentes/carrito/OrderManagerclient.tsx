import React, { useState } from "react";
import Image from 'next/image';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface Pedido {
  id: number;
  cliente: string;
  estado: string;
  total: number;
  fecha: string;
  productos?: Producto[];
  direccion?: string;
  telefono?: string;
  medioPago?: string;
  subtotal?: number;
  domicilio?: number;
}

interface OrderCardProps {
  pedido: Pedido;
  onCancelOrder?: (orderId: number) => void;
  isAdmin?: boolean;
}

export function OrderCard({ pedido, onCancelOrder, isAdmin = false }: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleCancelOrder = async (orderId: number) => {
    if (!onCancelOrder) return;
    
    try {
      const response = await fetch(`/api/pedidos/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'Cancelado',
          usuario: 'el *Cliente*'
        }),
      });

      if (response.ok) {
        onCancelOrder(orderId);
      } else {
        console.error('Error al cancelar el pedido');
      }
    } catch (error) {
      console.error('Error al cancelar el pedido:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    console.log('Estado recibido:', estado);
    switch (estado.toLowerCase()) {
      case 'sin_aceptar':
      case 'sin aceptar':
      case 'pendiente':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.7)]';
      case 'cancelado':
      case 'canceled':
        return 'bg-red-50 text-red-700 border border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.7)]';
      case 'completado':
      case 'completed':
      case 'finalizado':
        return 'bg-gray-50 text-gray-700 border border-gray-200 shadow-[0_0_15px_rgba(75,85,99,0.7)]';
      case 'en_proceso':
      case 'en proceso':
      case 'procesando':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.7)]';
      case 'aceptado':
      case 'acepted':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-[0_0_15px_rgba(147,51,234,0.7)]';
      case 'enviado':
      case 'enviado':
      case 'shipped':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-[0_0_15px_rgba(34,197,94,0.7)]';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200 shadow-[0_0_15px_rgba(107,114,128,0.7)]';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">#{pedido.id}</span>
          <span className={`text-xs px-2 py-1 rounded font-semibold ${getEstadoColor(pedido.estado)}`}>
            {pedido.estado}
          </span>
        </div>
        
        <div className="text-sm text-gray-700">
          <span className="font-medium">Cliente:</span> {pedido.cliente}
        </div>
        
        <div className="text-sm text-gray-500">
          <span className="font-medium">Fecha:</span> {pedido.fecha}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-blue-700">
            Total: ${pedido.total.toLocaleString('es-CO')}
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            <svg 
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          {/* Información de entrega */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Información de entrega</h4>
            <div className="text-sm text-gray-700">
              <p><span className="font-medium">Dirección:</span></p>
              <p className="mt-1 bg-white p-2 rounded border">{pedido.direccion || 'No disponible'}</p>
            </div>
          </div>

          {/* Lista de productos */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Productos</h4>
            <div className="bg-white rounded-lg border overflow-hidden">
              {pedido.productos && pedido.productos.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pedido.productos.map((producto, index) => (
                    <div key={index} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {producto.imagen && (
                          <Image 
                            src={producto.imagen} 
                            alt={producto.nombre}
                            className="w-12 h-12 object-cover rounded-lg"
                            width={48}
                            height={48}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{producto.nombre}</p>
                          <p className="text-sm text-gray-500">Cantidad: {producto.cantidad}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(producto.precio * producto.cantidad).toLocaleString('es-CO')}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${producto.precio.toLocaleString('es-CO')} c/u
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No hay productos disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          {!isAdmin && (pedido.estado.toLowerCase() === 'pendiente' || pedido.estado.toLowerCase() === 'aceptado') && (
            <button 
              onClick={() => handleCancelOrder(pedido.id)}
              className="w-auto min-w-[64px] px-2 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold text-xs leading-tight hover:bg-gray-200 transition border border-gray-300"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface OrderManagerProps {
  orders: Pedido[];
  onCancelOrder?: (orderId: number) => void;
  isAdmin?: boolean;
}

export default function OrderManager({ orders, onCancelOrder, isAdmin = false }: OrderManagerProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-lg border-2 border-dashed border-gray-200 rounded-xl">
          No hay pedidos registrados.
        </div>
      ) : (
        orders.map((pedido) => (
          <OrderCard 
            key={pedido.id} 
            pedido={pedido} 
            onCancelOrder={onCancelOrder}
            isAdmin={isAdmin}
          />
        ))
      )}
    </div>
  );
}