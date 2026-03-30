-- ============================================================
-- SAAS MULTI-TENANT ARCHITECTURE & IMPERSONATION
-- ============================================================

-- 1. Crear tabla granjas (Tenant principal)
CREATE TABLE IF NOT EXISTS public.granjas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    propietario_id UUID REFERENCES auth.users(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    activa BOOLEAN DEFAULT TRUE
);

-- 2. Modificar tablas base de usuarios para enlazarlas a la granja
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE SET NULL;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE SET NULL;

-- Asignar RLS a granjas
ALTER TABLE public.granjas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "granjas_select_auth" ON public.granjas FOR SELECT USING (id = (SELECT granja_id FROM public.perfiles WHERE id = auth.uid()) OR (SELECT es_admin FROM public.perfiles WHERE id = auth.uid()));

-- 3. Reemplazar Trigger handle_new_user para auto-crear la granja del Tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_granja_id UUID;
  v_nombre_usuario TEXT;
BEGIN
  v_nombre_usuario := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
  
  -- Crear el entorno/Tenant
  INSERT INTO public.granjas (nombre, propietario_id)
  VALUES ('Granja de ' || v_nombre_usuario, NEW.id)
  RETURNING id INTO v_granja_id;

  -- Crear el Perfil Maestro
  INSERT INTO public.perfiles (id, nombre, aprobado, es_admin, plan, granja_id)
  VALUES (NEW.id, v_nombre_usuario, FALSE, FALSE, 'trial', v_granja_id)
  ON CONFLICT (id) DO NOTHING;

  -- Crear el perfil Operativo
  INSERT INTO public.usuarios (auth_id, nombre, rol, activo, granja_id)
  VALUES (NEW.id, v_nombre_usuario, 'operador', TRUE, v_granja_id)
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Inyectar granja_id a todas las tablas operativas
ALTER TABLE public.galpones ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.registros_diarios ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.cobranzas ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.devolucion_maples ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.costos_insumos ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.vacunaciones ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.alertas_climaticas ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.renspa ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.reportes_enviados ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.equipo_miembros ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.publicaciones_redes ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.inspecciones ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;
ALTER TABLE public.produccion_diaria ADD COLUMN IF NOT EXISTS granja_id UUID REFERENCES public.granjas(id) ON DELETE CASCADE;

-- 5. Helper Functions para RLS (Optimizadas con STABLE caching)
CREATE OR REPLACE FUNCTION public.mi_granja_id()
RETURNS UUID AS $$
    SELECT granja_id FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.soy_super_admin()
RETURNS BOOLEAN AS $$
    SELECT es_admin FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 6. RESET masivo de Políticas RLS para todas las tablas operativas
DO $$ 
DECLARE 
    t_name text; 
BEGIN 
    FOR t_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('galpones', 'lotes', 'proveedores', 'clientes', 'registros_diarios', 'ventas', 'cobranzas', 'pedidos', 'devolucion_maples', 'costos_insumos', 'vacunaciones', 'alertas_climaticas', 'renspa', 'reportes_enviados', 'equipo_miembros', 'tareas', 'publicaciones_redes', 'inspecciones', 'produccion_diaria')
    LOOP 
        -- Purgar políticas pasadas
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'usuarios_select', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'galpones_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'galpones_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'lotes_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'lotes_select_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'lotes_insert_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'lotes_update_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'lotes_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'proveedores_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'proveedores_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'clientes_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'clientes_write_operador', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'registros_select', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'registros_insert', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'registros_update', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'ventas_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'ventas_select_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'ventas_insert_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'ventas_update_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'ventas_write_operador', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'cobranzas_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'cobranzas_write_operador', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'pedidos_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'pedidos_write_operador', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'maples_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'maples_write_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'costos_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'costos_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'vacunas_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'vacunas_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'alertas_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'alertas_insert_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'renspa_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'renspa_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'reportes_select_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'reportes_insert_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'equipo_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'equipo_write_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'tareas_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'tareas_insert_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'tareas_update_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'tareas_delete_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'redes_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'redes_write_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'inspecciones_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'inspecciones_insert_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'inspecciones_update_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'inspecciones_delete_admin', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_select_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_insert_auth', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_update_operador', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_select_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_insert_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_update_authenticated', t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s ON public.%I', 'produccion_delete_authenticated', t_name);
        
        -- Aplicar política Universal Multi-Tenant
        EXECUTE format('CREATE POLICY "saas_aislamiento_multitenant" ON public.%I FOR ALL USING (granja_id = public.mi_granja_id() OR public.soy_super_admin() = true);', t_name);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);

    END LOOP; 
END $$;
