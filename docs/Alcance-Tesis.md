# Alcance verificable de la tesis — Localito

> El incremento visual del 09-09-2026 incorpora paleta compartida, catálogo fotográfico, cobro y pestañas de Caja. No añade pasarelas reales ni eliminación de fondos. Las 61 pruebas y el build pasan; la verificación visual completa sigue pendiente. [Diseño y verificación](Diseno-Interfaz.md).

Este documento es la fuente de verdad para presentar Localito. Distingue el núcleo que se puede demostrar de las simulaciones académicas y de lo que queda fuera del alcance.

Revisión técnica: **08-09-2026**. Evidencia, contratos y pendientes de esta versión en [Estado actual](Estado-Actual.md).

## Propósito

Localito demuestra cómo un comercio de barrio puede concentrar ventas, inventario, caja, clientes, fiado, compras y apoyo visual en una PWA multi-negocio. La evaluación se centra en trazabilidad, control de datos, experiencia móvil y reglas de negocio; no en operar dinero ni documentos tributarios reales.

## Incluido y demostrable

- Registro público de un negocio y su dueño, más creación administrativa de locales para la demostración.
- Prueba Pro de 30 días, planes Básico/Pro, permisos por rol y modo solo lectura al vencer.
- Roles `system_admin`, `owner` y `seller`, con aislamiento de datos por negocio.
- POS con ticket, descuentos, notas, pago mixto, comprobante interno, anulación y devolución parcial.
- Inventario, categorías, códigos de barras, SKU, kardex, alertas, importación/exportación CSV y carga inicial.
- Clientes, cupo de fiado, vencimientos, bloqueo de crédito, abonos y recordatorio por WhatsApp.
- Proveedores, compras, recepción, costo promedio y carga de factura asistida por IA.
- Caja por turno, movimientos, cierres, reportes y auditoría.
- Venta Rápida y lectura de factura con IA: la persona revisa productos, cantidades, costos y precios antes de confirmar.
- Persistencia PostgreSQL en producción, PWA instalable y cola offline exclusivamente de ventas por negocio/usuario. Los ajustes de stock necesitan conexión.
- Cobro compacto configurable por negocio, datos bancarios, efectivo recibido/vuelto y validación de pagos mixtos.
- Fotos reales con encuadre y escala; WebP con transparencia cuando ya existe en la imagen original.
- Estado de cuenta, recordatorio editable, conciliación con abonos en efectivo y reposición orientativa según ventas.
- Auditoría completa por cursor, búsqueda y fechas; ventas inválidas rechazadas antes de alterar stock/deuda.
- Sincronización con exclusión entre pestañas, detalle de errores, revisión de rechazos, reintento individual y respaldo local sin token.

## Simulaciones académicas

| Flujo | Comportamiento en esta tesis |
| --- | --- |
| Activación de plan con Webpay o Mercado Pago | Sandbox: aprueba el cambio de plan sin enviar ni recibir dinero. |
| Solicitud de plan por transferencia | Registra una solicitud para que el administrador la active manualmente. |
| Cobro Webpay de un fiado | Crea un enlace y una confirmación de demostración; no consulta ni cobra en Transbank. |
| Tarjeta, transferencia, Webpay y Mercado Pago en el POS | El vendedor cobra en un medio externo y confirma manualmente dentro de Localito. |
| Mercado Pago | Se registra como medio externo; Localito no genera QR ni usa su API. |

Las simulaciones son intencionales. Sirven para evaluar el flujo, estados y trazabilidad sin incurrir en costos ni procesar información financiera real.

## Fuera de alcance

- Emisión o validación de boletas y facturas electrónicas ante el SII.
- Cobros reales, webhooks, conciliación automática o suscripción recurrente.
- Datos de tarjetas, integración con terminales físicos o envío automático de montos a un POS.
- E-commerce público, múltiples sucursales, fidelización y notificaciones comerciales automáticas.
- Reconocimiento facial o identificación de clientes mediante imágenes.
- Eliminación automática de fondos y catálogo de imágenes generado sin fotografías aportadas.
- Resolución automática de rechazos offline, migración automática de colas antiguas y precio congelado de una venta diferida.

## Dependencias de ambiente para la demostración

| Variable o servicio | Qué habilita |
| --- | --- |
| PostgreSQL / Supabase | Persistencia de locales, ventas, stock y usuarios. En producción es obligatorio. |
| `GROQ_API_KEY` u `OPENAI_API_KEY` | Venta Rápida y análisis de facturas. La cuota gratuita puede limitar pruebas. |
| Gmail o Resend | Envío real del enlace de recuperación de contraseña. |
| `SESSION_SECRET` | Seguridad de sesiones en el backend. |

`GET /api/health` expone, sin revelar secretos, si la persistencia, Venta Rápida, Factura IA y el correo de recuperación están configurados.

## Criterio de presentación

La verificación del 08-09-2026 comprende 56 pruebas de lógica, tipos, compilación y tres suites de navegador con 62 capturas. Las pruebas integradas usaron memoria y datos sintéticos. No presentar esto como validación de PostgreSQL, restauración, teléfonos físicos, usuarios finales ni pagos comerciales.

En la defensa se debe describir el ticket como **comprobante interno no tributario** y cada pago de prueba como **simulación académica**. Para las evidencias funcionales, utilizar [Matriz-Pruebas-Localito.md](Matriz-Pruebas-Localito.md); los casos sin evidencia continúan siendo pendientes, no aprobados por inferencia.
