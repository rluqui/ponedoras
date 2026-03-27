-- ============================================================
-- SISTEMA DE APROBACIÓN DE USUARIOS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla perfiles (reemplaza / complementa 'usuarios')
CREATE TABLE IF NOT EXISTS public.perfiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre          TEXT,
    granja_nombre   TEXT,
    aprobado        BOOLEAN NOT NULL DEFAULT FALSE,
    es_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    -- PLANES disponibles:
    -- 'admin'    → vos (sin costo, acceso total)
    -- 'tester'   → beta tester o amigo, acceso gratis sin límite
    -- 'socio'    → precio diferencial / descuento acordado
    -- 'trial'    → 7 días de prueba sin costo
    -- 'mensual'  → suscripción mensual (vence_el activo)
    -- 'anual'    → suscripción anual (vence_el activo)
    -- 'bloqueado'→ acceso revocado (mora, baja, etc.)
    plan            TEXT    NOT NULL DEFAULT 'trial'
                      CHECK (plan IN ('admin','tester','socio','trial','mensual','anual','bloqueado')),
    vence_el        DATE,   -- NULL = sin vencimiento (admin, tester, socio permanente)
    avatar          TEXT    DEFAULT '👨‍🌾',
    notas_admin     TEXT,   -- notas internas (ej: "amigo de Juan, no cobrar")
    creado_en       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger: al registrarse un nuevo usuario → perfil aprobado=false automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, aprobado, es_admin, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    FALSE,   -- pendiente de aprobación
    FALSE,
    'trial'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger (drop primero por si ya existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Aprobar al primer admin manualmente (reemplazá con tu email real)
-- UPDATE public.perfiles SET aprobado = TRUE, es_admin = TRUE
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');

-- 4. RLS de perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_own_read"    ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_own_update"  ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_admin_read"  ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_admin_update" ON public.perfiles;

-- Cada usuario puede ver y editar su propio perfil
CREATE POLICY "perfiles_own_read"
  ON public.perfiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "perfiles_own_update"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins pueden ver TODOS los perfiles
CREATE POLICY "perfiles_admin_read"
  ON public.perfiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles p
      WHERE p.id = auth.uid() AND p.es_admin = TRUE
    )
  );

-- Admins pueden actualizar TODOS los perfiles (para aprobar)
CREATE POLICY "perfiles_admin_update"
  ON public.perfiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles p
      WHERE p.id = auth.uid() AND p.es_admin = TRUE
    )
  );

-- 5. Vista de usuarios pendientes (útil para el panel admin)
CREATE OR REPLACE VIEW public.v_usuarios_pendientes AS
SELECT
  p.id,
  p.nombre,
  p.aprobado,
  p.plan,
  p.creado_en,
  u.email
FROM public.perfiles p
JOIN auth.users u ON u.id = p.id
WHERE p.aprobado = FALSE
ORDER BY p.creado_en DESC;
