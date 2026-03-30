-- ============================================================
-- 15. SaaS MIGRATION: DATA RETROFITTING
-- Ejecutar luego del script 14 para asignar granjas a usuarios antiguos
-- ============================================================

DO $$ 
DECLARE
    r_usuario RECORD;
    v_granja_id UUID;
    v_nombre TEXT;
BEGIN
    -- Recorrer todos los perfiles que quedaron sin granja
    FOR r_usuario IN SELECT * FROM public.perfiles WHERE granja_id IS NULL LOOP
        v_nombre := COALESCE(r_usuario.nombre, 'Sin Nombre');
        
        -- 1. Crearle su propia granja
        INSERT INTO public.granjas (nombre, propietario_id)
        VALUES ('Granja de ' || v_nombre, r_usuario.id)
        RETURNING id INTO v_granja_id;
        
        -- 2. Vincular el perfil y al usuario
        UPDATE public.perfiles SET granja_id = v_granja_id WHERE id = r_usuario.id;
        UPDATE public.usuarios SET granja_id = v_granja_id WHERE auth_id = r_usuario.id;
        
        -- 3. Si es el Administrador Principal, de seguro todos los datos huérfanos 
        -- (galpones, ventas pasadas, etc) le pertenecen a él. Le transferimos todo.
        IF r_usuario.es_admin = true THEN
            UPDATE public.galpones SET granja_id = v_granja_id WHERE granja_id IS NULL;
            UPDATE public.lotes SET granja_id = v_granja_id WHERE granja_id IS NULL;
            UPDATE public.clientes SET granja_id = v_granja_id WHERE granja_id IS NULL;
            UPDATE public.produccion_diaria SET granja_id = v_granja_id WHERE granja_id IS NULL;
            UPDATE public.ventas SET granja_id = v_granja_id WHERE granja_id IS NULL;
            
            -- Opcional para las demas tablas importantes:
            UPDATE public.proveedores SET granja_id = v_granja_id WHERE granja_id IS NULL;
            UPDATE public.registros_diarios SET granja_id = v_granja_id WHERE granja_id IS NULL;
        END IF;

    END LOOP;
END $$;
