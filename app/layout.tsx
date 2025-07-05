"use client";
import { Geist } from "next/font/google";
import "./globals.css";
import ButtonNav from "./componentes/ui/ButtonNav";
import PreloadOptimizer from "./componentes/ui/PreloadOptimizer";
import Header from "./componentes/ui/Header";
import CartManager from "./componentes/carrito/CartManager";
import { useAnalytics } from "../hooks/useAnalytics";
import { CartProvider } from "../hooks/useCart";
import { ClientSessionProvider } from "../hooks/useClientSession";
import 'react-notifications-component/dist/theme.css';
import { ReactNotifications } from 'react-notifications-component';

const geist = Geist({
  subsets: ["latin"],
});

declare global {
  interface Window {
    __toggleSidebar?: () => void;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializar Google Analytics
  useAnalytics();

  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/copa-de-vino.png" />
        <link rel="shortcut icon" href="/copa-de-vino.png" />
        <link rel="apple-touch-icon" href="/copa-de-vino.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Licorera Zona Frank</title>
      </head>
      <body className={geist.className}>
        <ReactNotifications />
        <CartProvider>
          <ClientSessionProvider>
            <PreloadOptimizer autoStart={true}>
              <HeaderWrapper />
              {children}
            </PreloadOptimizer>
            {/* ButtonNav global para todas las páginas excepto productos y admin */}
            <ButtonNavWrapper />
            {/* CartManager global para todas las páginas */}
            <CartManager showCheckoutButton={true} />
          </ClientSessionProvider>
        </CartProvider>
      </body>
    </html>
  );
}

// Este wrapper permite condicionar el Header según la ruta y pasar la función global si existe
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
function HeaderWrapper() {
  const pathname = usePathname();
  const [toggleSidebar, setToggleSidebar] = useState<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (pathname === "/productos" && typeof window !== "undefined") {
      // Esperar a que la función global esté disponible
      const interval = setInterval(() => {
        if (typeof window.__toggleSidebar === "function") {
          setToggleSidebar(() => window.__toggleSidebar);
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      setToggleSidebar(undefined);
    }
  }, [pathname]);

  if (pathname === "/ageverification") return null;
  return <Header onToggleSidebar={toggleSidebar} />;
}

// Este wrapper permite condicionar ButtonNav según la ruta y el tamaño de pantalla
function ButtonNavWrapper() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // No mostrar ButtonNav en admin o en ageverification
  if (pathname === "/admin" || pathname === "/ageverification") {
    return null;
  }

  // Solo mostrar en móvil
  if (!isMobile) {
    return null;
  }

  return <ButtonNav accentColor="amber" hideOnProducts={true} />;
}
