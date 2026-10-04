# Matriz de trazabilidad de Localito

# Resumen ejecutivo

La matriz relaciona 34 requisitos funcionales, 15 requisitos de calidad del documento maestro y 33 historias con diseño, pruebas y brechas. Su objetivo es permitir que una afirmación del informe pueda seguirse hasta una evidencia. La presencia de código o de una prueba parcial no equivale a aceptación integral del requisito.

# Introducción y reglas de lectura

La línea base es el documento maestro del repositorio y sus backlogs al corte del 03 de octubre de 2026. La campaña técnica adicional corresponde al 04 de octubre, sobre el commit `ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c`. Los enlaces de esta matriz son relaciones analíticas propuestas en esta revisión; no modifican acuerdos previos ni certifican aprobación del Product Owner.

Se conservan los identificadores RF, NRF, HU y CP originales. AUT01–AUT57 identifican los 57 casos superiores de la salida TAP, que incluye 21 subcasos: 78 pruebas en total. HTTP01–HTTP12 corresponden a la campaña de API local. El Informe de verificación contiene sus nombres y resultados; el Plan de pruebas contiene los CP. No se suman pruebas como porcentaje de requisitos cubiertos porque la relación es de muchos a muchos.

# Requisitos funcionales y evidencia

Las referencias AUT y HTTP tienen resultado aprobado en el alcance indicado. Las referencias CP conservan su estado histórico o pendiente; deben consultarse en el Plan. Todos los RF mantienen aceptación global pendiente hasta completar los criterios, ambiente y revisión del responsable. Arquitectura, Modelo de datos y Diagramas UML explican los mecanismos de soporte.

| Requisito | Historia relacionada | Evidencia o brecha |
| --- | --- | --- |
| RF01 Registro de administrador | HU01, HU04 | AUT11–14; CP83 |
| RF02 Inicio y cierre de sesión | HU01 | AUT09,17; HTTP01–02,12 |
| RF03 Creación y configuración del negocio | HU04 | AUT11,15,48; CP77 |
| RF04 Separación entre negocios | HU03 | HTTP03–04; AUT11,46–47,57 |
| RF05 Catálogo de productos | HU06–08 | HTTP05; CP03–05 |
| RF06 Stock actual y mínimo | HU08–11 | AUT32; HTTP07 |
| RF07 Registro de ventas | HU14–15 | AUT19,45,49; HTTP06–08 |
| RF08 Descuento de existencias | HU09, HU14 | HTTP06–09; CP114 pendiente |
| RF09 Medios de pago y pagos mixtos | HU16 | AUT19,45; CP34,68–69 |
| RF10 Clientes | HU19 | AUT19,45; CP12–13 |
| RF11 Venta fiada | HU20 | HTTP09; AUT19,45 |
| RF12 Abonos de deuda | HU21 | HTTP10; AUT19,49 |
| RF13 Historial del cliente | HU22 | CP14,89; validación visual pendiente |
| RF14 Alertas de stock | HU11 | AUT32,50; CP06 |
| RF15 Reportes de ventas y fiados | HU30–31 | AUT20,32–35; CP24,109 |
| RF16 Captura con cámara | HU33 | CP15,64; dispositivos pendientes |
| RF17 Reconocimiento visual | HU33 | AUT05–07,21–26; proveedor simulado |
| RF18 Código de barras | HU12 | CP16; lectura física pendiente |
| RF19 Consulta del producto reconocido | HU07, HU33 | AUT21,23,26; CP17 |
| RF20 Producto reconocido al ticket | HU14, HU33 | AUT27; CP59,66 |
| RF21 Confirmación por baja confianza | HU33 | AUT23,29; CP60–61 |
| RF22 Registro de pagos externos | HU16 | CP68–69; sin integración POS |
| RF23 Confirmación de cobro externo | HU16 | CP69; validación visual pendiente |
| RF24 Usuarios internos y roles | HU02, HU05 | AUT18,30; HTTP05,11 |
| RF25 Filtros de ventas | HU31 | AUT36; CP109,111 |
| RF26 Carga CSV validada e idempotente | HU29 | AUT16; CP43,54–56 |
| RF27 Apertura y cierre de caja | HU17–18 | AUT20,49; CP18–19,39–40 |
| RF28 Egresos de caja | HU17–18 (parcial) | AUT19,20; CP18,39 |
| RF29 Resultados y margen estimado | HU30–31 | AUT20; CP104; conciliación pendiente |
| RF30 Reconocimiento de varios productos | HU33 | AUT23–25; CP58–59 |
| RF31 Revisión humana de propuestas | HU33 | AUT27–29; CP50,66 |
| RF32 Factura e ingreso revisado | HU26–28, HU33 | AUT28–29; CP47–52 |
| RF33 Kardex de movimientos | HU09–10, HU23, HU28 | AUT19,28,49; CP09,36–37,41 |
| RF34 Salud y persistencia productiva | Transversal; HU04 parcial | AUT02–04,08; CP115–118 pendientes |

# Historias, requisitos y situación de planificación

La falta de un RF explícito para una historia muestra una brecha de normalización del documento maestro. Se conserva el trabajo y se propone acordar un nuevo requisito o ampliar uno existente; no se inventa un RF aprobado. Los estados provienen del Sprint Backlog, no se deducen del resultado de pruebas.

| Historia | Requisitos asociados | Estado documental al 03 de octubre |
| --- | --- | --- |
| HU01 Autenticarse | RF01, RF02 | Cerrada en Sprint 1 |
| HU02 Gestionar roles | RF24 | Cerrada en Sprint 1 |
| HU03 Aislar datos | RF04 | Cerrada en Sprint 1 |
| HU04 Gestionar negocio | RF01, RF03, RF34 | Cerrada en Sprint 2 |
| HU05 Administrar usuarios | RF24 | Cerrada en Sprint 2 |
| HU06 Categorías | RF05 | Cerrada en Sprint 2 |
| HU07 Catálogo | RF05, RF19 | Cerrada en Sprint 2 |
| HU08 Stock inicial | RF05, RF06 | Cerrada en Sprint 2 |
| HU09 Movimientos de stock | RF08, RF33 | Cerrada en Sprint 3 |
| HU10 Kardex | RF33 | Cerrada en Sprint 3 |
| HU11 Alertas | RF06, RF14 | Cerrada en Sprint 3 |
| HU12 Código de barras | RF18 | Cerrada en Sprint 3 |
| HU13 Venta offline | Transversal: continuidad offline | En progreso, Sprint 4 |
| HU14 Venta POS | RF07, RF08, RF20 | Hecha, Sprint 4 |
| HU15 Descuentos | RF07 | Hecha, Sprint 4 |
| HU16 Pagos divididos | RF09, RF22, RF23 | Por hacer, Sprint 4 |
| HU17 Abrir caja | RF27, RF28 | Por hacer, Sprint 4 |
| HU18 Cerrar caja | RF27, RF28 | Por hacer, Sprint 4 |
| HU19 Clientes | RF10 | Product Backlog; sin Sprint comprometido |
| HU20 Venta fiada | RF11 | Product Backlog; sin Sprint comprometido |
| HU21 Abonos | RF12 | Product Backlog; sin Sprint comprometido |
| HU22 Estado de cuenta | RF13 | Product Backlog; sin Sprint comprometido |
| HU23 Devolución y anulación | RF33 | Product Backlog; sin Sprint comprometido |
| HU24 Auditoría | NRF10: auditoría | Product Backlog; sin Sprint comprometido |
| HU25 Proveedores | Brecha: proveedores sin RF autónomo | Product Backlog; sin Sprint comprometido |
| HU26 Órdenes de compra | RF32 | Product Backlog; sin Sprint comprometido |
| HU27 Recepción de compras | RF32 | Product Backlog; sin Sprint comprometido |
| HU28 Stock desde recepción | RF32, RF33 | Product Backlog; sin Sprint comprometido |
| HU29 Carga CSV | RF26 | Product Backlog; sin Sprint comprometido |
| HU30 Dashboard | RF15, RF29 | Product Backlog; sin Sprint comprometido |
| HU31 Reportes de ventas | RF15, RF25, RF29 | Product Backlog; sin Sprint comprometido |
| HU32 Reportes de inventario | Brecha: reporte de inventario sin RF autónomo | Product Backlog; sin Sprint comprometido |
| HU33 Reconocimiento visual | RF16, RF17, RF19, RF20, RF21, RF30, RF31, RF32 | Product Backlog; sin Sprint comprometido |

# Calidad y escenarios verificables

El documento maestro usa NRF01–NRF15. El documento especializado utiliza RNF01–RNF18 para escenarios medibles. Son dos espacios de identificación distintos. Esta correspondencia evita asociar por error los números iguales.

| Requisito maestro | Escenario especializado | Evidencia y siguiente comprobación |
| --- | --- | --- |
| NRF01 Usabilidad | RNF06 | Protocolo UAT preparado; observación pendiente |
| NRF02 Rendimiento | RNF05 | CP123 pendiente; sin percentiles de producción |
| NRF03 Disponibilidad | RNF04 | Pruebas de interrupción y seguimiento pendientes |
| NRF04 Seguridad | RNF01 | AUT09,17; HTTP01–02,12; revisión integral pendiente |
| NRF05 Privacidad | RNF02, RNF11 | HTTP03–04; AUT46–47; aislamiento SQL pendiente |
| NRF06 Escalabilidad | RNF13 | Diseño inspeccionado; carga gradual pendiente |
| NRF07 Mantenibilidad | RNF14 | Tipos y build aprobados; revisión de cambios futura |
| NRF08 Compatibilidad | RNF12 | CP121 pendiente en equipos físicos |
| NRF09 Accesibilidad | RNF07 | AUT37–44 verifican reglas y colores; teclado y lector pendientes |
| NRF10 Auditoría | RNF10 | AUT46; HTTP11; completitud transaccional pendiente |
| NRF11 Integridad | RNF08, RNF09 | HTTP06–10; AUT19,45; concurrencia SQL pendiente |
| NRF12 Recuperación | RNF15 | CP118 pendiente; no se acredita restauración |
| NRF13 Instalabilidad | RNF16 | Build aprobado; instalación limpia de contenedores pendiente |
| NRF14 Portabilidad | RNF17 | Configuración revisada; migración de ambiente pendiente |
| NRF15 Observabilidad | RNF18 | Salud local consultada; monitoreo y alertas pendientes |

RNF03, persistencia productiva, complementa RF34. Su condición de arranque tiene pruebas automatizadas, pero la operación con PostgreSQL real sigue pendiente. Los umbrales propuestos deben ser aceptados por el equipo y el docente antes de utilizarlos como criterios contractuales.

# Recorridos de trazabilidad de extremo a extremo

## Venta y existencias

RF07 y RF08 se desarrollan mediante HU14 y HU09. La vista de escenarios muestra confirmación del ticket, API y repositorio; el modelo relaciona venta, detalle y movimiento. HTTP07 verifica venta de dos unidades, total y stock. HTTP08 comprueba reintento secuencial con la misma clave. CP114 y CP115 completarán concurrencia en PostgreSQL. La evidencia actual no basta para afirmar que dos cajas compitiendo por la última unidad estén verificadas en producción.

## Fiado y abono

RF11 y RF12 se desarrollan con HU20 y HU21. HTTP09 genera una deuda de 1.000 CLP; HTTP10 aplica un abono de 400 CLP y observa saldo de 600 CLP. AUT45 añade entradas inválidas. Quedan pendientes la experiencia del comerciante, conciliación de reportes y prueba persistente de esas operaciones.

## Reconocimiento visual

RF17, RF30 y RF31 se desarrollan con HU33. AUT21–29 examinan normalización, catálogo y propuestas revisadas con respuestas controladas. No miden exactitud de un proveedor externo sobre fotografías reales. El protocolo de validación compara búsqueda, código y fotografía con el mismo catálogo y conserva correcciones y tiempo total.

# Brechas y gestión de cambios

Se deben formalizar los requisitos de continuidad offline, proveedores y reporte de inventario, y detallar egresos dentro de las historias de caja. También se requiere acordar criterios verificables de disponibilidad, recuperación y carga. Estas brechas de trazabilidad no prueban ausencia de funcionalidad; indican que la línea base debe representar explícitamente el comportamiento implementado.

Cada cambio debe registrar fecha, motivo, RF o HU afectado, responsable, decisión del Product Owner, impacto en datos y prueba asociada. El cambio de un estado a aceptado requiere evidencia identificable y decisión del responsable. Se debe conservar la versión anterior para explicar diferencias entre cortes.

# Conclusiones

La matriz hace visibles las relaciones y también los vacíos. Permite priorizar evidencia de integridad y aislamiento, cerrar la aceptación de historias y mantener coherencia entre los informes sin alterar retrospectivamente la planificación. La ingeniería de requisitos orienta esta trazabilidad; no se declara certificación de conformidad con una norma (ISO et al., 2018).

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

ISO, IEC e IEEE (2018). *29148 Requirements engineering resumen público*. https://www.iso.org/standard/72089.html

