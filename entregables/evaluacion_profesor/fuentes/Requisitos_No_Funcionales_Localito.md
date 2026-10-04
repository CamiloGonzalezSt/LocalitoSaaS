# Requisitos no funcionales de Localito

# Resumen ejecutivo

Los requisitos no funcionales describen condiciones de seguridad, integridad, rendimiento, usabilidad y operación de Localito. La fuente original contiene doce categorías. Esta revisión conserva sus identificadores y desarrolla escenarios, mecanismos, pruebas y metas propuestas. Los umbrales sin medición se señalan expresamente como propuestas para aceptación del equipo.

# Introducción y método de especificación

Un requisito debe permitir decidir si se cumple. Por eso cada escenario identifica condición, estímulo y respuesta verificable, utilizando la orientación de calidad de arc42 y el modelo ISO/IEC 25010 como referencias [R16, R28]. No se declara conformidad con una norma por listar sus categorías. Las decisiones concretas proceden del repositorio [P].

Los resultados se distinguen de objetivos. Rendimiento interactivo es una necesidad; un percentil y una carga definida permiten medirla. Un caso pendiente sigue pendiente aunque exista un mecanismo en código. Las siguientes metas amplían la especificación y requieren acuerdo antes de usarse como condición contractual.

# Catálogo de escenarios de calidad

## RNF01 Seguridad

Estímulo y contexto. Un usuario sin sesión o con rol insuficiente intenta una operación administrativa.

Respuesta requerida. La API rechaza la solicitud y no cambia registros.

Criterio y estado. Cero escrituras en los casos negativos; 401 o 403 según identidad y rol.

Mecanismo observado. auth.ts, requireRoles y sesiones. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Sesión ausente, revocada y rol seller en operación owner. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF02 Aislamiento multi negocio

Estímulo y contexto. Un usuario de A envía un identificador válido de B.

Respuesta requerida. El recurso ajeno no se devuelve ni modifica.

Criterio y estado. Cero registros de B visibles o alterados con la sesión de A.

Mecanismo observado. tenantIdFromRequest y predicados negocio_id. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Dos negocios de prueba con productos y clientes distintos. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF03 Persistencia

Estímulo y contexto. El proceso productivo inicia sin conexión PostgreSQL válida.

Respuesta requerida. Falla de forma visible y no acepta memoria como almacenamiento productivo.

Criterio y estado. Ninguna venta productiva confirmada con storage:memory.

Mecanismo observado. requiresPersistentRepository y health. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. NODE_ENV production con URL ausente o inválida en entorno aislado. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF04 Disponibilidad operativa

Estímulo y contexto. El proveedor de IA o la base no responde durante una operación.

Respuesta requerida. Se informa el error y se conserva la diferencia entre propuesta y confirmación.

Criterio y estado. No presentar como persistida una operación sin confirmación; plazo de respuesta externa sujeto a configuración.

Mecanismo observado. Errores de proveedor y repositorio. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Simular timeout sin confirmar cambios ni repetir pagos externos. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF05 Rendimiento

Estímulo y contexto. Diez usuarios de prueba consultan catálogo de mil productos en un ambiente controlado.

Respuesta requerida. La búsqueda y consulta se mantienen utilizables.

Criterio y estado. Meta propuesta de p95 menor a dos segundos para consulta sin IA; no medida en esta revisión.

Mecanismo observado. Índices, cliente HTTP y snapshots. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Registrar carga, red, hardware, errores y percentiles antes de aceptar la meta. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF06 Usabilidad

Estímulo y contexto. Un vendedor prepara venta, observa un error y retoma su ticket.

Respuesta requerida. Los estados y acciones disponibles resultan comprensibles.

Criterio y estado. Meta propuesta de completar las tareas núcleo sin asistencia en UAT; reportar participantes y tasa real.

Mecanismo observado. Vistas React y estados de formularios. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Registrar tareas, tiempos, errores y comentarios sin inventar entrevistas. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF07 Accesibilidad visual

Estímulo y contexto. Un usuario navega con teclado y utiliza ambos temas.

Respuesta requerida. Hay foco identificable, etiquetas y contraste legible.

Criterio y estado. Referencia propuesta WCAG 2.2 AA; ningún cumplimiento global se declara sin revisión.

Mecanismo observado. FormControls, estilos y componentes. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Revisión de teclado, foco, etiquetas y contraste en pantallas críticas [R17]. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF08 Integridad transaccional

Estímulo y contexto. Una venta incluye un producto sin stock entre varios válidos.

Respuesta requerida. La operación se rechaza sin cambios parciales.

Criterio y estado. Stock, ventas y deuda permanecen iguales al estado inicial en el rechazo.

Mecanismo observado. BEGIN COMMIT ROLLBACK y validación de venta. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Comprobar registros reales en PostgreSQL además de lógica en memoria. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF09 Idempotencia

Estímulo y contexto. Se reenvía la misma venta con igual clave y negocio.

Respuesta requerida. Se resuelve la operación sin duplicar venta ni stock.

Criterio y estado. Una venta final por combinación negocio y clave; misma evidencia para peticiones concurrentes.

Mecanismo observado. Índice único y pg_advisory_xact_lock. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Peticiones simultáneas y pérdida de respuesta posterior al commit. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF10 Trazabilidad

Estímulo y contexto. El dueño consulta una modificación sensible de inventario.

Respuesta requerida. La evidencia relaciona acción, recurso y autor.

Criterio y estado. Registro con negocio, fecha y detalle; no se declara inmutabilidad criptográfica.

Mecanismo observado. auditoria y movimientos_stock. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Crear operación conocida y revisar consulta, filtros y permisos. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF11 Privacidad

Estímulo y contexto. Se utiliza una imagen de factura para proponer mercadería.

Respuesta requerida. Se minimizan datos enviados y se revisa el tratamiento del proveedor.

Criterio y estado. No afirmar retención externa nula sin revisar condiciones; usar datos sintéticos en evaluación.

Mecanismo observado. Adaptador visual y configuración backend. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Inspeccionar payload y almacenamiento local y servidor; distinguir fotos de productos de imágenes de factura. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

## RNF12 Compatibilidad

Estímulo y contexto. La PWA se abre en navegador móvil o de escritorio.

Respuesta requerida. Las tareas compatibles funcionan y las restricciones se explican.

Criterio y estado. Matriz propuesta Chrome, Edge y Safari con versiones registradas; cámara requiere contexto permitido.

Mecanismo observado. PWA, cámara, Web Locks e IndexedDB. Su presencia acredita diseño o código y requiere verificación de comportamiento.

Procedimiento de comprobación. Dispositivos físicos, cuotas de almacenamiento y reconexión [R18]. Se conservan commit, ambiente, datos y resultado. Ningún resultado pendiente se transforma en aprobado por esta ampliación documental.

# Priorización y trazabilidad

Seguridad, aislamiento, persistencia, integridad e idempotencia tienen prioridad alta porque sus fallas afectan operaciones y datos. Usabilidad y compatibilidad condicionan el uso cotidiano. Rendimiento y disponibilidad deben medirse con un ambiente conocido, evitando promesas de capacidad comercial basadas en un MVP académico.

Cada RNF se relaciona con mecanismos de Arquitectura y con pruebas. El caso de reintento de venta verifica RNF09; el caso de recurso ajeno verifica RNF02; el rechazo de stock verifica RNF08. Algunas comprobaciones contribuyen a varios requisitos, pero el registro debe explicar qué condición observa cada una.

# Protocolo de medición y aceptación

Antes de medir se fija commit, volumen de datos, usuarios, red y dispositivo. Se mantienen datos equivalentes entre ejecuciones. Para rendimiento se guardan distribución y errores, no solo promedio. Para usabilidad se registra experiencia de participantes y ayuda recibida. Para compatibilidad se registran versión y funciones efectivamente probadas.

La aceptación de nuevas metas corresponde al equipo y Product Owner. Este documento no garantiza SLA, RPO o RTO productivos. Si se define restauración en un plazo, primero debe ejecutarse un respaldo y restauración controlados. Las conclusiones distinguen objetivo propuesto, mecanismo implementado y resultado medido.

# Conclusiones

Los RNF desarrollados permiten planificar comprobaciones específicas y sostener decisiones de arquitectura. La principal mejora respecto del catálogo breve es hacer visible qué se verifica y qué aún no se midió. Su valor académico reside en esa relación con comportamiento y evidencia.

# Referencias y evidencia de la versión

Las referencias externas fundamentan conceptos y organización. La descripción específica de Localito procede del repositorio. Se consultaron fuentes públicas el 03 de octubre de 2026. Las fichas públicas ISO se utilizan para alcance y orientación, sin atribuir acceso al texto normativo completo ni conformidad certificada.

[R16] ISO IEC 2023. 25010 Product quality model resumen público. https://www.iso.org/standard/78176.html

[R17] W3C 2023. Web Content Accessibility Guidelines 2.2. https://www.w3.org/TR/WCAG22/

[R18] MDN Web Docs. Offline and background operation for PWAs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

[R28] arc42. Quality requirements. https://docs.arc42.org/section-10/

[P] Equipo Localito. Repositorio LocalitoSaaS. Commit base 05a6f34b749cdc97dd560d91bb9be057a1197fbf. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf

Fuentes internas revisadas: README.md; package.json y manifests de apps; apps/api/src/server.ts, repository.ts y auth.ts; db/schema.sql; apps/web/src/lib/offline.ts y workspaceCache.ts; docs de requisitos, calidad, operación y Scrum. La revisión es documental y estática. No crea resultados de pruebas funcionales, reuniones ni aceptación de usuario.
