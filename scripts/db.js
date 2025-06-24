require('dotenv').config();  // Cargar variables de entorno desde el archivo .env
const { Client } = require('pg');  // Importar la clase Client de pg para conectar con PostgreSQL

// Crear una nueva instancia de Client para manejar la conexión a PostgreSQL
const client = new Client({
    connectionString: process.env.DATABASE_URL,  // URL de conexión desde el archivo .env
    ssl: {
        rejectUnauthorized: false  // Aceptar conexiones SSL no autorizadas 
    }
});

// Conectarse a la base de datos
client.connect()
    .then(() => console.log('Conectado a la base de datos PostgreSQL'))
    .catch(err => console.error('Error al conectarse a la base de datos', err));

module.exports = client;