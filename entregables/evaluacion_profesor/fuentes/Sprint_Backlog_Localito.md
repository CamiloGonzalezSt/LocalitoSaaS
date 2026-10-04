# Sprint Backlog de Localito

# Resumen ejecutivo

El Sprint Backlog describe el trabajo de una iteración y su relación con el Sprint Goal. Localito mantiene Sprints 1 a 3 cerrados, con una excepción documental en el tercero, y Sprint 4 en curso entre el 28 de septiembre y el 09 de octubre de 2026. Los Sprints 5 a 8 no tienen historias comprometidas en el corte del 03 de octubre.

Este documento conserva las asignaciones y fechas de la fuente Backlog-Scrum-Trello.md. La consulta actual no ejecutó cambios ni una revisión en vivo de Trello; los estados se presentan como la evidencia documental del repositorio en el commit base (Equipo Localito, 2026). Se agregan criterios y procedimientos de seguimiento para mejorar su uso académico.

# Introducción y estructura del plan

La Guía Scrum relaciona objetivo, elementos seleccionados y plan de entrega en el Sprint Backlog (Schwaber y Sutherland, 2020). Para Localito, el objetivo del Sprint 4 integra POS y caja y completa el pendiente offline. La tarea de documentar ese trabajo incluye mostrar qué está hecho, qué se desarrolla y qué todavía necesita pruebas.

El plan se distingue de una lista de funcionalidades del código. Puede existir una implementación inicial de pagos y caja que todavía no ha cumplido DoD en su tarjeta. Por eso la evidencia técnica se describe junto con el estado Scrum, sin elevar automáticamente todas las capacidades del repositorio a trabajo aceptado.

# Criterios de selección y dependencia

Para atender una venta, identidad y catálogo deben existir. Para una venta fiada, se necesita cliente y regla de crédito. Para cerrar caja, se requiere revisar movimientos y pendientes. Estas relaciones permiten planificar tareas en un orden que reduzca retrabajo. Si una dependencia no está lista, el equipo debe renegociar el alcance de la historia o mantenerla pendiente.

HU-13 atraviesa frontend y backend: conserva la venta, mantiene la clave y sincroniza. HU-14 depende de catálogo y persistencia. HU-15 necesita un total consistente antes de aplicar descuento. HU-16 requiere cuadrar la suma de pagos. HU-17 y HU-18 relacionan operaciones con el turno. Su coordinación es más útil que tratar cada pantalla como un resultado independiente.

# Seguimiento y criterios de cierre

Un elemento pasa a Hecho cuando cumple sus criterios y la DoD. La ejecución local de una prueba de cálculo no acredita una prueba de caja en producción. Si se detecta un rechazo de permisos o un estado persistido incoherente, el seguimiento registra el defecto y conserva evidencia. El objetivo del Sprint permite decidir qué reparar primero.

El cierre del Sprint debe conservar resultado de Review, trabajo pendiente y acciones de retrospectiva. Las fechas objetivo no deben transformarse en fechas reales de término si no existe una evidencia. Las actividades futuras siguen como futuras; registrar una fecha de retrospectiva no significa que el evento ya ocurrió.

# Registro por Sprint

Los criterios generales se desarrollan en Product Backlog y Definition of Done. El seguimiento siguiente conserva el corte documental del 03 de octubre de 2026.

## 5. Sprint 1 — cerrado

**Periodo:** 17-08-2026 al 28-08-2026.  
**Sprint Goal:** establecer la base técnica de Localito incorporando autenticación, autorización y aislamiento por negocio.

| ID / actividad | Responsable | Estado Trello | Fecha |
| --- | --- | --- | --- |
| ET-01 · Establecer base técnica del producto | Camilo | Hecho | 21-08 |
| HU-01 · Autenticarse en Localito | Camilo | Hecho | 24-08 |
| HU-02 · Gestionar roles y permisos | Camilo | Hecho | 25-08 |
| HU-03 · Aislar datos por negocio | Camilo | Hecho | 26-08 |
| Sprint Planning | Alexander | Hecho | 17-08 |
| Daily Scrum | Samuel | Hecho | 18–27-08 |
| Refinamiento | Alexander | Hecho | 25-08 |
| Sprint Review | Alexander | Hecho | 28-08 |
| Sprint Retrospective | Samuel | Hecho | 28-08 |

## 6. Sprint 2 — cerrado

**Periodo:** 31-08-2026 al 11-09-2026.  
**Sprint Goal:** incorporar administración del negocio, usuarios, categorías, productos y stock inicial para disponer de una base operativa de inventario.

| ID / actividad | Responsable | Estado Trello | Fecha |
| --- | --- | --- | --- |
| HU-04 · Gestionar negocio y local | Camilo | Hecho | 02-09 |
| HU-05 · Administrar usuarios | Camilo | Hecho | 03-09 |
| HU-06 · Gestionar categorías de productos | Camilo | Hecho | 04-09 |
| HU-07 · Gestionar catálogo de productos | Camilo | Hecho | 07-09 |
| HU-08 · Registrar stock inicial | Camilo | Hecho | 08-09 |
| ET-02 · Adaptar interfaces del módulo a responsive | Camilo | Hecho | 09-09 |
| Sprint Planning | Alexander | Hecho | 31-08 |
| Daily Scrum | Samuel | Hecho | 01–10-09 |
| Refinamiento | Alexander | Hecho | 08-09 |
| Sprint Review | Alexander | Hecho | 11-09 |
| Sprint Retrospective | Samuel | Hecho | 11-09 |

## 7. Sprint 3 — cerrado con excepción documental

**Periodo:** 14-09-2026 al 25-09-2026.  
**Sprint Goal:** mejorar el control de inventario incorporando trazabilidad, alertas, código de barras y capacidades de operación PWA.

| ID / actividad | Responsable | Estado Trello | Fecha |
| --- | --- | --- | --- |
| HU-09 · Registrar movimientos de stock | Camilo | Hecho | 16-09 |
| HU-10 · Consultar Kardex y trazabilidad | Camilo | Hecho | 17-09 |
| HU-11 · Recibir alertas de stock bajo | Camilo | Hecho | 21-09 |
| HU-12 · Utilizar código de barras | Camilo | Hecho | 22-09 |
| Sprint Planning | Alexander | Hecho | 14-09 |
| Daily Scrum | Samuel | Hecho | 15–24-09 |
| Refinamiento del Product Backlog | Sin asignación real | **Por hacer** | 22-09 |
| Sprint Review | Alexander | Hecho | 25-09 |
| Sprint Retrospective | Samuel | Hecho | 25-09 |

**Excepción:** el refinamiento conserva una descripción histórica que propone a Alexander como responsable, pero la tarjeta real está sin miembro y en “Por hacer”. No se marca como completada porque falta evidencia suficiente de su cierre.

La Sprint Review registra además que el trabajo de operación offline/sincronización **no cumplió Definition of Done** y continuó en el Sprint siguiente.

## 8. Sprint 4 — en curso

**Periodo:** 28-09-2026 al 09-10-2026.  
**Sprint Goal:** implementar el flujo de ventas POS y caja, incluyendo descuentos, pagos divididos y control de caja, completando además el trabajo pendiente de sincronización offline.

### Sprint Backlog

| ID | Elemento | Responsable | Lista Trello | Fecha objetivo |
| --- | --- | --- | --- | --- |
| HU-13 | Operar offline y sincronizar cambios | Camilo | En progreso | 09-10 |
| HU-14 | Registrar una venta en el POS | Camilo | Hecho | 01-10 |
| HU-15 | Aplicar descuentos en una venta | Alexander | Hecho | 02-10 |
| HU-16 | Gestionar medios y pagos divididos | Camilo | Por hacer | 05-10 |
| HU-17 | Abrir caja por turno | Camilo | Por hacer | 06-10 |
| HU-18 | Cerrar y cuadrar caja | Camilo | Por hacer | 07-10 |

### Eventos y actividades

| Actividad | Responsable | Lista Trello | Fecha objetivo |
| --- | --- | --- | --- |
| Sprint Planning | Alexander | Hecho | 28-09 |
| Daily Scrum | Samuel | En progreso | 08-10 |
| Refinamiento del Product Backlog | Alexander | En progreso | 06-10 |
| Sprint Review | Alexander | Por hacer | 09-10 |
| Sprint Retrospective | Samuel | Por hacer | 09-10 |

## 9. Sprints 5–8 — futuros

Los tableros Sprint 5, 6, 7 y 8 contienen **exactamente cinco tarjetas estructurales cada uno**:

1. Sprint Planning — Alexander.
2. Daily Scrum — Samuel.
3. Refinamiento del Product Backlog — Alexander.
4. Sprint Review — Alexander.
5. Sprint Retrospective — Samuel.

**No contienen Historias de Usuario.** Esto es intencional: las HU se incorporarán únicamente cuando ocurra el Sprint Planning correspondiente.

## 10. Etiquetas y trazabilidad

Uso actual observado:

- Verde: Historia de Usuario / producto;
- Azul: elemento técnico;
- Naranja: QA, validación, documentación o release;
- Morado: evento Scrum / Product Goal;
- Amarillo: refinamiento.

La trazabilidad documental vigente es:

**Requisito → HU/PBI → tarjeta Trello / Sprint → commit → prueba → evidencia**

Para los enlaces directos de cada tablero consulte [TRELLO_BOARDS.md](https://github.com/CamiloGonzalezSt/LocalitoSaaS/blob/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c/docs/02_gestion_scrum_trello/TRELLO_BOARDS.md).

# Plan de verificación del Sprint en curso

| Elemento | Comprobación recomendada | Evidencia mínima |
| --- | --- | --- |
| HU13 offline | Cortar red y restaurar sin duplicar | Cola antes y después y venta final |
| HU14 venta POS | Registrar con stock y cliente controlados | Ticket y filas afectadas |
| HU15 descuentos | Probar cero, límite y valor inválido | Total esperado y rechazo |
| HU16 pagos divididos | Cuadrar total y rechazar diferencias | Detalle de pagos y respuesta |
| HU17 apertura | Evitar dos cajas abiertas del negocio | Sesión e índice observado |
| HU18 cierre | Comparar esperado, contado y diferencia | Movimiento y motivo de diferencia |

Los casos se proponen para completar evidencia, sin cambiar estados actuales del tablero. Se recomienda ejecutar sobre una base aislada y registrar la misma clave de venta ante reintentos. Las cuentas y dispositivos del turno deben verificarse antes de cerrar, porque cada cola local pertenece a un contexto distinto.

# Gestión de impedimentos y cambios

Un impedimento debe indicar efecto sobre el objetivo, responsable de seguimiento y siguiente comprobación. Por ejemplo, una falla del proveedor IA no debe detener la venta manual; un error de conexión PostgreSQL sí impide acreditar persistencia. El equipo debe diferenciar esos efectos antes de cambiar prioridades.

Si una historia no completa DoD al cierre, vuelve al backlog con su estado y dependencias. La decisión de incorporar trabajo a la siguiente iteración ocurre en su Planning. La documentación no mantiene una historia simultáneamente cerrada en un Sprint y pendiente en otro sin explicar la parte que se trasladó.

# Evidencias relacionadas con esta versión

El Informe Académico conecta objetivos, método, antecedentes y resultados. La Matriz de Trazabilidad identifica requisitos e historias asociados a la implementación. El Informe de Verificación conserva las ejecuciones del 04 de octubre de 2026 y distingue su alcance local de la aceptación en PostgreSQL y con usuarios. Control de Entrega reúne la cobertura de los 17 artefactos y los pendientes de cierre.

# Conclusiones

El Sprint Backlog conserva una representación verificable del trabajo al corte actual. La separación entre fechas objetivo, estados documentados y pruebas evita presentar un semestre futuro como ejecutado. El cierre del Sprint 4 requerirá evidencia de sus operaciones y resultados de sus eventos finales.

# Referencias

La evidencia del proyecto corresponde a la revisión versionada del repositorio (Equipo Localito, 2026). Las normas se consultaron mediante sus resúmenes públicos; no se declara certificación. Las fuentes web fueron consultadas durante esta revisión, del 03 al 04 de octubre de 2026.

Equipo Localito (2026). *LocalitoSaaS [Código y documentación, commit ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c]*. https://github.com/CamiloGonzalezSt/LocalitoSaaS/tree/ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c

Schwaber, K., y Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/scrum-guide.html

