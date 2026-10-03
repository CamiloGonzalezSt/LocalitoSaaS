# Modelo de datos — Localito

La definición ejecutable se encuentra en `db/schema.sql`.

## Entidades principales
- negocios
- usuarios
- sesiones
- suscripciones
- categorias
- productos
- clientes
- ventas
- detalle_ventas
- movimientos_stock
- devoluciones_venta
- cuentas_fiado
- abonos_fiado
- pagos
- proveedores
- ordenes_compra
- detalle_ordenes_compra
- sesiones_caja
- movimientos_caja
- auditoria
- alertas
- reconocimientos_ia
- cierres_caja

## Relaciones principales
- Un negocio posee usuarios, productos, clientes, ventas, proveedores, cajas y auditoría.
- Una venta pertenece a un negocio y puede asociarse a usuario y cliente.
- Una venta tiene múltiples detalles de venta.
- Un producto puede tener múltiples movimientos de stock.
- Un cliente puede tener múltiples cuentas de fiado y abonos.
- Un proveedor puede tener órdenes de compra.
- Una sesión de caja agrupa movimientos.

## Evidencia
`db/schema.sql` crea tablas, claves foráneas, índices, restricciones y habilita RLS en Supabase.
