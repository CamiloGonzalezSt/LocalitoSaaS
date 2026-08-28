# Localito

Localito es una PWA académica multi-negocio para almacenes y comercios de barrio. Reúne punto de venta, inventario, caja, compras, proveedores, fiado y reconocimiento de productos desde el celular.

**Estado del proyecto:** versión para tesis. El núcleo operacional funciona con datos persistentes, pero las pasarelas de pago son simulaciones académicas y el cumplimiento tributario chileno (SII, boleta y factura electrónica) queda fuera de esta iteración. El alcance verificable está centralizado en [docs/Alcance-Tesis.md](docs/Alcance-Tesis.md).

## Funcionalidades implementadas

- Administrador de plataforma separado del negocio: crea locales, crea su primer dueño, agrega vendedores y puede suspender o reactivar locales y usuarios.
- Suscripciones SaaS por negocio con prueba Pro de 30 días, planes Básico/Pro, permisos centralizados, modo de solo lectura al vencer y métricas de MRR/pruebas en plataforma.
- Registro público de un negocio y su primer dueño con prueba Pro de 30 días; el administrador de plataforma también puede crear y administrar locales para la demostración.
- Recuperación de contraseña por correo con enlace de un solo uso, vencimiento de 30 minutos y revocación de sesiones anteriores.
- Inicio y cierre de sesión con contraseñas `scrypt`, tokens aleatorios almacenados como hash, expiración y aislamiento por negocio.
- Roles `system_admin`, `owner` y `seller` protegidos tanto en la interfaz como en la API.
- Punto de venta con búsqueda, código de barras, descuento, notas y pagos simples o divididos.
- Idempotencia de ventas para evitar cobros duplicados al reintentar desde una red inestable.
- Navegación simplificada por rol: dueño (`Inicio`, `Vender`, `Inventario`, `Clientes`, `Caja`, `Reportes`) y vendedor (`Vender`, `Inventario`, `Clientes`, `Caja`). Configuración vive en el engranaje; crear/importar productos y Venta Rápida se abren dentro de su flujo natural.
- Inventario con SKU, variante, unidad, packs, vencimiento, stock mínimo, productos sin control de stock y kardex de movimientos.
- Alertas de reposición y vencimiento a 30 días.
- Clientes con cupo, plazo, bloqueo de crédito, cuentas por cobrar, vencimientos, abonos y recordatorios por WhatsApp.
- Anulación de venta y devoluciones parciales con reposición de stock y ajuste de deuda.
- Proveedores, órdenes de compra, recepción de mercadería y actualización del costo promedio ponderado.
- Caja por turno: apertura, ingresos, gastos operativos categorizados, retiros, cierre, efectivo esperado, contado y diferencia.
- Reportes por período, vendedor y categoría; comparación con el período anterior, ventas por hora/categoría/vendedor, alertas operativas, filtros guardados por local y exportación CSV. El reporte financiero muestra ventas netas, margen bruto estimado, gastos operativos y resultado estimado; los cálculos de utilidad se presentan como estimaciones porque usan el costo vigente del catálogo.
- Historial de auditoría para operaciones críticas.
- Asistente automático de carga inicial para locales nuevos, con categorías sugeridas por rubro, progreso reanudable y acceso posterior desde el menú.
- Importación masiva y exportación de productos en CSV: plantilla compatible con Excel, vista previa, validación por fila y prevención de duplicados, hasta 500 productos por carga.
- Cola local para ventas y ajustes de stock cuando se pierde la conexión.
- PWA instalable con caché de aplicación y navegación sin conexión.
- Lectura de códigos con ZXing cargado bajo demanda.
- **Venta Rápida**: una fotografía puede proponer varios productos y cantidades usando exclusivamente el catálogo del negocio; el vendedor corrige la propuesta y la agrega al ticket POS existente. La lectura de códigos de barras continúa disponible como alternativa.
- Ingreso de mercadería desde una foto de factura: extracción estructurada, coincidencia con catálogo, revisión obligatoria de cantidades/costos/precios, creación de productos y recepción de stock sin duplicar la factura.
- Cobros presenciales en tres pasos: armar ticket, presionar **Cobrar** y elegir el medio. Tarjeta, transferencia, Webpay y Mercado Pago se registran como medios externos: el vendedor confirma manualmente el pago antes de crear la venta o descontar stock.
- Tema claro, oscuro o según el sistema, persistido por usuario, con tipografía Source Sans 3 y controles táctiles mobile-first.

## Requisitos

- Node.js 20 o superior.
- npm 10 o pnpm.
- PostgreSQL 16 o Docker Desktop para persistencia. Sin base disponible, la API usa memoria.

## Puesta en marcha

```powershell
npm install
Copy-Item .env.example .env
npm run db:up
npm run dev:api
```

En otra terminal:

```powershell
npm run dev:web
```

Abrir `http://localhost:5173`. La API escucha por defecto en `http://localhost:3000` y su estado se consulta en `http://localhost:3000/health`.

El procedimiento de monitoreo, respaldo e incidentes está documentado en [docs/Operacion-Produccion.md](docs/Operacion-Produccion.md).

La API ejecuta [db/schema.sql](db/schema.sql) al conectarse a PostgreSQL. El modo `memory` se permite solamente durante desarrollo sin una base configurada. En producción o Vercel, una URL ausente o una inicialización fallida detiene el backend: nunca se aceptan ventas o productos que puedan desaparecer al reiniciar la función.

## Variables de entorno

```env
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://localito:localito@localhost:5432/localito
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
PLATFORM_ADMIN_EMAIL=caj.gonzalez.st@gmail.com
PLATFORM_ADMIN_PASSWORD=change-this-before-production
SESSION_SECRET=change-this-in-production-with-a-long-random-value
APP_URL=http://localhost:5173
EMAIL_PROVIDER=gmail
GMAIL_USER=tu-correo@gmail.com
GMAIL_APP_PASSWORD=
EMAIL_FROM=Localito <tu-correo@gmail.com>
RESEND_API_KEY=
VISION_PROVIDER=groq
GROQ_API_KEY=
GROQ_VISION_MODEL=qwen/qwen3.6-27b
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6
```

Para la demostración académica configure `VISION_PROVIDER=groq`, `GROQ_API_KEY` y `GROQ_VISION_MODEL=qwen/qwen3.6-27b`. Groq se usa desde el backend y permite ejecutar reconocimiento real sujeto a la cuota de su plan gratuito. `OPENAI_API_KEY` y `OPENAI_VISION_MODEL` se conservan como alternativa opcional; si no se fuerza un proveedor, Localito prefiere Groq cuando ambas claves existen. Las imágenes se reducen en el navegador, se procesan sin guardarlas en Localito y toda respuesta externa vuelve a validarse antes de afectar el flujo. Ninguna clave debe exponerse en el frontend, llevar el prefijo `VITE_` ni subirse al repositorio.

`SESSION_SECRET` firma las sesiones del modo demostración serverless. En Vercel, configure además `DATABASE_URL` (o `POSTGRES_URL` mediante la integración de Supabase) para que registros, ventas y cambios sobrevivan entre invocaciones. Use la URL del **Transaction pooler** de Supabase para funciones serverless.

Los datos demo se insertan únicamente cuando PostgreSQL no contiene ningún negocio operativo. Sus identificadores legibles se convierten en UUID estables y los conflictos nunca sobrescriben precios, stock, contraseñas ni datos modificados por el usuario durante un cold start.

`PLATFORM_ADMIN_PASSWORD` es obligatoria para crear inicialmente el administrador en producción. Una vez creada la cuenta, su clave se cambia mediante recuperación por correo; modificar esta variable no sobrescribe la contraseña existente. Nunca publique la clave en el frontend ni en el repositorio.

La recuperación de contraseña admite dos proveedores desde la API. Para el envío temporal con Gmail configure `EMAIL_PROVIDER=gmail`, `GMAIL_USER`, una `GMAIL_APP_PASSWORD` generada por Google, `EMAIL_FROM=Localito <el-mismo-correo@gmail.com>` y `APP_URL=https://localito-saas.vercel.app`. La cuenta de Google debe tener verificación en dos pasos; no use su contraseña normal. Como opción definitiva, configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` y un `EMAIL_FROM` perteneciente a un dominio verificado. Todas estas variables son privadas y nunca deben llevar el prefijo `VITE_`.

## Migración a Supabase

1. Abra **Connect** en el proyecto Supabase y copie la URI de **Transaction pooler**.
2. En Vercel, agregue esa URI como `DATABASE_URL` para Production, Preview y Development. Agregue también `PLATFORM_ADMIN_EMAIL`, `PLATFORM_ADMIN_PASSWORD` y un `SESSION_SECRET` largo.
3. Vuelva a desplegar. Al arrancar, la API verifica el esquema y crea el administrador configurado.

Las tablas tienen RLS activado y sin políticas públicas: Localito accede exclusivamente desde la API mediante PostgreSQL. Para migraciones manuales o herramientas de escritorio se puede usar la conexión directa; para Vercel debe mantenerse el pooler de transacciones.

## Acceso demo

| Rol | Correo | Clave |
| --- | --- | --- |
| Dueño Donde Juanita | `juanita@localito.demo` | `Duoc2026` |
| Vendedor Donde Juanita | `juanita+vendedor@localito.demo` | `Duoc2026V` |
| Dueño Botilleria Don Pepe | `donpepe@localito.demo` | `Duoc2026` |
| Vendedor Botilleria Don Pepe | `donpepe+vendedor@localito.demo` | `Duoc2026V` |
| Dueño Peluqueria La Esquina | `peluqueria@localito.demo` | `Duoc2026` |
| Vendedor Peluqueria La Esquina | `peluqueria+vendedor@localito.demo` | `Duoc2026V` |

Los negocios nuevos pueden crearse desde **Crear cuenta** en la pantalla de acceso o por el administrador de plataforma durante la demostración. Cada usuario puede solicitar por correo el restablecimiento de su contraseña; la nueva clave debe tener al menos 10 caracteres, una letra y un número. El envío real depende de configurar un proveedor de correo en las variables de entorno.

En desarrollo local, si no se define otra clave, el administrador usa `caj.gonzalez.st@gmail.com` / `AdminLocalito2026`. Ese valor de desarrollo se deshabilita automáticamente con `NODE_ENV=production`.

## Flujo sugerido de demostración

1. Iniciar sesión como administrador, crear un local y su usuario dueño.
2. Iniciar sesión como dueño: si el catálogo está vacío, Localito abre **Carga inicial** automáticamente para elegir factura con IA, plantilla CSV o carga manual.
3. Confirmar los productos importados, agregar un vendedor y revisar existencias en **Inventario**.
4. Abrir una caja con el monto inicial.
5. Abrir **Vender → Venta Rápida con foto**, fotografiar varios productos, revisar cantidades y agregarlos al ticket; luego pulsar **Cobrar**, elegir el medio y confirmar.
6. Crear un cliente con cupo y realizar una venta fiada.
7. Revisar cuentas vencidas y abrir el recordatorio por WhatsApp.
8. Desde la gestión de inventario, fotografiar una factura, revisar sus coincidencias y precios de venta, y confirmarla para actualizar stock y costo promedio.
9. Anular una venta o registrar una devolución parcial.
10. Importar/exportar catálogo y revisar movimientos de stock y auditoría.
11. Contar el efectivo y cerrar la caja para ver la diferencia.

## Venta Rápida, cámara y código de barras

**Venta Rápida** permite tomar o subir una foto con varios productos. El navegador reduce la imagen y la API solicita una respuesta estructurada contra el catálogo aislado del negocio. Los IDs que no pertenecen al catálogo se descartan; precios y stock siempre se completan desde la base de Localito. Coincidencias ambiguas y productos no reconocidos deben confirmarse, cambiarse, buscarse o ignorarse antes de continuar.

Cada producto y cantidad requieren confirmación humana antes de habilitar el envío al ticket. Los conteos repetidos o visualmente dudosos muestran una alerta específica. La API aplica un límite preventivo de 40 análisis por usuario y hora y, si Groq alcanza su cuota gratuita, informa el tiempo de espera indicado por el proveedor cuando está disponible.

Al presionar **Agregar a la venta**, Localito incorpora las cantidades al ticket existente. La detección no crea una venta, no descuenta stock y no escribe kardex: esas operaciones siguen ocurriendo únicamente cuando el POS confirma el cobro. Si la cantidad supera el stock y el producto controla existencias, se muestra una advertencia y se aplica la misma restricción del POS.

La lectura exacta de código de barras con ZXing se mantiene dentro de Venta Rápida y puede utilizarse sin análisis visual. El reconocimiento multiproducto necesita conexión y un proveedor configurado (`GROQ_API_KEY` recomendado para la tesis u `OPENAI_API_KEY` como alternativa); búsqueda, código, ticket y el resto del soporte offline continúan funcionando sin ella.

La cámara en vivo requiere HTTPS en iPhone y en la mayoría de los navegadores móviles. Como alternativa se puede usar **Cámara del teléfono** o **Subir foto**. Para probar un código físico, guarde antes su valor real en el catálogo.

### Ingreso desde factura

El dueño puede abrir la carga de factura desde la gestión de inventario y tomar una foto JPG, PNG o WebP. La IA propone proveedor, folio, fecha, productos, categorías, cantidades y costos; los productos de baja confianza quedan advertidos y cada precio de venta debe quedar confirmado antes de ingresar. Al confirmar, Localito reutiliza o crea el proveedor, reutiliza o crea productos, registra una orden recibida y aumenta el stock. El folio y una clave de importación evitan dobles ingresos por reintentos.

Este flujo organiza inventario a partir de un documento comercial; no emite, valida ni contabiliza facturas electrónicas ante el SII.

## Medios de pago presenciales

Localito registra efectivo, tarjeta en terminal externa, transferencia, Webpay externo, Mercado Pago externo, fiado y pago mixto. El vendedor cobra fuera de Localito, ingresa manualmente el monto en el terminal o aplicación correspondiente y confirma en la app que recibió el pago. El MVP no envía montos a un POS, no genera QR de Mercado Pago y no almacena datos de tarjeta.

Para la tesis, la contratación de planes usa simulaciones sandbox: Webpay y Mercado Pago activan una prueba sin mover dinero, mientras que la transferencia queda pendiente de aprobación manual. El cobro Webpay mostrado desde fiados también es una simulación académica; no debe utilizarse para cobrar a clientes reales.

## Calidad y verificación

```powershell
npm run typecheck
npm run build
npm run test -w apps/api
```

Las pruebas automatizadas cubren hashes de contraseñas y sesiones, idempotencia de ventas, límites de crédito, caja, compras, costo promedio, inventario, importación masiva reintentable, Venta Rápida multiproducto, rechazo de IDs ajenos al catálogo, cantidades agrupadas, esquemas estrictos de visión, extracción de facturas, recepción de stock y prevención de duplicados. La matriz manual vive en [docs/Matriz-Pruebas-Localito.md](docs/Matriz-Pruebas-Localito.md) y la trazabilidad anterior → nueva ubicación está en [docs/Matriz-Regresion-Rediseno.md](docs/Matriz-Regresion-Rediseno.md).

## Planes y permisos

Todo negocio nuevo recibe una prueba de **Localito Pro por 30 días**. `suscripciones` es la fuente de verdad para plan, estado, periodos y referencia futura del proveedor de cobro. La API valida los permisos en cada operación y la interfaz oculta o deriva a **Mi plan** cuando una función no corresponde.

- **Básico ($9.990/mes):** ventas, catálogo, inventario, caja e importación masiva.
- **Pro ($19.990/mes):** agrega clientes, fiado, proveedores, compras, reportes avanzados, auditoría, alertas y Venta Rápida con foto.
- Al vencer, los datos no se borran: quedan disponibles en modo lectura y las mutaciones responden `403` hasta reactivar.

La selección por transferencia registra un `pendingPlan`: no activa funciones sin confirmación ni interrumpe una prueba vigente. Las opciones Webpay y Mercado Pago de esta pantalla son únicamente una aprobación sandbox para demostrar el flujo. El cobro recurrente automático con un proveedor externo continúa fuera del MVP académico.

## Estructura

```text
apps/
  api/        API REST, reglas de negocio e integraciones
  web/        React PWA mobile-first
db/
  schema.sql  Esquema PostgreSQL multi-negocio
docs/
  Backlog-Scrum-Jira.md
  Documento-Proyecto-Localito.md
  Jira-Import.csv
  Alcance-Tesis.md
  Matriz-Regresion-Rediseno.md
  Matriz-Pruebas-Localito.md
  Operacion-Produccion.md
packages/
  shared/     Tipos compartidos
```

## Alcance pendiente

- Cumplimiento tributario chileno, excluido por decisión de esta iteración.
- Integración real con terminales, Webpay o Mercado Pago, excluida del MVP de tesis: los pagos externos se registran manualmente y las simulaciones no cobran dinero.
- Configuración de un proveedor real de correo en Vercel; el flujo de recuperación está implementado, pero requiere credenciales de Gmail o Resend para enviar correos.
- Avisos automáticos por correo distintos de la recuperación de contraseña.
- Múltiples sucursales, e-commerce público, fidelización y facturación de la suscripción SaaS; son expansiones de producto y no forman parte del núcleo operacional entregado aquí.

El ticket generado por Localito es un comprobante interno no tributario.
