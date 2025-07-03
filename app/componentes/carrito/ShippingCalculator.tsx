'use client';

import React, { useState } from 'react';
import { analyticsEvents } from '../../../hooks/useAnalytics';
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

const SHIPPING_RATES = {
  BASE_COST: 5000,
  PER_KM: 1000,
  MAX_COST: 15000,
  FREE_SHIPPING_THRESHOLD: 100000
};

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
    if (distance <= 2) {
      return SHIPPING_RATES.BASE_COST;
    }
    const additionalKm = distance - 2;
    const cost = SHIPPING_RATES.BASE_COST + (additionalKm * SHIPPING_RATES.PER_KM);
    return Math.min(cost, SHIPPING_RATES.MAX_COST);
  };

  // Geocodificación inversa para obtener dirección textual
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (!response.ok) throw new Error('Error al obtener la dirección');
      const data = await response.json();
      
      // Extraer solo la parte relevante de la dirección (primeras 2 partes)
      const addressParts = data.display_name.split(', ');
      const relevantParts = addressParts.slice(0, 2).join(', ');
      
      return relevantParts || `${lat}, ${lon}`;
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

  // El input solo abre el modal
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
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
            type="text"
            id="shipping-address"
            value={address}
            readOnly
            onFocus={handleInputFocus}
            placeholder="Haz clic para seleccionar tu dirección en el mapa..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer bg-gray-50"
          />
        </div>
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