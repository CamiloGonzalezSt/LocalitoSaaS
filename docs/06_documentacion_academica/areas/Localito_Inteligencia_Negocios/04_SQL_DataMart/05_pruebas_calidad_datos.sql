-- LOCALITO BI - PRUEBAS DE CALIDAD Y RECONCILIACIÓN (PROPUESTA)

-- 1) Líneas de detalle sin venta.
SELECT COUNT(*) AS detalles_huerfanos
FROM detalle_ventas dv
LEFT JOIN ventas v ON v.id = dv.venta_id
WHERE v.id IS NULL;

-- 2) Líneas sin producto.
SELECT COUNT(*) AS productos_huerfanos
FROM detalle_ventas dv
LEFT JOIN productos p ON p.id = dv.producto_id
WHERE p.id IS NULL;

-- 3) Reconciliación de ventas activas: total OLTP vs total neto del Data Mart.
WITH oltp AS (
    SELECT COALESCE(SUM(total),0) AS total
    FROM ventas
    WHERE estado_venta = 'active'
),
mart AS (
    SELECT COALESCE(SUM(neto_linea),0) AS total
    FROM bi.fact_venta_detalle
)
SELECT
    oltp.total AS total_oltp,
    mart.total AS total_mart,
    oltp.total - mart.total AS diferencia
FROM oltp CROSS JOIN mart;

-- 4) Duplicados de detalle en la fact.
SELECT detalle_id_origen, COUNT(*)
FROM bi.fact_venta_detalle
GROUP BY detalle_id_origen
HAVING COUNT(*) > 1;

-- 5) Surrogate keys sin resolver (debe retornar 0 filas).
SELECT *
FROM bi.fact_venta_detalle
WHERE fecha_key IS NULL
   OR negocio_key IS NULL
   OR producto_key IS NULL
   OR venta_key IS NULL;
