// db.js — Capa de datos: funciones para leer/escribir en Supabase
// Cada función tiene fallback a datos demo si no hay conexión
const DB = (() => {

  // ── PRODUCCIÓN DIARIA ─────────────────────────────────────────

  async function obtenerProduccionHoy() {
    const db = obtenerSupabase();
    const hoy = new Date().toISOString().split('T')[0];
    if (!db) return null;  // null = sin conexión, el caller decide qué mostrar

    const { data, error } = await db
      .from('produccion_diaria')
      .select('*')
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
      .gte('fecha', hace7)
      .order('fecha', { ascending: false });
    return data || [];
  }

  async function obtenerProduccionFecha(fecha) {
    const db = obtenerSupabase();
    if (!db) return null;
    const { data } = await db
      .from('produccion_diaria')
      .select('*')
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
    const { data } = await db.from('lotes').select('*, galpon:galpones(nombre)').eq('estado', 'activo');
    return data || [];
  }

  async function obtenerLotesTodos() {
    const db = obtenerSupabase();
    if (!db) return DEMO_LOTES();
    const { data, error } = await db
      .from('lotes')
      .select('*, galpon:galpones(nombre)')
      .order('fecha_ingreso', { ascending: false });
    if (error || !data) return DEMO_LOTES();
    return data;
  }

  async function insertarLote(lote) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('lotes').insert([lote]);
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
    const usuario = Auth.obtenerUsuario();

    // Limpiar payload para evitar que PostgREST falle por columnas inexistentes
    const payload = {
      fecha: registro.fecha,
      galpon: registro.galpon,
      huevos: registro.huevos,
      rotos: registro.rotos,
      mortandad: registro.mortandad,
      estado_agua: registro.estado_agua,
      estado_alimento: registro.estado_alimento,
      observaciones: registro.observaciones,
      operador_id: usuario?.id || null
    };

    const { error } = await db.from('produccion_diaria').upsert([payload], { onConflict: 'fecha,galpon' });
    return { ok: !error, error };
  }

  // ── GALPONES / GALLINEROS ────────────────────────────────────────

  async function obtenerGalpones() {
    const db = obtenerSupabase();
    if (!db) return DEMO_GALPONES();
    const { data, error } = await db
      .from('galpones')
      .select('id, nombre, capacidad_aves, descripcion, terminologia, activo')
      .eq('activo', true)
      .order('nombre');
    if (error || !data?.length) return DEMO_GALPONES();
    return data;
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
      .eq('activo', true)
      .order('nombre');
    if (error || !data?.length) return DEMO_EQUIPO();
    return data;
  }

  async function insertarMiembro(miembro) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('equipo_miembros').insert([miembro]);
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
    if (!db) return DEMO_TAREAS();
    const { data, error } = await db
      .from('tareas')
      .select('*, equipo_miembros(nombre, avatar, rol)')
      .or(`fecha_limite.eq.${hoy},fecha_limite.is.null`)
      .neq('estado', 'hecho')
      .order('prioridad', { ascending: false });
    if (error) return DEMO_TAREAS();
    return data || [];
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
      { id: '1', titulo: 'Recolectar huevos — Galpón 1', estado: 'pendiente', equipo_miembros: { nombre: 'Juan', avatar: '🧑‍🌾' }, prioridad: 'alta' },
      { id: '2', titulo: 'Controlar agua — Galpón 2',    estado: 'pendiente', equipo_miembros: { nombre: 'Juan', avatar: '🧑‍🌾' }, prioridad: 'alta' },
      { id: '3', titulo: 'Publicar en Instagram',         estado: 'pendiente', equipo_miembros: { nombre: 'Laura', avatar: '📱' }, prioridad: 'normal' },
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
      .gte('fecha', hace30)
      .order('fecha', { ascending: false })
      .limit(50);
    if (error || !data) return DEMO_VENTAS();
    return data;
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
      { id: '1', fecha: hace(0), canal: 'Almacén',  cliente_nombre: 'Alm. Don Luis',    cliente_id: '2', maples_entregados: 10, precio_maple: 3500, total: 35000, tipo_huevo: 'Grande',       estado_entrega: 'entregado',  estado_pago: 'cobrado',   fecha_entrega: hace(0),  monto_cobrado: 35000, notas: '' },
      { id: '2', fecha: hace(0), canal: 'Directo',  cliente_nombre: 'María González',    cliente_id: '1', maples_entregados:  5, precio_maple: 3800, total: 19000, tipo_huevo: 'Extra grande', estado_entrega: 'entregado',  estado_pago: 'pendiente', fecha_entrega: hace(0),  monto_cobrado: 0,     notas: '' },
      { id: '3', fecha: hace(1), canal: 'WhatsApp', cliente_nombre: 'Familia Soria',     cliente_id: '3', maples_entregados:  3, precio_maple: 3500, total: 10500, tipo_huevo: 'Mediano',     estado_entrega: 'programado', estado_pago: 'pendiente', fecha_entrega: hace(-2), monto_cobrado: 0,     notas: 'Entregar el martes' },
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
      .eq('activo', true)
      .order('nombre');
    if (error || !data) return DEMO_CLIENTES();
    return data;
  }

  async function insertarCliente(cliente) {
    const db = obtenerSupabase();
    if (!db) return { ok: true };
    const { error } = await db.from('clientes').insert([cliente]);
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
      const { data: cData } = await db.from('clientes').select('id').eq('captado_por_app', true).eq('activo', true);
      clientesApp = cData || [];
      const { data: vData } = await db.from('ventas').select('total, cliente_id, canal').gte('fecha', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
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

  return {
    obtenerProduccionHoy, obtenerProduccionSemana, obtenerProduccionFecha,
    insertarProduccion,
    obtenerLotesActivos, obtenerLotesTodos, insertarLote, actualizarLote, desactivarLote,
    obtenerGalpones, insertarGalpon, actualizarGalpon, desactivarGalpon,
    obtenerEquipo, insertarMiembro, actualizarMiembro, desactivarMiembro,
    obtenerTareasHoy, toggleTareaDB, insertarTarea,
    obtenerVentas, insertarVenta, actualizarEstadoVenta,
    obtenerClientes, insertarCliente, actualizarCliente, obtenerVentasCliente,
    insertarInspeccion, obtenerHistorialInspecciones,
    insertarPublicacion, obtenerPublicacionesRecientes,
    obtenerVacunasProximas,
    obtenerEstadisticasApp, registrarMensajeWhatsApp,
    obtenerUsuariosPendientes, aprobarUsuario, cambiarPlanUsuario,
    limpiarBaseDeDatos
  };
})();

// ── FUNCIONES DE APROBACIÓN (fuera del IIFE para usar DB internamente) ──

async function obtenerUsuariosPendientes() {
  const db = obtenerSupabase();
  if (!db) return [];
  const { data } = await db
    .from('v_usuarios_pendientes')
    .select('*')
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
