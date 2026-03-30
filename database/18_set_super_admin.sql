-- ============================================================
-- SCRIPT PARA OTORGAR PERMISOS DE SUPER ADMIN A RICARDO
-- ============================================================

-- Esto te dará acceso al panel de "SaaS Multi-tenant" y gestionar usuarios
UPDATE public.perfiles 
SET es_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'ricardo.luqui@gmail.com');

-- (Opcional) Si la cuenta se registró con otro correo, podes buscar por nombre:
-- UPDATE public.perfiles SET es_admin = true WHERE nombre ILIKE '%ricardo%';
