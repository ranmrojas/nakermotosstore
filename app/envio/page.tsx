'use client';

import React from 'react';
import ShippingCalculator from '../componentes/carrito/ShippingCalculator';
import StoreMap from '../componentes/carrito/StoreMap';

export default function EnvioPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sistema de Cálculo de Envío
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Prueba nuestro sistema de cálculo de envío para Villavicencio. 
          Escribe tu dirección y obtén el costo de domicilio automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculadora de envío */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Calculadora de envío
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-2">Tarifas de envío:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Costo base: $5,000 (hasta 2km)</li>
                <li>• Costo adicional: $1,000 por km adicional</li>
                <li>• Costo máximo: $15,000</li>
                <li>• Envío gratis en pedidos superiores a $100,000</li>
              </ul>
              <h3 className="font-medium text-blue-900 mb-2 mt-3">Cobertura:</h3>
              <p className="text-blue-800 text-sm">
                Solo Villavicencio, Meta, Colombia
              </p>
            </div>
          </div>

          <ShippingCalculator
            onShippingCalculated={(address, cost) => {
              console.log('Envío calculado:', { address, cost });
              alert(`Envío calculado:\nDirección: ${address}\nCosto: $${cost.toLocaleString('es-CO')}`);
            }}
            onAddressChange={(address) => {
              console.log('Dirección cambiada:', address);
            }}
          />
        </div>

        {/* Mapa de la tienda */}
        <div>
          <StoreMap />
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-amber-600 font-bold">1</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Escribe tu dirección</h3>
            <p className="text-gray-600 text-sm">
              Comienza a escribir tu dirección en Villavicencio y verás sugerencias automáticas
            </p>
          </div>
          <div className="text-center">
            <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-amber-600 font-bold">2</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Selecciona tu ubicación</h3>
            <p className="text-gray-600 text-sm">
              Elige tu dirección exacta de las sugerencias para obtener coordenadas precisas
            </p>
          </div>
          <div className="text-center">
            <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-amber-600 font-bold">3</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Confirma el envío</h3>
            <p className="text-gray-600 text-sm">
              Revisa el costo calculado y confirma para usar en tu pedido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 