# Alcance verificable de la tesis — Localito

Este documento es la fuente de verdad para presentar Localito. Distingue el núcleo que se puede demostrar de las simulaciones académicas y de lo que queda fuera del alcance.

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
- Persistencia PostgreSQL en producción, PWA instalable y cola offline limitada a ventas y ajustes de stock.

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

## Dependencias de ambiente para la demostración

| Variable o servicio | Qué habilita |
| --- | --- |
| PostgreSQL / Supabase | Persistencia de locales, ventas, stock y usuarios. En producción es obligatorio. |
| `GROQ_API_KEY` u `OPENAI_API_KEY` | Venta Rápida y análisis de facturas. La cuota gratuita puede limitar pruebas. |
| Gmail o Resend | Envío real del enlace de recuperación de contraseña. |
| `SESSION_SECRET` | Seguridad de sesiones en el backend. |

`GET /api/health` expone, sin revelar secretos, si la persistencia, Venta Rápida, Factura IA y el correo de recuperación están configurados.

## Criterio de presentación

En la defensa se debe describir el ticket como **comprobante interno no tributario** y cada pago de prueba como **simulación académica**. Para las evidencias funcionales, utilizar [Matriz-Pruebas-Localito.md](Matriz-Pruebas-Localito.md); los casos sin evidencia continúan siendo pendientes, no aprobados por inferencia.
