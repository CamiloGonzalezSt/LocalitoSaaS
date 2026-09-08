# Operación de Localito en producción

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
