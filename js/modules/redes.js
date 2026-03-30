// redes.js — Módulo ACADEMIA DE VENTAS: Guía paso a paso para vender más y Fidelizar
const ModuloRedes = (() => {

  const PLANTILLAS = {
    'Campero': [
      '🐔 ¡Huevos camperos frescos disponibles! Las gallinas se mueven libres, comen mejor, y eso se nota en el sabor. 📦 Pedí tu maple esta semana. Escribinos por WhatsApp 👇',
      '🥚 ¿Sabías que los huevos camperos tienen más nutrientes que los de jaula? 🌿 En nuestra granja las gallinas pastorean al aire libre todos los días. ¡Probá la diferencia!',
      '✅ Hoy recolectamos {huevos} huevos frescos directamente del campo. 🌅 Sin intermediarios, directo del productor a tu mesa. ¡Contactanos!',
    ],
    'Piso': [
      '🥚 Huevos frescos disponibles hoy. 📦 Producción de granja familiar, con cuidado y dedicación. ¡Pedí tu maple esta semana!',
      '🐔 Las gallinas de nuestra granja viven en galpón amplio y limpio. 🌿 Producción controlada, huevo fresco garantizado. ¡Consultanos!',
      '✅ {huevos} huevos recolectados hoy. ¿Ya hiciste tu pedido de la semana? 📦 Escribinos y te lo llevamos.',
    ],
    'Orgánico': [
      '🌿 Huevos orgánicos certificados, sin antibióticos ni hormonas. 🐔 Gallinas felices = huevos nutritivos. ¡Pedí los tuyos!',
      '💚 Producción 100% orgánica, alimentación natural. 🥚 Cada maple viene directo del productor, con amor y responsabilidad.',
      '🌱 ¿Cuidás lo que comes? Nuestros huevos orgánicos son la elección perfecta. 📦 Consultanos por envíos y precios.',
    ],
    'Jaula': [
      '🥚 Huevos frescos disponibles. 📦 Producción diaria, siempre al día. ¡Pedí tu maple esta semana!',
      '🐔 Calidad garantizada en cada maple. 🥚 Recolección diaria, entrega rápida. ¡Escribinos!',
      '✅ {huevos} huevos disponibles hoy. ¿Necesitás para el negocio o para casa? ¡Te conseguimos!',
    ],
    'Granja libre': [
      '🌳 Gallinas de granja libre: más espacio, más bienestar, mejor huevo. 🥚 Probá la diferencia y pedí tu maple.',
      '🐔 Granja libre = gallinas felices. ¡Y eso se nota en el sabor! 📦 Pedidos disponibles esta semana.',
      '✅ Hoy tenemos {huevos} huevos de granja libre. Directo del productor, sin intermediarios. ¡Contactanos!',
    ],
  };

  const RECETAS = [
    '🍳 TIP DEL DÍA: La tortilla perfecta.\\n¿El secreto? Papas cortadas finitas, fuego corona y... ¡HUEVOS DE CAMPO extra frescos! 🥚🥔\\nLa yema naranja le da ese color increíble. ¿Ya encargaste tu maple esta semana?',
    '🥞 RECETA FÁCIL: Panqueques esponjosos de domingo.\\n1 taza de harina, 1 taza de leche y 2 HUEVOS extra frescos de nuestra granja 🐔🥣\\nBatís, sartén caliente y listo. ¡Pedinos tus maples y disfrutá el finde!',
    '🥗 IDEA DE CENA: Ensalada rápida y nutritiva.\\nColchón de verdes, tomates cherry o palta, y coronamos con 2 Huevos duros o poché 🥚🥑🍅\\nNuestros huevos te aseguran la proteína de mejor calidad. ¡Hacé tu pedido por WhatsApp hoy!',
    '🍰 EL SECRETO BIZCOCHUELO: ¿Por qué a la abuela le salía tan alto?\\nPorque usaba huevos grandes, bien cuidados y a temperatura ambiente 🥚✨\\nLlevate la calidad directo desde nuestra granja a tu cocina. ¡Escribinos!',
    '🥚 ¿MAYONESA CASERA? ¡Solo con huevos extra frescos!\\nApostá seguro: comprando directo de nuestra granja te garantizás una frescura indiscutible para tus preparaciones crudas o salsas seguras 🥣🍋'
  ];

  const TIPS = [
    '💡 ¿CÓMO SABER SI UN HUEVO ESTÁ FRESCO? 💧\\nPonelo en un vaso con agua. Si se hunde rápido y queda horizontal, ¡está súper fresco! Si flota, descartalo. Comprando directo a nuestra granja te ahorrás la incertidumbre. ¡Todo el maples es fresco! 🥚',
    '🤔 MITOS DEL HUEVO: ¿El color importa?\\n¡La verdad es que no! Un huevo blanco o uno colorado tienen exactamente la misma proteína y vitaminas. El color depende de la raza de la gallina 🐔. Lo que SÍ cambia el sabor es su alimento y si pastorean. ¡Apurate y llevate un maple nuestro!',
    '💪 EL MEJOR AMIGO DEL DEPORTISTA\\n¿Sabías que un solo huevo mediano tiene 6 gramos de la proteína más pura y completa que existe en la naturaleza? Olvidate de polvos caros, la mejor nutrición sale del campo. ¡Pedí tus maples frescos de la casa! 🏃‍♂️🥚',
    '🧠 NUTRICIÓN INTELIGENTE PARA LOS CHICOS\\nLa colina y la luteína presentes en la yema del huevo son fundamentales para el desarrollo del cerebro infantil. Darles huevo es asegurarles una dieta de oro. ¡Llevá salud a tu casa con nuestros maples frescos de campo! 👶🌞'
  ];

  let textoGenerado = '';
  // Pestana activa: 'misiones', 'whatsapp', 'redes', 'tácticas', 'generador'
  let pestanaActiva = 'whatsapp';
  let misiones = JSON.parse(localStorage.getItem('gfi_misiones_ventas')) || {};

  function guardarMision(id, checked) {
    misiones[id] = checked;
    localStorage.setItem('gfi_misiones_ventas', JSON.stringify(misiones));
    renderizarPestanaActiva();
  }

  function setPestana(id) {
    pestanaActiva = id;
    document.querySelectorAll('.redes-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${id}`)?.classList.add('active');
    renderizarPestanaActiva();
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  function render() {
    return `
    <div class="modulo-contenedor" style="padding:16px 12px">
      <h2 class="modulo-titulo" style="font-size:1.6rem; margin-bottom:4px">🚀 Academia de Ventas</h2>
      <p class="modulo-subtitulo" style="margin-bottom:16px;">Aprendé a conseguir y fidelizar clientes desde cero.</p>

      <!-- TABS DE NAVEGACION HORIZONTAL -->
      <div class="redes-tabs-nav" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1)">
        <button class="redes-tab ${pestanaActiva==='whatsapp'?'active':''}" id="tab-whatsapp" onclick="ModuloRedes.setPestana('whatsapp')" style="white-space:nowrap; padding:8px 16px; border-radius:30px; border:none; background:${pestanaActiva==='whatsapp'?'var(--color-primario)':'rgba(255,255,255,0.05)'}; color:${pestanaActiva==='whatsapp'?'white':'var(--texto-secundario)'}; font-weight:600; cursor:pointer; font-family:'Outfit'">1. WhatsApp Base</button>
        <button class="redes-tab ${pestanaActiva==='redes'?'active':''}" id="tab-redes" onclick="ModuloRedes.setPestana('redes')" style="white-space:nowrap; padding:8px 16px; border-radius:30px; border:none; background:${pestanaActiva==='redes'?'var(--color-primario)':'rgba(255,255,255,0.05)'}; color:${pestanaActiva==='redes'?'white':'var(--texto-secundario)'}; font-weight:600; cursor:pointer; font-family:'Outfit'">2. Redes y Barrio</button>
        <button class="redes-tab ${pestanaActiva==='tacticas'?'active':''}" id="tab-tacticas" onclick="ModuloRedes.setPestana('tacticas')" style="white-space:nowrap; padding:8px 16px; border-radius:30px; border:none; background:${pestanaActiva==='tacticas'?'var(--color-primario)':'rgba(255,255,255,0.05)'}; color:${pestanaActiva==='tacticas'?'white':'var(--texto-secundario)'}; font-weight:600; cursor:pointer; font-family:'Outfit'">3. Tácticas Maestras</button>
        <button class="redes-tab ${pestanaActiva==='generador'?'active':''}" id="tab-generador" onclick="ModuloRedes.setPestana('generador')" style="white-space:nowrap; padding:8px 16px; border-radius:30px; border:none; background:${pestanaActiva==='generador'?'var(--color-primario)':'rgba(255,255,255,0.05)'}; color:${pestanaActiva==='generador'?'white':'var(--texto-secundario)'}; font-weight:600; cursor:pointer; font-family:'Outfit'">🤖 Textos Bot</button>
      </div>

      <div id="redes-contenido-dinamico">
         <!-- EL CONTENIDO SE INYECTA AQUÍ -->
      </div>
    </div>`;
  }

  function postRender() {
    renderizarPestanaActiva();
  }

  function renderizarPestanaActiva() {
    const contenedor = document.getElementById('redes-contenido-dinamico');
    if(!contenedor) return;

    if(pestanaActiva === 'whatsapp') {
      contenedor.innerHTML = renderWhatsapp();
    } else if (pestanaActiva === 'redes') {
      contenedor.innerHTML = renderRedes();
    } else if (pestanaActiva === 'tacticas') {
      contenedor.innerHTML = renderTacticas();
    } else if (pestanaActiva === 'generador') {
      contenedor.innerHTML = renderGenerador();
    }
  }

  // ── PESTAÑA 1: WHATSAPP ──────────────────────────────────────────
  function renderWhatsapp() {
    const msgBienvenida = "¡Hola! Estoy empezando a vender huevos 100% frescos de mi pequeña granja. La calidad es increíble y los entrego en la puerta. Si te interesa probarlos o saber los precios, ¡avisame y te guardo un maple de la tanda de hoy! 🥚🚲";
    
    return `
      <div class="redes-seccion">
        <h3 class="seccion-titulo" style="font-size:1.3rem">📱 Consiguiendo tus primeros clientes</h3>
        <p class="redes-desc">Tu familia, amigos, y vecinos son tus primeros compradores.</p>
        
        <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; margin-bottom:16px; border:1px solid rgba(255,255,255,0.08)">
          <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:8px"><span style="font-size:1.4rem">💡</span> El Secreto: Usá "Listas de Difusión"</h4>
          <p style="font-size:0.9rem; color:var(--texto-secundario); margin-bottom:12px; line-height:1.5">No crees un "Grupo de WhatsApp". A la gente le molesta el ruido de los grupos. Creá una <strong>Lista de Difusión</strong>. Vos mandás un solo mensaje pre-armado y a todos les llega como un chat privado y personalizado.</p>
        </div>

        <div class="lista-misiones" style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px">
          <label style="display:flex; align-items:flex-start; gap:12px; background:rgba(0,0,0,0.15); padding:12px; border-radius:8px; cursor:pointer">
            <input type="checkbox" style="width:20px; height:20px; margin-top:2px" ${misiones['w1']?'checked':''} onchange="ModuloRedes.guardarMision('w1', this.checked)">
            <div><strong style="display:block; margin-bottom:4px">Descargar WhatsApp Business</strong><span style="font-size:0.85rem; color:var(--texto-secundario)">Te permite tener un perfil de "Empresa", poner horarios, catálogo y respuestas automáticas.</span></div>
          </label>
          <label style="display:flex; align-items:flex-start; gap:12px; background:rgba(0,0,0,0.15); padding:12px; border-radius:8px; cursor:pointer">
            <input type="checkbox" style="width:20px; height:20px; margin-top:2px" ${misiones['w2']?'checked':''} onchange="ModuloRedes.guardarMision('w2', this.checked)">
            <div><strong style="display:block; margin-bottom:4px">Armar Lista de Familia/Amigos</strong><span style="font-size:0.85rem; color:var(--texto-secundario)">Agregá a 15-20 personas de confianza.</span></div>
          </label>
        </div>

        <h4 style="margin-bottom:12px; font-size:1.1rem">Plantilla para romper el hielo</h4>
        <textarea class="config-textarea" id="txt-bienvenida" style="min-height:100px">${msgBienvenida}</textarea>
        <button class="btn-secundario" onclick="ModuloRedes.copiarManual('txt-bienvenida')" style="width:100%">
          📋 Copiar mensaje para enviarlo por WhatsApp
        </button>
      </div>
    `;
  }

  // ── PESTAÑA 2: REDES SOCIALES ────────────────────────────────────
  function renderRedes() {
    return `
      <div class="redes-seccion">
        <h3 class="seccion-titulo" style="font-size:1.3rem">🏘️ Conquistando el Barrio (Redes)</h3>
        <p class="redes-desc">Diferencia entre Facebook e Instagram.</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px">
          <div style="background:rgba(24, 119, 242, 0.1); border:1px solid rgba(24, 119, 242, 0.3); padding:16px; border-radius:12px text-align:center;">
             <div style="font-size:2rem; margin-bottom:8px">📘</div>
             <strong style="display:block; margin-bottom:4px">FACEBOOK</strong>
             <p style="font-size:0.8rem; color:var(--texto-secundario); line-height:1.4">Atrae a la gente mayor y vecinos. Usa <strong>Grupos Locales</strong> (ej: Compra/Venta Junín). Es para venta cruda y rápida al por mayor.</p>
          </div>
          <div style="background:rgba(225, 48, 108, 0.1); border:1px solid rgba(225, 48, 108, 0.3); padding:16px; border-radius:12px text-align:center;">
             <div style="font-size:2rem; margin-bottom:8px">📸</div>
             <strong style="display:block; margin-bottom:4px">INSTAGRAM</strong>
             <p style="font-size:0.8rem; color:var(--texto-secundario); line-height:1.4">Atrae a jóvenes y familias. Funciona como <strong>Vidriera de Higiene</strong>. Subí fotos de gallinas felices y galpones limpios. Justifica cobrar más caro.</p>
          </div>
        </div>

        <div class="lista-misiones" style="display:flex; flex-direction:column; gap:12px;">
          <label style="display:flex; align-items:flex-start; gap:12px; background:rgba(0,0,0,0.15); padding:12px; border-radius:8px; cursor:pointer">
            <input type="checkbox" style="width:20px; height:20px; margin-top:2px" ${misiones['r1']?'checked':''} onchange="ModuloRedes.guardarMision('r1', this.checked)">
            <div><strong style="display:block; margin-bottom:4px">Entrar a 3 grupos de Clasificados locales (Face)</strong><span style="font-size:0.85rem; color:var(--texto-secundario)">Publicá los excedentes ahí: "Tengo 5 maples frescos recién sacados, retiro en mi domicilio".</span></div>
          </label>
          <label style="display:flex; align-items:flex-start; gap:12px; background:rgba(0,0,0,0.15); padding:12px; border-radius:8px; cursor:pointer">
            <input type="checkbox" style="width:20px; height:20px; margin-top:2px" ${misiones['r2']?'checked':''} onchange="ModuloRedes.guardarMision('r2', this.checked)">
            <div><strong style="display:block; margin-bottom:4px">Crear el Instagram de la Granja</strong><span style="font-size:0.85rem; color:var(--texto-secundario)">Poné el Link de tu WhatsApp en la bio. Mostrá el campo, el maíz, el proceso (la gente ama la transparencia).</span></div>
          </label>
        </div>
      </div>
    `;
  }

  // ── PESTAÑA 3: TÁCTICAS ───────────────────────────────────────
  function renderTacticas() {
    return `
      <div class="redes-seccion">
        <h3 class="seccion-titulo" style="font-size:1.3rem">🧠 Tácticas Inteligentes</h3>
        <p class="redes-desc">Dejá de competir por 10 centavos y empezá a ganar <strong>clientes fijos</strong>.</p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          
          <div style="background:rgba(255,152,0,0.1); border:1px solid rgba(255,152,0,0.3); padding:16px; border-radius:12px;">
            <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:8px">♻️ El Recupero de Maples</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom:12px; line-height:1.5">El cartón es caro. Creá una promoción permanente: <strong>"Traé tu maple vacío en buen estado y te descuento $200 en tu próximo maple lleno"</strong>. Fideliza al cliente (siempre vuelve a vos) y te abarata los costos.</p>
          </div>

          <div style="background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); padding:16px; border-radius:12px;">
            <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:8px">📅 El Abono / Suscripción (La Vaca Lechera)</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom:12px; line-height:1.5">Ofrecé un <strong>"Plan Mensual"</strong>. La familia te paga a principio de mes un precio congelado, y vos te comprometés a llevarle 1 maple todos los sábados.<br><strong>Ventaja:</strong> Sabés exactamente cuántos huevos tenés vendidos antes de que la gallina los ponga, y tenés plata adelantada para comprar alimento.</p>
          </div>

          <div style="background:rgba(33,150,243,0.1); border:1px solid rgba(33,150,243,0.3); padding:16px; border-radius:12px;">
            <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:8px">🎁 Tarjeta "El Maple N° 11 es GRATIS"</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom:12px; line-height:1.5">Efecto psicológico imparable. Una tarjetita económica donde sellás/anotás cada maple que compran. Les duele perder su progreso, evitará que compren en el supermercado aunque sea más barato. Cuando llegan al décimo, les regalás el maple n° 11.</p>
          </div>

        </div>
      </div>
    `;
  }

  // ── PESTAÑA 4: GENERADOR DE TEXTOS ────────────────────────────
  function renderGenerador() {
    const usuario  = Auth.obtenerUsuario();
    const tipo     = usuario ? (usuario.tipo_produccion || 'Campero') : 'Campero';
    return `
      <!-- GENERADOR DE TEXTOS -->
      <div class="redes-seccion">
        <h3 class="seccion-titulo" style="font-size:1.3rem">🤖 Generador Automático (Cero Esfuerzo)</h3>
        <p class="redes-desc">Apretá un botón y la app escribe por vos. Tu producción configurada es: <strong>${tipo}</strong>.</p>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px; margin-top:12px;">
          <button class="btn-primario" onclick="ModuloRedes.generarTexto('venta')" style="font-size:0.9rem; padding:10px; width:100%">
            📢 Crear Oferta / Venta
          </button>
          <button class="btn-secundario" onclick="ModuloRedes.generarTexto('receta')" style="font-size:0.9rem; padding:10px; width:100%; border-color:#FF9800; color:#FF9800">
            🍳 Compartir una Receta
          </button>
          <button class="btn-secundario" onclick="ModuloRedes.generarTexto('tip')" style="font-size:0.9rem; padding:10px; width:100%; border-color:#03A9F4; color:#03A9F4">
            💡 Compartir un Tip Educativo
          </button>
        </div>

        <div class="texto-generado-box" id="texto-generado">
          ${textoGenerado ? textoGenerado.replace(/\\n/g, '<br>') : 'El texto aparecerá acá listo para copiar y pegar en Facebook o WhatsApp 👇'}
        </div>

        <div class="redes-acciones" style="margin-top:12px">
          <button class="btn-secundario" onclick="ModuloRedes.copiarTexto()">
            📋 Copiar al portapapeles
          </button>
        </div>

        <h3 class="seccion-titulo" style="font-size:1.1rem; margin-top:32px">💬 Botones rápidos de respuesta</h3>
        <p class="redes-desc">Respuestas comunes para cuando te preguntan tus clientes.</p>
        <div class="respuestas-rapidas">
          <button class="btn-respuesta" onclick="ModuloRedes.copiarRespuesta('¡Hola! Sí, tenemos maples disponibles esta semana. ¿Cuántos necesitás? 🥚')">
            📦 "¿Hay stock?"
          </button>
          <button class="btn-respuesta" onclick="ModuloRedes.copiarRespuesta('El maple grande está a $X. Hacemos entregas los miércoles y sábados por la tarde. ¿Te reservo uno?')">
            💰 "¿Precio?"
          </button>
          <button class="btn-respuesta" onclick="ModuloRedes.copiarRespuesta('¡Perfecto! Te separo y reservo el pedido de maples frescos. ¿Me confirmás tu dirección? 🚚')">
            ✅ "Quiero pedir"
          </button>
        </div>
      </div>
    `;
  }

  // ── ACCIONES SECUNDARIAS ──────────────────────────────────────
  function generarTexto(tipoGeneracion) {
    if (tipoGeneracion === 'receta') {
       textoGenerado = RECETAS[Math.floor(Math.random() * RECETAS.length)];
    } else if (tipoGeneracion === 'tip') {
       textoGenerado = TIPS[Math.floor(Math.random() * TIPS.length)];
    } else {
       const usuario = Auth.obtenerUsuario();
       const tipo    = usuario ? (usuario.tipo_produccion || 'Campero') : 'Campero';
       const lista   = PLANTILLAS[tipo] || PLANTILLAS['Piso'];
       const plantilla = lista[Math.floor(Math.random() * lista.length)];
       textoGenerado   = plantilla.replace('{huevos}', Math.floor(Math.random() * 50 + 50));
    }
    // Reemplazamos \n manuales por saltos reales o permitimos el div
    document.getElementById('texto-generado').innerHTML = textoGenerado.replace(/\\n/g, '<br>');
  }

  function copiarTexto() {
    if (!textoGenerado) {
       UI.mostrarToast('Primero генера un texto', 'warning'); return;
    }
    navigator.clipboard.writeText(textoGenerado)
      .then(() => UI.mostrarToast('📋 ¡Ocurrencia copiada! Pegala en Facebook/WhatsApp.', 'success'))
      .catch(() => UI.mostrarToast('Asegurate de dar permisos al portapapeles', 'warning'));
  }

  function copiarManual(txtId) {
    const el = document.getElementById(txtId);
    if (!el) return;
    navigator.clipboard.writeText(el.value)
      .then(() => UI.mostrarToast('📋 ¡Texto copiado!', 'success'))
      .catch(() => UI.mostrarToast('Copiá manualmente', 'warning'));
  }

  function copiarRespuesta(texto) {
    navigator.clipboard.writeText(texto)
      .then(() => UI.mostrarToast('📋 Respuesta copiada - andá a pegarla al chat de WhatsApp', 'success'))
      .catch(() => UI.mostrarToast('Error al copiar', 'info'));
  }

  return { render, postRender, setPestana, guardarMision, generarTexto, copiarTexto, copiarManual, copiarRespuesta };
})();
