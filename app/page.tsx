'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Características destacadas
const features = [
  {
    icon: '🚚',
    title: 'Entrega Rápida',
    text: 'Recibe tu pedido en menos de 30 minutos en tu zona.'
  },
  {
    icon: '🎁',
    title: 'Promociones Exclusivas',
    text: 'Descuentos y ofertas especiales cada semana.'
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Imágenes para el carrusel
  const carouselImages = [
    '/dashboardlanding/brian-jones-YBlcnXfv9OM-unsplash.jpg',
    '/dashboardlanding/premium_photo-1719431363708-30223a8f5280.avif',
    '/dashboardlanding/giancarlo-duarte-w2C731GlwKk-unsplash.jpg',
    '/dashboardlanding/tim-russmann-iFGGTZ8--Ms-unsplash.jpg'
  ];

  // Efecto para el carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Efecto para la animación de entrada
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f5f0] flex flex-col">
      {/* Hero Section con Carrusel */}
      <section className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden shadow-xl">
        {carouselImages.map((img, index) => (
          <div 
            key={index} 
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/30 z-10" />
            <Image
              src={img}
              alt={`Licores destacados ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
        
        {/* Contenido sobre el carrusel */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
          <h1 
            className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            Licores Zona Frank
          </h1>
          <p 
            className={`text-lg sm:text-xl text-white mb-6 max-w-lg transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            licores, bebidas, vapes y mucho mas en Villavicencio
          </p>
          <Link 
            href={currentSlide === 1 ? "/vape" : "/productos"} 
            className={`bg-[#8b2801] hover:bg-[#611d00] text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:shadow-[#8b2801]/30 transition-all duration-300 transform hover:scale-105 active:scale-95 transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            {currentSlide === 1 ? "Ver Vapes" : "Ver Productos"}
          </Link>
        </div>
        
        {/* Indicadores del carrusel */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-4' : 'bg-white/50'}`}
              aria-label={`Ir a la imagen ${index + 1}`}
            />
          ))}
        </div>
      </section>
      
      {/* Divisor con degradado */}
      <div className="h-12 bg-gradient-to-b from-[#f9f5f0] to-[#f0e6d6] relative">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#f0e6d6] shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)]" />
      </div>

      {/* Características destacadas */}
      <section className="py-8 px-4 bg-[#f0e6d6]">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#611d00]">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md p-5 border border-[#d4b78f] hover:shadow-xl hover:shadow-[#d4b78f]/20 transition-all duration-300"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-[#611d00]">{feature.title}</h3>
              <p className="text-[#8b4513] text-sm">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Divisor con degradado */}
      <div className="h-12 bg-gradient-to-b from-[#f0e6d6] to-[#f9f5f0] relative">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#f9f5f0] shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)]" />
      </div>

      {/* Card de advertencia - Mantenida del diseño original */}
      <section className="py-8 px-4 flex justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center border relative overflow-hidden" style={{ borderColor: '#440d00' }}>
          {/* Efecto de degradado sutil en el fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-white to-[#f8f4f0] z-0" />
          <div className="relative z-10 w-full">
            <div className="mb-4">
              <svg className="mx-auto" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#440d00">
                <circle cx="12" cy="12" r="10" stroke="#440d00" strokeWidth="2" fill="#611d14" fillOpacity="0.12" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#440d00' }}>Solo para mayores de 18 años</h1>
            <p className="mb-4 text-base" style={{ color: '#611d14' }}>
              El acceso y la compra de productos en esta tienda está restringido exclusivamente a personas mayores de edad.
            </p>
            <div className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: '#611d14', color: 'white' }}>
              Prohíbase el expendio de bebidas embriagantes a menores de edad. Ley 124 de 1994
            </div>
          </div>
        </div>
      </section>
      
      {/* Divisor con degradado */}
      <div className="h-12 bg-gradient-to-b from-[#f9f5f0] to-[#611d00] relative">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#611d00] shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.2)]" />
      </div>

      {/* Footer simple */}
      <footer className="bg-[#611d00] text-white py-6 px-4 text-center shadow-inner">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} Licores Zona Frank. Todos los derechos reservados.
            </div>
            <div className="flex gap-4">
              <Link href="/productos" className="text-white hover:text-[#f0e6d6] transition-colors">Productos</Link>
              <Link href="/contacto" className="text-white hover:text-[#f0e6d6] transition-colors">Contacto</Link>
              <Link href="/terminos" className="text-white hover:text-[#f0e6d6] transition-colors">Términos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
