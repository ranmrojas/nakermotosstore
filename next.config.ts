import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configuración para permitir imágenes de dominios externos
  images: {
    domains: ['tienddi.co'],
    formats: ['image/webp'],
    // Limitar tamaños máximos para reducir memoria en iOS Safari
    deviceSizes: [640, 750, 828, 1080],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
 
  async rewrites() {
    return [
      // Redirigir /tienda a la página principal de la tienda
      {
        source: '/tienda',
        destination: '/api/store/tienda/1/',
      },
      // Redirigir /tienda/cualquier-cosa a las subpáginas correspondientes
      {
        source: '/tienda/:path*',
        destination: '/api/store/tienda/pedidos/:path*',
      },
      // Mantener la ruta tienda-proxy para compatibilidad
      {
        source: '/tienda/:path*',
        destination: '/api/store/tienda/:path*',
      },
      // Ruta para acceder directamente a cualquier ruta de tienddi
      {
        source: '/proxy/:path*',
        destination: '/api/store/:path*',
      }
    ];
  },
};

export default nextConfig;
