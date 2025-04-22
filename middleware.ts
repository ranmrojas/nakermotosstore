import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas que no necesitan verificación
  const publicRoutes = ['/ageverification'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Obtener el estado de verificación
  const isVerified = request.cookies.get('age_verified');

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Si no está verificado y no es una ruta pública, redirigir a verificación
  if (!isVerified) {
    return NextResponse.redirect(new URL('/ageverification', request.url));
  }

  // Si está verificado, permitir acceso
  return NextResponse.next();
}

// Configurar las rutas que queremos proteger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, ageverification.jpg, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|ageverification.jpg).*)',
  ],
} 