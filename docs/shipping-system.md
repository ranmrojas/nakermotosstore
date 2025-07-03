# Sistema de Cálculo de Envío - Villavicencio

## Descripción

Sistema automatizado para calcular el costo de envío en Villavicencio, Meta, Colombia. Utiliza OpenStreetMap para geocodificación y cálculo de distancias.

## Componentes

### 1. ShippingCalculator
- **Ubicación**: `app/componentes/carrito/ShippingCalculator.tsx`
- **Función**: Componente principal para calcular envíos
- **Características**:
  - Autocompletado de direcciones usando Nominatim (OpenStreetMap)
  - Cálculo automático de distancia usando fórmula de Haversine
  - Modal de confirmación de dirección
  - Integración con analytics

### 2. StoreMap
- **Ubicación**: `app/componentes/carrito/StoreMap.tsx`
- **Función**: Muestra la ubicación de la tienda en un mapa
- **Características**:
  - Mapa embebido de OpenStreetMap
  - Marcador de la ubicación de la tienda
  - Información de cobertura

### 3. DistanceInfo
- **Ubicación**: `app/componentes/carrito/DistanceInfo.tsx`
- **Función**: Muestra información detallada del envío
- **Características**:
  - Zonas de envío (Centro, Media, Extendida)
  - Tiempos estimados de entrega
  - Información adicional del servicio

### 4. useShipping Hook
- **Ubicación**: `hooks/useShipping.ts`
- **Función**: Hook personalizado para manejar estado del envío
- **Características**:
  - Estado del envío (dirección, costo, distancia)
  - Funciones para actualizar y limpiar información

## Configuración

### Ubicación de la tienda
```typescript
const STORE_LOCATION = {
  lat: 4.126551,
  lon: -73.632540
};
```

### Tarifas de envío
```typescript
const SHIPPING_RATES = {
  BASE_COST: 5000,        // Costo base hasta 2km
  PER_KM: 1000,          // Costo por km adicional
  MAX_COST: 15000,       // Costo máximo
  FREE_SHIPPING_THRESHOLD: 100000 // Pedido mínimo para envío gratis
};
```

## Zonas de envío

| Zona | Distancia | Tiempo estimado | Descripción |
|------|-----------|-----------------|-------------|
| Zona 1 - Centro | 0-2 km | 1-2 horas | Envío rápido |
| Zona 2 - Media | 2-5 km | 2-3 horas | Envío estándar |
| Zona 3 - Extendida | 5+ km | 3-4 horas | Envío extendido |

## Uso

### Implementación básica
```tsx
import ShippingCalculator from '../componentes/carrito/ShippingCalculator';

<ShippingCalculator
  onShippingCalculated={(address, cost, distance) => {
    console.log('Envío calculado:', { address, cost, distance });
  }}
  onAddressChange={(address) => {
    console.log('Dirección cambiada:', address);
  }}
/>
```

### Con hook personalizado
```tsx
import { useShipping } from '../../../hooks/useShipping';

const { shippingInfo, updateShippingInfo, updateAddress } = useShipping();

<ShippingCalculator
  onShippingCalculated={updateShippingInfo}
  onAddressChange={updateAddress}
  currentAddress={shippingInfo.address}
  currentShippingCost={shippingInfo.cost}
/>
```

## API Externa

### Nominatim (OpenStreetMap)
- **URL**: `https://nominatim.openstreetmap.org/search`
- **Función**: Geocodificación de direcciones
- **Parámetros**:
  - `q`: Consulta de búsqueda
  - `format`: json
  - `limit`: 5 (máximo de resultados)
  - `countrycodes`: co (Colombia)
  - `state`: Meta
  - `city`: Villavicencio

### Ejemplo de respuesta
```json
{
  "display_name": "Calle 40 #25-15, Villavicencio, Meta, Colombia",
  "lat": "4.126551",
  "lon": "-73.632540"
}
```

## Cálculo de distancia

### Fórmula de Haversine
```typescript
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

## Analytics

### Eventos rastreados
- `addressSelected`: Cuando se selecciona una dirección
- `shippingConfirmed`: Cuando se confirma el envío
- `shippingCalculated`: Cuando se calcula el costo

### Parámetros incluidos
- Dirección completa
- Distancia en kilómetros
- Costo del envío
- Ciudad (Villavicencio)

## Página de prueba

### URL
`/envio`

### Características
- Demostración completa del sistema
- Mapa de la ubicación de la tienda
- Información detallada de tarifas
- Instrucciones de uso

## Limitaciones

1. **Cobertura**: Solo Villavicencio, Meta, Colombia
2. **API externa**: Depende de Nominatim (OpenStreetMap)
3. **Precisión**: Basada en coordenadas GPS de OpenStreetMap
4. **Tarifas**: Configuración estática (no dinámica)

## Futuras mejoras

1. **Caché de direcciones**: Evitar consultas repetidas
2. **Tarifas dinámicas**: Basadas en demanda/hora
3. **Múltiples puntos de entrega**: Más ubicaciones de tienda
4. **Optimización de rutas**: Para múltiples entregas
5. **Integración con GPS**: Ubicación automática del usuario 