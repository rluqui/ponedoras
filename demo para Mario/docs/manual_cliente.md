# 🥚 HUEVO DE ORO RIVADAVIA
## Sistema de Gestión Avícola — Manual de Funciones
### Versión Final del Producto · Rivadavia, Mendoza

---

> **Para quién es este documento:**  
> Este manual describe la versión completa del sistema que vamos a construir juntos. Está escrito para que toda la familia entienda qué puede hacer el programa, cómo usarlo y qué beneficios concretos trae a su negocio.

---

## ¿Qué es el Sistema Huevo de Oro?

Es una aplicación que funciona **en el celular, sin instalar nada** (como una página web). Permite gestionar todos los aspectos del establecimiento avícola: la producción diaria, los costos, los clientes, las vacunas y los cobros — todo en un solo lugar, con datos en tiempo real.

**Funciona sin internet** en los galpones (modo offline), y se sincroniza cuando hay señal.

---

## 👥 ¿QUIÉN USA QUÉ?

El sistema tiene tres perfiles de acceso con distintos permisos:

| Perfil | Quién | Qué puede hacer |
|---|---|---|
| **Administrador** | Padre / dueño | Todo. Ve reportes, costos, cobra, configura precios |
| **Operador** | Encargado adulto | Registra producción, gestiona ventas y clientes |
| **Operador Junior** | Hijo adolescente | Solo carga los datos del día: huevos, alimento, mortalidad |

---

## 📋 MÓDULO 1 — REGISTRO DE CAMPO DIARIO
*El corazón del sistema. Se usa todos los días en el galpón.*

### ¿Qué se registra?
- Huevos producidos (total del día por galpón)
- Huevos rotos y descarte
- Mortalidad (cantidad de bajas y causa)
- Alimento consumido en kg
- Agua consumida en litros
- Temperatura máxima del día

### ¿Cómo funciona?
Un formulario de **3 pasos simples** diseñado para usar con una mano y sin equivocarse:
1. **Elegís el galpón** (Galpón A o B)
2. **Cargás los números** con teclado grande en pantalla
3. **Confirmás con un tap** — en menos de 2 minutos

### Alertas automáticas
- 🔴 Si la postura cae más del **10% respecto al día anterior** → alerta inmediata al administrador
- 🌡️ Si la temperatura supera **32°C** → activa el **Protocolo Zonda** (instrucciones de manejo)
- ⚠️ Si la mortalidad supera el **0.5% del lote** → notificación urgente

---

## 📸 MÓDULO 2 — CONTEO POR FOTOGRAFÍA (Inteligencia Artificial)
*La función más innovadora. Única en el mercado avícola regional.*

### ¿Qué hace?
El operador saca una foto con el celular → la **Inteligencia Artificial analiza la imagen** y cuenta automáticamente lo que hay en ella.

### ¿Qué puede contar?
- 🥚 **Huevos** en cinta transportadora o nidal
- 🐔 **Gallinas** en el galpón (censo rápido)
- 📦 **Maples** apilados en depósito

### ¿Cómo funciona?
1. Se abre la cámara del celular
2. Se toma la foto (o se elige una de la galería)
3. La IA procesa la imagen en **3 segundos**
4. Muestra el conteo con su **porcentaje de confianza**
5. El operador **confirma o corrige** manualmente

### Sistema de auditoría incorporado
Si el conteo manual difiere del conteo IA en más del **5%**, el sistema lanza una alerta automática para que el administrador lo revise. Esto detecta errores de carga o irregularidades.

> **Ejemplo real:** La IA detecta 144 huevos → el operador carga 115 → diferencia 20% → 🚨 alerta al padre.

---

## 💰 MÓDULO 3 — MOTOR DE COSTOS DINÁMICO
*Siempre saber si el negocio es rentable, sin hacer una sola cuenta.*

### ¿Qué calcula automáticamente?
El sistema calcula el **costo real de producir una docena** usando los precios del día:
- Alimento (balanceado, maíz, soja)
- Flete desde zona núcleo hasta Rivadavia
- Mano de obra diaria
- Amortización de las aves
- Gastos operativos (electricidad, gas, mantenimiento)

### El Semáforo de Rentabilidad
Una vez que se carga el precio de venta vigente, el sistema muestra:

| Color | Significa | Margen |
|---|---|---|
| 🟢 Verde | Estás ganando bien | Margen > 40% |
| 🟡 Amarillo | Margen ajustado, cuidado | Margen 20–40% |
| 🔴 Rojo | Estás perdiendo plata | Margen < 20% |

### Información complementaria
- **Precio sugerido de venta** calculado para mantener un margen objetivo
- **Punto de equilibrio mensual**: cuántas docenas hay que vender para cubrir todos los costos fijos
- **Historial de costos**: cómo evolucionó el costo/docena en los últimos 3 meses

### Actualización de precios
El administrador actualiza el precio del alimento **una sola vez por semana** y el sistema recalcula todo automáticamente.

---

## 🗺️ MÓDULO 4 — CRM DE CLIENTES Y VENTAS
*Gestión completa del negocio: desde el pedido hasta el cobro.*

### Ficha de cada cliente
- Nombre, tipo (almacén, restaurante, verdulería, particular)
- Zona (Rivadavia, Junín, San Martín, Mendoza Capital)
- Historial completo de compras
- **Saldo pendiente en tiempo real**
- **Maples que tiene en su poder** (control de capital)

### Ciclo completo de una venta
```
Pedido recibido → Confirmación → Entrega con remito → Cobro registrado
```
Cada paso queda guardado y el saldo del cliente se actualiza solo.

### Mapa interactivo de clientes
Un mapa con todos los clientes de la zona con sus ubicaciones exactas:
- Clic en un pin → abre la ficha del cliente
- Colores por zona (verde Rivadavia, azul Junín, dorado San Martín)
- Indicador visual si el cliente tiene deuda pendiente

### Optimización de ruta de reparto
Con un botón, el sistema calcula **el orden óptimo de visita** para hacer el reparto del día en el menor tiempo posible (ahorro estimado de combustible: 30-40%).

### Mensajes de WhatsApp automáticos
Con un solo tap, el sistema abre WhatsApp con un mensaje ya redactado para:
- "Tu pedido de **X docenas** está listo y sale mañana 🥚"
- "Hola! Te recordamos que tenés un saldo de **$X** pendiente 😊"
- "¿Renovamos el pedido semanal esta semana?"
- "Gracias por los **X maples** devueltos, quedamos al día 👍"

### Control de maples
Cada entrega descuenta maples del stock. Cada devolución los repone. El sistema siempre muestra cuántos maples tiene cada cliente en su poder — **sin planillas, sin cuadernitos**.

---

## 💉 MÓDULO 5 — CALENDARIO SANITARIO INTELIGENTE
*Nunca más olvidarse de una vacuna ni del RENSPA.*

### Plan vacunal automático
Cuando se carga un lote nuevo (fecha de ingreso + raza), el sistema genera automáticamente el **calendario completo de vacunación** según los protocolos SENASA:

| Vacuna | Cuándo |
|---|---|
| Marek | Al ingreso (1 día) |
| Gumboro | Semana 2 y 4 |
| Newcastle | Semana 6, 12 y cada 3 meses |
| Bronquitis Infecciosa | Semana 8 y reactivaciones |
| Coriza | Según zona de riesgo |

### Alertas de vencimiento
- 🟣 **14 días antes**: alerta en la app
- 🔴 **7 días antes**: notificación urgente al administrador
- 📲 El sistema puede enviar un recordatorio por WhatsApp al veterinario de zona

### RENSPA y habilitaciones
- Control del vencimiento del número RENSPA (habilitación SENASA)
- Alerta 60 días antes del vencimiento para iniciar trámite de renovación
- Registro de inspecciones y visitas veterinarias

### Protocolo de Bioseguridad
Checklist digital de bioseguridad para verificar diariamente:
- Estado del pediluvio
- Registro de visitas al establecimiento
- Última desinfección de galpones
- Estado de la malla perimetral

---

## 🌡️ MÓDULO 6 — PROTOCOLO ZONDA / ESTRÉS TÉRMICO
*Específico para el clima de Mendoza. No existe en ningún otro sistema avícola.*

### ¿Cómo funciona?
Cuando la temperatura registrada supera los **32°C**, el sistema activa automáticamente el Protocolo Zonda con instrucciones específicas de manejo:

**Temperatura 32–35°C — Alerta Amarilla:**
- Aumentar frecuencia de agua fresca a cada 2 horas
- Abrir ventilaciones laterales
- Evitar manejo de aves en horas pico (12–16 hs)

**Temperatura > 35°C — Alerta Roja:**
- Activar ventiladores de emergencia
- Agregar electrolitos al agua
- Monitorear mortalidad cada 2 horas
- Notificar al veterinario si mortalidad > 3 aves/hora

### Correlación histórica
El sistema muestra el impacto de los episodios de calor en la producción: "El 14-mar con 36.5°C la postura cayó un 12.5% — pérdida estimada: X docenas".

---

## 📊 MÓDULO 7 — PANEL DEL ADMINISTRADOR
*El "cuadro de mando" para el padre. Vista de todo el establecimiento en una pantalla.*

### KPIs en tiempo real
- Docenas producidas hoy / esta semana / este mes
- Tendencia de producción (sube o baja, con porcentaje)
- % de postura del lote (debe mantenerse > 85%)
- Costo de producción del día
- Cuentas por cobrar totales

### Auditor IA — Sistema Anti-Fugas
El sistema cruza automáticamente todos los datos y genera alertas:

| Control | Qué detecta |
|---|---|
| **Producción vs Ventas** | Huevos que "desaparecen" entre el galpón y el remito |
| **Alimento vs Postura** | FCR anormal: si se gasta mucho alimento y se producen pocos huevos |
| **Ventas vs Cobros** | Ventas sin cobrar por más de X días |
| **Maples: entregados vs devueltos** | Maples que "se pierden" por cliente |
| **Foto IA vs Manual** | Diferencias > 5% entre conteo automático y manual |

### Reporte Dominical Automático
Todos los domingos a las 8:00 AM, el administrador recibe por WhatsApp un resumen de la semana con:
- Total de docenas producidas
- Ingresos y márgenes
- Alertas pendientes (vacunas, deudas, maples)
- Estado general del lote

---

## 🏷️ MÓDULO 8 — TRAZABILIDAD Y ETIQUETAS QR
*Valor agregado para clientes premium y exigencias del mercado.*

### ¿Qué es la trazabilidad?
Poder demostrar al comprador **de dónde vienen los huevos**, cuándo se produjeron y en qué condiciones. Hoy es un diferenciador; en 2-3 años será obligatorio.

### Etiqueta QR por lote
El sistema genera automáticamente una etiqueta para imprimir o pegar en el maple con:
- 📍 Origen: "Rivadavia, Mendoza"
- 📅 Fecha de postura
- 🐔 Raza del lote
- ✅ Número RENSPA vigente
- 🌾 Alimentación: "Balanceado sin antibióticos"

El QR lleva a una página web pública donde el consumidor final puede ver la información del lote.

---

## 📱 MÓDULO 9 — TABLERO FAMILIAR (PANTALLA PÚBLICA)
*Una pantalla en la cocina de la casa que muestra el estado del campo en tiempo real.*

### ¿Qué muestra?
Una pantalla simple, sin contraseña, accesible por QR desde cualquier celular:
- Docenas producidas hoy y ayer
- Stock disponible para vender
- Próxima vacuna (días restantes)
- Temperatura del día
- Estado general: 🟢 Todo OK / 🟡 Atención / 🔴 Urgente

### ¿Para qué sirve?
El padre puede mirar el celular a cualquier hora y saber cómo está el campo. Los hijos pueden ver si sus datos fueron cargados. Los clientes de confianza pueden verificar el stock antes de hacer el pedido.

---

## 🤖 AGENTES DE INTELIGENCIA ARTIFICIAL
*El "equipo invisible" que trabaja 24/7 analizando los datos.*

### Los 4 Agentes

**🩺 Agente Veterinario**  
Monitorea la salud del lote y genera el calendario sanitario automáticamente. Detecta caídas de postura fuera de la curva esperada para la semana productiva del lote.

**⚖️ Agente Contable**  
Controla los costos, calcula el punto de equilibrio y avisa cuando el precio de venta está por debajo del costo. También controla las cuentas por cobrar vencidas.

**📣 Agente Growth**  
Detecta clientes inactivos (más de 10 días sin comprar) y genera automáticamente un mensaje de reactivación. Sugiere qué días de la semana son mejores para contactar clientes por zona.

**🔍 Agente Auditor**  
Cruza todos los datos contra todos los demás. Si algo no cierra — un número de producción anormal, un cobro que falta, maples que no volvieron — genera una alerta y registra la discrepancia en el log de auditoría.

---

## 🛡️ SEGURIDAD Y RESPALDO DE DATOS

- **Todos los datos se guardan en la nube** (Supabase — servidores certificados)
- **Respaldo automático diario** — nunca se pierde información
- **Cada usuario solo ve lo que le corresponde** según su rol
- **Log de auditoría**: queda registro de quién cargó cada dato y cuándo
- **Modo offline**: si no hay internet en el galpón, el sistema igual guarda los datos y los sube cuando vuelve la señal

---

## ⚙️ REQUISITOS TÉCNICOS

| Elemento | Requisito |
|---|---|
| Dispositivo | Cualquier celular Android o iPhone (desde 2019) |
| Instalación | No requiere instalación — funciona en el navegador |
| Internet | Necesario para sincronización (WiFi o datos móviles) |
| Offline | Funciona sin internet para registro diario |
| Computadora | Opcional — el panel del administrador también funciona en PC |

---

## 📅 PLAN DE IMPLEMENTACIÓN

| Etapa | Contenido | Tiempo estimado |
|---|---|---|
| **Fase 1** | Demo funcional para revisión del cliente | ✅ Listo |
| **Fase 2** | Conexión a base de datos real (Supabase) | 1 semana |
| **Fase 3** | Módulo Ventas + Pedidos completo | 1 semana |
| **Fase 4** | Mapa de clientes + Optimización de ruta | 3 días |
| **Fase 5** | Reporte dominical por WhatsApp (API real) | 3 días |
| **Fase 6** | Conteo IA real con Gemini Vision | 1 semana |
| **Fase 7** | QR de trazabilidad + Tablero Familiar | 3 días |
| **Total estimado** | Sistema completo en producción | **~5 semanas** |

---

## 💬 SOPORTE Y CAPACITACIÓN

Incluido en el proyecto:
- **Manual "3 Clicks"**: guía ilustrada para cada operación cotidiana
- **Video tutorial** de 5 minutos para el operador junior (carga diaria)
- **Sesión de capacitación** de 2 horas con la familia (presencial o por videollamada)
- **Soporte por WhatsApp** durante los primeros 30 días de uso

---

*Sistema desarrollado por Antigravity · Mendoza, Argentina*  
*Tecnologías: Progressive Web App · Supabase · Google Gemini AI · WhatsApp Business API*
