'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en la aplicación:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#182C6D] mb-3">Algo salió mal</h1>
        <p className="text-gray-600 mb-6">
          La página no pudo cargarse correctamente. Esto puede ocurrir por conexión lenta o memoria limitada en el dispositivo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-[#182C6D] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#0f1a4a] transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/productos"
            className="border border-[#182C6D] text-[#182C6D] px-5 py-2 rounded-full font-semibold hover:bg-[#f0f4ff] transition-colors"
          >
            Ir a productos
          </Link>
        </div>
      </div>
    </div>
  );
}
