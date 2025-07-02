"use client";
import { Geist } from "next/font/google";
import "./globals.css";
import ButtonNav from "./componentes/ui/ButtonNav";
import PreloadOptimizer from "./componentes/ui/PreloadOptimizer";
import Header from "./componentes/ui/Header";
import { useAnalytics } from "../hooks/useAnalytics";

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
        <PreloadOptimizer autoStart={true}>
          <HeaderWrapper />
          {children}
        </PreloadOptimizer>
        {/* ButtonNav global para todas las páginas excepto productos */}
        <ButtonNav accentColor="amber" hideOnProducts={true} />
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
