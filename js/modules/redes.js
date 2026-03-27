// redes.js — Módulo REDES: generador de contenido para vender más
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

  const IDEAS_CONTENIDO = [
    { dia: 'Lunes', tipo: '📸 Foto', texto: 'Una foto del galpón por la mañana' },
    { dia: 'Martes', tipo: '📖 Info', texto: '"¿Sabías que...?" dato sobre huevos' },
    { dia: 'Miércoles', tipo: '✅ Proceso', texto: 'Video corto de la recolección' },
    { dia: 'Jueves', tipo: '🛒 Oferta', texto: 'Anunciar disponibilidad semanal' },
    { dia: 'Viernes', tipo: '👨‍👩‍👧 Familia', texto: 'Foto del equipo trabajando' },
    { dia: 'Sábado', tipo: '🌅 Imagen', texto: 'Foto linda de las gallinas' },
    { dia: 'Domingo', tipo: '💬 Testimonio', texto: 'Historia de un cliente feliz' },
  ];

  const PUBLICACIONES = [
    { fecha: 'Ayer',   plataforma: '📸 Instagram', texto: '¡Maple disponible!', estado: 'publicado' },
    { fecha: 'Lun',    plataforma: '💚 WhatsApp',  texto: 'Oferta de la semana',  estado: 'publicado' },
    { fecha: 'Sáb',    plataforma: '📘 Facebook',  texto: 'Foto gallinas',        estado: 'publicado' },
  ];

  let textoGenerado = '';
  let tipoActivo    = 'Campero';

  function generarTexto() {
    const usuario = Auth.obtenerUsuario();
    const tipo    = usuario ? (usuario.tipo_produccion || tipoActivo) : tipoActivo;
    const lista   = PLANTILLAS[tipo] || PLANTILLAS['Piso'];
    const plantilla = lista[Math.floor(Math.random() * lista.length)];
    textoGenerado   = plantilla.replace('{huevos}', Math.floor(Math.random() * 100 + 200));
    document.getElementById('texto-generado').textContent = textoGenerado;
  }

  function copiarTexto() {
    if (!textoGenerado) return;
    navigator.clipboard.writeText(textoGenerado)
      .then(() => UI.mostrarToast('📋 Texto copiado', 'success'))
      .catch(() => UI.mostrarToast('Copiá el texto manualmente', 'info'));
  }

  function render() {
    const usuario  = Auth.obtenerUsuario();
    const tipo     = usuario ? (usuario.tipo_produccion || 'Campero') : 'Campero';
    const diaActual = new Date().getDay(); // 0=domingo

    return `
    <div class="modulo-contenedor">
      <h2 class="modulo-titulo">📱 Redes y Ventas</h2>
      <p class="modulo-subtitulo">Publicá más, vendé más</p>

      <!-- GENERADOR DE TEXTOS -->
      <div class="redes-seccion">
        <h3 class="seccion-titulo">✍️ Generador de publicaciones</h3>
        <p class="redes-desc">Tipo de producción: <strong>${tipo}</strong></p>

        <div class="texto-generado-box" id="texto-generado">
          Tocá "Generar" para crear un texto listo para publicar 👇
        </div>

        <div class="redes-acciones">
          <button class="btn-primario" onclick="ModuloRedes.generarTexto()">
            🎲 Generar texto
          </button>
          <button class="btn-secundario" onclick="ModuloRedes.copiarTexto()">
            📋 Copiar
          </button>
        </div>
      </div>

      <!-- CALENDARIO SEMANAL -->
      <div class="redes-seccion">
        <h3 class="seccion-titulo">📅 Plan de la semana</h3>
        <div class="calendario-semana">
          ${IDEAS_CONTENIDO.map((idea, i) => `
            <div class="cal-dia ${i === diaActual ? 'cal-dia-hoy' : ''}">
              <span class="cal-dia-nombre">${idea.dia}</span>
              <span class="cal-dia-tipo">${idea.tipo}</span>
              <span class="cal-dia-texto">${idea.texto}</span>
              ${i === diaActual ? '<span class="cal-hoy-badge">HOY</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- HISTORIAL -->
      <div class="redes-seccion">
        <h3 class="seccion-titulo">📋 Publicaciones recientes</h3>
        <div class="publicaciones-lista">
          ${PUBLICACIONES.map(p => `
            <div class="publicacion-item">
              <span class="pub-plat">${p.plataforma}</span>
              <div class="pub-info">
                <span class="pub-texto">${p.texto}</span>
                <span class="pub-fecha">${p.fecha}</span>
              </div>
              <span class="chip-estado confirmado">✅ Listo</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- RESPUESTAS SUGERIDAS -->
      <div class="redes-seccion">
        <h3 class="seccion-titulo">💬 Respuestas rápidas para clientes</h3>
        <div class="respuestas-rapidas">
          <button class="btn-respuesta" onclick="ModuloRedes.copiarRespuesta('¡Hola! Sí, tenemos maples disponibles esta semana. ¿Cuántos necesitás? 🥚')">
            📦 "¿Tienen disponible?"
          </button>
          <button class="btn-respuesta" onclick="ModuloRedes.copiarRespuesta('El maple de 30 huevos está a $X. Hacemos entregas los miércoles y sábados en la zona. ¿Te lo reservamos?')">
            💰 "¿Cuánto sale?"
          </button>
          <button class="btn-respuesta" onclick="ModuloRedes.copiarRespuesta('¡Perfecto! Te reservamos el pedido. ¿Podés confirmar tu dirección y horario de entrega? 🚚')">
            ✅ "Quiero pedir"
          </button>
        </div>
      </div>

    </div>`;
  }

  function copiarRespuesta(texto) {
    navigator.clipboard.writeText(texto)
      .then(() => UI.mostrarToast('📋 Respuesta copiada', 'success'))
      .catch(() => UI.mostrarToast(texto, 'info'));
  }

  return { render, generarTexto, copiarTexto, copiarRespuesta };
})();
