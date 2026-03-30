// dashboard.js — Analítica con Chart.js
const ModuloDashboard = (() => {

  let chartProduccion = null;
  let chartAcumulado = null;

  function render() {
    return `
    <div class="modulo-contenedor">
      <div class="hoy-saludo">
        <div>
          <h1 class="hoy-titulo">Reportes 📊</h1>
          <p class="hoy-subtitulo">Analítica de los últimos 7 días</p>
        </div>
      </div>

      <div class="seccion-bloque">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;" id="dashboard-filtros">
            <button class="pill-filtro activa" data-dias="7">7 Días</button>
            <button class="pill-filtro" data-dias="15">15 Días</button>
            <button class="pill-filtro" data-dias="30">30 Días</button>
            <span style="color:var(--texto-secundario); margin:0 4px">|</span>
            <div style="display:flex; gap:6px; align-items:center; background:rgba(0,0,0,0.2); border-radius:12px; padding:4px 8px">
              <input type="date" id="dash-desde" style="background:transparent; color:#fff; border:none; outline:none; font-family:inherit; font-size:0.8rem; cursor:pointer" title="Filtro Desde">
              <span style="color:#aaa; font-size:0.8rem">-</span>
              <input type="date" id="dash-hasta" style="background:transparent; color:#fff; border:none; outline:none; font-family:inherit; font-size:0.8rem; cursor:pointer" title="Filtro Hasta">
              <button class="pill-filtro" id="btn-filtro-custom" style="padding:4px 8px; margin-left:4px; font-size:1rem" title="Aplicar rango">🔍</button>
            </div>
          </div>
          <div>
            <select id="filtro-galpon" style="background:rgba(0,0,0,0.4); color:#fff; font-weight:600; font-family:inherit; border:1px solid rgba(255,255,255,0.2); padding:6px 12px; border-radius:12px; font-size:0.85rem; outline:none; cursor:pointer">
              <option value="todos">Todos los galpones</option>
            </select>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:16px; position:relative; min-height:250px; margin-bottom:16px">
           <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; color: var(--texto-secundario); font-weight: 500;">Diario: Producción vs. Ventas</h4>
           <div style="position:relative; height:200px"><canvas id="canvas-produccion"></canvas></div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:16px; position:relative; min-height:250px">
           <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; color: var(--texto-secundario); font-weight: 500;">Acumulado del Período</h4>
           <div style="position:relative; height:200px"><canvas id="canvas-acumulado"></canvas></div>
        </div>
      </div>

      <div class="seccion-bloque">
        <h3 class="seccion-titulo">Métricas Clave</h3>
        <div class="kpi-grid">
           <div class="kpi-card">
              <div class="kpi-valor kpi-verde" id="dash-huevos">—</div>
              <div class="kpi-label">Huevos producidos</div>
           </div>
           <div class="kpi-card">
              <div class="kpi-valor" id="dash-mortalidad">—</div>
              <div class="kpi-label">Aves perdidas</div>
           </div>
           <div class="kpi-card">
              <div class="kpi-valor kpi-amarillo" id="dash-ventas">—</div>
              <div class="kpi-label">Maples vendidos</div>
           </div>
        </div>
      </div>
    </div>

    <style>
      .pill-filtro {
        background: rgba(255,255,255,0.1); border:none; color: white; border-radius: 20px;
        padding: 6px 14px; font-size: 0.85rem; cursor: pointer; white-space:nowrap;
      }
      .pill-filtro.activa {
        background: var(--color-primario); font-weight: 700; color: #111;
      }
    </style>
    `;
  }

  async function postRender() {
    configurarFiltros();
    await cargarFiltroGalpones();
    await cargarDatos(7); // por defecto 7 dias
  }

  async function cargarFiltroGalpones() {
    const galpones = await DB.obtenerGalpones();
    const select = document.getElementById('filtro-galpon');
    if(!select) return;
    galpones.forEach(g => {
       const opt = document.createElement('option');
       opt.value = g.id; opt.textContent = g.nombre;
       select.appendChild(opt);
    });
    select.addEventListener('change', () => {
       // Disparar recarga detectando qué botón de días está prendido
       const activa = document.querySelector('#dashboard-filtros .pill-filtro.activa');
       if (activa) {
          cargarDatos(parseInt(activa.dataset.dias));
       } else {
          cargarDatos({ 
            desde: document.getElementById('dash-desde').value, 
            hasta: document.getElementById('dash-hasta').value 
          });
       }
    });
  }

  function configurarFiltros() {
    const botones = document.querySelectorAll('#dashboard-filtros .pill-filtro[data-dias]');
    const btnCustom = document.getElementById('btn-filtro-custom');
    
    // Auto-completar fechas custom con la semana actual
    const hoy = new Date();
    const semanaAtras = new Date(); semanaAtras.setDate(semanaAtras.getDate() - 7);
    document.getElementById('dash-hasta').value = hoy.toISOString().split('T')[0];
    document.getElementById('dash-desde').value = semanaAtras.toISOString().split('T')[0];

    botones.forEach(btn => {
      btn.addEventListener('click', (e) => {
        botones.forEach(b => b.classList.remove('activa'));
        e.target.classList.add('activa');
        const dias = parseInt(e.target.dataset.dias);
        document.querySelector('.hoy-subtitulo').textContent = `Analítica de últimos ${dias} días`;
        cargarDatos(dias);
      });
    });

    btnCustom.addEventListener('click', () => {
        const d_desde = document.getElementById('dash-desde').value;
        const d_hasta = document.getElementById('dash-hasta').value;
        if(!d_desde || !d_hasta) return alert('Seleccioná ambas fechas');
        if(d_desde > d_hasta) return alert('La fecha de inicio debe ser anterior a la de fin');
        
        botones.forEach(b => b.classList.remove('activa')); // sacar marca a las pildoras
        
        // Convertir formato para subtitulo humano (dd/mm/aaaa)
        const fs = d_desde.split('-'); const fh = d_hasta.split('-');
        document.querySelector('.hoy-subtitulo').textContent = `Desde ${fs[2]}/${fs[1]} hasta ${fh[2]}/${fh[1]}`;
        cargarDatos({ desde: d_desde, hasta: d_hasta });
    });
  }

  async function cargarDatos(paramFiltro) {
    if (chartProduccion) { chartProduccion.destroy(); chartProduccion = null; }
    if (chartAcumulado) { chartAcumulado.destroy(); chartAcumulado = null; }
    
    const valGalpon = document.getElementById('filtro-galpon')?.value || 'todos';

    // Obtener data del db pasándole el numero o el objeto custom + galponId
    const datos = await DB.obtenerDataDashboard(paramFiltro, valGalpon);

    // Preparar totales
    const maxHuevos = datos.produccion.reduce((s, d) => s + d.huevos, 0);
    const maxBajas = datos.produccion.reduce((s, d) => s + d.mortandad, 0);
    const maxVentas = datos.ventas.reduce((s, v) => s + (v.maples_entregados || 0), 0);

    const elHuevos = document.getElementById('dash-huevos');
    if(elHuevos) elHuevos.textContent = maxHuevos.toLocaleString('es-AR');
    const elMort = document.getElementById('dash-mortalidad');
    if(elMort) elMort.textContent = maxBajas;
    const elVentas = document.getElementById('dash-ventas');
    if(elVentas) elVentas.textContent = maxVentas.toLocaleString('es-AR');

    renderChart(datos);
  }

  function renderChart(datos) {
    const ctx = document.getElementById('canvas-produccion');
    if (!ctx) return;

    // Para juntar por fecha, creamos un array map
    const fechasMap = {};
    datos.produccion.forEach(p => {
      if(!fechasMap[p.fecha]) fechasMap[p.fecha] = { huevos: 0, mortandad: 0, ventas: 0 };
      fechasMap[p.fecha].huevos += p.huevos;
      fechasMap[p.fecha].mortandad += p.mortandad;
    });

    datos.ventas.forEach(v => {
      if(!fechasMap[v.fecha]) fechasMap[v.fecha] = { huevos: 0, mortandad: 0, ventas: 0 };
      fechasMap[v.fecha].ventas += ((v.maples_entregados || 0) * 30); // convertimos a huevos individuales
    });

    // Ordenar fechas cronologicamente
    const fechas = Object.keys(fechasMap).sort();
    
    // Etiquetas (DD/MM)
    const labels = fechas.map(f => {
      const parts = f.split('-');
      return `${parts[2]}/${parts[1]}`; // ej 27/03
    });

    const serieHuevos = fechas.map(f => fechasMap[f].huevos);
    const serieVentas = fechas.map(f => fechasMap[f].ventas);

    // Inicializar Chart (requiere ChartJS cargado en nav)
    if (typeof Chart === 'undefined') {
       ctx.parentElement.innerHTML = '<p style="color:red">Error: Librería de gráficos no cargada.</p>';
       return;
    }

    chartProduccion = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Producción (Huevos)',
            data: serieHuevos,
            borderColor: '#ffc107', // amarillo gallina
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#fff'
          },
          {
            label: 'Ventas (equivalente en Huevos)',
            data: serieVentas,
            type: 'bar',
            backgroundColor: 'rgba(76, 175, 80, 0.6)', // verde claro
            borderRadius: 6,
            barThickness: 'flex',
            maxBarThickness: 30
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: '#ccc',
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#ddd', usePointStyle: true, boxWidth: 8 } }
        },
        scales: {
          y: { 
             beginAtZero: true, 
             grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
             ticks: { color: '#999', precision: 0 }
          },
          x: { 
             grid: { display: false },
             ticks: { color: '#999', maxTicksLimit: 7 }
          }
        }
      }
    });

    const ctxAcum = document.getElementById('canvas-acumulado');
    if (!ctxAcum) return;

    let acumH = 0; let acumV = 0;
    const serieHuevosAcum = serieHuevos.map(v => { acumH += v; return acumH; });
    const serieVentasAcum = serieVentas.map(v => { acumV += v; return acumV; });

    chartAcumulado = new Chart(ctxAcum, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Acumulado (Huevos)',
            data: serieHuevosAcum,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.05)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 1
          },
          {
            label: 'Ventas Acumuladas',
            data: serieVentasAcum,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: '#ccc',
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#ddd', usePointStyle: true, boxWidth: 8 } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#999', precision: 0 } },
          x: { grid: { display: false }, ticks: { color: '#999', maxTicksLimit: 7 } }
        }
      }
    });

  }

  return { render, postRender };
})();
