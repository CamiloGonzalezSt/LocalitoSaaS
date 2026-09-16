-- LOCALITO BI - CARGA DE DIMENSIONES (PROPUESTA)
-- Ejecutar en ambiente de BI/staging, no directamente sobre producción sin revisión.

INSERT INTO bi.dim_metodo_pago (metodo_pago)
SELECT DISTINCT COALESCE(NULLIF(TRIM(metodo_pago), ''), 'unknown')
FROM ventas
ON CONFLICT (metodo_pago) DO NOTHING;

INSERT INTO bi.dim_negocio (negocio_id, nombre, rubro, estado)
SELECT id, nombre, rubro, estado
FROM negocios
ON CONFLICT (negocio_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rubro = EXCLUDED.rubro,
    estado = EXCLUDED.estado,
    fecha_carga = CURRENT_TIMESTAMP;

INSERT INTO bi.dim_producto (producto_id, negocio_id, nombre, categoria, marca, unidad, controla_stock, activo)
SELECT p.id, p.negocio_id, p.nombre, c.nombre, p.marca, p.unidad, p.controla_stock, p.activo
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
ON CONFLICT (producto_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    categoria = EXCLUDED.categoria,
    marca = EXCLUDED.marca,
    unidad = EXCLUDED.unidad,
    controla_stock = EXCLUDED.controla_stock,
    activo = EXCLUDED.activo,
    fecha_carga = CURRENT_TIMESTAMP;

INSERT INTO bi.dim_cliente (cliente_id, negocio_id, nombre, activo)
SELECT id, negocio_id, nombre, activo
FROM clientes
ON CONFLICT (cliente_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    activo = EXCLUDED.activo,
    fecha_carga = CURRENT_TIMESTAMP;

INSERT INTO bi.dim_usuario (usuario_id, negocio_id, nombre, rol, estado)
SELECT id, negocio_id, nombre, rol, estado
FROM usuarios
ON CONFLICT (usuario_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    estado = EXCLUDED.estado,
    fecha_carga = CURRENT_TIMESTAMP;

INSERT INTO bi.dim_venta (venta_id, tipo_venta, estado_venta, estado_pago)
SELECT id, tipo_venta, estado_venta, estado_pago
FROM ventas
ON CONFLICT (venta_id) DO UPDATE SET
    tipo_venta = EXCLUDED.tipo_venta,
    estado_venta = EXCLUDED.estado_venta,
    estado_pago = EXCLUDED.estado_pago,
    fecha_carga = CURRENT_TIMESTAMP;

-- Calendario basado en las fechas realmente presentes en ventas.
WITH bounds AS (
    SELECT
        COALESCE(MIN(fecha_creacion::date), CURRENT_DATE) AS min_d,
        COALESCE(MAX(fecha_creacion::date), CURRENT_DATE) AS max_d
    FROM ventas
),
calendar AS (
    SELECT d::date AS fecha
    FROM bounds,
         generate_series(min_d, max_d, interval '1 day') AS d
)
INSERT INTO bi.dim_fecha (
    fecha_key, fecha, dia, mes, nombre_mes, trimestre, anio, semana_iso, dia_semana, nombre_dia
)
SELECT
    TO_CHAR(fecha, 'YYYYMMDD')::integer,
    fecha,
    EXTRACT(DAY FROM fecha)::smallint,
    EXTRACT(MONTH FROM fecha)::smallint,
    TO_CHAR(fecha, 'TMMonth'),
    EXTRACT(QUARTER FROM fecha)::smallint,
    EXTRACT(YEAR FROM fecha)::smallint,
    EXTRACT(WEEK FROM fecha)::smallint,
    EXTRACT(ISODOW FROM fecha)::smallint,
    TO_CHAR(fecha, 'TMDay')
FROM calendar
ON CONFLICT (fecha_key) DO NOTHING;
