// equipo.js — Módulo EQUIPO: gestión familiar con ABM completo
const ModuloEquipo = (() => {

  const AVATARES = ['🧑‍🌾','👩‍🌾','🧑‍💼','👩‍💼','📱','👦','👧','👶','👴','👵','🧑','👩'];
  const ROLES    = ['Producción','Administración','Ventas','Redes','Mantenimiento','Aprendiz'];

  let miembros    = [];
  let vistaMiembro = null;
  let modalAbierto = null; // 'nuevo' | id (editar)

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  function render() {
    if (vistaMiembro !== null) {
      const m = miembros.find(x => x.id === vistaMiembro);
      return m ? renderDetalle(m) : renderLista();
    }
    return renderLista();
  }

  function renderLista() {
    return `
    <div class="modulo-contenedor">
      <div class="modulo-encabezado">
        <h2 class="modulo-titulo">👨‍👩‍👧 Mi Equipo</h2>
        <button class="btn-agregar" onclick="ModuloEquipo.abrirModal('nuevo')">+ Agregar</button>
      </div>

      <div id="equipo-cuerpo">
        <div class="skeleton" style="height:72px;border-radius:16px"></div>
        <div class="skeleton" style="height:72px;border-radius:16px;margin-top:8px"></div>
      </div>
    </div>`;
  }

  function renderDetalle(m) {
    return `
    <div class="modulo-contenedor">
      <button class="btn-volver" onclick="ModuloEquipo.volverLista()">← Equipo</button>

      <div class="miembro-detalle-header">
        <div class="miembro-avatar-grande">${m.avatar || '🧑‍🌾'}</div>
        <div>
          <h2 class="miembro-nombre-grande">${m.nombre}</h2>
          <span class="miembro-rol-chip">${m.rol}</span>
        </div>
        <button class="btn-agregar-sm" onclick="ModuloEquipo.abrirModal('${m.id}')" style="margin-left:auto">
          ✏️ Editar
        </button>
      </div>

      <div class="miembro-stats">
        <div class="stat-box"><span class="stat-val">${m.telefono || '—'}</span><span class="stat-label">Teléfono</span></div>
        <div class="stat-box"><span class="stat-val">${m.activo ? '✅' : '❌'}</span><span class="stat-label">Activo</span></div>
      </div>

      <div class="seccion-bloque" id="tareas-miembro-${m.id}">
        <p class="sin-alertas">Cargando tareas...</p>
      </div>
    </div>`;
  }

  // ── POST RENDER ───────────────────────────────────────────────
  async function postRender() {
    await cargarMiembros();
    if (vistaMiembro) {
      await cargarTareasMiembro(vistaMiembro);
    }
    if (modalAbierto !== null) {
      mostrarModal(modalAbierto);
    }
  }

  async function cargarMiembros() {
    const cuerpo = document.getElementById('equipo-cuerpo');
    if (!cuerpo) return;
    try {
      miembros = await DB.obtenerEquipo();
      if (!miembros.length) {
        cuerpo.innerHTML = `
          <div class="estado-vacio">
            <div class="estado-vacio-icono">👨‍👩‍👧</div>
            <p class="estado-vacio-titulo">Todavía no hay miembros</p>
            <p class="estado-vacio-sub">Agregá a tu familia con el botón "+"</p>
          </div>`;
        return;
      }
      cuerpo.innerHTML = miembros.map(renderMiembro).join('');
    } catch (e) {
      cuerpo.innerHTML = '<p class="sin-alertas">Error cargando equipo</p>';
    }
  }

  function renderMiembro(m) {
    return `
    <div class="miembro-card" onclick="ModuloEquipo.verMiembro('${m.id}')">
      <div class="miembro-avatar">${m.avatar || '🧑‍🌾'}</div>
      <div class="miembro-info">
        <p class="miembro-nombre">${m.nombre}</p>
        <p class="miembro-rol">${m.rol}</p>
      </div>
      <span class="galpon-mini-arrow">›</span>
    </div>`;
  }

  async function cargarTareasMiembro(miembroId) {
    const zona = document.getElementById(`tareas-miembro-${miembroId}`);
    if (!zona) return;
    try {
      const tareas = await DB.obtenerTareasHoy();
      const misTareas = tareas.filter(t => t.asignado_a === miembroId);
      if (!misTareas.length) {
        zona.innerHTML = `<div class="seccion-header"><h3 class="seccion-titulo">📋 Tareas de hoy</h3></div>
          <p class="sin-alertas">Sin tareas asignadas hoy</p>`;
        return;
      }
      zona.innerHTML = `
        <div class="seccion-header">
          <h3 class="seccion-titulo">📋 Tareas de hoy</h3>
          <span class="tareas-pct">${misTareas.filter(t=>t.estado==='hecho').length}/${misTareas.length}</span>
        </div>
        <div class="tareas-lista">
          ${misTareas.map(t => `
          <div class="tarea-item ${t.estado==='hecho'?'completada':''}">
            <button class="tarea-check" onclick="ModuloEquipo.toggleTarea('${t.id}','${t.estado}')">
              ${t.estado==='hecho'?'✅':'⬜'}
            </button>
            <span class="tarea-texto">${t.titulo}</span>
          </div>`).join('')}
        </div>`;
    } catch (e) { /* silencioso */ }
  }

  // ── MODAL ABM ─────────────────────────────────────────────────
  function abrirModal(idONuevo) {
    modalAbierto = idONuevo;
    mostrarModal(idONuevo);
  }

  function mostrarModal(idONuevo) {
    const esNuevo  = idONuevo === 'nuevo';
    const miembro  = esNuevo ? null : miembros.find(m => m.id === idONuevo || m.id === String(idONuevo));
    const titulo   = esNuevo ? '➕ Nuevo integrante' : '✏️ Editar integrante';
    const avatarActual = miembro?.avatar || '🧑‍🌾';
    const rolActual    = miembro?.rol    || '';
    const nombreActual = miembro?.nombre || '';
    const telActual    = miembro?.telefono || '';

    const html = `
    <div class="modal-overlay" id="modal-overlay" onclick="ModuloEquipo.cerrarModalOverlay(event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">${titulo}</p>

        <!-- Avatar -->
        <div class="campo-grupo">
          <label class="campo-label">Avatar</label>
          <div class="avatar-selector">
            ${AVATARES.map(a => `
            <span class="avatar-opcion ${a===avatarActual?'seleccionado':''}"
              onclick="ModuloEquipo.seleccionarAvatar('${a}',this)">${a}</span>
            `).join('')}
          </div>
          <input type="hidden" id="modal-avatar" value="${avatarActual}">
        </div>

        <!-- Nombre -->
        <div class="campo-grupo">
          <label class="campo-label">Nombre</label>
          <input class="campo-input" id="modal-nombre" type="text"
            placeholder="Ej: Juan, María..." value="${nombreActual}">
        </div>

        <!-- Rol -->
        <div class="campo-grupo">
          <label class="campo-label">Rol en la granja</label>
          <div class="rol-selector" id="rol-selector">
            ${ROLES.map(r => `
            <button class="rol-opcion ${r===rolActual?'seleccionado':''}"
              onclick="ModuloEquipo.seleccionarRol('${r}',this)">${r}</button>
            `).join('')}
          </div>
          <input type="hidden" id="modal-rol" value="${rolActual}">
        </div>

        <!-- Teléfono -->
        <div class="campo-grupo">
          <label class="campo-label">Teléfono (opcional)</label>
          <input class="campo-input" id="modal-telefono" type="tel"
            placeholder="Ej: 261 4123456" value="${telActual}">
        </div>

        <!-- Botones -->
        <button class="btn-primary" onclick="ModuloEquipo.guardarMiembro('${idONuevo}')">
          💾 Guardar
        </button>
        <button class="btn-secondary" onclick="ModuloEquipo.cerrarModal()">Cancelar</button>
        ${!esNuevo ? `
        <button class="btn-danger" onclick="ModuloEquipo.confirmarDesactivar('${idONuevo}')">
          🚫 Desactivar integrante
        </button>` : ''}
      </div>
    </div>`;

    // Agregar overlay al body
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el.firstElementChild);
  }

  function seleccionarAvatar(avatar, el) {
    document.querySelectorAll('.avatar-opcion').forEach(e => e.classList.remove('seleccionado'));
    el.classList.add('seleccionado');
    document.getElementById('modal-avatar').value = avatar;
  }

  function seleccionarRol(rol, el) {
    document.querySelectorAll('.rol-opcion').forEach(e => e.classList.remove('seleccionado'));
    el.classList.add('seleccionado');
    document.getElementById('modal-rol').value = rol;
  }

  function cerrarModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
    modalAbierto = null;
  }

  function cerrarModalOverlay(event) {
    if (event.target.id === 'modal-overlay') cerrarModal();
  }

  async function guardarMiembro(idONuevo) {
    const nombre   = document.getElementById('modal-nombre')?.value?.trim();
    const avatar   = document.getElementById('modal-avatar')?.value;
    const rol      = document.getElementById('modal-rol')?.value;
    const telefono = document.getElementById('modal-telefono')?.value?.trim();

    if (!nombre) { UI.mostrarToast('El nombre es obligatorio', 'error'); return; }
    if (!rol)    { UI.mostrarToast('Elegí un rol para este integrante', 'error'); return; }

    const datos = { nombre, avatar, rol, telefono: telefono || null, activo: true };

    let res;
    if (idONuevo === 'nuevo') {
      res = await DB.insertarMiembro(datos);
    } else {
      res = await DB.actualizarMiembro(idONuevo, datos);
    }

    if (res.ok) {
      UI.mostrarToast(idONuevo === 'nuevo' ? '✅ Integrante agregado' : '✅ Datos actualizados', 'success');
      cerrarModal();
      volverLista();  // recargar lista
    } else {
      UI.mostrarToast('Error al guardar. Verificá la conexión.', 'error');
    }
  }

  async function confirmarDesactivar(id) {
    if (!confirm('¿Desactivar este integrante? Podrás reactivarlo desde la base de datos.')) return;
    const res = await DB.desactivarMiembro(id);
    if (res.ok) {
      UI.mostrarToast('Integrante desactivado', 'info');
      cerrarModal();
      volverLista();
    }
  }

  // ── NAVEGACIÓN ────────────────────────────────────────────────
  function verMiembro(id) {
    vistaMiembro = id;
    document.getElementById('contenido-principal').innerHTML = renderDetalle(
      miembros.find(m => m.id === id || m.id === String(id)) || { id, nombre: '—', avatar: '🧑‍🌾', rol: '—' }
    );
    cargarTareasMiembro(id);
  }

  function volverLista() {
    vistaMiembro = null;
    modalAbierto = null;
    document.getElementById('contenido-principal').innerHTML = renderLista();
    cargarMiembros();
  }

  async function toggleTarea(id, estadoActual) {
    const res = await DB.toggleTareaDB(id, estadoActual);
    if (res.ok) {
      UI.mostrarToast(estadoActual === 'hecho' ? 'Tarea reabierta' : '✅ Tarea completada', 'success');
      if (vistaMiembro) cargarTareasMiembro(vistaMiembro);
    }
  }

  return {
    render, postRender,
    verMiembro, volverLista, toggleTarea,
    abrirModal, cerrarModal, cerrarModalOverlay,
    seleccionarAvatar, seleccionarRol,
    guardarMiembro, confirmarDesactivar
  };
})();
