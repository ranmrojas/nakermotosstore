const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function clearTestUsers() {
  try {
    console.log('🧹 Limpiando usuarios de prueba...\n');

    // Lista de usuarios de prueba a eliminar
    const testUsernames = ['admin', 'operador1', 'operador2'];

    for (const username of testUsernames) {
      try {
        const deletedUser = await prisma.usuario.delete({
          where: { username }
        });
        console.log(`✅ Usuario eliminado: ${deletedUser.username} (${deletedUser.rol})`);
      } catch (error) {
        if (error.code === 'P2025') {
          console.log(`⚠️  El usuario "${username}" no existe`);
        } else {
          console.error(`❌ Error al eliminar ${username}:`, error.message);
        }
      }
    }

    // Mostrar usuarios restantes
    const remainingUsers = await prisma.usuario.findMany({
      select: {
        username: true,
        nombre: true,
        rol: true
      }
    });

    console.log('\n📋 Usuarios restantes en el sistema:');
    console.log('=====================================');
    
    if (remainingUsers.length === 0) {
      console.log('No hay usuarios en el sistema');
    } else {
      remainingUsers.forEach(user => {
        const roleBadge = user.rol === 'admin' ? '👑 ADMIN' : '👤 OPERADOR';
        console.log(`${roleBadge} | ${user.username} | ${user.nombre}`);
      });
    }

    console.log('\n💡 Para crear usuarios de prueba nuevamente, ejecuta:');
    console.log('npm run createtestusers');

  } catch (error) {
    console.error('❌ Error al limpiar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestUsers(); 