'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  UserIcon as UserIconSolid,
  HeartIcon as HeartIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid';

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
  showHomeIndicator?: boolean;
  accentColor?: string;
  className?: string;
  hideOnProducts?: boolean;
  onToggleSidebar?: () => void;
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
    href: '/buscar',
    icon: MagnifyingGlassIcon,
    iconSolid: MagnifyingGlassIconSolid,
  },
  {
    name: 'Favoritos',
    href: '/favoritos',
    icon: HeartIcon,
    iconSolid: HeartIconSolid,
    badge: 3,
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: UserIcon,
    iconSolid: UserIconSolid,
  },
];

export default function ButtonNav({ 
  items = defaultNavigation,
  showHomeIndicator = true,
  accentColor = 'blue',
  className = '',
  hideOnProducts = false,
  onToggleSidebar
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
          active: 'text-blue-600 dark:text-blue-400',
          activeBg: 'bg-blue-100 dark:bg-blue-900/30',
          hover: 'hover:text-blue-600 dark:hover:text-blue-400',
          hoverBg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
          indicator: 'bg-blue-600 dark:bg-blue-400',
          gradient: 'from-blue-500 via-purple-500 to-pink-500'
        };
      case 'amber':
        return {
          active: 'text-amber-600 dark:text-amber-400',
          activeBg: 'bg-amber-100 dark:bg-amber-900/30',
          hover: 'hover:text-amber-600 dark:hover:text-amber-400',
          hoverBg: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20',
          indicator: 'bg-amber-600 dark:bg-amber-400',
          gradient: 'from-amber-500 via-orange-500 to-red-500'
        };
      case 'green':
        return {
          active: 'text-green-600 dark:text-green-400',
          activeBg: 'bg-green-100 dark:bg-green-900/30',
          hover: 'hover:text-green-600 dark:hover:text-green-400',
          hoverBg: 'group-hover:bg-green-50 dark:group-hover:bg-green-900/20',
          indicator: 'bg-green-600 dark:bg-green-400',
          gradient: 'from-green-500 via-emerald-500 to-teal-500'
        };
      default:
        return {
          active: 'text-blue-600 dark:text-blue-400',
          activeBg: 'bg-blue-100 dark:bg-blue-900/30',
          hover: 'hover:text-blue-600 dark:hover:text-blue-400',
          hoverBg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
          indicator: 'bg-blue-600 dark:bg-blue-400',
          gradient: 'from-blue-500 via-purple-500 to-pink-500'
        };
    }
  };

  const colors = getAccentColors();

  // Función para manejar el clic en el botón de menú
  const handleMenuClick = () => {
    if (pathname === '/productos' && onToggleSidebar) {
      onToggleSidebar();
    }
  };

  // Renderizar el botón de navegación
  const renderNavButton = (item: NavItem) => {
    const isActive = pathname === item.href;
    const isMenuButton = pathname === '/productos' && item.href === '/';
    const IconComponent = isActive ? item.iconSolid : item.icon;
    
    // Si estamos en /productos y es el botón de inicio, mostrar menú hamburguesa
    if (isMenuButton) {
      return (
        <button
          onClick={handleMenuClick}
          className={`flex flex-col items-center justify-center w-full py-0.5 px-1 rounded-xl transition-all duration-300 ease-in-out group relative
            ${isActive ? colors.active : 'text-gray-600 dark:text-gray-400'} ${colors.hover}`}
        >
          {/* Icono */}
          <div className={`relative p-1 rounded-full transition-all duration-300
            ${isActive ? colors.activeBg : colors.hoverBg}`}
          >
            <Bars3Icon 
              className={`w-4 h-4 transition-all duration-300
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
          <span className={`text-xs font-medium mt-0 transition-all duration-300
            ${isActive ? colors.active : 'text-gray-600 dark:text-gray-400'} ${colors.hover}`}
          >
            Categorías
          </span>
        </button>
      );
    }

    // Botón normal para otras páginas
    return (
      <Link
        href={item.href}
        className={`flex flex-col items-center justify-center w-full py-0.5 px-1 rounded-xl transition-all duration-300 ease-in-out group relative
          ${isActive ? colors.active : 'text-gray-600 dark:text-gray-400'} ${colors.hover}`}
      >
        {/* Icono */}
        <div className={`relative p-1 rounded-full transition-all duration-300
          ${isActive ? colors.activeBg : colors.hoverBg}`}
        >
          <IconComponent 
            className={`w-4 h-4 transition-all duration-300
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
        <span className={`text-xs font-medium mt-0 transition-all duration-300
          ${isActive ? colors.active : 'text-gray-600 dark:text-gray-400'} ${colors.hover}`}
        >
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Espaciador para evitar que el contenido se oculte detrás del nav */}
      <div className="h-14 md:hidden" />
      
      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${className}`}>
        {/* Fondo con blur y borde superior */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/60 shadow-lg">
          <div className="flex items-center justify-around px-2 py-1.5">
            {items.map((item) => (
              <div key={item.name}>
                {renderNavButton(item)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Indicador de home (barra de colores en la parte inferior) */}
        {showHomeIndicator && (
          <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />
        )}
      </nav>
    </>
  );
} 