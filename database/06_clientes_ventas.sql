-- ============================================================
-- MIGRACIÓN: Módulo Clientes CRM
-- Archivo: 06_clientes_ventas.sql
-- Descripción: Adapta las tablas clientes y ventas al módulo CRM
--              del frontend (clientes.js / ventas.js)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. ADAPTAR TABLA CLIENTES ─────────────────────────────────
-- El módulo usa 'telefono' (no 'whatsapp') y necesita 'ultima_compra'

-- Agregar columna telefono si no existe (alias de whatsapp para el módulo)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- Copiar datos de whatsapp a telefono si existen
UPDATE public.clientes SET telefono = whatsapp WHERE telefono IS NULL AND whatsapp IS NOT NULL;

-- Agregar columna ultima_compra si no existe
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ultima_compra DATE;

-- Agregar columna observaciones si no existe
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Ampliar el CHECK de zona para ser más flexible (acepta cualquier zona)
-- Primero eliminamos la constraint existente y la reemplazamos
ALTER TABLE public.clientes
  DROP CONSTRAINT IF EXISTS clientes_zona_check;

-- Hacer zona un campo de texto libre (el módulo lo usa libre)
ALTER TABLE public.clientes
  ALTER COLUMN zona TYPE VARCHAR(100);


-- ── 2. TABLA VENTAS UNIFICADA ────────────────────────────────
-- Eliminamos la tabla vieja y creamos la versión que usa el módulo
-- IMPORTANTE: Solo ejecutar en entorno limpio (sin datos de producción)

-- Primero, verificar si la tabla ya tiene la estructura correcta
-- Si la tabla 'ventas' ya existe con la estructura nueva (maples_entregados, etc.),
-- solo necesitamos agregar el campo cliente_id faltante:

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(100);

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS tipo_huevo VARCHAR(30)
    CHECK (tipo_huevo IN ('Mediano','Grande','Extra grande','Mixto'));

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS canal VARCHAR(50)
    CHECK (canal IN ('Directo','Almacén','Verdulería','Restaurante','WhatsApp','Otro'));

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS maples_entregados INTEGER CHECK (maples_entregados > 0);

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS precio_maple DECIMAL(10,2) CHECK (precio_maple > 0);

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','entregado','cobrado','cancelado'));

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS registrado_por UUID REFERENCES auth.users(id);

-- ── 3. RLS PARA CLIENTES ──────────────────────────────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "clientes_select_authenticated" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_authenticated"  ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_authenticated"  ON public.clientes;

CREATE POLICY "clientes_select_authenticated"
  ON public.clientes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "clientes_insert_authenticated"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "clientes_update_authenticated"
  ON public.clientes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── 4. RLS PARA VENTAS ───────────────────────────────────────
-- (ya existe en 01_tablas.sql pero lo aseguramos)
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ventas_select_authenticated" ON public.ventas;
DROP POLICY IF EXISTS "ventas_insert_authenticated"  ON public.ventas;
DROP POLICY IF EXISTS "ventas_update_authenticated"  ON public.ventas;

CREATE POLICY "ventas_select_authenticated"
  ON public.ventas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ventas_insert_authenticated"
  ON public.ventas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ventas_update_authenticated"
  ON public.ventas FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── 5. ÍNDICES DE RENDIMIENTO ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id  ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_activo     ON public.clientes(activo);
CREATE INDEX IF NOT EXISTS idx_ventas_estado       ON public.ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_desc   ON public.ventas(fecha DESC);

-- ── 6. TRIGGER: actualizar ultima_compra automáticamente ──────
CREATE OR REPLACE FUNCTION public.fn_actualizar_ultima_compra()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cliente_id IS NOT NULL THEN
    UPDATE public.clientes
      SET ultima_compra = NEW.fecha
    WHERE id = NEW.cliente_id
      AND (ultima_compra IS NULL OR NEW.fecha >= ultima_compra);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_ultima_compra ON public.ventas;
CREATE TRIGGER trg_actualizar_ultima_compra
  AFTER INSERT ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_ultima_compra();

-- ── 7. DATOS DE PRUEBA (opcional) ────────────────────────────
-- Descomentá este bloque si querés cargar clientes de ejemplo

/*
INSERT INTO public.clientes (nombre, telefono, tipo, zona, activo, ultima_compra)
VALUES
  ('María González',  '2624111222', 'particular',  'Centro',   TRUE, CURRENT_DATE - 5),
  ('Alm. Don Luis',   '2624333444', 'almacen',     'Norte',    TRUE, CURRENT_DATE - 12),
  ('Familia Soria',   '2624555666', 'particular',  'Sur',      TRUE, CURRENT_DATE - 35),
  ('Rest. El Rancho', '2624777888', 'restaurante', 'Centro',   TRUE, CURRENT_DATE - 2),
  ('Verdulería Sol',  '2624999000', 'verduleria',  'Las Heras', TRUE, CURRENT_DATE - 20)
ON CONFLICT DO NOTHING;
*/
