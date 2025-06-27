import { Geist } from "next/font/google";
import "./globals.css";
import ButtonNav from "./componentes/ui/ButtonNav";
import PreloadOptimizer from "./componentes/ui/PreloadOptimizer";

const geist = Geist({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <PreloadOptimizer autoStart={true}>
          {children}
        </PreloadOptimizer>
        {/* ButtonNav global para todas las páginas excepto productos */}
        <ButtonNav accentColor="amber" hideOnProducts={true} />
      </body>
    </html>
  );
}
