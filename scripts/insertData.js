const client = require('./db');  // Importar la conexión a PostgreSQL

const insertCategorias = async () => {
    try {
        // Primero insertar las categorías padre (sin categoriaPadreId)
        await client.query(`
            INSERT INTO "Categoria" (id, nombre, descripcion, activa, "fechaCreacion", "fechaActualizacion") VALUES
            (1, 'General', 'Categoría general para productos diversos', true, NOW(), NOW()),
            (4, 'Agua', 'Bebidas de agua natural y mineral', true, NOW(), NOW()),
            (5, 'Desechables', 'Productos desechables de un solo uso', true, NOW(), NOW()),
            (6, 'Ron', 'Bebida alcohólica destilada de la caña de azúcar', true, NOW(), NOW()),
            (7, 'Whisky', 'Bebida alcohólica destilada de cereales', true, NOW(), NOW()),
            (8, 'Gaseosa', 'Bebidas carbonatadas y refrescos', true, NOW(), NOW()),
            (9, 'Bolsas', 'Bolsas y empaques diversos', true, NOW(), NOW()),
            (12, 'prueba', 'Categoría de prueba temporal', false, NOW(), NOW()),
            (14, 'Enlatados', 'Productos en conserva y enlatados', true, NOW(), NOW()),
            (15, 'Cerveza', 'Bebida fermentada a base de cebada y lúpulo', true, NOW(), NOW()),
            (16, 'Medicamentos', 'Medicamentos y productos farmacéuticos', true, NOW(), NOW()),
            (17, 'Cigarrillos', 'Productos de tabaco y cigarrillos', true, NOW(), NOW()),
            (18, 'Energizantes', 'Bebidas energéticas y estimulantes', true, NOW(), NOW()),
            (19, 'Chocolatinas', 'Chocolates y productos de chocolate', true, NOW(), NOW()),
            (20, 'Vinos', 'Vinos tintos, blancos y rosados', true, NOW(), NOW()),
            (21, 'Champaña', 'Vinos espumantes y champaña', true, NOW(), NOW()),
            (22, 'Huevos', 'Huevos frescos y derivados', true, NOW(), NOW()),
            (23, 'Tequila', 'Bebida alcohólica mexicana de agave', true, NOW(), NOW()),
            (25, 'Vodka', 'Bebida alcohólica clara y neutra', true, NOW(), NOW()),
            (28, 'Galletas', 'Galletas y productos horneados', true, NOW(), NOW()),
            (29, 'Varios', 'Productos diversos y misceláneos', true, NOW(), NOW()),
            (30, 'Paquetes', 'Paquetes y empaques especiales', true, NOW(), NOW()),
            (33, 'Aguardiente', 'Bebida alcohólica tradicional', true, NOW(), NOW()),
            (34, 'Mecheros y Fosforos', 'Encendedores y fósforos', true, NOW(), NOW()),
            (35, 'Dulces y Chicles', 'Dulces, caramelos y chicles', true, NOW(), NOW()),
            (37, 'Jugos', 'Jugos naturales y procesados', true, NOW(), NOW()),
            (38, 'Te', 'Tés y infusiones', true, NOW(), NOW()),
            (39, 'Hidratantes', 'Bebidas hidratantes y deportivas', true, NOW(), NOW()),
            (41, 'Brandy', 'Bebida alcohólica destilada del vino', true, NOW(), NOW()),
            (42, 'Preservativos', 'Productos de protección personal', true, NOW(), NOW()),
            (43, 'Hielo', 'Hielo y productos refrigerados', true, NOW(), NOW()),
            (44, 'Ginebra', 'Bebida alcohólica aromatizada con enebro', true, NOW(), NOW()),
            (45, 'Aperitivo', 'Bebidas aperitivas y digestivas', true, NOW(), NOW()),
            (46, 'Vapeadores y Capsulas', 'Dispositivos de vapeo y cápsulas', true, NOW(), NOW()),
            (47, 'IQOS Heets', 'Cápsulas y dispositivos IQOS', true, NOW(), NOW()),
            (48, 'Cocteles y Aperitivos', 'Mezclas para cócteles y aperitivos', true, NOW(), NOW()),
            (49, 'Z', 'Categoría Z - pendiente de especificación', false, NOW(), NOW()),
            (50, 'Mani', 'Maní y frutos secos', true, NOW(), NOW()),
            (51, 'Gomitas', 'Gomitas y dulces masticables', true, NOW(), NOW()),
            (52, 'inventario', 'Productos de inventario general', true, NOW(), NOW()),
            (53, 'Soda', 'Bebidas de soda y agua carbonatada', true, NOW(), NOW()),
            (54, 'Ponques', 'Ponqués y productos de panadería', true, NOW(), NOW()),
            (55, 'Salsas', 'Salsas y condimentos', true, NOW(), NOW()),
            (57, 'Envase', 'Envases y contenedores', true, NOW(), NOW()),
            (58, 'Zumo', 'Zumos y jugos concentrados', true, NOW(), NOW()),
            (64, 'Cremas De Licor', 'Cremas de licor y bebidas cremosas', true, NOW(), NOW()),
            (67, 'Otros', 'Otros productos diversos', true, NOW(), NOW()),
            (68, 'Velas', 'Velas y productos de iluminación', true, NOW(), NOW()),
            (69, 'Papel Higienico', 'Papel higiénico y productos de higiene', true, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `);

        // Luego insertar las subcategorías (con categoriaPadreId)
        await client.query(`
            INSERT INTO "Categoria" (id, nombre, descripcion, activa, "categoriaPadreId", "fechaCreacion", "fechaActualizacion") VALUES
            -- Subcategorías de Desechables (ID: 5)
            (11, 'Platos', 'Platos desechables de diferentes tamaños', true, 5, NOW(), NOW()),
            (13, 'Copas', 'Copas y vasos desechables', true, 5, NOW(), NOW()),
            (24, 'Vasos', 'Vasos desechables de plástico', true, 5, NOW(), NOW()),
            (26, 'Cucharas cubiertos', 'Cubiertos desechables', true, 5, NOW(), NOW()),
            (31, 'Servilletas', 'Servilletas desechables', true, 5, NOW(), NOW()),
            (60, 'Contenedores', 'Contenedores desechables', true, 5, NOW(), NOW()),
            
            -- Subcategorías de Cremas De Licor (ID: 64)
            (27, 'Crema de Whisky', 'Crema de licor sabor whisky', true, 64, NOW(), NOW()),
            (32, 'Piña Colada', 'Crema de licor sabor piña colada', true, 64, NOW(), NOW()),
            (36, 'Crema De Cafe', 'Crema de licor sabor café', true, 64, NOW(), NOW()),
            (40, 'Sabajon', 'Crema de licor sabor sabajón', true, 64, NOW(), NOW()),
            (65, 'Crema de Ron', 'Crema de licor sabor ron', true, 64, NOW(), NOW()),
            
            -- Subcategorías de Vapeadores y Capsulas (ID: 46)
            (61, 'Dispositivos Desechables', 'Dispositivos de vapeo desechables', true, 46, NOW(), NOW()),
            (62, 'Capsulas', 'Cápsulas para dispositivos de vapeo', true, 46, NOW(), NOW()),
            (63, 'Dispositivos Recargables', 'Dispositivos de vapeo recargables', true, 46, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `);

        console.log('¡62 categorías insertadas exitosamente con estructura jerárquica!');
        console.log('- 49 categorías padre');
        console.log('- 13 subcategorías');
        console.log('- Estructura jerárquica completa');
        
    } catch (err) {
        console.error('Error al insertar categorías:', err);
    } finally {
        client.end();  // Cerrar la conexión
    }
};

// Ejecutar el script
insertCategorias();
