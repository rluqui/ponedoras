// sw.js — Service Worker con auto-update para PWA
// Versión: cada deploy en Vercel/Netlify reemplaza este archivo con una nueva CACHE_NAME
// El navegador detecta el cambio y notifica al usuario automáticamente.

const CACHE_NAME = 'granja-v1.0.0';  // ← Incrementar en cada release para forzar actualización

const ARCHIVOS_CORE = [
  '/',
  '/index.html',
  '/css/app.css',
  '/manifest.json',
  '/js/config.js',
  '/js/supabase.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/progreso.js',
  '/js/app.js',
  '/js/modules/hoy.js',
  '/js/modules/granja.js',
  '/js/modules/produccion.js',
  '/js/modules/equipo.js',
  '/js/modules/redes.js',
  '/js/modules/ventas.js',
  '/js/modules/plantel.js',
  '/js/modules/configuracion.js',
  '/js/modules/inspeccion.js',
  '/js/modules/asistente.js',
  '/js/modules/contador_ia.js',
  '/js/modules/clientes.js',
];

// ── INSTALL: guarda archivos core en caché ─────────────────────────────────
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS_CORE))
  );
  // Activar inmediatamente sin esperar a que cierren las pestañas viejas
  self.skipWaiting();
});

// ── ACTIVATE: elimina cachés viejos y toma control ────────────────────────
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys().then(claves =>
      Promise.all(
        claves
          .filter(clave => clave !== CACHE_NAME)
          .map(clave => caches.delete(clave))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Network First, caché como fallback ─────────────────────────────
// Estrategia: intenta red siempre → si falla → sirve desde caché
// Esto garantiza que el usuario vea datos frescos cuando hay conexión.
self.addEventListener('fetch', evento => {
  // Solo interceptar peticiones del mismo origen (no Supabase ni CDN externo)
  if (!evento.request.url.startsWith(self.location.origin)) return;

  evento.respondWith(
    fetch(evento.request)
      .then(respuestaRed => {
        // Actualizar caché con la respuesta fresca
        const clon = respuestaRed.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evento.request, clon));
        return respuestaRed;
      })
      .catch(() => caches.match(evento.request))
  );
});

// ── MENSAJE: recibir orden de actualización forzada desde la app ──────────
self.addEventListener('message', evento => {
  if (evento.data?.tipo === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
