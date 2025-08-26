"use client";
import React, { useState } from "react";
import { useClientesApi } from "@/hooks/useClientesApi";
import { useClientSession } from "@/hooks/useClientSession";

export default function LogClienteAdminModal({ onClose }: { onClose: () => void }) {
  const { saveSession } = useClientSession();
  const { getClienteByTelefono } = useClientesApi();
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validarTelefono = (num: string) => /^3\d{9}$/.test(num);

  const handleLogin = async () => {
    setError("");
    if (!validarTelefono(telefono)) {
      setError("Ingrese un número de celular colombiano válido");
      return;
    }
    setLoading(true);
    try {
      const cliente = await getClienteByTelefono(telefono);
      if (!cliente) {
        setError("Cliente no encontrado");
        return;
      }
      saveSession({
        id: cliente.id,
        telefono: cliente.telefono,
        nombre: cliente.nombre,
        direccion: cliente.direccion,
        valordomicilio: cliente.valordomicilio,
        direccionesGuardadas: cliente.direccionesGuardadas
      });
      onClose();
    } catch {
      setError("Error al buscar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Buscar cliente por celular</h3>
        <input
          type="tel"
          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={telefono}
          onChange={e => {
            setTelefono(e.target.value);
            if (error) setError("");
          }}
          placeholder="Ej: 3001234567"
          maxLength={10}
        />
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <button
          className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition-colors"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Iniciar sesión como cliente"}
        </button>
        <button
          className="w-full mt-2 bg-gray-300 text-gray-700 font-semibold py-2 rounded hover:bg-gray-400 transition-colors"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
