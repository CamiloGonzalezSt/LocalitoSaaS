CREATE TABLE IF NOT EXISTS negocios (
  id UUID PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  rubro VARCHAR(80) NOT NULL,
  direccion VARCHAR(180),
  telefono VARCHAR(40),
  email_contacto VARCHAR(120),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol VARCHAR(30) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira_en TIMESTAMP NOT NULL,
  revocada_en TIMESTAMP,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token_hash);
CREATE INDEX IF NOT EXISTS idx_usuarios_negocio ON usuarios(negocio_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_reset_tokens_token_hash_length CHECK (char_length(token_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_usuario_activo
  ON password_reset_tokens(usuario_id, expira_en)
  WHERE usado_en IS NULL;

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  categoria_id UUID REFERENCES categorias(id),
  nombre VARCHAR(140) NOT NULL,
  marca VARCHAR(100),
  descripcion TEXT,
  codigo_barras VARCHAR(80),
  precio_costo INTEGER NOT NULL DEFAULT 0,
  precio_venta INTEGER NOT NULL,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  fecha_vencimiento DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE productos ADD COLUMN IF NOT EXISTS sku VARCHAR(80);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS variante VARCHAR(100);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS unidad VARCHAR(20) NOT NULL DEFAULT 'unit';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS unidades_por_pack INTEGER NOT NULL DEFAULT 1;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor_id UUID;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS controla_stock BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_productos_negocio ON productos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(negocio_id, codigo_barras);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre VARCHAR(140) NOT NULL,
  telefono VARCHAR(40),
  email VARCHAR(160),
  direccion VARCHAR(180),
  observacion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS limite_credito INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dias_credito INTEGER NOT NULL DEFAULT 30;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS credito_bloqueado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_id UUID REFERENCES usuarios(id),
  cliente_id UUID REFERENCES clientes(id),
  total INTEGER NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL,
  estado_pago VARCHAR(30) NOT NULL,
  tipo_venta VARCHAR(30) NOT NULL DEFAULT 'normal',
  estado_venta VARCHAR(30) NOT NULL DEFAULT 'active',
  motivo_anulacion TEXT,
  fecha_anulacion TIMESTAMP,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado_venta VARCHAR(30) NOT NULL DEFAULT 'active';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMP;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS descuento INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS detalle_pagos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS observacion TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_idempotencia ON ventas(negocio_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id UUID PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES ventas(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  tipo VARCHAR(30) NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_resultante INTEGER NOT NULL,
  motivo TEXT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE movimientos_stock ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);

CREATE TABLE IF NOT EXISTS devoluciones_venta (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  venta_id UUID NOT NULL REFERENCES ventas(id),
  usuario_id UUID REFERENCES usuarios(id),
  total INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  detalle JSONB NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cuentas_fiado (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  venta_id UUID REFERENCES ventas(id),
  monto_original INTEGER NOT NULL,
  saldo_pendiente INTEGER NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cuentas_fiado ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

CREATE TABLE IF NOT EXISTS abonos_fiado (
  id UUID PRIMARY KEY,
  cuenta_fiado_id UUID NOT NULL REFERENCES cuentas_fiado(id),
  monto INTEGER NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  venta_id UUID REFERENCES ventas(id),
  cliente_id UUID REFERENCES clientes(id),
  monto INTEGER NOT NULL,
  metodo VARCHAR(30) NOT NULL,
  estado VARCHAR(30) NOT NULL,
  transaccion_externa_id VARCHAR(120),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre VARCHAR(140) NOT NULL,
  nombre_contacto VARCHAR(140),
  telefono VARCHAR(40),
  email VARCHAR(160),
  observacion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  ALTER TABLE productos ADD CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  estado VARCHAR(30) NOT NULL DEFAULT 'draft',
  total INTEGER NOT NULL DEFAULT 0,
  fecha_esperada DATE,
  observacion TEXT,
  fecha_recepcion TIMESTAMP,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_ordenes_compra (
  id UUID PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  cantidad_recibida INTEGER NOT NULL DEFAULT 0,
  costo_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sesiones_caja (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_apertura_id UUID REFERENCES usuarios(id),
  fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_inicial INTEGER NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'open',
  usuario_cierre_id UUID REFERENCES usuarios(id),
  fecha_cierre TIMESTAMP,
  efectivo_contado INTEGER,
  efectivo_esperado INTEGER,
  diferencia INTEGER,
  observacion TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sesion_caja_abierta ON sesiones_caja(negocio_id) WHERE estado = 'open';

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  sesion_caja_id UUID REFERENCES sesiones_caja(id),
  usuario_id UUID REFERENCES usuarios(id),
  tipo VARCHAR(30) NOT NULL,
  monto INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  categoria VARCHAR(80) NOT NULL DEFAULT 'Operación general',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE movimientos_caja ADD COLUMN IF NOT EXISTS categoria VARCHAR(80) NOT NULL DEFAULT 'Operación general';

CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_id UUID REFERENCES usuarios(id),
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id VARCHAR(120),
  detalle JSONB,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_negocio_fecha ON auditoria(negocio_id, fecha_creacion DESC);

CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  tipo VARCHAR(40) NOT NULL,
  titulo VARCHAR(140) NOT NULL,
  descripcion TEXT,
  severidad VARCHAR(20) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierta',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reconocimientos_ia (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  producto_id UUID REFERENCES productos(id),
  resultado VARCHAR(160),
  confianza NUMERIC(5, 2),
  fuente VARCHAR(40) NOT NULL,
  confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  correccion_usuario TEXT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE reconocimientos_ia ADD COLUMN IF NOT EXISTS correccion_usuario TEXT;

CREATE TABLE IF NOT EXISTS cierres_caja (
  id UUID PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_id UUID REFERENCES usuarios(id),
  fecha_caja DATE NOT NULL,
  cantidad_ventas INTEGER NOT NULL,
  cantidad_anuladas INTEGER NOT NULL,
  total_bruto INTEGER NOT NULL,
  total_recibido INTEGER NOT NULL,
  total_fiado INTEGER NOT NULL,
  ticket_promedio INTEGER NOT NULL,
  total_efectivo INTEGER NOT NULL DEFAULT 0,
  total_tarjeta INTEGER NOT NULL DEFAULT 0,
  total_transferencia INTEGER NOT NULL DEFAULT 0,
  total_webpay INTEGER NOT NULL DEFAULT 0,
  observacion TEXT,
  fecha_cierre TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cierres_caja_negocio_fecha ON cierres_caja(negocio_id, fecha_caja);

-- Índices de relaciones y filtros multi-negocio. PostgreSQL no crea índices
-- automáticamente para las columnas que contienen claves foráneas.
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_categorias_negocio ON categorias(negocio_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_negocio ON clientes(negocio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_negocio_fecha ON ventas(negocio_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON detalle_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_negocio_fecha ON movimientos_stock(negocio_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_usuario ON movimientos_stock(usuario_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_negocio ON devoluciones_venta(negocio_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_venta ON devoluciones_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_usuario ON devoluciones_venta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_fiado_negocio ON cuentas_fiado(negocio_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_fiado_cliente ON cuentas_fiado(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_fiado_venta ON cuentas_fiado(venta_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fiado_cuenta ON abonos_fiado(cuenta_fiado_id);
CREATE INDEX IF NOT EXISTS idx_pagos_negocio ON pagos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_pagos_venta ON pagos(venta_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_negocio ON proveedores(negocio_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_negocio ON ordenes_compra(negocio_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ordenes_orden ON detalle_ordenes_compra(orden_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ordenes_producto ON detalle_ordenes_compra(producto_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_negocio ON sesiones_caja(negocio_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario_apertura ON sesiones_caja(usuario_apertura_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario_cierre ON sesiones_caja(usuario_cierre_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_negocio_fecha ON movimientos_caja(negocio_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sesion ON movimientos_caja(sesion_caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_usuario ON movimientos_caja(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_alertas_negocio ON alertas(negocio_id);
CREATE INDEX IF NOT EXISTS idx_reconocimientos_negocio ON reconocimientos_ia(negocio_id);
CREATE INDEX IF NOT EXISTS idx_reconocimientos_producto ON reconocimientos_ia(producto_id);
CREATE INDEX IF NOT EXISTS idx_cierres_caja_usuario ON cierres_caja(usuario_id);

-- Supabase expone por defecto el esquema public mediante su Data API. La aplicación
-- usa una conexión PostgreSQL del servidor, por lo que RLS queda cerrado sin
-- publicar políticas de acceso directo desde el navegador.
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_fiado ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos_fiado ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconocimientos_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres_caja ENABLE ROW LEVEL SECURITY;

-- Localito no consulta estas tablas mediante la Data API. En Supabase se
-- revocan sus permisos para anon/authenticated como defensa adicional; el
-- bloque se omite en PostgreSQL local cuando esos roles no existen.
DO $$
DECLARE
  app_tables TEXT := 'negocios, usuarios, sesiones, password_reset_tokens, categorias, productos, clientes, ventas, detalle_ventas, movimientos_stock, devoluciones_venta, cuentas_fiado, abonos_fiado, pagos, proveedores, ordenes_compra, detalle_ordenes_compra, sesiones_caja, movimientos_caja, auditoria, alertas, reconocimientos_ia, cierres_caja';
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM anon', app_tables);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM authenticated', app_tables);
  END IF;
END $$;
