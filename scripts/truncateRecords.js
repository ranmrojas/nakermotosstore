const client = require('./db');  // Importar la conexión a PostgreSQL

// Función para vaciar las tablas existentes
const truncateAllTables = async () => {
    try {
        await client.query(`
            DO
            $$
            DECLARE
                tabla RECORD;
            BEGIN
                -- Recorrer todas las tablas en el esquema public
                FOR tabla IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                LOOP
                    -- Vaciar cada tabla
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(tabla.tablename) || ' RESTART IDENTITY CASCADE';
                END LOOP;
            END
            $$;
        `);

        console.log('Todas las tablas han sido vaciadas.');
    } catch (err) {
        console.error('Error al vaciar las tablas', err);
    } finally {
        client.end();  // Cerrar la conexión
    }
};

// Ejecutar el script
truncateAllTables();
