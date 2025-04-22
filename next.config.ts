import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Redirigir /tienda/* a nuestro proxy HTML
      {
        source: '/tienda/:path*',
        destination: '/api/proxy-html/tienda/licorerazonafrank/:path*',
      },
      // Restaurar la ruta tienda-proxy que funcionaba anteriormente
      {
        source: '/tienda-proxy/:path*',
        destination: '/api/proxy-html/tienda/:path*',
      },
      // Ruta para acceder directamente a cualquier ruta de tienddi
      {
        source: '/proxy/:path*',
        destination: '/api/proxy-html/:path*',
      }
    ];
  },
};

export default nextConfig;
