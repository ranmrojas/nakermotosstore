'use client';

import React from 'react';

interface DistanceInfoProps {
  distance?: number;
  cost?: number;
  address?: string;
  className?: string;
}

export default function DistanceInfo({ distance, cost, address, className = '' }: DistanceInfoProps) {
  if (!distance || !cost || !address) {
    return null;
  }

  // Determinar la zona de envío basada en la distancia
  const getZoneInfo = (dist: number) => {
    if (dist <= 2) {
      return {
        zone: 'Zona 1 - Centro',
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'Envío rápido (1-2 horas)'
      };
    } else if (dist <= 5) {
      return {
        zone: 'Zona 2 - Media',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Envío estándar (2-3 horas)'
      };
    } else {
      return {
        zone: 'Zona 3 - Extendida',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        description: 'Envío extendido (3-4 horas)'
      };
    }
  };

  const zoneInfo = getZoneInfo(distance);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Información del envío
      </h3>
      
      <div className="space-y-3">
        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección confirmada:
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
            {address}
          </p>
        </div>

        {/* Distancia */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Distancia desde la tienda:</span>
          <span className="text-sm font-bold text-gray-900">
            {distance.toFixed(1)} km
          </span>
        </div>

        {/* Zona */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Zona de envío:</span>
          <span className={`text-xs px-2 py-1 rounded-full border ${zoneInfo.color}`}>
            {zoneInfo.zone}
          </span>
        </div>

        {/* Tiempo estimado */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Tiempo estimado:</span>
          <span className="text-sm text-gray-900">
            {zoneInfo.description}
          </span>
        </div>

        {/* Costo */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Costo de envío:</span>
            <span className="text-xl font-bold text-green-600">
              ${cost.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Información adicional:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Solo entregamos en Villavicencio, Meta</li>
            <li>• Horario de entrega: 8:00 AM - 8:00 PM</li>
            <li>• Envío gratis en pedidos superiores a $100,000</li>
            <li>• Pago contra entrega disponible</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 