-- ============================================================
-- LOTES: RLS + columna terminologia en galpones
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agregar columna terminologia a galpones si no existe
ALTER TABLE public.galpones
  ADD COLUMN IF NOT EXISTS terminologia VARCHAR(20) DEFAULT 'galpón';

-- Habilitar RLS en lotes
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lotes
-- (DROP primero para evitar duplicados si se re-ejecuta el script)
DROP POLICY IF EXISTS "lotes_select_authenticated" ON public.lotes;
DROP POLICY IF EXISTS "lotes_insert_authenticated" ON public.lotes;
DROP POLICY IF EXISTS "lotes_update_authenticated" ON public.lotes;

CREATE POLICY "lotes_select_authenticated"
  ON public.lotes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "lotes_insert_authenticated"
  ON public.lotes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "lotes_update_authenticated"
  ON public.lotes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Índices útiles para queries de plantel
CREATE INDEX IF NOT EXISTS idx_lotes_estado    ON public.lotes(estado);
CREATE INDEX IF NOT EXISTS idx_lotes_galpon    ON public.lotes(galpon_id);
CREATE INDEX IF NOT EXISTS idx_lotes_ingreso   ON public.lotes(fecha_ingreso DESC);
