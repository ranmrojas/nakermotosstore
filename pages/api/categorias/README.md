# API de Categorías

Este API permite gestionar las categorías de productos con soporte para estructura jerárquica (categorías padre e hijas).

## Endpoints Disponibles

### 1. `/api/categorias` - Gestión General

#### GET - Listar Categorías
Obtiene una lista de categorías con filtros opcionales.

**Parámetros de consulta:**
- `activa` (boolean): Filtrar por estado activo/inactivo
- `categoriaPadreId` (number|null): Filtrar por categoría padre
- `soloPadres` (boolean): Obtener solo categorías padre
- `incluirSubcategorias` (boolean): Incluir subcategorías en la respuesta

**Ejemplos:**
```bash
# Obtener todas las categorías
GET /api/categorias

# Obtener solo categorías activas
GET /api/categorias?activa=true

# Obtener solo categorías padre
GET /api/categorias?soloPadres=true

# Obtener subcategorías de una categoría específica
GET /api/categorias?categoriaPadreId=5

# Obtener categorías padre con sus subcategorías
GET /api/categorias?soloPadres=true&incluirSubcategorias=true
```

#### POST - Crear Categoría
Crea una nueva categoría.

**Body:**
```json
{
  "nombre": "Nueva Categoría",
  "descripcion": "Descripción opcional",
  "activa": true,
  "categoriaPadreId": null
}
```

### 2. `/api/categorias/[id]` - Operaciones por ID

#### GET - Obtener Categoría Específica
Obtiene una categoría por su ID con sus relaciones.

```bash
GET /api/categorias/5
```

#### PUT - Actualizar Categoría
Actualiza una categoría existente.

**Body:**
```json
{
  "nombre": "Nuevo Nombre",
  "descripcion": "Nueva descripción",
  "activa": false,
  "categoriaPadreId": 1
}
```

#### DELETE - Eliminar Categoría
Elimina una categoría (solo si no tiene subcategorías).

```bash
DELETE /api/categorias/12
```

### 3. `/api/categorias/hierarchy` - Estructura Jerárquica

#### GET - Obtener Estructura Completa
Obtiene la estructura jerárquica completa para menús de navegación.

**Parámetros:**
- `soloActivas` (boolean): Mostrar solo categorías activas (default: true)

```bash
GET /api/categorias/hierarchy
GET /api/categorias/hierarchy?soloActivas=false
```

## Estructura de Respuesta

### Respuesta Exitosa
```json
{
  "success": true,
  "data": [...],
  "total": 62,
  "message": "Operación exitosa"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

## Ejemplos de Uso

### 1. Obtener Menú de Categorías
```javascript
const response = await fetch('/api/categorias/hierarchy?soloActivas=true');
const { data: categorias } = await response.json();

// Estructura resultante:
// [
//   {
//     id: 5,
//     nombre: "Desechables",
//     esPadre: true,
//     tieneSubcategorias: true,
//     subcategorias: [
//       { id: 11, nombre: "Platos", esPadre: false },
//       { id: 13, nombre: "Copas", esPadre: false }
//     ]
//   }
// ]
```

### 2. Crear Nueva Subcategoría
```javascript
const nuevaSubcategoria = await fetch('/api/categorias', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: "Nuevos Platos",
    descripcion: "Platos desechables nuevos",
    categoriaPadreId: 5
  })
});
```

### 3. Actualizar Estado de Categoría
```javascript
const actualizarCategoria = await fetch('/api/categorias/12', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    activa: false
  })
});
```

## Validaciones

- **Nombre único**: No se pueden crear categorías con nombres duplicados
- **Categoría padre válida**: Al crear subcategorías, la categoría padre debe existir
- **Sin referencias circulares**: Una categoría no puede ser padre de sí misma
- **Eliminación segura**: No se puede eliminar una categoría que tiene subcategorías
- **Campos requeridos**: El nombre es obligatorio

## Códigos de Estado HTTP

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Error de validación
- `404`: Recurso no encontrado
- `405`: Método no permitido
- `500`: Error interno del servidor 