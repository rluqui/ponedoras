// plantel.js — Módulo PLANTEL: gestión de lotes de gallinas
const ModuloPlantel = (() => {

  const RAZAS  = ['Rhode Island Red','Plymouth Rock','Leghorn','Hy-Line','Lohmann','ISA Brown','Mixta','Otra'];
  const ESTADOS = [
    { clave: 'activo',     label: '✅ En producción', color: '#4caf50' },
    { clave: 'recria',     label: '🐣 En recría',     color: '#ff9800' },
    { clave: 'descartado', label: '❌ Descartado',    color: '#f44336' },
    { clave: 'vendido',    label: '💼 Vendido',       color: '#9e9e9e' },
  ];

  let vista = 'lista'; // 'lista' | 'detalle'
  let loteSeleccionado = null;

  // ── RENDER ────────────────────────────────────────────────────
  function render() {
    return `
    <div class="modulo-contenedor">
      <div class="modulo-encabezado">
        <h2 class="modulo-titulo">🐔 Plantel</h2>
        <button class="btn-agregar" onclick="ModuloPlantel.abrirFormulario('nuevo')">+ Nuevo lote</button>
      </div>

      <!-- KPIs generales -->
      <div class="plantel-kpis" id="plantel-kpis">
        <div class="plantel-kpi">
          <div class="plantel-kpi-val" id="pk-total">—</div>
          <div class="plantel-kpi-label">Total aves</div>
        </div>
        <div class="plantel-kpi">
          <div class="plantel-kpi-val kpi-verde" id="pk-produccion">—</div>
          <div class="plantel-kpi-label">En producción</div>
        </div>
        <div class="plantel-kpi">
          <div class="plantel-kpi-val kpi-amarillo" id="pk-recria">—</div>
          <div class="plantel-kpi-label">En recría</div>
        </div>
        <div class="plantel-kpi">
          <div class="plantel-kpi-val" id="pk-lotes">—</div>
          <div class="plantel-kpi-label">Lotes activos</div>
        </div>
      </div>

      <!-- Alertas de inconsistencias -->
      <div id="plantel-alertas"></div>

      <!-- Lista de lotes -->
      <div class="seccion-bloque">
        <div class="seccion-header">
          <h3 class="seccion-titulo">📦 Lotes registrados</h3>
        </div>
        <div id="plantel-lista">
          <div class="skeleton" style="height:80px;border-radius:16px"></div>
          <div class="skeleton" style="height:80px;border-radius:16px;margin-top:8px"></div>
        </div>
      </div>
    </div>`;
  }

  // ── POST RENDER ───────────────────────────────────────────────
  async function postRender() {
    await cargarLotes();
  }

  async function cargarLotes() {
    try {
      const lotes = await DB.obtenerLotesTodos();
      renderKPIs(lotes);
      verificarInconsistencias(lotes);
      renderLista(lotes);
    } catch (e) {
      const lista = document.getElementById('plantel-lista');
      if (lista) lista.innerHTML = '<p class="sin-alertas">Error cargando lotes</p>';
    }
  }

  function renderKPIs(lotes) {
    const activos     = lotes.filter(l => l.estado === 'activo');
    const enRecria    = lotes.filter(l => l.estado === 'recria');
    const totalAves   = lotes.filter(l => l.estado === 'activo' || l.estado === 'recria')
                             .reduce((s, l) => s + (l.cantidad_actual || 0), 0);
    const enProd      = activos.reduce((s, l) => s + (l.cantidad_actual || 0), 0);
    const enRec       = enRecria.reduce((s, l) => s + (l.cantidad_actual || 0), 0);

    set('pk-total',     totalAves  || '—');
    set('pk-produccion', enProd     || '—');
    set('pk-recria',    enRec      || '—');
    set('pk-lotes',     activos.length || '—');
  }

  function verificarInconsistencias(lotes) {
    const zona = document.getElementById('plantel-alertas');
    if (!zona) return;
    const alertas = [];

    lotes.forEach(l => {
      if (l.cantidad_actual > l.cantidad_inicial) {
        alertas.push(`⚠️ Lote "${l.raza}" (${l.galpon?.nombre || 'sin galpón'}): cantidad actual (${l.cantidad_actual}) supera el inicial (${l.cantidad_inicial})`);
      }
      if (l.cantidad_actual <= 0 && l.estado === 'activo') {
        alertas.push(`🚨 Lote "${l.raza}": figura como activo pero tiene 0 aves — revisá el estado`);
      }
      const semanasEdad = calcularSemanas(l.fecha_ingreso);
      if (semanasEdad > 100 && l.estado === 'activo') {
        alertas.push(`⏰ Lote "${l.raza}": tiene ${semanasEdad} semanas — considerá planificar el descarte`);
      }
    });

    if (!alertas.length) { zona.innerHTML = ''; return; }
    zona.innerHTML = alertas.map(a => `
      <div class="alerta-item alerta-warning" style="margin-bottom:6px">
        <span>${a}</span>
      </div>`).join('');
  }

  function renderLista(lotes) {
    const lista = document.getElementById('plantel-lista');
    if (!lista) return;

    if (!lotes.length) {
      lista.innerHTML = `
        <div class="estado-vacio">
          <div class="estado-vacio-icono">🐣</div>
          <p class="estado-vacio-titulo">Todavía no hay lotes registrados</p>
          <p class="estado-vacio-sub">Agregá el primero con el botón "Nuevo lote"</p>
        </div>`;
      return;
    }

    lista.innerHTML = lotes.map(l => {
      const est     = ESTADOS.find(e => e.clave === l.estado) || ESTADOS[0];
      const semanas = calcularSemanas(l.fecha_ingreso);
      const mortalidad = l.cantidad_inicial > 0
        ? (((l.cantidad_inicial - l.cantidad_actual) / l.cantidad_inicial) * 100).toFixed(1)
        : 0;

      return `
      <div class="lote-card" onclick="ModuloPlantel.verDetalle('${l.id}')">
        <div class="lote-card-header">
          <div>
            <span class="lote-raza">${l.raza || 'Lote sin nombre'}</span>
            <span class="lote-galpon">${l.galpon?.nombre || l.galpon_id || ''}</span>
          </div>
          <span class="lote-estado-chip" style="background:${est.color}20;color:${est.color}">${est.label}</span>
        </div>
        <div class="lote-card-datos">
          <div class="lote-dato">
            <span class="lote-dato-val">${l.cantidad_actual}</span>
            <span class="lote-dato-label">Aves activas</span>
          </div>
          <div class="lote-dato">
            <span class="lote-dato-val">${semanas}</span>
            <span class="lote-dato-label">Semanas edad</span>
          </div>
          <div class="lote-dato">
            <span class="lote-dato-val ${parseFloat(mortalidad) > 5 ? 'kpi-rojo' : ''}">${mortalidad}%</span>
            <span class="lote-dato-label">Mortalidad</span>
          </div>
          <div class="lote-dato">
            <span class="lote-dato-val">${l.cantidad_inicial}</span>
            <span class="lote-dato-label">Inicial</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ── DETALLE ───────────────────────────────────────────────────
  function verDetalle(id) {
    loteSeleccionado = id;
    // Mostrar modal de edición directamente
    abrirFormulario(id);
  }

  // ── FORMULARIO ABM ────────────────────────────────────────────
  async function abrirFormulario(idONuevo) {
    let lote = null;
    if (idONuevo !== 'nuevo') {
      const todos = await DB.obtenerLotesTodos();
      lote = todos.find(l => l.id === idONuevo);
    }

    const galpones = await DB.obtenerGalpones();
    const esNuevo  = !lote;
    const hoy      = new Date().toISOString().split('T')[0];

    const html = `
    <div class="modal-overlay" id="modal-lote" onclick="ModuloPlantel.cerrarFormulario(event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">${esNuevo ? '🐣 Nuevo lote' : '✏️ Editar lote'}</p>

        <div class="campo-grupo">
          <label class="campo-label">Raza / Tipo</label>
          <select class="campo-input" id="lote-raza">
            ${RAZAS.map(r => `<option value="${r}" ${r===lote?.raza?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Galpón</label>
          <select class="campo-input" id="lote-galpon">
            ${galpones.map(g => `<option value="${g.id}" ${g.id===lote?.galpon_id?'selected':''}>${g.nombre}</option>`).join('')}
          </select>
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Fecha de ingreso</label>
          <input class="campo-input" id="lote-fecha" type="date"
            value="${lote?.fecha_ingreso || hoy}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Cantidad inicial de aves</label>
          <input class="campo-input" id="lote-inicial" type="number" min="1"
            placeholder="Ej: 500" value="${lote?.cantidad_inicial || ''}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Cantidad actual de aves</label>
          <input class="campo-input" id="lote-actual" type="number" min="0"
            placeholder="Ej: 487" value="${lote?.cantidad_actual || ''}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Estado del lote</label>
          <div class="rol-selector">
            ${ESTADOS.map(e => `
            <button class="rol-opcion ${e.clave===(lote?.estado||'activo')?'seleccionado':''}"
              onclick="ModuloPlantel.seleccionarEstado('${e.clave}',this)">${e.label}</button>
            `).join('')}
          </div>
          <input type="hidden" id="lote-estado" value="${lote?.estado || 'activo'}">
        </div>

        <button class="btn-primary" onclick="ModuloPlantel.guardarLote('${idONuevo}')">
          💾 Guardar lote
        </button>
        <button class="btn-secondary" onclick="document.getElementById('modal-lote').remove()">
          Cancelar
        </button>
      </div>
    </div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el.firstElementChild);
  }

  function seleccionarEstado(estado, el) {
    document.querySelectorAll('#modal-lote .rol-opcion').forEach(e => e.classList.remove('seleccionado'));
    el.classList.add('seleccionado');
    document.getElementById('lote-estado').value = estado;
  }

  function cerrarFormulario(event) {
    if (event.target.id === 'modal-lote') {
      document.getElementById('modal-lote')?.remove();
    }
  }

  async function guardarLote(idONuevo) {
    const raza    = document.getElementById('lote-raza')?.value;
    const galpon  = document.getElementById('lote-galpon')?.value;
    const fecha   = document.getElementById('lote-fecha')?.value;
    const inicial = parseInt(document.getElementById('lote-inicial')?.value);
    const actual  = parseInt(document.getElementById('lote-actual')?.value);
    const estado  = document.getElementById('lote-estado')?.value;

    if (!raza)           { UI.mostrarToast('Elegí una raza', 'error'); return; }
    if (!galpon)         { UI.mostrarToast('Elegí un galpón', 'error'); return; }
    if (!fecha)          { UI.mostrarToast('Ingresá la fecha de ingreso', 'error'); return; }
    if (!inicial || inicial < 1) { UI.mostrarToast('Ingresá la cantidad inicial', 'error'); return; }
    if (isNaN(actual) || actual < 0) { UI.mostrarToast('Ingresá la cantidad actual', 'error'); return; }
    if (actual > inicial) { UI.mostrarToast('La cantidad actual no puede superar la inicial', 'error'); return; }

    const datos = { raza, galpon_id: galpon, fecha_ingreso: fecha, cantidad_inicial: inicial, cantidad_actual: actual, estado };

    const res = idONuevo === 'nuevo'
      ? await DB.insertarLote(datos)
      : await DB.actualizarLote(idONuevo, datos);

    if (res.ok) {
      UI.mostrarToast(idONuevo === 'nuevo' ? '✅ Lote agregado' : '✅ Lote actualizado', 'success');
      document.getElementById('modal-lote')?.remove();
      cargarLotes();
    } else {
      UI.mostrarToast('Error al guardar. Verificá la conexión.', 'error');
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────
  function calcularSemanas(fechaIngreso) {
    if (!fechaIngreso) return '—';
    const diff = Date.now() - new Date(fechaIngreso).getTime();
    return Math.floor(diff / (7 * 24 * 3600 * 1000));
  }

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  }

  return {
    render, postRender,
    abrirFormulario, cerrarFormulario, guardarLote,
    seleccionarEstado, verDetalle
  };
})();
