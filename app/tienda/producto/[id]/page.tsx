'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById, getProductImageUrls, Product } from '@/app/services/productService';

interface ProductDetailProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const productData = await getProductById(params.id);
        
        if (productData) {
          setProduct(productData);
          
          // Obtener URLs de imagen
          const urls = getProductImageUrls(productData);
          setImageUrls(urls);
          
          // Establecer imagen principal
          if (urls.length > 0) {
            setMainImage(urls[0]);
          }
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-800"></div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error || 'No se pudo cargar el producto'}</p>
          <Link href="/tienda/productos" className="inline-block px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors">
            Volver a Productos
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/tienda" className="text-gray-700 hover:text-amber-800">
              Inicio
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <Link href="/tienda/productos" className="ml-1 text-gray-700 hover:text-amber-800 md:ml-2">
                Productos
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-amber-800 font-medium md:ml-2">
                {product.nombre}
              </span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Imágenes del producto */}
          <div className="md:w-1/2 p-6">
            <div className="mb-4 h-80 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src={mainImage}
                alt={product.nombre}
                width={400}
                height={400}
                className="object-contain max-h-full"
                unoptimized={true} // Evita que Next.js optimice la imagen externa
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/file.svg';
                }}
              />
            </div>
            
            {/* Miniatura de imágenes alternativas */}
            {imageUrls.length > 1 && (
              <div className="flex space-x-2 mt-4">
                {imageUrls.map((url, index) => (
                  <div 
                    key={index}
                    className={`w-16 h-16 border-2 rounded cursor-pointer ${mainImage === url ? 'border-amber-800' : 'border-gray-200'}`} 
                    onClick={() => setMainImage(url)}
                  >
                    <Image
                      src={url}
                      alt={`${product.nombre} - Vista ${index + 1}`}
                      width={60}
                      height={60}
                      className="object-contain w-full h-full"
                      unoptimized={true} // Evita que Next.js optimice la imagen externa
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/file.svg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Información del producto */}
          <div className="md:w-1/2 p-6">
            <div className="flex items-center mb-2">
              <span className="bg-amber-800 text-white text-xs px-2 py-1 rounded mr-2">
                {product.nombre_marca}
              </span>
              <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                {product.nombre_categoria}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.nombre}</h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-amber-800">
                ${product.precio_venta_online || product.precio_venta}
              </span>
              {product.precio_venta_online !== null && product.precio_venta_online !== product.precio_venta && (
                <span className="text-lg text-gray-500 line-through">
                  ${product.precio_venta}
                </span>
              )}
            </div>
            
            <div className="mb-6">
              {product.existencias > 0 ? (
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  En Stock ({product.existencias} unidades)
                </span>
              ) : product.vende_sin_existencia === 1 ? (
                <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Disponible bajo pedido
                </span>
              ) : (
                <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Agotado
                </span>
              )}
            </div>
            
            <div className="prose prose-amber mb-6">
              <h2 className="text-lg font-semibold mb-2">Descripción</h2>
              <div className="whitespace-pre-line text-gray-700">
                {product.nota || "No hay descripción disponible para este producto."}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button 
                className="px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors flex items-center"
                disabled={product.existencias === 0 && product.vende_sin_existencia !== 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Añadir al Carrito
              </button>
              
              <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            
            {/* Información adicional */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                <span className="font-medium">SKU:</span> {product.sku}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">ID:</span> {product.id_producto}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
