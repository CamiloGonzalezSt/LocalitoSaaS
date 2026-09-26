# Operación de Localito en producción

## Verificación de ventas y visión, 26-09-2026

El modelo `qwen/qwen3.6-27b` dejó de estar disponible para el nivel gratuito de Groq. El código actualizado usa `qwen/qwen3.8-27b` incluso si Vercel conserva el identificador retirado en `GROQ_VISION_MODEL`; actualizar también la variable en Vercel para que refleje el modelo vigente. [Aviso oficial](https://console.groq.com/docs/deprecations). `quickSaleConfigured` e `invoiceAiConfigured` solo confirman la presencia de claves, no el éxito de una solicitud. Probar fotos sin información sensible y no confirmar ventas/importaciones durante la validación.

La anulación y devolución reponen stock solo de unidades efectivamente descontadas al vender. Las nuevas ventas guardan ese dato en `detalle_ventas.stock_descontado`; el esquema se amplía al iniciar la API. En ventas históricas sin ese dato se usa `controla_stock` actual, por lo que un cambio de esa opción posterior a la venta exige conciliación manual. Validar en un local de prueba: registrar una venta de un producto con stock controlado, comprobar el descuento, devolver una parte y después anular el resto; verificar stock, estado e historial de movimientos. No repetir una anulación/devolución si la respuesta es ambigua: primero consultar la venta y el inventario. No se ha ejecutado esta prueba contra la base de producción.

## Recuperación de API, 26-09-2026

La web publicada respondía HTTP 200, pero `/api/health` devolvía 500 y el adaptador de login revelaba `ENOTFOUND tenant/user ... not found` del pooler PostgreSQL. Supabase estaba pausado. Después de reanudar el proyecto y corregir la URI `DATABASE_URL` en Vercel, `/api/health` respondió 200 con `storage: "postgres"`, `persistentStorage: true`, `quickSaleConfigured: true` e `invoiceAiConfigured: true` el 26-09-2026 a las 13:50 UTC. La conexión de la API está recuperada; login, catálogo y uso real de IA no están verificados. Según [la guía de Supabase sobre este error](https://supabase.com/docs/guides/troubleshooting/tenant-or-user-not-found), el pooler no puede asociar el host y usuario de la conexión a un proyecto; no significa por sí solo que el DNS del host no resuelva o que la contraseña sea incorrecta. El backend conserva el requisito de PostgreSQL persistente y no debe pasar a memoria en producción.

1. En el proyecto de Supabase que contiene los **datos actuales**, abrir **Connect** y copiar la URI completa de **Transaction pooler**. El proyecto se reanudó y figura saludable. No crear una base nueva ni aplicar semillas sobre datos reales para resolver este error del pooler. [Guía oficial de conexión](https://supabase.com/docs/guides/database/connecting-to-postgres).
2. En Vercel, revisar las variables de entorno de **Production**. El código prioriza `DATABASE_URL`, después `POSTGRES_URL` y finalmente `SUPABASE_DB_URL`; si `DATABASE_URL` sigue presente con un host antiguo, prevalecerá aunque las otras sean correctas. Actualizar o retirar la entrada obsoleta. Copiar el host completo y el usuario directamente de Supabase; codificar los caracteres reservados de la contraseña en la URI. No publicar la URI ni capturarla en pantalla.
3. Crear un nuevo despliegue de producción para que use las variables corregidas. Comprobar que `GET https://localito-saas.vercel.app/api/health` devuelve 200, `storage: "postgres"` y `persistentStorage: true`. Si continúa 503, revisar el registro de esa función en Vercel y la disponibilidad del proyecto Supabase.
4. Con una cuenta de prueba autorizada, comprobar inicio de sesión y carga del catálogo. Después probar venta con foto y lectura de una factura **sin confirmar importación**. `quickSaleConfigured` e `invoiceAiConfigured` en salud distinguen ausencia de claves de IA, pero no garantizan que el proveedor acepte la solicitud; usar una imagen de prueba sin datos sensibles para la verificación.
5. Revisar ventas pendientes antes de registrar nuevas operaciones. No repetir un cobro externo por un error de sincronización sin comprobar antes la venta y la caja.

El adaptador de login del código anterior devolvía al navegador el detalle de la excepción. La corrección preparada devuelve 503 y un mensaje genérico cuando falla la base, mientras conserva el diagnóstico en registros del servidor. Publicar ese cambio después de verificar tipos, pruebas y compilación; su publicación no sustituye el paso 2.

> Incremento visual del 09-09-2026 sin migración de base de datos. Tipos/build y 61 pruebas locales aprobados. Antes de desplegar, completar la regresión visual pendiente y revisar el resultado de CI; no se verificó un nuevo despliegue de producción en esta continuación. [Diseño y verificación](Diseno-Interfaz.md).

Actualización: **08-09-2026**. Las mejoras recientes se verificaron localmente con memoria, no contra producción. Antes de desplegar, completar las comprobaciones de persistencia siguientes. Consulte [Estado actual](Estado-Actual.md) para contratos y límites.

## Verificación diaria

- Consultar `GET /api/health`: debe responder `status: ok`, `persistentStorage: true` y `storage: postgres`.
- `quickSaleConfigured`, `invoiceAiConfigured` y `passwordResetEmailConfigured` indican si los servicios opcionales están disponibles, sin revelar credenciales.
- Realizar comprobaciones de escritura únicamente en un negocio reservado para pruebas; no alterar ventas, inventario o caja de negocios reales para verificar el sistema.

## Respaldos

- La base PostgreSQL/Supabase es la fuente de verdad. Habilitar respaldos del proveedor antes de incorporar negocios reales.
- Exportar productos desde **Caja → Datos y trazabilidad** con un dueño autorizado. Ese CSV no respalda ventas, usuarios ni toda la base.
- Probar una restauración en un proyecto de prueba; un respaldo no verificado no debe considerarse recuperable.
- Nunca copiar claves de producción, tokens o contraseñas dentro de archivos de respaldo compartidos.

## Incidentes

1. Si `/api/health` falla, revisar el último despliegue de Vercel y la conexión PostgreSQL.
2. Si `persistentStorage` es falso en producción, detener las pruebas con datos reales y corregir `DATABASE_URL`.
3. Si Venta Rápida devuelve 429, respetar el tiempo indicado; búsqueda, código de barras y POS manual siguen disponibles.
4. Si una operación queda dudosa, revisar ventas, kardex y auditoría antes de repetirla para evitar duplicados.

## Costos a vigilar

- Vercel: ejecución y ancho de banda.
- Supabase/PostgreSQL: almacenamiento, conexiones y respaldos.
- Groq u otro proveedor visual: cuota y solicitudes.
- Dominio, correo transaccional y soporte.
- Los terminales y pasarelas externas no forman parte del costo base de la tesis: Localito registra el pago manualmente y sus pantallas Webpay/Mercado Pago son simulaciones académicas.

## Reglas de seguridad

- Mantener claves únicamente como variables de entorno del backend.
- Rotar una credencial si aparece en un log, captura o repositorio.
- Conservar separación por negocio y rol; el vendedor no recibe métricas financieras históricas del dueño.
- Aplicar primero cambios de esquema compatibles (`ADD COLUMN IF NOT EXISTS`) antes de depender de nuevos campos.

## Despliegue de esta versión

1. Ejecutar `npm ci` y `npm run check` en un entorno limpio. Revisar la ejecución de GitHub Actions, no solo la presencia del workflow.
2. Respaldar PostgreSQL y probar restauración en una base separada.
3. Aplicar `db/schema.sql` en esa base: `negocios.preferencias` JSONB debe existir y conservar datos previos; fotos usan el campo TEXT `productos.imagen_url` existente.
4. Verificar configuración, foto/reemplazo/eliminación, consultas de historial con más de 100 eventos y filtros, y turnos con abonos que crucen medianoche.
5. Verificar dos peticiones concurrentes con la misma clave de venta, stock/deuda resultantes y accesos cruzados. La prueba local de memoria no acredita la concurrencia de PostgreSQL.
6. Confirmar salud y persistencia después de reiniciar el entorno de pruebas. Solo después publicar y realizar smoke tests aislados.

## Ventas pendientes y dispositivos

- La cola contiene únicamente ventas y pertenece a una cuenta en un origen concreto. No limpiar almacenamiento, cambiar de puerto/dominio ni reinstalar el navegador para resolver un rechazo.
- Descargar el JSON desde Sincronización antes de intervenir. No incluye token, pero puede contener identificadores y notas operativas: tratarlo como información privada y no subirlo a GitHub.
- Rechazos 400/404/409/413/422: revisar la causa, corregir catálogo/stock cuando corresponda y reintentar la venta original. Las demás ventas válidas pueden continuar.
- Errores de red, 401/403, 429 o 5xx: el ciclo se detiene; restablecer conexión, sesión o permisos, respetar límites y reintentar. No repetir un pago en la terminal externa.
- Colas antiguas sin propietario o corruptas se conservan para revisión. No hay importador ni reparación automática.
- Antes del cierre, verificar pendientes en todas las cuentas y dispositivos del turno. La interfaz solo bloquea por pendientes de la cuenta/origen actuales.
- El servidor usa los precios vigentes al sincronizar. Resolver cualquier diferencia respecto del cobro externo antes de dar por conciliado el turno.

## Credenciales e imágenes

- Se retiró del Markdown una contraseña administrativa previamente publicada. Rotarla por el flujo autorizado de recuperación/administración y revisar sesiones; retirar texto no elimina la exposición del historial Git.
- Las claves demo nunca se usan en producción. No restaurar contraseñas reales en `usuarios.md` ni en capturas.
- Las fotos inline aumentan el tamaño del catálogo y los respaldos. Vigilar tamaño/latencia y planificar almacenamiento de objetos al crecer; no existe eliminación automática del fondo.

Quedan pendientes la prueba integral PostgreSQL, restauración, cierre concurrente de varios puestos, dispositivos físicos y validación con usuarios. Esta guía no declara un despliegue productivo aprobado.
