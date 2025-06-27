'use client';

import { useState } from 'react';
import Link from 'next/link';
import { preloadService } from '../lib/preloadService';
import { syncService } from '../lib/indexedDB/syncService';
import { indexedDBService } from '../lib/indexedDB/database';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTestIndexedDB = async () => {
    setLoading(true);
    setMessage('Probando IndexedDB...');
    
    try {
      // Inicializar IndexedDB
      await indexedDBService.init();
      setMessage('IndexedDB inicializado correctamente');
      
      // Sincronizar categorías
      const result = await syncService.syncCategorias();
      if (result.success) {
        setMessage(`✅ Sincronización exitosa: ${result.data?.length} categorías cargadas`);
      } else {
        setMessage(`❌ Error en sincronización: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreload = async () => {
    setLoading(true);
    setMessage('Iniciando preload...');
    
    try {
      await preloadService.startSilentPreload();
      setMessage('✅ Preload completado exitosamente');
    } catch (error) {
      setMessage(`❌ Error en preload: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-800 mb-4">
            Licorera Zona Frank
          </h1>
          <p className="text-xl text-amber-700">
            Sistema de Gestión de Productos
          </p>
        </div>

        {/* Botones de prueba */}
        <div className="max-w-md mx-auto mb-8 space-y-4">
          <button
            onClick={handleTestIndexedDB}
            disabled={loading}
            className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Probando...' : 'Probar IndexedDB'}
          </button>
          
          <button
            onClick={handlePreload}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Iniciar Preload'}
          </button>
        </div>

        {message && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-white rounded-lg shadow">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/productos" className="group">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Productos</h3>
                <p className="text-gray-600">Gestionar catálogo de productos</p>
              </div>
            </div>
          </Link>

          <Link href="/vape" className="group">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Vape</h3>
                <p className="text-gray-600">Productos de vape y accesorios</p>
              </div>
            </div>
          </Link>

          <Link href="/busqueda" className="group">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Búsqueda</h3>
                <p className="text-gray-600">Buscar productos específicos</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
