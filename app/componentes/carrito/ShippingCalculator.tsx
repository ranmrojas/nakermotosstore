'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { analyticsEvents } from '../../../hooks/useAnalytics';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';
import InteractiveMap from './InteractiveMap';

interface Address {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapLocation {
  lat: number;
  lng: number;
  address: string;
}

interface ShippingCalculatorProps {
  onShippingCalculated: (address: string, cost: number, distance?: number) => void;
  onAddressChange: (address: string) => void;
  currentAddress?: string;
  currentShippingCost?: number;
}

// Coordenadas de la tienda en Villavicencio
const STORE_LOCATION = {
  lat: 4.126551,
  lon: -73.632540
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FREE_SHIPPING_THRESHOLD = 100000;

// Rangos de distancia y costos de envío
const SHIPPING_ZONES = [
  { min: 0, max: 0.5, cost: 4500 },
  { min: 0.5, max: 0.750, cost: 5000 },
  { min: 0.750, max: 1.2, cost: 6000 },
  { min: 1.2, max: 1.8, cost: 7000 },
  { min: 1.8, max: 2.4, cost: 9000 },
  { min: 2.4, max: 3, cost: 10000 },
  { min: 3, max: 4, cost: 11000 },
  { min: 4, max: 6, cost: 12000 },
  { min: 7, max: 8, cost: 14000 }
];



export default function ShippingCalculator({ 
  onShippingCalculated, 
  onAddressChange,
  currentAddress = '',
  currentShippingCost = 0
}: ShippingCalculatorProps) {
  const [address, setAddress] = useState(currentAddress);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingCost, setShippingCost] = useState(currentShippingCost);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [finalAddress, setFinalAddress] = useState('');
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, isLoading, loadGoogleMaps } = useGoogleMaps();

  const initializeAutocomplete = useCallback(() => {
    if (!window.google || !inputRef.current) return;

    const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'co' },
      types: ['address'],
      fields: ['formatted_address', 'geometry', 'place_id'],
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(4.0, -73.7), // Suroeste de Villavicencio
        new window.google.maps.LatLng(4.3, -73.5)  // Noreste de Villavicencio
      ),
      strictBounds: true
    });

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address
        };
        
        setAddress(place.formatted_address);
        setSelectedAddress({
          display_name: place.formatted_address,
          lat: location.lat.toString(),
          lon: location.lng.toString()
        });
        setHasSelectedSuggestion(true);
        
        // Calcular envío
        const distance = calculateDistance(
          STORE_LOCATION.lat,
          STORE_LOCATION.lon,
          location.lat,
          location.lng
        );
        const cost = calculateShippingCost(distance);
        setShippingCost(cost);
        
        onAddressChange(place.formatted_address);
        onShippingCalculated(place.formatted_address, cost, distance);
        
        analyticsEvents.addressSelected(place.formatted_address, distance, cost);
      }
    });

    // Autocomplete instance is stored in the DOM element
  }, [onAddressChange, onShippingCalculated]);

  // Cargar Google Maps API
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadGoogleMaps().then(() => {
        initializeAutocomplete();
      }).catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
    } else if (isLoaded) {
      initializeAutocomplete();
    }
  }, [isLoaded, isLoading, loadGoogleMaps, initializeAutocomplete]);

  // Calcular distancia usando la fórmula de Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calcular costo de envío basado en la distancia
  const calculateShippingCost = (distance: number): number => {
    // Buscar la zona correspondiente a la distancia
    const zone = SHIPPING_ZONES.find(z => distance >= z.min && distance <= z.max);
    
    if (zone) {
      return zone.cost;
    }
    
    // Si la distancia es mayor a 8km, usar el costo máximo
    if (distance > 8) {
      return SHIPPING_ZONES[SHIPPING_ZONES.length - 1].cost;
    }
    
    // Si la distancia es menor a 0km, usar el costo mínimo
    return SHIPPING_ZONES[0].cost;
  };

  // Geocodificación inversa para obtener dirección textual
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng: lon } });
      
      if (response.results.length > 0) {
        return response.results[0].formatted_address;
      }
      return `${lat}, ${lon}`;
    } catch {
      return `${lat}, ${lon}`;
    }
  };

  // Cuando el usuario confirma en el mapa
  const handleMapConfirm = async (location: MapLocation) => {
    const distance = calculateDistance(
      STORE_LOCATION.lat,
      STORE_LOCATION.lon,
      location.lat,
      location.lng
    );
    const cost = calculateShippingCost(distance);
    // Geocodificación inversa
    const dir = await reverseGeocode(location.lat, location.lng);
    
    setFinalAddress(dir);
    setSelectedAddress({
      display_name: dir,
      lat: location.lat.toString(),
      lon: location.lng.toString()
    });
    setShippingCost(cost);
    setShowMapModal(false);
    setShowConfirmModal(true);
  };

  // Cuando el usuario confirma la dirección final
  const handleConfirmFinalAddress = () => {
    if (finalAddress.trim()) {
      setAddress(finalAddress);
      onAddressChange(finalAddress);
      onShippingCalculated(finalAddress, shippingCost, selectedAddress ? calculateDistance(
        STORE_LOCATION.lat,
        STORE_LOCATION.lon,
        parseFloat(selectedAddress.lat),
        parseFloat(selectedAddress.lon)
      ) : 0);
      setShowConfirmModal(false);
      analyticsEvents.addressSelected(finalAddress, selectedAddress ? calculateDistance(
        STORE_LOCATION.lat,
        STORE_LOCATION.lon,
        parseFloat(selectedAddress.lat),
        parseFloat(selectedAddress.lon)
      ) : 0, shippingCost);
    }
  };

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setHasSelectedSuggestion(false);
  };

  // Abrir modal del mapa
  const handleOpenMap = () => {
    setShowMapModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 mb-1">
          Dirección de envío (Villavicencio)
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id="shipping-address"
            value={address}
            onChange={handleInputChange}
            placeholder="Escribe tu dirección en Villavicencio..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        {/* Botón para confirmar dirección manualmente */}
        {address && !hasSelectedSuggestion && (
          <button
            type="button"
            onClick={handleOpenMap}
            className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium"
          >
            Confirmar dirección en el mapa
          </button>
        )}
      </div>

      {shippingCost > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">
              Costo de envío calculado
            </span>
            <span className="text-lg font-bold text-green-600">
              ${shippingCost.toLocaleString('es-CO')}
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Dirección: {selectedAddress?.display_name}
          </p>
        </div>
      )}

      {/* Modal del mapa interactivo */}
      <InteractiveMap
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onConfirm={handleMapConfirm}
        initialAddress={address}
      />

      {/* Modal de confirmación de dirección */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar dirección de envío
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección detectada:
                </label>
                <input
                  type="text"
                  value={finalAddress}
                  onChange={(e) => setFinalAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Edita la dirección si es necesario..."
                />
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">
                    Costo de envío calculado
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${shippingCost.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>• Revisa y edita la dirección si es necesario</p>
                <p>• Esta dirección se usará para el cálculo del domicilio</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowMapModal(true);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Ajustar ubicación
              </button>
              <button
                onClick={handleConfirmFinalAddress}
                disabled={!finalAddress.trim()}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirmar dirección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 