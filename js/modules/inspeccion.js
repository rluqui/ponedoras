// inspeccion.js — Módulo INSPECCIÓN IA: fotos con análisis de estado
const ModuloInspeccion = (() => {

  const TIPOS = [
    { id: 'bebedero',      icono: '💧', label: 'Bebedero' },
    { id: 'comedero',      icono: '🌾', label: 'Comedero' },
    { id: 'galpon',        icono: '🏠', label: 'Galpón' },
    { id: 'huevos',        icono: '🥚', label: 'Huevos' },
    { id: 'infraestructura', icono: '🔧', label: 'Infraestructura' },
  ];

  const RESPUESTAS_IA = {
    bebedero: [
      { estado:'verde',    obs:'Bebedero limpio y con agua suficiente.', riesgos:'Ninguno detectado.', sugerencia:'Continuar con limpieza semanal.' },
      { estado:'amarillo', obs:'Nivel de agua bajo. Posible obstrucción.', riesgos:'Deshidratación si no se corrige pronto.', sugerencia:'Revisá la conexión y rellenalo hoy.' },
      { estado:'rojo',     obs:'Bebedero sin agua o muy sucio.', riesgos:'Las gallinas pueden deshidratarse en pocas horas.', sugerencia:'Limpiar y rellenar de inmediato.' },
    ],
    comedero: [
      { estado:'verde',    obs:'Comedero con alimento suficiente.', riesgos:'Ninguno.', sugerencia:'Mantener el nivel actual.' },
      { estado:'amarillo', obs:'Alimento bajo, quedan pocas horas.', riesgos:'Baja producción si no se repone.', sugerencia:'Reponer alimento antes de las 14hs.' },
    ],
    galpon: [
      { estado:'verde',    obs:'Galpón limpio y bien ventilado.', riesgos:'Ninguno detectado.', sugerencia:'Limpieza profunda en 15 días.' },
      { estado:'amarillo', obs:'Se detecta acumulación de cama húmeda.', riesgos:'Riesgo de enfermedades respiratorias.', sugerencia:'Renovar cama parcialmente esta semana.' },
    ],
    huevos: [
      { estado:'verde',    obs:'Huevos en buen estado, limpios y sin roturas.', riesgos:'Ninguno.', sugerencia:'Continuar con la recolección normal.' },
      { estado:'amarillo', obs:'Se observan algunos huevos sucios.', riesgos:'Rechazo de clientes.', sugerencia:'Revisar nidales y limpiar con paño húmedo antes de embalar.' },
    ],
    infraestructura: [
      { estado:'verde',    obs:'Estructura del galpón en buen estado.', riesgos:'Ninguno.', sugerencia:'Revisión preventiva en 3 meses.' },
      { estado:'amarillo', obs:'Se detecta filtración leve en el techo.', riesgos:'Humedad puede afectar la cama y la salud de las gallinas.', sugerencia:'Reparar la filtración antes de la próxima lluvia.' },
    ],
  };

  const HISTORIAL = [
    { fecha:'Ayer',  tipo:'bebedero',  galpon:'Galpón 1', estado:'verde',  miniatura:'💧' },
    { fecha:'Lun',   tipo:'galpon',    galpon:'Galpón 2', estado:'amarillo', miniatura:'🏠' },
    { fecha:'Vie',   tipo:'comedero',  galpon:'Galpón 1', estado:'verde',  miniatura:'🌾' },
  ];

  let tipoSeleccionado = null;
  let fotoUrl          = null;
  let analizando       = false;
  let resultadoIA      = null;

  function render() {
    return `
    <div class="modulo-contenedor">
      <h2 class="modulo-titulo">📸 Inspección IA</h2>
      <p class="modulo-subtitulo">Sacá una foto y la IA te dice cómo está</p>

      <!-- SELECTOR DE TIPO -->
      <div class="tipos-inspeccion">
        ${TIPOS.map(t => `
          <button class="btn-tipo-inspeccion ${tipoSeleccionado === t.id ? 'activo' : ''}"
                  onclick="ModuloInspeccion.seleccionarTipo('${t.id}')">
            <span class="tipo-icono">${t.icono}</span>
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- ZONA DE FOTO -->
      <div class="zona-foto" onclick="ModuloInspeccion.abrirCamara()" id="zona-foto">
        ${fotoUrl
          ? `<img src="${fotoUrl}" class="foto-preview" alt="Foto de inspección">`
          : `<div class="zona-foto-placeholder">
              <span class="zona-foto-icono">📷</span>
              <span>Tocá para sacar o subir una foto</span>
            </div>`
        }
      </div>

      <input type="file" id="input-foto-inspeccion" accept="image/*" capture="environment"
             class="hidden" onchange="ModuloInspeccion.procesarFoto(this)">

      <!-- BOTÓN ANALIZAR -->
      <button class="btn-primario btn-full ${!tipoSeleccionado || !fotoUrl ? 'disabled' : ''}"
              onclick="ModuloInspeccion.analizarFoto()"
              ${!tipoSeleccionado || !fotoUrl ? 'disabled' : ''}>
        ${analizando ? '⏳ Analizando...' : '🔍 Analizar con IA'}
      </button>

      ${tipoSeleccionado && !fotoUrl ? `<p class="hint-texto">Ahora sacá una foto del ${TIPOS.find(t=>t.id===tipoSeleccionado)?.label.toLowerCase() || 'elemento'}</p>` : ''}
      ${!tipoSeleccionado ? `<p class="hint-texto">Primero elegí qué vas a inspeccionar</p>` : ''}

      <!-- RESULTADO IA -->
      ${resultadoIA ? renderResultado(resultadoIA) : ''}

      <!-- HISTORIAL -->
      <div class="seccion-bloque">
        <h3 class="seccion-titulo">📋 Historial de inspecciones</h3>
        <div class="historial-insp-lista">
          ${HISTORIAL.map(h => `
            <div class="historial-insp-item">
              <span class="hist-miniatura">${h.miniatura}</span>
              <div class="hist-info">
                <span class="hist-tipo">${h.tipo.charAt(0).toUpperCase() + h.tipo.slice(1)} — ${h.galpon}</span>
                <span class="hist-fecha">${h.fecha}</span>
              </div>
              <span class="semaforo-dot-sm bg-${h.estado}"></span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>`;
  }

  function renderResultado(r) {
    const colores = { verde: '#4caf50', amarillo: '#ff9800', rojo: '#f44336' };
    const emojis  = { verde: '✅', amarillo: '⚠️', rojo: '🔴' };
    return `
    <div class="resultado-ia resultado-${r.estado}">
      <div class="resultado-estado">
        <span class="resultado-emoji">${emojis[r.estado]}</span>
        <strong>${r.estado === 'verde' ? 'Todo bien' : r.estado === 'amarillo' ? 'Requiere atención' : 'Problema detectado'}</strong>
      </div>
      <div class="resultado-detalle">
        <p><strong>📝 Observaciones:</strong> ${r.obs}</p>
        <p><strong>⚠️ Riesgos:</strong> ${r.riesgos}</p>
        <p><strong>💡 Sugerencia:</strong> ${r.sugerencia}</p>
      </div>
      <button class="btn-secundario btn-full" onclick="ModuloInspeccion.crearTareaDesdeIA()">
        ➕ Crear tarea para el equipo
      </button>
    </div>`;
  }

  function seleccionarTipo(tipo) {
    tipoSeleccionado = tipo;
    resultadoIA = null;
    document.getElementById('contenido-principal').innerHTML = render();
  }

  function abrirCamara() {
    document.getElementById('input-foto-inspeccion').click();
  }

  function procesarFoto(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      fotoUrl = e.target.result;
      document.getElementById('contenido-principal').innerHTML = render();
    };
    reader.readAsDataURL(input.files[0]);
  }

  function analizarFoto() {
    if (!tipoSeleccionado || !fotoUrl || analizando) return;
    analizando = true;
    document.getElementById('contenido-principal').innerHTML = render();

    // Simulación de IA (en producción: llamar a Gemini Vision API)
    setTimeout(() => {
      const opciones = RESPUESTAS_IA[tipoSeleccionado] || RESPUESTAS_IA['galpon'];
      resultadoIA = opciones[Math.floor(Math.random() * opciones.length)];
      analizando  = false;
      document.getElementById('contenido-principal').innerHTML = render();
    }, 2000);
  }

  function crearTareaDesdeIA() {
    if (!resultadoIA) return;
    UI.mostrarToast('✅ Tarea creada para el equipo', 'success');
    App.navegar('equipo');
  }

  return { render, seleccionarTipo, abrirCamara, procesarFoto, analizarFoto, crearTareaDesdeIA };
})();
