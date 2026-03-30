// auth.js — Autenticación con Supabase Auth + fallback demo
const Auth = (() => {

  // Usuario demo (funciona sin Supabase o credenciales)
  const USUARIO_DEMO = {
    id: 'demo-001',
    auth_id: 'demo-001',
    email: 'admin@granja.ar',
    nombre: 'Familia García',
    granja: 'Granja La Esperanza',
    nivel: 3,
    tipo_produccion: 'Campero',
    avatar: '👨‍🌾',
    rol: 'admin'
  };

  let usuarioActual = null;

  // ── LOGIN ─────────────────────────────────────────────────────
  async function iniciarSesion(email, password) {
    const db = obtenerSupabase();

    // Modo demo siempre disponible
    if (email === 'admin@granja.ar' && password === 'demo1234') {
      usuarioActual = USUARIO_DEMO;
      localStorage.setItem('gfi_usuario', JSON.stringify(USUARIO_DEMO));
      return { ok: true, usuario: USUARIO_DEMO };
    }

    // Sin Supabase configurado
    if (!db) return { ok: false, error: 'Sin conexión. Usá admin@granja.ar / demo1234 para la demo.' };

    try {
      // 1. Autenticar con Supabase Auth
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.includes('Invalid') ? 'Email o contraseña incorrectos' : error.message;
        return { ok: false, error: msg };
      }

      // 2. Verificar perfil de aprobación
      const { data: perfil, error: perfilError } = await db
        .from('perfiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Si el perfil existe, verificar acceso
      if (perfil && !perfilError) {
        // Admins siempre pasan (aunque aprobado sea false)
        if (!perfil.es_admin) {
          // Verificar aprobación
          if (!perfil.aprobado) {
            await db.auth.signOut();
            return { ok: false, pendiente: true, error: 'Tu cuenta está pendiente de aprobación.' };
          }
          // Verificar vencimiento de suscripción
          if (perfil.vence_el && new Date(perfil.vence_el) < new Date()) {
            await db.auth.signOut();
            return { ok: false, vencido: true, error: 'Tu suscripción venció. Contactá al administrador.' };
          }
        }
      }
      // Si perfil es null → tabla no existe o usuario anterior al trigger → dejar pasar

      // 4. Buscar perfil en tabla usuarios (para datos UX)
      const { data: usuarioDB } = await db
        .from('usuarios')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (usuarioDB) {
        usuarioActual = { ...usuarioDB, email: data.user.email, es_admin: perfil?.es_admin || false };
      } else {
        const nuevoPerfil = { auth_id: data.user.id, nombre: data.user.email.split('@')[0], rol: 'operador', activo: true };
        await db.from('usuarios').insert([nuevoPerfil]);
        usuarioActual = { ...USUARIO_DEMO, ...nuevoPerfil, email: data.user.email, es_admin: perfil?.es_admin || false };
      }

      if (!usuarioActual.granja)  usuarioActual.granja  = perfil?.granja_nombre || 'Mi Granja';
      if (!usuarioActual.nivel)   usuarioActual.nivel   = 1;
      if (!usuarioActual.avatar)  usuarioActual.avatar  = perfil?.avatar || '👨‍🌾';

      localStorage.setItem('gfi_usuario', JSON.stringify(usuarioActual));
      return { ok: true, usuario: usuarioActual };

    } catch (e) {
      console.error('Error login:', e);
      return { ok: false, error: 'Error de conexión. Intentá de nuevo.' };
    }
  }

  // ── REGISTRO ──────────────────────────────────────────────────
  async function registrar(email, password, nombre, nombreGranja) {
    const db = obtenerSupabase();
    if (!db) return { ok: false, error: 'Sin conexión a Supabase' };

    try {
      // Registrar en Supabase Auth — el trigger crea el perfil con aprobado=false
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { data: { nombre: nombre || email.split('@')[0] } }
      });
      if (error) return { ok: false, error: error.message };

      // Crear registro en tabla usuarios también
      await db.from('usuarios').insert([{
        auth_id: data.user.id,
        nombre: nombre || email.split('@')[0],
        rol: 'operador',
        activo: true
      }]);

      return {
        ok: true,
        pendiente: true,
        mensaje: '✅ Cuenta creada. Aguardá la aprobación del administrador para acceder.'
      };
    } catch (e) {
      return { ok: false, error: 'Error al registrar. Intentá de nuevo.' };
    }
  }

  // ── SESIÓN ACTIVA ─────────────────────────────────────────────
  async function verificarSesionActiva() {
    const db = obtenerSupabase();

    // Modo demo: verificar localStorage
    if (!db) {
      const guardado = localStorage.getItem('gfi_usuario');
      if (guardado) { usuarioActual = JSON.parse(guardado); return usuarioActual; }
      return null;
    }

    try {
      // Verificar sesión en Supabase
      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        // Intentar desde localStorage como backup
        const guardado = localStorage.getItem('gfi_usuario');
        if (guardado) {
          const u = JSON.parse(guardado);
          // Solo válido si es demo
          if (u.id === 'demo-001') { usuarioActual = u; return u; }
        }
        return null;
      }

      // Sesión válida: cargar perfil
      const { data: usuarioBD } = await db
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();
        
      const { data: perfil } = await db
        .from('perfiles')
        .select('plan, aprobado')
        .eq('id', session.user.id)
        .single();

      usuarioActual = {
        ...(usuarioBD || {}),
        email: session.user.email,
        granja: usuarioBD?.granja || 'Mi Granja',
        nivel:  usuarioBD?.nivel  || 1,
        avatar: usuarioBD?.avatar || '👨‍🌾',
        plan:   perfil?.plan || 'trial',
        aprobado: perfil?.aprobado || false
      };
      localStorage.setItem('gfi_usuario', JSON.stringify(usuarioActual));
      return usuarioActual;

    } catch (e) {
      console.warn('Error verificando sesión:', e);
      return null;
    }
  }

  // ── OBTENER USUARIO ───────────────────────────────────────────
  function obtenerUsuario() {
    if (usuarioActual) return usuarioActual;
    const guardado = localStorage.getItem('gfi_usuario');
    if (guardado) { try { usuarioActual = JSON.parse(guardado); return usuarioActual; } catch(_) {} }
    return null;
  }

  // ── CERRAR SESIÓN ─────────────────────────────────────────────
  async function cerrarSesion() {
    const db = obtenerSupabase();
    if (db) await db.auth.signOut().catch(() => {});
    usuarioActual = null;
    localStorage.removeItem('gfi_usuario');
    location.reload();
  }

  function obtenerNivel() {
    return obtenerUsuario()?.nivel || 1;
  }

  return { iniciarSesion, registrar, verificarSesionActiva, obtenerUsuario, cerrarSesion, obtenerNivel };
})();
