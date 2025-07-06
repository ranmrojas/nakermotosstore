import { Store } from 'react-notifications-component';

class NotificationServiceAdmin {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private isInitializedFlag = false;
  private isPageVisible = true;
  private isPageFocused = true;
  private isAdminPage = true;
  private currentSource: AudioBufferSourceNode | null = null;

  async initialize() {
    if (this.isInitializedFlag) {
      console.log('🔄 Servicio de notificaciones ya inicializado');
      return;
    }
    
    try {
      // Crear contexto de audio
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Reanudar el contexto de audio si está suspendido
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('▶️ Contexto de audio reanudado');
      }
      
      // Precargar los sonidos
      await Promise.all([
        this.loadSound('nuevo', '/soundnotify/nuevopedido.mp3'),
        this.loadSound('recordatorio', '/soundnotify/pedidorecordatorio.mp3')
      ]);
      
      this.isInitializedFlag = true;
      console.log('✅ Servicio de notificaciones admin inicializado');
      console.log('🔊 Estado del contexto de audio:', this.audioContext.state);
      
      // Configurar detección de visibilidad y foco de página
      this.setupPageVisibilityDetection();
      
    } catch (error) {
      console.error('❌ Error inicializando servicio de notificaciones admin:', error);
      // Intentar recuperarse del error
      this.isInitializedFlag = false;
      this.audioContext = null;
      throw error; // Re-lanzar el error para manejo superior
    }
  }

  // Método público para verificar el estado de inicialización
  isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  private async loadSound(id: string, url: string) {
    try {
      console.log(`🎵 Cargando sonido ${id} desde ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      if (!this.audioContext) {
        throw new Error('Contexto de audio no disponible');
      }
      
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(id, audioBuffer);
      console.log(`✅ Sonido ${id} cargado correctamente - Duración: ${audioBuffer.duration}s`);
    } catch (error) {
      console.error(`❌ Error cargando sonido ${id}:`, error);
      throw error; // Re-lanzar el error para manejo superior
    }
  }

  private setupPageVisibilityDetection() {
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      console.log(`👁️ Página ${this.isPageVisible ? 'visible' : 'oculta'}`);
    });

    window.addEventListener('focus', () => {
      this.isPageFocused = true;
      console.log('🎯 Ventana enfocada');
    });

    window.addEventListener('blur', () => {
      this.isPageFocused = false;
      console.log('🔍 Ventana sin foco');
    });

    this.isAdminPage = true;
    console.log(`🏢 Notificaciones habilitadas en cualquier página`);
  }

  private shouldShowNotification(): boolean {
    return true;
  }

  private async playSound(id: string, duration?: number) {
    try {
      if (!this.audioContext) {
        console.log('🔄 Intentando reinicializar el contexto de audio...');
        await this.initialize();
      }

      if (!this.audioContext || !this.soundBuffers.has(id)) {
        throw new Error(`No se puede reproducir el sonido ${id}: contexto o buffer no disponible`);
      }

      // Asegurarse de que el contexto esté activo
      if (this.audioContext.state === 'suspended') {
        console.log('⏯️ Reanudando contexto de audio...');
        await this.audioContext.resume();
      }

      // Crear nodo de ganancia para controlar el volumen
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0; // Volumen al 100%
      gainNode.connect(this.audioContext.destination);

      // Crear y configurar el source
      const source = this.audioContext.createBufferSource();
      source.buffer = this.soundBuffers.get(id)!;
      source.connect(gainNode);

      // Si hay una reproducción en curso, detenerla
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch (error) {
          console.log('🔇 Error al detener sonido anterior:', error);
        }
      }
      this.currentSource = source;

      // Iniciar reproducción
      source.start();
      console.log(`🔊 Reproduciendo sonido: ${id} - Contexto: ${this.audioContext.state}`);

      // Si se especifica duración, detener después de ese tiempo
      if (duration) {
        setTimeout(() => {
          try {
            source.stop();
          } catch (error) {
            console.log('🔇 Error al detener sonido:', error);
          }
        }, duration);
      }

      // Esperar a que termine la reproducción
      return new Promise((resolve) => {
        source.onended = () => {
          console.log(`✅ Reproducción de sonido ${id} completada`);
          resolve(true);
        };
      });

    } catch (error) {
      console.error(`❌ Error reproduciendo sonido ${id}:`, error);
      throw error;
    }
  }

  async showNotification(title: string, body: string, persistente = false) {
    if (!this.shouldShowNotification()) {
      console.log('🔇 Página no activa, no mostrando notificaciones');
      return;
    }

    try {
      // Mostrar notificación del sistema operativo
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/logo.png',
          requireInteraction: persistente
        });
      }

      // Mostrar notificación en la interfaz
      Store.addNotification({
        title,
        message: body,
        type: 'info',
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: persistente ? 0 : 5000,
          onScreen: true,
          showIcon: true
        }
      });
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
    }
  }

  async notifyNewOrder(message: string, tipo: 'nuevo' | 'recordatorio' | 'otro' = 'otro') {
    try {
      console.log(`📢 Notificando nuevo pedido: ${message}`);
      
      // Reproducir sonido primero
      await this.playSound(tipo === 'recordatorio' ? 'recordatorio' : 'nuevo');
      
      // Mostrar notificación del sistema
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🛍️ Nuevo Pedido', {
          body: message,
          icon: '/logo.png',
          requireInteraction: tipo === 'recordatorio',
          silent: true // No usar el sonido por defecto del sistema
        });
      }

      // Mostrar notificación en la interfaz
      Store.addNotification({
        title: tipo === 'recordatorio' ? '⏰ Recordatorio de Pedido' : '🛍️ Nuevo Pedido',
        message: message,
        type: 'info',
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: tipo === 'recordatorio' ? 0 : 5000,
          onScreen: true,
          showIcon: true
        }
      });

      console.log('✅ Notificación mostrada exitosamente');
    } catch (error) {
      console.error('❌ Error en notifyNewOrder:', error);
      throw error;
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Estado de permisos de notificación:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('❌ Error solicitando permisos de notificación:', error);
        return false;
      }
    }
    return false;
  }

  async showReminder(message: string) {
    console.log('⏰ Mostrando recordatorio:', message);
    if (!this.shouldShowNotification()) {
      console.log('🔇 Página no activa, saltando recordatorio');
      return;
    }
    await this.playSound('recordatorio');
    // Vibración más suave para recordatorios
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }



  getPageStatus() {
    return {
      isPageVisible: this.isPageVisible,
      isPageFocused: this.isPageFocused,
      isAdminPage: this.isAdminPage,
      audioContextState: this.audioContext?.state || 'no inicializado',
      shouldShowNotifications: this.shouldShowNotification()
    };
  }

  clearAllNotifications() {
    Store.removeAllNotifications();
  }
}

// Exportar una única instancia del servicio
export const notificationService = new NotificationServiceAdmin(); 