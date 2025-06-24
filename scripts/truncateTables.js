const client = require('./db');

// Elimina todas las tablas del esquema public
const dropAllTables = async () => {
    try {
        await client.query(`
            DO $$
            DECLARE
                tabla RECORD;
            BEGIN
                FOR tabla IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(tabla.tablename) || ' CASCADE';
                END LOOP;
            END
            $$;
        `);
        console.log('Todas las tablas han sido eliminadas.');
    } catch (err) {
        console.error('Error al eliminar las tablas:', err);
    } finally {
        await client.end();
    }
};

dropAllTables();
