import { Geist } from "next/font/google";
import "./globals.css";
import ClientLayout from "./componentes/ui/ClientLayout";
import { metadata } from "./metadata";

const geist = Geist({
  subsets: ["latin"],
});

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={geist.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
