'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useProductos } from '../../../hooks/useProductos';
import { getProductImageUrl } from '@/app/services/productService';
import ProductSkeleton from './ProductSkeleton';
import { useRouter } from 'next/navigation';

// Definir la interfaz Producto basada en la del hook
interface Producto {
  id_producto: number;
  nombre: string;
  alias: string;
  // Campos de precios originales (pueden estar vacíos ya que se obtienen del API)
  precio_venta?: number;
  precio_venta_online?: number | null;
  precio_promocion_online?: number;
  // Campos de precios en tiempo real
  precio_venta_real?: number;
  precio_venta_online_real?: number | null;
  precio_promocion_online_real?: number;
  tiene_promocion_activa?: boolean;
  precio_final?: number;
  precio_formateado?: string;
  precios_actualizados?: boolean;
  // CAMPOS DE EXISTENCIAS EN TIEMPO REAL
  existencias_real?: number;
  vende_sin_existencia_real?: number;
  existencias_actualizadas?: boolean;
  // Campos de existencias locales (deprecados - usar los reales)
  existencias?: number;
  vende_sin_existencia?: number;
  id_categoria: number;
  nombre_categoria: string;
  id_marca: number;
  nombre_marca: string;
  id_imagen: number | null;
  ext1: string | null;
  ext2: string | null;
  mostrar_tienda_linea: number;
  mostrar_catalogo_linea: number;
  es_servicio: number;
  fecha_Ini_promocion_online: number | null;
  fecha_fin_promocion_online: number | null;
  dias_aplica_promocion_online: string | null;
  controla_inventario_tienda_linea: number;
  id_cocina: number | null;
  tiempo_preparacion: number;
  tipo_promocion_online: number;
  id_padre: number | null;
  sku: string;
  total_estampilla: number;
  total_impoconsumo: number;
  cups: string | null;
  configuracion_dinamica: string | null;
  id_sucursal: number;
  vender_solo_presentacion: number;
  presentaciones: string | null;
  id_tipo_medida: number;
  id_tipo_producto: number;
  tipo_impuesto: number;
  id_impuesto: number;
  valor_impuesto: number;
  invima: string;
  cum: string;
  nota: string;
  unidad_medida: string;
  nombre_impuesto: string;
  dias_aplica_venta_online: string;
  hora_aplica_venta_online: string;
  hora_aplica_venta_fin_online: string;
  hora_Ini_promocion_online: string | null;
  hora_fecha_fin_promocion_online: string | null;
  [key: string]: unknown;
}

interface CategoriaProductos {
  id: number;
  nombre: string;
  productos: Producto[];
  totalProductos: number;
  mostrarTodos: boolean;
}

interface ProductGridProps {
  categoryId?: string | number | null;
  productos?: Producto[]; // Nueva prop para productos específicos
  showAddToCart?: boolean;
  targetProductId?: number | null;
  isSearchResults?: boolean; // Nueva prop para indicar si son resultados de búsqueda
  loadAllCategories?: boolean; // Nueva prop para cargar todas las categorías
  productsPerCategory?: number; // Nueva prop para límite de productos por categoría
  onCategoryTagClick?: (categoryId: number) => void; // Handler personalizado para clic en tag de categoría
  onBrandTagClick?: (brandName: string) => void; // Handler personalizado para clic en tag de marca
}

export default function ProductGrid({ 
  categoryId = null, 
  productos: productosProp,
  showAddToCart = true,
  targetProductId = null,
  isSearchResults = false,
  loadAllCategories = false,
  productsPerCategory = 10,
  onCategoryTagClick,
  onBrandTagClick
}: ProductGridProps) {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Nuevo estado para categorías múltiples
  const [categoriasProductos, setCategoriasProductos] = useState<CategoriaProductos[]>([]);
  const [loadingAllCategories, setLoadingAllCategories] = useState(false);

  // Usar el hook de productos
  const { getProductosByCategoria } = useProductos();
  const router = useRouter();

  // URL para imágenes utilizando el servicio centralizado
  const getImageUrl = (id: number, ext: string) => {
    return getProductImageUrl(id, ext);
  };
  
  // Verificar disponibilidad
  const isAvailable = (existencias: number | undefined, vende_sin_existencia: number | undefined) => {
    return (existencias ?? 0) > 0 || (vende_sin_existencia ?? 0) === 1;
  };

  // Función para abrir el modal
  const openModal = (product: Producto) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Función para cargar todas las categorías
  const loadAllCategoriesData = useCallback(async () => {
    setLoadingAllCategories(true);
    try {
      // Obtener todas las categorías activas
      const response = await fetch('/api/categorias?activa=true');
      if (!response.ok) {
        throw new Error(`Error al obtener categorías: ${response.status}`);
      }
      
      const data = await response.json();
      // Validar que data sea un array
      const categorias = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      
      if (categorias.length === 0) {
        console.warn('No se encontraron categorías activas');
        setCategoriasProductos([]);
        setLoadingAllCategories(false);
        return;
      }
      
      const categoriasConProductos: CategoriaProductos[] = [];
      
      // Orden específico: primero las categorías principales
      const categoriasPrincipales = [15, 46, 33]; // Cerveza, Vapeadores, Licores
      const categoriasRestantes = categorias.filter((cat: { id: number }) => !categoriasPrincipales.includes(cat.id));
      
      // Cargar primero las categorías principales en el orden especificado
      for (const categoriaId of categoriasPrincipales) {
        const categoria = categorias.find((cat: { id: number }) => cat.id === categoriaId);
        if (categoria) {
          try {
            const productos = await getProductosByCategoria(categoriaId);
            const availableProducts = productos.filter(
              product => isAvailable(product.existencias_real, product.vende_sin_existencia_real)
            );
            
            categoriasConProductos.push({
              id: categoria.id,
              nombre: categoria.nombre,
              productos: availableProducts.slice(0, productsPerCategory),
              totalProductos: availableProducts.length,
              mostrarTodos: false
            });
          } catch (error) {
            console.error(`Error cargando categoría ${categoria.nombre}:`, error);
          }
        }
      }
      
      // Luego cargar el resto de categorías
      for (const categoria of categoriasRestantes) {
        try {
          const productos = await getProductosByCategoria(categoria.id);
          const availableProducts = productos.filter(
            product => isAvailable(product.existencias_real, product.vende_sin_existencia_real)
          );
          
          categoriasConProductos.push({
            id: categoria.id,
            nombre: categoria.nombre,
            productos: availableProducts.slice(0, productsPerCategory),
            totalProductos: availableProducts.length,
            mostrarTodos: false
          });
        } catch (error) {
          console.error(`Error cargando categoría ${categoria.nombre}:`, error);
        }
      }
      
      setCategoriasProductos(categoriasConProductos);
    } catch (error) {
      console.error('Error cargando todas las categorías:', error);
      setCategoriasProductos([]);
    } finally {
      setLoadingAllCategories(false);
    }
  }, [getProductosByCategoria, productsPerCategory]);

  // Función para cargar productos usando el hook
  const loadProducts = useCallback(async (catId: number | null) => {
    if (catId === null) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let allProducts: Producto[] = [];
      
      // Si es la categoría 15 (Cerveza), cargar también categorías 46 y 33
      if (catId === 15) {
        const categoryIds = [15, 46, 33]; // Cerveza, Vapeadores, Licores
        for (const categoryId of categoryIds) {
          const data = await getProductosByCategoria(categoryId);
          const availableProducts = data.filter(
            product => isAvailable(product.existencias_real, product.vende_sin_existencia_real)
          );
          allProducts.push(...availableProducts);
        }
      } else {
        // Para otras categorías, cargar solo la categoría seleccionada
        const data = await getProductosByCategoria(catId);
        const availableProducts = data.filter(
          product => isAvailable(product.existencias_real, product.vende_sin_existencia_real)
        );
        allProducts = availableProducts;
      }
      
      setProducts(allProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [getProductosByCategoria]);

  // Efecto para manejar productos desde props o categoría
  useEffect(() => {
    if (productosProp) {
      // Si se pasan productos como prop (resultados de búsqueda)
      setProducts(productosProp);
      setLoading(false);
      setError(null);
    } else if (loadAllCategories) {
      // Si se solicita cargar todas las categorías
      loadAllCategoriesData();
      setLoading(false);
    } else if (categoryId !== null && categoryId !== undefined) {
      // Si se pasa categoryId, cargar productos de esa categoría
      loadProducts(typeof categoryId === 'string' ? parseInt(categoryId) : categoryId as number);
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [categoryId, productosProp, loadProducts, loadAllCategories, loadAllCategoriesData]);

  // Efecto para abrir automáticamente el modal del producto específico cuando se carga
  useEffect(() => {
    if (targetProductId && !loading && products.length > 0) {
      const targetProduct = products.find(p => p.id_producto === targetProductId);
      if (targetProduct) {
        openModal(targetProduct);
      }
    }
  }, [targetProductId, products, loading]);

  // Función para mostrar todos los productos de una categoría
  const handleShowAllCategory = async (categoriaId: number) => {
    try {
      const productos = await getProductosByCategoria(categoriaId);
      const availableProducts = productos.filter(
        product => isAvailable(product.existencias_real, product.vende_sin_existencia_real)
      );
      
      setCategoriasProductos(prev => prev.map(cat => 
        cat.id === categoriaId 
          ? { ...cat, productos: availableProducts, mostrarTodos: true }
          : cat
      ));
    } catch (error) {
      console.error('Error cargando todos los productos de la categoría:', error);
    }
  };

  // Función helper para obtener el precio correcto
  const getPrecioCorrecto = (product: Producto) => {
    // Si tiene precios reales actualizados, usar esos
    if (product.precios_actualizados && product.precio_final !== undefined) {
      return product.precio_final;
    }
    // Si tiene precio_venta_online_real, usar ese
    if (product.precio_venta_online_real !== undefined && product.precio_venta_online_real !== null) {
      return product.precio_venta_online_real;
    }
    // Si tiene precio_venta_real, usar ese
    if (product.precio_venta_real !== undefined) {
      return product.precio_venta_real;
    }
    // Fallback a precios originales
    return product.precio_venta_online !== null ? product.precio_venta_online : product.precio_venta;
  };

  // Función helper para obtener el precio base (para comparaciones)
  const getPrecioBase = (product: Producto) => {
    // Si tiene precios reales actualizados, usar precio_venta_real
    if (product.precios_actualizados && product.precio_venta_real !== undefined) {
      return product.precio_venta_real;
    }
    // Fallback a precio original
    return product.precio_venta || 0;
  };

  // Función helper para verificar si hay oferta
  const tieneOferta = (product: Producto) => {
    const precioOnline = product.precio_venta_online_real !== undefined ? product.precio_venta_online_real : product.precio_venta_online;
    const precioBase = getPrecioBase(product);
    return precioOnline !== null && precioOnline !== undefined && precioBase !== undefined && precioOnline < precioBase;
  };

  // Mostrar loading solo si no hay productos y está cargando inicialmente
  if (loading && products.length === 0 && categoriasProductos.length === 0) {
    return <ProductSkeleton count={20} />;
  }

  // Mostrar skeletons mientras se cargan todas las categorías
  if (loadAllCategories && loadingAllCategories && categoriasProductos.length === 0) {
    return <ProductSkeleton count={20} />;
  }

  // Mostrar skeletons si está cargando y no hay productos específicos
  if (loading && products.length === 0 && !productosProp) {
    return <ProductSkeleton count={20} />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => {
            if (categoryId !== null) {
              loadProducts(typeof categoryId === 'string' ? parseInt(categoryId) : categoryId as number);
            }
          }}
          className="px-4 py-2 bg-amber-800 dark:bg-amber-600 text-white rounded-lg hover:bg-amber-900 dark:hover:bg-amber-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Mostrar categorías múltiples */}
      {loadAllCategories && categoriasProductos.length > 0 ? (
        <div className="space-y-8">
          {categoriasProductos.map((categoria) => (
            <div key={categoria.id} className="border-b border-gray-200 pb-6">
              {/* Título de la categoría */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {categoria.nombre}
                </h3>
                <span className="text-sm text-gray-500">
                  {categoria.productos.length} de {categoria.totalProductos} productos
                </span>
              </div>
              
              {/* Grid de productos de la categoría */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {categoria.productos.map((product) => (
                  <div
                    key={product.id_producto}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center p-1 sm:p-2 h-full min-h-[180px] hover:shadow-md transition-shadow cursor-pointer"
                    style={{ paddingBottom: 0 }}
                    onClick={() => openModal(product)}
                  >
                    <div className="flex flex-col items-center w-full h-full">
                      <div className="relative w-full aspect-square bg-white rounded-t-lg">
                        <Image
                          src={product.id_imagen && product.ext1 ? getImageUrl(product.id_imagen, product.ext1) : '/file.svg'}
                          alt={product.nombre}
                          fill
                          className="object-cover w-full h-full rounded-t-lg"
                          unoptimized={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (product.ext2 && product.ext2 !== product.ext1 && product.id_imagen) {
                              target.src = getImageUrl(product.id_imagen, product.ext2);
                              target.onerror = () => {
                                target.src = '/file.svg';
                                target.onerror = null;
                              };
                            } else {
                              target.src = '/file.svg';
                            }
                          }}
                        />
                        {/* Tag de OFERTA cuando hay descuento */}
                        {tieneOferta(product) && (
                          <div className="absolute top-1 left-1 z-10 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                            OFERTA
                          </div>
                        )}
                      </div>
                      <div className="flex-1 w-full flex flex-col justify-between items-center p-2 pb-1">
                        <h3 className="text-xs font-medium text-center text-gray-900 line-clamp-2 w-full mb-1 min-h-[2.2em]">
                          {product.nombre}
                        </h3>
                        {product.nota && (
                          <div className="w-full text-center text-gray-500 text-[10px] line-clamp-2 mb-1 italic">
                            {product.nota}
                          </div>
                        )}
                        <div className="flex items-center justify-between w-full mt-auto mb-0">
                          <div className="flex flex-col mb-0 pb-0">
                            <span className={`${tieneOferta(product) ? 'text-green-600 text-base font-bold' : 'text-gray-800 font-bold text-sm'}`}>
                              ${(getPrecioCorrecto(product))?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            {tieneOferta(product) && (
                              <span className="text-red-400 text-xs line-through font-medium" style={{ fontSize: '0.8rem', marginTop: '-2px' }}>
                                ${getPrecioBase(product)?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </div>
                          {showAddToCart && (product.existencias_real ?? 0) > 0 ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const message = `Hola, quiero pedir:\n1 ${product.nombre}\nValor: $${getPrecioCorrecto(product)?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\nsku: ${product.sku || '000'}\n\n¿Cuál sería el valor del domicilio?`;
                                window.open(`https://wa.me/573043668910?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="ml-2 w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                              aria-label={`Pedir ${product.nombre} por WhatsApp`}
                            >
                              {/* Icono de suma moderno */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="currentColor" className="text-green-600" />
                                <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </button>
                          ) : (product.existencias_real ?? 0) <= 0 ? (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              Agotado
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botón "Mostrar todo" si hay más productos */}
              {categoria.totalProductos > categoria.productos.length && !categoria.mostrarTodos && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => handleShowAllCategory(categoria.id)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                  >
                    Mostrar todos los {categoria.totalProductos} productos de {categoria.nombre}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid de productos tradicional */}
          {products.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">
                {isSearchResults ? 'No se encontraron productos que coincidan con tu búsqueda' : 'No hay productos disponibles en esta categoría'}
              </p>
            </div>
          ) : (
            <div 
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 ${
                isSearchResults ? '' : ''
              }`}
            >
              {products.map((product) => (
                <div
                  key={product.id_producto}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center p-1 sm:p-2 h-full min-h-[180px] hover:shadow-md transition-shadow cursor-pointer"
                  style={{ paddingBottom: 0 }}
                  onClick={() => openModal(product)}
                >
                  <div className="flex flex-col items-center w-full h-full">
                    <div className="relative w-full aspect-square bg-white rounded-t-lg">
                      <Image
                        src={product.id_imagen && product.ext1 ? getImageUrl(product.id_imagen, product.ext1) : '/file.svg'}
                        alt={product.nombre}
                        fill
                        className="object-cover w-full h-full rounded-t-lg"
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (product.ext2 && product.ext2 !== product.ext1 && product.id_imagen) {
                            target.src = getImageUrl(product.id_imagen, product.ext2);
                            target.onerror = () => {
                              target.src = '/file.svg';
                              target.onerror = null;
                            };
                          } else {
                            target.src = '/file.svg';
                          }
                        }}
                      />
                      {/* Tag de OFERTA cuando hay descuento */}
                      {tieneOferta(product) && (
                        <div className="absolute top-1 left-1 z-10 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                          OFERTA
                        </div>
                      )}
                      {/* Icono de compartir sobre la imagen */}
                      <button
                        className="absolute top-1 right-1 z-10 p-1 bg-white/80 rounded-full hover:bg-amber-100 transition-colors"
                        title="Compartir"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Construir URL con categoría e ID de producto
                          // Asegurar que la categoría sea un valor válido
                          const catId = categoryId !== null ? categoryId : '';
                          const productUrl = `${window.location.origin}/productos?categoria=${catId}&producto=${product.id_producto}`;
                          
                          if (navigator.share) {
                            navigator.share({
                              title: product.nombre,
                              text: `Mira este producto: ${product.nombre}`,
                              url: productUrl
                            })
                            .catch(() => {
                              // Si falla el navigator.share, copiar al portapapeles como fallback
                              navigator.clipboard.writeText(productUrl);
                              setCopiedId(product.id_producto);
                              setTimeout(() => setCopiedId(null), 1200);
                            });
                          } else {
                            // Fallback para navegadores que no soportan Web Share API
                            navigator.clipboard.writeText(productUrl);
                            setCopiedId(product.id_producto);
                            setTimeout(() => setCopiedId(null), 1200);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="18" cy="5" r="2" />
                          <circle cx="6" cy="12" r="2" />
                          <circle cx="18" cy="19" r="2" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.5" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </button>
                      {copiedId === product.id_producto && (
                        <span className="absolute top-2 right-8 z-20 text-xs text-amber-600 bg-white/90 px-2 py-0.5 rounded shadow">¡Copiado!</span>
                      )}
                    </div>
                    <div className="flex-1 w-full flex flex-col justify-between items-center p-2 pb-1">
                      <h3 className="text-xs font-medium text-center text-gray-900 line-clamp-2 w-full mb-1 min-h-[2.2em]">
                        {product.nombre}
                      </h3>
                      {product.nota && (
                        <div className="w-full text-center text-gray-500 text-[10px] line-clamp-2 mb-1 italic">
                          {product.nota}
                        </div>
                      )}
                      <div className="flex items-center justify-between w-full mt-auto mb-0">
                        <div className="flex flex-col mb-0 pb-0">
                          <span className={`${tieneOferta(product) ? 'text-green-600 text-base font-bold' : 'text-gray-800 font-bold text-sm'}`}>
                            ${(getPrecioCorrecto(product))?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          {tieneOferta(product) && (
                            <span className="text-red-400 text-xs line-through font-medium" style={{ fontSize: '0.8rem', marginTop: '-2px' }}>
                              ${getPrecioBase(product)?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                        {showAddToCart && (product.existencias_real ?? 0) > 0 ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const message = `Hola, quiero pedir:\n1 ${product.nombre}\nValor: $${getPrecioCorrecto(product)?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\nsku: ${product.sku || '000'}\n\n¿Cuál sería el valor del domicilio?`;
                              window.open(`https://wa.me/573043668910?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="ml-2 w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                            aria-label={`Pedir ${product.nombre} por WhatsApp`}
                          >
                            {/* Icono de suma moderno */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="currentColor" className="text-green-600" />
                              <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        ) : (product.existencias_real ?? 0) <= 0 ? (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Agotado
                          </span>
                        ) : null}
                      </div>
                      {product.sku && (
                        <div className="w-full text-right text-gray-400 text-xs leading-none" style={{marginTop: "2px", marginBottom: 0, paddingBottom: 0}}>
                          sku: {product.sku}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Modal del producto */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-white/70 flex items-start justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mt-12 shadow-2xl border border-gray-200">
            {/* Header del modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Detalles del producto
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-4">
              {/* Imagen del producto */}
              <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-white" style={{ maxHeight: '220px' }}>
                <Image
                  src={selectedProduct.id_imagen && selectedProduct.ext1 ? getImageUrl(selectedProduct.id_imagen, selectedProduct.ext1) : '/file.svg'}
                  alt={selectedProduct.nombre}
                  fill
                  className="object-contain"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (selectedProduct.ext2 && selectedProduct.ext2 !== selectedProduct.ext1 && selectedProduct.id_imagen) {
                      target.src = getImageUrl(selectedProduct.id_imagen, selectedProduct.ext2);
                      target.onerror = () => {
                        target.src = '/file.svg';
                        target.onerror = null;
                      };
                    } else {
                      target.src = '/file.svg';
                    }
                  }}
                />
                {/* Icono flotante de compartir */}
                <button
                  className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-full hover:bg-amber-100 transition-colors"
                  title="Compartir"
                  onClick={() => {
                    // Construir URL con categoría e ID de producto
                    // Asegurar que la categoría sea un valor válido
                    const catId = categoryId !== null ? categoryId : '';
                    const productUrl = `${window.location.origin}/productos?categoria=${catId}&producto=${selectedProduct.id_producto}`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: selectedProduct.nombre,
                        text: `Mira este producto: ${selectedProduct.nombre}`,
                        url: productUrl
                      })
                      .catch(() => {
                        // Si falla el navigator.share, copiar al portapapeles como fallback
                        navigator.clipboard.writeText(productUrl);
                        alert('¡Enlace copiado al portapapeles!');
                      });
                    } else {
                      // Fallback para navegadores que no soportan Web Share API
                      navigator.clipboard.writeText(productUrl);
                      alert('¡Enlace copiado al portapapeles!');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="18" cy="5" r="2" />
                    <circle cx="6" cy="12" r="2" />
                    <circle cx="18" cy="19" r="2" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                {/* Tag de OFERTA en el modal cuando hay descuento */}
                {tieneOferta(selectedProduct) && (
                  <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded shadow-sm">
                    OFERTA
                  </div>
                )}
              </div>
              
              {/* Información del producto */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedProduct.nombre}
                </h3>
                {selectedProduct.nota && (
                  <div className="mt-1 mb-2 p-2 bg-amber-50 rounded text-amber-800 text-sm font-medium">
                    {selectedProduct.nota}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className={`text-2xl font-bold ${tieneOferta(selectedProduct) ? 'text-green-600 text-3xl' : 'text-gray-800'}`}>
                    ${(getPrecioCorrecto(selectedProduct))?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <div className="flex items-center gap-2">
                    {tieneOferta(selectedProduct) && (
                      <span className="text-red-400 text-base line-through font-medium">
                        ${getPrecioBase(selectedProduct)?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Función para agregar al carrito
                        alert(`Producto "${selectedProduct.nombre}" agregado al carrito`);
                      }}
                      disabled={(selectedProduct.existencias_real ?? 0) <= 0 && (selectedProduct.vende_sin_existencia_real ?? 0) === 0}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold text-white transition-all duration-200 ${
                        (selectedProduct.existencias_real ?? 0) <= 0 && (selectedProduct.vende_sin_existencia_real ?? 0) === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg active:scale-95'
                      }`}
                      title={(selectedProduct.existencias_real ?? 0) <= 0 && (selectedProduct.vende_sin_existencia_real ?? 0) === 0
                        ? 'Producto agotado'
                        : 'Agregar al carrito'
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                      {(selectedProduct.existencias_real ?? 0) <= 0 && (selectedProduct.vende_sin_existencia_real ?? 0) === 0
                        ? 'Agotado'
                        : 'Agregar'
                      }
                    </button>
                  </div>
                </div>
                
                {/* Información adicional en una sola línea, bien distribuida */}
                <div className="flex flex-row items-center justify-between gap-2 mt-2 w-full flex-wrap">
                  {selectedProduct.sku && (
                    <span className="text-gray-600 text-xs font-medium whitespace-nowrap">
                      SKU: <span className="text-gray-900">{selectedProduct.sku}</span>
                    </span>
                  )}
                  <div className="flex flex-row gap-2 ml-auto">
                    {selectedProduct.nombre_categoria && (
                      <span
                        className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold whitespace-nowrap shadow-2xl shadow-orange-300/80 transition-all duration-150 cursor-pointer hover:bg-orange-600 hover:shadow-[0_8px_32px_0_rgba(255,140,0,0.35)] hover:scale-110 active:scale-95"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedProduct.id_categoria) {
                            if (onCategoryTagClick) {
                              onCategoryTagClick(selectedProduct.id_categoria);
                              closeModal();
                            } else {
                              router.push(`/productos?categoria=${selectedProduct.id_categoria}`);
                              closeModal();
                            }
                          }
                        }}
                      >
                        {selectedProduct.nombre_categoria}
                      </span>
                    )}
                    {selectedProduct.nombre_marca && (
                      <span
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold whitespace-nowrap shadow-2xl shadow-blue-300/80 transition-all duration-150 cursor-pointer hover:bg-blue-700 hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.35)] hover:scale-110 active:scale-95"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedProduct.nombre_marca) {
                            if (onBrandTagClick) {
                              onBrandTagClick(selectedProduct.nombre_marca);
                              closeModal();
                            } else {
                              const marcaParam = encodeURIComponent(selectedProduct.nombre_marca);
                              router.push(`/productos?marca=${marcaParam}`);
                              closeModal();
                            }
                          }
                        }}
                      >
                        {selectedProduct.nombre_marca}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
