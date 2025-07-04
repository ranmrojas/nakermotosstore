/// <reference types="@types/google.maps" />
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';

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
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();

  // Coordenadas de la tienda
  const STORE_LOCATION = {
    lat: 4.126551,
    lng: -73.632540
  };

  const searchAddress = async (address: string, mapInstance: google.maps.Map, geocoderInstance: google.maps.Geocoder): Promise<void> => {
    setIsLoadingMap(true);
    setMapError(null);

    try {
      const searchQuery = `${address}, Villavicencio, Meta, Colombia`;
      const response = await geocoderInstance.geocode({ address: searchQuery });

      if (response.results.length > 0) {
        const result = response.results[0];
        const location = {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        };

        setSelectedLocation(location);
        addMarkerToMap(location, mapInstance);
        mapInstance.setCenter({ lat: location.lat, lng: location.lng });
        mapInstance.setZoom(16);
      } else {
        setMapError('No se encontró la dirección. Puedes seleccionar tu ubicación en el mapa.');
      }
    } catch (err) {
      console.error('Error buscando dirección:', err);
      setMapError('Error al buscar la dirección. Puedes seleccionar tu ubicación en el mapa.');
    } finally {
      setIsLoadingMap(false);
    }
  };

  const getUserLocation = (mapInstance: google.maps.Map): void => {
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
            mapInstance.setCenter({ lat: userLoc.lat, lng: userLoc.lng });
            mapInstance.setZoom(15);
          }
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  };

  const addMarkerToMap = useCallback((location: Location, mapInstance: google.maps.Map): void => {
    if (!window.google) return;

    const google = window.google;
    
    // Remover marcador anterior
    if (marker) {
      marker.setMap(null);
    }

    // Crear nuevo marcador ARRASTRABLE
    const newMarker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstance,
      draggable: true,
      title: 'Ubicación seleccionada'
    });

    // InfoWindow para el marcador
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">Ubicación seleccionada</h3>
          <p style="margin: 0; font-size: 12px;">${location.address}</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">Arrastra el marcador para ajustar la ubicación</p>
        </div>
      `
    });

    newMarker.addListener('click', () => {
      infoWindow.open(mapInstance, newMarker);
    });

    // Evento cuando se arrastra el marcador
    newMarker.addListener('dragend', async () => {
      const position = newMarker.getPosition();
      const draggedLocation = {
        lat: position.lat(),
        lng: position.lng(),
        address: 'Ubicación ajustada en el mapa'
      };

      // Obtener dirección con reverse geocoding
      if (geocoder) {
        try {
          const response = await geocoder.geocode({ location: { lat: draggedLocation.lat, lng: draggedLocation.lng } });
          if (response.results.length > 0) {
            draggedLocation.address = response.results[0].formatted_address;
          }
        } catch (err) {
          console.error('Error en reverse geocoding:', err);
        }
      }

      setSelectedLocation(draggedLocation);
      
      // Actualizar infoWindow
      infoWindow.setContent(`
        <div style="padding: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">Ubicación seleccionada</h3>
          <p style="margin: 0; font-size: 12px;">${draggedLocation.address}</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">Arrastra el marcador para ajustar la ubicación</p>
        </div>
      `);
    });

    setMarker(newMarker);
  }, [marker, geocoder]);

  const initializeMap = useCallback(() => {
    if (!window.google || !mapRef.current) return;

    const google = window.google;
    
    // Crear mapa centrado en Villavicencio
    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
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
      position: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      map: newMap,
      title: 'Nuestra tienda',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    // Crear geocoder
    const newGeocoder = new google.maps.Geocoder();
    setGeocoder(newGeocoder);

    setMap(newMap);

    // Buscar dirección inicial si se proporciona
    if (initialAddress) {
      searchAddress(initialAddress, newMap, newGeocoder);
    }

    // Obtener ubicación actual del usuario
    getUserLocation(newMap);
  }, [initialAddress, searchAddress, getUserLocation, addMarkerToMap, STORE_LOCATION.lat, STORE_LOCATION.lng]);

  // Cargar Google Maps API
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGoogleMaps().then(() => {
        if (isOpen) {
          initializeMap();
        }
      }).catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
    } else if (isLoaded && isOpen) {
      initializeMap();
    }
  }, [isLoaded, isLoading, loadGoogleMaps, isOpen, initializeMap]);

  // Inicializar mapa cuando se abre el modal
  useEffect(() => {
    if (isOpen && mapRef.current && window.google) {
      initializeMap();
    }
  }, [isOpen, initializeMap]);

      // Evento de clic en el mapa
    useEffect(() => {
      if (map && !marker) {
        const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const clickedLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: 'Ubicación seleccionada en el mapa'
        };

        // Obtener dirección con reverse geocoding
        if (geocoder) {
          try {
            const response = await geocoder.geocode({ location: { lat: clickedLocation.lat, lng: clickedLocation.lng } });
            if (response.results.length > 0) {
              clickedLocation.address = response.results[0].formatted_address;
            }
          } catch (err) {
            console.error('Error en reverse geocoding:', err);
          }
        }

        setSelectedLocation(clickedLocation);
        addMarkerToMap(clickedLocation, map);
      });

             return () => {
         window.google.maps.event.removeListener(clickListener);
       };
    }
  }, [map, marker, geocoder, addMarkerToMap]);

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
      map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(16);
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
            {initialAddress && map && geocoder && (
              <button
                onClick={() => searchAddress(initialAddress, map, geocoder)}
                disabled={isLoadingMap}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 text-sm"
              >
                {isLoadingMap ? 'Buscando...' : 'Buscar dirección'}
              </button>
            )}
          </div>

          {/* Error */}
          {mapError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {mapError}
            </div>
          )}

          {/* Mapa */}
          <div 
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