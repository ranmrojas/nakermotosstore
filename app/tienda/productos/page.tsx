import ProductGrid from '@/app/components/ProductGrid';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Productos - La Zona Feliz',
  description: 'Explora nuestra selección de productos de calidad. Envíos a todo Colombia.'
};

export default function StoreHomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Productos Destacados</h1>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-amber-800/30">
          Dispositivos Desechables
        </h2>
        <ProductGrid categoryId="61" limit={8} />
        <div className="text-center mt-6">
          <a 
            href="/tienda/categoria/61"
            className="inline-block px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
          >
            Ver todos los dispositivos desechables
          </a>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-amber-800/30">
          Cápsulas
        </h2>
        <ProductGrid categoryId="62" limit={8} />
        <div className="text-center mt-6">
          <a 
            href="/tienda/categoria/62"
            className="inline-block px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
          >
            Ver todas las cápsulas
          </a>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-amber-800/30">
          Dispositivos Recargables
        </h2>
        <ProductGrid categoryId="63" limit={8} />
        <div className="text-center mt-6">
          <a 
            href="/tienda/categoria/63"
            className="inline-block px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
          >
            Ver todos los dispositivos recargables
          </a>
        </div>
      </div>
    </div>
  );
}
