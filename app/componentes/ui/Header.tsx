"use client";

import Image from "next/image";
import Link from "next/link";
import { Bars3Icon } from '@heroicons/react/24/outline';
import { usePathname } from "next/navigation";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const showHamburger = pathname === "/productos" && typeof onToggleSidebar === "function";

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-center" style={{ minHeight: '40px', height: '40px' }}>
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
        {/* Botón hamburguesa solo en /productos, ahora a la derecha */}
        {showHamburger && (
          <button
            onClick={onToggleSidebar}
            className="ml-2 flex flex-col items-center p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Abrir menú de categorías"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
            <span className="text-[10px] text-gray-700 mt-0.5 leading-none">Categorías</span>
          </button>
        )}
      </div>
    </header>
  );
}
