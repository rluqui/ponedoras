// supabase.js — Cliente de Supabase
let supabase_cliente = null;

function inicializarSupabase() {
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'TU_SUPABASE_URL') {
    console.warn('⚠️ Supabase no configurado. Usando modo demo.');
    return null;
  }
  const { createClient } = supabase;
  supabase_cliente = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  return supabase_cliente;
}

function obtenerSupabase() {
  return supabase_cliente;
}
