import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas que no necesitan verificación de edad
  const publicRoutes: string[] = [];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas de API que permiten acceso sin verificación (para preload)
  const apiRoutes = ['/api/categorias', '/api/extract/products', '/api/usuarios', '/api/sms'];
  const isApiRoute = apiRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas de autenticación del admin (no requieren verificación de edad)
  const adminAuthRoutes = ['/admin/login'];
  const isAdminAuthRoute = adminAuthRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas de API de autenticación (no requieren verificación de edad)
  const authApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/verify'];
  const isAuthApiRoute = authApiRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Si es una ruta de autenticación del admin o API de auth, permitir acceso sin verificación de edad
  if (isAdminAuthRoute || isAuthApiRoute) {
    return NextResponse.next();
  }

  // Si es una ruta pública o API, permitir acceso
  if (isPublicRoute || isApiRoute) {
    return NextResponse.next();
  }

  // Verificar si es una ruta del admin (excluyendo /admin/login que ya se manejó arriba)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    // Verificar autenticación del admin
    const adminSession = request.cookies.get('admin_session');
    
    if (!adminSession) {
      // Redirigir al login del admin
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Si tiene sesión, permitir acceso al admin
    return NextResponse.next();
  }

  // Para rutas no-admin, permitir acceso directamente
  return NextResponse.next();
}

// Configurar las rutas que queremos proteger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, favicon.png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|favicon.png).*)',
  ],
} 