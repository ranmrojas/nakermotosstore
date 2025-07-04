'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';

interface StoreMapProps {
  className?: string;
}



export default function StoreMap({ className = '' }: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const storeLat = 4.126551;
  const storeLon = -73.632540;
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();

  const initializeMap = useCallback(() => {
    if (!window.google || !mapRef.current) return;

    const google = window.google;
    
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: storeLat, lng: storeLon },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Agregar marcador de la tienda
    new google.maps.Marker({
      position: { lat: storeLat, lng: storeLon },
      map: map,
      title: 'Nuestra tienda',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });
  }, []);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGoogleMaps().then(() => {
        initializeMap();
      }).catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
    } else if (isLoaded) {
      initializeMap();
    }
  }, [isLoaded, isLoading, loadGoogleMaps, initializeMap]);

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
        <div 
          ref={mapRef}
          className="w-full h-80"
          style={{ minHeight: '300px' }}
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