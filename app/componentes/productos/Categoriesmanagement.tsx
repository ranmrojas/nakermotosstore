'use client';

import React, { useState, useEffect } from 'react';
import { useCategorias } from '../../../hooks/useCategorias';
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
  const [showSubcategoriasModal, setShowSubcategoriasModal] = useState<Categoria | null>(null);

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

  // Abrir modal de subcategorías
  const handleShowSubcategorias = (categoria: Categoria) => {
    setShowSubcategoriasModal(categoria);
  };

  // Cerrar modal de subcategorías
  const handleCloseSubcategoriasModal = () => {
    setShowSubcategoriasModal(null);
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
                         (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         categoria.id.toString().includes(searchTerm);
    
    const matchesFilter = filterActivas === null || categoria.activa === filterActivas;
    
    return matchesSearch && matchesFilter;
  });

  // Obtener categorías padre para el selector
  const categoriasPadre = getCategoriasPadre();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={reset}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
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
    <div className="space-y-4 p-4 max-w-full">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={forceSync}
              disabled={syncing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            <button
              onClick={handleCreate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.categoriasActivas}</div>
            <div className="text-xs sm:text-sm text-green-600">Activas</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalCategorias - stats.categoriasActivas}</div>
            <div className="text-xs sm:text-sm text-red-600">Inactivas</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.totalSubcategorias}</div>
            <div className="text-xs sm:text-sm text-yellow-600">Subcategorías</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-lg sm:text-xl font-bold text-purple-600">
              {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Nunca'}
            </div>
            <div className="text-xs sm:text-sm text-purple-600">Última Sincronización</div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <input
              type="text"
              placeholder="Buscar categorías por ID, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 text-base"
            />
          </div>
          <div className="w-full">
            <select
              value={filterActivas === null ? 'all' : filterActivas.toString()}
              onChange={(e) => setFilterActivas(e.target.value === 'all' ? null : e.target.value === 'true')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-base"
            >
              <option value="all">Todas las categorías</option>
              <option value="true">Solo Activas</option>
              <option value="false">Solo Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mx-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Padre
                </th>
                <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    <div className="flex space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleEdit(categoria)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 sm:p-1 rounded-md hover:bg-blue-50"
                        title="Editar categoría"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(categoria)}
                        disabled={operationLoading}
                        className={`p-1.5 sm:p-1 rounded-md hover:bg-opacity-20 disabled:opacity-50 ${
                          categoria.activa 
                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50' 
                            : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                        }`}
                        title={categoria.activa ? 'Desactivar categoría' : 'Activar categoría'}
                      >
                        {categoria.activa ? (
                          <EyeIcon className="h-4 w-4" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(categoria.id)}
                        disabled={getSubcategorias(categoria.id).length > 0}
                        className="text-red-600 hover:text-red-900 p-1.5 sm:p-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={getSubcategorias(categoria.id).length > 0 ? 'No se puede eliminar una categoría con subcategorías' : 'Eliminar categoría'}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{categoria.id}</div>
                  </td>
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{categoria.nombre}</div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      {categoria.descripcion ? categoria.descripcion.substring(0, 30) + (categoria.descripcion.length > 30 ? '...' : '') : 'Sin descripción'}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {categoria.categoriaPadreId 
                        ? `${getCategoriaById(categoria.categoriaPadreId)?.nombre || 'N/A'} (ID: ${categoria.categoriaPadreId})`
                        : getSubcategorias(categoria.id).length > 0 ? (
                          <button
                            onClick={() => handleShowSubcategorias(categoria)}
                            className="font-bold text-blue-600 hover:text-blue-900 hover:underline text-xs sm:text-sm"
                            title={`Ver ${getSubcategorias(categoria.id).length} subcategorías`}
                          >
                            Padre ({getSubcategorias(categoria.id).length})
                          </button>
                        ) : (
                          'Padre'
                        )
                      }
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {categoria.descripcion || 'Sin descripción'}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      categoria.activa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCategorias.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron categorías</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar eliminación
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={operationLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-base ${
                      formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la categoría"
                  />
                  {formErrors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-base ${
                      formErrors.descripcion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Descripción opcional"
                  />
                  {formErrors.descripcion && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.descripcion}</p>
                  )}
                </div>

                {/* Categoría Padre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría Padre
                  </label>
                  <select
                    value={formData.categoriaPadreId || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      categoriaPadreId: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-base"
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
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label htmlFor="activa" className="ml-3 block text-sm text-gray-900">
                    Categoría activa
                  </label>
                </div>

                {/* Error general */}
                {formErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{formErrors.general}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {operationLoading ? 'Guardando...' : (editingCategoria ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de subcategorías */}
      {showSubcategoriasModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Subcategorías de: {showSubcategoriasModal.nombre}
                </h3>
                <button
                  onClick={handleCloseSubcategoriasModal}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSubcategorias(showSubcategoriasModal.id).map((subcategoria) => (
                      <tr key={subcategoria.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(subcategoria)}
                            disabled={operationLoading}
                            className={`p-1.5 sm:p-1 rounded-md hover:bg-opacity-20 disabled:opacity-50 ${
                              subcategoria.activa 
                                ? 'text-green-600 hover:text-green-900 hover:bg-green-50' 
                                : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            }`}
                            title={subcategoria.activa ? 'Desactivar subcategoría' : 'Activar subcategoría'}
                          >
                            {subcategoria.activa ? (
                              <EyeIcon className="h-4 w-4" />
                            ) : (
                              <EyeSlashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{subcategoria.id}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{subcategoria.nombre}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subcategoria.activa 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subcategoria.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {getSubcategorias(showSubcategoriasModal.id).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay subcategorías para mostrar</p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseSubcategoriasModal}
                  className="bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
