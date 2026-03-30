// mas.js — Menú extendido
const ModuloMas = (() => {

  function render() {
    return `
    <div class="modulo-contenedor animation-fade-in">
      <div class="seccion-header">
        <h2 class="seccion-titulo" style="font-size: 1.5rem">📚 Más Opciones</h2>
      </div>
      
      <p style="color:var(--texto-secundario); font-size: 0.9rem; margin-bottom: 20px;">
        Accedé a la administración general, reportes analíticos y la gestión de tu equipo de trabajo.
      </p>

      <div class="mas-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        
        <!-- Reportes -->
        <div class="kpi-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 24px 16px; cursor:pointer; border: 1px solid rgba(255,255,255,0.05);" onclick="App.navegar('dashboard')">
          <div style="font-size: 2.5rem; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2))">📊</div>
          <div style="font-weight: 700; color: var(--texto-primario); font-size: 1.1rem;">Reportes</div>
          <div style="font-size: 0.8rem; color: var(--texto-secundario); margin-top:4px">Producción y Ventas</div>
        </div>

        <!-- Plantel -->
        <div class="kpi-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 24px 16px; cursor:pointer; border: 1px solid rgba(255,255,255,0.05);" onclick="App.navegar('plantel')">
          <div style="font-size: 2.5rem; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2))">🐔</div>
          <div style="font-weight: 700; color: var(--texto-primario); font-size: 1.1rem;">Plantel</div>
          <div style="font-size: 0.8rem; color: var(--texto-secundario); margin-top:4px">Lotes y Vacunas</div>
        </div>

        <!-- Equipo (Sugerencia del usuario) -->
        <div class="kpi-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 24px 16px; cursor:pointer; background: linear-gradient(145deg, rgba(76,175,80,0.1), rgba(0,0,0,0.2)); border: 1px solid rgba(76,175,80,0.2);" onclick="App.navegar('equipo')">
          <div style="font-size: 2.5rem; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(76,175,80,0.4))">👥</div>
          <div style="font-weight: 700; color: var(--texto-primario); font-size: 1.1rem;">Equipo</div>
          <div style="font-size: 0.8rem; color: var(--texto-secundario); margin-top:4px">Roles y Tareas</div>
        </div>

        <!-- Clientes -->
        <div class="kpi-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 24px 16px; cursor:pointer; border: 1px solid rgba(255,255,255,0.05);" onclick="App.navegar('clientes')">
          <div style="font-size: 2.5rem; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2))">🛒</div>
          <div style="font-weight: 700; color: var(--texto-primario); font-size: 1.1rem;">Clientes</div>
          <div style="font-size: 0.8rem; color: var(--texto-secundario); margin-top:4px">Agenda y Saldos</div>
        </div>

        <!-- Configuración -->
        <div class="kpi-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 24px 16px; cursor:pointer; grid-column: span 2; border: 1px solid rgba(255,255,255,0.05);" onclick="App.navegar('configuracion')">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">⚙️</div>
          <div style="font-weight: 700; color: var(--texto-primario); font-size: 1.1rem;">Configuración de Granja</div>
          <div style="font-size: 0.8rem; color: var(--texto-secundario); margin-top:4px">Suscripción, Alquileres, Perfiles y Ajustes</div>
        </div>

      </div>

      <!-- Footer / Versión -->
      <div style="text-align:center; margin-top: 40px; margin-bottom: 20px; color: var(--texto-terciario); font-size: 0.8rem;">
        <div style="font-size: 2rem; opacity: 0.2; margin-bottom: 8px">🥚</div>
        <p style="font-weight: 600">Granja Familiar Inteligente</p>
        <p style="margin-top: 4px">Versión SaaS 2.0</p>
      </div>
    </div>`;
  }

  function postRender() {
    // Al cargar MÁS, podemos precargar datos si es necesario (ej: notificaciones numéricas en los íconos)
  }

  return { render, postRender };
})();
