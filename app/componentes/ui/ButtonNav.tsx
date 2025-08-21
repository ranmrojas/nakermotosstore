'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid';

// Icono personalizado de nube (vape)
const VapeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Nube principal */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    {/* Pequeñas nubes de vapor */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8a2 2 0 012-2h4a2 2 0 012 2" opacity="0.6" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6a1 1 0 011-1h2a1 1 0 011 1" opacity="0.4" />
  </svg>
);

// Icono personalizado de nube (versión sólida)
const VapeIconSolid = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    {/* Nube principal */}
    <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    {/* Pequeñas nubes de vapor */}
    <path d="M8 8a2 2 0 012-2h4a2 2 0 012 2" opacity="0.6" />
    <path d="M6 6a1 1 0 011-1h2a1 1 0 011 1" opacity="0.4" />
  </svg>
);

// Icono oficial de WhatsApp mejorado
const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
  </svg>
);

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
  badge?: number;
  isMenuButton?: boolean;
}

interface ButtonNavProps {
  items?: NavItem[];
  accentColor?: string;
  className?: string;
  hideOnProducts?: boolean;
}

// Configuración por defecto
const defaultNavigation: NavItem[] = [
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
    name: 'Buscar',
    href: '/busqueda',
    icon: MagnifyingGlassIcon,
    iconSolid: MagnifyingGlassIconSolid,
  },
  {
    name: 'Vape',
    href: '/vape',
    icon: VapeIcon,
    iconSolid: VapeIconSolid,
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/573046067333',
    icon: WhatsAppIcon,
    iconSolid: WhatsAppIcon,
  },
];

export default function ButtonNav({ 
  items = defaultNavigation,
  accentColor = 'blue',
  className = '',
  hideOnProducts = false
}: ButtonNavProps) {
  const pathname = usePathname();

  // Ocultar en productos si hideOnProducts es true
  if (hideOnProducts && pathname === '/productos') {
    return null;
  }

  // Colores dinámicos basados en accentColor
  const getAccentColors = () => {
    switch (accentColor) {
      case 'blue':
        return {
          active: 'text-blue-600',
          activeBg: 'bg-blue-100',
          hover: 'hover:text-blue-600',
          hoverBg: 'group-hover:bg-blue-50',
          indicator: 'bg-blue-600',
          gradient: 'from-blue-500 via-purple-500 to-pink-500'
        };
      case 'amber':
        return {
          active: 'text-gray-800',
          activeBg: 'bg-gray-100',
          hover: 'hover:text-gray-700',
          hoverBg: 'group-hover:bg-gray-50',
          indicator: 'bg-gray-600',
          gradient: 'from-gray-500 via-gray-600 to-gray-700'
        };
      case 'green':
        return {
          active: 'text-green-600',
          activeBg: 'bg-green-100',
          hover: 'hover:text-green-600',
          hoverBg: 'group-hover:bg-green-50',
          indicator: 'bg-green-600',
          gradient: 'from-green-500 via-emerald-500 to-teal-500'
        };
      default:
        return {
          active: 'text-gray-800',
          activeBg: 'bg-gray-100',
          hover: 'hover:text-gray-700',
          hoverBg: 'group-hover:bg-gray-50',
          indicator: 'bg-gray-600',
          gradient: 'from-gray-500 via-gray-600 to-gray-700'
        };
    }
  };

  const colors = getAccentColors();

  // Renderizar el botón de navegación
  const renderNavButton = (item: NavItem) => {
    const isActive = pathname === item.href;
    const IconComponent = isActive ? item.iconSolid : item.icon;

    // Botón normal para otras páginas
    return (
      <Link
        href={item.href}
        className={`flex flex-col items-center justify-center w-full py-0.5 px-1 rounded-xl transition-all duration-300 ease-in-out group relative
          ${isActive ? colors.active : 'text-gray-600'} ${colors.hover}`}
      >
        {/* Icono */}
        <div className={`relative p-1 rounded-full transition-all duration-300
          ${isActive ? colors.activeBg : colors.hoverBg}`}
        >
          <IconComponent 
            className={`w-5 h-5 transition-all duration-300
              ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}
          />
          
          {/* Badge de notificaciones */}
          {item.badge && item.badge > 0 && (
            <div className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
              {item.badge > 99 ? '99+' : item.badge}
            </div>
          )}
          
          {/* Indicador de actividad */}
          {isActive && (
            <div className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 ${colors.indicator} rounded-full animate-pulse`} />
          )}
        </div>
        
        {/* Texto */}
        <span className={`text-xs font-medium mt-0.5 transition-all duration-300
          ${isActive ? colors.active : 'text-gray-600'} ${colors.hover}`}
        >
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Espaciador para evitar que el contenido se oculte detrás del nav */}
      <div className="h-12" />
      
      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        {/* Fondo con blur y borde superior */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-lg">
          <div className="flex items-center justify-around px-2 py-1">
            {items.map((item) => (
              <div key={item.name}>
                {renderNavButton(item)}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
} 