// produccion.js — Módulo CARGAR: carga diaria conectada a Supabase
const ModuloProduccion = (() => {

  let galpones = [];  // [{id, nombre, capacidad_aves, terminologia}]

  let datosForm = {
    fecha:         new Date().toISOString().split('T')[0],
    galpon_id:     '',
    galpon:        '',           // nombre (desnormalizado para mostrar)
    cantidad_aves: 0,
    huevos:        0,
    rotos:         0,
    mortandad:     0,
    agua:          'normal',
    alimento:      'normal',
    observaciones: ''
  };

  // ── CARGA DE DATOS (preRender) ────────────────────────────────
  async function cargarDatos() {
    const lista = await DB.obtenerGalpones();
    galpones = lista;
    if (galpones.length && !datosForm.galpon_id) {
      datosForm.galpon_id     = galpones[0].id;
      datosForm.galpon        = galpones[0].nombre;
      datosForm.cantidad_aves = galpones[0].capacidad_aves || 0;
    }
  }

  // Término que usa esta granja (gallinero, galpón, nave, etc.)
  function termino(plural = false) {
    const t = galpones[0]?.terminologia || 'gallinero';
    return plural ? `${t}s` : t;
  }

  // ── RENDER ────────────────────────────────────────────────────
  function render() {
    const hoy = new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });

    // Fallback demo si no hay galpones configurados
    if (!galpones.length) {
      return `
      <div class="modulo-contenedor">
        <h2 class="modulo-titulo">✏️ Carga del Día</h2>
        <div class="estado-vacio">
          <div class="estado-vacio-icono">🏠</div>
          <p class="estado-vacio-titulo">No hay gallineros configurados</p>
          <p class="estado-vacio-sub">Agregá al menos uno en <strong>CONFIGURACIÓN → Mis gallineros</strong></p>
          <button class="btn-primary" onclick="App.navegar('configuracion')" style="margin-top:16px">
            ⚙️ Configurar gallineros
          </button>
        </div>
      </div>`;
    }

    if (!datosForm.galpon_id) {
      datosForm.galpon_id     = galpones[0].id;
      datosForm.galpon        = galpones[0].nombre;
      datosForm.cantidad_aves = galpones[0].capacidad_aves || 0;
    }

    return `
    <div class="modulo-contenedor">
      <h2 class="modulo-titulo">✏️ Carga del Día</h2>
      <p class="modulo-subtitulo">${hoy}</p>

      <!-- SELECTOR DE GALLINERO -->
      <div class="campo-bloque">
        <label class="campo-label-grande">🏠 ¿Qué ${termino()}?</label>
        <div class="galpon-selector">
          ${galpones.map(g => `
            <button class="btn-galpon ${datosForm.galpon_id === g.id ? 'activo':''}"
                    onclick="ModuloProduccion.seleccionarGalpon('${g.id}','${g.nombre}',${g.capacidad_aves||0})">
              <span class="btn-galpon-nombre">${g.nombre}</span>
              ${g.capacidad_aves ? `<span class="btn-galpon-cap">${g.capacidad_aves} aves</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- CANTIDAD DE AVES -->
      <div class="campo-bloque">
        <label class="campo-label-grande">🐔 Aves presentes hoy en ${datosForm.galpon || termino()}</label>
        <div class="contador-grande contador-secundario">
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('cantidad_aves',-10)">−10</button>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('cantidad_aves',-1)">−</button>
          <span class="contador-valor" id="val-cantidad_aves">${datosForm.cantidad_aves}</span>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('cantidad_aves',1)">+</button>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('cantidad_aves',10)">+10</button>
        </div>
        <p class="hint-texto">Se autocompleta con la capacidad del ${termino()}. Ajustá si hubo bajas o ingresos.</p>
      </div>

      <!-- HUEVOS -->
      <div class="campo-bloque">
        <label class="campo-label-grande">🥚 Huevos recolectados</label>
        <div class="contador-grande">
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('huevos',-10)">−10</button>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('huevos',-1)">−</button>
          <span class="contador-valor" id="val-huevos">${datosForm.huevos}</span>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('huevos',1)">+</button>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('huevos',10)">+10</button>
        </div>
        <button class="btn-contar-ia" onclick="ContadorIA.abrir('huevos')">
          📷 Contar con IA
        </button>
        <p class="hint-texto">${datosForm.huevos > 0 ? `≈ ${Math.floor(datosForm.huevos/30)} maples y ${datosForm.huevos % 30} sueltos` : 'Tocá + para sumar'}</p>
      </div>

      <!-- ROTOS -->
      <div class="campo-bloque">
        <label class="campo-label-grande">🥚 Rotos o descarte</label>
        <div class="contador-grande contador-secundario">
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('rotos',-1)">−</button>
          <span class="contador-valor" id="val-rotos">${datosForm.rotos}</span>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('rotos',1)">+</button>
        </div>
      </div>

      <!-- MORTANDAD -->
      <div class="campo-bloque">
        <label class="campo-label-grande">💀 Gallinas muertas hoy</label>
        <div class="contador-grande contador-secundario">
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('mortandad',-1)">−</button>
          <span class="contador-valor" id="val-mortandad">${datosForm.mortandad}</span>
          <button class="btn-numero" onclick="ModuloProduccion.ajustar('mortandad',1)">+</button>
        </div>
        <p class="hint-texto" id="hint-mortandad">${datosForm.mortandad > 2 ? '<span style="color:#f44336">⚠️ Alta mortandad — revisá el gallinero</span>' : ''}</p>
      </div>

      <!-- AGUA -->
      <div class="campo-bloque">
        <label class="campo-label-grande">💧 ¿Cómo estuvo el agua hoy?</label>
        <div class="selector-iconos">
          <button class="btn-estado-icono ${datosForm.agua==='normal'?'activo':''}" onclick="ModuloProduccion.seleccionar('agua','normal')">
            <span>💧</span><span>Normal</span>
            <span class="estado-desc">Bebieron bien todo el día</span>
          </button>
          <button class="btn-estado-icono ${datosForm.agua==='baja'?'activo activo-warning':''}" onclick="ModuloProduccion.seleccionar('agua','baja')">
            <span>⚠️</span><span>Baja</span>
            <span class="estado-desc">Tomaron poco, hay que revisar</span>
          </button>
          <button class="btn-estado-icono ${datosForm.agua==='sin_agua'?'activo activo-danger':''}" onclick="ModuloProduccion.seleccionar('agua','sin_agua')">
            <span>🚫</span><span>Sin agua</span>
            <span class="estado-desc">No tuvieron agua hoy</span>
          </button>
        </div>
      </div>

      <!-- ALIMENTO -->
      <div class="campo-bloque">
        <label class="campo-label-grande">🌾 ¿Cómo estuvo el alimento hoy?</label>
        <div class="selector-iconos">
          <button class="btn-estado-icono ${datosForm.alimento==='normal'?'activo':''}" onclick="ModuloProduccion.seleccionar('alimento','normal')">
            <span>✅</span><span>Normal</span>
            <span class="estado-desc">Comieron bien durante el día</span>
          </button>
          <button class="btn-estado-icono ${datosForm.alimento==='bajo'?'activo activo-warning':''}" onclick="ModuloProduccion.seleccionar('alimento','bajo')">
            <span>⚠️</span><span>Bajo</span>
            <span class="estado-desc">Les falta, hay que reponer</span>
          </button>
          <button class="btn-estado-icono ${datosForm.alimento==='sin_alimento'?'activo activo-danger':''}" onclick="ModuloProduccion.seleccionar('alimento','sin_alimento')">
            <span>🚫</span><span>Sin alimento</span>
            <span class="estado-desc">No tienen comida — urgente</span>
          </button>
        </div>
      </div>

      <!-- OBSERVACIONES -->
      <div class="campo-bloque">
        <label class="campo-label-grande">📝 ¿Algo especial hoy? (opcional)</label>
        <textarea class="campo-obs" placeholder="Ej: Las gallinas del fondo estaban agitadas..."
                  oninput="ModuloProduccion.setObs(this.value)">${datosForm.observaciones}</textarea>
      </div>

      <!-- GUARDAR -->
      <button class="btn-primario btn-full btn-guardar-grande" id="btn-guardar-prod" onclick="ModuloProduccion.guardar()">
        ✅ Guardar el día
      </button>
      <p class="hint-texto">Los datos se guardan en tu granja y actualizan el panel de hoy</p>
    </div>`;
  }

  // ── SELECCIÓN DE GALLINERO ────────────────────────────────────
  function seleccionarGalpon(id, nombre, capacidadAves) {
    datosForm.galpon_id     = id;
    datosForm.galpon        = nombre;
    datosForm.cantidad_aves = capacidadAves || 0;
    // Re-render
    const cont = document.getElementById('contenido-principal');
    if (cont) cont.innerHTML = render();
  }

  // ── CONTROLES ─────────────────────────────────────────────────
  function ajustar(campo, delta) {
    datosForm[campo] = Math.max(0, (datosForm[campo] || 0) + delta);
    const el = document.getElementById(`val-${campo}`);
    if (el) el.textContent = datosForm[campo];
    // Actualizar hint de maples
    if (campo === 'huevos') {
      const hint = el?.closest('.campo-bloque')?.querySelector('.hint-texto');
      if (hint) hint.textContent = datosForm.huevos > 0
        ? `≈ ${Math.floor(datosForm.huevos/30)} maples y ${datosForm.huevos % 30} sueltos`
        : 'Tocá + para sumar';
    }
    // Alerta mortandad (inline, sin Toast)
    if (campo === 'mortandad') {
      const hint = document.getElementById('hint-mortandad');
      if (hint) {
        hint.innerHTML = datosForm.mortandad > 2 
          ? '<span style="color:#f44336">⚠️ Alta mortandad — revisá el gallinero</span>' 
          : '';
      }
    }
  }

  function seleccionar(campo, valor) {
    datosForm[campo] = valor;
    document.getElementById('contenido-principal').innerHTML = render();
  }

  function setObs(val) { datosForm.observaciones = val; }

  // ── GUARDAR EN SUPABASE ───────────────────────────────────────
  async function guardar() {
    if (!datosForm.galpon_id) {
      UI.mostrarToast('⚠️ Seleccioná un gallinero', 'warning'); return;
    }
    if (datosForm.huevos === 0) {
      UI.mostrarToast('⚠️ Ingresá al menos los huevos del día', 'warning'); return;
    }

    const btn = document.getElementById('btn-guardar-prod');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando…'; }

    const registro = {
      fecha:           datosForm.fecha,
      galpon_id:       datosForm.galpon_id,
      galpon:          datosForm.galpon,       // desnormalizado
      cantidad_aves:   datosForm.cantidad_aves,
      huevos:          datosForm.huevos,
      rotos:           datosForm.rotos,
      mortandad:       datosForm.mortandad,
      estado_agua:     datosForm.agua,
      estado_alimento: datosForm.alimento,
      observaciones:   datosForm.observaciones || null
    };

    const resultado = await DB.insertarProduccion(registro);

    if (resultado.ok) {
      UI.mostrarToast(`✅ ${datosForm.huevos} huevos guardados — ${datosForm.galpon}`, 'success');
      // Resetear contadores
      datosForm.huevos = 0; datosForm.rotos = 0; datosForm.mortandad = 0;
      datosForm.cantidad_aves = galpones.find(g => g.id === datosForm.galpon_id)?.capacidad_aves || 0;
      datosForm.agua = 'normal'; datosForm.alimento = 'normal'; datosForm.observaciones = '';
      // Ir a HOY para ver el resultado
      setTimeout(() => App.navegar('hoy'), 500);
    } else {
      if (btn) { btn.disabled = false; btn.textContent = '✅ Guardar el día'; }
      const errTxt = resultado.error?.message || JSON.stringify(resultado.error) || 'desconocido';
      const msg = errTxt.includes('duplicate') || errTxt.includes('violates unique constraint')
        ? `⚠️ Ya cargaste ${datosForm.galpon} hoy. Si querés corregir, editalo desde GALPONES.`
        : `❌ DB Error: ${errTxt.substring(0,60)}`;
      UI.mostrarToast(msg, 'warning');
      console.error("SUPABASE ERROR:", resultado.error);
    }
  }

  function establecerValor(campo, valor) {
    datosForm[campo] = parseInt(valor) || 0;
    const el = document.getElementById(`val-${campo}`);
    if (el) el.textContent = datosForm[campo];
    if (campo === 'huevos') {
      const hint = el?.closest('.campo-bloque')?.querySelector('.hint-texto');
      if (hint) hint.textContent = datosForm.huevos > 0
        ? `≈ ${Math.floor(datosForm.huevos/30)} maples y ${datosForm.huevos % 30} sueltos`
        : 'Tocá + para sumar';
    }
  }

  return { render, cargarDatos, ajustar, seleccionar, seleccionarGalpon, setObs, guardar, establecerValor };
})();
