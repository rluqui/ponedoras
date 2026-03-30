// clientes.js — Módulo CLIENTES: CRM simple con marketing guiado para productores
const ModuloClientes = (() => {

  const TIPOS_CLIENTE = ['particular', 'almacen', 'restaurante', 'verduleria', 'distribuidor'];
  const TIPOS_LABEL   = { particular: '🏠 Particular', almacen: '🏪 Almacén', restaurante: '🍽️ Restaurante', verduleria: '🥬 Verdulería', distribuidor: '🚛 Distribuidor' };
  const TIPOS_HUEVO   = ['Mediano', 'Grande', 'Extra grande', 'Mixto'];
  const FRECUENCIAS   = [
    { clave: 'semanal',    label: '📅 Semanal',    dias: 7  },
    { clave: 'quincenal',  label: '📅 Quincenal',  dias: 15 },
    { clave: 'mensual',    label: '📅 Mensual',    dias: 30 },
  ];

  let clienteActual = null;
  let clientes      = [];

  // Mensajes WhatsApp personalizables (editables en modal)
  const MENSAJES_DEFAULT = {
    reactivar:     'Hola {nombre} 👋\nTenemos huevos frescos disponibles hoy 🥚\n¿Querés que te reserve tu pedido?',
    disponibilidad:'Hola {nombre}! 🐔\nHoy sacamos maples extra frescos de granja.\nAvisame si necesitás y te los alcanzo.',
    saludo:        'Hola {nombre} 👋\n¿Cómo estás? ¿Necesitás reponer huevos esta semana? 🥚',
    promo:         '¡Hola {nombre}! 📢 Promo especial hoy: Si me devolvés el cartón/maple vacío, te descuento $200 en el maple lleno nuevo. ¿Te anoto? 🥚♻️',
  };

  function obtenerMensajes() {
    try {
      const guardado = JSON.parse(localStorage.getItem('gfi_mensajes_wsp_template') || '{}');
      return { ...MENSAJES_DEFAULT, ...guardado };
    } catch { return { ...MENSAJES_DEFAULT }; }
  }

  function guardarMensajeTemplate(tipo, texto) {
    try {
      const actual = JSON.parse(localStorage.getItem('gfi_mensajes_wsp_template') || '{}');
      actual[tipo] = texto;
      localStorage.setItem('gfi_mensajes_wsp_template', JSON.stringify(actual));
    } catch {}
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  function render() {
    return `
    <div class="modulo-contenedor" id="clientes-root">
      <div class="modulo-encabezado">
        <h2 class="modulo-titulo">👥 Clientes</h2>
        <button class="btn-agregar" onclick="ModuloClientes.mostrarNuevo()">+ Nuevo</button>
      </div>

      <!-- Buscador -->
      <div class="clientes-search-wrap">
        <input class="clientes-search" id="clientes-buscar"
          placeholder="🔍 Buscar cliente..."
          oninput="ModuloClientes.filtrar(this.value)">
      </div>

      <!-- Guía de primeros pasos -->
      <div id="clientes-guia"></div>

      <!-- Banner de sugerencias automáticas -->
      <div id="clientes-sugerencias"></div>

      <!-- Panel de Logros del Equipo -->
      <div id="clientes-logros"></div>

      <!-- Lista -->
      <div id="clientes-lista">
        <div class="skeleton" style="height:72px;border-radius:14px"></div>
        <div class="skeleton" style="height:72px;border-radius:14px;margin-top:8px"></div>
        <div class="skeleton" style="height:72px;border-radius:14px;margin-top:8px"></div>
      </div>
    </div>`;
  }

  // ── POST RENDER ───────────────────────────────────────────────
  async function postRender() {
    await cargarClientes();
  }

  // ── CARGA Y FILTRO ────────────────────────────────────────────
  async function cargarClientes() {
    try {
      clientes = await DB.obtenerClientes();
      renderGuia(clientes);
      renderLista(clientes);
      mostrarSugerencias(clientes);
      renderLogros(clientes);
    } catch(e) {
      const el = document.getElementById('clientes-lista');
      if (el) el.innerHTML = '<p class="sin-alertas">Error cargando clientes</p>';
    }
  }

  function filtrar(texto) {
    if (!texto.trim()) { renderLista(clientes); return; }
    const filtrados = clientes.filter(c =>
      c.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      (c.telefono || '').includes(texto) ||
      (c.tipo || '').includes(texto.toLowerCase())
    );
    renderLista(filtrados);
  }

  // ── GUÍA PRIMEROS PASOS ───────────────────────────────────────
  function renderGuia(lista) {
    const el = document.getElementById('clientes-guia');
    if (!el) return;
    if (lista.length > 0) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="guia-pasos-card">
        <div class="guia-pasos-icono">👥</div>
        <div class="guia-pasos-titulo">¡Empezá a cargar tus clientes!</div>
        <div class="guia-pasos-sub">Tus clientes son tu negocio. Cargalos y la app te va a decir cuándo contactarlos antes de que se vayan con otro proveedor.</div>
        <div class="guia-pasos-lista">
          <div class="guia-paso"><span class="guia-paso-num">1</span><span>Tocá <strong>"+ Nuevo"</strong> y cargá nombre y WhatsApp</span></div>
          <div class="guia-paso"><span class="guia-paso-num">2</span><span>La app te avisa cuando un cliente lleva mucho sin comprar</span></div>
          <div class="guia-paso"><span class="guia-paso-num">3</span><span>Escribiles por WhatsApp con un solo toque desde la app</span></div>
        </div>
      </div>`;
  }

  // ── RENDER LISTA ──────────────────────────────────────────────
  function renderLista(lista) {
    const el = document.getElementById('clientes-lista');
    if (!el) return;

    if (!lista.length) {
      el.innerHTML = `
        <div class="estado-vacio">
          <div class="estado-vacio-icono">👥</div>
          <p class="estado-vacio-titulo">No hay clientes aún</p>
          <p class="estado-vacio-sub">Agregá tu primer cliente con el botón "+" de arriba</p>
        </div>`;
      return;
    }

    el.innerHTML = lista.map(c => {
      const diasInactivo = diasDesdeUltimaCompra(c.ultima_compra);
      const frecDias     = FRECUENCIAS.find(f => f.clave === c.frecuencia)?.dias || 14;
      const estadoColor  = c.activo
        ? diasInactivo > frecDias ? '#ff9800' : '#4caf50'
        : '#666';
      const estadoLabel  = !c.activo ? 'Inactivo'
        : diasInactivo > frecDias ? `${diasInactivo}d sin comprar`
        : diasInactivo === 0 ? 'Compró hoy' : `Hace ${diasInactivo}d`;

      return `
      <div class="cliente-card" onclick="ModuloClientes.verDetalle('${c.id}')">
        <div class="cliente-avatar">${avatarTipo(c.tipo)}</div>
        <div class="cliente-info">
          <div class="cliente-nombre">
            ${c.nombre}
            ${c.captado_por_app ? '<span class="badge-app" title="Captado con la App">⭐ App</span>' : ''}
          </div>
          <div class="cliente-sub">${TIPOS_LABEL[c.tipo] || c.tipo} ${c.zona ? '· ' + c.zona : ''}</div>
        </div>
        <div class="cliente-derecha">
          <div class="cliente-estado-dot" style="background:${estadoColor}"></div>
          <div class="cliente-estado-label" style="color:${estadoColor}">${estadoLabel}</div>
        </div>
      </div>`;
    }).join('');
  }

  // ── SUGERENCIAS AUTOMÁTICAS ───────────────────────────────────
  function mostrarSugerencias(lista) {
    const el = document.getElementById('clientes-sugerencias');
    if (!el) return;

    const inactivos = lista.filter(c => {
      if (!c.activo) return false;
      const frecDias = FRECUENCIAS.find(f => f.clave === c.frecuencia)?.dias || 14;
      return diasDesdeUltimaCompra(c.ultima_compra) > frecDias;
    });

    if (!inactivos.length) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="clientes-banner-sugerencia" onclick="ModuloClientes.mostrarInactivos()">
        <span class="banner-icono">💡</span>
        <div>
          <div class="banner-titulo">${inactivos.length} cliente${inactivos.length > 1 ? 's' : ''} esperan tu mensaje</div>
          <div class="banner-sub">Tocá para ver y escribirles por WhatsApp</div>
        </div>
        <span class="banner-flecha">›</span>
      </div>`;
  }

  // ── PANEL DE LOGROS DEL EQUIPO ────────────────────────────────
  function renderLogros(lista) {
    const el = document.getElementById('clientes-logros');
    if (!el) return;

    // Contamos clientes cargados por usuario (por ahora demo)
    const totalClientes = lista.length;
    const captadosApp   = lista.filter(c => c.captado_por_app).length;
    if (totalClientes === 0) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="logros-card">
        <div class="logros-card-header">
          <span class="logros-icono">🏆</span>
          <div>
            <div class="logros-titulo">Logros del equipo</div>
            <div class="logros-sub">¡Cada cliente que agregás hace crecer el negocio!</div>
          </div>
        </div>
        <div class="logros-stats">
          <div class="logro-stat">
            <div class="logro-stat-val">${totalClientes}</div>
            <div class="logro-stat-label">Clientes totales</div>
          </div>
          <div class="logro-stat">
            <div class="logro-stat-val logro-verde">${captadosApp}</div>
            <div class="logro-stat-label">⭐ Via la App</div>
          </div>
          <div class="logro-stat">
            <div class="logro-stat-val logro-naranja">${lista.filter(c => {
              const fd = FRECUENCIAS.find(f => f.clave === c.frecuencia)?.dias || 14;
              return c.activo && diasDesdeUltimaCompra(c.ultima_compra) <= fd;
            }).length}</div>
            <div class="logro-stat-label">Al día 🟢</div>
          </div>
        </div>
        ${captadosApp >= 3 ? `<div class="logro-insignia">🥇 ¡Guardaste ${captadosApp} clientes con la app! Genial equipo.</div>` : ''}
      </div>`;
  }

  // ── CLIENTES INACTIVOS ────────────────────────────────────────
  function mostrarInactivos() {
    const inactivos = clientes.filter(c => {
      const frecDias = FRECUENCIAS.find(f => f.clave === c.frecuencia)?.dias || 14;
      return c.activo && diasDesdeUltimaCompra(c.ultima_compra) > frecDias;
    });
    const el = document.getElementById('clientes-lista');
    if (!el) return;

    el.innerHTML = `
      <div class="seccion-header" style="margin-bottom:12px">
        <h3 class="seccion-titulo">💡 Clientes para contactar</h3>
        <button class="btn-ver-todo" onclick="ModuloClientes.postRender()">← Todos</button>
      </div>
      ${inactivos.map(c => `
        <div class="cliente-card cliente-card-inactivo">
          <div class="cliente-avatar">${avatarTipo(c.tipo)}</div>
          <div class="cliente-info">
            <div class="cliente-nombre">${c.nombre}</div>
            <div class="cliente-sub">Hace ${diasDesdeUltimaCompra(c.ultima_compra)} días sin comprar</div>
          </div>
          <button class="btn-whatsapp" onclick="event.stopPropagation(); ModuloClientes.enviarWhatsApp('${c.id}', 'reactivar')">
            💬 Escribir
          </button>
        </div>`).join('')}`;
  }

  // ── DETALLE DEL CLIENTE ───────────────────────────────────────
  async function verDetalle(id) {
    clienteActual = clientes.find(c => c.id === id);
    if (!clienteActual) return;

    const root = document.getElementById('clientes-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modulo-encabezado">
        <button class="btn-secundario" onclick="ModuloClientes.postRender()">← Volver</button>
        <h2 class="modulo-titulo" style="font-size:1rem">${clienteActual.nombre}</h2>
        <button class="btn-icon" onclick="ModuloClientes.mostrarEditar('${id}')">✏️</button>
      </div>

      <!-- Datos del cliente -->
      <div class="cliente-detalle-card">
        <div class="cliente-detalle-avatar">${avatarTipo(clienteActual.tipo)}</div>
        <div>
          <div class="cliente-detalle-nombre">
            ${clienteActual.nombre}
            ${clienteActual.captado_por_app ? '<span class="badge-app">⭐ App</span>' : ''}
          </div>
          <div class="cliente-detalle-tipo">${TIPOS_LABEL[clienteActual.tipo] || clienteActual.tipo}</div>
          ${clienteActual.zona ? `<div class="cliente-detalle-zona">📍 ${clienteActual.zona}</div>` : ''}
          <div class="cliente-detalle-zona">🔁 ${FRECUENCIAS.find(f=>f.clave===clienteActual.frecuencia)?.label || '📅 Quincenal'}</div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="acciones-rapidas-grid">
        <button class="accion-rapida accion-wsp" onclick="ModuloClientes.enviarWhatsApp('${id}', 'saludo')">
          <span class="accion-icono">💬</span>
          <span>WhatsApp</span>
        </button>
        <button class="accion-rapida accion-venta" onclick="ModuloClientes.abrirNuevaVenta('${id}')">
          <span class="accion-icono">💰</span>
          <span>Venta</span>
        </button>
        <button class="accion-rapida accion-llamar" onclick="window.open('tel:${clienteActual.telefono}')">
          <span class="accion-icono">📞</span>
          <span>Llamar</span>
        </button>
        <button class="accion-rapida accion-info" onclick="ModuloClientes.verMensajes('${id}')">
          <span class="accion-icono">📋</span>
          <span>Mensajes</span>
        </button>
      </div>

      <!-- KPIs del cliente -->
      <div class="cliente-kpis" id="cliente-kpis">
        <div class="cliente-kpi-card">
          <div class="cliente-kpi-val" id="ck-ultima">—</div>
          <div class="cliente-kpi-label">Última compra</div>
        </div>
        <div class="cliente-kpi-card">
          <div class="cliente-kpi-val" id="ck-total">—</div>
          <div class="cliente-kpi-label">Total comprado</div>
        </div>
        <div class="cliente-kpi-card">
          <div class="cliente-kpi-val" id="ck-maples">—</div>
          <div class="cliente-kpi-label">Maples total</div>
        </div>
      </div>

      <!-- Historial de compras -->
      <div class="seccion-bloque">
        <div class="seccion-header">
          <h3 class="seccion-titulo">📦 Historial de compras</h3>
        </div>
        <div id="cliente-historial">
          <div class="skeleton" style="height:52px;border-radius:12px"></div>
        </div>
      </div>

      ${clienteActual.observaciones ? `
      <div class="seccion-bloque">
        <h3 class="seccion-titulo">📝 Observaciones</h3>
        <p class="config-desc">${clienteActual.observaciones}</p>
      </div>` : ''}
    `;

    cargarHistorialCliente(id);
  }

  async function cargarHistorialCliente(clienteId) {
    try {
      const ventas = await DB.obtenerVentasCliente(clienteId);
      const kpiUltima = document.getElementById('ck-ultima');
      const kpiTotal  = document.getElementById('ck-total');
      const kpiMaples = document.getElementById('ck-maples');
      const hist      = document.getElementById('cliente-historial');

      if (ventas.length) {
        const totalPesos  = ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
        const totalMaples = ventas.reduce((s, v) => s + parseInt(v.maples_entregados || 0), 0);
        if (kpiUltima) kpiUltima.textContent = formatFecha(ventas[0].fecha);
        if (kpiTotal)  kpiTotal.textContent  = formatPesos(totalPesos);
        if (kpiMaples) kpiMaples.textContent  = `${totalMaples} 📦`;
      } else {
        if (kpiUltima) kpiUltima.textContent = 'Sin compras';
        if (kpiTotal)  kpiTotal.textContent  = '$ 0';
        if (kpiMaples) kpiMaples.textContent  = '0';
      }

      if (!hist) return;
      if (!ventas.length) {
        hist.innerHTML = `
          <div class="historial-vacio">
            <p>Todavía no hay compras registradas</p>
            <button class="btn-primary" onclick="ModuloClientes.abrirNuevaVenta('${clienteId}')">
              💰 Registrar primera venta
            </button>
          </div>`;
        return;
      }

      hist.innerHTML = ventas.map(v => `
        <div class="historial-venta-row">
          <div class="historial-fecha">${formatFecha(v.fecha)}</div>
          <div class="historial-info">
            <span>${v.maples_entregados} maple${v.maples_entregados !== 1 ? 's' : ''}</span>
            ${v.tipo_huevo ? `<span class="historial-tipo">${v.tipo_huevo}</span>` : ''}
            ${v.notas ? `<span class="historial-tipo">📝 ${v.notas}</span>` : ''}
          </div>
          <div class="historial-total">${formatPesos(v.total)}</div>
          <div class="historial-estado" style="color:${colorEstado(v.estado)}">${labelEstado(v.estado)}</div>
        </div>`).join('');
    } catch(e) {
      const hist = document.getElementById('cliente-historial');
      if (hist) hist.innerHTML = '<p class="sin-alertas">Error cargando historial</p>';
    }
  }

  // ── NUEVA VENTA VINCULADA A CLIENTE ──────────────────────────
  function abrirNuevaVenta(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId) || clienteActual;
    const config  = typeof ModuloConfiguracion !== 'undefined' ? ModuloConfiguracion.obtenerConfig() : {};
    const precioRef = config.precio_grande || '';

    const modalHtml = `
    <div class="modal-overlay" id="modal-venta-cliente" onclick="ModuloClientes.cerrarModal('modal-venta-cliente', event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">💰 Nueva venta — ${cliente?.nombre || 'Cliente'}</p>

        <div class="campo-grupo">
          <label class="campo-label">📅 Fecha</label>
          <input class="campo-input" id="mvc-fecha" type="date" value="${fechaHoy()}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">📦 Cantidad de maples</label>
          <div class="contador-grande contador-secundario" style="justify-content:flex-start;gap:8px">
            <button class="btn-numero" onclick="ModuloClientes.ajustarMaples(-1)">−</button>
            <span class="contador-valor" id="mvc-maples-val" style="min-width:40px;text-align:center">1</span>
            <button class="btn-numero" onclick="ModuloClientes.ajustarMaples(1)">+</button>
            <button class="btn-numero" onclick="ModuloClientes.ajustarMaples(5)">+5</button>
            <button class="btn-numero" onclick="ModuloClientes.ajustarMaples(10)">+10</button>
          </div>
          <input type="hidden" id="mvc-maples" value="1">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">🥚 Tipo de huevo</label>
          <div class="rol-selector">
            ${TIPOS_HUEVO.map((t, i) => `
              <button class="rol-opcion ${i===0?'seleccionado':''}"
                onclick="ModuloClientes.selMvc('mvc-tipo', '${t}', this)">${t}</button>
            `).join('')}
          </div>
          <input type="hidden" id="mvc-tipo" value="${TIPOS_HUEVO[0]}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">💵 Precio por maple ($)</label>
          <input class="campo-input" id="mvc-precio" type="number" min="0"
            placeholder="Ej: 3500" value="${precioRef}"
            oninput="ModuloClientes.calcularTotalVenta()">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Estado</label>
          <div class="rol-selector">
            <button class="rol-opcion seleccionado" onclick="ModuloClientes.selMvc('mvc-estado','entregado',this)">✅ Entregado</button>
            <button class="rol-opcion" onclick="ModuloClientes.selMvc('mvc-estado','pendiente',this)">⏳ Pendiente</button>
            <button class="rol-opcion" onclick="ModuloClientes.selMvc('mvc-estado','cobrado',this)">💰 Cobrado</button>
          </div>
          <input type="hidden" id="mvc-estado" value="entregado">
        </div>

        <div class="venta-total-preview" id="mvc-total-preview">Total: $ —</div>

        <button class="btn-primary btn-full" onclick="ModuloClientes.guardarVentaCliente('${clienteId}')">
          💾 Registrar venta
        </button>
        <button class="btn-secondary btn-full" onclick="ModuloClientes.cerrarModal('modal-venta-cliente')">
          Cancelar
        </button>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    calcularTotalVenta();
  }

  let _maplesVenta = 1;
  function ajustarMaples(delta) {
    _maplesVenta = Math.max(1, _maplesVenta + delta);
    const el  = document.getElementById('mvc-maples-val');
    const inp = document.getElementById('mvc-maples');
    if (el) el.textContent = _maplesVenta;
    if (inp) inp.value = _maplesVenta;
    calcularTotalVenta();
  }

  function calcularTotalVenta() {
    const maples = _maplesVenta || parseInt(document.getElementById('mvc-maples')?.value) || 0;
    const precio = parseFloat(document.getElementById('mvc-precio')?.value) || 0;
    const el = document.getElementById('mvc-total-preview');
    if (el) el.textContent = `Total: ${formatPesos(maples * precio)}`;
  }

  function selMvc(hiddenId, valor, btn) {
    const grupo = btn.closest('.campo-grupo');
    grupo?.querySelectorAll('.rol-opcion').forEach(b => b.classList.remove('seleccionado'));
    btn.classList.add('seleccionado');
    const inp = document.getElementById(hiddenId);
    if (inp) inp.value = valor;
    if (hiddenId === 'mvc-precio') calcularTotalVenta();
  }

  async function guardarVentaCliente(clienteId) {
    const maples = _maplesVenta;
    const precio = parseFloat(document.getElementById('mvc-precio')?.value);
    const fecha  = document.getElementById('mvc-fecha')?.value;
    const tipo   = document.getElementById('mvc-tipo')?.value;
    const estado = document.getElementById('mvc-estado')?.value;

    if (!maples || maples < 1) { UI.mostrarToast('Ingresá la cantidad de maples', 'error'); return; }
    if (!precio || precio <= 0) { UI.mostrarToast('Ingresá el precio', 'error'); return; }

    const cliente = clientes.find(c => c.id === clienteId) || clienteActual;
    const venta = {
      fecha,
      cliente_id:        clienteId,
      cliente_nombre:    cliente?.nombre || '',
      tipo_huevo:        tipo,
      maples_entregados: maples,
      precio_maple:      precio,
      total:             maples * precio,
      estado,
      canal:             'directo'
    };

    const res = await DB.insertarVenta(venta);
    if (res.ok) {
      await DB.actualizarCliente(clienteId, { ultima_compra: fecha });
      UI.mostrarToast(`✅ Venta registrada — ${formatPesos(venta.total)}`, 'success');
      _maplesVenta = 1;
      cerrarModal('modal-venta-cliente');
      clientes = await DB.obtenerClientes();
      verDetalle(clienteId);
    } else {
      UI.mostrarToast('Error al guardar. Revisá conexión.', 'error');
    }
  }

  // ── WHATSAPP CON MENSAJES EDITABLES ──────────────────────────
  function enviarWhatsApp(id, tipo = 'saludo') {
    const cliente = clientes.find(c => c.id === id) || clienteActual;
    if (!cliente?.telefono) {
      UI.mostrarToast('⚠️ Este cliente no tiene teléfono registrado', 'warning'); return;
    }

    const msjs = obtenerMensajes();
    const plantilla = msjs[tipo] || msjs.saludo;
    const nombre = cliente.nombre.split(' ')[0];
    const texto  = plantilla.replace(/{nombre}/g, nombre);
    const numero = cliente.telefono.replace(/\D/g, '');
    const url    = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

    DB.registrarMensajeWhatsApp();  // Contadar de impacto de la app
    window.open(url, '_blank');
  }

  function verMensajes(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId) || clienteActual;
    if (!cliente) return;

    const msjs = obtenerMensajes();
    const nombre = cliente.nombre.split(' ')[0];

    const tipos = [
      { tipo: 'reactivar',      label: '💤 Cliente inactivo',      plantilla: msjs.reactivar },
      { tipo: 'disponibilidad', label: '📦 Hay maples disponibles', plantilla: msjs.disponibilidad },
      { tipo: 'saludo',         label: '👋 Saludo genérico',        plantilla: msjs.saludo },
      { tipo: 'promo',          label: '🎁 Enviar Oferta/Promo',    plantilla: msjs.promo || MENSAJES_DEFAULT.promo },
    ];

    const modalHtml = `
    <div class="modal-overlay" id="modal-mensajes" onclick="ModuloClientes.cerrarModal('modal-mensajes', event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">💬 Mensajes para ${cliente.nombre}</p>
        <p style="font-size:0.8rem;color:var(--texto-terciario);margin-bottom:12px">Tocá un mensaje para enviarlo. Podés editar el texto antes de enviar.</p>
        ${tipos.map(m => {
          const textoFinal = m.plantilla.replace(/{nombre}/g, nombre);
          return `
          <div class="mensaje-template">
            <div class="msj-label">${m.label}</div>
            <textarea class="msj-editable" id="msj-${m.tipo}" rows="3">${textoFinal}</textarea>
            <button class="btn-wsp-enviar" onclick="ModuloClientes.enviarMensajeEditado('${clienteId}','${m.tipo}')">
              💬 Enviar por WhatsApp →
            </button>
            <button class="msj-guardar-template" onclick="ModuloClientes.guardarTemplate('${m.tipo}')">
              💾 Guardá como plantilla
            </button>
          </div>`;
        }).join('')}
        <button class="btn-secondary btn-full" style="margin-top:12px" onclick="ModuloClientes.cerrarModal('modal-mensajes')">
          Cerrar
        </button>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function enviarMensajeEditado(clienteId, tipo) {
    const cliente = clientes.find(c => c.id === clienteId) || clienteActual;
    if (!cliente?.telefono) {
      UI.mostrarToast('⚠️ Sin teléfono registrado', 'warning'); return;
    }
    const texto  = document.getElementById(`msj-${tipo}`)?.value || '';
    const numero = cliente.telefono.replace(/\D/g, '');
    const url    = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    DB.registrarMensajeWhatsApp();
    window.open(url, '_blank');
  }

  function guardarTemplate(tipo) {
    const texto = document.getElementById(`msj-${tipo}`)?.value || '';
    if (!texto.trim()) { UI.mostrarToast('El mensaje está vacío', 'warning'); return; }
    guardarMensajeTemplate(tipo, texto);
    UI.mostrarToast('✅ Plantilla guardada', 'success');
  }

  // ── FORMULARIO ALTA / EDITAR ──────────────────────────────────
  function mostrarNuevo()      { abrirFormCliente(null); }
  function mostrarEditar(id)   { abrirFormCliente(clientes.find(c => c.id === id)); }

  function abrirFormCliente(cliente) {
    const modalHtml = `
    <div class="modal-overlay" id="modal-cliente-form" onclick="ModuloClientes.cerrarModal('modal-cliente-form', event)">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <p class="modal-titulo">${cliente ? '✏️ Editar cliente' : '👤 Nuevo cliente'}</p>
        <input type="hidden" id="cf-id" value="${cliente?.id || ''}">

        <div class="campo-grupo">
          <label class="campo-label">Nombre completo *</label>
          <input class="campo-input" id="cf-nombre" type="text"
            placeholder="Ej: María González" value="${cliente?.nombre || ''}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Teléfono (WhatsApp) *</label>
          <input class="campo-input" id="cf-telefono" type="tel"
            placeholder="Ej: 2624123456" value="${cliente?.telefono || ''}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Tipo de cliente</label>
          <div class="rol-selector">
            ${TIPOS_CLIENTE.map(t => `
              <button class="rol-opcion ${(cliente?.tipo || 'particular') === t ? 'seleccionado' : ''}"
                onclick="ModuloClientes.selMvc('cf-tipo','${t}',this)">
                ${TIPOS_LABEL[t]}
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="cf-tipo" value="${cliente?.tipo || 'particular'}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">¿Con qué frecuencia compra?</label>
          <div class="rol-selector">
            ${FRECUENCIAS.map(f => `
              <button class="rol-opcion ${(cliente?.frecuencia || 'quincenal') === f.clave ? 'seleccionado' : ''}"
                onclick="ModuloClientes.selMvc('cf-frecuencia','${f.clave}',this)">
                ${f.label}
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="cf-frecuencia" value="${cliente?.frecuencia || 'quincenal'}">
        </div>

        <div class="campo-grupo">
          <label class="campo-label">Zona / Barrio (opcional)</label>
          <input class="campo-input" id="cf-zona" type="text"
            placeholder="Ej: Centro, Las Heras" value="${cliente?.zona || ''}">
        </div>

        <!-- GEOLOCALIZACIÓN DUAL -->
        <div class="campo-grupo">
          <label class="campo-label">📍 Ubicación del cliente</label>
          <div class="geo-bloque">
            <!-- Opción A: GPS en tiempo real -->
            <button class="geo-btn-gps" type="button" onclick="ModuloClientes.captarGPS()">
              📡 Capturar mi ubicación actual
            </button>
            <!-- Opción B: Pegar link de WhatsApp -->
            <div class="geo-link-wrap">
              <input class="campo-input" id="cf-link-ubicacion"
                type="text"
                placeholder="Pegá el link de Google Maps que te envió el cliente"
                oninput="ModuloClientes.parsearLinkUbicacion(this.value)">
            </div>
            <!-- Coordenadas capturadas -->
            <div class="geo-resultado hidden" id="geo-resultado">
              <span class="geo-icono">✅</span>
              <span id="geo-texto">—</span>
              <a id="geo-ver-mapa" href="" target="_blank" class="geo-ver-mapa">Ver en mapa</a>
              <button class="geo-limpiar" onclick="ModuloClientes.limpiarGeo()">✕</button>
            </div>
          </div>
          <input type="hidden" id="cf-lat" value="${cliente?.lat || ''}">
          <input type="hidden" id="cf-lng" value="${cliente?.lng || ''}">
          ${cliente?.lat && cliente?.lng ? `
            <div class="geo-resultado" style="margin-top:6px">
              <span class="geo-icono">📍</span>
              <span>${parseFloat(cliente.lat).toFixed(5)}, ${parseFloat(cliente.lng).toFixed(5)}</span>
              <a href="https://www.google.com/maps?q=${cliente.lat},${cliente.lng}" target="_blank" class="geo-ver-mapa">Ver en mapa</a>
            </div>` : ''}
        </div>

        <!-- Captado por la app -->
        <label class="campo-check-label">
          <input type="checkbox" id="cf-app" class="campo-check" ${cliente?.captado_por_app ? 'checked' : ''}>
          <span>⭐ Este cliente llegó gracias a la App</span>
        </label>
        <p class="campo-check-help">Marcalo así podemos medir el impacto que tiene la app en tu negocio</p>

        <div class="campo-grupo">
          <label class="campo-label">Observaciones (opcional)</label>
          <textarea class="campo-obs" id="cf-obs"
            placeholder="Ej: Prefiere huevos extra grandes, paga en efectivo">${cliente?.observaciones || ''}</textarea>
        </div>

        <button class="btn-primary btn-full" onclick="ModuloClientes.guardarCliente()">
          💾 ${cliente ? 'Guardar cambios' : 'Crear cliente'}
        </button>
        <button class="btn-secondary btn-full" onclick="ModuloClientes.cerrarModal('modal-cliente-form')">
          Cancelar
        </button>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  async function guardarCliente() {
    const id          = document.getElementById('cf-id')?.value?.trim();
    const nombre      = document.getElementById('cf-nombre')?.value?.trim();
    const telefono    = document.getElementById('cf-telefono')?.value?.trim();
    const tipo        = document.getElementById('cf-tipo')?.value || 'particular';
    const frecuencia  = document.getElementById('cf-frecuencia')?.value || 'quincenal';
    const zona        = document.getElementById('cf-zona')?.value?.trim() || null;
    const captadoApp  = document.getElementById('cf-app')?.checked || false;
    const obs         = document.getElementById('cf-obs')?.value?.trim() || null;
    const lat         = document.getElementById('cf-lat')?.value || null;
    const lng         = document.getElementById('cf-lng')?.value || null;

    if (!nombre)   { UI.mostrarToast('El nombre es obligatorio', 'warning'); return; }
    if (!telefono) { UI.mostrarToast('El teléfono es obligatorio', 'warning'); return; }

    const datos = { nombre, telefono, tipo, frecuencia, zona, observaciones: obs, activo: true,
                    captado_por_app: captadoApp,
                    lat: lat ? parseFloat(lat) : null,
                    lng: lng ? parseFloat(lng) : null };
    let res;
    if (id) {
      res = await DB.actualizarCliente(id, datos);
    } else {
      res = await DB.insertarCliente(datos);
    }

    if (res.ok) {
      UI.mostrarToast(id ? '✅ Cliente actualizado' : '✅ Cliente creado', 'success');
      cerrarModal('modal-cliente-form');
      await cargarClientes();
      if (id) verDetalle(id);
    } else {
      UI.mostrarToast('Error al guardar cliente', 'error');
    }
  }

  // ── GEO: capturar GPS en tiempo real ─────────────────────────────────────
  function captarGPS() {
    if (!navigator.geolocation) {
      UI.mostrarToast('⚠️ Tu dispositivo no soporta GPS', 'error'); return;
    }
    UI.mostrarToast('📡 Obteniendo ubicación...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(7);
        const lng = pos.coords.longitude.toFixed(7);
        aplicarCoordenadas(lat, lng);
        UI.mostrarToast(`📍 Ubicación capturada ±${Math.round(pos.coords.accuracy)}m`, 'success');
      },
      (err) => {
        const msgs = { 1: 'Permíso de GPS denegado', 2: 'No se pudo obtener la posición', 3: 'Tiempo de espera agotado' };
        UI.mostrarToast('⚠️ ' + (msgs[err.code] || 'Error GPS'), 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Parsear link de Google Maps enviado por WhatsApp
  // Formatos: maps.google.com/?q=LAT,LNG | goo.gl/maps/... | maps.app.goo.gl/...
  function parsearLinkUbicacion(link) {
    if (!link || link.length < 5) return;

    // Formato directo: ?q=LAT,LNG o @LAT,LNG
    const regexQ = /[?&@]q?=?(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/;
    const matchQ = link.match(regexQ);
    if (matchQ) {
      aplicarCoordenadas(parseFloat(matchQ[1]).toFixed(7), parseFloat(matchQ[2]).toFixed(7));
      return;
    }

    // Formato WhatsApp: geo:LAT,LNG
    const regexGeo = /geo:(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchGeo = link.match(regexGeo);
    if (matchGeo) {
      aplicarCoordenadas(parseFloat(matchGeo[1]).toFixed(7), parseFloat(matchGeo[2]).toFixed(7));
      return;
    }

    // Si es un link corto (goo.gl, maps.app.goo.gl), avisamos que lo abra primero
    if (link.includes('goo.gl') || link.includes('maps.app')) {
      UI.mostrarToast('📌 Abrí el link, copiá las coordenadas y pegalas acá', 'info');
    }
  }

  function aplicarCoordenadas(lat, lng) {
    document.getElementById('cf-lat').value = lat;
    document.getElementById('cf-lng').value = lng;
    const res = document.getElementById('geo-resultado');
    const txt = document.getElementById('geo-texto');
    const link = document.getElementById('geo-ver-mapa');
    if (res && txt && link) {
      txt.textContent = `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
      link.href = `https://www.google.com/maps?q=${lat},${lng}`;
      res.classList.remove('hidden');
    }
  }

  function limpiarGeo() {
    document.getElementById('cf-lat').value = '';
    document.getElementById('cf-lng').value = '';
    document.getElementById('cf-link-ubicacion').value = '';
    document.getElementById('geo-resultado')?.classList.add('hidden');
  }

  // ── MODAL ─────────────────────────────────────────────────────
  function cerrarModal(id, event) {
    if (event && event.target.id !== id) return;
    document.getElementById(id)?.remove();
  }

  // ── HELPERS ───────────────────────────────────────────────────
  function avatarTipo(tipo) {
    return { particular: '🏠', almacen: '🏪', restaurante: '🍽️', verduleria: '🥬', distribuidor: '🚛' }[tipo] || '👤';
  }

  function diasDesdeUltimaCompra(fecha) {
    if (!fecha) return 999;
    return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  }

  function formatPesos(n) {
    if (!n) return '$ 0';
    return '$ ' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
  }

  function formatFecha(fecha) {
    if (!fecha) return '—';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  function fechaHoy() { return new Date().toISOString().split('T')[0]; }

  function colorEstado(e) {
    return { cobrado: '#4caf50', entregado: '#2196f3', pendiente: '#ff9800', cancelado: '#f44336' }[e] || '#666';
  }

  function labelEstado(e) {
    return { cobrado: '💰 Cobrado', entregado: '✅ Entregado', pendiente: '⏳ Pendiente', cancelado: '❌ Cancelado' }[e] || e;
  }

  return {
    render, postRender,
    filtrar, verDetalle, mostrarNuevo, mostrarEditar,
    abrirNuevaVenta, guardarVentaCliente, ajustarMaples, calcularTotalVenta, selMvc,
    enviarWhatsApp, verMensajes, enviarMensajeEditado, guardarTemplate,
    guardarCliente, cerrarModal, mostrarInactivos,
    captarGPS, parsearLinkUbicacion, limpiarGeo,
  };
})();
