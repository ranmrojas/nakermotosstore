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
        <link rel="icon" href="/1098cf4b-3ff7-4c3f-82fc-0c2c07e62a8d.jpeg" />
        <link rel="shortcut icon" href="/1098cf4b-3ff7-4c3f-82fc-0c2c07e62a8d.jpeg" />
        <link rel="apple-touch-icon" href="/1098cf4b-3ff7-4c3f-82fc-0c2c07e62a8d.jpeg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={geist.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
