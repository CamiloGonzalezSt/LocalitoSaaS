-- LOCALITO BI - VISTAS / KPIs BASE (PROPUESTA)

CREATE OR REPLACE VIEW bi.vw_kpi_ventas_diarias AS
SELECT
    f.fecha_key,
    d.fecha,
    f.negocio_key,
    SUM(f.neto_linea) AS ventas_netas,
    COUNT(DISTINCT f.venta_id_origen) AS cantidad_ventas,
    SUM(f.cantidad) AS unidades_vendidas,
    CASE
        WHEN COUNT(DISTINCT f.venta_id_origen) > 0
        THEN ROUND(SUM(f.neto_linea)::numeric / COUNT(DISTINCT f.venta_id_origen), 0)
        ELSE 0
    END AS ticket_promedio
FROM bi.fact_venta_detalle f
JOIN bi.dim_fecha d ON d.fecha_key = f.fecha_key
GROUP BY f.fecha_key, d.fecha, f.negocio_key;

CREATE OR REPLACE VIEW bi.vw_ventas_producto AS
SELECT
    f.negocio_key,
    p.categoria,
    p.nombre AS producto,
    SUM(f.cantidad) AS unidades_vendidas,
    SUM(f.neto_linea) AS ventas_netas
FROM bi.fact_venta_detalle f
JOIN bi.dim_producto p ON p.producto_key = f.producto_key
GROUP BY f.negocio_key, p.categoria, p.nombre;

CREATE OR REPLACE VIEW bi.vw_ventas_vendedor AS
SELECT
    f.negocio_key,
    COALESCE(u.nombre, 'Sin usuario') AS vendedor,
    COUNT(DISTINCT f.venta_id_origen) AS cantidad_ventas,
    SUM(f.neto_linea) AS ventas_netas
FROM bi.fact_venta_detalle f
LEFT JOIN bi.dim_usuario u ON u.usuario_key = f.usuario_key
GROUP BY f.negocio_key, COALESCE(u.nombre, 'Sin usuario');
