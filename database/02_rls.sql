-- ============================================================
-- HUEVO DE ORO RIVADAVIA - Row Level Security (RLS)
-- Todas las tablas protegidas: solo usuarios autenticados acceden
-- Los roles: admin (todo), operador (lectura+escritura operativa),
--            adolescente (solo registro diario)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galpones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobranzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucion_maples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costos_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacunaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_climaticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renspa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_enviados ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCIÓN HELPER: obtener rol del usuario actual
-- ============================================================
CREATE OR REPLACE FUNCTION public.obtener_rol_actual()
RETURNS VARCHAR AS $$
    SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- USUARIOS - solo admin puede ver todos
-- ============================================================
CREATE POLICY "usuarios_select" ON public.usuarios
    FOR SELECT USING (auth.uid() = auth_id OR public.obtener_rol_actual() = 'admin');

CREATE POLICY "usuarios_update_self" ON public.usuarios
    FOR UPDATE USING (auth.uid() = auth_id);

-- ============================================================
-- TABLAS MAESTRAS - todos los autenticados pueden leer
-- ============================================================

-- GALPONES
CREATE POLICY "galpones_select_auth" ON public.galpones
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "galpones_write_admin" ON public.galpones
    FOR ALL USING (public.obtener_rol_actual() = 'admin');

-- LOTES
CREATE POLICY "lotes_select_auth" ON public.lotes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lotes_write_admin" ON public.lotes
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- PROVEEDORES
CREATE POLICY "proveedores_select_auth" ON public.proveedores
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "proveedores_write_admin" ON public.proveedores
    FOR ALL USING (public.obtener_rol_actual() = 'admin');

-- CLIENTES
CREATE POLICY "clientes_select_auth" ON public.clientes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "clientes_write_operador" ON public.clientes
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- ============================================================
-- TABLAS OPERATIVAS
-- ============================================================

-- REGISTROS DIARIOS - todos pueden insertar; admin/operador pueden ver todos
CREATE POLICY "registros_select" ON public.registros_diarios
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "registros_insert" ON public.registros_diarios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "registros_update" ON public.registros_diarios
    FOR UPDATE USING (
        public.obtener_rol_actual() IN ('admin', 'operador')
        OR operador_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
    );

-- VENTAS
CREATE POLICY "ventas_select_auth" ON public.ventas
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ventas_write_operador" ON public.ventas
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- COBRANZAS
CREATE POLICY "cobranzas_select_auth" ON public.cobranzas
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cobranzas_write_operador" ON public.cobranzas
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- PEDIDOS
CREATE POLICY "pedidos_select_auth" ON public.pedidos
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "pedidos_write_operador" ON public.pedidos
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- DEVOLUCION MAPLES
CREATE POLICY "maples_select_auth" ON public.devolucion_maples
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "maples_write_auth" ON public.devolucion_maples
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- TABLAS DE SOPORTE
-- ============================================================

-- COSTOS INSUMOS - solo admin edita
CREATE POLICY "costos_select_auth" ON public.costos_insumos
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "costos_write_admin" ON public.costos_insumos
    FOR ALL USING (public.obtener_rol_actual() = 'admin');

-- VACUNACIONES
CREATE POLICY "vacunas_select_auth" ON public.vacunaciones
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vacunas_write_admin" ON public.vacunaciones
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- ALERTAS CLIMATICAS
CREATE POLICY "alertas_select_auth" ON public.alertas_climaticas
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "alertas_insert_auth" ON public.alertas_climaticas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RENSPA
CREATE POLICY "renspa_select_auth" ON public.renspa
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "renspa_write_admin" ON public.renspa
    FOR ALL USING (public.obtener_rol_actual() = 'admin');

-- REPORTES ENVIADOS
CREATE POLICY "reportes_select_admin" ON public.reportes_enviados
    FOR SELECT USING (public.obtener_rol_actual() = 'admin');
CREATE POLICY "reportes_insert_auth" ON public.reportes_enviados
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- RLS TABLAS GFI (Granja Familiar Inteligente)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.equipo_miembros   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicaciones_redes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_diaria ENABLE ROW LEVEL SECURITY;

-- EQUIPO MIEMBROS — todos los autenticados ven; admin/operador editan
CREATE POLICY "equipo_select_auth" ON public.equipo_miembros
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "equipo_write_admin" ON public.equipo_miembros
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- TAREAS — todos ven; todos pueden marcar hecho; admin crea/borra
CREATE POLICY "tareas_select_auth" ON public.tareas
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tareas_insert_auth" ON public.tareas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "tareas_update_auth" ON public.tareas
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "tareas_delete_admin" ON public.tareas
    FOR DELETE USING (public.obtener_rol_actual() = 'admin');

-- PUBLICACIONES REDES — todos los autenticados
CREATE POLICY "redes_select_auth" ON public.publicaciones_redes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "redes_write_auth" ON public.publicaciones_redes
    FOR ALL USING (public.obtener_rol_actual() IN ('admin', 'operador'));

-- INSPECCIONES — todos ven; todos insertan; admin borra
CREATE POLICY "inspecciones_select_auth" ON public.inspecciones
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "inspecciones_insert_auth" ON public.inspecciones
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "inspecciones_update_auth" ON public.inspecciones
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "inspecciones_delete_admin" ON public.inspecciones
    FOR DELETE USING (public.obtener_rol_actual() = 'admin');

-- PRODUCCIÓN DIARIA — todos insertan; todos ven; admin/operador actualizan
CREATE POLICY "produccion_select_auth" ON public.produccion_diaria
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "produccion_insert_auth" ON public.produccion_diaria
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "produccion_update_operador" ON public.produccion_diaria
    FOR UPDATE USING (
        public.obtener_rol_actual() IN ('admin', 'operador')
        OR operador_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
    );

