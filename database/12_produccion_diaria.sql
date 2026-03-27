-- ============================================================
-- Tabla Producción Diaria (Específica para el frontend simplificado)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.produccion_diaria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    galpon VARCHAR(60) NOT NULL,
    huevos INT NOT NULL DEFAULT 0 CHECK (huevos >= 0),
    rotos INT NOT NULL DEFAULT 0 CHECK (rotos >= 0),
    mortandad INT NOT NULL DEFAULT 0 CHECK (mortandad >= 0),
    estado_agua VARCHAR(20) NOT NULL DEFAULT 'normal',
    estado_alimento VARCHAR(20) NOT NULL DEFAULT 'normal',
    observaciones TEXT,
    operador_id UUID REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fecha, galpon)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.produccion_diaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produccion_select_authenticated" ON public.produccion_diaria;
DROP POLICY IF EXISTS "produccion_insert_authenticated" ON public.produccion_diaria;
DROP POLICY IF EXISTS "produccion_update_authenticated" ON public.produccion_diaria;
DROP POLICY IF EXISTS "produccion_delete_authenticated" ON public.produccion_diaria;

CREATE POLICY "produccion_select_authenticated" ON public.produccion_diaria FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "produccion_insert_authenticated" ON public.produccion_diaria FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "produccion_update_authenticated" ON public.produccion_diaria FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "produccion_delete_authenticated" ON public.produccion_diaria FOR DELETE USING (auth.role() = 'authenticated');

-- Indices
CREATE INDEX IF NOT EXISTS idx_produccion_fecha ON public.produccion_diaria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_produccion_galpon ON public.produccion_diaria(galpon);
