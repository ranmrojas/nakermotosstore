# Configuración de Google Analytics

## Descripción

Este documento describe la implementación de Google Analytics 4 (GA4) en la aplicación de Naker Motos.

## Eventos Implementados

### 1. Verificación de Edad
- **`age_verification_completed`**: Usuario confirma ser mayor de edad
- **`age_verification_rejected`**: Usuario indica ser menor de edad

### 2. Interacciones con Productos
- **`product_view`**: Usuario ve un producto específico
- **`product_share`**: Usuario comparte un producto
- **`whatsapp_click`**: Usuario hace clic en el botón de WhatsApp (conversión)

### 3. Búsqueda y Navegación
- **`search_performed`**: Usuario realiza una búsqueda
- **`category_filter_applied`**: Usuario filtra por categoría

### 4. Rendimiento del Sistema
- **`preload_completed`**: Sistema de preload completado
- **`offline_data_used`**: Datos offline utilizados

## Configuración Inicial

### 1. Crear cuenta de Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Crea una nueva propiedad para tu sitio web
3. Selecciona "Web" como plataforma
4. Configura la propiedad con los datos de tu sitio

### 2. Obtener el ID de medición

1. En Google Analytics, ve a **Administrador** > **Propiedad** > **Configuración de la propiedad**
2. Copia el **ID de medición** (formato: G-XXXXXXXXXX)

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Google Analytics Configuration
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Otras configuraciones de analytics (opcional)
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

**⚠️ IMPORTANTE**: Reemplaza `G-XXXXXXXXXX` con tu ID real de Google Analytics.

## Uso del Hook de Analytics

### Importar el hook

```typescript
import { useAnalytics, analyticsEvents } from '../hooks/useAnalytics';
```

### Rastrear eventos personalizados

```typescript
// Evento básico
analyticsEvents.productViewed('123', 'Cerveza Corona', 'Cerveza');

// Evento de conversión
analyticsEvents.whatsappClick('123', 'Cerveza Corona', 5000);

// Evento de verificación
// Evento de verificación de edad completada (eliminado)
```

### Eventos automáticos

El hook `useAnalytics` rastrea automáticamente:
- Cambios de página
- Tiempo en página
- Fuente de tráfico

## Configuración de Objetivos en GA4

### 1. Objetivo de Verificación de Edad

1. Ve a **Configurar** > **Eventos** > **Crear evento personalizado**
2. Nombre: `age_verification_completed`
3. Marca como **Conversión**

### 2. Objetivo de WhatsApp

1. Ve a **Configurar** > **Eventos** > **Crear evento personalizado**
2. Nombre: `whatsapp_click`
3. Marca como **Conversión**

### 3. Objetivo de Compartir Producto

1. Ve a **Configurar** > **Eventos** > **Crear evento personalizado**
2. Nombre: `product_share`
3. Marca como **Conversión**

## Métricas Clave a Monitorear

### Conversiones
- **Tasa de verificación de edad**: `age_verification_completed / sessions`
- **Tasa de conversión WhatsApp**: `whatsapp_click / product_view`
- **Tasa de compartir**: `product_share / product_view`

### Comportamiento
- **Productos más vistos**: Análisis de `product_view`
- **Categorías más populares**: Análisis de `category_filter_applied`
- **Búsquedas más comunes**: Análisis de `search_performed`

### Rendimiento
- **Efectividad del preload**: `preload_completed` vs tiempo de carga
- **Uso de datos offline**: Frecuencia de `offline_data_used`

## Reportes Recomendados

### 1. Embudo de Conversión
1. **Entrada**: Sesiones totales
2. **Verificación**: `age_verification_completed`
3. **Navegación**: `product_view`
4. **Conversión**: `whatsapp_click`

### 2. Análisis de Productos
- Productos más vistos
- Productos más compartidos
- Productos con mayor conversión

### 3. Análisis de Rendimiento
- Tiempo de carga por página
- Efectividad del sistema de preload
- Uso de datos offline

## Debugging

### Verificar que GA esté funcionando

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network**
3. Busca requests a `google-analytics.com` o `googletagmanager.com`
4. Verifica que se envíen eventos en la consola

### Verificar eventos en tiempo real

1. En Google Analytics, ve a **Informes** > **Tiempo real**
2. Realiza acciones en tu sitio
3. Verifica que aparezcan los eventos

## Consideraciones de Privacidad

### Cumplimiento GDPR

- Los eventos no rastrean información personal identificable
- Se respeta la configuración de cookies del navegador
- Los usuarios pueden deshabilitar el tracking

### Configuración de Consentimiento

Para implementar consentimiento de cookies:

```typescript
// Solo rastrear si el usuario ha dado consentimiento
if (userConsent) {
  analyticsEvents.productViewed('123', 'Producto', 'Categoría');
}
```

## Troubleshooting

### Problema: No se envían eventos

**Solución**:
1. Verifica que `NEXT_PUBLIC_GA_ID` esté configurado correctamente
2. Asegúrate de que el ID tenga el formato `G-XXXXXXXXXX`
3. Verifica que no haya bloqueadores de anuncios activos

### Problema: Eventos duplicados

**Solución**:
1. Verifica que `useAnalytics` solo se llame una vez en el layout
2. Asegúrate de que no haya múltiples inicializaciones de GA

### Problema: Eventos no aparecen en tiempo real

**Solución**:
1. Espera 24-48 horas para que aparezcan en los reportes
2. Verifica en **Tiempo real** para confirmar que se envían
3. Revisa la configuración de filtros en GA

## Próximos Pasos

### Fase 2: Eventos Avanzados
- Tracking de scroll
- Tracking de tiempo en página
- Eventos de error

### Fase 3: Optimización
- A/B testing
- Optimización de conversiones
- Reportes personalizados 