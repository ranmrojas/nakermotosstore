'use client';

import React, { useState, useEffect } from 'react';
import { useCategorias } from '../../../hooks/useCategorias';
import { indexedDBService } from '../../../lib/indexedDB/database';
import { syncService } from '../../../lib/indexedDB/syncService';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  categoriaPadreId?: number;
  esPadre?: boolean;
  tieneSubcategorias?: boolean;
  subcategorias?: Categoria[];
}

interface CategoriaFormData {
  nombre: string;
  descripcion: string;
  activa: boolean;
  categoriaPadreId?: number;
}

export default function CategoriesManagement() {
  const {
    categorias,
    loading,
    error,
    syncing,
    refetch,
    forceSync,
    reset,
    getCategoriaById,
    getCategoriasPadre,
    getSubcategorias,
    stats
  } = useCategorias();

  // Estados del componente
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState<CategoriaFormData>({
    nombre: '',
    descripcion: '',
    activa: true,
    categoriaPadreId: undefined
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [filterActivas, setFilterActivas] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Limpiar mensajes de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activa: true,
      categoriaPadreId: undefined
    });
    setFormErrors({});
    setEditingCategoria(null);
  };

  // Abrir formulario para crear nueva categoría
  const handleCreate = () => {
    clearForm();
    setShowForm(true);
  };

  // Abrir formulario para editar categoría
  const handleEdit = (categoria: Categoria) => {
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      activa: categoria.activa,
      categoriaPadreId: categoria.categoriaPadreId
    });
    setEditingCategoria(categoria);
    setShowForm(true);
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    clearForm();
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.descripcion && formData.descripcion.length > 500) {
      errors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar categoría (crear o actualizar)
  const handleSave = async () => {
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const url = editingCategoria 
        ? `/api/categorias/${editingCategoria.id}`
        : '/api/categorias';
      
      const method = editingCategoria ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar la categoría');
      }

      setSuccessMessage(
        editingCategoria 
          ? 'Categoría actualizada exitosamente' 
          : 'Categoría creada exitosamente'
      );

      // Sincronizar con IndexedDB
      await forceSync();
      
      handleCloseForm();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      setFormErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setOperationLoading(false);
    }
  };

  // Eliminar categoría
  const handleDelete = async (id: number) => {
    setOperationLoading(true);
    try {
      const response = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar la categoría');
      }

      setSuccessMessage('Categoría eliminada exitosamente');
      
      // Sincronizar con IndexedDB
      await forceSync();
      
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      setFormErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setOperationLoading(false);
    }
  };

  // Cambiar estado activo/inactivo
  const handleToggleActive = async (categoria: Categoria) => {
    setOperationLoading(true);
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...categoria,
          activa: !categoria.activa
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar el estado');
      }

      setSuccessMessage(`Categoría ${!categoria.activa ? 'activada' : 'desactivada'} exitosamente`);
      
      // Sincronizar con IndexedDB
      await forceSync();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setFormErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setOperationLoading(false);
    }
  };

  // Filtrar categorías
  const filteredCategorias = categorias.filter(categoria => {
    const matchesSearch = categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActivas === null || categoria.activa === filterActivas;
    
    return matchesSearch && matchesFilter;
  });

  // Obtener categorías padre para el selector
  const categoriasPadre = getCategoriasPadre();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
            <div className="mt-4">
              <button
                onClick={reset}
                className="bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800/50"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Categorías</h2>
          <div className="flex space-x-2">
            <button
              onClick={forceSync}
              disabled={syncing}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            <button
              onClick={handleCreate}
              className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCategorias}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Categorías Padre</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSubcategorias}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Subcategorías</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.categoriasActivas}</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Activas</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Nunca'}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Última Sincronización</div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={filterActivas === null ? 'all' : filterActivas.toString()}
              onChange={(e) => setFilterActivas(e.target.value === 'all' ? null : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="true">Solo Activas</option>
              <option value="false">Solo Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoría Padre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subcategorías
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCategorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(categoria)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Editar categoría"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(categoria)}
                        disabled={operationLoading}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 p-1 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50"
                        title={categoria.activa ? 'Desactivar categoría' : 'Activar categoría'}
                      >
                        {categoria.activa ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(categoria.id)}
                        disabled={getSubcategorias(categoria.id).length > 0}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={getSubcategorias(categoria.id).length > 0 ? 'No se puede eliminar una categoría con subcategorías' : 'Eliminar categoría'}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{categoria.nombre}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {categoria.descripcion || 'Sin descripción'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {categoria.categoriaPadreId 
                        ? getCategoriaById(categoria.categoriaPadreId)?.nombre || 'N/A'
                        : 'Categoría Padre'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      categoria.activa 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {categoria.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getSubcategorias(categoria.id).length} subcategorías
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCategorias.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No se encontraron categorías</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Confirmar eliminación
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                ¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={operationLoading}
                  className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
                >
                  {operationLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.nombre ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Nombre de la categoría"
                  />
                  {formErrors.nombre && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.descripcion ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={3}
                    placeholder="Descripción opcional"
                  />
                  {formErrors.descripcion && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.descripcion}</p>
                  )}
                </div>

                {/* Categoría Padre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría Padre
                  </label>
                  <select
                    value={formData.categoriaPadreId || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      categoriaPadreId: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin categoría padre</option>
                    {categoriasPadre
                      .filter(cat => !editingCategoria || cat.id !== editingCategoria.id)
                      .map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Estado */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="activa" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Categoría activa
                  </label>
                </div>

                {/* Error general */}
                {formErrors.general && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{formErrors.general}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                  >
                    {operationLoading ? 'Guardando...' : (editingCategoria ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
