import React, { useState } from 'react';
import { useSmsHablame, usePlantillasSms } from '../../../hooks/useSmsHablame';

const EnviarSmsComponent: React.FC = () => {
  const { enviando, error, enviarSms, limpiarError } = useSmsHablame();
  const { plantillas } = usePlantillasSms();
  
  const [numero, setNumero] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const resultado = await enviarSms({
      numero,
      mensaje,
    });

    if (resultado.success) {
      setNumero('');
      setMensaje('');
      setPlantillaSeleccionada('');
      alert('SMS enviado correctamente');
    }
  };

  const aplicarPlantilla = (tipo: string) => {
    switch (tipo) {
      case 'confirmacion':
        setMensaje(plantillas.confirmacionPedido('Cliente', '12345'));
        break;
      case 'enviado':
        setMensaje(plantillas.pedidoEnviado('Cliente', '12345'));
        break;
      case 'entregado':
        setMensaje(plantillas.pedidoEntregado('Cliente', '12345'));
        break;
      case 'codigo':
        setMensaje(plantillas.codigoVerificacion('123456'));
        break;
      case 'recordatorio':
        setMensaje(plantillas.recordatorioPago('Cliente', '50000'));
        break;
      default:
        setMensaje('');
    }
    setPlantillaSeleccionada(tipo);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Enviar SMS</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={limpiarError}
            className="ml-2 text-red-900 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={manejarEnvio} className="space-y-4">
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
            Número de teléfono
          </label>
          <input
            type="tel"
            id="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="3001234567"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="plantillas" className="block text-sm font-medium text-gray-700">
            Plantillas predeterminadas
          </label>
          <select
            id="plantillas"
            value={plantillaSeleccionada}
            onChange={(e) => aplicarPlantilla(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar plantilla...</option>
            <option value="confirmacion">Confirmación de pedido</option>
            <option value="enviado">Pedido enviado</option>
            <option value="entregado">Pedido entregado</option>
            <option value="codigo">Código de verificación</option>
            <option value="recordatorio">Recordatorio de pago</option>
          </select>
        </div>

        <div>
          <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700">
            Mensaje
          </label>
          <textarea
            id="mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            maxLength={160}
            placeholder="Escribe tu mensaje aquí..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {mensaje.length}/160 caracteres
          </p>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            enviando
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {enviando ? 'Enviando...' : 'Enviar SMS'}
        </button>
      </form>
    </div>
  );
};

export default EnviarSmsComponent;
