// contador_ia.js — Módulo de conteo IA por foto con Gemini Vision
const ContadorIA = (() => {

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // Objetos predefinidos
  const OBJETOS_PREDEF = [
    { id: 'huevos',   nombre: 'Huevos',   emoji: '🥚', prompt: 'Contá todos los huevos visibles en esta imagen. Solo respondé con el número entero, sin texto adicional.' },
    { id: 'gallinas', nombre: 'Gallinas', emoji: '🐔', prompt: 'Contá todas las gallinas o aves visibles en esta imagen. Solo respondé con el número entero, sin texto adicional.' },
    { id: 'maples',   nombre: 'Maples',   emoji: '📦', prompt: 'Contá todos los maples, bandejas o cartones de huevos visibles en esta imagen. Solo respondé con el número entero, sin texto adicional.' },
  ];

  const STORAGE_KEY = 'gfi_objetos_contador';
  let objetosPersonalizados = [];
  let objetoSeleccionado   = null;
  let fotoConteoBase64     = null;
  let fotoConteoMime       = 'image/jpeg';
  let contando             = false;
  let resultadoActual      = null;

  // ── ABRIR MODAL ───────────────────────────────────────────────
  function abrir(preseleccionado = null) {
    objetosPersonalizados = cargarObjetosPersonalizados();
    fotoConteoBase64  = null;
    resultadoActual   = null;
    objetoSeleccionado = null;

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

    // Preseleccionar si se indicó
    if (preseleccionado) seleccionarObjeto(preseleccionado);
    configurarInputFoto();
  }

  function cerrar() {
    const modal = document.getElementById('modal-contador-ia');
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => modal.classList.add('hidden'), 280);
  }

  // ── RENDER ────────────────────────────────────────────────────
  function renderModal() {
    objetosPersonalizados = cargarObjetosPersonalizados();
    const todos = [...OBJETOS_PREDEF, ...objetosPersonalizados];

    return `
    <div class="contador-modal">
      <div class="contador-modal-header">
        <span class="contador-titulo">📷 Contar por foto</span>
        <button class="contador-cerrar" onclick="ContadorIA.cerrar()">✕</button>
      </div>

      <!-- Selector de objeto -->
      <div class="contador-seccion">
        <p class="contador-label">¿Qué querés contar?</p>
        <div class="contador-chips" id="contador-chips">
          ${todos.map(o => `
            <button class="chip-objeto" id="chip-${o.id}"
              onclick="ContadorIA.seleccionarObjeto('${o.id}')">
              <span class="chip-emoji">${o.emoji}</span>
              <span>${o.nombre}</span>
              ${o.foto_ref ? '<span class="chip-ref-badge" title="Tiene foto de referencia">📎</span>' : ''}
            </button>
          `).join('')}
          <button class="chip-objeto chip-agregar" onclick="ContadorIA.mostrarFormPersonalizado()">
            <span class="chip-emoji">➕</span>
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      <!-- Formulario objeto personalizado (oculto por defecto) -->
      <div id="form-personalizado" class="contador-form-custom hidden">
        <input class="campo-input" id="custom-nombre" placeholder="Nombre del objeto (ej: Cajones)" maxlength="30">
        <input class="campo-input" id="custom-emoji" placeholder="Emoji (ej: 📦)" maxlength="4" style="width:70px">
        <div class="contador-ref-upload">
          <label class="btn-secondary btn-sm" for="input-foto-ref">
            📎 Foto de referencia (opcional)
          </label>
          <input type="file" id="input-foto-ref" accept="image/*" class="hidden"
            onchange="ContadorIA.cargarFotoReferencia(this)">
          <span id="ref-status" class="ref-status-text"></span>
        </div>
        <button class="btn-primary btn-sm" onclick="ContadorIA.guardarObjetoPersonalizado()">
          💾 Guardar objeto
        </button>
      </div>

      <!-- Foto a contar -->
      <div class="contador-seccion" id="sec-foto-contar">
        <p class="contador-label">Foto a analizar</p>
        <div class="contador-foto-area" id="foto-area" onclick="document.getElementById('input-foto-contar').click()">
          <input type="file" id="input-foto-contar" accept="image/*" capture="environment" class="hidden"
            onchange="ContadorIA.cargarFotoContar(this)">
          <div id="foto-preview-wrap" class="foto-preview-empty">
            <span class="foto-preview-icono">📸</span>
            <span class="foto-preview-texto">Tocá para tomar o subir una foto</span>
          </div>
        </div>
      </div>

      <!-- Resultado -->
      <div id="contador-resultado" class="contador-resultado hidden"></div>

      <!-- Botón contar -->
      <button id="btn-contar" class="btn-primary btn-full" onclick="ContadorIA.contar()" disabled>
        🔍 Contar con IA
      </button>

      <!-- Lista objetos personalizados -->
      ${objetosPersonalizados.length ? `
      <div class="contador-seccion contador-mis-objetos">
        <p class="contador-label">Mis objetos personalizados</p>
        ${objetosPersonalizados.map(o => `
          <div class="objeto-custom-row">
            <span>${o.emoji} ${o.nombre}</span>
            ${o.foto_ref ? '<span class="chip-ref-badge">📎 con referencia</span>' : ''}
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
    document.querySelectorAll('#contador-chips .chip-objeto').forEach(c => c.classList.remove('activo'));
    document.getElementById(`chip-${id}`)?.classList.add('activo');
    actualizarBotonContar();
  }

  // ── FORMULARIO PERSONALIZADO ──────────────────────────────────
  function mostrarFormPersonalizado() {
    const f = document.getElementById('form-personalizado');
    if (f) f.classList.toggle('hidden');
  }

  let fotoRefBase64 = null;
  let fotoRefMime   = 'image/jpeg';

  function cargarFotoReferencia(input) {
    const archivo = input?.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = e => {
      const resultado = e.target.result;
      fotoRefBase64 = resultado.split(',')[1];
      fotoRefMime   = archivo.type;
      const st = document.getElementById('ref-status');
      if (st) st.textContent = '✅ Referencia cargada';
    };
    reader.readAsDataURL(archivo);
  }

  function guardarObjetoPersonalizado() {
    const nombre = document.getElementById('custom-nombre')?.value?.trim();
    const emoji  = document.getElementById('custom-emoji')?.value?.trim() || '📌';
    if (!nombre) { alert('Escribí el nombre del objeto'); return; }

    const nuevo = {
      id:      `custom_${Date.now()}`,
      nombre,
      emoji,
      foto_ref:       fotoRefBase64 ? true : false,
      foto_ref_b64:   fotoRefBase64 || null,
      foto_ref_mime:  fotoRefMime,
      prompt: `Contá todos los "${nombre}" visibles en esta imagen. Solo respondé con el número entero, sin texto adicional.`
    };

    const lista = cargarObjetosPersonalizados();
    lista.push(nuevo);
    guardarObjetosPersonalizados(lista);

    fotoRefBase64 = null;
    const modal = document.getElementById('modal-contador-ia');
    if (modal) {
      modal.innerHTML = renderModal();
      configurarInputFoto();
      seleccionarObjeto(nuevo.id);
    }
    UI.mostrarToast(`✅ "${nombre}" guardado`, 'success');
  }

  function eliminarObjeto(id) {
    const lista = cargarObjetosPersonalizados().filter(o => o.id !== id);
    guardarObjetosPersonalizados(lista);
    const modal = document.getElementById('modal-contador-ia');
    if (modal) { modal.innerHTML = renderModal(); configurarInputFoto(); }
  }

  // ── FOTO A CONTAR ─────────────────────────────────────────────
  function configurarInputFoto() {
    const input = document.getElementById('input-foto-contar');
    if (input) {
      input.onchange = function() { ContadorIA.cargarFotoContar(this); };
    }
  }

  function cargarFotoContar(input) {
    const archivo = input?.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = e => {
      const resultado = e.target.result;
      fotoConteoBase64 = resultado.split(',')[1];
      fotoConteoMime   = archivo.type;

      // Mostrar preview
      const wrap = document.getElementById('foto-preview-wrap');
      if (wrap) {
        wrap.innerHTML = `<img src="${resultado}" class="foto-preview-img" alt="Foto a contar">`;
      }

      // Limpiar resultado anterior
      const res = document.getElementById('contador-resultado');
      if (res) { res.textContent = ''; res.classList.add('hidden'); }
      resultadoActual = null;

      actualizarBotonContar();
    };
    reader.readAsDataURL(archivo);
  }

  function actualizarBotonContar() {
    const btn = document.getElementById('btn-contar');
    if (btn) btn.disabled = !(objetoSeleccionado && fotoConteoBase64);
  }

  // ── CONTEO IA ─────────────────────────────────────────────────
  async function contar() {
    if (!objetoSeleccionado || !fotoConteoBase64 || contando) return;

    const btn = document.getElementById('btn-contar');
    const res = document.getElementById('contador-resultado');
    if (!btn || !res) return;

    contando = true;
    btn.disabled = true;
    btn.innerHTML = '⏳ Analizando…';
    res.classList.add('hidden');

    try {
      const cantidad = await llamarGemini();
      resultadoActual = cantidad;

      res.innerHTML = `
        <div class="resultado-numero">${cantidad}</div>
        <div class="resultado-label">${objetoSeleccionado.emoji} ${objetoSeleccionado.nombre} detectados</div>
        <div class="resultado-acciones">
          <button class="btn-secondary btn-sm" onclick="ContadorIA.copiarResultado()">📋 Copiar</button>
          <button class="btn-primary btn-sm" onclick="ContadorIA.usarEnCarga()">✅ Usar en CARGAR</button>
        </div>`;
      res.classList.remove('hidden');
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

    // Modo demo (sin API Key)
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1500)); // Simula latencia
      return Math.floor(Math.random() * 40) + 5;  // número demo
    }

    // Construir partes según si hay foto de referencia
    const parts = [];

    // Si el objeto personalizado tiene foto de referencia
    if (objetoSeleccionado.foto_ref_b64) {
      parts.push({ text: `IMAGEN 1: Es una foto de referencia que muestra el objeto que querés contar.\nIMAGEN 2: Es la foto real. Contá cuántos objetos iguales o similares al de la imagen 1 hay en la imagen 2. Solo respondé con el número entero, sin ningún texto adicional.` });
      parts.push({ inline_data: { mime_type: objetoSeleccionado.foto_ref_mime || 'image/jpeg', data: objetoSeleccionado.foto_ref_b64 } });
    } else {
      parts.push({ text: objetoSeleccionado.prompt });
    }

    parts.push({ inline_data: { mime_type: fotoConteoMime, data: fotoConteoBase64 } });

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { maxOutputTokens: 20, temperature: 0.1 }
    };

    const r = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) throw new Error(`Error de API (${r.status})`);
    const data = await r.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '0';

    // Extraer número del texto (por si Gemini agrega palabras)
    const match = texto.match(/\d+/);
    if (!match) throw new Error('La IA no devolvió un número válido');
    return parseInt(match[0]);
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
    // Si estamos en el módulo de carga y el campo existe, lo actualiza
    if (campo === 'huevos' && typeof ModuloProduccion !== 'undefined') {
      ModuloProduccion.establecerValor('huevos', resultadoActual);
      cerrar();
      UI.mostrarToast(`✅ ${resultadoActual} huevos cargados`, 'success');
    } else if (campo === 'gallinas') {
      UI.mostrarToast(`🐔 ${resultadoActual} gallinas detectadas`, 'info');
      cerrar();
    } else {
      UI.mostrarToast(`✅ Resultado: ${resultadoActual} — copiado para usar`, 'success');
      copiarResultado();
      cerrar();
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

  return {
    abrir, cerrar,
    seleccionarObjeto,
    mostrarFormPersonalizado,
    cargarFotoReferencia,
    guardarObjetoPersonalizado,
    eliminarObjeto,
    cargarFotoContar,
    contar,
    copiarResultado,
    usarEnCarga
  };
})();
