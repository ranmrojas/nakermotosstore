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

          } catch {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor'
        });
      }
  } 
  else if (req.method === 'POST') {
    try {
      const { id, nombre, descripcion, activa, categoriaPadreId } = req.body;

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'El nombre de la categoría es requerido'
        });
      }

      // Validar ID personalizado
      if (id !== undefined && id !== null) {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
          return res.status(400).json({
            success: false,
            error: 'El ID debe ser un número entero positivo'
          });
        }

        // Verificar si ya existe una categoría con ese ID
        const categoriaConId = await prisma.categoria.findUnique({
          where: { id: Number(id) }
        });

        if (categoriaConId) {
          return res.status(409).json({
            success: false,
            error: `Ya existe una categoría con el ID ${id}`
          });
        }
      }

      // Verificar si ya existe una categoría con el mismo nombre
      const categoriaExistente = await prisma.categoria.findUnique({
        where: { nombre: nombre.trim() }
      });

      if (categoriaExistente) {
        return res.status(409).json({
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

      // Crear la categoría con o sin ID personalizado
      let nuevaCategoria;
      
      if (id !== undefined && id !== null) {
        // Crear con ID personalizado
        nuevaCategoria = await prisma.categoria.create({
          data: {
            id: Number(id),
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
      } else {
        // Generar ID automáticamente (buscar el siguiente disponible)
        const ultimaCategoria = await prisma.categoria.findFirst({
          orderBy: { id: 'desc' }
        });
        
        const siguienteId = ultimaCategoria ? ultimaCategoria.id + 1 : 1;
        
        nuevaCategoria = await prisma.categoria.create({
          data: {
            id: siguienteId,
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
      }

             res.status(201).json({
         success: true,
         data: nuevaCategoria,
         message: 'Categoría creada exitosamente'
       });

          } catch {
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