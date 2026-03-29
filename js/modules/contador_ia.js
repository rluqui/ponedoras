// contador_ia.js — Módulo de conteo IA por foto con Gemini Vision (flujo 2 fotos)
const ContadorIA = (() => {

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // Objetos predefinidos — el prompt se usa SOLO como fallback sin foto de referencia
  const OBJETOS_PREDEF = [
    {
      id: 'huevos',
      nombre: 'Huevos',
      emoji: '🥚',
      promptFallback: 'Contá ÚNICAMENTE los huevos físicos presentes en esta imagen. NO cuentes espacios vacíos de maples ni cartones. Solo respondé con el número entero.'
    },
    {
      id: 'gallinas',
      nombre: 'Gallinas',
      emoji: '🐔',
      promptFallback: 'Contá todas las aves o gallinas claramente visibles. Solo respondé con el número entero.'
    },
    {
      id: 'maples',
      nombre: 'Maples',
      emoji: '📦',
      promptFallback: 'Contá la cantidad de maples o cartones contenedores presentes. Solo respondé con el número entero.'
    },
  ];

  const STORAGE_KEY      = 'gfi_objetos_contador';
  const STORAGE_REFS_KEY = 'gfi_contador_refs'; // refs de objetos predefinidos

  let objetosPersonalizados = [];
  let objetoSeleccionado    = null;

  // Foto de referencia (paso 1)
  let fotoRefBase64  = null;
  let fotoRefMime    = 'image/jpeg';
  let refGuardada    = false; // si viene de storage

  // Foto a contar (paso 2)
  let fotoConteoBase64 = null;
  let fotoConteoMime   = 'image/jpeg';

  let contando        = false;
  let resultadoActual = null;

  // ── MODO ASISTIDO ────────────────────────────────────────────────
  function _modoAsistidoActivo() {
    const val = localStorage.getItem('gfi_modo_asistido');
    return val === null ? true : val === 'true';
  }

  function _aplicarGlow(el) {
    if (!el || !_modoAsistidoActivo()) return;
    el.classList.add('btn-glow-activo');
  }

  function _quitarGlow(el) {
    if (!el) return;
    el.classList.remove('btn-glow-activo');
  }

  // ── ABRIR MODAL ───────────────────────────────────────────────
  function abrir(preseleccionado = null) {
    objetosPersonalizados = cargarObjetosPersonalizados();
    _resetEstado();

    let modal = document.getElementById('modal-contador-ia');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-contador-ia';
      modal.className = 'contador-modal-overlay hidden';
      document.body.appendChild(modal);
    }

    modal.innerHTML = renderModal();
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('visible'));

    if (preseleccionado) seleccionarObjeto(preseleccionado);
    _vincularInputs();
  }

  function cerrar() {
    const modal = document.getElementById('modal-contador-ia');
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => modal.classList.add('hidden'), 280);
  }

  function _resetEstado() {
    fotoRefBase64    = null;
    fotoRefMime      = 'image/jpeg';
    refGuardada      = false;
    fotoConteoBase64 = null;
    fotoConteoMime   = 'image/jpeg';
    resultadoActual  = null;
    objetoSeleccionado = null;
  }

  // ── RENDER MODAL ─────────────────────────────────────────────
  function renderModal() {
    objetosPersonalizados = cargarObjetosPersonalizados();
    const todos = [...OBJETOS_PREDEF, ...objetosPersonalizados];

    return `
    <div class="contador-modal">
      <div class="contador-modal-header">
        <span class="contador-titulo">📷 Contar por foto</span>
        <button class="contador-cerrar" onclick="ContadorIA.cerrar()">✕</button>
      </div>

      <!-- PASO 0: Selector de objeto -->
      <div class="contador-seccion">
        <p class="contador-label">¿Qué querés contar?</p>
        <div class="contador-chips" id="contador-chips">
          ${todos.map(o => `
            <button class="chip-objeto" id="chip-${o.id}"
              onclick="ContadorIA.seleccionarObjeto('${o.id}')">
              <span class="chip-emoji">${o.emoji}</span>
              <span>${o.nombre}</span>
              ${_tieneRefGuardada(o.id) ? '<span class="chip-ref-badge" title="Tiene foto de referencia guardada">📎</span>' : ''}
            </button>
          `).join('')}
          <button class="chip-objeto chip-agregar" onclick="ContadorIA.mostrarFormPersonalizado()">
            <span class="chip-emoji">➕</span>
            <span>Nuevo</span>
          </button>
        </div>
        ${_modoAsistidoActivo() ? `
        <div class="banner-induccion">
          <span class="banner-icono">👆</span>
          <span>Seleccioná qué querés contar para comenzar</span>
        </div>` : ''}
      </div>

      <!-- Formulario objeto personalizado (oculto por defecto) -->
      <div id="form-personalizado" class="contador-form-custom hidden">
        <input class="campo-input" id="custom-nombre" placeholder="Nombre del objeto (ej: Cajones)" maxlength="30">
        <input class="campo-input" id="custom-emoji" placeholder="Emoji (ej: 📦)" maxlength="4" style="width:70px">
        <button class="btn-primary btn-sm" onclick="ContadorIA.guardarObjetoPersonalizado()">
          💾 Guardar objeto
        </button>
      </div>

      <!-- PASO 1: Foto de referencia (aparece al seleccionar objeto) -->
      <div class="contador-seccion contador-paso hidden" id="paso-1">
        <div class="contador-paso-header">
          <span class="contador-paso-badge">PASO 1</span>
          <span class="contador-paso-titulo" id="paso1-titulo">📸 Foto de referencia</span>
        </div>
        <p class="contador-paso-desc" id="paso1-desc">Tomá una foto de un solo objeto de referencia para que la IA sepa exactamente qué buscar.</p>

        <div class="contador-foto-area contador-foto-ref" id="foto-ref-area"
             onclick="document.getElementById('input-foto-ref').click()">
          <input type="file" id="input-foto-ref" accept="image/*" capture="environment" class="hidden">
          <div id="foto-ref-wrap" class="foto-preview-empty">
            <span class="foto-preview-icono">🎯</span>
            <span class="foto-preview-texto">Tocá para tomar la foto de referencia</span>
          </div>
        </div>

        <div class="contador-ref-acciones" id="ref-acciones" style="display:none">
          <label class="btn-secondary btn-sm" for="input-foto-ref">🔄 Cambiar</label>
          <button class="btn-secondary btn-sm" id="btn-guardar-ref" onclick="ContadorIA.guardarRefParaFuturo()">
            💾 Guardar para futuros conteos
          </button>
          <button class="btn-secondary btn-sm" id="btn-saltear-paso1" onclick="ContadorIA.saltearRef()">
            ⏭ Continuar sin referencia
          </button>
        </div>

        <div class="ref-tip" id="ref-tip" style="display:none">
          <span style="font-size:0.75rem;color:var(--texto-terciario)">
            ✅ Referencia guardada de un uso anterior &nbsp;
            <button class="btn-link-sm" onclick="ContadorIA._limpiarRefGuardada()">cambiar</button>
          </span>
        </div>

        <!-- Botón para avanzar al paso 2 -->
        <button class="btn-primary btn-full" id="btn-ir-paso2" onclick="ContadorIA.irAlPaso2()" disabled>
          Siguiente: elegí la foto a contar →
        </button>
      </div>

      <!-- PASO 2: Foto a contar -->
      <div class="contador-seccion contador-paso hidden" id="paso-2">
        <div class="contador-paso-header">
          <span class="contador-paso-badge">PASO 2</span>
          <span class="contador-paso-titulo">📸 Foto del conjunto a contar</span>
        </div>
        <p class="contador-paso-desc">Tomá o subí la foto que contiene todos los elementos a contar.</p>

        <div class="contador-foto-area" id="foto-contar-area"
             onclick="document.getElementById('input-foto-contar').click()">
          <input type="file" id="input-foto-contar" accept="image/*" capture="environment" class="hidden">
          <div id="foto-preview-wrap" class="foto-preview-empty">
            <span class="foto-preview-icono">📸</span>
            <span class="foto-preview-texto">Tocá para tomar o subir la foto</span>
          </div>
        </div>
      </div>

      <!-- RESULTADO -->
      <div id="contador-resultado" class="contador-resultado hidden"></div>

      <!-- Botón contar -->
      <button id="btn-contar" class="btn-primary btn-full hidden" onclick="ContadorIA.contar()" disabled>
        🔍 Contar con IA
      </button>

      <!-- Lista objetos personalizados -->
      ${objetosPersonalizados.length ? `
      <div class="contador-seccion contador-mis-objetos">
        <p class="contador-label">Mis objetos personalizados</p>
        ${objetosPersonalizados.map(o => `
          <div class="objeto-custom-row">
            <span>${o.emoji} ${o.nombre}</span>
            ${_tieneRefGuardada(o.id) ? '<span class="chip-ref-badge">📎 con referencia</span>' : ''}
            <button class="btn-icon-sm btn-danger-sm" onclick="ContadorIA.eliminarObjeto('${o.id}')">🗑</button>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>`;
  }

  // ── SELECCIÓN DE OBJETO ───────────────────────────────────────
  function seleccionarObjeto(id) {
    objetoSeleccionado = [...OBJETOS_PREDEF, ...cargarObjetosPersonalizados()].find(o => o.id === id);
    if (!objetoSeleccionado) return;

    // Resaltar chip
    document.querySelectorAll('#contador-chips .chip-objeto').forEach(c => c.classList.remove('activo'));
    document.getElementById(`chip-${id}`)?.classList.add('activo');

    // Reiniciar fotos
    fotoRefBase64    = null;
    fotoConteoBase64 = null;
    resultadoActual  = null;

    // Mostrar paso 1
    _mostrarPaso1();
  }

  function _mostrarPaso1() {
    const paso1 = document.getElementById('paso-1');
    const paso2 = document.getElementById('paso-2');
    const btnContar = document.getElementById('btn-contar');
    const res = document.getElementById('contador-resultado');

    if (paso2) paso2.classList.add('hidden');
    if (btnContar) btnContar.classList.add('hidden');
    if (res) { res.innerHTML = ''; res.classList.add('hidden'); }
    if (paso1) paso1.classList.remove('hidden');

    // Verificar si hay referencia guardada para este objeto
    const refGuardadaObj = _cargarRefGuardada(objetoSeleccionado.id);
    const titulo = document.getElementById('paso1-titulo');
    const desc   = document.getElementById('paso1-desc');
    const refTip = document.getElementById('ref-tip');
    const refAcciones = document.getElementById('ref-acciones');
    const btnIrPaso2 = document.getElementById('btn-ir-paso2');
    const wrap = document.getElementById('foto-ref-wrap');

    if (refGuardadaObj) {
      // Ya tiene referencia guardada → mostrar thumbnail y habilitar siguente
      fotoRefBase64 = refGuardadaObj.b64;
      fotoRefMime   = refGuardadaObj.mime;
      refGuardada   = true;

      if (titulo) titulo.textContent = '🎯 Foto de referencia guardada';
      if (desc) desc.textContent = 'Ya tenés una referencia guardada para este objeto. Podés usarla o reemplazarla.';
      if (wrap) wrap.innerHTML = `<img src="data:${fotoRefMime};base64,${fotoRefBase64}" class="foto-preview-img" alt="Referencia guardada"><span class="ref-guardada-badge">📎 Guardada</span>`;
      if (refTip) refTip.style.display = 'block';
      if (refAcciones) refAcciones.style.display = 'none';
      if (btnIrPaso2) { btnIrPaso2.disabled = false; btnIrPaso2.textContent = 'Siguiente: elegí la foto a contar →'; _aplicarGlow(btnIrPaso2); }
    } else if (objetoSeleccionado.foto_ref_b64) {
      // Objeto personalizado con foto embebida
      fotoRefBase64 = objetoSeleccionado.foto_ref_b64;
      fotoRefMime   = objetoSeleccionado.foto_ref_mime || 'image/jpeg';
      refGuardada   = true;
      if (wrap) wrap.innerHTML = `<img src="data:${fotoRefMime};base64,${fotoRefBase64}" class="foto-preview-img" alt="Referencia">`;
      if (btnIrPaso2) { btnIrPaso2.disabled = false; _aplicarGlow(btnIrPaso2); }
      if (refTip) refTip.style.display = 'block';
      if (refAcciones) refAcciones.style.display = 'none';
    } else {
      // Sin referencia previa
      if (titulo) titulo.textContent = `🎯 Foto de referencia — ${objetoSeleccionado.emoji} ${objetoSeleccionado.nombre}`;
      if (desc) desc.textContent = 'Tomá una foto de un solo objeto de ejemplo. La IA lo usará como ancla visual para contar con precisión.';
      if (refTip) refTip.style.display = 'none';
      if (refAcciones) refAcciones.style.display = 'none';
      if (btnIrPaso2) { btnIrPaso2.disabled = true; btnIrPaso2.textContent = 'Siguiente: elegí la foto a contar →'; }
      if (wrap) wrap.innerHTML = `
        <span class="foto-preview-icono">🎯</span>
        <span class="foto-preview-texto">Tocá para tomar la foto de referencia</span>`;
    }

    _vincularInputs();
  }

  // ── NAVEGACIÓN ENTRE PASOS ────────────────────────────────────
  function irAlPaso2() {
    const paso1 = document.getElementById('paso-1');
    const paso2 = document.getElementById('paso-2');
    const btnIrPaso2 = document.getElementById('btn-ir-paso2');
    const btnContar = document.getElementById('btn-contar');

    // Quitar glow del paso anterior
    _quitarGlow(btnIrPaso2);

    if (paso1) paso1.classList.add('hidden');
    if (paso2) paso2.classList.remove('hidden');
    if (btnContar) { btnContar.classList.remove('hidden'); btnContar.disabled = true; }

    // Resetear foto de conteo
    const wrap = document.getElementById('foto-preview-wrap');
    if (wrap) wrap.innerHTML = `
      <span class="foto-preview-icono">📸</span>
      <span class="foto-preview-texto">Tocá para tomar o subir la foto</span>`;
    fotoConteoBase64 = null;
  }

  function saltearRef() {
    fotoRefBase64 = null;
    irAlPaso2();
  }

  // ── FORMULARIO PERSONALIZADO ──────────────────────────────────
  function mostrarFormPersonalizado() {
    const f = document.getElementById('form-personalizado');
    if (f) f.classList.toggle('hidden');
  }

  function guardarObjetoPersonalizado() {
    const nombre = document.getElementById('custom-nombre')?.value?.trim();
    const emoji  = document.getElementById('custom-emoji')?.value?.trim() || '📌';
    if (!nombre) { alert('Escribí el nombre del objeto'); return; }

    const nuevo = {
      id:             `custom_${Date.now()}`,
      nombre,
      emoji,
      promptFallback: `Contá todos los "${nombre}" visibles en esta imagen. Solo respondé con el número entero, sin texto adicional.`
    };

    const lista = cargarObjetosPersonalizados();
    lista.push(nuevo);
    guardarObjetosPersonalizados(lista);

    const modal = document.getElementById('modal-contador-ia');
    if (modal) {
      modal.innerHTML = renderModal();
      _vincularInputs();
      seleccionarObjeto(nuevo.id);
    }
    UI.mostrarToast(`✅ "${nombre}" guardado`, 'success');
  }

  function eliminarObjeto(id) {
    const lista = cargarObjetosPersonalizados().filter(o => o.id !== id);
    guardarObjetosPersonalizados(lista);
    // También limpiar ref guardada
    const refs = _cargarTodasRefs();
    delete refs[id];
    _guardarTodasRefs(refs);

    const modal = document.getElementById('modal-contador-ia');
    if (modal) { modal.innerHTML = renderModal(); _vincularInputs(); }
  }

  // ── CARGA DE FOTOS ────────────────────────────────────────────
  function _vincularInputs() {
    const inputRef = document.getElementById('input-foto-ref');
    if (inputRef) inputRef.onchange = function() { _procesarFotoRef(this); };

    const inputContar = document.getElementById('input-foto-contar');
    if (inputContar) inputContar.onchange = function() { cargarFotoContar(this); };
  }

  function _procesarFotoRef(input) {
    const archivo = input?.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = e => {
      const resultado = e.target.result;
      fotoRefBase64 = resultado.split(',')[1];
      fotoRefMime   = archivo.type;
      refGuardada   = false;

      // Mostrar preview
      const wrap = document.getElementById('foto-ref-wrap');
      if (wrap) wrap.innerHTML = `<img src="${resultado}" class="foto-preview-img" alt="Referencia">`;

      // Habilitar botones
      const refAcciones = document.getElementById('ref-acciones');
      if (refAcciones) refAcciones.style.display = 'flex';

      const btnIrPaso2 = document.getElementById('btn-ir-paso2');
      if (btnIrPaso2) { btnIrPaso2.disabled = false; _aplicarGlow(btnIrPaso2); }
    };
    reader.readAsDataURL(archivo);
  }

  function cargarFotoContar(input) {
    const archivo = input?.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = e => {
      const resultado = e.target.result;
      fotoConteoBase64 = resultado.split(',')[1];
      fotoConteoMime   = archivo.type;

      const wrap = document.getElementById('foto-preview-wrap');
      if (wrap) wrap.innerHTML = `<img src="${resultado}" class="foto-preview-img" alt="Foto a contar">`;

      // Limpiar resultado anterior
      const res = document.getElementById('contador-resultado');
      if (res) { res.innerHTML = ''; res.classList.add('hidden'); }
      resultadoActual = null;

      // Habilitar botón contar
      const btn = document.getElementById('btn-contar');
      if (btn) { btn.disabled = false; _aplicarGlow(btn); }
    };
    reader.readAsDataURL(archivo);
  }

  // ── GUARDAR REF PARA FUTURO ───────────────────────────────────
  function guardarRefParaFuturo() {
    if (!objetoSeleccionado || !fotoRefBase64) return;
    const refs = _cargarTodasRefs();
    refs[objetoSeleccionado.id] = { b64: fotoRefBase64, mime: fotoRefMime };
    _guardarTodasRefs(refs);
    refGuardada = true;

    const btnGuardar = document.getElementById('btn-guardar-ref');
    if (btnGuardar) { btnGuardar.textContent = '✅ Guardado'; btnGuardar.disabled = true; }

    // Actualizar badge en el chip
    const chip = document.getElementById(`chip-${objetoSeleccionado.id}`);
    if (chip && !chip.querySelector('.chip-ref-badge')) {
      chip.insertAdjacentHTML('beforeend', '<span class="chip-ref-badge">📎</span>');
    }

    UI.mostrarToast('📎 Referencia guardada para próximos conteos', 'success');
  }

  function _limpiarRefGuardada() {
    if (!objetoSeleccionado) return;
    const refs = _cargarTodasRefs();
    delete refs[objetoSeleccionado.id];
    _guardarTodasRefs(refs);
    fotoRefBase64 = null;
    refGuardada = false;
    _mostrarPaso1();
  }

  // ── CONTEO IA ─────────────────────────────────────────────────
  async function contar() {
    if (!objetoSeleccionado || !fotoConteoBase64 || contando) return;

    const btn = document.getElementById('btn-contar');
    const res = document.getElementById('contador-resultado');
    if (!btn || !res) return;

    contando = true;
    btn.disabled = true;
    _quitarGlow(btn);
    btn.innerHTML = '⏳ Analizando…';
    res.classList.add('hidden');

    try {
      const { cantidad, elementos } = await llamarGemini();
      resultadoActual = cantidad;

      const modoRef = fotoRefBase64 ? '🎯 con referencia visual' : '📝 por descripción';

      // Construir el html del resultado
      const hayCoords = elementos && elementos.length > 0;
      res.innerHTML = `
        <div class="resultado-numero">${cantidad}</div>
        <div class="resultado-label">${objetoSeleccionado.emoji} ${objetoSeleccionado.nombre} detectados</div>
        <div class="resultado-modo">${modoRef}${hayCoords ? ' · con mapa visual' : ''}</div>
        ${hayCoords ? '<div id="canvas-etiquetas-wrap" class="canvas-etiquetas-wrap"></div>' : ''}
        <div class="resultado-acciones">
          <button class="btn-secondary btn-sm" onclick="ContadorIA.copiarResultado()">📋 Copiar</button>
          <button class="btn-primary btn-sm" onclick="ContadorIA.usarEnCarga()">✅ Usar en CARGAR</button>
        </div>`;
      res.classList.remove('hidden');

      // Dibujar canvas con etiquetas si hay coordenadas
      if (hayCoords) {
        await _dibujarEtiquetasCanvas(
          `data:${fotoConteoMime};base64,${fotoConteoBase64}`,
          elementos,
          'canvas-etiquetas-wrap'
        );
      }

      // Glow en botón 'Usar en CARGAR'
      const btnUsarEnCarga = res.querySelector('button.btn-primary');
      _aplicarGlow(btnUsarEnCarga);
    } catch (e) {
      res.innerHTML = `<div class="resultado-error">⚠️ ${e.message}</div>`;
      res.classList.remove('hidden');
    }

    contando = false;
    btn.disabled = false;
    btn.innerHTML = '🔍 Contar con IA';
  }

  async function llamarGemini() {
    const apiKey = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_KEY && CONFIG.GEMINI_KEY !== 'TU_GEMINI_API_KEY')
      ? CONFIG.GEMINI_KEY : null;

    // Modo demo (sin API Key real)
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1500));
      const cantDemo = Math.floor(Math.random() * 8) + 3;
      const elementosDemo = Array.from({ length: cantDemo }, () => ({
        cx: parseFloat((0.1 + Math.random() * 0.8).toFixed(3)),
        cy: parseFloat((0.1 + Math.random() * 0.8).toFixed(3))
      }));
      return { cantidad: cantDemo, elementos: elementosDemo };
    }

    const parts = [];

    // Prompt JSON con coordenadas
    const instruccionBase = fotoRefBase64
      ? `INSTRUCCIÓN CRÍTICA DE CONTEO CON REFERENCIA:
- La IMAGEN 1 es tu REFERENCIA VISUAL: muestra exactamente 1 (un) "${objetoSeleccionado.nombre}" que debés buscar.
- La IMAGEN 2 es la foto real donde tenés que contar.
- Tu única tarea: detectar todos los objetos VISUALMENTE IDÉNTICOS O MUY SIMILARES al de la IMAGEN 1 en la IMAGEN 2.
- IGNORÁ completamente cualquier otro elemento, espacio vacío, recipiente o fondo.
- Para cada objeto detectado en la IMAGEN 2 indicá su posición central como fracción (0.0 a 1.0) del ancho y alto de la imagen.
- Respondé ÚNICAMENTE con este JSON (sin markdown, sin explicación):
{"total": <número entero>, "elementos": [{"cx": 0.25, "cy": 0.40}, ...]}`
      : `${objetoSeleccionado.promptFallback.replace('Solo respondé con el número entero.', '')}
- Para cada objeto detectado indicá su posición central como fracción (0.0 a 1.0) del ancho y alto de la imagen.
- Respondé ÚNICAMENTE con este JSON (sin markdown, sin explicación):
{"total": <número entero>, "elementos": [{"cx": 0.25, "cy": 0.40}, ...]}`;

    parts.push({ text: instruccionBase });

    if (fotoRefBase64) {
      parts.push({ inline_data: { mime_type: fotoRefMime, data: fotoRefBase64 } });
      parts.push({ text: 'IMAGEN 2 (foto a contar):' });
    }

    parts.push({ inline_data: { mime_type: fotoConteoMime, data: fotoConteoBase64 } });

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.05 }
    };

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) throw new Error(`Error de API (${r.status})`);
    const data = await r.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Intentar parsear JSON de coordenadas
    try {
      // Limpiar posible markdown code block
      const jsonLimpio = texto.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(jsonLimpio);
      if (typeof parsed.total === 'number' && Array.isArray(parsed.elementos)) {
        return { cantidad: parsed.total, elementos: parsed.elementos };
      }
    } catch (_) { /* continúa al fallback */ }

    // Fallback: solo número
    const match = texto.match(/\d+/);
    if (!match) throw new Error('La IA no devolvió un número válido');
    return { cantidad: parseInt(match[0]), elementos: [] };
  }

  // ── CANVAS CON ETIQUETAS NUMERADAS ──────────────────────────────
  async function _dibujarEtiquetasCanvas(dataUrl, elementos, wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    // Cargar imagen en un objeto Image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    // Canvas con tamaño proporcional (máx 400px de ancho en mobile)
    const MAX_W = Math.min(wrap.clientWidth || 380, 500);
    const escala = MAX_W / img.naturalWidth;
    const W = Math.round(img.naturalWidth * escala);
    const H = Math.round(img.naturalHeight * escala);

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    canvas.style.cssText = 'width:100%;border-radius:10px;display:block;';
    wrap.innerHTML = '';
    wrap.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);

    // ── Parámetros de estilo ─────────────────────────
    const RADIO_PUNTO  = 5;          // círculo en el objeto
    const ETIQ_W       = 26;         // ancho etiqueta
    const ETIQ_H       = 20;         // alto etiqueta
    const MARGEN       = 10;         // separación respecto al punto
    const RADIO_ETIQ   = 4;          // radio borde etiqueta
    const COLORES = [
      '#FF5252','#FF9800','#FFEB3B','#66BB6A',
      '#26C6DA','#7E57C2','#EC407A','#29B6F6'
    ];

    // Pre-calcular posiciones de cada etiqueta con anti-colisión
    const ocupados = []; // [{x,y,w,h}]

    // Cuadrantes de offset para la etiqueta: derecha-arriba, derecha-abajo, izq-arriba, izq-abajo
    const OFFSETS = [
      [ MARGEN, -ETIQ_H - MARGEN],
      [ MARGEN,  MARGEN],
      [-ETIQ_W - MARGEN, -ETIQ_H - MARGEN],
      [-ETIQ_W - MARGEN,  MARGEN],
      [ MARGEN, -ETIQ_H / 2],
      [-ETIQ_W - MARGEN, -ETIQ_H / 2]
    ];

    function colisiona(rect) {
      for (const o of ocupados) {
        if (rect.x < o.x + o.w && rect.x + rect.w > o.x &&
            rect.y < o.y + o.h && rect.y + rect.h > o.y) return true;
      }
      return false;
    }

    function dentroCanvas(rect) {
      return rect.x >= 2 && rect.y >= 2 &&
             rect.x + rect.w <= W - 2 && rect.y + rect.h <= H - 2;
    }

    function elegirPosEtiqueta(px, py) {
      for (const [dx, dy] of OFFSETS) {
        const r = { x: px + dx, y: py + dy, w: ETIQ_W, h: ETIQ_H };
        if (dentroCanvas(r) && !colisiona(r)) return r;
      }
      // Sin espacio libre → poner arriba-derecha y aceptar superposición
      return { x: Math.min(px + MARGEN, W - ETIQ_W - 2), y: Math.max(py - ETIQ_H - MARGEN, 2), w: ETIQ_W, h: ETIQ_H };
    }

    // Dibujar todos los elementos
    elementos.forEach((el, idx) => {
      const px = Math.round(el.cx * W);
      const py = Math.round(el.cy * H);
      const color = COLORES[idx % COLORES.length];
      const num = idx + 1;

      const rect = elegirPosEtiqueta(px, py);
      ocupados.push(rect);

      // Punto en el objeto (anillo + relleno)
      ctx.beginPath();
      ctx.arc(px, py, RADIO_PUNTO + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, RADIO_PUNTO, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Línea conectora desde punto al borde más cercano de la etiqueta
      const etiqCx = rect.x + rect.w / 2;
      const etiqCy = rect.y + rect.h / 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(etiqCx, etiqCy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fondo de la etiqueta con sombra
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, RADIO_ETIQ);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Borde blanco
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, RADIO_ETIQ);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Número
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${num < 10 ? 12 : 10}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5);
    });
  }

  // ── ACCIONES DEL RESULTADO ────────────────────────────────────
  function copiarResultado() {
    if (resultadoActual === null) return;
    navigator.clipboard?.writeText(String(resultadoActual))
      .then(() => UI.mostrarToast(`📋 ${resultadoActual} copiado`, 'success'))
      .catch(() => UI.mostrarToast(`Resultado: ${resultadoActual}`, 'info'));
  }

  function usarEnCarga() {
    if (resultadoActual === null) return;
    const campo = objetoSeleccionado?.id;
    if (campo === 'huevos' && typeof ModuloProduccion !== 'undefined') {
      ModuloProduccion.establecerValor('huevos', resultadoActual);
      cerrar();
      UI.mostrarToast(`✅ ${resultadoActual} huevos cargados`, 'success');
    } else if (campo === 'gallinas') {
      UI.mostrarToast(`🐔 ${resultadoActual} gallinas detectadas`, 'info');
      cerrar();
    } else {
      copiarResultado();
      cerrar();
      UI.mostrarToast(`✅ Resultado: ${resultadoActual} copiado`, 'success');
    }
  }

  // ── STORAGE ───────────────────────────────────────────────────
  function cargarObjetosPersonalizados() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function guardarObjetosPersonalizados(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    objetosPersonalizados = lista;
  }

  function _cargarTodasRefs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_REFS_KEY) || '{}'); }
    catch { return {}; }
  }

  function _guardarTodasRefs(refs) {
    localStorage.setItem(STORAGE_REFS_KEY, JSON.stringify(refs));
  }

  function _cargarRefGuardada(objetoId) {
    const refs = _cargarTodasRefs();
    return refs[objetoId] || null;
  }

  function _tieneRefGuardada(objetoId) {
    const refs = _cargarTodasRefs();
    return !!refs[objetoId];
  }

  // ── API PÚBLICA ───────────────────────────────────────────────
  return {
    abrir, cerrar,
    seleccionarObjeto,
    irAlPaso2,
    saltearRef,
    mostrarFormPersonalizado,
    guardarObjetoPersonalizado,
    eliminarObjeto,
    cargarFotoContar,
    guardarRefParaFuturo,
    _limpiarRefGuardada,
    contar,
    copiarResultado,
    usarEnCarga
  };
})();
