import React, { useState, useEffect } from 'react';

interface EventoAuditoria {
  fecha: string;
  accion: string;
  usuario?: string;
  detalles?: string;
}

interface AuditoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number;
}

export default function AuditoriaModal({ isOpen, onClose, pedidoId }: AuditoriaModalProps) {
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarAuditoria = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/auditoria`);
      if (response.ok) {
        const data = await response.json();
        setAuditoria(data);
      } else {
        console.error('Error al cargar auditoría');
      }
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    if (isOpen && pedidoId) {
      cargarAuditoria();
    }
  }, [isOpen, pedidoId, cargarAuditoria]);

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getColorAccion = (accion: string) => {
    if (accion.includes('creado')) return 'text-green-600';
    if (accion.includes('cancelado')) return 'text-red-600';
    if (accion.includes('completado')) return 'text-green-600';
    if (accion.includes('Cambio de estado')) return 'text-blue-600';
    if (accion.includes('Admin:')) return 'text-purple-600';
    return 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Trazabilidad del Pedido #{pedidoId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : auditoria.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No hay eventos de auditoría registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditoria.map((evento, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-semibold ${getColorAccion(evento.accion)}`}>
                        {evento.accion}
                      </div>
                      {evento.detalles && (
                        <div className="text-sm text-gray-600 mt-1">
                          {evento.detalles}
                        </div>
                      )}
                      {evento.usuario && (
                        <div className="text-xs text-gray-500 mt-1">
                          Usuario: {evento.usuario}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {formatearFecha(evento.fecha)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
} 