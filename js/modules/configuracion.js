// configuracion.js — Módulo CONFIGURACIÓN: onboarding y ajustes de la granja
const ModuloConfiguracion = (() => {

  const TIPOS_PRODUCCION = ['Jaula', 'Piso', 'Campero', 'Granja', 'Orgánico', 'Mixto'];
  const ZONAS = ['Rivadavia', 'Junín', 'San Martín', 'Mendoza Capital', 'San Rafael', 'Otro'];

  // ── RENDER ────────────────────────────────────────────────────
  function render() {
    const granja = cargarConfigLocal();

    return `
    <div class="modulo-contenedor">
      <div class="modulo-encabezado">
        <h2 class="modulo-titulo">⚙️ Configuración</h2>
      </div>

      <!-- Tarjeta de la granja -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">🏡 Tu granja</h3>

        <div class="campo-grupo">
          <label class="campo-label">Nombre de la granja</label>
          <input class="campo-input" id="cfg-nombre" type="text"
            placeholder="Ej: La Esperanza" value="${granja.nombre || ''}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Tipo de producción</label>
          <div class="rol-selector" id="cfg-tipo-selector">
            ${TIPOS_PRODUCCION.map(t => `
            <button class="rol-opcion ${(granja.tipo_produccion||'Piso')===t?'seleccionado':''}"
              onclick="ModuloConfiguracion.seleccionarTipo('${t}',this)">${t}</button>
            `).join('')}
          </div>
          <input type="hidden" id="cfg-tipo" value="${granja.tipo_produccion || 'Piso'}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Zona / Localidad</label>
          <select class="campo-input" id="cfg-zona">
            ${ZONAS.map(z => `<option value="${z}" ${z===granja.zona?'selected':''}>${z}</option>`).join('')}
          </select>
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Dirección (opcional)</label>
          <input class="campo-input" id="cfg-direccion" type="text"
            placeholder="Ej: Ruta 40 km 12, Rivadavia" value="${granja.direccion || ''}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Teléfono de contacto (WhatsApp)</label>
          <input class="campo-input" id="cfg-telefono" type="tel"
            placeholder="Ej: +54 261 4123456" value="${granja.telefono || ''}">
        </div>

        <button class="btn-primary" onclick="ModuloConfiguracion.guardarGranja()">
          💾 Guardar datos de la granja
        </button>
      </div>

      <!-- Precios de referencia -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">💰 Precios de referencia</h3>
        <p class="config-desc">Usados en ventas y sugerencias de precio.</p>

        <div class="config-precios-grid">
          ${renderPrecioInput('Maple Mediano',     'cfg-precio-mediano',   granja.precio_mediano   || '')}
          ${renderPrecioInput('Maple Grande',      'cfg-precio-grande',    granja.precio_grande     || '')}
          ${renderPrecioInput('Maple Extra Grande','cfg-precio-extra',     granja.precio_extra      || '')}
          ${renderPrecioInput('Kg Alimento',       'cfg-precio-alimento',  granja.precio_alimento   || '')}
        </div>

        <button class="btn-primary" onclick="ModuloConfiguracion.guardarPrecios()">
          💾 Guardar precios
        </button>
      </div>


      <!-- Acceso rápido a Lotes -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">📦 Lotes de aves</h3>
        <p class="config-desc">Gestioná los ingresos, bajas y estados de tus lotes de gallinas.</p>
        <button class="btn-primary" style="margin-top:4px" onclick="App.navegar('plantel')">
          🐣 Ir al Plantel de Lotes
        </button>
      </div>


      <!-- Textos de venta automáticos -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">📣 Textos de venta</h3>
        <p class="config-desc">Generados según tu tipo de producción para usar en redes y WhatsApp.</p>
        <div id="cfg-textos-venta">
          ${renderTextosVenta(granja)}
        </div>
        <button class="btn-secondary" onclick="ModuloConfiguracion.copiarTexto('cfg-texto-1')">
          📋 Copiar texto 1
        </button>
        <button class="btn-secondary" onclick="ModuloConfiguracion.copiarTexto('cfg-texto-2')" style="margin-top:8px">
          📋 Copiar texto 2
        </button>
      </div>

      <!-- Datos de cuenta -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">👤 Mi cuenta</h3>
        <div class="config-cuenta-info" id="cfg-cuenta-info">
          Cargando...
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn-secondary" style="border-color:#f44336;color:#f44336;" onclick="ModuloConfiguracion.cerrarSesion()">
            🚪 Cerrar sesión
          </button>
          <button class="btn-danger" onclick="ModuloConfiguracion.limpiarBD()">
            🗑 Limpiar App (Borrar datos)
          </button>
        </div>
      </div>

      <!-- Panel admin (visible solo si es_admin = true) -->
      <div class="config-seccion" id="cfg-admin-panel" style="display:none">
        <h3 class="config-titulo-sec">🔐 Gestión de accesos</h3>
        <p class="config-desc">Usuarios que solicitaron acceso. Aprobá o configurá su plan.</p>
        <div id="cfg-usuarios-pendientes">
          <div class="skeleton" style="height:60px;border-radius:12px"></div>
        </div>
        <div class="config-titulo-sec" style="margin-top:16px;font-size:0.85rem">Todos los usuarios</div>
        <div id="cfg-todos-usuarios">
          <div class="skeleton" style="height:60px;border-radius:12px;margin-top:8px"></div>
        </div>

        <div class="config-titulo-sec" style="margin-top:24px;">🌐 SaaS Multi-tenant (Modo Super Admin)</div>
        <p class="config-desc">Ingresá a la granja de un cliente para ver sus datos.</p>
        <div id="cfg-granjas-saas-lista">
          <div class="skeleton" style="height:60px;border-radius:12px;margin-top:8px"></div>
        </div>
      </div>

      <!-- ABM de Gallineros -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">🏠 Mis gallineros</h3>
        <p class="config-desc">Gestioná los espacios de tu granja. El nombre puede ser libre: "Gallinero 1", "Nave Sur", etc.</p>

        <!-- Lista de gallineros -->
        <div id="cfg-gallineros-lista">
          <div class="skeleton" style="height:54px;border-radius:12px"></div>
          <div class="skeleton" style="height:54px;border-radius:12px;margin-top:8px"></div>
        </div>

        <!-- Formulario nuevo gallinero -->
        <div class="cfg-nuevo-gallinero" id="cfg-form-gallinero" style="display:none">
          <h4 class="cfg-form-titulo" id="cfg-gallinero-titulo">➕ Nuevo gallinero</h4>
          <input type="hidden" id="cfg-gallinero-id">
          <div class="campo-grupo">
            <label class="campo-label">Nombre</label>
            <input class="campo-input" id="cfg-gallinero-nombre" type="text"
              placeholder="Ej: Gallinero Norte, Nave 1, El Fondo…">
          </div>
          <div class="campo-grupo">
            <label class="campo-label">Capacidad de aves</label>
            <input class="campo-input" id="cfg-gallinero-capacidad" type="number" min="0"
              placeholder="Ej: 200">
          </div>
          <div class="campo-grupo">
            <label class="campo-label">¿Cómo llamás a tus espacios?</label>
            <select class="campo-input" id="cfg-gallinero-terminologia">
              <option value="gallinero">Gallinero</option>
              <option value="galpón">Galpón</option>
              <option value="nave">Nave</option>
              <option value="módulo">Módulo</option>
              <option value="corral">Corral</option>
            </select>
          </div>
          <div class="campo-grupo">
            <label class="campo-label">Descripción (opcional)</label>
            <input class="campo-input" id="cfg-gallinero-desc" type="text"
              placeholder="Ej: Sector norte, techo bajo">
          </div>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button class="btn-primary" onclick="ModuloConfiguracion.guardarGallinero()">
              💾 Guardar
            </button>
            <button class="btn-secondary" onclick="ModuloConfiguracion.cancelarFormGallinero()">
              Cancelar
            </button>
          </div>
        </div>

        <button class="btn-secondary" style="margin-top:12px" onclick="ModuloConfiguracion.mostrarFormGallinero()">
          ➕ Agregar gallinero
        </button>
      </div>

      <!-- Preferencias de interfaz -->
      <div class="config-seccion">
        <h3 class="config-titulo-sec">🎛️ Preferencias de interfaz</h3>
        <p class="config-desc">Personalizá cómo se comporta la aplicación.</p>

        <div class="config-toggle-row">
          <div class="config-toggle-label">
            <strong>🧭 Guía visual de pasos</strong>
            <span>Resalta el próximo paso en los flujos. Ideal para usuarios nuevos.</span>
          </div>
          <label class="switch-toggle">
            <input type="checkbox" id="cfg-modo-asistido"
              ${_leerModoAsistido() ? 'checked' : ''}
              onchange="ModuloConfiguracion.toggleModoAsistido(this.checked)">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>

    </div>`;
  }

  function renderPrecioInput(label, id, valor) {
    return `
    <div class="campo-grupo">
      <label class="campo-label">${label}</label>
      <div class="campo-precio-wrap">
        <span class="campo-precio-prefix">$</span>
        <input class="campo-input campo-precio" id="${id}" type="number" min="0"
          placeholder="0" value="${valor}">
      </div>
    </div>`;
  }

  function renderTextosVenta(granja) {
    const nombre = granja.nombre || 'nuestra granja';
    const tipo   = (granja.tipo_produccion || 'Piso').toLowerCase();
    const tipoLabel = { jaula: 'criadas en jaula', piso: 'criadas en piso', campero: 'de campo libre', granja: 'de granja', orgánico: 'orgánicas', mixto: 'de granja familiar' };
    const desc = tipoLabel[tipo] || 'de granja familiar';

    return `
    <textarea class="config-textarea" id="cfg-texto-1">🥚 Huevos frescos ${desc}, directo del productor.
Recolectados hoy en ${nombre}.
Pedidos por WhatsApp 📲
Precios por mayor disponibles.</textarea>

    <textarea class="config-textarea" id="cfg-texto-2">¡Huevos de ${nombre}! 🐔
Producción ${desc.split(' ').slice(-2).join(' ')}, sin intermediarios.
Siempre frescos, siempre naturales.
Consultanos por cantidad y precio 👇</textarea>`;
  }

  // ── POST RENDER ───────────────────────────────────────────────
  async function postRender() {
    cargarListaGallineros();   // ABM de gallineros

    const usuario = Auth.obtenerUsuario();
    const el = document.getElementById('cfg-cuenta-info');
    if (el && usuario) {
      el.innerHTML = `
        <div class="config-cuenta-row"><span>Email:</span><strong>${usuario.email || '—'}</strong></div>
        <div class="config-cuenta-row"><span>Plan:</span><strong>${planLabel(usuario.plan || 'demo')}</strong></div>
      `;
    }

    // Panel admin: solo visible si es admin
    if (usuario?.es_admin || usuario?.id === 'demo-001') {
      const panel = document.getElementById('cfg-admin-panel');
      if (panel) panel.style.display = 'block';
      await Promise.allSettled([
        cargarUsuariosPendientes(),
        cargarTodosUsuarios(),
        cargarGranjasSaaS()
      ]);
    }
  }

  // ── ABM GALLINEROS ────────────────────────────────────────────

  async function cargarListaGallineros() {
    const zona = document.getElementById('cfg-gallineros-lista');
    if (!zona) return;
    try {
      const lista = await DB.obtenerGalpones();
      if (!lista.length) {
        zona.innerHTML = '<p class="sin-alertas">Aún no hay gallineros. ¡Agregá el primero!</p>';
        return;
      }
      zona.innerHTML = lista.map(g => `
        <div class="config-galpon-row">
          <div>
            <span class="cfg-galpon-nombre">🏠 ${g.nombre}</span>
            <span class="cfg-galpon-cap">${g.capacidad_aves ? `${g.capacidad_aves} aves` : 'Sin capacidad'} · ${g.terminologia || 'gallinero'}</span>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn-icon-sm" onclick="ModuloConfiguracion.editarGallinero('${g.id}','${g.nombre}',${g.capacidad_aves||0},'${g.terminologia||'gallinero'}','${g.descripcion||''}')">✏️</button>
            <button class="btn-icon-sm btn-danger-sm" onclick="ModuloConfiguracion.archivarGallinero('${g.id}','${g.nombre}')">🗑</button>
          </div>
        </div>`).join('');
    } catch (e) {
      zona.innerHTML = '<p class="sin-alertas">Error cargando gallineros</p>';
    }
  }

  function mostrarFormGallinero() {
    const form = document.getElementById('cfg-form-gallinero');
    const titulo = document.getElementById('cfg-gallinero-titulo');
    if (!form) return;
    // Limpiar campos
    ['cfg-gallinero-id','cfg-gallinero-nombre','cfg-gallinero-capacidad','cfg-gallinero-desc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const sel = document.getElementById('cfg-gallinero-terminologia');
    if (sel) sel.value = 'gallinero';
    if (titulo) titulo.textContent = '➕ Nuevo gallinero';
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function editarGallinero(id, nombre, capacidad, terminologia, descripcion) {
    mostrarFormGallinero();
    document.getElementById('cfg-gallinero-id').value          = id;
    document.getElementById('cfg-gallinero-nombre').value      = nombre;
    document.getElementById('cfg-gallinero-capacidad').value   = capacidad;
    document.getElementById('cfg-gallinero-desc').value        = descripcion;
    const sel = document.getElementById('cfg-gallinero-terminologia');
    if (sel) sel.value = terminologia || 'gallinero';
    const titulo = document.getElementById('cfg-gallinero-titulo');
    if (titulo) titulo.textContent = `✏️ Editar: ${nombre}`;
  }

  async function guardarGallinero() {
    const id          = document.getElementById('cfg-gallinero-id')?.value?.trim();
    const nombre      = document.getElementById('cfg-gallinero-nombre')?.value?.trim();
    const capacidad   = parseInt(document.getElementById('cfg-gallinero-capacidad')?.value) || 0;
    const terminologia= document.getElementById('cfg-gallinero-terminologia')?.value || 'gallinero';
    const descripcion = document.getElementById('cfg-gallinero-desc')?.value?.trim() || null;

    if (!nombre) { UI.mostrarToast('⚠️ Ingresá un nombre para el gallinero', 'warning'); return; }

    const datos = { nombre, capacidad_aves: capacidad, terminologia, descripcion };

    let res;
    if (id) {
      res = await DB.actualizarGalpon(id, datos);
    } else {
      res = await DB.insertarGalpon({ ...datos, activo: true });
    }

    if (res.ok) {
      UI.mostrarToast(id ? '✅ Gallinero actualizado' : '✅ Gallinero creado', 'success');
      cancelarFormGallinero();
      cargarListaGallineros();
    } else {
      UI.mostrarToast('❌ Error al guardar. Revisá la conexión.', 'error');
    }
  }

  async function archivarGallinero(id, nombre) {
    if (!confirm(`¿Archivar "${nombre}"? Ya no aparecerá en el formulario de carga.`)) return;
    const res = await DB.desactivarGalpon(id);
    if (res.ok) {
      UI.mostrarToast(`🗑 "${nombre}" archivado`, 'info');
      cargarListaGallineros();
    } else {
      UI.mostrarToast('❌ Error al archivar', 'error');
    }
  }

  function cancelarFormGallinero() {
    const form = document.getElementById('cfg-form-gallinero');
    if (form) form.style.display = 'none';
  }


  async function cargarUsuariosPendientes() {
    const zona = document.getElementById('cfg-usuarios-pendientes');
    if (!zona) return;
    try {
      const pendientes = await DB.obtenerUsuariosPendientes();
      if (!pendientes.length) {
        zona.innerHTML = '<p class="sin-alertas">✅ No hay solicitudes pendientes</p>';
        return;
      }
      zona.innerHTML = pendientes.map(u => `
        <div class="usuario-admin-row">
          <div class="usuario-admin-info">
            <strong>${u.nombre || u.email}</strong>
            <span class="usuario-admin-email">${u.email} · ${new Date(u.creado_en).toLocaleDateString('es-AR')}</span>
          </div>
          <div class="usuario-admin-acciones">
            <select class="campo-input campo-plan-sel" id="plan-${u.id}" style="padding:6px;font-size:0.75rem;width:auto">
              <option value="tester">Tester (gratis)</option>
              <option value="trial" selected>Trial (7 días)</option>
              <option value="socio">Socio</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
            <button class="btn-aprobar" onclick="ModuloConfiguracion.aprobar('${u.id}')">✅</button>
            <button class="btn-rechazar" onclick="ModuloConfiguracion.rechazar('${u.id}')">❌</button>
          </div>
        </div>`).join('');
    } catch (e) {
      zona.innerHTML = '<p class="sin-alertas">Error cargando solicitudes</p>';
    }
  }

  async function cargarTodosUsuarios() {
    const zona = document.getElementById('cfg-todos-usuarios');
    if (!zona) return;
    try {
      const db = obtenerSupabase();
      if (!db) { zona.innerHTML = '<p class="sin-alertas">Conectá Supabase para ver usuarios</p>'; return; }
      const { data } = await db.from('perfiles').select('*, u:auth.users(email)').order('creado_en', { ascending: false }).limit(20);
      if (!data?.length) { zona.innerHTML = '<p class="sin-alertas">Sin usuarios registrados</p>'; return; }
      zona.innerHTML = (data || []).map(u => `
        <div class="usuario-admin-row">
          <div class="usuario-admin-info">
            <strong>${u.nombre || '—'}</strong>
            <span class="usuario-admin-email">Plan: ${planLabel(u.plan)} · ${u.aprobado ? '✅ Activo' : '⏳ Pendiente'}</span>
          </div>
          <select class="campo-input" style="padding:4px;font-size:0.72rem;width:100px"
            onchange="ModuloConfiguracion.cambiarPlan('${u.id}', this.value)">
            ${['admin','tester','socio','trial','mensual','anual','bloqueado'].map(p =>
              `<option value="${p}" ${p===u.plan?'selected':''}>${planLabel(p)}</option>`
            ).join('')}
          </select>
        </div>`).join('');
    } catch (e) {}
  }

  async function aprobar(id) {
    const plan = document.getElementById(`plan-${id}`)?.value || 'trial';
    const res = await DB.aprobarUsuario(id, plan);
    if (res.ok) { UI.mostrarToast('✅ Usuario aprobado', 'success'); cargarUsuariosPendientes(); cargarTodosUsuarios(); }
    else UI.mostrarToast('Error al aprobar', 'error');
  }

  async function rechazar(id) {
    if (!confirm('¿Rechazar acceso a este usuario?')) return;
    const res = await DB.cambiarPlanUsuario(id, { plan: 'bloqueado', aprobado: false });
    if (res.ok) { UI.mostrarToast('❌ Acceso rechazado', 'info'); cargarUsuariosPendientes(); }
  }

  async function cambiarPlan(id, plan) {
    const res = await DB.cambiarPlanUsuario(id, { plan });
    if (res.ok) UI.mostrarToast(`Plan actualizado a ${planLabel(plan)}`, 'success');
    else UI.mostrarToast('Error al cambiar plan', 'error');
  }

  function planLabel(plan) {
    return { admin: '👑 Admin', tester: '🧪 Tester (gratis)', socio: '🤝 Socio', trial: '⏱️ Trial', mensual: '📅 Mensual', anual: '📆 Anual', bloqueado: '🚫 Bloqueado', demo: '🎮 Demo' }[plan] || plan;
  }

  async function cargarGalponesConfig() {
    const lista = document.getElementById('cfg-galpones-lista');
    if (!lista) return;
    try {
      const galpones = await DB.obtenerGalpones();
      if (!galpones.length) {
        lista.innerHTML = '<p class="sin-alertas">No hay galpones. Agregá el primero.</p>';
        return;
      }
      lista.innerHTML = galpones.map(g => `
        <div class="config-galpon-row">
          <span class="cfg-galpon-nombre">🏠 ${g.nombre}</span>
          <span class="cfg-galpon-cap">${g.capacidad || '—'} aves cap.</span>
        </div>`).join('');
    } catch (e) {}
  }

  // ── GUARDAR ───────────────────────────────────────────────────
  function guardarGranja() {
    const granja = cargarConfigLocal();
    granja.nombre          = document.getElementById('cfg-nombre')?.value?.trim();
    granja.tipo_produccion = document.getElementById('cfg-tipo')?.value;
    granja.zona            = document.getElementById('cfg-zona')?.value;
    granja.direccion       = document.getElementById('cfg-direccion')?.value?.trim();
    granja.telefono        = document.getElementById('cfg-telefono')?.value?.trim();
    guardarConfigLocal(granja);

    // Actualizar el top-bar con el nuevo nombre
    const el = document.getElementById('top-bar-nombre');
    if (el && granja.nombre) el.textContent = granja.nombre;

    UI.mostrarToast('✅ Datos de la granja guardados', 'success');

    // Regenerar textos de venta
    const zona = document.getElementById('cfg-textos-venta');
    if (zona) zona.innerHTML = renderTextosVenta(granja);
  }

  function guardarPrecios() {
    const granja = cargarConfigLocal();
    granja.precio_mediano  = parseFloat(document.getElementById('cfg-precio-mediano')?.value) || 0;
    granja.precio_grande   = parseFloat(document.getElementById('cfg-precio-grande')?.value)  || 0;
    granja.precio_extra    = parseFloat(document.getElementById('cfg-precio-extra')?.value)   || 0;
    granja.precio_alimento = parseFloat(document.getElementById('cfg-precio-alimento')?.value)|| 0;
    guardarConfigLocal(granja);
    UI.mostrarToast('✅ Precios actualizados', 'success');
  }

  async function nuevoGalpon() {
    const nombre = prompt('Nombre del galpón:');
    if (!nombre?.trim()) return;
    const capacidad = parseInt(prompt('Capacidad máxima (aves):') || '0');
    const res = await DB.insertarGalpon({ nombre: nombre.trim(), capacidad: capacidad || null, activo: true });
    if (res.ok) {
      UI.mostrarToast('✅ Galpón agregado', 'success');
      cargarGalponesConfig();
    } else {
      UI.mostrarToast('Error al agregar el galpón', 'error');
    }
  }

  function copiarTexto(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
      UI.mostrarToast('📋 Texto copiado al portapapeles', 'success');
    }).catch(() => {
      el.select();
      document.execCommand('copy');
      UI.mostrarToast('📋 Texto copiado', 'success');
    });
  }

  function cerrarSesion() {
    if (!confirm('¿Cerrar sesión?')) return;
    Auth.cerrarSesion();
  }

  async function limpiarBD() {
    const confirmacion = prompt("⚠️ PELIGRO: Esto borrará todas las estadísticas, ventas y lotes. Escribí 'BORRAR' para confirmar:");
    if (confirmacion === "BORRAR") {
      UI.mostrarToast('⏳ Borrando base de datos...', 'info');
      const res = await DB.limpiarBaseDeDatos();
      if (res.ok) {
         UI.mostrarToast('✅ La aplicación se ha restablecido a cero.', 'success');
         setTimeout(() => location.reload(), 1500);
      } else {
         UI.mostrarToast('❌ Hubo un problema al borrar.', 'error');
      }
    } else if (confirmacion !== null) {
      UI.mostrarToast('Cancelado. No se escribio BORRAR.', 'warning');
    }
  }

  function seleccionarTipo(tipo, el) {
    document.querySelectorAll('#cfg-tipo-selector .rol-opcion').forEach(e => e.classList.remove('seleccionado'));
    el.classList.add('seleccionado');
    document.getElementById('cfg-tipo').value = tipo;
  }

  // ── LOCAL STORAGE ─────────────────────────────────────────────
  function cargarConfigLocal() {
    try { return JSON.parse(localStorage.getItem('gfi_config') || '{}'); }
    catch { return {}; }
  }

  function guardarConfigLocal(data) {
    localStorage.setItem('gfi_config', JSON.stringify(data));
  }

  // ── MODO ASISTIDO ─────────────────────────────────────────────
  function _leerModoAsistido() {
    const val = localStorage.getItem('gfi_modo_asistido');
    return val === null ? true : val === 'true'; // true por defecto
  }

  function toggleModoAsistido(activo) {
    localStorage.setItem('gfi_modo_asistido', String(activo));
    const etiqueta = activo ? '🧭 Guía visual activada' : '🧭 Guía visual desactivada';
    UI.mostrarToast(etiqueta, activo ? 'success' : 'info');
  }

  // ── SUPER ADMIN SAAS (GRANJAS) ───────────────────────────────────
  async function cargarGranjasSaaS() {
    const zona = document.getElementById('cfg-granjas-saas-lista');
    if (!zona) return;
    try {
      const granjas = await DB.obtenerTodasLasGranjasSaaS();
      if (!granjas.length) {
        zona.innerHTML = '<p class="sin-alertas">No hay granjas registradas.</p>';
        return;
      }
      zona.innerHTML = granjas.map(g => {
        const nombreOwner = g.perfiles?.nombre || 'Propietario Desconocido';
        return `
        <div class="granja-cliente-item">
          <div>
            <strong>${g.nombre}</strong><br>
            <span style="font-size:12px;color:#6b7280">${nombreOwner}</span>
          </div>
          <button class="btn-granja-ingresar" onclick="ModuloConfiguracion.ingresarComoTenant('${g.id}', '${g.nombre}')">Entrar</button>
        </div>
        `;
      }).join('');
    } catch (e) {
      zona.innerHTML = '<p class="sin-alertas">Error cargando lista de clientes.</p>';
    }
  }

  function ingresarComoTenant(granjaId, granjaNombre) {
    if (confirm(`¿Entrar en Modo Super Admin a la granja "${granjaNombre}"?\n\nVerás y editarás los datos como si fueras este cliente.`)) {
      Auth.setTenantActivo(granjaId, granjaNombre);
      location.reload();
    }
  }

  // API PÚBLICA para acceso desde otros módulos
  function obtenerConfig() { return cargarConfigLocal(); }
  function modoAsistidoActivo() { return _leerModoAsistido(); }

  return {
    render, postRender,
    guardarGranja, guardarPrecios, nuevoGalpon,
    seleccionarTipo, copiarTexto, cerrarSesion, limpiarBD,
    obtenerConfig, modoAsistidoActivo, toggleModoAsistido,
    mostrarFormGallinero, editarGallinero, guardarGallinero,
    archivarGallinero, cancelarFormGallinero,
    aprobar, rechazar, cambiarPlan,
    ingresarComoTenant, cargarGranjasSaaS
  };
})();
