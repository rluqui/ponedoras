-- ============================================================
-- HOTFIX: Actualización de restricciones CHECK para Lotes y Producción
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Actualizar Lotes para permitir estado 'recria' y 'vendido'
ALTER TABLE public.lotes DROP CONSTRAINT IF EXISTS lotes_estado_check;

-- Volvemos a crear la restricción con los nuevos estados
ALTER TABLE public.lotes ADD CONSTRAINT lotes_estado_check 
  CHECK (estado IN ('activo', 'recria', 'descartado', 'vendido'));

-- 2. Asegurarnos que produccion_diaria permita 'sin_agua' y 'sin_alimento'
-- (La app ahora envía 'sin' por defecto para retrocompatibilidad, 
-- pero esto previene errores si otra app intenta enviar el texto largo)
ALTER TABLE public.produccion_diaria DROP CONSTRAINT IF EXISTS produccion_diaria_estado_agua_check;
ALTER TABLE public.produccion_diaria DROP CONSTRAINT IF EXISTS produccion_diaria_estado_alimento_check;

ALTER TABLE public.produccion_diaria ADD CONSTRAINT produccion_diaria_estado_agua_check
  CHECK (estado_agua IN ('normal', 'baja', 'sin', 'sin_agua'));

ALTER TABLE public.produccion_diaria ADD CONSTRAINT produccion_diaria_estado_alimento_check
  CHECK (estado_alimento IN ('normal', 'bajo', 'sin', 'sin_alimento'));

-- Fin del Hotfix
