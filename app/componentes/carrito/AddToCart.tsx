'use client';

import React from 'react';
import { useCart } from '../../../hooks/useCart';
import { analyticsEvents } from '../../../hooks/useAnalytics';

interface Producto {
  id_producto: number;
  nombre: string;
  precio_final?: number;
  precio_venta_real?: number;
  precio_venta_online_real?: number | null;
  precio_promocion_online_real?: number;
  precio_venta?: number;
  precio_venta_online?: number | null;
  existencias_real?: number;
  vende_sin_existencia_real?: number;
  sku: string;
  id_imagen: number | null;
  ext1: string | null;
  ext2: string | null;
  nombre_categoria: string;
  nombre_marca: string;
  nota?: string;
  [key: string]: unknown;
}

interface AddToCartProps {
  producto: Producto;
  cantidad?: number;
  className?: string;
  showText?: boolean;
  onAddedToCart?: () => void;
}

export default function AddToCart({
  producto,
  cantidad = 1,
  className = '',
  showText = true,
  onAddedToCart
}: AddToCartProps) {
  const { addToCart } = useCart();

  // Función para obtener el precio correcto
  const getPrecioCorrecto = (product: Producto) => {
    // Si tiene precios reales actualizados, usar esos
    if (product.precio_final !== undefined) {
      return product.precio_final;
    }
    // Si tiene precio_venta_online_real, usar ese
    if (product.precio_venta_online_real !== undefined && product.precio_venta_online_real !== null) {
      return product.precio_venta_online_real;
    }
    // Si tiene precio_venta_real, usar ese
    if (product.precio_venta_real !== undefined) {
      return product.precio_venta_real;
    }
    // Fallback a precios originales
    return product.precio_venta_online !== null ? product.precio_venta_online : product.precio_venta;
  };

  // Verificar disponibilidad
  const isAvailable = (existencias: number | undefined, vende_sin_existencia: number | undefined) => {
    return (existencias ?? 0) > 0 || (vende_sin_existencia ?? 0) === 1;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const precio = getPrecioCorrecto(producto);
    
    // Rastrear evento de añadir al carrito
    analyticsEvents.addToCart(
      producto.id_producto.toString(),
      producto.nombre,
      precio || 0,
      cantidad
    );
    
    // Añadir al carrito
    addToCart({
      id: producto.id_producto,
      nombre: producto.nombre,
      precio: precio || 0,
      cantidad: cantidad,
      imagen: producto.id_imagen,
      extension: producto.ext1 || producto.ext2,
      sku: producto.sku || '',
      categoria: producto.nombre_categoria,
      marca: producto.nombre_marca,
      nota: producto.nota
    });
    
    // Ejecutar callback si existe
    if (onAddedToCart) {
      onAddedToCart();
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={!isAvailable(producto.existencias_real, producto.vende_sin_existencia_real)}
      className={`flex items-center justify-center gap-1 rounded-lg font-semibold text-white transition-all duration-200 ${
        !isAvailable(producto.existencias_real, producto.vende_sin_existencia_real)
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg active:scale-95'
      } ${className}`}
      title={!isAvailable(producto.existencias_real, producto.vende_sin_existencia_real)
        ? 'Producto agotado'
        : 'Añadir al carrito'
      }
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
      </svg>
      {showText && (
        !isAvailable(producto.existencias_real, producto.vende_sin_existencia_real)
          ? 'Agotado'
          : 'Añadir'
      )}
    </button>
  );
}
