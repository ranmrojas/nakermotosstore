"use client";

import Image from "next/image";
import Link from "next/link";
import { Bars3Icon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { usePathname } from "next/navigation";
import { useCart } from "../../../hooks/useCart";
import { useClientSession } from '@/hooks/useClientSession';
import { useState, useEffect } from 'react';
import SidebarNav from "./SidebarNav";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { totalItems, totalPrice } = useCart();
  const showHamburger = pathname === "/productos" && typeof onToggleSidebar === "function";
  const { session } = useClientSession();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // No renderizar contenido que depende de la sesión hasta que esté hidratado
  const shouldShowSessionContent = isHydrated && session && session.nombre;

  return (
         <header className="w-full bg-white border-b border-gray-200 flex items-center justify-start pt-2 sticky top-0 z-40 relative" style={{ minHeight: '40px', height: '40px' }}>
       <div className="flex items-center w-full px-2 justify-between">
         <Link href="/" className="flex items-center justify-start">
          <Image
            src="/logo.png"
            alt="Naker Motos"
            width={100}
            height={32}
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            priority
          />
        </Link>
        
        {/* Botones de acción - lado derecho */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Botón hamburguesa solo en /productos */}
          {showHamburger && (
            <button
              onClick={onToggleSidebar}
              className="flex flex-col items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Abrir menú de categorías"
            >
              <Bars3Icon className="w-6 h-6 text-gray-700" />
                             <span className="text-[10px] text-gray-700 leading-none mt-1 mb-0.5">Categorías</span>
            </button>
          )}
          
          {/* Icono del carrito */}
          <Link
            href="/carrito"
            className="relative flex flex-col items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-50 transition-colors"
            aria-label="Ver carrito"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBagIcon className="h-7 w-7 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white shadow z-10">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
          </Link>
          
          {/* Valor total del pedido y perfil juntos si hay items */}
          {totalItems > 0 ? (
            <>
              <Link
                href="/carrito"
                className="text-xs font-bold text-gray-800 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Ver carrito"
              >
                ${totalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Link>
              <Link
                href="/cuenta"
                className="flex flex-row items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-50 transition-colors"
                aria-label="Perfil del cliente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V19.5z" />
                </svg>
                {shouldShowSessionContent && (
                  <div className="ml-2 flex flex-col">
                    <div className="text-xs text-black">Hola,</div>
                    <div className="text-xs font-bold text-black truncate max-w-[100px]">{session.nombre.split(' ')[0]}</div>
                  </div>
                )}
              </Link>
            </>
          ) : (
            // Si no hay items, el icono de perfil va al final
            <Link
              href="/cuenta"
              className="flex flex-row items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-50 transition-colors"
              aria-label="Perfil del cliente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V19.5z" />
              </svg>
              {shouldShowSessionContent && (
                <div className="ml-2 flex flex-col">
                  <div className="text-xs text-black">Hola,</div>
                  <div className="text-xs font-bold text-black truncate max-w-[100px]">{session.nombre.split(' ')[0]}</div>
                </div>
              )}
            </Link>
          )}
          
          {/* Icono de menú hamburguesa */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-gray-50 transition-colors"
            aria-label="Abrir menú principal"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
                         <span className="text-[10px] text-gray-700 leading-none mt-1 mb-0.5">Menú</span>
          </button>
          
          {/* Sidebar Navigation */}
          <SidebarNav 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            accentColor="amber"
          />
        </div>
      </div>
    </header>
  );
}
