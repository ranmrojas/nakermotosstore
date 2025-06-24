const client = require('./db');  // Importar la conexión a PostgreSQL

const insertCategorias = async () => {
    try {
        await client.query(`
            INSERT INTO "Categoria" (nombre, descripcion) VALUES
            ('Ron', 'Bebida alcohólica destilada de la caña de azúcar'),
            ('Whisky', 'Bebida alcohólica destilada de cereales'),
            ('Vodka', 'Bebida alcohólica clara y neutra'),
            ('Tequila', 'Bebida alcohólica mexicana de agave'),
            ('Ginebra', 'Bebida alcohólica aromatizada con enebro'),
            ('Cerveza', 'Bebida fermentada a base de cebada y lúpulo');
        `);
        console.log('¡6 categorías insertadas exitosamente!');
    } catch (err) {
        console.error('Error al insertar categorías:', err);
    } finally {
        client.end();  // Cerrar la conexión
    }
};

// Ejecutar el script
insertCategorias();
