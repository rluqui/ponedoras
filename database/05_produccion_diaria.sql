-- ============================================================
-- 05_produccion_diaria.sql
-- Tabla de producción diaria por gallinero
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar campo terminologia a galpones (por si no existe)
ALTER TABLE public.galpones
  ADD COLUMN IF NOT EXISTS terminologia VARCHAR(30) DEFAULT 'gallinero';

-- 2. Crear tabla produccion_diaria
CREATE TABLE IF NOT EXISTS public.produccion_diaria (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  galpon_id       UUID NOT NULL REFERENCES public.galpones(id) ON DELETE CASCADE,
  galpon          VARCHAR(100),           -- nombre del galpón (desnormalizado para consultas rápidas)
  cantidad_aves   INT NOT NULL DEFAULT 0 CHECK (cantidad_aves >= 0),
  huevos          INT NOT NULL DEFAULT 0 CHECK (huevos >= 0),
  rotos           INT NOT NULL DEFAULT 0 CHECK (rotos >= 0),
  mortandad       INT NOT NULL DEFAULT 0 CHECK (mortandad >= 0),
  estado_agua     VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (estado_agua IN ('normal','baja','sin_agua')),
  estado_alimento VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (estado_alimento IN ('normal','bajo','sin_alimento')),
  observaciones   TEXT,
  operador_id     UUID REFERENCES public.usuarios(id),
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fecha, galpon_id)
);

-- 3. Índices para consultas comunes
CREATE INDEX IF NOT EXISTS idx_prod_diaria_fecha     ON public.produccion_diaria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_prod_diaria_galpon_id ON public.produccion_diaria(galpon_id);

-- 4. RLS
ALTER TABLE public.produccion_diaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prod_diaria_select" ON public.produccion_diaria;
DROP POLICY IF EXISTS "prod_diaria_insert" ON public.produccion_diaria;
DROP POLICY IF EXISTS "prod_diaria_update" ON public.produccion_diaria;

CREATE POLICY "prod_diaria_select"
  ON public.produccion_diaria FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prod_diaria_insert"
  ON public.produccion_diaria FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "prod_diaria_update"
  ON public.produccion_diaria FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 5. Vista útil para consultas con nombre del gallinero
CREATE OR REPLACE VIEW public.v_produccion_diaria AS
  SELECT
    pd.*,
    g.nombre     AS galpon_nombre,
    g.capacidad_aves,
    g.terminologia
  FROM public.produccion_diaria pd
  LEFT JOIN public.galpones g ON g.id = pd.galpon_id;

-- ============================================================
-- DATOS SEMILLA: primer gallinero de ejemplo (si la tabla galpones está vacía)
-- Descomentá si necesitás datos iniciales:
-- INSERT INTO public.galpones (nombre, capacidad_aves, terminologia)
-- VALUES ('Gallinero 1', 200, 'gallinero')
-- ON CONFLICT DO NOTHING;
-- ============================================================
