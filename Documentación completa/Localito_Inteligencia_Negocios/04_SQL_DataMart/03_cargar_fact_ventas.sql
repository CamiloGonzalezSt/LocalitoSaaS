-- LOCALITO BI - CARGA FACTVENTADETALLE (PROPUESTA)
-- Grano: una línea de producto por venta.
-- El descuento de cabecera se distribuye proporcionalmente por línea.
-- Las ventas anuladas se excluyen del mart principal de ventas netas.

WITH base AS (
    SELECT
        v.id AS venta_id,
        dv.id AS detalle_id,
        v.negocio_id,
        v.cliente_id,
        v.usuario_id,
        v.metodo_pago,
        v.fecha_creacion::date AS fecha,
        dv.producto_id,
        dv.cantidad::numeric AS cantidad,
        dv.precio_unitario,
        dv.subtotal AS bruto_linea,
        COALESCE(v.subtotal, 0) AS subtotal_venta,
        COALESCE(v.descuento, 0) AS descuento_venta,
        COALESCE(v.total, 0) AS total_venta
    FROM ventas v
    JOIN detalle_ventas dv ON dv.venta_id = v.id
    WHERE v.estado_venta = 'active'
),
calc AS (
    SELECT
        b.*,
        CASE
            WHEN b.subtotal_venta > 0
            THEN ROUND((b.bruto_linea::numeric / b.subtotal_venta) * b.descuento_venta)::integer
            ELSE 0
        END AS descuento_asignado
    FROM base b
)
INSERT INTO bi.fact_venta_detalle (
    venta_id_origen, detalle_id_origen, fecha_key, negocio_key, producto_key,
    cliente_key, usuario_key, metodo_pago_key, venta_key,
    cantidad, precio_unitario, bruto_linea, descuento_asignado, neto_linea
)
SELECT
    c.venta_id,
    c.detalle_id,
    TO_CHAR(c.fecha, 'YYYYMMDD')::integer,
    dn.negocio_key,
    dp.producto_key,
    dc.cliente_key,
    du.usuario_key,
    dmp.metodo_pago_key,
    dv.venta_key,
    c.cantidad,
    c.precio_unitario,
    c.bruto_linea,
    c.descuento_asignado,
    c.bruto_linea - c.descuento_asignado
FROM calc c
JOIN bi.dim_negocio dn ON dn.negocio_id = c.negocio_id
JOIN bi.dim_producto dp ON dp.producto_id = c.producto_id
LEFT JOIN bi.dim_cliente dc ON dc.cliente_id = c.cliente_id
LEFT JOIN bi.dim_usuario du ON du.usuario_id = c.usuario_id
LEFT JOIN bi.dim_metodo_pago dmp ON dmp.metodo_pago = COALESCE(NULLIF(TRIM(c.metodo_pago), ''), 'unknown')
JOIN bi.dim_venta dv ON dv.venta_id = c.venta_id
ON CONFLICT (detalle_id_origen) DO UPDATE SET
    fecha_key = EXCLUDED.fecha_key,
    negocio_key = EXCLUDED.negocio_key,
    producto_key = EXCLUDED.producto_key,
    cliente_key = EXCLUDED.cliente_key,
    usuario_key = EXCLUDED.usuario_key,
    metodo_pago_key = EXCLUDED.metodo_pago_key,
    venta_key = EXCLUDED.venta_key,
    cantidad = EXCLUDED.cantidad,
    precio_unitario = EXCLUDED.precio_unitario,
    bruto_linea = EXCLUDED.bruto_linea,
    descuento_asignado = EXCLUDED.descuento_asignado,
    neto_linea = EXCLUDED.neto_linea,
    fecha_carga = CURRENT_TIMESTAMP;
