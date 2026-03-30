-- ============================================================
-- HOTFIX: Corrección Multi-Tenant para Producción Diaria
-- Problema: La tabla produccion_diaria tenía un UNIQUE global (fecha, galpon)
-- lo que causaba violación RLS al intentar hacer UPSERT (insert on conflict update).
-- ============================================================

-- 1. Eliminar la restricción UNIQUE global obsoleta
ALTER TABLE public.produccion_diaria DROP CONSTRAINT IF EXISTS produccion_diaria_fecha_galpon_key;

-- Por seguridad extra, borrar si se hubiera creado con otro nombre genérico
DO $$
DECLARE constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.produccion_diaria'::regclass AND contype = 'u' 
      AND array_length(conkey, 1) = 2;
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.produccion_diaria DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END IF;
END $$;

-- 2. LIMPIEZA DE DUPLICADOS: Si por error se guardaron registros duplicados
-- para la misma granja, fecha y galpón, ESTO HACE QUE FALLE LA CREACIÓN DEL UNIQUE.
-- Vamos a dejar solo el registro más reciente (el de mayor ID o creado último).
DELETE FROM public.produccion_diaria T1
USING public.produccion_diaria T2
WHERE T1.ctid < T2.ctid 
  AND T1.granja_id = T2.granja_id 
  AND T1.fecha = T2.fecha 
  AND T1.galpon = T2.galpon;

-- 3. Crear la restricción UNIQUE dependiente de Tenant (granja_id)
-- IMPORTANTE: Si este comando falla, lee el mensaje de error rojo en Supabase.
ALTER TABLE public.produccion_diaria ADD CONSTRAINT produccion_diaria_granja_fecha_galpon_key UNIQUE (granja_id, fecha, galpon);

-- Finalizado!
