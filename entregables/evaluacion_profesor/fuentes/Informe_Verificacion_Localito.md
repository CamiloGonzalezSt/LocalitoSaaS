# Informe de verificación de Localito

# Resumen ejecutivo

La campaña del 04 de octubre de 2026 completó satisfactoriamente el análisis de tipos, la compilación, 78 pruebas automatizadas y 12 casos HTTP de integración local. Los resultados pertenecen al commit `ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c`. Se trabajó con código descargado del repositorio y datos sintéticos; los archivos recuperados fueron verificados contra sus identificadores de blob de Git.

El comando agregado `npm run check` no terminó correctamente: después del análisis de tipos, el lanzador tsx intentó crear un canal IPC y recibió EPERM. La campaña se completó ejecutando el runner de Node con tsx como importador y sin aislamiento entre archivos. La compilación se ejecutó por separado. Por tanto, se informan componentes aprobados, sin presentar el comando original como exitoso.

No se obtuvo evidencia de PostgreSQL real, restauración, navegador automatizado, dispositivos físicos ni participación de comerciantes. El resultado acredita comportamientos acotados y reproducibles; no acredita aceptación final ni ausencia total de defectos.

# Objetivo, alcance y ambiente

Se verificaron reglas de negocio, validaciones, separación de negocios, permisos y comportamiento HTTP. El runtime fue Node.js 24.19.0 y npm 11.9.0. La instalación utilizó el lockfile con `npm ci --include=dev --ignore-scripts --no-audit --no-fund`. Se instalaron 147 paquetes. Omitir scripts de instalación fue una decisión del ambiente; debe declararse al repetir la campaña. No se ejecutó una auditoría de dependencias con ese comando.

La API de integración escuchó únicamente en `127.0.0.1:43201`, con almacenamiento MemoryRepository y negocios sintéticos. Se eliminó el proceso al finalizar. La suite combina repositorio en memoria, respuestas controladas de servicios externos, un pool PostgreSQL simulado y verificaciones de estilos y almacenamiento local. Ninguno de esos dobles sustituye una base PostgreSQL ni una medición de IA con imágenes reales.

El workflow del repositorio utiliza Node 22. La ejecución local con Node 24 no reemplaza ese control de integración continua. Se debe conservar el resultado de CI sobre la revisión que se entregue.

# Método y criterios de decisión

Una prueba se considera aprobada cuando el ejecutor termina con código cero y sus aserciones se satisfacen. Los casos HTTP comprueban tanto respuesta como estado posterior cuando corresponde. La inexistencia de una herramienta o un permiso del entorno se registra como bloqueo de ejecución, no como aprobación ni como defecto confirmado del producto.

Los identificadores AUT corresponden al orden de los casos superiores del TAP. El archivo informa 57 casos superiores y 21 subcasos del escenario de entradas inválidas: 78 pruebas, 78 aprobadas, cero fallidas, canceladas u omitidas. El contador incluye unidades de distinto alcance y no expresa cobertura porcentual de código ni de requisitos. El resultado HTTP se presenta por separado para evitar equiparar magnitudes.

# Resultados consolidados

| Actividad | Resultado | Evidencia |
| --- | --- | --- |
| Instalación reproducible | Completada; scripts de instalación omitidos | npm_ci.log |
| Análisis de tipos web y API | Aprobado | check.log, antes del bloqueo |
| npm run check | Bloqueado en lanzador tsx; salida 1 | check.log, check.exit |
| Runner alternativo | 78 de 78 aprobadas; salida 0 | pruebas_verificadas.tap y .exit |
| Compilación | Shared, API y web aprobados; salida 0 | build.log, build.exit |
| API HTTP local | 12 de 12 casos aprobados | api_resultados.json |
| Navegador automatizado | No ejecutado; binario no disponible | browser.log, browser_install.log |
| PostgreSQL y restauración | No ejecutados; sin servicio de base disponible | Casos CP114–118 pendientes |
| Usuarios y dispositivos físicos | No ejecutados | Protocolo de validación preparado |

# Catálogo de pruebas automatizadas

Se conservan los nombres originales del runner para permitir búsqueda literal en la evidencia. Todos los casos de esta tabla figuran aprobados. AUT45 contiene además los 21 subcasos contabilizados por Node.

| Identificador | Nombre literal en el registro |
| --- | --- |
| AUT01 | expected domain errors do not leak as internal server failures |
| AUT02 | production and Vercel require persistent storage |
| AUT03 | database URL resolution ignores blank values and supports Vercel aliases |
| AUT04 | PostgreSQL returns and cancellations reuse the held Vercel connection |
| AUT05 | vision provider prefers Groq and supports an explicit OpenAI fallback |
| AUT06 | vision provider explains the free quota retry time |
| AUT07 | vision provider distinguishes its payload limit from a browser upload limit |
| AUT08 | PostgreSQL demo seeds use stable UUIDs |
| AUT09 | passwords and sessions use non-predictable hashes |
| AUT10 | transactional email selects only a fully configured provider |
| AUT11 | tenant registration is isolated and rejects duplicate emails |
| AUT12 | new tenants receive a 30-day Pro trial with centralized entitlements |
| AUT13 | plan changes gate Pro features and expired subscriptions become read-only |
| AUT14 | manual subscription requests never activate themselves and preserve data access |
| AUT15 | owners can update business identity without changing tenant activation |
| AUT16 | initial inventory bulk import validates rows, avoids duplicates and is safe to retry |
| AUT17 | password recovery is single-use, changes the password and revokes sessions |
| AUT18 | system admin manages tenants and their users without entering store operations |
| AUT19 | critical business flows are consistent and idempotent |
| AUT20 | closing the cash register resets the dashboard period without losing its history |
| AUT21 | invoice vision output is normalized and only matches products from the tenant catalog |
| AUT22 | invoice vision request uses a strict schema and disables provider storage |
| AUT23 | quick sale normalizes multiple products, groups quantities and never trusts unknown catalog ids |
| AUT24 | quick sale vision uses strict structured output, catalog context and provider privacy controls |
| AUT25 | quick sale uses Groq vision JSON mode without sending prices or stock |
| AUT26 | quick sale reads a product created immediately before the analysis from the current tenant catalog |
| AUT27 | quick sale adds reviewed quantities to the existing POS ticket without changing inventory |
| AUT28 | invoice import validates review fields, receives stock once and blocks duplicate invoices |
| AUT29 | invoice import rejects unsafe quantities and unconfirmed sale prices before writing |
| AUT30 | administration can reset credentials and permanently delete users without deleting sale history |
| AUT31 | platform deletion removes a tenant and all its operational data |
| AUT32 | inventory alerts and destination filters share stock rules |
| AUT33 | expiry uses inclusive 30 calendar days and excludes empty stock |
| AUT34 | business day stays in Chile across UTC midnight |
| AUT35 | overdue excludes paid, cancelled, zero balances and debts due today |
| AUT36 | recent sales are sorted without mutation and omit cancelled sales |
| AUT37 | light theme keeps body, action and selected-payment text at 4.5:1 contrast |
| AUT38 | dark theme keeps body, action and selected-payment text at 4.5:1 contrast |
| AUT39 | selected payment uses the tested foreground and a visible check |
| AUT40 | shared typography has no viewport font scaling or heavy display weights |
| AUT41 | cash tabs keep a single four-column row and inactive panels stay hidden |
| AUT42 | recent sale rows and expanded details have distinct themed surfaces |
| AUT43 | sale search dialog has an opaque theme surface above its backdrop |
| AUT44 | sale action dialog has an opaque themed surface |
| AUT45 | invalid sale payloads never alter stock, debt or sales |
| AUT46 | audit pagination spans more than 100 entries without duplicates; cursor and search are tenant scoped |
| AUT47 | offline rejection isolation, transient stops, account isolation, locks and corrupt data preservation |
| AUT48 | business settings reject invalid combinations and image payloads |
| AUT49 | tenant isolation, photo replacement/removal, idempotent sales, debt cash and overnight closing |
| AUT50 | replenishment suggestion targets twice the minimum stock |
| AUT51 | proposal source keeps the product cost as a reference |
| AUT52 | recovered tickets use current prices and available stock |
| AUT53 | unavailable products are removed and discount cannot exceed remaining total |
| AUT54 | untracked stock does not reduce quantities |
| AUT55 | storage roundtrip preserves distinct active and held tickets |
| AUT56 | corrupt storage is rejected instead of loading invalid quantities |
| AUT57 | storage scopes cannot collide across businesses, users or delimiters |

# Casos de integración HTTP

Los casos se ejecutaron de forma secuencial. El negocio A comenzó con diez unidades de un producto de 1.000 CLP; el negocio B tuvo su propio producto. Después de la venta de dos unidades, el stock de A fue ocho. Repetir su clave mantuvo el mismo identificador de venta y ocho unidades. La venta fiada posterior redujo el stock a siete y generó deuda de 1.000 CLP; el abono dejó 600 CLP pendientes.

| Caso | Verificación | Resultado observado |
| --- | --- | --- |
| HTTP01 Acceso sin sesión | 401 al consultar productos | status: 401 |
| HTTP02 Clave incorrecta | 401 al iniciar sesión | message: Credenciales invalidas. |
| HTTP03 Aislamiento de lectura | Solo producto A al alterar cabecera de negocio | productos A: 1; productos B visibles: 0 |
| HTTP04 Aislamiento de escritura | 404 y ningún cambio sobre producto B | status: 404; producto B sin cambios: sí |
| HTTP05 Permiso vendedor | 403 al crear productos | message: Tu rol no tiene permisos para realizar esta accion. |
| HTTP06 Venta inválida sin efectos | Rechazo de cantidad negativa y conservación de stock | status: 400; stock: 10; ventas nuevas: 0 |
| HTTP07 Venta y descuento de stock | Venta por 2000 CLP y stock de 10 a 8 | total CLP: 2000; stock final: 8 |
| HTTP08 Reintento idempotente | Una venta y stock 8 tras repetir la misma clave | misma venta: sí; ventas: 1; stock: 8 |
| HTTP09 Venta fiada | Deuda de 1000 CLP vinculada al cliente | deuda CLP: 1000; stock final: 7 |
| HTTP10 Abono de deuda | Saldo de 1000 a 600 CLP | abono CLP: 400; saldo CLP: 600 |
| HTTP11 Consulta de auditoría por rol | Dueño obtiene eventos y vendedor recibe 403 | eventos visibles owner: 6; seller status: 403 |
| HTTP12 Revocación de sesión | 401 después de cerrar sesión | sesion revocada: sí; status: 401 |

La consulta de auditoría devolvió seis eventos al dueño y rechazó al vendedor. Eso verifica acceso y presencia de eventos para esta secuencia; no demuestra que toda operación del sistema audite atómicamente. Las duraciones individuales guardadas en JSON describen una corrida local pequeña y no son una prueba de rendimiento.

# Incidencias del instrumento y bloqueos

El primer guion esperaba HTTP 201 para el abono; el contrato implementado devuelve HTTP 200. El segundo intento quiso interpretar como JSON la respuesta vacía HTTP 204 de logout. Se corrigieron ambas expectativas del instrumento y se repitió toda la campaña. Los intentos iniciales se conservan junto a la evidencia para que el resultado final no oculte ese ajuste. No se modificó código del producto para aprobar las comprobaciones.

El lanzamiento de navegador falló por ausencia del binario esperado. La descarga alternativa terminó con un archivo inválido. No se registran capturas ni resultados de interacción como si se hubieran obtenido. Los archivos de prueba incluyen comprobaciones de contraste sobre valores de color y selectores; no equivalen a una auditoría completa WCAG ni a una sesión con lector de pantalla (W3C, 2023).

# Reproducción de la campaña

Usar un clon limpio del commit indicado, Node y npm compatibles y un ambiente de prueba sin credenciales de producción. Conservar las versiones exactas del entorno. Ejecutar instalación y tipos, y luego el siguiente runner desde la raíz. La opción de importación sigue el uso documentado de tsx con Node (Node.js, s. f.; tsx, s. f.).

```bash
npm ci --include=dev --ignore-scripts --no-audit --no-fund
npm run build -w packages/shared
npm run typecheck
node --import tsx --test --test-isolation=none --test-reporter=tap apps/api/src/localito.test.ts scripts/improvements.test.ts scripts/hardening.test.ts scripts/design.test.ts scripts/dashboard.test.ts scripts/inventory.test.ts scripts/sale-workspace.test.ts
npm run build
```

Para HTTP, iniciar la API con `API_HOST=127.0.0.1`, `API_PORT=43201`, `NODE_ENV=development` y sin variables de conexión a base de datos ni plataforma Vercel. Ejecutar `node --import tsx apps/api/src/server.ts` en ese ambiente y luego `python3 validar_api.py` desde la carpeta de evidencias. El guion verifica que la salud indique almacenamiento en memoria antes de crear sus datos. Cada ejecución crea negocios de prueba independientes. Detener el proceso al finalizar. No apuntar el guion a producción.

La reproducción debe conservar salida completa, código de salida, commit, versiones y fecha. Si se cambia el runner, sus opciones o el servicio persistente, se registra una nueva campaña con su alcance, en lugar de reemplazar silenciosamente los resultados anteriores.

# Evidencias, integridad y custodia

La carpeta de evidencias incluye logs, salidas, guion HTTP, resultados finales y dos intentos iniciales. El manifiesto SHA-256 permite comprobar que los archivos recibidos no cambiaron. Los registros contienen datos sintéticos y no incluyen tokens de sesión ni credenciales de comercios reales. El manifiesto del código conserva rutas y hashes de blobs de los 105 archivos recuperados, no una afirmación de haber auditado todos los archivos del repositorio.

# Interpretación y acciones pendientes

La evidencia respalda las reglas comprobadas en memoria y la integración HTTP local. La mayor incertidumbre técnica restante está en transacciones concurrentes y recuperación persistente. Deben ejecutarse CP114–118 sobre PostgreSQL, registrar estados antes y después y comprobar aislamiento con dos negocios. CP119–120 cubren fallos de red y cambios al sincronizar; CP121–123 cubren dispositivos, usuarios y carga bajo condiciones definidas.

La aceptación de las historias corresponde al equipo y al Product Owner. Este informe no cambia estados de Sprint ni demuestra éxito comercial. El Control de entrega identifica qué evidencias faltan y quién puede coordinarlas.

# Conclusiones

Los resultados actuales permiten defender la implementación y los mecanismos probados con evidencia rastreable. La tesis debe describirse como avance técnicamente verificado dentro de este alcance y completar el trabajo de campo y las pruebas persistentes antes de sostener conclusiones de uso, recuperación o desempeño productivo.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Node.js (s. f.). *Test runner*. https://nodejs.org/api/test.html

tsx (s. f.). *Node.js CLI*. https://github.com/privatenumber/tsx/blob/master/docs/dev-api/node-cli.md

World Wide Web Consortium (2023). *Web Content Accessibility Guidelines 2.2*. https://www.w3.org/TR/WCAG22/

