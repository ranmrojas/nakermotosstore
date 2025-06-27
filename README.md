# Proxylzf - Sistema de Gestión de Categorías y Productos

Este es un proyecto [Next.js](https://nextjs.org) que implementa un sistema completo de gestión de categorías y productos con almacenamiento local en IndexedDB y sincronización automática.

## Características Principales

### 🏷️ Sistema de Categorías
- **Modelo auto-referencial**: Categorías padre e hijas en una sola tabla
- **API REST completa**: Operaciones CRUD, filtros y estructura jerárquica
- **Almacenamiento local**: IndexedDB para acceso offline
- **Sincronización automática**: Cada 24 horas con el servidor
- **Hook personalizado**: `useCategorias` para gestión de estado

### 🛍️ Sistema de Productos
- **Almacenamiento local**: IndexedDB para productos con sincronización automática
- **Descarga silenciosa**: Progresiva en background mientras el usuario navega
- **Sincronización inteligente**: Solo descarga categorías que necesitan actualización
- **Control de concurrencia**: Máximo 3 peticiones simultáneas para no saturar el servidor
- **Hook personalizado**: `useProductos` para gestión de estado y sincronización
- **Componentes integrados**: `ProductGrid` y `ProductManagerList` con filtros dinámicos
- **Menú desplegable de categorías**: Filtrado elegante y compacto por categoría seleccionada
- **Gestión de imágenes**: Fallbacks automáticos y optimización
- **Interfaz responsive**: Diseño adaptativo para móviles y desktop
- **Búsqueda avanzada**: Filtros por nombre, marca, SKU, precio y categoría
- **Tags de categorías**: Acceso rápido a categorías específicas (Licores, Vapeadores, Gaseosa, Cerveza)
- **Deselección inteligente**: Los tags se deseleccionan automáticamente al escribir en el buscador o al hacer clic en un tag ya seleccionado
- **Scroll manual optimizado**: Navegación fluida en resultados de búsqueda y sidebar
- **Página especializada de vapeadores**: Vista dedicada para productos de vape con filtros específicos (Desechables, Baterías, Cápsulas)

### 🔄 Sincronización Inteligente
- **IndexedDB unificado**: Almacenamiento local persistente para categorías y productos
- **Sincronización automática**: Cada 24 horas en segundo plano
- **Estado offline**: Funcionalidad completa sin conexión
- **Gestión de errores**: Reintentos automáticos y fallbacks
- **Limpieza de datos**: Validación y normalización automática de datos del API
- **Progreso visual**: Indicadores de descarga y sincronización

## Estructura del Proyecto

```
proxylzf/
├── app/
│   ├── componentes/
│   │   ├── productos/
│   │   │   ├── ProductGrid.tsx          # Grid de productos con filtros
│   │   │   ├── ProductManagerList.tsx   # Lista administrativa
│   │   │   ├── Categoriesmanagement.tsx # Gestión de categorías
│   │   │   ├── ProductGridWithSidebar.tsx # Grid con sidebar
│   │   │   └── SidebarCategories.tsx    # Sidebar de categorías
│   │   └── ui/
│   │       ├── ProductosSilenciosos.tsx # Sistema de productos con descarga silenciosa
│   │       └── ButtonNav.tsx            # Navegación inferior
│   ├── categorias-demo/
│   │   └── page.tsx                     # Demo integrado de categorías y productos
│   ├── productos/
│   │   └── page.tsx                     # Página de productos
│   └── services/
│       └── productService.ts            # Servicio de productos
├── hooks/
│   ├── useCategorias.ts                 # Hook para categorías
│   └── useProductos.ts                  # Hook para productos con sincronización
├── lib/indexedDB/
│   ├── database.ts                      # Base de datos unificada IndexedDB
│   ├── syncService.ts                   # Servicio de sincronización de categorías
│   └── productosSyncService.ts          # Servicio de sincronización de productos
├── pages/api/
│   ├── categorias/                      # API REST de categorías
│   └── extract/
│       └── products.ts                  # API de productos
└── prisma/
    └── schema.prisma                    # Modelo de datos
```

## Tecnologías Utilizadas

- **Next.js 15+**: Framework de React con App Router
- **Prisma**: ORM para gestión de base de datos
- **IndexedDB**: Almacenamiento local del navegador
- **Tailwind CSS**: Framework de estilos
- **TypeScript**: Tipado estático

## Instalación y Configuración

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar base de datos**:
```bash
npx prisma generate
npx prisma db push
```

3. **Ejecutar migraciones**:
```bash
npx prisma migrate dev
```

4. **Iniciar servidor de desarrollo**:
```bash
npm run dev
```

## Uso de Componentes

### Sistema de Productos con Descarga Silenciosa
```tsx
import ProductosSilenciosos from '@/app/componentes/ui/ProductosSilenciosos';

<ProductosSilenciosos 
  categorias={categorias}
  onProductosLoaded={handleProductosLoaded}
/>
```

### Hook useProductos
```tsx
import { useProductos } from '@/hooks/useProductos';

const { 
  productos, 
  loading, 
  syncProgress, 
  syncProductosByCategoria,
  searchProductos 
} = useProductos();
```

### ProductGrid con Filtros Dinámicos
```tsx
import ProductGrid from '@/app/componentes/productos/ProductGrid';

<ProductGrid 
  showCategorySelector={true}
  defaultCategoryId={46}
  limit={20}
  showAddToCart={true}
/>
```

### ProductManagerList para Administración
```tsx
import ProductManagerList from '@/app/componentes/productos/ProductManagerList';

<ProductManagerList 
  showCategorySelector={true}
  defaultCategoryId={46}
  limit={50}
/>
```

### Hook useCategorias
```tsx
import { useCategorias } from '@/hooks/useCategorias';

const { categorias, getCategoriaById, loading } = useCategorias();
```

## API de Categorías

### Endpoints Disponibles
- `GET /api/categorias` - Listar todas las categorías
- `GET /api/categorias/[id]` - Obtener categoría específica
- `POST /api/categorias` - Crear nueva categoría
- `PUT /api/categorias/[id]` - Actualizar categoría
- `DELETE /api/categorias/[id]` - Eliminar categoría
- `GET /api/categorias/hierarchy` - Estructura jerárquica

### Filtros Disponibles
- `activa`: Filtrar por estado de visibilidad
- `padre_id`: Filtrar categorías hijas
- `search`: Búsqueda por nombre
- `limit`: Límite de resultados

## API de Productos

### Endpoints Disponibles
- `GET /api/extract/products?id_categoria={id}` - Obtener productos por categoría

### Características del API
- **Solo lectura**: El API solo permite operaciones GET
- **Filtrado por categoría**: Requiere `id_categoria` como parámetro
- **Formato flexible**: Acepta respuesta directa o con propiedad `respuesta`
- **Campos opcionales**: Maneja campos adicionales como `objConfiguracionCompuesto_inventarios`

## Características Avanzadas

### Sistema de Productos con IndexedDB
- **Almacenamiento local**: Todos los productos se guardan en IndexedDB
- **Sincronización por categoría**: Descarga productos por categoría específica
- **Control de concurrencia**: Máximo 3 peticiones simultáneas
- **Limpieza automática**: Valida y normaliza datos antes de guardar
- **Gestión de errores**: Manejo robusto de errores de red y almacenamiento

### Descarga Silenciosa
- **Progresiva**: Descarga productos en background mientras el usuario navega
- **Inteligente**: Solo descarga categorías que necesitan actualización
- **No intrusiva**: No interrumpe la experiencia del usuario
- **Progreso visual**: Indicadores de descarga y sincronización

### Sincronización Automática
- Se ejecuta cada 24 horas automáticamente
- Detecta cambios en el servidor
- Actualiza IndexedDB sin interrumpir la experiencia del usuario

### 🖱️ Navegación y Scroll Optimizado
- **Scroll manual en resultados**: Navegación fluida en listas de productos sin scroll automático intrusivo
- **Sidebar con scroll**: Navegación independiente en categorías con altura fija
- **Contenedores con altura específica**: Uso de `calc(100vh - 300px)` para resultados y `calc(100vh - 80px)` para sidebar
- **Sin scroll automático**: Eliminación de scroll automático al seleccionar tags o categorías
- **Experiencia de usuario mejorada**: Control total del usuario sobre la navegación

### 🚬 Página de Vapeadores (/vape)
- **Categorías específicas**: Productos de las subcategorías de vapeadores (62, 61, 63)
- **Filtros especializados**: Tags para Dispositivos Desechables, Baterías y Cápsulas
- **Búsqueda dedicada**: Buscador específico para productos de vape
- **Carga automática**: Todos los productos de vape se cargan al iniciar la página
- **Deselección de filtros**: Los tags se pueden deseleccionar al hacer clic nuevamente

### Gestión de Estado
- Estado local optimizado con React hooks
- Cache inteligente en IndexedDB
- Actualizaciones en tiempo real
- Gestión de errores robusta

### Interfaz de Usuario
- **Menú desplegable elegante**: Filtro de categorías compacto y fácil de usar
- **Navegación inferior**: ButtonNav con iconos y badges
- Diseño responsive y moderno
- Filtros dinámicos por categoría
- Indicadores de carga y estado
- Navegación intuitiva

## Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run lint         # Linting del código
```

### Scripts de Prueba
```bash
node scripts/test-simple.js    # Prueba del sistema de productos
node scripts/test-productos.js # Prueba completa del sistema
```

### Base de Datos
```bash
npx prisma studio    # Interfaz visual de la base de datos
npx prisma migrate dev # Crear y aplicar migraciones
npx prisma db push   # Sincronizar esquema
```

## Solución de Problemas

### Errores de IndexedDB
- **Limpieza de datos**: El sistema limpia automáticamente los datos del API
- **Validación**: Convierte tipos de datos y maneja valores null/undefined
- **Logs detallados**: Console logs para debugging
- **Manejo de errores**: Reintentos automáticos y fallbacks

### Sincronización
- **Control de concurrencia**: Evita saturar el servidor
- **Progreso visual**: Indicadores de descarga
- **Gestión de errores**: Manejo robusto de errores de red
- **Reintentos**: Automáticos en caso de fallo

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
