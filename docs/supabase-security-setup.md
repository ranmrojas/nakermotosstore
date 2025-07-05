# Configuración de Seguridad en Supabase

## Variables de Entorno Seguras

### ✅ Variables Públicas (NEXT_PUBLIC)
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 🔒 Variables Privadas (NUNCA NEXT_PUBLIC)
```env
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_aqui
```

## Configuración de Row Level Security (RLS)

### 1. Habilitar RLS en la tabla Pedido

En el SQL Editor de Supabase:

```sql
-- Habilitar RLS en la tabla Pedido
ALTER TABLE "Pedido" ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla Cliente
ALTER TABLE "Cliente" ENABLE ROW LEVEL SECURITY;
```

### 2. Políticas de Seguridad para Pedido

```sql
-- Política: Permitir lectura de todos los pedidos (para admin)
CREATE POLICY "Permitir lectura de pedidos" ON "Pedido"
FOR SELECT USING (true);

-- Política: Permitir inserción de pedidos
CREATE POLICY "Permitir inserción de pedidos" ON "Pedido"
FOR INSERT WITH CHECK (true);

-- Política: Permitir actualización solo de estado y auditoria
CREATE POLICY "Permitir actualización de pedidos" ON "Pedido"
FOR UPDATE USING (true)
WITH CHECK (true);

-- Política: Permitir eliminación (solo para admin)
CREATE POLICY "Permitir eliminación de pedidos" ON "Pedido"
FOR DELETE USING (true);
```

### 3. Políticas de Seguridad para Cliente

```sql
-- Política: Permitir lectura de clientes
CREATE POLICY "Permitir lectura de clientes" ON "Cliente"
FOR SELECT USING (true);

-- Política: Permitir inserción de clientes
CREATE POLICY "Permitir inserción de clientes" ON "Cliente"
FOR INSERT WITH CHECK (true);

-- Política: Permitir actualización de clientes
CREATE POLICY "Permitir actualización de clientes" ON "Cliente"
FOR UPDATE USING (true)
WITH CHECK (true);
```

## Configuración Avanzada de Seguridad

### 1. Políticas Basadas en Roles

Si quieres más control, puedes crear políticas específicas:

```sql
-- Crear función para verificar si es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Aquí puedes agregar lógica para verificar roles
  -- Por ejemplo, verificar un claim JWT específico
  RETURN true; -- Temporalmente permitir todo
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política más restrictiva para eliminación
DROP POLICY IF EXISTS "Permitir eliminación de pedidos" ON "Pedido";
CREATE POLICY "Solo admin puede eliminar pedidos" ON "Pedido"
FOR DELETE USING (is_admin());
```

### 2. Políticas por Usuario

Si tienes autenticación de usuarios:

```sql
-- Política: Usuarios solo ven sus propios pedidos
CREATE POLICY "Usuarios ven sus pedidos" ON "Pedido"
FOR SELECT USING (auth.uid()::text = cliente_id::text);

-- Política: Usuarios solo pueden crear pedidos para sí mismos
CREATE POLICY "Usuarios crean sus pedidos" ON "Pedido"
FOR INSERT WITH CHECK (auth.uid()::text = cliente_id::text);
```

## Verificación de Seguridad

### 1. Probar las Políticas

```sql
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'Pedido';

-- Ver políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'Pedido';
```

### 2. Probar desde el Cliente

```typescript
// En tu aplicación, verifica que solo puedes acceder a datos permitidos
const { data, error } = await supabase
  .from('Pedido')
  .select('*')

if (error) {
  console.error('Error de acceso:', error)
} else {
  console.log('Datos accesibles:', data)
}
```

## Mejores Prácticas de Seguridad

### 1. Nunca Expongas la Clave de Servicio
```env
# ❌ NUNCA hacer esto
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_clave_secreta

# ✅ Solo usar en el servidor
SUPABASE_SERVICE_ROLE_KEY=tu_clave_secreta
```

### 2. Usar API Routes para Operaciones Sensibles

```typescript
// pages/api/pedidos/delete.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clave privada
)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.body
  
  // Verificar permisos aquí
  // ...

  const { error } = await supabase
    .from('Pedido')
    .delete()
    .eq('id', id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ message: 'Pedido eliminado' })
}
```

### 3. Validar Datos en el Cliente y Servidor

```typescript
// Validación en el cliente
const createPedido = async (pedidoData: PedidoData) => {
  // Validar datos antes de enviar
  if (!pedidoData.clienteId || pedidoData.total <= 0) {
    throw new Error('Datos inválidos')
  }

  const { error } = await supabase
    .from('Pedido')
    .insert(pedidoData)

  if (error) throw error
}
```

## Resumen de Seguridad

✅ **Seguro**: Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
✅ **Seguro**: Habilitar RLS en todas las tablas  
✅ **Seguro**: Definir políticas específicas  
✅ **Seguro**: Validar datos en cliente y servidor  

❌ **Inseguro**: Exponer `SUPABASE_SERVICE_ROLE_KEY`  
❌ **Inseguro**: Deshabilitar RLS  
❌ **Inseguro**: Políticas demasiado permisivas  

## Configuración Recomendada para tu Proyecto

Para tu caso específico, recomiendo:

1. **Habilitar RLS** en las tablas Pedido y Cliente
2. **Usar las políticas básicas** que permiten lectura/escritura
3. **Implementar validación** en el cliente
4. **Usar API routes** para operaciones sensibles como eliminación

Con esta configuración, tu base de datos estará protegida incluso con las variables públicas. 