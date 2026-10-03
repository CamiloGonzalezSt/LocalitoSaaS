# Localito

> **Control documental vigente: 03-10-2026.** La gestión Scrum activa se realiza en **Trello**. Alexander Patiño = Product Owner, Samuel Solís = Scrum Master y Camilo González = Developer. Sprint 4 está en curso; Sprints 5–8 permanecen sin HU comprometidas hasta su Sprint Planning. Jira se conserva solo como histórico.


**Incidente de producción, 26-09-2026:** Supabase estaba pausado y el pooler rechazaba la conexión de Vercel. Tras reanudar el proyecto y corregir la URI de producción, `/api/health` respondió 200 con `storage: "postgres"` y `persistentStorage: true`. La primera reparación de código se publicó como `6e9ae82`. Luego se detectó que Groq retiró el modelo visual configurado y se reportaron problemas en el detalle de ventas y las devoluciones; las correcciones posteriores están descritas en [Estado actual](docs/01_documentacion_maestra/Estado-Actual.md) y requieren prueba con PostgreSQL y navegador antes de declararse verificadas en producción.

**Actualización técnica: 09-09-2026.** El [estado actual](docs/01_documentacion_maestra/Estado-Actual.md) centraliza funciones, contratos, pruebas reproducibles y pendientes. La nueva paleta, pestañas de Caja, catálogo y cobro están en [Diseño de interfaz](docs/03_requisitos_diseno/Diseno-Interfaz.md), con la revisión visual pendiente identificada. El resumen está en [MEJORAS.md](MEJORAS.md).

## Resumen profesional

**Localito** es una **PWA SaaS multi-negocio** diseñada para almacenes, minimarkets y pequeños comercios. Centraliza en una sola plataforma las operaciones que habitualmente se administran de forma manual o fragmentada: ventas, inventario, caja, clientes y fiado, compras, proveedores, reportes y auditoría.

El proyecto corresponde al **Capstone / Proyecto de Título 2026 de Ingeniería en Informática de Duoc UC** y se desarrolla como un MVP funcional, desplegable y trazable, con foco en una experiencia simple para usuarios que no necesariamente poseen conocimientos técnicos.

**Estado del proyecto:** versión de tesis en desarrollo. El núcleo operacional trabaja con persistencia PostgreSQL. Las pasarelas externas de pago se registran o simulan con fines académicos y la integración tributaria chilena con SII se mantiene fuera del alcance del MVP.

## Problema que resuelve

Muchos comercios de barrio todavía controlan ventas, stock, caja, deudas de clientes y compras mediante cuadernos, planillas o aplicaciones separadas. Esto puede producir:

- diferencias entre stock real y registrado;
- poca visibilidad sobre ventas y caja;
- dificultad para controlar fiados y abonos;
- duplicación de información;
- pérdida de trazabilidad sobre quién realizó una operación;
- mayor tiempo destinado a tareas administrativas;
- barreras para adoptar software tradicional de gestión por costo o complejidad.

Localito busca reducir esa fragmentación mediante una aplicación web instalable y orientada al flujo cotidiano del negocio.

## Por qué se desarrolla Localito

El proyecto nace de la necesidad de demostrar que un pequeño comercio puede digitalizar procesos esenciales sin depender de infraestructura compleja ni de un ERP tradicional. La solución se diseñó considerando tres objetivos principales:

1. **Centralizar la operación diaria** en una sola plataforma.
2. **Simplificar la experiencia** para dueños y vendedores mediante una interfaz mobile-first.
3. **Incorporar automatización e IA de manera controlada**, utilizando la tecnología como asistencia y no como sustituto de la validación humana.

Además del objetivo académico, Localito está planteado como un producto SaaS escalable a múltiples negocios.

## Propuesta de valor e innovación

La innovación de Localito no consiste simplemente en agregar IA a un punto de venta. La propuesta combina gestión operacional, PWA, arquitectura multi-negocio y asistencia visual dentro de tareas concretas.

### Venta Rápida con IA

El usuario puede fotografiar varios productos y Localito solicita al proveedor de visión una propuesta de coincidencias y cantidades **utilizando el catálogo real del negocio**. El vendedor revisa y corrige la propuesta antes de agregarla al ticket.

La IA **no genera una venta, no descuenta stock y no modifica el kardex por sí sola**.

### Ingreso de mercadería desde factura

Una fotografía de factura puede utilizarse para proponer proveedor, folio, fecha, productos, cantidades y costos. La información pasa por una etapa obligatoria de revisión antes de crear productos, registrar compras o modificar existencias.

### PWA y continuidad operativa

Localito puede instalarse como aplicación web progresiva. El catálogo puede conservarse localmente y existe soporte offline acotado para ventas pendientes, con mecanismos de idempotencia para reducir el riesgo de operaciones duplicadas al recuperar conectividad.

### SaaS multi-negocio

La arquitectura separa los datos por negocio y aplica roles y permisos tanto en interfaz como en API. Esto permite utilizar una misma plataforma para distintos comercios sin mezclar su información.

## Tecnologías utilizadas

| Capa | Tecnología / servicio | Uso principal |
|---|---|---|
| Frontend | React + TypeScript | Interfaz de usuario |
| PWA | Service Worker + Web App Manifest | Instalación y soporte offline |
| Almacenamiento local | IndexedDB | Catálogo y cola local acotada |
| Backend | Node.js + API REST | Reglas de negocio e integraciones |
| Base de datos | PostgreSQL | Persistencia relacional |
| BaaS / DB administrada | Supabase | PostgreSQL de producción |
| Hosting / Serverless | Vercel | Despliegue web y API |
| IA visual | Groq / OpenAI configurable | Reconocimiento de productos y facturas |
| Código de barras | ZXing | Lectura de códigos |
| Control de versiones | Git + GitHub | Código, historial y evidencias |
| Gestión ágil | Scrum + Trello | Product Backlog, Sprints y seguimiento |
| Contenedores | Docker Compose | PostgreSQL para desarrollo local |

## Arquitectura resumida

```text
Usuario
  │
  ▼
React + TypeScript PWA
  │
  ├── IndexedDB / soporte local
  │
  ▼ HTTPS / REST
Node.js API
  ├── autenticación y autorización
  ├── reglas de negocio
  ├── auditoría
  ├── integración de IA
  └── persistencia
        │
        ▼
PostgreSQL / Supabase

Servicios externos:
- Vercel: despliegue
- Groq / OpenAI: visión e IA
- Gmail / Resend: recuperación de contraseña cuando se configura proveedor
```

La arquitectura completa se documenta en [Arquitectura](docs/05_operacion_produccion/Arquitectura.md) y el modelo relacional en [Modelo de datos](docs/05_operacion_produccion/Modelo-de-Datos.md) y [db/schema.sql](db/schema.sql).

## Metodología y equipo

Localito se gestiona mediante **Scrum**.

| Integrante | Rol |
|---|---|
| Alexander Patiño | Product Owner |
| Samuel Solís | Scrum Master |
| Camilo González | Developer |

Trello es la herramienta activa de seguimiento. Jira se mantiene únicamente como antecedente histórico.

Al **03-10-2026**:
- Sprint 1, 2 y 3: cerrados.
- Sprint 4: en curso.
- Sprint 5–8: futuros y sin historias comprometidas antes de su Sprint Planning.

La trazabilidad esperada es:

```text
Requisito → Historia de Usuario → Sprint/Trello → Commit → Prueba → Evidencia
```

## Funcionalidades implementadas

- Administrador de plataforma separado del negocio: crea locales, crea su primer dueño, agrega vendedores y puede suspender o reactivar locales y usuarios.
- Suscripciones SaaS por negocio con prueba Pro de 30 días, planes Básico/Pro, permisos centralizados, modo de solo lectura al vencer y métricas de MRR/pruebas en plataforma.
- Registro público de un negocio y su primer dueño con prueba Pro de 30 días; el administrador de plataforma también puede crear y administrar locales para la demostración.
- Recuperación de contraseña por correo con enlace de un solo uso, vencimiento de 30 minutos y revocación de sesiones anteriores.
- Inicio y cierre de sesión con contraseñas `scrypt`, tokens aleatorios almacenados como hash, expiración y aislamiento por negocio.
- Roles `system_admin`, `owner` y `seller` protegidos tanto en la interfaz como en la API.
- Punto de venta con búsqueda, código de barras, descuento, notas y pagos simples o divididos.
- Ticket recuperable al recargar, ventas en espera y favoritos guardados en el navegador por negocio y usuario. Retomar una venta guarda el ticket abierto y revisa precios y stock actuales.
- Catálogo de venta con carga incremental y cobro móvil en un diálogo dedicado, con navegación por teclado y comprobante al finalizar.
- Idempotencia de ventas para evitar cobros duplicados al reintentar desde una red inestable.
- Navegación simplificada por rol: dueño (`Inicio`, `Vender`, `Inventario`, `Clientes`, `Caja`, `Reportes`) y vendedor (`Vender`, `Inventario`, `Clientes`, `Caja`). Configuración vive en el engranaje; crear/importar productos y Venta Rápida se abren dentro de su flujo natural.
- Inventario con SKU, variante, unidad, packs, vencimiento, stock mínimo, productos sin control de stock y kardex de movimientos.
- Alertas de reposición y vencimiento a 30 días.
- Clientes con cupo, plazo, bloqueo de crédito, cuentas por cobrar, vencimientos, abonos y recordatorios por WhatsApp.
- Anulación de venta y devoluciones parciales con reposición de stock y ajuste de deuda.
- Proveedores, órdenes de compra, recepción de mercadería y actualización del costo promedio ponderado.
- Caja por turno: apertura, ingresos, gastos operativos categorizados, retiros, cierre, efectivo esperado, contado y diferencia.
- Caja organizada en Turno, Movimientos, Compras e Historial según permisos; conserva formularios al alternar pestañas. Gastos agrupados del turno abierto.
- Reportes por período, vendedor y categoría; comparación con el período anterior, ventas por hora/categoría/vendedor, alertas operativas, filtros guardados por local y exportación CSV. El reporte financiero muestra ventas netas, margen bruto estimado, gastos operativos y resultado estimado; los cálculos de utilidad se presentan como estimaciones porque usan el costo vigente del catálogo.
- Historial completo de auditoría con búsqueda, acción, fechas y paginación por cursor; antes/después de precio y stock con autor y motivo.
- Asistente automático de carga inicial para locales nuevos, con categorías sugeridas por rubro, progreso reanudable y acceso posterior desde el menú.
- Importación masiva y exportación de productos en CSV: plantilla compatible con Excel, vista previa, validación por fila y prevención de duplicados, hasta 500 productos por carga.
- Cola local exclusivamente para ventas, separada por negocio y usuario, con bloqueo entre pestañas, errores visibles, reintento individual y respaldo JSON sin token. Los ajustes de stock requieren conexión.
- Catálogo guardado en IndexedDB para recuperar el espacio de trabajo sin API, reservando el stock de ventas pendientes.
- Fotos reales de productos desde cámara o archivo, encuadre y escala; salida WebP de 512 px con transparencia si el original la incluye. No elimina fondos automáticamente.
- Medios de pago habilitados y ordenados por negocio, datos bancarios para transferencias y efectivo recibido/vuelto.
- Estado de cuenta de clientes, recordatorio editable y conciliación de caja con abonos en efectivo y turnos que cruzan medianoche.
- Reposición orientativa por ventas de 30 días, stock, mínimos y compras aún no recibidas.
- PWA instalable con caché de aplicación y navegación sin conexión.
- Lectura de códigos con ZXing cargado bajo demanda.
- **Venta Rápida**: una fotografía puede proponer varios productos y cantidades usando exclusivamente el catálogo del negocio; el vendedor corrige la propuesta y la agrega al ticket POS existente. La lectura de códigos de barras continúa disponible como alternativa.
- Ingreso de mercadería desde una foto de factura: extracción estructurada, coincidencia con catálogo, revisión obligatoria de cantidades/costos/precios, creación de productos y recepción de stock sin duplicar la factura.
- Cobros presenciales en tres pasos: armar ticket, presionar **Cobrar** y elegir el medio. Tarjeta, transferencia, Webpay y Mercado Pago se registran como medios externos: el vendedor confirma manualmente el pago antes de crear la venta o descontar stock.
- Tema claro, oscuro o según el sistema, persistido por usuario, con tipografía Source Sans 3 y controles táctiles mobile-first.

## Requisitos

- Node.js 20 o superior.
- npm 10 o pnpm.
- PostgreSQL 16 o Docker Desktop para persistencia. Memoria solo para desarrollo sin base configurada; en producción no hay fallback a memoria.

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

El procedimiento de monitoreo, respaldo e incidentes está documentado en [docs/05_operacion_produccion/Operacion-Produccion.md](docs/05_operacion_produccion/Operacion-Produccion.md).

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
GROQ_VISION_MODEL=qwen/qwen3.8-27b
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6
```

Para la demostración académica configure `VISION_PROVIDER=groq`, `GROQ_API_KEY` y `GROQ_VISION_MODEL=qwen/qwen3.8-27b`. Groq se usa desde el backend y permite ejecutar reconocimiento real sujeto a la cuota de su plan gratuito. El modelo anterior `qwen/qwen3.6-27b` fue retirado del plan gratuito; Localito lo sustituye automáticamente si aún está configurado en Vercel. `OPENAI_API_KEY` y `OPENAI_VISION_MODEL` se conservan como alternativa opcional; si no se fuerza un proveedor, Localito prefiere Groq cuando ambas claves existen. Las imágenes se reducen en el navegador, se procesan sin guardarlas en Localito y toda respuesta externa vuelve a validarse antes de afectar el flujo. Ninguna clave debe exponerse en el frontend, llevar el prefijo `VITE_` ni subirse al repositorio.

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
npm run check
```

`check` reúne tipos, `npm test` (65 pruebas en la ejecución local del 26-09-2026) y build. Incluye validaciones de venta, rechazo sin cambios de stock/deuda, auditoría de más de 100 eventos, sincronización, idempotencia, caja, fiado, autenticación, inventario e IA, además de pruebas CSS de contraste, tipografía, pestañas y superficies de ventas. El workflow de GitHub ejecuta esta comprobación en pushes a `main` y pull requests.

Las suites de navegador del 08-09-2026 verificaron cobro, mejoras integradas y recuperación con 62 capturas. No se repitieron completas después del nuevo rediseño; la revisión visual actual es parcial. La instalación limpia, PostgreSQL y dispositivos físicos requieren pruebas separadas. Instrucciones, alcance y limitaciones en [Estado actual](docs/01_documentacion_maestra/Estado-Actual.md) y [Diseño de interfaz](docs/03_requisitos_diseno/Diseno-Interfaz.md); casos en [Matriz de pruebas](docs/04_calidad_pruebas/Matriz-Pruebas-Localito.md) y [Matriz de regresión](docs/04_calidad_pruebas/Matriz-Regresion-Rediseno.md).

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
  00_indice/
  01_documentacion_maestra/
  02_gestion_scrum_trello/
  03_requisitos_diseno/
  04_calidad_pruebas/
  05_operacion_produccion/
  06_documentacion_academica/
  90_historico_jira/
archivo/
  qa_y_temporales/
entregables/
  finales/
  presentaciones/
packages/
  shared/     Tipos compartidos
```

La documentación vigente parte en [docs/00_indice/INDICE_DOCUMENTACION.md](docs/00_indice/INDICE_DOCUMENTACION.md). Jira se conserva únicamente como histórico.

## Alcance pendiente

- Cumplimiento tributario chileno, excluido por decisión de esta iteración.
- Integración real con terminales, Webpay o Mercado Pago, excluida del MVP de tesis: los pagos externos se registran manualmente y las simulaciones no cobran dinero.
- Configuración de un proveedor real de correo en Vercel; el flujo de recuperación está implementado, pero requiere credenciales de Gmail o Resend para enviar correos.
- Avisos automáticos por correo distintos de la recuperación de contraseña.
- Múltiples sucursales, e-commerce público, fidelización y facturación de la suscripción SaaS; son expansiones de producto y no forman parte del núcleo operacional entregado aquí.

El ticket generado por Localito es un comprobante interno no tributario.


## Artefactos para evaluación académica

Para facilitar la revisión automática y manual del proyecto, los artefactos solicitados por la evaluación están disponibles explícitamente:

| Criterio | Documento / evidencia |
|---|---|
| Documento de inicio de proyecto | [Documento-Inicio-Proyecto.md](docs/01_documentacion_maestra/Documento-Inicio-Proyecto.md) |
| Metodología declarada y justificada | [Metodologia-Scrum.md](docs/02_gestion_scrum_trello/Metodologia-Scrum.md) |
| Product Vision | [Product-Vision.md](docs/02_gestion_scrum_trello/Product-Vision.md) |
| Product Backlog | [Product-Backlog.md](docs/02_gestion_scrum_trello/Product-Backlog.md) |
| Sprint Backlog | [Sprint-Backlog.md](docs/02_gestion_scrum_trello/Sprint-Backlog.md) |
| Definition of Done | [Definition-of-Done.md](docs/02_gestion_scrum_trello/Definition-of-Done.md) |
| Retrospectivas | [Retrospectivas.md](docs/02_gestion_scrum_trello/Retrospectivas.md) |
| SRS | [SRS-No-Aplica.md](docs/03_requisitos_diseno/SRS-No-Aplica.md) — no aplica como artefacto principal porque Localito usa Scrum |
| Arquitectura | [Arquitectura.md](docs/05_operacion_produccion/Arquitectura.md) |
| Modelo de datos | [Modelo-de-Datos.md](docs/05_operacion_produccion/Modelo-de-Datos.md) y [db/schema.sql](db/schema.sql) |
| Diagramas UML | [UML/](docs/03_requisitos_diseno/UML/) |
| Requisitos no funcionales | [Requisitos-No-Funcionales.md](docs/03_requisitos_diseno/Requisitos-No-Funcionales.md) |
| Docker | [docker-compose.yml](docker-compose.yml) |
| Pruebas | [Plan-de-Pruebas.md](docs/04_calidad_pruebas/Plan-de-Pruebas.md) |
| Manual técnico | [Manual-Tecnico.md](docs/05_operacion_produccion/Manual-Tecnico.md) |
| Innovación | [Innovacion-y-Valor-Agregado.md](docs/07_innovacion/Innovacion-y-Valor-Agregado.md) |

La metodología vigente es **Scrum** y Trello es la herramienta activa de gestión. Jira se conserva únicamente como evidencia histórica.
