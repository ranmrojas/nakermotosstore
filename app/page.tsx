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
      } else {
        router.push('/products');
      }
    };

    checkAge();
  }, [router]);

  return null; // No necesitamos renderizar nada ya que siempre redirigimos
}
