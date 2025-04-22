'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';

export default function AgeVerification() {
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();

  const handleVerification = async (isAdult: boolean) => {
    if (isAdult) {
      setFadeOut(true);
      // Establecer cookie con expiración de 24 horas
      Cookies.set('age_verified', 'true', { 
        expires: 1, // 1 día
        secure: true,
        sameSite: 'strict'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/tienda/pedidos');
    } else {
      window.location.href = '/ageverification';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000 ease-in-out
        ${!fadeOut ? 'opacity-100' : 'opacity-0'}`}
      style={{
        backgroundImage: "url('/ageverification.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backgroundBlendMode: 'darken'
      }}
    >
      <div 
        className={`relative w-full max-w-md mx-4 p-8 text-center bg-white rounded-xl shadow-2xl
          transform transition-all duration-1000 ease-in-out
          ${!fadeOut ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}
      >
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Licorera Zona Frank Logo"
            width={300}
            height={150}
            className="mx-auto"
            priority
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Bienvenido
          </h2>
          
          <div className="border-t border-b border-amber-800/20 py-4">
            <p className="text-gray-700 text-lg">
              Prohíbase el expendio de bebidas embriagantes a menores de edad ley 124 de 1994
            </p>
          </div>

          <p className="text-gray-800 text-xl font-semibold">
            ¿Eres mayor de 18 años?
          </p>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button
            onClick={() => handleVerification(true)}
            className="px-8 py-3 text-lg font-semibold text-white bg-amber-800 rounded-lg
              hover:bg-amber-900 transition-all duration-300 ease-in-out
              hover:scale-105 hover:shadow-lg hover:shadow-amber-800/30"
          >
            Soy Mayor de 18 Años
          </button>
          <button
            onClick={() => handleVerification(false)}
            className="px-8 py-3 text-lg font-semibold text-white bg-red-600 rounded-lg
              hover:bg-red-700 transition-all duration-300 ease-in-out
              hover:scale-105 hover:shadow-lg hover:shadow-red-600/30"
          >
            Soy Menor de Edad
          </button>
        </div>
        
        <p className="mt-8 text-lg text-amber-800 font-semibold">
          ¡EL EXCESO DE ALCOHOL ES PERJUDICIAL PARA LA SALUD!
        </p>
      </div>
    </div>
  );
} 