# Sistema de Preload Silencioso

## Descripción General

El sistema de preload silencioso está diseñado para cargar datos en segundo plano después de la verificación de edad, optimizando la experiencia del usuario al navegar entre páginas.

## Componentes del Sistema

### 1. `preloadService.ts`
- **Ubicación**: `lib/preloadService.ts`
- **Función**: Servicio principal que maneja la carga silenciosa de datos
- **Características**:
  - Carga categorías desde la API
  - Sincroniza productos de categorías específicas
  - Ejecuta en segundo plano sin bloquear la UI
  - Maneja errores de forma silenciosa

### 2. `usePreload.ts`
- **Ubicación**: `hooks/usePreload.ts`
- **Función**: Hook personalizado para manejar el estado del preload
- **Características**:
  - Proporciona estado del preload (completo, en progreso)
  - Permite iniciar preload manualmente
  - Monitorea el progreso

### 3. `PreloadOptimizer.tsx`
- **Ubicación**: `app/componentes/ui/PreloadOptimizer.tsx`
- **Función**: Componente wrapper que optimiza el preload
- **Características**:
  - Se ejecuta automáticamente en el layout principal
  - No renderiza nada visible
  - Inicia preload automáticamente

## Flujo de Ejecución

### 1. Verificación de Edad
```typescript
// app/page.tsx
const checkAgeAndPreload = async () => {
  // Verificación de edad eliminada - acceso directo permitido
  
  // Iniciar preload silencioso
  if (!preloadService.isCompleted() && !preloadService.isInProgress()) {
    preloadService.startSilentPreload();
  }
};
```

### 2. Preload Automático
```typescript
// app/layout.tsx
<PreloadOptimizer autoStart={true}>
  {children}
</PreloadOptimizer>
```

### 3. Optimización de Páginas
```typescript
// En cada página (productos, vape, busqueda)
const { isPreloadComplete } = usePreload();

useEffect(() => {
  if (!isPreloadComplete) {
    // Cargar datos normalmente
  } else {
    // Datos ya precargados, cargar desde caché
  }
}, [isPreloadComplete]);
```

## Datos Precargados

### Categorías
- Todas las categorías activas desde `/api/categorias`

### Productos por Página

#### `/productos`
- Cerveza (ID: 15)
- Aguardiente (ID: 7)
- Gaseosa (ID: 8)
- Whisky (ID: 33)
- Gomitas (ID: 51)

#### `/vape`
- Desechables (ID: 61)
- Cápsulas (ID: 62)
- Baterías (ID: 63)

#### `/busqueda`
- Cerveza (ID: 15)
- Aguardiente (ID: 7)
- Gaseosa (ID: 8)
- Gomitas (ID: 51)
- Whisky (ID: 33)

## Beneficios

### 1. Rendimiento
- **Carga instantánea**: Los datos ya están en IndexedDB
- **Sin esperas**: No hay loading spinners en las páginas principales
- **Navegación fluida**: Transiciones suaves entre páginas

### 2. Experiencia de Usuario
- **Transparente**: El usuario no ve ningún proceso de carga
- **Consistente**: Misma experiencia en todas las páginas
- **Offline-friendly**: Funciona con datos locales

### 3. Optimización de Recursos
- **Sincronización inteligente**: Solo actualiza datos necesarios
- **Caché eficiente**: Reutiliza datos entre páginas
- **Reducción de requests**: Menos llamadas al API

## Configuración

### Habilitar/Deshabilitar
```typescript
// En preloadService.ts
const config: PreloadConfig = {
  enabled: true,      // Habilitar/deshabilitar preload
  silent: true,       // Modo silencioso (sin logs)
  priority: 'medium'  // Prioridad de ejecución
};
```

### Personalizar Categorías
```typescript
// En preloadService.ts - método preloadProductosPrincipales()
const categoriasPrincipales = [
  { id: 15, nombre: 'Cerveza' },
  { id: 7, nombre: 'Aguardiente' },
  // Agregar más categorías según necesidad
];
```

## Monitoreo y Debugging

### Logs de Consola
- `🚀 Iniciando preload silencioso de datos...`
- `📋 Preload: X categorías cargadas`
- `📦 Preload: Productos principales sincronizados`
- `💨 Preload: Productos de vape sincronizados`
- `🔍 Preload: Productos de búsqueda sincronizados`
- `✅ Preload silencioso completado`

### Estado del Preload
```typescript
const status = preloadService.getStatus();
console.log(status);
// {
//   isPreloading: false,
//   isCompleted: true,
//   config: { enabled: true, silent: true, priority: 'medium' }
// }
```

## Consideraciones Técnicas

### 1. IndexedDB
- Los datos se almacenan localmente en el navegador
- Persisten entre sesiones
- Se actualizan automáticamente

### 2. Sincronización
- Usa `productosSyncService.syncProductosInteligente()`
- Solo sincroniza categorías que necesitan actualización
- Maneja errores de red de forma silenciosa

### 3. Memoria
- Los datos se cargan progresivamente
- No hay límite de memoria específico
- Se limpian automáticamente cuando es necesario

## Troubleshooting

### Preload no se ejecuta
1. Verificar que la edad esté verificada
2. Revisar logs de consola para errores
3. Verificar conectividad de red

### Datos no se cargan
1. Verificar estado de IndexedDB
2. Revisar permisos del navegador
3. Limpiar caché del navegador

### Rendimiento lento
1. Verificar cantidad de categorías precargadas
2. Revisar tamaño de datos en IndexedDB
3. Optimizar sincronización de categorías 