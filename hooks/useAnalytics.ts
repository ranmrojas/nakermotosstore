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

// Variable para almacenar timers de debounce
const debounceTimers: Record<string, NodeJS.Timeout> = {};

// Función para rastrear eventos con debounce
export const trackEventWithDebounce = (event: AnalyticsEvent, key: string, delay: number = 1500) => {
  if (typeof window !== 'undefined') {
    // Cancelar el timer anterior si existe
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key]);
    }
    
    // Crear un nuevo timer
    debounceTimers[key] = setTimeout(() => {
      trackEvent(event);
      delete debounceTimers[key];
    }, delay);
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
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    // Delay para evitar problemas de hidratación
    const timer = setTimeout(() => {
      initGA();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Rastrear cambios de página automáticamente
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    if (window.gtag) {
      window.gtag('config', GA_TRACKING_ID, {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname]);

  return {
    trackEvent,
    trackEventWithDebounce,
    trackConversion,
  };
};

// Eventos específicos para tu aplicación
export const analyticsEvents = {
  // Productos
  productViewed: (productId: string, productName: string, category: string) => trackEvent({
    action: 'vista_producto',
    category: 'interaccion_producto',
    label: productName,
    custom_parameters: {
      id_producto: productId,
      categoria_producto: category,
    },
  }),

  productDetailView: (productId: string, productName: string, category: string) => trackEvent({
    action: 'vista_detalle_producto',
    category: 'interaccion_producto',
    label: productName,
    custom_parameters: {
      id_producto: productId,
      categoria_producto: category,
      ubicacion: 'modal',
    },
  }),

  productShared: (productId: string, productName: string) => trackEvent({
    action: 'producto_compartido',
    category: 'interaccion_producto',
    label: productName,
    custom_parameters: {
      id_producto: productId,
    },
  }),

  whatsappClick: (productId: string, productName: string, price: number) => trackEvent({
    action: 'clic_whatsapp',
    category: 'conversion',
    label: productName,
    value: price,
    custom_parameters: {
      id_producto: productId,
      tipo_conversion: 'pedido_whatsapp',
    },
  }),

  // Tags en Modal de Producto (Detalle)
  modalCategoryTagClick: (categoryId: string, categoryName: string, productId: string) => trackEvent({
    action: 'clic_tag_categoria_modal',
    category: 'interaccion_etiquetas',
    label: categoryName,
    custom_parameters: {
      id_categoria: categoryId,
      nombre_categoria: categoryName,
      id_producto: productId,
      ubicacion_etiqueta: 'modal_producto',
    },
  }),

  modalBrandTagClick: (brandName: string, productId: string) => trackEvent({
    action: 'clic_tag_marca_modal',
    category: 'interaccion_etiquetas',
    label: brandName,
    custom_parameters: {
      nombre_marca: brandName,
      id_producto: productId,
      ubicacion_etiqueta: 'modal_producto',
    },
  }),

  // Tags en Filtros Superiores
  filterCategoryTagClick: (categoryId: string, categoryName: string, page: string) => trackEvent({
    action: 'clic_tag_categoria_filtro',
    category: 'interaccion_etiquetas',
    label: categoryName,
    custom_parameters: {
      id_categoria: categoryId,
      nombre_categoria: categoryName,
      pagina: page,
      ubicacion_etiqueta: 'barra_filtros',
    },
  }),

  filterBrandTagClick: (brandName: string, page: string) => trackEvent({
    action: 'clic_tag_marca_filtro',
    category: 'interaccion_etiquetas',
    label: brandName,
    custom_parameters: {
      nombre_marca: brandName,
      pagina: page,
      ubicacion_etiqueta: 'barra_filtros',
    },
  }),

  // Tags de Filtros Específicos
  filterTagClick: (filterType: string, filterName: string, page: string) => trackEvent({
    action: 'clic_tag_filtro',
    category: 'interaccion_etiquetas',
    label: filterName,
    custom_parameters: {
      tipo_filtro: filterType,
      nombre_filtro: filterName,
      pagina: page,
      ubicacion_etiqueta: 'barra_filtros',
    },
  }),

  // Búsqueda
  searchPerformed: (query: string, resultsCount: number, page: string) => trackEvent({
    action: 'busqueda_realizada',
    category: 'busqueda',
    label: query,
    value: resultsCount,
    custom_parameters: {
      consulta_busqueda: query,
      cantidad_resultados: resultsCount,
      pagina: page,
    },
  }),

  searchInputUsed: (query: string, page: string) => {
    // Usar debounce para evitar eventos múltiples durante escritura
    const key = `search_${page}`;
    trackEventWithDebounce({
      action: 'campo_busqueda_usado',
      category: 'busqueda',
      label: query,
      custom_parameters: {
        consulta_busqueda: query,
        pagina: page,
        tipo_entrada: 'busqueda_texto',
      },
    }, key, 1500); // Espera 1.5 segundos de inactividad antes de enviar el evento
  },

  // Navegación
  categoryFilterApplied: (categoryId: string, categoryName: string) => trackEvent({
    action: 'filtro_categoria_aplicado',
    category: 'navegacion',
    label: categoryName,
    custom_parameters: {
      id_categoria: categoryId,
    },
  }),

  // Preload system
  preloadCompleted: (categoriesCount: number, productsCount: number) => trackEvent({
    action: 'precarga_completada',
    category: 'rendimiento',
    label: 'exitoso',
    custom_parameters: {
      cantidad_categorias: categoriesCount,
      cantidad_productos: productsCount,
    },
  }),

  offlineDataUsed: () => trackEvent({
    action: 'datos_offline_usados',
    category: 'rendimiento',
    label: 'datos_cache',
  }),

  // Carrito
  addToCart: (productId: string, productName: string, price: number, quantity: number) => trackEvent({
    action: 'producto_agregado_carrito',
    category: 'carrito',
    label: productName,
    value: price * quantity,
    custom_parameters: {
      id_producto: productId,
      nombre_producto: productName,
      precio_unitario: price,
      cantidad: quantity,
      precio_total: price * quantity,
    },
  }),

  removeFromCart: (productId: string) => trackEvent({
    action: 'producto_eliminado_carrito',
    category: 'carrito',
    label: productId,
    custom_parameters: {
      id_producto: productId,
    },
  }),

  updateCartQuantity: (productId: string, quantity: number) => trackEvent({
    action: 'cantidad_actualizada_carrito',
    category: 'carrito',
    label: productId,
    value: quantity,
    custom_parameters: {
      id_producto: productId,
      nueva_cantidad: quantity,
    },
  }),

  cartOpened: (totalItems: number, totalPrice: number) => trackEvent({
    action: 'carrito_abierto',
    category: 'carrito',
    label: 'panel_carrito',
    value: totalPrice,
    custom_parameters: {
      total_items: totalItems,
      precio_total: totalPrice,
    },
  }),

  beginCheckout: (totalItems: number, totalPrice: number) => trackEvent({
    action: 'inicio_checkout',
    category: 'conversion',
    label: 'proceso_compra',
    value: totalPrice,
    custom_parameters: {
      total_items: totalItems,
      precio_total: totalPrice,
    },
  }),

  checkout: (totalItems: number, totalPrice: number, paymentMethod: string) => trackEvent({
    action: 'checkout_completado',
    category: 'conversion',
    label: 'pedido_whatsapp',
    value: totalPrice,
    custom_parameters: {
      total_items: totalItems,
      precio_total: totalPrice,
      metodo_pago: paymentMethod,
      tipo_pedido: 'whatsapp',
    },
  }),

  purchase: (orderId: string, totalItems: number, totalPrice: number, paymentMethod: string) => trackEvent({
    action: 'compra_completada',
    category: 'conversion',
    label: orderId,
    value: totalPrice,
    custom_parameters: {
      id_pedido: orderId,
      total_items: totalItems,
      precio_total: totalPrice,
      metodo_pago: paymentMethod,
      tipo_pedido: 'whatsapp',
    },
  }),

  // Envío y dirección
  addressSelected: (address: string, distance: number, cost: number) => trackEvent({
    action: 'direccion_seleccionada',
    category: 'envio',
    label: address,
    value: cost,
    custom_parameters: {
      direccion: address,
      distancia_km: distance,
      costo_envio: cost,
      ciudad: 'Villavicencio',
    },
  }),

  shippingConfirmed: (address: string, cost: number) => trackEvent({
    action: 'envio_confirmado',
    category: 'envio',
    label: address,
    value: cost,
    custom_parameters: {
      direccion: address,
      costo_envio: cost,
      ciudad: 'Villavicencio',
    },
  }),

  shippingCalculated: (address: string, distance: number, cost: number) => trackEvent({
    action: 'envio_calculado',
    category: 'envio',
    label: address,
    value: cost,
    custom_parameters: {
      direccion: address,
      distancia_km: distance,
      costo_envio: cost,
      ciudad: 'Villavicencio',
    },
  }),
};

// Declaraciones globales para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}