'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';


export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAge = () => {
      const isVerified = Cookies.get('age_verified');
      if (!isVerified) {
        router.push('/ageverification');
      }
    };

    checkAge();
  }, [router]);

  return (
    <div className="flex">
      <main className="flex-1 p-4">
        <h1>Bienvenido a la página principal</h1>
        <p>Selecciona una opción del menú para continuar.</p>
      </main>
    </div>
  );
}
