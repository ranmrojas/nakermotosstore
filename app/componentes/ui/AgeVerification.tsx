'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';

export default function AgeVerification() {
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState<string>('/productos');

  // Obtener la URL de redirección desde los parámetros de búsqueda
  useEffect(() => {
    const redirect = searchParams?.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

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
      // Redirigir a la URL original o a productos por defecto
      router.push(redirectUrl);
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
        className={`relative w-[90%] max-w-sm mx-auto p-6 text-center bg-white rounded-xl shadow-2xl
          transform transition-all duration-1000 ease-in-out
          ${!fadeOut ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}
      >
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="Licorera Zona Frank Logo"
            width={250}
            height={125}
            className="mx-auto w-48"
            priority
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Bienvenido
          </h2>
          
          <div className="border-t border-b border-amber-800/20 py-3">
            <p className="text-gray-700 text-sm">
              Prohíbase el expendio de bebidas embriagantes a menores de edad ley 124 de 1994
            </p>
          </div>

          <p className="text-gray-800 text-lg font-semibold">
            ¿Eres mayor de 18 años?
          </p>
        </div>
        
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => handleVerification(true)}
            className="px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-lg
              hover:bg-green-700 transition-all duration-300 ease-in-out
              hover:scale-105 hover:shadow-lg hover:shadow-green-600/30"
          >
            Soy Mayor de 18 Años
          </button>
          <button
            onClick={() => handleVerification(false)}
            className="px-6 py-3 text-base font-semibold text-white bg-red-600 rounded-lg
              hover:bg-red-700 transition-all duration-300 ease-in-out
              hover:scale-105 hover:shadow-lg hover:shadow-red-600/30"
          >
            Soy Menor de Edad
          </button>
        </div>
        
        <p className="mt-6 text-sm text-amber-800 font-semibold">
          ¡EL EXCESO DE ALCOHOL ES PERJUDICIAL PARA LA SALUD!
        </p>
      </div>
    </div>
  );
} 