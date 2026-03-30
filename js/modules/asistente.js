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
    const configKey = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_KEY && CONFIG.GEMINI_KEY !== 'TU_GEMINI_API_KEY') ? CONFIG.GEMINI_KEY : null;
    const localKey = localStorage.getItem('gfi_gemini_key');
    const apiKey = configKey || localKey;

    // Respuestas demo o solicitud de API Key
    if (!apiKey) {
      if (pregunta.toLowerCase().includes('configur') && (pregunta.toLowerCase().includes('como') || pregunta.toLowerCase().includes('dónde') || pregunta.toLowerCase().includes('donde') || pregunta.toLowerCase().includes('gemini'))) {
         return '⚙️ **Cómo configurar la Inteligencia Artificial:**\n\n1. Andá a la ruedita de **Configuración** abajo a la izquierda en tu pantalla principal.\n2. Buscá la sección que dice **Mi Cuenta**.\n3. Vas a ver un cuadrito rojo que dice "Asistente Virtual Inteligente (API Key)".\n4. Ahí pegás tu clave de Gemini (si no tenés una, buscala gratis en aistudio.google.com) y le dás a Guardar.\n\n¡Una vez guardada, cerrá este chat, volvelo a abrir y podré responderte con contexto del clima, mercados en tiempo real, e interpretar enfermedades específicas con memoria inteligente progresiva!';
      }
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
      return '💉 **Vacunación contra Marek (Paso a paso para principiantes):**\n\nEl Marek es un virus mortal que paraliza a las gallinas. Como recién empezás, el mejor consejo es **no vacunar vos mismo contra Marek**. ¿Por qué? Porque esta vacuna se aplica mediante una inyección debajo de la piel en el **cuello del pollito exactamente al primer día de nacer**.\n\n✅ **Lo que debés hacer:**\nTu única tarea es asegurarte de **comprar las pollitas en una cabaña o criadero certificado** (ej. Cabaña Sánchez, Avícola Luján, Cabaña Alihuen). Cuando te las entreguen a las 16 semanas (ya criadas), **EXIGILE al vendedor el certificado de vacunación firmado por un veterinario**. Si vienen con el certificado, ya estás cubierto de por vida contra Marek.';
    }
    if (p.includes('newcastle') || p === 'newcastle') {
      return '💉 **Newcastle (La vacuna obligatoria):**\n\nEsta es la vacuna más importante que vas a dar vos en tu granja de forma rutinaria. SENASA te obliga a tenerla al día.\n\n✅ **¿Qué comprar?**\nAndá a la veterinaria agropecuaria (ej. Veterinaria Cuyo o Luján) y pedí: "Una ampolla de vacuna viva contra Newcastle cepa La Sota" (Marcas: **Biogénesis Bagó, Tecnovax o Cevac**).\n\n✅ **¿Cómo se aplica fácil?**\nSi tenés pocas gallinas, podés aplicarla **gota en el ojo** (viene con un goterito). Agarrás la gallina suavemente, le ponés una gota en el ojo, esperás a que parpadee y hacés la siguiente. Si tenés muchas, diluís la ampolla en **agua mineral sin cloro** y se la das a tomar a la mañana temprano.\n\n**Calendario:** Se da un refuerzo cada año o cada 6 meses dependiendo la zona. ¿Tus gallinas ya pusieron huevos o son pichonas todavía?';
    }
    if (p.includes('gumboro') || p === 'gumboro') {
      return '💉 **Gumboro (Protección de Pishonas):**\n\nEl Gumboro le destruye las defensas a la pollita joven. \n\n✅ **¿Qué hacer si crías desde chiquitas?**\nTenés que comprar la ampolla en la veterinaria y dársela en el agua de bebida a la **Semana 3 y Semana 6** de vida. \n\n✅ **¿Qué hacer si compraste ponedoras de 16 semanas?**\nNo tenés que hacer nada. A esa edad ya se les pasó la etapa de riesgo de Gumboro. Solo fijate en el papel que te dio el vendedor que diga que se la aplicaron de chiquitas.';
    }
    if (p.includes('bronquitis') || p.includes('ib')) {
      return '💉 **Bronquitis Infecciosa:**\n\nEsta enfermedad hace que la gallina tosa, ponga menos huevos y los huevos salgan deformes o con la cáscara muy finita.\n\n✅ **¿Cómo se previene?**\nGeneralmente, cuando vas a comprar la vacuna de Newcastle (Bagó o Tecnovax), pedí la que viene **Combinada (Newcastle + Bronquitis)** en el mismo fresquito. Se aplica igual, una gotita en el ojo o en el agua, y matás dos pájaros de un tiro.';
    }

    // ── SEGUIMIENTO: si la respuesta anterior habló de vacunas ───
    if (ultimaRespuesta.includes('vacuna') || ultimaRespuesta.includes('marek') || ultimaRespuesta.includes('newcastle')) {
      if (p.includes('cuándo') || p.includes('cuando') || p.includes('qué edad') || p.includes('fecha'))
        return '📅 **El Calendario Simplificado de Vacunación:**\n\nSi compraste tus gallinas ya listas para poner (16 semanas), el criadero ya les dio Marek, Gumboro y las primeras de Newcastle. \nVos solo tenés que ocuparte de darle el **Refuerzo Anual de Newcastle + Bronquitis**. Anotalo en el calendario del teléfono: cada 6 o 12 meses (según te indique tu veterinario de zona), comprás la ampolla y se la das en el agua fría de la mañana.';
      if (p.includes('cómo') || p.includes('como') || p.includes('se aplica') || p.includes('dosis'))
        return '💧 **Paso a paso para vacunar en el agua de bebida:**\n\n1. **Sacales el agua** a la tarde. Que pasen toda la noche con sed.\n2. A la mañana temprano, abrí el frasquito de vacuna (tiene que haber estado en la heladera, nunca perder el frío).\n3. Mezclalo en un tacho con **Agua Mineral o de pozo (NUNCA agua de la canilla con cloro porque mata la vacuna).**\n4. Ponele ese agua a las gallinas. Como tienen sed de toda la noche, van a tomar rápidamente y absorberán la vacuna.';
      if (p.includes('consigo') || p.includes('compro') || p.includes('dónde') || p.includes('precio'))
        return '🏪 **Dónde comprar insumos veterinarios:**\n\nLas vacunas no se venden en cualquier forrajería de barrio, necesitás ir a una **Veterinaria de Grandes Animales o Agropecuaria**. Llevá una **conservadora o un termo con hielo**. Si se calienta el frasco en el viaje a tu casa, la vacuna no sirve más.';
      if (p.includes('gracias') || p === 'ok' || p === 'dale')
        return '¡Para eso estoy! La sanidad es el 50% de tu negocio. Si tenés dudas sobre SENASA, alimentación o ventas, seguí preguntando. 🐔';
    }

    // ── ALIMENTO POR EDAD DEL LOTE ───────────────────────────────
    if (p.includes('alimento') || p.includes('comida') || p.includes('ración') || p.includes('comer') || p.includes('edad') || p.includes('semana'))
      return '🌾 **Alimentación paso a paso para principiantes:**\n\nSi recién arrancás, lo más fácil y seguro es comprar **alimento balanceado comercial ya preparado** en la forrajería (marcas excelentes son Gepsa, Alimentos Pilar, Cargill o Ganave). Pedilos exactamente así según la edad que tengan tus gallinas:\n\n• **1. Iniciador (0 a 8 semanas de vida):** Pedí "Iniciador para ponedoras". Viene en polvo o micro-pellet con mucha proteína (22%) para que crezcan fuertes. Dales unos 20 a 30 gramos por pollita al día.\n\n• **2. Recría / Crecimiento (8 a 16 semanas):** Pedí "Alimento de Recría". Baja la proteína al 18% para que no engorden de golpe y no tiene casi calcio para no dañarles los riñones. Acá comerán unos 50 a 60 gramos por día.\n\n• **3. Pre-postura (16 a 18 semanas):** Es una etapa cortita de transición donde se les empieza a meter calcio. Pedí "Alimento Pre-postura" o mezclale conchas de ostra picada.\n\n• **4. Postura Activa (cuando empiezan a poner huevos):** Pedí "Alimento Alta Postura Fase 1". Este tiene 16% de proteína y muchísimo calcio (4%) que es fundamental para que la cáscara del huevo sea dura. Pasado el pico de producción (Fase 2) cambian a otro. Una gallina adulta come entre 100 y 120 gramos exactos por día.\n\n*💡 Consejo de Don Pepe:* Si les falta calcio, van a poner huevos con cáscara blanda. Podes comprar "Conchilla" suelta en la veterinaria y ponerles un tachito extra.\n\n¿Cuántas semanas tiene tu lote actualmente así te digo qué bolsa comprar?';

    // ── PRODUCCIÓN Y APP ─────────────────────────────────────────
    if (p.includes('cargar') || (p.includes('huevo') && !p.includes('vacuna') && !p.includes('enferma')))
      return '🥚 Para registrar tus huevos diarios andá al botón central de abajo que dice **CARGAR** (con el lápiz). Ingresas cuántos maples sacaste hoy, cómo notaste el temperamento de las gallinas y listo, esos datos van al dashboard para calcular tu rentabilidad. ¡Hacelo todos los días y compará semanas!';

    // ── VACUNAS (pregunta general) ────────────────────────────────
    if (p.includes('vacuna') || p.includes('plan sanitario') || p.includes('inmuniz'))
      return '💉 **Guía Cero de Vacunación:**\n\nSi comprás la gallina ya de 16 semanas a un criadero serio, la mayoría de las vacunas mortales ya se las dieron. Solo te tenés que enfocar en **renovar la vacuna de NEWCASTLE** para evitar clausuras del SENASA y pedirle a los vendedores el "Certificado Oficial de Vacunación".\n\n¿Querés que te explique cómo pedir el certificado o cómo darle la de Newcastle?';

    // ── ENFERMEDADES Y MANEJO DE GRANJA ────────────────────────────
    if (p.includes('diarrea') || p.includes('enferma') || p.includes('muerta') || p.includes('sintoma') || p.includes('peste') || p.includes('moquillo') || p.includes('piojo'))
      return '🩺 **Primeros auxilios veterinarios (Para Principiantes):**\n\nSi ves una gallina triste, que no come, tiene diarrea verde/blanca, moquillo o está caída, no te desesperes. Hacé esto paso a paso:\n\n1. **Aislamiento urgente:** Agarrá a la gallina enferma y metela sola en una jaula o corral lejos de las sanas. Las gallinas son muy contagiadoras.\n2. **Revisá los parásitos:** Levantale las plumas abajo del ala y en la cola. Si ves piojillos caminando, tenés que ir a la forrajería a comprar **Tierra de Diatomeas** o un polvo desparasitante (Ej. Ecthol) para espolvorear a todas.\n3. **Sanitizá los bebederos:** Lavá todos los tachos de agua con un cepillo y un chorrito mínimo de lavandina, enjuagá bien y poné agua limpia.\n4. **Consultá al veterinario:** No le des remedios caseros locos, llamá a una veterinaria agropecuaria y comentale los síntomas exactos. Él te venderá un antibiótico o vitamínico comercial (Ej. Aminovit o Floxacina) para poner en el tanque de agua general.';

    // ── SENASA / BROMATOLOGÍA ────────────────────────────────────
    if (p.includes('senasa') || p.includes('habilit') || p.includes('permiso') || p.includes('bromatologia') || p.includes('inspeccion'))
      return '📋 **Cómo habilitar tu granja legalmente (Pasos clave):**\n\nNo podés vender grandes volúmenes a supermercados si no estás en regla. Arrancá por acá:\n\n1. **Sacar el RensPA:** Es el Registro Nacional Sanitario de Productores Agropecuarios. Se saca 100% online gratis en la web de AFIP con tu clave fiscal. Es la "patente" de tu granja.\n2. **Habilitación Municipal:** Vas a Bromatología de tu municipalidad y pedís habilitar un establecimiento avícola. Te van a pedir cosas simples como: tener tejido perimetral cerrado, mallas anti-pájaros en el galpón, y piso de cemento si es necesario.\n3. **Habilitación SENASA:** Una vez tengas el RensPA y la municipal, llamás al veterinario de SENASA de tu zona. Él va a visitar tu granja, te va a pedir los certificados de vacunas (Newcastle y aves de origen sano) y si tenés pediluvios (un tachito con cal y lavandina para pisar antes de entrar al galpón) y te dará un Tránsito Animal (DTe) para mover los huevos o animales.';

    // ── MONOTRIBUTO / CONTABLE / COSTOS ──────────────────────────
    if (p.includes('monotributo') || p.includes('impuesto') || p.includes('factura') || p.includes('costo') || p.includes('precio') || p.includes('rentabil') || p.includes('afip'))
      return '💰 **Economía de la granja y Monotributo (Nivel Básico):**\n\nPara poder venderle a almacenes barriales o restaurantes de forma prolija, necesitás darles factura.\n\n✅ **Monotributo Agropecuario:** Con tu contador, date de alta en el Monotributo de AFIP. La Categoría A alcanza para arrancar. Vas a pagar una cuota mensual fija (muy barata) que te incluye Aportes Jubilatorios y Obra Social.\n\n✅ **Ingresos Brutos:** También tenés que inscribirte en Rentas (ATM en Mendoza). Generalmente la venta primaria de huevos tiene alícuotas bajas.\n\n✅ **Tus 3 costos clave que NUNCA tenés que perder de vista:**\n1. La bolsa de Alimento (es el 70% de tu gasto total).\n2. El maple vacío (caja de cartón).\n3. La reposición de la pollita (ahorrar para comprar la nueva cuando la vieja deje de poner a los 2 años).\n*Tené estos 3 números siempre actualizados en la app para saber si estás ganando o perdiendo plata mensual.*';

    // ── VENTAS / MARKETING / REDES ────────────────────────────────
    if (p.includes('instagram') || p.includes('redes') || p.includes('vender') || p.includes('cliente') || p.includes('marketing') || p.includes('facebook'))
      return '📱 **Guía de Marketing para Huevos (Empezar a vender más):**\n\nEl secreto moderno no es vender huevos sueltos a 2 pesos al vecino, sino vender una "marca campestre". Hacé esto hoy mismo:\n\n1. **Nombre y Logo:** Poné un nombre campestre ("Granja La Esperanza", "Huevos Sanos de Juan"). Imprimí unas **etiquetas redondas chiquitas** (las pedís en cualquier imprenta barata) y pegale una al centro de cada cartón de maple.\n2. **Instagram/WhatsApp:** Armá un Instagram. No subas fotos de huevos nomás. Subí **videos tuyos juntando el huevo a las 10 de la mañana**. La gente en la ciudad ama ver cómo corre la gallina en su corral y el nido con la paja seca. Mostrales que no tenés intermediarios.\n3. **Ventas fijas:** Andá a las rotiserías y dietéticas de tu barrio y mostrales tu huevo. Como es fresco (y más oscuro que el de súper), te van a comprar semanalmente de forma fija. Usá el módulo **CLIENTES** acá en la app para agendarlos.\n\nUsá la pestaña de **REDES** de esta app, que te arma los textos automáticamente.';

    // ── FALLBACK ─────────────────────────────────────────────────
    return '👨‍🌾 **Pueeeebla... ¡Entiendo por dónde vas!**\n\nComo soy una versión demo de sistema, tengo respuestas pre-armadas super detalladas para los que recién arrancan con todo este mundo rural.\n\nPuedo explicarte paso a paso sobre:\n🌾 **Alimento por etapa (marcas y gramos)**\n💉 **Vacunación obligatoria y cómo darla**\n🩺 **Primeros auxilios para gallinas enfermas**\n📋 **Trámites SENASA y RensPA**\n💰 **Monotributo y manejo de costos**\n📱 **Cómo armar tu branding y vender por WhatsApp**\n\nSi querés ayuda completa las 24hs con contexto a medida, configurá tu conexión Gemini en el archivo de sistema. Para las guías manuales, elegí alguno de los temas de arriba y escribilo tal cual.';
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
