"use client";

import Image from "next/image";
import Link from "next/link";
import { Bars3Icon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { usePathname } from "next/navigation";
import { useCart } from "../../../hooks/useCart";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { totalItems, totalPrice } = useCart();
  const showHamburger = pathname === "/productos" && typeof onToggleSidebar === "function";

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-center pt-2 sticky top-0 z-40" style={{ minHeight: '40px', height: '40px' }}>
      <div className="flex items-center w-full max-w-xs mx-auto px-2 justify-between">
        <Link href="/" className="flex items-center flex-1 justify-center">
          <Image
            src="/logo.png"
            alt="Licorera Zona Frank"
            width={100}
            height={32}
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            priority
          />
        </Link>
        
        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {/* Botón hamburguesa solo en /productos */}
          {showHamburger && (
            <button
              onClick={onToggleSidebar}
              className="flex flex-col items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Abrir menú de categorías"
            >
              <Bars3Icon className="w-6 h-6 text-gray-700" />
              <span className="text-[10px] text-gray-700 mt-0.5 leading-none">Categorías</span>
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
            {/* <span className="text-[10px] text-gray-700 mt-0.5 leading-none">Carrito</span> */}
          </Link>
          
          {/* Valor total del pedido */}
          {totalItems > 0 && (
            <Link
              href="/carrito"
              className="text-xs font-bold text-gray-800 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Ver carrito"
            >
              ${totalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
