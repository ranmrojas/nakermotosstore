"use client";
import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import AdminSidebar from './AdminSidebar';

// Contexto para el estado del sidebar
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar debe usarse dentro de un SidebarProvider');
  }
  return context;
};

interface AdminProtectedProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminProtectedProps) {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className={`flex-1 min-h-screen transition-all duration-300 ${isOpen ? 'pl-64' : 'pl-0'}`}>
        {children}
      </main>
    </div>
  );
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Ya redirigirá en el useEffect
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <AdminLayout>{children}</AdminLayout>
    </SidebarContext.Provider>
  );
} 