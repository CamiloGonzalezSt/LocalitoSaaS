# Informe de verificación de Localito

# Resumen ejecutivo

La campaña del 04 de octubre de 2026 completó satisfactoriamente el análisis de tipos, la compilación, 78 pruebas automatizadas y 12 casos HTTP de integración local. Los resultados pertenecen a la revisión `ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c`. Se trabajó con código descargado del repositorio y datos sintéticos; los archivos recuperados fueron verificados contra los identificadores de sus objetos de contenido en Git.

El comando agregado `npm run check` no terminó correctamente: después del análisis de tipos, el lanzador tsx intentó crear un canal IPC y recibió EPERM. La campaña se completó utilizando el ejecutor de pruebas de Node con tsx como importador y sin aislamiento entre archivos. La compilación se ejecutó por separado. Por tanto, se informan componentes aprobados, sin presentar el comando original como exitoso.

No se obtuvo evidencia de PostgreSQL real, restauración, navegador automatizado, dispositivos físicos ni participación de comerciantes. El resultado acredita comportamientos acotados y reproducibles; no acredita aceptación final ni ausencia total de defectos.

# Objetivo, alcance y ambiente

Se verificaron reglas de negocio, validaciones, separación de negocios, permisos y comportamiento HTTP. Se utilizó Node.js 24.19.0 como entorno de ejecución y npm 11.9.0 como gestor de paquetes. La instalación utilizó el archivo de versiones de dependencias con `npm ci --include=dev --ignore-scripts --no-audit --no-fund`. Se instalaron 147 paquetes. Omitir las secuencias de instalación fue una decisión del ambiente; debe declararse al repetir la campaña. No se ejecutó una auditoría de dependencias con ese comando.

La API de integración escuchó únicamente en `127.0.0.1:43201`, con la implementación de almacenamiento en memoria y negocios sintéticos. Se eliminó el proceso al finalizar. El conjunto de pruebas combina repositorio en memoria, respuestas controladas de servicios externos, un grupo simulado de conexiones a PostgreSQL y verificaciones de estilos y almacenamiento local. Ninguno de esos dobles sustituye una base PostgreSQL ni una medición de IA con imágenes reales.

El flujo automatizado del repositorio utiliza Node 22. La ejecución local con Node 24 no reemplaza ese control de integración continua. Se debe conservar el resultado de integración continua sobre la revisión que se entregue.

# Método y criterios de decisión

Una prueba se considera aprobada cuando el ejecutor termina con código cero y sus aserciones se satisfacen. Los casos HTTP comprueban tanto respuesta como estado posterior cuando corresponde. La inexistencia de una herramienta o un permiso del entorno se registra como bloqueo de ejecución, no como aprobación ni como defecto confirmado del producto.

Los identificadores AUT corresponden al orden de los casos superiores del formato TAP. El archivo informa 57 casos superiores y 21 subcasos del escenario de entradas inválidas: 78 pruebas, 78 aprobadas, cero fallidas, canceladas u omitidas. El contador incluye unidades de distinto alcance y no expresa cobertura porcentual de código ni de requisitos. El resultado HTTP se presenta por separado para evitar equiparar magnitudes.

# Resultados consolidados

| Actividad | Resultado | Evidencia |
| --- | --- | --- |
| Instalación reproducible | Completada; secuencias de instalación omitidas | registro de instalación (npm_ci.log) |
| Análisis de tipos web y API | Aprobado | registro del análisis de tipos, antes del bloqueo (check.log) |
| npm run check | Bloqueado en lanzador tsx; salida 1 | registro y código de salida de la comprobación (check.log, check.exit) |
| Ejecutor alternativo | 78 de 78 aprobadas; salida 0 | registro de pruebas en formato TAP y código de salida (pruebas_verificadas.tap, .exit) |
| Compilación | Componentes compartidos, API y aplicación web aprobados; salida 0 | registro de compilación y código de salida (build.log, build.exit) |
| API HTTP local | 12 de 12 casos aprobados | resultados de la integración HTTP (api_resultados.json) |
| Navegador automatizado | No ejecutado; binario no disponible | registro del navegador y de su instalación (browser.log, browser_install.log) |
| PostgreSQL y restauración | No ejecutados; sin servicio de base disponible | Casos CP114–118 pendientes |
| Usuarios y dispositivos físicos | No ejecutados | Protocolo de validación preparado |

# Catálogo de pruebas automatizadas

Los nombres de las pruebas se presentan en español. Los identificadores AUT mantienen el orden de los casos del registro de pruebas y permiten relacionar cada nombre con su evidencia. Todos los casos de esta tabla figuran aprobados. AUT45 incluye además los 21 subcasos contabilizados por Node.

| Identificador | Nombre de la prueba en español |
| --- | --- |
| AUT01 | Los errores de dominio previstos no se presentan como fallos internos del servidor |
| AUT02 | El entorno de producción y Vercel requieren almacenamiento persistente |
| AUT03 | La resolución de la dirección de la base de datos omite valores vacíos y admite los alias de Vercel |
| AUT04 | Las devoluciones y anulaciones en PostgreSQL reutilizan la conexión reservada de Vercel |
| AUT05 | El proveedor de análisis visual prioriza Groq y admite OpenAI como alternativa configurada explícitamente |
| AUT06 | El proveedor de análisis visual informa el tiempo de espera para reintentar tras agotar la cuota gratuita |
| AUT07 | El proveedor de análisis visual distingue su límite de datos del límite de carga del navegador |
| AUT08 | Los datos iniciales de demostración de PostgreSQL utilizan identificadores UUID estables |
| AUT09 | Las contraseñas y sesiones utilizan valores criptográficos no predecibles |
| AUT10 | El correo transaccional selecciona únicamente un proveedor completamente configurado |
| AUT11 | El registro de negocios mantiene el aislamiento y rechaza correos electrónicos duplicados |
| AUT12 | Los nuevos negocios reciben una prueba de 30 días del plan Pro con permisos centralizados |
| AUT13 | Los cambios de plan regulan las funciones Pro y las suscripciones vencidas quedan en modo de solo lectura |
| AUT14 | Las solicitudes manuales de suscripción no se activan automáticamente y conservan el acceso a los datos |
| AUT15 | Los propietarios pueden actualizar la identidad del comercio sin modificar la activación del negocio |
| AUT16 | La importación masiva del inventario inicial valida filas, evita duplicados y permite reintentos seguros |
| AUT17 | La recuperación de contraseña es de un solo uso, cambia la clave y revoca las sesiones |
| AUT18 | El administrador del sistema gestiona negocios y usuarios sin acceder a las operaciones del comercio |
| AUT19 | Los procesos críticos del negocio son coherentes e idempotentes |
| AUT20 | El cierre de caja reinicia el período del panel de control sin perder el historial |
| AUT21 | El resultado del análisis visual de facturas se normaliza y solo relaciona productos del catálogo del negocio |
| AUT22 | La solicitud de análisis visual de facturas utiliza un esquema estricto y desactiva el almacenamiento del proveedor |
| AUT23 | La venta rápida normaliza varios productos, agrupa cantidades y rechaza identificadores ajenos al catálogo |
| AUT24 | El análisis visual de venta rápida utiliza respuestas estructuradas estrictas, contexto del catálogo y controles de privacidad |
| AUT25 | La venta rápida utiliza el modo JSON del análisis visual de Groq sin enviar precios ni existencias |
| AUT26 | La venta rápida consulta en el catálogo del negocio un producto creado inmediatamente antes del análisis |
| AUT27 | La venta rápida agrega cantidades revisadas a la venta en curso del punto de venta sin modificar el inventario |
| AUT28 | La importación de facturas valida los campos revisados, ingresa existencias una sola vez y bloquea facturas duplicadas |
| AUT29 | La importación de facturas rechaza cantidades inseguras y precios de venta sin confirmar antes de guardar |
| AUT30 | La administración restablece credenciales y elimina usuarios permanentemente sin borrar el historial de ventas |
| AUT31 | La eliminación desde la plataforma retira un negocio y todos sus datos operativos |
| AUT32 | Las alertas de inventario y los filtros de destino comparten las reglas de existencias |
| AUT33 | El cálculo de vencimiento incluye 30 días calendario y excluye productos sin existencias |
| AUT34 | La fecha comercial se mantiene en la zona horaria de Chile al pasar la medianoche UTC |
| AUT35 | Las deudas vencidas excluyen las pagadas, anuladas, con saldo cero y las que vencen hoy |
| AUT36 | Las ventas recientes se ordenan sin modificar los datos originales y excluyen las anuladas |
| AUT37 | El tema claro mantiene una relación de contraste de 4,5:1 en el texto general, las acciones y el pago seleccionado |
| AUT38 | El tema oscuro mantiene una relación de contraste de 4,5:1 en el texto general, las acciones y el pago seleccionado |
| AUT39 | El pago seleccionado utiliza el color de texto comprobado y una marca de selección visible |
| AUT40 | La tipografía compartida evita escalarse según el tamaño de pantalla y usar grosores excesivos en los títulos |
| AUT41 | Las pestañas de caja mantienen una fila de cuatro columnas y los paneles inactivos permanecen ocultos |
| AUT42 | Las filas de ventas recientes y sus detalles desplegados utilizan fondos diferenciados según el tema |
| AUT43 | El cuadro de búsqueda de ventas utiliza un fondo opaco según el tema, por encima de la capa de fondo |
| AUT44 | El cuadro de acciones de venta utiliza un fondo opaco acorde con el tema |
| AUT45 | Los datos de ventas inválidas nunca alteran las existencias, las deudas ni las ventas |
| AUT46 | La paginación de auditoría recorre más de 100 registros sin duplicados; el cursor y la búsqueda se limitan al negocio |
| AUT47 | La operación sin conexión controla rechazos, interrupciones temporales, aislamiento de cuentas, bloqueos y conservación de datos dañados |
| AUT48 | La configuración del negocio rechaza combinaciones inválidas y datos de imagen no válidos |
| AUT49 | Se comprueban el aislamiento entre negocios, el reemplazo y retiro de fotografías, las ventas idempotentes, los abonos en caja y el cierre que cruza medianoche |
| AUT50 | La sugerencia de reposición busca alcanzar el doble de las existencias mínimas |
| AUT51 | El origen de la propuesta conserva el costo del producto como referencia |
| AUT52 | Las ventas en curso recuperadas utilizan precios vigentes y existencias disponibles |
| AUT53 | Los productos no disponibles se retiran y el descuento no puede superar el total restante |
| AUT54 | Los productos sin control de existencias no reducen sus cantidades |
| AUT55 | El guardado y la recuperación conservan separadas las ventas activas y las ventas en espera |
| AUT56 | El almacenamiento dañado se rechaza para evitar cargar cantidades inválidas |
| AUT57 | Los espacios de almacenamiento no colisionan entre negocios, usuarios ni separadores |

# Casos de integración HTTP

Los casos se ejecutaron de forma secuencial. El negocio A comenzó con diez unidades de un producto de 1.000 CLP; el negocio B tuvo su propio producto. Después de la venta de dos unidades, las existencias de A quedaron en ocho. Repetir su clave mantuvo el mismo identificador de venta y ocho unidades. La venta fiada posterior redujo las existencias a siete y generó deuda de 1.000 CLP; el abono dejó 600 CLP pendientes.

| Caso | Verificación | Resultado observado |
| --- | --- | --- |
| HTTP01 Acceso sin sesión | 401 al consultar productos | código HTTP: 401 |
| HTTP02 Clave incorrecta | 401 al iniciar sesión | mensaje: Credenciales inválidas. |
| HTTP03 Aislamiento de lectura | Solo producto A al alterar cabecera de negocio | productos A: 1; productos B visibles: 0 |
| HTTP04 Aislamiento de escritura | 404 y ningún cambio sobre producto B | código HTTP: 404; producto B sin cambios: sí |
| HTTP05 Permiso vendedor | 403 al crear productos | mensaje: Tu rol no tiene permisos para realizar esta acción. |
| HTTP06 Venta inválida sin efectos | Rechazo de cantidad negativa y conservación de existencias | código HTTP: 400; existencias: 10; ventas nuevas: 0 |
| HTTP07 Venta y descuento de existencias | Venta por 2000 CLP y existencias de 10 a 8 | total CLP: 2000; existencias finales: 8 |
| HTTP08 Reintento idempotente | Una venta y ocho unidades disponibles tras repetir la misma clave | misma venta: sí; ventas: 1; existencias: 8 |
| HTTP09 Venta fiada | Deuda de 1000 CLP vinculada al cliente | deuda CLP: 1000; existencias finales: 7 |
| HTTP10 Abono de deuda | Saldo de 1000 a 600 CLP | abono CLP: 400; saldo CLP: 600 |
| HTTP11 Consulta de auditoría por rol | Dueño obtiene eventos y vendedor recibe 403 | eventos visibles para el propietario: 6; código HTTP del vendedor: 403 |
| HTTP12 Revocación de sesión | 401 después de cerrar sesión | sesión revocada: sí; código HTTP: 401 |

La consulta de auditoría devolvió seis eventos al dueño y rechazó al vendedor. Eso verifica acceso y presencia de eventos para esta secuencia; no demuestra que toda operación del sistema audite atómicamente. Las duraciones individuales guardadas en JSON describen una corrida local pequeña y no son una prueba de rendimiento.

# Incidencias del instrumento y bloqueos

El primer guion esperaba HTTP 201 para el abono; el contrato implementado devuelve HTTP 200. El segundo intento quiso interpretar como JSON la respuesta vacía HTTP 204 del cierre de sesión. Se corrigieron ambas expectativas del instrumento y se repitió toda la campaña. Los intentos iniciales se conservan junto a la evidencia para que el resultado final no oculte ese ajuste. No se modificó código del producto para aprobar las comprobaciones.

El lanzamiento de navegador falló por ausencia del binario esperado. La descarga alternativa terminó con un archivo inválido. No se registran capturas ni resultados de interacción como si se hubieran obtenido. Los archivos de prueba incluyen comprobaciones de contraste sobre valores de color y selectores; no equivalen a una auditoría completa WCAG ni a una sesión con lector de pantalla (W3C, 2023).

# Reproducción de la campaña

Usar una copia limpia de la revisión indicada, Node y npm compatibles y un ambiente de prueba sin credenciales de producción. Conservar las versiones exactas del entorno. Ejecutar instalación y tipos, y luego el siguiente ejecutor de pruebas desde la raíz. La opción de importación sigue el uso documentado de tsx con Node (Node.js, s. f.; tsx, s. f.).

```bash
npm ci --include=dev --ignore-scripts --no-audit --no-fund
npm run build -w packages/shared
npm run typecheck
node --import tsx --test --test-isolation=none --test-reporter=tap apps/api/src/localito.test.ts scripts/improvements.test.ts scripts/hardening.test.ts scripts/design.test.ts scripts/dashboard.test.ts scripts/inventory.test.ts scripts/sale-workspace.test.ts
npm run build
```

Para HTTP, iniciar la API con `API_HOST=127.0.0.1`, `API_PORT=43201`, `NODE_ENV=development` y sin variables de conexión a base de datos ni plataforma Vercel. Ejecutar `node --import tsx apps/api/src/server.ts` en ese ambiente y luego `python3 validar_api.py` desde la carpeta de evidencias. El guion verifica que la salud indique almacenamiento en memoria antes de crear sus datos. Cada ejecución crea negocios de prueba independientes. Detener el proceso al finalizar. No apuntar el guion a producción.

La reproducción debe conservar salida completa, código de salida, revisión, versiones y fecha. Si se cambia el ejecutor de pruebas, sus opciones o el servicio persistente, se registra una nueva campaña con su alcance, en lugar de reemplazar silenciosamente los resultados anteriores.

# Evidencias, integridad y custodia

La carpeta de evidencias incluye registros, salidas, guion HTTP, resultados finales y dos intentos iniciales. El manifiesto SHA-256 permite comprobar que los archivos recibidos no cambiaron. Los registros contienen datos sintéticos y no incluyen credenciales de sesión ni de comercios reales. El manifiesto del código conserva rutas y huellas criptográficas de los objetos de contenido de los 105 archivos recuperados, no una afirmación de haber auditado todos los archivos del repositorio.

# Interpretación y acciones pendientes

La evidencia respalda las reglas comprobadas en memoria y la integración HTTP local. La mayor incertidumbre técnica restante está en transacciones concurrentes y recuperación persistente. Deben ejecutarse CP114–118 sobre PostgreSQL, registrar estados antes y después y comprobar aislamiento con dos negocios. CP119–120 cubren fallos de red y cambios al sincronizar; CP121–123 cubren dispositivos, usuarios y carga bajo condiciones definidas.

La aceptación de las historias corresponde al equipo y al responsable del producto. Este informe no cambia estados de las iteraciones ni demuestra éxito comercial. El Control de entrega identifica qué evidencias faltan y quién puede coordinarlas.

# Conclusiones

Los resultados actuales permiten defender la implementación y los mecanismos probados con evidencia rastreable. La tesis debe describirse como avance técnicamente verificado dentro de este alcance y completar el trabajo de campo y las pruebas persistentes antes de sostener conclusiones de uso, recuperación o desempeño productivo.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Consorcio de la Web Mundial (W3C) (2023). *Pautas de accesibilidad para el contenido web 2.2 *. https://www.w3.org/TR/WCAG22/

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, revisión ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Node.js (s. f.). *Ejecutor de pruebas *. https://nodejs.org/api/test.html

tsx (s. f.). *Interfaz de línea de comandos de Node.js *. https://github.com/privatenumber/tsx/blob/master/docs/dev-api/node-cli.md
