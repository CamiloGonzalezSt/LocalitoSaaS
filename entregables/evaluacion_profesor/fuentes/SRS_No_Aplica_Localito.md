# Aplicabilidad de SRS y gestión de requisitos de Localito

# Resumen ejecutivo

La documentación del repositorio interpreta que el criterio SRS de la pauta aplica a equipos que declaran metodología Cascada. Localito declara Scrum, por lo que este documento registra la no aplicabilidad de ese criterio específico y explica dónde se documentan los requisitos. Esa resolución académica no elimina la ingeniería de requisitos ni implica que Scrum prohíba una SRS.

El proyecto utiliza visión y objetivo, historias y criterios de aceptación, requisitos no funcionales, modelos y pruebas. Este documento consolida una guía para encontrar y revisar esa información, conservando trazabilidad y alcance. No se presenta como una SRS completa conforme a ISO/IEC/IEEE 29148.

# Introducción y alcance de la decisión

El checklist del repositorio enumera documentos y relaciona su aplicabilidad con la metodología declarada. Para Localito, la justificación consiste en responder a ese criterio sin inventar una obligación adicional. La versión oficial íntegra de la pauta debe confirmar esta interpretación antes de la entrega definitiva.

ISO/IEC/IEEE 29148 trata procesos e información de requisitos y se declara aplicable con independencia de metodología (ISO et al., 2018). Por eso es incorrecto afirmar que una especificación sería incompatible con Scrum. Si el profesor solicita posteriormente una SRS, puede construirse a partir de los mismos requisitos, sin reemplazar la gestión incremental.

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

Si se exige ese formato, una especificación debería consolidar propósito, contexto, actores, interfaces, requisitos identificados, reglas, atributos de calidad y verificación. Es posible estructurarla usando referencias de ingeniería de requisitos (ISO et al., 2018), pero el cumplimiento completo requeriría revisar el texto normativo y la pauta aplicable. No basta con poner el nombre de una norma en la portada.

La consolidación tendría que resolver ambigüedades de permisos, prestaciones por plan, comportamiento offline y pagos externos. También conservaría exclusiones tributarias y diferencias entre implementación y evidencia. Los documentos actuales aportan insumos para esa tarea, sin afirmar que ya exista una SRS certificada.

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

El repositorio registra la no aplicabilidad del criterio SRS según su interpretación de la pauta. Localito sí documenta y verifica requisitos a través de sus artefactos. La justificación se limita a la evaluación académica y mantiene abierta la posibilidad de consolidarlos en una especificación formal si se solicita.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

ISO, IEC e IEEE (2018). *29148 Requirements engineering resumen público*. https://www.iso.org/standard/72089.html

