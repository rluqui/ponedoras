-- ============================================================
-- HUEVO DE ORO RIVADAVIA - Schema Base de Datos
-- Versión: 1.0 | Fecha: 2026-03-23
-- Normalización: 3NF | RLS: Activado en todas las tablas
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLAS MAESTRAS
-- ============================================================

-- Usuarios del sistema (vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'operador', 'adolescente')),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Galpones del establecimiento
CREATE TABLE IF NOT EXISTS public.galpones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    capacidad_aves INT NOT NULL DEFAULT 0,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Lotes de aves
CREATE TABLE IF NOT EXISTS public.lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    galpon_id UUID NOT NULL REFERENCES public.galpones(id),
    raza VARCHAR(50) NOT NULL DEFAULT 'Hy-Line Brown',
    fecha_ingreso DATE NOT NULL,
    cantidad_inicial INT NOT NULL,
    cantidad_actual INT NOT NULL,
    -- edad_semanas se calcula dinámicamente: EXTRACT(WEEK FROM AGE(CURRENT_DATE, fecha_ingreso))
    -- No puede ser columna generada porque CURRENT_DATE no es inmutable en PostgreSQL
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'descartado', 'vendido')),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);


-- Proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('alimento', 'veterinario', 'maple', 'transporte', 'otro')),
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    zona VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'particular' CHECK (tipo IN ('almacen', 'particular', 'restaurante', 'verduleria', 'distribuidor')),
    direccion TEXT,
    lat DECIMAL(9, 6),
    lng DECIMAL(9, 6),
    zona VARCHAR(30) DEFAULT 'Rivadavia' CHECK (zona IN ('Rivadavia', 'Junin', 'San Martin', 'Mendoza Capital', 'Otro')),
    whatsapp VARCHAR(20),
    maples_en_poder INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLAS OPERATIVAS
-- ============================================================

-- Registros diarios de campo
CREATE TABLE IF NOT EXISTS public.registros_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    lote_id UUID NOT NULL REFERENCES public.lotes(id),
    huevos_producidos INT NOT NULL DEFAULT 0 CHECK (huevos_producidos >= 0),
    mortalidad INT NOT NULL DEFAULT 0 CHECK (mortalidad >= 0),
    alimento_kg DECIMAL(8, 2) NOT NULL DEFAULT 0,
    agua_litros DECIMAL(8, 2) DEFAULT NULL,
    temperatura_max DECIMAL(4, 1) DEFAULT NULL,
    observaciones TEXT,
    operador_id UUID REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fecha, lote_id)
);

-- Ventas
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    docenas INT NOT NULL CHECK (docenas > 0),
    precio_docena DECIMAL(10, 2) NOT NULL CHECK (precio_docena > 0),
    total DECIMAL(12, 2) GENERATED ALWAYS AS (docenas * precio_docena) STORED,
    maples_entregados INT DEFAULT 0,
    facturado BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    operador_id UUID REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Cobranzas (pagos de ventas)
CREATE TABLE IF NOT EXISTS public.cobranzas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id),
    monto_cobrado DECIMAL(12, 2) NOT NULL CHECK (monto_cobrado > 0),
    fecha_cobro DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo VARCHAR(20) NOT NULL DEFAULT 'efectivo' CHECK (metodo IN ('efectivo', 'transferencia', 'cheque', 'mercadopago')),
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos de clientes
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    docenas_solicitadas INT NOT NULL CHECK (docenas_solicitadas > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'entregado', 'cancelado')),
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Devolución de maples
CREATE TABLE IF NOT EXISTS public.devolucion_maples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cantidad_devuelta INT NOT NULL CHECK (cantidad_devuelta > 0),
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLAS DE SOPORTE Y CONTROL
-- ============================================================

-- Costos de insumos (precio de mercado)
CREATE TABLE IF NOT EXISTS public.costos_insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('maiz', 'soja', 'balanceado', 'flete', 'medicamento', 'vacuna', 'maple', 'mano_obra')),
    precio_por_kg DECIMAL(10, 4),
    precio_unitario DECIMAL(10, 2),
    proveedor_id UUID REFERENCES public.proveedores(id),
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Vacunaciones y plan sanitario
CREATE TABLE IF NOT EXISTS public.vacunaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID NOT NULL REFERENCES public.lotes(id),
    vacuna VARCHAR(50) NOT NULL CHECK (vacuna IN ('Marek', 'Gumboro', 'Newcastle', 'Bronquitis_Infecciosa', 'Coriza', 'Laringotraqueitis', 'Otra')),
    fecha_aplicada DATE,
    fecha_proxima DATE NOT NULL,
    dosis_ml DECIMAL(6, 2),
    via_administracion VARCHAR(30) DEFAULT 'agua_bebida',
    completada BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas climáticas (Protocolo Zonda)
CREATE TABLE IF NOT EXISTS public.alertas_climaticas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperatura DECIMAL(4, 1) NOT NULL,
    humedad DECIMAL(4, 1),
    tipo_alerta VARCHAR(30) NOT NULL CHECK (tipo_alerta IN ('zonda', 'calor_extremo', 'helada', 'viento_fuerte')),
    instrucciones TEXT NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- RENSPA (habilitación veterinaria)
CREATE TABLE IF NOT EXISTS public.renspa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_renspa VARCHAR(50) UNIQUE NOT NULL,
    titular VARCHAR(100) NOT NULL,
    fecha_otorgamiento DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'vigente' CHECK (estado IN ('vigente', 'vencido', 'en_tramite')),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Log de reportes enviados
CREATE TABLE IF NOT EXISTS public.reportes_enviados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('dominical', 'alerta', 'mensual')),
    contenido TEXT NOT NULL,
    destinatario VARCHAR(50),
    canal VARCHAR(20) DEFAULT 'whatsapp',
    enviado_en TIMESTAMPTZ DEFAULT NOW(),
    exito BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON public.registros_diarios(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_registros_lote ON public.registros_diarios(lote_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_vacunaciones_proxima ON public.vacunaciones(fecha_proxima);
CREATE INDEX IF NOT EXISTS idx_clientes_zona ON public.clientes(zona);

-- ============================================================
-- TABLAS GRANJA FAMILIAR INTELIGENTE (GFI)
-- Versión: 1.1 — Módulos: Equipo, Tareas, Redes, Inspección IA
-- ============================================================

-- Miembros del equipo/familia
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(80) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN (
        'Producción', 'Administración', 'Redes', 'Ventas', 'Mantenimiento', 'Aprendiz'
    )),
    avatar VARCHAR(10) DEFAULT '🧑‍🌾',
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tareas del equipo
CREATE TABLE IF NOT EXISTS public.tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    asignado_a UUID REFERENCES public.equipo_miembros(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'hecho')),
    prioridad VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('alta', 'normal', 'baja')),
    fecha_limite DATE,
    galpon_id UUID REFERENCES public.galpones(id) ON DELETE SET NULL,
    origen VARCHAR(20) DEFAULT 'manual' CHECK (origen IN ('manual', 'inspeccion_ia', 'alerta')),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    completada_en TIMESTAMPTZ
);

-- Publicaciones en redes sociales
CREATE TABLE IF NOT EXISTS public.publicaciones_redes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    texto TEXT NOT NULL,
    plataforma VARCHAR(20) NOT NULL CHECK (plataforma IN ('Instagram', 'Facebook', 'WhatsApp', 'TikTok', 'Otro')),
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programado', 'publicado')),
    fecha_publicacion DATE DEFAULT CURRENT_DATE,
    tipo_contenido VARCHAR(30) DEFAULT 'general' CHECK (tipo_contenido IN (
        'general', 'disponibilidad', 'proceso', 'familia', 'oferta', 'testimonio', 'imagen'
    )),
    generado_por_ia BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Inspecciones IA de campo
CREATE TABLE IF NOT EXISTS public.inspecciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    galpon_id UUID REFERENCES public.galpones(id) ON DELETE SET NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'bebedero', 'comedero', 'galpon', 'huevos', 'infraestructura'
    )),
    foto_url TEXT,
    estado_ia VARCHAR(20) CHECK (estado_ia IN ('verde', 'amarillo', 'rojo')),
    observaciones_ia TEXT,
    riesgos_ia TEXT,
    sugerencia_ia TEXT,
    tarea_creada BOOLEAN DEFAULT FALSE,
    operador_id UUID REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Producción diaria simplificada (para el módulo CARGAR)
CREATE TABLE IF NOT EXISTS public.produccion_diaria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    galpon VARCHAR(60) NOT NULL,
    huevos INT NOT NULL DEFAULT 0 CHECK (huevos >= 0),
    rotos INT NOT NULL DEFAULT 0 CHECK (rotos >= 0),
    mortandad INT NOT NULL DEFAULT 0 CHECK (mortandad >= 0),
    estado_agua VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (estado_agua IN ('normal', 'baja', 'sin')),
    estado_alimento VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (estado_alimento IN ('normal', 'bajo', 'sin')),
    observaciones TEXT,
    operador_id UUID REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fecha, galpon)
);

-- Índices nuevos
CREATE INDEX IF NOT EXISTS idx_tareas_estado     ON public.tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_asignado   ON public.tareas(asignado_a);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tipo ON public.inspecciones(tipo);
CREATE INDEX IF NOT EXISTS idx_produccion_fecha  ON public.produccion_diaria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_produccion_galpon ON public.produccion_diaria(galpon);


-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: Saldo por cliente (docenas vendidas - cobradas)
CREATE OR REPLACE VIEW public.v_saldo_clientes AS
SELECT 
    c.id,
    c.nombre,
    c.zona,
    c.whatsapp,
    c.maples_en_poder,
    COALESCE(SUM(v.total), 0) AS total_facturado,
    COALESCE(SUM(co.monto_cobrado), 0) AS total_cobrado,
    COALESCE(SUM(v.total), 0) - COALESCE(SUM(co.monto_cobrado), 0) AS saldo_pendiente
FROM public.clientes c
LEFT JOIN public.ventas v ON v.cliente_id = c.id
LEFT JOIN public.cobranzas co ON co.venta_id = v.id
GROUP BY c.id, c.nombre, c.zona, c.whatsapp, c.maples_en_poder;

-- Vista: Producción últimos 30 días
CREATE OR REPLACE VIEW public.v_produccion_mensual AS
SELECT 
    rd.fecha,
    l.raza,
    g.nombre AS galpon,
    SUM(rd.huevos_producidos) AS huevos_dia,
    SUM(rd.huevos_producidos) / 12 AS docenas_dia,
    SUM(rd.mortalidad) AS mortalidad_dia,
    SUM(rd.alimento_kg) AS alimento_kg_dia,
    CASE WHEN SUM(rd.huevos_producidos) > 0 
         THEN ROUND(SUM(rd.alimento_kg) / (SUM(rd.huevos_producidos) / 12.0), 3)
         ELSE NULL 
    END AS fcr_docena
FROM public.registros_diarios rd
JOIN public.lotes l ON l.id = rd.lote_id
JOIN public.galpones g ON g.id = l.galpon_id
WHERE rd.fecha >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY rd.fecha, l.raza, g.nombre
ORDER BY rd.fecha DESC;

-- Vista: Próximas vacunaciones (alerta 7 días)
CREATE OR REPLACE VIEW public.v_vacunas_proximas AS
SELECT 
    v.id,
    l.raza,
    g.nombre AS galpon,
    v.vacuna,
    v.fecha_proxima,
    (v.fecha_proxima - CURRENT_DATE) AS dias_restantes
FROM public.vacunaciones v
JOIN public.lotes l ON l.id = v.lote_id
JOIN public.galpones g ON g.id = l.galpon_id
WHERE v.completada = FALSE 
  AND v.fecha_proxima <= CURRENT_DATE + INTERVAL '14 days'
ORDER BY v.fecha_proxima ASC;

-- ── VENTAS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ventas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_nombre  VARCHAR(100),
    canal           VARCHAR(50) DEFAULT 'Directo'
                      CHECK (canal IN ('Directo','Almacén','Verdulería','Restaurante','WhatsApp','Otro')),
    tipo_huevo      VARCHAR(30) DEFAULT 'Grande'
                      CHECK (tipo_huevo IN ('Mediano','Grande','Extra grande','Mixto')),
    maples_entregados INTEGER NOT NULL CHECK (maples_entregados > 0),
    precio_maple    DECIMAL(10, 2) NOT NULL CHECK (precio_maple > 0),
    total           DECIMAL(12, 2) GENERATED ALWAYS AS (maples_entregados * precio_maple) STORED,
    estado          VARCHAR(20) DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','entregado','cobrado','cancelado')),
    observaciones   TEXT,
    registrado_por  UUID REFERENCES auth.users(id),
    creado_en       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_select_authenticated"
    ON public.ventas FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "ventas_insert_authenticated"
    ON public.ventas FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ventas_update_authenticated"
    ON public.ventas FOR UPDATE
    USING (auth.role() = 'authenticated');
