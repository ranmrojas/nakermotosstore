# Sistema de IndexedDB para Categorías

Este sistema proporciona almacenamiento local de categorías con sincronización automática cada 24 horas.

## 🏗️ Arquitectura

### **Componentes:**

1. **`database.ts`** - Servicio de IndexedDB
   - Maneja la conexión a la base de datos local
   - Operaciones CRUD para categorías
   - Gestión de metadata

2. **`syncService.ts`** - Servicio de Sincronización
   - Sincronización automática cada 24h
   - Comunicación con el API
   - Gestión de timestamps

3. **`useCategorias.ts`** - Hook Personalizado
   - Interfaz principal para componentes
   - Estados de carga y error
   - Funciones de utilidad

## 🚀 Uso del Hook

### **Importación:**
```typescript
import { useCategorias } from '../hooks/useCategorias';
```

### **Uso Básico:**
```typescript
const MiComponente = () => {
  const { 
    categorias, 
    loading, 
    error, 
    syncing,
    stats 
  } = useCategorias();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Categorías ({stats.totalCategorias})</h2>
      {categorias.map(categoria => (
        <div key={categoria.id}>
          <h3>{categoria.nombre}</h3>
          {categoria.tieneSubcategorias && (
            <ul>
              {categoria.subcategorias.map(sub => (
                <li key={sub.id}>{sub.nombre}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
```

### **Funciones Disponibles:**

#### **Estados:**
- `categorias` - Array de categorías con estructura jerárquica
- `loading` - Estado de carga inicial
- `error` - Mensaje de error (si existe)
- `syncing` - Estado de sincronización

#### **Funciones:**
- `refetch()` - Recargar datos desde IndexedDB
- `forceSync()` - Forzar sincronización con el API
- `reset()` - Limpiar datos y reinicializar

#### **Utilidades:**
- `getCategoriaById(id)` - Obtener categoría por ID
- `getCategoriasPadre()` - Obtener solo categorías padre
- `getSubcategorias(categoriaPadreId)` - Obtener subcategorías

#### **Estadísticas:**
- `stats.totalCategorias` - Total de categorías padre
- `stats.totalSubcategorias` - Total de subcategorías
- `stats.categoriasActivas` - Categorías activas
- `stats.lastSync` - Última sincronización
- `stats.needsSync` - Si necesita sincronización

## 🔄 Flujo de Sincronización

### **Primera Vez:**
1. Usuario abre la app
2. Hook inicializa IndexedDB
3. IndexedDB está vacío → Descarga del API
4. Guarda datos localmente
5. Retorna datos al componente

### **Uso Normal:**
1. Hook lee de IndexedDB (instantáneo)
2. Verifica si han pasado 24h
3. Si no han pasado → Usa datos locales
4. Si han pasado → Sincroniza en background

### **Sincronización Manual:**
```typescript
const { forceSync, syncing } = useCategorias();

const handleSync = async () => {
  await forceSync();
};

return (
  <button onClick={handleSync} disabled={syncing}>
    {syncing ? 'Sincronizando...' : 'Actualizar Categorías'}
  </button>
);
```

## 📊 Estructura de Datos

### **Categoría:**
```typescript
interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  esPadre: boolean;
  tieneSubcategorias: boolean;
  categoriaPadreId?: number;
  subcategorias: Categoria[];
}
```

### **Ejemplo de Datos:**
```json
{
  "id": 5,
  "nombre": "Desechables",
  "esPadre": true,
  "tieneSubcategorias": true,
  "subcategorias": [
    {
      "id": 11,
      "nombre": "Platos",
      "esPadre": false,
      "categoriaPadreId": 5
    }
  ]
}
```

## ⚙️ Configuración

### **Intervalo de Sincronización:**
- Por defecto: 24 horas
- Configurable en `syncService.ts`

### **Base de Datos:**
- Nombre: `proxylzfDB`
- Versión: 1
- Stores: `categorias`, `metadata`

## 🛠️ Funciones Avanzadas

### **Obtener Categoría Específica:**
```typescript
const { getCategoriaById } = useCategorias();
const categoria = getCategoriaById(5);
```

### **Filtrar Categorías:**
```typescript
const { getCategoriasPadre, getSubcategorias } = useCategorias();

const categoriasPadre = getCategoriasPadre();
const subcategorias = getSubcategorias(5);
```

### **Reset Completo:**
```typescript
const { reset } = useCategorias();

const handleReset = async () => {
  await reset(); // Limpia IndexedDB y reinicializa
};
```

## 🔍 Debugging

### **Logs en Consola:**
- `🔄 Iniciando sincronización...`
- `✅ Sincronización completada`
- `❌ Error en sincronización`
- `🗑️ Datos limpiados`

### **Verificar Estado:**
```typescript
const { stats } = useCategorias();

console.log('Última sincronización:', stats.lastSync);
console.log('Necesita sincronización:', stats.needsSync);
console.log('Total categorías:', stats.totalCategorias);
```

## 🚨 Manejo de Errores

### **Tipos de Error:**
- **IndexedDB no soportado**: Navegador antiguo
- **Error de red**: Problemas de conectividad
- **Error del API**: Problemas del servidor
- **Error de datos**: Datos corruptos

### **Recuperación Automática:**
- En caso de error de red, usa datos locales
- Si datos están corruptos, limpia y reinicializa
- Reintentos automáticos en sincronización

## 📱 Compatibilidad

- **Navegadores Modernos**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, móvil, tablet
- **Next.js**: Compatible con SSR/SSG
- **Offline**: Funciona sin conexión 