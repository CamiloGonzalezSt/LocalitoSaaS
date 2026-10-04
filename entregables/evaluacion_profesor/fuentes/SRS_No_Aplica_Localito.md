# Aplicabilidad de SRS y gestión de requisitos de Localito

# Resumen ejecutivo

La pauta recibida establece que la SRS formal aplica a equipos que declaran metodología Cascada. Localito declara Scrum, por lo que este documento registra la no aplicabilidad de ese criterio específico y explica dónde se documentan los requisitos. Esa resolución académica no elimina la ingeniería de requisitos ni implica que Scrum prohíba una SRS.

El proyecto utiliza visión y objetivo, historias y criterios de aceptación, requisitos no funcionales, modelos y pruebas. Este documento consolida una guía para encontrar y revisar esa información, conservando trazabilidad y alcance. No se presenta como una SRS completa conforme a ISO/IEC/IEEE 29148.

# Introducción y alcance de la decisión

La captura de la pauta enumera documentos detectables y condiciona Product Vision, backlogs, DoD, retrospectivas y SRS a la metodología. Para Localito, la justificación consiste en responder a ese criterio sin inventar una obligación adicional. La captura no establece que todos los equipos deban entregar una SRS extensa independientemente de su enfoque.

ISO/IEC/IEEE 29148 trata procesos e información de requisitos y se declara aplicable con independencia de metodología [R7]. Por eso es incorrecto afirmar que una especificación sería incompatible con Scrum. Si el profesor solicita posteriormente una SRS, puede construirse a partir de los mismos requisitos, sin reemplazar la gestión incremental.

# Organización de los requisitos

| Tipo de información | Documento principal | Qué debe permitir revisar |
| --- | --- | --- |
| Problema y objetivos | Documento de Inicio | Necesidad y alcance |
| Visión y dirección | Product Vision | Usuarios y valor esperado |
| Requisitos funcionales | Product Backlog | Actor, capacidad y aceptación |
| Trabajo de iteración | Sprint Backlog | Objetivo y compromiso vigente |
| Requisitos de calidad | RNF | Condición y verificación |
| Diseño de solución | Arquitectura, datos y UML | Mecanismos y relaciones |
| Aceptación | Plan de Pruebas y DoD | Caso, resultado y evidencia |

Las rutas de Markdown se mantienen como fuentes del repositorio y los Word amplían su explicación. La captura de un tablero no sustituye criterios de aceptación; un diagrama no sustituye una regla de negocio. Cada documento responde una parte y debe poder enlazarse con los demás.

# Requisitos funcionales y reglas de negocio

Un requisito funcional describe la operación del usuario. Registrar venta incluye seleccionar productos y confirmar. Las reglas agregan restricciones: el producto pertenece al negocio, no está desactivado, hay stock cuando se controla y el total se obtiene del servidor. La historia debe evitar que esos detalles queden implícitos.

El fiado necesita cliente válido, estado de crédito y saldo. Una recepción requiere cantidades y productos permitidos. Los pagos mixtos deben cuadrar con el total. Estas reglas aparecen en la implementación y deben revisarse con el Product Owner. Los criterios desarrollados en esta versión son precisiones propuestas; no se atribuyen a una reunión previa de aceptación.

# Requisitos no funcionales y comprobación

Seguridad, integridad, compatibilidad y operación se expresan como condiciones verificables. Decir que la aplicación es rápida no define una prueba. El documento de RNF añade escenarios y metas propuestas, indicando cuáles no tienen medición. La descripción del código acredita un mecanismo, mientras el resultado depende de su prueba.

Los requisitos de producción deben separar disponibilidad del proveedor y resultado completo del proceso. Que PostgreSQL esté conectado no significa que una venta, IA o restauración haya sido validada. La calidad documental exige conservar esa distinción para que el evaluador no interprete configurado como probado.

# Trazabilidad y cambios

La cadena propuesta es necesidad, historia, diseño, commit y prueba. Cada nuevo requisito debe indicar origen, prioridad y alcance. Si cambia el proveedor visual, se revisan configuración, errores y casos de IA. Si cambia la forma de calcular caja, se revisan operaciones y casos relacionados, además del manual.

Las versiones registran fecha y commit para evitar comparar un resultado antiguo con código diferente. Los estados futuros se mantienen pendientes. No se crean story points, reuniones o métricas históricas ausentes. El detalle nuevo se presenta como refinamiento documental verificable con el equipo.

# Condiciones para una futura SRS formal

Si se exige ese formato, una especificación debería consolidar propósito, contexto, actores, interfaces, requisitos identificados, reglas, atributos de calidad y verificación. Es posible estructurarla usando referencias de ingeniería de requisitos [R7], pero el cumplimiento completo requeriría revisar el texto normativo y la pauta aplicable. No basta con poner el nombre de una norma en la portada.

La consolidación tendría que resolver ambigüedades de permisos, prestaciones por plan, comportamiento offline y pagos externos. También conservaría exclusiones tributarias y diferencias entre implementación y evidencia. Los documentos actuales aportan insumos para esa tarea, sin afirmar que ya exista una SRS certificada.

# Conclusiones

El criterio SRS no aplica según la metodología y la pauta recibida. Localito sí documenta y verifica requisitos a través de sus artefactos. La justificación se limita a la evaluación académica y mantiene abierta la posibilidad de consolidarlos en una especificación formal si se solicita.

# Referencias y evidencia de la versión

Las referencias externas fundamentan conceptos y organización. La descripción específica de Localito procede del repositorio. Se consultaron fuentes públicas el 03 de octubre de 2026. Las fichas públicas ISO se utilizan para alcance y orientación, sin atribuir acceso al texto normativo completo ni conformidad certificada.

[R7] ISO IEC IEEE 2018. 29148 Requirements engineering resumen público. https://www.iso.org/standard/72089.html

[P] Equipo Localito. Repositorio LocalitoSaaS. Commit base 05a6f34b749cdc97dd560d91bb9be057a1197fbf. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/05a6f34b749cdc97dd560d91bb9be057a1197fbf

Fuentes internas revisadas: README.md; package.json y manifests de apps; apps/api/src/server.ts, repository.ts y auth.ts; db/schema.sql; apps/web/src/lib/offline.ts y workspaceCache.ts; docs de requisitos, calidad, operación y Scrum. La revisión es documental y estática. No crea resultados de pruebas funcionales, reuniones ni aceptación de usuario.
