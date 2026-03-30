// ventas.js — Módulo VENTAS: dos dimensiones de estado (Entrega + Pago)
const ModuloVentas = (() => {

  const CANALES  = ['Directo', 'Almacén', 'Verdulería', 'Restaurante', 'WhatsApp', 'Otro'];
  const TIPOS    = ['Mediano', 'Grande', 'Extra grande', 'Mixto'];

  const ESTADOS_ENTREGA = [
    { clave: 'pendiente',   label: '📦 Por entregar',  color: '#ff9800' },
    { clave: 'programado',  label: '📅 Programado',    color: '#2196f3' },
    { clave: 'entregado',   label: '✅ Entregado',     color: '#4caf50' },
  ];

  const ESTADOS_PAGO = [
    { clave: 'pendiente', label: '⏳ Sin cobrar', color: '#ff9800' },
    { clave: 'parcial',   label: '💵 Parcial',    color: '#9c27b0' },
    { clave: 'cobrado',   label: '💰 Cobrado',   color: '#4caf50' },
  ];

  // Filtro activo: 'todos' | 'sin_cobrar' | 'sin_entregar' | 'cerradas'
  let _filtro = 'todos';
  let _todas  = [];

  // ── RENDER ────────────────────────────────────────────────────
  function render() {
    return `
    <div class="modulo-contenedor">
      <div class="modulo-encabezado">
        <h2 class="modulo-titulo">💰 Ventas</h2>
        <button class="btn-agregar" onclick="ModuloVentas.abrirFormulario()">+ Nueva venta</button>
      </div>

      <!-- Guía contextual -->
      <div id="ventas-guia"></div>

      <!-- KPIs -->
      <div class="ventas-resumen-grid">
        <div class="ventas-kpi">
          <div class="ventas-kpi-val" id="venta-hoy-total">—</div>
          <div class="ventas-kpi-label">$ Cobrado hoy</div>
        </div>
        <div class="ventas-kpi">
          <div class="ventas-kpi-val" id="venta-hoy-maples">—</div>
          <div class="ventas-kpi-label">📦 Maples hoy</div>
        </div>
        <div class="ventas-kpi">
          <div class="ventas-kpi-val" id="venta-mes-total">—</div>
          <div class="ventas-kpi-label">$ Este mes</div>
        </div>
        <div class="ventas-kpi">
          <div class="ventas-kpi-val kpi-naranja" id="venta-sin-cobrar">—</div>
          <div class="ventas-kpi-label">⏳ Sin cobrar</div>
        </div>
        <div class="ventas-kpi">
          <div class="ventas-kpi-val kpi-azul" id="venta-sin-entregar">—</div>
          <div class="ventas-kpi-label">📦 Sin entregar</div>
        </div>
      </div>

      <!-- Gráfico 7 días -->
      <div class="seccion-bloque">
        <h3 class="seccion-titulo">📈 Últimos 7 días</h3>
        <div id="ventas-grafico" class="ventas-grafico-wrap">
          <div class="skeleton" style="height:90px;border-radius:12px"></div>
        </div>
      </div>

      <!-- Filtros rápidos -->
      <div class="ventas-filtros">
        <button class="filtro-chip activo" onclick="ModuloVentas.filtrar('todos',this)">Todas</button>
        <button class="filtro-chip" onclick="ModuloVentas.filtrar('sin_cobrar',this)">⏳ Sin cobrar</button>
        <button class="filtro-chip" onclick="ModuloVentas.filtrar('sin_entregar',this)">📦 Sin entregar</button>
        <button class="filtro-chip" onclick="ModuloVentas.filtrar('cerradas',this)">✅ Cerradas</button>
      </div>

      <!-- Lista -->
      <div class="seccion-bloque">
        <h3 class="seccion-titulo">📋 Ventas recientes</h3>
        <div id="ventas-lista">
          <div class="skeleton" style="height:72px;border-radius:12px"></div>
          <div class="skeleton" style="height:72px;border-radius:12px;margin-top:8px"></div>
        </div>
      </div>

      <!-- Panel Valor App -->
      <div id="ventas-panel-app" class="app-valor-panel">
        <div class="skeleton" style="height:140px;border-radius:16px"></div>
      </div>
    </div>`;
  }

  async function postRender() {
    await Promise.allSettled([cargarVentas(), cargarPanelApp()]);
  }

  // ── CARGA ─────────────────────────────────────────────────────
  async function cargarVentas() {
    try {
      _todas = await DB.obtenerVentas();
      renderResumen(_todas);
      renderGrafico(_todas);
      aplicarFiltro();
      renderGuia(_todas);
    } catch(e) {
      const el = document.getElementById('ventas-lista');
      if (el) el.innerHTML = '<p class="sin-alertas">Error cargando ventas</p>';
    }
  }

  // ── GUÍA ──────────────────────────────────────────────────────
  function renderGuia(ventas) {
    const el = document.getElementById('ventas-guia');
    if (!el) return;
    if (ventas.length > 0) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="guia-pasos-card">
        <div class="guia-pasos-icono">💡</div>
        <div class="guia-pasos-titulo">¡Empezá a registrar tus ventas!</div>
        <div class="guia-pasos-sub">Registrá cada venta y la app te muestra quién te debe plata y qué falta entregar.</div>
        <div class="guia-pasos-lista">
          <div class="guia-paso"><span class="guia-paso-num">1</span><span>Tocá <strong>"+ Nueva venta"</strong></span></div>
          <div class="guia-paso"><span class="guia-paso-num">2</span><span>Marcá si ya la entregaste y si ya cobraste</span></div>
          <div class="guia-paso"><span class="guia-paso-num">3</span><span>Todo queda registrado para no perder nada</span></div>
        </div>
      </div>`;
  }

  // ── KPIs ──────────────────────────────────────────────────────
  function renderResumen(ventas) {
    const hoy = new Date().toISOString().split('T')[0];
    const mes = hoy.substring(0, 7);

    const hoyVentas = ventas.filter(v => v.fecha === hoy);
    const mesVentas = ventas.filter(v => (v.fecha || '').startsWith(mes));

    const totalHoy   = hoyVentas.filter(v => estadoPago(v) === 'cobrado').reduce((s, v) => s + num(v.total), 0);
    const maplesHoy  = hoyVentas.reduce((s, v) => s + (parseInt(v.maples_entregados) || 0), 0);
    const totalMes   = mesVentas.reduce((s, v) => s + num(v.total), 0);
    const sinCobrar  = ventas.filter(v => estadoPago(v) !== 'cobrado').reduce((s, v) => s + deuda(v), 0);
    const sinEntreg  = ventas.filter(v => estadoEntrega(v) !== 'entregado').reduce((s, v) => s + num(v.total), 0);

    set('venta-hoy-total',    formatPesos(totalHoy));
    set('venta-hoy-maples',   maplesHoy || '—');
    set('venta-mes-total',    formatPesos(totalMes));
    set('venta-sin-cobrar',   formatPesos(sinCobrar));
    set('venta-sin-entregar', formatPesos(sinEntreg));
  }

  // ── GRÁFICO 7 DÍAS ────────────────────────────────────────────
  function renderGrafico(ventas) {
    const el = document.getElementById('ventas-grafico');
    if (!el) return;
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const fecha = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-AR', { weekday: 'short' });
      const total = ventas.filter(v => v.fecha === fecha).reduce((s, v) => s + num(v.total), 0);
      dias.push({ fecha, label, total });
    }
    const maxTotal = Math.max(...dias.map(d => d.total), 1);
    const hoy = new Date().toISOString().split('T')[0];
    el.innerHTML = `<div class="grafico-barras">${dias.map(d => {
      const pct = (d.total / maxTotal) * 75;
      const esHoy = d.fecha === hoy;
      return `
        <div class="grafico-barra-col">
          <div class="grafico-barra-wrap">
            <div class="grafico-barra-tooltip">${formatPesos(d.total)}</div>
            <div class="grafico-barra ${esHoy ? 'grafico-barra-hoy' : ''}" style="height:${pct}%"></div>
          </div>
          <div class="grafico-barra-label ${esHoy ? 'grafico-label-hoy' : ''}">${d.label}</div>
        </div>`;
    }).join('')}</div>`;
  }

  // ── FILTROS ───────────────────────────────────────────────────
  function filtrar(filtro, btn) {
    _filtro = filtro;
    document.querySelectorAll('.filtro-chip').forEach(b => b.classList.remove('activo'));
    if (btn) btn.classList.add('activo');
    aplicarFiltro();
  }

  function aplicarFiltro() {
    let filtradas = _todas;
    if (_filtro === 'sin_cobrar')   filtradas = _todas.filter(v => estadoPago(v) !== 'cobrado');
    if (_filtro === 'sin_entregar') filtradas = _todas.filter(v => estadoEntrega(v) !== 'entregado');
    if (_filtro === 'cerradas')     filtradas = _todas.filter(v => estadoPago(v) === 'cobrado' && estadoEntrega(v) === 'entregado');
    renderLista(filtradas);
  }

  // ── LISTA ─────────────────────────────────────────────────────
  function renderLista(ventas) {
    const lista = document.getElementById('ventas-lista');
    if (!lista) return;
    if (!ventas.length) {
      lista.innerHTML = `
        <div class="estado-vacio">
          <div class="estado-vacio-icono">💰</div>
          <p class="estado-vacio-titulo">${_filtro === 'todos' ? 'No hay ventas registradas' : 'Sin ventas con ese filtro'}</p>
          <p class="estado-vacio-sub">${_filtro === 'todos' ? 'Usá "+ Nueva venta" para comenzar' : 'Probá otro filtro'}</p>
        </div>`;
      return;
    }

    lista.innerHTML = ventas.slice(0, 25).map(v => {
      const ep  = ESTADOS_PAGO.find(e => e.clave === estadoPago(v)) || ESTADOS_PAGO[0];
      const ee  = ESTADOS_ENTREGA.find(e => e.clave === estadoEntrega(v)) || ESTADOS_ENTREGA[0];
      const deudaResto = deuda(v);

      return `
      <div class="venta-card">
        <div class="venta-card-info">
          <div class="venta-cliente">${v.cliente_nombre || v.canal || 'Cliente'}</div>
          <div class="venta-detalle">
            ${v.maples_entregados} maple${v.maples_entregados !== 1 ? 's' : ''}
            · ${v.tipo_huevo || ''} · ${v.fecha}
            ${v.fecha_entrega && estadoEntrega(v) === 'programado' ? `<span class="venta-notas-tag">📅 Entrega: ${formatFecha(v.fecha_entrega)}</span>` : ''}
            ${v.notas ? `<span class="venta-notas-tag">📝 ${v.notas}</span>` : ''}
            <span class="venta-notas-tag" style="background:rgba(255,255,255,0.05); color:var(--texto-secundario)">👤 Por: ${v.operador_nombre || 'Sistema'}</span>
          </div>
          <!-- Dos badges de estado independientes -->
          <div class="venta-badges">
            <span class="venta-badge-estado" style="background:${ee.color}22;color:${ee.color};border-color:${ee.color}44">${ee.label}</span>
            <span class="venta-badge-estado" style="background:${ep.color}22;color:${ep.color};border-color:${ep.color}44">${ep.label}</span>
            ${deudaResto > 0 && estadoPago(v) === 'parcial' ? `<span class="venta-badge-deuda">Resta ${formatPesos(deudaResto)}</span>` : ''}
          </div>
        </div>
        <div class="venta-card-derecha">
          <div class="venta-total">${formatPesos(v.total)}</div>
          <button class="venta-menu-btn" onclick="ModuloVentas.abrirAcciones('${v.id}')" title="Acciones">···</button>
        </div>
      </div>`;
    }).join('');
  }

  // ── PANEL VALOR APP ───────────────────────────────────────────
  async function cargarPanelApp() {
    const el = document.getElementById('ventas-panel-app');
    if (!el) return;
    try {
      const stats = await DB.obtenerEstadisticasApp();
      el.innerHTML = `
        <div class="app-valor-header">
          <span class="app-valor-icono">⭐</span>
          <div>
            <div class="app-valor-titulo">Valor generado por la App</div>
            <div class="app-valor-sub">Últimos 30 días · ${stats.cantidadClientesApp} cliente${stats.cantidadClientesApp !== 1 ? 's' : ''} captados</div>
          </div>
        </div>
        <div class="app-valor-kpis">
          <div class="app-valor-kpi">
            <div class="app-valor-kpi-val">${formatPesos(stats.totalVentasApp)}</div>
            <div class="app-valor-kpi-label">$ via la app</div>
          </div>
          <div class="app-valor-kpi">
            <div class="app-valor-kpi-val">${stats.porcentajeApp}%</div>
            <div class="app-valor-kpi-label">del total</div>
          </div>
          <div class="app-valor-kpi">
            <div class="app-valor-kpi-val">${stats.mensajesEnviados}</div>
            <div class="app-valor-kpi-label">mensajes enviados</div>
          </div>
        </div>
        <div class="app-valor-mensaje">
          💡 ${stats.totalVentasApp > 0
            ? `La app te ayudó a gestionar <strong>${formatPesos(stats.totalVentasApp)}</strong> este mes.`
            : `Marcá "captado por la app" al agregar clientes para medir el impacto.`
          }
        </div>`;
    } catch(e) { el.innerHTML = ''; }
  }

  // ── ACCIONES RÁPIDAS ──────────────────────────────────────────
  function abrirAcciones(id) {
    const v = _todas.find(x => x.id === id);
    if (!v) return;
    const ep = estadoPago(v);
    const ee = estadoEntrega(v);

    const modalHtml = `
    <div class="modal-overlay" id="modal-acciones-venta" onclick="ModuloVentas.cerrarAcciones(event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">✏️ ${v.cliente_nombre || 'Venta'} — ${formatPesos(v.total)}</p>
        <p style="font-size:0.8rem;color:var(--texto-terciario);margin-bottom:14px">Tocá para cambiar el estado</p>

        <div style="display:flex;flex-direction:column;gap:8px">
          <!-- ENTREGA -->
          ${ESTADOS_ENTREGA.map(est => `
          <button class="accion-estado-btn ${ee === est.clave ? 'accion-estado-activo' : ''}"
            style="border-color:${est.color}44"
            onclick="ModuloVentas.cambiarEntrega('${id}','${est.clave}', ${est.clave === 'programado' ? 'true' : 'false'})">
            <span style="color:${est.color}">${est.label}</span>
            ${ee === est.clave ? '<span class="accion-check">✓</span>' : ''}
          </button>`).join('')}

          <div class="accion-separador">💰 Estado de pago</div>

          <!-- PAGO -->
          ${ESTADOS_PAGO.map(est => `
          <button class="accion-estado-btn ${ep === est.clave ? 'accion-estado-activo' : ''}"
            style="border-color:${est.color}44"
            onclick="ModuloVentas.cambiarPago('${id}','${est.clave}', '${v.total}')">
            <span style="color:${est.color}">${est.label}</span>
            ${ep === est.clave ? '<span class="accion-check">✓</span>' : ''}
          </button>`).join('')}
        </div>

        <button class="btn-secondary btn-full" style="margin-top:14px" onclick="document.getElementById('modal-acciones-venta')?.remove()">Cerrar</button>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function cerrarAcciones(event) {
    if (event?.target?.id === 'modal-acciones-venta')
      document.getElementById('modal-acciones-venta')?.remove();
  }

  async function cambiarEntrega(id, nuevoEstado, pedirFecha) {
    document.getElementById('modal-acciones-venta')?.remove();
    if (pedirFecha) {
      const fecha = prompt('Fecha de entrega (AAAA-MM-DD):', fechaHoy());
      if (!fecha) return;
      await DB.actualizarVenta(id, { estado_entrega: nuevoEstado, fecha_entrega: fecha });
    } else {
      await DB.actualizarVenta(id, { estado_entrega: nuevoEstado });
    }
    UI.mostrarToast(`📦 ${ESTADOS_ENTREGA.find(e => e.clave === nuevoEstado)?.label}`, 'success');
    await cargarVentas();
  }

  async function cambiarPago(id, nuevoEstado, totalStr) {
    document.getElementById('modal-acciones-venta')?.remove();
    if (nuevoEstado === 'parcial') {
      const monto = prompt('¿Cuánto cobró? ($):', '');
      if (!monto || isNaN(parseFloat(monto))) return;
      await DB.actualizarVenta(id, { estado_pago: 'parcial', monto_cobrado: parseFloat(monto) });
    } else {
      const cambios = { estado_pago: nuevoEstado };
      if (nuevoEstado === 'cobrado') cambios.monto_cobrado = parseFloat(totalStr) || 0;
      await DB.actualizarVenta(id, cambios);
    }
    UI.mostrarToast(`${ESTADOS_PAGO.find(e => e.clave === nuevoEstado)?.label}`, 'success');
    await cargarVentas();
  }

  // ── FORMULARIO NUEVA VENTA ────────────────────────────────────
  let _clientesCache = [];

  async function abrirFormulario() {
    // Cargar clientes disponibles antes de mostrar el modal
    try {
      _clientesCache = await DB.obtenerClientes();
    } catch(e) { _clientesCache = []; }

    const html = `
    <div class="modal-overlay" id="modal-venta" onclick="ModuloVentas.cerrarFormulario(event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">💰 Nueva venta</p>

        <div class="campo-grupo">
          <label class="campo-label">Fecha</label>
          <input class="campo-input" id="venta-fecha" type="date" value="${fechaHoy()}">
        </div>

        <!-- SELECTOR DE CLIENTE INTELIGENTE -->
        <div class="campo-grupo">
          <label class="campo-label">Cliente</label>
          <div class="cliente-selector-wrap" id="cliente-selector-wrap">
            <div class="cliente-seleccionado hidden" id="cliente-seleccionado">
              <span id="cliente-seleccionado-nombre">—</span>
              <button class="cliente-cambiar-btn" onclick="ModuloVentas.limpiarCliente()">✕</button>
            </div>
            <div class="cliente-busqueda-wrap" id="cliente-busqueda-wrap">
              <input
                class="campo-input"
                id="venta-cliente-buscar"
                type="text"
                placeholder="Buscá cliente o escribí su nombre..."
                autocomplete="off"
                oninput="ModuloVentas.buscarCliente(this.value)"
              >
              <div class="cliente-dropdown hidden" id="cliente-dropdown"></div>
            </div>
          </div>
          <input type="hidden" id="venta-cliente-id">
          <input type="hidden" id="venta-cliente-nombre">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Cantidad de maples</label>
          <input class="campo-input" id="venta-maples" type="number" min="1" placeholder="Ej: 10"
                 oninput="ModuloVentas.calcularTotal()">
        </div>
        <div class="campo-grupo">
          <label class="campo-label">Tipo de huevo</label>
          <select class="campo-input" id="venta-tipo">
            ${TIPOS.map(t => `<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="campo-grupo">
          <label class="campo-label">Precio por maple ($)</label>
          <input class="campo-input" id="venta-precio" type="number" min="0" placeholder="Ej: 3500"
                 oninput="ModuloVentas.calcularTotal()">
        </div>
        <div class="campo-grupo">
          <label class="campo-label">Canal</label>
          <div class="rol-selector">
            ${CANALES.map((c, i) => `
              <button class="rol-opcion ${i===0?'seleccionado':''}"
                onclick="ModuloVentas.selCanal('${c}',this)">${c}</button>`).join('')}
          </div>
          <input type="hidden" id="venta-canal" value="${CANALES[0]}">
        </div>

        <!-- DOBLE TOGGLE: Entrega + Pago -->
        <div class="venta-toggle-section">
          <div class="venta-toggle-titulo">Estado de la venta</div>
          <div class="venta-toggle-grid">
            <!-- Entrega -->
            <div class="venta-toggle-bloque">
              <div class="venta-toggle-label">📦 ¿Ya la entregaste?</div>
              <div class="toggle-opciones">
                <button class="toggle-op seleccionado" onclick="ModuloVentas.selToggle('venta-entrega','pendiente',this)">No aún</button>
                <button class="toggle-op" onclick="ModuloVentas.selToggle('venta-entrega','programado',this)">Programado</button>
                <button class="toggle-op toggle-op-si" onclick="ModuloVentas.selToggle('venta-entrega','entregado',this)">Sí ✓</button>
              </div>
              <input type="hidden" id="venta-entrega" value="pendiente">
            </div>
            <!-- Pago -->
            <div class="venta-toggle-bloque">
              <div class="venta-toggle-label">💰 ¿Ya la cobraste?</div>
              <div class="toggle-opciones">
                <button class="toggle-op seleccionado" onclick="ModuloVentas.selToggle('venta-pago','pendiente',this)">No aún</button>
                <button class="toggle-op toggle-op-medio" onclick="ModuloVentas.selToggle('venta-pago','parcial',this)">Parcial</button>
                <button class="toggle-op toggle-op-si" onclick="ModuloVentas.selToggle('venta-pago','cobrado',this)">Sí ✓</button>
              </div>
              <input type="hidden" id="venta-pago" value="pendiente">
            </div>
          </div>
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Notas (opcional)</label>
          <input class="campo-input" id="venta-notas" type="text" placeholder="Ej: Entregar el miércoles">
        </div>

        <div class="venta-total-preview" id="venta-total-preview">Total: $ —</div>

        <button class="btn-primary btn-full" onclick="ModuloVentas.guardarVenta()">💾 Registrar venta</button>
        <button class="btn-secondary btn-full" onclick="document.getElementById('modal-venta')?.remove()">Cancelar</button>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function buscarCliente(query) {
    const dropdown = document.getElementById('cliente-dropdown');
    if (!dropdown) return;
    const q = (query || '').toLowerCase().trim();

    // Filtrar clientes del cache
    const encontrados = q
      ? _clientesCache.filter(c => (c.nombre || '').toLowerCase().includes(q)).slice(0, 6)
      : _clientesCache.slice(0, 6);

    const items = encontrados.map(c => `
      <div class="cliente-dropdown-item" onclick="ModuloVentas.seleccionarCliente('${c.id}','${(c.nombre||'').replace(/'/g, "\\'")}')"
           role="option" tabindex="0">
        <span class="cliente-dropdown-nombre">${c.nombre}</span>
        ${c.telefono ? `<span class="cliente-dropdown-tel">${c.telefono}</span>` : ''}
        ${c.zona ? `<span class="cliente-dropdown-zona">${c.zona}</span>` : ''}
      </div>`);

    // Opción de crear nuevo si no hay coincidencia exacta
    const coincidenciaExacta = encontrados.some(c => (c.nombre||'').toLowerCase() === q);
    if (q && !coincidenciaExacta) {
      items.push(`
        <div class="cliente-dropdown-item cliente-dropdown-nuevo"
             onclick="ModuloVentas.crearClienteRapido('${query.replace(/'/g, "\\'")}')"
             role="option" tabindex="0">
          <span>➕ Crear: <strong>${query}</strong></span>
        </div>`);
    }

    if (items.length === 0) {
      dropdown.innerHTML = '<div class="cliente-dropdown-vacio">No hay clientes — escribí el nombre para crear uno</div>';
    } else {
      dropdown.innerHTML = items.join('');
    }
    dropdown.classList.remove('hidden');
  }

  function seleccionarCliente(id, nombre) {
    document.getElementById('venta-cliente-id').value   = id;
    document.getElementById('venta-cliente-nombre').value = nombre;
    // Mostrar pill del cliente seleccionado
    const pill = document.getElementById('cliente-seleccionado');
    const busq = document.getElementById('cliente-busqueda-wrap');
    const drop = document.getElementById('cliente-dropdown');
    document.getElementById('cliente-seleccionado-nombre').textContent = nombre;
    pill?.classList.remove('hidden');
    busq?.classList.add('hidden');
    drop?.classList.add('hidden');
  }

  function limpiarCliente() {
    document.getElementById('venta-cliente-id').value    = '';
    document.getElementById('venta-cliente-nombre').value = '';
    document.getElementById('venta-cliente-buscar').value = '';
    document.getElementById('cliente-seleccionado')?.classList.add('hidden');
    document.getElementById('cliente-busqueda-wrap')?.classList.remove('hidden');
    document.getElementById('cliente-dropdown')?.classList.add('hidden');
  }

  async function crearClienteRapido(nombre) {
    // Cierra dropdown y abre módulo de clientes para alta completa
    document.getElementById('cliente-dropdown')?.classList.add('hidden');
    document.getElementById('venta-cliente-buscar').value = nombre;
    // Pre-selecciona el nombre mientras el usuario guarda el cliente
    document.getElementById('venta-cliente-nombre').value = nombre;
    UI.mostrarToast('📝 Guardá el cliente en CLIENTES y volvé a registrar la venta', 'info');
  }

  function calcularTotal() {
    const maples = parseInt(document.getElementById('venta-maples')?.value) || 0;
    const precio = parseFloat(document.getElementById('venta-precio')?.value) || 0;
    const el = document.getElementById('venta-total-preview');
    if (el) el.textContent = `Total: ${formatPesos(maples * precio)}`;
  }

  function selCanal(canal, el) {
    document.querySelectorAll('#modal-venta .rol-selector .rol-opcion').forEach(b => b.classList.remove('seleccionado'));
    el.classList.add('seleccionado');
    document.getElementById('venta-canal').value = canal;
  }

  function selToggle(hiddenId, valor, el) {
    const grupo = el.closest('.venta-toggle-bloque');
    grupo?.querySelectorAll('.toggle-op').forEach(b => b.classList.remove('seleccionado'));
    el.classList.add('seleccionado');
    document.getElementById(hiddenId).value = valor;
  }

  function cerrarFormulario(event) {
    if (event?.target?.id === 'modal-venta') document.getElementById('modal-venta')?.remove();
  }

  async function guardarVenta() {
    const maples = parseInt(document.getElementById('venta-maples')?.value);
    const precio = parseFloat(document.getElementById('venta-precio')?.value);
    const fecha  = document.getElementById('venta-fecha')?.value;
    const canal  = document.getElementById('venta-canal')?.value;
    const ee     = document.getElementById('venta-entrega')?.value || 'pendiente';
    const ep     = document.getElementById('venta-pago')?.value || 'pendiente';
    const notas  = document.getElementById('venta-notas')?.value?.trim() || '';

    // Datos del cliente (ID si está en catálogo, nombre si es texto libre)
    const clienteId     = document.getElementById('venta-cliente-id')?.value || null;
    const clienteNombre = document.getElementById('venta-cliente-nombre')?.value?.trim()
                       || document.getElementById('venta-cliente-buscar')?.value?.trim()
                       || null;

    if (!maples || maples < 1)  { UI.mostrarToast('Ingresá la cantidad de maples', 'error'); return; }
    if (!precio || precio <= 0) { UI.mostrarToast('Ingresá el precio por maple', 'error'); return; }

    const venta = {
      fecha,
      canal,
      tipo_huevo:        document.getElementById('venta-tipo')?.value,
      cliente_id:        clienteId || undefined,
      cliente_nombre:    clienteNombre,
      maples_entregados: maples,
      precio_maple:      precio,
      total:             maples * precio,
      estado_entrega:    ee,
      estado_pago:       ep,
      monto_cobrado:     ep === 'cobrado' ? maples * precio : 0,
      notas,
    };

    const res = await DB.insertarVenta(venta);
    if (res.ok) {
      UI.mostrarToast('✅ Venta registrada', 'success');
      document.getElementById('modal-venta')?.remove();
      cargarVentas();
      cargarPanelApp();
    } else {
      UI.mostrarToast('Error al guardar. Verificá la conexión.', 'error');
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────
  // Compatibilidad: lee nuevo campo o cae al campo legacy
  function estadoEntrega(v) {
    if (v.estado_entrega) return v.estado_entrega;
    if (v.estado === 'cobrado' || v.estado === 'entregado') return 'entregado';
    return 'pendiente';
  }

  function estadoPago(v) {
    if (v.estado_pago) return v.estado_pago;
    if (v.estado === 'cobrado') return 'cobrado';
    return 'pendiente';
  }

  function deuda(v) {
    const total      = num(v.total);
    const cobrado    = num(v.monto_cobrado);
    const ep         = estadoPago(v);
    if (ep === 'cobrado') return 0;
    if (ep === 'parcial')  return Math.max(0, total - cobrado);
    return total;
  }

  function fechaHoy() { return new Date().toISOString().split('T')[0]; }
  function formatFecha(f) {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }
  function formatPesos(n) {
    if (!n) return '$ 0';
    return '$ ' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
  }
  function num(v) { return parseFloat(v) || 0; }
  function set(id, val) { const el = document.getElementById(id); if (el) el.textContent = String(val); }

  return {
    render, postRender,
    abrirFormulario, cerrarFormulario, guardarVenta,
    selCanal, selToggle, calcularTotal,
    filtrar, abrirAcciones, cerrarAcciones, cambiarEntrega, cambiarPago,
    buscarCliente, seleccionarCliente, limpiarCliente, crearClienteRapido,
  };
})();
