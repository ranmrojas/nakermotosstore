'use client';
import dynamic from 'next/dynamic';

const PerfilCliente = dynamic(() => import('../../componentes/personas/PerfilCliente'), { ssr: false });

export default function CuentaPage() {
  return <PerfilCliente />;
} 