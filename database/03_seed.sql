-- ============================================================
-- HUEVO DE ORO RIVADAVIA - Datos de Demostración
-- Ejecutar DESPUÉS de 01_tablas.sql y 02_rls.sql
-- ============================================================

-- Galpones
INSERT INTO public.galpones (id, nombre, capacidad_aves, descripcion) VALUES
('11111111-0000-0000-0000-000000000001', 'Galpón A - Norte', 1500, 'Galpón principal, ventilación natural'),
('11111111-0000-0000-0000-000000000002', 'Galpón B - Sur', 800, 'Galpón secundario, más nuevo')
ON CONFLICT (id) DO NOTHING;

-- Lotes
INSERT INTO public.lotes (id, galpon_id, raza, fecha_ingreso, cantidad_inicial, cantidad_actual, estado) VALUES
('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Hy-Line Brown', '2025-09-01', 1480, 1455, 'activo'),
('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Lohmann Brown', '2025-12-15', 790, 783, 'activo')
ON CONFLICT (id) DO NOTHING;

-- Proveedores
INSERT INTO public.proveedores (nombre, tipo, contacto, telefono, zona) VALUES
('Alimentos del Sol Mendoza', 'alimento', 'Juan Pérez', '261-4521890', 'Rivadavia'),
('Veterinaria Avícola del Este', 'veterinario', 'Dr. García', '261-4789012', 'San Martin'),
('Maples Plásticos Cuyo', 'maple', 'María López', '261-4123456', 'Mendoza Capital'),
('Transporte Rápido Mendoza', 'transporte', 'Carlos Ruiz', '261-4987654', 'Rivadavia')
ON CONFLICT DO NOTHING;

-- Clientes demo
INSERT INTO public.clientes (id, nombre, tipo, direccion, lat, lng, zona, whatsapp, maples_en_poder) VALUES
('33333333-0000-0000-0000-000000000001', 'Almacén "El Cruce"', 'almacen', 'Ruta 7 km 18, Rivadavia', -33.1890, -68.4560, 'Rivadavia', '5492614561234', 3),
('33333333-0000-0000-0000-000000000002', 'Verdulería Familiar Don Mario', 'verduleria', 'Urquiza 456, Rivadavia', -33.1945, -68.4478, 'Rivadavia', '5492614789012', 5),
('33333333-0000-0000-0000-000000000003', 'Restaurante "El Patio"', 'restaurante', 'San Martín 890, Junín', -33.1234, -68.4567, 'Junin', '5492615123456', 2),
('33333333-0000-0000-0000-000000000004', 'Almacén Avenida Nueva', 'almacen', 'Av. Libertad 234, San Martín', -33.0890, -68.4123, 'San Martin', '5492616789012', 4),
('33333333-0000-0000-0000-000000000005', 'Familia Rodríguez', 'particular', 'Los Álamos 123, Rivadavia', -33.2012, -68.4321, 'Rivadavia', '5492614234567', 1)
ON CONFLICT (id) DO NOTHING;

-- Costos de insumos actuales (Marzo 2026)
INSERT INTO public.costos_insumos (fecha, tipo, precio_por_kg, observaciones) VALUES
('2026-03-01', 'balanceado', 650.00, 'Balanceado postura 16% proteína - zona núcleo + flete Mendoza'),
('2026-03-01', 'maiz', 380.00, 'Maíz a granel - precio zona núcleo Córdoba + flete'),
('2026-03-01', 'soja', 520.00, 'Harina soja 44% proteína'),
('2026-03-01', 'flete', 45.00, 'Flete por kg desde zona núcleo hasta Rivadavia'),
('2026-03-15', 'maple', NULL, 'Maple plástico reutilizable (precio unitario)'),
('2026-03-15', 'mano_obra', NULL, 'Costo mano de obra diaria')
ON CONFLICT DO NOTHING;

-- Actualizar precio unitario para maple y mano_obra
UPDATE public.costos_insumos SET precio_unitario = 2800 WHERE tipo = 'maple' AND fecha = '2026-03-15';
UPDATE public.costos_insumos SET precio_unitario = 15000 WHERE tipo = 'mano_obra' AND fecha = '2026-03-15';

-- Registros diarios últimas 2 semanas (Lote A)
INSERT INTO public.registros_diarios (fecha, lote_id, huevos_producidos, mortalidad, alimento_kg, agua_litros, temperatura_max) VALUES
('2026-03-10', '22222222-0000-0000-0000-000000000001', 1280, 0, 185.0, 320.0, 28.5),
('2026-03-11', '22222222-0000-0000-0000-000000000001', 1295, 1, 183.0, 315.0, 29.0),
('2026-03-12', '22222222-0000-0000-0000-000000000001', 1310, 0, 187.0, 325.0, 30.2),
('2026-03-13', '22222222-0000-0000-0000-000000000001', 1150, 0, 185.0, 340.0, 35.8), -- Día caluroso, bajó postura
('2026-03-14', '22222222-0000-0000-0000-000000000001', 1220, 2, 182.0, 360.0, 36.5), -- Zonda
('2026-03-15', '22222222-0000-0000-0000-000000000001', 1305, 0, 186.0, 318.0, 27.0),
('2026-03-16', '22222222-0000-0000-0000-000000000001', 1318, 0, 188.0, 320.0, 26.5),
('2026-03-17', '22222222-0000-0000-0000-000000000001', 1290, 1, 184.0, 315.0, 28.0),
('2026-03-18', '22222222-0000-0000-0000-000000000001', 1302, 0, 185.5, 318.0, 29.5),
('2026-03-19', '22222222-0000-0000-0000-000000000001', 1320, 0, 187.0, 320.0, 27.8),
('2026-03-20', '22222222-0000-0000-0000-000000000001', 1315, 0, 186.5, 322.0, 28.2),
('2026-03-21', '22222222-0000-0000-0000-000000000001', 1290, 1, 184.0, 316.0, 31.0),
('2026-03-22', '22222222-0000-0000-0000-000000000001', 1308, 0, 185.0, 319.0, 29.8)
ON CONFLICT (fecha, lote_id) DO NOTHING;

-- Registros Lote B
INSERT INTO public.registros_diarios (fecha, lote_id, huevos_producidos, mortalidad, alimento_kg, agua_litros, temperatura_max) VALUES
('2026-03-20', '22222222-0000-0000-0000-000000000002', 695, 0, 98.0, 175.0, 28.2),
('2026-03-21', '22222222-0000-0000-0000-000000000002', 701, 0, 99.5, 178.0, 31.0),
('2026-03-22', '22222222-0000-0000-0000-000000000002', 688, 1, 97.0, 180.0, 29.8)
ON CONFLICT (fecha, lote_id) DO NOTHING;

-- Ventas demo
INSERT INTO public.ventas (id, fecha, cliente_id, docenas, precio_docena, maples_entregados, facturado) VALUES
('44444444-0000-0000-0000-000000000001', '2026-03-18', '33333333-0000-0000-0000-000000000001', 30, 2800.00, 3, false),
('44444444-0000-0000-0000-000000000002', '2026-03-18', '33333333-0000-0000-0000-000000000002', 20, 2800.00, 2, false),
('44444444-0000-0000-0000-000000000003', '2026-03-19', '33333333-0000-0000-0000-000000000003', 50, 2700.00, 5, true),
('44444444-0000-0000-0000-000000000004', '2026-03-20', '33333333-0000-0000-0000-000000000004', 40, 2750.00, 4, false),
('44444444-0000-0000-0000-000000000005', '2026-03-22', '33333333-0000-0000-0000-000000000001', 25, 2800.00, 2, false)
ON CONFLICT (id) DO NOTHING;

-- Cobranzas parciales
INSERT INTO public.cobranzas (venta_id, monto_cobrado, fecha_cobro, metodo) VALUES
('44444444-0000-0000-0000-000000000003', 135000.00, '2026-03-19', 'transferencia'),
('44444444-0000-0000-0000-000000000001', 50000.00, '2026-03-20', 'efectivo')
ON CONFLICT DO NOTHING;

-- Vacunaciones programadas
INSERT INTO public.vacunaciones (lote_id, vacuna, fecha_aplicada, fecha_proxima, dosis_ml, completada) VALUES
('22222222-0000-0000-0000-000000000001', 'Newcastle',            '2025-12-01', '2026-04-01', 0.5, false),
('22222222-0000-0000-0000-000000000001', 'Bronquitis_Infecciosa', '2025-11-01', '2026-05-01', 0.3, false),
('22222222-0000-0000-0000-000000000001', 'Gumboro',              '2025-09-15', '2026-09-15', 1.0, true),
('22222222-0000-0000-0000-000000000002', 'Newcastle',            '2026-01-15', '2026-04-15', 0.5, false),
('22222222-0000-0000-0000-000000000002', 'Marek',                '2025-12-15', '2026-12-15', 0.2, true)
ON CONFLICT DO NOTHING;

-- RENSPA de demostración
INSERT INTO public.renspa (numero_renspa, titular, fecha_otorgamiento, fecha_vencimiento, estado) VALUES
('08-014-2-00234/26', 'Establecimiento Avícola Rivadavia - Ricardo Luqui', '2024-03-15', '2026-12-31', 'vigente')
ON CONFLICT DO NOTHING;

-- Pedidos pendientes
INSERT INTO public.pedidos (cliente_id, fecha_pedido, fecha_entrega, docenas_solicitadas, estado) VALUES
('33333333-0000-0000-0000-000000000001', '2026-03-22', '2026-03-24', 30, 'pendiente'),
('33333333-0000-0000-0000-000000000002', '2026-03-22', '2026-03-24', 15, 'confirmado'),
('33333333-0000-0000-0000-000000000005', '2026-03-23', '2026-03-25', 5, 'pendiente')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DATOS GFI — Equipo, Tareas, Producción diaria, Redes
-- ============================================================

-- Equipo familiar
INSERT INTO public.equipo_miembros (id, nombre, rol, avatar) VALUES
('eeeeeeee-0001-0000-0000-000000000001', 'Juan',  'Producción',     '🧑‍🌾'),
('eeeeeeee-0002-0000-0000-000000000002', 'María', 'Administración', '📊'),
('eeeeeeee-0003-0000-0000-000000000003', 'Laura', 'Redes',          '📱'),
('eeeeeeee-0004-0000-0000-000000000004', 'Tomás', 'Aprendiz',       '📚')
ON CONFLICT (id) DO NOTHING;

-- Tareas del día de hoy
INSERT INTO public.tareas (titulo, asignado_a, estado, prioridad, origen) VALUES
('Recolectar huevos — Galpón A', 'eeeeeeee-0001-0000-0000-000000000001', 'pendiente', 'alta', 'manual'),
('Controlar nivel de agua — Galpón B', 'eeeeeeee-0001-0000-0000-000000000001', 'pendiente', 'alta', 'manual'),
('Registrar ventas de la semana', 'eeeeeeee-0002-0000-0000-000000000002', 'pendiente', 'normal', 'manual'),
('Publicar foto en Instagram', 'eeeeeeee-0003-0000-0000-000000000003', 'pendiente', 'normal', 'manual'),
('Ayudar con la recolección', 'eeeeeeee-0004-0000-0000-000000000004', 'hecho', 'baja', 'manual')
ON CONFLICT DO NOTHING;

-- Producción diaria últimos 7 días + HOY (módulo CARGAR)
INSERT INTO public.produccion_diaria (fecha, galpon, huevos, rotos, mortandad, estado_agua, estado_alimento) VALUES
(CURRENT_DATE - 6, 'Galpón A - Norte', 298, 5, 0, 'normal', 'normal'),
(CURRENT_DATE - 6, 'Galpón B - Sur', 165, 3, 0, 'normal', 'normal'),
(CURRENT_DATE - 5, 'Galpón A - Norte', 305, 4, 1, 'normal', 'normal'),
(CURRENT_DATE - 5, 'Galpón B - Sur', 171, 2, 0, 'baja',   'normal'),
(CURRENT_DATE - 4, 'Galpón A - Norte', 312, 6, 0, 'normal', 'normal'),
(CURRENT_DATE - 4, 'Galpón B - Sur', 168, 3, 0, 'normal', 'normal'),
(CURRENT_DATE - 3, 'Galpón A - Norte', 310, 4, 0, 'normal', 'normal'),
(CURRENT_DATE - 3, 'Galpón B - Sur', 172, 2, 0, 'normal', 'normal'),
(CURRENT_DATE - 2, 'Galpón A - Norte', 301, 5, 1, 'normal', 'bajo'),
(CURRENT_DATE - 2, 'Galpón B - Sur', 169, 4, 0, 'baja',   'normal'),
(CURRENT_DATE - 1, 'Galpón A - Norte', 308, 3, 0, 'normal', 'normal'),
(CURRENT_DATE - 1, 'Galpón B - Sur', 173, 2, 0, 'normal', 'normal'),
-- Hoy (para que el dashboard muestre datos al entrar)
(CURRENT_DATE,     'Galpón A - Norte', 315, 4, 0, 'normal', 'normal'),
(CURRENT_DATE,     'Galpón B - Sur', 178, 2, 0, 'normal', 'normal')
ON CONFLICT (fecha, galpon) DO NOTHING;

-- Publicaciones recientes en redes
INSERT INTO public.publicaciones_redes (texto, plataforma, estado, fecha_publicacion, tipo_contenido, generado_por_ia) VALUES
('🥚 Huevos camperos frescos disponibles esta semana. ¡Pedí tu maple!', 'Instagram', 'publicado', CURRENT_DATE - 1, 'disponibilidad', true),
('¿Sabías que los huevos camperos tienen más omega-3? 🐔 En nuestra granja comemos bien.', 'Facebook', 'publicado', CURRENT_DATE - 3, 'general', true),
('Hoy recolectamos más de 400 huevos frescos. Contactanos por WhatsApp 💬', 'WhatsApp', 'publicado', CURRENT_DATE - 5, 'disponibilidad', false)
ON CONFLICT DO NOTHING;

