# Retrospectivas de Localito

# Resumen ejecutivo

La fuente del proyecto contiene síntesis de retrospectivas para los Sprints 1, 2 y 3. Registra aprendizajes sobre historias verificables, sincronización documental y separación de evidencias. El Sprint 4 continúa en curso; su retrospectiva está prevista para el cierre del 09 de octubre, por lo que no se redactan conclusiones anticipadas.

Este documento conserva las síntesis disponibles y desarrolla acciones propuestas con responsables de seguimiento y comprobaciones. El desarrollo analítico de esta revisión no debe confundirse con actas históricas, asistencia ni acuerdos efectivamente votados por el equipo.

# Introducción y criterios de evidencia

La retrospectiva inspecciona la forma de trabajar y busca mejoras para la siguiente iteración (Schwaber y Sutherland, 2020). El registro de Localito es breve. Su calidad puede mejorarse explicando el problema observado, su efecto y una acción verificable. La evidencia disponible no permite reconstruir duración, asistencia o citas textuales de participantes, por lo que esos datos no se inventan.

La Review evalúa el incremento y necesidades del producto; la retrospectiva evalúa personas, interacciones, procesos y herramientas de trabajo. Una decisión de agregar un módulo al producto pertenece al backlog; una acción para registrar evidencia al cerrar historias mejora el proceso del equipo.

# Retrospectivas de Sprint — Localito

## Sprint 1
**Funcionó:** base del proyecto, definición inicial y coordinación del equipo.  
**A mejorar:** convertir requisitos amplios en historias más pequeñas y verificables.  
**Acción:** agregar criterios de aceptación y responsables más claros.

## Sprint 2
**Funcionó:** avance incremental en módulos centrales y mayor claridad del flujo de datos.  
**A mejorar:** mantener documentación y tablero sincronizados con el código.  
**Acción:** actualizar evidencias al cerrar historias y reforzar trazabilidad.

## Sprint 3
**Funcionó:** integración de más capacidades y consolidación técnica del MVP.  
**A mejorar:** separar mejor trabajo terminado, pendiente y evidencia histórica.  
**Acción:** reorganizar documentación, pruebas y gestión Scrum; Trello pasa a ser fuente activa.

## Sprint 4
En curso al 03-10-2026. La retrospectiva se completa al cierre del Sprint y no se anticipa como resultado cerrado.

# Análisis del Sprint 1

La fuente señala avance en la base y coordinación inicial, y necesidad de convertir requisitos amplios en historias pequeñas. Un requisito como gestionar inventario puede abarcar productos, stock, movimientos y permisos. Si se deja en una tarjeta sin criterios, resulta difícil demostrar qué parte está aceptada.

La mejora propuesta es separar resultados por usuario y operación, conservar identificador estable y relacionar criterios con pruebas. Alexander puede mantener la claridad y prioridad del elemento; Camilo revisa su viabilidad técnica; Samuel comprueba que la evidencia se adjunte al cierre. Esta distribución es una propuesta de seguimiento, no una asistencia histórica atribuida a una reunión.

# Análisis del Sprint 2

La documentación describe mayor claridad del flujo de datos y la necesidad de sincronizar tablero y documentos con código. El riesgo es que el sistema implemente una regla que no aparece en la historia, o que el Word afirme una capacidad que permanece pendiente en Trello. La actualización debe distinguir ambas situaciones.

La acción propuesta es registrar en cada cambio relevante la historia, el commit y una prueba o procedimiento. Al cerrar, se comprueba que el texto explique lo mismo que demuestra el incremento. No se necesita copiar todo el código a la tarjeta; basta con enlaces estables, estado y una descripción del resultado.

# Análisis del Sprint 3

La fuente destaca consolidación técnica y separación entre terminado, pendiente y evidencia histórica. El backlog detallado conserva una excepción: refinamiento por hacer sin asignación real, y offline trasladado por no completar DoD. Esa información debe permanecer visible porque explica el trabajo del Sprint 4.

La mejora propuesta es mantener una lista de evidencias faltantes y evitar cerrar actividades solo para que el tablero se vea completo. Una tarjeta sin prueba puede avanzar técnicamente y seguir pendiente de aceptación. La reconstrucción documental se identifica como tal y no se presenta como un acta registrada durante la iteración.

# Registro de acciones propuestas

| Acción | Seguimiento propuesto | Comprobación |
| --- | --- | --- |
| Precisar criterios de historias | Alexander con revisión técnica | Historia tiene resultado y caso asociado |
| Vincular cambios y pruebas | Camilo | Commit y salida o procedimiento disponibles |
| Revisar cierre documental | Samuel | Estado y evidencia coinciden |
| Resolver excepción de refinamiento | Alexander y Samuel | Resultado confirmado sin reescribir historial |
| Completar offline antes de cerrar | Camilo | Reintento, aislamiento y recuperación probados |
| Separar estado código y Scrum | Todo el equipo | Documentos explican la diferencia |

Ninguna fila se marca ejecutada en esta revisión. La prueba del cumplimiento corresponde al siguiente seguimiento del equipo. Las acciones que requieren desarrollo deben incorporarse al backlog; las reglas de documentación pueden comenzar a utilizarse en las revisiones ordinarias.

# Preparación del cierre del Sprint 4

La plantilla propuesta incluye fecha real, participantes confirmados, objetivo, evidencias revisadas, observaciones, acciones y siguiente comprobación. Se recomienda revisar específicamente sincronización offline, pagos divididos y cierre de caja. El contenido se completa después de la Review con los resultados efectivamente observados.

Las preguntas útiles son qué dificultó terminar HU-13, qué prueba faltó al decidir el cierre, qué errores se detectaron tarde y qué evidencia habría permitido detectarlos antes. Las respuestas deben referirse a hechos del Sprint, evitando evaluaciones generales sin ejemplos. Si un proveedor falló, se debe distinguir la dependencia externa de la forma de responder a ella.

# Seguimiento de mejoras

Una mejora es útil cuando cambia una práctica observable. Agregar un criterio es verificable; mejorar comunicación requiere describir qué registro o evento cambiará. Se propone revisar las acciones en el siguiente Planning y limitar la cantidad simultánea a lo que el equipo pueda ejecutar. Esta recomendación no cambia las historias de Sprints 5 a 8 antes de sus Planning.

El cierre de una acción puede acreditarse con una historia que tenga criterios completos, una matriz actualizada o un caso repetible. Si el resultado no aparece, se conserva pendiente y se analiza su impedimento. La retrospectiva debe ayudar al equipo a aprender, no producir conclusiones favorables por defecto.

# Ficha de registro para el siguiente cierre

Este instrumento se completa en la retrospectiva efectivamente realizada. Las síntesis anteriores se conservan con su procedencia documental; no se les agregan asistentes, horarios ni aprobaciones sin confirmación.

Fecha real y Sprint: ______________________________________

Participantes confirmados: ______________________________________

Hecho observado y evidencia concreta: ______________________________________

Efecto sobre trabajo o calidad: ______________________________________

Acción acordada y responsable confirmado: ______________________________________

Fecha de seguimiento y criterio para comprobar la mejora: ______________________________________

Resultado del seguimiento: ______________________________________

El registro de una reunión futura no modifica retrospectivamente los Sprints cerrados. Una aclaración de un registro anterior se fecha como aclaración y conserva su fuente.

# Conclusiones

Los registros existentes identifican problemas concretos de claridad y evidencia. Su ampliación conserva esas observaciones y propone verificaciones que el equipo puede aplicar. El documento mantiene abierto el Sprint 4 y reserva sus conclusiones para resultados reales de cierre.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Schwaber, K., y Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/scrum-guide.html

