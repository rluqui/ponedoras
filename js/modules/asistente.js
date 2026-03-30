// asistente.js — Asistente IA "Don Pepe" de Granja Familiar Inteligente
const Asistente = (() => {

  // ── CONFIGURACIÓN ────────────────────────────────────────────
  // Colocá tu Gemini API Key en config.js → CONFIG.GEMINI_KEY
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const SISTEMA_PROMPT = `Sos "Don Pepe", el asistente inteligente de la app Granja Familiar Inteligente.

PERFIL:
Sos un experto consultor con más de 30 años de experiencia en:
- Avicultura familiar y semi-industrial en Argentina
- Producción de huevos (gallinas ponedoras: Hy-Line, Lohmann, ISA Brown, etc.)
- Sistemas de producción: jaula, piso, campero, granja libre, orgánico
- Sanidad animal, veterinaria aviar, vacunación, bioseguridad
- Bromatología y calidad del huevo (categorías, normativas SENASA)
- Gestión de granjas familiares: organización, roles, tareas
- Alimentación y nutrición de gallinas ponedoras
- Costos, rentabilidad, precios del maple en Argentina
- Ventas directas, redes sociales, marketing rural
- Monotributo y aspectos impositivos para pequeños productores
- SENASA: habilitaciones, trazabilidad, branding
- Legislación provincial de Mendoza para producción avícola
- Bienestar animal según normativas argentinas

APP - MÓDULOS DISPONIBLES:
- HOY: pantalla principal con KPIs del día (huevos, mortandad, agua, tareas)
- GRANJA: gestión de galpones con semáforos de estado
- CARGAR (PRODUCCIÓN): formulario rápido de carga diaria (< 20 segundos)
- EQUIPO: gestión familiar con roles y tareas asignadas
- REDES: generador de textos y calendario de publicaciones para vender más
- INSPECCIÓN IA: fotos con análisis inteligente del estado de galpones
- Asistente: este chat

NIVEL DEL PRODUCTOR:
- Nivel 1 — Granja Familiar: funciones básicas
- Nivel 2 — Productor Organizado: más módulos
- Nivel 3 — En Crecimiento: acceso completo
- Nivel 4 — Microempresa: reportes avanzados

TONO Y ESTILO:
- Simple, cálido, cercano, rural y MUY DIDÁCTICO. Es fundamental que asumas que el productor no sabe NADA y arranca desde cero.
- Tus respuestas deben ser DETALLADAS Y EXHAUSTIVAS, guiando paso a paso.
- Cuando hables de alimentación, vacunas o insumos, RECOMENDÁ MARCAS COMERCIALES CONCRETAS (ej: Gepsa, Cargill, Alimentos Pilar, Ganave, Biogénesis, etc) y productos específicos que puedan pedir en la veterinaria o forrajería.
- Sin tecnicismos innecesarios, pero explicando el "por qué" de las cosas.
- Usás palabras del campo argentino cuando es apropiado.

CAPACIDADES:
- Ayudás a navegar la app ("Para cargar los huevos, tocá el botón CARGAR")
- Respondés sobre sanidad aviar (enfermedades, vacunas, síntomas)
- Asesorás sobre precios, costos y rentabilidad en pesos argentinos
- Explicás trámites SENASA y habilitaciones
- Respondés sobre recetas y calidad del huevo
- Dás tips de venta por redes sociales
- Sugerís mejoras según el nivel del productor
- Ayudás con temas de Monotributo y facturación básica

IMPORTANTE:
- Si la pregunta es médica urgente (animal o persona) siempre recomendás consultar a un profesional
- Para temas legales complejos siempre sugerís consultar a un contador o abogado
- Respondés siempre en español rioplatense (vos, acá, dale)
- Nunca inventés precios o normativas si no estás seguro`;

  let historial = [];
  let abierto   = false;
  let cargando  = false;

  // ── RENDER DEL BOTÓN FLOTANTE ─────────────────────────────────
  function iniciar() {
    if (document.getElementById('btn-asistente-flotante')) return; // solo una vez

    // Botón flotante — más visible con texto
    const btn = document.createElement('button');
    btn.id        = 'btn-asistente-flotante';
    btn.className = 'btn-asistente-flotante btn-asistente-pulse';
    btn.innerHTML = '<span class="fab-icono">👨‍🌾</span><span class="fab-label">Don Pepe</span>';
    btn.title     = 'Preguntale a Don Pepe, tu asistente granjero';
    btn.onclick   = toggleChat;
    document.body.appendChild(btn);

    // Panel del chat
    if (!document.getElementById('chat-asistente')) {
      const panel = document.createElement('div');
      panel.id        = 'chat-asistente';
      panel.className = 'chat-asistente hidden';
      panel.innerHTML = renderPanel();
      document.body.appendChild(panel);
    }

    // Quitar animación de pulso después de 4 segundos
    setTimeout(() => btn.classList.remove('btn-asistente-pulse'), 4000);
  }

  function renderPanel() {
    return `
    <div class="chat-header">
      <div class="chat-header-info">
        <span class="chat-avatar">👨‍🌾</span>
        <div>
          <p class="chat-nombre">Don Pepe 🥚</p>
          <p class="chat-sub">Tu granjero virtual · Ponedoras &amp; Huevos</p>
        </div>
      </div>
      <button class="chat-cerrar" onclick="Asistente.cerrar()">✕</button>
    </div>

    <div class="chat-mensajes" id="chat-mensajes">
      <div class="chat-bienvenida">
        <span class="bienvenida-icono">🥚🐔</span>
        <p class="bienvenida-titulo">¡Buenas! Soy Don Pepe</p>
        <p class="bienvenida-desc">Granjero con 30 años criando ponedoras. Preguntame sobre alimento, vacunas, postura, costos o cómo usar la app.</p>
        <div class="sugerencias-rapidas">
          <button class="chip-sugerencia" onclick="Asistente.preguntaRapida('¿Qué alimento le doy a mis gallinas según la edad del lote?')">🌾 Alimento por edad</button>
          <button class="chip-sugerencia" onclick="Asistente.preguntaRapida('¿Cómo cargo los huevos del día?')">🥚 Cargar huevos</button>
          <button class="chip-sugerencia" onclick="Asistente.preguntaRapida('¿Qué vacunas necesitan mis gallinas?')">💉 Vacunas</button>
          <button class="chip-sugerencia" onclick="Asistente.preguntaRapida('Mi gallina está con diarrea verde, ¿qué puede ser?')">🩺 Gallina enferma</button>
          <button class="chip-sugerencia" onclick="Asistente.preguntaRapida('¿Cómo mejorar mis ventas en Instagram?')">📱 Vender más</button>
          <button class="chip-sugerencia" onclick="Asistente.preguntaRapida('¿Qué necesita SENASA para habilitar mi granja?')">📋 SENASA</button>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="chat-input-wrap">
        <textarea
          id="chat-input"
          class="chat-input"
          placeholder="Preguntá lo que quieras..."
          rows="1"
          onkeydown="Asistente.teclaEnter(event)"
          oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
        ></textarea>
        <button class="chat-enviar" id="chat-enviar" onclick="Asistente.enviar()">
          <span>➤</span>
        </button>
      </div>
      <p class="chat-disclaimer">Verificá info importante con profesionales</p>
    </div>`;
  }

  // ── TOGGLE CHAT ───────────────────────────────────────────────
  function toggleChat() {
    abierto ? cerrar() : abrir();
  }

  function abrir() {
    abierto = true;
    // Crear overlay si no existe
    let overlay = document.getElementById('chat-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id        = 'chat-overlay';
      overlay.className = 'chat-overlay';
      overlay.onclick   = cerrar;
      document.body.appendChild(overlay);
    }
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const panel = document.getElementById('chat-asistente');
    const btn   = document.getElementById('btn-asistente-flotante');
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('abierto'));
    if (btn) {
      btn.innerHTML = '<span class="fab-icono">👨‍🌾</span><span class="fab-label">Cerrar</span>';
      btn.classList.add('activo');
    }
    setTimeout(() => document.getElementById('chat-input')?.focus(), 400);
  }

  function cerrar() {
    abierto = false;
    const panel   = document.getElementById('chat-asistente');
    const btn     = document.getElementById('btn-asistente-flotante');
    const overlay = document.getElementById('chat-overlay');

    panel?.classList.remove('abierto');
    overlay?.classList.remove('visible');
    if (btn) {
      btn.innerHTML = '<span class="fab-icono">👨‍🌾</span><span class="fab-label">Don Pepe</span>';
      btn.classList.remove('activo');
    }
  }

  // ── ENVIAR MENSAJE ────────────────────────────────────────────
  async function enviar() {
    const input = document.getElementById('chat-input');
    const texto = input?.value.trim();
    if (!texto || cargando) return;
    input.value = '';
    input.style.height = 'auto';
    enviarMensaje(texto);
  }

  function teclaEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  function preguntaRapida(texto) {
    // Limpiar bienvenida
    const bienvenida = document.querySelector('.chat-bienvenida');
    if (bienvenida) bienvenida.remove();
    enviarMensaje(texto);
  }

  async function enviarMensaje(texto) {
    // Limpiar bienvenida si existe
    const bienvenida = document.querySelector('.chat-bienvenida');
    if (bienvenida) bienvenida.remove();

    // Agregar mensaje del usuario
    agregarMensaje('usuario', texto);
    historial.push({ role: 'user', parts: [{ text: texto }] });

    // Indicador de carga
    cargando = true;
    const idCargando = agregarMensajeCargando();
    actualizarBotonEnviar(true);

    try {
      const respuesta = await llamarGemini(texto);
      quitarMensajeCargando(idCargando);
      agregarMensaje('asistente', respuesta);
      historial.push({ role: 'model', parts: [{ text: respuesta }] });
      // Limitar historial a 20 mensajes
      if (historial.length > 20) historial = historial.slice(-20);
    } catch (e) {
      quitarMensajeCargando(idCargando);
      agregarMensaje('asistente', '⚠️ No pude conectarme ahora. Verificá que tenés internet o que la API Key de Gemini esté configurada en `config.js`. Podés intentar de nuevo en un momento.');
    }

    cargando = false;
    actualizarBotonEnviar(false);
  }

  async function llamarGemini(pregunta) {
    const apiKey = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_KEY) ? CONFIG.GEMINI_KEY : null;

    // Modo sin API Key: respuestas de ejemplo
    if (!apiKey || apiKey === 'TU_GEMINI_API_KEY') {
      return respuestaDemo(pregunta);
    }

    const body = {
      system_instruction: { parts: [{ text: SISTEMA_PROMPT }] },
      contents: historial.length > 1
        ? historial
        : [{ role: 'user', parts: [{ text: pregunta }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
    };

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
  }

  // Respuestas demo cuando no hay API Key configurada (contextual con historial)
  function respuestaDemo(pregunta) {
    const p = pregunta.toLowerCase().trim();

    // Determiná si el usuario está haciendo un seguimiento de la charla
    const ultimaRespuesta = historial.length >= 2
      ? (historial[historial.length - 2]?.parts?.[0]?.text || '').toLowerCase()
      : '';

    // ── VACUNAS (específicas por nombre) ──────────────────────────
    if (p === 'marek' || p.includes('vacuna marek') || p.includes('sobre marek')) {
      return '💉 **Marek** es la vacuna más crítica: se aplica **al primer día de vida** del pollito, antes de que salga del criadero. Es contra la enfermedad de Marek (Herpesvirus aviar). Si comprás pollitas ya nacidas en un criadero habilitado, generalmente vienen vacunadas. Preguntá siempre el certificado al proveedor.';
    }
    if (p.includes('newcastle') || p === 'newcastle') {
      return '💉 **Newcastle** se aplica en semanas 4, 8 y 18, con refuerzos anuales. Es obligatoria según SENASA. Podés dar la vacuna por el agua de bebida, ocular o por spray según el tipo (la B1 es de uso común en granjas familiares). ¿Tu lote ya fue vacunado?';
    }
    if (p.includes('gumboro') || p === 'gumboro') {
      return '💉 **Gumboro** (Enfermedad de la Bolsa de Fabricio) se aplica en semanas 3 y 6. Afecta principalmente pollitas jóvenes debilitando el sistema inmune. En granjas familiares suele darse por el agua de bebida. ¿Cuántas semanas tienen tus pollitas?';
    }
    if (p.includes('bronquitis') || p.includes('ib')) {
      return '💉 **Bronquitis Infecciosa** generalmente se aplica junto con Newcastle (semanas 4, 8 y 18). Hay vacunas combinadas que cubren ambas en una sola dosis. Síntomas de brote: tos, disminución de postura y huevos con cáscara rugosa.';
    }

    // ── SEGUIMIENTO: si la respuesta anterior habló de vacunas ───
    if (ultimaRespuesta.includes('vacuna') || ultimaRespuesta.includes('marek') || ultimaRespuesta.includes('newcastle')) {
      if (p.includes('cuándo') || p.includes('cuando') || p.includes('qué edad') || p.includes('fecha'))
        return '📅 El calendario básico es: **Día 1** → Marek · **Semana 3** → Gumboro 1ra · **Semana 4** → Newcastle + Bronquitis · **Semana 6** → Gumboro 2da · **Semana 8 y 18** → Refuerzo Newcastle. Después, refuerzos anuales. Siempre validalo con tu veterinario de zona.';
      if (p.includes('cómo') || p.includes('como') || p.includes('se aplica') || p.includes('dosis'))
        return '💧 Las vacunas para gallinas se aplican principalmente por **agua de bebida** (disolvés la vacuna en agua sin cloro), **ocular** (gotas en el ojo) o **spray** para grupos grandes. Tu veterinario puede enseñarte la técnica correcta por primera vez.';
      if (p.includes('consigo') || p.includes('compro') || p.includes('dónde') || p.includes('precio'))
        return '🏪 Las vacunas avícolas se consiguen en **veterinarias agrícolas** o por proveedores de insumos para granjas. En Mendoza buscá veterinarias especializadas en animales de campo. Necesitás cadena de frío para transportarlas (heladera). Pedí siempre el prospecto oficial.';
      if (p.includes('gracias') || p === 'ok' || p === 'dale')
        return '¡De nada! Si tenés más dudas sobre sanidad u otros temas de la granja, acá estoy. 🐔';
    }

    // ── ALIMENTO POR EDAD DEL LOTE ───────────────────────────────
    if (p.includes('alimento') || p.includes('comida') || p.includes('ración') || p.includes('comer') || p.includes('edad') || p.includes('semana'))
      return '🌾 **Alimentación paso a paso para principiantes:**\n\nSi recién arrancás, lo más fácil y seguro es comprar **alimento balanceado comercial ya preparado** en la forrajería (marcas excelentes son Gepsa, Alimentos Pilar, Cargill o Ganave). Pedilos exactamente así según la edad que tengan tus gallinas:\n\n• **1. Iniciador (0 a 8 semanas de vida):** Pedí "Iniciador para ponedoras". Viene en polvo o micro-pellet con mucha proteína (22%) para que crezcan fuertes. Dales unos 20 a 30 gramos por pollita al día.\n\n• **2. Recría / Crecimiento (8 a 16 semanas):** Pedí "Alimento de Recría". Baja la proteína al 18% para que no engorden de golpe y no tiene casi calcio para no dañarles los riñones. Acá comerán unos 50 a 60 gramos por día.\n\n• **3. Pre-postura (16 a 18 semanas):** Es una etapa cortita de transición donde se les empieza a meter calcio. Pedí "Alimento Pre-postura" o mezclale conchas de ostra picada.\n\n• **4. Postura Activa (cuando empiezan a poner huevos):** Pedí "Alimento Alta Postura Fase 1". Este tiene 16% de proteína y muchísimo calcio (4%) que es fundamental para que la cáscara del huevo sea dura. Pasado el pico de producción (Fase 2) cambian a otro. Una gallina adulta come entre 100 y 120 gramos exactos por día.\n\n*💡 Consejo de Don Pepe:* Si les falta calcio, van a poner huevos con cáscara blanda. Podes comprar "Conchilla" suelta en la veterinaria y ponerles un tachito extra.\n\n¿Cuántas semanas tiene tu lote actualmente así te digo qué bolsa comprar?';

    // ── PRODUCCIÓN Y APP ─────────────────────────────────────────
    if (p.includes('cargar') || (p.includes('huevo') && !p.includes('vacuna')))
      return '🥚 Para cargar los huevos del día tocá **CARGAR** (lápiz ✏️) en la barra de abajo. Elegís el galpón, ponés la cantidad y el estado de agua y alimento. ¡En menos de 20 segundos!';

    // ── VACUNAS (pregunta general) ────────────────────────────────
    if (p.includes('vacuna') || p.includes('plan sanitario') || p.includes('inmuniz'))
      return '💉 Plan básico para ponedoras:\n• **Marek** → día 1 de vida\n• **Gumboro** → semanas 3 y 6\n• **Newcastle + Bronquitis** → semanas 4, 8 y 18\n\nPreguntame por una específica (escribí "Marek" o "Newcastle").';

    // ── ENFERMEDADES ─────────────────────────────────────────────
    if (p.includes('diarrea') || p.includes('enferma') || p.includes('muerta') || p.includes('sintoma'))
      return '🩺 Diarrea verde puede ser Newcastle, Salmonella o estrés por cambio de alimento. Fijate si hay otros síntomas: baja postura, estornudos, posturas raras. Si varias gallinas lo presentan, llamá al veterinario ya. ¿Cuántas lo muestran?';

    // ── SENASA / LEGAL ────────────────────────────────────────────
    if (p.includes('senasa') || p.includes('habilit'))
      return '📋 Para habilitar tu granja necesitás: **RensPA**, inscripción en el Registro de Establecimientos Avícolas y cumplir condiciones de bioseguridad. En Mendoza, contactá la Delegación SENASA de tu zona.';

    // ── MONOTRIBUTO / COSTOS ─────────────────────────────────────
    if (p.includes('monotributo') || p.includes('impuesto') || p.includes('factura') || p.includes('costo') || p.includes('precio'))
      return '💰 Como productor de huevos podés inscribirte como Monotributista. La categoría depende de tu facturación anual. Para ventas a almacenes o restaurantes conviene tener el monotributo. Consultá a un contador de tu zona.';

    // ── VENTAS / REDES ────────────────────────────────────────────
    if (p.includes('instagram') || p.includes('redes') || p.includes('vender') || p.includes('cliente'))
      return '📱 Para vender más: publicá entre 10am y 12pm mostrando las gallinas, huevos y tu familia trabajando. Usá el módulo **VENTAS** de la app para registrar clientes y escribirles por WhatsApp. El secreto: constancia diaria = más clientes.';

    // ── FALLBACK ─────────────────────────────────────────────────
    return '👨‍🌾 Entiendo tu pregunta. Para respuestas más completas configurá la API Key de Gemini en `js/config.js`. Por ahora puedo ayudarte con: **alimento por edad** 🌾, **vacunas** 💉, **enfermedades** 🩺, **SENASA** 📋, **Monotributo** 💰 o **cómo usar la app** 🥚.';
  }

  // ── MANEJO DE UI DEL CHAT ─────────────────────────────────────
  function agregarMensaje(tipo, texto) {
    const cont = document.getElementById('chat-mensajes');
    if (!cont) return;
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${tipo}`;
    // Convertir **negrita** a <strong>
    const htmlTexto = texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    div.innerHTML = tipo === 'asistente'
      ? `<span class="msg-avatar">👨‍🌾</span><div class="msg-burbuja">${htmlTexto}</div>`
      : `<div class="msg-burbuja">${htmlTexto}</div>`;
    cont.appendChild(div);
    cont.scrollTop = cont.scrollHeight;
  }

  function agregarMensajeCargando() {
    const cont = document.getElementById('chat-mensajes');
    if (!cont) return null;
    const id  = 'cargando-' + Date.now();
    const div = document.createElement('div');
    div.id        = id;
    div.className = 'chat-msg chat-msg-asistente';
    div.innerHTML = `<span class="msg-avatar">👨‍🌾</span><div class="msg-burbuja msg-cargando"><span></span><span></span><span></span></div>`;
    cont.appendChild(div);
    cont.scrollTop = cont.scrollHeight;
    return id;
  }

  function quitarMensajeCargando(id) {
    document.getElementById(id)?.remove();
  }

  function actualizarBotonEnviar(cargando) {
    const btn = document.getElementById('chat-enviar');
    if (btn) { btn.disabled = cargando; btn.innerHTML = cargando ? '⏳' : '<span>➤</span>'; }
  }

  return { iniciar, toggleChat, cerrar, enviar, teclaEnter, preguntaRapida };
})();
