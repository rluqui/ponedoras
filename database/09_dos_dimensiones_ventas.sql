-- ============================================================
-- MIGRACIÓN: Estado de Ventas en Dos Dimensiones
-- v3 — Solo ALTER TABLE sin VIEW (evita problemas de columnas)
-- ============================================================

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS estado_entrega VARCHAR(20) DEFAULT 'pendiente';

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS fecha_entrega DATE;

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'pendiente';

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS monto_cobrado DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS notas TEXT;
