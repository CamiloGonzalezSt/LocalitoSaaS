# Requisitos no funcionales de Localito

# Resumen ejecutivo

Los requisitos no funcionales describen condiciones de seguridad, integridad, rendimiento, usabilidad y operación de Localito. La versión anterior desarrollaba doce escenarios. Esta edición conserva sus identificadores, incorpora seis complementarios y relaciona los dieciocho con los quince requisitos NRF del documento maestro. Los umbrales sin medición se señalan expresamente como propuestas para aceptación del equipo.

# Introducción y método de especificación

Un requisito debe permitir decidir si se cumple. Por eso cada escenario identifica condición, estímulo y respuesta verificable, utilizando la orientación de calidad de arc42 y el modelo ISO/IEC 25010 como referencias (ISO e IEC, 2023; arc42, s. f.b). No se declara conformidad con una norma por listar sus categorías. Las decisiones concretas proceden del repositorio (Equipo Localito, 2026).

Los resultados se distinguen de objetivos. Rendimiento interactivo es una necesidad; un percentil y una carga definida permiten medirla. Un caso pendiente sigue pendiente aunque exista un mecanismo en código. Las siguientes metas amplían la especificación y requieren acuerdo antes de usarse como condición contractual.

# Catálogo de escenarios de calidad

## RNF01 Seguridad

Estímulo y contexto. Un usuario sin sesión o con rol insuficiente intenta una operación administrativa.

Respuesta requerida. La API rechaza la solicitud y no cambia registros.

Criterio y estado. Cero escrituras en los casos negativos; 401 o 403 según identidad y rol.

Mecanismo observado. auth.ts, requireRoles y sesiones. 

Procedimiento de comprobación. Sesión ausente, revocada y rol seller en operación owner.

## RNF02 Aislamiento multi negocio

Estímulo y contexto. Un usuario de A envía un identificador válido de B.

Respuesta requerida. El recurso ajeno no se devuelve ni modifica.

Criterio y estado. Cero registros de B visibles o alterados con la sesión de A.

Mecanismo observado. tenantIdFromRequest y predicados negocio_id. 

Procedimiento de comprobación. Dos negocios de prueba con productos y clientes distintos.

## RNF03 Persistencia

Estímulo y contexto. El proceso productivo inicia sin conexión PostgreSQL válida.

Respuesta requerida. Falla de forma visible y no acepta memoria como almacenamiento productivo.

Criterio y estado. Ninguna venta productiva confirmada con storage:memory.

Mecanismo observado. requiresPersistentRepository y health. 

Procedimiento de comprobación. NODE_ENV production con URL ausente o inválida en entorno aislado.

## RNF04 Disponibilidad operativa

Estímulo y contexto. El proveedor de IA o la base no responde durante una operación.

Respuesta requerida. Se informa el error y se conserva la diferencia entre propuesta y confirmación.

Criterio y estado. No presentar como persistida una operación sin confirmación; plazo de respuesta externa sujeto a configuración.

Mecanismo observado. Errores de proveedor y repositorio. 

Procedimiento de comprobación. Simular timeout sin confirmar cambios ni repetir pagos externos.

## RNF05 Rendimiento

Estímulo y contexto. Diez usuarios de prueba consultan catálogo de mil productos en un ambiente controlado.

Respuesta requerida. La búsqueda y consulta se mantienen utilizables.

Criterio y estado. Meta propuesta de p95 menor a dos segundos para consulta sin IA; no medida en esta revisión.

Mecanismo observado. Índices, cliente HTTP y snapshots. 

Procedimiento de comprobación. Registrar carga, red, hardware, errores y percentiles antes de aceptar la meta.

## RNF06 Usabilidad

Estímulo y contexto. Un vendedor prepara venta, observa un error y retoma su ticket.

Respuesta requerida. Los estados y acciones disponibles resultan comprensibles.

Criterio y estado. Meta propuesta de completar las tareas núcleo sin asistencia en UAT; reportar participantes y tasa real.

Mecanismo observado. Vistas React y estados de formularios. 

Procedimiento de comprobación. Registrar tareas, tiempos, errores y comentarios sin inventar entrevistas.

## RNF07 Accesibilidad visual

Estímulo y contexto. Un usuario navega con teclado y utiliza ambos temas.

Respuesta requerida. Hay foco identificable, etiquetas y contraste legible.

Criterio y estado. Referencia propuesta WCAG 2.2 AA; ningún cumplimiento global se declara sin revisión.

Mecanismo observado. FormControls, estilos y componentes. 

Procedimiento de comprobación. Revisión de teclado, foco, etiquetas y contraste en pantallas críticas (W3C, 2023).

## RNF08 Integridad transaccional

Estímulo y contexto. Una venta incluye un producto sin stock entre varios válidos.

Respuesta requerida. La operación se rechaza sin cambios parciales.

Criterio y estado. Stock, ventas y deuda permanecen iguales al estado inicial en el rechazo.

Mecanismo observado. BEGIN COMMIT ROLLBACK y validación de venta. 

Procedimiento de comprobación. Comprobar registros reales en PostgreSQL además de lógica en memoria.

## RNF09 Idempotencia

Estímulo y contexto. Se reenvía la misma venta con igual clave y negocio.

Respuesta requerida. Se resuelve la operación sin duplicar venta ni stock.

Criterio y estado. Una venta final por combinación negocio y clave; misma evidencia para peticiones concurrentes.

Mecanismo observado. Índice único y pg_advisory_xact_lock. 

Procedimiento de comprobación. Peticiones simultáneas y pérdida de respuesta posterior al commit.

## RNF10 Trazabilidad

Estímulo y contexto. El dueño consulta una modificación sensible de inventario.

Respuesta requerida. La evidencia relaciona acción, recurso y autor.

Criterio y estado. Registro con negocio, fecha y detalle; no se declara inmutabilidad criptográfica.

Mecanismo observado. auditoria y movimientos_stock. 

Procedimiento de comprobación. Crear operación conocida y revisar consulta, filtros y permisos.

## RNF11 Privacidad

Estímulo y contexto. Se utiliza una imagen de factura para proponer mercadería.

Respuesta requerida. Se minimizan datos enviados y se revisa el tratamiento del proveedor.

Criterio y estado. No afirmar retención externa nula sin revisar condiciones; usar datos sintéticos en evaluación.

Mecanismo observado. Adaptador visual y configuración backend. 

Procedimiento de comprobación. Inspeccionar payload y almacenamiento local y servidor; distinguir fotos de productos de imágenes de factura.

## RNF12 Compatibilidad

Estímulo y contexto. La PWA se abre en navegador móvil o de escritorio.

Respuesta requerida. Las tareas compatibles funcionan y las restricciones se explican.

Criterio y estado. Matriz propuesta Chrome, Edge y Safari con versiones registradas; cámara requiere contexto permitido.

Mecanismo observado. PWA, cámara, Web Locks e IndexedDB. 

Procedimiento de comprobación. Dispositivos físicos, cuotas de almacenamiento y reconexión (MDN Web Docs, s. f.).

# Escenarios complementarios de calidad

El documento maestro utiliza identificadores NRF-01 a NRF-15. Este documento conserva RNF01 a RNF12 como escenarios detallados y añade seis escenarios para cubrir explícitamente escalabilidad, mantenibilidad, recuperación, instalación, portabilidad y observabilidad. La tabla de correspondencia evita renumerar registros anteriores.

## RNF13 Escalabilidad por negocio

Se requiere incorporar un negocio mediante configuración y registros, sin modificar código para cada cliente. La comprobación mínima consiste en registrar dos negocios independientes y repetir catálogo y venta con sus propias sesiones. HTTP03 y HTTP04 aportan evidencia de separación; no constituyen una prueba de capacidad masiva. La meta de carga debe acordarse con un volumen de negocios, usuarios simultáneos y conexiones PostgreSQL definidos.

## RNF14 Mantenibilidad

Un cambio en un contrato compartido debe detectarse mediante análisis de tipos y pruebas relacionadas. El repositorio debe permitir localizar responsabilidades de interfaz, aplicación y persistencia. La campaña completó typecheck y build; el tamaño de los archivos principales continúa como deuda técnica. Se propone exigir, para nuevos cambios, identificación de RF o HU, revisión de contratos y registro de regresión pertinente.

## RNF15 Recuperación

Ante pérdida de conexión se debe conservar el ticket o la venta pendiente y mostrar su estado. Tras recuperar red, la misma clave identifica el reintento. Las pruebas automatizadas verifican lógica de cola con almacenamiento simulado. La recuperación de una base exige respaldo y restauración en un destino separado; todavía no hay RPO o RTO medidos. El caso CP-118 define esa comprobación.

## RNF16 Instalabilidad

La PWA debe ofrecer un proceso de instalación comprensible en los navegadores compatibles. La presencia de manifest y service worker constituye evidencia de implementación. La aceptación requiere instalar, abrir desde el icono y repetir una tarea en un teléfono real, anotando modelo, sistema operativo, navegador y fecha. Cámara y permisos se prueban por separado de la instalación.

## RNF17 Portabilidad

Una instalación limpia debe resolver las dependencias del lockfile y compilar el frontend, la API y los contratos. La campaña registró npm ci y build correctos en Ubuntu con Node 24.19.0. El workflow declara Node 22, cuya ejecución sigue siendo una verificación adicional del entorno de CI. El despliegue de PostgreSQL mediante Docker queda documentado, pero el contenedor no fue ejecutado en esta campaña.

## RNF18 Observabilidad

Los errores relevantes deben permitir localizar operación y causa sin publicar credenciales. Health informa el modo de almacenamiento y los registros del servidor deben distinguir errores de dominio de fallas internas. HTTP11 verifica acceso a auditoría por rol. La aceptación operacional requiere provocar una falla controlada de dependencia, conservar el registro depurado y comprobar que la respuesta pública no exponga URL de conexión, token o contraseña.

# Correspondencia con el documento maestro

| Identificador maestro | Atributo | Escenarios de este documento |
| --- | --- | --- |
| NRF-01 | Usabilidad | RNF06 |
| NRF-02 | Rendimiento | RNF05 |
| NRF-03 | Disponibilidad | RNF04 |
| NRF-04 | Seguridad | RNF01 |
| NRF-05 | Privacidad y separación | RNF02 y RNF11 |
| NRF-06 | Escalabilidad | RNF13 |
| NRF-07 | Mantenibilidad | RNF14 |
| NRF-08 | Compatibilidad | RNF12 |
| NRF-09 | Accesibilidad | RNF07 |
| NRF-10 | Auditabilidad | RNF10 |
| NRF-11 | Integridad | RNF08 y RNF09 |
| NRF-12 | Recuperación | RNF15 |
| NRF-13 | Instalabilidad | RNF16 |
| NRF-14 | Portabilidad | RNF17 |
| NRF-15 | Observabilidad | RNF18 |

RNF03 desarrolla además la persistencia exigida por RF-34. Cada registro de verificación conserva versión, ambiente, precondición, resultado esperado, resultado obtenido y evidencia. El estado actual de cada campaña está en Informe de Verificación; las metas propuestas se acuerdan antes de evaluar su cumplimiento.

# Priorización y trazabilidad

Seguridad, aislamiento, persistencia, integridad e idempotencia tienen prioridad alta porque sus fallas afectan operaciones y datos. Usabilidad y compatibilidad condicionan el uso cotidiano. Rendimiento y disponibilidad deben medirse con un ambiente conocido, evitando promesas de capacidad comercial basadas en un MVP académico.

Cada RNF se relaciona con mecanismos de Arquitectura y con pruebas. El caso de reintento de venta verifica RNF09; el caso de recurso ajeno verifica RNF02; el rechazo de stock verifica RNF08. Algunas comprobaciones contribuyen a varios requisitos, pero el registro debe explicar qué condición observa cada una.

# Protocolo de medición y aceptación

Antes de medir se fija commit, volumen de datos, usuarios, red y dispositivo. Se mantienen datos equivalentes entre ejecuciones. Para rendimiento se guardan distribución y errores, no solo promedio. Para usabilidad se registra experiencia de participantes y ayuda recibida. Para compatibilidad se registran versión y funciones efectivamente probadas.

La aceptación de nuevas metas corresponde al equipo y Product Owner. Este documento no garantiza SLA, RPO o RTO productivos. Si se define restauración en un plazo, primero debe ejecutarse un respaldo y restauración controlados. Las conclusiones distinguen objetivo propuesto, mecanismo implementado y resultado medido.

# Conclusiones

Los RNF desarrollados permiten planificar comprobaciones específicas y sostener decisiones de arquitectura. La principal mejora respecto del catálogo breve es hacer visible qué se verifica y qué aún no se midió. Su valor académico reside en esa relación con comportamiento y evidencia.

# Referencias

Consulta de fuentes: 03 y 04 de octubre de 2026. Las fichas ISO son resúmenes públicos; no se declara certificación.

arc42 (s. f.b). *Quality requirements*. https://docs.arc42.org/section-10/

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

ISO e IEC (2023). *25010 Product quality model resumen público*. https://www.iso.org/standard/78176.html

MDN Web Docs (s. f.). *Offline and background operation for PWAs*. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

World Wide Web Consortium (2023). *Web Content Accessibility Guidelines 2.2*. https://www.w3.org/TR/WCAG22/

