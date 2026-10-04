# Manual técnico de Localito

# Resumen ejecutivo

El manual describe instalación y operación de Localito en un computador de desarrollo y el diseño de despliegue en Vercel con PostgreSQL administrado. Incluye variables, salud, verificación, IA, PWA, diagnóstico y procedimientos de recuperación. Los comandos corresponden a package.json y archivos del commit base.

El documento es una guía operativa y no acredita un despliegue nuevo. Los estados históricos de producción se mantienen como antecedentes fechados. La revisión no abrió bases ni modificó secretos o infraestructura del usuario.

# Introducción y requisitos

El usuario técnico debe poder reconstruir el ambiente, identificar el modo de persistencia y reconocer errores sin perder ventas pendientes. Se necesita Node 20 o superior, npm 10 o superior, PostgreSQL o Docker Compose y un navegador compatible. Cámara e IA requieren condiciones adicionales de contexto seguro y servicio remoto.

Antes de comenzar, registrar commit, sistema operativo y versiones de node, npm y Docker. Los requisitos del proyecto provienen de sus manifests, no de una actualización de tecnologías. Se conserva package-lock.json y se utiliza npm ci para reproducir dependencias.

# Instalación desde un entorno limpio

```bash
git clone https://github.com/CamiloGonzalezSt/LocalitoSaaS.git
cd LocalitoSaaS
npm ci
```

En Windows se copia el archivo con copy .env.example .env; en Linux o macOS con cp .env.example .env. Se revisan los valores antes de iniciar la API. .env debe permanecer fuera del repositorio. No se copian node_modules entre computadores porque la instalación reproduce dependencias y binarios del ambiente destino.

# Base de datos y servidor

```bash
npm run db:up
npm run dev:api
```

El primer comando inicia PostgreSQL según Docker Compose. El segundo inicia Express y crea el repositorio. Si la conexión no está disponible en desarrollo, puede usarse MemoryRepository; ese modo pierde datos al reiniciar. Para comprobar PostgreSQL se consulta http://localhost:3000/health y se revisa storage:postgres. La salud por sí sola no prueba una venta.

En otra terminal se ejecuta npm run dev:web y se abre http://localhost:5173. Los puertos declarados difieren de capturas históricas que pudieron usar otro puerto ocupado; se debe seguir la URL efectiva de Vite. Para móvil en la red local se utiliza la IP del computador, se verifica firewall y proxy y se conserva el origen donde existe una cola.

# Variables de configuración

```env
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://localito:localito@localhost:5432/localito
OWNER_DEMO_PASSWORD=Duoc2026
SELLER_DEMO_PASSWORD=Duoc2026V
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=change-this-before-production
SESSION_SECRET=change-this-in-production-with-a-long-random-value
APP_URL=http://localhost:5173
EMAIL_PROVIDER=gmail
GMAIL_USER=tu-correo@gmail.com
GMAIL_APP_PASSWORD=
EMAIL_FROM=Localito <tu-correo@gmail.com>
RESEND_API_KEY=

# Recomendado para la tesis: proveedor visual con plan gratuito.
VISION_PROVIDER=groq
GROQ_API_KEY=
GROQ_VISION_MODEL=qwen/qwen3.8-27b

# Alternativa opcional de pago.
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6

```

DATABASE_URL tiene prioridad sobre POSTGRES_URL y SUPABASE_DB_URL según resolveDatabaseUrl. NODE_ENV production o VERCEL=1 exige PostgreSQL. WEB_ORIGIN configura acceso del cliente. SESSION_SECRET y contraseñas administrativas deben ser valores propios seguros. EMAIL_PROVIDER y claves de correo habilitan envío; la existencia del formulario no garantiza que un correo salga.

VISION_PROVIDER elige el adaptador y las claves se mantienen en backend. Los modelos ejemplificados son identificadores del código auditado y no una confirmación de disponibilidad actual del proveedor. Se deben revisar capacidades, cuotas y modelo habilitado antes de ejecutar una fotografía. No se colocan API keys en variables públicas del frontend.

# Validación de instalación

Se inicia sesión con cuentas de prueba permitidas, se revisa catálogo y se registra una venta aislada. Se comprueba stock inicial y final. Después se reinicia el backend y se verifica persistencia. El procedimiento no debe utilizar datos reales ni repetir pagos externos para comprobar una respuesta.

```bash
npm run check
```

El comando ejecuta tipos, pruebas y build. Se conserva la salida y se revisan fallos antes de declarar instalación validada. La campaña del 04 de octubre completó tipos, pruebas y build por separado tras el bloqueo de tsx en check. Los casos integrales PostgreSQL, móviles y UAT se registran por separado.

# Configuración del despliegue

Vercel sirve web y API mediante las rutas descritas en vercel.json y el adaptador api/index.ts. Supabase proporciona conexión PostgreSQL (Supabase, s. f.a; Vercel, s. f.). Se copia la URI desde el proyecto correcto y el pooler recomendado para ese ambiente; no se construye una conexión inventando host o usuario.

El cambio de variables requiere un despliegue que las incorpore. La URL documentada localito-saas.vercel.app es un antecedente del proyecto; esta tarea no comprobó su estado actual. La comprobación debe usar /api/health, login y una operación de prueba. Configuración visual verdadera en health indica claves disponibles, no respuesta satisfactoria del proveedor.

# Operación de ventas pendientes

La cola pertenece a una cuenta y a un origen del navegador. Antes de intervenir se revisan pendientes y se exporta respaldo desde la interfaz. No se limpia almacenamiento, cambia dominio o reinstala navegador como primera medida. El respaldo puede contener identificadores y notas y no debe subirse a GitHub.

Se conserva la idempotencyKey original al reintentar. Un rechazo de stock requiere revisar catálogo y operación; un error de sesión exige recuperar autenticación. Después de una respuesta ambigua se consulta la venta. El precio aplicado al sincronizar proviene del servidor y puede diferir del observado offline; esa diferencia se concilia con el pago externo antes de cerrar turno.

# Diagnóstico por síntomas

| Síntoma | Fuente de diagnóstico | Comprobación siguiente |
| --- | --- | --- |
| Health falla | Logs API y conexión | Host, usuario, proyecto y variables |
| Health usa memoria local | createRepository | DATABASE_URL y disponibilidad |
| Login falla | Sesión, usuario y repositorio | Cuenta activa y contraseña autorizada |
| IA no configurada | Variables y health | Proveedor y clave backend |
| IA configurada pero falla | Respuesta externa | Modelo, cuota, imagen y timeout |
| Cola rechazada | Código HTTP y mensaje | Datos y permisos sin crear otra venta |
| Caja difiere | Movimientos y pendientes | Contado, pagos, abonos y dispositivos |

# Respaldo y restauración

Un respaldo debe restaurarse en una base separada y comprobar sus relaciones (PostgreSQL Global Development Group, s. f.c). Se registra fecha y ambiente y se protege el archivo. No se aplican semillas sobre datos reales para resolver una conexión. Cambios de esquema se prueban antes de depender de campos nuevos.

# Seguridad y mantenimiento

El backend aplica hash de contraseña, sesiones y roles. El almacenamiento del token en navegador y la validación de TLS necesitan revisión de seguridad específica. Los valores demo no se reutilizan en producción. Un secreto publicado debe rotarse; retirarlo del último documento no elimina el historial.

Las imágenes inline afectan tamaño del catálogo y del respaldo. Monitorear su efecto y planificar almacenamiento de objetos requiere una mejora separada. La salud debe acompañarse de casos operativos; monitorear solo HTTP 200 del frontend puede ocultar una API fallando.

# Registro de incidencias de la fuente

Los siguientes antecedentes proceden de Operacion-Produccion.md. Se mantienen sus fechas y límites; no se interpretan como verificaciones nuevas realizadas por esta revisión.
# Operación de Localito en producción

## Bloqueo de devoluciones en funciones serverless

En Vercel, el pool PostgreSQL usa `max: 1`. Las versiones anteriores de anulación y devolución retenían esa conexión y llamaban a `getSales` mediante `pool.query`, que esperaba una segunda conexión hasta agotar el tiempo. La corrección pasa el cliente transaccional a `getSales` y cubre también los reintentos idempotentes de venta. El diálogo de confirmación tiene ahora una superficie opaca en ambos temas y no se cierra mientras procesa. La prueba local simula un pool de una conexión, pero sigue siendo necesario verificar una devolución y una anulación reales con ventas de prueba en producción; registrar antes y después el stock y consultar los movimientos. No repetir una solicitud que quedó en estado ambiguo sin revisar primero el estado de la venta.

## Verificación de ventas y visión, 26-09-2026

El modelo `qwen/qwen3.6-27b` dejó de estar disponible para el nivel gratuito de Groq. El código actualizado usa `qwen/qwen3.8-27b` incluso si Vercel conserva el identificador retirado en `GROQ_VISION_MODEL`; actualizar también la variable en Vercel para que refleje el modelo vigente. [Aviso oficial](https://console.groq.com/docs/deprecations). `quickSaleConfigured` e `invoiceAiConfigured` solo confirman la presencia de claves, no el éxito de una solicitud. Probar fotos sin información sensible y no confirmar ventas/importaciones durante la validación.

La anulación y devolución reponen stock solo de unidades efectivamente descontadas al vender. Las nuevas ventas guardan ese dato en `detalle_ventas.stock_descontado`; el esquema se amplía al iniciar la API. En ventas históricas sin ese dato se usa `controla_stock` actual, por lo que un cambio de esa opción posterior a la venta exige conciliación manual. Validar en un local de prueba: registrar una venta de un producto con stock controlado, comprobar el descuento, devolver una parte y después anular el resto; verificar stock, estado e historial de movimientos. No repetir una anulación/devolución si la respuesta es ambigua: primero consultar la venta y el inventario. No se ha ejecutado esta prueba contra la base de producción.

## Recuperación de API, 26-09-2026

La web publicada respondía HTTP 200, pero `/api/health` devolvía 500 y el adaptador de login revelaba `ENOTFOUND tenant/user ... not found` del pooler PostgreSQL. Supabase estaba pausado. Después de reanudar el proyecto y corregir la URI `DATABASE_URL` en Vercel, `/api/health` respondió 200 con `storage: "postgres"`, `persistentStorage: true`, `quickSaleConfigured: true` e `invoiceAiConfigured: true` el 26-09-2026 a las 13:50 UTC. La conexión de la API está recuperada; login, catálogo y uso real de IA no están verificados. Según [la guía de Supabase sobre este error](https://supabase.com/docs/guides/troubleshooting/tenant-or-user-not-found), el pooler no puede asociar el host y usuario de la conexión a un proyecto; no significa por sí solo que el DNS del host no resuelva o que la contraseña sea incorrecta. El backend conserva el requisito de PostgreSQL persistente y no debe pasar a memoria en producción.

1. En el proyecto de Supabase que contiene los **datos actuales**, abrir **Connect** y copiar la URI completa de **Transaction pooler**. El proyecto se reanudó y figura saludable. No crear una base nueva ni aplicar semillas sobre datos reales para resolver este error del pooler. [Guía oficial de conexión](https://supabase.com/docs/guides/database/connecting-to-postgres).
2. En Vercel, revisar las variables de entorno de **Production**. El código prioriza `DATABASE_URL`, después `POSTGRES_URL` y finalmente `SUPABASE_DB_URL`; si `DATABASE_URL` sigue presente con un host antiguo, prevalecerá aunque las otras sean correctas. Actualizar o retirar la entrada obsoleta. Copiar el host completo y el usuario directamente de Supabase; codificar los caracteres reservados de la contraseña en la URI. No publicar la URI ni capturarla en pantalla.
3. Crear un nuevo despliegue de producción para que use las variables corregidas. Comprobar que `GET https://localito-saas.vercel.app/api/health` devuelve 200, `storage: "postgres"` y `persistentStorage: true`. Si continúa 503, revisar el registro de esa función en Vercel y la disponibilidad del proyecto Supabase.
4. Con una cuenta de prueba autorizada, comprobar inicio de sesión y carga del catálogo. Después probar venta con foto y lectura de una factura **sin confirmar importación**. `quickSaleConfigured` e `invoiceAiConfigured` en salud distinguen ausencia de claves de IA, pero no garantizan que el proveedor acepte la solicitud; usar una imagen de prueba sin datos sensibles para la verificación.
5. Revisar ventas pendientes antes de registrar nuevas operaciones. No repetir un cobro externo por un error de sincronización sin comprobar antes la venta y la caja.

El adaptador de login del código anterior devolvía al navegador el detalle de la excepción. La corrección preparada devuelve 503 y un mensaje genérico cuando falla la base, mientras conserva el diagnóstico en registros del servidor. Publicar ese cambio después de verificar tipos, pruebas y compilación; su publicación no sustituye el paso 2.

> Incremento visual del 09-09-2026 sin migración de base de datos. Tipos/build y 61 pruebas locales aprobados. Antes de desplegar, completar la regresión visual pendiente y revisar el resultado de CI; no se verificó un nuevo despliegue de producción en esta continuación. [Diseño y verificación](https://github.com/CamiloGonzalezSt/LocalitoSaaS/blob/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c/docs/03_requisitos_diseno/Diseno-Interfaz.md).

Actualización: **08-09-2026**. Las mejoras recientes se verificaron localmente con memoria, no contra producción. Antes de desplegar, completar las comprobaciones de persistencia siguientes. Consulte [Estado actual](https://github.com/CamiloGonzalezSt/LocalitoSaaS/blob/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c/docs/01_documentacion_maestra/Estado-Actual.md) para contratos y límites.

## Verificación diaria

- Consultar `GET /api/health`: debe responder `status: ok`, `persistentStorage: true` y `storage: postgres`.
- `quickSaleConfigured`, `invoiceAiConfigured` y `passwordResetEmailConfigured` indican si los servicios opcionales están disponibles, sin revelar credenciales.
- Realizar comprobaciones de escritura únicamente en un negocio reservado para pruebas; no alterar ventas, inventario o caja de negocios reales para verificar el sistema.

## Respaldos

- La base PostgreSQL/Supabase es la fuente de verdad. Habilitar respaldos del proveedor antes de incorporar negocios reales.
- Exportar productos desde **Caja → Datos y trazabilidad** con un dueño autorizado. Ese CSV no respalda ventas, usuarios ni toda la base.
- Probar una restauración en un proyecto de prueba; un respaldo no verificado no debe considerarse recuperable.
- Nunca copiar claves de producción, tokens o contraseñas dentro de archivos de respaldo compartidos.

## Incidentes

1. Si `/api/health` falla, revisar el último despliegue de Vercel y la conexión PostgreSQL.
2. Si `persistentStorage` es falso en producción, detener las pruebas con datos reales y corregir `DATABASE_URL`.
3. Si Venta Rápida devuelve 429, respetar el tiempo indicado; búsqueda, código de barras y POS manual siguen disponibles.
4. Si una operación queda dudosa, revisar ventas, kardex y auditoría antes de repetirla para evitar duplicados.

## Costos a vigilar

- Vercel: ejecución y ancho de banda.
- Supabase/PostgreSQL: almacenamiento, conexiones y respaldos.
- Groq u otro proveedor visual: cuota y solicitudes.
- Dominio, correo transaccional y soporte.
- Los terminales y pasarelas externas no forman parte del costo base de la tesis: Localito registra el pago manualmente y sus pantallas Webpay/Mercado Pago son simulaciones académicas.

## Reglas de seguridad

- Mantener claves únicamente como variables de entorno del backend.
- Rotar una credencial si aparece en un log, captura o repositorio.
- Conservar separación por negocio y rol; el vendedor no recibe métricas financieras históricas del dueño.
- Aplicar primero cambios de esquema compatibles (`ADD COLUMN IF NOT EXISTS`) antes de depender de nuevos campos.

## Despliegue de esta versión

1. Ejecutar `npm ci` y `npm run check` en un entorno limpio. Revisar la ejecución de GitHub Actions, no solo la presencia del workflow.
2. Respaldar PostgreSQL y probar restauración en una base separada.
3. Aplicar `db/schema.sql` en esa base: `negocios.preferencias` JSONB debe existir y conservar datos previos; fotos usan el campo TEXT `productos.imagen_url` existente.
4. Verificar configuración, foto/reemplazo/eliminación, consultas de historial con más de 100 eventos y filtros, y turnos con abonos que crucen medianoche.
5. Verificar dos peticiones concurrentes con la misma clave de venta, stock/deuda resultantes y accesos cruzados. La prueba local de memoria no acredita la concurrencia de PostgreSQL.
6. Confirmar salud y persistencia después de reiniciar el entorno de pruebas. Solo después publicar y realizar smoke tests aislados.

## Ventas pendientes y dispositivos

- La cola contiene únicamente ventas y pertenece a una cuenta en un origen concreto. No limpiar almacenamiento, cambiar de puerto/dominio ni reinstalar el navegador para resolver un rechazo.
- Descargar el JSON desde Sincronización antes de intervenir. No incluye token, pero puede contener identificadores y notas operativas: tratarlo como información privada y no subirlo a GitHub.
- Rechazos 400/404/409/413/422: revisar la causa, corregir catálogo/stock cuando corresponda y reintentar la venta original. Las demás ventas válidas pueden continuar.
- Errores de red, 401/403, 429 o 5xx: el ciclo se detiene; restablecer conexión, sesión o permisos, respetar límites y reintentar. No repetir un pago en la terminal externa.
- Colas antiguas sin propietario o corruptas se conservan para revisión. No hay importador ni reparación automática.
- Antes del cierre, verificar pendientes en todas las cuentas y dispositivos del turno. La interfaz solo bloquea por pendientes de la cuenta/origen actuales.
- El servidor usa los precios vigentes al sincronizar. Resolver cualquier diferencia respecto del cobro externo antes de dar por conciliado el turno.

## Credenciales e imágenes

- Se retiró del Markdown una contraseña administrativa previamente publicada. Rotarla por el flujo autorizado de recuperación/administración y revisar sesiones; retirar texto no elimina la exposición del historial Git.
- Las claves demo nunca se usan en producción. No restaurar contraseñas reales en `usuarios.md` ni en capturas.
- Las fotos inline aumentan el tamaño del catálogo y los respaldos. Vigilar tamaño/latencia y planificar almacenamiento de objetos al crecer; no existe eliminación automática del fondo.

Quedan pendientes la prueba integral PostgreSQL, restauración, cierre concurrente de varios puestos, dispositivos físicos y validación con usuarios. Esta guía no declara un despliegue productivo aprobado.

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

El manual permite instalar, reconocer el ambiente y resolver incidentes preservando datos. La operación responsable se basa en confirmar persistencia, conservar pendientes y distinguir configuración de resultado. Su aplicación debe registrar evidencia del ambiente donde se ejecuta.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

PostgreSQL Global Development Group (s. f.c). *PostgreSQL 16 SQL Dump*. https://www.postgresql.org/docs/16/backup-dump.html

Supabase (s. f.a). *Connecting to Postgres*. https://supabase.com/docs/guides/database/connecting-to-postgres

Vercel (s. f.). *Vercel Functions*. https://vercel.com/docs/functions

