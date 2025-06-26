import { Geist } from "next/font/google";
import "./globals.css";
import ButtonNav from "./componentes/ui/ButtonNav";

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
        {children}
        {/* ButtonNav global para todas las páginas excepto productos */}
        <ButtonNav accentColor="amber" hideOnProducts={true} />
      </body>
    </html>
  );
}
