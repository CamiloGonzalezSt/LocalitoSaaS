# Operación de Localito en producción

## Verificación diaria

- Consultar `GET /api/health`: debe responder `status: ok`, `persistentStorage: true` y `storage: postgres`.
- `quickSaleConfigured`, `invoiceAiConfigured` y `passwordResetEmailConfigured` indican si los servicios opcionales están disponibles, sin revelar credenciales.
- Realizar una venta demo pequeña, comprobar inventario y revisar el cierre de caja.

## Respaldos

- La base PostgreSQL/Supabase es la fuente de verdad. Habilitar respaldos del proveedor antes de incorporar negocios reales.
- Exportar periódicamente productos desde **Negocio → Datos y trazabilidad**.
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
