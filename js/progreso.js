// progreso.js — Sistema de niveles motivacional (sin bloqueos)
// Detecta logros del productor y celebra el ascenso con un modal de nuevas funciones.
const Progreso = (() => {

  // ── VERIFICAR NIVEL ACTUAL ────────────────────────────────────────────────
  // Se llama al iniciar la app. Compara hitos reales con el nivel guardado.
  async function verificarNivel() {
    const usuario = Auth.obtenerUsuario();
    if (!usuario) return;

    // Recopilar métricas reales desde la DB
    let metricas = { galpones: 0, diasProduccion: 0, ventas: 0, clientes: 0 };
    try {
      const [galpones, produccion, ventas, clientes] = await Promise.allSettled([
        DB.obtenerGalpones(),
        DB.obtenerProduccionSemana(),   // usamos la semana como proxy; para días únicos
        DB.obtenerVentas ? DB.obtenerVentas() : Promise.resolve([]),
        DB.obtenerClientes ? DB.obtenerClientes() : Promise.resolve([]),
      ]);

      metricas.galpones       = (galpones.value   || []).length;
      // Contar días únicos con registro (no solo datos de esta semana)
      const diasUnicos = [...new Set((produccion.value || []).map(r => r.fecha))];
      metricas.diasProduccion = diasUnicos.length;
      metricas.ventas         = (ventas.value    || []).length;
      metricas.clientes       = (clientes.value  || []).length;
    } catch(e) {
      // Sin datos: salir silenciosamente
      return;
    }

    // Calcular nivel que le corresponde según hitos
    const nivelNuevo = calcularNivel(metricas);
    const nivelActual = parseInt(usuario.nivel) || 1;

    // Si subió de nivel → celebrar y actualizar
    if (nivelNuevo > nivelActual) {
      await actualizarNivel(usuario, nivelNuevo);
      mostrarCelebracion(nivelNuevo);
    }
  }

  // ── CÁLCULO DE NIVEL ─────────────────────────────────────────────────────
  function calcularNivel(metricas) {
    const hitos = CONFIG.HITOS_NIVEL;
    let nivelCalculado = 1;

    // Iterar niveles de mayor a menor para detectar el más alto alcanzado
    for (const nivelNum of [4, 3, 2]) {
      const h = hitos[nivelNum];
      if (!h) continue;

      const cumple = Object.entries(h).every(([clave, minimo]) => {
        return (metricas[clave] || 0) >= minimo;
      });

      if (cumple) {
        nivelCalculado = nivelNum;
        break;
      }
    }
    return nivelCalculado;
  }

  // ── ACTUALIZAR NIVEL EN DB Y LOCALSTORAGE ─────────────────────────────────
  async function actualizarNivel(usuario, nivelNuevo) {
    // Actualizar localmente
    usuario.nivel = nivelNuevo;
    localStorage.setItem('gfi_usuario', JSON.stringify(usuario));

    // Actualizar badge en UI
    const nivel = CONFIG.NIVELES[nivelNuevo];
    const badge = document.getElementById('nivel-texto');
    if (badge && nivel) badge.textContent = `${nivel.icono} ${nivel.nombre}`;

    // Persistir en Supabase si está disponible
    const db = obtenerSupabase ? obtenerSupabase() : null;
    if (db && usuario.id && usuario.id !== 'demo-001') {
      await db.from('usuarios').update({ nivel: nivelNuevo }).eq('id', usuario.id).catch(() => {});
    }
  }

  // ── MODAL DE CELEBRACIÓN ──────────────────────────────────────────────────
  function mostrarCelebracion(nivelNuevo) {
    const infoNivel = CONFIG.NIVELES[nivelNuevo];
    if (!infoNivel) return;

    const novedadesHTML = (infoNivel.novedades || []).map(n => `
      <div class="nivel-up-novedad">
        <div class="nivel-up-novedad-icono">${n.icono}</div>
        <div class="nivel-up-novedad-texto">
          <strong>${n.titulo}</strong>
          <p>${n.detalle}</p>
        </div>
      </div>`).join('');

    const html = `
      <div class="nivel-up-modal">
        <div class="nivel-up-confetti" aria-hidden="true">🎉 🏅 ⭐ 🎊 ✨</div>
        <div class="nivel-up-icono-grande">${infoNivel.icono}</div>
        <h2 class="nivel-up-titulo">¡Subiste de nivel!</h2>
        <p class="nivel-up-subtitulo">${infoNivel.nombre}</p>
        <p class="nivel-up-descripcion">${infoNivel.descripcion}</p>

        ${novedadesHTML ? `
        <div class="nivel-up-novedades-titulo">🆕 Funciones que podés aprovechar ahora</div>
        <div class="nivel-up-novedades">${novedadesHTML}</div>` : ''}

        <button class="btn-primary nivel-up-btn-cerrar" onclick="UI.cerrarModal()">
          ¡Entendido, a producir! 🐔
        </button>
      </div>`;

    // Usamos el modal genérico de la app
    if (typeof UI !== 'undefined' && UI.mostrarModal) {
      UI.mostrarModal(html);
    }
  }

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  return { verificarNivel };
})();
