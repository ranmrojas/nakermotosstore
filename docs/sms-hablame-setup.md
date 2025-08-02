# Sistema de SMS con Hablame API v5

Sistema de envío de SMS integrado con la API v5 de Hablame.

## Configuración

### Variables de Entorno (.env):
```env
HABLAME_API_KEY=your_hablame_api_key_here
HABLAME_API_URL=https://www.hablame.co/api/sms/v5
```

## Uso

### Hook en Componentes React:
```tsx
import { useSmsHablame } from '../hooks/useSmsHablame';

const { enviando, error, enviarSms } = useSmsHablame();

const handleEnviar = async () => {
  const resultado = await enviarSms({
    numero: '3001234567',
    mensaje: 'Mensaje de prueba'
  });
  
  if (resultado.success) {
    console.log('SMS enviado');
  }
};
```

### Servicio para Notificaciones:
```tsx
import { notificarEstadoPedido } from '../lib/smsNotificationService';

await notificarEstadoPedido('pedido123', '3001234567', 'Juan Pérez', 'confirmado');
```

### Plantillas Disponibles:
- Confirmación de pedido
- Pedido enviado  
- Pedido entregado
- Código de verificación
- Recordatorio de pago

## Archivos del Sistema

- `pages/api/sms/hablame/route.ts` - Endpoint API
- `hooks/useSmsHablame.ts` - Hook React con plantillas
- `lib/smsNotificationService.ts` - Servicio de notificaciones
- `app/componentes/sms/EnviarSmsComponent.tsx` - Componente ejemplo
