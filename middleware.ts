import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas que no necesitan verificación de edad
  const publicRoutes = ['/ageverification'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas de API que permiten acceso sin verificación (para preload)
  const apiRoutes = ['/api/categorias', '/api/extract/products'];
  const isApiRoute = apiRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas de autenticación del admin
  const adminAuthRoutes = ['/admin/login'];
  const isAdminAuthRoute = adminAuthRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Si es una ruta de autenticación del admin, permitir acceso
  if (isAdminAuthRoute) {
    return NextResponse.next();
  }

  // Si es una ruta pública o API, permitir acceso
  if (isPublicRoute || isApiRoute) {
    return NextResponse.next();
  }

  // Verificar si es una ruta del admin
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

  // Para rutas no-admin, verificar verificación de edad
  const isVerified = request.cookies.get('age_verified');

  // Si no está verificado y no es una ruta pública, redirigir a verificación
  if (!isVerified) {
    // Capturar la URL original que el usuario quería visitar
    const originalUrl = request.nextUrl.pathname + request.nextUrl.search;
    const redirectUrl = new URL('/ageverification', request.url);
    redirectUrl.searchParams.set('redirect', originalUrl);
    
    return NextResponse.redirect(redirectUrl);
  }

  // Si está verificado, permitir acceso
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
     * - public files (logo.png, ageverification.jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|ageverification.jpg).*)',
  ],
} 