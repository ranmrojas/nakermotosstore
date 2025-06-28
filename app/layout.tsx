"use client";
import { Geist } from "next/font/google";
import "./globals.css";
import ButtonNav from "./componentes/ui/ButtonNav";
import PreloadOptimizer from "./componentes/ui/PreloadOptimizer";
import Header from "./componentes/ui/Header";

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
  return (
    <html lang="es">
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
