'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClientSession } from '@/hooks/useClientSession';
import {
  HomeIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';

// Iconos personalizados importados del ButtonNav
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

interface SidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  items?: NavItem[];
  accentColor?: string;
}

// Configuración por defecto (misma que ButtonNav)
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
    name: 'Pedidos',
    href: '/pedidos',
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
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
    href: 'https://wa.me/573043668910',
    icon: WhatsAppIcon,
    iconSolid: WhatsAppIcon,
  },
];

export default function SidebarNav({ 
  isOpen, 
  onClose,
  items = defaultNavigation,
  accentColor = 'amber'
}: SidebarNavProps) {
  const pathname = usePathname();
  const { session } = useClientSession();
  
  // Cerrar el sidebar al hacer clic en un enlace
  const handleLinkClick = () => {
    onClose();
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('clienteSession');
    localStorage.removeItem('client_session');
    window.location.reload();
    onClose();
  };

  // Cerrar sidebar con la tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    
    // Bloquear scroll cuando está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Colores dinámicos basados en accentColor
  const getAccentColors = () => {
    switch (accentColor) {
      case 'amber':
        return {
          active: 'text-gray-800',
          activeBg: 'bg-gray-100',
          hover: 'hover:text-gray-700',
          hoverBg: 'hover:bg-gray-100',
          indicator: 'bg-gray-600',
        };
      default:
        return {
          active: 'text-gray-800',
          activeBg: 'bg-gray-100',
          hover: 'hover:text-gray-700',
          hoverBg: 'hover:bg-gray-100',
          indicator: 'bg-gray-600',
        };
    }
  };

  const colors = getAccentColors();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay de fondo */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-64 max-w-[80%] bg-white shadow-xl z-50 flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Menú</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Links de navegación */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = isActive ? item.iconSolid : item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? `${colors.active} ${colors.activeBg}` 
                        : `text-gray-600 ${colors.hover} ${colors.hoverBg}`
                    }`}
                  >
                    <IconComponent className={`mr-3 h-5 w-5 ${isActive ? 'text-gray-800' : ''}`} />
                    <span className="font-medium">{item.name}</span>
                    
                    {/* Badge si existe */}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    
                    {/* Indicador de página activa */}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-800"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Botón de sesión */}
        <div className="p-4 border-t border-gray-200">
          {session ? (
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition border border-red-200"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              href="/cuenta"
              onClick={handleLinkClick}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center block"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
        
        {/* Footer con información */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Naker Motos</p>
        </div>
      </div>
    </>
  );
}