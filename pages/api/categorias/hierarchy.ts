import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../lib/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`
    });
  }

  try {
    const { soloActivas = 'true' } = req.query;
    const mostrarSoloActivas = soloActivas === 'true';

    // Obtener todas las categorías padre con sus subcategorías
    const categoriasPadre = await prisma.categoria.findMany({
      where: {
        categoriaPadreId: null,
        ...(mostrarSoloActivas && { activa: true })
      },
      include: {
        subcategorias: {
          where: mostrarSoloActivas ? { activa: true } : {},
          orderBy: { nombre: 'asc' }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    // Estructurar la respuesta para el menú
    const estructuraJerarquica = categoriasPadre.map(categoria => ({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      activa: categoria.activa,
      esPadre: true,
      tieneSubcategorias: categoria.subcategorias.length > 0,
      subcategorias: categoria.subcategorias.map(subcategoria => ({
        id: subcategoria.id,
        nombre: subcategoria.nombre,
        descripcion: subcategoria.descripcion,
        activa: subcategoria.activa,
        esPadre: false,
        categoriaPadreId: subcategoria.categoriaPadreId
      }))
    }));

    // Estadísticas
    const estadisticas = {
      totalCategorias: estructuraJerarquica.length,
      totalSubcategorias: estructuraJerarquica.reduce((acc, cat) => acc + cat.subcategorias.length, 0),
      categoriasConSubcategorias: estructuraJerarquica.filter(cat => cat.tieneSubcategorias).length,
      categoriasActivas: estructuraJerarquica.filter(cat => cat.activa).length,
      subcategoriasActivas: estructuraJerarquica.reduce((acc, cat) => 
        acc + cat.subcategorias.filter(sub => sub.activa).length, 0
      )
    };

    res.status(200).json({
      success: true,
      data: estructuraJerarquica,
      estadisticas,
      filtros: {
        soloActivas: mostrarSoloActivas
      }
    });

  } catch (error) {
    console.error('Error al obtener estructura jerárquica:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
} 