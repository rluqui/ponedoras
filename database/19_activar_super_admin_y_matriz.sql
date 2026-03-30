-- ============================================================
-- SCRIPT: ACTIVAR SUPER ADMIN Y SOLUCIONAR SESIÓN HUÉRFANA
-- ============================================================

DO $$
DECLARE
    v_user_id UUID;
    v_granja_matriz UUID;
BEGIN
    -- 1. Buscar a Ricardo por su email
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'ricardo.luqui@gmail.com' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- 2. Asegurarnos de que tenga una Granja asignada (Granja Matriz de Pruebas)
        -- Buscamos si ya tiene una
        SELECT granja_id INTO v_granja_matriz FROM public.perfiles WHERE id = v_user_id;

        IF v_granja_matriz IS NULL THEN
            -- No tiene granja, le creamos la Granja Matriz
            INSERT INTO public.granjas (nombre, propietario_id)
            VALUES ('Central SuperAdmin (Pruebas)', v_user_id)
            RETURNING id INTO v_granja_matriz;
            
            -- Le asignamos la nueva granja a su perfil y usuario
            UPDATE public.perfiles SET granja_id = v_granja_matriz WHERE id = v_user_id;
            UPDATE public.usuarios SET granja_id = v_granja_matriz WHERE auth_id = v_user_id;
        END IF;

        -- 3. Darle los poderes de Super Administrador absoluto
        UPDATE public.perfiles SET es_admin = true WHERE id = v_user_id;
    END IF;
END $$;
