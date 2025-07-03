'use client';

import React from 'react';

interface StoreMapProps {
  className?: string;
}

export default function StoreMap({ className = '' }: StoreMapProps) {
  const storeLat = 4.126551;
  const storeLon = -73.632540;
  
  // URL del mapa de OpenStreetMap centrado en la tienda
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${storeLon-0.01}%2C${storeLat-0.01}%2C${storeLon+0.01}%2C${storeLat+0.01}&layer=mapnik&marker=${storeLat}%2C${storeLon}`;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ubicación de la tienda
        </h3>
        <p className="text-sm text-gray-600">
          Coordenadas: {storeLat}, {storeLon}
        </p>
      </div>
      
      <div className="relative">
        <iframe
          width="100%"
          height="300"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          title="Ubicación de la tienda"
          className="w-full"
        />
        
        {/* Overlay con información de la tienda */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Nuestra tienda</h4>
              <p className="text-xs text-gray-600">Villavicencio, Meta</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Punto de referencia:</strong> Nuestra tienda en Villavicencio
          </p>
          <p>
            <strong>Radio de entrega:</strong> Toda la ciudad de Villavicencio
          </p>
        </div>
      </div>
    </div>
  );
} 