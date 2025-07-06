"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { useSidebar } from '../admin/AdminProtected';

// Componente del botón flotante
function FloatingButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="fixed top-2 left-4 z-50">
      <button
        onClick={onOpen}
        className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Abrir menú de administración"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
    </div>
  );
}

// Componente del sidebar
function SidebarContent() {
  const { setIsOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();

  const navItems = [
    { label: "Dashboard", href: "/admin", adminOnly: true },
    { label: "Tracking", href: "/admin/tracking" },
    { label: "Usuarios", href: "/admin/usuarios", adminOnly: true },
    { label: "Historial", href: "/admin/historial" },
    { label: "Categorías", href: "/admin/categorias", adminOnly: true },
  ];

  return (
    <aside className="h-screen w-64 bg-white border-r flex flex-col justify-between fixed top-0 left-0 z-40 shadow-lg">
      <div>
        {/* Logo, título y botón cerrar */}
        <div className="flex items-center gap-2 px-6 py-6 border-b relative">
          <span className="text-xl font-bold text-gray-900">Panel Admin</span>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 focus:outline-none transition-colors"
            aria-label="Cerrar sidebar"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Navegación */}
        <nav className="mt-6 flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            if (item.adminOnly && user?.rol !== 'admin') return null;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? "bg-gray-200 text-gray-800 font-semibold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Usuario y logout */}
      <div className="px-6 py-4 border-t flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-800">
            {user?.nombre?.charAt(0) || '?'}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{user?.nombre}</div>
            <div className="text-xs text-gray-700 bg-gray-100 rounded px-2 py-0.5 inline-block mt-1">{user?.rol}</div>
          </div>
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push('/admin/login');
          }}
          className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          aria-label="Cerrar sesión"
        >
          {/* Heroicons Logout Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

// Componente principal que maneja el estado
export default function AdminSidebar() {
  const { isOpen, setIsOpen } = useSidebar();

  return isOpen ? <SidebarContent /> : <FloatingButton onOpen={() => setIsOpen(true)} />;
} 