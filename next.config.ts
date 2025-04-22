import { NextConfig } from 'next';

const nextConfig: NextConfig = {
 
  async rewrites() {
    return [
      // Redirigir /tienda a la página principal de la tienda
      {
        source: '/tienda',
        destination: '/api/store/tienda/teinda/',
      },
      // Redirigir /tienda/cualquier-cosa a las subpáginas correspondientes
      {
        source: '/1/:path*',
        destination: '/api/store/tienda/tienda/:path*',
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
