'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ID de Google Analytics (debes reemplazar con tu ID real)
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

// Tipos para eventos personalizados
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// Función para inicializar Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    // Cargar el script de Google Analytics
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Función para rastrear eventos personalizados
export const trackEvent = (event: AnalyticsEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters,
    });
  }
};

// Función para rastrear conversiones
export const trackConversion = (conversionId: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
    });
  }
};

// Hook principal para Google Analytics
export const useAnalytics = () => {
  const pathname = usePathname();

  // Inicializar GA en el primer render
  useEffect(() => {
    initGA();
  }, []);

  // Rastrear cambios de página automáticamente
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_TRACKING_ID, {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname]);

  return {
    trackEvent,
    trackConversion,
  };
};

// Eventos específicos para tu aplicación
export const analyticsEvents = {
  // Verificación de edad
  ageVerificationCompleted: () => trackEvent({
    action: 'age_verification_completed',
    category: 'user_verification',
    label: 'success',
  }),

  ageVerificationRejected: () => trackEvent({
    action: 'age_verification_rejected',
    category: 'user_verification',
    label: 'rejected',
  }),

  // Productos
  productViewed: (productId: string, productName: string, category: string) => trackEvent({
    action: 'product_view',
    category: 'product_interaction',
    label: productName,
    custom_parameters: {
      product_id: productId,
      product_category: category,
    },
  }),

  productShared: (productId: string, productName: string) => trackEvent({
    action: 'product_share',
    category: 'product_interaction',
    label: productName,
    custom_parameters: {
      product_id: productId,
    },
  }),

  whatsappClick: (productId: string, productName: string, price: number) => trackEvent({
    action: 'whatsapp_click',
    category: 'conversion',
    label: productName,
    value: price,
    custom_parameters: {
      product_id: productId,
      conversion_type: 'whatsapp_order',
    },
  }),

  // Búsqueda
  searchPerformed: (query: string, resultsCount: number) => trackEvent({
    action: 'search_performed',
    category: 'search',
    label: query,
    value: resultsCount,
  }),

  // Navegación
  categoryFilterApplied: (categoryId: string, categoryName: string) => trackEvent({
    action: 'category_filter_applied',
    category: 'navigation',
    label: categoryName,
    custom_parameters: {
      category_id: categoryId,
    },
  }),

  // Preload system
  preloadCompleted: (categoriesCount: number, productsCount: number) => trackEvent({
    action: 'preload_completed',
    category: 'performance',
    label: 'success',
    custom_parameters: {
      categories_count: categoriesCount,
      products_count: productsCount,
    },
  }),

  offlineDataUsed: () => trackEvent({
    action: 'offline_data_used',
    category: 'performance',
    label: 'cached_data',
  }),
};

// Declaraciones globales para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
} 