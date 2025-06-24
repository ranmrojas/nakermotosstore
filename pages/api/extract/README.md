# API de Extracción de Tienddi.co

Esta API proporciona endpoints para extraer datos de Tienddi.co, incluidos productos, categorías, y otras informaciones.

## Endpoints Disponibles

### 1. `/api/extract/products`

Extrae productos de la API de Tienddi.co.

**Parámetros GET:**
- `endpoint`: Endpoint a usar (default: "consultarProuctosCategoriaCombinadaTiendaOnline")
- `id_sucursal`: ID de la sucursal (default: "1")
- `id_categoria`: ID de la categoría (default: "46" - puede variar según disponibilidad)
- `dia_actual`: Día actual (default: "M" - representa el día de la semana)
- `numeroCategoria`: Número de categoría (default: "15")
- `validar_inventario`: Validar inventario (default: "1")
- `limite`: Límite de productos a devolver (default: "40")
- `url`: URL completa (opcional - si se proporciona, se ignorarán los demás parámetros)

**Headers requeridos:**
- `x-auth-token`: Token de autenticación
- `x-auth-token-api`: Token API
- `x-auth-token-empresa`: ID de empresa (default: "5083")
- `x-auth-token-es-online`: Flag de online (default: "1")
- `x-gtm`: Zona horaria (default: "GMT-0500")

**Ejemplo de uso:**
```
GET /api/extract/products?id_categoria=46
```

### 2. `/api/extract/categories`

Obtiene las categorías disponibles en Tienddi.co.

**Parámetros GET:**
- `id_sucursal`: ID de la sucursal (default: "1")

**Headers:** Los mismos que para products.

**Ejemplo de uso:**
```
GET /api/extract/categories
```

### 3. `/api/extract/test-connection`

Verifica la conexión a la API de Tienddi.co y valida los tokens.

**Ejemplo de uso:**
```
GET /api/extract/test-connection
```

### 4. `/api/extract/analyze-html`

Analiza el HTML de una página para detectar elementos de productos.

**Parámetros GET:**
- `url`: URL a analizar (default: "https://tienddi.co/tienda/pedidos/agua")

**Ejemplo de uso:**
```
GET /api/extract/analyze-html?url=https://tienddi.co/tienda/pedidos/cerveza
```

### 5. `/api/extract/debug-html`

Obtiene y depura el HTML raw de Tienddi.co para análisis.

**Ejemplo de uso:**
```
GET /api/extract/debug-html
```

### 6. `/api/extract/test-urls`

Prueba diferentes rutas en Tienddi.co para encontrar productos.

**Ejemplo de uso:**
```
GET /api/extract/test-urls
```

## Tokens de Autenticación

Los tokens actuales para la API son:
- `x-auth-token`: "1750743428309-3850-1-5b0fad04b53c47ee72ca160ebaa35d0e"
- `x-auth-token-api`: "1750743428309-1206-1-5b0fad04b53c47ee72ca160ebaa35d0e"
- `x-auth-token-empresa`: "5083"
- `x-auth-token-es-online`: "1"

Nota: Estos tokens pueden cambiar periódicamente. Si la API deja de funcionar, es posible que necesites actualizarlos.
