-- ============================================================
-- PONEDORAS — Setup Módulo Clientes CRM (COMPLETO)
-- Archivo: 07_clientes_setup_completo.sql
-- EJECUTAR EN ORDEN en el SQL Editor de Supabase
-- Es seguro: usa IF NOT EXISTS / OR REPLACE / DROP IF EXISTS
-- ============================================================

-- ── 1. EXTENSIONES ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. TABLA CLIENTES (adaptar a módulo CRM) ─────────────────
-- Agregar columna telefono si no existe
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- Copiar whatsapp → telefono donde corresponda
UPDATE public.clientes
  SET telefono = whatsapp
  WHERE telefono IS NULL AND whatsapp IS NOT NULL;

-- Agregar ultima_compra si no existe
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ultima_compra DATE;

-- Agregar observaciones si no existe
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Liberar constraint de zona para aceptar texto libre
ALTER TABLE public.clientes
  DROP CONSTRAINT IF EXISTS clientes_zona_check;

ALTER TABLE public.clientes
  ALTER COLUMN zona TYPE VARCHAR(100);

-- ── 3. TABLA VENTAS (unificada para el módulo) ───────────────
-- Agrega columnas faltantes en la tabla ventas existente

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

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas   ENABLE ROW LEVEL SECURITY;

-- Clientes
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

-- Ventas
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
CREATE INDEX IF NOT EXISTS idx_clientes_activo       ON public.clientes(activo);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id     ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado         ON public.ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_desc     ON public.ventas(fecha DESC);

-- ── 6. TRIGGER: actualizar ultima_compra automáticamente ─────
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

-- ── 7. DATOS DE PRUEBA ────────────────────────────────────────
-- Insertar clientes de ejemplo (solo si la tabla está vacía)
INSERT INTO public.clientes (nombre, telefono, tipo, zona, activo, ultima_compra, observaciones)
SELECT nombre, telefono, tipo::VARCHAR, zona, activo, ultima_compra::DATE, observaciones
FROM (VALUES
  ('María González',  '2624111222', 'particular',  'Centro',    TRUE, CURRENT_DATE - 5,  'Prefiere huevos extra grandes'),
  ('Alm. Don Luis',   '2624333444', 'almacen',     'Norte',     TRUE, CURRENT_DATE - 12, 'Paga cada 15 días'),
  ('Familia Soria',   '2624555666', 'particular',  'Sur',       TRUE, CURRENT_DATE - 35, NULL),
  ('Rest. El Rancho', '2624777888', 'restaurante', 'Centro',    TRUE, CURRENT_DATE - 2,  'Cobra factura mensual'),
  ('Verdulería Sol',  '2624999000', 'verduleria',  'Las Heras', TRUE, CURRENT_DATE - 20, NULL)
) AS datos(nombre, telefono, tipo, zona, activo, ultima_compra, observaciones)
WHERE NOT EXISTS (SELECT 1 FROM public.clientes LIMIT 1);

-- ── FIN ───────────────────────────────────────────────────────
-- El módulo clientes ya está configurado en el frontend:
--   index.html  → <script src="js/modules/clientes.js">
--   app.js      → MODULOS.clientes = ModuloClientes
--   css/app.css → Estilos completos de clientes CRM
--   db.js       → obtenerClientes / insertarCliente / actualizarCliente / obtenerVentasCliente
