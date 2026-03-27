// granja.js — Módulo GRANJA: vista de galpones con semáforo + ABM completo
const ModuloGranja = (() => {

  // ── DATOS DEMO ───────────────────────────────────────────────
  const DEMO_GALPONES = [
    {
      id: 1, nombre: 'Galpón 1', emoji: '🏠',
      capacidad_aves: 500, terminologia: 'galpón',
      descripcion: 'Sector norte, techo alto',
      gallinas_produccion: 480, gallinas_recria: 20,
      huevos_hoy: 178, huevos_ayer: 165,
      mortandad_semana: 2,
      agua: 'normal', alimento: 'normal',
      estado: 'verde',
      lote: 'Lote A · 18 meses',
      tipo: 'Piso',
      historial: [
        { fecha: 'Hoy',  huevos: 178 },
        { fecha: 'Ayer', huevos: 165 },
        { fecha: 'Lun',  huevos: 171 },
        { fecha: 'Dom',  huevos: 158 },
        { fecha: 'Sáb',  huevos: 162 },
      ]
    },
    {
      id: 2, nombre: 'Galpón 2', emoji: '🏠',
      capacidad_aves: 320, terminologia: 'galpón',
      descripcion: '',
      gallinas_produccion: 300, gallinas_recria: 20,
      huevos_hoy: 134, huevos_ayer: 133,
      mortandad_semana: 0,
      agua: 'baja', alimento: 'normal',
      estado: 'amarillo',
      lote: 'Lote B · 12 meses',
      tipo: 'Campero',
      historial: [
        { fecha: 'Hoy',  huevos: 134 },
        { fecha: 'Ayer', huevos: 133 },
        { fecha: 'Lun',  huevos: 139 },
        { fecha: 'Dom',  huevos: 128 },
        { fecha: 'Sáb',  huevos: 131 },
      ]
    }
  ];

  let galponSeleccionado = null;
  let listaGalpones      = []; // caché de la lista actual
  let modoFormulario     = null; // 'nuevo' | 'editar'
  let idEditando         = null;

  // ── HELPERS ───────────────────────────────────────────────────
  function colorEstado(e) {
    return e === 'verde' ? '#4caf50' : e === 'amarillo' ? '#ff9800' : '#f44336';
  }

  function iconoAgua(e) {
    return e === 'normal' ? '💧 Normal' : e === 'baja' ? '⚠️ Baja' : '🚫 Sin servicio';
  }

  function calcularPostura(gallinas_p, huevos) {
    if (!gallinas_p) return 0;
    return Math.round((huevos / gallinas_p) * 100);
  }

  // ── RENDER CARD ──────────────────────────────────────────────
  function renderCard(g) {
    const postura = calcularPostura(g.gallinas_produccion || g.capacidad_aves, g.huevos_hoy || 0);
    const estado  = g.estado || 'verde';
    return `
    <div class="galpon-card" onclick="ModuloGranja.verDetalle(${g.id})">
      <div class="galpon-card-header">
        <div class="galpon-semaforo-grande" style="background:${colorEstado(estado)}">
          <span>${g.emoji || '🏠'}</span>
        </div>
        <div class="galpon-card-info">
          <h3 class="galpon-nombre">${g.nombre}</h3>
          <p class="galpon-lote">${g.lote || (g.terminologia || 'galpón')} · ${g.tipo || g.terminologia || 'galpón'}</p>
        </div>
        <div class="galpon-estado-chip ${estado}">
          ${estado === 'verde' ? '🟢 Bien' : estado === 'amarillo' ? '🟡 Atención' : '🔴 Revisar'}
        </div>
      </div>

      <div class="galpon-kpis">
        <div class="galpon-kpi">
          <span class="galpon-kpi-valor">${g.huevos_hoy ?? '—'}</span>
          <span class="galpon-kpi-label">🥚 Hoy</span>
        </div>
        <div class="galpon-kpi">
          <span class="galpon-kpi-valor">${g.huevos_hoy ? postura + '%' : '—'}</span>
          <span class="galpon-kpi-label">📊 Postura</span>
        </div>
        <div class="galpon-kpi">
          <span class="galpon-kpi-valor">${g.gallinas_produccion ?? (g.capacidad_aves ?? '—')}</span>
          <span class="galpon-kpi-label">🐔 Prod.</span>
        </div>
        <div class="galpon-kpi">
          <span class="galpon-kpi-valor ${(g.mortandad_semana || 0) > 3 ? 'kpi-rojo' : ''}">${g.mortandad_semana ?? '0'}</span>
          <span class="galpon-kpi-label">💀 Muertes</span>
        </div>
      </div>

      <div class="galpon-agua-row">
        <span>${iconoAgua(g.agua || 'normal')}</span>
        <span class="galpon-flecha">Ver historial ›</span>
      </div>
    </div>`;
  }

  // ── RENDER DETALLE ────────────────────────────────────────────
  function renderDetalle(g) {
    const postura = calcularPostura(g.gallinas_produccion || g.capacidad_aves, g.huevos_hoy || 0);
    const estado  = g.estado || 'verde';
    const barras  = (g.historial || []).map(h => {
      const pct = Math.round((h.huevos / 200) * 100);
      return `
      <div class="hist-bar-col">
        <div class="hist-bar-fill" style="height:${pct}%"></div>
        <span class="hist-bar-label">${h.huevos}</span>
        <span class="hist-bar-fecha">${h.fecha}</span>
      </div>`;
    }).join('');

    return `
    <div class="detalle-contenedor">
      <div class="detalle-header">
        <button class="btn-volver" onclick="ModuloGranja.volverLista()">← Volver</button>
        <h2 class="detalle-titulo">${g.nombre}</h2>
      </div>

      <div class="detalle-semaforo semaforo-${estado}">
        <span class="semaforo-dot" style="background:${colorEstado(estado)}"></span>
        <span>${estado === 'verde' ? '✅ Todo bien' : estado === 'amarillo' ? '⚠️ Requiere atención' : '🔴 Problema detectado'}</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-valor kpi-verde">${g.huevos_hoy ?? '—'}</div>
          <div class="kpi-label">🥚 Huevos hoy</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-valor">${g.huevos_hoy ? postura + '%' : '—'}</div>
          <div class="kpi-label">📊 % Postura</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-valor">${g.capacidad_aves ?? g.gallinas_total ?? '—'}</div>
          <div class="kpi-label">🐔 Capacidad</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-valor kpi-${(g.mortandad_semana || 0) > 3 ? 'rojo' : 'verde'}">${g.mortandad_semana ?? '0'}</div>
          <div class="kpi-label">💀 Semana</div>
        </div>
      </div>

      ${barras ? `
      <div class="seccion-bloque">
        <h4 class="seccion-titulo">📈 Últimos 5 días</h4>
        <div class="hist-bar-chart">${barras}</div>
      </div>` : ''}

      <div class="seccion-bloque">
        <h4 class="seccion-titulo">🔍 Estado de recursos</h4>
        <div class="recurso-row">
          <span>💧 Agua</span>
          <span class="chip-recurso chip-${g.agua || 'normal'}">${iconoAgua(g.agua || 'normal')}</span>
        </div>
        <div class="recurso-row">
          <span>🌾 Alimento</span>
          <span class="chip-recurso chip-normal">✅ Normal</span>
        </div>
        ${g.descripcion ? `<div class="recurso-row"><span>📝 Descripción</span><span>${g.descripcion}</span></div>` : ''}
      </div>

      <div class="acciones-detalle">
        <button class="btn-accion" onclick="App.navegar('produccion')">✏️ Registrar hoy</button>
        <button class="btn-accion btn-accion-sec" onclick="App.navegar('inspeccion')">📸 Inspeccionar</button>
      </div>

      <!-- Acciones ABM -->
      <div class="galpon-abm-detalle">
        <button class="btn-editar-galpon" onclick="ModuloGranja.abrirFormulario('editar', '${g.id}')">✏️ Editar galpón</button>
        <button class="btn-eliminar-galpon" onclick="ModuloGranja.confirmarEliminar('${g.id}', '${g.nombre.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>
      </div>
    </div>`;
  }

  // ── RENDER LISTA PRINCIPAL ────────────────────────────────────
  function render() {
    if (galponSeleccionado !== null) {
      const g = listaGalpones.length
        ? listaGalpones.find(x => String(x.id) === String(galponSeleccionado))
        : DEMO_GALPONES.find(x => x.id === galponSeleccionado);
      if (g) return renderDetalle(g);
    }

    return `
    <div class="modulo-contenedor">
      <div class="modulo-encabezado">
        <h2 class="modulo-titulo">🐔 Mis Galpones</h2>
        <button class="btn-agregar" id="btn-nuevo-galpon" onclick="ModuloGranja.abrirFormulario('nuevo')">+ Agregar</button>
      </div>

      <!-- FORMULARIO ABM (oculto por defecto) -->
      <div class="galpon-form-panel" id="galpon-form-panel" style="display:none">
        <div class="galpon-form-header">
          <h3 class="galpon-form-titulo" id="galpon-form-titulo">➕ Nuevo galpón</h3>
          <button class="galpon-form-cerrar" onclick="ModuloGranja.cerrarFormulario()">✕</button>
        </div>
        <input type="hidden" id="galpon-id-editando">

        <div class="campo-grupo">
          <label class="campo-label">Nombre del galpón *</label>
          <input class="campo-input" id="galpon-nombre" type="text"
            placeholder="Ej: Galpón Norte, Nave 1, El Fondo…">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Capacidad de aves</label>
          <input class="campo-input" id="galpon-capacidad" type="number" min="0"
            placeholder="Ej: 500">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Tipo / Terminología</label>
          <select class="campo-input" id="galpon-terminologia">
            <option value="galpón">Galpón</option>
            <option value="gallinero">Gallinero</option>
            <option value="nave">Nave</option>
            <option value="módulo">Módulo</option>
            <option value="corral">Corral</option>
          </select>
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Descripción (opcional)</label>
          <input class="campo-input" id="galpon-descripcion" type="text"
            placeholder="Ej: Sector norte, techo bajo">
        </div>

        <div class="galpon-form-acciones">
          <button class="btn-primary" id="btn-guardar-galpon" onclick="ModuloGranja.guardarGalpon()">
            💾 Guardar
          </button>
          <button class="btn-secondary" onclick="ModuloGranja.cerrarFormulario()">
            Cancelar
          </button>
        </div>
      </div>

      <!-- LISTA DE GALPONES -->
      <div class="galpon-cards-lista" id="galpon-cards-lista">
        <div class="skeleton" style="height:140px;border-radius:16px"></div>
        <div class="skeleton" style="height:140px;border-radius:16px;margin-top:12px"></div>
      </div>
    </div>`;
  }

  // ── POST RENDER ───────────────────────────────────────────────
  async function postRender() {
    await cargarGalpones();
  }

  async function cargarGalpones() {
    const lista = document.getElementById('galpon-cards-lista');
    if (!lista) return;
    try {
      const datos = await DB.obtenerGalpones();
      // Enriquecer con datos demo de producción si coincide ID
      listaGalpones = datos.map(g => {
        const demo = DEMO_GALPONES.find(d => String(d.id) === String(g.id));
        return demo ? { ...g, ...demo, ...g } : g;
      });
      if (!listaGalpones.length) {
        lista.innerHTML = '<p class="sin-alertas">Aún no hay galpones. ¡Agregá el primero!</p>';
        return;
      }
      lista.innerHTML = listaGalpones.map(renderCard).join('');
    } catch (e) {
      // Si falla la carga, mostrar datos demo
      listaGalpones = DEMO_GALPONES;
      lista.innerHTML = DEMO_GALPONES.map(renderCard).join('');
    }
  }

  // ── ABM: ABRIR FORMULARIO ─────────────────────────────────────
  function abrirFormulario(modo, id) {
    modoFormulario = modo;
    idEditando     = id || null;

    const panel  = document.getElementById('galpon-form-panel');
    const titulo = document.getElementById('galpon-form-titulo');
    if (!panel) return;

    // Limpiar campos
    const limpiar = ['galpon-id-editando','galpon-nombre','galpon-capacidad','galpon-descripcion'];
    limpiar.forEach(fid => { const el = document.getElementById(fid); if (el) el.value = ''; });
    const sel = document.getElementById('galpon-terminologia');
    if (sel) sel.value = 'galpón';

    if (modo === 'editar' && id) {
      const g = listaGalpones.find(x => String(x.id) === String(id)) ||
                DEMO_GALPONES.find(x => String(x.id) === String(id));
      if (g) {
        document.getElementById('galpon-id-editando').value  = g.id;
        document.getElementById('galpon-nombre').value       = g.nombre;
        document.getElementById('galpon-capacidad').value    = g.capacidad_aves || g.capacidad || '';
        document.getElementById('galpon-descripcion').value  = g.descripcion || '';
        if (sel) sel.value = g.terminologia || 'galpón';
        if (titulo) titulo.textContent = `✏️ Editar: ${g.nombre}`;
      }
    } else {
      if (titulo) titulo.textContent = '➕ Nuevo galpón';
    }

    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cerrarFormulario() {
    const panel = document.getElementById('galpon-form-panel');
    if (panel) panel.style.display = 'none';
    modoFormulario = null;
    idEditando     = null;
  }

  // ── ABM: GUARDAR (alta o modificación) ───────────────────────
  async function guardarGalpon() {
    const id          = document.getElementById('galpon-id-editando')?.value?.trim() || null;
    const nombre      = document.getElementById('galpon-nombre')?.value?.trim();
    const capacidad   = parseInt(document.getElementById('galpon-capacidad')?.value) || null;
    const terminologia= document.getElementById('galpon-terminologia')?.value || 'galpón';
    const descripcion = document.getElementById('galpon-descripcion')?.value?.trim() || null;

    if (!nombre) {
      UI.mostrarToast('⚠️ Ingresá un nombre para el galpón', 'warning');
      return;
    }

    const btnGuardar = document.getElementById('btn-guardar-galpon');
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando…'; }

    const datos = { nombre, capacidad_aves: capacidad, terminologia, descripcion };

    let res;
    if (id) {
      res = await DB.actualizarGalpon(id, datos);
    } else {
      res = await DB.insertarGalpon({ ...datos, activo: true });
    }

    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar'; }

    if (res.ok) {
      UI.mostrarToast(id ? '✅ Galpón actualizado' : '✅ Galpón creado', 'success');
      cerrarFormulario();
      await cargarGalpones();
    } else {
      UI.mostrarToast('❌ Error al guardar. Revisá la conexión.', 'error');
    }
  }

  // ── ABM: ELIMINAR (desactivar) ────────────────────────────────
  async function confirmarEliminar(id, nombre) {
    // Usamos el modal genérico de la app si existe, o confirm nativo
    const modalContenido = document.getElementById('modal-contenido');
    const modalOverlay   = document.getElementById('modal-overlay');
    const modalCerrar    = document.getElementById('modal-cerrar');

    if (modalContenido && modalOverlay) {
      modalContenido.innerHTML = `
        <div style="text-align:center;padding:8px 0">
          <div style="font-size:48px;margin-bottom:12px">🗑️</div>
          <h3 style="font-family:var(--fuente-display);font-size:1.2rem;margin-bottom:8px;color:var(--texto-primario)">
            ¿Eliminar galpón?
          </h3>
          <p style="color:var(--texto-secundario);font-size:0.9rem;margin-bottom:20px">
            "<strong>${nombre}</strong>" ya no aparecerá en los registros.<br>
            Esta acción no se puede deshacer.
          </p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn-danger"
              onclick="ModuloGranja.ejecutarEliminar('${id}','${nombre.replace(/'/g,"\\'")}')">
              🗑️ Sí, eliminar
            </button>
            <button class="btn-secondary" onclick="UI.cerrarModal()">
              Cancelar
            </button>
          </div>
        </div>`;
      modalOverlay.classList.remove('hidden');
      if (modalCerrar) modalCerrar.onclick = () => UI.cerrarModal();
    } else {
      // Fallback: confirm nativo
      if (confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
        await ejecutarEliminar(id, nombre);
      }
    }
  }

  async function ejecutarEliminar(id, nombre) {
    UI.cerrarModal && UI.cerrarModal();
    const res = await DB.desactivarGalpon(id);
    if (res.ok) {
      UI.mostrarToast(`🗑️ "${nombre}" eliminado`, 'info');
      volverLista();
      await cargarGalpones();
    } else {
      UI.mostrarToast('❌ Error al eliminar. Revisá la conexión.', 'error');
    }
  }

  // ── NAVEGACIÓN ────────────────────────────────────────────────
  function verDetalle(id) {
    galponSeleccionado = id;
    document.getElementById('contenido-principal').innerHTML = render();
  }

  function volverLista() {
    galponSeleccionado = null;
    document.getElementById('contenido-principal').innerHTML = render();
    postRender();
  }

  // Compatibilidad con llamada antigua del botón "+ Agregar"
  function agregarGalpon() {
    abrirFormulario('nuevo');
  }

  return {
    render, postRender,
    verDetalle, volverLista, agregarGalpon,
    abrirFormulario, cerrarFormulario,
    guardarGalpon, confirmarEliminar, ejecutarEliminar,
  };
})();
