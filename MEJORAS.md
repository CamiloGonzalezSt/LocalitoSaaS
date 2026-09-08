# Mejoras de operación

- Sincronización: ventas pendientes separadas por local y usuario; bloqueo entre pestañas, claves idempotentes y reintentos visibles. El catálogo se recupera desde IndexedDB cuando la API no responde, reservando el stock de las ventas pendientes. Las colas antiguas sin propietario se conservan sin enviarse automáticamente.
- Fotos: carga desde archivo o cámara, encuadre y escala, salida WebP de 512 px y conservación de transparencia. Se guarda en el campo de imagen existente. No incluye eliminación automática del fondo.
- Cobros: medios habilitados y ordenados por local, datos bancarios en Transferencia y plazos predeterminados de reposición. Configuración editable por el dueño.
- Caja: apertura, ventas netas en efectivo, abonos de fiado, ingresos, gastos y retiros separados; diferencia contada y motivo obligatorio cuando no cuadra. Incluye turnos que cruzan medianoche.
- Reposición: demanda de 30 días, stock, mínimos, órdenes pendientes de recibir y plazos de cobertura. Las propuestas son revisables antes de crear la orden. La pestaña sin ventas identifica productos sin movimiento en el período disponible.
- Historial: filtros de usuario, acción y fecha sobre los últimos 100 eventos cargados; detalle antes/después en ediciones y ajustes. La edición completa permite añadir un motivo.
- Fiado: estado de cuenta con deudas, vencimientos y abonos. Recordatorio editable antes de abrir WhatsApp; no se envían mensajes automáticamente.

## Persistencia y comprobación

La migración idempotente de `db/schema.sql` agrega `negocios.preferencias` (JSONB). Las fotos usan `productos.imagen_url` (TEXT). El repositorio en memoria sirve para demostración y pierde los datos al reiniciar; PostgreSQL conserva los datos entre reinicios.

Comprobaciones: `node node_modules/tsx/dist/cli.mjs --test scripts/improvements.test.ts apps/api/src/localito.test.ts`, tipos de API/web y compilación Vite. `scripts/test-improvements.cjs` usa un negocio sintético en servidores locales y comprueba las siete áreas, permisos, aislamiento entre cuentas, reintentos y vistas de ambos temas. Se puede configurar con `LOCALITO_TEST_URL`, `LOCALITO_TEST_API`, `PLAYWRIGHT_MODULE` y `LOCALITO_TEST_OUTPUT`.

La validación integrada usa el repositorio en memoria; la migración y las consultas PostgreSQL deben verificarse contra una base de pruebas antes del despliegue.
