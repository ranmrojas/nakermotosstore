'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Map, Marker, LeafletMouseEvent } from 'leaflet';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface InteractiveMapProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: Location) => void;
  initialAddress?: string;
}

export default function InteractiveMap({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialAddress = ''
}: InteractiveMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [marker, setMarker] = useState<Marker | null>(null);

  // Coordenadas de la tienda
  const STORE_LOCATION = {
    lat: 4.126551,
    lng: -73.632540
  };

  // Inicializar mapa cuando se abre el modal
  useEffect(() => {
    if (isOpen && mapRef.current) {
      initializeMap();
    }
  }, [isOpen]);

  // Cargar script de Leaflet
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (isOpen) {
          initializeMap();
        }
      };
      document.head.appendChild(script);
    } else if (window.L && isOpen) {
      initializeMap();
    }
  }, [isOpen]);

  const initializeMap = useCallback(() => {
    if (!window.L || !mapRef.current) return;

    // Destruir el mapa anterior si existe
    const existingMap = document.getElementById('leaflet-map');
    if (existingMap && (existingMap as { _leaflet_id?: number })._leaflet_id) {
      (existingMap as { _leaflet_id?: number })._leaflet_id = undefined;
    }

    const L = window.L;
    
    // Crear mapa centrado en Villavicencio con controles de zoom
    const newMap = L.map('leaflet-map', {
      zoomControl: true, // Mostrar controles de zoom
      dragging: true,    // Permitir arrastrar el mapa
      scrollWheelZoom: true, // Permitir zoom con rueda del mouse
      doubleClickZoom: true, // Permitir zoom con doble clic
      boxZoom: true,     // Permitir zoom con caja
      keyboard: true     // Permitir navegación con teclado
    }).setView([STORE_LOCATION.lat, STORE_LOCATION.lng], 13);
    
    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    // Agregar marcador de la tienda
    const storeIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([STORE_LOCATION.lat, STORE_LOCATION.lng], { icon: storeIcon })
      .addTo(newMap)
      .bindPopup('<b>Nuestra tienda</b><br>Punto de referencia para envíos')
      .openPopup();

    setMap(newMap);

    // Agregar evento de clic al mapa (solo una vez)
    newMap.on('click', (e: LeafletMouseEvent) => handleMapClick(e, newMap));

    // Buscar dirección inicial si se proporciona
    if (initialAddress) {
      searchAddress(initialAddress, newMap);
    }

    // Obtener ubicación actual del usuario
    getUserLocation(newMap);
  }, []);

  const searchAddress = async (address: string, mapInstance: Map) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchQuery = `${address}, Villavicencio, Meta, Colombia`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&countrycodes=co&state=Meta&city=Villavicencio`
      );

      if (!response.ok) {
        throw new Error('Error al buscar la dirección');
      }

      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };

        setSelectedLocation(location);
        addMarkerToMap(location, mapInstance);
        mapInstance.setView([location.lat, location.lng], 16);
      } else {
        setError('No se encontró la dirección. Puedes seleccionar tu ubicación en el mapa.');
      }
    } catch (err) {
      console.error('Error buscando dirección:', err);
      setError('Error al buscar la dirección. Puedes seleccionar tu ubicación en el mapa.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = (mapInstance: Map) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userLoc);
          
          // Solo centrar en ubicación del usuario si está cerca de Villavicencio
          const distance = calculateDistance(
            STORE_LOCATION.lat, STORE_LOCATION.lng,
            userLoc.lat, userLoc.lng
          );
          
          if (distance < 50) { // Dentro de 50km de Villavicencio
            mapInstance.setView([userLoc.lat, userLoc.lng], 15);
          }
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  };

  const addMarkerToMap = (location: Location, mapInstance: Map) => {
    if (!window.L) return;

    const L = window.L;
    
    // Remover marcador anterior
    if (marker) {
      mapInstance.removeLayer(marker);
    }

    // Crear nuevo marcador ARRASTRABLE
    const newMarker = L.marker([location.lat, location.lng], {
      draggable: true // Hacer el marcador arrastrable
    })
      .addTo(mapInstance)
      .bindPopup(`
        <b>Ubicación seleccionada</b><br>
        ${location.address}<br>
        <small>Arrastra el marcador para ajustar la ubicación</small>
      `);

    // Evento cuando se arrastra el marcador
    newMarker.on('dragend', (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
      const draggedLocation = {
        lat: e.target.getLatLng().lat,
        lng: e.target.getLatLng().lng,
        address: 'Ubicación ajustada en el mapa'
      };
      setSelectedLocation(draggedLocation);
    });

    setMarker(newMarker);
  };

  // Función separada para manejar clics en el mapa
  const handleMapClick = (e: LeafletMouseEvent, mapInstance: Map) => {
    const clickedLocation = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      address: 'Ubicación seleccionada en el mapa'
    };

    setSelectedLocation(clickedLocation);
    addMarkerToMap(clickedLocation, mapInstance);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation);
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation && map) {
      const location = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: 'Ubicación actual del usuario'
      };
      setSelectedLocation(location);
      addMarkerToMap(location, map);
      map.setView([userLocation.lat, userLocation.lng], 16);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header fijo */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar ubicación de envío
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Información */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Nuestra tienda</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tu ubicación</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Cómo usar el mapa:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Arrastra el mapa</strong> para navegar por Villavicencio</li>
                <li>• <strong>Usa los controles + y -</strong> para hacer zoom</li>
                <li>• <strong>Haz clic en el mapa</strong> para mover el marcador azul</li>
                <li>• <strong>Arrastra el marcador azul</strong> para ajustar la ubicación exacta</li>
              </ul>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleUseCurrentLocation}
              disabled={!userLocation}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              Usar ubicación actual
            </button>
            {initialAddress && map && (
              <button
                onClick={() => searchAddress(initialAddress, map)}
                disabled={isLoading}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 text-sm"
              >
                {isLoading ? 'Buscando...' : 'Buscar dirección'}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Mapa */}
          <div 
            id="leaflet-map"
            ref={mapRef} 
            className="w-full h-64 sm:h-80 rounded-lg border border-gray-200"
            style={{ minHeight: '250px' }}
          />

          {/* Información de la ubicación seleccionada */}
          {selectedLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-900 mb-2">Ubicación seleccionada:</h4>
              <p className="text-sm text-green-800 mb-2">{selectedLocation.address}</p>
              <p className="text-xs text-green-700">
                Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Botones de confirmación */}
          <div className="flex gap-3 mt-4 pb-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Declaración global para TypeScript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
    confirmLocation: () => void;
  }
} 