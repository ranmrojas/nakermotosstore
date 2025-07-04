'use client';

import { useState, useEffect, useCallback } from 'react';

interface GoogleMapsState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Variable global para rastrear el estado de carga
let googleMapsState: GoogleMapsState = {
  isLoaded: false,
  isLoading: false,
  error: null
};

// Promesa para manejar la carga
let loadPromise: Promise<void> | null = null;

export const useGoogleMaps = () => {
  const [state, setState] = useState<GoogleMapsState>(googleMapsState);

  const loadGoogleMaps = useCallback(async (): Promise<void> => {
    // Si ya está cargado, retornar inmediatamente
    if (googleMapsState.isLoaded) {
      return;
    }

    // Si ya está cargando, esperar a que termine
    if (googleMapsState.isLoading && loadPromise) {
      return loadPromise;
    }

    // Si hay un error, no intentar cargar de nuevo
    if (googleMapsState.error) {
      throw new Error(googleMapsState.error);
    }

    // Iniciar carga
    googleMapsState.isLoading = true;
    setState(prev => ({ ...prev, isLoading: true }));

    loadPromise = new Promise<void>((resolve, reject) => {
      // Verificar si ya existe el script
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Si el script existe, esperar a que se cargue
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            googleMapsState.isLoaded = true;
            googleMapsState.isLoading = false;
            setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

      // Crear y cargar el script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        googleMapsState.isLoaded = true;
        googleMapsState.isLoading = false;
        setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
        resolve();
      };
      
      script.onerror = () => {
        const error = 'Error al cargar Google Maps API';
        googleMapsState.error = error;
        googleMapsState.isLoading = false;
        setState(prev => ({ ...prev, error, isLoading: false }));
        reject(new Error(error));
      };

      document.head.appendChild(script);
    });

    return loadPromise;
  }, []);

  useEffect(() => {
    // Sincronizar el estado local con el global
    setState(googleMapsState);
  }, []);

  return {
    ...state,
    loadGoogleMaps
  };
}; 