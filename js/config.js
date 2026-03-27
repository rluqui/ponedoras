// config.js — Configuración central de la app
const CONFIG = {
  SUPABASE_URL: 'https://jesmqwxdtshzqdzeofrb.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implc21xd3hkdHNoenFkemVvZnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTcyNjEsImV4cCI6MjA4OTg3MzI2MX0.ojpXQ0tcsVqOuFkzgL8bEZCD6ROKWZMJzi4IyIK3CiE',
  GEMINI_KEY:   'TU_GEMINI_API_KEY',   // 👈 Obtené en: aistudio.google.com
  APP_VERSION: '1.0.0-mvp',
  NOMBRE_APP: 'Granja Familiar Inteligente',



  // Nivel del productor
  NIVELES: {
    1: { nombre: 'Granja Familiar',    icono: '🌱', tabs: ['hoy','produccion'] },
    2: { nombre: 'Productor Organizado', icono: '📋', tabs: ['hoy','granja','produccion'] },
    3: { nombre: 'En Crecimiento',     icono: '🚀', tabs: ['hoy','granja','produccion','equipo','redes'] },
    4: { nombre: 'Microempresa',       icono: '🏆', tabs: ['hoy','granja','produccion','equipo','redes','inspeccion'] },
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
