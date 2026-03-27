// hoy.js — Módulo HOY: dashboard del día con KPIs 100% reales
const ModuloHoy = (() => {

  // ── RENDER PRINCIPAL — esqueleto inmediato, datos cargan en postRender ──
  function render() {
    return `
    <div class="modulo-contenedor">

      <!-- SALUDO Y ACCIÓN RÁPIDA -->
      <div class="hoy-saludo">
        <div>
          <h1 class="hoy-titulo">Buenos días 👋</h1>
          <p class="hoy-subtitulo" id="hoy-fecha-label"></p>
        </div>
        <button class="btn-registro-rapido" onclick="App.navegar('produccion')">
          ✏️ Registrar día
        </button>
      </div>

      <!-- RESUMEN SEMANAL -->
      <div class="semana-card">
        <div class="semana-info">
          <span class="semana-icono">📦</span>
          <div>
            <p class="semana-label">Esta semana</p>
            <p class="semana-valor" id="semana-resumen">Cargando...</p>
          </div>
        </div>
        <div class="semana-promedio" id="semana-promedio">—</div>
      </div>

      <!-- KPIs DEL DÍA — actualizados por postRender -->
      <div id="hoy-kpis-zona">
        <div class="kpi-grid" id="hoy-kpis">
          ${kpiSkeleton()}
        </div>
      </div>

      <!-- GALPONES (mini) -->
      <div class="seccion-bloque">
        <div class="seccion-header">
          <h3 class="seccion-titulo">🐔 Mis Galpones</h3>
          <button class="btn-ver-todo" onclick="App.navegar('granja')">Ver todo ›</button>
        </div>
        <div id="hoy-galpones-lista" class="galpon-mini-lista">
          <div class="skeleton" style="height:48px;border-radius:12px"></div>
          <div class="skeleton" style="height:48px;border-radius:12px;margin-top:8px"></div>
        </div>
      </div>

      <!-- ALERTAS -->
      <div class="seccion-bloque">
        <div class="seccion-header">
          <h3 class="seccion-titulo">🔔 Alertas</h3>
          <span class="alertas-count" id="hoy-badge-alertas">0</span>
        </div>
        <div id="hoy-alertas-lista">
          <p class="sin-alertas">✅ Cargando alertas...</p>
        </div>
      </div>

      <!-- TAREAS DEL DÍA -->
      <div class="seccion-bloque">
        <div class="seccion-header">
          <h3 class="seccion-titulo">✅ Tareas de hoy</h3>
          <span class="tareas-pct" id="hoy-tareas-pct">—</span>
        </div>
        <div class="tareas-lista" id="hoy-tareas-lista">
          <div class="skeleton" style="height:42px;border-radius:12px"></div>
        </div>
      </div>

    </div>`;
  }

  function kpiSkeleton() {
    return `
      <div class="kpi-card kpi-principal">
        <div class="kpi-valor" id="kpi-huevos">—</div>
        <div class="kpi-label">🥚 Huevos hoy</div>
        <div class="kpi-tendencia" id="kpi-tendencia">cargando...</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor kpi-verde" id="kpi-maples">—</div>
        <div class="kpi-label">📦 Maples</div>
        <div class="kpi-sub" id="kpi-maples-sub">—</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor" id="kpi-rotos">—</div>
        <div class="kpi-label">🥚 Rotos/descarte</div>
        <div class="kpi-sub" id="kpi-rotos-sub">—</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor" id="kpi-mortandad">—</div>
        <div class="kpi-label">💀 Mortandad</div>
        <div class="kpi-sub" id="kpi-mort-sub">—</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor" id="kpi-agua">💧</div>
        <div class="kpi-label">Agua</div>
        <div class="kpi-sub" id="kpi-agua-sub">—</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor" id="kpi-postura">—</div>
        <div class="kpi-label">📈 Postura</div>
        <div class="kpi-sub" id="kpi-postura-sub">—</div>
      </div>`;
  }

  // ── POST RENDER — carga todos los datos asincrónicamente ──────
  async function postRender() {
    // Fecha
    const elFecha = document.getElementById('hoy-fecha-label');
    if (elFecha) {
      elFecha.textContent = new Date().toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
    }

    // Lanzar todo en paralelo para máxima velocidad
    await Promise.allSettled([
      actualizarKPIs(),
      cargarResumenSemana(),
      cargarGalponesAsync(),
      cargarTareasAsync(),
      cargarAlertasAsync()
    ]);
  }

  // ── KPIs principales ─────────────────────────────────────────
  async function actualizarKPIs() {
    try {
      const hoy    = await DB.obtenerProduccionHoy();
      const ayer   = await DB.obtenerProduccionFecha(diaAnterior());
      const lotes  = await DB.obtenerLotesActivos();

      if (!hoy) {
        // Sin registros hoy — estado vacío amigable
        mostrarEstadoVacio();
        return;
      }

      const huevosAyer = ayer?.huevos || 0;
      const tend = calcularTendencia(hoy.huevos, huevosAyer);

      // Postura estimada
      const avesEnProduccion = lotes.reduce((s, l) => s + (l.cantidad_actual || 0), 0);
      const postura = avesEnProduccion > 0
        ? ((hoy.huevos / avesEnProduccion) * 100).toFixed(1)
        : null;

      // Actualizar DOM
      set('kpi-huevos',    hoy.huevos);
      set('kpi-maples',    hoy.maples);
      set('kpi-maples-sub', `= ${hoy.maples * 30} huevos`);

      setKpiConColor('kpi-rotos', hoy.rotos,
        hoy.rotos === 0 ? 'verde' : hoy.rotos <= 5 ? 'amarillo' : 'rojo');
      set('kpi-rotos-sub', hoy.rotos === 0 ? 'Sin rotos ✓' : `${Math.round((hoy.rotos / (hoy.huevos + hoy.rotos)) * 100)}% del total`);

      setKpiConColor('kpi-mortandad', hoy.mortandad,
        hoy.mortandad === 0 ? 'verde' : hoy.mortandad <= 2 ? 'amarillo' : 'rojo');
      set('kpi-mort-sub', hoy.mortandad === 0 ? 'Normal' : '⚠️ Revisar');

      const iconoAgua = { normal: '💧', baja: '⚠️', sin_agua: '🚫' };
      const labelAgua = { normal: 'Normal', baja: '⚠️ Baja — revisar', sin_agua: '🚫 Sin agua hoy' };
      set('kpi-agua',     iconoAgua[hoy.agua] || '💧');
      set('kpi-agua-sub', labelAgua[hoy.agua] || '—');

      if (postura !== null) {
        setKpiConColor('kpi-postura', `${postura}%`,
          postura >= 75 ? 'verde' : postura >= 50 ? 'amarillo' : 'rojo');
        set('kpi-postura-sub', `${avesEnProduccion} aves en prod.`);
      } else {
        set('kpi-postura', '—');
        set('kpi-postura-sub', 'Sin plantel cargado');
      }

      // Tendencia
      const elT = document.getElementById('kpi-tendencia');
      if (elT) {
        elT.textContent = huevosAyer > 0
          ? `${tend.positivo ? '▲' : '▼'} ${Math.abs(tend.pct)}% vs ayer`
          : 'Sin dato de ayer';
        elT.className = `kpi-tendencia ${tend.positivo ? 'positiva' : 'negativa'}`;
      }

    } catch (e) {
      console.error('Error actualizando KPIs:', e);
      mostrarEstadoVacio();
    }
  }

  function mostrarEstadoVacio() {
    const zona = document.getElementById('hoy-kpis-zona');
    if (!zona) return;
    zona.innerHTML = `
      <div class="estado-vacio">
        <div class="estado-vacio-icono">🐔</div>
        <p class="estado-vacio-titulo">Todavía no hay registros cargados hoy</p>
        <p class="estado-vacio-sub">Usá el botón <strong>"Registrar día"</strong> para comenzar</p>
        <button class="btn-primary" onclick="App.navegar('produccion')" style="margin-top:16px">
          ✏️ Cargar producción de hoy
        </button>
      </div>`;
  }

  // ── RESUMEN SEMANAL ───────────────────────────────────────────
  async function cargarResumenSemana() {
    const elResumen  = document.getElementById('semana-resumen');
    const elPromedio = document.getElementById('semana-promedio');
    try {
      const datos = await DB.obtenerProduccionSemana();
      if (!datos.length) {
        if (elResumen)  elResumen.textContent  = 'Sin registros esta semana';
        if (elPromedio) elPromedio.textContent = '';
        return;
      }
      const totalHuevos = datos.reduce((s, r) => s + (parseInt(r.huevos) || 0), 0);
      const totalMaples  = Math.floor(totalHuevos / 30);
      const diasUnicos   = [...new Set(datos.map(r => r.fecha))].length;
      const promedio     = diasUnicos ? Math.round(totalHuevos / diasUnicos) : 0;
      if (elResumen)  elResumen.textContent  = `${totalHuevos.toLocaleString('es-AR')} huevos · ${totalMaples} maples`;
      if (elPromedio) elPromedio.textContent = `~${promedio}/día`;
    } catch (e) {
      if (elResumen) elResumen.textContent = 'Sin datos';
    }
  }

  // ── GALPONES ─────────────────────────────────────────────────
  async function cargarGalponesAsync() {
    const lista = document.getElementById('hoy-galpones-lista');
    if (!lista) return;
    try {
      const [galpones, semana] = await Promise.all([
        DB.obtenerGalpones(),
        DB.obtenerProduccionSemana()
      ]);
      if (!galpones.length) {
        lista.innerHTML = '<p class="sin-alertas">Agregá tu primer galpón en GRANJA 🐔</p>';
        return;
      }
      lista.innerHTML = galpones.map(g => {
        const regHoy = semana.find(r => r.galpon === g.nombre && r.fecha === new Date().toISOString().split('T')[0]);
        const agua   = regHoy?.estado_agua || null;
        const huevos = regHoy?.huevos ?? '—';
        const color  = !regHoy ? '#666' : agua === 'sin_agua' ? '#f44336' : agua === 'baja' ? '#ff9800' : '#4caf50';
        return `
        <div class="galpon-mini" onclick="App.navegar('granja')">
          <div class="galpon-semaforo" style="background:${color}"></div>
          <div class="galpon-mini-info">
            <strong>${g.nombre}</strong>
            <span>${huevos} 🥚 · ${agua ? iconoEstadoAgua(agua) : '—'}</span>
          </div>
          <span class="galpon-mini-arrow">›</span>
        </div>`;
      }).join('');
    } catch (e) {
      console.warn('Error cargando galpones:', e);
    }
  }

  // ── TAREAS ───────────────────────────────────────────────────
  async function cargarTareasAsync() {
    const lista = document.getElementById('hoy-tareas-lista');
    const pctEl = document.getElementById('hoy-tareas-pct');
    if (!lista) return;

    try {
      const tareas = await DB.obtenerTareasHoy();
      if (!tareas.length) {
        lista.innerHTML = '<p class="sin-alertas">✅ Sin tareas pendientes. ¡Buen trabajo!</p>';
        if (pctEl) pctEl.textContent = '0/0';
        return;
      }
      const hechas = tareas.filter(t => t.estado === 'hecho').length;
      if (pctEl) pctEl.textContent = `${hechas}/${tareas.length}`;
      lista.innerHTML = tareas.map(t => {
        const m = t.equipo_miembros;
        const clzCompletada = t.estado === 'hecho' ? 'completada' : '';
        
        // Estilos para tareas inteligentes
        const icon = t.estado === 'hecho' ? '✅' : (t.automatica ? '⚙️' : '⬜');
        const clickDiv = t.automatica && t.estado !== 'hecho' ? `onclick="App.navegar('produccion')"` : '';
        const clickBtn = t.automatica ? 'disabled' : `onclick="ModuloHoy.toggleTarea('${t.id}','${t.estado}')"`;
        const styleDiv = t.automatica && t.estado !== 'hecho' ? `cursor:pointer; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1)` : '';
        const styleText = t.automatica && t.estado !== 'hecho' ? `color:var(--texto-primario); font-weight:600;` : '';
        const callToAction = t.automatica && t.estado !== 'hecho' ? `<span style="color:var(--color-primario); font-size:0.85rem; white-space:nowrap; padding-left:8px">👉 Ir</span>` : '';

        return `
        <div class="tarea-item ${clzCompletada}" id="tarea-${t.id}" ${clickDiv} style="${styleDiv}">
          <button class="tarea-check" ${clickBtn}>
            ${icon}
          </button>
          <div class="tarea-info" style="display:flex; justify-content:space-between; align-items:center; width:100%">
            <div style="display:flex; flex-direction:column; gap:2px">
              <span class="tarea-texto" style="${styleText}">${t.titulo}</span>
              ${m ? `<span class="tarea-asignado">${m.avatar} ${m.nombre}</span>` : ''}
            </div>
            ${callToAction}
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      lista.innerHTML = '<p class="sin-alertas">Error cargando tareas</p>';
    }
  }

  // ── ALERTAS AUTOMÁTICAS ───────────────────────────────────────
  async function cargarAlertasAsync() {
    const lista  = document.getElementById('hoy-alertas-lista');
    const badge  = document.getElementById('hoy-badge-alertas');
    if (!lista) return;

    const alertas = [];

    try {
      // Alertas de vacunas próximas
      const vacunas = await DB.obtenerVacunasProximas();
      vacunas.forEach(v => {
        if (v.dias_restantes <= 3)
          alertas.push({ tipo: 'danger',  icono: '💉', texto: `${v.vacuna} en ${v.dias_restantes} días — ${v.galpon}` });
        else if (v.dias_restantes <= 7)
          alertas.push({ tipo: 'warning', icono: '💉', texto: `${v.vacuna} en ${v.dias_restantes} días — ${v.galpon}` });
      });

      // Alertas de producción: agua sin servicio o baja
      const hoy = await DB.obtenerProduccionHoy();
      if (hoy) {
        if (hoy.agua === 'sin_agua')
          alertas.push({ tipo: 'danger',  icono: '🚫', texto: 'Sin agua en algún galpón — acción urgente' });
        else if (hoy.agua === 'baja')
          alertas.push({ tipo: 'warning', icono: '💧', texto: 'Agua baja en algún galpón — revisar hoy' });
        if (hoy.alimento === 'sin_alimento')
          alertas.push({ tipo: 'danger',  icono: '🌾', texto: 'Sin alimento — reponer urgente' });
        if (hoy.mortandad > 5)
          alertas.push({ tipo: 'danger',  icono: '⚠️', texto: `Mortandad alta hoy: ${hoy.mortandad} aves` });
      }

      // Alertas de tareas vencidas
      const tareas = await DB.obtenerTareasHoy();
      const pendientes = tareas.filter(t => t.estado !== 'hecho').length;
      if (pendientes >= 3)
        alertas.push({ tipo: 'warning', icono: '📋', texto: `${pendientes} tareas pendientes sin completar` });

    } catch (e) { /* silencioso */ }

    if (badge) badge.textContent = alertas.length;
    if (!alertas.length) {
      lista.innerHTML = '<p class="sin-alertas">✅ Todo en orden hoy</p>';
      return;
    }
    lista.innerHTML = alertas.map(a => `
      <div class="alerta-item alerta-${a.tipo}">
        <span>${a.icono}</span><span>${a.texto}</span>
      </div>`).join('');
  }

  // ── HELPERS ──────────────────────────────────────────────────

  function set(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function setKpiConColor(id, valor, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = valor;
    el.className = `kpi-valor kpi-${color}`;
  }

  function iconoEstadoAgua(estado) {
    return estado === 'normal' ? '💧 Normal' : estado === 'baja' ? '⚠️ Baja' : '🚫 Sin agua';
  }

  function diaAnterior() {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return ayer.toISOString().split('T')[0];
  }

  function calcularTendencia(hoy, ayer) {
    if (!ayer || ayer === 0) return { diff: 0, pct: 0, positivo: true };
    const diff = hoy - ayer;
    const pct  = Math.round((Math.abs(diff) / ayer) * 100);
    return { diff, pct, positivo: diff >= 0 };
  }

  async function toggleTarea(id, estadoActual) {
    const el = document.getElementById(`tarea-${id}`);
    if (el) el.classList.toggle('completada');
    const res = await DB.toggleTareaDB(id, estadoActual);
    if (res.ok) {
      UI.mostrarToast(estadoActual === 'hecho' ? 'Tarea reabierta' : 'Tarea completada ✓', 'success');
    }
  }

  return { render, postRender, toggleTarea };
})();
