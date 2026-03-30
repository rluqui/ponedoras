// db.js — Capa de datos: funciones para leer/escribir en Supabase
// Cada función tiene fallback a datos demo si no hay conexión
const DB = (() => {

  // Utilidad para evitar errores de type UUID ("demo-001" en modo demo)
  function getOperadorUUID() {
    const u = Auth.obtenerUsuario();
    if (!u || !u.id) return null;
    return u.id.length === 36 ? u.id : null;
  }

  // ── PRODUCCIÓN DIARIA ─────────────────────────────────────────

  async function obtenerProduccionHoy() {
    const db = obtenerSupabase();
    const hoy = new Date().toISOString().split('T')[0];
    if (!db) return null;  // null = sin conexión, el caller decide qué mostrar

    const { data, error } = await db
      .from('produccion_diaria')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .eq('fecha', hoy);

    if (error) { console.warn('Error produccion_diaria:', error.message); return null; }
    if (!data?.length) return null;  // null = sin registros hoy

    // Calcular peor estado de agua (sin_agua > baja > normal)
    const peorAgua = data.reduce((peor, r) => {
      const orden = { 'sin_agua': 2, 'baja': 1, 'normal': 0 };
      return (orden[r.estado_agua] ?? 0) > (orden[peor] ?? 0) ? r.estado_agua : peor;
    }, 'normal');

    const peorAlimento = data.reduce((peor, r) => {
      const orden = { 'sin_alimento': 2, 'bajo': 1, 'normal': 0 };
      return (orden[r.estado_alimento] ?? 0) > (orden[peor] ?? 0) ? r.estado_alimento : peor;
    }, 'normal');

    return {
      huevos:    data.reduce((s, r) => s + (parseInt(r.huevos)    || 0), 0),
      rotos:     data.reduce((s, r) => s + (parseInt(r.rotos)     || 0), 0),
      mortandad: data.reduce((s, r) => s + (parseInt(r.mortandad) || 0), 0),
      maples:    Math.floor(data.reduce((s, r) => s + (parseInt(r.huevos) || 0), 0) / 30),
      agua:      peorAgua,
      alimento:  peorAlimento,
      registros: data  // para cálculos adicionales
    };
  }

  async function obtenerProduccionSemana() {
    const db = obtenerSupabase();
    if (!db) return [];
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const { data } = await db
      .from('produccion_diaria')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .gte('fecha', hace7)
      .order('fecha', { ascending: false });
    return data || [];
  }

  async function obtenerMapaOperadores() {
     const db = obtenerSupabase();
     if (!db) return {};
     const { data } = await db.from('perfiles').select('id, nombre');
     const mapa = {};
     if (data) data.forEach(p => mapa[p.id] = p.nombre);
     return mapa;
  }

  async function obtenerUltimasProducciones() {
    const db = obtenerSupabase();
    if (!db) return [{ fecha: new Date().toISOString().split('T')[0], galpon: 'Galpón Demo', huevos: 154, operador_nombre: 'Demo' }];
    
    const { data } = await db
      .from('produccion_diaria')
      .select('fecha, galpon, huevos, operador_id')
      .eq('granja_id', Auth.getTenantActivo())
      .order('creado_en', { ascending: false })
      .limit(5);
      
    const mapaOperadores = await obtenerMapaOperadores();
    if (data) {
       data.forEach(p => {
           p.operador_nombre = mapaOperadores[p.operador_id] || (p.operador_id ? 'Usuario Inválido' : 'Sistema / Automático');
       });
    }
    return data || [];
  }

  async function obtenerProduccionFecha(fecha) {
    const db = obtenerSupabase();
    if (!db) return null;
    const { data } = await db
      .from('produccion_diaria')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .eq('fecha', fecha);
    if (!data?.length) return null;
    return {
      huevos: data.reduce((s, r) => s + (parseInt(r.huevos) || 0), 0),
      rotos:  data.reduce((s, r) => s + (parseInt(r.rotos)  || 0), 0),
    };
  }

  async function obtenerLotesActivos() {
    const db = obtenerSupabase();
    if (!db) return DEMO_LOTES().filter(l => l.estado === 'activo');
    const { data } = await db.from('lotes').select('*, galpon:galpones(nombre)')
      .eq('granja_id', Auth.getTenantActivo()).eq('estado', 'activo');
    return data || [];
  }

  async function obtenerLotesTodos() {
    const db = obtenerSupabase();
    if (!db) return DEMO_LOTES();
    const { data, error } = await db
      .from('lotes')
      .select('*, galpon:galpones(nombre)')
      .eq('granja_id', Auth.getTenantActivo())
      .order('fecha_ingreso', { ascending: false });
    if (error) return DEMO_LOTES(); // Fallback por error de schema/red
    return data || []; // Retornar vacío si no hay en la DB real
  }

  async function insertarLote(lote) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('lotes').insert([{...lote, granja_id: Auth.getTenantActivo()}]);
    return { ok: !error, error };
  }

  async function actualizarLote(id, cambios) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('lotes').update(cambios).eq('id', id);
    return { ok: !error, error };
  }

  async function desactivarLote(id) {
    return actualizarLote(id, { estado: 'descartado' });
  }

  function DEMO_LOTES() {
    const hoy = new Date();
    const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
    const hace120 = new Date(hoy); hace120.setDate(hoy.getDate() - 120 * 7);
    return [
      { id: '1', raza: 'ISA Brown',  galpon_id: '1', galpon: { nombre: 'Galpón 1' }, fecha_ingreso: new Date(hoy - 80 * 7 * 86400000).toISOString().split('T')[0], cantidad_inicial: 500, cantidad_actual: 487, estado: 'activo' },
      { id: '2', raza: 'Lohmann',    galpon_id: '2', galpon: { nombre: 'Galpón 2' }, fecha_ingreso: new Date(hoy - 20 * 7 * 86400000).toISOString().split('T')[0], cantidad_inicial: 350, cantidad_actual: 350, estado: 'recria' },
      { id: '3', raza: 'Rhode Island Red', galpon_id: '1', galpon: { nombre: 'Galpón 1' }, fecha_ingreso: hace120.toISOString().split('T')[0], cantidad_inicial: 400, cantidad_actual: 0,   estado: 'descartado' },
    ];
  }

  async function insertarGalpon(galpon) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('galpones').insert([galpon]);
    return { ok: !error, error };
  }

  async function insertarProduccion(registro) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };  // Demo: simular éxito

    // Mapeo seguro de valores UI a Check Constraints de DB (sin_agua/sin_alimento -> sin)
    const mapearEstado = (val) => val?.startsWith('sin') ? 'sin' : val;

    const payload = {
      fecha: registro.fecha,
      galpon: registro.galpon,
      huevos: registro.huevos,
      rotos: registro.rotos,
      mortandad: registro.mortandad,
      estado_agua: mapearEstado(registro.estado_agua),
      estado_alimento: mapearEstado(registro.estado_alimento),
      observaciones: registro.observaciones,
      operador_id: getOperadorUUID()
    };

    const { error } = await db.from('produccion_diaria').upsert([{...payload, granja_id: Auth.getTenantActivo()}], { onConflict: 'fecha,galpon' });
    return { ok: !error, error };
  }

  // ── GALPONES / GALLINEROS ────────────────────────────────────────

  async function obtenerGalpones() {
    const db = obtenerSupabase();
    if (!db) return DEMO_GALPONES();
    const { data, error } = await db
      .from('galpones')
      .select('id, nombre, capacidad_aves, descripcion, terminologia, activo')
      .eq('granja_id', Auth.getTenantActivo())
      .eq('activo', true)
      .order('nombre');
    if (error) return DEMO_GALPONES();
    return data || []; // Retornar vacío si en base de datos 100% no hay
  }

  async function actualizarGalpon(id, cambios) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('galpones').update(cambios).eq('id', id);
    return { ok: !error, error };
  }

  async function desactivarGalpon(id) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('galpones').update({ activo: false }).eq('id', id);
    return { ok: !error, error };
  }

  // ── EQUIPO ────────────────────────────────────────────────────

  async function obtenerEquipo() {
    const db = obtenerSupabase();
    if (!db) return DEMO_EQUIPO();
    const { data, error } = await db
      .from('equipo_miembros')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .eq('activo', true)
      .order('nombre');
    if (error) return DEMO_EQUIPO();
    return data || [];
  }

  async function insertarMiembro(miembro) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('equipo_miembros').insert([{...miembro, granja_id: Auth.getTenantActivo()}]);
    return { ok: !error, error };
  }

  async function actualizarMiembro(id, cambios) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('equipo_miembros').update(cambios).eq('id', id);
    return { ok: !error, error };
  }

  async function desactivarMiembro(id) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('equipo_miembros').update({ activo: false }).eq('id', id);
    return { ok: !error, error };
  }

  // ── TAREAS ────────────────────────────────────────────────────

  async function obtenerTareasHoy() {
    const db = obtenerSupabase();
    const hoy = new Date().toISOString().split('T')[0];
    
    // 1. Tareas de BD (Manuales)
    let tareasDB = [];
    if (db) {
      const { data, error } = await db
        .from('tareas')
        .select('*, equipo_miembros(nombre, avatar, rol)')
        .eq('granja_id', Auth.getTenantActivo())
        .or(`fecha_limite.eq.${hoy},and(fecha_limite.lte.${hoy},estado.neq.hecho),and(fecha_limite.is.null,estado.neq.hecho)`)
        .order('prioridad', { ascending: false });
      if (!error && data) tareasDB = data;
    } else {
      tareasDB = DEMO_TAREAS();
    }

    // 2. Generar Tareas Inteligentes (Auto-Checklist)
    const galpones = await obtenerGalpones();
    let galponesCargados = [];

    if (db) {
      const { data } = await db.from('produccion_diaria').select('galpon_id, galpon')
      .eq('granja_id', Auth.getTenantActivo()).eq('fecha', hoy);
      galponesCargados = (data || []).map(p => p.galpon_id || p.galpon);
    } else {
      const gfi_prod = JSON.parse(localStorage.getItem('gfi_prod') || '[]');
      galponesCargados = gfi_prod.filter(p => p.fecha === hoy).map(p => p.galpon_id || p.galpon);
    }

    const autoPendientes = galpones
      .filter(g => !galponesCargados.includes(g.id) && !galponesCargados.includes(g.nombre))
      .map(g => ({
        id: 'auto_' + g.id,
        titulo: `Recolectar huevos y chequear agua — ${g.nombre}`,
        estado: 'pendiente',
        automatica: true,
        galpon_id: g.id,
        prioridad: 'alta'
      }));

    const autoHechas = galpones
      .filter(g => galponesCargados.includes(g.id) || galponesCargados.includes(g.nombre))
      .map(g => ({
        id: 'auto_' + g.id,
        titulo: `Producción registrada — ${g.nombre}`,
        estado: 'hecho',
        automatica: true,
        galpon_id: g.id,
        prioridad: 'baja'
      }));

    // Tarea Inteligente de Ventas + Excepción 0
    let huboVentasHoy = localStorage.getItem(`ventas_zero_${hoy}`) === 'true';
    if (!huboVentasHoy) {
      if (db) {
         const { data: vts } = await db.from('ventas').select('id')
      .eq('granja_id', Auth.getTenantActivo()).eq('fecha', hoy).limit(1);
         if (vts && vts.length > 0) huboVentasHoy = true;
      }
    }
    const autoVentas = {
        id: 'auto_ventas',
        titulo: huboVentasHoy ? 'Ventas registradas hoy' : 'Registrar ventas del día',
        estado: huboVentasHoy ? 'hecho' : 'pendiente',
        automatica: true,
        tipo_auto: 'ventas',
        prioridad: 'alta'
    };

    // Retorna ordenado: Auto pendientes -> DB pendientes -> Auto Hechas -> DB hechas
    const finales = [
      ...autoPendientes,
      (!huboVentasHoy ? autoVentas : null),
      ...tareasDB.filter(t => t.estado !== 'hecho'),
      ...autoHechas,
      (huboVentasHoy ? autoVentas : null),
      ...tareasDB.filter(t => t.estado === 'hecho')
    ].filter(Boolean);

    return finales;
  }

  async function toggleTareaDB(id, estadoActual) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const nuevoEstado = estadoActual === 'hecho' ? 'pendiente' : 'hecho';
    const { error } = await db
      .from('tareas')
      .update({
        estado: nuevoEstado,
        completada_en: nuevoEstado === 'hecho' ? new Date().toISOString() : null
      })
      .eq('id', id);
    return { ok: !error, error };
  }

  async function insertarTarea(tarea) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('tareas').insert([tarea]);
    return { ok: !error, error };
  }

  // ── INSPECCIONES ──────────────────────────────────────────────

  async function insertarInspeccion(inspeccion) {
    const db = obtenerSupabase();
    if (!db) return { ok: true, id: 'demo-' + Date.now() };
    const usuario = Auth.obtenerUsuario();
    const { data, error } = await db.from('inspecciones').insert([{
      ...inspeccion,
      operador_id: usuario?.id || null
    }]).select().single();
    return { ok: !error, id: data?.id, error };
  }

  async function obtenerHistorialInspecciones(limite = 10) {
    const db = obtenerSupabase();
    if (!db) return DEMO_INSPECCIONES();
    const { data } = await db
      .from('inspecciones')
      .select('*, galpones(nombre)')
      .eq('granja_id', Auth.getTenantActivo())
      .order('creado_en', { ascending: false })
      .limit(limite);
    return data || DEMO_INSPECCIONES();
  }

  // ── PUBLICACIONES ─────────────────────────────────────────────

  async function insertarPublicacion(pub) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('publicaciones_redes').insert([pub]);
    return { ok: !error, error };
  }

  async function obtenerPublicacionesRecientes() {
    const db = obtenerSupabase();
    if (!db) return DEMO_PUBLICACIONES();
    const { data } = await db
      .from('publicaciones_redes')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .order('creado_en', { ascending: false })
      .limit(5);
    return data || DEMO_PUBLICACIONES();
  }

  // ── VACUNAS PRÓXIMAS ──────────────────────────────────────────

  async function obtenerVacunasProximas() {
    const db = obtenerSupabase();
    if (!db) return [];
    const { data } = await db
      .from('v_vacunas_proximas')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .limit(5);
    return data || [];
  }

  // ── DATOS DEMO (fallback) ─────────────────────────────────────

  function DEMO_HOY_DATA() {
    return {
      huevos_hoy:  312,
      huevos_ayer: 298,
      mortandad:   1,
      maples:      73,
      agua:        'normal'
    };
  }

  function normalizar_produccion(registros) {
    const total_huevos = registros.reduce((s, r) => s + r.huevos, 0);
    const total_mort   = registros.reduce((s, r) => s + r.mortandad, 0);
    return {
      huevos_hoy: total_huevos,
      huevos_ayer: total_huevos - Math.floor(Math.random() * 20),
      mortandad: total_mort,
      maples: Math.floor(total_huevos / 30),
      agua: registros.some(r => r.estado_agua !== 'normal') ? 'baja' : 'normal'
    };
  }

  function DEMO_GALPONES() {
    return [
      { id: '1', nombre: 'Galpón 1', capacidad_aves: 500 },
      { id: '2', nombre: 'Galpón 2', capacidad_aves: 320 },
    ];
  }

  function DEMO_EQUIPO() {
    return [
      { id: '1', nombre: 'Juan',  rol: 'Producción',     avatar: '🧑‍🌾' },
      { id: '2', nombre: 'María', rol: 'Administración', avatar: '📊' },
      { id: '3', nombre: 'Laura', rol: 'Redes',          avatar: '📱' },
    ];
  }

  function DEMO_TAREAS() {
    return [
      { id: '1', titulo: 'Comprar viruta para los nidos', estado: 'pendiente', equipo_miembros: { nombre: 'Juan', avatar: '🧑‍🌾' }, prioridad: 'alta' },
      { id: '2', titulo: 'Publicar foto de maples en Instagram', estado: 'pendiente', equipo_miembros: { nombre: 'Laura', avatar: '📱' }, prioridad: 'normal' },
    ];
  }

  function DEMO_INSPECCIONES() {
    return [
      { id: '1', tipo: 'bebedero',  estado_ia: 'verde',    creado_en: new Date().toISOString(), galpones: { nombre: 'Galpón 1' } },
      { id: '2', tipo: 'galpon',     estado_ia: 'amarillo', creado_en: new Date().toISOString(), galpones: { nombre: 'Galpón 2' } },
    ];
  }

  function DEMO_PUBLICACIONES() {
    return [
      { id: '1', plataforma: 'Instagram', texto: '¡Maples disponibles!', estado: 'publicado', creado_en: new Date().toISOString() },
    ];
  }

  // ── VENTAS ────────────────────────────────────────────────────

  async function obtenerVentas() {
    const db = obtenerSupabase();
    if (!db) return DEMO_VENTAS();
    const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const { data, error } = await db
      .from('ventas')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .gte('fecha', hace30)
      .order('fecha', { ascending: false })
      .limit(50);
    if (error) return DEMO_VENTAS();
    
    // Mapear el nombre del autor
    const mapaOperadores = await obtenerMapaOperadores();
    if (data) {
       data.forEach(v => {
           v.operador_nombre = mapaOperadores[v.registrado_por] || (v.registrado_por ? 'Socio' : 'Sistema / App');
       });
    }
    
    return data || [];
  }

  async function insertarVenta(venta) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const usuario = Auth.obtenerUsuario();
    const payload = { ...venta, registrado_por: usuario?.id || null };

    const { error } = await db.from('ventas').insert([payload]);
    if (!error) return { ok: true };

    // Fallback: si falla por columnas nuevas inexistentes, reintenta con campos base
    const COLUMNAS_NUEVAS = ['notas', 'estado_entrega', 'estado_pago', 'fecha_entrega', 'monto_cobrado'];
    const payloadBase = { ...payload };
    COLUMNAS_NUEVAS.forEach(c => delete payloadBase[c]);
    // Compatibilidad hacia atrás: mapear estado_pago + estado_entrega → estado legacy
    if (!payloadBase.estado) {
      const ep = venta.estado_pago || 'pendiente';
      const ee = venta.estado_entrega || 'pendiente';
      payloadBase.estado = ep === 'cobrado' && ee === 'entregado' ? 'cobrado'
        : ee === 'entregado' ? 'entregado'
        : 'pendiente';
    }
    const { error: error2 } = await db.from('ventas').insert([payloadBase]);
    return { ok: !error2, error: error2 };
  }

  async function actualizarVenta(id, cambios) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('ventas').update(cambios).eq('id', id);
    return { ok: !error, error };
  }

  // Alias para compatibilidad con código anterior
  async function actualizarEstadoVenta(id, estado) {
    return actualizarVenta(id, { estado });
  }

  function DEMO_VENTAS() {
    const hoy = new Date();
    const hace = (d) => new Date(hoy - d * 86400000).toISOString().split('T')[0];
    return [
      { id: '1', fecha: hace(0), canal: 'Almacén',  cliente_nombre: 'Alm. Don Luis',    cliente_id: '2', maples_entregados: 10, precio_maple: 3500, total: 35000, tipo_huevo: 'Grande',       estado_entrega: 'entregado',  estado_pago: 'cobrado',   fecha_entrega: hace(0),  monto_cobrado: 35000, notas: '', operador_nombre: 'Demo' },
      { id: '2', fecha: hace(0), canal: 'Directo',  cliente_nombre: 'María González',    cliente_id: '1', maples_entregados:  5, precio_maple: 3800, total: 19000, tipo_huevo: 'Extra grande', estado_entrega: 'entregado',  estado_pago: 'pendiente', fecha_entrega: hace(0),  monto_cobrado: 0,     notas: '', operador_nombre: 'Demo' },
      { id: '3', fecha: hace(1), canal: 'WhatsApp', cliente_nombre: 'Familia Soria',     cliente_id: '3', maples_entregados:  3, precio_maple: 3500, total: 10500, tipo_huevo: 'Mediano',     estado_entrega: 'programado', estado_pago: 'pendiente', fecha_entrega: hace(-2), monto_cobrado: 0,     notas: 'Entregar el martes', operador_nombre: 'Demo' },
      { id: '4', fecha: hace(2), canal: 'Directo',  cliente_nombre: 'Rest. El Rancho',   cliente_id: '4', maples_entregados: 20, precio_maple: 3400, total: 68000, tipo_huevo: 'Grande',       estado_entrega: 'entregado',  estado_pago: 'cobrado',   fecha_entrega: hace(2),  monto_cobrado: 68000, notas: '' },
      { id: '5', fecha: hace(3), canal: 'Almacén',  cliente_nombre: 'Alm. Don Luis',    cliente_id: '2', maples_entregados:  8, precio_maple: 3500, total: 28000, tipo_huevo: 'Grande',       estado_entrega: 'entregado',  estado_pago: 'parcial',   fecha_entrega: hace(3),  monto_cobrado: 14000, notas: 'Restó $ 14.000' },
      { id: '6', fecha: hace(4), canal: 'WhatsApp', cliente_nombre: 'María González',    cliente_id: '1', maples_entregados:  4, precio_maple: 3800, total: 15200, tipo_huevo: 'Extra grande', estado_entrega: 'entregado',  estado_pago: 'cobrado',   fecha_entrega: hace(4),  monto_cobrado: 15200, notas: '' },
      { id: '7', fecha: hace(5), canal: 'Directo',  cliente_nombre: 'Familia Soria',     cliente_id: '3', maples_entregados:  2, precio_maple: 3500, total:  7000, tipo_huevo: 'Mediano',     estado_entrega: 'pendiente',  estado_pago: 'pendiente', fecha_entrega: null,     monto_cobrado: 0,     notas: '' },
    ];
  }
  // ── CLIENTES ─────────────────────────────────────────

  async function obtenerClientes() {
    const db = obtenerSupabase();
    if (!db) return DEMO_CLIENTES();
    const { data, error } = await db
      .from('clientes')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .eq('activo', true)
      .order('nombre');
    if (error) return DEMO_CLIENTES();
    return data || [];
  }

  async function insertarCliente(cliente) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('clientes').insert([{...cliente, granja_id: Auth.getTenantActivo()}]);
    return { ok: !error, error };
  }

  async function actualizarCliente(id, cambios) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('clientes').update(cambios).eq('id', id);
    return { ok: !error, error };
  }

  async function obtenerVentasCliente(clienteId) {
    const db = obtenerSupabase();
    if (!db) return DEMO_VENTAS_CLIENTE(clienteId);
    const { data } = await db
      .from('ventas')
      .select('*')
      .eq('granja_id', Auth.getTenantActivo())
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
      .limit(20);
    return data || [];
  }

  function DEMO_VENTAS_CLIENTE(clienteId) {
    // Solo retorna historial demo para clientes demo conocidos
    const hoy = new Date();
    const hace = (d) => new Date(hoy - d * 86400000).toISOString().split('T')[0];
    const mapa = {
      '1': [
        { id: 'v1', fecha: hace(5),  tipo_huevo: 'Extra grande', maples_entregados: 3, precio_maple: 3800, total: 11400, estado: 'cobrado'   },
        { id: 'v2', fecha: hace(18), tipo_huevo: 'Grande',       maples_entregados: 2, precio_maple: 3500, total:  7000, estado: 'cobrado'   },
      ],
      '2': [
        { id: 'v3', fecha: hace(12), tipo_huevo: 'Grande',       maples_entregados: 10, precio_maple: 3500, total: 35000, estado: 'cobrado'  },
        { id: 'v4', fecha: hace(26), tipo_huevo: 'Mediano',      maples_entregados:  8, precio_maple: 3200, total: 25600, estado: 'cobrado'  },
        { id: 'v5', fecha: hace(40), tipo_huevo: 'Grande',       maples_entregados: 10, precio_maple: 3400, total: 34000, estado: 'cobrado'  },
      ],
      '3': [],
      '4': [
        { id: 'v6', fecha: hace(2),  tipo_huevo: 'Extra grande', maples_entregados: 5, precio_maple: 3800, total: 19000, estado: 'entregado' },
        { id: 'v7', fecha: hace(9),  tipo_huevo: 'Extra grande', maples_entregados: 5, precio_maple: 3800, total: 19000, estado: 'cobrado'   },
      ],
    };
    return mapa[clienteId] || [];
  }

  function DEMO_CLIENTES() {
    const hace = (d) => new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
    return [
      { id: '1', nombre: 'María González',  telefono: '2624111222', tipo: 'particular',   zona: 'Centro', activo: true, ultima_compra: hace(5),  captado_por_app: false, frecuencia: 'semanal' },
      { id: '2', nombre: 'Alm. Don Luis',   telefono: '2624333444', tipo: 'almacen',       zona: 'Norte',  activo: true, ultima_compra: hace(12), captado_por_app: true,  frecuencia: 'semanal' },
      { id: '3', nombre: 'Familia Soria',   telefono: '2624555666', tipo: 'particular',    zona: 'Sur',    activo: true, ultima_compra: hace(35), captado_por_app: false, frecuencia: 'quincenal' },
      { id: '4', nombre: 'Rest. El Rancho', telefono: '2624777888', tipo: 'restaurante',   zona: 'Centro', activo: true, ultima_compra: hace(2),  captado_por_app: true,  frecuencia: 'semanal' },
    ];
  }

  // ── ESTADÍSTICAS VALOR DE LA APP ──────────────────────────────

  async function obtenerEstadisticasApp() {
    const db = obtenerSupabase();
    let clientesApp = [];
    let todasVentas = [];

    if (db) {
      const { data: cData } = await db.from('clientes').select('id')
      .eq('granja_id', Auth.getTenantActivo()).eq('captado_por_app', true).eq('activo', true);
      clientesApp = cData || [];
      const { data: vData } = await db.from('ventas').select('total, cliente_id, canal')
      .eq('granja_id', Auth.getTenantActivo()).gte('fecha', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
      todasVentas = vData || [];
    } else {
      // Demo: cliente 2 y 4 captados por la app
      clientesApp = [{ id: '2' }, { id: '4' }];
      todasVentas = DEMO_VENTAS();
    }

    const idsApp = new Set(clientesApp.map(c => c.id));
    const totalGeneral  = todasVentas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0);
    const totalApp      = todasVentas.filter(v => idsApp.has(v.cliente_id)).reduce((s, v) => s + (parseFloat(v.total) || 0), 0);
    const ventasWsp     = todasVentas.filter(v => v.canal === 'WhatsApp').length;
    const mensajesLs    = parseInt(localStorage.getItem('gfi_mensajes_wsp') || '0');

    return {
      cantidadClientesApp: clientesApp.length,
      totalVentasApp:      totalApp,
      totalVentasGeneral:  totalGeneral,
      porcentajeApp:       totalGeneral > 0 ? Math.round((totalApp / totalGeneral) * 100) : 0,
      mensajesEnviados:    mensajesLs,
      ventasWhatsApp:      ventasWsp,
    };
  }

  function registrarMensajeWhatsApp() {
    const actual = parseInt(localStorage.getItem('gfi_mensajes_wsp') || '0');
    localStorage.setItem('gfi_mensajes_wsp', String(actual + 1));
  }

  async function limpiarBaseDeDatos() {
    const db = obtenerSupabase();
    if (!db) {
       localStorage.clear();
       return { ok: true };
    }
    // Ejecuta deletes masivos (filtro dummy para sortear PostgREST vacíos).
    // RLS protegerá de borrar datos de otros usuarios si se aplica correctamente.
    await db.from('produccion_diaria').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await db.from('ventas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await db.from('lotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await db.from('galpones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await db.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    localStorage.clear();
    return { ok: true };
  }

  // ── SUPER ADMIN SAAS ──────────────────────────────────────────
  async function obtenerTodasLasGranjasSaaS() {
    const db = obtenerSupabase();
    if (!db) return [];
    
    // RLS (si está activo para admin) lo permitirá
    const { data, error } = await db
      .from('granjas')
      .select('*, perfiles(nombre)')
      .order('creado_en', { ascending: false });
    
    if (error) {
       console.warn("SaaS Admin List error:", error.message);
       return [];
    }
    return data || [];
  }

  return {
    obtenerProduccionHoy, obtenerProduccionSemana, obtenerProduccionFecha,
    insertarProduccion,
    obtenerLotesActivos, obtenerLotesTodos, insertarLote, actualizarLote, desactivarLote,
    obtenerGalpones, insertarGalpon, actualizarGalpon, desactivarGalpon,
    obtenerEquipo, insertarMiembro, actualizarMiembro, desactivarMiembro,
    obtenerTareasHoy, toggleTareaDB, insertarTarea,
    obtenerVentas, insertarVenta, actualizarEstadoVenta, obtenerUltimasProducciones,
    obtenerClientes, insertarCliente, actualizarCliente, obtenerVentasCliente,
    insertarInspeccion, obtenerHistorialInspecciones,
    insertarPublicacion, obtenerPublicacionesRecientes,
    obtenerVacunasProximas,
    obtenerEstadisticasApp, registrarMensajeWhatsApp,
    obtenerUsuariosPendientes, aprobarUsuario, cambiarPlanUsuario,
    limpiarBaseDeDatos,
    obtenerDataDashboard,
    obtenerTodasLasGranjasSaaS
  };
})();

// ── IMPLEMENTACIÓN DASHBOARD ──
async function obtenerDataDashboard(paramFiltro, galponId = 'todos') {
  const db = obtenerSupabase();
  let df, dt;
  let diasSimulados = 7;

  if (typeof paramFiltro === 'number') {
     const limite = new Date();
     limite.setDate(limite.getDate() - (paramFiltro - 1));
     df = limite.toISOString().split('T')[0];
     dt = new Date().toISOString().split('T')[0];
     diasSimulados = paramFiltro;
  } else {
     df = paramFiltro.desde;
     dt = paramFiltro.hasta;
     diasSimulados = Math.round((new Date(dt) - new Date(df)) / 86400000) + 1;
  }

  if (!db) {
     const _p = []; const _v = [];
     for(let i=0; i<diasSimulados; i++) {
       const t = new Date(dt); t.setDate(t.getDate() - i);
       const d = t.toISOString().split('T')[0];
       _p.push({ fecha: d, huevos: Math.floor(300+Math.random()*20), mortandad: Math.floor(Math.random()*2), galpon_id: 'demo1' });
       if(Math.random() > 0.3) _v.push({ fecha: d, maples_entregados: Math.floor(10+Math.random()*5) });
     }
     return { produccion: _p, ventas: _v };
  }

  let prodQuery = db.from('produccion_diaria').select('fecha, galpon_id, huevos, mortandad')
      .eq('granja_id', Auth.getTenantActivo()).gte('fecha', df).lte('fecha', dt);
  if (galponId !== 'todos') {
     prodQuery = prodQuery.eq('galpon_id', galponId);
  }
  const { data: prod } = await prodQuery;
  
  const { data: vent } = await db.from('ventas').select('fecha, maples_entregados')
      .eq('granja_id', Auth.getTenantActivo()).gte('fecha', df).lte('fecha', dt);

  return { produccion: prod || [], ventas: vent || [] };
}

// ── FUNCIONES DE APROBACIÓN (fuera del IIFE para usar DB internamente) ──

async function obtenerUsuariosPendientes() {
  const db = obtenerSupabase();
  if (!db) return [];
  const { data } = await db
    .from('v_usuarios_pendientes')
    .select('*')
      .eq('granja_id', Auth.getTenantActivo())
    .order('creado_en', { ascending: false });
  return data || [];
}

async function aprobarUsuario(id, plan = 'mensual') {
  const db = obtenerSupabase();
  if (!db) return { ok: true };
  const { error } = await db
    .from('perfiles')
    .update({ aprobado: true, plan })
    .eq('id', id);
  return { ok: !error, error };
}

async function cambiarPlanUsuario(id, datos) {
  // datos: { plan, vence_el, aprobado, notas_admin }
  const db = obtenerSupabase();
  if (!db) return { ok: true };
  const { error } = await db.from('perfiles').update(datos).eq('id', id);
  return { ok: !error, error };
}
