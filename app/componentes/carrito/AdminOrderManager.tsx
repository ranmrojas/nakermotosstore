import React, { useState, useCallback } from "react";
import Image from 'next/image';
import { getProductImageUrl } from '@/app/services/productService';
import ProductModal from './ProductModal';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: number | string | null;
  extension?: string | null;
  sku?: string;
  nota?: string;
}

interface Pedido {
  id: number;
  cliente: string;
  estado: string;
  total: number;
  fecha: string;
  fechaOriginal: string;
  productos?: Producto[];
  direccion?: string;
  telefono?: string;
  medioPago?: string;
  subtotal?: number;
  domicilio?: number;
  enviadoAt?: string;
  nota?: string;
}

interface AdminOrderCardProps {
  pedido: Pedido;
  onStatusChange?: (orderId: number, newStatus: string) => void;
}

function AdminOrderCard({ pedido, onStatusChange }: AdminOrderCardProps) {
  // Eliminamos la variable no utilizada selectedStatus
  const [tiempoActual, setTiempoActual] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [enviadoAt, setEnviadoAt] = useState<Date | null>(
    pedido.enviadoAt ? new Date(pedido.enviadoAt) : null
  );

  // Actualizar el tiempo cada segundo
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = useCallback(async (nuevoEstado: string) => {
    if (!onStatusChange) return;
    
    // Actualizar inmediatamente el estado en la UI
    onStatusChange(pedido.id, nuevoEstado);
    
    // Si el nuevo estado es 'Enviado', guardar la fecha inmediatamente
    if (nuevoEstado === 'Enviado') {
      const fechaEnvio = new Date();
      setEnviadoAt(fechaEnvio);
      
      // Guardar la fecha de envío en la base de datos
      try {
        await fetch(`/api/pedidos/${pedido.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            estado: nuevoEstado,
            enviadoAt: fechaEnvio.toISOString()
          }),
        });
      } catch (error) {
        console.error('Error al guardar fecha de envío:', error);
      }
    } else {
      // Hacer la petición en segundo plano para otros cambios de estado
      try {
        const response = await fetch(`/api/pedidos/${pedido.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado }),
        });
        if (!response.ok) {
          console.error('Error al cambiar el estado del pedido');
        }
      } catch (error) {
        console.error('Error al cambiar el estado del pedido:', error);
      }
    }
  }, [onStatusChange, pedido.id]);

  // Cambio automático de estado después de 15 minutos cuando está enviado
  React.useEffect(() => {
    if (pedido.estado === 'Enviado' && enviadoAt) {
      const tiempoTranscurrido = tiempoActual.getTime() - enviadoAt.getTime();
      const quinceMinutos = 15 * 60 * 1000; // 15 minutos en milisegundos
      
      if (tiempoTranscurrido >= quinceMinutos) {
        console.log(`🔄 Cambio automático: Pedido #${pedido.id} completado después de 15 minutos`);
        handleStatusChange('Completado');
      }
    }
  }, [tiempoActual, pedido.estado, enviadoAt, pedido.id, handleStatusChange]);

  // Mostrar tiempo restante para pedidos enviados
  const getTiempoRestanteEnvio = () => {
    if (pedido.estado !== 'Enviado' || !enviadoAt) return null;
    
    const tiempoTranscurrido = tiempoActual.getTime() - enviadoAt.getTime();
    const quinceMinutos = 15 * 60 * 1000;
    const tiempoRestante = quinceMinutos - tiempoTranscurrido;
    
    if (tiempoRestante <= 0) return 'Completando automáticamente...';
    
    const minutosRestantes = Math.floor(tiempoRestante / (1000 * 60));
    const segundosRestantes = Math.floor((tiempoRestante % (1000 * 60)) / 1000);
    
    return `${minutosRestantes}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  const getTiempoTranscurrido = (fechaString: string) => {
    const fechaPedido = new Date(fechaString);
    const diferencia = tiempoActual.getTime() - fechaPedido.getTime();
    
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
      return `${dias}d ${horas % 24}h ${minutos % 60}m`;
    } else if (horas > 0) {
      return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  };

  const getColorTiempo = (fechaString: string) => {
    const fechaPedido = new Date(fechaString);
    const diferencia = tiempoActual.getTime() - fechaPedido.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    
    if (minutos < 3) {
      return 'text-gray-600'; // Normal
    } else if (minutos < 8) {
      return 'text-yellow-600'; // Alerta
    } else if (minutos < 12) {
      return 'text-orange-600'; // Más crítico
    } else if (minutos < 20) {
      return 'text-red-600'; // Crítico
    } else {
      return 'text-red-800 font-bold'; // Muy crítico
    }
  };

  

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Sin_aceptar':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      case 'Cancelado':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Completado':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'Procesando':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Enviado':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Aceptado':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'Pendiente':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      default:
        return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
  };

  // Eliminamos estadosDisponibles ya que no se utiliza

  const handleProductClick = (producto: Producto) => {
    setSelectedProduct(producto);
    setShowProductModal(true);
  };

  // Función para truncar la dirección después de la segunda coma
  const truncarDireccion = (direccion: string | undefined): string => {
    if (!direccion) return 'No disponible';
    
    const comas = direccion.split(',');
    if (comas.length <= 2) return direccion;
    
    return comas.slice(0, 2).join(',') + ',';
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-0 md:p-0 ${isCollapsed ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
      onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
    >
      {/* Datos del cliente */}
      <div className="p-4 md:p-2 pb-2 text-left">
        {/* Primera fila: Nombre (izquierda) + Número pedido y estado (derecha) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-0">
          <span className="text-base md:text-lg font-bold text-gray-900 break-words">{pedido.cliente}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded font-semibold bg-gray-100 text-gray-700 border border-gray-200">Pedido #{pedido.id}</span>
            <span className={`text-xs px-2 py-1 rounded font-semibold ${getEstadoColor(pedido.estado)}`}>{pedido.estado}</span>
            {pedido.estado === 'Enviado' && enviadoAt && (
              <span className="text-xs px-2 py-1 rounded font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                {getTiempoRestanteEnvio()}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={isCollapsed ? "Expandir" : "Contraer"}
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Segunda fila: Dirección (ancho completo) */}
        <div 
          className="text-xs md:text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded transition-colors relative group text-left mb-1"
          onClick={() => copyToClipboard(truncarDireccion(pedido.direccion), 'direccion')}
          title="Copiar dirección"
        >
          <span className="font-medium text-sm md:text-base">Dirección:</span> {truncarDireccion(pedido.direccion)}
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {copiedField === 'direccion' ? '✓ Copiado' : '📋 Copiar'}
          </span>
        </div>
        
        {/* Tercera fila: Nota del pedido (ancho completo) */}
        {pedido.nota && (
          <div 
            className="text-xs md:text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded transition-colors relative group text-left mb-0"
            onClick={() => copyToClipboard(pedido.nota || 'No disponible', 'nota')}
            title="Copiar nota"
          >
            <span className="font-bold">Nota:</span> 
            <span className="ml-1">{pedido.nota}</span>
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {copiedField === 'nota' ? '✓ Copiado' : '📋 Copiar'}
            </span>
          </div>
        )}
        
        {/* Cuarta fila: Teléfono (ancho completo) */}
        <div 
          className="text-xs md:text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded transition-colors relative group text-left mb-0"
          onClick={() => copyToClipboard(pedido.telefono || 'No disponible', 'telefono')}
          title="Copiar teléfono"
        >
          <span className="font-medium text-sm md:text-base">Teléfono:</span> {pedido.telefono || 'No disponible'}
          <span className="absolute right-16 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {copiedField === 'telefono' ? '✓ Copiado' : '📋 Copiar'}
          </span>
          {pedido.telefono && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const phoneNumber = pedido.telefono?.replace(/\s+/g, '') || '';
                const whatsappUrl = `https://wa.me/${phoneNumber}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700 transition-colors"
              title="Abrir WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Lista de productos compacta */}
      {!isCollapsed && (
        <div className="px-2 md:px-1 pt-0 pb-0 mt-4">
          <h4 className="font-semibold text-gray-900 mb-0 mt-0 pt-0 text-sm md:text-base ml-2 text-left">Productos</h4>
          <div className="bg-gray-50 rounded-lg p-2 ">
            {pedido.productos && pedido.productos.length > 0 ? (
              <div className="space-y-2">
                <div className={`${showAllProducts ? 'max-h-none' : 'max-h-48 overflow-y-auto'}`}>
                  {pedido.productos.map((producto, index) => {
                    const idImagen = typeof producto.imagen === 'number' ? producto.imagen : parseInt(producto.imagen || '0');
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-2"
                        onClick={() => handleProductClick(producto)}
                      >
                        <Image
                          src={getProductImageUrl(idImagen, producto.extension || 'jpeg', true)}
                          alt={producto.nombre}
                          className="w-12 h-12 object-cover rounded-lg"
                          width={48}
                          height={48}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{producto.nombre}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="font-bold">Cantidad: {producto.cantidad}</span>
                            {producto.sku && <span className="text-gray-700 font-medium">SKU: {producto.sku}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-sm">
                            ${(producto.precio * producto.cantidad).toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${producto.precio.toLocaleString('es-CO')} c/u
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pedido.productos.length > 3 && !showAllProducts && (
                  <button 
                    onClick={() => setShowAllProducts(true)}
                    className="w-full text-center text-blue-600 font-semibold text-sm py-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    +{pedido.productos.length - 3} productos más
                  </button>
                )}
                {showAllProducts && (
                  <button 
                    onClick={() => setShowAllProducts(false)}
                    className="w-full text-center text-gray-600 font-semibold text-sm py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    Mostrar menos
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-xs md:text-sm">
                No hay productos disponibles
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botones de acción y resumen */}
      {!isCollapsed && (
        <div className="p-2 md:p-4 pt-4 border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna izquierda: Medio de pago, fecha y botones */}
            <div className="flex flex-col gap-2">
              {/* Primera línea: Medio de pago */}
              <div className="text-sm md:text-base text-gray-700">
                Medio de pago: <span className="font-semibold">{pedido.medioPago || 'No especificado'}</span>
              </div>
              
              {/* Segunda línea: Fecha */}
              <div className="text-sm text-gray-400">
                Creado: {pedido.fecha}
              </div>
              
                          {/* Tercera línea: Botones */}
            <div className="flex flex-col gap-1 md:flex-row md:gap-1">
              {pedido.estado !== 'Enviado' && (
                <button
                  onClick={() => handleStatusChange('Cancelado')}
                  className="w-full md:w-auto px-4 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 border border-red-200 transition"
                >
                  Cancelar
                </button>
              )}
                              {pedido.estado === 'Pendiente' ? (
                <button
                  onClick={() => handleStatusChange('Aceptado')}
                  className="w-full md:w-auto px-4 py-1.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition"
                >
                  Aceptar
                </button>
              ) : pedido.estado === 'Aceptado' ? (
                <button
                  onClick={() => handleStatusChange('Procesando')}
                  className="w-full md:w-auto px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
                >
                  Alistar
                </button>
              ) : pedido.estado === 'Procesando' ? (
                <button
                  onClick={() => handleStatusChange('Enviado')}
                  className="w-full md:w-auto px-4 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition"
                >
                  Enviar
                </button>
              ) : null}
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full md:w-auto px-4 py-1.5 rounded-lg bg-gray-600 text-white font-semibold text-sm hover:bg-gray-700 transition"
                >
                  Detalle
                </button>
              </div>
            </div>
            
            {/* Columna derecha: Resumen de pagos */}
            <div className="text-right text-xs md:text-sm space-y-1">
              <div className="text-gray-700">Subtotal: <span className="font-semibold">${pedido.subtotal?.toLocaleString('es-CO') || '0'}</span></div>
              <div className="text-gray-700">Domicilio: <span className="font-semibold">${pedido.domicilio?.toLocaleString('es-CO') || '0'}</span></div>
              <div className="text-blue-700 font-bold text-sm md:text-lg">Total a Pagar: ${pedido.total?.toLocaleString('es-CO')}</div>
              <div className={`text-sm md:text-base font-medium ${getColorTiempo(pedido.fechaOriginal)}`}>
                {getTiempoTranscurrido(pedido.fechaOriginal)}
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Modal de detalle */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Detalle del Pedido #{pedido.id}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Información del cliente */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900"><span className="font-medium">Nombre:</span> {pedido.cliente}</p>
                  <p 
                    className="text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors relative group"
                    onClick={() => copyToClipboard(pedido.telefono || 'No disponible', 'telefono-modal')}
                    title="Copiar teléfono"
                  >
                    <span className="font-medium">Teléfono:</span> {pedido.telefono || 'No disponible'}
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedField === 'telefono-modal' ? '✓ Copiado' : '📋 Copiar'}
                    </span>
                  </p>
                  <p 
                    className="text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors relative group"
                    onClick={() => copyToClipboard(truncarDireccion(pedido.direccion), 'direccion-modal')}
                    title="Copiar dirección"
                  >
                    <span className="font-medium">Dirección:</span> {truncarDireccion(pedido.direccion)}
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedField === 'direccion-modal' ? '✓ Copiado' : '📋 Copiar'}
                    </span>
                  </p>
                  <p className="text-gray-900"><span className="font-medium">Fecha:</span> {pedido.fecha}</p>
                  {pedido.nota && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-gray-900">
                        <span className="font-medium text-yellow-800">Nota del pedido:</span>
                        <span className="text-yellow-700 ml-2 block mt-1">{pedido.nota}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista detallada de productos */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {pedido.productos && pedido.productos.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {pedido.productos.map((producto, index) => {
                        const idImagen = typeof producto.imagen === 'number' ? producto.imagen : parseInt(producto.imagen || '0');
                        return (
                          <div key={index} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Image
                                src={getProductImageUrl(idImagen, producto.extension || 'jpeg', true)}
                                alt={producto.nombre}
                                className="w-16 h-16 object-cover rounded-lg"
                                width={64}
                                height={64}
                              />
                              <div>
                                <p className="font-medium text-gray-900">{producto.nombre}</p>
                                <div className="flex gap-4 text-sm text-gray-500">
                                  <span className="font-bold">Cantidad: {producto.cantidad}</span>
                                  {producto.sku && <span className="text-gray-700 font-medium">SKU: {producto.sku}</span>}
                                </div>
                                <p className="text-sm text-gray-500">Precio unitario: ${producto.precio.toLocaleString('es-CO')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 text-lg">
                                ${(producto.precio * producto.cantidad).toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No hay productos disponibles
                    </div>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium text-gray-900">${pedido.subtotal?.toLocaleString('es-CO') || '0'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Domicilio:</span>
                  <span className="font-medium text-gray-900">${pedido.domicilio?.toLocaleString('es-CO') || '0'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-gray-900">${pedido.total?.toLocaleString('es-CO')}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Medio de pago: <span className="font-medium text-gray-900">{pedido.medioPago || 'No especificado'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de producto */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        producto={selectedProduct}
      />
    </div>
  );
}

interface AdminOrderManagerProps {
  orders: Pedido[];
  onStatusChange?: (orderId: number, newStatus: string) => void;
}

export default function AdminOrderManager({ orders, onStatusChange }: AdminOrderManagerProps) {
  // Ordenar pedidos por fecha, los más antiguos primero
  const sortedOrders = [...orders].sort((a, b) => {
    const fechaA = new Date(a.fechaOriginal);
    const fechaB = new Date(b.fechaOriginal);
    return fechaA.getTime() - fechaB.getTime();
  });

  return (
    <div className="flex flex-col w-full">
      {sortedOrders.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-lg border-2 border-dashed border-gray-200 rounded-xl">
          No hay pedidos registrados.
        </div>
      ) : (
        sortedOrders.map((pedido, index) => (
          <div key={pedido.id}>
            <AdminOrderCard 
              pedido={pedido} 
              onStatusChange={onStatusChange}
            />
            {index < sortedOrders.length - 1 && (
              <div className="my-4 border-t-2 border-gray-300"></div>
            )}
          </div>
        ))
      )}
    </div>
  );
}