-- ============================================================
-- MIGRACIÓN: Marketing & Ventas — Campos nuevos
-- Archivo: 08_marketing_ventas.sql
-- Descripción: Agrega captado_por_app y frecuencia en clientes,
--              notas en ventas. Para el módulo de marketing guiado.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── TABLA CLIENTES: campos nuevos ────────────────────────────

-- Marca si el cliente llegó gracias a la app (para medir impacto/ROI)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS captado_por_app BOOLEAN DEFAULT false;

-- Frecuencia esperada de compra: semanal | quincenal | mensual
-- (Permite calcular cuándo contactar al cliente antes de que se vaya)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS frecuencia VARCHAR(20) DEFAULT 'quincenal'
    CHECK (frecuencia IN ('semanal', 'quincenal', 'mensual'));

-- ── TABLA VENTAS: campos nuevos ───────────────────────────────

-- Notas internas sobre la venta (ej: "Entregar el miércoles")
ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS notas TEXT;

-- ── ÍNDICE para reportes de impacto de la app ─────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_captado_app
  ON public.clientes(captado_por_app)
  WHERE captado_por_app = true;

-- ── VISTA OPCIONAL: resumen de valor generado por la app ──────
-- Útil para reportes y para justificar el valor de la suscripción
CREATE OR REPLACE VIEW public.v_valor_app AS
SELECT
  count(DISTINCT c.id)                                     AS clientes_captados,
  coalesce(sum(v.total), 0)                                AS total_ventas_app,
  count(DISTINCT v.id)                                     AS cantidad_ventas_app,
  to_char(now(), 'YYYY-MM')                                AS mes
FROM public.clientes c
LEFT JOIN public.ventas v ON v.cliente_id = c.id
  AND v.fecha >= date_trunc('month', now())::date
WHERE c.captado_por_app = true
  AND c.activo = true;
