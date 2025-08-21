'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/1098cf4b-3ff7-4c3f-82fc-0c2c07e62a8d.jpeg"
          alt="Naker Motos"
          width={120}
          height={120}
          className="rounded-full shadow-lg"
        />
      </div>

      {/* Contenido principal */}
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-[#182C6D] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-[#182C6D] mb-4">¡Ups! Página no encontrada</h2>
        <p className="text-gray-600 mb-8">
          La página que buscas no existe o ha sido movida. 
          Pero no te preocupes, podemos ayudarte a encontrar lo que necesitas.
        </p>

        {/* Botones de navegación */}
        <div className="space-y-4">
          <Link 
            href="/productos"
            className="block w-full bg-[#182C6D] hover:bg-[#0f1a4a] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🏍️ Ver Repuestos
          </Link>
          
          <Link 
            href="/"
            className="block w-full bg-white border-2 border-[#182C6D] text-[#182C6D] font-bold py-3 px-6 rounded-xl hover:bg-[#182C6D] hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🏠 Volver al Inicio
          </Link>
        </div>

        {/* Información de contacto */}
        <div className="mt-8 p-4 bg-gray-100 rounded-xl">
                      <h3 className="font-bold text-[#182C6D] mb-2">¿Necesitas ayuda?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Contáctanos y te ayudamos a encontrar lo que buscas
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="https://wa.me/573046067333" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              📱 WhatsApp
            </a>
            <a 
              href="tel:+573046067333"
              className="bg-[#182C6D] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#0f1a4a] transition-colors"
            >
              📞 Llamar
            </a>
          </div>
        </div>
      </div>

      {/* Decoración */}
      <div className="absolute top-10 left-10 text-6xl opacity-10">🏍️</div>
      <div className="absolute top-20 right-10 text-4xl opacity-10">🔧</div>
      <div className="absolute bottom-20 left-10 text-4xl opacity-10">⚙️</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-10">🛞</div>
    </div>
  );
}
