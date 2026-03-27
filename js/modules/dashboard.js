// dashboard.js — Analítica con Chart.js
const ModuloDashboard = (() => {

  let chartProduccion = null;

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
        <div style="display:flex; gap:8px; overflow-x:auto; margin-bottom:16px; padding-bottom:8px" id="dashboard-filtros">
          <button class="pill-filtro activa" data-dias="7">Última Semana</button>
          <button class="pill-filtro" data-dias="15">15 Días</button>
          <button class="pill-filtro" data-dias="30">Último Mes</button>
          <button class="pill-filtro" data-dias="365">Este Año</button>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:16px; position:relative; min-height:250px">
           <canvas id="canvas-produccion"></canvas>
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
              <div class="kpi-label">Docenas vendidas</div>
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
    await cargarDatos(7); // por defecto 7 dias
  }

  function configurarFiltros() {
    const botones = document.querySelectorAll('#dashboard-filtros .pill-filtro');
    botones.forEach(btn => {
      btn.addEventListener('click', (e) => {
        botones.forEach(b => b.classList.remove('activa'));
        e.target.classList.add('activa');
        const dias = parseInt(e.target.dataset.dias);
        document.querySelector('.hoy-subtitulo').textContent = `Analítica de últimos ${dias} días`;
        cargarDatos(dias);
      });
    });
  }

  async function cargarDatos(rangoDias) {
    if (chartProduccion) {
      chartProduccion.destroy(); // limpiar previo
      chartProduccion = null;
    }
    
    // Obtener data del db
    const datos = await DB.obtenerDataDashboard(rangoDias);

    // Preparar totales
    const maxHuevos = datos.produccion.reduce((s, d) => s + d.huevos, 0);
    const maxBajas = datos.produccion.reduce((s, d) => s + d.mortandad, 0);
    const maxVentas = datos.ventas.reduce((s, v) => s + v.docenas, 0);

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
      fechasMap[v.fecha].ventas += (v.docenas * 12); // convertimos a huevos individuales
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

  }

  return { render, postRender };
})();
