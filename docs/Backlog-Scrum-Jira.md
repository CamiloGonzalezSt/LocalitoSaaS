# Backlog Scrum y guía Jira - Localito SaaS

Documento operativo para registrar en Jira el alcance construido de Localito, planificar sprints y conservar trazabilidad entre requerimientos, historias, pruebas y entregables.

## 1. Configuración recomendada en Jira

- Tipo de proyecto: **Scrum administrado por el equipo**.
- Jerarquía: `Epic → Story → Sub-task`; usar `Bug` para defectos y `Task` para infraestructura o documentación.
- Flujo: `Backlog → Por hacer → En curso → En revisión → Pruebas → Terminado`.
- Estimación: Story Points Fibonacci (`1, 2, 3, 5, 8, 13`).
- Sprint: dos semanas. Para reconstruir el historial, crear Sprint 0 a Sprint 13 y cerrar los incrementos ya entregados.
- Componentes: Plataforma, Autenticación, POS, Inventario, Clientes, Caja, Compras, IA, Reportes, PWA, DevOps y Documentación.
- Labels: `mvp`, `mobile-first`, `multi-tenant`, `security`, `ai`, `offline`, `production`, `thesis`.

El CSV [Jira-Import.csv](Jira-Import.csv) contiene épicas e historias listas para importar. En el asistente de Jira se deben mapear las columnas `Epic Name`, `Epic Link`, `Story Points` y `Sprint` con los campos equivalentes del proyecto.

## 2. Visión y alcance vigente

Localito es un SaaS/PWA multi-tenant para negocios de barrio. Dueño y vendedor operan la aplicación; el cliente final no inicia sesión ni interactúa con Localito. El sistema administra catálogo, inventario, ventas, clientes, fiado, caja, gastos, compras, reportes y asistencia visual.

Los pagos presenciales son externos y manuales. Localito registra efectivo, tarjeta en terminal externa, transferencia/QR, Webpay externo, Mercado Pago QR, fiado o pago mixto, pero no envía automáticamente el monto a un POS ni almacena datos de tarjeta. La contratación de planes incluye una simulación sandbox de Webpay/Mercado Pago y transferencia sujeta a aprobación; la pasarela real queda pendiente de credenciales comerciales.

## 3. Épicas

| ID | Épica | Resultado de negocio | Estado |
| --- | --- | --- | --- |
| EPIC-01 | Plataforma SaaS | Negocios aislados y administrables en una sola plataforma. | Terminado |
| EPIC-02 | Identidad y seguridad | Acceso seguro por rol, sesiones y recuperación de contraseña. | Terminado |
| EPIC-03 | Onboarding y catálogo | Un local nuevo carga productos sin ingresarlos uno a uno. | Terminado |
| EPIC-04 | Inventario y abastecimiento | Stock, movimientos, compras, proveedores y facturas controlados. | Terminado |
| EPIC-05 | POS y pagos manuales | Ventas rápidas, consistentes y compatibles con terminales externas. | Terminado |
| EPIC-06 | Clientes y fiado | Crédito de barrio trazable, con cupos, abonos y recordatorios. | Terminado |
| EPIC-07 | Caja y gastos | Apertura, movimientos, conciliación, gastos y cierres auditables. | Terminado |
| EPIC-08 | Venta Rápida e IA | Una foto propone varios productos bajo confirmación humana. | Terminado |
| EPIC-09 | Reportes | El dueño comprende ventas, margen, gastos y resultado estimado. | Terminado |
| EPIC-10 | PWA y experiencia móvil | Operación instalable, responsive y tolerante a desconexiones. | Terminado |
| EPIC-11 | Calidad y producción | Despliegue persistente, observable, probado y documentado. | Terminado |
| EPIC-12 | Suscripciones y rediseño SaaS | Prueba, planes, permisos y experiencia profesional coherente por rol. | Terminado |
| EPIC-13 | Preparación comercial y hardening | Alta pública, administración completa, operación financiera y UI lista para piloto. | Terminado |

## 4. Product Backlog

| ID | Épica | Historia de usuario | Criterios de aceptación resumidos | SP | Prioridad | Sprint | Estado |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| HU-001 | EPIC-01 | Como administrador de plataforma quiero crear y desactivar locales para gestionar el SaaS. | Alta/edición/desactivación; conteos de usuarios y productos; sin entrar a operaciones privadas. | 5 | Alta | 1 | Terminado |
| HU-002 | EPIC-01 | Como dueño quiero que mis datos estén aislados de otros locales. | Tenant derivado de sesión; consultas y escrituras filtradas; prueba de aislamiento aprobada. | 8 | Crítica | 1 | Terminado |
| HU-003 | EPIC-01 | Como dueño quiero administrar vendedores de mi local. | Crear, editar rol, desactivar y proteger correo duplicado. | 5 | Alta | 1 | Terminado |
| HU-004 | EPIC-02 | Como usuario quiero iniciar y cerrar sesión de forma segura. | Hash scrypt; token aleatorio almacenado como hash; expiración y revocación. | 8 | Crítica | 1 | Terminado |
| HU-005 | EPIC-02 | Como usuario quiero recuperar mi contraseña. | Token temporal y de un uso; cambio invalida sesiones; límites de solicitudes. | 5 | Alta | 1 | Terminado |
| HU-006 | EPIC-02 | Como dueño quiero permisos diferentes para vendedores. | Vendedor vende y opera caja; no modifica inventario ni recibe métricas financieras históricas. | 5 | Crítica | 1 | Terminado |
| HU-007 | EPIC-03 | Como local nuevo quiero un asistente de carga inicial. | Progreso reanudable; categorías sugeridas; acceso posterior desde menú. | 5 | Alta | 2 | Terminado |
| HU-008 | EPIC-03 | Como dueño quiero importar hasta 500 productos mediante CSV. | Plantilla; vista previa; errores por fila; importación idempotente; duplicados omitidos. | 8 | Alta | 2 | Terminado |
| HU-009 | EPIC-03 | Como dueño quiero crear y editar productos completos. | Nombre, marca, categoría, código, SKU, variante, unidad, pack, costo, precio y stock. | 5 | Alta | 2 | Terminado |
| HU-010 | EPIC-03 | Como usuario quiero buscar y filtrar por categoría. | Búsqueda por nombre, marca, código o SKU; chips de categorías; responsive. | 3 | Alta | 2 | Terminado |
| HU-011 | EPIC-04 | Como dueño quiero controlar stock mínimo y productos sin control de stock. | Alertas solo cuando corresponde; ajuste registra kardex y stock resultante. | 5 | Alta | 3 | Terminado |
| HU-012 | EPIC-04 | Como dueño quiero consultar movimientos de inventario. | Venta, devolución, compra, ajuste, merma, traslado y conteo trazables. | 5 | Alta | 3 | Terminado |
| HU-013 | EPIC-04 | Como dueño quiero gestionar proveedores y órdenes de compra. | Crear proveedor/orden; recepción total/parcial; costo promedio y stock consistentes. | 8 | Alta | 3 | Terminado |
| HU-014 | EPIC-04 | Como dueño quiero ingresar mercadería fotografiando una factura. | IA extrae; catálogo limita coincidencias; revisión obligatoria; recepción idempotente. | 13 | Alta | 7 | Terminado |
| HU-015 | EPIC-04 | Como dueño quiero alertas de reposición y vencimiento. | Stock bajo/agotado; sugerencia de compra; vencimientos dentro de 30 días. | 5 | Media | 3 | Terminado |
| HU-016 | EPIC-05 | Como vendedor quiero armar un ticket con varios productos. | Agregar, sumar, restar, eliminar; total y subtotales correctos; búsqueda rápida. | 8 | Crítica | 4 | Terminado |
| HU-017 | EPIC-05 | Como vendedor quiero aplicar descuento y nota. | Descuento no supera subtotal; nota persiste; total recalculado. | 3 | Alta | 4 | Terminado |
| HU-018 | EPIC-05 | Como vendedor quiero cobrar con medios externos manuales. | Efectivo, terminal externa, transferencia/QR, Webpay externo, fiado y mixto; sin API POS. | 5 | Crítica | 8 | Terminado |
| HU-019 | EPIC-05 | Como vendedor quiero dividir un pago. | Suma de partes igual al total; efectivo/tarjeta/fiado registrados por separado. | 5 | Alta | 4 | Terminado |
| HU-020 | EPIC-05 | Como negocio quiero evitar ventas duplicadas. | Idempotency key devuelve la misma venta; stock se descuenta una sola vez. | 5 | Crítica | 4 | Terminado |
| HU-021 | EPIC-05 | Como dueño quiero anular o devolver una venta. | Reposición exacta; devolución parcial; ventas netas y fiado ajustados; auditoría. | 8 | Alta | 4 | Terminado |
| HU-022 | EPIC-05 | Como vendedor quiero imprimir y compartir comprobante. | Ticket no tributario legible; impresión y compartir/copy disponibles. | 3 | Media | 4 | Terminado |
| HU-023 | EPIC-06 | Como vendedor quiero crear clientes para fiado. | Datos mínimos; aislamiento por local; alta rápida desde venta. | 3 | Alta | 5 | Terminado |
| HU-024 | EPIC-06 | Como dueño quiero definir cupo, plazo y bloqueo de crédito. | Venta rechazada si bloqueado o excede cupo; vencimiento calculado. | 5 | Alta | 5 | Terminado |
| HU-025 | EPIC-06 | Como vendedor quiero registrar abonos. | Parcial/total; no excede deuda; saldos e historial actualizados. | 5 | Alta | 5 | Terminado |
| HU-026 | EPIC-06 | Como dueño quiero recordar fiados vencidos por WhatsApp. | Mensaje preparado; enlace solo con teléfono; deuda y fecha correctas. | 3 | Media | 5 | Terminado |
| HU-027 | EPIC-07 | Como vendedor quiero abrir y cerrar caja por turno. | Monto inicial; esperado; contado; diferencia; responsable y observación. | 8 | Crítica | 6 | Terminado |
| HU-028 | EPIC-07 | Como vendedor quiero registrar ingresos, retiros y gastos. | Caja abierta obligatoria; monto/motivo validados; usuario y hora registrados. | 5 | Alta | 6 | Terminado |
| HU-029 | EPIC-07 | Como dueño quiero clasificar gastos operativos. | Arriendo, servicios, sueldos, compras, transporte, impuestos y otros persistentes. | 3 | Alta | 8 | Terminado |
| HU-030 | EPIC-07 | Como dueño quiero conciliar por medio de pago. | Totales de efectivo, tarjeta, transferencia, Webpay, fiado y mixto; anulaciones excluidas. | 5 | Alta | 6 | Terminado |
| HU-031 | EPIC-08 | Como vendedor quiero fotografiar varios productos en una venta. | Captura/subida; compresión; catálogo del tenant; hasta 30 líneas y cantidades agrupadas. | 13 | Crítica | 7 | Terminado |
| HU-032 | EPIC-08 | Como vendedor quiero corregir toda propuesta de IA. | Cambiar producto/cantidad, eliminar, buscar o repetir foto; sin stock modificado. | 8 | Crítica | 7 | Terminado |
| HU-033 | EPIC-08 | Como vendedor quiero confirmar producto y cantidad. | Ninguna detección entra al ticket sin confirmación humana; alerta por unidades ocultas. | 5 | Crítica | 8 | Terminado |
| HU-034 | EPIC-08 | Como vendedor quiero conservar el código de barras. | Lectura ZXing, entrada manual y uso sin proveedor visual. | 5 | Alta | 7 | Terminado |
| HU-035 | EPIC-08 | Como usuario quiero entender errores y cuotas de IA. | Cámara, conexión, imagen, proveedor, vacío y 429 con espera; ticket intacto. | 5 | Alta | 8 | Terminado |
| HU-036 | EPIC-09 | Como dueño quiero reportes de venta y caja. | Ventas netas, ticket promedio, anuladas, medios y cierres históricos. | 5 | Alta | 6 | Terminado |
| HU-037 | EPIC-09 | Como dueño quiero ver margen, gastos y resultado estimado. | Margen usa costo de catálogo; resultado=margen-gastos; etiquetas indican estimación. | 5 | Alta | 8 | Terminado |
| HU-038 | EPIC-10 | Como usuario móvil quiero una interfaz sin zoom ni desbordes. | 320/390/768/1280 px; controles táctiles; barra inferior libre. | 8 | Crítica | 9 | Terminado |
| HU-039 | EPIC-10 | Como usuario quiero instalar y usar funciones básicas sin conexión. | Manifest/service worker; caché; cola para ventas/stock; IA informa que necesita internet. | 8 | Alta | 9 | Terminado |
| HU-040 | EPIC-11 | Como equipo quiero producción persistente y observable. | PostgreSQL obligatorio; `/health`; estado de IA; variables seguras; guía operativa. | 8 | Crítica | 10 | Terminado |
| HU-041 | EPIC-11 | Como equipo quiero pruebas repetibles. | Build completo; pruebas automatizadas; matriz manual; casos críticos cubiertos. | 8 | Crítica | 10 | Terminado |
| HU-042 | EPIC-11 | Como tesista quiero documentación defendible. | Arquitectura, requisitos, backlog, sprints, pruebas, costos, operación y demo actualizados. | 5 | Alta | 10 | Terminado |
| HU-043 | EPIC-12 | Como negocio nuevo quiero probar Pro por 30 días. | Alta crea suscripción `trialing`; días calculados en servidor; banner visible; sin perder datos al vencer. | 8 | Crítica | 11 | Terminado |
| HU-044 | EPIC-12 | Como dueño quiero elegir Básico o Pro. | Precios y funciones visibles; cambio actualiza suscripción; arquitectura lista para proveedor recurrente. | 5 | Alta | 11 | Terminado |
| HU-045 | EPIC-12 | Como plataforma quiero controlar planes y estados. | MRR estimado, pruebas activas y edición de plan/estado por tenant con auditoría. | 8 | Alta | 11 | Terminado |
| HU-046 | EPIC-12 | Como sistema quiero permisos centralizados por plan. | Entitlements compartidos; UI y API bloquean; expirado solo lectura; datos Pro preservados. | 13 | Crítica | 11 | Terminado |
| HU-047 | EPIC-12 | Como usuario quiero una navegación simple según mi rol. | Funciones principales en 4-7 áreas; IA dentro de Vender; altas/importaciones dentro de Inventario. | 8 | Alta | 11 | Terminado |
| HU-048 | EPIC-12 | Como vendedor quiero confirmar pagos externos antes de registrar. | Medios aparecen tras Cobrar; pago externo requiere confirmación; venta/stock mutan una sola vez. | 8 | Crítica | 11 | Terminado |
| HU-049 | EPIC-12 | Como usuario quiero tema claro, oscuro o del sistema. | Persistencia por usuario, contraste, Source Sans 3 y responsive sin desborde. | 5 | Alta | 11 | Terminado |
| HU-050 | EPIC-12 | Como dueño quiero un Inicio que priorice lo que debo hacer hoy. | Venta diaria dominante, acciones frecuentes, atención y métricas financieras sin gráficos innecesarios. | 5 | Alta | 12 | Terminado |
| HU-051 | EPIC-12 | Como dueño quiero editar los datos de mi negocio desde Más. | Nombre, rubro, dirección y teléfono tienen labels, validación, endpoint owner y auditoría. | 5 | Alta | 12 | Terminado |
| HU-052 | EPIC-12 | Como dueño quiero solicitar un plan sin obtener acceso no pagado. | `pendingPlan` preserva acceso actual; system_admin verifica y activa el período manual. | 8 | Crítica | 12 | Terminado |
| HU-053 | EPIC-12 | Como equipo quiero demostrar no regresión del rediseño. | Matriz anterior/nueva ubicación, pruebas y evidencia responsive actualizadas. | 8 | Crítica | 12 | Terminado |
| HU-054 | EPIC-13 | Como empresa nueva quiero registrarme sin ayuda del administrador. | Alta pública; prueba Pro de 30 días; funciones, días restantes y condición de continuidad visibles. | 8 | Crítica | 13 | Terminado |
| HU-055 | EPIC-13 | Como administrador quiero que planes y estados persistan. | Cambio optimista confirmado por API, recarga conserva plan/estado y auditoría registra el cambio. | 5 | Crítica | 13 | Terminado |
| HU-056 | EPIC-13 | Como administrador quiero eliminar definitivamente locales y usuarios. | Confirmación reforzada; cascada segura por tenant; último dueño y usuario actual protegidos. | 8 | Alta | 13 | Terminado |
| HU-057 | EPIC-13 | Como dueño quiero administrar completamente los usuarios del local. | Crear, editar, rol, activar, desactivar, restablecer clave y eliminar. | 8 | Alta | 13 | Terminado |
| HU-058 | EPIC-13 | Como dueño quiero reportes mensuales accionables. | Filtro mensual, ventas, unidades, ticket, tendencia diaria, medios, vendedores, productos y cierres con detalle. | 13 | Alta | 13 | Terminado |
| HU-059 | EPIC-13 | Como dueño quiero anular y devolver ventas con control. | Motivo obligatorio, devolución parcial por producto, stock y fiado corregidos sin duplicidad. | 8 | Crítica | 13 | Terminado |
| HU-060 | EPIC-13 | Como vendedor quiero registrar abonos correctamente. | Monto obligatorio, medio explícito, límite por saldo y actualización consistente del cliente/deuda. | 5 | Crítica | 13 | Terminado |
| HU-061 | EPIC-13 | Como usuario quiero un tema claro/oscuro profesional. | Switch accesible, paleta oficial, sombras oscuras eliminadas y contraste probado a 320/390/1280 px. | 5 | Alta | 13 | Terminado |
| HU-062 | EPIC-13 | Como dueño quiero probar la contratación del plan sin dinero real. | Sandbox Webpay/Mercado Pago activa el plan de prueba; transferencia queda pendiente de aprobación. | 8 | Alta | 13 | Terminado |
| HU-063 | EPIC-13 | Como usuario quiero recuperar acceso sin error de servidor. | Solicitud responde de forma segura; correo se envía si hay proveedor configurado; admin puede asignar clave temporal. | 5 | Crítica | 13 | Terminado |

## 5. Plan de sprints reconstruido

| Sprint | Objetivo | Historias | Incremento demostrable |
| --- | --- | --- | --- |
| Sprint 0 | Descubrimiento y diseño | Investigación, wireframes, arquitectura | Visión, alcance, backlog y repositorio. |
| Sprint 1 | Plataforma e identidad | HU-001 a HU-006 | SaaS multi-tenant con autenticación y roles. |
| Sprint 2 | Onboarding y catálogo | HU-007 a HU-010 | Local nuevo puede cargar y encontrar productos. |
| Sprint 3 | Inventario y compras | HU-011 a HU-015 excepto HU-014 | Stock, kardex, proveedores y reposición. |
| Sprint 4 | POS | HU-016 a HU-022 excepto HU-018 | Venta, pago dividido, ticket, anulaciones y devoluciones. |
| Sprint 5 | Clientes y fiado | HU-023 a HU-026 | Crédito, abonos, vencimientos y recordatorios. |
| Sprint 6 | Caja y reportes base | HU-027, HU-028, HU-030, HU-036 | Turnos, conciliación y cierres. |
| Sprint 7 | IA e ingreso de mercadería | HU-014, HU-031, HU-032, HU-034 | Factura IA y Venta Rápida conectadas al catálogo. |
| Sprint 8 | Control humano y finanzas | HU-018, HU-029, HU-033, HU-035, HU-037 | Pagos manuales, gastos y resultado financiero. |
| Sprint 9 | Mobile/PWA | HU-038, HU-039 | Experiencia móvil y continuidad offline. |
| Sprint 10 | Producción y tesis | HU-040 a HU-042 | Despliegue verificable, QA y documentación final. |
| Sprint 11 | SaaS y rediseño profesional | HU-043 a HU-049 | Planes/entitlements, navegación por rol, pago asistido, temas y panel SaaS. |
| Sprint 12 | Cierre de rediseño y regresión | HU-050 a HU-053 | Inicio final, negocio editable, activación manual segura y trazabilidad de regresión. |
| Sprint 13 | Preparación comercial y hardening | HU-054 a HU-063 | Alta pública, administración CRUD, reportes, reversas, pagos sandbox y QA responsive. |

## 6. Definition of Ready

Una historia puede entrar a sprint cuando tiene actor, valor, criterios comprobables, dependencias identificadas, estimación, prioridad, diseño o contrato API suficiente y datos de prueba definidos.

## 7. Definition of Done

- Código revisado y sin cambios ajenos al alcance.
- Build de frontend/backend aprobado.
- Pruebas automatizadas relevantes aprobadas y caso manual agregado cuando corresponde.
- Seguridad por rol y tenant verificada.
- Responsive revisado si existe UI.
- Persistencia verificada si modifica datos.
- Documentación y variables de entorno actualizadas.
- Commit publicado y despliegue saludable cuando forma parte de una entrega.

## 8. Ceremonias y evidencias

- **Planning:** seleccionar historias por capacidad y definir Sprint Goal.
- **Daily:** qué terminé, qué haré y qué bloqueo existe; máximo 15 minutos.
- **Review:** demostrar el incremento con datos demo y asociar capturas al ticket Jira.
- **Retrospective:** registrar una acción concreta de mejora para el siguiente sprint.
- **Refinement:** dividir historias de 13 SP, aclarar criterios y reestimar.

Cada ticket terminado debe enlazar commit, evidencia de prueba, captura cuando corresponda y requerimiento relacionado. Los casos detallados están en [Matriz-Pruebas-Localito.md](Matriz-Pruebas-Localito.md) y [Matriz-Regresion-Rediseno.md](Matriz-Regresion-Rediseno.md).

## 9. Pendientes recomendados para nuevos sprints

| ID | Tipo | Descripción | Prioridad |
| --- | --- | --- | --- |
| ROAD-01 | Story | Exportar gastos y resultado financiero por período a CSV/PDF. | Media |
| ROAD-02 | Story | Permitir configuración de QR estático y datos bancarios por local. | Media |
| ROAD-03 | Task | Ejecutar QA visual real en Android y Safari/iPhone y adjuntar evidencias. | Alta |
| ROAD-04 | Task | Probar restauración de un respaldo PostgreSQL en un ambiente separado. | Alta |
| ROAD-05 | Story | Integración tributaria con SII o proveedor autorizado, fuera del MVP. | Baja |
