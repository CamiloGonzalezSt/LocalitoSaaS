-- LOCALITO BI - MODELO DIMENSIONAL PROPUESTO
-- Propósito académico: Data Mart de Ventas con metodología Kimball.
-- NO ejecutado automáticamente contra producción. Validar primero en una BD separada.

CREATE SCHEMA IF NOT EXISTS bi;

CREATE TABLE IF NOT EXISTS bi.dim_fecha (
    fecha_key       INTEGER PRIMARY KEY,       -- YYYYMMDD
    fecha           DATE NOT NULL UNIQUE,
    dia             SMALLINT NOT NULL,
    mes             SMALLINT NOT NULL,
    nombre_mes      VARCHAR(20) NOT NULL,
    trimestre       SMALLINT NOT NULL,
    anio            SMALLINT NOT NULL,
    semana_iso      SMALLINT NOT NULL,
    dia_semana      SMALLINT NOT NULL,
    nombre_dia      VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS bi.dim_negocio (
    negocio_key     BIGSERIAL PRIMARY KEY,
    negocio_id      UUID NOT NULL UNIQUE,
    nombre          VARCHAR(120) NOT NULL,
    rubro           VARCHAR(80) NOT NULL,
    estado          VARCHAR(20) NOT NULL,
    fecha_carga     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi.dim_producto (
    producto_key    BIGSERIAL PRIMARY KEY,
    producto_id     UUID NOT NULL UNIQUE,
    negocio_id      UUID NOT NULL,
    nombre          VARCHAR(140) NOT NULL,
    categoria       VARCHAR(80),
    marca           VARCHAR(100),
    unidad          VARCHAR(20),
    controla_stock  BOOLEAN NOT NULL,
    activo          BOOLEAN NOT NULL,
    fecha_carga     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi.dim_cliente (
    cliente_key     BIGSERIAL PRIMARY KEY,
    cliente_id      UUID NOT NULL UNIQUE,
    negocio_id      UUID NOT NULL,
    nombre          VARCHAR(140) NOT NULL,
    activo          BOOLEAN NOT NULL,
    fecha_carga     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi.dim_usuario (
    usuario_key     BIGSERIAL PRIMARY KEY,
    usuario_id      UUID NOT NULL UNIQUE,
    negocio_id      UUID NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    rol             VARCHAR(30) NOT NULL,
    estado          VARCHAR(20) NOT NULL,
    fecha_carga     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi.dim_metodo_pago (
    metodo_pago_key SMALLSERIAL PRIMARY KEY,
    metodo_pago     VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bi.dim_venta (
    venta_key       BIGSERIAL PRIMARY KEY,
    venta_id        UUID NOT NULL UNIQUE,
    tipo_venta      VARCHAR(30) NOT NULL,
    estado_venta    VARCHAR(30) NOT NULL,
    estado_pago     VARCHAR(30) NOT NULL,
    fecha_carga     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi.fact_venta_detalle (
    fact_venta_key      BIGSERIAL PRIMARY KEY,
    venta_id_origen     UUID NOT NULL,
    detalle_id_origen   UUID NOT NULL UNIQUE,
    fecha_key           INTEGER NOT NULL REFERENCES bi.dim_fecha(fecha_key),
    negocio_key         BIGINT NOT NULL REFERENCES bi.dim_negocio(negocio_key),
    producto_key        BIGINT NOT NULL REFERENCES bi.dim_producto(producto_key),
    cliente_key         BIGINT REFERENCES bi.dim_cliente(cliente_key),
    usuario_key         BIGINT REFERENCES bi.dim_usuario(usuario_key),
    metodo_pago_key     SMALLINT REFERENCES bi.dim_metodo_pago(metodo_pago_key),
    venta_key           BIGINT NOT NULL REFERENCES bi.dim_venta(venta_key),
    cantidad            NUMERIC(14,3) NOT NULL,
    precio_unitario     INTEGER NOT NULL,
    bruto_linea         INTEGER NOT NULL,
    descuento_asignado  INTEGER NOT NULL DEFAULT 0,
    neto_linea          INTEGER NOT NULL,
    fecha_carga         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fact_venta_fecha ON bi.fact_venta_detalle(fecha_key);
CREATE INDEX IF NOT EXISTS idx_fact_venta_negocio ON bi.fact_venta_detalle(negocio_key);
CREATE INDEX IF NOT EXISTS idx_fact_venta_producto ON bi.fact_venta_detalle(producto_key);
