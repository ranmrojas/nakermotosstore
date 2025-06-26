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
- **Componentes integrados**: `ProductGrid` y `ProductManagerList` con filtros dinámicos
- **Menú desplegable de categorías**: Filtrado elegante y compacto por categoría seleccionada
- **Gestión de imágenes**: Fallbacks automáticos y optimización
- **Interfaz responsive**: Diseño adaptativo para móviles y desktop

### 🔄 Sincronización Inteligente
- **IndexedDB**: Almacenamiento local persistente
- **Sincronización automática**: Cada 24 horas en segundo plano
- **Estado offline**: Funcionalidad completa sin conexión
- **Gestión de errores**: Reintentos automáticos y fallbacks

## Estructura del Proyecto

```
proxylzf/
├── app/
│   ├── components/
│   │   ├── productos/
│   │   │   ├── ProductGrid.tsx          # Grid de productos con filtros
│   │   │   ├── ProductManagerList.tsx   # Lista administrativa
│   │   │   ├── CategoriasMenu.tsx       # Menú desplegable de categorías
│   │   │   ├── ProductosConCategorias.tsx    # Componente integrado
│   │   │   └── ProductManagerConCategorias.tsx # Admin integrado
│   │   └── CategoriasDemo.tsx           # Demo de categorías
│   ├── admin/productos/page.tsx         # Panel de administración
│   ├── tienda/productos/page.tsx        # Tienda con filtros
│   └── products/page.tsx                # Catálogo general
├── hooks/
│   └── useCategorias.ts                 # Hook para categorías
├── lib/indexedDB/
│   ├── database.ts                      # Configuración IndexedDB
│   └── syncService.ts                   # Servicio de sincronización
├── pages/api/categorias/                # API REST de categorías
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

### ProductGrid con Filtros Dinámicos
```tsx
import ProductGrid from '@/app/components/productos/ProductGrid';

<ProductGrid 
  showCategorySelector={true}
  defaultCategoryId={46}
  limit={20}
  showAddToCart={true}
/>
```

### ProductManagerList para Administración
```tsx
import ProductManagerList from '@/app/components/productos/ProductManagerList';

<ProductManagerList 
  showCategorySelector={true}
  defaultCategoryId={46}
  limit={50}
/>
```

### CategoriasMenu - Menú Desplegable
```tsx
import CategoriasMenu from '@/app/components/productos/CategoriasMenu';

<CategoriasMenu
  selectedCategoryId={selectedCategoryId}
  onCategoryChange={handleCategoryChange}
  showLabel={true}
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

## Características Avanzadas

### Sincronización Automática
- Se ejecuta cada 24 horas automáticamente
- Detecta cambios en el servidor
- Actualiza IndexedDB sin interrumpir la experiencia del usuario
- Maneja errores de conexión gracefully

### Gestión de Estado
- Estado local optimizado con React hooks
- Cache inteligente en IndexedDB
- Actualizaciones en tiempo real
- Gestión de errores robusta

### Interfaz de Usuario
- **Menú desplegable elegante**: Filtro de categorías compacto y fácil de usar
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

### Base de Datos
```bash
npx prisma studio    # Interfaz visual de la base de datos
npx prisma migrate dev # Crear y aplicar migraciones
npx prisma db push   # Sincronizar esquema
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
