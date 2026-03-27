-- ============================================================
-- ADICIÓN: Tabla foto_conteos (Conteo IA por Fotografía)
-- Agrega al final de 01_tablas.sql o ejecutar por separado
-- ============================================================

CREATE TABLE IF NOT EXISTS public.foto_conteos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Contexto de la foto
    lote_id UUID REFERENCES public.lotes(id),
    registro_diario_id UUID REFERENCES public.registros_diarios(id),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Qué se está contando
    tipo_objeto VARCHAR(30) NOT NULL CHECK (tipo_objeto IN ('pollos', 'huevos', 'maples', 'otro')),
    descripcion_objeto VARCHAR(100), -- ej: "huevos en cinta transportadora"
    -- La foto
    foto_url TEXT NOT NULL,
    foto_storage_path TEXT, -- ruta en Supabase Storage
    -- Resultados del conteo IA
    conteo_ia INT,                    -- lo que detectó Gemini Vision
    confianza_ia DECIMAL(4, 1),       -- % de confianza del modelo
    bounding_boxes JSONB,             -- coords de cada objeto detectado (opcional)
    -- Corrección humana
    conteo_manual INT,                -- el operador confirma o corrige
    validado_por UUID REFERENCES public.usuarios(id),
    -- Auditoría
    delta_conteo INT GENERATED ALWAYS AS (
        CASE WHEN conteo_ia IS NOT NULL AND conteo_manual IS NOT NULL 
             THEN ABS(conteo_ia - conteo_manual) 
             ELSE NULL END
    ) STORED,
    alerta_dispara BOOLEAN GENERATED ALWAYS AS (
        CASE WHEN conteo_ia IS NOT NULL AND conteo_manual IS NOT NULL 
             THEN ABS(conteo_ia - conteo_manual) > (conteo_manual * 0.05)
             ELSE false END
    ) STORED,  -- true si diferencia > 5%
    operador_id UUID REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.foto_conteos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foto_conteos_select" ON public.foto_conteos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "foto_conteos_insert" ON public.foto_conteos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "foto_conteos_update" ON public.foto_conteos
    FOR UPDATE USING (
        public.obtener_rol_actual() IN ('admin', 'operador')
        OR operador_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_foto_conteos_lote ON public.foto_conteos(lote_id);
CREATE INDEX IF NOT EXISTS idx_foto_conteos_fecha ON public.foto_conteos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_foto_conteos_alerta ON public.foto_conteos(alerta_dispara) WHERE alerta_dispara = true;

-- Vista: historial de conteos con alertas
CREATE OR REPLACE VIEW public.v_conteos_con_alertas AS
SELECT 
    fc.id,
    fc.fecha,
    fc.tipo_objeto,
    l.raza AS lote_raza,
    g.nombre AS galpon,
    fc.conteo_ia,
    fc.conteo_manual,
    fc.delta_conteo,
    fc.alerta_dispara,
    fc.confianza_ia,
    fc.foto_url,
    u.nombre AS operador
FROM public.foto_conteos fc
LEFT JOIN public.lotes l ON l.id = fc.lote_id
LEFT JOIN public.galpones g ON g.id = l.galpon_id
LEFT JOIN public.usuarios u ON u.id = fc.operador_id
ORDER BY fc.fecha DESC;

-- Política Bucket Storage para fotos de conteo
-- Ejecutar en Supabase Dashboard > Storage > New Bucket: "foto-conteos" (public: false)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('foto-conteos', 'foto-conteos', false);
