# Sistema de IndexedDB para Productos y Categorías

Este sistema proporciona almacenamiento local de productos y categorías con **sincronización inteligente y automática** para mantener los datos actualizados sin afectar la experiencia de usuario.

## 🏗️ Arquitectura

### **Componentes:**

1. **`database.ts`** - Servicio de IndexedDB
   - Maneja la conexión a la base de datos local
   - Operaciones CRUD para productos y categorías
   - Gestión de metadata

2. **`productosSyncService.ts`** - Servicio de Sincronización de Productos
   - **Sincronización inteligente** (solo categorías que necesitan actualización)
   - **Sincronización automática cada 15 minutos**
   - **Sincronización rápida cada 5 minutos**
   - Comunicación con el API
   - Gestión de timestamps

3. **`preciosService.ts`** - Servicio de Precios en Tiempo Real
   - **Obtiene precios directamente del API** (no de IndexedDB)
   - **Cache de 5 minutos** para optimizar rendimiento
   - **Siempre precios actualizados** para mejor UX

4. **`useProductos.ts`** - Hook Personalizado
   - Interfaz principal para componentes
   - **Carga rápida desde IndexedDB**
   - **Precios en tiempo real del API**
   - Estados de carga y error
   - Funciones de utilidad

## 🚀 Uso del Hook

### **Importación:**
```typescript
import { useProductos } from '../hooks/useProductos';
```

### **Uso Básico:**
```typescript
const MiComponente = () => {
  const { 
    productos, 
    loading, 
    error, 
    syncing,
    stats 
  } = useProductos();

  // Los productos se muestran inmediatamente desde IndexedDB
  // Si no hay productos, se muestra un skeleton de 20 productos
  return (
    <div>
      <h2>Productos ({stats.totalProductos})</h2>
      {productos.map(producto => (
        <div key={producto.id_producto}>
          <h3>{producto.nombre}</h3>
          <p>Precio: ${producto.precio_final || producto.precio_venta_real || producto.precio_venta}</p>
        </div>
      ))}
    </div>
  );
};
```

### **Sistema de Skeleton:**
- **SkeletonGrid**: Componente reutilizable que muestra skeletons de productos
- **ProductSkeleton**: Wrapper específico para productos que usa SkeletonGrid
- **Se muestra automáticamente** cuando no hay productos disponibles
- **Animación suave** con `animate-pulse` para mejor UX
- **Diseño responsivo** que se adapta a diferentes tamaños de pantalla
- **Configurable** - permite personalizar cantidad y columnas

### **Uso del SkeletonGrid:**
```typescript
import SkeletonGrid from '@/app/componentes/ui/SkeletonGrid';

// Uso básico - 20 productos con grid responsivo por defecto
<SkeletonGrid />

// Personalizar cantidad y columnas
<SkeletonGrid 
  count={12} 
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
/>

// Para móviles - 1 columna, tablets - 2 columnas, desktop - 3 columnas
<SkeletonGrid 
  count={6} 
  columns={{ sm: 1, md: 2, lg: 3 }}
  className="mt-4"
/>
```

### **Funciones Disponibles:**

#### **Estados:**
- `productos` - Array de productos (se cargan inmediatamente desde IndexedDB)
- `loading` - Estado de carga inicial (solo true si no hay productos locales)
- `error` - Mensaje de error (si existe)
- `syncing` - Estado de sincronización (no bloquea la UI)

#### **Funciones Principales:**
- `getProductosByCategoria(categoriaId)` - Obtiene productos de una categoría (carga rápida desde IndexedDB + precios en tiempo real)
- `searchProductos(query)` - Búsqueda de productos
- `getProductosTiendaOnline()` - Productos para tienda online

#### **Funciones de Sincronización:**
- `forceSyncCategoria(categoriaId)` - Sincronización forzada de categoría
- `forceSyncAll()` - Sincronización forzada de todas las categorías
- `startAutoSync(categorias)` - Iniciar sincronización automática
- `stopAutoSync()` - Detener sincronización automática
- `smartSync(categorias)` - Sincronización inteligente
- `quickSyncCategoria(categoriaId)` - Sincronización rápida

#### **Funciones de Precios en Tiempo Real:**
- `actualizarPreciosCategoria(categoriaId)` - Actualizar precios de una categoría
- `actualizarPreciosProducto(productoId, categoriaId)` - Actualizar precio de un producto
- `getPrecioProducto(productoId, categoriaId)` - Obtener precio específico

#### **Utilidades:**
- `getProductoById(id)` - Obtener producto por ID
- `getProductosConPromocion()` - Productos con promociones activas
- `getProductosDisponibles()` - Productos disponibles

#### **Estadísticas:**
- `stats.totalProductos` - Total de productos
- `stats.categoriasConProductos` - Categorías con productos
- `stats.productosTiendaOnline` - Productos para tienda online
- `stats.lastSync` - Última sincronización
- `stats.isSyncing` - Si está sincronizando
- `stats.isAutoSyncActive` - Si la sincronización automática está activa
- `stats.preciosCacheStats` - Estadísticas del cache de precios
- `stats.syncConfig` - Configuración de sincronización

## 🔄 Flujo de Sincronización

### **Al Cargar Página de Productos:**
1. Usuario abre la página de productos
2. **Los productos se muestran inmediatamente desde IndexedDB** (sin esperas)
3. **Se ejecuta sincronización inteligente** en background
4. Solo se sincronizan categorías que necesitan actualización
5. **Excelente experiencia de usuario** - productos visibles instantáneamente

### **Al Obtener Productos por Categoría:**
1. Se llama `getProductosByCategoria(categoriaId)`
2. **Primero intenta cargar desde IndexedDB** (instantáneo)
3. **Obtiene precios en tiempo real del API** (en background)
4. Retorna productos inmediatamente si están disponibles
5. **UX optimizada** - carga rápida + precios actualizados

### **Sincronización Automática:**
- **Cada 15 minutos** se ejecuta automáticamente en background
- Solo sincroniza categorías que necesitan actualización
- **No interrumpe la experiencia del usuario**
- Mantiene datos actualizados sin afectar rendimiento

### **Sincronización Rápida:**
- **Cada 5 minutos** para categorías específicas
- Ideal para datos que cambian frecuentemente
- Evita sincronizaciones innecesarias

## 💰 Sistema de Precios en Tiempo Real

### **Características:**
- **Los precios NO se guardan en IndexedDB** - siempre se obtienen del API
- **Cache de 5 minutos** para optimizar rendimiento
- **Precios siempre actualizados** para mejor UX
- **Manejo de promociones** en tiempo real

### **Campos de Precios:**
- `precio_venta_real` - Precio de venta en tiempo real
- `precio_venta_online_real` - Precio online en tiempo real
- `precio_promocion_online_real` - Precio de promoción en tiempo real
- `tiene_promocion_activa` - Si tiene promoción activa
- `precio_final` - Precio final (considerando promociones)
- `precio_formateado` - Precio formateado para mostrar
- `precios_actualizados` - Si los precios están actualizados

### **Uso en Componentes:**
```typescript
// Función helper para obtener el precio correcto
const getPrecioCorrecto = (producto) => {
  if (producto.precios_actualizados && producto.precio_final !== undefined) {
    return producto.precio_final;
  }
  if (producto.precio_venta_online_real !== undefined && producto.precio_venta_online_real !== null) {
    return producto.precio_venta_online_real;
  }
  if (producto.precio_venta_real !== undefined) {
    return producto.precio_venta_real;
  }
  return producto.precio_venta_online !== null ? producto.precio_venta_online : producto.precio_venta;
};
```

## 📊 Configuración de Sincronización

### **Intervalos:**
- **Sincronización normal**: 30 minutos
- **Sincronización rápida**: 5 minutos
- **Sincronización automática**: 15 minutos

### **Comportamiento:**
- **Carga inmediata**: Productos se muestran desde IndexedDB sin esperas
- **Sincronización inteligente**: Solo actualiza lo necesario
- **Sincronización automática**: En background sin interrupciones
- **Sincronización forzada**: Disponible cuando se necesita

## ⚙️ Configuración

### **Base de Datos:**
- Nombre: `lzfDB`
- Versión: 2
- Stores: `categorias`, `productos`, `metadata`

### **Índices de Productos:**
- `id_categoria` - Búsqueda por categoría
- `nombre` - Búsqueda por nombre
- `alias` - Búsqueda por alias
- `mostrar_tienda_linea` - Filtro de tienda online
- `es_servicio` - Filtro de servicios
- `id_marca` - Búsqueda por marca
- **NOTA**: Los índices de precios fueron eliminados ya que los precios se obtienen del API

## 🛠️ Funciones Avanzadas

### **Sincronización Forzada (cuando se necesita):**
```typescript
const { forceSyncCategoria, forceSyncAll } = useProductos();

// Forzar sincronización de categoría específica
await forceSyncCategoria(5);

// Forzar sincronización de todas las categorías
await forceSyncAll();
```

### **Sincronización Automática:**
```typescript
const { startAutoSync, stopAutoSync } = useProductos();

// Iniciar sincronización automática
startAutoSync(categorias);

// Detener sincronización automática
stopAutoSync();
```

### **Sincronización Inteligente:**
```typescript
const { smartSync } = useProductos();

// Sincronización inteligente (clasifica por prioridad)
await smartSync(categorias);
```

### **Actualización de Precios:**
```typescript
const { actualizarPreciosCategoria, actualizarPreciosProducto } = useProductos();

// Actualizar precios de una categoría
await actualizarPreciosCategoria(5);

// Actualizar precio de un producto específico
await actualizarPreciosProducto(123, 5);
```

## 🔍 Debugging

### **Logs en Consola:**
- `🚀 Iniciando descarga silenciosa...`
- `📋 Descargando productos de X categorías...`
- `✅ Descarga silenciosa de productos completada`
- `📦 Productos cargados desde IndexedDB`
- `🔄 No hay productos locales, sincronizando...`
- `💰 Precios obtenidos para X productos de categoría Y`
- `🚀 Sincronización automática iniciada`
- `⏹️ Sincronización automática detenida`

### **Verificar Estado:**
```typescript
const { stats } = useProductos();
console.log('Estado de sincronización:', stats);
console.log('Cache de precios:', stats.preciosCacheStats);
```

## 📈 Ventajas del Sistema

- **Excelente UX**: Productos se muestran inmediatamente desde IndexedDB
- **Skeleton inteligente**: Muestra 20 productos de skeleton mientras cargan los productos reales
- **Sin mensajes de carga**: No hay "Cargando..." que bloqueen la interfaz
- **Datos actualizados**: Sincronización inteligente en background
- **Precios en tiempo real**: Siempre actualizados desde el API
- **Rendimiento optimizado**: Múltiples niveles de sincronización
- **Sin interrupciones**: Sincronización automática no afecta al usuario
- **Flexibilidad**: Control total sobre cuándo sincronizar
- **Robustez**: Manejo de errores y recuperación automática 