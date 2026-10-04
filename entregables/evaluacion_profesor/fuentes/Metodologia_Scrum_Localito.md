# Metodología Scrum de Localito

# Resumen ejecutivo

El equipo de Localito utiliza Scrum para gestionar un producto cuya solución y calidad se desarrollan de manera incremental. Trello es la fuente de seguimiento activa descrita por el repositorio; Jira se conserva como antecedente histórico. La planificación contiene una etapa de preparación y ocho Sprints, con Sprint 4 en curso al 03 de octubre de 2026. Los tableros futuros no contienen historias comprometidas.

La aplicación del marco debe distinguir estado de tarjeta, presencia de código y evidencia de aceptación. Este documento describe roles, eventos, artefactos, ajustes académicos y controles de trazabilidad. No añade reuniones, asistencia ni resultados que no existan en los registros del proyecto.

# Introducción y fundamento

Localito combina módulos que se relacionan entre sí y decisiones sujetas a aprendizaje: operación offline, pagos mixtos, catálogo y reconocimiento visual. Un enfoque incremental permite demostrar una venta básica antes de ampliar funciones, revisar errores y reordenar trabajo según su valor. La elección no se justifica solamente por usar un tablero o asignar fechas; debe existir inspección del incremento y adaptación del plan.

La Guía Scrum define responsabilidades, eventos y artefactos; Localito toma esa guía como referencia principal (Schwaber y Sutherland, 2020). Las prácticas de historias de usuario, colores y plantillas de tarjetas se utilizan como herramientas del equipo. No se presentan como elementos obligatorios de Scrum.

# Justificación de la elección

Una planificación completamente predictiva sería difícil de mantener ante cambios de proveedor de IA, errores de sincronización y aprendizaje sobre el flujo del vendedor. Scrum permite limitar el compromiso al objetivo de una iteración y mantener las capacidades futuras en un backlog ordenado. El equipo conserva la necesidad de documentar arquitectura y requisitos: usar un marco ágil no elimina ese trabajo.

La entrega académica exige trazabilidad adicional. Una historia cerrada necesita criterios, evidencia técnica y explicación funcional para el evaluador. Por eso el plan de trabajo se vincula con commits y casos de prueba. Si solo existe un componente visual o una prueba en memoria, la observación debe indicar el alcance real.

# Equipo y acuerdos de trabajo

| Integrante | Responsabilidad | Evidencia de aplicación |
| --- | --- | --- |
| Alexander Patiño | Product Owner y orden del backlog | Historias, prioridades y aceptación |
| Samuel Solís | Scrum Master y seguimiento | Impedimentos, eventos y acciones de mejora |
| Camilo González | Desarrollo e integración | Código, pruebas, build y documentación |

El trabajo técnico puede distribuirse entre integrantes según capacidad. El responsable de una tarjeta indica seguimiento actual y no convierte todas las historias de Alexander en implementación exclusiva de Alexander. Las responsabilidades Scrum y las asignaciones operativas deben mantenerse distinguibles.

Los acuerdos propuestos para mejorar la trazabilidad consisten en registrar un identificador de historia en los cambios relevantes, actualizar pruebas al variar una regla y conservar el estado pendiente cuando falta evidencia. Estos acuerdos se documentan como reglas de trabajo a aplicar, sin afirmar que fueron aprobados en una reunión inexistente.

# Eventos y aplicación al semestre

## Sprint Planning

El Planning define por qué la iteración es valiosa, qué elementos se seleccionan y cómo se entregan. En Localito debe revisar dependencias: para vender con stock es necesario disponer de catálogo, identidad y persistencia. El objetivo no se reemplaza por una lista de tareas; orienta las decisiones si el alcance necesita renegociarse.

El equipo debe estimar su capacidad considerando actividades académicas y disponibilidad real. Las estimaciones nuevas pueden expresarse como propuestas de refinamiento, pero no se inventan story points históricos. Antes de incorporar historias futuras se comprueba que el objetivo y sus criterios sean comprendidos por quien desarrolla y quien acepta.

## Daily Scrum

Su utilidad es adaptar el plan de los Developers hacia el objetivo del Sprint. Los registros académicos pueden documentar impedimentos y decisiones, pero un chat informal no prueba por sí solo un evento formal diario. La ejecución exacta y asistencia deben sustentarse en evidencia del equipo, sin fabricar actas.

## Sprint Review

La Review permite inspeccionar el incremento con interesados. Para Localito, mostrar una venta y verificar el stock resultante aporta más que describir que el módulo está listo. Debe anotarse qué se demostró, qué recibió observaciones y qué pasa al backlog. Un video puede apoyar la demostración, pero no sustituye aceptación o pruebas de base de datos.

## Sprint Retrospective

La retrospectiva analiza la forma de trabajar y genera acciones realizables. El documento de Retrospectivas conserva las síntesis existentes y propone cómo medir sus mejoras. No se redactan resultados del Sprint 4 antes de su cierre, ni de Sprints futuros.

# Artefactos y compromisos

Product Goal orienta el producto; Product Backlog representa trabajo ordenado; Sprint Backlog conserva el objetivo y plan de una iteración; el incremento debe cumplir Definition of Done. Estas relaciones se toman de la Guía Scrum (Schwaber y Sutherland, 2020). Los documentos Word acompañan esos artefactos y ayudan a la evaluación; no reemplazan automáticamente el tablero vivo.

La DoD es común al producto, mientras los criterios de aceptación son específicos de cada elemento. Por ejemplo, HU-14 necesita registrar una venta; la DoD exige además integración, pruebas pertinentes y documentación de cambios. Si la venta existe pero falla persistencia o permisos, el resultado no debe declararse terminado.

# Adaptaciones y límites de la aplicación

Sprint 0 se utiliza en el cronograma como preparación académica. No se atribuye a Scrum como un evento formal obligatorio. El refinamiento es una actividad continua del backlog y no uno de los eventos formales definidos por la guía. Las etiquetas de Trello sirven para clasificar trabajo técnico, QA y eventos; el color no expresa por sí mismo aceptación.

El repositorio describe Sprints cerrados y una excepción documental en el Sprint 3: el refinamiento permanece por hacer y sin miembro real, y offline se replanificó. Esta observación debe conservarse. Ocultarla para que todas las tarjetas parezcan cerradas eliminaría información útil sobre el aprendizaje del equipo.

# Trazabilidad y control de cambios

Una cadena útil enlaza necesidad, HU o PBI, tarjeta y Sprint, commit, prueba y evidencia. Para documentar una mejora de venta se debe poder identificar qué historia la originó, qué regla cambió y qué caso prueba el comportamiento. Si el código avanza antes de que la tarjeta sea aceptada, la documentación indica ambos estados por separado.

Las versiones de estos Word registran el commit base. Las siguientes entregas deben actualizar el corte y conservar historial Git. Los documentos de fuentes no sustituyen capturas o registros de ejecución: explican el diseño y remiten a lo que todavía requiere comprobación.

# Planificación de Sprints — Localito

**Corte verificado en Trello:** 03-10-2026.

| Sprint | Inicio | Fin | Estado real | Sprint Goal / criterio |
| --- | --- | --- | --- | --- |
| Sprint 0 | 10-08-2026 | 14-08-2026 | Cerrado / preparación | Preparación del proyecto, definición inicial y organización técnica. |
| Sprint 1 | 17-08-2026 | 28-08-2026 | Cerrado | Base técnica, autenticación, autorización y aislamiento por negocio. |
| Sprint 2 | 31-08-2026 | 11-09-2026 | Cerrado | Administración de negocio/usuarios y base operativa de catálogo e inventario. |
| Sprint 3 | 14-09-2026 | 25-09-2026 | Cerrado con excepción documental | Trazabilidad de inventario, alertas, código de barras y capacidades PWA. El refinamiento permanece “Por hacer” por falta de evidencia de cierre; offline/sync se replanificó. |
| Sprint 4 | 28-09-2026 | 09-10-2026 | **En curso** | POS y caja: ventas, descuentos, pagos divididos, apertura/cierre de caja y finalización del pendiente offline. |
| Sprint 5 | 12-10-2026 | 23-10-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |
| Sprint 6 | 26-10-2026 | 06-11-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |
| Sprint 7 | 09-11-2026 | 20-11-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |
| Sprint 8 | 23-11-2026 | 04-12-2026 | Futuro | Solo estructura Scrum. HU se seleccionarán durante Planning. |

## Estado del Sprint 4 al 03-10-2026

- **Hecho:** Sprint Planning, HU-14 Registrar una venta en el POS, HU-15 Aplicar descuentos.
- **En progreso:** HU-13 Operar offline y sincronizar cambios, Daily Scrum, Refinamiento.
- **Por hacer:** HU-16 Medios y pagos divididos, HU-17 Apertura de caja, HU-18 Cierre/cuadratura, Sprint Review y Sprint Retrospective.
- **Revisión / QA:** sin tarjetas en este corte.

## Regla para Sprints futuros

La existencia de un tablero futuro **no implica compromiso de alcance**. Sprint 5–8 contienen únicamente eventos/actividades Scrum y no tienen HU asignadas. El Sprint Backlog se define únicamente durante el Planning de la iteración.

# Tableros Trello oficiales — Localito

**Workspace:** Localito Saas  
**Corte:** 03-10-2026

| Tablero | Uso | Enlace |
| --- | --- | --- |
| 00 · Product Backlog · Localito | Product Goal, DoD y PBIs no comprometidos | https://trello.com/b/ufnRtH1n/00-product-backlog-localito |
| 01 · Sprint 1 · Localito | Evidencia histórica Sprint 1 | https://trello.com/b/uexT7yz2/01-sprint-1-localito |
| 02 · Sprint 2 · Localito | Evidencia histórica Sprint 2 | https://trello.com/b/V8cFmat6/02-sprint-2-localito |
| 03 · Sprint 3 · Localito | Evidencia histórica Sprint 3 | https://trello.com/b/XSwFqTy5/03-sprint-3-localito |
| 04 · Sprint 4 · Localito | Sprint vigente al corte | https://trello.com/b/QoPV9hLv/04-sprint-4-localito |
| 05 · Sprint 5 · Localito | Estructura futura, sin HU | https://trello.com/b/4o5TKqmx/05-sprint-5-localito |
| 06 · Sprint 6 · Localito | Estructura futura, sin HU | https://trello.com/b/UPlp6PGI/06-sprint-6-localito |
| 07 · Sprint 7 · Localito | Estructura futura, sin HU | https://trello.com/b/5wZhawbd/07-sprint-7-localito |
| 08 · Sprint 8 · Localito | Estructura futura, sin HU | https://trello.com/b/pivLPEaZ/08-sprint-8-localito |

Existe además un tablero anterior denominado **Localito SaaS · Capstone 2026**. La evidencia Scrum vigente se organiza en los tableros numerados anteriores; no debe utilizarse el tablero antiguo como fuente de verdad si existe discrepancia.

## Responsables

- Alexander Patiño — Product Owner.
- Samuel Solís — Scrum Master.
- Camilo González — Developer.

## Convención de futuro

Sprint 5–8 solo contienen Planning, Daily, Refinamiento, Review y Retrospective. Las Historias de Usuario se moverán desde Product Backlog únicamente en el Sprint Planning real.

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

La elección de Scrum responde a la necesidad de aprender y entregar incrementos evaluables durante el semestre. Su calidad de aplicación depende de objetivos, inspección y evidencia, y no del número de tableros. El corte actual debe mostrar avances y excepciones con la misma precisión.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Schwaber, K., y Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/scrum-guide.html

