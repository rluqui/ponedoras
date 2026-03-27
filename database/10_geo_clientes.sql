-- ============================================================
-- MIGRACIÓN: Geolocalización de Clientes
-- Archivo: 10_geo_clientes.sql
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Columnas de coordenadas GPS para el domicilio del cliente
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7);

COMMENT ON COLUMN public.clientes.lat IS 'Latitud GPS del domicilio del cliente';
COMMENT ON COLUMN public.clientes.lng IS 'Longitud GPS del domicilio del cliente';

-- Índice para búsquedas geoespaciales futuras (ej: clientes en radio de entrega)
CREATE INDEX IF NOT EXISTS idx_clientes_geo
  ON public.clientes(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

