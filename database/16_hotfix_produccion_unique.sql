-- ============================================================
-- HOTFIX: Corrección Multi-Tenant para Producción Diaria
-- Problema: La tabla produccion_diaria tenía un UNIQUE global (fecha, galpon)
-- lo que causaba violación RLS al intentar hacer UPSERT (insert on conflict update)
-- cuando otra granja ya había registrado producción para el mismo "Galpón 1" en la misma fecha.
-- ============================================================

-- 1. Eliminar la restricción UNIQUE global obsoleta
ALTER TABLE public.produccion_diaria DROP CONSTRAINT IF EXISTS produccion_diaria_fecha_galpon_key;

-- Por seguridad extra, borrar si se hubiera creado con otro nombre genérico (como el que arroja PG a veces si se nombra en linea)
DO $$
DECLARE constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.produccion_diaria'::regclass AND contype = 'u' 
      AND array_length(conkey, 1) = 2; -- Asumiendo que era la unica llave de 2 columnas
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.produccion_diaria DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END IF;
END $$;

-- 2. Crear la restricción UNIQUE dependiente de Tenant (granja_id)
ALTER TABLE public.produccion_diaria ADD CONSTRAINT produccion_diaria_granja_fecha_galpon_key UNIQUE (granja_id, fecha, galpon);

-- Mensaje de éxito
-- La app (db.js) ya fue actualizada para usar onConflict: 'granja_id,fecha,galpon'
