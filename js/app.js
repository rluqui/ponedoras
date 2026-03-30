// app.js — Núcleo de la aplicación: router, UI helpers, login
const App = (() => {

  const MODULOS = {
    hoy:            ModuloHoy,
    granja:         ModuloGranja,
    produccion:     ModuloProduccion,
    equipo:         ModuloEquipo,
    ventas:         ModuloVentas,
    clientes:       ModuloClientes,
    plantel:        ModuloPlantel,
    lotes:          ModuloPlantel,   // alias directo al módulo de lotes
    redes:          ModuloRedes,
    inspeccion:     ModuloInspeccion,
    configuracion:  ModuloConfiguracion,
    dashboard:      ModuloDashboard
  };

  let tabActiva = 'hoy';

  // ── INICIALIZACIÓN ───────────────────────────────────────────
  function iniciar() {
    inicializarSupabase();

    // Splash screen (1.5s)
    setTimeout(async () => {
      document.getElementById('pantalla-carga').classList.add('hidden');
      
      // Auto-refresh token y perfil en cada arranque para asegurar SaaS
      await Auth.verificarSesionActiva();
      
      const usuario = Auth.obtenerUsuario();
      if (usuario && usuario.id !== 'demo-001') {
        mostrarApp(usuario);
      } else if (usuario && usuario.id === 'demo-001') {
        mostrarApp(usuario); // Permitir acceso rápido al demo si lo tienen cacheado
      } else {
        document.getElementById('pantalla-login').classList.remove('hidden');
        configurarLogin();
      }
    }, 1500);
  }

  // ── LOGIN ─────────────────────────────────────────────────────
  function configurarLogin() {
    const form = document.getElementById('form-login');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn      = document.getElementById('btn-login');
      btn.disabled   = true;
      btn.textContent = '⏳ Ingresando…';

      const res = await Auth.iniciarSesion(email, password);
      if (res.ok) {
        document.getElementById('pantalla-login').classList.add('hidden');
        mostrarApp(res.usuario);
      } else if (res.pendiente) {
        // Cuenta registrada pero esperando aprobación del admin
        mostrarPantallaEstado(
          '⏳ Cuenta pendiente',
          'Tu cuenta fue creada correctamente.<br><br>El administrador debe aprobar tu acceso. Te avisaremos cuando puedas entrar.',
          '📧 Si tenés dudas, contactá al administrador de la granja.'
        );
      } else if (res.vencido) {
        // Suscripción vencida
        mostrarPantallaEstado(
          '⚠️ Suscripción vencida',
          'Tu acceso venció.<br><br>Contactá al administrador para renovar tu plan y volver a ingresar.',
          '🔄 Volver al login',
          () => location.reload()
        );
      } else {
        const err = document.getElementById('login-error');
        err.textContent = res.error;
        err.classList.remove('hidden');
        btn.disabled    = false;
        btn.innerHTML   = '<span>Ingresar a la granja 🌾</span>';
      }
    });
  }

  function mostrarPantallaEstado(titulo, mensaje, accion, onAccion) {
    document.getElementById('pantalla-login').classList.add('hidden');
    const pantalla = document.getElementById('pantalla-estado');
    if (!pantalla) return;
    document.getElementById('estado-titulo').textContent = titulo;
    document.getElementById('estado-mensaje').innerHTML  = mensaje;
    const btnAcc = document.getElementById('estado-accion');
    if (btnAcc) {
      btnAcc.textContent = accion;
      btnAcc.onclick = onAccion || (() => location.reload());
    }
    pantalla.classList.remove('hidden');
  }

  function toggleLoginTab(tab) {
    const mostrarLogin    = tab === 'ingresar';
    document.getElementById('form-login').classList.toggle('hidden', !mostrarLogin);
    document.getElementById('form-registro').classList.toggle('hidden', mostrarLogin);
    document.getElementById('tab-ingresar').classList.toggle('active', mostrarLogin);
    document.getElementById('tab-registrar').classList.toggle('active', !mostrarLogin);
    // Limpiar errores
    ['login-error', 'reg-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });
  }

  function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const visible = input.type === 'text';
    input.type      = visible ? 'password' : 'text';
    btn.textContent = visible ? '👁️' : '🙈';
  }

  async function loginDemo() {
    const btn = document.querySelector('.btn-demo');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Cargando demo…'; }
    const res = await Auth.iniciarSesion('admin@granja.ar', 'demo1234');
    document.getElementById('pantalla-login').classList.add('hidden');
    mostrarApp(res.usuario);
  }

  async function registrar() {
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn      = document.getElementById('btn-registrar');
    const err      = document.getElementById('reg-error');

    if (!email || !password) {
      err.textContent = 'Completá email y contraseña'; err.classList.remove('hidden'); return;
    }
    if (password.length < 6) {
      err.textContent = 'La contraseña debe tener al menos 6 caracteres'; err.classList.remove('hidden'); return;
    }
    btn.disabled = true; btn.textContent = '⏳ Creando cuenta…';

    const res = await Auth.registrar(email, password, nombre);
    if (res.ok) {
      err.style.color = 'var(--verde-brillante)';
      err.textContent = '✅ ' + res.mensaje;
      err.classList.remove('hidden');
      btn.textContent = 'Cuenta creada';
    } else {
      err.textContent = res.error;
      err.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = '<span>Crear mi cuenta gratis 🐔</span>';
    }
  }

  async function recuperarPassword() {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
      UI.mostrarToast('Ingresá tu email primero', 'warning'); return;
    }
    const db = obtenerSupabase();
    if (!db) { UI.mostrarToast('Sin conexión a Supabase', 'warning'); return; }
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/index.html'
    });
    if (!error) UI.mostrarToast('📧 Te enviamos un email para recuperar tu contraseña', 'success');
    else UI.mostrarToast('Error: ' + error.message, 'error');
  }

  // ── MOSTRAR APP ──────────────────────────────────────────────
  function mostrarApp(usuario) {
    const appEl = document.getElementById('app-principal');
    appEl.classList.remove('hidden');

    // Actualizar header
    document.getElementById('top-nombre-granja').textContent = usuario.granja || 'Mi Granja';
    actualizarFecha();

    // Banner SuperAdmin
    const activ = Auth.getTenantActivo();
    if (activ && activ !== usuario.granja_id) {
      const banner = document.getElementById('banner-superadmin');
      const bname  = document.getElementById('superadmin-tenant-name');
      if (banner && bname) {
        banner.style.display = 'flex';
        bname.textContent = localStorage.getItem('gfi_tenant_name') || activ.substring(0,8);
      }
    }

    // Badge de granja (sin número de nivel para no confundir al productor)
    const nivel = CONFIG.NIVELES[usuario.nivel || 1];
    document.getElementById('nivel-texto').textContent = `${nivel.icono} ${nivel.nombre}`;

    // Configurar navegación
    configurarNav();

    // El botón ⚙️ ya tiene onclick="App.navegar('configuracion')" en el HTML.
    // Solo se guarda referencia para mostrar info de usuario si se necesita en el futuro.

    // Iniciar asistente IA flotante
    if (typeof Asistente !== 'undefined') Asistente.iniciar();

    // Navegar a HOY
    navegar('hoy');

    // Verificar progreso del productor en segundo plano (sin bloquear UI)
    // Si subió de nivel, muestra modal de celebración automáticamente
    if (typeof Progreso !== 'undefined') {
      setTimeout(() => Progreso.verificarNivel(), 2000);
    }

    // Actualizar fecha cada minuto
    setInterval(actualizarFecha, 60000);
  }

  // ── NAVEGACIÓN ───────────────────────────────────────────────
  function configurarNav() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => navegar(btn.dataset.tab));
    });
  }

  async function navegar(tab) {
    const modulo = MODULOS[tab];
    if (!modulo) return;

    tabActiva = tab;

    // Actualizar nav items
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    // Si el módulo puede precargar datos, hacerlo antes del render
    if (modulo.cargarDatos) {
      try { await modulo.cargarDatos(); } catch (e) { console.warn('Error precargando datos:', e); }
    }

    // Renderizar módulo
    const contenedor = document.getElementById('contenido-principal');
    contenedor.innerHTML = modulo.render();
    contenedor.scrollTop = 0;

    // Post-render asíncrono (carga lazy de Supabase)
    if (modulo.postRender) {
      try { modulo.postRender(); } catch (e) { console.warn('Error postRender:', e); }
    }
  }

  // ── FECHA ─────────────────────────────────────────────────────
  function actualizarFecha() {
    const el = document.getElementById('top-fecha');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  return { iniciar, navegar, toggleLoginTab, loginDemo, registrar, recuperarPassword, togglePassword };
})();

// ── UI HELPERS ────────────────────────────────────────────────
const UI = (() => {

  function mostrarToast(mensaje, tipo = 'success') {
    const cont  = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
      <span>${tipo === 'success' ? '✅' : tipo === 'warning' ? '⚠️' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${mensaje}</span>`;
    cont.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function mostrarModal(html) {
    document.getElementById('modal-contenido').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function cerrarModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  return { mostrarToast, mostrarModal, cerrarModal };
})();

// ── ARRANQUE ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Modal cerrar
  document.getElementById('modal-cerrar').onclick = UI.cerrarModal;
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) UI.cerrarModal();
  });
  App.iniciar();
});
