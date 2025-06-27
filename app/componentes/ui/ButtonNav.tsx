'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  Bars3Icon
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

// Icono personalizado de WhatsApp
const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 3.617h-.001a8.807 8.807 0 01-4.473-1.231l-.321-.191-3.326.889.889-3.24-.209-.332A8.824 8.824 0 013.1 12.045c0-4.86 3.952-8.808 8.824-8.808 2.357 0 4.571.917 6.237 2.584a8.74 8.74 0 012.584 6.224c-.003 4.86-3.951 8.808-8.822 8.808m7.666-16.474A10.92 10.92 0 0011.924 1.1C5.504 1.1.1 6.504.1 12.92c0 2.283.594 4.522 1.722 6.475L.057 23.925a1.003 1.003 0 00.991 1.255c.13 0 .262-.021.388-.065l4.634-1.545a10.888 10.888 0 005.854 1.708h.005c6.419 0 11.824-5.404 11.824-11.82 0-2.828-1.104-5.487-3.108-7.491" />
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
    name: 'Vape',
    href: '/vape',
    icon: VapeIcon,
    iconSolid: VapeIconSolid,
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/573043668910',
    icon: WhatsAppIcon,
    iconSolid: WhatsAppIcon,
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
      <div className="h-12 md:hidden" />
      
      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${className}`}>
        {/* Fondo con blur y borde superior */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/60 shadow-lg">
          <div className="flex items-center justify-around px-2 py-1">
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