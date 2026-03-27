// config.js — Configuración central de la app
const CONFIG = {
  SUPABASE_URL: 'https://jesmqwxdtshzqdzeofrb.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implc21xd3hkdHNoenFkemVvZnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcyNjEsImV4cCI6MjA4OTg3MzI2MX0.ojpXQ0tcsVqOuFkzgL8bEZCD6ROKWZMJzi4IyIK3CiE',
  GEMINI_KEY:   'TU_GEMINI_API_KEY',   // 👈 Obtené en: aistudio.google.com
  APP_VERSION: '1.0.0-mvp',
  NOMBRE_APP: 'Granja Familiar Inteligente',

  // ── NIVELES: identificación motivacional sin restricciones ────────────────
  // Todos los módulos están disponibles siempre. Los niveles celebran logros.
  NIVELES: {
    1: {
      nombre: 'Granja Familiar',
      icono:  '🌱',
      descripcion: 'Estás dando tus primeros pasos. ¡Bienvenido!',
    },
    2: {
      nombre: 'Productor Organizado',
      icono:  '📋',
      descripcion: 'Ya tenés tu granja registrada y llevás un control básico.',
      // Qué le mostramos al subir a este nivel
      novedades: [
        { icono: '🐔', titulo: 'Mis Galpones', detalle: 'Registrá cada galpón con su capacidad, tipo y estado. Así sabés de un vistazo qué necesita atención.' },
        { icono: '📊', titulo: 'Historial de Producción', detalle: 'Cada día que registrás, la app calcula automáticamente tu porcentaje de postura y tendencias.' },
        { icono: '🔔', titulo: 'Alertas automáticas', detalle: 'La app te avisa si detecta agua baja, mortandad alta o vacunas próximas en el panel de hoy.' },
      ],
    },
    3: {
      nombre: 'En Crecimiento',
      icono:  '🚀',
      descripcion: 'Tu granja crece con datos y equipo. ¡Estás profesionalizándote!',
      novedades: [
        { icono: '🤝', titulo: 'Gestión de Clientes', detalle: 'Registrá tus compradores, llevá el historial de ventas y la app te sugiere contactar a los que hace tiempo no compraron.' },
        { icono: '💰', titulo: 'Ventas y Finanzas', detalle: 'Registrá cada venta con precio y método de pago. La app calcula tus ingresos semanales y mensuales.' },
        { icono: '👨‍👩‍👧', titulo: 'Equipo familiar', detalle: 'Asigná tareas a cada miembro de tu familia o equipo. Todos saben qué hacer cada día.' },
      ],
    },
    4: {
      nombre: 'Microempresa',
      icono:  '🏆',
      descripcion: '¡Tu granja opera como una empresa profesional! Acceso total.',
      novedades: [
        { icono: '📸', titulo: 'Inspección con Foto', detalle: 'Documentá el estado de tus galpones con fotos. Ideal para detectar problemas y llevar un registro visual.' },
        { icono: '📱', titulo: 'Redes Sociales', detalle: 'La app te ayuda a crear contenido para publicar tu producción en Instagram o WhatsApp y atraer más clientes.' },
        { icono: '🤖', titulo: 'Asistente IA', detalle: 'Tu asistente inteligente responde consultas de producción, te sugiere mejoras y detecta anomalías en tus datos.' },
      ],
    },
  },

  // ── HITOS para calcular ascenso automático de nivel ──────────────────────
  // Se evalúan en Progreso.verificarNivel() al cargar la app
  HITOS_NIVEL: {
    2: { galpones: 1,   diasProduccion: 3  }, // Subís a N2 con 1 galpón y 3 días registrados
    3: { galpones: 1,   diasProduccion: 14, ventas: 1     }, // N3: 2 semanas + primera venta
    4: { galpones: 2,   diasProduccion: 30, clientes: 3   }, // N4: 30 días + 3 clientes
  },

  TIPOS_PRODUCCION: ['Jaula','Piso','Campero','Granja libre','Orgánico'],
  ROLES_FAMILIA: ['Producción','Administración','Redes','Ventas','Mantenimiento','Aprendiz'],
  AVATARES_ROLES: {
    'Producción':     '🧑‍🌾',
    'Administración': '📊',
    'Redes':          '📱',
    'Ventas':         '🤝',
    'Mantenimiento':  '🔧',
    'Aprendiz':       '📚',
  }
};
