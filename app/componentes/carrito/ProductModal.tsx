import React from 'react';
import Image from 'next/image';
import { getProductImageUrl } from '@/app/services/productService';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: number | string | null;
  extension?: string | null;
  sku?: string;
  nota?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}

export default function ProductModal({ isOpen, onClose, producto }: ProductModalProps) {
  if (!isOpen || !producto) return null;

  const idImagen = typeof producto.imagen === 'number' ? producto.imagen : parseInt(producto.imagen || '0');

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-center items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Detalle del Producto
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Imagen del producto */}
          <div className="relative w-full aspect-square mb-6 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={getProductImageUrl(idImagen, producto.extension || 'jpeg', true)}
              alt={producto.nombre}
              fill
              className="object-contain"
              unoptimized={true}
            />
          </div>
          
          {/* Información del producto */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              {producto.nombre}
            </h3>
            {producto.nota && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-800 text-sm font-medium">
                  {producto.nota}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {producto.sku && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-semibold text-gray-900">
                    {producto.sku}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Precio unitario:</span>
                <span className="font-semibold text-gray-900">
                  ${producto.precio.toLocaleString('es-CO')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-semibold text-gray-900">
                  {producto.cantidad}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  ${(producto.precio * producto.cantidad).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
        </div>
      </div>
    </div>
  );
} 