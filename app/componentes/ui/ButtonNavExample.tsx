'use client';

import React from 'react';
import ButtonNav from './ButtonNav';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  UserIcon, 
  HeartIcon,
  ShoppingCartIcon,
  MapPinIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  ShoppingBagIcon as ShoppingBagIconSolid, 
  UserIcon as UserIconSolid, 
  HeartIcon as HeartIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  MapPinIcon as MapPinIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';

// Ejemplo de navegación personalizada para una licorera
const licoreraNavigation = [
  {
    name: 'Inicio',
    href: '/',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    name: 'Productos',
    href: '/productos',
    icon: ShoppingBagIcon,
    iconSolid: ShoppingBagIconSolid,
  },
  {
    name: 'Carrito',
    href: '/carrito',
    icon: ShoppingCartIcon,
    iconSolid: ShoppingCartIconSolid,
    badge: 2, // Productos en el carrito
  },
  {
    name: 'Ubicación',
    href: '/ubicacion',
    icon: MapPinIcon,
    iconSolid: MapPinIconSolid,
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: UserIcon,
    iconSolid: UserIconSolid,
  },
];

// Ejemplo de navegación con notificaciones
const navigationWithNotifications = [
  {
    name: 'Inicio',
    href: '/',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    name: 'Productos',
    href: '/productos',
    icon: ShoppingBagIcon,
    iconSolid: ShoppingBagIconSolid,
  },
  {
    name: 'Notificaciones',
    href: '/notificaciones',
    icon: BellIcon,
    iconSolid: BellIconSolid,
    badge: 5, // Notificaciones sin leer
  },
  {
    name: 'Favoritos',
    href: '/favoritos',
    icon: HeartIcon,
    iconSolid: HeartIconSolid,
    badge: 3, // Productos favoritos
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: UserIcon,
    iconSolid: UserIconSolid,
  },
];

export default function ButtonNavExample() {
  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold text-center mb-8">Ejemplos de ButtonNav</h1>
      
      {/* Ejemplo 1: Navegación por defecto */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">1. Navegación por defecto (Azul)</h2>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg relative">
          <ButtonNav />
        </div>
      </div>

      {/* Ejemplo 2: Navegación personalizada para licorera */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">2. Navegación para licorera (Ámbar)</h2>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg relative">
          <ButtonNav 
            items={licoreraNavigation}
            accentColor="amber"
          />
        </div>
      </div>

      {/* Ejemplo 3: Navegación con notificaciones */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">3. Con notificaciones (Verde)</h2>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg relative">
          <ButtonNav 
            items={navigationWithNotifications}
            accentColor="green"
          />
        </div>
      </div>

      {/* Ejemplo 4: Sin indicador de home */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">4. Sin indicador de home</h2>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg relative">
          <ButtonNav 
            showHomeIndicator={false}
            accentColor="blue"
          />
        </div>
      </div>

      {/* Instrucciones de uso */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Cómo usar ButtonNav</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Uso básico:</strong> <code>&lt;ButtonNav /&gt;</code></p>
          <p><strong>Con color personalizado:</strong> <code>&lt;ButtonNav accentColor=&quot;amber&quot; /&gt;</code></p>
          <p><strong>Sin indicador de home:</strong> <code>&lt;ButtonNav showHomeIndicator={false} /&gt;</code></p>
          <p><strong>Navegación personalizada:</strong> Pasa un array de items con iconos y rutas</p>
          <p><strong>Badges:</strong> Agrega la propiedad <code>badge: number</code> a cualquier item</p>
        </div>
      </div>
    </div>
  );
} 