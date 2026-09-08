# Mejoras de operación

Entrega verificada localmente el **08-09-2026**. El detalle de contratos, ejecución y límites está en [Estado actual](docs/Estado-Actual.md).

- Sincronización: ventas pendientes separadas por local y usuario; bloqueo entre pestañas, claves idempotentes y reintentos visibles. El catálogo se recupera desde IndexedDB cuando la API no responde, reservando el stock de las ventas pendientes. Las colas antiguas sin propietario se conservan sin enviarse automáticamente.
- Fotos: carga desde archivo o cámara, encuadre y escala, salida WebP de 512 px y conservación de transparencia. Se guarda en el campo de imagen existente. No incluye eliminación automática del fondo.
- Cobros: medios habilitados y ordenados por local, datos bancarios en Transferencia y plazos predeterminados de reposición. Configuración editable por el dueño.
- Caja: apertura, ventas netas en efectivo, abonos de fiado, ingresos, gastos y retiros separados; diferencia contada y motivo obligatorio cuando no cuadra. Incluye turnos que cruzan medianoche.
- Reposición: demanda de 30 días, stock, mínimos, órdenes pendientes de recibir y plazos de cobertura. Las propuestas son revisables antes de crear la orden. La pestaña sin ventas identifica productos sin movimiento en el período disponible.
- Historial: búsqueda, acción y rango de fechas sobre todo el historial mediante `/audit/history`, con 25 eventos por página y cursor por fecha/ID. Antes/después conserva los valores originales incluso en memoria. La edición completa permite añadir un motivo.
- Fiado: estado de cuenta con deudas, vencimientos y abonos. Recordatorio editable antes de abrir WhatsApp; no se envían mensajes automáticamente.

## Persistencia y comprobación

La migración idempotente de `db/schema.sql` agrega `negocios.preferencias` (JSONB). Las fotos usan `productos.imagen_url` (TEXT). El repositorio en memoria sirve para demostración y pierde los datos al reiniciar; PostgreSQL conserva los datos entre reinicios.

Comprobaciones: 56 pruebas de lógica aprobadas, tipos y compilación de web/API/shared aprobados. `npm run check` agrupa estas etapas y tiene workflow en GitHub. Las suites `test-improvements.cjs`, `test-hardening.cjs` y `test-checkout.cjs` pasaron y generaron 62 capturas. Configuración: `LOCALITO_TEST_URL`, `LOCALITO_TEST_API`, `PLAYWRIGHT_MODULE` y `LOCALITO_TEST_OUTPUT`.

La validación integrada usa el repositorio en memoria; la migración y las consultas PostgreSQL deben verificarse contra una base de pruebas antes del despliegue.

## Refuerzos de esta continuación

- Validación de ventas en API y ambos repositorios: cantidades, líneas duplicadas, productos inactivos, clientes ajenos, descuento, importes y coherencia del pago mixto. Los rechazos comprobados no alteran stock ni deuda.
- Un rechazo de datos en la cola ya no bloquea todas las ventas. Queda marcado para revisión y exige reintento manual; los errores de red, sesión o servidor detienen el ciclo.
- Detalle y reintento por venta, respaldo descargable de la cuenta activa sin token y conservación de colas corruptas para diagnóstico.
- Historial completo comprobado con más de 100 eventos, búsqueda histórica y paginación sin duplicados; vendedores sin permiso reciben 403.
- Documentación sincronizada: límites offline, pruebas efectivamente ejecutadas, simulaciones, contratos históricos y trabajo pendiente.

No se implementaron pagos reales, eliminación automática de fondo, importación del respaldo de cola ni resolución automática de discrepancias. Tampoco se validó la nueva migración en producción.
