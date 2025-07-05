# Sistema de Login para Panel Administrativo

## Descripción

Este sistema implementa un login seguro para acceder al panel administrativo (`/admin`) utilizando el modelo de Usuario de Prisma.

## Componentes Creados

### 1. Endpoints de Autenticación

#### `/api/auth/login` (POST)
- Valida credenciales de usuario
- Crea sesión con cookie HttpOnly
- Retorna datos del usuario autenticado

#### `/api/auth/logout` (POST)
- Elimina la sesión del usuario
- Limpia la cookie de sesión

#### `/api/auth/verify` (GET)
- Verifica si el usuario está autenticado
- Retorna datos del usuario si la sesión es válida

#### `/api/auth/register` (POST)
- Registra un nuevo usuario en el sistema
- Validaciones de campos y usuario único
- Retorna confirmación de registro exitoso

### 2. Endpoints de Gestión de Usuarios

#### `/api/usuarios` (GET/POST)
- GET: Lista todos los usuarios (sin contraseñas)
- POST: Crea un nuevo usuario

#### `/api/usuarios/[id]` (GET/PATCH/DELETE)
- GET: Obtiene un usuario específico
- PATCH: Actualiza un usuario (permite actualizar sin cambiar contraseña)
- DELETE: Elimina un usuario

### 3. Hook de Autenticación

#### `hooks/useAdminAuth.ts`
- Maneja el estado de autenticación
- Proporciona funciones de login/logout
- Verifica automáticamente la sesión al cargar

### 4. Componentes de UI

#### `app/admin/login/page.tsx`
- Página de login con formulario moderno
- Formulario de registro integrado
- Validación de campos y contraseñas
- Redirección automática si ya está autenticado
- Cambio dinámico entre login y registro

#### `app/componentes/admin/AdminProtected.tsx`
- Componente wrapper para proteger rutas
- Header con navegación y información del usuario
- Botón de logout
- Redirección al login si no está autenticado

#### `app/componentes/admin/UserManager.tsx`
- CRUD completo para gestión de usuarios
- Solo accesible para usuarios con rol 'admin'
- Formulario para crear/editar usuarios
- Tabla con lista de usuarios
- Validación de permisos

#### `app/admin/usuarios/page.tsx`
- Página dedicada para gestión de usuarios
- Protegida con AdminProtected
- Solo visible para administradores

### 4. Middleware Actualizado

#### `middleware.ts`
- Protege todas las rutas `/admin/*`
- Redirige a `/admin/login` si no hay sesión
- Permite acceso a rutas de autenticación

## Instalación y Configuración

### 1. Gestión de Usuarios de Prueba

#### Crear usuarios de prueba:
```bash
npm run createtestusers
```

#### Limpiar usuarios de prueba:
```bash
npm run cleartestusers
```

Esto creará usuarios con las siguientes credenciales:

#### 👑 Administrador
- **Usuario:** admin
- **Contraseña:** admin123
- **Rol:** admin

#### 👤 Operadores
- **Usuario:** operador1
- **Contraseña:** operador123
- **Rol:** operador

- **Usuario:** operador2
- **Contraseña:** operador123
- **Rol:** operador

### 2. Acceder al Panel

#### Opción 1: Usar usuarios existentes
1. Ve a `http://localhost:3000/admin/login`
2. Ingresa las credenciales de un usuario existente
3. Serás redirigido automáticamente al panel administrativo

#### Opción 2: Registrar nuevo usuario
1. Ve a `http://localhost:3000/admin/login`
2. Haz clic en "¿No tienes cuenta? Regístrate aquí"
3. Completa el formulario de registro
4. Una vez registrado, inicia sesión con tus credenciales

### 3. Navegación del Panel

- **Dashboard:** `http://localhost:3000/admin` - Panel principal con gestión de pedidos
- **Gestión de Usuarios:** `http://localhost:3000/admin/usuarios` - Solo para administradores

## Estructura de Archivos

```
├── pages/api/auth/
│   ├── login.ts          # Endpoint de login
│   ├── logout.ts         # Endpoint de logout
│   ├── register.ts       # Endpoint de registro
│   └── verify.ts         # Endpoint de verificación
├── pages/api/usuarios/
│   ├── index.ts          # CRUD de usuarios
│   └── [id].ts           # Operaciones por ID
├── hooks/
│   └── useAdminAuth.ts   # Hook de autenticación
├── app/admin/
│   ├── login/
│   │   └── page.tsx      # Página de login
│   ├── usuarios/
│   │   └── page.tsx      # Gestión de usuarios
│   └── page.tsx          # Panel admin (protegido)
├── app/componentes/admin/
│   ├── AdminProtected.tsx # Componente de protección
│   └── UserManager.tsx   # CRUD de usuarios
├── scripts/
│   ├── createAdminUser.js # Script para crear usuario
│   ├── createTestUsers.js # Script para crear usuarios de prueba
│   └── clearTestUsers.js  # Script para limpiar usuarios de prueba
└── middleware.ts         # Middleware actualizado
```

## Seguridad

### Características Implementadas

- ✅ Cookies HttpOnly para sesiones
- ✅ Validación de credenciales
- ✅ Protección de rutas con middleware
- ✅ Redirección automática
- ✅ Limpieza de sesión en logout
- ✅ Registro de nuevos usuarios
- ✅ Validación de contraseñas (mínimo 5 caracteres)
- ✅ Verificación de usuario único
- ✅ Interfaz dinámica login/registro

### Mejoras Recomendadas para Producción

1. **Encriptación de Contraseñas**
   ```bash
   npm install bcryptjs
   ```

2. **JWT para Sesiones**
   ```bash
   npm install jsonwebtoken
   ```

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Validación de Entrada**
   ```bash
   npm install joi
   ```

## Uso

### Proteger una Nueva Ruta

```tsx
import AdminProtected from '../componentes/admin/AdminProtected';

export default function MiPaginaAdmin() {
  return (
    <AdminProtected>
      <div>
        {/* Contenido protegido */}
      </div>
    </AdminProtected>
  );
}
```

### Usar el Hook de Autenticación

```tsx
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function MiComponente() {
  const { user, isAuthenticated, login, logout } = useAdminAuth();
  
  // Usar las funciones según necesites
}
```

### Verificar Rol de Usuario

```tsx
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function MiComponente() {
  const { user } = useAdminAuth();
  
  // Solo mostrar para administradores
  if (user?.rol !== 'admin') {
    return <div>Acceso denegado</div>;
  }
  
  return <div>Contenido solo para admins</div>;
}
```

## Troubleshooting

### Error: "No autenticado"
- Verifica que la cookie `admin_session` esté presente
- Asegúrate de haber hecho login correctamente

### Error: "Sesión inválida"
- La cookie puede estar corrupta
- Haz logout y vuelve a hacer login

### Error: "Credenciales inválidas"
- Verifica el usuario y contraseña
- Ejecuta `npm run createadmin` para crear un usuario nuevo

## Notas Importantes

1. **Contraseñas en Texto Plano**: En este ejemplo las contraseñas se almacenan en texto plano. En producción, usa bcrypt.

2. **Sesiones Simples**: Se usan cookies JSON simples. En producción, considera usar JWT.

3. **Sin HTTPS**: En desarrollo funciona con HTTP. En producción, asegúrate de usar HTTPS.

4. **Base de Datos**: Asegúrate de que el modelo Usuario esté sincronizado con la base de datos. 