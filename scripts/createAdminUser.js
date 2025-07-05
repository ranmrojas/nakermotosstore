const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar si ya existe un usuario admin
    const existingAdmin = await prisma.usuario.findFirst({
      where: {
        username: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('✅ El usuario admin ya existe');
      console.log('Usuario:', existingAdmin.username);
      console.log('Nombre:', existingAdmin.nombre);
      console.log('Rol:', existingAdmin.rol);
      return;
    }

    // Crear usuario admin
    const adminUser = await prisma.usuario.create({
      data: {
        username: 'admin',
        password: 'admin123', // En producción deberías usar bcrypt
        nombre: 'Administrador',
        rol: 'admin'
      }
    });

    console.log('✅ Usuario admin creado exitosamente');
    console.log('Usuario:', adminUser.username);
    console.log('Nombre:', adminUser.nombre);
    console.log('Rol:', adminUser.rol);
    console.log('\n📝 Credenciales de acceso:');
    console.log('Usuario: admin');
    console.log('Contraseña: admin123');
    console.log('\n🔗 URL de acceso: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 