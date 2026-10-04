# Modelo de datos de Localito

# Resumen ejecutivo

El modelo de Localito utiliza PostgreSQL y organiza datos por negocio. El diccionario de este documento se extrae de db/schema.sql, incluyendo columnas añadidas mediante ALTER TABLE. Se explican relaciones, restricciones, índices y correspondencia con operaciones de venta, fiado, compras y caja. La extracción describe el esquema del commit base; no prueba que la base productiva tenga cada columna aplicada.

# Introducción y fuentes

Un modelo de datos permite revisar qué conserva la aplicación y qué reglas impiden estados inconsistentes. La descripción se apoya en SQL y repository.ts (Equipo Localito, 2026). La documentación PostgreSQL fundamenta claves y restricciones (PostgreSQL Global Development Group, s. f.a). El diagrama conceptual se utiliza para explicar el dominio; el diccionario conserva los nombres reales de tablas y campos.

# Organización por dominios

Negocios, usuarios, sesiones y suscripciones forman la plataforma. Productos y categorías representan catálogo; movimientos_stock conserva trazabilidad. Ventas y detalle_ventas registran operaciones; cuentas_fiado y abonos_fiado representan crédito. Proveedores y órdenes organizan compras; sesiones y movimientos de caja representan turnos. Auditoría, alertas y reconocimientos complementan seguimiento.

![Relaciones conceptuales del núcleo operacional](figuras/clases.png)

*Relaciones conceptuales del núcleo operacional. Elaboración propia a partir del código.*

# Convenciones y tipos

Las claves principales son UUID y las relaciones se expresan mediante FOREIGN KEY. Los montos comerciales se almacenan principalmente como INTEGER, según el esquema, y el producto se presenta en pesos chilenos. Los campos JSONB conservan preferencias, detalles o estructuras variables; no reemplazan validación de su contenido en la API.

TIMESTAMP y TIMESTAMPTZ aparecen en tablas diferentes. Una estrategia uniforme de zona horaria requiere revisión para evitar ambigüedades en cierres que cruzan medianoche. El código aplica conversiones y reglas propias; el documento no afirma que todas las fechas ya estén normalizadas a una misma semántica.

Algunas tablas hijas no repiten negocio_id. Su pertenencia depende de la cabecera, por ejemplo detalle_ventas a través de venta_id. Los permisos deben verificar esa relación; una FOREIGN KEY hacia productos no comprueba por sí sola que el producto y la venta sean del mismo negocio.

# Diccionario del esquema auditado

Las tablas siguientes reproducen nombre, tipo y condiciones escritas en CREATE TABLE y ALTER TABLE. Se conserva DEFAULT, NOT NULL y referencia cuando aparecen. No se agregan restricciones propuestas como si existieran en SQL. Las descripciones del dominio son elaboraciones del análisis para ayudar al lector.

## Tabla negocios

Límite organizacional de los registros. Mantiene datos del comercio y preferencias. Su identidad se obtiene del usuario autenticado al ejecutar operaciones ordinarias.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| nombre | VARCHAR(120) | NOT NULL |
| rubro | VARCHAR(80) | NOT NULL |
| direccion | VARCHAR(180) | Sin condición adicional declarada |
| telefono | VARCHAR(40) | Sin condición adicional declarada |
| email_contacto | VARCHAR(120) | Sin condición adicional declarada |
| estado | VARCHAR(20) | NOT NULL DEFAULT 'activo' |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| preferencias | JSONB | NOT NULL DEFAULT '{}'::jsonb |

## Tabla usuarios

Cuentas que pertenecen a un negocio. El rol determina autorización y password_hash conserva el resultado de derivación de contraseña. El email es único según el esquema.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| nombre | VARCHAR(120) | NOT NULL |
| email | VARCHAR(160) | NOT NULL UNIQUE |
| password_hash | TEXT | NOT NULL |
| rol | VARCHAR(30) | NOT NULL |
| estado | VARCHAR(20) | NOT NULL DEFAULT 'activo' |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla sesiones

Sesiones persistidas mediante hash de token, expiración y revocación. La API recibe el token Bearer y consulta el hash sin almacenar la contraseña del usuario en la sesión.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| usuario_id | UUID | NOT NULL REFERENCES usuarios(id) |
| token_hash | VARCHAR(64) | NOT NULL UNIQUE |
| expira_en | TIMESTAMP | NOT NULL |
| revocada_en | TIMESTAMP | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla suscripciones

Estado y plan del negocio. Sus identificadores externos y proveedor no prueban cobro real; el MVP incluye controles y simulaciones académicas descritas por el código.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL UNIQUE REFERENCES negocios(id) ON DELETE CASCADE |
| plan | VARCHAR(20) | NOT NULL CHECK (plan IN ('basic', 'pro')) |
| estado | VARCHAR(20) | NOT NULL CHECK (estado IN ('trialing', 'active', 'past_due', 'expired', 'cancelled')) |
| inicio_prueba | TIMESTAMPTZ | Sin condición adicional declarada |
| fin_prueba | TIMESTAMPTZ | Sin condición adicional declarada |
| inicio_periodo | TIMESTAMPTZ | Sin condición adicional declarada |
| fin_periodo | TIMESTAMPTZ | Sin condición adicional declarada |
| fecha_cancelacion | TIMESTAMPTZ | Sin condición adicional declarada |
| proveedor_pago | VARCHAR(40) | Sin condición adicional declarada |
| cliente_externo_id | VARCHAR(160) | Sin condición adicional declarada |
| suscripcion_externa_id | VARCHAR(160) | Sin condición adicional declarada |
| plan_solicitado | VARCHAR(20) | CHECK (plan_solicitado IS NULL OR plan_solicitado IN ('basic', 'pro')) |
| fecha_solicitud_cambio | TIMESTAMPTZ | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMPTZ | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| fecha_actualizacion | TIMESTAMPTZ | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla password_reset_tokens

Tokens de recuperación almacenados como hash con expiración y uso. La tabla no acredita envío de correo sin configurar el proveedor.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| usuario_id | UUID | NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE |
| token_hash | VARCHAR(64) | NOT NULL UNIQUE |
| expira_en | TIMESTAMPTZ | NOT NULL |
| usado_en | TIMESTAMPTZ | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMPTZ | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla categorias

Clasificación de productos por negocio. La pertenencia de una categoría debe comprobarse al asociarla a un producto.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| nombre | VARCHAR(80) | NOT NULL |

## Tabla productos

Catálogo con precios, existencias, mínimos y control de stock. SKU, variante, unidad y proveedor se agregan mediante modificaciones compatibles del esquema.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| categoria_id | UUID | REFERENCES categorias(id) |
| nombre | VARCHAR(140) | NOT NULL |
| marca | VARCHAR(100) | Sin condición adicional declarada |
| descripcion | TEXT | Sin condición adicional declarada |
| codigo_barras | VARCHAR(80) | Sin condición adicional declarada |
| precio_costo | INTEGER | NOT NULL DEFAULT 0 |
| precio_venta | INTEGER | NOT NULL |
| stock_actual | INTEGER | NOT NULL DEFAULT 0 |
| stock_minimo | INTEGER | NOT NULL DEFAULT 0 |
| imagen_url | TEXT | Sin condición adicional declarada |
| fecha_vencimiento | DATE | Sin condición adicional declarada |
| activo | BOOLEAN | NOT NULL DEFAULT TRUE |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| sku | VARCHAR(80) | Sin condición adicional declarada |
| variante | VARCHAR(100) | Sin condición adicional declarada |
| unidad | VARCHAR(20) | NOT NULL DEFAULT 'unit' |
| unidades_por_pack | INTEGER | NOT NULL DEFAULT 1 |
| proveedor_id | UUID | Sin condición adicional declarada |
| controla_stock | BOOLEAN | NOT NULL DEFAULT TRUE |

## Tabla clientes

Personas o entidades del comercio asociables a ventas y deuda. Límite, plazo y bloqueo de crédito se evalúan para ventas fiadas.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| nombre | VARCHAR(140) | NOT NULL |
| telefono | VARCHAR(40) | Sin condición adicional declarada |
| email | VARCHAR(160) | Sin condición adicional declarada |
| direccion | VARCHAR(180) | Sin condición adicional declarada |
| observacion | TEXT | Sin condición adicional declarada |
| activo | BOOLEAN | NOT NULL DEFAULT TRUE |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| limite_credito | INTEGER | NOT NULL DEFAULT 0 |
| dias_credito | INTEGER | NOT NULL DEFAULT 30 |
| credito_bloqueado | BOOLEAN | NOT NULL DEFAULT FALSE |

## Tabla ventas

Cabecera de la transacción comercial. Conserva total, pagos, estado e idempotency_key, mientras las líneas se mantienen en detalle_ventas.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| usuario_id | UUID | REFERENCES usuarios(id) |
| cliente_id | UUID | REFERENCES clientes(id) |
| total | INTEGER | NOT NULL |
| metodo_pago | VARCHAR(30) | NOT NULL |
| estado_pago | VARCHAR(30) | NOT NULL |
| tipo_venta | VARCHAR(30) | NOT NULL DEFAULT 'normal' |
| estado_venta | VARCHAR(30) | NOT NULL DEFAULT 'active' |
| motivo_anulacion | TEXT | Sin condición adicional declarada |
| fecha_anulacion | TIMESTAMP | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| subtotal | INTEGER | NOT NULL DEFAULT 0 |
| descuento | INTEGER | NOT NULL DEFAULT 0 |
| detalle_pagos | JSONB | NOT NULL DEFAULT '[]'::jsonb |
| observacion | TEXT | Sin condición adicional declarada |
| idempotency_key | VARCHAR(120) | Sin condición adicional declarada |

## Tabla detalle_ventas

Líneas de la venta con producto, cantidad y precio aplicado. stock_descontado conserva si la línea afectó existencias para futuras devoluciones.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| venta_id | UUID | NOT NULL REFERENCES ventas(id) |
| producto_id | UUID | NOT NULL REFERENCES productos(id) |
| cantidad | INTEGER | NOT NULL |
| precio_unitario | INTEGER | NOT NULL |
| subtotal | INTEGER | NOT NULL |
| stock_descontado | BOOLEAN | Sin condición adicional declarada |

## Tabla movimientos_stock

Historia de cambios en existencias. Cada registro relaciona producto, negocio, tipo, cantidad y stock resultante; no debe confundirse con el stock actual del catálogo.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| producto_id | UUID | NOT NULL REFERENCES productos(id) |
| tipo | VARCHAR(30) | NOT NULL |
| cantidad | INTEGER | NOT NULL |
| stock_resultante | INTEGER | NOT NULL |
| motivo | TEXT | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| usuario_id | UUID | REFERENCES usuarios(id) |

## Tabla devoluciones_venta

Devoluciones asociadas a venta y negocio con detalle JSONB. Se verifica que cantidades acumuladas no excedan la operación original.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| venta_id | UUID | NOT NULL REFERENCES ventas(id) |
| usuario_id | UUID | REFERENCES usuarios(id) |
| total | INTEGER | NOT NULL |
| motivo | TEXT | NOT NULL |
| detalle | JSONB | NOT NULL |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla cuentas_fiado

Deuda vinculada a cliente y, cuando aplica, venta. Conserva monto original, saldo pendiente y vencimiento, permitiendo separar venta y dinero recibido.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| cliente_id | UUID | NOT NULL REFERENCES clientes(id) |
| venta_id | UUID | REFERENCES ventas(id) |
| monto_original | INTEGER | NOT NULL |
| saldo_pendiente | INTEGER | NOT NULL |
| estado | VARCHAR(30) | NOT NULL DEFAULT 'pendiente' |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| fecha_vencimiento | DATE | Sin condición adicional declarada |

## Tabla abonos_fiado

Pagos que disminuyen una cuenta. Su pertenencia se verifica mediante la cuenta_fiado_id; no contiene negocio_id directo.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| cuenta_fiado_id | UUID | NOT NULL REFERENCES cuentas_fiado(id) |
| monto | INTEGER | NOT NULL |
| metodo_pago | VARCHAR(30) | NOT NULL |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla pagos

Registros de pago asociados a venta o cliente. El identificador externo opcional no implica verificación automática con el banco.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| venta_id | UUID | REFERENCES ventas(id) |
| cliente_id | UUID | REFERENCES clientes(id) |
| monto | INTEGER | NOT NULL |
| metodo | VARCHAR(30) | NOT NULL |
| estado | VARCHAR(30) | NOT NULL |
| transaccion_externa_id | VARCHAR(120) | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla proveedores

Información de proveedores por negocio. Se relaciona con productos y órdenes para ingreso de mercadería.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| nombre | VARCHAR(140) | NOT NULL |
| nombre_contacto | VARCHAR(140) | Sin condición adicional declarada |
| telefono | VARCHAR(40) | Sin condición adicional declarada |
| email | VARCHAR(160) | Sin condición adicional declarada |
| observacion | TEXT | Sin condición adicional declarada |
| activo | BOOLEAN | NOT NULL DEFAULT TRUE |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla ordenes_compra

Cabecera de una compra con proveedor, estado y fechas. La recepción puede ser parcial y el detalle conserva cantidades pendientes.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| proveedor_id | UUID | NOT NULL REFERENCES proveedores(id) |
| estado | VARCHAR(30) | NOT NULL DEFAULT 'draft' |
| total | INTEGER | NOT NULL DEFAULT 0 |
| fecha_esperada | DATE | Sin condición adicional declarada |
| observacion | TEXT | Sin condición adicional declarada |
| fecha_recepcion | TIMESTAMP | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla detalle_ordenes_compra

Productos pedidos y recibidos con costo. La relación de orden y producto necesita verificar pertenencia al mismo negocio en las reglas de aplicación.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| orden_id | UUID | NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE |
| producto_id | UUID | NOT NULL REFERENCES productos(id) |
| cantidad | INTEGER | NOT NULL |
| cantidad_recibida | INTEGER | NOT NULL DEFAULT 0 |
| costo_unitario | INTEGER | NOT NULL |
| subtotal | INTEGER | NOT NULL |

## Tabla sesiones_caja

Turnos con apertura y cierre, monto inicial y efectivo esperado y contado. Un índice único parcial evita dos sesiones abiertas por negocio.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| usuario_apertura_id | UUID | REFERENCES usuarios(id) |
| fecha_apertura | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| monto_inicial | INTEGER | NOT NULL DEFAULT 0 |
| estado | VARCHAR(20) | NOT NULL DEFAULT 'open' |
| usuario_cierre_id | UUID | REFERENCES usuarios(id) |
| fecha_cierre | TIMESTAMP | Sin condición adicional declarada |
| efectivo_contado | INTEGER | Sin condición adicional declarada |
| efectivo_esperado | INTEGER | Sin condición adicional declarada |
| diferencia | INTEGER | Sin condición adicional declarada |
| observacion | TEXT | Sin condición adicional declarada |

## Tabla movimientos_caja

Ingresos, gastos o retiros con motivo y categoría. Puede relacionarse con sesión y usuario para revisar el turno.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| sesion_caja_id | UUID | REFERENCES sesiones_caja(id) |
| usuario_id | UUID | REFERENCES usuarios(id) |
| tipo | VARCHAR(30) | NOT NULL |
| monto | INTEGER | NOT NULL |
| motivo | TEXT | NOT NULL |
| categoria | VARCHAR(80) | NOT NULL DEFAULT 'Operación general' |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla auditoria

Acciones sensibles con usuario, negocio y detalle. El registro actual no se presenta como log inmutable ni como parte garantizada de todas las transacciones.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| usuario_id | UUID | REFERENCES usuarios(id) |
| accion | VARCHAR(80) | NOT NULL |
| entidad | VARCHAR(80) | NOT NULL |
| entidad_id | VARCHAR(120) | Sin condición adicional declarada |
| detalle | JSONB | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla alertas

Eventos de advertencia con severidad y estado. Su almacenamiento debe distinguirse de avisos automáticos externos que no estén configurados.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| tipo | VARCHAR(40) | NOT NULL |
| titulo | VARCHAR(140) | NOT NULL |
| descripcion | TEXT | Sin condición adicional declarada |
| severidad | VARCHAR(20) | NOT NULL |
| estado | VARCHAR(20) | NOT NULL DEFAULT 'abierta' |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla reconocimientos_ia

Resultado de reconocimiento y corrección de usuario. La existencia de la tabla no significa que todas las propuestas de Venta Rápida se almacenen en ella.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| producto_id | UUID | REFERENCES productos(id) |
| resultado | VARCHAR(160) | Sin condición adicional declarada |
| confianza | NUMERIC(5, 2) | Sin condición adicional declarada |
| fuente | VARCHAR(40) | NOT NULL |
| confirmado | BOOLEAN | NOT NULL DEFAULT FALSE |
| correccion_usuario | TEXT | Sin condición adicional declarada |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Tabla cierres_caja

Resúmenes de cierre con montos por medio, cantidades y observaciones. Se distinguen de sesiones_caja para evitar duplicar conceptos de turno y consolidación.

| Campo | Tipo | Condiciones SQL |
| --- | --- | --- |
| id | UUID | PRIMARY KEY |
| negocio_id | UUID | NOT NULL REFERENCES negocios(id) |
| usuario_id | UUID | REFERENCES usuarios(id) |
| fecha_caja | DATE | NOT NULL |
| cantidad_ventas | INTEGER | NOT NULL |
| cantidad_anuladas | INTEGER | NOT NULL |
| total_bruto | INTEGER | NOT NULL |
| total_recibido | INTEGER | NOT NULL |
| total_fiado | INTEGER | NOT NULL |
| ticket_promedio | INTEGER | NOT NULL |
| total_efectivo | INTEGER | NOT NULL DEFAULT 0 |
| total_tarjeta | INTEGER | NOT NULL DEFAULT 0 |
| total_transferencia | INTEGER | NOT NULL DEFAULT 0 |
| total_webpay | INTEGER | NOT NULL DEFAULT 0 |
| total_mercadopago | INTEGER | NOT NULL DEFAULT 0 |
| observacion | TEXT | Sin condición adicional declarada |
| fecha_cierre | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP |

# Relaciones e integridad

Una venta pertenece a un negocio y puede vincular usuario y cliente. Sus detalles referencian productos. Una cuenta fiada pertenece al cliente y puede surgir de la venta. Una compra pertenece al proveedor; sus detalles distinguen cantidad pedida y recibida. La caja relaciona sesión, usuario y movimientos. Las referencias opcionales deben interpretarse desde NULL y no desde la ausencia de reglas de aplicación.

Los campos de stock y monto no contienen en todos los casos CHECK de no negatividad. Las validaciones presentes en el backend son esenciales y una mejora puede fortalecer restricciones compatibles con el dominio. Esa recomendación no modifica el SQL ni se presenta como restricción implementada.

# Índices y unicidad

El esquema mantiene índices por negocio, fechas, producto y relaciones. El índice único parcial de ventas utiliza negocio_id e idempotency_key cuando la clave no es NULL. El de caja limita sesiones abiertas. Su presencia se comprobó en SQL; el beneficio de rendimiento específico necesita EXPLAIN y medición sobre datos conocidos.

# Seguridad por negocio y acceso a datos

RLS se activa sobre las tablas auditadas. La fuente no contiene políticas CREATE POLICY de identidad por fila. La API usa pg y consultas filtradas; una conexión privilegiada puede tener un alcance diferente a los roles de Data API. Por eso se deben revisar privilegios y exposición reales del proyecto Supabase (Supabase, s. f.b). No se atribuye aislamiento completo a la sola línea ENABLE ROW LEVEL SECURITY.

# Cambios de esquema y conservación

El init de la API ejecuta el esquema y añade campos con IF NOT EXISTS. Este enfoque facilita compatibilidad en el MVP, pero una operación comercial necesita historial de migraciones, revisión de impacto y respaldo. Semillas demo y actualizaciones de suscripción deben revisarse antes de aplicarlas sobre registros reales.

Una copia de base debe verificarse restaurando en otro ambiente y comprobando relaciones (PostgreSQL Global Development Group, s. f.c). Este documento describe campos y procedimientos; no confirma que la restauración o migración productiva se haya ejecutado en esta revisión.

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

El modelo relaciona los dominios principales del comercio y conserva mecanismos útiles de integridad e idempotencia. El diccionario permite revisar el esquema real sin reducirlo a un diagrama. Las prioridades de validación incluyen pertenencia entre tablas, concurrencia y correspondencia entre esquema versionado y base desplegada.

# Referencias

Consulta de fuentes: 03 y 04 de octubre de 2026. Las fichas ISO son resúmenes públicos; no se declara certificación.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

PostgreSQL Global Development Group (s. f.a). *PostgreSQL 16 Constraints*. https://www.postgresql.org/docs/16/ddl-constraints.html

PostgreSQL Global Development Group (s. f.c). *PostgreSQL 16 SQL Dump*. https://www.postgresql.org/docs/16/backup-dump.html

Supabase (s. f.b). *Row Level Security*. https://supabase.com/docs/guides/database/postgres/row-level-security

