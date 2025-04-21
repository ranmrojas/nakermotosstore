# Implementación de Proxy con Next.js para Tienda Licorería Zona Frank

## 1. Estructura del Proyecto Next.js

```
src/
├── app/
│   ├── page.tsx
│   └── layout.tsx
├── pages/
│   └── api/
│       └── proxy/
│           └── [...path].ts    # Manejador del proxy
├── lib/
│   ├── constants.ts            # Constantes y configuración
│   └── types.ts               # Tipos TypeScript
└── middleware.ts              # Middleware para manejo de CORS
```

## 2. Implementación del Proxy

### 2.1 API Route para el Proxy
```typescript
// pages/api/proxy/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import { API_BASE_URL } from '@/lib/constants';

const proxy = httpProxy.createProxyServer();

// Prevenir que el body se parsee automáticamente
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    // Añadir headers de autenticación
    req.headers['x-auth-token'] = process.env.AUTH_TOKEN;
    req.headers['x-auth-token-empresa'] = '5083';
    req.headers['x-auth-token-api'] = process.env.AUTH_TOKEN_API;

    // Eliminar el prefijo /api/proxy de la URL
    const targetUrl = req.url?.replace('/api/proxy', '');

    proxy.web(req, res, {
      target: API_BASE_URL,
      changeOrigin: true,
      proxyTimeout: 30000, // 30 segundos
      pathRewrite: {
        '^/api/proxy': '/Server4EtpPro/servicios_tienda_online2/api',
      },
    }, (err) => {
      if (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
        reject(err);
      }
      resolve(null);
    });
  });
}
```

### 2.2 Configuración de Constantes
```typescript
// lib/constants.ts
export const API_BASE_URL = 'https://api.cuenti.co';
export const PROXY_BASE_PATH = '/api/proxy';

export const ENDPOINTS = {
  CONFIG: '/consultarConfiguracionTiendaLineaJ4Nombre',
  CATEGORIES: '/consultarCategoriasEnLinea',
  PRODUCTS: '/consultarProductosCategoriaVirtualesTiendaOnline',
  PROMOTIONS: '/consultarProductosCategoriaCombinadaPromocionTiendaOnline',
} as const;
```

### 2.3 Cliente API
```typescript
// lib/api.ts
import { PROXY_BASE_PATH, ENDPOINTS } from './constants';

export const api = {
  async getConfig() {
    const response = await fetch(`${PROXY_BASE_PATH}${ENDPOINTS.CONFIG}?nombre=licorerazonafrank`);
    return response.json();
  },

  async getCategories() {
    const response = await fetch(`${PROXY_BASE_PATH}${ENDPOINTS.CATEGORIES}`);
    return response.json();
  },

  async getProducts(params: any) {
    const response = await fetch(`${PROXY_BASE_PATH}${ENDPOINTS.PRODUCTS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return response.json();
  },
};
```

## 3. Configuración del Proyecto

### 3.1 Variables de Entorno
```env
# .env.local
AUTH_TOKEN=xxx
AUTH_TOKEN_API=xxx
NEXT_PUBLIC_API_BASE=/api/proxy
```

### 3.2 Dependencias Necesarias
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "http-proxy": "^1.18.1"
  },
  "devDependencies": {
    "@types/http-proxy": "^1.17.14",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

## 4. Uso en Componentes

### 4.1 Ejemplo de Página de Productos
```typescript
// app/page.tsx
import { api } from '@/lib/api';

export default async function ProductsPage() {
  const products = await api.getProducts({
    sucursal: '1&dia_actual=1&hora_actual=14:43:48',
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## 5. Manejo de Errores y Logging

### 5.1 Middleware para Logging
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log de la petición
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);

  const response = NextResponse.next();

  // Añadir headers CORS
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}

export const config = {
  matcher: '/api/proxy/:path*',
};
```

## 6. Próximos Pasos

1. Implementar el proyecto base de Next.js
2. Configurar las variables de entorno
3. Implementar el proxy en API Routes
4. Crear los componentes de UI
5. Implementar el sistema de caché
6. Añadir manejo de errores y logging

## 7. Consideraciones de Producción

- Configurar límites de tiempo de respuesta apropiados
- Implementar sistema de caché para respuestas frecuentes
- Monitorear el uso de memoria y CPU
- Configurar logs para debugging en producción
- Implementar retry logic para peticiones fallidas 