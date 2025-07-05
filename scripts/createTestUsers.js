const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

const testUsers = [
  {
    username: 'admin',
    password: 'admin123',
    nombre: 'Administrador Principal',
    rol: 'admin'
  },
  {
    username: 'operador1',
    password: 'operador123',
    nombre: 'Operador 1',
    rol: 'operador'
  },
  {
    username: 'operador2',
    password: 'operador123',
    nombre: 'Operador 2',
    rol: 'operador'
  }
];

async function createTestUsers() {
  try {
    console.log('🚀 Creando usuarios de prueba...\n');

    for (const userData of testUsers) {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.usuario.findFirst({
        where: { username: userData.username }
      });

      if (existingUser) {
        console.log(`⚠️  El usuario "${userData.username}" ya existe`);
        continue;
      }

      // Crear usuario
      const user = await prisma.usuario.create({
        data: userData
      });

      console.log(`✅ Usuario creado: ${user.username} (${user.rol})`);
    }

    console.log('\n📋 Resumen de usuarios disponibles:');
    console.log('=====================================');
    
    const allUsers = await prisma.usuario.findMany({
      select: {
        username: true,
        nombre: true,
        rol: true
      }
    });

    allUsers.forEach(user => {
      const roleBadge = user.rol === 'admin' ? '👑 ADMIN' : '👤 OPERADOR';
      console.log(`${roleBadge} | ${user.username} | ${user.nombre}`);
    });

    console.log('\n🔗 URLs de acceso:');
    console.log('==================');
    console.log('Login: http://localhost:3000/admin/login');
    console.log('Dashboard: http://localhost:3000/admin');
    console.log('Gestión de Usuarios: http://localhost:3000/admin/usuarios (solo admin)');

    console.log('\n🔑 Credenciales de prueba:');
    console.log('==========================');
    console.log('👑 Admin: admin / admin123');
    console.log('👤 Operador 1: operador1 / operador123');
    console.log('👤 Operador 2: operador2 / operador123');

  } catch (error) {
    console.error('❌ Error al crear usuarios de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers(); 