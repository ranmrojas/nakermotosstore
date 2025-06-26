import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        activa, 
        categoriaPadreId, 
        soloPadres, 
        incluirSubcategorias 
      } = req.query;

      // Construir filtros
      const where: Prisma.CategoriaWhereInput = {};
      
      if (activa !== undefined) {
        where.activa = activa === 'true';
      }
      
      if (categoriaPadreId !== undefined) {
        if (categoriaPadreId === 'null') {
          where.categoriaPadreId = null; // Solo categorías padre
        } else {
          where.categoriaPadreId = parseInt(categoriaPadreId as string);
        }
      }
      
      if (soloPadres === 'true') {
        where.categoriaPadreId = null;
      }

      // Configurar includes
      const include: Prisma.CategoriaInclude = {};
      if (incluirSubcategorias === 'true') {
        include.subcategorias = {
          where: activa !== undefined ? { activa: activa === 'true' } : {}
        };
      }

      const categorias = await prisma.categoria.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        orderBy: [
          { categoriaPadreId: 'asc' },
          { nombre: 'asc' }
        ]
      });

      res.status(200).json({
        success: true,
        data: categorias,
        total: categorias.length
      });

    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  } 
  else if (req.method === 'POST') {
    try {
      const { nombre, descripcion, activa, categoriaPadreId } = req.body;

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'El nombre de la categoría es requerido'
        });
      }

      // Verificar si ya existe una categoría con el mismo nombre
      const categoriaExistente = await prisma.categoria.findUnique({
        where: { nombre: nombre.trim() }
      });

      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una categoría con ese nombre'
        });
      }

      // Si se especifica una categoría padre, verificar que existe
      if (categoriaPadreId) {
        const categoriaPadre = await prisma.categoria.findUnique({
          where: { id: parseInt(categoriaPadreId) }
        });

        if (!categoriaPadre) {
          return res.status(400).json({
            success: false,
            error: 'La categoría padre especificada no existe'
          });
        }
      }

      const nuevaCategoria = await prisma.categoria.create({
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          activa: activa !== undefined ? activa : true,
          categoriaPadreId: categoriaPadreId ? parseInt(categoriaPadreId) : null
        },
        include: {
          categoriaPadre: true,
          subcategorias: true
        }
      });

      res.status(201).json({
        success: true,
        data: nuevaCategoria,
        message: 'Categoría creada exitosamente'
      });

    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`
    });
  }
} 