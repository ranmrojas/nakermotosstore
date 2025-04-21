'use client';

import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/lib/config';

interface Product {
  id_producto: number;
  sku: string;
  codigo_barras: string;
  nombre: string;
  precio_venta: number;
  existencias: number;
  marca: any;
  categoria: any;
  nombre_marca?: string;
  nombre_categoria?: string;
  ext1: string | null;
  ext2: string | null;
  [key: string]: any;
}

export default function TestCategory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('15');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/proxy/${API_CONFIG.ENDPOINTS.PRODUCTS}?numeroCategoria=${categoryId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los productos');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        console.log('Estructura completa del primer producto:', {
          producto: data[0],
          marca: data[0].marca,
          categoria: data[0].categoria,
          nombreMarca: data[0].nombre_marca,
          nombreCategoria: data[0].nombre_categoria,
          todasLasPropiedades: Object.keys(data[0])
        });
      }
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const handleRowClick = (product: Product) => {
    console.log('Producto seleccionado:', product);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          ID de Categoría
        </label>
        <input
          type="text"
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          placeholder="Ingresa el ID de la categoría"
        />
        <button
          onClick={fetchProducts}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Cargar Productos
        </button>
      </div>

      {loading && <p className="text-center">Cargando productos...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && (
        <div className="mb-2 flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">
            Total de productos: <span className="font-bold">{products.length}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-20">ID</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-24">SKU</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-32">EAN</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Marca</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr 
                key={product.id_producto} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  console.log('Producto clickeado:', {
                    producto: product,
                    marca: product.marca,
                    categoria: product.categoria,
                    nombreMarca: product.nombre_marca,
                    nombreCategoria: product.nombre_categoria,
                    todasLasPropiedades: Object.keys(product)
                  });
                  handleRowClick(product);
                }}
              >
                <td className="px-2 py-1 text-gray-500">{index + 1}</td>
                <td className="px-2 py-1 text-gray-500">{product.id_producto}</td>
                <td className="px-2 py-1 text-gray-500">{product.sku || '-'}</td>
                <td className="px-2 py-1 text-gray-500">{product.codigo_barras || '-'}</td>
                <td className="px-2 py-1">
                  <div className="font-medium text-gray-900">{product.nombre}</div>
                </td>
                <td className="px-2 py-1">
                  <div className="text-gray-500">
                    {product.nombre_marca || (product.marca && product.marca.nombre) || '-'}
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div className="text-gray-500">
                    {product.nombre_categoria || (product.categoria && product.categoria.nombre) || '-'}
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div className="font-medium text-green-600">
                    ${product.precio_venta.toLocaleString()}
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div className="text-gray-500">{product.existencias}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 text-gray-100 rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Detalles del Producto</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 font-mono">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                {JSON.stringify(selectedProduct, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
