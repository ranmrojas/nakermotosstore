import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const categoriaId = parseInt(id as string);

  if (isNaN(categoriaId)) {
    return res.status(400).json({
      success: false,
      error: 'ID de categoría inválido'
    });
  }

  if (req.method === 'GET') {
    try {
      const categoria = await prisma.categoria.findUnique({
        where: { id: categoriaId },
        include: {
          categoriaPadre: true,
          subcategorias: {
            orderBy: { nombre: 'asc' }
          }
        }
      });

      if (!categoria) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: categoria
      });

    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  else if (req.method === 'PUT') {
    try {
      const { nombre, descripcion, activa, categoriaPadreId } = req.body;

      // Verificar que la categoría existe
      const categoriaExistente = await prisma.categoria.findUnique({
        where: { id: categoriaId }
      });

      if (!categoriaExistente) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }

      // Validaciones
      if (nombre !== undefined && (!nombre || nombre.trim() === '')) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de la categoría no puede estar vacío'
        });
      }

      // Verificar si el nuevo nombre ya existe (excluyendo la categoría actual)
      if (nombre && nombre.trim() !== categoriaExistente.nombre) {
        const categoriaConMismoNombre = await prisma.categoria.findUnique({
          where: { nombre: nombre.trim() }
        });

        if (categoriaConMismoNombre) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe una categoría con ese nombre'
          });
        }
      }

      // Si se especifica una nueva categoría padre, verificar que existe
      if (categoriaPadreId !== undefined) {
        if (categoriaPadreId === null) {
          // Se está convirtiendo en categoría padre
        } else {
          const categoriaPadre = await prisma.categoria.findUnique({
            where: { id: parseInt(categoriaPadreId) }
          });

          if (!categoriaPadre) {
            return res.status(400).json({
              success: false,
              error: 'La categoría padre especificada no existe'
            });
          }

          // Evitar referencias circulares
          if (parseInt(categoriaPadreId) === categoriaId) {
            return res.status(400).json({
              success: false,
              error: 'Una categoría no puede ser padre de sí misma'
            });
          }
        }
      }

      // Preparar datos para actualización
      const datosActualizacion: Prisma.CategoriaUpdateInput = {};
      
      if (nombre !== undefined) {
        datosActualizacion.nombre = nombre.trim();
      }
      
      if (descripcion !== undefined) {
        datosActualizacion.descripcion = descripcion?.trim() || null;
      }
      
      if (activa !== undefined) {
        datosActualizacion.activa = activa;
      }
      
      if (categoriaPadreId !== undefined) {
        datosActualizacion.categoriaPadre = { connect: { id: parseInt(categoriaPadreId) } };
      }

      const categoriaActualizada = await prisma.categoria.update({
        where: { id: categoriaId },
        data: datosActualizacion,
        include: {
          categoriaPadre: true,
          subcategorias: {
            orderBy: { nombre: 'asc' }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: categoriaActualizada,
        message: 'Categoría actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      // Verificar que la categoría existe
      const categoriaExistente = await prisma.categoria.findUnique({
        where: { id: categoriaId },
        include: {
          subcategorias: true
        }
      });

      if (!categoriaExistente) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }

      // Verificar si tiene subcategorías
      if (categoriaExistente.subcategorias.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'No se puede eliminar una categoría que tiene subcategorías. Elimine las subcategorías primero.'
        });
      }

      await prisma.categoria.delete({
        where: { id: categoriaId }
      });

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`
    });
  }
} 