'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCategorias } from '../hooks/useCategorias';



export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { categorias, loading: categoriasLoading } = useCategorias();
  
  // Imágenes para el carrusel
  const carouselImages = [
    '/dashboardlanding/image1.jpg',
    '/dashboardlanding/image2.png',
    '/dashboardlanding/image3.png',
    '/dashboardlanding/image4.jpg'
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
    <div className="min-h-screen bg-white flex flex-col">
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
              alt={`Productos destacados ${index + 1}`}
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
            Naker Motos
          </h1>
          <p 
            className={`text-lg sm:text-xl text-white mb-6 max-w-lg transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            Motos, repuestos y accesorios... en Villavicencio-Meta
          </p>
          <Link 
            href="/productos"
            className={`bg-[#182C6D] hover:bg-[#0f1a4a] text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:shadow-[#182C6D]/30 transition-all duration-300 transform hover:scale-105 active:scale-95 transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            Ver Repuestos
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
      {/* Eliminado divisor degradado beige */}

      {/* Sección de Categorías */}
      <section className="py-8 px-4 bg-white">
        <h2 className="text-2xl font-bold text-center mb-8 text-[#182C6D]">Nuestros Productos</h2>
        
        {categoriasLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#182C6D]"></div>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex flex-col gap-3">
              {(() => {
                const getCategoryIcon = (nombre: string) => {
                  const nombreLower = nombre.toLowerCase();
                  if (nombreLower.includes('moto') || nombreLower.includes('motor')) return '🏍️';
                  if (nombreLower.includes('repuesto') || nombreLower.includes('parte')) return '🔧';
                  if (nombreLower.includes('accesorio') || nombreLower.includes('accesorios')) return '⚙️';
                  if (nombreLower.includes('llanta') || nombreLower.includes('neumatico')) return '🛞';
                  if (nombreLower.includes('bateria') || nombreLower.includes('batería')) return '🔋';
                  if (nombreLower.includes('aceite') || nombreLower.includes('lubricante')) return '🛢️';
                  if (nombreLower.includes('freno') || nombreLower.includes('frenos')) return '🛑';
                  if (nombreLower.includes('cadena') || nombreLower.includes('transmision')) return '⛓️';
                  if (nombreLower.includes('filtro') || nombreLower.includes('filtros')) return '🧽';
                  if (nombreLower.includes('casco') || nombreLower.includes('proteccion')) return '🪖';
                  if (nombreLower.includes('ropa') || nombreLower.includes('vestimenta')) return '👕';
                  if (nombreLower.includes('herramienta') || nombreLower.includes('herramientas')) return '🔨';
                  return '🏍️';
                };

                // Filtrar solo categorías activas y ordenarlas
                const categoriasOrdenadas = [...categorias]
                  .filter(cat => cat.activa) // Solo categorías activas
                  .sort((a, b) => {
                    const nombreA = a.nombre.toLowerCase();
                    const nombreB = b.nombre.toLowerCase();
                    
                    const prioridades = [
                      'moto', 'motor', 'repuesto', 'parte', 'accesorio', 'accesorios',
                      'llanta', 'neumatico', 'bateria', 'batería', 'aceite', 'lubricante'
                    ];
                    
                    const indexA = prioridades.findIndex(p => nombreA.includes(p));
                    const indexB = prioridades.findIndex(p => nombreB.includes(p));
                    
                    if (indexA !== -1 && indexB !== -1) {
                      return indexA - indexB;
                    }
                    
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    
                    return nombreA.localeCompare(nombreB);
                  });

                // Dividir en exactamente 2 filas
                const mitad = Math.ceil(categoriasOrdenadas.length / 2);
                const primeraFila = categoriasOrdenadas.slice(0, mitad);
                const segundaFila = categoriasOrdenadas.slice(mitad);

                interface Categoria {
                  id: number;
                  nombre: string;
                  activa: boolean;
                }
                const renderCategoria = (categoria: Categoria) => {
                  // Mostrar "Accesorios" para la categoría con ID 46
                  const displayName = categoria.id === 46 ? "Accesorios" : categoria.nombre;
                  return (
                    <Link 
                      href={`/productos?id=${categoria.id}`}
                      key={categoria.id}
                      className="flex flex-col items-center justify-between w-18 h-18 flex-shrink-0 group cursor-pointer hover:transform hover:scale-105 transition-all duration-300"
                    >
                      {/* Contenedor del ícono ligeramente más grande */}
                      <div className="w-13 h-13 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-[#f0f4ff] transition-all duration-300 border-2 border-transparent group-hover:border-[#182C6D]">
                        <span className="text-lg filter drop-shadow-sm">{getCategoryIcon(categoria.nombre)}</span>
                      </div>
                      {/* Contenedor del texto ligeramente más grande */}
                      <div className="w-full h-6 flex items-center justify-center px-1 mt-1">
                        <span 
                          className="text-[10px] font-semibold text-[#182C6D] text-center leading-tight w-full block group-hover:text-[#0f1a4a] transition-colors duration-300" 
                          title={categoria.nombre}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {displayName}
                        </span>
                      </div>
                    </Link>
                  );
                };

                return (
                  <div 
                    className="overflow-x-auto scrollbar-hide px-2"
                    onScroll={(e) => {
                      // Sincronizar scroll entre las dos filas
                      const scrollContainer = e.currentTarget;
                      const allScrollContainers = document.querySelectorAll('.categoria-scroll');
                      allScrollContainers.forEach(container => {
                        if (container !== scrollContainer) {
                          container.scrollLeft = scrollContainer.scrollLeft;
                        }
                      });
                    }}
                  >
                    <div className="flex flex-col gap-2" style={{ minWidth: 'max-content' }}>
                      {/* Primera fila */}
                      <div className="flex gap-2">
                        {primeraFila.map(renderCategoria)}
                      </div>
                      
                      {/* Segunda fila */}
                      <div className="flex gap-2">
                        {segundaFila.map(renderCategoria)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Sección de Servicios - Diseño Móvil First */}
      <section className="py-8 px-4 bg-white">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#182C6D]">¿Qué ofrecemos?</h2>
        
        {/* Grid de servicios móvil-first */}
        <div className="space-y-4 max-w-md mx-auto">
          {/* Card 1 - Repuestos */}
          <div className="bg-gradient-to-r from-[#182C6D] to-[#0f1a4a] rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🔧</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Repuestos Originales</h3>
                <p className="text-sm opacity-90">Honda, Yamaha, Suzuki y más</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </div>

          {/* Card 2 - Asesoría */}
          <div className="bg-gradient-to-r from-[#0f1a4a] to-[#182C6D] rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">⚡</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Asesoría Técnica</h3>
                <p className="text-sm opacity-90">Diagnóstico y recomendaciones</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </div>

          {/* Card 3 - Entrega */}
          <div className="bg-gradient-to-r from-[#182C6D] to-[#0f1a4a] rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🚚</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Entrega Rápida</h3>
                <p className="text-sm opacity-90">Mismo día en Villavicencio</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </div>
        </div>

        {/* Botón de contacto flotante */}
        <div className="fixed bottom-20 right-4 z-50">
          {/* Llamada */}
          <a 
            href="tel:+573046067333"
            className="block w-14 h-14 bg-[#182C6D] rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-[#0f1a4a] transition-all duration-300 transform hover:scale-110"
            aria-label="Llamar"
          >
            📞
          </a>
        </div>

        {/* Banner de contacto inferior */}
        <div className="mt-8 bg-gray-100 rounded-xl p-4 text-center">
          <h3 className="font-bold text-lg text-[#182C6D] mb-2">¿Necesitas algo específico?</h3>
          <p className="text-sm text-gray-600 mb-3">Contáctanos y te ayudamos a encontrarlo</p>
          <div className="flex justify-center">
            <a 
              href="tel:+573046067333"
              className="bg-[#182C6D] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#0f1a4a] transition-colors"
            >
              Llamar
            </a>
          </div>
        </div>
      </section>
      
      {/* Divisor con degradado */}
      {/* Eliminado divisor degradado beige */}

      {/* Información de contacto y servicios */}
      <section className="py-8 px-4 flex justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center border relative overflow-hidden" style={{ borderColor: '#182C6D' }}>
          {/* Efecto de degradado sutil en el fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-white to-[#f0f4ff] z-0" />
          <div className="relative z-10 w-full">
            <div className="mb-4">
              <svg className="mx-auto" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#182C6D">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#182C6D' }}>Encuéntranos en Villavicencio</h1>
            <p className="mb-4 text-base" style={{ color: '#182C6D' }}>
              Tu tienda de confianza para repuestos y accesorios de motos. Asesoría especializada y productos de calidad.
            </p>
            <div className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: '#182C6D', color: 'white' }}>
              📞 Llámanos: (57) 304 606 7333
            </div>
          </div>
        </div>
      </section>
      
      {/* Divisor con degradado */}
      <div className="h-12 bg-gradient-to-b from-[#f0f4ff] to-[#182C6D] relative">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#182C6D] shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.2)]" />
      </div>

      {/* Footer simple */}
      <footer className="bg-[#182C6D] text-white py-6 px-4 text-center shadow-inner">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} Naker Motos. Todos los derechos reservados.
            </div>
            <div className="flex gap-4">
              <Link href="/productos" className="text-white hover:text-[#a8b8ff] transition-colors">Productos</Link>
              <Link href="/contacto" className="text-white hover:text-[#a8b8ff] transition-colors">Contacto</Link>
              <Link href="/terminos" className="text-white hover:text-[#a8b8ff] transition-colors">Términos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
